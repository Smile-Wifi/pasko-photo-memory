import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const KEY = "pasko-install-dismissed";
const DELAY_MS = 18_000;

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const copy = {
  en: {
    title: "Install Pasko Magic",
    body: "Add the app to your home screen for quick access to your Christmas photos.",
    install: "Install App",
    later: "Not now",
    ios1: "Tap the Share button",
    ios2: "Choose “Add to Home Screen”",
  },
  fil: {
    title: "I-install ang Pasko Magic",
    body: "Idagdag ang app sa home screen para mabilis mong mabuksan ang iyong mga Christmas photo.",
    install: "I-install ang App",
    later: "Mamaya na",
    ios1: "I-tap ang Share button",
    ios2: "Piliin ang “Add to Home Screen”",
  },
};

function isStandalone() {
  return matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
function isIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function InstallPrompt() {
  const { lang } = useLang();
  const t = copy[lang] ?? copy.en;
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(KEY)) return;
    const iosDevice = isIOS();
    setIos(iosDevice);
    let engaged = false;
    let canShow = iosDevice;
    const tryShow = () => { if (engaged && canShow) setOpen(true); };
    const engage = () => { engaged = true; tryShow(); };

    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); canShow = true; tryShow(); };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest?.('a[href^="/create"]')) setTimeout(engage, 1500);
    };
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el?.type === "file" && el.files?.length) setTimeout(engage, 1500);
    };
    const onInstalled = () => { localStorage.setItem(KEY, "installed"); setOpen(false); };
    const timer = setTimeout(engage, DELAY_MS);

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
    };
  }, []);

  if (!open) return null;

  const dismiss = () => { localStorage.setItem(KEY, "1"); setOpen(false); };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    dismiss();
  };

  return (
    <div role="dialog" aria-label={t.title} className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border-2 border-gold bg-festive text-pine-foreground shadow-card">
        <div className="flex items-start gap-3 p-4">
          <img src="/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl ring-2 ring-gold" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold leading-tight">🎄 {t.title}</p>
            <p className="mt-1 text-sm opacity-90">{t.body}</p>
          </div>
          <button type="button" onClick={dismiss} aria-label={t.later} className="rounded-full p-1 opacity-80 hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {ios ? (
          <ol className="space-y-2 border-t border-gold/40 px-4 py-3 text-sm">
            <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-pine">1</span>{t.ios1} <Share className="h-4 w-4 text-gold" /></li>
            <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-pine">2</span>{t.ios2} <SquarePlus className="h-4 w-4 text-gold" /></li>
          </ol>
        ) : (
          <div className="flex gap-2 border-t border-gold/40 px-4 py-3">
            <Button type="button" className="flex-1 rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90" onClick={install}><Download />{t.install}</Button>
            <Button type="button" variant="ghost" className="text-pine-foreground hover:bg-snow/10 hover:text-pine-foreground" onClick={dismiss}>{t.later}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
