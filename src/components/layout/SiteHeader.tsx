import { Link } from "@tanstack/react-router";
import { Home, Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-snow/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 md:h-20 md:px-4">
        <Logo />
        <nav className="hidden items-center gap-4 lg:flex">
          <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-primary"><Home className="size-4" />Home</Link>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm"
            onClick={() => setLang(lang === "en" ? "fil" : "en")}
            className="px-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary md:px-3 md:text-xs"
            aria-label="Switch language"
          >
            {lang === "en" ? "EN · FIL" : "FIL · EN"}
          </Button>
          <Button asChild variant="festive" size="sm" className="hidden md:inline-flex">
            <Link to="/create">Create</Link>
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 min-h-screen bg-festive lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo light />
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu" className="text-pine-foreground">
              <X className="h-6 w-6" />
            </Button>
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
