import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { AppNotification } from "@/types/api";

export function useNotifications(pollMs = 45000) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get<{ items: AppNotification[]; unread: number }>(
        "/notifications",
        { params: { limit: 30 } },
      );
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setUnread(0);
    setItems((xs) => xs.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    try {
      await api.post("/notifications/read", {});
    } catch {
      void refetch();
    }
  }, [refetch]);

  const dismiss = useCallback(async (id: string) => {
    setItems((xs) => xs.filter((n) => n._id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refetch();
    timer.current = window.setInterval(() => void refetch(), pollMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [refetch, pollMs]);

  return { items, unread, loading, refetch, markAllRead, dismiss };
}
