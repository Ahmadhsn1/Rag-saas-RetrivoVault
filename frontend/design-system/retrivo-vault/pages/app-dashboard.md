# Page Override — Application Shell (`/app/*`)

Inherits MASTER.md. Overrides/specifics below.

**Density:** higher than marketing. Spacing scale caps at 32px for layout gaps; content
padding 16–24px; tables and lists are compact (40px row height).

**Shell:** shadcn `SidebarProvider` + `Sidebar` (collapsible to icon rail) + top bar.
- Sidebar sections: brand mark → primary nav (Chat / Documents / Collections / Settings,
  Lucide icons) → "Collections" quick-list (active gets indigo left-border + surface bg) →
  footer: usage mini-meter (`Progress`, real counts, cosmetic ceiling) + user `DropdownMenu`.
- Top bar (56px): sidebar trigger, breadcrumb, right side = active-collection chip +
  `gemini-2.5-flash` model chip + `⌘K` stub button.

**Chat view (`/app`)**
- Optional left session rail (list of `ChatSession` titles, "+ New"), collapses under 1024px into a dropdown.
- Message list: user bubble right (surface), assistant left (card). Assistant text parses
  `[n]` → `CitationBadge`; hover shows tooltip preview, click opens `SourceDrawer` (`Sheet`
  from right) with full chunk text, similarity score, and a link to the document.
- Streaming: `sources` event renders the badge row first (skeleton), then tokens append;
  a mono "generating…" pulse chip while streaming.
- Empty state: static `PipelineStrip` + "Upload a document to start asking."
- Composer: textarea (auto-grow, Enter to send / Shift+Enter newline), send button,
  disabled + spinner while streaming.

**Documents (`/app/documents`)**
- Header: title + `UploadDialog` trigger (brand button — the one bone accent on this page).
- shadcn `Table`: Name · Collection · Status (mono chip: `PROCESSING` warn / `READY` ok /
  `FAILED` err) · Chunks · Size · Uploaded · row `DropdownMenu` (Delete → confirm `Dialog`).
- `UploadDialog`: drag-drop zone, client MIME (`application/pdf`,`text/plain`) + 10MB guard
  mirroring backend, collection select, optimistic row inserted as `PROCESSING`, poll
  `GET /api/documents` every 2.5s until no row is processing.
- Empty state: dashed panel + upload CTA.

**Collections (`/app/collections`)**
- Card grid: name (mono), document count chip, created date; hover reveals rename/delete.
- Create: inline input in a header card. Rename: inline edit (calls new `PATCH /api/collections/:id`).
- Delete `Dialog` explains documents are detached, not deleted.

**Settings (`/app/settings`)**
- `Tabs`: Profile (name/email from `/api/auth/me`, read-only), Preferences (theme note —
  dark only for now), Danger zone (Sign out everywhere → clears refresh cookie; Delete
  account → disabled with "coming soon" tooltip).

**Motion:** CSS only. Row/card hover 150ms. Sidebar collapse uses shadcn's built-in transition.
No `back.out` anywhere in the app. Skeletons for every async list.

**A11y:** sidebar is a `<nav>`; table has proper `<th scope>`; dialogs trap focus and
restore it; status is never color-only (mono text label carries meaning); drawer has a
labelled close; composer textarea has a visible label (sr-only acceptable) + hint.
