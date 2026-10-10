import type { Variants } from "framer-motion";

/**
 * The product's whole motion vocabulary: content settles into place once as it
 * scrolls into view. Nothing follows the cursor, tilts, or loops.
 * Consumers also honour `useReducedMotion()` — these describe the full-motion path.
 */

// Fast start, gentle settle.
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** A single block fading up a few pixels. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

/** Container that releases its `RevealItem` children one after another. */
export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Child of a `staggerContainer`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/** Fire once, a little before the block is centred. */
export const viewportOnce = { once: true, amount: 0.2 } as const;
