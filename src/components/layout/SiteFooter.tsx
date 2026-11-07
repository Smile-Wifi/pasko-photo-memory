import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Lights } from "@/components/brand/Snowfall";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/samples", label: "Sample Photos" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact Us" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms and Conditions" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-festive text-pine-foreground">
      <Lights />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo light />
            <p className="mt-3 text-sm text-pine-foreground/80">Capture • Create • Share the Christmas Joy!</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="text-pine-foreground/80 hover:text-gold">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 border-t border-snow/15 pt-6 text-center text-sm text-pine-foreground/70">
          Made with ❤️ in the Philippines 🇵🇭 · © {new Date().getFullYear()} XmasMagic PH
        </div>
      </div>
    </footer>
  );
}
