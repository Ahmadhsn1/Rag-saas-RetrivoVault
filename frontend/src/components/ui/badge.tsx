import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-muted-foreground",
        primary: "border-primary/20 bg-primary/[0.06] text-primary",
        ok: "border-ok/25 bg-ok/[0.08] text-ok",
        warn: "border-warn/30 bg-warn/[0.09] text-warn",
        error: "border-destructive/25 bg-destructive/[0.07] text-destructive",
        outline: "border-border-strong text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
