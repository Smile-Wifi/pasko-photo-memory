import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/pasko-photo-magic-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="Pasko Photo Magic home">
      <img
        src={logoAsset.url}
        alt="Pasko Photo Magic"
        className="h-10 w-auto rounded-md shadow-md ring-1 ring-gold/40"
      />
      <span className={cn("font-display text-lg font-bold leading-tight", light ? "text-pine-foreground" : "text-pine")}>
        Pasko <span className="text-primary">Photo</span> <span className="text-gold">Magic</span>
      </span>
    </Link>
  );
}
