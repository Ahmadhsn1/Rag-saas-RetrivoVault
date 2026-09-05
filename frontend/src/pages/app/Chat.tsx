import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage, streamChat } from "@/lib/api";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useAppState } from "@/context/AppContext";
import { AnswerText } from "@/components/rag/AnswerText";
import { PipelineStrip } from "@/components/rag/PipelineStrip";
import { SourceDrawer } from "@/components/rag/SourceDrawer";
import { SessionRail } from "@/components/app/chat/SessionRail";
import { Composer } from "@/components/app/chat/Composer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ChatMessage,
  ChatSession,
  RetrievedSource,
} from "@/types/api";

export default function Chat() {
  const { sessions, refetch: refetchSessions, setSessions } = useChatSessions();
  const { activeCollectionId } = useAppState();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [liveSources, setLiveSources] = useState<RetrievedSource[]>([]);
  const [selected, setSelected] = useState<RetrievedSource | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  // A session id we just created locally — its history is known-empty, so skip the fetch
  // that would otherwise clobber the answer currently streaming into it.
  const skipHistoryFor = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, liveAnswer]);

  // Load history when switching sessions.
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

  const newSession = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

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

  const send = useCallback(
    async (content: string) => {
      let sessionId = activeId;

      if (!sessionId) {
        try {
          const { data } = await api.post<{ session: ChatSession }>("/chat", {});
          sessionId = data.session._id;
          skipHistoryFor.current = sessionId;
          setActiveId(sessionId);
          setSessions((s) => [
            { ...data.session, title: "New chat" },
            ...s,
          ]);
        } catch (err) {
          toast.error(apiErrorMessage(err, "Could not start a chat"));
          return;
        }
      }

      setMessages((m) => [...m, { role: "user", content }]);
      setStreaming(true);
      setLiveAnswer("");
      setLiveSources([]);

      let answer = "";
      let sources: RetrievedSource[] = [];

      await streamChat({
        sessionId,
        content,
        collectionId: activeCollectionId,
        onSources: (s) => {
          sources = s;
          setLiveSources(s);
        },
        onToken: (delta) => {
          answer += delta;
          setLiveAnswer(answer);
        },
        onDone: ({ title }) => {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: answer, sources },
          ]);
          setLiveAnswer("");
          setStreaming(false);
          setSessions((s) =>
            s.map((x) => (x._id === sessionId ? { ...x, title } : x)),
          );
          void refetchSessions();
        },
        onError: (err) => {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `⚠ ${err.message}`, sources: [] },
          ]);
          setLiveAnswer("");
          setStreaming(false);
        },
      });
    },
    [activeId, activeCollectionId, refetchSessions, setSessions],
  );

  const showEmpty = !activeId && messages.length === 0 && !streaming;

  return (
    <div className="flex h-full">
      <div className="hidden lg:block">
        <SessionRail
          sessions={sessions}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={newSession}
          onDelete={deleteSession}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {showEmpty ? (
              <div className="flex flex-col items-center gap-6 py-16 text-center">
                <PipelineStrip />
                <div>
                  <p className="font-mono text-sm font-semibold">
                    Ask your knowledge base
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Upload a document, then ask a question. Answers come back with
                    a source behind every claim.
                  </p>
                </div>
              </div>
            ) : loadingHistory ? (
              <div className="space-y-4">
                <Skeleton className="ml-auto h-10 w-2/3" />
                <Skeleton className="h-24 w-4/5" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={
                      msg.role === "user"
                        ? "ml-auto w-fit max-w-[85%] rounded-lg bg-surface px-3.5 py-2.5 text-sm"
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
                        retrieving & generating…
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Composer onSend={send} disabled={streaming} streaming={streaming} />
      </div>

      <SourceDrawer source={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
