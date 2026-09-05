import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppProvider } from "@/context/AppContext";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
          <AppSidebar />
        </aside>

        {/* Mobile drawer */}
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
          <AppTopbar onMenu={() => setMobileOpen(true)} />
          <main className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
