import { useEffect, useState } from "react";
import { Copy, Loader2, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { EmptyState } from "@/components/app/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound } from "lucide-react";
import type { ApiKey } from "@/types/api";

export function ApiKeysTab() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [reveal, setReveal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const locked = user?.plan !== "max";

  const load = () =>
    api
      .get<{ keys: ApiKey[] }>("/keys")
      .then(({ data }) => setKeys(data.keys))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    void load();
  }, [locked]);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post<{ key: ApiKey; secret: string }>("/keys", {
        name: name.trim(),
      });
      setKeys((k) => [data.key, ...k]);
      setReveal(data.secret);
      setName("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    await api.delete(`/keys/${id}`);
    setKeys((k) => k.filter((x) => x._id !== id));
    toast.success("Key revoked.");
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (locked) {
    return (
      <EmptyState
        icon={KeyRound}
        title="API keys are a Max feature"
        description="Upgrade to Max to create personal API keys and call the Retrivo API from your own scripts."
      />
    );
  }

  return (
    <div className="space-y-6">
      {reveal && (
        <div className="rounded-lg border border-ok/30 bg-ok/5 p-4">
          <p className="text-sm font-medium">Copy your key now — it won't be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 font-mono text-xs">
              {reveal}
            </code>
            <Button
              size="sm"
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
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setReveal(null)}
          >
            Done
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create a key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. laptop-cli"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="API key name"
            />
            <Button size="sm" onClick={create} disabled={creating || !name.trim()}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {keys.length === 0 ? (
        <EmptyState icon={KeyRound} title="No keys yet" />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {keys.map((k) => (
            <li key={k._id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-mono text-sm">{k.name}</p>
                <p className="font-mono text-2xs text-muted-foreground">
                  {k.prefix}··· · created {formatRelativeTime(k.createdAt)} ·{" "}
                  {k.lastUsedAt
                    ? `last used ${formatRelativeTime(k.lastUsedAt)}`
                    : "never used"}
                </p>
              </div>
              <ConfirmDialog
                title="Revoke this key?"
                description={`"${k.name}" will stop working immediately.`}
                confirmLabel="Revoke"
                onConfirm={() => revoke(k._id)}
                trigger={
                  <button
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    aria-label={`Revoke ${k.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
