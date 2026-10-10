import { Reveal } from "@/components/motion/Reveal";

const PERSONAS = [
  {
    who: "Solo legal professionals",
    pile: "Contracts, filings, statutes, discovery",
    question: "Which clause covers early termination?",
  },
  {
    who: "Independent consultants",
    pile: "Years of client contracts, SOWs and decks",
    question: "What were the payment terms on the Acme engagement?",
  },
  {
    who: "Researchers & analysts",
    pile: "Hundreds of papers, reports and datasets",
    question: "Which of these studies used a control group?",
  },
  {
    who: "Founders & operators",
    pile: "Board minutes, vendor agreements, policies",
    question: "When does our SOC 2 audit window close?",
  },
  {
    who: "Writers & journalists",
    pile: "Interview transcripts and background research",
    question: "Where exactly did the source say that?",
  },
];

export function WhoItsFor() {
  return (
    <section id="who" className="scroll-mt-24 py-20 md:py-28">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow">Who it&rsquo;s for</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">
            If your work leaves you with a pile of documents
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            You collected them to refer to later. Retrivo makes &ldquo;later&rdquo;
            take seconds instead of an afternoon.
          </p>
        </Reveal>

        <ul className="divide-y divide-border border-y border-border">
          {PERSONAS.map(({ who, pile, question }) => (
            <li key={who} className="grid gap-1 py-5 sm:grid-cols-[1fr_1.2fr] sm:gap-8">
              <div>
                <h3 className="text-lg">{who}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{pile}</p>
              </div>
              <p className="font-serif text-lg italic leading-snug text-foreground/80 sm:self-center">
                &ldquo;{question}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
