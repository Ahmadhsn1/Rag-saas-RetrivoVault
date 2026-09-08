import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";
import { buttonTap } from "@/lib/anim";

interface MagneticButtonProps {
  children: ReactNode;
  /** Internal route — renders a react-router `<Link>`. */
  to?: string;
  /** External / hash href — renders an `<a>`. */
  href?: string;
  onClick?: () => void;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Pull strength, 0–1 of the cursor offset. */
  strength?: number;
  type?: "button" | "submit";
}

/**
 * A primary CTA that leans toward the cursor and springs back on leave, with a
 * press-down on tap. Use it for the one or two focal buttons on a view — the
 * skill's guidance is not to scatter magnetic elements around a screen.
 *
 * Under `prefers-reduced-motion` it renders a plain `<Button>`.
 */
export function MagneticButton({
  children,
  to,
  href,
  onClick,
  variant = "brand",
  size = "lg",
  className,
  strength = 0.28,
  type = "button",
}: MagneticButtonProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 300, damping: 20, mass: 0.6 });

  const inner =
    to || href ? (
      <Button variant={variant} size={size} className={className} asChild>
        {to ? <Link to={to}>{children}</Link> : <a href={href}>{children}</a>}
      </Button>
    ) : (
      <Button
        variant={variant}
        size={size}
        className={className}
        type={type}
        onClick={onClick}
      >
        {children}
      </Button>
    );

  if (reduce) return inner;

  return (
    <motion.div
      ref={ref}
      className="inline-flex"
      style={{ x: sx, y: sy }}
      whileTap={buttonTap}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {inner}
    </motion.div>
  );
}
