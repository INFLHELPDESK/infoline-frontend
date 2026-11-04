# Visual QA summary

fail: 17 · designer-decision: 0 · reference-unavailable: 4 · advisory: 3 · approved-exception: 0 · pass: 53

| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |
|---|---|---|---|---|---|---|---|---|
| fail | AT1.1 | Rings box keeps the asset aspect ratio (±0.5%, no stretch) | visual | ar | 1440×1080 | true | false |  |
| fail | AT1.1 | Rings box keeps the asset aspect ratio (±0.5%, no stretch) | visual | en | 1440×1080 | true | false |  |
| fail | AT1.2 | Rings drawn at Figma scale (1 SVG unit = 1px at 1440) | layout | ar | 1440×1080 | 1 | 0.811 |  |
| fail | AT1.2 | Rings drawn at Figma scale (1 SVG unit = 1px at 1440) | layout | en | 1440×1080 | 1 | 0.878 |  |
| fail | AT2.2 | Ring centre y = eyebrow top + 233 (Figma 933 − 700) | layout | ar | 1440×1080 | 233 | 226.4 |  |
| fail | AT2.2 | Ring centre y = eyebrow top + 233 (Figma 933 − 700) | layout | en | 1440×1080 | 233 | 250.4 |  |
| fail | AT3 | Three ring radii vs Figma 406:3368/3369/3370 | layout | ar | 1440×1080 | 407.5,565.5,691.5 | 330.6,458.7,560.9 |  |
| fail | AT3 | Three ring radii vs Figma 406:3368/3369/3370 | layout | en | 1440×1080 | 407.5,565.5,691.5 | 357.9,496.7,607.4 |  |
| fail | AT4.2 | Dot offsets from the ring centre vs Figma (worst, px) | layout | ar | 1440×1080 | 0 | 130.8 |  |
| fail | AT4.2 | Dot offsets from the ring centre vs Figma (worst, px) | layout | en | 1440×1080 | 0 | 84.3 |  |
| fail | ATB.1 | Ring-field luminance correlation vs Figma crop (r ≥ 0.8, shift ≤ ±2px) | visual | en | 1440×1080 | match | r -0.008 at (4,-4); r(0,0) -0.008; hidden 0, moved +40px -0.003, mirrored -0.008 (not gated: symmetric rings); n=533588 |  |
| fail | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | ar | 390×844 | true | false |  |
| fail | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | ar | 768×1024 | true | false |  |
| fail | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | ar | 1440×1080 | true | false |  |
| fail | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | en | 390×844 | true | false |  |
| fail | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | en | 768×1024 | true | false |  |
| fail | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | en | 1440×1080 | true | false |  |
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | ar | 390×844 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | ar | 768×1024 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | en | 390×844 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | en | 768×1024 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| advisory | AT7 | Section box (neighbour/regression evidence) | layout | ar | 1440×1080 | — | 1440×580 | Compare before/after: the section's own height must not change. |
| advisory | AT7 | Section box (neighbour/regression evidence) | layout | en | 1440×1080 | — | 1440×628 | Compare before/after: the section's own height must not change. |
| advisory | ATB.4 | Pixel mismatch, aligned section crop | visual | en | 1440×1080 | — | 5.28% | Evidence only: text/spacing differences are outside this finding. |
| pass | AT2.1 | Ring centre x = section centre (Figma 720 on a 1439 frame) | layout | ar | 1440×1080 | 720.5 | 720.4 |  |
| pass | AT2.1 | Ring centre x = section centre (Figma 720 on a 1439 frame) | layout | en | 1440×1080 | 720.5 | 720.4 |  |
| pass | AT2.3 | All three rings share one centre | layout | ar | 1440×1080 | true | true |  |
| pass | AT2.3 | All three rings share one centre | layout | en | 1440×1080 | true | true |  |
| pass | AT4.1 | Nine decorative dots | assets | ar | 1440×1080 | 9 | 9 |  |
| pass | AT4.1 | Nine decorative dots | assets | en | 1440×1080 | 9 | 9 |  |
| pass | AT4.3 | Every dot centre lies on a ring path (worst distance, px) | layout | ar | 1440×1080 | 0 | 1.2 |  |
| pass | AT4.3 | Every dot centre lies on a ring path (worst distance, px) | layout | en | 1440×1080 | 0 | 1.3 |  |
| pass | AT5.1 | Rings box covers the whole section | layout | ar | 1440×1080 | true | true |  |
| pass | AT5.1 | Rings box covers the whole section | layout | en | 1440×1080 | true | true |  |
| pass | AT5.2 | Section clips the artwork (overflow hidden), no page overflow | layout | ar | 1440×1080 | hidden\|true | hidden\|true |  |
| pass | AT5.2 | Section clips the artwork (overflow hidden), no page overflow | layout | en | 1440×1080 | hidden\|true | hidden\|true |  |
| pass | AT5.3 | Rings ignore pointer events | layout | ar | 1440×1080 | none | none |  |
| pass | AT5.3 | Rings ignore pointer events | layout | en | 1440×1080 | none | none |  |
| pass | AT5.4 | Decorative: empty alt and aria-hidden | assets | ar | 1440×1080 | \|true | \|true |  |
| pass | AT5.4 | Decorative: empty alt and aria-hidden | assets | en | 1440×1080 | \|true | \|true |  |
| pass | AT5.5 | Rings never sit above content (hit-test at every content box centre) | layout | ar | 1440×1080 | false | false |  |
| pass | AT5.5 | Rings never sit above content (hit-test at every content box centre) | layout | en | 1440×1080 | false | false |  |
| pass | AT6 | Rings not mirrored in RTL (no negative x-scale) | rtl | ar | 1440×1080 | true | true |  |
| pass | AT6 | Rings not mirrored in RTL (no negative x-scale) | rtl | en | 1440×1080 | true | true |  |
| pass | ATB.0 | Self-compare (Figma crop vs itself) r = 1 at (0,0) | visual | en | 1440×1080 | 1@0,0 | 1@0,0 |  |
| pass | ATB.2 | Control: rings hidden scores below the threshold (proves signal) | visual | en | 1440×1080 | true | true |  |
| pass | ATB.3 | Control: capture moved 40px down scores below the threshold (proves position sensitivity) | visual | en | 1440×1080 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | ar | 390×844 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | ar | 768×1024 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | ar | 1440×1080 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | en | 390×844 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | en | 768×1024 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | en | 1440×1080 | true | true |  |
| pass | ATR.3 | Rings box covers the whole section | responsive | ar | 390×844 | true | true |  |
| pass | ATR.3 | Rings box covers the whole section | responsive | ar | 768×1024 | true | true |  |
| pass | ATR.3 | Rings box covers the whole section | responsive | ar | 1440×1080 | true | true |  |
| pass | ATR.3 | Rings box covers the whole section | responsive | en | 390×844 | true | true |  |
| pass | ATR.3 | Rings box covers the whole section | responsive | en | 768×1024 | true | true |  |
| pass | ATR.3 | Rings box covers the whole section | responsive | en | 1440×1080 | true | true |  |
| pass | ATR.4 | Ring centre lies inside the content block (vertically) | responsive | ar | 390×844 | true | true |  |
| pass | ATR.4 | Ring centre lies inside the content block (vertically) | responsive | ar | 768×1024 | true | true |  |
| pass | ATR.4 | Ring centre lies inside the content block (vertically) | responsive | ar | 1440×1080 | true | true |  |
| pass | ATR.4 | Ring centre lies inside the content block (vertically) | responsive | en | 390×844 | true | true |  |
| pass | ATR.4 | Ring centre lies inside the content block (vertically) | responsive | en | 768×1024 | true | true |  |
| pass | ATR.4 | Ring centre lies inside the content block (vertically) | responsive | en | 1440×1080 | true | true |  |
| pass | ATR.5 | No horizontal overflow | responsive | ar | 390×844 | true | true |  |
| pass | ATR.5 | No horizontal overflow | responsive | ar | 768×1024 | true | true |  |
| pass | ATR.5 | No horizontal overflow | responsive | ar | 1440×1080 | true | true |  |
| pass | ATR.5 | No horizontal overflow | responsive | en | 390×844 | true | true |  |
| pass | ATR.5 | No horizontal overflow | responsive | en | 768×1024 | true | true |  |
| pass | ATR.5 | No horizontal overflow | responsive | en | 1440×1080 | true | true |  |
| pass | ATR.6 | Document direction | rtl | ar | 390×844 | rtl | rtl |  |
| pass | ATR.6 | Document direction | rtl | ar | 768×1024 | rtl | rtl |  |
| pass | ATR.6 | Document direction | rtl | ar | 1440×1080 | rtl | rtl |  |
| pass | ATR.6 | Document direction | rtl | en | 390×844 | ltr | ltr |  |
| pass | ATR.6 | Document direction | rtl | en | 768×1024 | ltr | ltr |  |
| pass | ATR.6 | Document direction | rtl | en | 1440×1080 | ltr | ltr |  |
