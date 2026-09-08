import { useRef, useState } from "react";
import { UploadCloud, Loader2, X, Link2, FileText } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { notifyApiError } from "@/lib/notifyApiError";
import { cn, formatBytes } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppState } from "@/context/AppContext";
import type { VaultDocument } from "@/types/api";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT_EXT = /\.(pdf|txt|md|markdown|csv|docx|html?)$/i;
const MAX_FILES = 20;

export function UploadDialog({
  onUploaded,
  trigger,
}: {
  onUploaded: (doc: VaultDocument) => void;
  trigger: React.ReactNode;
}) {
  const { collections, activeCollectionId, refetchCollections, refetchUsage } =
    useAppState();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"files" | "url">("files");
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [collectionId, setCollectionId] = useState<string>(activeCollectionId ?? "");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    for (const f of Array.from(list)) {
      if (!ACCEPT_EXT.test(f.name)) {
        toast.error(`"${f.name}" — unsupported type (PDF, TXT, MD, DOCX, CSV, HTML)`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`"${f.name}" is too large (max ${formatBytes(MAX_BYTES, 0)})`);
        continue;
      }
      next.push(f);
    }
    setFiles((cur) => [...cur, ...next].slice(0, MAX_FILES));
  };

  const reset = () => {
    setFiles([]);
    setUrl("");
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submitFiles = async () => {
    setBusy(true);
    let ok = 0;
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (collectionId) fd.append("collectionId", collectionId);
        const { data } = await api.post<{ document: VaultDocument }>(
          "/documents",
          fd,
        );
        onUploaded(data.document);
        ok += 1;
      } catch (err) {
        notifyApiError(err, `Upload failed: ${file.name}`);
      }
    }
    void refetchCollections();
    void refetchUsage();
    if (ok) toast.success(`${ok} document${ok === 1 ? "" : "s"} queued.`);
    setOpen(false);
    reset();
  };

  const submitUrl = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post<{ document: VaultDocument }>(
        "/documents/url",
        { url: url.trim(), collectionId: collectionId || undefined },
      );
      onUploaded(data.document);
      void refetchCollections();
      void refetchUsage();
      toast.success("Page queued for ingestion.");
      setOpen(false);
      reset();
    } catch (err) {
      notifyApiError(err, "Could not fetch that URL");
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add documents</DialogTitle>
          <DialogDescription>
            PDF, text, Markdown, DOCX, CSV or a web page — parsed, chunked and
            embedded in the background.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-md border border-border bg-surface p-0.5 text-sm">
          <button
            onClick={() => setMode("files")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1.5",
              mode === "files" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <FileText className="h-4 w-4" /> Files
          </button>
          <button
            onClick={() => setMode("url")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1.5",
              mode === "url" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <Link2 className="h-4 w-4" /> From URL
          </button>
        </div>

        {mode === "files" ? (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border-strong bg-surface/40",
              )}
            >
              <UploadCloud className="mb-2 h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Drop files here, or{" "}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-primary hover:underline"
                >
                  browse
                </button>{" "}
                (up to {MAX_FILES})
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.markdown,.csv,.docx,.html,.htm"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded bg-surface px-2.5 py-1.5"
                  >
                    <span className="min-w-0 truncate font-mono text-xs">{f.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-2xs text-muted-foreground">
                        {formatBytes(f.size)}
                      </span>
                      <button
                        onClick={() => setFiles((c) => c.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="ingest-url">Web page URL</Label>
            <Input
              id="ingest-url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="font-mono text-2xs text-muted-foreground">
              HTML, text or PDF pages · https only · ≤ 8 MB
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="collection">Collection</Label>
          <select
            id="collection"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="">No collection</option>
            {collections.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={mode === "files" ? submitFiles : submitUrl}
            disabled={busy || (mode === "files" ? files.length === 0 : !url.trim())}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy
              ? "Working…"
              : mode === "files"
                ? `Upload ${files.length || ""}`.trim()
                : "Fetch & add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
