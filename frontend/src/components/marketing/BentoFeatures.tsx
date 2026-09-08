import {
  FileStack,
  Search,
  Quote,
  FolderTree,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, RevealItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { PipelineStrip } from "@/components/rag/PipelineStrip";
import { Badge } from "@/components/ui/badge";

function Cell({
  span,
  glow,
  children,
}: {
  span?: string;
  glow?: string;
  children: React.ReactNode;
}) {
  return (
    <RevealItem className={cn("h-full", span)}>
      <SpotlightCard className="flex h-full flex-col p-6" glow={glow} lift>
        {children}
      </SpotlightCard>
    </RevealItem>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary transition-colors duration-200 group-hover:border-primary/60 [&_svg]:h-5 [&_svg]:w-5">
      {children}
    </span>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-24 md:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            What's inside
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            A full RAG pipeline, not a wrapper
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every stage from parsing to grounded generation — built to be read and run.
          </p>
        </Reveal>

        <Stagger
          wrapChildren={false}
          stagger={0.07}
          className="mt-14 grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* wide: ingestion */}
          <Cell span="sm:col-span-2">
            <Icon>
              <FileStack />
            </Icon>
            <h3 className="mt-4 font-mono text-lg font-semibold">
              Automated ingestion
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Drop a PDF or text file. Retrivo extracts, cleans, chunks with
              overlap, and embeds every passage — status tracked from processing
              to ready.
            </p>
            <div className="mt-auto pt-5">
              <PipelineStrip compact />
            </div>
          </Cell>

          {/* tall: retrieval */}
          <Cell span="lg:row-span-2">
            <Icon>
              <Search />
            </Icon>
            <h3 className="mt-4 font-mono text-lg font-semibold">
              Vector retrieval
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Questions are embedded and matched against your chunks with
              MongoDB Atlas <code className="text-foreground">$vectorSearch</code>
              {" "}— 768-dim cosine similarity, top-k tuned per query.
            </p>
            <div className="mt-auto space-y-1.5 pt-5 font-mono text-2xs">
              {[
                ["clause 4.2 · renewal", 0.842],
                ["clause 7.1 · termination", 0.791],
                ["exhibit B · fees", 0.634],
              ].map(([label, score]) => (
                <div key={label as string} className="flex items-center gap-2">
                  <span className="w-40 truncate text-muted-foreground">
                    {label}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="block h-full bg-primary"
                      style={{ width: `${(score as number) * 100}%` }}
                    />
                  </span>
                  <span className="text-ok">{score}</span>
                </div>
              ))}
            </div>
          </Cell>

          <Cell>
            <Icon>
              <Quote />
            </Icon>
            <h3 className="mt-4 font-mono text-base font-semibold">Cited answers</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The model answers only from retrieved context and marks each claim
              with a clickable source.
            </p>
          </Cell>

          <Cell>
            <Icon>
              <FolderTree />
            </Icon>
            <h3 className="mt-4 font-mono text-base font-semibold">Collections</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Group documents by project and scope a conversation to keep
              retrieval on-subject.
            </p>
          </Cell>

          <Cell>
            <Icon>
              <Radio />
            </Icon>
            <h3 className="mt-4 font-mono text-base font-semibold">Streaming chat</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Answers stream token-by-token over SSE. Sessions persist with full
              history for follow-ups.
            </p>
          </Cell>

          {/* wide: isolation */}
          <Cell span="sm:col-span-2" glow="rgba(74,222,128,0.12)">
            <div className="flex items-start justify-between">
              <Icon>
                <ShieldCheck />
              </Icon>
              <Badge variant="ok">userId filter</Badge>
            </div>
            <h3 className="mt-4 font-mono text-lg font-semibold">
              Per-user isolation
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Every query — vector search included — is filtered by your account.
              One user never sees another user's documents or chunks. Isolation is
              the filter on every read, not a setting.
            </p>
          </Cell>
        </Stagger>
      </div>
    </section>
  );
}
