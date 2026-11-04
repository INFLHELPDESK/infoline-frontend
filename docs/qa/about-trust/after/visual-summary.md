# Visual QA summary

fail: 0 · designer-decision: 0 · reference-unavailable: 4 · advisory: 8 · approved-exception: 0 · pass: 72

| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |
|---|---|---|---|---|---|---|---|---|
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | ar | 390×844 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | ar | 768×1024 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | en | 390×844 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| reference-unavailable | ATR.7 | Figma frame at this width | responsive | en | 768×1024 | no Figma frame | — | Only 1440 frames exist; the scale floor is a designer-confirmation item (PQA-029). |
| advisory | AT7 | Section box (neighbour/regression evidence) | layout | ar | 1440×1080 | — | 1440×580 | Compare before/after: the section's own height must not change. |
| advisory | AT7 | Section box (neighbour/regression evidence) | layout | en | 1440×1080 | — | 1440×628 | Compare before/after: the section's own height must not change. |
| advisory | ATB.1r | Correlation detail (measured values) | visual | en | 1440×1080 | — | r 0.839 at (-1,0); r(0,0) 0.829; hidden 0, moved +40px 0.003, mirrored 0.469 (not gated: symmetric rings); n=533588 | Fixed in advance: r >= 0.8 at shift <= 2px; controls < 0.8. |
| advisory | ATB.4 | Pixel mismatch, aligned section crop | visual | en | 1440×1080 | — | 4.87% | Evidence only: text/spacing differences are outside this finding. |
| advisory | ATR.3v | Rings box vertical coverage of the section | responsive | ar | 390×844 | — | does not cover (field 761.2px, section 811.6px) | No Figma frame at this width; the scale floor is a designer-confirmation item (PQA-029). |
| advisory | ATR.3v | Rings box vertical coverage of the section | responsive | ar | 768×1024 | — | covers (field 761.2px, section 572.4px) | No Figma frame at this width; the scale floor is a designer-confirmation item (PQA-029). |
| advisory | ATR.3v | Rings box vertical coverage of the section | responsive | en | 390×844 | — | does not cover (field 761.2px, section 859.6px) | No Figma frame at this width; the scale floor is a designer-confirmation item (PQA-029). |
| advisory | ATR.3v | Rings box vertical coverage of the section | responsive | en | 768×1024 | — | covers (field 761.2px, section 620.4px) | No Figma frame at this width; the scale floor is a designer-confirmation item (PQA-029). |
| pass | AT1.1 | Rings box keeps the asset aspect ratio (±0.5%, no stretch) | visual | ar | 1440×1080 | true | true |  |
| pass | AT1.1 | Rings box keeps the asset aspect ratio (±0.5%, no stretch) | visual | en | 1440×1080 | true | true |  |
| pass | AT1.2 | Rings drawn at Figma scale (1 SVG unit = 1px at 1440) | layout | ar | 1440×1080 | 1 | 1 |  |
| pass | AT1.2 | Rings drawn at Figma scale (1 SVG unit = 1px at 1440) | layout | en | 1440×1080 | 1 | 1 |  |
| pass | AT2.1 | Ring centre x = section centre (Figma 720 on a 1439 frame) | layout | ar | 1440×1080 | 720.5 | 720.5 |  |
| pass | AT2.1 | Ring centre x = section centre (Figma 720 on a 1439 frame) | layout | en | 1440×1080 | 720.5 | 720.5 |  |
| pass | AT2.2 | Ring centre y = eyebrow top + 233 (Figma 933 − 700) | layout | ar | 1440×1080 | 233 | 233 |  |
| pass | AT2.2 | Ring centre y = eyebrow top + 233 (Figma 933 − 700) | layout | en | 1440×1080 | 233 | 233 |  |
| pass | AT2.3 | All three rings share one centre | layout | ar | 1440×1080 | true | true |  |
| pass | AT2.3 | All three rings share one centre | layout | en | 1440×1080 | true | true |  |
| pass | AT3 | Three ring radii vs Figma 406:3368/3369/3370 | layout | ar | 1440×1080 | 407.5,565.5,691.5 | 407.5,565.5,691.5 |  |
| pass | AT3 | Three ring radii vs Figma 406:3368/3369/3370 | layout | en | 1440×1080 | 407.5,565.5,691.5 | 407.5,565.5,691.5 |  |
| pass | AT4.1 | Nine decorative dots | assets | ar | 1440×1080 | 9 | 9 |  |
| pass | AT4.1 | Nine decorative dots | assets | en | 1440×1080 | 9 | 9 |  |
| pass | AT4.2 | Dot offsets from the ring centre vs Figma (worst, px) | layout | ar | 1440×1080 | 0 | 0 |  |
| pass | AT4.2 | Dot offsets from the ring centre vs Figma (worst, px) | layout | en | 1440×1080 | 0 | 0 |  |
| pass | AT4.3 | Every dot centre lies on a ring path (worst distance, px) | layout | ar | 1440×1080 | 0 | 1.5 |  |
| pass | AT4.3 | Every dot centre lies on a ring path (worst distance, px) | layout | en | 1440×1080 | 0 | 1.5 |  |
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
| pass | ATB.1 | Ring-field luminance correlation vs Figma crop (r ≥ 0.8, shift ≤ ±2px) | visual | en | 1440×1080 | match | match |  |
| pass | ATB.2 | Control: rings hidden scores below the threshold (proves signal) | visual | en | 1440×1080 | true | true |  |
| pass | ATB.3 | Control: capture moved 40px down scores below the threshold (proves position sensitivity) | visual | en | 1440×1080 | true | true |  |
| pass | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | ar | 390×844 | true | true |  |
| pass | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | ar | 768×1024 | true | true |  |
| pass | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | ar | 1440×1080 | true | true |  |
| pass | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | en | 390×844 | true | true |  |
| pass | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | en | 768×1024 | true | true |  |
| pass | ATR.1 | Rings stay circular (box ratio = asset ratio) | responsive | en | 1440×1080 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | ar | 390×844 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | ar | 768×1024 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | ar | 1440×1080 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | en | 390×844 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | en | 768×1024 | true | true |  |
| pass | ATR.2 | Ring centre on the section's vertical axis (RTL-neutral) | rtl | en | 1440×1080 | true | true |  |
| pass | ATR.3 | Rings box spans the full section width | responsive | ar | 390×844 | true | true |  |
| pass | ATR.3 | Rings box spans the full section width | responsive | ar | 768×1024 | true | true |  |
| pass | ATR.3 | Rings box spans the full section width | responsive | ar | 1440×1080 | true | true |  |
| pass | ATR.3 | Rings box spans the full section width | responsive | en | 390×844 | true | true |  |
| pass | ATR.3 | Rings box spans the full section width | responsive | en | 768×1024 | true | true |  |
| pass | ATR.3 | Rings box spans the full section width | responsive | en | 1440×1080 | true | true |  |
| pass | ATR.3v | Rings box covers the section height (Figma-defined at 1440) | responsive | ar | 1440×1080 | true | true |  |
| pass | ATR.3v | Rings box covers the section height (Figma-defined at 1440) | responsive | en | 1440×1080 | true | true |  |
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
