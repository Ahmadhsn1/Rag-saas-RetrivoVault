import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  FileCheck2,
  FileX2,
  Gauge,
  Megaphone,
  Sparkles,
  X,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationType } from "@/types/api";

const ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  ingest_complete: FileCheck2,
  ingest_failed: FileX2,
  quota_warning: Gauge,
  trial_ending: Gauge,
  plan_changed: Sparkles,
  welcome: Sparkles,
  system: Bell,
  announcement: Megaphone,
};

export function NotificationBell() {
  const { items, unread, markAllRead, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && unread) void markAllRead();
      }}
    >
      <DropdownMenuTrigger
        className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
            Notifications
          </span>
          {items.length > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="inline-flex items-center gap-1 font-mono text-2xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" />
              mark read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-2xs text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            items.map((n) => {
              const Icon = ICON[n.type] ?? Bell;
              const inner = (
                <div className="flex gap-2.5 px-3 py-2.5">
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      n.type === "ingest_failed"
                        ? "text-destructive"
                        : n.readAt
                          ? "text-muted-foreground"
                          : "text-primary",
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-2xs text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-2xs text-muted-foreground/70">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void dismiss(n._id);
                    }}
                    className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                    aria-label="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
              return (
                <div
                  key={n._id}
                  className={cn(
                    "group border-b border-border last:border-0",
                    !n.readAt && "bg-primary/5",
                  )}
                >
                  {n.link ? (
                    <Link to={n.link} onClick={() => setOpen(false)}>
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
