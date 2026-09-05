import { cn } from "@/lib/utils";

export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1.5"
          y="1.5"
          width="21"
          height="21"
          rx="5"
          stroke="hsl(var(--brand))"
          strokeWidth="1.5"
        />
        <path
          d="M7 8.5L12 17L17 8.5"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="7" r="1.6" fill="hsl(var(--brand))" />
      </svg>
      {withWordmark && (
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          Retrivo<span className="text-muted-foreground">Vault</span>
        </span>
      )}
    </span>
  );
}
