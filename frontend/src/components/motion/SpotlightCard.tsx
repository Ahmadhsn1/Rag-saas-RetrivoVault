import { useMemo, useRef, type ElementType, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/anim";

interface SpotlightCardProps {
  children: ReactNode;
  /** Classes for the inner content wrapper — padding, flex, layout live here. */
  className?: string;
  /** Root element tag. Default `div`. */
  as?: ElementType;
  /** Radius of the cursor glow, px. */
  radius?: number;
  /** Glow colour. Defaults to the indigo interactive token. */
  glow?: string;
  /** Lift the card slightly on hover. Off for dense grids. */
  lift?: boolean;
}

/**
 * A card that lights up under the cursor — a soft radial glow tracks the
 * pointer and the hairline border brightens. Falls back to a plain element
 * (with a CSS border-hover) under `prefers-reduced-motion`.
 */
export function SpotlightCard({
  children,
  className,
  as = "div",
  radius = 340,
  glow = "rgba(108,92,231,0.14)",
  lift = false,
}: SpotlightCardProps) {
  const reduce = useReducedMotion();
  const MotionTag = useMemo(
    () => motion.create(as as ElementType) as ElementType,
    [as],
  );
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(-9999);
  const my = useMotionValue(-9999);
  const opacity = useMotionValue(0);
  const bg = useMotionTemplate`radial-gradient(${radius}px circle at ${mx}px ${my}px, ${glow}, transparent 70%)`;

  const shell =
    "group relative isolate flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-200";

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={cn(shell, "hover:border-border-strong")}>
        <div className={cn("relative h-full", className)}>{children}</div>
      </Tag>
    );
  }

  return (
    <MotionTag
      ref={ref}
      onPointerMove={(e: React.PointerEvent) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
        opacity.set(1);
      }}
      onPointerLeave={() => opacity.set(0)}
      whileHover={lift ? { y: -3 } : undefined}
      transition={springSnappy}
      className={cn(shell, "hover:border-border-strong")}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: bg, opacity }}
      />
      <div className={cn("relative z-10 h-full", className)}>{children}</div>
    </MotionTag>
  );
}
