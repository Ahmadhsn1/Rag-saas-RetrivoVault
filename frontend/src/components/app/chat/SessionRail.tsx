import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import type { ChatSessionSummary } from "@/types/api";

interface SessionRailProps {
  sessions: ChatSessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function SessionRail({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SessionRailProps) {
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
              "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              activeId === s._id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60",
            )}
          >
            <button
              onClick={() => onSelect(s._id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{s.title}</span>
            </button>
            <ConfirmDialog
              title="Delete chat?"
              description={`"${s.title}" and its history will be permanently removed.`}
              confirmLabel="Delete"
              onConfirm={() => onDelete(s._id)}
              trigger={
                <button
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  aria-label={`Delete ${s.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              }
            />
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
