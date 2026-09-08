import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/app/settings/ProfileTab";
import { BillingTab } from "@/components/app/settings/BillingTab";
import { NotificationsTab } from "@/components/app/settings/NotificationsTab";
import { ApiKeysTab } from "@/components/app/settings/ApiKeysTab";
import { WebhooksTab } from "@/components/app/settings/WebhooksTab";
import { ActivityTab } from "@/components/app/settings/ActivityTab";
import { AccountTab } from "@/components/app/settings/AccountTab";

const TABS = [
  "profile",
  "billing",
  "notifications",
  "keys",
  "webhooks",
  "activity",
  "account",
] as const;
type Tab = (typeof TABS)[number];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "profile";
  const active = TABS.includes(tab) ? tab : "profile";

  return (
    <div className="mx-auto h-full max-w-3xl overflow-y-auto px-4 py-6 sm:px-6">
      <h2 className="mb-6 font-mono text-lg font-semibold">Settings</h2>

      <Tabs
        value={active}
        onValueChange={(v) => setParams({ tab: v }, { replace: true })}
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Plan &amp; usage</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="keys">API keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="keys">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
