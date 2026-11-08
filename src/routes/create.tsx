import { blockIfOffline } from "@/lib/offline";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Lock, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PhotoUploader, type PreparedPhoto } from "@/components/upload/PhotoUploader";
import { CheckoutPhotoTest } from "@/components/CheckoutPhotoTest";
import { DEFAULT_PRICES, PACKAGES, PAYMENT_METHODS, STYLES, normalizePhMobile, peso, type PackageId, type PaymentMethod } from "@/lib/catalog";
import { canAdvance, type TemplateId } from "@/lib/order-process";
import { siteDataQuery } from "@/lib/queries";
import { createOrder } from "@/lib/api/orders.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>): { pkg?: PackageId } =>
    s["pkg"] === "basic" || s["pkg"] === "premium" ? { pkg: s["pkg"] } : {},
  head: () => ({
    meta: [
      { title: "Create My Xmas Photos – Pasko Photo Magic" },
      { name: "description", content: "Upload a photo, choose a Christmas template, pay with GCash, Maya or bank transfer, then receive five Christmas photos after verification." },
      { property: "og:title", content: "Create My Xmas Photos – Pasko Photo Magic" },
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
  const placeOrder = useServerFn(createOrder);
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<TemplateId | null>(null);

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
    if (step >= 3 && blockIfOffline("order")) return;
    if (step < 3) {
      if (canAdvance(step, Boolean(photo), template)) setStep(step + 1);
      return;
    }
    const errs: Partial<Record<"photo" | "fullName" | "mobile" | "email", string>> = {};
    if (!photo) errs.photo = "Please upload your photo first.";
    if (fullName.trim().length < 2) errs.fullName = "Please enter your full name.";
    const m = normalizePhMobile(mobile);
    if (!m) errs.mobile = "Enter a valid PH mobile number (e.g. 0917 123 4567).";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email or leave it blank.";
    setErrors(errs);
    if (Object.keys(errs).length || !photo || !m || !template) {
      toast.error(Object.values(errs)[0]);
      return;
    }
    setSubmitting(true);
    try {
      const r = await placeOrder({
        data: { fullName, mobile: m, email, pkg, template, paymentMethod: method, photo: photo.dataUrl },
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
            <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
              {["Upload photo", "Choose template", "Payment", "Generate 5 fotos"].map((label, i) => <li key={label} aria-current={step === i + 1 ? "step" : undefined} className={cn("border-t-4 pt-2", i + 1 <= step ? "border-primary text-primary" : "border-border text-muted-foreground")}>{label}</li>)}
            </ol>
          </div>

          {step === 1 && <section>
            <StepHead n={1} title="Upload your photo" />
            <PhotoUploader value={photo} onChange={(p) => { setPhoto(p); if (!p) setTemplate(null); }} />
            <p className="mt-2 text-xs text-muted-foreground">Tip: a clear, front-facing photo gives the best results. Only one photo per order.</p>
          </section>}

          {step === 2 && <section>
            <StepHead n={2} title="Choose your template" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {STYLES.map(s => <Button key={s.key} type="button" variant="outline" aria-label={s.name} aria-pressed={template === s.key} onClick={() => setTemplate(s.key)} className={cn("relative h-auto min-w-0 flex-col items-stretch overflow-hidden whitespace-normal rounded-lg border-2 p-0 text-left", template === s.key ? "border-primary ring-2 ring-primary/20" : "border-border")}>
                <img src={site?.samples.find(x => x.style === s.name)?.url ?? s.image ?? undefined} alt="" width={640} height={800} className="aspect-[4/5] w-full object-cover" />
                <span className="min-h-14 p-3 text-xs font-semibold">{s.name}</span>
                {template === s.key && <Check className="absolute right-2 top-2 rounded-full bg-primary text-primary-foreground" />}
              </Button>)}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Your selected template is created first. All five Christmas styles are included.</p>
          </section>}

          {step === 3 && <section>
            <StepHead n={3} title="Payment" />
            <h3 className="mb-3 font-semibold text-pine">Choose your package</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["basic", "premium"] as PackageId[]).map((id) => (
                <Button variant="outline"
                  type="button"
                  key={id}
                  onClick={() => setPkg(id)}
                  aria-pressed={pkg === id}
                  className={cn(
                    "relative h-auto flex-col items-start whitespace-normal rounded-lg border-2 bg-card p-5 text-left transition-all",
                    pkg === id ? "border-primary shadow-card" : "border-border",
                  )}
                >
                  {id === "premium" && <span className="absolute right-4 top-4 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-bold text-gold-foreground">RECOMMENDED</span>}
                  <p className="flex items-center gap-2 font-semibold text-pine">{PACKAGES[id].name} {id === "premium" && <Music className="h-4 w-4 text-primary" />}</p>
                  <p className="mt-1 font-display text-3xl font-bold text-primary">{peso(prices[id])}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{id === "premium" ? "5 photos + music slideshow" : "5 photos, no music"}</p>
                  {pkg === id && <Check className="absolute bottom-4 right-4 h-5 w-5 text-primary" />}
                </Button>
              ))}
            </div>
          </section>}

          {step === 3 && <section>
            <h3 className="mb-4 text-xl font-bold text-pine">Your details</h3>
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
          </section>}

          {step === 3 && <section>
            <h3 className="mb-4 text-xl font-bold text-pine">Payment method</h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => (
                <Button variant="outline"
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={cn("h-14 whitespace-normal rounded-lg border-2 bg-card px-2 text-sm font-semibold", method === m ? "border-primary text-primary" : "border-border text-pine")}
                >
                  {PAYMENT_METHODS[m]}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">You'll see the account details on the next page. We verify your payment before processing.</p>
            {photo && template && <CheckoutPhotoTest photo={photo.dataUrl} template={template} />}
          </section>}

          {step > 1 && <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} disabled={submitting}><ArrowLeft />Back</Button>}
        </div>

        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-3xl bg-festive p-6 text-pine-foreground shadow-card">
            <p className="text-sm uppercase tracking-widest text-gold">Order summary</p>
            <div className="mt-4 flex items-center gap-3">
              {photo ? <img src={photo.dataUrl} alt="" className="h-16 w-14 rounded-xl object-cover" /> : <div className="flex h-16 w-14 items-center justify-center rounded-xl bg-snow/10">📷</div>}
              <div>
                <p className="font-semibold">{PACKAGES[pkg].name}</p>
                <p className="text-xs text-pine-foreground/70">5 Christmas photos · {PAYMENT_METHODS[method]}</p>
                {template && <p className="mt-1 text-xs text-gold">{STYLES.find(s => s.key === template)?.name}</p>}
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
            <Button type="submit" variant="festive" size="xl" className="mt-6 w-full" disabled={submitting || (step < 3 && !canAdvance(step, Boolean(photo), template))}>
              {submitting ? "Placing order…" : step === 1 ? "Choose template" : step === 2 ? "Continue to payment" : `Proceed to pay – ${peso(prices[pkg])}`}<ArrowRight />
            </Button>
            {step === 3 && <p className="mt-4 flex items-start gap-2 text-xs text-pine-foreground/80"><Sparkles className="size-4 shrink-0 text-gold" />4. Generate 5 fotos — our team starts after verifying your payment.</p>}
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-pine-foreground/70">
              <Lock className="h-3 w-3" /> Private & secure · Auto-deleted after 30 days
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
