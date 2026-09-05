import { lazy, Suspense, useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import { useBilling } from "@/hooks/useBilling";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UsageBars } from "./UsageBars";

const UsageChart = lazy(() =>
  import("./UsageChart").then((m) => ({ default: m.UsageChart })),
);

export function BillingTab() {
  const { billing, loading } = useBilling();
  const { usage } = useAppState();
  const [annual, setAnnual] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  if (loading || !billing) {
    return <Skeleton className="h-64 w-full" />;
  }

  const currentPlan = billing.plan.id;

  const checkout = async (planId: string) => {
    const cat = billing.catalog.find((c) => c.id === planId);
    const priceId = annual ? cat?.prices?.annual : cat?.prices?.monthly;
    if (!billing.billingEnabled || !priceId) {
      toast.info("Billing isn't configured on this deployment.");
      return;
    }
    setPending(planId);
    try {
      const { data } = await api.post<{ url: string }>("/billing/checkout", {
        priceId,
      });
      window.location.href = data.url;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not start checkout"));
      setPending(null);
    }
  };

  const portal = async () => {
    setPending("portal");
    try {
      const { data } = await api.post<{ url: string }>("/billing/portal");
      window.location.href = data.url;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not open the billing portal"));
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Current plan</CardTitle>
          <Badge variant={currentPlan === "free" ? "default" : "primary"}>
            {billing.plan.name}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          {usage && <UsageBars usage={usage} />}

          {billing.subscriptionStatus !== "none" && (
            <p className="font-mono text-2xs text-muted-foreground">
              status: {billing.subscriptionStatus}
              {billing.planRenewsAt &&
                ` · renews ${new Date(billing.planRenewsAt).toLocaleDateString()}`}
            </p>
          )}

          {billing.hasBillingAccount && (
            <Button variant="outline" size="sm" onClick={portal} disabled={!!pending}>
              {pending === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage billing
            </Button>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <UsageChart />
      </Suspense>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold">Plans</h3>
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-surface p-0.5 font-mono text-2xs">
            <button
              onClick={() => setAnnual(false)}
              className={cn("rounded-sm px-2 py-1", !annual && "bg-secondary text-foreground")}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn("rounded-sm px-2 py-1", annual && "bg-secondary text-foreground")}
            >
              Annual −25%
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const price = annual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-lg border p-4",
                  plan.highlight && !isCurrent
                    ? "border-primary/50"
                    : "border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-semibold">{plan.name}</p>
                  {isCurrent && <Badge variant="ok">current</Badge>}
                </div>
                <p className="mt-2 font-mono text-2xl font-semibold">
                  ${price}
                  <span className="text-xs text-muted-foreground">
                    {price === 0 ? "" : "/mo"}
                  </span>
                </p>
                <ul className="mt-3 space-y-1 font-mono text-2xs text-muted-foreground">
                  <li>{plan.limits.documents} docs</li>
                  <li>{plan.limits.queriesPerMonth.toLocaleString()} q/mo</li>
                  <li>{plan.limits.collections} collections</li>
                </ul>
                {!isCurrent && plan.id !== "free" && (
                  <Button
                    size="sm"
                    variant={plan.highlight ? "brand" : "outline"}
                    className="mt-4 w-full"
                    onClick={() => checkout(plan.id)}
                    disabled={!!pending}
                  >
                    {pending === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {currentPlan === "free" ? "Upgrade" : "Switch"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {!billing.billingEnabled && (
          <p className="mt-3 font-mono text-2xs text-muted-foreground">
            Stripe isn't configured on this deployment — plan changes are disabled.
          </p>
        )}
      </div>
    </div>
  );
}
