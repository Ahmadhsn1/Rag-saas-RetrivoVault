import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUsageChart } from "@/hooks/useBilling";
import { Skeleton } from "@/components/ui/skeleton";

const AXIS = "hsl(240 4% 46%)";

export function UsageChart() {
  const { series, loading } = useUsageChart(30);

  if (loading) return <Skeleton className="h-56 w-full" />;

  const empty = series.every((d) => d.query === 0 && d.ingest === 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs font-medium">Activity · last 30 days</p>
        <div className="flex gap-3 font-mono text-2xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-primary" /> queries
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand" /> chunks ingested
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        {empty ? (
          <div className="flex h-full items-center justify-center font-mono text-2xs text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="gq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(249 74% 64%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(249 74% 64%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(42 40% 80%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(42 40% 80%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(240 5% 16%)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: AXIS, fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickFormatter={(d: string) => d.slice(5)}
                interval={6}
                stroke="hsl(240 5% 16%)"
              />
              <YAxis
                tick={{ fill: AXIS, fontSize: 10, fontFamily: "JetBrains Mono" }}
                stroke="hsl(240 5% 16%)"
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(240 7% 9%)",
                  border: "1px solid hsl(240 5% 27%)",
                  borderRadius: 8,
                  fontFamily: "JetBrains Mono",
                  fontSize: 11,
                }}
                labelStyle={{ color: AXIS }}
              />
              <Area
                type="monotone"
                dataKey="ingest"
                stroke="hsl(42 40% 80%)"
                fill="url(#gi)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="query"
                stroke="hsl(249 74% 64%)"
                fill="url(#gq)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
