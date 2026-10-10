import { api } from "@/lib/api";
import type { ChatMessage, RetrievedSource } from "@/types/api";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Opens a document's original file. PDFs open in a new tab at `page`; every
 * other type is saved to disk (stored HTML must never render inside the app).
 */
export async function openOriginal(
  documentId: string,
  filename: string,
  page?: number | null,
) {
  // Opened before the request so the browser treats it as a user gesture.
  const isPdf = /\.pdf$/i.test(filename);
  const tab = isPdf ? window.open("", "_blank") : null;
  try {
    const { data } = await api.get<Blob>(`/documents/${documentId}/file`, {
      responseType: "blob",
    });
    if (tab && data.type === "application/pdf") {
      tab.location.href = `${URL.createObjectURL(data)}${page ? `#page=${page}` : ""}`;
    } else {
      tab?.close();
      saveBlob(data, filename);
    }
  } catch (err) {
    tab?.close();
    throw err;
  }
}

/** A conversation as Markdown, with each answer's cited sources listed under it. */
export function chatToMarkdown(title: string, messages: ChatMessage[]) {
  const cite = (s: RetrievedSource) =>
    `[${s.index}] ${s.filename ?? "document"}${s.page ? `, p. ${s.page}` : ""} — "${s.preview.trim()}…"`;

  const body = messages.map((m) => {
    if (m.role === "user") return `## ${m.content}`;
    const cited = (m.sources ?? []).filter((s) => m.content.includes(`[${s.index}]`));
    return cited.length
      ? `${m.content}\n\n**Sources**\n\n${cited.map((s) => `- ${cite(s)}`).join("\n")}`
      : m.content;
  });
  return `# ${title}\n\n${body.join("\n\n")}\n`;
}

export function downloadMarkdown(title: string, markdown: string) {
  const name = title.replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "chat";
  saveBlob(new Blob([markdown], { type: "text/markdown" }), `${name}.md`);
}
