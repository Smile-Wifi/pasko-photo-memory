export function LegalPage({ title, sections }: { title: string; sections: { h: string; p: string }[] }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-pine">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: November 2026</p>
      <div className="mt-8 space-y-6">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-semibold text-pine">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
