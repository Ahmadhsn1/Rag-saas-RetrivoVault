import type { Transition, Variants } from "framer-motion";

/**
 * Shared Framer Motion tokens. Framer owns component-level motion — scroll
 * reveals, hover / tap micro-interactions, presence transitions. GSAP still
 * owns the hero headline split, the stat count-up, the pipeline flow and any
 * scrubbed parallax (see `lib/motion.ts`).
 *
 * Every consumer must also honour `useReducedMotion()` — these tokens describe
 * the full-motion path only.
 */

// Expo-out: fast start, long gentle settle. The house easing for reveals.
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
// Symmetric ease for loops / hovers that return.
export const EASE_IN_OUT: [number, number, number, number] = [0.45, 0, 0.55, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 26,
  mass: 0.7,
};

/** A single block sliding + fading + de-blurring into place. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/** Container that releases its `RevealItem` children one after another. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Child of a `staggerContainer`. Slightly shorter throw than a lone block. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/** Default viewport config: fire once, a little before the block is centred. */
export const viewportOnce = { once: true, amount: 0.2 } as const;

/** Hover/tap feel for primary controls. Displacement stays under 2px. */
export const buttonHover = { y: -1.5 } as const;
export const buttonTap = { y: 0, scale: 0.97 } as const;
