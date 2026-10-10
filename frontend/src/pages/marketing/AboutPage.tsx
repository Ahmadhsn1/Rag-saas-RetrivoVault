import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { Button } from "@/components/ui/button";

const PRINCIPLES = [
  {
    title: "Proof before polish",
    body: "An answer you can’t check is a liability. Every claim Retrivo makes points at the passage and the page it came from, and opens the original file there.",
  },
  {
    title: "Your documents only",
    body: "Retrivo answers from what you have added and nothing else. When your files don’t contain the answer, it tells you — it does not improvise one.",
  },
  {
    title: "Private by construction",
    body: "Every search is filtered to your account inside the database. Your documents are never shared and never used to train a model.",
  },
];

const HANDLING = [
  "Uploads are checked for type and size, read, and split into passages. The original is kept so you can open the page a citation points to.",
  "Each passage is indexed against your account. Search runs over your passages only — by meaning and by exact wording.",
  "Passwords are stored as hashes; API keys and session tokens only as hashes; a model key you bring is encrypted.",
  "Export everything as one file, delete a single document, or delete your account to erase all of it at once.",
];

export default function AboutPage() {
  useSeo(
    "About",
    "Retrivo turns the documents you have collected into something you can ask — and shows the passage behind every answer.",
  );

  return (
    <div className="pb-24 pt-36">
      <article className="container max-w-3xl">
        <p className="eyebrow">About</p>
        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
          The research assistant that only knows what you&rsquo;ve read
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
          Most of what a professional needs to know is already written down —
          in a contract, a paper, a transcript, a set of notes. The trouble is
          finding it again. Retrivo makes those documents answerable, and makes
          every answer checkable.
        </p>

        <h2 className="mt-16 text-2xl sm:text-3xl">What we hold ourselves to</h2>
        <dl className="mt-6 divide-y divide-border border-y border-border">
          {PRINCIPLES.map(({ title, body }) => (
            <div key={title} className="grid gap-1 py-6 sm:grid-cols-[14rem_1fr] sm:gap-8">
              <dt className="font-serif text-xl">{title}</dt>
              <dd className="leading-relaxed text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-16 text-2xl sm:text-3xl">How your documents are handled</h2>
        <ol className="mt-6 space-y-4">
          {HANDLING.map((line, i) => (
            <li key={i} className="flex gap-4 leading-relaxed text-muted-foreground">
              <span className="font-serif text-xl leading-7 text-brand">{i + 1}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-muted-foreground">
          The specifics are in the{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-4">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" className="text-primary underline underline-offset-4">
            terms
          </Link>
          .
        </p>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-2xl">Ask your documents. Check the source.</p>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/signup">
                Start free
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
