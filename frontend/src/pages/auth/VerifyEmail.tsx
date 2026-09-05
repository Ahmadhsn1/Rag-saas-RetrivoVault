import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";

type State = "loading" | "ok" | "error";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then(async () => {
        setState("ok");
        if (user) await refreshUser().catch(() => {});
      })
      .catch((err) => {
        setState("error");
        setMessage(apiErrorMessage(err, "This link is invalid or has expired."));
      });
  }, [token, user, refreshUser]);

  return (
    <AuthLayout title="Email verification" subtitle="Confirming your address.">
      <div className="rounded-md border border-border bg-surface p-6 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Verifying…</p>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="mx-auto h-7 w-7 text-ok" aria-hidden="true" />
            <p className="mt-3 text-sm">Your email is verified.</p>
            <Button asChild variant="brand" size="sm" className="mt-4">
              <Link to={user ? "/app" : "/login"}>
                {user ? "Go to your vault" : "Sign in"}
              </Link>
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto h-7 w-7 text-destructive" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to={user ? "/app" : "/login"}>Continue</Link>
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
