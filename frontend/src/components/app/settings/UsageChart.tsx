import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table2, LineChart as LineIcon } from "lucide-react";
import { useUsageChart } from "@/hooks/useBilling";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Ink blue for questions, the citation accent for ingestion.
const C_QUERY = "#1f3a6e";
const C_INGEST = "#a8452a";
const AXIS = "hsl(222 10% 38%)";
const GRID = "hsl(38 18% 88%)";

export function UsageChart() {
  const { series, loading } = useUsageChart(30);
  const [asTable, setAsTable] = useState(false);

  if (loading) return <Skeleton className="h-56 w-full" />;

  const empty = series.every((d) => d.query === 0 && d.ingest === 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium">Activity · last 30 days</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: C_QUERY }}
              />
              queries
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: C_INGEST }}
              />
              chunks ingested
            </span>
          </div>
          <button
            onClick={() => setAsTable((v) => !v)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={asTable ? "Show chart" : "Show data table"}
          >
            {asTable ? (
              <LineIcon className="h-3.5 w-3.5" />
            ) : (
              <Table2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {empty ? (
        <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">
          No activity yet
        </div>
      ) : asTable ? (
        <div className="max-h-56 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Queries</TableHead>
                <TableHead>Chunks ingested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series
                .filter((d) => d.query || d.ingest)
                .reverse()
                .map((d) => (
                  <TableRow key={d.date}>
                    <TableCell className="text-xs">{d.date}</TableCell>
                    <TableCell className="text-xs">{d.query}</TableCell>
                    <TableCell className="text-xs">{d.ingest}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 4, right: 8, bottom: 0, left: -18 }}
            >
              <defs>
                <linearGradient id="gq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_QUERY} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={C_QUERY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_INGEST} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={C_INGEST} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: AXIS, fontSize: 10, fontFamily: "IBM Plex Sans" }}
                tickFormatter={(d: string) => d.slice(5)}
                interval={6}
                stroke={GRID}
              />
              <YAxis
                tick={{ fill: AXIS, fontSize: 10, fontFamily: "IBM Plex Sans" }}
                stroke={GRID}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid hsl(38 14% 74%)",
                  borderRadius: 8,
                  fontFamily: "IBM Plex Sans",
                  fontSize: 11,
                }}
                labelStyle={{ color: AXIS }}
              />
              <Area
                type="monotone"
                dataKey="ingest"
                name="chunks ingested"
                stroke={C_INGEST}
                fill="url(#gi)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="query"
                name="queries"
                stroke={C_QUERY}
                fill="url(#gq)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
