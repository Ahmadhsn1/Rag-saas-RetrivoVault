import { createRequire } from "module";
import { ApiError } from "./ApiError.js";

// pdf-parse ships CommonJS; load it without triggering its debug harness.
const require = createRequire(import.meta.url);

const NBSP = / /g;

// Extracts raw UTF-8 text from an uploaded buffer.
export async function extractText({ buffer, mimeType, filename }) {
  let text;

  if (mimeType === "application/pdf") {
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (mimeType === "text/plain") {
    text = buffer.toString("utf-8");
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
  return text;
}
