import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { BillingInfo, UsagePoint } from "@/types/api";

export function useBilling() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get<BillingInfo>("/billing");
      setBilling(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { billing, loading, refetch };
}

export function useUsageChart(days = 30) {
  const [series, setSeries] = useState<UsagePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<{ series: UsagePoint[] }>("/usage/chart", { params: { days } })
      .then(({ data }) => alive && setSeries(data.series))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days]);

  return { series, loading };
}
