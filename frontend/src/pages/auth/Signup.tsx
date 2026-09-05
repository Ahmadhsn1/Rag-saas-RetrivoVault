import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Enter your name.");
    if (!emailRe.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");

    setBusy(true);
    try {
      await signup(form.name.trim(), form.email, form.password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Sign up failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your vault"
      subtitle="Your documents stay scoped to your account."
    >
      <form onSubmit={submit} noValidate>
        <FormError message={error} />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={update("name")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update("email")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={update("password")}
            />
            <p className="text-2xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
