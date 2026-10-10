import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CitationBadge } from "./CitationBadge";
import type { RetrievedSource } from "@/types/api";

interface AnswerTextProps {
  content: string;
  sources?: RetrievedSource[];
  onSelectSource?: (source: RetrievedSource) => void;
}

const CITE_HREF = "#cite-";

const PROSE =
  "text-[0.95rem] leading-relaxed text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-foreground " +
  "[&_h1]:mt-3 [&_h1]:text-base [&_h2]:mt-3 [&_h2]:text-base [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] " +
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground " +
  "[&_table]:my-2 [&_table]:w-full [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left " +
  "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1";

/**
 * Renders an assistant answer as Markdown, turning `[n]` markers into
 * interactive citation badges.
 */
export function AnswerText({
  content,
  sources,
  onSelectSource,
}: AnswerTextProps) {
  // `[2]` -> a link the renderer below swaps for a badge. Skips real Markdown
  // links such as `[2](https://…)`.
  const markdown = useMemo(
    () => content.replace(/\[(\d+)\](?!\()/g, `[$1](${CITE_HREF}$1)`),
    [content],
  );

  const components = useMemo<Components>(
    () => ({
      a({ href, children }) {
        if (href?.startsWith(CITE_HREF)) {
          const index = Number(href.slice(CITE_HREF.length));
          return (
            <CitationBadge
              index={index}
              source={sources?.find((s) => s.index === index)}
              onSelect={onSelectSource}
            />
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary underline underline-offset-2"
          >
            {children}
          </a>
        );
      },
    }),
    [sources, onSelectSource],
  );

  return (
    <div className={PROSE}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
