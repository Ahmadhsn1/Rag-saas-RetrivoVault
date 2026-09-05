import { PanelLeft, Command } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/context/AppContext";

const TITLES: Record<string, string> = {
  "/app": "Chat",
  "/app/documents": "Documents",
  "/app/collections": "Collections",
  "/app/settings": "Settings",
};

export function AppTopbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const { activeCollection } = useAppState();
  const title = TITLES[pathname] ?? "Vault";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <button
        onClick={onMenu}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      <h1 className="font-mono text-sm font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {activeCollection && (
          <Badge variant="primary" className="hidden sm:inline-flex">
            {activeCollection.name}
          </Badge>
        )}
        <Badge className="hidden md:inline-flex">gemini-2.5-flash</Badge>
        <button
          disabled
          title="Coming soon"
          className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-2xs text-muted-foreground opacity-60 sm:flex"
        >
          <Command className="h-3 w-3" />K
        </button>
      </div>
    </header>
  );
}
