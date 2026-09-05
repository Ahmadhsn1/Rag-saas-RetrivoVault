import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RetrievedSource } from "@/types/api";

interface CitationBadgeProps {
  index: number;
  source?: RetrievedSource;
  onSelect?: (source: RetrievedSource) => void;
}

export function CitationBadge({ index, source, onSelect }: CitationBadgeProps) {
  const badge = (
    <button
      type="button"
      onClick={() => source && onSelect?.(source)}
      className={cn(
        "mx-0.5 inline-flex h-[1.15rem] min-w-[1.15rem] translate-y-[1px] items-center justify-center rounded-[4px] border border-primary/40 bg-primary/15 px-1 font-mono text-2xs font-semibold text-primary transition-colors hover:bg-primary/25",
        !source && "opacity-50",
      )}
      aria-label={`Source ${index}`}
    >
      {index}
    </button>
  );

  if (!source) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-mono text-2xs uppercase text-muted-foreground">
          match {source.score.toFixed(3)}
        </p>
        <p className="mt-1 line-clamp-3 text-xs">{source.preview}…</p>
      </TooltipContent>
    </Tooltip>
  );
}
