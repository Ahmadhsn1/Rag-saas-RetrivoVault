import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types/api";

const MAP: Record<
  DocumentStatus,
  { variant: "warn" | "ok" | "error"; label: string; pulse: boolean }
> = {
  processing: { variant: "warn", label: "processing", pulse: true },
  ready: { variant: "ok", label: "ready", pulse: false },
  failed: { variant: "error", label: "failed", pulse: false },
};

export function StatusChip({
  status,
  chunkCount,
}: {
  status: DocumentStatus;
  chunkCount?: number;
}) {
  const s = MAP[status];
  return (
    <Badge variant={s.variant}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-current",
          s.pulse && "animate-pulse-dot",
        )}
        aria-hidden="true"
      />
      {s.label}
      {status === "ready" && chunkCount ? ` · ${chunkCount}` : ""}
    </Badge>
  );
}
