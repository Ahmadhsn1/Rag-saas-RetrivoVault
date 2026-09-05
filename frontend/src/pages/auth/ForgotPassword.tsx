import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
    >
      {sent ? (
        <div className="rounded-md border border-border bg-surface p-4 text-sm">
          <MailCheck className="mb-2 h-5 w-5 text-ok" aria-hidden="true" />
          If an account exists for <span className="font-mono">{email}</span>,
          a reset link is on its way. It expires in one hour.
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <FormError message={error} />
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
