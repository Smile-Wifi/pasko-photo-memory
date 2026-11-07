import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, Check, Music, ShieldCheck, Smartphone, Sparkles, Zap } from "lucide-react";
import backdrop from "@/assets/christmas-studio.jpg";
import studioArtwork from "@/assets/pasko-christmas-studio.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { DEFAULT_PRICES, PACKAGES, peso, type PackageId } from "@/lib/catalog";
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
      <div className="mx-auto max-w-6xl px-4 pb-8 md:px-8">
        <h1 className="sr-only">Pasko Photo Magic – Balik Alaala sa Pasko</h1>
        <img src={studioArtwork.url} alt="Pasko Photo Magic. Balik Alaala sa Pasko. Old Foto, Magical Xmas! Turn your old photo into 5 amazing Christmas photos. Original portrait beside five illustrative Christmas transformations. Actual results may vary." width={816} height={768} fetchPriority="high" className="studio-artwork mx-auto block h-auto w-full object-contain" />
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
