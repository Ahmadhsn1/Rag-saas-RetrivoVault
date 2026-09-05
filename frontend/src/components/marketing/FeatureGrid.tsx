import { useRef } from "react";
import {
  FileStack,
  Search,
  Quote,
  FolderTree,
  Radio,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: FileStack,
    title: "Automated ingestion",
    body: "Drop a PDF or text file. Retrivo extracts, cleans, chunks with overlap, and embeds every passage — status tracked from processing to ready.",
  },
  {
    icon: Search,
    title: "Vector retrieval",
    body: "Questions are embedded and matched against your chunks with MongoDB Atlas $vectorSearch — 768-dim cosine similarity, top-k tuned per query.",
  },
  {
    icon: Quote,
    title: "Cited answers",
    body: "The model answers only from retrieved context and marks each claim with a source. Click a citation to read the exact passage and its match score.",
  },
  {
    icon: FolderTree,
    title: "Collections",
    body: "Group documents by project or topic and scope a conversation to one collection so retrieval stays on-subject.",
  },
  {
    icon: Radio,
    title: "Streaming chat",
    body: "Answers stream token-by-token over SSE. Sessions persist with full history so follow-up questions keep their context.",
  },
  {
    icon: ShieldCheck,
    title: "Per-user isolation",
    body: "Every query — vector search included — is filtered by your user id. One account never sees another account's documents or chunks.",
  },
];

export function FeatureGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapReveal(gridRef, "> *");

  return (
    <section id="features" className="scroll-mt-24 py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            What's inside
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            A full RAG pipeline, not a wrapper
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything from parsing to grounded generation, built to be read and run.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="group rounded-lg border border-border bg-card p-6 shadow-md transition-colors duration-150 hover:border-border-strong"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-mono text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
