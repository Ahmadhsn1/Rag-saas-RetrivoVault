import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGsapReveal } from "@/hooks/useGsapReveal";

export function Pricing({ standalone = false }: { standalone?: boolean }) {
  const [annual, setAnnual] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapReveal(gridRef, "> *", { stagger: 0.08 });

  return (
    <section id="pricing" className={cn("scroll-mt-24", standalone ? "pt-36 pb-24" : "py-24 md:py-32")}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Priced for one person, not a procurement team
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when your vault outgrows it. Cancel anytime.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-md border border-border bg-surface p-1 font-mono text-xs">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-sm px-3 py-1.5 transition-colors",
                !annual ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors",
                annual ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              Annual
              <span className="text-ok">−25%</span>
            </button>
          </div>
        </div>

        <div ref={gridRef} className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-6",
                  plan.highlight
                    ? "border-primary/50 shadow-lg ring-1 ring-primary/20"
                    : "border-border",
                )}
              >
                {plan.highlight && (
                  <Badge variant="primary" className="absolute -top-2.5 left-6">
                    Most popular
                  </Badge>
                )}
                <h3 className="font-mono text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="font-mono text-4xl font-semibold">
                    ${price}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    {price === 0 ? "forever" : "/ mo"}
                  </span>
                </div>
                {annual && price > 0 && (
                  <p className="mt-1 font-mono text-2xs text-muted-foreground">
                    billed ${price * 12}/year
                  </p>
                )}

                <Button
                  asChild
                  variant={plan.highlight ? "brand" : "outline"}
                  className="mt-5 w-full"
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-ok"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-md text-center font-mono text-2xs text-muted-foreground">
          Prices in USD. Payments handled by Stripe. This is a portfolio project —
          use test-mode cards.
        </p>
      </div>
    </section>
  );
}
