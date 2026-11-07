import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, Check, Heart, Music, ShieldCheck, Smartphone, Sparkles, Zap } from "lucide-react";
import backdrop from "@/assets/christmas-studio.jpg";
import { Button } from "@/components/ui/button";
import { DEFAULT_PRICES, ORIGINAL_SAMPLE, PACKAGES, STYLES, peso, type PackageId } from "@/lib/catalog";
import { siteDataQuery } from "@/lib/queries";

const benefits = [
  { icon: Sparkles, title: "5 Xmas Styles", sub: "Five festive looks", tone: "text-gold" },
  { icon: Zap, title: "Made with AI", sub: "A little Christmas magic", tone: "text-gold" },
  { icon: Music, title: "With Music", sub: "Music package", tone: "text-ice" },
  { icon: Smartphone, title: "Mobile Friendly", sub: "Anytime, anywhere", tone: "text-ice" },
  { icon: ShieldCheck, title: "Safe & Private", sub: "Your precious memories", tone: "text-christmas" },
];

export function FestiveStudio() {
  const { data } = useQuery(siteDataQuery);
  const prices = data?.pricing ?? DEFAULT_PRICES;
  return (
    <section className="christmas-studio relative isolate overflow-hidden">
      <img src={backdrop} alt="" width={1536} height={1024} fetchPriority="high" className="studio-backdrop absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 md:px-8 md:pt-10">
        <div className="studio-intro grid items-center gap-5 md:grid-cols-[0.85fr_1.15fr] md:gap-8">
          <div className="studio-copy text-center md:text-left">
            <p className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase text-christmas md:justify-start"><Sparkles className="size-4" /> Balik Alaala sa Pasko</p>
            <h1 className="text-2xl font-extrabold text-pine md:text-4xl">Pasko <span className="text-primary">Photo</span> Magic</h1>
            <h2 className="studio-headline mt-3 font-extrabold leading-[1.06] text-christmas">Old Foto,<br /><span className="text-primary">Magical Xmas!</span></h2>
            <div className="studio-swoosh mx-auto mt-2 h-2 w-44 rounded-t-[100%] border-t-4 border-gold md:mx-0 md:w-64" />
            <p className="mx-auto mt-4 max-w-sm text-base font-semibold leading-snug text-foreground md:mx-0 md:text-xl">Turn your old photo into<br /><span className="font-extrabold text-primary">5 amazing</span> Christmas photos.</p>
            <p className="studio-ribbon mx-auto mt-5 max-w-xs bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:mx-0">For family, friends & unforgettable memories! <Heart className="ml-1 inline size-4" /></p>
          </div>
          <div className="photo-collage relative mx-auto w-full max-w-xl" aria-label="Original photo and five sample Christmas transformations">
            <span className="magic-seal absolute right-0 top-0 z-10 flex size-20 flex-col items-center justify-center rounded-full border-2 border-gold bg-primary text-center font-bold leading-tight text-primary-foreground shadow-card md:size-24"><span className="text-3xl text-gold">5</span><span className="text-xs">Magical<br />Xmas Photos!</span></span>
            <figure className="original-polaroid absolute left-[2%] top-[26%] z-10 w-[29%] -rotate-12 bg-snow p-1.5 shadow-photo md:p-2">
              <img src={ORIGINAL_SAMPLE} alt="Original old photo" width={640} height={800} className="aspect-[4/5] w-full object-cover" />
              <figcaption className="py-1 text-center text-[10px] font-semibold text-pine md:text-xs">Your old photo</figcaption>
            </figure>
            <ArrowRight aria-hidden="true" className="absolute left-[24%] top-[45%] z-20 size-12 -rotate-12 rounded-full bg-snow/80 p-1 text-primary md:size-16" />
            <div className="absolute left-[37%] right-[16%] top-[5%] grid grid-cols-2 gap-2">
              {STYLES.slice(0, 2).map((style, i) => <Photo key={style.key} style={style} src={data?.samples.find(s => s.style === style.name)?.url ?? style.image} rotation={i === 0 ? "-rotate-6" : "rotate-6"} />)}
            </div>
            <div className="absolute bottom-[5%] left-[31%] right-[1%] grid grid-cols-3 gap-2">
              {STYLES.slice(2).map((style, i) => <Photo key={style.key} style={style} src={data?.samples.find(s => s.style === style.name)?.url ?? style.image} rotation={i === 0 ? "-rotate-6" : i === 1 ? "rotate-3" : "rotate-[9deg]"} />)}
            </div>
            <p className="absolute bottom-0 right-[4%] text-[10px] font-medium text-muted-foreground">Illustrative samples · Actual results may vary</p>
          </div>
        </div>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 md:mt-7 md:gap-6">
          {(["basic", "premium"] as PackageId[]).map(id => {
            const premium = id === "premium";
            return <div key={id} className={`studio-package relative flex flex-col items-center rounded-lg border-2 bg-snow/95 p-3 text-center shadow-card md:p-5 ${premium ? "border-christmas text-christmas" : "border-primary text-primary"}`}>
              <h3 className={`flex min-h-9 w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-primary-foreground md:text-lg ${premium ? "bg-christmas" : "bg-cta"}`}>{premium && <Music className="size-4 shrink-0" />}{PACKAGES[id].name}</h3>
              <p className="package-price my-1 font-extrabold leading-tight">{peso(prices[id])}</p>
              <p className="text-xs font-semibold leading-snug text-foreground md:text-base">1 Photo Package<br />{premium ? "+ Slideshow & Music" : "(5 Christmas Photos)"}</p>
              <p className={`mt-2 flex items-center gap-1 text-[10px] font-semibold md:text-xs ${premium ? "text-christmas" : "text-muted-foreground"}`}><Check className="size-3" />{premium ? "Recommended" : "No background music"}</p>
              <Button asChild variant={premium ? "christmas" : "festive"} className="mt-3 h-10 w-full px-2 text-xs md:h-11 md:text-base"><Link to="/create" search={{ pkg: id }}><Camera />Get Started</Link></Button>
            </div>;
          })}
        </div>
        <p className="mt-3 text-center text-xs font-medium text-pine">Pay with GCash · Maya · Bank transfer</p>
        <div className="benefit-strip mt-6 grid grid-cols-3 gap-y-4 border-y border-snow/80 bg-snow/90 px-2 py-5 md:grid-cols-5">
          {benefits.map(b => <div key={b.title} className="flex flex-col items-center px-1 text-center"><b.icon className={`mb-2 size-7 md:size-9 ${b.tone}`} strokeWidth={2.3} /><p className="text-xs font-bold text-foreground md:text-sm">{b.title}</p><p className="mt-1 text-[10px] italic text-muted-foreground md:text-xs">{b.sub}</p></div>)}
        </div>
        <div className="mt-7 flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="font-display text-xl font-bold italic text-pine md:text-2xl">Make this Christmas<br /><span className="text-primary">a little more magical.</span></p>
          <Button asChild variant="festive" size="lg"><Link to="/create"><Sparkles />Create My Xmas Photos<ArrowRight /></Link></Button>
        </div>
        <p className="mt-6 text-center text-sm font-semibold italic text-pine">Capture · Transform · Share the Magic <span className="text-primary">♡</span></p>
      </div>
    </section>
  );
}

function Photo({ style, src, rotation }: { style: (typeof STYLES)[number]; src: string | null; rotation: string }) {
  if (!src) return null;
  return <figure className={`bg-snow p-1 shadow-photo md:p-1.5 ${rotation}`}><img src={src} alt={style.name} width={640} height={800} className="aspect-[4/5] w-full object-cover" /></figure>;
}