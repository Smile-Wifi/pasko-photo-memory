import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PhotoUploader, type PreparedPhoto } from "@/components/upload/PhotoUploader";
import { DEFAULT_PRICES, PACKAGES, PAYMENT_METHODS, normalizePhMobile, peso, type PackageId, type PaymentMethod } from "@/lib/catalog";
import { siteDataQuery } from "@/lib/queries";
import { createOrder } from "@/lib/api/orders.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>): { pkg?: PackageId } =>
    s["pkg"] === "basic" || s["pkg"] === "premium" ? { pkg: s["pkg"] } : {},
  head: () => ({
    meta: [
      { title: "Create My Xmas Photos – XmasMagic PH" },
      { name: "description", content: "Upload one photo, pick ₱99 or ₱149, and check out with GCash, Maya or bank transfer." },
      { property: "og:title", content: "Create My Xmas Photos – XmasMagic PH" },
      { property: "og:description", content: "One upload. Five magical Christmas photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

function StepHead({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-pine">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-sans text-sm text-primary-foreground">{n}</span>
      {title}
    </h2>
  );
}

function CreatePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: site } = useQuery(siteDataQuery);
  const prices = site?.pricing ?? DEFAULT_PRICES;

  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [pkg, setPkg] = useState<PackageId>(search.pkg ?? "premium");
  const [method, setMethod] = useState<PaymentMethod>("gcash");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"photo" | "fullName" | "mobile" | "email", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<"photo" | "fullName" | "mobile" | "email", string>> = {};
    if (!photo) errs.photo = "Please upload your photo first.";
    if (fullName.trim().length < 2) errs.fullName = "Please enter your full name.";
    const m = normalizePhMobile(mobile);
    if (!m) errs.mobile = "Enter a valid PH mobile number (e.g. 0917 123 4567).";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email or leave it blank.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error(Object.values(errs)[0]);
      return;
    }
    setSubmitting(true);
    try {
      const r = await createOrder({
        data: { fullName, mobile: m!, email, pkg, paymentMethod: method, photo: photo!.dataUrl },
      });
      try {
        localStorage.setItem("xm-last-order", JSON.stringify(r));
      } catch {
        /* ignore */
      }
      navigate({ to: "/order/$reference", params: { reference: r.reference }, search: { t: r.token } });
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-secondary/40">
      <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <div>
            <h1 className="text-3xl font-bold text-pine md:text-4xl">Create your Christmas magic 🎄</h1>
            <p className="mt-2 text-muted-foreground">One upload. Five magical Christmas photos!</p>
          </div>

          <section>
            <StepHead n={1} title="Upload your photo" />
            <PhotoUploader value={photo} onChange={setPhoto} />
            <p className="mt-2 text-xs text-muted-foreground">Tip: a clear, front-facing photo gives the best results. Only one photo per order.</p>
          </section>

          <section>
            <StepHead n={2} title="Choose your package" />
            <div className="grid gap-3 sm:grid-cols-2">
              {(["basic", "premium"] as PackageId[]).map((id) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setPkg(id)}
                  aria-pressed={pkg === id}
                  className={cn(
                    "relative rounded-3xl border-2 bg-card p-5 text-left transition-all",
                    pkg === id ? "border-primary shadow-card" : "border-border",
                  )}
                >
                  {id === "premium" && <span className="absolute right-4 top-4 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-bold text-gold-foreground">RECOMMENDED</span>}
                  <p className="flex items-center gap-2 font-semibold text-pine">{PACKAGES[id].name} {id === "premium" && <Music className="h-4 w-4 text-primary" />}</p>
                  <p className="mt-1 font-display text-3xl font-bold text-primary">{peso(prices[id])}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{id === "premium" ? "5 photos + music slideshow" : "5 photos, no music"}</p>
                  {pkg === id && <Check className="absolute bottom-4 right-4 h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <StepHead n={3} title="Your details" />
            <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 h-12" placeholder="Juan Dela Cruz" />
                {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div>
                <Label htmlFor="mobile">Mobile number</Label>
                <Input id="mobile" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="mt-1 h-12" placeholder="0917 123 4567" />
                {errors.mobile && <p className="mt-1 text-xs text-destructive">{errors.mobile}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email address <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-12" placeholder="you@email.com" />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
          </section>

          <section>
            <StepHead n={4} title="Payment method" />
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={cn("rounded-2xl border-2 bg-card px-2 py-4 text-sm font-semibold", method === m ? "border-primary text-primary" : "border-border text-pine")}
                >
                  {PAYMENT_METHODS[m]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">You'll see the account details on the next page. We verify your payment before processing.</p>
          </section>
        </div>

        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-3xl bg-festive p-6 text-pine-foreground shadow-card">
            <p className="text-sm uppercase tracking-widest text-gold">Order summary</p>
            <div className="mt-4 flex items-center gap-3">
              {photo ? <img src={photo.dataUrl} alt="" className="h-16 w-14 rounded-xl object-cover" /> : <div className="flex h-16 w-14 items-center justify-center rounded-xl bg-snow/10">📷</div>}
              <div>
                <p className="font-semibold">{PACKAGES[pkg].name}</p>
                <p className="text-xs text-pine-foreground/70">5 Christmas photos · {PAYMENT_METHODS[method]}</p>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between border-t border-snow/15 pt-4">
              <span>Total</span>
              <span className="font-display text-4xl font-bold text-gold">{peso(prices[pkg])}</span>
            </div>
            {submitting && (
              <div className="mt-4">
                <Progress value={66} className="animate-pulse" />
                <p className="mt-2 text-xs text-pine-foreground/80">Uploading your photo securely…</p>
              </div>
            )}
            <Button type="submit" variant="festive" size="xl" className="mt-6 w-full" disabled={submitting}>
              {submitting ? "Placing order…" : `Place order – ${peso(prices[pkg])}`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-pine-foreground/70">
              <Lock className="h-3 w-3" /> Private & secure · Auto-deleted after 30 days
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
