import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="XmasMagic PH home">
      <img src={logo} alt="" width={40} height={40} className="h-10 w-10 drop-shadow" />
      <span className={cn("font-display text-xl font-bold leading-none", light ? "text-pine-foreground" : "text-pine")}>
        Xmas<span className="text-primary">Magic</span> <span className="text-gold">PH</span>
      </span>
    </Link>
  );
}
