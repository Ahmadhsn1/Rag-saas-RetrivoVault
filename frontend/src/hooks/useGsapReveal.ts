import { useEffect, type RefObject } from "react";
import { gsap, revealOnScroll } from "@/lib/motion";

/**
 * Reveal a container's matching descendants on scroll with a stagger.
 * Cleans up its own ScrollTriggers on unmount.
 */
export function useGsapReveal(
  ref: RefObject<HTMLElement>,
  childSelector = "> *",
  opts?: { y?: number; stagger?: number },
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = gsap.utils.toArray<HTMLElement>(
      el.querySelectorAll(
        childSelector.replace("> ", ":scope > "),
      ),
    );
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      revealOnScroll(targets, opts);
    }, el);

    return () => ctx.revert();
  }, [ref, childSelector, opts]);
}
