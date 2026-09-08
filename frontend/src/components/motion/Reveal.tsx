import {
  Children,
  isValidElement,
  useMemo,
  type ElementType,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  revealVariants,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/lib/anim";

/**
 * Cache `motion(tag)` components so we never recreate one during render
 * (which would remount the subtree). Covers the tags the app actually uses.
 */
const cache = new Map<string, ElementType>();
function motionTag(as: ElementType): ElementType {
  if (typeof as !== "string") return motion.create(as) as ElementType;
  let c = cache.get(as);
  if (!c) {
    c = motion.create(as) as ElementType;
    cache.set(as, c);
  }
  return c;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Wrapper element. Default `div`. */
  as?: ElementType;
  /** Extra delay before this block starts, in seconds. */
  delay?: number;
  /** Fire every time it enters the viewport instead of once. */
  repeat?: boolean;
}

/**
 * Scroll-into-view reveal for a single block. Honours `prefers-reduced-motion`
 * by rendering the final state with no animation.
 */
export function Reveal({
  children,
  className,
  as = "div",
  delay = 0,
  repeat = false,
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = useMemo(() => motionTag(as), [as]);

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={repeat ? { amount: 0.2 } : viewportOnce}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Per-child delay, in seconds. */
  stagger?: number;
  /** Delay before the first child, in seconds. */
  delayChildren?: number;
  repeat?: boolean;
  /**
   * When true (default) each direct child is wrapped in a `RevealItem`. Set
   * false when children render their own `<RevealItem>`.
   */
  wrapChildren?: boolean;
}

/**
 * Container that releases its children one after another as it scrolls in.
 */
export function Stagger({
  children,
  className,
  as = "div",
  stagger = 0.08,
  delayChildren = 0,
  repeat = false,
  wrapChildren = true,
}: StaggerProps) {
  const reduce = useReducedMotion();
  const MotionTag = useMemo(() => motionTag(as), [as]);
  const variants = useMemo(
    () => staggerContainer(stagger, delayChildren),
    [stagger, delayChildren],
  );

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const content = wrapChildren
    ? Children.map(children, (child) =>
        isValidElement(child) ? <RevealItem>{child}</RevealItem> : child,
      )
    : children;

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={repeat ? { amount: 0.15 } : viewportOnce}
    >
      {content}
    </MotionTag>
  );
}

/** One item inside a `Stagger`. */
export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const MotionTag = useMemo(() => motionTag(as), [as]);

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag className={className} variants={staggerItem}>
      {children}
    </MotionTag>
  );
}
