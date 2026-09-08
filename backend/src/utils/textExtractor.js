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
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const SUPPORTED_EXT = [".pdf", ".txt", ".md", ".markdown", ".csv", ".docx"];

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

// Extracts raw UTF-8 text from an uploaded buffer.
export async function extractText({ buffer, mimeType, filename }) {
  let text;
  const kind = SUPPORTED_MIME[mimeType];

  if (kind === "pdf") {
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (kind === "docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    text = value;
  } else if (kind === "csv") {
    text = csvToText(buffer.toString("utf-8"));
  } else if (kind === "txt" || kind === "md") {
    text = buffer.toString("utf-8");
    if (kind === "md") {
      // strip the noisiest markdown syntax; keep the prose
      text = text
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_>#-]{1,}/g, " ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    }
  } else {
    throw ApiError.badRequest(`Cannot extract text from ${mimeType}`);
  }

  text = (text || "")
    .replace(/\r\n/g, "\n")
    .replace(NBSP, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) {
    throw ApiError.badRequest(`No extractable text found in "${filename}"`);
  }

  // Cap extracted text (a small file can expand to gigabytes; e.g. a PDF bomb).
  const MAX_CHARS = Number(process.env.MAX_EXTRACTED_CHARS || 5_000_000);
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
  }
  return text;
}
