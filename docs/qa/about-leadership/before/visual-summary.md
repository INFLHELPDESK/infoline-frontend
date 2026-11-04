# Visual QA summary

fail: 24 · designer-decision: 0 · reference-unavailable: 4 · advisory: 16 · approved-exception: 0 · pass: 58

| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |
|---|---|---|---|---|---|---|---|---|
| fail | LB1.1 | board: bottom-edge median dash (Figma 12px, ±1) | visual | en | 1440×1080 | 12 | 4 |  |
| fail | LB1.2 | board: bottom-edge median gap (Figma 12px, ±1) | visual | en | 1440×1080 | 12 | 1 |  |
| fail | LB1.3 | board: left-edge median dash (Figma 13px, ±1) | visual | en | 1440×1080 | 13 | 4 |  |
| fail | LB1.4 | board: left-edge median gap (Figma 12px, ±1) | visual | en | 1440×1080 | 12 | 1 |  |
| fail | LB2.1 | exec: bottom-edge median dash (Figma 12px, ±1) | visual | en | 1440×1080 | 12 | 3 |  |
| fail | LB2.2 | exec: bottom-edge median gap (Figma 12px, ±1) | visual | en | 1440×1080 | 12 | 2 |  |
| fail | LB2.3 | exec: left-edge median dash (Figma 13px, ±1) | visual | en | 1440×1080 | 13 | 3 |  |
| fail | LB2.4 | exec: left-edge median gap (Figma 12px, ±1) | visual | en | 1440×1080 | 12 | 2 |  |
| fail | LP1.1 | board panel width (Figma 1272) | layout | ar | 1440×1080 | 1272 | 1360 |  |
| fail | LP1.1 | board panel width (Figma 1272) | layout | en | 1440×1080 | 1272 | 1360 |  |
| fail | LP1.2 | board panel left inset (Figma 84) | layout | ar | 1440×1080 | 84 | 40 |  |
| fail | LP1.2 | board panel left inset (Figma 84) | layout | en | 1440×1080 | 84 | 40 |  |
| fail | LP1.3 | board panel right inset (Figma 84) | layout | ar | 1440×1080 | 84 | 40 |  |
| fail | LP1.3 | board panel right inset (Figma 84) | layout | en | 1440×1080 | 84 | 40 |  |
| fail | LP1.6 | board border is not the native CSS dashed border | visual | ar | 1440×1080 | true | false |  |
| fail | LP1.6 | board border is not the native CSS dashed border | visual | en | 1440×1080 | true | false |  |
| fail | LP2.1 | exec panel width (Figma 1094) | layout | ar | 1440×1080 | 1094 | 1200 |  |
| fail | LP2.1 | exec panel width (Figma 1094) | layout | en | 1440×1080 | 1094 | 1200 |  |
| fail | LP2.2 | exec panel left inset (Figma 173) | layout | ar | 1440×1080 | 173 | 120 |  |
| fail | LP2.2 | exec panel left inset (Figma 173) | layout | en | 1440×1080 | 173 | 120 |  |
| fail | LP2.3 | exec panel right inset (Figma 173) | layout | ar | 1440×1080 | 173 | 120 |  |
| fail | LP2.3 | exec panel right inset (Figma 173) | layout | en | 1440×1080 | 173 | 120 |  |
| fail | LP2.6 | exec border is not the native CSS dashed border | visual | ar | 1440×1080 | true | false |  |
| fail | LP2.6 | exec border is not the native CSS dashed border | visual | en | 1440×1080 | true | false |  |
| reference-unavailable | LR.7 | Figma frame at this width | responsive | ar | 390×844 | no Figma frame | — | Only 1440 frames exist (PQA-031). |
| reference-unavailable | LR.7 | Figma frame at this width | responsive | ar | 768×1024 | no Figma frame | — | Only 1440 frames exist (PQA-031). |
| reference-unavailable | LR.7 | Figma frame at this width | responsive | en | 390×844 | no Figma frame | — | Only 1440 frames exist (PQA-031). |
| reference-unavailable | LR.7 | Figma frame at this width | responsive | en | 768×1024 | no Figma frame | — | Only 1440 frames exist (PQA-031). |
| advisory | LB1.6 | board: dash measurements (Figma → build) | visual | en | 1440×1080 | — | bottom dash 12→4, gap 12→1; left dash 13→4, gap 12→1; dashes 50→255 | Medians in px; dashes counted on the bottom edge. |
| advisory | LB1.7 | board: corner ink in the 26×26 top-left box (Figma → build) | visual | en | 1440×1080 | — | 28→28 | Corner continuity evidence; dash phase differs. |
| advisory | LB2.6 | exec: dash measurements (Figma → build) | visual | en | 1440×1080 | — | bottom dash 12→3, gap 12→2; left dash 13→3, gap 12→2; dashes 43→224 | Medians in px; dashes counted on the bottom edge. |
| advisory | LB2.7 | exec: corner ink in the 26×26 top-left box (Figma → build) | visual | en | 1440×1080 | — | 28→29 | Corner continuity evidence; dash phase differs. |
| advisory | LP1.9 | board border implementation | visual | ar | 1440×1080 | — | native dashed | Evidence. |
| advisory | LP1.9 | board border implementation | visual | en | 1440×1080 | — | native dashed | Evidence. |
| advisory | LP2.9 | exec border implementation | visual | ar | 1440×1080 | — | native dashed | Evidence. |
| advisory | LP2.9 | exec border implementation | visual | en | 1440×1080 | — | native dashed | Evidence. |
| advisory | LP3.2 | Board portrait 1 centre x vs Figma card 406:3578 (262.5) | layout | ar | 1440×1080 | — | 1218.4 | Portrait placement is outside finding #4; recorded as evidence. |
| advisory | LP3.2 | Board portrait 1 centre x vs Figma card 406:3578 (262.5) | layout | en | 1440×1080 | — | 221.6 | Portrait placement is outside finding #4; recorded as evidence. |
| advisory | LR.8 | Panel widths (board / exec) | layout | ar | 390×844 | — | 342 / 342 | Regression evidence. |
| advisory | LR.8 | Panel widths (board / exec) | layout | ar | 768×1024 | — | 720 / 720 | Regression evidence. |
| advisory | LR.8 | Panel widths (board / exec) | layout | ar | 1440×1080 | — | 1360 / 1200 | Regression evidence. |
| advisory | LR.8 | Panel widths (board / exec) | layout | en | 390×844 | — | 342 / 342 | Regression evidence. |
| advisory | LR.8 | Panel widths (board / exec) | layout | en | 768×1024 | — | 720 / 720 | Regression evidence. |
| advisory | LR.8 | Panel widths (board / exec) | layout | en | 1440×1080 | — | 1360 / 1200 | Regression evidence. |
| pass | LB1.0 | board: self-compare (Figma vs itself) mismatch = 0 | visual | en | 1440×1080 | 0 | 0 |  |
| pass | LB1.5 | board: separated long dashes, not a near-continuous line (longest dash ≤ 2 × Figma's) | visual | en | 1440×1080 | true | true |  |
| pass | LB2.0 | exec: self-compare (Figma vs itself) mismatch = 0 | visual | en | 1440×1080 | 0 | 0 |  |
| pass | LB2.5 | exec: separated long dashes, not a near-continuous line (longest dash ≤ 2 × Figma's) | visual | en | 1440×1080 | true | true |  |
| pass | LP1.4 | board panel corner radius (24) | visual | ar | 1440×1080 | 24px | 24px |  |
| pass | LP1.4 | board panel corner radius (24) | visual | en | 1440×1080 | 24px | 24px |  |
| pass | LP1.5 | board label centred on the panel top edge | layout | ar | 1440×1080 | 0,0 | 0,1 |  |
| pass | LP1.5 | board label centred on the panel top edge | layout | en | 1440×1080 | 0,0 | 0,1 |  |
| pass | LP1.7 | board border colour (border/brand/muted) | colour | ar | 1440×1080 | rgb(171, 215, 237) | rgb(171, 215, 237) |  |
| pass | LP1.7 | board border colour (border/brand/muted) | colour | en | 1440×1080 | rgb(171, 215, 237) | rgb(171, 215, 237) |  |
| pass | LP1.8 | board border width 1px | visual | ar | 1440×1080 | 1 | 1 |  |
| pass | LP1.8 | board border width 1px | visual | en | 1440×1080 | 1 | 1 |  |
| pass | LP2.4 | exec panel corner radius (24) | visual | ar | 1440×1080 | 24px | 24px |  |
| pass | LP2.4 | exec panel corner radius (24) | visual | en | 1440×1080 | 24px | 24px |  |
| pass | LP2.5 | exec label centred on the panel top edge | layout | ar | 1440×1080 | 0,0 | 0,1 |  |
| pass | LP2.5 | exec label centred on the panel top edge | layout | en | 1440×1080 | 0,0 | 0,1 |  |
| pass | LP2.7 | exec border colour (border/brand/muted) | colour | ar | 1440×1080 | rgb(171, 215, 237) | rgb(171, 215, 237) |  |
| pass | LP2.7 | exec border colour (border/brand/muted) | colour | en | 1440×1080 | rgb(171, 215, 237) | rgb(171, 215, 237) |  |
| pass | LP2.8 | exec border width 1px | visual | ar | 1440×1080 | 1 | 1 |  |
| pass | LP2.8 | exec border width 1px | visual | en | 1440×1080 | 1 | 1 |  |
| pass | LP3.1 | Every portrait lies inside the Board or Executive panel | layout | ar | 1440×1080 | true | true |  |
| pass | LP3.1 | Every portrait lies inside the Board or Executive panel | layout | en | 1440×1080 | true | true |  |
| pass | LR.1 | No horizontal overflow | responsive | ar | 390×844 | true | true |  |
| pass | LR.1 | No horizontal overflow | responsive | ar | 768×1024 | true | true |  |
| pass | LR.1 | No horizontal overflow | responsive | ar | 1440×1080 | true | true |  |
| pass | LR.1 | No horizontal overflow | responsive | en | 390×844 | true | true |  |
| pass | LR.1 | No horizontal overflow | responsive | en | 768×1024 | true | true |  |
| pass | LR.1 | No horizontal overflow | responsive | en | 1440×1080 | true | true |  |
| pass | LR.2 | Both panels inside the viewport | responsive | ar | 390×844 | true | true |  |
| pass | LR.2 | Both panels inside the viewport | responsive | ar | 768×1024 | true | true |  |
| pass | LR.2 | Both panels inside the viewport | responsive | ar | 1440×1080 | true | true |  |
| pass | LR.2 | Both panels inside the viewport | responsive | en | 390×844 | true | true |  |
| pass | LR.2 | Both panels inside the viewport | responsive | en | 768×1024 | true | true |  |
| pass | LR.2 | Both panels inside the viewport | responsive | en | 1440×1080 | true | true |  |
| pass | LR.3 | Insets symmetric (RTL-neutral) | rtl | ar | 390×844 | true | true |  |
| pass | LR.3 | Insets symmetric (RTL-neutral) | rtl | ar | 768×1024 | true | true |  |
| pass | LR.3 | Insets symmetric (RTL-neutral) | rtl | ar | 1440×1080 | true | true |  |
| pass | LR.3 | Insets symmetric (RTL-neutral) | rtl | en | 390×844 | true | true |  |
| pass | LR.3 | Insets symmetric (RTL-neutral) | rtl | en | 768×1024 | true | true |  |
| pass | LR.3 | Insets symmetric (RTL-neutral) | rtl | en | 1440×1080 | true | true |  |
| pass | LR.4 | No portrait clipped by its panel (all ten inside a panel) | responsive | ar | 390×844 | true | true |  |
| pass | LR.4 | No portrait clipped by its panel (all ten inside a panel) | responsive | ar | 768×1024 | true | true |  |
| pass | LR.4 | No portrait clipped by its panel (all ten inside a panel) | responsive | ar | 1440×1080 | true | true |  |
| pass | LR.4 | No portrait clipped by its panel (all ten inside a panel) | responsive | en | 390×844 | true | true |  |
| pass | LR.4 | No portrait clipped by its panel (all ten inside a panel) | responsive | en | 768×1024 | true | true |  |
| pass | LR.4 | No portrait clipped by its panel (all ten inside a panel) | responsive | en | 1440×1080 | true | true |  |
| pass | LR.5 | Labels inside the viewport and centred on their panels | responsive | ar | 390×844 | true | true |  |
| pass | LR.5 | Labels inside the viewport and centred on their panels | responsive | ar | 768×1024 | true | true |  |
| pass | LR.5 | Labels inside the viewport and centred on their panels | responsive | ar | 1440×1080 | true | true |  |
| pass | LR.5 | Labels inside the viewport and centred on their panels | responsive | en | 390×844 | true | true |  |
| pass | LR.5 | Labels inside the viewport and centred on their panels | responsive | en | 768×1024 | true | true |  |
| pass | LR.5 | Labels inside the viewport and centred on their panels | responsive | en | 1440×1080 | true | true |  |
| pass | LR.6 | Document direction | rtl | ar | 390×844 | rtl | rtl |  |
| pass | LR.6 | Document direction | rtl | ar | 768×1024 | rtl | rtl |  |
| pass | LR.6 | Document direction | rtl | ar | 1440×1080 | rtl | rtl |  |
| pass | LR.6 | Document direction | rtl | en | 390×844 | ltr | ltr |  |
| pass | LR.6 | Document direction | rtl | en | 768×1024 | ltr | ltr |  |
| pass | LR.6 | Document direction | rtl | en | 1440×1080 | ltr | ltr |  |
