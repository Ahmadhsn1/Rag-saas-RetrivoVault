import { Lightbulb } from "lucide-react";

export function SuggestedQuestions({
  questions,
  onPick,
}: {
  questions: string[];
  onPick: (q: string) => void;
}) {
  if (!questions.length) return null;
  return (
    <div className="mx-auto mt-6 max-w-lg">
      <p className="mb-2 flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
        <Lightbulb className="h-3 w-3" aria-hidden="true" />
        Try asking
      </p>
      <div className="flex flex-col gap-1.5">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground/90 transition-colors hover:border-border-strong hover:bg-secondary/40"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
