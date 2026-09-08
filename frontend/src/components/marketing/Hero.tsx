import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineStrip } from "@/components/rag/PipelineStrip";
import { AnswerText } from "@/components/rag/AnswerText";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { useTypewriter } from "@/hooks/useTypewriter";
import { gsap, splitReveal, prefersReducedMotion } from "@/lib/motion";
import type { RetrievedSource } from "@/types/api";

interface Demo {
  question: string;
  answer: string;
  sources: RetrievedSource[];
}

const DEMOS: Demo[] = [
  {
    question: "When does the Acme vendor contract renew?",
    answer:
      "It auto-renews for one year unless either party gives written notice at least 60 days before the term ends [1]. After the first anniversary, either side can also terminate for convenience with 90 days' notice [2].",
    sources: [
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
    ],
  },
  {
    question: "Which of these studies used a control group?",
    answer:
      "Three of the seven did. Larsen 2023 and Okafor 2024 used randomized controls [1]; Mehta 2022 used a matched historical control and flags it as a limitation [2]. The rest are single-arm.",
    sources: [
      {
        index: 1,
        chunkId: "c_p12",
        documentId: "d_papers",
        score: 0.807,
        preview:
          "Participants were randomly assigned to the intervention or a wait-list control arm (n = 118 and n = 121 respectively).",
      },
      {
        index: 2,
        chunkId: "c_p27",
        documentId: "d_papers",
        score: 0.744,
        preview:
          "In the absence of a concurrent control, outcomes were compared against a matched historical cohort — a limitation discussed in section 5.",
      },
    ],
  },
  {
    question: "What did the founder say about the SOC 2 timeline?",
    answer:
      "In the March board notes, the Type I report was expected by end of Q2 and Type II observation would run through Q4, targeting the report in January [1].",
    sources: [
      {
        index: 1,
        chunkId: "c_b04",
        documentId: "d_board",
        score: 0.861,
        preview:
          "SOC 2 Type I on track for end of June; the Type II observation window runs July–December with the report expected mid-January.",
      },
    ],
  },
];

const HEADLINE = ["Your", "documents,", "answerable."];

export function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const demo = DEMOS[demoIndex];
  const { out, done } = useTypewriter(demo.answer, true, 12);

  // rotate the demo once the current answer finishes typing
  useEffect(() => {
    if (!done || prefersReducedMotion()) return;
    const t = window.setTimeout(
      () => setDemoIndex((i) => (i + 1) % DEMOS.length),
      4200,
    );
    return () => window.clearTimeout(t);
  }, [done, demoIndex]);

  const sources = useMemo(() => demo.sources, [demo]);

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
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Private · every answer sourced
          </Badge>

          <h1
            ref={headlineRef}
            className="text-[2.6rem] leading-[1.04] [perspective:800px] sm:text-6xl md:text-[4rem]"
          >
            {HEADLINE.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1">
                <span
                  className={"word inline-block " + (i === 2 ? "text-gradient" : "")}
                >
                  {w}
                </span>
                {i < HEADLINE.length - 1 && " "}
              </span>
            ))}
          </h1>

          <p className="hero-fade mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Add your contracts, papers and notes to a private vault. Ask in plain
            language and get an answer in seconds — with the exact passage it came
            from, so you can trust it.
          </p>

          <div className="hero-fade mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg">
              <Link to="/signup">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#demo">See it work</a>
            </Button>
          </div>

          <p className="hero-fade mt-3 font-mono text-2xs text-muted-foreground">
            14-day Pro trial · no card · your documents stay yours
          </p>
        </div>

        <div className="hero-fade relative">
          <div className="glass rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-1.5 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-ok/50" />
              <span className="ml-2 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                your vault · chat
              </span>
              <span className="ml-auto flex items-center gap-1 font-mono text-2xs text-ok">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ok" />
                live
              </span>
            </div>

            <div className="min-h-[190px] space-y-3 border-t border-border pt-3">
              <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-surface px-3 py-2 text-sm">
                {demo.question}
              </div>
              <div className="w-fit max-w-[94%] rounded-lg border border-border bg-background/70 px-3 py-2">
                <AnswerText content={out} sources={sources} />
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
            <p className="font-mono text-2xs text-muted-foreground">matched</p>
            <p className="font-mono text-sm text-brand">
              {sources.length} of 1,284
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
