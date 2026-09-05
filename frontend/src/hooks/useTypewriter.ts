import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Types `text` out character-by-character once `start` is true.
 * Respects reduced-motion by rendering the full string immediately.
 */
export function useTypewriter(text: string, start = true, speed = 18) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) {
      setOut(text);
      setDone(true);
      return;
    }
    setOut("");
    setDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, start, speed]);

  return { out, done };
}
