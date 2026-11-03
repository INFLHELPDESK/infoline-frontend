# Home Hero: Figma conformity pilot (2026-11-03)

## Update: Hero fixes (after commit `6e452a3`)

The three confirmed failures below are fixed in `hero.tsx` and `globals.css`.
The Figma references, test code and Gate B budgets are unchanged.

**Result:** `npm run test:visual` exits 0.

| | Before (`6e452a3`) | After the fix |
|---|---|---|
| fail | 12 | 0 |
| pass | 96 | 108 |
| designer decision | 10 | 10 |
| reference unavailable | 10 | 10 |
| advisory | 3 | 3 |

Evidence:
[`2026-11-03.after-fix.summary.md`](2026-11-03.after-fix.summary.md) and
`2026-11-03.after-fix.*.png`, against the `2026-11-03.*` before files.

1. **Height 760 → 794.**
   - `lg:min-h-[760px]` came with the initial page (`f12b3d2`) and had no
     recorded rationale. It is now `lg:min-h-[794px]`, the Figma frame.
   - The copy is anchored 188px from the top at `lg` (`lg:items-start
     lg:pt-[188px]`), as in Figma.
   - Stat columns at `lg` follow the Figma column: `py-9`, figure box 48,
     label gap 8. The band is therefore 184px.
   - Measured at 1440: headline y 188, CTAs 440 (Figma 439), band 610/184,
     figure 646, label 702.
   - At 1024 the band is 212px (EN), because labels wrap to three lines in the
     narrower columns. There is no Figma frame at 1024.
   - Below `lg`, `min-h-svh` is unchanged.
   - Short viewports (1440×700): the Hero keeps its min-height and scrolls, as before.
2. **`leading-none` = 0 (root cause).**
   - Tailwind resolves `leading-<name>` from `--leading-*` and then from
     `--spacing-*`, so `leading-none` hit `--spacing-none: 0rem`.
   - `--leading-none: 1` (Tailwind's own value) is now defined in `@theme`.
   - It is the only colliding `leading-*` utility: numeric ones use
     `calc(var(--spacing) * N)`.
   - Usages: the Hero (now uses explicit Figma values) and the language
     switcher. The switcher's buttons and glyphs measured identical before and
     after, at 390, 768, 1024 and 1440, in EN and AR.
   - Hero stat figure: 44/48 at `lg` (`lg:leading-12`), 36/40 below.
3. **"yrs" unit 20 → 16/24.**
   - Avenir Heavy (weight 600 → Heavy face), on the figure's baseline
     (`items-baseline`), as Figma sets "22yrs" inline.

**Below `lg` (no Figma frame):** padding is compensated (`pt-11`, label `mt-3`
without `pt-5`), so the figure and label glyphs sit exactly where they did
before at 768 and 390, EN and AR. That's measured with text ranges and is
pixel-identical.
- The one visible change at those widths: the unit drops about 9px from a raised,
  superscript-like position onto the figure's baseline. This is the Figma
  alignment, applied consistently. **Designer to confirm for mobile.**

**Still open (unchanged, documented):**
- PQA-022 item 6: CTA padding and width, shadow, accent colour, glow.
- PQA-020 item 4: blur hard edge.
- PQA-019 item 7: five statistics and their wording.
- PQA-025: Arabic line-height and Tajawal weights.
- New observation, not fixed: the background photo is framed about 120px
  differently in the vertical direction from Figma. Figma anchors the 949px
  image at the top; the build uses `object-cover` at `70% center`. It's visible
  in `2026-11-03.after-fix.en.1440.diff-vs-figma.png`. Designer to confirm
  before any change.

**Validation:**
- `npm run test:visual`: 15 passed, 1 skipped (Arabic image comparison:
  reference unavailable).
- Related e2e specs (home, motion, navigation, layout, i18n): 161 passed.
- Full e2e: 459 of 465 passed (338 chromium + 121 cms-scenarios, the latter
  run with `--no-deps` after the chromium project failed).
- The 6 failures are all `about/who-we-are.spec.ts` (photo-slice offset:
  received 352 / 488.3 vs < 2).
  - **Pre-existing, unrelated:** they fail identically on a clean build of
    `6e452a3` with this fix stashed.
  - Not addressed here.
- Lint, typecheck: clean. Unit tests: 935 passed.

---

## Pilot findings (before the fix)

**Scope:** `components/sections/home-1/hero.tsx` against Figma `406:3782`
([Infoline-Handoff](https://www.figma.com/design/auWXeXpbLl7wo8NCAirbMU/Infoline-Handoff?node-id=406-3782)).
EN and AR at 1440px, plus overflow smoke checks at 390, 768, 1024 and 1280.
No production UI was changed.

**How to reproduce:**
- `npm run build:isolated`, then `npm run test:visual` (see `tests/visual/README.md`).
- The test build is commit `f108b2c`, built with the CMS-isolated config.
- Runs are on Windows 11, Playwright 1.63 Chromium.

**Result:** two identical runs. 12 fail · 10 designer decision · 10 reference
unavailable · 3 advisory · 0 approved exception · 96 pass. The full table is in
[`2026-11-03.summary.md`](2026-11-03.summary.md).

## Historical findings (`hero-qa/index.html`, 1 Nov 2026)

| # | Finding | Now | Evidence |
|---|---|---|---|
| 1 | No brand typeface | **Pass.** The headline renders Avenir-Black; body and labels Avenir-Roman; CTAs Avenir-Medium; figures Avenir-Heavy. The rendered face is read from Chromium, not the CSS request. | H1.* |
| 2 | Headline 66/79.2, weight 700, −1.98px tracking | **Pass.** 56/70, weight 800, tracking 0, white | H2.1–5 |
| 3 | Supporting text 16/24 | **Pass.** 18/28 on the sub-headline, both CTAs and all stat labels | H3.* |
| 4 | Stat labels #607D8B | **Pass.** #CFD8DC | H4.* |
| 5 | Stat figures 48px, weight 600 | **Pass** for size and weight (44px / 900, Avenir Heavy). **New fail:** line-height is 0 (Figma 48), and the "yrs" unit is 20px (Figma 16/24). | H5.*, H5.lh, H5.u |
| 6 | Secondary CTA tinted blue with an arrow; primary arrow 18px | **Pass.** White fill, 1px #CFD8DC border, #455A64 label, no icon; 24px arrow; 56px height; 12px radius (`radius/lg`, the visible Base layer). Padding, width and shadow are **designer decisions** (PQA-022 item 6). | H6.* |
| 7 | Band is a flat panel | **Pass.** Gradient to top from rgba(4,29,42,.54) to transparent, no flat fill. The blur's hard top edge is a **designer decision** (PQA-020 item 4). | H7.* |
| 8 | Eyebrow badge above the headline | **Pass.** Not rendered (the `badge` string is still in the locales, unused). | H8 |
| 9 | Fifth statistic, reworded labels | **Designer decision** (PQA-019 item 7) | H9.1–2 |

## New failures (not in the historical list)

1. **Hero height is 760px, Figma is 794px.** `lg:min-h-[760px]` overrides
   `min-h-svh` from 1024px, so the height doesn't follow the viewport.
   - Copy and CTAs sit 25–26px higher than Figma (G1–G4: 162 vs 188, 414 vs 439).
   - The stats band starts at 536 instead of 610 and is 224px tall instead of 184
     (G5), so the stats are lower within it (G6, G7).
   - The capture is 1440×760 against 1440×794 (B.size).
   - Nine rows, one root cause.
2. **`leading-none` computes to `line-height: 0`, site-wide.** The custom
   `--spacing-none: 0rem` token in `globals.css` makes Tailwind v4 compile
   `.leading-none` to `line-height: var(--spacing-none)`. In the Hero this hits
   the stat figures (Figma 48px) and the unit (H5.lh, H5.u). Every other
   `leading-none` on the site is affected and should be audited.
3. **The "yrs" unit is 20px weight 600.** Figma has Avenir Heavy 16/24 (H5.u).
   The face is correct (Avenir-Heavy).

## Designer decisions recorded (no code change)

- Accent colour: #40ACE2 in the build, #3EC1F0 in Figma (H2.6).
- CTA padding: 20px, Figma 24px. Widths follow from it: 210/216 vs 219/222 (H6.8, H6.9).
- Primary CTA shadow (H6.10).
- Top-start glow: blur 40px at opacity 1 in the build, 12px at 0.6 in Figma (H6.11).
- All of the above are PQA-022 item 6.
- Band blur hard edge (H7.3, PQA-020 item 4).
- Stat count and wording (H9, PQA-019 item 7).
- Arabic h1 line-height 1.32 = 73.92px (AR.4).
- Tajawal 900 rendering as ExtraBold (AR.5). AR.4 and AR.5 are both PQA-025.

## Reference unavailable

- **Arabic at 1440:** the file has no Arabic frame. Searched pages `406:836` and
  `406:10627`; `0:1 OLD Designs` was not searched.
  - The AR capture is still recorded.
  - AR is checked for RTL mirroring of the EN insets (±2px), Tajawal rendering
    only, arrow rotation and CTA order. All pass.
- **390 / 768 / 1024 / 1280:** no frames exist; every frame is 1440 wide.
  The overflow smoke checks pass in EN and AR at every width.

## Motion

- **Reduced motion:** visible content never travels or blurs, the counters
  never show an intermediate value, and the headline is always opaque.
  - Observation: framer applies the duration-0 snap one frame after the fade
    starts. Each revealed item can show for a single frame at its hidden offset,
    at the opacity that frame reaches (12–18% across runs).
  - This is bounded and checked at ≤1 frame per item (M2.lag). An engineering
    note, not a visual failure.
- **Full motion:** the reveal travels, and it settles on geometry identical to
  reduced motion (M6–M8).

## Gate B

- The frame-level diff ([`2026-11-03.en.1440.diff-vs-figma.png`](2026-11-03.en.1440.diff-vs-figma.png))
  shows the 26px upward offset of every text block and a different photo crop.
  It's evidence, not gated.
- Element-aligned crops, measured vs the negative control with text hidden:
  - Headline: 8.7% vs 25.5%, budget 17%.
  - CTAs: ~14% vs ~99%, budget 50%.
  - Both are gated and pass.
- Sub-headline (14.9% vs 20.2%) and stat label (6.9% vs 10.6%) don't
  discriminate, so they're advisory. Gate A covers them.
- Comparator self-check: 0.

## Files

| File | Contents |
|---|---|
| `2026-11-03.en.1440.browser.png` | Hero capture, EN (header and cursor hidden) |
| `2026-11-03.ar.1440.browser.png` | Hero capture, AR |
| `2026-11-03.en.1440.diff-vs-figma.png` | Frame-level diff |
| `2026-11-03.en.1440.diff-headline-aligned.png` | Aligned headline diff |
| `2026-11-03.en.1440.metrics.json` | Gate B numbers |
| `2026-11-03.summary.md` | All classified rows |

The Figma reference is in `tests/visual/figma/home-hero/`.
