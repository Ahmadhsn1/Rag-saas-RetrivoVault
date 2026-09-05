import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { VaultDocument } from "@/types/api";

export function useDocuments(collectionId?: string | null) {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get<{ documents: VaultDocument[] }>(
        "/documents",
        { params: collectionId ? { collectionId } : {} },
      );
      setDocuments(data.documents);
      setError(null);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  // Poll while any document is still processing.
  useEffect(() => {
    const processing = documents.some((d) => d.status === "processing");
    if (!processing) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;
    pollRef.current = window.setInterval(() => void refetch(), 2500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [documents, refetch]);

  return { documents, loading, error, refetch, setDocuments };
}
