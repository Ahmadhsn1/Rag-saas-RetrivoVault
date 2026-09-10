import { useEffect, useState } from "react";
import {
  MoreHorizontal,
  Trash2,
  FileText,
  UploadCloud,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorCode, apiErrorMessage } from "@/lib/api";
import { formatBytes, formatNumber, formatRelativeTime } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import { useAppState } from "@/context/AppContext";
import { StatusChip } from "@/components/rag/StatusChip";
import { EmptyState } from "@/components/app/EmptyState";
import { UploadDialog } from "@/components/app/UploadDialog";
import { DocumentDrawer } from "@/components/app/DocumentDrawer";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DocumentStatus, VaultDocument } from "@/types/api";

const STATUS_FILTERS: (DocumentStatus | "all")[] = [
  "all",
  "ready",
  "processing",
  "failed",
];

export default function Documents() {
  const { activeCollectionId, activeCollection, collections, refetchUsage } =
    useAppState();
  const [rawQuery, setRawQuery] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<DocumentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [drawerDoc, setDrawerDoc] = useState<VaultDocument | null>(null);

  // debounce the search box
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(rawQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [rawQuery]);

  useEffect(() => setPage(1), [activeCollectionId, status]);

  const { documents, total, pages, loading, setDocuments, refetch } =
    useDocuments({ collectionId: activeCollectionId, q, status, page });

  const collectionName = (id: string | null) =>
    id ? (collections.find((c) => c._id === id)?.name ?? "—") : "—";

  const remove = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((d) => d.filter((x) => x._id !== id));
      void refetchUsage();
      void refetch();
      toast.success("Document deleted.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
    }
  };

  const [retrying, setRetrying] = useState<string | null>(null);
  const retry = async (doc: VaultDocument) => {
    setRetrying(doc._id);
    try {
      const { data } = await api.post<{ document: VaultDocument }>(
        `/documents/${doc._id}/retry`,
      );
      setDocuments((d) => d.map((x) => (x._id === doc._id ? data.document : x)));
      toast.success("Retrying — reprocessing now.");
      void refetch();
    } catch (err) {
      if (apiErrorCode(err) === "reupload_required") {
        toast.error("The original file isn't stored — re-upload it to retry.", {
          action: { label: "Upload", onClick: () => setUploadOpen(true) },
          duration: 8000,
        });
      } else {
        toast.error(apiErrorMessage(err, "Retry failed"));
      }
    } finally {
      setRetrying(null);
    }
  };
  const [uploadOpen, setUploadOpen] = useState(false);

  const uploadTrigger = (
    <Button variant="brand" size="sm">
      <UploadCloud className="h-4 w-4" />
      Upload
    </Button>
  );

  const onUploaded = () => {
    void refetch();
    void refetchUsage();
  };

  const isFiltered = q !== "" || status !== "all";
  const showEmpty = !loading && documents.length === 0 && !isFiltered;

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-lg font-semibold">
            {activeCollection ? activeCollection.name : "All documents"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatNumber(total)} document{total === 1 ? "" : "s"}
          </p>
        </div>
        <UploadDialog
          onUploaded={onUploaded}
          trigger={uploadTrigger}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
      </div>

      {!showEmpty && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Search by filename…"
              aria-label="Search documents"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex gap-1 rounded-md border border-border bg-surface p-0.5 font-mono text-2xs">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-sm px-2 py-1 uppercase transition-colors",
                  status === s
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : showEmpty ? (
        <EmptyState
          icon={FileText}
          title="Your vault is empty"
          description="Add a PDF, Word file, spreadsheet, note or web page. Retrivo reads and indexes it in the background, then you can ask."
          action={<UploadDialog onUploaded={onUploaded} trigger={uploadTrigger} />}
        />
      ) : documents.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search or filter." />
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Collection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Size</TableHead>
                  <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
                  <TableHead className="w-10" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc, i) => (
                  <TableRow
                    key={doc._id}
                    className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300"
                    style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}
                  >
                    <TableCell className="max-w-[220px]">
                      <button
                        onClick={() => setDrawerDoc(doc)}
                        className="flex items-center gap-2 text-left hover:text-primary"
                      >
                        <FileText
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="truncate font-mono text-xs">
                          {doc.filename}
                        </span>
                      </button>
                      {doc.status === "failed" && (
                        <span className="mt-1 flex items-center gap-2">
                          {doc.error && (
                            <span className="block min-w-0 truncate font-mono text-2xs text-destructive">
                              {doc.error}
                            </span>
                          )}
                          <button
                            onClick={() => void retry(doc)}
                            disabled={retrying === doc._id}
                            className="inline-flex shrink-0 items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-2xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                          >
                            <RotateCw
                              className={cn(
                                "h-3 w-3",
                                retrying === doc._id && "animate-spin",
                              )}
                            />
                            {doc.sourceUrl ? "Retry" : "Re-upload"}
                          </button>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                      {collectionName(doc.collectionId)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={doc.status} chunkCount={doc.chunkCount} />
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                      {formatBytes(doc.sizeBytes)}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                      {formatRelativeTime(doc.uploadedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {doc.status === "failed" && (
                            <DropdownMenuItem onSelect={() => void retry(doc)}>
                              <RotateCw className="h-4 w-4" />
                              {doc.sourceUrl ? "Retry ingestion" : "Re-upload to retry"}
                            </DropdownMenuItem>
                          )}
                          <ConfirmDialog
                            title="Delete document?"
                            description={`"${doc.filename}" and its ${doc.chunkCount} chunks will be permanently removed.`}
                            confirmLabel="Delete"
                            onConfirm={() => remove(doc._id)}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DocumentDrawer
            doc={drawerDoc}
            onOpenChange={(o) => !o && setDrawerDoc(null)}
          />

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between font-mono text-2xs text-muted-foreground">
              <span>
                page {page} / {pages}
              </span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
