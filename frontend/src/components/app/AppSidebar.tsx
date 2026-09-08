import { NavLink } from "react-router-dom";
import {
  MessagesSquare,
  FileText,
  FolderTree,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/app/UserMenu";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/app", label: "Chat", icon: MessagesSquare, end: true },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/collections", label: "Collections", icon: FolderTree },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const { collections, activeCollectionId, setActiveCollectionId, usage } =
    useAppState();
  const { user } = useAuth();
  const nav =
    user?.role === "admin"
      ? [...NAV, { to: "/app/admin", label: "Admin", icon: ShieldCheck }]
      : NAV;

  const queriesUsed = usage?.current.queries ?? 0;
  const queriesLimit = usage?.limits.queriesPerMonth ?? 100;
  const planLabel = usage?.plan ?? "free";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="px-3">
        <ul className="space-y-0.5">
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
        <p className="px-2.5 py-1.5 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
          Collections
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => setActiveCollectionId(null)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border-l-2 px-2.5 py-1.5 text-left text-sm transition-colors",
                !activeCollectionId
                  ? "border-primary bg-sidebar-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-sidebar-accent",
              )}
            >
              All documents
            </button>
          </li>
          {collections.map((c) => (
            <li key={c._id}>
              <button
                onClick={() => setActiveCollectionId(c._id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md border-l-2 px-2.5 py-1.5 text-left text-sm transition-colors",
                  activeCollectionId === c._id
                    ? "border-primary bg-sidebar-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-sidebar-accent",
                )}
              >
                <span className="truncate font-mono text-xs">{c.name}</span>
                <span className="shrink-0 font-mono text-2xs text-muted-foreground">
                  {c.documentCount ?? 0}
                </span>
              </button>
            </li>
          ))}
          {collections.length === 0 && (
            <li className="px-2.5 py-1.5 text-2xs text-muted-foreground">
              None yet.
            </li>
          )}
        </ul>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <NavLink
          to="/app/settings?tab=billing"
          onClick={onClose}
          className="mb-3 block rounded-md px-1 py-1 transition-colors hover:bg-sidebar-accent"
        >
          <div className="mb-1.5 flex items-center justify-between font-mono text-2xs text-muted-foreground">
            <span className="uppercase">{planLabel} · questions</span>
            <span>
              {queriesUsed} / {queriesLimit}
            </span>
          </div>
          <Progress
            value={Math.min((queriesUsed / queriesLimit) * 100, 100)}
          />
        </NavLink>
        <UserMenu />
      </div>
    </div>
  );
}
