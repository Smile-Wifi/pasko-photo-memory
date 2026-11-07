import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Download, Gift, Sparkles, Upload, Crown, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Snowfall } from "@/components/brand/Snowfall";
import { StyleCard } from "./StyleCard";
import { ORIGINAL_SAMPLE, PACKAGES, STYLES, DEFAULT_PRICES, peso, type PackageId } from "@/lib/catalog";
import { siteDataQuery } from "@/lib/queries";
import { useLang } from "@/lib/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import sampleArtwork from "@/assets/pasko-sample-transformations-v2.jpg.asset.json";
import howItWorksArtwork from "@/assets/pasko-how-it-works.jpg.asset.json";

function useStyleImages() {
  const { data } = useQuery(siteDataQuery);
  return STYLES.map((s) => {
    const uploaded = data?.samples.find((x) => x.style === s.name);
    return { ...s, src: uploaded?.url ?? s.image };
  });
}

export function SectionTitle({ eyebrow, title, sub, light }: { eyebrow?: string; title: string; sub?: string; light?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
      <h2 className={`text-3xl font-bold md:text-4xl ${light ? "text-pine-foreground" : "text-pine"}`}>{title}</h2>
      {sub && <p className={`mt-3 ${light ? "text-pine-foreground/80" : "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
}

export function Hero() {
  const { t } = useLang();
  const styles = useStyleImages();
  return (
    <section className="relative overflow-hidden bg-festive pb-16 pt-10 text-pine-foreground md:pb-24 md:pt-16">
      <Snowfall />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-snow/10 px-3 py-1 text-xs font-semibold text-gold">
            <Sparkles className="h-3.5 w-3.5" /> AI Christmas Photo Studio
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            {t("heroTitle").split(",")[0]},<br />
            <span className="text-gold-gradient">{t("heroTitle").split(",")[1]?.trim()}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-pine-foreground/85 md:mx-0">{t("heroSub")}</p>
          <div className="mt-8 flex flex-col items-center gap-3 md:items-start">
            <Button asChild variant="festive" size="xl" className="w-full max-w-sm text-lg">
              <Link to="/create">{t("cta")}</Link>
            </Button>
            <p className="text-sm text-pine-foreground/75">{t("ctaSupport")}</p>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="relative col-span-1 row-span-2">
              <StyleCard src={ORIGINAL_SAMPLE} label="Original old photo" eager className="h-full [&_img]:h-full [&_img]:aspect-auto ring-4 ring-gold/60" />
            </div>
            {styles.slice(0, 4).map((s, i) => (
              <StyleCard key={s.key} src={s.src} label={s.name} eager={i < 2} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="col-span-2 flex items-center justify-center rounded-2xl border border-snow/20 bg-snow/10 p-3 text-center text-sm">
              <ArrowRight className="mr-2 h-4 w-4 text-gold" /> 1 upload → 5 Christmas memories
            </div>
            <StyleCard src={styles[4]?.src} label="Christmas Gift" />
          </div>
          <p className="mt-2 text-center text-[11px] text-pine-foreground/60">Sample images for illustration.</p>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Upload, title: "Upload your old photo", text: "Any clear photo of a face — old, faded or new.", img: ORIGINAL_SAMPLE },
  { icon: Gift, title: "Choose your template", text: "Pick your first Christmas look. All five styles are included.", img: STYLES[1].image },
  { icon: Check, title: "Payment", text: "Choose ₱99 Basic or ₱149 with music. Pay with GCash, Maya or bank transfer.", img: null },
  { icon: Sparkles, title: "Generate 5 fotos", text: "After payment verification, we create five Christmas photos to download and share.", img: STYLES[3].image },
];

export function HowItWorks({ artwork = false }: { artwork?: boolean }) {
  const { t } = useLang();
  if (artwork) return (
    <section aria-label="How it works" className="bg-background">
      <div className="relative mx-auto max-w-3xl">
        <h2 className="sr-only">How It Works — 4 Easy Steps</h2>
        <img src={howItWorksArtwork.url} alt="How it works: 1. Upload your old photo — any clear photo of a face, old, faded or new. 2. Choose your template — pick your first Christmas look, all five styles are included. 3. Payment — choose ₱99 Basic or ₱149 with music, pay with GCash, Maya or bank transfer. 4. Generate 5 photos — after payment verification, we create five Christmas photos to download and share." width={960} height={1456} loading="lazy" className="block h-auto w-full" />
      </div>
    </section>
  );
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <SectionTitle eyebrow="4 easy steps" title={t("howTitle")} />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="relative h-36 bg-festive">
              {s.img ? (
                <img src={s.img} alt="" loading="lazy" width={640} height={800} className="h-full w-full object-cover opacity-90" />
              ) : (
                <div className="flex h-full items-center justify-center gap-3">
                  <span className="rounded-2xl bg-snow px-4 py-3 font-display text-2xl font-bold text-pine">₱99</span>
                  <span className="rounded-2xl bg-gold-gradient px-4 py-3 font-display text-2xl font-bold text-gold-foreground">₱149</span>
                </div>
              )}
              <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
            </div>
            <div className="p-5">
              <s.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StyleGallery({ artwork = false }: { artwork?: boolean }) {
  const { t } = useLang();
  const styles = useStyleImages();
  if (artwork) return (
    <section aria-label="Sample Christmas transformations" className="bg-background">
      <div className="relative mx-auto max-w-3xl">
        <h2 className="sr-only">5 Magical Christmas Styles</h2>
        <img src={sampleArtwork.url} alt="Pasko Photo Magic sample transformations. Every order includes all five styles. Original photo, Santa Claus Christmas, Christmas Family Portrait, Cozy Golden Christmas and Winter Wonderland. Illustrative examples." width={935} height={1600} loading="lazy" className="block h-auto w-full" />
        <Button asChild variant="ghost" className="absolute bottom-[2.5%] left-[12%] h-[7.5%] w-[76%] rounded-full p-0 hover:bg-transparent focus-visible:ring-4 focus-visible:ring-primary">
          <Link to="/create" aria-label="Create my Xmas photos"><span className="sr-only">Create my Xmas photos</span></Link>
        </Button>
      </div>
    </section>
  );
  return (
    <section className="bg-secondary/60 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle eyebrow="Sample transformations" title={t("stylesTitle")} sub="Every order includes all five styles. We keep your face and natural look as consistent as possible." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StyleCard src={ORIGINAL_SAMPLE} label="Original" className="ring-4 ring-gold/60" />
          {styles.map((s) => (
            <StyleCard key={s.key} src={s.src} label={s.name} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="festive" size="xl">
            <Link to="/create">🎄 CREATE MY XMAS PHOTOS</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const { t } = useLang();
  const { data } = useQuery(siteDataQuery);
  const prices = data?.pricing ?? DEFAULT_PRICES;
  const ids: PackageId[] = ["basic", "premium"];
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <SectionTitle eyebrow="Philippine Peso" title={t("pricingTitle")} sub="One photo per order. Pay via GCash, Maya or bank transfer." />
      <div className="grid gap-6 md:grid-cols-2">
        {ids.map((id) => {
          const p = PACKAGES[id];
          const premium = id === "premium";
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-3xl p-7 shadow-card ${premium ? "bg-festive text-pine-foreground ring-4 ring-gold" : "border border-border bg-card"}`}
            >
              {premium && (
                <span className="absolute -top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gold-gradient px-4 py-1 text-xs font-bold text-gold-foreground">
                  <Crown className="h-3.5 w-3.5" /> RECOMMENDED
                </span>
              )}
              <p className={`text-sm font-bold uppercase tracking-widest ${premium ? "text-gold" : "text-primary"}`}>
                Package {premium ? 2 : 1}
              </p>
              <h3 className="mt-1 flex items-center gap-2 text-2xl font-bold">
                {p.name} {premium && <Music className="h-5 w-5 text-gold" />}
              </h3>
              <p className="mt-4 font-display text-5xl font-bold">{peso(prices[id])}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${premium ? "text-gold" : "text-success"}`} /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant={premium ? "gold" : "festive"} size="xl" className="mt-8 w-full">
                <Link to="/create" search={{ pkg: id }}>
                  {p.cta} – {peso(prices[id])}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const FAQS = [
  { q: "How many photos can I upload?", a: "One original photo per order. You receive five Christmas photos from that one upload." },
  { q: "How do I pay?", a: "Choose GCash, Maya or bank transfer at checkout. Send the exact amount to the account shown, then enter your payment reference number. We verify every payment before processing." },
  { q: "How long does it take?", a: "After your payment is verified, your photos are usually ready within the day. Bookmark your order page to check the status anytime." },
  { q: "Will it still look like me?", a: "We instruct the AI to keep your face and natural appearance as consistent as possible. Results can vary depending on photo quality — clear, front-facing photos work best." },
  { q: "What happens to my photos?", a: "Your photos are private and only visible through your secret order link. They are automatically deleted after the retention period (30 days by default)." },
  { q: "What's included in the ₱149 package?", a: "Everything in Basic plus a Christmas slideshow with background music you can play on your order page." },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <SectionTitle eyebrow="Questions" title="Frequently Asked Questions" />
      <Accordion type="single" collapsible className="rounded-3xl border border-border bg-card px-5 shadow-card">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`f${i}`}>
            <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
