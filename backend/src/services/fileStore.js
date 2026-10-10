import mongoose from "mongoose";

/**
 * Original uploads, kept in MongoDB GridFS under the document's own _id.
 * Storing them is what lets ingestion resume after a restart and lets a user
 * open the source a citation points at. Swap this module for S3/R2 when the
 * database should stop carrying file bytes.
 */
const bucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "originals",
  });

const asId = (id) => new mongoose.Types.ObjectId(String(id));

export function saveFile(documentId, buffer, { userId, filename, mimeType }) {
  return new Promise((resolve, reject) => {
    const stream = bucket().openUploadStreamWithId(asId(documentId), filename, {
      metadata: { userId: asId(userId), mimeType },
    });
    stream.once("error", reject).once("finish", resolve).end(buffer);
  });
}

export async function hasFile(documentId) {
  return (await bucket().find({ _id: asId(documentId) }).limit(1).toArray()).length > 0;
}

/** Stream of the stored bytes. Emits an error if the file is missing. */
export function openFile(documentId) {
  return bucket().openDownloadStream(asId(documentId));
}

export async function readFile(documentId) {
  const parts = [];
  for await (const part of openFile(documentId)) parts.push(part);
  return Buffer.concat(parts);
}

/** Deleting a file that was never stored (older documents) is not an error. */
export async function deleteFile(documentId) {
  await bucket()
    .delete(asId(documentId))
    .catch(() => {});
}

export async function deleteFilesForUser(userId) {
  const files = await bucket()
    .find({ "metadata.userId": asId(userId) })
    .project({ _id: 1 })
    .toArray();
  await Promise.all(files.map((f) => deleteFile(f._id)));
}
