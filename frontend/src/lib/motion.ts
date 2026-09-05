import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-triggered stagger reveal for a group of elements.
 * Under reduced-motion the final state is rendered immediately.
 */
export function revealOnScroll(
  targets: gsap.TweenTarget,
  opts: { y?: number; stagger?: number; start?: string } = {},
) {
  const { y = 16, stagger = 0.06, start = "top 85%" } = opts;

  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
    return;
  }

  return gsap.from(targets, {
    opacity: 0,
    y,
    scale: 0.97,
    duration: 0.42,
    ease: "back.out(1.4)",
    stagger: { each: stagger, from: "start" },
    scrollTrigger: {
      trigger: targets as gsap.DOMTarget,
      start,
      once: true,
    },
  });
}

export { gsap, ScrollTrigger };
