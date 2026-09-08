import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ChatSessionSummary } from "@/types/api";

export function useChatSessions(archived = false) {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get<{ sessions: ChatSessionSummary[] }>("/chat", {
        params: archived ? { archived: "true" } : {},
      });
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } finally {
      setLoading(false);
    }
  }, [archived]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { sessions, loading, refetch, setSessions };
}
