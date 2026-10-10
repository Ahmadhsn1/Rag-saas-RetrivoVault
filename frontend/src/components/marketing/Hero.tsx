import { Link } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A footnote-style citation mark, as it appears in the product. */
function Cite({ n }: { n: number }) {
  return (
    <sup className="mx-0.5 rounded-[3px] bg-brand/10 px-1 py-px text-[0.68em] font-semibold text-brand">
      {n}
    </sup>
  );
}

/**
 * The hero shows the product's one promise as a specimen: a question, the
 * answer, and the passage that proves it — set like a page, not a chat window.
 */
function AnswerSpecimen() {
  return (
    <figure className="relative">
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <p className="text-xs font-medium text-muted-foreground">You asked</p>
        <p className="mt-1.5 font-serif text-xl leading-snug text-foreground">
          When does the Northwind contract renew, and how do we get out of it?
        </p>

        <div className="my-6 h-px bg-border" />

        <p className="text-xs font-medium text-muted-foreground">Retrivo</p>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-foreground/90">
          It renews automatically for one year unless either side gives sixty
          days&rsquo; written notice before the term ends
          <Cite n={1} />. After the first anniversary, either party can also
          end it for convenience with ninety days&rsquo; notice
          <Cite n={2} />.
        </p>
      </div>

      <figcaption className="relative -mt-3 ml-6 mr-2 rounded-lg border border-border bg-background p-4 shadow-md sm:ml-14 sm:mr-0">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-brand/10 text-[0.7rem] font-semibold text-brand">
            1
          </span>
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          northwind-msa.pdf &middot; page 4
        </p>
        <p className="mt-2 border-l-2 border-brand/40 pl-3 font-serif text-[0.95rem] italic leading-relaxed text-foreground/80">
          &ldquo;This Agreement shall renew automatically for successive
          one-year terms unless either party gives written notice of
          non-renewal at least sixty (60) days before the end of the
          then-current term.&rdquo;
        </p>
      </figcaption>
    </figure>
  );
}

export function Hero() {
  return (
    <section className="pb-20 pt-36 md:pb-28 md:pt-44">
      <div className="container grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <p className="eyebrow">Private document Q&amp;A, with proof</p>
          <h1 className="mt-5 text-[2.75rem] leading-[1.04] sm:text-6xl">
            Your documents, <em className="font-normal">answerable.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Add your contracts, papers and notes to a private vault. Ask in
            plain language and get the answer in seconds — with the exact
            passage it came from, so you can check it before you rely on it.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/signup">
                Start free
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/#how">See how it works</a>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            14-day Pro trial. No card. Your documents stay yours.
          </p>
        </div>

        <AnswerSpecimen />
      </div>
    </section>
  );
}
