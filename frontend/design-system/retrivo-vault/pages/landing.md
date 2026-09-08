# Page Override — Marketing Landing (`/`)

Inherits MASTER.md. Overrides/specifics below.

**Pattern:** Feature-Rich Showcase
Section order: Hero (value prop) → trust strip → Feature grid (6) → How it works (3 steps)
→ Security/terminal panel → CTA → Footer.
CTA placement: hero (primary + secondary), after features, bottom band. Primary CTA text
"Start your vault"; secondary "See how it works" (anchor scroll).

**Density:** lower than the app — section padding 96–128px vertical, max content width 1200px,
comfortable line length (~68ch) for prose.

**Hero**
- Left: mono eyebrow chip (`RAG · CITED · PRIVATE`), H1 in `font-mono` ~3.5–4.5rem with the
  final word in brand bone, one-line sub in `font-sans` `text-muted-foreground`, dual CTA,
  a row of 3 mono metric chips.
- Right / below on mobile: animated `PipelineStrip` + a faux answer card showing streamed
  text with two `[1] [2]` citation badges.
- Background: signature indigo radial glow at top, 1px grid fade.

**Trust strip:** "Built on" + wordmarks (MongoDB Atlas, Google Gemini, React, Docker) in
`text-muted-foreground-faint`, grayscale, no logos requiring brand assets — set as styled text.

**Feature grid:** 3×2 at ≥1024px, 2×1 at 768, 1-col at 375. Each card: Lucide icon in an
indigo-tinted square, mono title, sans description. GSAP stagger reveal `from: 'start'`.
Cards (from `features.md`): Automated ingestion · Vector retrieval · Cited answers ·
Collections · Streaming chat · Per-user isolation.

**How it works:** 3 numbered steps (`01/02/03` mono), horizontal at desktop with connector
line, stacked on mobile. Upload → Ask → Get cited answers.

**Security section:** terminal panel listing the real guarantees (bcrypt, JWT access+refresh,
per-`userId` vector filter, rate limits, MIME/size validation) as mono lines with `OK` chips.

**Motion:** GSAP ScrollTrigger, one reveal per section, `back.out(1.4)` ok here.
`PipelineStrip` traveling highlight loops (paused under reduced-motion).

**A11y:** `<header><main><footer>`, one `<h1>`, section `<h2>`s, skip-link, all anchors
keyboard reachable, focus ring visible on the dark nav.
