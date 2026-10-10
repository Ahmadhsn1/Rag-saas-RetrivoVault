import { type ElementType, type ReactNode } from "react";

interface BlockProps {
  children: ReactNode;
  className?: string;
  /** Wrapper element. Default `div`. */
  as?: ElementType;
}

/**
 * Layout wrappers for marketing sections. They used to fade content in on
 * scroll, which left it invisible until an observer fired — so nothing showed
 * in a print, a full-page capture, or for a reader whose browser never ran the
 * animation. Content is now simply there.
 */
export function Reveal({ children, className, as: Tag = "div" }: BlockProps) {
  return <Tag className={className}>{children}</Tag>;
}

export function Stagger({ children, className, as: Tag = "div" }: BlockProps) {
  return <Tag className={className}>{children}</Tag>;
}

export function RevealItem({ children, className, as: Tag = "div" }: BlockProps) {
  return <Tag className={className}>{children}</Tag>;
}
