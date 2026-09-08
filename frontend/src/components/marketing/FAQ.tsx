import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/Reveal";

const ITEMS = [
  {
    q: "What can I put in my vault?",
    a: "PDF, Word (.docx), spreadsheets (.csv), Markdown and plain text, up to 10 MB each — plus web pages by URL. Drop in a batch at once and they process in the background.",
  },
  {
    q: "How do I know the answer is right?",
    a: "Every claim carries a citation. Click it and you're looking at the exact passage Retrivo used, with a match score. If your documents don't contain an answer, it tells you that instead of making one up.",
  },
  {
    q: "Is anyone else able to see my documents?",
    a: "No. Every read — the semantic search included — is filtered to your account in the database. Your documents are never used to train a model, and there's no company incentive to touch them: Retrivo is open source and built by one person.",
  },
  {
    q: "How is it different from asking ChatGPT?",
    a: "ChatGPT can't see your files unless you paste them one at a time, it has no memory across documents, and it won't cite a source you can check. Retrivo searches your whole library at once and shows its work.",
  },
  {
    q: "What does it cost?",
    a: "Free forever for a small vault. Every account starts with a 14-day Pro trial (no card). Pro is $9–12/mo and Max $24–29/mo depending on billing period. Cancel any time.",
  },
  {
    q: "Can I get my data out?",
    a: "Any time. Export everything as one JSON file from Settings, delete a single document (its index entries go with it), or delete your account to erase all of it at once.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 py-24 md:py-32">
      <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Questions, answered</h2>
          <p className="mt-4 text-muted-foreground">
            The kind of answer Retrivo would give — sourced.{" "}
            <a href="/about" className="text-primary hover:underline">
              More about the project →
            </a>
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <Accordion type="single" collapsible className="w-full">
            {ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
