import { useState, type FormEvent } from "react";
import { Loader2, KeyRound, Check } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const paid = user?.plan !== "free";

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === user?.name) return;
    setSavingName(true);
    try {
      await api.patch("/account/profile", { name: name.trim() });
      await refreshUser();
      toast.success("Name updated.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const saveKey = async () => {
    if (geminiKey.trim().length < 20) return;
    setSavingKey(true);
    try {
      await api.put("/account/gemini-key", { key: geminiKey.trim() });
      await refreshUser();
      setGeminiKey("");
      toast.success("Gemini key saved. Your requests now use your own quota.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingKey(false);
    }
  };

  const clearKey = async () => {
    setSavingKey(true);
    try {
      await api.delete("/account/gemini-key");
      await refreshUser();
      toast.success("Gemini key removed.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveName} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Name</Label>
              <Input
                id="s-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Email</Label>
              <div className="flex items-center gap-2">
                <Input id="s-email" value={user?.email ?? ""} readOnly />
                {user?.emailVerified ? (
                  <Badge variant="ok">verified</Badge>
                ) : (
                  <Badge variant="warn">unverified</Badge>
                )}
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={savingName || name === user?.name || !name.trim()}
            >
              {savingName && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Bring your own Gemini key
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!paid ? (
            <p className="text-sm text-muted-foreground">
              Using your own Google Gemini API key runs requests against your
              quota instead of the shared one. Available on Pro and Max.
            </p>
          ) : user?.hasGeminiKey ? (
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm text-ok">
                <Check className="h-4 w-4" /> A key is configured.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={clearKey}
                disabled={savingKey}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="AIza…"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                aria-label="Gemini API key"
              />
              <Button
                size="sm"
                onClick={saveKey}
                disabled={savingKey || geminiKey.trim().length < 20}
              >
                {savingKey && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
