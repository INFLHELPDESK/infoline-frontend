# Visual QA summary

fail: 70 · designer-decision: 0 · reference-unavailable: 6 · advisory: 15 · approved-exception: 0 · pass: 44

| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |
|---|---|---|---|---|---|---|---|---|
| fail | V1.1 | Heading font-size (heading/2xl: 36) | typography | ar | 1440×1080 | 36px | 40px |  |
| fail | V1.1 | Heading font-size (heading/2xl: 36) | typography | en | 1440×1080 | 36px | 40px |  |
| fail | V1.4 | Heading wraps to three lines at 1440 | typography | en | 1440×1080 | 3 | 4 |  |
| fail | V2.1 | Accent rule size 11 × 129 | layout | ar | 1440×1080 | 11,129 | 11,126 |  |
| fail | V2.1 | Accent rule size 11 × 129 | layout | en | 1440×1080 | 11,129 | 11,170 |  |
| fail | V2.2 | Accent rule top = heading top (Figma both y=133) | layout | ar | 1440×1080 | 0 | 6 |  |
| fail | V2.2 | Accent rule top = heading top (Figma both y=133) | layout | en | 1440×1080 | 0 | 6 |  |
| fail | V2.3 | Gap rule → heading (Figma 111 − 93 = 18) | layout | ar | 1440×1080 | 18 | -638 |  |
| fail | V3.1 | Composition is separate layers (pattern, capsule, photo, overlay, 3 crosses) | assets | ar | 1440×1080 | true | false |  |
| fail | V3.1 | Composition is separate layers (pattern, capsule, photo, overlay, 3 crosses) | assets | en | 1440×1080 | true | false |  |
| fail | V3.2 | Only the pattern, the photo and the three crosses are images | assets | ar | 1440×1080 | 5 | 1 |  |
| fail | V3.2 | Only the pattern, the photo and the three crosses are images | assets | en | 1440×1080 | 5 | 1 |  |
| fail | V3.3 | Capsule size 593.461 × 175.903 | layout | ar | 1440×1080 | 0,0,593.5,175.9 | absent |  |
| fail | V3.3 | Capsule size 593.461 × 175.903 | layout | en | 1440×1080 | 0,0,593.5,175.9 | absent |  |
| fail | V3.4 | Photo box vs capsule (406:3565) | layout | ar | 1440×1080 | 15.3,-199.9,563.9,376 | absent |  |
| fail | V3.4 | Photo box vs capsule (406:3565) | layout | en | 1440×1080 | 15.3,-199.9,563.9,376 | absent |  |
| fail | V3.5 | Pattern box vs capsule (406:3562) | layout | ar | 1440×1080 | -107.6,-346.1,847.6,592 | absent |  |
| fail | V3.5 | Pattern box vs capsule (406:3562) | layout | en | 1440×1080 | -107.6,-346.1,847.6,592 | absent |  |
| fail | V3.6 | Gradient overlay = capsule box (406:3575) | layout | ar | 1440×1080 | 0,0,593.5,175.9 | absent |  |
| fail | V3.6 | Gradient overlay = capsule box (406:3575) | layout | en | 1440×1080 | 0,0,593.5,175.9 | absent |  |
| fail | V3.7.1 | Cross 1 box vs capsule (406:3566) | layout | ar | 1440×1080 | 402.7,-172.1,23.3,26.9 | absent |  |
| fail | V3.7.1 | Cross 1 box vs capsule (406:3566) | layout | en | 1440×1080 | 402.7,-172.1,23.3,26.9 | absent |  |
| fail | V3.7.2 | Cross 2 box vs capsule (406:3569) | layout | ar | 1440×1080 | 311.2,-126.4,23.3,26.9 | absent |  |
| fail | V3.7.2 | Cross 2 box vs capsule (406:3569) | layout | en | 1440×1080 | 311.2,-126.4,23.3,26.9 | absent |  |
| fail | V3.7.3 | Cross 3 box vs capsule (406:3572) | layout | ar | 1440×1080 | 219.8,-172.1,23.3,26.9 | absent |  |
| fail | V3.7.3 | Cross 3 box vs capsule (406:3572) | layout | en | 1440×1080 | 219.8,-172.1,23.3,26.9 | absent |  |
| fail | V3.8 | Capsule x/y at 1440 (page x; y aligned on the eyebrow top) | layout | en | 1440×1080 | 763.6,255.1,593.5,175.9 | absent |  |
| fail | V3.9 | Photo x/y at 1440 (406:3565) | layout | en | 1440×1080 | 778.9,55.2,563.9,376 | absent |  |
| fail | V3.10 | Pattern overflows the right edge (656 + 847.6 = 1503.6 > 1440) | layout | en | 1440×1080 | true | false |  |
| fail | V3.11 | Capsule colour (content/brand/default #1c97d4) | colour | ar | 1440×1080 | rgb(28, 151, 212) | absent |  |
| fail | V3.11 | Capsule colour (content/brand/default #1c97d4) | colour | en | 1440×1080 | rgb(28, 151, 212) | absent |  |
| fail | V3.12 | Capsule is a full pill (radius ≥ height / 2) | visual | ar | 1440×1080 | true | false |  |
| fail | V3.12 | Capsule is a full pill (radius ≥ height / 2) | visual | en | 1440×1080 | true | false |  |
| fail | V3.13 | Overlay gradient rgba(15,78,110,0) → rgba(15,78,110,0.3), top to bottom | colour | ar | 1440×1080 | true | false |  |
| fail | V3.13 | Overlay gradient rgba(15,78,110,0) → rgba(15,78,110,0.3), top to bottom | colour | en | 1440×1080 | true | false |  |
| fail | V3.14 | Layer order bottom→top: pattern, capsule, photo, crosses, gradient | layout | ar | 1440×1080 | true | false |  |
| fail | V3.14 | Layer order bottom→top: pattern, capsule, photo, crosses, gradient | layout | en | 1440×1080 | true | false |  |
| fail | V3.15 | Photo object-fit cover, background transparent (cut-out PNG) | visual | ar | 1440×1080 | cover | absent |  |
| fail | V3.15 | Photo object-fit cover, background transparent (cut-out PNG) | visual | en | 1440×1080 | cover | absent |  |
| fail | V4.1 | Photo asset is byte-identical to the Figma 406:3565 image (SHA-256) | assets | ar | 1440×1080 | f2b3a3b476aec384679006b862522471fac22b2357ca658ef40333f2168e78f7 | missing |  |
| fail | V4.1 | Photo asset is byte-identical to the Figma 406:3565 image (SHA-256) | assets | en | 1440×1080 | f2b3a3b476aec384679006b862522471fac22b2357ca658ef40333f2168e78f7 | missing |  |
| fail | V4.5 | Section clips the overflow (overflow hidden), no page overflow | layout | ar | 1440×1080 | hidden\|true | visible\|true |  |
| fail | V4.5 | Section clips the overflow (overflow hidden), no page overflow | layout | en | 1440×1080 | hidden\|true | visible\|true |  |
| fail | VB.1 | Composition ink bounding box (size within max(2px,5%), centre within 2px) | visual | en | 1440×1080 | match | ink 719×410 @ 359.5,261.0 vs Figma 717×342 @ 358.5,261.0 |  |
| fail | VB.2 | Composition visible area vs Figma (128198 / 116126 px, ±5%) | visual | en | 1440×1080 | true | false |  |
| fail | VB.4 | Pattern + crosses luminance correlation vs Figma (r ≥ 0.8, shift ≤ ±2px) | visual | en | 1440×1080 | match | r -0.026 at (3,-4); hidden -0.026, moved +40px -0.02; n=124288; pattern/cross layers found: 0 |  |
| fail | VR.4 | Capsule and photo fully inside the viewport width (essential content not clipped) | responsive | ar | 390×844 | true | false |  |
| fail | VR.4 | Capsule and photo fully inside the viewport width (essential content not clipped) | responsive | ar | 768×1024 | true | false |  |
| fail | VR.4 | Capsule and photo fully inside the viewport width (essential content not clipped) | responsive | ar | 1440×1080 | true | false |  |
| fail | VR.4 | Capsule and photo fully inside the viewport width (essential content not clipped) | responsive | en | 390×844 | true | false |  |
| fail | VR.4 | Capsule and photo fully inside the viewport width (essential content not clipped) | responsive | en | 768×1024 | true | false |  |
| fail | VR.4 | Capsule and photo fully inside the viewport width (essential content not clipped) | responsive | en | 1440×1080 | true | false |  |
| fail | VR.5 | Photo sits inside the capsule's width and above its bottom edge (cut-out over the capsule) | layout | ar | 390×844 | true | false |  |
| fail | VR.5 | Photo sits inside the capsule's width and above its bottom edge (cut-out over the capsule) | layout | ar | 768×1024 | true | false |  |
| fail | VR.5 | Photo sits inside the capsule's width and above its bottom edge (cut-out over the capsule) | layout | ar | 1440×1080 | true | false |  |
| fail | VR.5 | Photo sits inside the capsule's width and above its bottom edge (cut-out over the capsule) | layout | en | 390×844 | true | false |  |
| fail | VR.5 | Photo sits inside the capsule's width and above its bottom edge (cut-out over the capsule) | layout | en | 768×1024 | true | false |  |
| fail | VR.5 | Photo sits inside the capsule's width and above its bottom edge (cut-out over the capsule) | layout | en | 1440×1080 | true | false |  |
| fail | VR.6 | Photo and capsule keep their Figma aspect ratios | responsive | ar | 390×844 | true | false |  |
| fail | VR.6 | Photo and capsule keep their Figma aspect ratios | responsive | ar | 768×1024 | true | false |  |
| fail | VR.6 | Photo and capsule keep their Figma aspect ratios | responsive | ar | 1440×1080 | true | false |  |
| fail | VR.6 | Photo and capsule keep their Figma aspect ratios | responsive | en | 390×844 | true | false |  |
| fail | VR.6 | Photo and capsule keep their Figma aspect ratios | responsive | en | 768×1024 | true | false |  |
| fail | VR.6 | Photo and capsule keep their Figma aspect ratios | responsive | en | 1440×1080 | true | false |  |
| fail | VR.7 | Section clips; composition never widens the page | responsive | ar | 390×844 | hidden | visible |  |
| fail | VR.7 | Section clips; composition never widens the page | responsive | ar | 768×1024 | hidden | visible |  |
| fail | VR.7 | Section clips; composition never widens the page | responsive | ar | 1440×1080 | hidden | visible |  |
| fail | VR.7 | Section clips; composition never widens the page | responsive | en | 390×844 | hidden | visible |  |
| fail | VR.7 | Section clips; composition never widens the page | responsive | en | 768×1024 | hidden | visible |  |
| fail | VR.7 | Section clips; composition never widens the page | responsive | en | 1440×1080 | hidden | visible |  |
| reference-unavailable | V1.4 | Arabic heading line count | typography | ar | 1440×1080 | no Figma frame | 3 lines | No Arabic frame; Arabic wraps differently. Size and line-height are gated above. |
| reference-unavailable | V3.8 | Absolute composition position | rtl | ar | 1440×1080 | no Figma frame | — | No Arabic frame; relative layer geometry above is gated, the column is on the opposite side. |
| reference-unavailable | VR.9 | Figma frame at this width | responsive | ar | 390×844 | no Figma frame | — | Only 1440 frames exist; the composition scales with the width (PQA-030). |
| reference-unavailable | VR.9 | Figma frame at this width | responsive | ar | 768×1024 | no Figma frame | — | Only 1440 frames exist; the composition scales with the width (PQA-030). |
| reference-unavailable | VR.9 | Figma frame at this width | responsive | en | 390×844 | no Figma frame | — | Only 1440 frames exist; the composition scales with the width (PQA-030). |
| reference-unavailable | VR.9 | Figma frame at this width | responsive | en | 768×1024 | no Figma frame | — | Only 1440 frames exist; the composition scales with the width (PQA-030). |
| advisory | V1.6 | Heading weight (Figma Black 800; site uses semibold on every About heading) | typography | ar | 1440×1080 | — | 600 | Site-wide heading-weight convention, outside finding #3 (see PQA-020). |
| advisory | V1.6 | Heading weight (Figma Black 800; site uses semibold on every About heading) | typography | en | 1440×1080 | — | 600 | Site-wide heading-weight convention, outside finding #3 (see PQA-020). |
| advisory | V5.1 | Section box (neighbour/regression evidence) | layout | ar | 1440×1080 | — | 1440×713.1 | Section padding is outside this finding; compare before/after. |
| advisory | V5.1 | Section box (neighbour/regression evidence) | layout | en | 1440×1080 | — | 1440×713.1 | Section padding is outside this finding; compare before/after. |
| advisory | V5.2 | Text inset: eyebrow/rule x (Figma 82; site container px-10 = 40) | layout | ar | 1440×1080 | — | 760 | About container inset differs from Figma on every section (cf. PQA-023 item 3); not part of finding #3. |
| advisory | V5.2 | Text inset: eyebrow/rule x (Figma 82; site container px-10 = 40) | layout | en | 1440×1080 | — | 40 | About container inset differs from Figma on every section (cf. PQA-023 item 3); not part of finding #3. |
| advisory | VB.4r | Pattern correlation detail (measured values) | visual | en | 1440×1080 | — | r -0.026 at (3,-4); hidden -0.026, moved +40px -0.02; n=124288; pattern/cross layers found: 0 | Fixed in advance: r ≥ 0.8 at shift ≤ 2px; controls < 0.8. |
| advisory | VB.7.Composition | Pixel mismatch — Composition | visual | en | 1440×1080 | — | 25.84% | Evidence only. |
| advisory | VB.7.Section | Pixel mismatch — Section | visual | en | 1440×1080 | — | 22.70% | Evidence only. |
| advisory | VR.10 | Section box | layout | ar | 390×844 | — | 390×861 | Regression evidence. |
| advisory | VR.10 | Section box | layout | ar | 768×1024 | — | 768×1006.4 | Regression evidence. |
| advisory | VR.10 | Section box | layout | ar | 1440×1080 | — | 1440×713.1 | Regression evidence. |
| advisory | VR.10 | Section box | layout | en | 390×844 | — | 390×979.4 | Regression evidence. |
| advisory | VR.10 | Section box | layout | en | 768×1024 | — | 768×1065.6 | Regression evidence. |
| advisory | VR.10 | Section box | layout | en | 1440×1080 | — | 1440×713.1 | Regression evidence. |
| pass | V1.2 | Heading line-height (44) | typography | ar | 1440×1080 | 44px | 44px |  |
| pass | V1.2 | Heading line-height (44) | typography | en | 1440×1080 | 44px | 44px |  |
| pass | V1.3 | Heading colour (content/base/primary) | colour | ar | 1440×1080 | rgb(38, 50, 56) | rgb(38, 50, 56) |  |
| pass | V1.3 | Heading colour (content/base/primary) | colour | en | 1440×1080 | rgb(38, 50, 56) | rgb(38, 50, 56) |  |
| pass | V1.5 | Heading box width ≤ Figma 611 | layout | en | 1440×1080 | true | true |  |
| pass | V2.3 | Gap rule → heading (Figma 111 − 93 = 18) | layout | en | 1440×1080 | 18 | 16 |  |
| pass | V2.4 | Accent rule colour (content/brand/default) | colour | ar | 1440×1080 | rgb(28, 151, 212) | rgb(28, 151, 212) |  |
| pass | V2.4 | Accent rule colour (content/brand/default) | colour | en | 1440×1080 | rgb(28, 151, 212) | rgb(28, 151, 212) |  |
| pass | V2.5 | Accent rule is decorative (aria-hidden) | assets | ar | 1440×1080 | true | true |  |
| pass | V2.5 | Accent rule is decorative (aria-hidden) | assets | en | 1440×1080 | true | true |  |
| pass | V4.2 | Every image decorative: empty alt | assets | ar | 1440×1080 | true | true |  |
| pass | V4.2 | Every image decorative: empty alt | assets | en | 1440×1080 | true | true |  |
| pass | V4.3 | Composition hidden from assistive technology (aria-hidden on or above every image) | assets | ar | 1440×1080 | true | true |  |
| pass | V4.3 | Composition hidden from assistive technology (aria-hidden on or above every image) | assets | en | 1440×1080 | true | true |  |
| pass | V4.4 | No image or ancestor mirrored (no negative x-scale) | rtl | ar | 1440×1080 | true | true |  |
| pass | V4.4 | No image or ancestor mirrored (no negative x-scale) | rtl | en | 1440×1080 | true | true |  |
| pass | VB.0 | Self-compare (Figma vs itself) mismatch = 0 | visual | en | 1440×1080 | 0 | 0 |  |
| pass | VB.3 | Self-compare (Figma vs itself) r = 1 at (0,0) | visual | en | 1440×1080 | 1@0,0 | 1@0,0 |  |
| pass | VB.5 | Control: layers hidden scores below the threshold | visual | en | 1440×1080 | true | true |  |
| pass | VB.6 | Control: capture moved 40px down scores below the threshold | visual | en | 1440×1080 | true | true |  |
| pass | VR.1 | No horizontal overflow | responsive | ar | 390×844 | true | true |  |
| pass | VR.1 | No horizontal overflow | responsive | ar | 768×1024 | true | true |  |
| pass | VR.1 | No horizontal overflow | responsive | ar | 1440×1080 | true | true |  |
| pass | VR.1 | No horizontal overflow | responsive | en | 390×844 | true | true |  |
| pass | VR.1 | No horizontal overflow | responsive | en | 768×1024 | true | true |  |
| pass | VR.1 | No horizontal overflow | responsive | en | 1440×1080 | true | true |  |
| pass | VR.2 | Heading inside the viewport (not clipped) | responsive | ar | 390×844 | true | true |  |
| pass | VR.2 | Heading inside the viewport (not clipped) | responsive | ar | 768×1024 | true | true |  |
| pass | VR.2 | Heading inside the viewport (not clipped) | responsive | ar | 1440×1080 | true | true |  |
| pass | VR.2 | Heading inside the viewport (not clipped) | responsive | en | 390×844 | true | true |  |
| pass | VR.2 | Heading inside the viewport (not clipped) | responsive | en | 768×1024 | true | true |  |
| pass | VR.2 | Heading inside the viewport (not clipped) | responsive | en | 1440×1080 | true | true |  |
| pass | VR.3 | Accent rule beside the heading and inside its vertical extent | responsive | ar | 390×844 | true | true |  |
| pass | VR.3 | Accent rule beside the heading and inside its vertical extent | responsive | ar | 768×1024 | true | true |  |
| pass | VR.3 | Accent rule beside the heading and inside its vertical extent | responsive | ar | 1440×1080 | true | true |  |
| pass | VR.3 | Accent rule beside the heading and inside its vertical extent | responsive | en | 390×844 | true | true |  |
| pass | VR.3 | Accent rule beside the heading and inside its vertical extent | responsive | en | 768×1024 | true | true |  |
| pass | VR.3 | Accent rule beside the heading and inside its vertical extent | responsive | en | 1440×1080 | true | true |  |
| pass | VR.8 | Document direction | rtl | ar | 390×844 | rtl | rtl |  |
| pass | VR.8 | Document direction | rtl | ar | 768×1024 | rtl | rtl |  |
| pass | VR.8 | Document direction | rtl | ar | 1440×1080 | rtl | rtl |  |
| pass | VR.8 | Document direction | rtl | en | 390×844 | ltr | ltr |  |
| pass | VR.8 | Document direction | rtl | en | 768×1024 | ltr | ltr |  |
| pass | VR.8 | Document direction | rtl | en | 1440×1080 | ltr | ltr |  |
