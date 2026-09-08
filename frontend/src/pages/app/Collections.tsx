import { useState, type FormEvent } from "react";
import {
  FolderTree,
  Plus,
  Check,
  X,
  Pencil,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { formatRelativeTime } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import { EmptyState } from "@/components/app/EmptyState";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { Collection } from "@/types/api";

export default function Collections() {
  const { collections, collectionsLoading, refetchCollections } = useAppState();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await api.post("/collections", { name });
      setNewName("");
      await refetchCollections();
      toast.success(`Collection "${name}" created.`);
    } catch (err) {
      notifyApiError(err, "Could not create collection");
    } finally {
      setCreating(false);
    }
  };

  const rename = async (id: string) => {
    const name = editName.trim();
    if (!name) return setEditingId(null);
    try {
      await api.patch(`/collections/${id}`, { name });
      setEditingId(null);
      await refetchCollections();
      toast.success("Collection renamed.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Rename failed"));
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/collections/${id}`);
      await refetchCollections();
      toast.success("Collection deleted. Documents were kept.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
    }
  };

  const saveInstructions = async (id: string, instructions: string) => {
    try {
      await api.patch(`/collections/${id}`, { instructions });
      await refetchCollections();
      toast.success("Instructions saved.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Save failed"));
    }
  };

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h2 className="font-mono text-lg font-semibold">Collections</h2>
        <p className="text-sm text-muted-foreground">
          Group documents by project or topic to keep retrieval on-subject.
        </p>
      </div>

      <Card className="mb-6 p-4">
        <form onSubmit={create} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New collection name"
            aria-label="New collection name"
          />
          <Button type="submit" variant="brand" disabled={creating || !newName.trim()}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </form>
      </Card>

      {collectionsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No collections"
          description="Create one above, then upload documents into it."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {collections.map((c) => (
            <Card key={c._id} className="group p-4">
              {editingId === c._id ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void rename(c._id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    aria-label="Collection name"
                    className="h-8"
                  />
                  <button
                    onClick={() => void rename(c._id)}
                    className="rounded-md p-1.5 text-ok hover:bg-secondary"
                    aria-label="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold">{c.name}</p>
                      <p className="mt-1 font-mono text-2xs text-muted-foreground">
                        {c.documentCount ?? 0} docs · created{" "}
                        {formatRelativeTime(c.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        onClick={() => {
                          setEditingId(c._id);
                          setEditName(c.name);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        aria-label={`Rename ${c.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <ConfirmDialog
                        title="Delete collection?"
                        description={`"${c.name}" will be removed. Its documents are kept and moved to "All documents".`}
                        confirmLabel="Delete"
                        onConfirm={() => remove(c._id)}
                        trigger={
                          <button
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                            aria-label={`Delete ${c.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        }
                      />
                    </div>
                  </div>
                  <InstructionsEditor collection={c} onSave={saveInstructions} />
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InstructionsEditor({
  collection,
  onSave,
}: {
  collection: Collection;
  onSave: (id: string, instructions: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(collection.instructions ?? "");
  const dirty = value !== (collection.instructions ?? "");

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <Wand2 className="h-3 w-3" />
        Custom instructions
        {collection.instructions ? (
          <span className="text-ok">· set</span>
        ) : null}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="e.g. Answer as a cautious contracts lawyer. Always quote the exact clause."
            className="text-xs"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={!dirty}
              onClick={() => onSave(collection._id, value)}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
