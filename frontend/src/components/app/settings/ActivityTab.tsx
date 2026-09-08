import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityEntry } from "@/types/api";

const LABELS: Record<string, string> = {
  "auth.signup": "Account created",
  "auth.login": "Signed in",
  "account.profile_updated": "Profile updated",
  "account.gemini_key_set": "Gemini key added",
  "account.data_exported": "Data exported",
};

export function ActivityTab() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .get<{ items: ActivityEntry[] }>("/account/activity")
      .then(({ data }) => setItems(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exportData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/account/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `retrivo-vault-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Export your data</CardTitle>
          <Button size="sm" variant="outline" onClick={exportData} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download JSON
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Everything Retrivo Vault holds for your account — profile, collections,
            documents (metadata + summaries), and full chat history.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((a) => (
                <li key={a._id} className="flex items-center justify-between py-2.5 first:pt-0">
                  <div>
                    <p className="text-sm">{LABELS[a.action] ?? a.action}</p>
                    {a.detail && (
                      <p className="font-mono text-2xs text-muted-foreground">
                        {a.detail}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-2xs text-muted-foreground">
                    {formatRelativeTime(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
