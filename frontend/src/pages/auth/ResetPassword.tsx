import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1600);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something strong.">
      {!token ? (
        <p className="text-sm text-muted-foreground">
          This link is missing its token. Request a{" "}
          <Link to="/forgot-password" className="text-primary hover:underline">
            new reset link
          </Link>
          .
        </p>
      ) : done ? (
        <p className="rounded-md border border-ok/30 bg-ok/10 p-4 text-sm text-ok">
          Password updated. Redirecting you to sign in…
        </p>
      ) : (
        <form onSubmit={submit} noValidate>
          <FormError message={error} />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
