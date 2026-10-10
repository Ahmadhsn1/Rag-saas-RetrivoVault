import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

/**
 * While the app is open and the tab is visible, ping the server every `intervalMs`
 * so the admin console can show who's online. Pauses on a hidden tab, fires once
 * immediately on becoming visible again. Silent on failure.
 */
export function usePresenceHeartbeat(intervalMs = 60_000) {
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let stopped = false;

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      api.post("/presence/ping").catch(() => {});
    };

    const start = () => {
      if (timer.current != null) return;
      ping();
      timer.current = window.setInterval(ping, intervalMs);
    };
    const stop = () => {
      if (timer.current != null) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };

    const onVisibility = () => {
      if (stopped) return;
      if (document.visibilityState === "visible") start();
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
