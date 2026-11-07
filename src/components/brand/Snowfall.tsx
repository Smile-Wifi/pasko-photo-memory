// Lightweight CSS-only snowfall (no JS animation loop — friendly to low-end phones).
const FLAKES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53) % 100,
  size: 6 + ((i * 7) % 10),
  duration: 9 + ((i * 3) % 9),
  delay: -((i * 1.7) % 12),
}));

export function Snowfall() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="animate-snow absolute top-0 text-snow/70"
          style={{ left: `${f.left}%`, fontSize: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}
        >
          ❄
        </span>
      ))}
    </div>
  );
}

export function Lights() {
  const colors = ["text-primary", "text-gold", "text-success", "text-snow"];
  return (
    <div aria-hidden className="flex justify-between px-2 text-lg">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className={`animate-twinkle ${colors[i % 4]}`} style={{ animationDelay: `${(i % 5) * 0.3}s` }}>
          ●
        </span>
      ))}
    </div>
  );
}
