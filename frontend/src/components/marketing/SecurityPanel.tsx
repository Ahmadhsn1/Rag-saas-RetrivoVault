const LINES = [
  { k: "passwords", v: "bcrypt · cost 12 · never stored plaintext" },
  { k: "sessions", v: "JWT access 15m + httpOnly refresh cookie, rotated" },
  { k: "isolation", v: "every query scoped by userId — vector search included" },
  { k: "uploads", v: "MIME allowlist + 10 MB cap before any parsing" },
  { k: "rate limits", v: "auth · upload · chat — protects model quota" },
  { k: "errors", v: "centralized handler — no stack traces to the client" },
];

export function SecurityPanel() {
  return (
    <section id="security" className="scroll-mt-24 py-24 md:py-32">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Security
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Private by construction
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Retrivo Vault is multi-user from the data model up. Isolation isn't a
            setting you enable — it's the filter on every read, including the
            Atlas vector index itself.
          </p>
        </div>

        <div className="terminal-panel overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="ml-2 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
              security.audit
            </span>
          </div>
          <ul className="divide-y divide-border font-mono text-xs">
            {LINES.map((l) => (
              <li key={l.k} className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 rounded-sm border border-ok/30 bg-ok/10 px-1.5 py-0.5 text-2xs uppercase text-ok">
                  ok
                </span>
                <span className="text-muted-foreground">
                  <span className="text-foreground">{l.k}</span> — {l.v}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
