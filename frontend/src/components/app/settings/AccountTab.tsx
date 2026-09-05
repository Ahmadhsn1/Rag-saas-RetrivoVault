import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AccountTab() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent.");
      await refreshUser().catch(() => {});
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/account", { data: { password } });
      toast.success("Account deleted.");
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {user && !user.emailVerified && (
        <Card className="border-warn/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warn">
              <MailWarning className="h-4 w-4" aria-hidden="true" />
              Verify your email
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Check your inbox for the confirmation link.
            </p>
            <Button size="sm" variant="outline" onClick={resend} disabled={resending}>
              {resending && <Loader2 className="h-4 w-4 animate-spin" />}
              Resend
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Sign out and clear the refresh session on this device.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Permanently removes your account, documents, chunks, chats and keys.
            This cannot be undone.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  Type <span className="font-mono text-foreground">DELETE</span> and
                  enter your password to confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-text">Confirmation</Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass">Password</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={confirmText !== "DELETE" || !password || deleting}
                  onClick={del}
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete forever
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
