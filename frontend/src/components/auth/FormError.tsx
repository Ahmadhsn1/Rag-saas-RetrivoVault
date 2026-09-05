import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

/** Linked error summary — focused after a failed submit (pro-rules a11y). */
export function FormError({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
