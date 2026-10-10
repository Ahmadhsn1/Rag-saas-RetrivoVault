import { useSeo } from "@/hooks/useSeo";

const TERMS = {
  title: "Terms of Service",
  updated: "September 2026",
  sections: [
    [
      "What this is",
      "Retrivo is a private, sourced knowledge base for one person. We work to keep it available and correct, but it is provided as-is, without a formal service-level guarantee. Answers are an aid to your own reading, not professional advice — check the cited passage before you rely on one, and keep your own copies of anything you can't afford to lose.",
    ],
    [
      "Your account",
      "You're responsible for what you upload and for keeping your credentials safe. One account is for one person. Don't upload content you don't have the right to use, and don't try to break, overload, or probe the service.",
    ],
    [
      "Your content",
      "You keep all rights to your documents and chats. We process them only to provide the product: extraction, embedding, retrieval, and generation. Your text is sent to Google Gemini for embeddings and answers. We don't sell or share your content.",
    ],
    [
      "Plans & billing",
      "Free, Pro and Max. Paid plans are billed through Stripe; you can cancel any time from the billing portal and keep access until the period ends. Prices may change with notice.",
    ],
    [
      "Termination",
      "You can delete your account at any time — it wipes every document, chunk, chat and key immediately. We may suspend accounts that abuse the service.",
    ],
    [
      "Changes",
      "These terms may be updated; continued use means you accept the current version.",
    ],
  ],
};

const PRIVACY = {
  title: "Privacy Policy",
  updated: "September 2026",
  sections: [
    [
      "What we store",
      "Your name and email, a bcrypt hash of your password, your documents and the text chunks + embeddings derived from them, your chat history, usage counters, an activity log, and (if you set them) API keys and webhook endpoints — all hashed where they're secrets.",
    ],
    [
      "Third parties",
      "Google Gemini receives your document text and questions to produce embeddings and answers. Stripe handles payments (we never see card numbers). If email is configured, an SMTP provider sends verification and reset messages. That's it — no analytics or ad trackers.",
    ],
    [
      "Cookies",
      "One httpOnly cookie holds your refresh token so you stay signed in. No tracking cookies.",
    ],
    [
      "Your controls",
      "Export everything as JSON from Settings → Activity. Delete a document to remove it and its chunks. Delete your account to erase everything. Adjust email preferences in Settings → Notifications.",
    ],
    [
      "Retention",
      "Content lives until you delete it or your account. Notifications auto-expire after 90 days, the activity log after 180 days, usage events after ~13 months.",
    ],
    [
      "Contact",
      "For anything privacy-related, reply to any email you have received from Retrivo and it will reach a person.",
    ],
  ],
};

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const doc = kind === "terms" ? TERMS : PRIVACY;
  useSeo(doc.title);

  return (
    <div className="pt-32 pb-24">
      <div className="container max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated {doc.updated}
        </p>
        <div className="mt-10 space-y-8">
          {doc.sections.map(([h, body]) => (
            <section key={h}>
              <h2 className="text-base font-semibold">{h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
