import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Lock, GitBranch } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { Button } from "@/components/ui/button";
import { PipelineStrip } from "@/components/rag/PipelineStrip";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Small enough to read",
    body: "The whole pipeline — extract, chunk, embed, retrieve, answer — is a few hundred lines. You can read it end to end and know exactly what happens to a document you upload.",
  },
  {
    icon: Lock,
    title: "Isolation you can verify",
    body: "Every query, the semantic search included, is filtered by your account id in the database. It's not a setting that can be toggled off — it's how the queries are written. The code is public, so check.",
  },
  {
    icon: GitBranch,
    title: "No incentive to touch your documents",
    body: "There's no ad model, no data resale, no training pipeline. Your text goes to Google Gemini to produce an embedding or an answer, and nowhere else. That's the entire arrangement.",
  },
];

export default function AboutPage() {
  useSeo(
    "About",
    "Retrivo Vault turns the documents you've collected — and never re-read — into a research assistant you can actually ask. Open source, built by one person.",
  );

  const ref = useRef<HTMLDivElement>(null);
  useGsapReveal(ref, "> *", { stagger: 0.08 });

  return (
    <div className="pt-32 pb-24">
      <div className="container max-w-2xl">
        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
          About
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">
          The research assistant that only knows what you've read
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Retrivo Vault turns the documents you've collected — and never
          re-read — into something you can actually ask. Add your contracts,
          papers, transcripts and notes to a private vault, ask in plain
          language, and get an answer in seconds with the exact passage it came
          from. It's private to you, and if the answer isn't in your documents,
          Retrivo says so instead of guessing.
        </p>

        <div className="mt-12">
          <PipelineStrip />
        </div>

        <div className="mt-16">
          <h2 className="text-2xl">Open source, built by one person</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            That's the pitch, not an apology. Retrivo is built and maintained by
            a single independent developer, and the whole thing is open source.
            When the product you trust with your contracts and research is a
            small, readable codebase with no company behind it looking for a
            reason to monetise your files, that's a feature.
          </p>

          <div ref={ref} className="mt-8 space-y-4">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-mono text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl">How your documents are handled</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              Uploads are checked for type and size, parsed in memory, and split
              into passages — the original file is never written to disk.
            </li>
            <li>
              Each passage is embedded as a 768-dimension vector and stored
              against your account. Retrieval is cosine similarity over your
              vectors only.
            </li>
            <li>
              Passwords are bcrypt hashes; API keys and session tokens are
              stored only as hashes; sessions rotate and can be revoked from any
              device.
            </li>
            <li>
              Export everything as one JSON file, delete a single document, or
              delete your account to erase all of it at once.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            The specifics live in the{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              privacy policy
            </Link>{" "}
            and{" "}
            <Link to="/terms" className="text-primary hover:underline">
              terms
            </Link>
            .
          </p>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl">Stop re-reading. Start asking.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Add your first few documents and ask a real question in the next two
            minutes. Free plan, or a 14-day Pro trial with no card.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg">
              <Link to="/signup">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
