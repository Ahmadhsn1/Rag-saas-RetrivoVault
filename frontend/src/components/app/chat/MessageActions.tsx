import { useState } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function MessageActions({
  content,
  sessionId,
  messageId,
  initial,
}: {
  content: string;
  sessionId: string | null;
  messageId?: string;
  initial?: "up" | "down" | null;
}) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(initial ?? null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const rate = async (next: "up" | "down") => {
    if (!sessionId || !messageId) return;
    const value = rating === next ? null : next;
    setRating(value);
    try {
      await api.post(
        `/chat/${sessionId}/messages/${messageId}/feedback`,
        { rating: value },
      );
    } catch {
      /* non-critical */
    }
  };

  return (
    <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100 has-[button[data-on=true]]:opacity-100">
      <button
        onClick={copy}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-2xs text-muted-foreground hover:text-foreground"
        aria-label="Copy answer"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "copied" : "copy"}
      </button>
      {messageId && (
        <>
          <button
            data-on={rating === "up"}
            onClick={() => rate("up")}
            className={cn(
              "rounded px-1 py-0.5 hover:text-foreground",
              rating === "up" ? "text-ok" : "text-muted-foreground",
            )}
            aria-label="Good answer"
          >
            <ThumbsUp className="h-3 w-3" />
          </button>
          <button
            data-on={rating === "down"}
            onClick={() => rate("down")}
            className={cn(
              "rounded px-1 py-0.5 hover:text-foreground",
              rating === "down" ? "text-destructive" : "text-muted-foreground",
            )}
            aria-label="Bad answer"
          >
            <ThumbsDown className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}
