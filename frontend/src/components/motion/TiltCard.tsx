import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees at the card's edge. */
  max?: number;
  /** Lift toward the viewer on hover, px. */
  lift?: number;
}

/**
 * Tilts toward the cursor in 3D and settles back on leave. For one hero-level
 * showpiece per view. Renders a plain element under `prefers-reduced-motion`.
 */
export function TiltCard({ children, className, max = 6, lift = 6 }: TiltCardProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 200,
    damping: 20,
  });
  const z = useSpring(0, { stiffness: 200, damping: 20 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={cn("[transform-style:preserve-3d]", className)}
      style={{ rotateX, rotateY, translateZ: z, perspective: 900 }}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
        z.set(lift);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
        z.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
