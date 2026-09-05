import { cn } from "@/lib/utils";

/** Decorative animated gradient field. Purely cosmetic; hidden from a11y. */
export function AuroraBackground({
  className,
  grid = true,
}: {
  className?: string;
  grid?: boolean;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="aurora" />
      {grid && (
        <div className="grid-fade absolute inset-x-0 top-0 h-[520px]" />
      )}
      <div className="noise" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
