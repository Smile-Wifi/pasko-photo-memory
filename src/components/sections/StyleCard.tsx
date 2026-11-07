import { cn } from "@/lib/utils";

export function StyleCard({ src, label, className, eager }: { src: string | null | undefined; label: string; className?: string; eager?: boolean }) {
  return (
    <figure className={cn("relative overflow-hidden rounded-2xl bg-pine shadow-card", className)}>
      {src ? (
        <img src={src} alt={label} width={640} height={800} loading={eager ? "eager" : "lazy"} className="aspect-[4/5] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-festive text-pine-foreground">
          <span className="animate-floaty text-5xl">🎅</span>
        </div>
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-pine/90 to-transparent px-3 pb-2 pt-8 text-xs font-semibold text-pine-foreground">
        {label}
      </figcaption>
    </figure>
  );
}
