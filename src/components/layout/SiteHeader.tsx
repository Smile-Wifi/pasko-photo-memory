import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/how-it-works", label: t("navHow") },
    { to: "/samples", label: t("navStyles") },
    { to: "/pricing", label: t("navPricing") },
    { to: "/faq", label: t("navFaq") },
    { to: "/track", label: t("navTrack") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "fil" : "en")}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-primary"
            aria-label="Switch language"
          >
            {lang === "en" ? "EN · FIL" : "FIL · EN"}
          </button>
          <Button asChild variant="festive" size="sm" className="hidden md:inline-flex">
            <Link to="/create">Create</Link>
          </Button>
          <button className="rounded-full p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-festive md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo light />
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-full p-2 text-pine-foreground">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-4 pt-4">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-4 font-display text-2xl text-pine-foreground hover:bg-snow/10">
              Home
            </Link>
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-4 font-display text-2xl text-pine-foreground hover:bg-snow/10">
                {l.label}
              </Link>
            ))}
            <Button asChild variant="festive" size="xl" className="mt-6">
              <Link to="/create" onClick={() => setOpen(false)}>{t("cta")}</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
