import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * When an admin has issued a temporary password, the user lands here and can't
 * use the app until they set a new one. Rendered inside the authed shell.
 */
export function MustChangePasswordGate() {
  const { user, changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user?.mustChangePassword) return null;

  const valid = current && next.length >= 8 && next === confirm;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await changePassword(current, next);
      toast.success("Password updated.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't update password"));
      setBusy(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        className="max-w-sm [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-primary" />
              Set a new password
            </DialogTitle>
            <DialogDescription className="text-xs">
              An administrator issued you a temporary password. Choose your own to
              continue.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="mcp-current">Temporary password</Label>
              <Input
                id="mcp-current"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcp-next">New password</Label>
              <Input
                id="mcp-next"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcp-confirm">Confirm new password</Label>
              <Input
                id="mcp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm && confirm !== next && (
                <p className="font-mono text-2xs text-destructive">
                  Passwords don't match
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={!valid || busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
