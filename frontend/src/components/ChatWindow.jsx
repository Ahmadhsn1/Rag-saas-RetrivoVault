import { useEffect, useRef, useState } from "react";
import { api, streamChat } from "../api/axiosClient.js";
import CitationBadge from "./CitationBadge.jsx";

// Renders assistant text, turning [1] [2] markers into hoverable badges.
function AssistantMessage({ content, sources, onHoverSource }) {
  const parts = content.split(/(\[\d+\])/g);
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (!m) return <span key={i}>{part}</span>;
        const idx = Number(m[1]);
        return (
          <CitationBadge
            key={i}
            index={idx}
            source={sources?.find((s) => s.index === idx)}
            onHover={onHoverSource}
          />
        );
      })}
    </p>
  );
}

export default function ChatWindow({ sessionId, collectionId, onSessionMutated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [liveSources, setLiveSources] = useState([]);
  const [hoverSource, setHoverSource] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data } = await api.get(`/chat/${sessionId}`);
      setMessages(data.session.messages || []);
    })();
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, liveAnswer]);

  const send = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || streaming || !sessionId) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setStreaming(true);
    setLiveAnswer("");
    setLiveSources([]);

    let answer = "";
    let sources = [];

    await streamChat({
      sessionId,
      content,
      collectionId,
      onSources: (s) => {
        sources = s;
        setLiveSources(s);
      },
      onToken: (delta) => {
        answer += delta;
        setLiveAnswer(answer);
      },
      onDone: () => {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: answer, sources },
        ]);
        setLiveAnswer("");
        setStreaming(false);
        onSessionMutated?.();
      },
      onError: (err) => {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `⚠️ ${err.message}`, sources: [] },
        ]);
        setLiveAnswer("");
        setStreaming(false);
      },
    });
  };

  if (!sessionId) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
        Select or start a chat to query your documents.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-2xl rounded-lg px-4 py-3 ${
              msg.role === "user"
                ? "ml-auto bg-vault-accent/20"
                : "bg-vault-panel"
            }`}
          >
            {msg.role === "assistant" ? (
              <AssistantMessage
                content={msg.content}
                sources={msg.sources}
                onHoverSource={setHoverSource}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            )}
          </div>
        ))}

        {streaming && (
          <div className="max-w-2xl rounded-lg bg-vault-panel px-4 py-3">
            <AssistantMessage
              content={liveAnswer || "…"}
              sources={liveSources}
              onHoverSource={setHoverSource}
            />
          </div>
        )}

        {hoverSource && (
          <div className="max-w-2xl rounded-lg border border-vault-border bg-vault-bg px-4 py-3 text-xs text-gray-400">
            <span className="font-semibold text-vault-accent">
              Source [{hoverSource.index}]
            </span>{" "}
            (score {hoverSource.score?.toFixed(3)}): {hoverSource.preview}…
          </div>
        )}
      </div>

      <form
        onSubmit={send}
        className="flex gap-2 border-t border-vault-border p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about your documents…"
          disabled={streaming}
          className="flex-1 rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm outline-none focus:border-vault-accent disabled:opacity-50"
        />
        <button
          disabled={streaming || !input.trim()}
          className="rounded-md bg-vault-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
