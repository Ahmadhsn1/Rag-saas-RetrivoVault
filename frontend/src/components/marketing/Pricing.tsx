import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, Stagger, RevealItem } from "@/components/motion/Reveal";

export function Pricing({ standalone = false }: { standalone?: boolean }) {
  const [annual, setAnnual] = useState(true);
  const { user } = useAuth();

  const ctaTo = (planId: string) =>
    user
      ? planId === "free"
        ? "/app"
        : "/app/settings?tab=billing"
      : "/signup";

  return (
    <section id="pricing" className={cn("scroll-mt-24", standalone ? "pt-36 pb-24" : "py-24 md:py-32")}>
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Priced for one person, not a procurement team
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every account starts with a{" "}
            <span className="text-foreground">14-day Pro trial</span> — no card.
            Then it's free forever, or upgrade. Cancel anytime.
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
        </Reveal>

        <Stagger
          wrapChildren={false}
          stagger={0.1}
          className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <RevealItem key={plan.id} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-xl border bg-card p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 motion-reduce:transform-none",
                  plan.highlight
                    ? "border-primary/50 shadow-lg ring-1 ring-primary/20 hover:shadow-[0_20px_50px_-16px_rgba(108,92,231,0.45)]"
                    : "border-border hover:border-border-strong hover:shadow-lg",
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
                  <Link to={ctaTo(plan.id)}>
                    {user && plan.id !== "free" ? "Choose " + plan.name : plan.cta}
                  </Link>
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
              </RevealItem>
            );
          })}
        </Stagger>

        <Reveal
          as="p"
          className="mx-auto mt-8 max-w-md text-center font-mono text-2xs text-muted-foreground"
        >
          Prices in USD, billed securely by Stripe. Switch plans or cancel any
          time — your documents stay put.
        </Reveal>
      </div>
    </section>
  );
}
