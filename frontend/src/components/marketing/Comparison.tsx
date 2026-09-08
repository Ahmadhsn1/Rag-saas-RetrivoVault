import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";

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
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Why not just…
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            The tools you'd reach for first
          </h2>
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-3xl" delay={0.05}>
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
                        c.key === "retrivo"
                          ? "bg-primary/[0.06] text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr
                    key={row.capability}
                    className="border-b border-border transition-colors last:border-0 hover:bg-surface/50"
                  >
                    <td className="px-3 py-3 text-foreground/90">{row.capability}</td>
                    <td className="bg-primary/[0.06] px-3 py-3 text-center">
                      {row.retrivo ? (
                        <Check className="mx-auto h-4 w-4 text-ok" aria-label="yes" />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-border-strong"
                          aria-label="no"
                        />
                      )}
                    </td>
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
        </Reveal>
      </div>
    </section>
  );
}
