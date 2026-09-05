const BUILT_ON = [
  "MongoDB Atlas Vector Search",
  "Google Gemini",
  "React",
  "Docker",
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface/40 py-8">
      <div className="container flex flex-col items-center gap-4">
        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-muted-foreground">
          Built on
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {BUILT_ON.map((name) => (
            <li
              key={name}
              className="font-mono text-sm text-muted-foreground/70"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
