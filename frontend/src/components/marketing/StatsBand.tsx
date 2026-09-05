import { useEffect, useRef } from "react";
import { countUp, gsap } from "@/lib/motion";

const STATS = [
  { value: 768, suffix: "d", label: "embedding dimensions" },
  { value: 142, suffix: "ms", label: "median retrieval time" },
  { value: 100, suffix: "%", label: "answers cited to source" },
  { value: 4, prefix: "≤", suffix: " MB/s", label: "ingestion throughput" },
];

export function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
        countUp(node, Number(node.dataset.count));
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="border-y border-border bg-surface/40">
      <div
        ref={ref}
        className="container grid grid-cols-2 gap-6 py-12 md:grid-cols-4"
      >
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-mono text-2xl font-semibold text-foreground sm:text-3xl">
              {s.prefix}
              <span data-count={s.value}>0</span>
              {s.suffix}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
