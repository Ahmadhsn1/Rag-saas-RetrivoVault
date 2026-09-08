# Retrivo Vault — Brand

The single source of truth for how Retrivo Vault sounds, looks, and positions
itself. If marketing copy, an email, a notification, or UI text disagrees with
this file, this file wins.

---

## 1. The truth we're selling against

**You've already read the answer — you just can't find it.**

Our users accumulate documents as part of their work — contracts, papers,
transcripts, reports, decks. The value is locked in the pile:

- The archive is **write-only**. You save things "to read later"; later never comes.
- **Keyword search fails** — you don't remember the exact phrasing, and documents
  don't share vocabulary.
- **General AI can't see your files** — and pasting them in loses cross-document
  context and gives answers you can't verify.
- Every document you add makes the pile **heavier, not smarter**.

## 2. Category frame

Not "another AI chatbot." Retrivo Vault is **the research assistant that only
knows what you've read** — an extension of your own memory. Private, and every
answer is backed by the passage it came from.

## 3. Audience — "the document-rich individual"

| Persona | Their pile | The question they can't answer fast |
|---|---|---|
| Independent consultant / fractional exec | Years of client contracts, SOWs, decks | "What were the payment terms on the Acme engagement?" |
| Researcher / analyst / grad student | Hundreds of papers and reports | "Which of these studies used a control group?" |
| Solo legal professional | Contracts, filings, statutes, discovery | "Which clause covers early termination?" |
| Founder / solo operator | Cap table docs, board minutes, vendor agreements | "When does our SOC 2 renew?" |
| Writer / journalist | Interview transcripts, background research | "Where exactly did the source say that?" |

Secondary: anyone with a personal PDF graveyard — course material, manuals, saved
articles, financial statements, medical records.

**Individuals only.** No teams, seats, workspaces, or "contact sales."

## 4. The promise

**Ask your documents anything. Get a sourced answer in seconds. Privately.**

Three proof points, always in this order:

1. **Sourced.** Every claim links to the exact passage and a similarity score.
   If the answer isn't in your documents, Retrivo says so instead of guessing.
2. **Private.** Your documents never train a model and are never visible to
   another user. Isolation is the filter on every query — enforced in the
   database, not a checkbox.
3. **Everything.** PDF, Word, web pages, spreadsheets, Markdown, notes. One vault.

## 5. Why not just… (how we win the comparison)

| The alternative | Why it falls short |
|---|---|
| Paste files into ChatGPT | One file at a time, no memory across documents, no citation to check, and your text goes to OpenAI |
| Cmd-F / keyword search | Needs the exact word; misses synonyms and paraphrase |
| Notion AI / generic doc assistants | Answers with no source; won't tell you what it's unsure of |
| An enterprise RAG tool | Built for teams, needs IT, priced per seat, gated behind sales |

## 6. Messaging ladder

- **One-liner** (nav, OG, tab): *Your documents, answerable.*
- **Hero sub:** *Add your contracts, papers and notes to a private vault. Ask in
  plain language. Every answer cites the source.*
- **Elevator** (about, meta): *Retrivo Vault turns the documents you've collected —
  and never re-read — into a research assistant you can actually ask. Private to
  you, and every answer is backed by the passage it came from.*
- **Proof line:** *Semantic retrieval over your own text — 768-dimension vectors,
  cited answers, isolated per user.*

## 7. Personality & voice

Exacting (a careful research librarian) · Private (discreet, trustworthy) ·
Unshowy (shows the mechanism instead of hiding behind magic) · For grown-ups
(assumes the reader is smart and busy).

**Do**
- Concrete nouns: "the renewal clause," "40 papers," "interview transcripts."
- Honest mechanics: show the pipeline, the `$vectorSearch`, the match scores.
- "If it's not in your documents, Retrivo says so."
- Short sentences. Active voice. Second person ("you," "your vault").

**Don't**
- "Unleash," "revolutionary," "supercharge," "game-changing," "powered by AI."
- Vague nouns: "content," "data," "information," "stuff," "knowledge" (as a mass noun).
- Exclamation marks in body copy. Emoji as decoration.
- Call it "the app" or "the platform" in user-facing copy — it's "Retrivo" or "your vault."

## 8. Naming & lockup

- Full brand: **Retrivo Vault**
- Short form (running text, app chrome, emails): **Retrivo**
- "your vault" — a common noun in copy: *open your vault*, *add to your vault*,
  *what's in your vault stays in your vault*
- Never: "RetrivoVault" (one word), "RV", "the Retrivo Vault app"
- Wordmark: `Retrivo` in JetBrains Mono medium, `Vault` following in the muted
  foreground colour with a hair of letter-spacing. The mark (rounded square with
  a downward `V` / checkmark and a dot) sits left, bone stroke on the square,
  indigo on the `V`.

## 9. Visual identity

- **Palette:** canvas `#0A0A0B` · surface `#151518` · indigo `#6C5CE7` (interactive)
  · bone `#E9E2D0` (brand accent, used once per view) · status green/amber/red in
  mono chips only.
- **Type:** JetBrains Mono (display, chips, metrics, code) + IBM Plex Sans (body).
- **Signature motifs, in priority order:**
  1. The **pipeline strip** — `Upload → Extract → Chunk → Embed → Retrieve → Answer`.
     The "no magic" proof. Recurs on the hero, the demo, and the app empty state.
  2. The **`[1]` citation badge** — the hero interaction. Clickable, opens the source.
  3. **Mono status chips** — `READY`, `vec 768d · cosine`, `match 0.84`, `top-k 5`.
     The texture of "we show our work."
- Full token reference: `frontend/design-system/retrivo-vault/MASTER.md`.

## 10. The honest note (a strength, not a disclaimer)

Retrivo Vault is open source and built by one person. That is the pitch, not an
apology: the whole pipeline is small enough to read, the isolation model is
verifiable, and there's no company incentive to do anything with your documents.
Say this on `/about`, not as hedging scattered through the marketing copy.
