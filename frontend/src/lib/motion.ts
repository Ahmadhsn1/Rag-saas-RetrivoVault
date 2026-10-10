import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Word-by-word headline reveal. Expects children spans already split by the caller. */
export function splitReveal(words: Element[], opts: { start?: string } = {}) {
  if (prefersReducedMotion()) {
    gsap.set(words, { opacity: 1, y: 0, rotateX: 0 });
    return;
  }
  return gsap.from(words, {
    opacity: 0,
    y: "0.6em",
    rotateX: -40,
    duration: 0.7,
    ease: "power3.out",
    stagger: 0.055,
    scrollTrigger: opts.start
      ? { trigger: words[0], start: opts.start, once: true }
      : undefined,
  });
}

/** Count a number up when it scrolls into view. */
export function countUp(
  el: HTMLElement,
  to: number,
  { duration = 1.4, format = (n: number) => String(Math.round(n)) } = {},
) {
  if (prefersReducedMotion()) {
    el.textContent = format(to);
    return;
  }
  const obj = { v: 0 };
  return gsap.to(obj, {
    v: to,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = format(obj.v);
    },
    scrollTrigger: { trigger: el, start: "top 90%", once: true },
  });
}

export { gsap, ScrollTrigger };
