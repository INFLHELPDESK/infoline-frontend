# Home Clients + Partners: Figma conformity (verify only, 2026-11-03)

**Scope:**
- **Clients:** `components/sections/home-1/clients.tsx` against Figma
  [406:4287](https://www.figma.com/design/auWXeXpbLl7wo8NCAirbMU/Infoline-Handoff?node-id=406-4287).
- **Partners:** `components/sections/home/partners.tsx` against Figma
  [406:4226](https://www.figma.com/design/auWXeXpbLl7wo8NCAirbMU/Infoline-Handoff?node-id=406-4226).
- PQA-016 names both sections (H-04 / H-05).
- EN and AR at 1440, 768 and 390px.

**Method:**
- `figma-visual-qa` skill, second pilot.
- Spec: `tests/visual/home-partners-clients.spec.ts`.
- Shared harness: `tests/visual/support/` (plus `ink.ts`, added this round).
- References: `tests/visual/figma/home-{clients,partners}/`, hashed in their manifests.

**Reproduce:**
- `npm run build:isolated`
- `npx playwright test -c playwright.visual.config.ts home-partners-clients`
- Build of `f19eefa` on Windows 11 with Playwright 1.63 Chromium.

**Result:**
- Two full `test:visual` runs: classification and row order identical.
- This spec: 7 of 18 tests fail, each on a confirmed defect.
- Rows, this spec: 30 fail · 7 designer decision · 10 reference unavailable · 41 advisory · 0 approved exception · 175 pass.
- Rows, full run including Hero (as saved in `2026-11-03.summary.md`): 30 · 17 · 20 · 44 · 0 · 283. Hero: 0 fail.
- All 30 fail rows trace to the 8 defects below.
- 2 identities are recorded as uncertain.

## How Gate B decides (revised this round)

No acceptance budget comes from the measured build. Verdicts come only from
constraints that were predefined and are measured independently on the Figma
crop and on the build crop (`support/ink.ts`):

- **Ink geometry:** the bounding box of drawn pixels against the flat background.
  Size must be within max(2px, 5%) and the centre within 2px.
  For partner pills this is measured inside the 85.85×44 logo box.
- **Visual identity:** each element's ink, resampled, is compared with every Figma
  element in its group (the logo row, or a pill row).
  The expected element must win by at least 0.05. Below that margin, the identity
  is recorded as **uncertain** and kept separate from pass and fail.
- **Pixel-mismatch ratio** (r = measured ÷ negative control): evidence only, always
  `advisory`. When r ≥ 0.9 and both constraints pass, the row is flagged
  "rasterisation, review".

Why it changed: the first rule (pass r ≤ 0.5, fail r ≥ 0.9) failed correct thin
text and thin logos. The Hero rule (a budget at the midpoint between measured and
control) passes by construction. Neither is a valid acceptance test.

**Re-checked after the change:**

| Former false positive | Old | Now | Why it is cleared |
|---|---|---|---|
| Partners description | fail, r=1.15 | ink **pass**; r advisory ("rasterisation") | Bounds match; the 0.5px centre offset only changes anti-aliasing |
| Clients logo 3 (Asyad) | fail, r=0.93 | ink **pass**; identity **match**; r advisory | Same logo at the same scale; thin strokes |
| Konnect Insights pill | advisory (no signal) | ink **fail**, 77×13 vs 85×14 (−9%) | Not a false positive: Figma enlarges and crops this logo (design context), so it belongs to D6 |

Every confirmed defect is still detected (see below).

## Confirmed defects

| # | Section | Defect | Detected by |
|---|---|---|---|
| D1 | Clients | **Three slots draw another slot's logo:** slot 5 draws Figma's slot-6 logo, slot 6 draws slot 8's, and slot 8 draws slot 5's. Order and imagery differ from Figma. The alt text stays in Figma's order, so what a screen reader announces does not match what is shown. Whether each alt is wrong is recorded as *identity uncertain* (A4.5/6/8): Figma names only slots 2 and 4. Agent inspection, each file rendered alone (`…client-asset-files-rendered.png`), found `ncsi.svg` = Ministry of Manpower, `manpower.svg` = Social Insurance, `paew.svg` = NCSI. This contradicts PQA-016's "`paew.svg` = Social Insurance". Solutions and Industries use the same files and were not checked. | CB.id.logo 5/6/8 (pixel identity) and CB.ink.logo 5/6/8 (different logo, different ink); A3.2/A3.4 pass where Figma names the organisation |
| D2 | Clients | Slot 4 (`electricity-water.png`) draws 89×63 against Figma's 74×51 (about 20% large). | CB.ink.logo 4 |
| D3 | Clients | Title weight is 700; Figma `heading/2xl/bold` is 800. The EN face is identical (Avenir-Black). AR renders Tajawal Bold. | C2.2 |
| D4 | Partners | Section is 588px tall; Figma is 643. Description-to-rows gap: 48 vs 67. Row gap: 36 vs 38. Bottom padding: 90 vs 124. Capture is 1440×589 against 1440×643. | P1, G4.y, G5.y, PB.size |
| D5 | Partners | Only 1 of 3 glows: the bottom-left and bottom-right glows (406:4228/4229) are missing. The top glow is 635×300 (Figma 635×501) at `top:0` (Figma −237). | P6.1–P6.3 |
| D6 | Partners | Per-logo optical sizing is not implemented. 11 of 13 pills draw their logo outside the constraint: SAP +33%, NCircle +30%, EMC +28%, Microsoft +13%, Tech Mahindra +13%, In10s +8%, Symantec −6%, Konnect −9%, Elevatus −10%, Salesforce −14%, Dion −23% (ink width). Locuz and Fluentgrid match. Pill box, pitch, fill, border, radius, logo box and opacity all match (P5.1–P5.7). | PB.ink.row* (`…partners.en.1440.ink.json`) |
| D7 | Partners | **Reduced motion hides partners.** Of 17 unique partners, 12 are visually accessible at 1440, 6 at 768 and 2 at 390. No alternative is offered (the rows are not wrapped or scrollable). Screen readers still get all 17 names. The check is implementation-agnostic: a wrap, grid or scroll alternative would pass. | R3 |
| D8 | Partners | Title centre x is 720 against Figma's 717.5 (2.5px). Figma's own header is offset `calc(50% − 2.5px)` while its description is centred, so the reference is internally inconsistent. Confirm the intent before changing anything. | G2.cx |

**Uncertain identity** (advisory, recorded separately):
- PB.id NCircle: best match Salesforce, margin 0.02. The 30% scale difference (D6)
  distorts the ink.
- PB.id Dion: correct best match, margin 0.01. The logo is very faint.
- Both pills are in the right order by source and by the human-reviewed overlay,
  but no reference establishes it by the predefined margin.

## Motion

The Figma frames are static, so these are contract checks, not Figma parity.

All pass:
- 40s per group, infinite, linear (M1).
- Row 1 moves left at −36.5 px/s, row 2 right at 41.1 px/s, within 5% (M2–M3).
- No backward steps or jumps (M4).
- No `currentTime` reset from the first frame through hydration (M6), or on scroll away and back (M12).
- Edge gap 0 over 200 phases at 1440/768/390 in EN and AR, with a seamless wrap (M7.w, M8.w).
- No vertical clipping (M9).
- Hover pauses only the hovered row and holds it at Δ0.00. Resume continues from the paused position (M10–M11).
- Under reduced motion, rows have `animation: none`, and the Clients and Partners reveals never show content mid-travel (R1–R2).
- CLS 0.000 (S1).

Capture hardening this round:
- **Isolation:** the state checks (hover, pause, resume, scroll) run in a test that
  never controls the animation from script. Seeking (coverage, wrap) runs in
  separate per-width tests, with a fresh document per locale.
- **Resume:** resume is measured by an in-page watcher armed before hover ends.
- **Static capture:** pauses at Figma's phase and uses `animations: "allow"`.
  All 13 measurable pills matched within 3px.
- **Lazy images:** off-screen lazy logos are forced to load before any capture.

Advisories:
- M5: the rows run at different speeds (36.2 vs 40.7 px/s).
- M13: in AR the marquee keeps its LTR direction.
- Hover is the only pause mechanism (WCAG 2.2.2); keyboard and touch users can't pause it.

## Designer decisions (no code change)

- **Eyebrow face:** Inter Medium 18, −0.72px in Figma; Avenir Medium in the build.
  PQA-020 item 2 (C4.3, P4.3, G1.w).
- **Clients name tooltips:** hidden in Figma (opacity 0), absent from the build.
  New (I1).
- **5% marquee edge fade:** Figma's edges are hard. New (P7).
- **AR Clients title:** copy is provisional (PQA-016); weight 700 renders as Tajawal Bold (D3, PQA-025).
- **AR Partners description:** still the sector-page copy (PQA-024); the title renders Tajawal ExtraBold.
- PQA-016, PQA-019, PQA-020, PQA-022, PQA-024 and PQA-025 stay open.

## Reference unavailable

- AR: no frame. Searched pages 406:836 and 406:10627; page 0:1 not searched.
- 768 / 390: no frames.
- Motion: no Figma spec, so the implementation contract is used instead.

AR and the narrow widths are behaviour checks only: Tajawal rendering, overflow,
overlap, marquee coverage and the content decisions.

## Reporter

- `playwright test --list` used to overwrite `visual-summary.md` with an empty table.
- The reporter now writes only when at least one test ended.
- It now sorts by status, ID, locale, viewport and title, so the order is stable
  across parallel workers.
- Regression check: `tests/visual/summary-reporter.spec.ts`. It has two unit tests
  plus a real `--list` against a sentinel file.
- A live `--list` left the summary hash unchanged.

## Follow-up (not done here)

The committed Hero Gate B (`tests/visual/home-hero.spec.ts`) still uses budgets
derived from the measured build: 17% and 50%, the midpoint rule. Those Hero rows
should move to the ink and identity constraints; until then, treat their pass as
advisory.

## Files

| File | Contents |
|---|---|
| `2026-11-03.summary.md` | Every classified row from the full `test:visual` run (Hero rows included) |
| `2026-11-03.{clients,partners}.en.1440.ink.json` | Ink bounds and identity distances per crop, with the constraints |
| `2026-11-03.{clients,partners}.en.1440.metrics.json` | Pixel-ratio evidence and negative controls |
| `2026-11-03.clients.en.1440.{browser,overlay-vs-figma,diff-vs-figma}.png` | Clients capture, overlay and diff |
| `2026-11-03.partners.en.1440.{browser-figma-phase,overlay-vs-figma,diff-vs-figma}.png` | Partners capture at Figma's phase |
| `2026-11-03.client-asset-files-rendered.png` | Each client logo file rendered alone (agent inspection for D1) |
| `2026-11-03.partners.pill-crop-diffs.png` | Pill crop diffs (D6) |
