import { useState } from "react";
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import type { ChatSessionSummary } from "@/types/api";

interface SessionRailProps {
  sessions: ChatSessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function SessionRail({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: SessionRailProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (s: ChatSessionSummary) => {
    setEditingId(s._id);
    setDraft(s.title);
  };
  const commit = (id: string) => {
    const t = draft.trim();
    if (t) onRename(id, t);
    setEditingId(null);
  };

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface/30">
      <div className="p-3">
        <Button variant="outline" size="sm" className="w-full" onClick={onNew}>
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {sessions.map((s) => (
          <div
            key={s._id}
            className={cn(
              "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
              activeId === s._id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60",
            )}
          >
            {editingId === s._id ? (
              <>
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit(s._id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-6 px-1.5 text-xs"
                  aria-label="Chat title"
                />
                <button
                  onClick={() => commit(s._id)}
                  className="shrink-0 rounded p-0.5 text-ok"
                  aria-label="Save title"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground"
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelect(s._id)}
                  onDoubleClick={() => startEdit(s)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <MessageSquare
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{s.title}</span>
                </button>
                <button
                  onClick={() => startEdit(s)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                  aria-label={`Rename ${s.title}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <ConfirmDialog
                  title="Delete chat?"
                  description={`"${s.title}" and its history will be permanently removed.`}
                  confirmLabel="Delete"
                  onConfirm={() => onDelete(s._id)}
                  trigger={
                    <button
                      className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                      aria-label={`Delete ${s.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  }
                />
              </>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="px-2 py-4 text-center text-2xs text-muted-foreground">
            No chats yet
          </p>
        )}
      </div>
    </div>
  );
}
