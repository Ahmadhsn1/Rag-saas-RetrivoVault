import { useRef } from "react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const STEPS = [
  {
    n: "01",
    title: "Add your documents",
    body: "Drop in PDFs, Word files, spreadsheets, notes — or paste a web page. Retrivo reads, splits and indexes each one in the background. Group them into collections if you like.",
    chip: "pdf · docx · csv · md · url",
  },
  {
    n: "02",
    title: "Ask in plain language",
    body: "Open your vault and ask a real question. Retrivo matches it against your own text by meaning, not keywords — and only ever searches your documents.",
    chip: "semantic · scoped to you",
  },
  {
    n: "03",
    title: "Get a sourced answer",
    body: "The answer streams back grounded in the passages it found, with a clickable citation and match score behind every claim. Thumbs it, copy it, or share the thread.",
    chip: "streamed · [1] [2] · scores",
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
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Three steps to a sourced answer
          </h2>
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
