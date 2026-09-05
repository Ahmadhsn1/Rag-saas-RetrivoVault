import { FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RetrievedSource } from "@/types/api";

interface SourceDrawerProps {
  source: RetrievedSource | null;
  onOpenChange: (open: boolean) => void;
}

export function SourceDrawer({ source, onOpenChange }: SourceDrawerProps) {
  return (
    <Sheet open={!!source} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary/15 text-primary">
              {source?.index}
            </span>
            Retrieved passage
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge variant="primary">match {source?.score.toFixed(3)}</Badge>
            <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted-foreground">
              <FileText className="h-3 w-3" aria-hidden="true" />
              doc {source?.documentId.slice(-6)}
            </span>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <p className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-foreground/90">
            {source?.preview}
          </p>
        </ScrollArea>
        <div className="border-t border-border p-4 font-mono text-2xs text-muted-foreground">
          chunk {source?.chunkId.slice(-8)} · cosine similarity
        </div>
      </SheetContent>
    </Sheet>
  );
}
