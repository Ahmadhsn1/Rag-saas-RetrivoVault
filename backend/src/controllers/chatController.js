import { ChatSession } from "../models/ChatSession.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { retrieveChunks } from "../services/retrievalService.js";
import {
  streamAnswer,
  generateSessionTitle,
} from "../services/generationService.js";

export const createSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.create({
    userId: req.user.id,
    title: req.body?.title?.trim() || "New chat",
  });
  res.status(201).json({ session });
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ userId: req.user.id })
    .select("title createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ sessions });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.id,
  }).lean();
  if (!session) throw ApiError.notFound("Chat session not found");
  res.json({ session });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const deleted = await ChatSession.findOneAndDelete({
    _id: req.params.sessionId,
    userId: req.user.id,
  });
  if (!deleted) throw ApiError.notFound("Chat session not found");
  res.status(204).end();
});

// POST /api/chat/:sessionId/message  — Server-Sent Events stream.
export const sendMessage = asyncHandler(async (req, res) => {
  const question = (req.body?.content || "").trim();
  const collectionId = req.body?.collectionId || null;
  if (!question) throw ApiError.badRequest("content is required");

  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.id,
  });
  if (!session) throw ApiError.notFound("Chat session not found");

  const retrieved = await retrieveChunks({
    userId: req.user.id,
    question,
    collectionId,
  });

  const sources = retrieved.map((c, i) => ({
    index: i + 1,
    chunkId: c._id,
    documentId: c.documentId,
    score: c.score,
    preview: c.text.slice(0, 240),
  }));

  // --- SSE setup ---
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.flushHeaders?.();

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send("sources", { sources });

  let answer = "";
  try {
    for await (const delta of streamAnswer({
      question,
      chunks: retrieved,
      history: session.messages,
    })) {
      answer += delta;
      send("token", { delta });
    }
  } catch (err) {
    console.error("[chat] generation error:", err.message);
    send("error", { message: "Generation failed. Please retry." });
    return res.end();
  }

  // Persist both turns.
  session.messages.push({ role: "user", content: question });
  session.messages.push({
    role: "assistant",
    content: answer,
    citedChunkIds: retrieved.map((c) => c._id),
  });
  if (session.messages.length === 2 || session.title === "New chat") {
    session.title = await generateSessionTitle(question);
  }
  await session.save();

  send("done", { title: session.title });
  res.end();
});
