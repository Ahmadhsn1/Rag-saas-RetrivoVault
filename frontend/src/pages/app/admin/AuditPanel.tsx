import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminAuditEntry } from "@/types/api";

const LABELS: Record<string, string> = {
  "user.grant": "Granted comp access",
  "user.revoke_grant": "Revoked comp access",
  "user.suspend": "Suspended user",
  "user.unsuspend": "Reinstated user",
  "user.force_logout": "Forced logout",
  "user.temp_password": "Issued temp password",
  "user.send_reset": "Emailed reset link",
  "user.set_role": "Changed role",
  "user.update": "Edited user",
  "users.export": "Exported users CSV",
  "broadcast.send": "Sent broadcast",
};

export function AuditPanel() {
  const [items, setItems] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: AdminAuditEntry[] }>("/admin/audit", { params: { limit: 100 } })
      .then(({ data }) => setItems(Array.isArray(data.items) ? data.items : []))
      .catch(notifyApiError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>;

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((a) => (
        <li key={a._id} className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="text-xs">
              <span className="font-medium">{LABELS[a.action] ?? a.action}</span>
              {a.targetEmail && (
                <span className="text-muted-foreground"> → {a.targetEmail}</span>
              )}
            </p>
            <p className="mt-0.5 font-mono text-2xs text-muted-foreground">
              by {a.adminEmail ?? "system"}
              {a.ip ? ` · ${a.ip}` : ""}
              {a.meta && Object.keys(a.meta).length
                ? ` · ${JSON.stringify(a.meta).slice(0, 120)}`
                : ""}
            </p>
          </div>
          <span className="shrink-0 font-mono text-2xs text-muted-foreground">
            {formatRelativeTime(a.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
