import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";

/** Scrolls to `#section` when the landing page loads or the hash changes. */
export function HashScroll() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id = hash.slice(1);
    // wait a frame for lazy sections to mount
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    }, 60);
    return () => window.clearTimeout(t);
  }, [hash, pathname]);

  return null;
}
