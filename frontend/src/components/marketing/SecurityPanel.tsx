import { Reveal, Stagger, RevealItem } from "@/components/motion/Reveal";

const LINES = [
  { k: "isolation", v: "every query scoped to your account — the vector index too" },
  { k: "training", v: "your documents are never used to train any model" },
  { k: "at rest", v: "bcrypt passwords · API keys and tokens stored only as hashes" },
  { k: "in transit", v: "rotating session tokens · https-only · account lockout" },
  { k: "uploads", v: "type + size checked before parsing · held in memory, never on disk" },
  { k: "export", v: "download everything as JSON, or delete it all, any time" },
];

export function SecurityPanel() {
  return (
    <section id="security" className="scroll-mt-24 py-24 md:py-32">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Private by construction
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            What's in your vault stays in your vault
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Isolation isn't a checkbox — it's the filter on every read, enforced
            in the database. Retrivo is open source, so you can verify that
            rather than take our word for it.
          </p>
        </Reveal>

        <Reveal className="terminal-panel overflow-hidden" delay={0.1}>
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="ml-2 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
              security.audit
            </span>
          </div>
          <Stagger
            as="ul"
            wrapChildren={false}
            stagger={0.06}
            className="divide-y divide-border font-mono text-xs"
          >
            {LINES.map((l) => (
              <RevealItem
                as="li"
                key={l.k}
                className="flex items-start gap-3 px-4 py-3"
              >
                <span className="shrink-0 rounded-sm border border-ok/30 bg-ok/10 px-1.5 py-0.5 text-2xs uppercase text-ok">
                  ok
                </span>
                <span className="text-muted-foreground">
                  <span className="text-foreground">{l.k}</span> — {l.v}
                </span>
              </RevealItem>
            ))}
          </Stagger>
        </Reveal>
      </div>
    </section>
  );
}
