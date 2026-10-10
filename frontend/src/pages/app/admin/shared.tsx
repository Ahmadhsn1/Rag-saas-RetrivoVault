import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ok" | "warn" | "muted";
}) {
  const valueColor =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-foreground";
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <p className={`mt-3 font-mono text-2xl font-semibold ${valueColor}`}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint && (
        <p className="mt-1 font-mono text-2xs text-muted-foreground/70">{hint}</p>
      )}
    </Card>
  );
}

/** A compact monospace bar sparkline — no chart lib, theme-token colours. */
export function Sparkline({
  data,
  className = "",
}: {
  data: number[];
  className?: string;
}) {
  const max = Math.max(1, ...data);
  return (
    <div className={`flex h-10 items-end gap-px ${className}`} aria-hidden="true">
      {data.map((v, i) => (
        <div
          key={i}
          className="min-w-[2px] flex-1 rounded-sm bg-primary/60"
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function LiveDot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
        on ? "bg-ok motion-safe:animate-pulse" : "bg-muted-foreground/40"
      }`}
      aria-hidden="true"
    />
  );
}
