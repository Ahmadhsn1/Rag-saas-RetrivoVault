import { useRef } from "react";
import {
  Briefcase,
  Microscope,
  Scale,
  Rocket,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

interface Persona {
  icon: LucideIcon;
  who: string;
  pile: string;
  question: string;
}

const PERSONAS: Persona[] = [
  {
    icon: Briefcase,
    who: "Independent consultants",
    pile: "Years of client contracts, SOWs and decks",
    question: "“What were the payment terms on the Acme engagement?”",
  },
  {
    icon: Microscope,
    who: "Researchers & analysts",
    pile: "Hundreds of papers, reports and datasets",
    question: "“Which of these studies used a control group?”",
  },
  {
    icon: Scale,
    who: "Solo legal professionals",
    pile: "Contracts, filings, statutes, discovery",
    question: "“Which clause covers early termination?”",
  },
  {
    icon: Rocket,
    who: "Founders & solo operators",
    pile: "Board minutes, vendor agreements, policies",
    question: "“When does our SOC 2 renew?”",
  },
  {
    icon: PenLine,
    who: "Writers & journalists",
    pile: "Interview transcripts and background research",
    question: "“Where exactly did the source say that?”",
  },
];

export function WhoItsFor() {
  const ref = useRef<HTMLDivElement>(null);
  useGsapReveal(ref, "> *", { stagger: 0.07 });

  return (
    <section id="who" className="scroll-mt-24 py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Who it's for
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            If your work leaves you with a pile of documents
          </h2>
          <p className="mt-4 text-muted-foreground">
            You collected them to reference later. Retrivo makes “later” take
            seconds instead of an afternoon.
          </p>
        </div>

        <div
          ref={ref}
          className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PERSONAS.map(({ icon: Icon, who, pile, question }) => (
            <article
              key={who}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-border-strong"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-mono text-sm font-semibold">{who}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{pile}</p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                {question}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
