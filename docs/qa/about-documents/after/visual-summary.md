# Visual QA summary

fail: 0 · designer-decision: 6 · reference-unavailable: 4 · advisory: 11 · approved-exception: 0 · pass: 179

| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |
|---|---|---|---|---|---|---|---|---|
| designer-decision | DB4 | Band panel inset, width and radius vs Figma (81 / 1278 / r20) | layout | ar | 1440×1080 | 81 / 1278 / 20px | 40 / 1360 / 20px | PQA-032: the designer confirmed the band layout is correct; the site uses the 40px container inset and radius 16. Unchanged. |
| designer-decision | DB4 | Band panel inset, width and radius vs Figma (81 / 1278 / r20) | layout | en | 1440×1080 | 81 / 1278 / 20px | 40 / 1360 / 20px | PQA-032: the designer confirmed the band layout is correct; the site uses the 40px container inset and radius 16. Unchanged. |
| designer-decision | DC1.2 | Card radius: Figma 16 (radius/xl), site rounded-2xl | visual | ar | 1440×1080 | 16px | 20px | PQA-032: the brief preserves the existing card radius; the project's rounded-2xl is 20px. Unchanged, for the Designer to decide. |
| designer-decision | DC1.2 | Card radius: Figma 16 (radius/xl), site rounded-2xl | visual | en | 1440×1080 | 16px | 20px | PQA-032: the brief preserves the existing card radius; the project's rounded-2xl is 20px. Unchanged, for the Designer to decide. |
| designer-decision | DC2.2 | Card radius: Figma 16 (radius/xl), site rounded-2xl | visual | ar | 1440×1080 | 16px | 20px | PQA-032: the brief preserves the existing card radius; the project's rounded-2xl is 20px. Unchanged, for the Designer to decide. |
| designer-decision | DC2.2 | Card radius: Figma 16 (radius/xl), site rounded-2xl | visual | en | 1440×1080 | 16px | 20px | PQA-032: the brief preserves the existing card radius; the project's rounded-2xl is 20px. Unchanged, for the Designer to decide. |
| reference-unavailable | DR.10 | Figma frame at this width | responsive | ar | 390×844 | no Figma frame | — | Only 1440 frames exist (PQA-032). |
| reference-unavailable | DR.10 | Figma frame at this width | responsive | ar | 768×1024 | no Figma frame | — | Only 1440 frames exist (PQA-032). |
| reference-unavailable | DR.10 | Figma frame at this width | responsive | en | 390×844 | no Figma frame | — | Only 1440 frames exist (PQA-032). |
| reference-unavailable | DR.10 | Figma frame at this width | responsive | en | 768×1024 | no Figma frame | — | Only 1440 frames exist (PQA-032). |
| advisory | DB5 | Band panel height and section box (regression evidence) | layout | ar | 1440×1080 | — | panel 240 (Figma 242); section 1440×400 | Section padding is unchanged by this fix. |
| advisory | DB5 | Band panel height and section box (regression evidence) | layout | en | 1440×1080 | — | panel 240 (Figma 242); section 1440×400 | Section padding is unchanged by this fix. |
| advisory | DC1.11 | Title weight (Figma Avenir Heavy 900; site bold 700) and meta text | typography | ar | 1440×1080 | — | 700; meta "PDF · 5.2 MB" vs Figma "PDF · 1.0 MB" | Heading/body weight mapping is site-wide (PQA-020). The site shows PDF sizes 5.2 / 5.4 MB, Figma 1.0 / 1.6 MB: unverifiable without the PDFs (PQA-032). |
| advisory | DC1.11 | Title weight (Figma Avenir Heavy 900; site bold 700) and meta text | typography | en | 1440×1080 | — | 700; meta "PDF · 5.2 MB" vs Figma "PDF · 1.0 MB" | Heading/body weight mapping is site-wide (PQA-020). The site shows PDF sizes 5.2 / 5.4 MB, Figma 1.0 / 1.6 MB: unverifiable without the PDFs (PQA-032). |
| advisory | DC2.11 | Title weight (Figma Avenir Heavy 900; site bold 700) and meta text | typography | ar | 1440×1080 | — | 700; meta "PDF · 5.4 MB" vs Figma "PDF · 1.6 MB" | Heading/body weight mapping is site-wide (PQA-020). The site shows PDF sizes 5.2 / 5.4 MB, Figma 1.0 / 1.6 MB: unverifiable without the PDFs (PQA-032). |
| advisory | DC2.11 | Title weight (Figma Avenir Heavy 900; site bold 700) and meta text | typography | en | 1440×1080 | — | 700; meta "PDF · 5.4 MB" vs Figma "PDF · 1.6 MB" | Heading/body weight mapping is site-wide (PQA-020). The site shows PDF sizes 5.2 / 5.4 MB, Figma 1.0 / 1.6 MB: unverifiable without the PDFs (PQA-032). |
| advisory | DG.3 | Pixel mismatch, card stack | visual | en | 1440×1080 | — | 5.50% | Evidence only: the action is disabled (grey) here, Figma shows it brand blue; PDF sizes differ (5.2/5.4 vs 1.0/1.6 MB). |
| advisory | DU1.5 | Brand blue (#1c97d4) when the PDF becomes available | colour | ar | 1440×1080 | — | Figma #1c97d4 | Figma colour for the live state; shown automatically once the document href is real (unit-tested). Not testable here: no PDF exists (PQA-032). |
| advisory | DU1.5 | Brand blue (#1c97d4) when the PDF becomes available | colour | en | 1440×1080 | — | Figma #1c97d4 | Figma colour for the live state; shown automatically once the document href is real (unit-tested). Not testable here: no PDF exists (PQA-032). |
| advisory | DU2.5 | Brand blue (#1c97d4) when the PDF becomes available | colour | ar | 1440×1080 | — | Figma #1c97d4 | Figma colour for the live state; shown automatically once the document href is real (unit-tested). Not testable here: no PDF exists (PQA-032). |
| advisory | DU2.5 | Brand blue (#1c97d4) when the PDF becomes available | colour | en | 1440×1080 | — | Figma #1c97d4 | Figma colour for the live state; shown automatically once the document href is real (unit-tested). Not testable here: no PDF exists (PQA-032). |
| pass | DB1 | Closing band section has no background of its own (no slate strip) | colour | ar | 1440×1080 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DB1 | Closing band section has no background of its own (no slate strip) | colour | en | 1440×1080 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DB2 | Band sits on the same page ground as the Documents section above (white body) | colour | ar | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DB2 | Band sits on the same page ground as the Documents section above (white body) | colour | en | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DB3 | Page ground is white (surface/base/layer-1) | colour | ar | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DB3 | Page ground is white (surface/base/layer-1) | colour | en | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DB6 | Both CTA buttons keep their localised routes | layout | ar | 1440×1080 | /ar/contact\|/ar/solutions | /ar/contact\|/ar/solutions |  |
| pass | DB6 | Both CTA buttons keep their localised routes | layout | en | 1440×1080 | /en/contact\|/en/solutions | /en/contact\|/en/solutions |  |
| pass | DB7 | Both CTA buttons visible | layout | ar | 1440×1080 | true | true |  |
| pass | DB7 | Both CTA buttons visible | layout | en | 1440×1080 | true | true |  |
| pass | DC1.1 | Card 1 size 549 × 92 | layout | ar | 1440×1080 | 549,92 | 549,94 |  |
| pass | DC1.1 | Card 1 size 549 × 92 | layout | en | 1440×1080 | 549,92 | 549,94 |  |
| pass | DC1.3 | Card border 1px #e0e0e0 (border/neutral/muted) | colour | ar | 1440×1080 | 1px rgb(224, 224, 224) | 1px rgb(224, 224, 224) |  |
| pass | DC1.3 | Card border 1px #e0e0e0 (border/neutral/muted) | colour | en | 1440×1080 | 1px rgb(224, 224, 224) | 1px rgb(224, 224, 224) |  |
| pass | DC1.4 | Card background white (surface/base/layer-1) | colour | ar | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DC1.4 | Card background white (surface/base/layer-1) | colour | en | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DC1.5 | Card shadow layer 0 6px 6px rgba(52,55,70,0.06) present | visual | ar | 1440×1080 | true | true |  |
| pass | DC1.5 | Card shadow layer 0 6px 6px rgba(52,55,70,0.06) present | visual | en | 1440×1080 | true | true |  |
| pass | DC1.6 | PDF icon 40 × 40 | assets | ar | 1440×1080 | 40,40 | 40,40 |  |
| pass | DC1.6 | PDF icon 40 × 40 | assets | en | 1440×1080 | 40,40 | 40,40 |  |
| pass | DC1.7 | PDF icon 24px from the leading edge | layout | ar | 1440×1080 | 24 | 25 |  |
| pass | DC1.7 | PDF icon 24px from the leading edge | layout | en | 1440×1080 | 24 | 25 |  |
| pass | DC1.8 | PDF icon vertically centred (Figma top 26) | layout | ar | 1440×1080 | 26 | 27 |  |
| pass | DC1.8 | PDF icon vertically centred (Figma top 26) | layout | en | 1440×1080 | 26 | 27 |  |
| pass | DC1.9 | Title 14/20, colour content/base/primary | typography | ar | 1440×1080 | 14px/20px/rgb(38, 50, 56) | 14px/20px/rgb(38, 50, 56) |  |
| pass | DC1.9 | Title 14/20, colour content/base/primary | typography | en | 1440×1080 | 14px/20px/rgb(38, 50, 56) | 14px/20px/rgb(38, 50, 56) |  |
| pass | DC1.10 | Meta 13/20 | typography | ar | 1440×1080 | 13px/20px | 13px/20px |  |
| pass | DC1.10 | Meta 13/20 | typography | en | 1440×1080 | 13px/20px | 13px/20px |  |
| pass | DC1.12 | Card has the DOWNLOAD action (one control) | layout | ar | 1440×1080 | 1 | 1 |  |
| pass | DC1.12 | Card has the DOWNLOAD action (one control) | layout | en | 1440×1080 | 1 | 1 |  |
| pass | DC1.13 | Action 24px from the trailing edge (opposite end from the icon) | layout | ar | 1440×1080 | 24 | 25 |  |
| pass | DC1.13 | Action 24px from the trailing edge (opposite end from the icon) | layout | en | 1440×1080 | 24 | 25 |  |
| pass | DC1.14 | Action vertically centred on the card | layout | ar | 1440×1080 | 0 | 0 |  |
| pass | DC1.14 | Action vertically centred on the card | layout | en | 1440×1080 | 0 | 0 |  |
| pass | DC1.15 | Action height 16 (overline/sm/medium line-height) | typography | ar | 1440×1080 | 16 | 16 |  |
| pass | DC1.15 | Action height 16 (overline/sm/medium line-height) | typography | en | 1440×1080 | 16 | 16 |  |
| pass | DC1.16 | Action typography 13px, weight 500, uppercase | typography | ar | 1440×1080 | 13px/500/uppercase | 13px/500/uppercase |  |
| pass | DC1.16 | Action typography 13px, weight 500, uppercase | typography | en | 1440×1080 | 13px/500/uppercase | 13px/500/uppercase |  |
| pass | DC1.17 | Action letter-spacing 0 (site rule: Arabic is never tracked) | typography | ar | 1440×1080 | normal | normal |  |
| pass | DC1.17 | Action letter-spacing 1.5px (tracking-wider) | typography | en | 1440×1080 | 1.5px | 1.5px |  |
| pass | DC1.18 | Arrow icon present and rotated for RTL | assets | ar | 1440×1080 | true | true |  |
| pass | DC1.18 | Arrow icon present, pointing inline-end | assets | en | 1440×1080 | true | true |  |
| pass | DC2.1 | Card 2 size 549 × 92 | layout | ar | 1440×1080 | 549,92 | 549,94 |  |
| pass | DC2.1 | Card 2 size 549 × 92 | layout | en | 1440×1080 | 549,92 | 549,94 |  |
| pass | DC2.3 | Card border 1px #e0e0e0 (border/neutral/muted) | colour | ar | 1440×1080 | 1px rgb(224, 224, 224) | 1px rgb(224, 224, 224) |  |
| pass | DC2.3 | Card border 1px #e0e0e0 (border/neutral/muted) | colour | en | 1440×1080 | 1px rgb(224, 224, 224) | 1px rgb(224, 224, 224) |  |
| pass | DC2.4 | Card background white (surface/base/layer-1) | colour | ar | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DC2.4 | Card background white (surface/base/layer-1) | colour | en | 1440×1080 | rgb(255, 255, 255) | rgb(255, 255, 255) |  |
| pass | DC2.5 | Card shadow layer 0 6px 6px rgba(52,55,70,0.06) present | visual | ar | 1440×1080 | true | true |  |
| pass | DC2.5 | Card shadow layer 0 6px 6px rgba(52,55,70,0.06) present | visual | en | 1440×1080 | true | true |  |
| pass | DC2.6 | PDF icon 40 × 40 | assets | ar | 1440×1080 | 40,40 | 40,40 |  |
| pass | DC2.6 | PDF icon 40 × 40 | assets | en | 1440×1080 | 40,40 | 40,40 |  |
| pass | DC2.7 | PDF icon 24px from the leading edge | layout | ar | 1440×1080 | 24 | 25 |  |
| pass | DC2.7 | PDF icon 24px from the leading edge | layout | en | 1440×1080 | 24 | 25 |  |
| pass | DC2.8 | PDF icon vertically centred (Figma top 26) | layout | ar | 1440×1080 | 26 | 27 |  |
| pass | DC2.8 | PDF icon vertically centred (Figma top 26) | layout | en | 1440×1080 | 26 | 27 |  |
| pass | DC2.9 | Title 14/20, colour content/base/primary | typography | ar | 1440×1080 | 14px/20px/rgb(38, 50, 56) | 14px/20px/rgb(38, 50, 56) |  |
| pass | DC2.9 | Title 14/20, colour content/base/primary | typography | en | 1440×1080 | 14px/20px/rgb(38, 50, 56) | 14px/20px/rgb(38, 50, 56) |  |
| pass | DC2.10 | Meta 13/20 | typography | ar | 1440×1080 | 13px/20px | 13px/20px |  |
| pass | DC2.10 | Meta 13/20 | typography | en | 1440×1080 | 13px/20px | 13px/20px |  |
| pass | DC2.12 | Card has the DOWNLOAD action (one control) | layout | ar | 1440×1080 | 1 | 1 |  |
| pass | DC2.12 | Card has the DOWNLOAD action (one control) | layout | en | 1440×1080 | 1 | 1 |  |
| pass | DC2.13 | Action 24px from the trailing edge (opposite end from the icon) | layout | ar | 1440×1080 | 24 | 25 |  |
| pass | DC2.13 | Action 24px from the trailing edge (opposite end from the icon) | layout | en | 1440×1080 | 24 | 25 |  |
| pass | DC2.14 | Action vertically centred on the card | layout | ar | 1440×1080 | 0 | 0 |  |
| pass | DC2.14 | Action vertically centred on the card | layout | en | 1440×1080 | 0 | 0 |  |
| pass | DC2.15 | Action height 16 (overline/sm/medium line-height) | typography | ar | 1440×1080 | 16 | 16 |  |
| pass | DC2.15 | Action height 16 (overline/sm/medium line-height) | typography | en | 1440×1080 | 16 | 16 |  |
| pass | DC2.16 | Action typography 13px, weight 500, uppercase | typography | ar | 1440×1080 | 13px/500/uppercase | 13px/500/uppercase |  |
| pass | DC2.16 | Action typography 13px, weight 500, uppercase | typography | en | 1440×1080 | 13px/500/uppercase | 13px/500/uppercase |  |
| pass | DC2.17 | Action letter-spacing 0 (site rule: Arabic is never tracked) | typography | ar | 1440×1080 | normal | normal |  |
| pass | DC2.17 | Action letter-spacing 1.5px (tracking-wider) | typography | en | 1440×1080 | 1.5px | 1.5px |  |
| pass | DC2.18 | Arrow icon present and rotated for RTL | assets | ar | 1440×1080 | true | true |  |
| pass | DC2.18 | Arrow icon present, pointing inline-end | assets | en | 1440×1080 | true | true |  |
| pass | DC3.1 | Gap between the two cards 16 (Figma 108 − 92) | layout | ar | 1440×1080 | 16 | 16 |  |
| pass | DC3.1 | Gap between the two cards 16 (Figma 108 − 92) | layout | en | 1440×1080 | 16 | 16 |  |
| pass | DG.0 | Self-compare (Figma vs itself) mismatch = 0 | visual | en | 1440×1080 | 0 | 0 |  |
| pass | DG.1 | Card stack ink bounding box (size within max(2px,5%), centre within 2px) | visual | en | 1440×1080 | match | match |  |
| pass | DG.2 | Cards stacked with the Figma gap (second card top − first card bottom = 16) | layout | en | 1440×1080 | 16 | 16 |  |
| pass | DR.1 | No horizontal overflow | responsive | ar | 390×844 | true | true |  |
| pass | DR.1 | No horizontal overflow | responsive | ar | 768×1024 | true | true |  |
| pass | DR.1 | No horizontal overflow | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.1 | No horizontal overflow | responsive | en | 390×844 | true | true |  |
| pass | DR.1 | No horizontal overflow | responsive | en | 768×1024 | true | true |  |
| pass | DR.1 | No horizontal overflow | responsive | en | 1440×1080 | true | true |  |
| pass | DR.2.1 | Card 1 inside the viewport | responsive | ar | 390×844 | true | true |  |
| pass | DR.2.1 | Card 1 inside the viewport | responsive | ar | 768×1024 | true | true |  |
| pass | DR.2.1 | Card 1 inside the viewport | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.2.1 | Card 1 inside the viewport | responsive | en | 390×844 | true | true |  |
| pass | DR.2.1 | Card 1 inside the viewport | responsive | en | 768×1024 | true | true |  |
| pass | DR.2.1 | Card 1 inside the viewport | responsive | en | 1440×1080 | true | true |  |
| pass | DR.2.2 | Card 2 inside the viewport | responsive | ar | 390×844 | true | true |  |
| pass | DR.2.2 | Card 2 inside the viewport | responsive | ar | 768×1024 | true | true |  |
| pass | DR.2.2 | Card 2 inside the viewport | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.2.2 | Card 2 inside the viewport | responsive | en | 390×844 | true | true |  |
| pass | DR.2.2 | Card 2 inside the viewport | responsive | en | 768×1024 | true | true |  |
| pass | DR.2.2 | Card 2 inside the viewport | responsive | en | 1440×1080 | true | true |  |
| pass | DR.3.1 | Card 1 action fully inside its card | responsive | ar | 390×844 | true | true |  |
| pass | DR.3.1 | Card 1 action fully inside its card | responsive | ar | 768×1024 | true | true |  |
| pass | DR.3.1 | Card 1 action fully inside its card | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.3.1 | Card 1 action fully inside its card | responsive | en | 390×844 | true | true |  |
| pass | DR.3.1 | Card 1 action fully inside its card | responsive | en | 768×1024 | true | true |  |
| pass | DR.3.1 | Card 1 action fully inside its card | responsive | en | 1440×1080 | true | true |  |
| pass | DR.3.2 | Card 2 action fully inside its card | responsive | ar | 390×844 | true | true |  |
| pass | DR.3.2 | Card 2 action fully inside its card | responsive | ar | 768×1024 | true | true |  |
| pass | DR.3.2 | Card 2 action fully inside its card | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.3.2 | Card 2 action fully inside its card | responsive | en | 390×844 | true | true |  |
| pass | DR.3.2 | Card 2 action fully inside its card | responsive | en | 768×1024 | true | true |  |
| pass | DR.3.2 | Card 2 action fully inside its card | responsive | en | 1440×1080 | true | true |  |
| pass | DR.4.1 | Card 1 action does not overlap the title or size text | responsive | ar | 390×844 | false | false |  |
| pass | DR.4.1 | Card 1 action does not overlap the title or size text | responsive | ar | 768×1024 | false | false |  |
| pass | DR.4.1 | Card 1 action does not overlap the title or size text | responsive | ar | 1440×1080 | false | false |  |
| pass | DR.4.1 | Card 1 action does not overlap the title or size text | responsive | en | 390×844 | false | false |  |
| pass | DR.4.1 | Card 1 action does not overlap the title or size text | responsive | en | 768×1024 | false | false |  |
| pass | DR.4.1 | Card 1 action does not overlap the title or size text | responsive | en | 1440×1080 | false | false |  |
| pass | DR.4.2 | Card 2 action does not overlap the title or size text | responsive | ar | 390×844 | false | false |  |
| pass | DR.4.2 | Card 2 action does not overlap the title or size text | responsive | ar | 768×1024 | false | false |  |
| pass | DR.4.2 | Card 2 action does not overlap the title or size text | responsive | ar | 1440×1080 | false | false |  |
| pass | DR.4.2 | Card 2 action does not overlap the title or size text | responsive | en | 390×844 | false | false |  |
| pass | DR.4.2 | Card 2 action does not overlap the title or size text | responsive | en | 768×1024 | false | false |  |
| pass | DR.4.2 | Card 2 action does not overlap the title or size text | responsive | en | 1440×1080 | false | false |  |
| pass | DR.5.1 | Card 1 action at the trailing end (RTL-aware) | rtl | ar | 390×844 | true | true |  |
| pass | DR.5.1 | Card 1 action at the trailing end (RTL-aware) | rtl | ar | 768×1024 | true | true |  |
| pass | DR.5.1 | Card 1 action at the trailing end (RTL-aware) | rtl | ar | 1440×1080 | true | true |  |
| pass | DR.5.1 | Card 1 action at the trailing end (RTL-aware) | rtl | en | 390×844 | true | true |  |
| pass | DR.5.1 | Card 1 action at the trailing end (RTL-aware) | rtl | en | 768×1024 | true | true |  |
| pass | DR.5.1 | Card 1 action at the trailing end (RTL-aware) | rtl | en | 1440×1080 | true | true |  |
| pass | DR.5.2 | Card 2 action at the trailing end (RTL-aware) | rtl | ar | 390×844 | true | true |  |
| pass | DR.5.2 | Card 2 action at the trailing end (RTL-aware) | rtl | ar | 768×1024 | true | true |  |
| pass | DR.5.2 | Card 2 action at the trailing end (RTL-aware) | rtl | ar | 1440×1080 | true | true |  |
| pass | DR.5.2 | Card 2 action at the trailing end (RTL-aware) | rtl | en | 390×844 | true | true |  |
| pass | DR.5.2 | Card 2 action at the trailing end (RTL-aware) | rtl | en | 768×1024 | true | true |  |
| pass | DR.5.2 | Card 2 action at the trailing end (RTL-aware) | rtl | en | 1440×1080 | true | true |  |
| pass | DR.6.1 | Card 1 title and size text not clipped by the card | responsive | ar | 390×844 | true | true |  |
| pass | DR.6.1 | Card 1 title and size text not clipped by the card | responsive | ar | 768×1024 | true | true |  |
| pass | DR.6.1 | Card 1 title and size text not clipped by the card | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.6.1 | Card 1 title and size text not clipped by the card | responsive | en | 390×844 | true | true |  |
| pass | DR.6.1 | Card 1 title and size text not clipped by the card | responsive | en | 768×1024 | true | true |  |
| pass | DR.6.1 | Card 1 title and size text not clipped by the card | responsive | en | 1440×1080 | true | true |  |
| pass | DR.6.2 | Card 2 title and size text not clipped by the card | responsive | ar | 390×844 | true | true |  |
| pass | DR.6.2 | Card 2 title and size text not clipped by the card | responsive | ar | 768×1024 | true | true |  |
| pass | DR.6.2 | Card 2 title and size text not clipped by the card | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.6.2 | Card 2 title and size text not clipped by the card | responsive | en | 390×844 | true | true |  |
| pass | DR.6.2 | Card 2 title and size text not clipped by the card | responsive | en | 768×1024 | true | true |  |
| pass | DR.6.2 | Card 2 title and size text not clipped by the card | responsive | en | 1440×1080 | true | true |  |
| pass | DR.7 | Closing band section has no background of its own | colour | ar | 390×844 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DR.7 | Closing band section has no background of its own | colour | ar | 768×1024 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DR.7 | Closing band section has no background of its own | colour | ar | 1440×1080 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DR.7 | Closing band section has no background of its own | colour | en | 390×844 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DR.7 | Closing band section has no background of its own | colour | en | 768×1024 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DR.7 | Closing band section has no background of its own | colour | en | 1440×1080 | rgba(0, 0, 0, 0) | rgba(0, 0, 0, 0) |  |
| pass | DR.8 | Both CTA buttons visible and inside the viewport | responsive | ar | 390×844 | true | true |  |
| pass | DR.8 | Both CTA buttons visible and inside the viewport | responsive | ar | 768×1024 | true | true |  |
| pass | DR.8 | Both CTA buttons visible and inside the viewport | responsive | ar | 1440×1080 | true | true |  |
| pass | DR.8 | Both CTA buttons visible and inside the viewport | responsive | en | 390×844 | true | true |  |
| pass | DR.8 | Both CTA buttons visible and inside the viewport | responsive | en | 768×1024 | true | true |  |
| pass | DR.8 | Both CTA buttons visible and inside the viewport | responsive | en | 1440×1080 | true | true |  |
| pass | DR.9 | Document direction | rtl | ar | 390×844 | rtl | rtl |  |
| pass | DR.9 | Document direction | rtl | ar | 768×1024 | rtl | rtl |  |
| pass | DR.9 | Document direction | rtl | ar | 1440×1080 | rtl | rtl |  |
| pass | DR.9 | Document direction | rtl | en | 390×844 | ltr | ltr |  |
| pass | DR.9 | Document direction | rtl | en | 768×1024 | ltr | ltr |  |
| pass | DR.9 | Document direction | rtl | en | 1440×1080 | ltr | ltr |  |
| pass | DU1.1 | Unavailable action is a disabled button (no link, no download target) | assets | ar | 1440×1080 | BUTTON\|true\|null | BUTTON\|true\|null |  |
| pass | DU1.1 | Unavailable action is a disabled button (no link, no download target) | assets | en | 1440×1080 | BUTTON\|true\|null | BUTTON\|true\|null |  |
| pass | DU1.2 | Unavailable action is not reachable by keyboard | assets | ar | 1440×1080 | false | false |  |
| pass | DU1.2 | Unavailable action is not reachable by keyboard | assets | en | 1440×1080 | false | false |  |
| pass | DU1.3 | Unavailable action is not brand blue (does not look like a working download) | colour | ar | 1440×1080 | true | true |  |
| pass | DU1.3 | Unavailable action is not brand blue (does not look like a working download) | colour | en | 1440×1080 | true | true |  |
| pass | DU1.4 | Card is not a link (no anchor, no '#' target) | assets | ar | 1440×1080 | 0 | 0 |  |
| pass | DU1.4 | Card is not a link (no anchor, no '#' target) | assets | en | 1440×1080 | 0 | 0 |  |
| pass | DU2.1 | Unavailable action is a disabled button (no link, no download target) | assets | ar | 1440×1080 | BUTTON\|true\|null | BUTTON\|true\|null |  |
| pass | DU2.1 | Unavailable action is a disabled button (no link, no download target) | assets | en | 1440×1080 | BUTTON\|true\|null | BUTTON\|true\|null |  |
| pass | DU2.2 | Unavailable action is not reachable by keyboard | assets | ar | 1440×1080 | false | false |  |
| pass | DU2.2 | Unavailable action is not reachable by keyboard | assets | en | 1440×1080 | false | false |  |
| pass | DU2.3 | Unavailable action is not brand blue (does not look like a working download) | colour | ar | 1440×1080 | true | true |  |
| pass | DU2.3 | Unavailable action is not brand blue (does not look like a working download) | colour | en | 1440×1080 | true | true |  |
| pass | DU2.4 | Card is not a link (no anchor, no '#' target) | assets | ar | 1440×1080 | 0 | 0 |  |
| pass | DU2.4 | Card is not a link (no anchor, no '#' target) | assets | en | 1440×1080 | 0 | 0 |  |
