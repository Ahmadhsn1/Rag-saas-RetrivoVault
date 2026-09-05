import { useEffect, useRef, useState } from "react";
import { api } from "../api/axiosClient.js";

const STATUS_STYLE = {
  processing: "text-amber-400",
  ready: "text-emerald-400",
  failed: "text-red-400",
};

export default function UploadPanel({ collectionId }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const load = async () => {
    const params = collectionId ? { collectionId } : {};
    const { data } = await api.get("/documents", { params });
    setDocuments(data.documents);
  };

  useEffect(() => {
    load();
  }, [collectionId]);

  // Poll while anything is still processing.
  useEffect(() => {
    if (!documents.some((d) => d.status === "processing")) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [documents, collectionId]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (collectionId) fd.append("collectionId", collectionId);
      await api.post("/documents", fd);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id) => {
    await api.delete(`/documents/${id}`);
    setDocuments((d) => d.filter((x) => x._id !== id));
  };

  return (
    <div className="border-b border-vault-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Documents</h2>
        <label className="cursor-pointer rounded-md bg-vault-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
          {uploading ? "Uploading…" : "Upload PDF / TXT"}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={onFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
        {documents.map((d) => (
          <li
            key={d._id}
            className="flex items-center justify-between rounded bg-vault-bg px-2 py-1.5"
          >
            <span className="truncate">{d.filename}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={`text-xs ${STATUS_STYLE[d.status]}`}>
                {d.status}
                {d.status === "ready" ? ` · ${d.chunkCount} chunks` : ""}
              </span>
              <button
                onClick={() => remove(d._id)}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
        {documents.length === 0 && (
          <li className="px-2 text-xs text-gray-600">
            No documents yet. Upload one to start querying.
          </li>
        )}
      </ul>
    </div>
  );
}
