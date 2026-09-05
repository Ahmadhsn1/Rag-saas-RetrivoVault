import { useState } from "react";
import { api } from "../api/axiosClient.js";

export default function CollectionSidebar({
  collections,
  activeCollectionId,
  onSelect,
  onChanged,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  user,
  onLogout,
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post("/collections", { name: name.trim() });
      setName("");
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-vault-border bg-vault-panel">
      <div className="border-b border-vault-border p-4">
        <div className="text-sm font-semibold text-white">Retrivo Vault</div>
        <div className="truncate text-xs text-gray-400">{user?.email}</div>
      </div>

      <div className="border-b border-vault-border p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Collections
        </div>
        <button
          onClick={() => onSelect(null)}
          className={`mb-1 w-full rounded px-2 py-1.5 text-left text-sm ${
            !activeCollectionId ? "bg-vault-accent/20 text-vault-accent" : "hover:bg-white/5"
          }`}
        >
          All documents
        </button>
        {collections.map((c) => (
          <button
            key={c._id}
            onClick={() => onSelect(c._id)}
            className={`mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
              activeCollectionId === c._id
                ? "bg-vault-accent/20 text-vault-accent"
                : "hover:bg-white/5"
            }`}
          >
            <span className="truncate">{c.name}</span>
            <span className="text-xs text-gray-500">{c.documentCount ?? 0}</span>
          </button>
        ))}
        <form onSubmit={create} className="mt-2 flex gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New collection"
            className="min-w-0 flex-1 rounded border border-vault-border bg-vault-bg px-2 py-1 text-xs outline-none focus:border-vault-accent"
          />
          <button
            disabled={busy}
            className="rounded bg-vault-accent px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            +
          </button>
        </form>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Chats
          </span>
          <button
            onClick={onNewSession}
            className="rounded bg-white/5 px-2 py-0.5 text-xs hover:bg-white/10"
          >
            + New
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s._id}
              onClick={() => onSelectSession(s._id)}
              className={`block w-full truncate rounded px-2 py-1.5 text-left text-sm ${
                activeSessionId === s._id
                  ? "bg-vault-accent/20 text-vault-accent"
                  : "hover:bg-white/5"
              }`}
            >
              {s.title}
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="px-2 text-xs text-gray-600">No chats yet.</p>
          )}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="border-t border-vault-border p-3 text-left text-sm text-gray-400 hover:bg-white/5"
      >
        Sign out
      </button>
    </aside>
  );
}
