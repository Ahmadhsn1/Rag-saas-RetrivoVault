import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ITEMS = [
  {
    q: "What file types can I upload?",
    a: "PDF and plain-text (.txt) files today, up to 10 MB each. DOCX, Markdown, and CSV are on the roadmap.",
  },
  {
    q: "Where do the answers come from?",
    a: "Only from passages retrieved out of your own documents. If the context doesn't contain an answer, Retrivo says so rather than guessing — and every claim links back to the passage it used.",
  },
  {
    q: "Can other users see my documents?",
    a: "No. Every read — including the Atlas vector search — is filtered by your user id. Your vault is yours alone.",
  },
  {
    q: "Which models does it use?",
    a: "Google Gemini text-embedding-004 for embeddings (768-dim) and gemini-2.5-flash for generation, streamed token-by-token.",
  },
  {
    q: "Do I need my own API keys?",
    a: "On the Free plan the app runs against a shared quota. Pro and Max plans include generous limits; you can also bring your own Gemini key on any paid plan.",
  },
  {
    q: "Can I export or delete my data?",
    a: "Yes. Delete a document and its chunks are removed immediately. Account deletion wipes every document, chunk, and chat in one action.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 py-24 md:py-32">
      <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Questions, answered</h2>
          <p className="mt-4 text-muted-foreground">
            Still curious? Everything here is open source — read the code.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
