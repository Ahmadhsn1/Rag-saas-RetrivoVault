import { useCallback, useEffect, useState } from "react";
import { Send, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { formatRelativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { Broadcast } from "@/types/api";

const AUDIENCES = [
  ["all", "Everyone"],
  ["plan:free", "Free plan"],
  ["plan:pro", "Pro plan"],
  ["plan:max", "Max plan"],
  ["comped", "Comped"],
  ["online", "Online now"],
  ["active7d", "Active · 7d"],
] as const;

export function BroadcastsPanel() {
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  const [audience, setAudience] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);
  const [push, setPush] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const [h, a] = await Promise.all([
        api.get<{ items: Broadcast[] }>("/admin/broadcasts"),
        api.get<{ pushEnabled: boolean }>("/admin/audiences"),
      ]);
      setHistory(Array.isArray(h.data.items) ? h.data.items : []);
      setPushEnabled(!!a.data.pushEnabled);
    } catch (err) {
      notifyApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let alive = true;
    api
      .get<{ count: number }>("/admin/audience-count", { params: { audience } })
      .then(({ data }) => alive && setCount(data.count))
      .catch(() => alive && setCount(null));
    return () => {
      alive = false;
    };
  }, [audience]);

  const send = async () => {
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    setSending(true);
    try {
      await api.post("/admin/broadcasts", {
        audience,
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || undefined,
        channels: { inApp, email, push: push && pushEnabled },
      });
      toast.success(`Sending to ${count ?? "?"} ${count === 1 ? "person" : "people"}`);
      setTitle("");
      setBody("");
      setLink("");
      setTimeout(() => void loadHistory(), 600);
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <Card className="h-fit space-y-4 p-4">
        <p className="flex items-center gap-2 font-mono text-sm font-semibold">
          <Megaphone className="h-4 w-4" /> New broadcast
        </p>

        <div className="space-y-1.5">
          <Label className="text-2xs uppercase tracking-wide text-muted-foreground">
            Audience
          </Label>
          <div className="flex flex-wrap gap-1">
            {AUDIENCES.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setAudience(key)}
                className={`rounded-md border px-2 py-1 font-mono text-2xs transition-colors ${
                  audience === key
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="font-mono text-2xs text-muted-foreground">
            {count == null ? "…" : `${count} recipient${count === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="b-title">Title</Label>
          <Input
            id="b-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            placeholder="Scheduled maintenance tonight"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-body">Message</Label>
          <Textarea
            id="b-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="We'll be down for ~10 minutes around 02:00 UTC."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-link">Link (optional, in-app path)</Label>
          <Input
            id="b-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/app/settings?tab=billing"
          />
        </div>

        <div className="space-y-2 rounded-md border border-border p-3">
          <ChannelToggle label="In-app notification" checked={inApp} onChange={setInApp} />
          <ChannelToggle label="Email" checked={email} onChange={setEmail} />
          <ChannelToggle
            label={pushEnabled ? "Web push" : "Web push (not configured)"}
            checked={push && pushEnabled}
            onChange={setPush}
            disabled={!pushEnabled}
          />
        </div>

        <Button className="w-full" disabled={sending || (!inApp && !email && !push)} onClick={send}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send broadcast
        </Button>
      </Card>

      <div>
        <p className="mb-3 font-mono text-sm font-semibold">History</p>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : history.length === 0 ? (
          <Card className="p-6 text-center font-mono text-2xs text-muted-foreground">
            No broadcasts sent yet.
          </Card>
        ) : (
          <ul className="space-y-2">
            {history.map((b) => (
              <Card key={b._id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium">{b.title}</p>
                  <Badge variant={b.status === "sent" ? "primary" : "default"}>
                    {b.status}
                  </Badge>
                </div>
                {b.body && (
                  <p className="mt-1 line-clamp-2 text-2xs text-muted-foreground">{b.body}</p>
                )}
                <p className="mt-2 font-mono text-2xs text-muted-foreground/70">
                  {b.audienceLabel ?? b.audience} · {b.recipientCount} recipients ·{" "}
                  in-app {b.delivered.inApp} / email {b.delivered.email} / push{" "}
                  {b.delivered.push} · {formatRelativeTime(b.createdAt)}
                </p>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChannelToggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs">
      <span className={disabled ? "text-muted-foreground/50" : ""}>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}
