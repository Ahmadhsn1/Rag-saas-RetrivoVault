import { useEffect, useState } from "react";
import { Check, Copy, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function ShareDialog({
  sessionId,
  shareId: initialShareId,
  open,
  onOpenChange,
  onChange,
}: {
  sessionId: string;
  shareId: string | null | undefined;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChange: (shareId: string | null) => void;
}) {
  const [shareId, setShareId] = useState<string | null>(initialShareId ?? null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setShareId(initialShareId ?? null), [initialShareId, open]);

  const url = shareId ? `${window.location.origin}/s/${shareId}` : "";

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      const { data } = await api.post<{ shareId: string | null }>(
        `/chat/${sessionId}/share`,
        { enabled },
      );
      setShareId(data.shareId);
      onChange(data.shareId);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" aria-hidden="true" />
            Share this chat
          </DialogTitle>
          <DialogDescription>
            Anyone with the link can read this conversation (questions and
            answers only — not your documents). Turn it off any time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
          <span className="text-sm">Public link</span>
          <Switch
            checked={!!shareId}
            disabled={busy}
            onCheckedChange={toggle}
            aria-label="Enable public link"
          />
        </div>

        {shareId && (
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 font-mono text-2xs">
              {url}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              aria-label="Copy link"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
