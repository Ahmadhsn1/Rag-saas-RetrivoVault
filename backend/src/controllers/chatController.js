import { ChatSession } from "../models/ChatSession.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { retrieveChunks } from "../services/retrievalService.js";
import {
  streamAnswer,
  generateSessionTitle,
} from "../services/generationService.js";
import { incrementQueryCount, recordEvent } from "../services/usage.js";
import { User } from "../models/User.js";
import { modelsFor } from "../config/gemini.js";

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

export const renameSession = asyncHandler(async (req, res) => {
  const title = (req.body?.title || "").trim().slice(0, 120);
  if (!title) throw ApiError.badRequest("title is required");

  const session = await ChatSession.findOneAndUpdate(
    { _id: req.params.sessionId, userId: req.user.id },
    { title },
    { new: true }
  ).select("title createdAt updatedAt");
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

  // Use the user's own Gemini key when they've provided one.
  const keyed = await User.findById(req.user.id)
    .select("+geminiApiKey")
    .lean();
  const { embeddingModel, llmModel } = modelsFor(keyed?.geminiApiKey);

  let retrieved;
  try {
    retrieved = await retrieveChunks({
      userId: req.user.id,
      question,
      collectionId,
      embeddingModel,
    });
  } catch (err) {
    // Upstream (embedding provider / vector index) failure — don't 500 with a
    // raw provider error; the SSE hasn't started yet so a JSON body is fine.
    throw new ApiError(
      502,
      "Retrieval is temporarily unavailable. Check your Gemini API key and Atlas Vector Search index.",
      { cause: err.message }
    );
  }

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
      model: llmModel,
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
    session.title = await generateSessionTitle(question, llmModel);
  }
  await session.save();

  // Meter the query (quota was checked by enforceQueryQuota before streaming).
  await incrementQueryCount(req.user.id);
  await recordEvent(req.user.id, "query", 1, {
    sessionId: String(session._id),
    chunks: retrieved.length,
  });

  send("done", { title: session.title });
  res.end();
});
