import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessagesSquare,
  FileText,
  FolderTree,
  Settings as SettingsIcon,
  Plus,
  UploadCloud,
  CreditCard,
  Search,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAppState } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatSessionSummary } from "@/types/api";

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
  group: string;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const setOpen = onOpenChange;
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const navigate = useNavigate();
  const { collections, setActiveCollectionId } = useAppState();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    api
      .get<{ sessions: ChatSessionSummary[] }>("/chat")
      .then(({ data }) => setSessions(data.sessions))
      .catch(() => {});
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const items = useMemo<Item[]>(() => {
    const actions: Item[] = [
      {
        id: "new-chat",
        label: "New chat",
        icon: Plus,
        group: "Actions",
        run: () => go("/app"),
      },
      {
        id: "upload",
        label: "Upload a document",
        icon: UploadCloud,
        group: "Actions",
        run: () => go("/app/documents"),
      },
      {
        id: "nav-chat",
        label: "Chat",
        icon: MessagesSquare,
        group: "Go to",
        run: () => go("/app"),
      },
      {
        id: "nav-docs",
        label: "Documents",
        icon: FileText,
        group: "Go to",
        run: () => go("/app/documents"),
      },
      {
        id: "nav-col",
        label: "Collections",
        icon: FolderTree,
        group: "Go to",
        run: () => go("/app/collections"),
      },
      {
        id: "nav-billing",
        label: "Plan & usage",
        icon: CreditCard,
        group: "Go to",
        run: () => go("/app/settings?tab=billing"),
      },
      {
        id: "nav-settings",
        label: "Settings",
        icon: SettingsIcon,
        group: "Go to",
        run: () => go("/app/settings"),
      },
    ];
    const cols: Item[] = collections.map((c) => ({
      id: `col-${c._id}`,
      label: c.name,
      hint: "collection",
      icon: FolderTree,
      group: "Collections",
      run: () => {
        setActiveCollectionId(c._id);
        go("/app/documents");
      },
    }));
    const chats: Item[] = sessions.slice(0, 8).map((s) => ({
      id: `chat-${s._id}`,
      label: s.title,
      hint: "chat",
      icon: MessagesSquare,
      group: "Chats",
      run: () => go(`/app?session=${s._id}`),
    }));
    return [...actions, ...cols, ...chats];
  }, [collections, sessions]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? items.filter((i) => i.label.toLowerCase().includes(q))
      : items;
    return list;
  }, [items, query]);

  useEffect(() => setCursor(0), [query]);

  const grouped = useMemo(() => {
    const m = new Map<string, Item[]>();
    filtered.forEach((i) => {
      if (!m.has(i.group)) m.set(i.group, []);
      m.get(i.group)!.push(i);
    });
    return [...m.entries()];
  }, [filtered]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[cursor]?.run();
    }
  };

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to, or run a command…"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-2xs text-muted-foreground">
              No matches
            </p>
          )}
          {grouped.map(([group, groupItems]) => (
            <div key={group} className="mb-1">
              <p className="px-2 py-1 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                {group}
              </p>
              {groupItems.map((item) => {
                flatIndex += 1;
                const active = flatIndex === cursor;
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setCursor(filtered.indexOf(item))}
                    onClick={() => item.run()}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm",
                      active ? "bg-secondary text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint && (
                      <span className="font-mono text-2xs text-muted-foreground/70">
                        {item.hint}
                      </span>
                    )}
                    {active && (
                      <CornerDownLeft className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
