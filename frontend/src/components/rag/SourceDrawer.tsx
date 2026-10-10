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
  // Answers saved before sources carried the full passage only have the excerpt.
  const passage = source?.text ?? (source ? `${source.preview}…` : "");

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
          <SheetDescription className="flex items-center gap-2">
            <Badge variant="primary">match {source?.score.toFixed(2)}</Badge>
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
      </SheetContent>
    </Sheet>
  );
}
