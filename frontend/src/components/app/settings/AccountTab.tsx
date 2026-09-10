import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MailWarning, Monitor, BellRing } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import {
  enablePush,
  disablePush,
  getPushConfig,
  isPushSubscribed,
  pushSupported,
} from "@/lib/push";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SessionInfo } from "@/types/api";

export function AccountTab() {
  const { user, logout, refreshUser, changePassword } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent.");
      await refreshUser().catch(() => {});
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/account", { data: { password } });
      toast.success("Account deleted.");
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {user && !user.emailVerified && (
        <Card className="border-warn/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warn">
              <MailWarning className="h-4 w-4" aria-hidden="true" />
              Verify your email
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Check your inbox for the confirmation link.
            </p>
            <Button size="sm" variant="outline" onClick={resend} disabled={resending}>
              {resending && <Loader2 className="h-4 w-4 animate-spin" />}
              Resend
            </Button>
          </CardContent>
        </Card>
      )}

      <ChangePasswordCard onChange={changePassword} />

      <PushCard />

      <SessionsCard
        onSignOut={async (everywhere) => {
          setSigningOut(true);
          await logout(everywhere);
          navigate("/login", { replace: true });
        }}
        signingOut={signingOut}
      />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Permanently removes your account, documents, chunks, chats and keys.
            This cannot be undone.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  Type <span className="font-mono text-foreground">DELETE</span> and
                  enter your password to confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-text">Confirmation</Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass">Password</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={confirmText !== "DELETE" || !password || deleting}
                  onClick={del}
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete forever
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordCard({
  onChange,
}: {
  onChange: (current: string, next: string) => Promise<void>;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = current && next.length >= 8 && next === confirm;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valid) return;
            setBusy(true);
            try {
              await onChange(current, next);
              toast.success("Password changed. Other devices were signed out.");
              setCurrent("");
              setNext("");
              setConfirm("");
            } catch (err) {
              toast.error(apiErrorMessage(err, "Couldn't change password"));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cp-current">Current password</Label>
            <Input
              id="cp-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-next">New password</Label>
            <Input
              id="cp-next"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-confirm">Confirm new password</Label>
            <Input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" disabled={!valid || busy} className="w-fit">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PushCard() {
  const [available, setAvailable] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!pushSupported()) return;
      const config = await getPushConfig();
      if (!alive) return;
      setAvailable(config.enabled);
      if (config.enabled) setSubscribed(await isPushSubscribed());
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return null;

  const toggle = async (want: boolean) => {
    setBusy(true);
    try {
      if (want) {
        const ok = await enablePush();
        setSubscribed(ok);
        toast[ok ? "success" : "error"](
          ok ? "Push notifications on for this device." : "Permission denied.",
        );
      } else {
        await disablePush();
        setSubscribed(false);
        toast.success("Push notifications off for this device.");
      }
    } catch {
      toast.error("Couldn't update push notifications.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-4 w-4" /> Push notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Get product updates and important announcements as browser notifications
          on this device.
        </p>
        <Switch checked={subscribed} onCheckedChange={toggle} disabled={busy} />
      </CardContent>
    </Card>
  );
}

function SessionsCard({
  onSignOut,
  signingOut,
}: {
  onSignOut: (everywhere: boolean) => Promise<void>;
  signingOut: boolean;
}) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ items: SessionInfo[] }>("/account/sessions");
      setSessions(Array.isArray(data.items) ? data.items : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (family: string) => {
    setSessions((xs) => xs.filter((s) => s.family !== family));
    try {
      await api.delete(`/account/sessions/${family}`);
      toast.success("Device signed out.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
      void load();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-4 w-4" /> Active devices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other sessions.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm">
                    {s.device ?? "Unknown device"}
                    {s.current && (
                      <span className="font-mono text-2xs text-primary">this device</span>
                    )}
                    {s.online && !s.current && (
                      <span className="font-mono text-2xs text-ok">online</span>
                    )}
                  </p>
                  <p className="font-mono text-2xs text-muted-foreground">
                    {s.ip ?? "no ip"} · last active {formatRelativeTime(s.lastSeenAt)}
                  </p>
                </div>
                {!s.current && (
                  <Button size="sm" variant="ghost" onClick={() => revoke(s.family)}>
                    Sign out
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Sign out — this device, or everywhere at once.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={signingOut}
              onClick={() => onSignOut(false)}
            >
              Sign out
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={signingOut}
              onClick={() => onSignOut(true)}
            >
              Sign out all
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
