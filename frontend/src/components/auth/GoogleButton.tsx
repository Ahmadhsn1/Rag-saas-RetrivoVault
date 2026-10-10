import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (opts: {
        client_id: string;
        callback: (res: { credential?: string }) => void;
      }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in failed to load"));
    document.head.appendChild(script);
  });
}

/**
 * "Continue with Google". Renders nothing unless the deployment has a Google
 * client id configured (GET /public/config).
 */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const slot = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve(api.get<{ googleClientId: string | null }>("/public/config"))
      .then((res) => alive && setClientId(res?.data?.googleClientId ?? null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    loadGoogleScript()
      .then(() => {
        if (!alive || !slot.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!credential) return;
            try {
              await loginWithGoogle(credential);
              navigate("/app", { replace: true });
            } catch (err) {
              onError(apiErrorMessage(err, "Google sign-in failed"));
            }
          },
        });
        window.google.accounts.id.renderButton(slot.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [clientId, loginWithGoogle, navigate, onError]);

  if (!clientId) return null;

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <div ref={slot} className="flex justify-center" />
    </div>
  );
}
