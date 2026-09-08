import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppProvider } from "@/context/AppContext";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { VerifyEmailBanner } from "@/components/app/VerifyEmailBanner";
import { TrialBanner } from "@/components/app/TrialBanner";
import { CommandPalette } from "@/components/app/CommandPalette";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
          <AppSidebar />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border">
              <AppSidebar onClose={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className={cn("flex min-w-0 flex-1 flex-col")}>
          <VerifyEmailBanner />
          <TrialBanner />
          <AppTopbar
            onMenu={() => setMobileOpen(true)}
            onCommand={() => setCmdOpen(true)}
          />
          <main className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </AppProvider>
  );
}
