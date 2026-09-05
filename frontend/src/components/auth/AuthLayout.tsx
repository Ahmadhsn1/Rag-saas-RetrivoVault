import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { PipelineStrip } from "@/components/rag/PipelineStrip";

const SIGNALS = [
  "conn atlas://cluster0 · ok",
  "index chunks_vector_index · ready",
  "embed text-embedding-004 · 768d",
  "model gemini-2.5-flash · streaming",
  "auth jwt · access 15m / refresh 7d",
];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="w-fit rounded-md">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-2xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-surface/30 lg:block">
        <div className="glow-hero absolute inset-0" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-center gap-10 px-12">
          <PipelineStrip animated />
          <div className="terminal-panel p-4">
            <p className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
              boot sequence
            </p>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-muted-foreground">
              {SIGNALS.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
