import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Gift,
  Ban,
  LogOut,
  KeyRound,
  Mail,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { formatRelativeTime } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import type { AdminUserDetail, AdminSession } from "@/types/api";
import { LiveDot } from "./shared";
import { fmtDuration } from "./format";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function UserDrawer({
  userId,
  isRoot,
  onOpenChange,
  onChanged,
}: {
  userId: string | null;
  isRoot: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [grantPlan, setGrantPlan] = useState<"pro" | "max">("pro");
  const [grantDays, setGrantDays] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        api.get<AdminUserDetail>(`/admin/users/${userId}`),
        api.get<{ items: AdminSession[] }>("/admin/sessions", {
          params: { userId, limit: 25 },
        }),
      ]);
      setDetail(d.data);
      setSessions(Array.isArray(s.data.items) ? s.data.items : []);
    } catch (err) {
      notifyApiError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setDetail(null);
    setSessions([]);
    setTempPw(null);
    setGrantDays("");
    setGrantReason("");
    if (userId) void load();
  }, [userId, load]);

  const act = async (key: string, fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(key);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      await load();
      onChanged();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setBusy(null);
    }
  };

  const u = detail?.user;
  const comp = u?.comp?.plan ? u.comp : null;
  const suspended = Boolean(u?.suspendedAt);

  return (
    <Sheet open={!!userId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <span className="truncate">{u?.name ?? "User"}</span>
            {u?.role === "admin" && <Badge variant="primary">admin</Badge>}
            {u?.isRootAdmin && <Badge variant="warn">root</Badge>}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2 font-mono text-2xs">
            <span className="truncate">{u?.email}</span>
            {detail && (
              <span className="flex items-center gap-1">
                <LiveDot on={detail.presence.online} />
                {detail.presence.online ? "online" : "offline"}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading && !detail ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !detail || !u ? (
            <p className="p-6 text-sm text-muted-foreground">Nothing to show.</p>
          ) : (
            <div className="space-y-6 p-6">
              {suspended && (
                <div className="rounded-md border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
                  Suspended {u.suspendedAt && formatRelativeTime(u.suspendedAt)}
                  {u.suspendedReason ? ` — ${u.suspendedReason}` : ""}
                </div>
              )}

              <Section title="Overview">
                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div>
                    <p className="text-lg font-semibold">{detail.stats.documents}</p>
                    <p className="text-2xs text-muted-foreground">documents</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{detail.stats.chats}</p>
                    <p className="text-2xs text-muted-foreground">chats</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{detail.stats.queries}</p>
                    <p className="text-2xs text-muted-foreground">queries</p>
                  </div>
                </div>
                <p className="mt-3 font-mono text-2xs text-muted-foreground">
                  Joined {formatRelativeTime(u.createdAt)} · stored plan{" "}
                  <span className="text-foreground">{u.plan}</span>
                  {detail.presence.lastSeenAt &&
                    ` · last seen ${formatRelativeTime(detail.presence.lastSeenAt)}`}
                </p>
              </Section>

              <Section title="Plan & access">
                {comp ? (
                  <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 p-3">
                    <div className="text-xs">
                      <p className="font-medium">
                        Complimentary {comp.plan?.toUpperCase()}
                      </p>
                      <p className="font-mono text-2xs text-muted-foreground">
                        {comp.expiresAt
                          ? `expires ${formatRelativeTime(comp.expiresAt)}`
                          : "no expiry"}
                        {comp.reason ? ` · ${comp.reason}` : ""}
                      </p>
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="outline" disabled={busy === "revoke"}>
                          Revoke
                        </Button>
                      }
                      title="Revoke complimentary access?"
                      description={`${u.name} moves back to their billing plan.`}
                      confirmLabel="Revoke"
                      onConfirm={() =>
                        act(
                          "revoke",
                          () => api.delete(`/admin/users/${userId}/grant`),
                          "Grant revoked",
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-3 rounded-md border border-border p-3">
                    <div className="flex gap-2">
                      {(["pro", "max"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setGrantPlan(p)}
                          className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-2xs uppercase transition-colors ${
                            grantPlan === p
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="grant-days" className="text-2xs">
                          Days (blank = forever)
                        </Label>
                        <Input
                          id="grant-days"
                          value={grantDays}
                          onChange={(e) => setGrantDays(e.target.value.replace(/\D/g, ""))}
                          placeholder="30"
                          className="h-8"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="grant-reason" className="text-2xs">
                          Reason
                        </Label>
                        <Input
                          id="grant-reason"
                          value={grantReason}
                          onChange={(e) => setGrantReason(e.target.value)}
                          placeholder="beta tester"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={busy === "grant"}
                      onClick={() =>
                        act(
                          "grant",
                          () =>
                            api.post(`/admin/users/${userId}/grant`, {
                              plan: grantPlan,
                              days: grantDays ? Number(grantDays) : null,
                              reason: grantReason || undefined,
                            }),
                          `Granted ${grantPlan.toUpperCase()}`,
                        )
                      }
                    >
                      {busy === "grant" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Gift className="h-4 w-4" />
                      )}
                      Grant free access
                    </Button>
                  </div>
                )}
              </Section>

              <Section title={`Sessions (${sessions.length})`}>
                <ul className="divide-y divide-border rounded-md border border-border">
                  {sessions.length === 0 && (
                    <li className="p-3 text-2xs text-muted-foreground">No sessions recorded.</li>
                  )}
                  {sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 p-2.5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-xs">
                          <LiveDot on={s.online} />
                          {s.device ?? "Unknown device"}
                        </p>
                        <p className="font-mono text-2xs text-muted-foreground">
                          {s.ip ?? "no ip"} · {formatRelativeTime(s.startedAt)} ·{" "}
                          {fmtDuration(s.durationMs)}
                          {s.endReason ? ` · ${s.endReason}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Recent activity">
                <ul className="divide-y divide-border">
                  {detail.activity.length === 0 && (
                    <li className="py-2 text-2xs text-muted-foreground">Nothing yet.</li>
                  )}
                  {detail.activity.slice(0, 12).map((a) => (
                    <li
                      key={a._id}
                      className="flex items-center justify-between gap-2 py-1.5 font-mono text-2xs"
                    >
                      <span className="truncate">{a.action}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatRelativeTime(a.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              {!u.isRootAdmin && (
                <Section title="Danger zone">
                  <div className="flex flex-wrap gap-2">
                    {suspended ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === "unsuspend"}
                        onClick={() =>
                          act(
                            "unsuspend",
                            () => api.post(`/admin/users/${userId}/unsuspend`),
                            "Reinstated",
                          )
                        }
                      >
                        <ShieldCheck className="h-4 w-4" /> Unsuspend
                      </Button>
                    ) : (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="destructive">
                            <Ban className="h-4 w-4" /> Suspend
                          </Button>
                        }
                        title={`Suspend ${u.name}?`}
                        description="They're signed out everywhere and can't sign back in until reinstated."
                        confirmLabel="Suspend"
                        onConfirm={() =>
                          act(
                            "suspend",
                            () =>
                              api.post(`/admin/users/${userId}/suspend`, {
                                reason: "Suspended from admin console",
                              }),
                            "Suspended",
                          )
                        }
                      />
                    )}

                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="outline">
                          <LogOut className="h-4 w-4" /> Force logout
                        </Button>
                      }
                      title="Sign this user out everywhere?"
                      description="Every active session is revoked. They can sign back in normally."
                      confirmLabel="Force logout"
                      onConfirm={() =>
                        act(
                          "logout",
                          () => api.post(`/admin/users/${userId}/logout`),
                          "Signed out everywhere",
                        )
                      }
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === "reset"}
                      onClick={() =>
                        act(
                          "reset",
                          () => api.post(`/admin/users/${userId}/send-reset`),
                          "Reset link sent",
                        )
                      }
                    >
                      <Mail className="h-4 w-4" /> Email reset link
                    </Button>

                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="outline">
                          <KeyRound className="h-4 w-4" /> Temp password
                        </Button>
                      }
                      title="Issue a one-time password?"
                      description="Their current password stops working immediately. They'll set a new one on next sign-in."
                      confirmLabel="Generate"
                      onConfirm={async () => {
                        try {
                          const { data } = await api.post<{ tempPassword: string }>(
                            `/admin/users/${userId}/temp-password`,
                          );
                          setTempPw(data.tempPassword);
                          await load();
                          onChanged();
                        } catch (err) {
                          notifyApiError(err);
                        }
                      }}
                    />

                    {isRoot && (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="outline">
                            {u.role === "admin" ? (
                              <>
                                <ShieldOff className="h-4 w-4" /> Revoke admin
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4" /> Make admin
                              </>
                            )}
                          </Button>
                        }
                        title={
                          u.role === "admin"
                            ? `Remove admin access from ${u.name}?`
                            : `Grant admin access to ${u.name}?`
                        }
                        description={
                          u.role === "admin"
                            ? "They lose access to this console."
                            : "They gain full access to this admin console."
                        }
                        confirmLabel={u.role === "admin" ? "Revoke" : "Promote"}
                        onConfirm={() =>
                          act(
                            "role",
                            () =>
                              api.post(`/admin/users/${userId}/role`, {
                                role: u.role === "admin" ? "user" : "admin",
                              }),
                            "Role updated",
                          )
                        }
                      />
                    )}
                  </div>
                </Section>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>

      <Dialog open={!!tempPw} onOpenChange={(o) => !o && setTempPw(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>One-time password</DialogTitle>
            <DialogDescription>
              Shown once. Send it to the user over a trusted channel — they must
              change it on next sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 select-all rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm">
              {tempPw}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(tempPw ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* clipboard blocked */
                }
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
