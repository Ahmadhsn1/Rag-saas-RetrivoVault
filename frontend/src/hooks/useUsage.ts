import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UsageSnapshot } from "@/types/api";

export function useUsage() {
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get<UsageSnapshot>("/usage");
      setUsage(data);
    } catch {
      /* keep last value */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { usage, loading, refetch };
}
