import { cn } from "@/lib/utils";

const STAGES = [
  "Upload",
  "Extract",
  "Chunk",
  "Embed",
  "Retrieve",
  "Answer",
] as const;

interface PipelineStripProps {
  className?: string;
  animated?: boolean;
  compact?: boolean;
}

/**
 * The signature RAG pipeline motif: monospace nodes joined by a dashed line
 * with a traveling highlight. Used on the landing hero and as an app empty-state.
 * The dash animation pauses under prefers-reduced-motion (handled globally in CSS).
 */
export function PipelineStrip({
  className,
  animated = false,
  compact = false,
}: PipelineStripProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-center gap-x-1 gap-y-3",
        className,
      )}
      role="img"
      aria-label="Retrieval pipeline: upload, extract, chunk, embed, retrieve, answer"
    >
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-1">
          <span
            className={cn(
              "rounded-sm border border-border-strong bg-surface font-mono uppercase tracking-wide text-muted-foreground",
              compact ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs",
              i === STAGES.length - 1 && "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            {stage}
          </span>
          {i < STAGES.length - 1 && (
            <svg
              width={compact ? 20 : 28}
              height="10"
              viewBox="0 0 28 10"
              className="shrink-0 text-border-strong"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="5"
                x2="28"
                y2="5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className={animated ? "animate-flow-dash" : undefined}
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
