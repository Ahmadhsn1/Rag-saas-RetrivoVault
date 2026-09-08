import { Link } from "react-router-dom";
import { Check, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useAppState } from "@/context/AppContext";
import { PipelineStrip } from "@/components/rag/PipelineStrip";
import { UploadDialog } from "@/components/app/UploadDialog";
import { Button } from "@/components/ui/button";
import type { VaultDocument } from "@/types/api";

interface Step {
  done: boolean;
  title: string;
  body: string;
  action?: React.ReactNode;
}

export function OnboardingChecklist({
  hasReadyDoc,
  onUploaded,
}: {
  hasReadyDoc: boolean;
  onUploaded: (doc: VaultDocument) => void;
}) {
  const { user } = useAuth();
  const { usage } = useAppState();

  const hasDocs = (usage?.current.documents ?? 0) > 0;
  const askedSomething = (usage?.current.queries ?? 0) > 0;

  const steps: Step[] = [
    {
      done: Boolean(user?.emailVerified),
      title: "Verify your email",
      body: "Secures your account and unlocks password recovery.",
      action: user?.emailVerified ? undefined : (
        <Button asChild size="sm" variant="outline">
          <Link to="/app/settings?tab=account">Verify</Link>
        </Button>
      ),
    },
    {
      done: hasDocs,
      title: "Add a document",
      body: "A contract, a paper, a transcript — PDF, Word, spreadsheet, note or web page. Retrivo reads and indexes it for you.",
      action: hasDocs ? undefined : (
        <UploadDialog
          onUploaded={onUploaded}
          trigger={
            <Button size="sm" variant="brand">
              Upload
            </Button>
          }
        />
      ),
    },
    {
      done: askedSomething,
      title: "Ask your first question",
      body: "Type it below in plain language. The answer streams back with the passage it came from behind every claim.",
    },
  ];

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-14 text-center">
      <PipelineStrip />

      <div className="w-full space-y-2 text-left">
        <p className="text-center font-mono text-sm font-semibold">
          {hasReadyDoc ? "Ask your vault" : "Get set up in three steps"}
        </p>
        <ul className="mt-4 space-y-2">
          {steps.map((step, i) => (
            <li
              key={step.title}
              style={{ animationDelay: `${i * 70}ms` }}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300",
                step.done ? "border-ok/25 bg-ok/5" : "border-border bg-card hover:border-border-strong",
              )}
            >
              {step.done ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
              ) : (
                <Circle
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-mono text-xs font-medium",
                    step.done && "text-muted-foreground line-through",
                  )}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.body}</p>
              </div>
              {step.action && <div className="shrink-0">{step.action}</div>}
            </li>
          ))}
        </ul>
        {hasReadyDoc && (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            <ArrowRight className="mr-1 inline h-3 w-3" />
            Your vault is ready — ask it anything.
          </p>
        )}
      </div>
    </div>
  );
}
