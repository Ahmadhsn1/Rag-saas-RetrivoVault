import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineStrip } from "@/components/rag/PipelineStrip";
import { AnswerText } from "@/components/rag/AnswerText";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { useTypewriter } from "@/hooks/useTypewriter";
import { gsap, splitReveal, prefersReducedMotion } from "@/lib/motion";

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

const DEMO_ANSWER =
  "It auto-renews for one year unless either party gives written notice at least 60 days before the term ends [1]. After the first anniversary, either side can also terminate for convenience with 90 days' notice [2].";

const HEADLINE = ["Your", "documents,", "answerable."];

export function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const { out, done } = useTypewriter(DEMO_ANSWER, true, 14);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    const words = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".word"));
    const ctx = gsap.context(() => {
      splitReveal(words);
      if (!prefersReducedMotion()) {
        gsap.from(".hero-fade", {
          opacity: 0,
          y: 14,
          duration: 0.6,
          stagger: 0.08,
          delay: 0.35,
          ease: "power2.out",
        });
      }
    }, el.parentElement ?? el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
      <AuroraBackground />

      <div className="container relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Badge variant="outline" className="hero-fade mb-6 gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            RAG · cited · private
          </Badge>

          <h1
            ref={headlineRef}
            className="text-[2.6rem] leading-[1.04] [perspective:800px] sm:text-6xl md:text-[4rem]"
          >
            {HEADLINE.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1">
                <span
                  className={
                    "word inline-block " + (i === 2 ? "text-gradient" : "")
                  }
                >
                  {w}
                </span>
                {i < HEADLINE.length - 1 && " "}
              </span>
            ))}
          </h1>

          <p className="hero-fade mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload PDFs and notes into a private, per-user knowledge base. Ask in
            plain language and get answers grounded in your own text — every claim
            linked back to the passage it came from.
          </p>

          <div className="hero-fade mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg">
              <Link to="/signup">
                Start your vault
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#demo">Watch it retrieve</a>
            </Button>
          </div>

          <div className="hero-fade mt-8 flex flex-wrap gap-2">
            <Badge>vec 768d · cosine</Badge>
            <Badge>top-k 5</Badge>
            <Badge>gemini-2.5-flash</Badge>
          </div>
        </div>

        <div className="hero-fade relative">
          <div className="glass rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-1.5 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-ok/50" />
              <span className="ml-2 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                vault · chat
              </span>
              <span className="ml-auto flex items-center gap-1 font-mono text-2xs text-ok">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ok" />
                live
              </span>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-surface px-3 py-2 text-sm">
                When does the vendor contract renew?
              </div>
              <div className="w-fit max-w-[94%] rounded-lg border border-border bg-background/70 px-3 py-2">
                <AnswerText content={out} sources={DEMO_SOURCES} />
                {!done && (
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-primary align-middle" />
                )}
              </div>
            </div>

            <div className="mt-3 border-t border-border pt-3">
              <PipelineStrip compact animated />
            </div>
          </div>

          <div className="absolute -right-3 -top-5 hidden rotate-3 rounded-lg border border-border bg-card px-3 py-2 shadow-md sm:block">
            <p className="font-mono text-2xs text-muted-foreground">retrieval</p>
            <p className="font-mono text-sm text-ok">142ms</p>
          </div>
          <div className="absolute -bottom-6 -left-4 hidden -rotate-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md sm:block">
            <p className="font-mono text-2xs text-muted-foreground">chunks matched</p>
            <p className="font-mono text-sm text-brand">5 / 1,284</p>
          </div>
        </div>
      </div>
    </section>
  );
}
