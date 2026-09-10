import { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  MessagesSquare,
  FileText,
  Radio,
  Gift,
  Ban,
  Activity,
  ShieldCheck,
  BellRing,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminStats, AdminTimeseriesPoint } from "@/types/api";
import { Stat, Sparkline } from "./shared";

function HealthRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 font-mono text-2xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={ok ? "text-ok" : "text-muted-foreground/60"}>
        {ok ? "ready" : "off"}
      </span>
    </div>
  );
}

export function OverviewPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [series, setSeries] = useState<AdminTimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      api.get<AdminStats>("/admin/stats"),
      api.get<{ series: AdminTimeseriesPoint[] }>("/admin/timeseries", {
        params: { days: 30 },
      }),
    ])
      .then(([s, t]) => {
        if (!alive) return;
        if (s.status === "fulfilled") setStats(s.value.data);
        if (t.status === "fulfilled") setSeries(t.value.data.series ?? []);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (!stats) return <p className="text-sm text-muted-foreground">Couldn't load stats.</p>;

  const f = stats.health?.features ?? { billing: false, mail: false, push: false, gemini: false };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat
          icon={Radio}
          label="online now"
          value={stats.onlineNow}
          hint={`${stats.activeToday} today · ${stats.active7d} this week`}
          tone={stats.onlineNow > 0 ? "ok" : "muted"}
        />
        <Stat
          icon={Users}
          label="total users"
          value={stats.users}
          hint={`+${stats.newUsersLast30d} in 30d`}
        />
        <Stat icon={DollarSign} label="est. MRR" value={`$${stats.estimatedMrr.toLocaleString("en-US")}`} />
        <Stat icon={MessagesSquare} label="queries / 30d" value={stats.queriesLast30d} />
        <Stat icon={Gift} label="comped" value={stats.compedUsers} />
        <Stat
          icon={Ban}
          label="suspended"
          value={stats.suspendedUsers}
          tone={stats.suspendedUsers > 0 ? "warn" : "muted"}
        />
        <Stat icon={ShieldCheck} label="admins" value={stats.admins} />
        <Stat icon={BellRing} label="push subscribers" value={stats.pushSubscribers} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs font-medium">Signups · last 30 days</p>
            <span className="font-mono text-2xs text-muted-foreground">
              {series.reduce((n, d) => n + d.signups, 0)} total
            </span>
          </div>
          <Sparkline data={series.map((d) => d.signups)} />
          <div className="mt-4 mb-2 flex items-center justify-between">
            <p className="font-mono text-xs font-medium">Queries · last 30 days</p>
            <span className="font-mono text-2xs text-muted-foreground">
              {series.reduce((n, d) => n + d.queries, 0)} total
            </span>
          </div>
          <Sparkline data={series.map((d) => d.queries)} />
        </Card>

        <Card className="p-4">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-xs font-medium">
            <Activity className="h-3.5 w-3.5" /> System
          </p>
          <div className="divide-y divide-border">
            <HealthRow label="database" ok={stats.health?.db === "up"} />
            <HealthRow label="gemini" ok={f.gemini} />
            <HealthRow label="billing (stripe)" ok={f.billing} />
            <HealthRow label="email (smtp)" ok={f.mail} />
            <HealthRow label="web push (vapid)" ok={f.push} />
          </div>
        </Card>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 font-mono text-sm font-semibold">
          <FileText className="h-3.5 w-3.5" /> Plan distribution
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.planCounts).map(([plan, n]) => (
            <Badge key={plan} variant={plan === "free" ? "default" : "primary"}>
              {plan}: {n}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
