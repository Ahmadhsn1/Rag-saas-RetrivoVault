import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Logo } from "@/components/Logo";
import { AnswerText } from "@/components/rag/AnswerText";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/useSeo";
import type { ChatMessage } from "@/types/api";

const base = import.meta.env.VITE_API_BASE || "/api";

interface Shared {
  title: string;
  sharedAt: string;
  messages: ChatMessage[];
}

export default function SharedChat() {
  const { shareId } = useParams();
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [chat, setChat] = useState<Shared | null>(null);

  useSeo(chat?.title || "Shared chat", "A conversation shared from Retrivo Vault.");

  useEffect(() => {
    axios
      .get<{ session: Shared }>(`${base}/public/shared-chats/${shareId}`)
      .then(({ data }) => {
        setChat(data.session);
        setState("ok");
      })
      .catch(() => setState("missing"));
  }, [shareId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link to="/">
          <Logo />
        </Link>
        <Button asChild variant="brand" size="sm">
          <Link to="/signup">Start your own vault</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {state === "loading" && (
          <p className="text-center font-mono text-2xs uppercase text-muted-foreground">
            loading…
          </p>
        )}

        {state === "missing" && (
          <div className="py-20 text-center">
            <p className="font-mono text-4xl font-semibold text-brand">404</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This shared chat doesn't exist or was unshared.
            </p>
          </div>
        )}

        {state === "ok" && chat && (
          <>
            <h1 className="text-2xl">{chat.title}</h1>
            <p className="mt-1 font-mono text-2xs text-muted-foreground">
              shared from Retrivo Vault ·{" "}
              {new Date(chat.sharedAt).toLocaleDateString()}
            </p>
            <div className="mt-8 space-y-4">
              {chat.messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto w-fit max-w-[85%] rounded-lg bg-surface px-3.5 py-2.5 text-sm"
                      : "w-fit max-w-[92%] rounded-lg border border-border bg-card px-3.5 py-2.5"
                  }
                >
                  {m.role === "assistant" ? (
                    <AnswerText content={m.content} sources={m.sources} />
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
              Answers are grounded in the sharer's private documents (not shown).{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Build your own →
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
