import { useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const ROWS: {
  capability: string;
  retrivo: boolean;
  chatgpt: boolean;
  keyword: boolean;
  notion: boolean;
}[] = [
  { capability: "Your whole library at once", retrivo: true, chatgpt: false, keyword: true, notion: true },
  { capability: "Every answer cites the source", retrivo: true, chatgpt: false, keyword: false, notion: false },
  { capability: "Says “not in your documents” instead of guessing", retrivo: true, chatgpt: false, keyword: false, notion: false },
  { capability: "Finds the idea, not the exact word", retrivo: true, chatgpt: true, keyword: false, notion: true },
  { capability: "Private — never trains a model", retrivo: true, chatgpt: false, keyword: true, notion: false },
  { capability: "Built for one person — no seats, no IT", retrivo: true, chatgpt: true, keyword: true, notion: true },
];

const COLS = [
  { key: "retrivo", label: "Retrivo" },
  { key: "chatgpt", label: "ChatGPT paste" },
  { key: "keyword", label: "Cmd-F" },
  { key: "notion", label: "Notion AI" },
] as const;

function Cell({ on, highlight }: { on: boolean; highlight?: boolean }) {
  return (
    <td className="px-3 py-3 text-center">
      {on ? (
        <Check
          className={cn("mx-auto h-4 w-4", highlight ? "text-ok" : "text-muted-foreground")}
          aria-label="yes"
        />
      ) : (
        <Minus className="mx-auto h-4 w-4 text-border-strong" aria-label="no" />
      )}
    </td>
  );
}

export function Comparison() {
  const ref = useRef<HTMLDivElement>(null);
  useGsapReveal(ref, "> *");

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Why not just…
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            The tools you'd reach for first
          </h2>
        </div>

        <div ref={ref} className="mx-auto mt-12 max-w-3xl">
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                    Capability
                  </th>
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "px-3 py-3 text-center font-mono text-2xs uppercase tracking-wide",
                        c.key === "retrivo" ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.capability} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 text-foreground/90">{row.capability}</td>
                    <Cell on={row.retrivo} highlight />
                    <Cell on={row.chatgpt} />
                    <Cell on={row.keyword} />
                    <Cell on={row.notion} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Enterprise RAG tools do most of this — for teams, with IT, priced per
            seat, gated behind sales.
          </p>
        </div>
      </div>
    </section>
  );
}
