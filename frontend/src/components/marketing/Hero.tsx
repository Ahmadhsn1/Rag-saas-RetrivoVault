import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineStrip } from "@/components/rag/PipelineStrip";
import { AnswerText } from "@/components/rag/AnswerText";

const DEMO_SOURCES = [
  {
    index: 1,
    chunkId: "c_8f21a0",
    documentId: "d_11c930",
    score: 0.842,
    preview:
      "The renewal clause requires written notice at least 60 days before the term expires; absent notice the agreement auto-renews for one year.",
  },
  {
    index: 2,
    chunkId: "c_4b7e15",
    documentId: "d_11c930",
    score: 0.791,
    preview:
      "Either party may terminate for convenience with 90 days' notice after the first anniversary of the effective date.",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      <div className="glow-hero pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        aria-hidden="true"
      />

      <div className="container relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Badge variant="outline" className="mb-6">
            RAG · cited · private
          </Badge>
          <h1 className="text-4xl leading-[1.05] sm:text-5xl md:text-[3.5rem]">
            Your documents,
            <br />
            <span className="text-brand">answerable.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload PDFs and notes into a private, per-user knowledge base. Ask in
            plain language and get answers grounded in your own text — every claim
            linked back to the passage it came from.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg">
              <Link to="/signup">
                Start your vault
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how">See how it works</a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge>vec 768d · cosine</Badge>
            <Badge>top-k 5</Badge>
            <Badge>gemini-2.5-flash</Badge>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="flex items-center gap-1.5 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="ml-2 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                vault · chat
              </span>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-surface px-3 py-2 text-sm">
                When does the vendor contract renew?
              </div>
              <div className="w-fit max-w-[92%] rounded-lg border border-border bg-background px-3 py-2">
                <AnswerText
                  content="It auto-renews for one year unless either party gives written notice at least 60 days before the term ends [1]. After the first anniversary, either side can also terminate for convenience with 90 days' notice [2]."
                  sources={DEMO_SOURCES}
                />
              </div>
            </div>

            <div className="mt-3 border-t border-border pt-3">
              <PipelineStrip compact animated />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
