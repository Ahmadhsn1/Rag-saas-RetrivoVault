import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { DocumentStatus, VaultDocument } from "@/types/api";

interface Options {
  collectionId?: string | null;
  q?: string;
  status?: DocumentStatus | "all";
  page?: number;
  limit?: number;
}

interface Result {
  documents: VaultDocument[];
  total: number;
  pages: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setDocuments: React.Dispatch<React.SetStateAction<VaultDocument[]>>;
}

export function useDocuments(opts: Options | string | null = {}): Result {
  // Back-compat: a bare collectionId string/null still works.
  const o: Options =
    typeof opts === "string" || opts === null ? { collectionId: opts } : opts;
  const { collectionId, q = "", status = "all", page = 1, limit = 25 } = o;

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const refetch = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page, limit };
      if (collectionId) params.collectionId = collectionId;
      if (q) params.q = q;
      if (status !== "all") params.status = status;

      const { data } = await api.get<{
        documents: VaultDocument[];
        total: number;
        pages: number;
      }>("/documents", { params });
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setTotal(Number(data.total) || 0);
      setPages(Number(data.pages) || 1);
      setError(null);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [collectionId, q, status, page, limit]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  // Poll while anything on this page is still processing.
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

  return { documents, total, pages, loading, error, refetch, setDocuments };
}
