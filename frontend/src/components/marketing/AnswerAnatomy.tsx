import {
  BookOpenText,
  FileSearch,
  FolderTree,
  MessagesSquare,
  ShieldQuestion,
  Share2,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const POINTS = [
  {
    icon: BookOpenText,
    title: "The passage, not a paraphrase",
    body: "Open any citation to read the exact text the answer was drawn from, with the document name and page.",
  },
  {
    icon: FileSearch,
    title: "The original, one click away",
    body: "Jump from a citation straight to that page of the PDF you uploaded. Nothing to hunt for.",
  },
  {
    icon: ShieldQuestion,
    title: "An honest “not in your documents”",
    body: "When your files don’t contain the answer, Retrivo says so. It never fills the gap from general knowledge.",
  },
  {
    icon: MessagesSquare,
    title: "Follow-ups that keep the thread",
    body: "Ask “and the notice period?” and it knows which contract you mean. Conversations are saved and resumable.",
  },
  {
    icon: FolderTree,
    title: "Collections for each matter",
    body: "Group documents by client, case or project and scope a question to just those — with your own standing instructions.",
  },
  {
    icon: Share2,
    title: "Answers you can hand over",
    body: "Export a conversation with its sources, or share a read-only link. Revoke it whenever you like.",
  },
];

export function AnswerAnatomy() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">What you get</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">
            An answer is only useful if you can check it
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Retrivo is built around that one idea. Everything else in the
            product exists to make checking fast.
          </p>
        </Reveal>

        <dl className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t border-border-strong pt-5">
              <dt className="flex items-start gap-3 font-serif text-lg leading-snug">
                <Icon className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {title}
              </dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
