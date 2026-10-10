import { useState } from "react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { openOriginal } from "@/lib/documents";
import type { RetrievedSource } from "@/types/api";

interface SourceDrawerProps {
  source: RetrievedSource | null;
  onOpenChange: (open: boolean) => void;
}

export function SourceDrawer({ source, onOpenChange }: SourceDrawerProps) {
  const [opening, setOpening] = useState(false);
  // Answers saved before sources carried the full passage only have the excerpt.
  const passage = source?.text ?? (source ? `${source.preview}…` : "");

  const open = async () => {
    if (!source?.filename) return;
    setOpening(true);
    try {
      await openOriginal(source.documentId, source.filename, source.page);
    } catch {
      toast.error("The original file isn't available for this document.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <Sheet open={!!source} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary/15 text-primary">
              {source?.index}
            </span>
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{source?.filename ?? "Source passage"}</span>
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {source?.page ? <Badge variant="primary">page {source.page}</Badge> : null}
            {source && source.score > 0 ? (
              <Badge>match {source.score.toFixed(2)}</Badge>
            ) : (
              <Badge>keyword match</Badge>
            )}
            <span className="text-2xs text-muted-foreground">
              The exact passage this answer drew on.
            </span>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <p className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-foreground/90">
            {passage}
          </p>
        </ScrollArea>
        {source?.filename && (
          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={open}
              disabled={opening}
            >
              {opening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Open the original{source.page ? ` at page ${source.page}` : ""}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
