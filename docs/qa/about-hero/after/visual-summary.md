# Visual QA summary

fail: 0 · designer-decision: 0 · reference-unavailable: 4 · advisory: 3 · approved-exception: 0 · pass: 74

| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |
|---|---|---|---|---|---|---|---|---|
| reference-unavailable | AHR.5 | Figma frame at this width | responsive | ar | 390×844 | no Figma frame | — | Only 1440 frames exist; scale/floor choice is a designer-confirmation item. |
| reference-unavailable | AHR.5 | Figma frame at this width | responsive | ar | 768×1024 | no Figma frame | — | Only 1440 frames exist; scale/floor choice is a designer-confirmation item. |
| reference-unavailable | AHR.5 | Figma frame at this width | responsive | en | 390×844 | no Figma frame | — | Only 1440 frames exist; scale/floor choice is a designer-confirmation item. |
| reference-unavailable | AHR.5 | Figma frame at this width | responsive | en | 768×1024 | no Figma frame | — | Only 1440 frames exist; scale/floor choice is a designer-confirmation item. |
| advisory | AHB.2.Glow area | Pixel mismatch — Glow area | visual | en | 1440×1080 | — | 5.34% | Evidence only: video frame and anti-aliasing differ; verdicts come from the constraints below. |
| advisory | AHB.2.Hero | Pixel mismatch — Hero | visual | en | 1440×1080 | — | 1.43% | Evidence only: video frame and anti-aliasing differ; verdicts come from the constraints below. |
| advisory | AHB.2.Skyline band | Pixel mismatch — Skyline band | visual | en | 1440×1080 | — | 0.03% | Evidence only: video frame and anti-aliasing differ; verdicts come from the constraints below. |
| pass | AH0.1 | Hero height (Figma 755) | layout | ar | 1440×1080 | 755 | 755 |  |
| pass | AH0.1 | Hero height (Figma 755) | layout | en | 1440×1080 | 755 | 755 |  |
| pass | AH0.2 | Hero background #0d161b | colour | ar | 1440×1080 | rgb(13, 22, 27) | rgb(13, 22, 27) |  |
| pass | AH0.2 | Hero background #0d161b | colour | en | 1440×1080 | rgb(13, 22, 27) | rgb(13, 22, 27) |  |
| pass | AH1.1 | Video opacity (Figma: 100% before the overlay) | visual | ar | 1440×1080 | 1 | 1 |  |
| pass | AH1.1 | Video opacity (Figma: 100% before the overlay) | visual | en | 1440×1080 | 1 | 1 |  |
| pass | AH1.2 | Video-BG box x/y/w/h (406:3445) | layout | ar | 1440×1080 | -6,-115,1453,817 | -6,-115,1453,817 |  |
| pass | AH1.2 | Video-BG box x/y/w/h (406:3445) | layout | en | 1440×1080 | -6,-115,1453,817 | -6,-115,1453,817 |  |
| pass | AH1.3 | Video object-fit cover | visual | ar | 1440×1080 | cover | cover |  |
| pass | AH1.3 | Video object-fit cover | visual | en | 1440×1080 | cover | cover |  |
| pass | AH2.1 | Exactly one tinted layer over the video | visual | ar | 1440×1080 | 1 | 1 |  |
| pass | AH2.1 | Exactly one tinted layer over the video | visual | en | 1440×1080 | 1 | 1 |  |
| pass | AH2.2 | Overlay colour rgba(13,22,27,0.9) | colour | ar | 1440×1080 | rgba(13, 22, 27, 0.9) | rgba(13, 22, 27, 0.9) |  |
| pass | AH2.2 | Overlay colour rgba(13,22,27,0.9) | colour | en | 1440×1080 | rgba(13, 22, 27, 0.9) | rgba(13, 22, 27, 0.9) |  |
| pass | AH2.3 | Overlay blend mode (Figma: color-burn) | visual | ar | 1440×1080 | color-burn | color-burn |  |
| pass | AH2.3 | Overlay blend mode (Figma: color-burn) | visual | en | 1440×1080 | color-burn | color-burn |  |
| pass | AH3 | No full-Hero linear-gradient layer (absent in Figma) | visual | ar | 1440×1080 | [] | [] |  |
| pass | AH3 | No full-Hero linear-gradient layer (absent in Figma) | visual | en | 1440×1080 | [] | [] |  |
| pass | AH4.1 | Glow diameter (406:3446 = 618) | layout | ar | 1440×1080 | 618 | 618 |  |
| pass | AH4.1 | Glow diameter (406:3446 = 618) | layout | en | 1440×1080 | 618 | 618 |  |
| pass | AH4.2 | Glow top / centre-x | layout | ar | 1440×1080 | -103\|720 | -103\|720 |  |
| pass | AH4.2 | Glow top / centre-x | layout | en | 1440×1080 | -103\|720 | -103\|720 |  |
| pass | AH4.3 | Glow blur (12px) | visual | ar | 1440×1080 | blur(12px) | blur(12px) |  |
| pass | AH4.3 | Glow blur (12px) | visual | en | 1440×1080 | blur(12px) | blur(12px) |  |
| pass | AH4.4 | Glow colour rgba(28,151,212,0.3) → transparent (brand blue) | colour | ar | 1440×1080 | true | true |  |
| pass | AH4.4 | Glow colour rgba(28,151,212,0.3) → transparent (brand blue) | colour | en | 1440×1080 | true | true |  |
| pass | AH4.5 | Glow gradient fades out at 68% of the 437px Figma radius (≈297px) | visual | ar | 1440×1080 | true | true |  |
| pass | AH4.5 | Glow gradient fades out at 68% of the 437px Figma radius (≈297px) | visual | en | 1440×1080 | true | true |  |
| pass | AH5.1 | Skyline mask box x/y/w/h (406:3452) | layout | ar | 1440×1080 | -9,123,1447.5,692.5 | -9,123,1447.5,692.5 |  |
| pass | AH5.1 | Skyline mask box x/y/w/h (406:3452) | layout | en | 1440×1080 | -9,123,1447.5,692.5 | -9,123,1447.5,692.5 |  |
| pass | AH5.2 | Skyline extends below the Hero boundary (no inner cut) | layout | ar | 1440×1080 | true | true |  |
| pass | AH5.2 | Skyline extends below the Hero boundary (no inner cut) | layout | en | 1440×1080 | true | true |  |
| pass | AH5.3 | Hero clips the skyline (overflow hidden) | layout | ar | 1440×1080 | hidden | hidden |  |
| pass | AH5.3 | Hero clips the skyline (overflow hidden) | layout | en | 1440×1080 | hidden | hidden |  |
| pass | AHB.0 | Self-compare (reference vs itself) mismatch = 0 | visual | en | 1440×1080 | 0 | 0 |  |
| pass | AHB.1 | Capture size equals Figma frame | visual | en | 1440×1080 | 1440×755 | 1440×755 |  |
| pass | AHB.3 | Skyline ink bounding box (size within max(2px,5%), centre within 2px) | visual | en | 1440×1080 | match | match |  |
| pass | AHB.4 | Skyline visible area vs Figma (226205 / 226633 px) | visual | en | 1440×1080 | true | true |  |
| pass | AHB.5 | Bottom edge fully covered by the skyline photo (ink width) | visual | en | 1440×1080 | true | true |  |
| pass | AHM.1 | Reduced motion: video paused, currentTime 0 | motion | en | 1440×1080 | true@0 | true@0 |  |
| pass | AHM.2 | In view: video plays | motion | en | 1440×1080 | true | true |  |
| pass | AHM.3 | Off-screen: video paused | motion | en | 1440×1080 | true | true |  |
| pass | AHM.4 | Back in view: video resumes | motion | en | 1440×1080 | false | false |  |
| pass | AHM.5 | muted + loop + playsInline + aria-hidden ancestor | motion | en | 1440×1080 | {"muted":true,"loop":true,"inline":true,"hidden":true} | {"muted":true,"loop":true,"inline":true,"hidden":true} |  |
| pass | AHR.1 | No horizontal overflow | responsive | ar | 390×844 | true | true |  |
| pass | AHR.1 | No horizontal overflow | responsive | ar | 768×1024 | true | true |  |
| pass | AHR.1 | No horizontal overflow | responsive | ar | 1440×1080 | true | true |  |
| pass | AHR.1 | No horizontal overflow | responsive | en | 390×844 | true | true |  |
| pass | AHR.1 | No horizontal overflow | responsive | en | 768×1024 | true | true |  |
| pass | AHR.1 | No horizontal overflow | responsive | en | 1440×1080 | true | true |  |
| pass | AHR.2 | Glow centred on the Hero (RTL-neutral) | rtl | ar | 390×844 | true | true |  |
| pass | AHR.2 | Glow centred on the Hero (RTL-neutral) | rtl | ar | 768×1024 | true | true |  |
| pass | AHR.2 | Glow centred on the Hero (RTL-neutral) | rtl | ar | 1440×1080 | true | true |  |
| pass | AHR.2 | Glow centred on the Hero (RTL-neutral) | rtl | en | 390×844 | true | true |  |
| pass | AHR.2 | Glow centred on the Hero (RTL-neutral) | rtl | en | 768×1024 | true | true |  |
| pass | AHR.2 | Glow centred on the Hero (RTL-neutral) | rtl | en | 1440×1080 | true | true |  |
| pass | AHR.3 | Skyline reaches and passes the Hero bottom edge | layout | ar | 390×844 | true | true |  |
| pass | AHR.3 | Skyline reaches and passes the Hero bottom edge | layout | ar | 768×1024 | true | true |  |
| pass | AHR.3 | Skyline reaches and passes the Hero bottom edge | layout | ar | 1440×1080 | true | true |  |
| pass | AHR.3 | Skyline reaches and passes the Hero bottom edge | layout | en | 390×844 | true | true |  |
| pass | AHR.3 | Skyline reaches and passes the Hero bottom edge | layout | en | 768×1024 | true | true |  |
| pass | AHR.3 | Skyline reaches and passes the Hero bottom edge | layout | en | 1440×1080 | true | true |  |
| pass | AHR.4 | Skyline spans the full Hero width | layout | ar | 390×844 | true | true |  |
| pass | AHR.4 | Skyline spans the full Hero width | layout | ar | 768×1024 | true | true |  |
| pass | AHR.4 | Skyline spans the full Hero width | layout | ar | 1440×1080 | true | true |  |
| pass | AHR.4 | Skyline spans the full Hero width | layout | en | 390×844 | true | true |  |
| pass | AHR.4 | Skyline spans the full Hero width | layout | en | 768×1024 | true | true |  |
| pass | AHR.4 | Skyline spans the full Hero width | layout | en | 1440×1080 | true | true |  |
| pass | AHR.6 | Document direction | rtl | ar | 390×844 | rtl | rtl |  |
| pass | AHR.6 | Document direction | rtl | ar | 768×1024 | rtl | rtl |  |
| pass | AHR.6 | Document direction | rtl | ar | 1440×1080 | rtl | rtl |  |
| pass | AHR.6 | Document direction | rtl | en | 390×844 | ltr | ltr |  |
| pass | AHR.6 | Document direction | rtl | en | 768×1024 | ltr | ltr |  |
| pass | AHR.6 | Document direction | rtl | en | 1440×1080 | ltr | ltr |  |
