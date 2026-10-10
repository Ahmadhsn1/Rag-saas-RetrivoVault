import { createRequire } from "module";
import mammoth from "mammoth";
import { ApiError } from "./ApiError.js";

// pdf-parse ships CommonJS; load it without triggering its debug harness.
const require = createRequire(import.meta.url);

const NBSP = / /g;

export const SUPPORTED_MIME = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "text/html": "html",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/** Very small HTML → readable text: drop script/style, tags, decode common entities. */
export function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/h[1-6]|\/li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function csvToText(raw) {
  // Flatten CSV to readable "col: value" lines so retrieval has real sentences.
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return "";
  const split = (l) => l.match(/(".*?"|[^,]+)(?=,|$)/g)?.map((c) => c.replace(/^"|"$/g, "").trim()) ?? [];
  const headers = split(lines[0]);
  return lines
    .slice(1)
    .map((line, i) => {
      const cells = split(line);
      const pairs = headers.map((h, j) => `${h}: ${cells[j] ?? ""}`).join("; ");
      return `Row ${i + 1} — ${pairs}`;
    })
    .join("\n");
}

const clean = (text) =>
  (text || "")
    .replace(/\r\n/g, "\n")
    .replace(NBSP, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// One string per PDF page, in order, so citations can point at a page.
async function pdfPages(buffer) {
  const pdfParse = require("pdf-parse");
  const pages = [];
  await pdfParse(buffer, {
    pagerender: async (page) => {
      const content = await page.getTextContent();
      let lastY;
      let text = "";
      for (const item of content.items) {
        const y = item.transform[5];
        text += lastY === undefined || lastY === y ? item.str : `\n${item.str}`;
        lastY = y;
      }
      pages.push(text);
      return text;
    },
  });
  return pages;
}

/**
 * Extracts text from an uploaded buffer as ordered segments
 * `[{ page, text }]`. `page` is a 1-based PDF page number, or null for formats
 * without pages.
 */
export async function extractSegments({ buffer, mimeType, filename }) {
  let segments;
  const kind = SUPPORTED_MIME[mimeType];

  if (kind === "pdf") {
    const pages = await pdfPages(buffer);
    segments = pages.map((text, i) => ({ page: i + 1, text }));
  } else if (kind === "docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    segments = [{ page: null, text: value }];
  } else if (kind === "csv") {
    segments = [{ page: null, text: csvToText(buffer.toString("utf-8")) }];
  } else if (kind === "html") {
    segments = [{ page: null, text: htmlToText(buffer.toString("utf-8")) }];
  } else if (kind === "txt" || kind === "md") {
    let text = buffer.toString("utf-8");
    if (kind === "md") {
      // strip the noisiest markdown syntax; keep the prose
      text = text
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_>#-]{1,}/g, " ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    }
    segments = [{ page: null, text }];
  } else {
    throw ApiError.badRequest(`Cannot extract text from ${mimeType}`);
  }

  // Cap extracted text (a small file can expand to gigabytes; e.g. a PDF bomb).
  let budget = Number(process.env.MAX_EXTRACTED_CHARS || 5_000_000);
  const out = [];
  for (const segment of segments) {
    const text = clean(segment.text).slice(0, budget);
    if (!text) continue;
    budget -= text.length;
    out.push({ page: segment.page, text });
    if (budget <= 0) break;
  }

  if (out.length === 0) {
    throw ApiError.badRequest(`No extractable text found in "${filename}"`, {
      code: "no_text",
    });
  }
  return out;
}

/** The whole document as one string. */
export async function extractText(file) {
  const segments = await extractSegments(file);
  return segments.map((s) => s.text).join("\n\n");
}
