import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fil";

const dict = {
  en: {
    navHow: "How It Works",
    navStyles: "Sample Photos",
    navPricing: "Pricing",
    navFaq: "FAQ",
    navTrack: "Track Order",
    heroTitle: "Balik Alaala sa Pasko!",
    heroSub: "Upload just ONE photo and transform it into FIVE magical Christmas memories!",
    cta: "🎄 CREATE MY XMAS PHOTOS",
    ctaSupport: "One upload. Five magical Christmas photos!",
    howTitle: "How It Works",
    stylesTitle: "5 Magical Christmas Styles",
    pricingTitle: "Simple Christmas Pricing",
  },
  fil: {
    navHow: "Paano Gumagana",
    navStyles: "Mga Sample",
    navPricing: "Presyo",
    navFaq: "Mga Tanong",
    navTrack: "I-track ang Order",
    heroTitle: "Balik Alaala sa Pasko!",
    heroSub: "Mag-upload ng ISANG litrato at gawing LIMANG mahiwagang alaala ng Pasko!",
    cta: "🎄 GAWIN ANG AKING XMAS PHOTOS",
    ctaSupport: "Isang upload. Limang mahiwagang Christmas photos!",
    howTitle: "Paano Ito Gumagana",
    stylesTitle: "5 Mahiwagang Christmas Style",
    pricingTitle: "Simpleng Presyo Pang-Pasko",
  },
} as const;

type Key = keyof (typeof dict)["en"];
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict.en[k],
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("xm-lang");
    if (saved === "fil" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("xm-lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
