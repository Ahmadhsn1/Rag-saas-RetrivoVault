import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent — check your inbox.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-warn/30 bg-warn/10 px-4 py-2 text-sm">
      <MailWarning className="h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
      <p className="flex-1 text-warn">
        Verify your email to secure your account.
      </p>
      <button
        onClick={resend}
        disabled={sending}
        className="font-mono text-2xs uppercase tracking-wide text-warn underline underline-offset-2 disabled:opacity-50"
      >
        {sending ? "sending…" : "resend"}
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded p-1 text-warn/70 hover:text-warn"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
