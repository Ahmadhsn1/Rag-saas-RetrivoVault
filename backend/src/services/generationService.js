import { llmModel as sharedLlmModel } from "../config/gemini.js";
import { withRetry } from "../utils/retry.js";

const SYSTEM_PROMPT = `You are Retrivo Vault's assistant. Answer the user's question using ONLY the numbered context passages provided.
Rules:
- If the answer is not contained in the context, say you don't have enough information in the uploaded documents.
- Cite the passages you used inline with bracketed numbers like [1], [2].
- Be concise and factual. Do not invent sources.`;

function buildPrompt({ question, chunks, history = [] }) {
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.text}`)
    .join("\n\n---\n\n");

  const priorTurns = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `${SYSTEM_PROMPT}

${priorTurns ? `Conversation so far:\n${priorTurns}\n\n` : ""}Context passages:
${context || "(no passages retrieved)"}

Question: ${question}

Answer:`;
}

// Streams the answer token-by-token. Yields text deltas.
export async function* streamAnswer({ question, chunks, history, model }) {
  const prompt = buildPrompt({ question, chunks, history });
  // Retry only the initial call — once tokens flow we can't safely restart.
  const result = await withRetry(() =>
    (model || sharedLlmModel).generateContentStream(prompt)
  );
  for await (const part of result.stream) {
    const delta = part.text();
    if (delta) yield delta;
  }
}

// Non-streaming variant (used for tests / fallback).
export async function generateAnswer({ question, chunks, history, model }) {
  const prompt = buildPrompt({ question, chunks, history });
  const result = await withRetry(() =>
    (model || sharedLlmModel).generateContent(prompt)
  );
  return result.response.text();
}

// Short title for a fresh chat session, derived from the first question.
export async function generateSessionTitle(question, model) {
  try {
    const result = await (model || sharedLlmModel).generateContent(
      `Give a 3-6 word title (no quotes) for a chat that starts with this question:\n"${question}"`
    );
    return result.response.text().trim().replace(/^["']|["']$/g, "").slice(0, 80);
  } catch {
    return question.slice(0, 60);
  }
}
