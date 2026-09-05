import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Composer({
  onSend,
  disabled,
  streaming,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  streaming?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-input bg-surface px-3 py-2 transition-colors focus-within:border-primary",
        )}
      >
        <label htmlFor="composer" className="sr-only">
          Ask a question about your documents
        </label>
        <textarea
          id="composer"
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder="Ask something about your documents…"
          onChange={(e) => {
            setValue(e.target.value);
            grow();
          }}
          onKeyDown={onKeyDown}
          className="max-h-[180px] flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
          aria-label="Send"
        >
          {streaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl font-mono text-2xs text-muted-foreground">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}
