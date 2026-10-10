import { useEffect, useState } from "react";
import { Webhook as WebhookIcon, Plus, Trash2, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import type { Webhook } from "@/types/api";

export function WebhooksTab() {
  const { user } = useAuth();
  // Resolve from server-computed entitlements (a Max trial unlocks this too).
  const locked = !user?.features?.apiAccess;
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [reveal, setReveal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    api
      .get<{ webhooks: Webhook[]; events: string[] }>("/webhooks")
      .then(({ data }) => {
        setHooks(data.webhooks);
        setEvents(data.events);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locked]);

  const create = async () => {
    if (!url.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post<{ webhook: Webhook; secret: string }>(
        "/webhooks",
        { url: url.trim() },
      );
      setHooks((h) => [data.webhook, ...h]);
      setReveal(data.secret);
      setUrl("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    setHooks((h) => h.map((w) => (w._id === id ? { ...w, active } : w)));
    try {
      await api.patch(`/webhooks/${id}`, { active });
    } catch {
      void 0;
    }
  };

  const remove = async (id: string) => {
    await api.delete(`/webhooks/${id}`);
    setHooks((h) => h.filter((w) => w._id !== id));
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (locked) {
    return (
      <EmptyState
        icon={WebhookIcon}
        title="Webhooks are a Max feature"
        description="Get a signed POST to your endpoint when documents finish processing or a chat is answered."
      />
    );
  }

  return (
    <div className="space-y-6">
      {reveal && (
        <div className="rounded-lg border border-ok/30 bg-ok/5 p-4">
          <p className="text-sm font-medium">
            Signing secret — copy it now, it won't be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 font-mono text-xs">
              {reveal}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(reveal);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setReveal(null)}>
            Done
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add an endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.com/retrivo-hook"
              aria-label="Webhook URL"
            />
            <Button size="sm" onClick={create} disabled={creating || !url.trim()}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
          <p className="font-mono text-2xs text-muted-foreground">
            events: {events.join(" · ")}
          </p>
        </CardContent>
      </Card>

      {hooks.length === 0 ? (
        <EmptyState icon={WebhookIcon} title="No endpoints yet" />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {hooks.map((h) => (
            <li key={h._id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs">{h.url}</p>
                <p className="font-mono text-2xs text-muted-foreground">
                  {h.lastDeliveryAt
                    ? `last ${h.lastStatus ?? "?"} · ${formatRelativeTime(h.lastDeliveryAt)}`
                    : "no deliveries yet"}
                  {h.failureCount > 0 && ` · ${h.failureCount} failures`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!h.active && <Badge variant="warn">disabled</Badge>}
                <Switch
                  checked={h.active}
                  onCheckedChange={(v) => toggle(h._id, v)}
                  aria-label="Enable webhook"
                />
                <ConfirmDialog
                  title="Delete webhook?"
                  description={`No more events will be sent to ${h.url}.`}
                  confirmLabel="Delete"
                  onConfirm={() => remove(h._id)}
                  trigger={
                    <button
                      className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                      aria-label="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
