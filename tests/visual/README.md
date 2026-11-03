# Visual QA (Figma → browser)

`npm run test:visual` checks a section against its cached Figma reference.

It uses its own config (`playwright.visual.config.ts`), so `npm run test:e2e`
and CI never run these specs. That config imports `playwright.config.ts`, so it
keeps the same CMS isolation guards, web servers (CMS stub + `next start`) and
teardown. As with e2e, it runs against an isolated production build:

```sh
npm run build:isolated
CMS_ISOLATED=1 NEXT_PUBLIC_WPGRAPHQL_ENDPOINT=http://127.0.0.1:3199/graphql npm run test:visual
```

Outputs (all gitignored):

- `test-results/visual-summary.md`: every check, classified (see below).
- `test-results/visual-report/`: the HTML report, with every image attached.
- `test-results/visual/<test>/`: `figma-reference.png`, `browser-actual.png`,
  `diff.png`, `overlay.png`, the per-element `diff-*.png` files and `metrics.json`.

## References are Figma's, never the browser's

`figma/<section>/` holds what the Figma MCP server returned:

| File | What it is |
|---|---|
| `*.png` | `get_screenshot` render |
| `*.variables.json` | `get_variable_defs` output |
| `*.metadata.xml` | `get_metadata` geometry |
| `*.design-context.tsx.txt` | `get_design_context` output |

`manifest.json` records the node, viewport, language, fetch date and SHA-256 of
each file, plus the frames that do **not** exist (`unavailable`). Every run
checks the hashes first and stops if any file changed.

There is deliberately no "update snapshots" path. Nothing in this suite writes
to `figma/`. To refresh a reference:

1. Fetch it again from Figma with the same tool.
2. Replace the file.
3. Update its hash and `fetchedAt` in the manifest.
4. Say so in the commit.

`.gitattributes` marks `figma/**` as `-text`, so line-ending conversion cannot
change the bytes.

Expected values in the specs come from those files: `ref.token(...)`,
`ref.node(...)`, and the design context for values Figma has no variable for.
They are never hard-coded from the build.

## Two independent gates

- **Gate A (computed styles, rendered fonts, geometry).** This is the exact check.
  - Fonts are read from Chromium's DevTools protocol (`CSS.getPlatformFontsForNode`),
    so a silent system-font fallback fails even when `font-family` looks right.
  - Geometry is compared with the Figma node boxes, measured from the frame
    origin, within ±2px.
- **Gate B (Figma PNG vs browser capture).** Each run attaches the reference,
  the actual capture, a diff and an overlay. Two kinds of comparison:
  - The frame-level diff is evidence only. It uses fixed Figma coordinates, so it
    mixes layout drift with rendering.
  - Element-aligned crops cut the Figma node box and the same-size box at the
    element's rendered position, so rendering is judged separately from position.
    A crop is gated only where a **negative control** (the same capture with the
    text hidden) proves the measurement can fail.
  - Budgets are set at the midpoint between the measured build and that control.
    Thin text over a photo doesn't discriminate, so it's advisory and covered by
    Gate A.
  - A self-comparison must score exactly 0.

Pixel diffs can't reach zero here: Figma and Chromium rasterise text
differently, and the photo is cropped differently. Treat Gate B as a guard
against gross regressions and a review aid, not a pixel-perfect gate.

## Statuses

| Status | Meaning | Fails the run? |
|---|---|---|
| `pass` / `fail` | The build matches / doesn't match Figma | `fail` only |
| `designer-decision` | Open, documented question (cites its PQA issue); measured value vs Figma recorded | No |
| `approved-exception` | Documented deviation; the build is asserted to hold the exception value | Only if it drifts |
| `reference-unavailable` | No Figma frame for this locale or width | No |
| `advisory` | Evidence a person should review; not discriminative, so not gated | No |

## Stability

- **Viewport:** 1440×794 (the Figma frame), device scale factor 1, reduced
  motion by default.
- **Waits:** hydration, `document.fonts`, every `<img>` complete and decoded, and
  settled animations (`tests/e2e/support/motion.ts`). No sleeps.
- **Captures:** the header and custom cursor are hidden, because they're
  separate layers in Figma. Retries are off.
- **Platform:** text rasterisation differs between Windows, macOS and Linux, so
  record which machine produced a Gate B figure. The 2026-11-03 numbers come
  from Windows 11 with Playwright 1.63 Chromium.
