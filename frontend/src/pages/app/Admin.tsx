import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, FileText, MessagesSquare, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminStats, AdminUser } from "@/types/api";

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export default function Admin() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        api.get<AdminStats>("/admin/stats"),
        api.get<{ users: AdminUser[] }>("/admin/users", { params: q ? { q } : {} }),
      ]);
      setStats(s.data);
      setUsers(u.data.users);
    } catch (err) {
      setForbidden(true);
      void err;
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    // ensure the role flag is fresh (self-heals server-side on first admin call)
    if (!forbidden) void refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forbidden]);

  if (user && user.role !== "admin" && forbidden) {
    return <Navigate to="/app" replace />;
  }

  const setPlan = async (id: string, plan: string) => {
    try {
      await api.patch(`/admin/users/${id}`, { plan });
      toast.success("Plan updated");
      void load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };
  const unlock = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}`, { unlock: true });
      toast.success("Unlocked");
      void load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-6 sm:px-6">
      <h2 className="mb-6 font-mono text-lg font-semibold">Admin</h2>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={Users}
              label={`${stats?.newUsersLast30d ?? 0} new / 30d`}
              value={formatNumber(stats?.users ?? 0)}
            />
            <Stat
              icon={DollarSign}
              label="est. MRR"
              value={`$${formatNumber(stats?.estimatedMrr ?? 0)}`}
            />
            <Stat
              icon={MessagesSquare}
              label="queries / 30d"
              value={formatNumber(stats?.queriesLast30d ?? 0)}
            />
            <Stat
              icon={FileText}
              label="documents"
              value={formatNumber(stats?.documents ?? 0)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(stats?.planCounts ?? {}).map(([plan, n]) => (
              <Badge key={plan} variant={plan === "free" ? "default" : "primary"}>
                {plan}: {n}
              </Badge>
            ))}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-sm font-semibold">Users</h3>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name / email"
                className="h-8 w-56"
              />
            </div>
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden sm:table-cell">Joined</TableHead>
                    <TableHead className="w-10" aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <span className="block truncate text-xs">{u.name}</span>
                        <span className="block truncate font-mono text-2xs text-muted-foreground">
                          {u.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.plan === "free" ? "default" : "primary"}
                        >
                          {u.plan}
                        </Badge>
                        {u.lockedUntil &&
                          new Date(u.lockedUntil) > new Date() && (
                            <Badge variant="warn" className="ml-1">
                              locked
                            </Badge>
                          )}
                      </TableCell>
                      <TableCell className="hidden font-mono text-2xs text-muted-foreground sm:table-cell">
                        {formatRelativeTime(u.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            aria-label={`Manage ${u.email}`}
                          >
                            …
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Set plan</DropdownMenuLabel>
                            {["free", "pro", "max"].map((p) => (
                              <DropdownMenuItem
                                key={p}
                                onSelect={() => setPlan(u._id, p)}
                              >
                                {p}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => unlock(u._id)}>
                              Unlock account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
      {loading && <Loader2 className="sr-only" />}
    </div>
  );
}
