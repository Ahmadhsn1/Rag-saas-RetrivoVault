import { cn } from "@/lib/utils";

/**
 * The Retrivo mark: a serif R in an ink square, with the citation dot — the
 * small accent mark that sits behind every claim in the product.
 */
export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="26" height="26" rx="6" fill="hsl(var(--primary))" />
        <path
          d="M8.4 19V7.2h5.1a3.3 3.3 0 0 1 0 6.6H8.4m4.5 0 3.6 5.2"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19.6" cy="7.4" r="1.9" fill="hsl(var(--brand))" />
      </svg>
      {withWordmark && (
        <span className="font-serif text-[1.3rem] font-medium leading-none tracking-tight text-foreground">
          Retrivo
        </span>
      )}
    </span>
  );
}
