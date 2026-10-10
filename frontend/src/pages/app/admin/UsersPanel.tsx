import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUser } from "@/types/api";
import { LiveDot } from "./shared";
import { UserDrawer } from "./UserDrawer";

const FILTERS = [
  { key: "", label: "All" },
  { key: "online", label: "Online" },
  { key: "comped", label: "Comped" },
  { key: "suspended", label: "Suspended" },
  { key: "locked", label: "Locked" },
  { key: "admin", label: "Admins" },
] as const;

export function UsersPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (status && status !== "online") params.status = status;
      const { data } = await api.get<{ users: AdminUser[]; total: number }>(
        "/admin/users",
        { params },
      );
      let list = Array.isArray(data.users) ? data.users : [];
      if (status === "online") list = list.filter((u) => u.online);
      setUsers(list);
      setTotal(data.total ?? list.length);
    } catch (err) {
      notifyApiError(err);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(() => void load(), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const exportCsv = async () => {
    try {
      const { data } = await api.get("/admin/users.csv", { responseType: "blob" });
      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `retrivo-users-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyApiError(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / email"
          className="h-8 w-full sm:w-64"
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={`rounded-md border px-2 py-1 font-mono text-2xs transition-colors ${
                status === f.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="ml-auto" onClick={exportCsv}>
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <p className="font-mono text-2xs text-muted-foreground">
        {loading ? "…" : `${users.length} shown · ${total} total`}
      </p>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u._id}
                  className="cursor-pointer"
                  onClick={() => setSelected(u._id)}
                >
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <LiveDot on={!!u.online} />
                      <span className="truncate text-xs">{u.name}</span>
                      {u.role === "admin" && (
                        <Badge variant="primary" className="ml-0.5">
                          admin
                        </Badge>
                      )}
                    </span>
                    <span className="block truncate pl-3 font-mono text-2xs text-muted-foreground">
                      {u.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant={u.plan === "free" ? "default" : "primary"}>
                        {u.plan}
                      </Badge>
                      {u.comp?.plan && (
                        <Badge variant="primary" title="Complimentary access">
                          comp·{u.comp.plan}
                        </Badge>
                      )}
                      {u.suspendedAt && <Badge variant="warn">suspended</Badge>}
                      {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                        <Badge variant="warn">locked</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-2xs text-muted-foreground sm:table-cell">
                    {formatRelativeTime(u.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-xs text-muted-foreground">
                    No users match.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <UserDrawer
        userId={selected}
        isRoot={!!user?.isRootAdmin}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={load}
      />
    </div>
  );
}
