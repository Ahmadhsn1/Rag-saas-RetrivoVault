import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewPanel } from "./admin/OverviewPanel";
import { UsersPanel } from "./admin/UsersPanel";
import { PresencePanel } from "./admin/PresencePanel";
import { BroadcastsPanel } from "./admin/BroadcastsPanel";
import { AuditPanel } from "./admin/AuditPanel";

const TABS = ["overview", "users", "presence", "broadcasts", "audit"] as const;
type Tab = (typeof TABS)[number];

export default function Admin() {
  const { user, refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  const tab = (params.get("tab") as Tab) || "overview";
  const active = TABS.includes(tab) ? tab : "overview";

  useEffect(() => {
    let alive = true;
    // A cheap authoritative check — the endpoint 403s for non-admins.
    api
      .get("/admin/stats")
      .then(() => {
        if (!alive) return;
        setState("ok");
        void refreshUser().catch(() => {});
      })
      .catch(() => alive && setState("denied"));
    return () => {
      alive = false;
    };
  }, [refreshUser]);

  if (state === "denied" || (user && user.role !== "admin" && state !== "checking")) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-mono text-lg font-semibold">Admin</h2>
      </div>

      {state === "checking" ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <Tabs
          value={active}
          onValueChange={(v) => setParams({ tab: v }, { replace: true })}
        >
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="presence">Presence</TabsTrigger>
            <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewPanel />
          </TabsContent>
          <TabsContent value="users">
            <UsersPanel />
          </TabsContent>
          <TabsContent value="presence">
            <PresencePanel />
          </TabsContent>
          <TabsContent value="broadcasts">
            <BroadcastsPanel />
          </TabsContent>
          <TabsContent value="audit">
            <AuditPanel />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
