import { Link } from "react-router-dom";
import { FileText, Lightbulb } from "lucide-react";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusChip } from "@/components/rag/StatusChip";
import type { VaultDocument } from "@/types/api";

export function DocumentDrawer({
  doc,
  onOpenChange,
}: {
  doc: VaultDocument | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{doc?.filename}</span>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {doc && <StatusChip status={doc.status} chunkCount={doc.chunkCount} />}
            <span className="font-mono text-2xs text-muted-foreground">
              {doc && formatBytes(doc.sizeBytes)} · {doc && formatRelativeTime(doc.uploadedAt)}
            </span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 p-6">
            {doc?.status === "failed" && doc.error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {doc.error}
              </p>
            )}

            {doc?.summary ? (
              <div>
                <p className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                  Summary
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {doc.summary}
                </p>
              </div>
            ) : doc?.status === "ready" ? (
              <p className="text-sm text-muted-foreground">
                No summary was generated for this document.
              </p>
            ) : null}

            {doc?.suggestedQuestions && doc.suggestedQuestions.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                  <Lightbulb className="h-3 w-3" aria-hidden="true" />
                  Starter questions
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {doc.suggestedQuestions.map((q) => (
                    <Link
                      key={q}
                      to={`/app?ask=${encodeURIComponent(q)}`}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground/90 transition-colors hover:border-border-strong hover:bg-secondary/40"
                    >
                      {q}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {doc?.sourceUrl && (
              <p className="font-mono text-2xs text-muted-foreground">
                source:{" "}
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {doc.sourceUrl}
                </a>
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
