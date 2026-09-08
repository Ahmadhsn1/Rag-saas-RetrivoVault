import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, apiErrorMessage, streamChat } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useDocuments } from "@/hooks/useDocuments";
import { useAppState } from "@/context/AppContext";
import { AnswerText } from "@/components/rag/AnswerText";
import { SourceDrawer } from "@/components/rag/SourceDrawer";
import { OnboardingChecklist } from "@/components/app/OnboardingChecklist";
import { SessionRail } from "@/components/app/chat/SessionRail";
import { Composer } from "@/components/app/chat/Composer";
import { MessageActions } from "@/components/app/chat/MessageActions";
import { ShareDialog } from "@/components/app/chat/ShareDialog";
import { SuggestedQuestions } from "@/components/app/chat/SuggestedQuestions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type {
  ChatMessage,
  ChatSession,
  ChatSessionSummary,
  RetrievedSource,
} from "@/types/api";

export default function Chat() {
  const [params, setParams] = useSearchParams();
  const [archivedView, setArchivedView] = useState(false);
  const { sessions, refetch: refetchSessions, setSessions } =
    useChatSessions(archivedView);
  const { activeCollectionId, refetchUsage } = useAppState();
  const { documents, refetch: refetchDocuments } = useDocuments();
  const readyDocs = documents.filter((d) => d.status === "ready");
  const hasReadyDoc = readyDocs.length > 0;

  const [activeId, setActiveId] = useState<string | null>(params.get("session"));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [liveSources, setLiveSources] = useState<RetrievedSource[]>([]);
  const [selected, setSelected] = useState<RetrievedSource | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<ChatSessionSummary | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const skipHistoryFor = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggested = useMemo(() => {
    const all = readyDocs.flatMap((d) => d.suggestedQuestions ?? []);
    return [...new Set(all)].slice(0, 3);
  }, [readyDocs]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, liveAnswer]);

  useEffect(() => {
    const s = params.get("session");
    if (s && s !== activeId) setActiveId(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Deep link from a suggested question: /app?ask=...
  const askConsumed = useRef(false);
  useEffect(() => {
    const ask = params.get("ask");
    if (ask && !askConsumed.current && !streaming) {
      askConsumed.current = true;
      setParams((p) => {
        p.delete("ask");
        return p;
      });
      void send(ask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    if (skipHistoryFor.current === activeId) {
      skipHistoryFor.current = null;
      return;
    }
    setLoadingHistory(true);
    api
      .get<{ session: ChatSession }>(`/chat/${activeId}`)
      .then(({ data }) => setMessages(data.session.messages ?? []))
      .catch(() => toast.error("Could not load that chat."))
      .finally(() => setLoadingHistory(false));
  }, [activeId]);

  const selectSession = useCallback(
    (id: string) => {
      setActiveId(id);
      setParams((p) => {
        p.set("session", id);
        return p;
      });
    },
    [setParams],
  );

  const newSession = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setParams((p) => {
      p.delete("session");
      return p;
    });
  }, [setParams]);

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/chat/${id}`);
        setSessions((s) => s.filter((x) => x._id !== id));
        if (activeId === id) newSession();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Delete failed"));
      }
    },
    [activeId, newSession, setSessions],
  );

  const renameSession = useCallback(
    async (id: string, title: string) => {
      setSessions((s) => s.map((x) => (x._id === id ? { ...x, title } : x)));
      try {
        await api.patch(`/chat/${id}`, { title });
      } catch (err) {
        toast.error(apiErrorMessage(err, "Rename failed"));
        void refetchSessions();
      }
    },
    [setSessions, refetchSessions],
  );

  const patchSession = useCallback(
    async (id: string, patch: { pinned?: boolean; archived?: boolean }) => {
      try {
        await api.patch(`/chat/${id}`, patch);
        void refetchSessions();
        if (patch.archived && activeId === id) newSession();
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
    },
    [refetchSessions, activeId, newSession],
  );

  const send = useCallback(
    async (content: string) => {
      let sessionId = activeId;

      if (!sessionId) {
        try {
          const { data } = await api.post<{ session: ChatSession }>("/chat", {
            collectionId: activeCollectionId,
          });
          sessionId = data.session._id;
          skipHistoryFor.current = sessionId;
          setActiveId(sessionId);
          setParams((p) => {
            p.set("session", sessionId!);
            return p;
          });
          setSessions((s) => [{ ...data.session, title: "New chat" }, ...s]);
        } catch (err) {
          toast.error(apiErrorMessage(err, "Could not start a chat"));
          return;
        }
      }

      setMessages((m) => [...m, { role: "user", content }]);
      setStreaming(true);
      setLiveAnswer("");
      setLiveSources([]);
      setFailedQuestion(null);

      abortRef.current = new AbortController();
      let answer = "";
      let sources: RetrievedSource[] = [];

      await streamChat({
        sessionId,
        content,
        collectionId: activeCollectionId,
        signal: abortRef.current.signal,
        onSources: (s) => {
          sources = s;
          setLiveSources(s);
        },
        onToken: (delta) => {
          answer += delta;
          setLiveAnswer(answer);
        },
        onDone: ({ title, messageId }) => {
          setMessages((m) => [
            ...m,
            { _id: messageId, role: "assistant", content: answer, sources },
          ]);
          setLiveAnswer("");
          setStreaming(false);
          setSessions((s) =>
            s.map((x) => (x._id === sessionId ? { ...x, title } : x)),
          );
          void refetchSessions();
        },
        onError: (err) => {
          if (abortRef.current?.signal.aborted) {
            setStreaming(false);
            setLiveAnswer("");
            return;
          }
          notifyApiError(err, "Generation failed");
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `⚠ ${err.message}`, sources: [] },
          ]);
          setLiveAnswer("");
          setStreaming(false);
          setFailedQuestion(content);
          void refetchUsage();
        },
      });

      void refetchUsage();
    },
    [
      activeId,
      activeCollectionId,
      refetchSessions,
      setSessions,
      refetchUsage,
      setParams,
    ],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (liveAnswer) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: liveAnswer, sources: liveSources },
      ]);
    }
    setLiveAnswer("");
    setStreaming(false);
  }, [liveAnswer, liveSources]);

  const retry = useCallback(() => {
    if (!failedQuestion) return;
    const q = failedQuestion;
    setFailedQuestion(null);
    setMessages((m) => {
      const next = [...m];
      if (next.at(-1)?.content.startsWith("⚠")) next.pop();
      if (next.at(-1)?.role === "user") next.pop();
      return next;
    });
    void send(q);
  }, [failedQuestion, send]);

  const showEmpty = !activeId && messages.length === 0 && !streaming;

  return (
    <div className="flex h-full">
      <div className="hidden lg:block">
        <SessionRail
          sessions={sessions}
          activeId={activeId}
          archivedView={archivedView}
          onSelect={selectSession}
          onNew={newSession}
          onDelete={deleteSession}
          onRename={renameSession}
          onPatch={patchSession}
          onShare={(s) => setShareTarget(s)}
          onToggleArchivedView={() => setArchivedView((v) => !v)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {showEmpty ? (
              <>
                <OnboardingChecklist
                  hasReadyDoc={hasReadyDoc}
                  onUploaded={() => void refetchDocuments()}
                />
                <SuggestedQuestions questions={suggested} onPick={send} />
              </>
            ) : loadingHistory ? (
              <div className="space-y-4">
                <Skeleton className="ml-auto h-10 w-2/3" />
                <Skeleton className="h-24 w-4/5" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={msg._id ?? i}
                    className={cn(
                      "group/msg",
                      msg.role === "user" ? "flex justify-end" : "",
                    )}
                  >
                    <div
                      className={
                        msg.role === "user"
                          ? "w-fit max-w-[85%] rounded-lg bg-surface px-3.5 py-2.5 text-sm"
                          : "w-fit max-w-[92%] rounded-lg border border-border bg-card px-3.5 py-2.5"
                      }
                    >
                      {msg.role === "assistant" ? (
                        <AnswerText
                          content={msg.content}
                          sources={msg.sources}
                          onSelectSource={setSelected}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "assistant" && !msg.content.startsWith("⚠") && (
                      <MessageActions
                        content={msg.content}
                        sessionId={activeId}
                        messageId={msg._id}
                        initial={msg.feedback}
                      />
                    )}
                  </div>
                ))}

                {streaming && (
                  <div className="w-fit max-w-[92%] rounded-lg border border-border bg-card px-3.5 py-2.5">
                    {liveSources.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {liveSources.map((s) => (
                          <Badge key={s.index} variant="primary">
                            [{s.index}] {s.score.toFixed(2)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {liveAnswer ? (
                      <AnswerText
                        content={liveAnswer}
                        sources={liveSources}
                        onSelectSource={setSelected}
                      />
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-mono text-2xs uppercase text-muted-foreground">
                        <Sparkles className="h-3 w-3 animate-pulse-dot" />
                        retrieving &amp; generating…
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(failedQuestion || streaming) && (
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pb-1">
            {streaming ? (
              <>
                <span className="font-mono text-2xs text-muted-foreground">
                  generating…
                </span>
                <Button size="sm" variant="outline" onClick={stop}>
                  <Square className="h-3 w-3" />
                  Stop
                </Button>
              </>
            ) : (
              <>
                <span className="font-mono text-2xs text-muted-foreground">
                  That answer didn't complete.
                </span>
                <Button size="sm" variant="outline" onClick={retry}>
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </Button>
              </>
            )}
          </div>
        )}

        <Composer onSend={send} disabled={streaming} streaming={streaming} />
      </div>

      <SourceDrawer
        source={selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />

      {shareTarget && (
        <ShareDialog
          sessionId={shareTarget._id}
          shareId={shareTarget.shareId}
          open
          onOpenChange={(o) => !o && setShareTarget(null)}
          onChange={(shareId) => {
            setSessions((s) =>
              s.map((x) => (x._id === shareTarget._id ? { ...x, shareId } : x)),
            );
            setShareTarget((t) => (t ? { ...t, shareId } : t));
          }}
        />
      )}
    </div>
  );
}
