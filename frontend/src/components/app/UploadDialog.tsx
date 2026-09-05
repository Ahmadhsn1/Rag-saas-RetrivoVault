import { useRef, useState } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useAppState } from "@/context/AppContext";
import type { VaultDocument } from "@/types/api";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["application/pdf", "text/plain"];

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
  const [file, setFile] = useState<File | null>(null);
  const [collectionId, setCollectionId] = useState<string>(
    activeCollectionId ?? "",
  );
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPT.includes(f.type)) {
      toast.error("Unsupported file type. Upload a PDF or .txt file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error(`File is too large (max ${formatBytes(MAX_BYTES, 0)}).`);
      return;
    }
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (collectionId) fd.append("collectionId", collectionId);
      const { data } = await api.post<{ document: VaultDocument }>(
        "/documents",
        fd,
      );
      onUploaded(data.document);
      void refetchCollections();
      void refetchUsage();
      toast.success(`"${file.name}" queued for ingestion.`);
      setOpen(false);
      reset();
    } catch (err) {
      notifyApiError(err, "Upload failed");
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
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>
            PDF or plain text, up to {formatBytes(MAX_BYTES, 0)}. It's parsed,
            chunked, and embedded in the background.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border-strong bg-surface/40",
          )}
        >
          {file ? (
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className="font-mono text-sm">{file.name}</p>
                <p className="font-mono text-2xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                onClick={() => reset()}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud
                className="mb-3 h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                Drag a file here, or{" "}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-primary hover:underline"
                >
                  browse
                </button>
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

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
          <Button variant="brand" onClick={submit} disabled={!file || busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
