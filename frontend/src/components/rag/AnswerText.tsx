import { Fragment } from "react";
import { CitationBadge } from "./CitationBadge";
import type { RetrievedSource } from "@/types/api";

interface AnswerTextProps {
  content: string;
  sources?: RetrievedSource[];
  onSelectSource?: (source: RetrievedSource) => void;
}

/** Renders assistant text, turning `[n]` markers into interactive citation badges. */
export function AnswerText({
  content,
  sources,
  onSelectSource,
}: AnswerTextProps) {
  const parts = content.split(/(\[\d+\])/g);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) return <Fragment key={i}>{part}</Fragment>;
        const index = Number(match[1]);
        return (
          <CitationBadge
            key={i}
            index={index}
            source={sources?.find((s) => s.index === index)}
            onSelect={onSelectSource}
          />
        );
      })}
    </p>
  );
}
