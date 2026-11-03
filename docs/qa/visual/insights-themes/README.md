# Insights Content themes: BG-pattern (verify + fix, 2026-11-03)

**Scope:**
- `components/sections/insights/themes.tsx` against Figma
  [406:4792](https://www.figma.com/design/auWXeXpbLl7wo8NCAirbMU/Infoline-Handoff?node-id=406-4792),
  limited to the decorative BG-pattern 406:4793 (grid vector 406:4794 and crosses 406:4795/4798/4801/4804).
- Designer review `docs/qa/designer-reviews/Infoline-08-Insights-Page.pdf`, item 1. The rest of the page
  was confirmed in place by the Designer and is not changed.
- `/en/insights` and `/ar/insights` at 1440×1080, 768×1024 and 390×844.

**Method:**
- `figma-visual-qa` skill.
- Spec: `tests/visual/insights-themes.spec.ts`.
- References: `tests/visual/figma/insights-themes/`, hashed in the manifest.

**Reproduce:**
- `npm run build:isolated`
- `VISUAL_PHASE=after-fix npx playwright test -c playwright.visual.config.ts insights-themes`
- Windows 11, Playwright 1.63 Chromium.

**Result:**

| | Tests | Rows |
|---|---|---|
| Before (HEAD `03d9e60`) | 6 of 6 fail | BG1 "pattern rendered" fails everywhere; Gate B r = 0 at 1440 EN/AR |
| After | 6 of 6 pass, two runs, byte-identical summaries | 0 fail · 0 designer decision · 12 reference unavailable · 4 advisory · 0 approved exception · 119 pass |

## Root cause

The component never rendered a decorative layer: no pattern asset existed in
`public/`, and `themes.tsx` had no element for it. This was not a stacking,
positioning or responsive-hiding problem.

A second defect was found while fixing it. The first implementation rendered
at **0px wide**, because Tailwind v4 resolves `max-w-none` to
`max-width: var(--spacing-none)`, and `--spacing-none` is 0 in `globals.css`.
This is the same namespace collision as the Hero `leading-none` defect.
- The fix uses `max-w-[none]` in this component only.
- The global token is unchanged.
- No other source file uses `max-w-none` (grep, 2026-11-03), so nothing else is affected today.

## Fix

- **Asset:** `public/assets/insights/bg-pattern.svg` is the original Figma export of the whole group
  (get_design_context asset `31f6b.svg`), downloaded unchanged.
  - sha256 `f24f7a78…`, identical to the cached reference `406-4793.bg-pattern.svg`.
  - It carries its own opacities: radial-faded grid, crosses at 0.3/0.2/0.5/0.2.
- **Size:** 744.545×520 at every width; never stretched.
- **Position:**
  - `left: calc(50% − 382px)`, i.e. x = 338 at 1440. Figma places it 9.7px left of the section centre, not centred.
  - `top: −18px`, as in Figma.
  - Figma's frame does not clip it (design context: no overflow clip).
  - Physical `left`, so RTL is not mirrored.
- **Layering:** `-z-10` inside an `isolate` section, so it paints behind the eyebrow, heading and cards.
- **Interaction:** `pointer-events-none`.
- **Accessibility:** `alt=""` and `aria-hidden`.
- **Overflow:** the page's `main` already has `overflow-x-clip`, which trims it at 390.

## Checks

**Gate A** (every locale and width):

| ID | Check | Result |
|---|---|---|
| BG1 | Pattern image rendered and loaded | pass (fail before) |
| BG2 | Served bytes = Figma export (sha256) | pass |
| BG3 | 744.53×520 (Figma 744.55×520); ratio 1.432 | pass |
| BG4 | 1440: x 338, y −18 (Figma 338, −18). 768/390: centre offset −9.7 (derived) | pass |
| BG5 | No negative x-scale on the pattern or its ancestors (AR included) | pass |
| BG6 | Eyebrow, heading and cards hit-test above the pattern. Control: a point in the top padding hits the pattern when its hit-testing is switched on | pass |
| BG7 | `pointer-events: none`; the control point does not hit it by default | pass |
| BG8 | `alt=""`, `aria-hidden="true"` | pass |
| BG9 | Effective opacity 1 (Figma node has none), no filter | pass |
| BG10 | EN 1440: crosses covered as in Figma (17 visible; 16/19 under cards; 18 under the eyebrow) | pass |
| BG11 | No horizontal overflow | pass |
| BG12 | No console errors; no page errors (fixture) | pass |

**Gate B** (1440; AR derived from the EN frame):
- The grid is too faint for the ink threshold (YIQ 0.15), so this check uses a
  separate constraint, fixed before measuring.
- **Metric:** Pearson r of luminance between the Figma PNG and the capture.
- **Pixels:** only those where only the pattern can show. That is inside the
  pattern box and the section, outside every content box of either image, with
  a 3px margin.
- **Pass:** peak r ≥ 0.8 within ±2px of zero shift.

| Row | EN | AR |
|---|---|---|
| B.pattern (n = 84,286 / 85,294 px) | r 0.908 at (0,0) | r 0.908 at (0,0) |
| B.cross17 (the cross Figma leaves uncovered) | r 0.996 at (0,0) | r 0.996 at (0,0) |
| Control: pattern hidden | r 0 | r 0 |
| Control: mirrored about the pattern centre | r 0.191 | r 0.194 |
| Before fix | r 0 (fail) | r 0 (fail) |

Both controls stay below 0.8, so the check can fail; that is why it gates.

The frame mismatch ratio (13.4%; 5.6% inside the pattern box) is advisory. It
includes the pre-existing card offset (below) and text rasterisation.

**Neighbouring sections:**
- The bottom overhang reaches Proof's dark card (browser rows 410–459):
  0 pixels changed between before and after.
- The top overhang (section padding, rows 0–24): 2 pixels changed, by at most 1 level.

Both are below what is visible, because the SVG's radial fade is near zero at its edges.

## Test fixes made during the run (recorded, not threshold changes)

- **Cross boxes:** the metadata gives them section-relative, while
  `reference.node()` nests them, so they were off by 338/−18. The spec now
  asserts Group 17 = SVG (124, 150).
- **BG6 control point:** the control first used a point between the cards.
  That point lies inside transparent in-flow wrappers, which correctly paint
  above a negative-z pattern, so it could never hit the pattern. The control
  now uses the section's top padding.
- **BG10 in AR:** the Arabic eyebrow is narrower and leaves cross 18 uncovered.
  That comes from copy width, not the pattern, and there is no AR frame, so the
  row is `reference-unavailable`.

## Reference unavailable

- AR: no frame.
- 768 / 390: no frames.

Those rows are behaviour checks. Below 1440 the pattern keeps its Figma size
and offset, and the viewport trims it. At 390, three of the four crosses sit
under the cards or off-screen. Designer confirmation item: PQA-027.

## Advisory, not changed

- **Card offset:** the browser cards start at y 172 (Figma 182) and the section
  is 410 tall (Figma 459). This predates the fix; the Designer listed the cards
  as in place.
- **Site-wide items** from the review: weights, radii, colour shades, Avenir
  fallback, closing-band video. They are tracked in PQA-020, PQA-026 and
  PQA-027, and are not fixed here.

## Validation

- `tsc --noEmit`: pass.
- ESLint on the touched files: pass.
- E2E: `cms/insights`, `i18n/routes` and `layout/shared-cta`: 75 passed.
  These cover the `/` and `/ar` redirects and the Insights page in EN and AR.
- `summary-reporter` regression: 3 passed.
- The default suite still lists 0 visual specs.

## Files

| File | Contents |
|---|---|
| `2026-11-03.before.{en,ar}.{1440,768,390}.browser.png` | Captures at HEAD `03d9e60` (no pattern) |
| `2026-11-03.after-fix.{en,ar}.{1440,768,390}.browser.png` | Captures after the fix |
| `2026-11-03.{before,after-fix}.{en,ar}.1440.{overlay,diff}-vs-figma.png` | Overlay and diff against Figma 406:4792 |
| `2026-11-03.{before,after-fix}.{en,ar}.1440.metrics.json` | Correlation, controls, mismatch ratios |
| `2026-11-03.after-fix.summary.md` | Every classified row (after) |
