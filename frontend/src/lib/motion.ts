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
    scrollTrigger: { trigger: targets as gsap.DOMTarget, start, once: true },
  });
}

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

/** Gentle parallax on a decorative layer. Never use on text or controls. */
export function parallax(layer: Element, distance = 60) {
  if (prefersReducedMotion()) return;
  return gsap.to(layer, {
    yPercent: distance / 10,
    ease: "none",
    scrollTrigger: {
      trigger: (layer as HTMLElement).parentElement ?? layer,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.5,
    },
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
