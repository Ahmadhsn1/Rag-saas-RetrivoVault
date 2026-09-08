import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function TrialBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (
    dismissed ||
    !user ||
    user.plan !== "free" ||
    !user.trialPlan ||
    !user.trialEndsAt
  )
    return null;

  const msLeft = new Date(user.trialEndsAt).getTime() - Date.now();
  if (msLeft <= 0) return null;
  const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  return (
    <div className="flex items-center gap-3 border-b border-primary/25 bg-primary/10 px-4 py-2 text-sm">
      <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="flex-1 text-foreground/90">
        {user.trialPlan.toUpperCase()} trial —{" "}
        <span className="font-medium">
          {days} day{days === 1 ? "" : "s"} left
        </span>
      </p>
      <Link
        to="/app/settings?tab=billing"
        className="font-mono text-2xs uppercase tracking-wide text-primary underline underline-offset-2"
      >
        Keep it
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded p-1 text-primary/70 hover:text-primary"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
