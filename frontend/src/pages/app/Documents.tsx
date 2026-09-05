import { MoreHorizontal, Trash2, FileText, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import { useAppState } from "@/context/AppContext";
import { StatusChip } from "@/components/rag/StatusChip";
import { EmptyState } from "@/components/app/EmptyState";
import { UploadDialog } from "@/components/app/UploadDialog";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/ui/button";
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

export default function Documents() {
  const { activeCollectionId, activeCollection, collections } = useAppState();
  const { documents, loading, setDocuments } = useDocuments(activeCollectionId);

  const collectionName = (id: string | null) =>
    id ? (collections.find((c) => c._id === id)?.name ?? "—") : "—";

  const remove = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((d) => d.filter((x) => x._id !== id));
      toast.success("Document deleted.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
    }
  };

  const uploadTrigger = (
    <Button variant="brand" size="sm">
      <UploadCloud className="h-4 w-4" />
      Upload
    </Button>
  );

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-lg font-semibold">
            {activeCollection ? activeCollection.name : "All documents"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length === 1 ? "" : "s"}
          </p>
        </div>
        <UploadDialog
          onUploaded={(doc) => setDocuments((d) => [doc, ...d])}
          trigger={uploadTrigger}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a PDF or text file to start building this knowledge base."
          action={
            <UploadDialog
              onUploaded={(doc) => setDocuments((d) => [doc, ...d])}
              trigger={uploadTrigger}
            />
          }
        />
      ) : (
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
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell className="max-w-[220px]">
                    <span className="flex items-center gap-2">
                      <FileText
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate font-mono text-xs">
                        {doc.filename}
                      </span>
                    </span>
                    {doc.status === "failed" && doc.error && (
                      <span className="mt-1 block truncate font-mono text-2xs text-destructive">
                        {doc.error}
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
      )}
    </div>
  );
}
