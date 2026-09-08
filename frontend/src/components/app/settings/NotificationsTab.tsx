import { useState } from "react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { NotificationPrefs } from "@/types/api";

const ROWS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  {
    key: "ingestComplete",
    label: "Document processed",
    hint: "When an upload finishes ingesting (or fails).",
  },
  {
    key: "quotaWarnings",
    label: "Quota warnings",
    hint: "When you've used 85% of your monthly questions.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    hint: "A short summary of your vault activity, once a week.",
  },
  {
    key: "productUpdates",
    label: "Product updates",
    hint: "Trial reminders and occasional feature announcements.",
  },
];

export function NotificationsTab() {
  const { user, refreshUser } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    user?.notificationPrefs ?? {
      ingestComplete: true,
      quotaWarnings: true,
      weeklyDigest: false,
      productUpdates: true,
    },
  );
  const [saving, setSaving] = useState(false);

  const toggle = async (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await api.patch("/account/notification-prefs", { [key]: value });
      await refreshUser().catch(() => {});
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email notifications</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.hint}</p>
            </div>
            <Switch
              checked={prefs[row.key]}
              disabled={saving}
              onCheckedChange={(v) => toggle(row.key, v)}
              aria-label={row.label}
            />
          </div>
        ))}
        <p className="pt-3 font-mono text-2xs text-muted-foreground">
          In-app notifications always appear in the bell menu.
        </p>
      </CardContent>
    </Card>
  );
}
