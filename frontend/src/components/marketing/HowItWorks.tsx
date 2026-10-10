import { Reveal } from "@/components/motion/Reveal";

const STEPS = [
  {
    n: "1",
    title: "Add your documents",
    body: "Drop in PDFs, Word files, spreadsheets and notes, or paste a link to a web page. Retrivo reads and indexes each one in the background.",
  },
  {
    n: "2",
    title: "Ask in plain language",
    body: "Ask the way you would ask a colleague. Retrivo searches everything you have added by meaning and by exact wording — and only ever your own documents.",
  },
  {
    n: "3",
    title: "Check the source",
    body: "Every claim carries a numbered citation. Open it to read the passage, see the page, and jump to that page in the original file.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-y border-border bg-surface/60 py-20 md:py-28">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">
            Three steps to a sourced answer
          </h2>
        </Reveal>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
          {STEPS.map((s) => (
            <li key={s.n} className="md:px-8 md:first:pl-0 md:last:pr-0">
              <span className="font-serif text-5xl leading-none text-brand">{s.n}</span>
              <h3 className="mt-5 text-xl">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
