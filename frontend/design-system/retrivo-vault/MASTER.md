# Design System — Master File

> When building a page, check `design-system/retrivo-vault/pages/<page>.md` first.
> If it exists, its rules override this file. Otherwise follow the rules below.

**Project:** Retrivo Vault
**Category:** Developer Tool / RAG platform
**Source:** internal design spec `--design-system` (Dark Mode OLED / Minimalism, Developer Mono
typography, Standard motion) refined against the covis.ai reference (near-black canvas,
warm bone accent used sparingly, monospace status chips, generous section rhythm,
pipeline/flow visualizations, live pulse indicators).
**Dials:** Variance 6 · Motion 6 · Density 7

---

## Color tokens

Dark-locked. `<html class="dark">` is always set; there is no light theme this pass.

| Role | Hex | CSS var |
|------|-----|---------|
| Canvas (app bg) | `#0A0A0B` | `--background` |
| Raised surface | `#101013` | `--surface` |
| Card | `#151518` | `--card` |
| Popover / overlay panel | `#161619` | `--popover` |
| Hairline border | `rgba(255,255,255,0.08)` | `--border` |
| Strong border | `rgba(255,255,255,0.14)` | `--border-strong` |
| Input border | `rgba(255,255,255,0.12)` | `--input` |
| Foreground | `#F5F5F3` | `--foreground` |
| Muted foreground | `#A1A1AA` | `--muted-foreground` |
| Faint foreground | `#71717A` | `--muted-foreground-faint` |
| Brand accent (bone) | `#E9E2D0` | `--brand` |
| On brand | `#0A0A0B` | `--brand-foreground` |
| Interactive accent (indigo) | `#6C5CE7` | `--primary` |
| Interactive hover | `#7D6EF0` | `--primary-hover` |
| On interactive | `#FFFFFF` | `--primary-foreground` |
| Focus ring | `#8B7DF2` | `--ring` |
| Selection bg | `rgba(108,92,231,0.30)` | — |
| Status OK | `#4ADE80` | `--ok` |
| Status warn | `#FBBF24` | `--warn` |
| Status error | `#F87171` | `--destructive` |
| Grid line / chart axis | `rgba(255,255,255,0.06)` | `--grid` |

Rules: raw hex never appears in components — use the Tailwind token classes
(`bg-card`, `text-muted-foreground`, `border-border`, …). Status colors appear **only**
inside monospace chips/badges, never as body text. Brand bone is for one thing per view
(hero highlight word, or the single primary CTA) — never both.

## Typography

- **Display / headings / chips / metrics / code:** `JetBrains Mono` (`font-mono`)
- **UI & body:** `IBM Plex Sans` (`font-sans`)
- Base 16px, body line-height 1.5, headings 1.1–1.2, `-0.02em` tracking on mono display.
- Loaded via Google Fonts `@import` in `index.css` with a system fallback stack.
- Scale (rem): 0.75 / 0.8125 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.5 / 3.5 / 4.5

## Spacing / radius / shadow

- Spacing scale (px): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128
- Radius: `--radius` 10px (cards/panels), 8px (buttons/inputs), 6px (chips/badges), 9999px only for status dots.
- Shadow (dark, very soft): `sm 0 1px 2px rgba(0,0,0,.4)` · `md 0 4px 16px rgba(0,0,0,.45)` · `lg 0 16px 48px rgba(0,0,0,.55)`
- Signature glow (hero only): `radial-gradient(600px 300px at 50% 0%, rgba(108,92,231,.14), transparent 70%)`

## Motion

Standard tier. GSAP + ScrollTrigger for the landing; CSS transitions in the app.

```js
// scroll reveal — grid/stack
gsap.from(els, { opacity: 0, y: 16, scale: 0.97, duration: 0.4,
  stagger: { each: 0.06, from: 'start' }, ease: 'back.out(1.4)' });
```

- Hover/interaction transitions 150–200ms `ease-out`. No layout-shifting hover (translate/opacity/border only, no scale on cards).
- `back.out` overshoot is fine for marketing cards; **never** on tables or app data.
- Global guard: `@media (prefers-reduced-motion: reduce)` zeroes all animation/transition
  durations, and `motion.ts` `matchMedia` check renders final state without tweening.
- "Live" pulse dot: 2s ease-in-out opacity/scale loop, disabled under reduced-motion.

## Components

- Buttons: `primary` = indigo fill / white text; `brand` = bone fill / near-black text (rare);
  `outline` = transparent / hairline border; `ghost` = transparent / hover surface. 8px radius,
  36px (sm) / 40px (md) / 44px (lg) height, `font-medium`, `cursor-pointer`, focus ring always visible.
- Cards/panels: `bg-card`, hairline border, 10px radius, `shadow-md`; hover = border brightens to strong + `shadow-lg`.
- Inputs: `bg-surface`, `--input` border, 8px radius, 40px height, 16px text; focus = indigo border + 3px ring.
- Status chip (mono): `inline-flex`, 6px radius, `px-2 py-0.5`, `text-xs font-mono uppercase tracking-wide`,
  `border` in the status hue at 30% + text in the status hue, dot prefix optional.
- Dialog/Sheet: overlay `rgba(0,0,0,.6)` + `backdrop-blur-sm`; panel `bg-popover`, strong border, `shadow-lg`.

## Signature elements

- **PipelineStrip** — horizontal row of mono nodes `Upload → Extract → Chunk → Embed → Retrieve → Answer`,
  connected by a line with a traveling highlight; animated on the landing hero, static as an app empty-state.
- **Mono metric chips** — `VEC 768d · cosine`, `top-k 5`, `gemini-2.5-flash`, `chunks 1,284`, `READY`.
- **Terminal panel** — `bg-[#0C0C0E]`, hairline border, faux traffic-light dots, mono content; used for the security section and auth side-panel.

## Anti-patterns

- No light mode. No emojis as icons (Lucide only). No raw hex in components. No instant
  state changes. No invisible focus. No horizontal scroll at any breakpoint. No `back.out`
  on data tables. Brand bone accent never used twice in one viewport.

## Pre-delivery checklist

- [ ] Lucide icons only; decorative icons `aria-hidden`
- [ ] `cursor-pointer` + 150–200ms transition on every clickable
- [ ] Text contrast ≥ 4.5:1 on `#0A0A0B` (muted `#A1A1AA` passes at ≥ 14px)
- [ ] Visible focus ring on all interactives; keyboard path through nav / forms / sidebar
- [ ] `prefers-reduced-motion` respected (global + JS guard)
- [ ] Renders clean at 375 / 768 / 1024 / 1440; no horizontal scroll
- [ ] Content clears the fixed nav; sticky bars don't cover focus
- [ ] Forms: visible labels, inline errors, linked error summary on submit
