import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface/30 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-border-strong bg-surface text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-mono text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
