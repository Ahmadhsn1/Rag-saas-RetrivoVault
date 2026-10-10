import { Reveal } from "@/components/motion/Reveal";

const LINES = [
  {
    k: "Private to your account",
    v: "Every search is filtered to your account inside the database — the semantic index included. It is how the queries are written, not a setting.",
  },
  {
    k: "Never used for training",
    v: "Your documents are sent to the model only to index them and to answer your questions. They are not used to train anything.",
  },
  {
    k: "Protected at rest",
    v: "Passwords are hashed, API keys and session tokens are stored only as hashes, and any key you bring is encrypted.",
  },
  {
    k: "Yours to take or delete",
    v: "Export everything as one file, download any original, delete a single document, or erase the whole account at once.",
  },
];

export function SecurityPanel() {
  return (
    <section id="security" className="scroll-mt-24 border-y border-border bg-surface/60 py-20 md:py-28">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow">Privacy</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">
            What&rsquo;s in your vault stays in your vault
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            The documents you would put here are the ones you cannot afford to
            leak. The product is built on that assumption.
          </p>
        </Reveal>

        <dl className="divide-y divide-border border-y border-border">
          {LINES.map((l) => (
            <div key={l.k} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
              <dt className="font-serif text-lg">{l.k}</dt>
              <dd className="leading-relaxed text-muted-foreground">{l.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
