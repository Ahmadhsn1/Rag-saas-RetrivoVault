import { ChatSession } from "../models/ChatSession.js";
import { Collection } from "../models/Collection.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { retrieveChunks } from "../services/retrievalService.js";
import {
  streamAnswer,
  generateSessionTitle,
} from "../services/generationService.js";
import { incrementQueryCount, recordEvent } from "../services/usage.js";
import { dispatchWebhook } from "../services/webhooks.js";
import { modelsFor } from "../config/gemini.js";
import { str } from "../middleware/sanitize.js";

// A path/body value that must be a plain ObjectId-shaped string, else null.
const asId = (v) => (typeof v === "string" && /^[a-f\d]{24}$/i.test(v) ? v : null);

export const createSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.create({
    userId: req.user.id,
    title: str(req.body?.title).trim().slice(0, 120) || "New chat",
    collectionId: asId(req.body?.collectionId),
  });
  res.status(201).json({ session });
});

export const listSessions = asyncHandler(async (req, res) => {
  const filter = { userId: req.user.id };
  if (req.query.archived === "true") filter.archived = true;
  else filter.archived = { $ne: true };

  const sessions = await ChatSession.find(filter)
    .select("title createdAt updatedAt pinned archived collectionId shareId")
    .sort({ pinned: -1, updatedAt: -1 })
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

export const updateSession = asyncHandler(async (req, res) => {
  const patch = {};
  if (typeof req.body?.title === "string") {
    const t = req.body.title.trim().slice(0, 120);
    if (!t) throw ApiError.badRequest("title cannot be empty");
    patch.title = t;
  }
  if (typeof req.body?.pinned === "boolean") patch.pinned = req.body.pinned;
  if (typeof req.body?.archived === "boolean") patch.archived = req.body.archived;
  if (!Object.keys(patch).length) throw ApiError.badRequest("nothing to update");

  const session = await ChatSession.findOneAndUpdate(
    { _id: req.params.sessionId, userId: req.user.id },
    patch,
    { new: true }
  ).select("title createdAt updatedAt pinned archived collectionId shareId");
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

// --- Sharing ---

export const shareSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.id,
  });
  if (!session) throw ApiError.notFound("Chat session not found");

  if (req.body?.enabled === false) {
    session.shareId = null;
    session.sharedAt = null;
    await session.save();
    return res.json({ shareId: null });
  }
  const shareId = session.enableShare();
  await session.save();
  res.json({ shareId });
});

// Public, unauthenticated read of a shared chat.
export const getSharedSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({ shareId: req.params.shareId })
    .select("title messages sharedAt")
    .lean();
  if (!session) throw ApiError.notFound("This shared chat doesn't exist");
  res.json({
    session: {
      title: session.title,
      sharedAt: session.sharedAt,
      messages: (session.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        sources: m.sources,
      })),
    },
  });
});

// --- Message feedback ---

export const messageFeedback = asyncHandler(async (req, res) => {
  const { rating } = req.body || {};
  if (!["up", "down", null].includes(rating)) {
    throw ApiError.badRequest("rating must be 'up', 'down' or null");
  }
  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.id,
  });
  if (!session) throw ApiError.notFound("Chat session not found");

  if (!asId(req.params.messageId)) throw ApiError.notFound("Message not found");
  const msg = session.messages.id(req.params.messageId);
  if (!msg || msg.role !== "assistant") {
    throw ApiError.notFound("Message not found");
  }
  msg.feedback = rating;
  await session.save();
  res.json({ ok: true });
});

// POST /api/chat/:sessionId/message  — Server-Sent Events stream.
export const sendMessage = asyncHandler(async (req, res) => {
  const question = str(req.body?.content).trim().slice(0, 8000);
  if (!question) throw ApiError.badRequest("content is required");

  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.id,
  });
  if (!session) throw ApiError.notFound("Chat session not found");

  const collectionId =
    asId(req.body?.collectionId) ||
    (session.collectionId ? String(session.collectionId) : null);
  let instructions = "";
  if (collectionId) {
    const col = await Collection.findOne({
      _id: collectionId,
      userId: req.user.id,
    })
      .select("instructions")
      .lean();
    instructions = col?.instructions || "";
  }

  // Use the user's own Gemini key when they've provided one.
  const keyed = await User.findById(req.user.id).select("+geminiApiKey").lean();
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
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    for await (const delta of streamAnswer({
      question,
      chunks: retrieved,
      history: session.messages,
      model: llmModel,
      instructions,
    })) {
      if (aborted) break;
      answer += delta;
      send("token", { delta });
    }
  } catch (err) {
    console.error("[chat] generation error:", err.message);
    send("error", { message: "Generation failed. Please retry." });
    return res.end();
  }

  session.messages.push({ role: "user", content: question });
  session.messages.push({
    role: "assistant",
    content: answer,
    citedChunkIds: retrieved.map((c) => c._id),
    sources,
  });
  if (session.messages.length === 2 || session.title === "New chat") {
    session.title = await generateSessionTitle(question, llmModel);
  }
  await session.save();

  await incrementQueryCount(req.user.id);
  await recordEvent(req.user.id, "query", 1, {
    sessionId: String(session._id),
    chunks: retrieved.length,
  });
  void dispatchWebhook(req.user.id, "chat.answered", {
    sessionId: String(session._id),
    question,
    chunks: retrieved.length,
  });

  const answerMsg = session.messages[session.messages.length - 1];
  send("done", { title: session.title, messageId: String(answerMsg._id) });
  res.end();
});
