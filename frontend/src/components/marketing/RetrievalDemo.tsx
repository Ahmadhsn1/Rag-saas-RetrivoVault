import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnswerText } from "@/components/rag/AnswerText";
import { prefersReducedMotion } from "@/lib/motion";

const STEPS = [
  { key: "embed", label: "Embed question", detail: "gemini · gemini-embedding-001 → 768d" },
  { key: "search", label: "Vector search", detail: "$vectorSearch · cosine · numCandidates 100" },
  { key: "rank", label: "Rank top-k", detail: "5 chunks · scores 0.63–0.84" },
  { key: "generate", label: "Generate", detail: "gemini flash · grounded + cited" },
] as const;

const SOURCES = [
  { index: 1, chunkId: "c1", documentId: "d1", score: 0.84, preview: "Auto-renews for one year absent 60-day written notice." },
  { index: 2, chunkId: "c2", documentId: "d1", score: 0.79, preview: "Termination for convenience allowed after year one with 90 days' notice." },
];
const ANSWER =
  "It renews for a year automatically unless notice is given 60 days out [1]; after the first year either party can exit with 90 days' notice [2].";

export function RetrievalDemo() {
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const run = useCallback(() => {
    clearTimers();
    setRunning(true);
    setActive(0);
    if (prefersReducedMotion()) {
      setActive(STEPS.length);
      setRunning(false);
      return;
    }
    STEPS.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => setActive(i + 1), (i + 1) * 900),
      );
    });
    timers.current.push(
      window.setTimeout(() => setRunning(false), STEPS.length * 900),
    );
  }, []);

  const reset = () => {
    clearTimers();
    setActive(-1);
    setRunning(false);
  };

  useEffect(() => () => clearTimers(), []);

  const showAnswer = active >= STEPS.length;

  return (
    <section id="demo" className="scroll-mt-24 border-y border-border bg-surface/30 py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Watch it retrieve
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            From question to cited answer
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                pipeline
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={run} disabled={running}>
                  <Play className="h-3.5 w-3.5" />
                  {active >= 0 ? "Re-run" : "Run query"}
                </Button>
                {active >= 0 && (
                  <Button size="sm" variant="ghost" onClick={reset}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-surface px-3 py-2 text-sm">
              "When does the vendor contract renew?"
            </div>

            <ol className="mt-4 space-y-2">
              {STEPS.map((step, i) => {
                const state =
                  active > i ? "done" : active === i && running ? "active" : "idle";
                return (
                  <li
                    key={step.key}
                    className={cn(
                      "flex items-start gap-3 rounded-md border px-3 py-2 transition-colors duration-300",
                      state === "idle" && "border-border opacity-50",
                      state === "active" && "border-primary/50 bg-primary/5",
                      state === "done" && "border-ok/30 bg-ok/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                        state === "idle" && "bg-border-strong",
                        state === "active" && "animate-pulse-dot bg-primary",
                        state === "done" && "bg-ok",
                      )}
                    />
                    <span>
                      <span className="block font-mono text-xs font-medium">
                        {step.label}
                      </span>
                      <span className="block font-mono text-2xs text-muted-foreground">
                        {step.detail}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <span className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
              result
            </span>
            {showAnswer ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {SOURCES.map((s) => (
                    <Badge key={s.index} variant="primary">
                      [{s.index}] {s.score}
                    </Badge>
                  ))}
                </div>
                <AnswerText content={ANSWER} sources={SOURCES} />
              </div>
            ) : (
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                {active < 0
                  ? "Press “Run query” to watch a question move through the pipeline."
                  : "Retrieving…"}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
