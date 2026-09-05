import { toast } from "sonner";
import { apiErrorCode, apiErrorMessage } from "@/lib/api";

/**
 * Toast an API error, upgrading quota/feature-lock errors into an actionable
 * prompt that deep-links to the billing settings.
 */
export function notifyApiError(err: unknown, fallback = "Something went wrong") {
  const code =
    apiErrorCode(err) ??
    (err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code)
      : null);
  const message = apiErrorMessage(err, fallback);

  if (code === "quota_exceeded" || code === "feature_locked") {
    toast.error(message, {
      action: {
        label: "Upgrade",
        onClick: () => {
          window.location.href = "/app/settings?tab=billing";
        },
      },
      duration: 8000,
    });
    return;
  }
  toast.error(message);
}
