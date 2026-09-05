# Retrivo Vault — Frontend

React + Vite + TypeScript, Tailwind + shadcn/ui (Radix primitives), React Router, GSAP.
Dark-locked SaaS UI: a marketing landing page and the authenticated application.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on :5173, proxies `/api` → `:5000` |
| `npm run build` | `tsc -b` then `vite build` → `dist/` |
| `npm run typecheck` | type check only |
| `npm run lint` | eslint (flat config) |
| `npm run test` | Vitest (jsdom) — 27 tests |
| `npm run preview` | serve the production build locally |

`VITE_API_BASE` (default `/api`) sets the API root; `VITE_API_TARGET` sets the dev proxy target.

## Design system

`design-system/retrivo-vault/MASTER.md` is the source of truth (tokens, motion, component
specs, anti-patterns, checklist). Per-page overrides live in `pages/`. It was generated with
the `internal design spec` skill and refined against the covis.ai reference. Token values are
mirrored into `tailwind.config.ts` and `src/index.css` (CSS custom properties, HSL triplets).

## Layout

```
src/
├── main.tsx                 # providers: Router, Auth, Tooltip, Toaster
├── App.tsx                  # routes (lazy) + auth guards
├── index.css                # font import, design tokens, base layer, reduced-motion
├── lib/
│   ├── api.ts               # axios instance, token store, 401→refresh→replay, streamChat() SSE
│   ├── motion.ts            # GSAP + ScrollTrigger setup, reduced-motion guard
│   └── utils.ts             # cn(), formatBytes/Number/RelativeTime
├── types/api.ts             # User, VaultDocument, Collection, ChatSession, RetrievedSource…
├── context/
│   ├── AuthContext.tsx      # session: silent refresh on load, login/signup/logout
│   └── AppContext.tsx       # collections + active-collection selection (shared shell↔pages)
├── hooks/                   # useCollections, useDocuments (polls while processing),
│                            #   useChatSessions, useGsapReveal, useMediaQuery
├── components/
│   ├── ui/                  # shadcn primitives (button, dialog, sheet, table, tabs, accordion, …)
│   ├── marketing/           # SiteNav, Hero, AuroraBackground, TrustStrip, StatsBand,
│   │                        #   BentoFeatures, RetrievalDemo, HowItWorks, SecurityPanel,
│   │                        #   Pricing, FAQ, CTASection, SiteFooter, HashScroll
│   ├── auth/                # AuthLayout (terminal side-panel), FormError (a11y summary)
│   ├── app/                 # AppShell, AppSidebar, AppTopbar, UserMenu, VerifyEmailBanner,
│   │                        #   UploadDialog, ConfirmDialog, EmptyState, chat/{SessionRail,Composer},
│   │                        #   settings/{Profile,Billing,ApiKeys,Account}Tab, settings/{UsageBars,UsageChart}
│   ├── rag/                 # PipelineStrip, CitationBadge, AnswerText, SourceDrawer, StatusChip
│   └── Logo.tsx
└── pages/
    ├── marketing/{MarketingLayout,Landing,PricingPage}.tsx
    ├── auth/{Login,Signup,ForgotPassword,ResetPassword,VerifyEmail}.tsx
    └── app/{Chat,Documents,Collections,Settings}.tsx
```

## Notable behavior

- **Auth**: access token kept in memory; httpOnly refresh cookie drives silent restore and
  the axios 401 interceptor (single-flight refresh + replay).
- **Chat**: `streamChat()` reads the SSE stream — `sources` renders citation badges, `token`
  appends, `done` persists + updates the session title. `[n]` markers in the answer become
  interactive `CitationBadge`s that open the `SourceDrawer`.
- **Documents**: `useDocuments` polls `GET /api/documents` every 2.5s while any row is
  `processing`; upload is optimistic.
- **Motion**: GSAP scroll reveals on the landing only; everything respects
  `prefers-reduced-motion` (global CSS kill-switch + JS `matchMedia` guard in `motion.ts`).
