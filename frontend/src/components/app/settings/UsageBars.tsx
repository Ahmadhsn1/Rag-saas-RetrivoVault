import { cn, formatBytes, formatNumber } from "@/lib/utils";
import type { UsageSnapshot } from "@/types/api";

function Bar({
  label,
  used,
  limit,
  render = formatNumber,
}: {
  label: string;
  used: number;
  limit: number;
  render?: (n: number) => string;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const near = pct >= 80;
  const full = pct >= 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between font-mono text-2xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(full ? "text-destructive" : near ? "text-warn" : "text-muted-foreground")}>
          {render(used)} / {render(limit)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            full ? "bg-destructive" : near ? "bg-warn" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsageBars({ usage }: { usage: UsageSnapshot }) {
  const { current, limits } = usage;
  return (
    <div className="space-y-4">
      <Bar
        label="Questions this month"
        used={current.queries}
        limit={limits.queriesPerMonth}
      />
      <Bar label="Documents" used={current.documents} limit={limits.documents} />
      <Bar
        label="Storage"
        used={current.storageBytes}
        limit={limits.storageBytes}
        render={(n) => formatBytes(n, 0)}
      />
      <Bar
        label="Collections"
        used={current.collections}
        limit={limits.collections}
      />
    </div>
  );
}
