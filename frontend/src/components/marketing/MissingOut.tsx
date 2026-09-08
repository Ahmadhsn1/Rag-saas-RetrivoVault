import { X, Check } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/motion/Reveal";

const WITHOUT = [
  "Re-reading documents you've already read to find one clause or number",
  "Losing an hour to Cmd-F across 40 files that don't share vocabulary",
  "Deciding from memory — “I think it said 60 days?”",
  "Pasting files into a chatbot one at a time, with no citation to check",
  "Watching every new document make the pile heavier, not smarter",
];

const WITH = [
  "Ask a question, get the answer — with the passage it came from",
  "Semantic search finds the idea, not the exact string",
  "Click the citation and verify in one step",
  "Your whole library at once, private to you",
  "Every document you add makes the rest more useful",
];

export function MissingOut() {
  return (
    <section className="border-y border-border bg-surface/30 py-24 md:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            What you're missing
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            You've already read the answer
          </h2>
          <p className="mt-4 text-muted-foreground">
            The value is in your archive. It's just locked in the pile.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
          <Reveal
            className="rounded-xl border border-destructive/25 bg-destructive/[0.04] p-6"
            delay={0.05}
          >
            <p className="font-mono text-2xs uppercase tracking-wide text-destructive">
              Without Retrivo — right now you are
            </p>
            <Stagger as="ul" className="mt-4 space-y-3" stagger={0.06}>
              {WITHOUT.map((t) => (
                <RevealItem
                  as="li"
                  key={t}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <X
                    className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70"
                    aria-hidden="true"
                  />
                  {t}
                </RevealItem>
              ))}
            </Stagger>
          </Reveal>

          <Reveal
            className="rounded-xl border border-ok/25 bg-ok/[0.04] p-6"
            delay={0.12}
          >
            <p className="font-mono text-2xs uppercase tracking-wide text-ok">
              With Retrivo
            </p>
            <Stagger as="ul" className="mt-4 space-y-3" stagger={0.06}>
              {WITH.map((t) => (
                <RevealItem
                  as="li"
                  key={t}
                  className="flex items-start gap-2.5 text-sm text-foreground/90"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-ok"
                    aria-hidden="true"
                  />
                  {t}
                </RevealItem>
              ))}
            </Stagger>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
