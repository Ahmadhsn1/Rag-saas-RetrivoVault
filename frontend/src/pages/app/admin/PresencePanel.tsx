import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { formatRelativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PresenceUser, AdminSession } from "@/types/api";
import { LiveDot } from "./shared";
import { fmtDuration } from "./format";

const REFRESH_MS = 20_000;

export function PresencePanel() {
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        api.get<{ online: PresenceUser[] }>("/admin/presence"),
        api.get<{ items: AdminSession[] }>("/admin/sessions", { params: { limit: 40 } }),
      ]);
      setOnline(Array.isArray(p.data.online) ? p.data.online : []);
      setSessions(Array.isArray(s.data.items) ? s.data.items : []);
      setUpdatedAt(Date.now());
    } catch (err) {
      notifyApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <Skeleton className="h-72 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-mono text-sm font-semibold">
            <LiveDot on={online.length > 0} />
            Online now · {online.length}
          </h3>
          <span className="font-mono text-2xs text-muted-foreground">
            auto-refresh · {formatRelativeTime(new Date(updatedAt).toISOString())}
          </span>
        </div>
        {online.length === 0 ? (
          <Card className="p-6 text-center font-mono text-2xs text-muted-foreground">
            Nobody's online right now.
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {online.map((o) => (
              <Card key={o.userId} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{o.name}</p>
                  <p className="truncate font-mono text-2xs text-muted-foreground">
                    {o.email}
                  </p>
                  <p className="mt-0.5 font-mono text-2xs text-muted-foreground/70">
                    {o.device ?? "unknown"} · since {formatRelativeTime(o.since)}
                  </p>
                </div>
                <Badge variant={o.plan === "free" ? "default" : "primary"}>{o.plan}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-mono text-sm font-semibold">Recent sessions</h3>
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Device</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <LiveDot on={s.online} />
                      <span className="truncate text-xs">
                        {s.user?.name ?? s.userId.slice(-6)}
                      </span>
                    </span>
                    <span className="block truncate pl-3 font-mono text-2xs text-muted-foreground">
                      {s.user?.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden font-mono text-2xs text-muted-foreground sm:table-cell">
                    {s.device ?? "—"}
                    <br />
                    {s.ip ?? ""}
                  </TableCell>
                  <TableCell className="font-mono text-2xs text-muted-foreground">
                    {formatRelativeTime(s.startedAt)}
                  </TableCell>
                  <TableCell className="font-mono text-2xs">
                    {s.online ? (
                      <span className="text-ok">active</span>
                    ) : (
                      fmtDuration(s.durationMs)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
