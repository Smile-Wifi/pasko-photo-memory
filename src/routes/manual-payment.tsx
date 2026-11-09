import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, QrCode, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BANK_DETAILS, GCASH_DETAILS } from "@/lib/sessions";
import { useQuery } from "@tanstack/react-query";
import { siteDataQuery } from "@/lib/queries";
import { DEFAULT_PRICES, PACKAGES, peso, type PackageId } from "@/lib/catalog";
import { submitManualPayment } from "@/lib/api/payments.functions";

export const Route = createFileRoute("/manual-payment")({
  head: () => ({
    meta: [
      { title: "Studio Payment – Pasko Photo Magic Studio" },
      { name: "description", content: "Pay for the ₱99 Basic or ₱149 Magic with Music package by bank transfer or GCash QR and upload your proof of payment." },
      { property: "og:title", content: "Studio Payment – Pasko Photo Magic Studio" },
      { property: "og:description", content: "Manual bank transfer or GCash QR payment for studio sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManualPaymentPage,
});


function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div><Label htmlFor={id}>{label}</Label><div className="mt-1">{children}</div></div>;
}

function ManualPaymentPage() {
  const { data: site } = useQuery(siteDataQuery);
  const prices = site?.pricing ?? DEFAULT_PRICES;
  const submit = useServerFn(submitManualPayment);
  const [pkg, setPkg] = useState<PackageId | null>(null);
  const [method, setMethod] = useState<"bank" | "gcash_qr" | null>(null);
  const [f, setF] = useState({ name: "", phone: "", email: "", ref: "", amount: "", sender: "" });
  const [proof, setProof] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const detailsOk = f.name.trim().length >= 2 && f.phone.trim().length >= 7 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);

  function onProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return setProof(null);
    if (!["image/jpeg", "image/png"].includes(file.type)) { toast.error("Please upload a JPG or PNG screenshot."); e.target.value = ""; return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8MB."); e.target.value = ""; return; }
    const r = new FileReader();
    r.onload = () => setProof(String(r.result));
    r.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pkg || !method || !detailsOk || !proof || !f.ref.trim() || !(Number(f.amount) > 0) || f.sender.trim().length < 2) {
      toast.error("Please complete all required fields.");
      return;
    }
    setBusy(true);
    try {
      await submit({ data: {
        packageId: pkg, customerName: f.name, phone: f.phone, email: f.email, paymentMethod: method, referenceNumber: f.ref,
        amount: Number(f.amount), senderName: f.sender, proof,
      } });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong.");
    } finally { setBusy(false); }
  }

  if (done) return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-gold" />
      <h1 className="mt-4 text-3xl font-bold text-pine">Payment Submitted for Verification</h1>
      <p className="mt-3 inline-block rounded-full bg-gold-gradient px-4 py-1 text-sm font-bold text-gold-foreground">Status: PENDING</p>
          </div>
  );

  return (
    <div className="bg-secondary/40">
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        <div>
          <h1 className="text-3xl font-bold text-pine">Studio session payment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pasko Photo Magic Studio · a brand of ELON LAB CORPORATION</p>
        </div>

        <section>
          <h2 className="mb-3 text-xl font-bold text-pine">1. Choose a package</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["basic", "premium"] as PackageId[]).map(id => (
              <Button key={id} type="button" variant="outline" aria-pressed={pkg === id} onClick={() => setPkg(id)}
                className={cn("h-auto flex-col items-start rounded-lg border-2 bg-card p-4 text-left", pkg === id ? "border-gold shadow-card" : "border-border")}>
                <span className="font-semibold text-pine">{PACKAGES[id].name}</span>
                <span className="font-display text-2xl font-bold text-primary">{peso(prices[id])}</span>
              </Button>
            ))}
          </div>
        </section>

        {pkg && <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <h2 className="text-xl font-bold text-pine">2. Your details</h2>
          <Field id="name" label="Full Name *"><Input id="name" required value={f.name} onChange={set("name")} className="h-12" /></Field>
          <Field id="phone" label="Phone Number *"><Input id="phone" required inputMode="tel" value={f.phone} onChange={set("phone")} className="h-12" /></Field>
          <Field id="email" label="Email *"><Input id="email" required type="email" value={f.email} onChange={set("email")} className="h-12" /></Field>
        </section>}

        {pkg && detailsOk && <section>
          <h2 className="mb-3 text-xl font-bold text-pine">3. Payment method</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" aria-pressed={method === "bank"} onClick={() => setMethod("bank")} className={cn("h-14 border-2", method === "bank" ? "border-gold" : "border-border")}><Landmark />Bank Transfer</Button>
            <Button type="button" variant="outline" aria-pressed={method === "gcash_qr"} onClick={() => setMethod("gcash_qr")} className={cn("h-14 border-2", method === "gcash_qr" ? "border-gold" : "border-border")}><QrCode />GCash QR</Button>
          </div>
          {method && <div className="mt-4 rounded-3xl bg-festive p-5 text-pine-foreground">
            {method === "bank" ? <dl className="space-y-1 text-sm">
              <div><dt className="inline text-gold">Bank Name: </dt><dd className="inline">{BANK_DETAILS.bankName}</dd></div>
              <div><dt className="inline text-gold">Account Name: </dt><dd className="inline">{BANK_DETAILS.accountName}</dd></div>
              <div><dt className="inline text-gold">Account Number: </dt><dd className="inline">{BANK_DETAILS.accountNumber}</dd></div>
              <p className="pt-2 text-xs">Note: Use InstaPay or PESONet. Save your reference number.</p>
            </dl> : <div className="space-y-2 text-sm">
              {GCASH_DETAILS.qrUrl ? <img src={GCASH_DETAILS.qrUrl} alt="GCash QR code" className="mx-auto w-48 rounded-lg bg-card p-2" />
                : <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-gold text-center text-xs">GCash QR coming soon</div>}
              <p><span className="text-gold">Account Name: </span>{GCASH_DETAILS.accountName}</p>
              <p><span className="text-gold">GCash Number: </span>{GCASH_DETAILS.number}</p>
              <p className="pt-2 text-xs">Note: Send the exact amount. Save your reference number.</p>
            </div>}
            <p className="mt-3 font-display text-2xl font-bold text-gold">Amount: {peso(prices[pkg])}</p>
          </div>}
        </section>}

        {pkg && detailsOk && method && <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <h2 className="text-xl font-bold text-pine">4. Upload proof of payment</h2>
          <Field id="proof" label="Screenshot (JPG/PNG) *"><Input id="proof" required type="file" accept="image/jpeg,image/png" onChange={onProof} /></Field>
          {proof && <img src={proof} alt="Proof preview" className="max-h-60 rounded-lg" />}
          <Field id="ref" label="Reference Number *"><Input id="ref" required value={f.ref} onChange={set("ref")} className="h-12" /></Field>
          <Field id="amount" label="Amount Paid *"><Input id="amount" required type="number" min={1} step="0.01" value={f.amount} onChange={set("amount")} className="h-12" /></Field>
          <Field id="sender" label={method === "bank" ? "Bank Sender Name *" : "GCash Name *"}><Input id="sender" required value={f.sender} onChange={set("sender")} className="h-12" /></Field>
          <Button type="submit" variant="festive" size="xl" className="w-full" disabled={busy}>{busy ? "Submitting…" : "Submit for Verification"}</Button>
        </section>}
      </form>
    </div>
  );
}
