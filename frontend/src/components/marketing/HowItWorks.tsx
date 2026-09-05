import { useRef } from "react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const STEPS = [
  {
    n: "01",
    title: "Upload",
    body: "Add PDFs or text files, optionally into a collection. Retrivo parses, chunks, and embeds each one in the background.",
    chip: "pdf · txt · ≤ 10 MB",
  },
  {
    n: "02",
    title: "Ask",
    body: "Open a chat and ask in plain language. Your question is embedded and matched against your own chunks only.",
    chip: "$vectorSearch · userId filter",
  },
  {
    n: "03",
    title: "Get cited answers",
    body: "The answer streams back grounded in retrieved passages, with a clickable source behind every claim.",
    chip: "stream · [1] [2] · scores",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useGsapReveal(ref, "> *", { stagger: 0.1 });

  return (
    <section id="how" className="scroll-mt-24 border-y border-border bg-surface/30 py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Three steps to a grounded answer</h2>
        </div>

        <div ref={ref} className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-lg border border-border bg-card p-6">
              <span className="font-mono text-2xl font-semibold text-brand">
                {s.n}
              </span>
              <h3 className="mt-3 font-mono text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
              <p className="mt-4 inline-block rounded-sm border border-border-strong bg-surface px-2 py-0.5 font-mono text-2xs text-muted-foreground">
                {s.chip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
