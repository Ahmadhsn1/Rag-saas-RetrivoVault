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
        "mx-0.5 inline-flex h-[1.1rem] min-w-[1.1rem] -translate-y-[0.2em] cursor-pointer items-center justify-center rounded-[4px] bg-brand/10 px-1 text-[0.7rem] font-semibold text-brand transition-colors hover:bg-brand/20",
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
        <p className="max-w-xs truncate text-xs text-muted-foreground">
          {source.filename ?? `match ${source.score.toFixed(2)}`}
          {source.page ? ` · p. ${source.page}` : ""}
        </p>
        <p className="mt-1 line-clamp-3 text-xs">{source.preview}…</p>
      </TooltipContent>
    </Tooltip>
  );
}
