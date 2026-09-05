import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Collection } from "@/types/api";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get<{ collections: Collection[] }>(
        "/collections",
      );
      setCollections(data.collections);
      setError(null);
    } catch {
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { collections, loading, error, refetch };
}
