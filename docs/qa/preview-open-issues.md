# Preview QA — Open Issues

Tracker for issues found during Frontend Preview QA that are not yet resolved.
Resolved issues are removed from this file (history lives in Git).

**Branch:** `feature/home-2-redesign`
**Last updated:** 2026-11-03

## Summary

| ID | Page | Title | Priority | Status |
| --- | --- | --- | --- | --- |
| [PQA-001](#pqa-001--talent-network-cta-pending-destination) | Careers | Talent Network CTA — pending destination | Medium | BLOCKED — Awaiting decision |
| [PQA-002](#pqa-002--careers-arabic-copy-pending-review) | Careers | Arabic copy — pending review | Medium | PENDING CONTENT REVIEW |
| [PQA-004](#pqa-004--industries-badge--arabic-translation-pending) | Industries | Badge — Arabic translation pending | Low | PENDING CONTENT REVIEW |
| [PQA-005](#pqa-005--about--who-we-are--arabic-copy-mismatch) | About | Who We Are — Arabic copy mismatch | Medium | PENDING CONTENT REVIEW |
| [PQA-006](#pqa-006--about--built-on-trust--arabic-eyebrow-mismatch) | About / Built on Trust | Arabic eyebrow — mismatch with English | Medium | PENDING CONTENT REVIEW |
| [PQA-011](#pqa-011--home--what-changes--alternative-toggle-design-open-design-and-content-questions) | Home | What changes — alternative toggle design: open design/content questions | Medium | PENDING DESIGN / CONTENT REVIEW |
| [PQA-012](#pqa-012--about--scale-and-credentials--lorem-ipsum-placeholder) | About | Scale and credentials — Lorem Ipsum placeholder (EN and AR) | High | OPEN — Production blocker, content missing |
| [PQA-013](#pqa-013--solutions--partner-cta--arabic-secondary-label-placeholder) | Solutions | Partner CTA — Arabic secondary label is English | Low | PENDING CONTENT REVIEW |
| [PQA-014](#pqa-014--contact--company-profile-link-blocked-by-missing-pdf) | Contact | Company profile link — blocked by missing PDF | Medium | BLOCKED — Awaiting asset |
| [PQA-015](#pqa-015--solutions--technology-services-arabic-subtitle-pending) | Solutions | Technology Services — Arabic subtitle pending | Low | PENDING CONTENT REVIEW |
| [PQA-016](#pqa-016--home--client-logos-arabic-title-and-mislabeled-asset) | Home | Client logos — Arabic title pending; mislabeled `paew.svg` | Medium | PENDING CONTENT REVIEW / NEEDS ASSET CONFIRMATION |
| [PQA-017](#pqa-017--blog--article--content-and-cms-dependencies-from-qa-batch-3a) | Blog / Article | Content and CMS dependencies from QA batch 3A | Medium | PENDING CONTENT / CMS / DESIGN |
| [PQA-019](#pqa-019--unconfirmed-content-differences-from-the-figma-vs-website-qa-report) | Home / About / Industries / Contact | Unconfirmed content differences from the Figma vs Website QA report | Medium | PENDING CONTENT / DESIGN DECISION |
| [PQA-020](#pqa-020--brand-typeface-avenir-not-bundled-pending-web-licence-and-files) | All pages | Brand typeface Avenir — implemented, pending Designer confirmation and licence record | Medium | IMPLEMENTED — Awaiting Designer confirmation / licence record |
| [PQA-022](#pqa-022--home-industries--designer-conformity-follow-ups) | Home | Industries — Designer conformity follow-ups | Low | IMPLEMENTED — Awaiting Designer decisions |
| [PQA-023](#pqa-023--industries--case-studies--insights--page-qa-follow-ups-batch-6c6d) | Industries / Case Studies / Insights | Page QA follow-ups (Batch 6C/6D) | Medium | IMPLEMENTED (local) — Awaiting review / Designer decisions |
| [PQA-024](#pqa-024--home--partners--description-reuses-the-industries-copy) | Home | Partners — description reuses the Industries copy | Low | PARTIALLY RESOLVED — English done; Arabic pending approved translation |
| [PQA-025](#pqa-025--home--industries--arabic-heading-typography-decisions) | Home / Industries (AR) | Arabic heading line-height and weights | Low | IMPLEMENTED (provisional) — Awaiting Designer decision |
| [PQA-026](#pqa-026--case-studies--designer-fix-8-follow-ups) | Case Studies | Designer Fix #8 — design decisions and counter screen-reader gap | Low | IMPLEMENTED — Awaiting Designer decisions |
| [PQA-021](#pqa-021--unknown-localized-routes-return-http-200-soft-404) | All pages | Unknown localized routes return HTTP 200 (soft 404) | Medium | DEFERRED — Pending release decision |

## Issue template

Copy this block for new issues.

```markdown
### PQA-NNN — Title

- **Page:** route or component
- **Priority:** High | Medium | Low
- **Status:** OPEN | BLOCKED | PENDING CONTENT REVIEW
- **Description:** what is wrong, and where
- **Dependency:** who or what must decide or deliver before work can finish
- **Acceptance criteria:**
  - [ ] verifiable outcome
```

---

### PQA-001 — Talent Network CTA — pending destination

- **Page:** Careers (`/careers`) — "Ready for your next role?" CTA in `components/sections/careers/learn.tsx`
- **Priority:** Medium
- **Status:** BLOCKED — Awaiting decision
- **Description:** The "Join Our Talent Network" button is rendered disabled. No approved destination or integration exists, so it is deliberately not linked.
- **Dependency:** Destination confirmation from the designer/client.
- **Acceptance criteria:**
  - [ ] Destination (route, form or external link) is approved in writing.
  - [ ] Button is enabled and navigates to the approved destination only; no invented route or backend integration.
  - [ ] Works in English LTR and Arabic RTL.
  - [ ] `tests/e2e/careers/why-join-stack.spec.ts` is updated: the "disabled, not a link" assertion is replaced with the approved behaviour.

### PQA-002 — Careers Arabic copy — pending review

- **Page:** Careers (`/careers`) — "Why join" card 4 and the "Ready for your next role?" CTA
- **Priority:** Medium
- **Status:** PENDING CONTENT REVIEW
- **Description:** Arabic strings for card 4 and the new CTA (title, description, button labels) need native-speaker/client review. Current strings are in `locales/ar.json` under `CareersPage.learn`. The same review should cover the Preview-only form notices shown when no CMS endpoint is configured: `CareersPage.apply.form.unavailable` and `ContactPage.form.unavailable` (unreviewed draft Arabic; they never render once the endpoint is set).
- **Dependency:** Approved Arabic copy from a native speaker or the client.
- **Acceptance criteria:**
  - [ ] Existing translations stay unchanged until replacements are provided.
  - [ ] Approved copy is applied in `locales/ar.json` only.
  - [ ] Card heights, wrapping and CTA layout verified in RTL at 1440, 768 and 390px.

### PQA-004 — Industries badge — Arabic translation pending

- **Page:** Industries / Home V1 Industries section (`components/sections/home-1/industries.tsx`); Industries page "How does CX differ by industry?" (`components/sections/industries/differ.tsx`)
- **Priority:** Low
- **Status:** PENDING CONTENT REVIEW
- **Description:** The Industries-page badge (`IndustriesPage.differ.eyebrow`) reads "CX / Industries". The Home badge (`HomeV1.industries.eyebrow`) was changed back to "Industries" on 2026-11-01 to match Figma node 406:3983 and the Designer report (white fill, 1px #EEE border also applied). The Arabic badges are unchanged (`القطاعات`) because no approved Arabic copy exists; for Home it now reads as the same meaning as the English, to be confirmed.
- **Dependency:** Approved Arabic translation.
- **Acceptance criteria:**
  - [ ] English and Arabic convey the same approved meaning.
  - [ ] Only `HomeV1.industries.eyebrow` and `IndustriesPage.differ.eyebrow` change; unrelated Industries labels stay unchanged. (Home: done, English "Industries". Industries page: still "CX / Industries", pending a decision on whether it should match.)
  - [ ] Badge verified in RTL at 1440, 768 and 390px.

### PQA-005 — About / Who We Are — Arabic copy mismatch

- **Page:** About (`/about`) — Who we are, `components/sections/about/who-we-are.tsx`
- **Priority:** Medium
- **Status:** PENDING CONTENT REVIEW
- **Description:** The English heading and description now match Figma ("About Infoline, Journey and Commitment" plus the new "Since 2004…" paragraph). The Arabic copy still reflects the previous content (`AboutPage.whoWeAre` in `locales/ar.json`). `titleTail` is a single space in Arabic, only to satisfy locale parity; the component trims it and omits the segment.
- **Dependency:** Approved Arabic translation.
- **Acceptance criteria:**
  - [ ] Arabic heading and description convey the approved English meaning.
  - [ ] Arabic `titleTail` is updated appropriately (a real value, no placeholder space).
  - [ ] Only `AboutPage.whoWeAre` in `locales/ar.json` changes.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### PQA-006 — About / Built on Trust — Arabic eyebrow mismatch

- **Page:** About (`/about`) — Built on trust, `components/sections/about/accountability.tsx`
- **Priority:** Medium
- **Status:** PENDING CONTENT REVIEW
- **Description:** The English eyebrow now reads "Built on trust" (`AboutPage.accountability.eyebrow` in `locales/en.json`). The Arabic eyebrow still reads "مبنية على الثقة. مثبتة عبر العمليات" because no approved Arabic replacement exists.
- **Dependency:** Approved Arabic copy.
- **Acceptance criteria:**
  - [ ] Arabic eyebrow matches the approved meaning of "Built on trust".
  - [ ] Only `AboutPage.accountability.eyebrow` in `locales/ar.json` changes; unrelated section text stays unchanged.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### PQA-007 — About / Closing CTA — Arabic copy mismatch

- **Page:** About (`/about`) — Closing CTA, `components/sections/about/cta.tsx`
- **Priority:** Medium
- **Status:** PENDING CONTENT REVIEW
- **Description:** English now reads "Start with your current operation and the outcome you need." (description), "Talk to Our Team" (primary) and "Explore Our Capabilities" (secondary, `/solutions`). The Arabic description in `AboutPage.cta.description` is still the previous "We respond within 1 business day" meaning. The Arabic primary label reuses the already-approved "تحدّث مع فريقنا" from `SolutionsPage`. `AboutPage.cta.secondaryButton.label` in `locales/ar.json` is an English placeholder (no approved Arabic exists; "استكشف الحلول" means "Explore solutions").
- **Dependency:** Approved Arabic translations for the description and "Explore Our Capabilities". The English placeholder in `locales/ar.json` is a temporary stand-in for locale parity only and is NOT acceptable for final release; it must be replaced before launch.
- **Acceptance criteria:**
  - [ ] Arabic description and secondary label convey the approved English meaning.
  - [ ] Only `AboutPage.cta` in `locales/ar.json` changes.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### PQA-008 — Insights / Case Studies & Formats — Arabic copy mismatch

- **Page:** Insights (`/insights`) — Case studies (`components/sections/insights/proof.tsx`) and Formats (`components/sections/insights/formats.tsx`)
- **Priority:** Medium
- **Status:** PENDING CONTENT REVIEW
- **Description:** English now reads eyebrow "Case studies", heading "Three operations, three numbers that moved", the new "Real results from real partnerships…" description, and the Formats button "View all". Arabic eyebrow and heading reuse the already-approved `CaseStudiesPage.hero` copy ("دراسات الحالة", "ثلاث عمليات، ثلاثة أرقام تحرّكت"). `InsightsPage.proof.description` in `locales/ar.json` is an English placeholder (no approved Arabic exists). `InsightsPage.formats.allCta.label` still reads "تصفّح جميع المقالات" ("Browse all articles") rather than "View all".
- **Dependency:** Approved Arabic for the Case Studies description and for "View all". The English placeholder is a temporary stand-in for locale parity only and is NOT acceptable for final release.
- **Acceptance criteria:**
  - [ ] Arabic description and "View all" label convey the approved English meaning.
  - [ ] Only `InsightsPage.proof.description` and `InsightsPage.formats.allCta.label` in `locales/ar.json` change.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### PQA-009 — Insights / Formats article cards — remaining content gaps

- **Page:** Insights (`/insights`) — Formats cards, `components/sections/insights/formats.tsx`
- **Priority:** Medium
- **Status:** PARTIAL — layout, date, excerpt and Read more implemented; content dependencies remain
- **Description:** Cards now render category, localized date, two-line excerpt and a "Read more →" affordance (inside the single card link). CMS cards take date and excerpt from the existing `posts` query (no contract change; the card projection now keeps `date` and a 160-character plain-text excerpt). Remaining gaps:
  1. **Reading time (CMS):** WordPress returns no reading-time field and the list query carries no body, so CMS cards show none. Static fallback cards compute it from the locale post body (200 wpm); every static post is ~140–170 words, so they all read "1 min" (correct arithmetic, QA IN-01). Static article pages now show the same calculation in the hero (Batch 3B).
  2. **Static fallback content vs Figma:** the Figma sample shows "26 sep / 24 sep / 22 sep 2026", different excerpts, and titles for cards 2 and 3 that do not exist in the locale content. Static cards keep their own dates (17 Sep, 2 Aug, 10 Jun 2026) and excerpts from `Blog.posts`. The COPC card's excerpt there describes a utilities contact-centre story, which looks mismatched with its title. Root cause (QA IN-01 / AR-01): `Insights.items` titles the card "What a COPC audit actually measures…" while the `/blog/copc-audit` post in `Blog.posts` is titled "A score that had not moved in quarters…"; the excerpt comes from the post. Routing is correct; the two locale fixtures disagree. Pending a decision on which title is approved.
  3. **Static date data:** `Blog.posts` stores ISO dates in 2025 but display labels in 2026 (e.g. `2025-09-17` vs "17 Sep 2026"). Cards show the display label, as the Blog pages do; the source data needs a correction.
  4. **Label:** the action reuses the approved `Blog.page.readMore` ("Read more" / "اقرأ المزيد"); Figma shows "Read More".
- **Dependency:** Backend decision on a reading-time field (or approval to fetch post content for the cards); client-approved static card copy and dates; confirmation of the "Read More" capitalisation.
- **Acceptance criteria:**
  - [ ] CMS cards show reading time from an approved source, or the design drops it for CMS content.
  - [ ] Static card dates, excerpts and titles match the approved content (including the COPC excerpt).
  - [ ] `Blog.posts` ISO `date` and `dateLabel` agree for every post, in English and Arabic.
  - [ ] Action label matches Figma in English and Arabic.

### PQA-017 — Blog / Article — content and CMS dependencies from QA batch 3A

- **Page:** Blog (`/blog`) and article detail (`/blog/[slug]`, `/insights/[slug]`)
- **Priority:** Medium
- **Status:** PENDING CONTENT / CMS / DESIGN — not frontend defects
- **Description:** Preview has no CMS endpoint, so QA saw the static locale fallback. Findings (QA B-01, B-02, AR-02):
  1. **Featured article:** the static fallback features `Blog.posts[0]` (`copc-audit`, category Articles); its title reads like a case-study headline. Figma's featured article ("Why attrition starts on day one…") is not in the locale content. CMS path features the `isFeatured` article (else newest), filtered to `article` type.
  2. **Card count / Load more:** Load more already exists on the CMS path (page size 12, shown only when `hasNextPage`). The static fallback has 4 posts and no button. Figma's six cards need six or more CMS articles or a design-approved page size; no pagination is faked.
  3. **Author block:** no author field in the CMS contract and no author component; Figma's author is a placeholder.
  4. **Related section:** Figma title "Related articles" vs `Blog.page.single.moreLabel` "Keep reading" — pending design confirmation. Related count aligned to three in Batch 3B (static path shows up to three real posts).
- **Dependency:** Approved featured article and copy; CMS data (articles, featured flag); design/backend decision on the author block; confirmation of the related-section title.
- **Acceptance criteria:**
  - [ ] Featured article approved and present in CMS or locale content.
  - [ ] Blog card count and Load more verified against CMS data once connected.
  - [ ] Author block built only from real author data with approved design.
  - [ ] Related-section title confirmed.

### PQA-010 — Insights / Closing CTA — Arabic button labels missing

- **Page:** Insights (`/insights`) — Closing CTA, `components/sections/insights/cta.tsx`
- **Priority:** Medium
- **Status:** PENDING CONTENT REVIEW
- **Description:** English buttons now read "View Case Studies" (`/case-studies`) and "Discuss Your Operation" (`/contact`). `InsightsPage.cta.button.label` and `InsightsPage.cta.secondaryButton.label` in `locales/ar.json` are English placeholders (no approved Arabic exists); the previous Arabic primary label "تحدث إلى خبير" ("Talk to an expert") no longer matches. Heading and description are unchanged.
- **Dependency:** Approved Arabic for both labels. The placeholders are a temporary stand-in for locale parity only and are NOT acceptable for final release.
- **Acceptance criteria:**
  - [ ] Both Arabic labels convey the approved English meaning.
  - [ ] Only `InsightsPage.cta.button.label` and `InsightsPage.cta.secondaryButton.label` in `locales/ar.json` change.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### PQA-011 — Home / What changes — alternative toggle design: open design and content questions

- **Page:** Home (`/`) — `components/sections/home-1/what-changes-toggle*.tsx`, `what-changes-dial.tsx`; preview only via `?homeVariant=new` (opt-in: requires `ENABLE_HOME_VARIANT_PREVIEW=1`; always off on Vercel Production)
- **Priority:** Medium
- **Status:** PENDING DESIGN / CONTENT REVIEW
- **Description:** The alternative is the Figma Home-2 toggle design (nodes `448:1675` Without state and `448:1587` With state: tab toggle plus gauge, four pills per side). The brief expected three columns with a "Talk to an Expert" CTA; that matches the existing design, not these frames. Open points:
  1. **Heading copy (English confirmed):** the Figma frames show "Everything your operation needs." and "A full set of capabilities. One accountable partner. From frontline operations to the technology behind them." The user confirmed this copy is approved for the new variant (Issue #11). The variant now reads it from dedicated keys `HomeV1.whatChangesToggle.title` / `.description`; the eyebrow, tabs and pills still use `HomeV1.whatChanges`, whose original strings (and the original Home design) are unchanged. **Arabic:** `whatChangesToggle.title` reuses the approved What we do Arabic title ("كل ما تحتاجه عملياتك."). No approved Arabic exists for the new description (the What we do Arabic says "ثماني قدرات…", i.e. "Eight capabilities"), so `ar.json` `whatChangesToggle.description` is an English placeholder for locale parity only and is NOT acceptable for final release.
  2. **Business Impact / CTA:** the frames have no Business Impact column and no CTA. The four impact strings appear as the left-hand pills in the With state; no CTA is rendered.
  3. **Pill order:** in the With state Figma orders the pills 4, 2, 3, 1 on both sides; the build reproduces that order.
  4. **Motion:** Figma specifies no transition between states and no needle animation. The build swaps states instantly (colour transition on the tabs only, disabled for reduced motion). Confirm whether a needle/arc animation is wanted.
  5. **RTL:** pills and tabs mirror, but the gauge art is not mirrored (needle still sweeps left to right). Confirm whether the dial should flip for Arabic.
  6. **Dial arc:** the With-state blue arc approximates Figma's transformed conic gradient and blurred wedge; confirm against a pixel review.
- **Dependency:** Designer/PM confirmation of items 2, 4 and 5; approved Arabic description for item 1; approval before this variant is exposed on Production.
- **Acceptance criteria:**
  - [x] English heading and description confirmed by the user.
  - [ ] Approved Arabic description copy supplied (title reuses the approved What we do Arabic).
  - [ ] Decision on a CTA and a Business Impact treatment for the toggle design.
  - [ ] Decision on state-change and needle motion, and on mirroring the dial in RTL.
  - [ ] Verified at 1440, 768 and 390px, EN and AR, normal and reduced motion.

### PQA-012 — About / Scale and credentials — Lorem Ipsum placeholder

- **Page:** About (`/about`) — scale band, `components/sections/about/scale.tsx`
- **Priority:** High
- **Status:** OPEN — Production blocker; approved content missing
- **Description:** `AboutPage.scale.title` ("Lorem Ipsum") and `AboutPage.scale.description` ("Lorem ipsum dolor sit amet consectetur…") are placeholder text in both `locales/en.json` and `locales/ar.json` (lines 876-877), so it shows in English and Arabic. The component has no hardcoded copy; it only reads these keys. The text has been there since the original About build (`c94f152`). No approved English or Arabic copy exists in the repository, `docs/backend/content/` or `docs/backend/design-references/about/`. The Figma source frame has not been checked. The eyebrow and the six stats are real copy and unaffected.
- **Dependency:** Approved English heading and description from the client/designer, then approved Arabic. If neither arrives before release, a PM decision is needed on hiding the heading and description for that release.
- **Acceptance criteria:**
  - [ ] Approved English title and description replace the placeholders in `locales/en.json`.
  - [ ] Approved Arabic title and description replace them in `locales/ar.json`.
  - [ ] Only `AboutPage.scale.title` and `AboutPage.scale.description` change.
  - [ ] No "Lorem" remains in either locale file.
  - [ ] Verified in EN LTR and AR RTL at 1440, 768 and 390px.

### PQA-013 — Solutions / Partner CTA — Arabic secondary label placeholder

- **Page:** Solutions (`/solutions`) — partner CTA, `components/sections/solutions/partner-cta.tsx`
- **Priority:** Low
- **Status:** PENDING CONTENT REVIEW
- **Description:** `SolutionsPage.partner.secondaryCta.label` in `locales/ar.json` is the English "Partner with Infoline" (no approved Arabic exists). In Arabic, `SolutionsPage.partner.secondaryCta.show` is `false` while English has it `true`, so the button does not render in Arabic today and the placeholder is not visible. It would become visible if `show` is enabled.
- **Dependency:** Approved Arabic label, and confirmation of whether the secondary button should show in Arabic.
- **Acceptance criteria:**
  - [ ] Approved Arabic label replaces the English placeholder.
  - [ ] `show` is consistent between English and Arabic, or the difference is confirmed as intended.
  - [ ] Only `SolutionsPage.partner.secondaryCta` in `locales/ar.json` changes.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### PQA-014 — Contact — Company profile link blocked by missing PDF

- **Page:** Contact (`/contact`) — `components/sections/contact/route-cards.tsx`
- **Priority:** Medium
- **Status:** BLOCKED
- **Description:** Figma shows an "Or download the company profile" link. The copy exists (`ContactPage` `profileLink`) but no approved PDF or URL exists in the repo (About documents also use `#`), so the link was not restored.
- **Dependency:** Approved company profile PDF (EN, and AR if separate) and its download URL, shared with About documents.
- **Acceptance criteria:**
  - [ ] Link restored at the Figma position pointing to the real file.
  - [ ] Verified in EN LTR and AR RTL.

### PQA-015 — Solutions — Technology Services Arabic subtitle pending

- **Page:** Solutions (`/solutions`) — service 07 `family` in `locales/ar.json`
- **Priority:** Low
- **Status:** PENDING CONTENT REVIEW
- **Description:** English subtitle is now "Integrated Tech Solutions". Arabic still reads "التقنية والبيانات" (same as service 05); no approved Arabic exists.
- **Dependency:** Approved Arabic subtitle (suggested: حلول تقنية متكاملة).
- **Acceptance criteria:**
  - [ ] Arabic `family` for `technology-services` updated once approved.

### PQA-016 — Home — Client logos Arabic title and mislabeled asset

- **Page:** Home (`/`) — `components/sections/home-1/clients.tsx` (H-05) and `components/sections/home/partners.tsx` (H-04)
- **Priority:** Medium
- **Status:** PENDING CONTENT REVIEW / NEEDS ASSET CONFIRMATION (H-04 and H-05 are otherwise FIXED)
- **Description:** Both missing sections are now built from the Figma handoff. (1) `HomeV1.clients.title` in `locales/ar.json` was an English placeholder; it now holds a PROVISIONAL Arabic translation of "Trusted by Oman's ministries, authorities and national institutions" («وزارات سلطنة عُمان وهيئاتها ومؤسساتها الوطنية تثق بنا»), awaiting Designer approval; the Arabic eyebrow and description reuse the approved `Proof` strings. (2) `public/assets/clients/paew.svg` is actually the Social Insurance logo, not the Electricity & Water authority; other pages (Solutions, Industries, legacy home logos) still reference it under the Electricity & Water name. The Home section uses the Figma export `electricity-water.png` for PAEW and `paew.svg` for Social Insurance. The Home client row is static (single row from 1024px, wraps below) to match Figma; no approved Arabic was found elsewhere in the project. The partner logos and the Electricity & Water logo were exported from the Figma handoff as PNG, not vendor-supplied originals.
- **Dependency:** Approved Arabic title; confirmation of the `paew.svg` mislabel and its fix on other pages; vector originals of the logos if available. **Batch 4B deliberately left `paew.svg` unchanged; it stays open until an approved replacement asset is supplied.**
- **Acceptance criteria:**
  - [ ] `HomeV1.clients.title` in `locales/ar.json` confirmed or replaced by Designer-approved copy (provisional translation in place).
  - [ ] `paew.svg` renamed/replaced and other pages corrected.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### Other untranslated Arabic labels — tracked under existing issues

No new entries; each is already recorded: `AboutPage.cta.secondaryButton.label` (PQA-007), `InsightsPage.proof.description` (PQA-008), `InsightsPage.cta.button.label` and `.secondaryButton.label` (PQA-010), `HomeV1.whatChangesToggle.description` (PQA-011).

### PQA-022 — Home Industries — Designer conformity follow-ups

- **Page:** Home — Industries (`components/sections/home-1/industries.tsx`, `industry-cards.tsx`)
- **Priority:** Low
- **Status:** IMPLEMENTED — Awaiting Designer decisions
- **Description:** Batch 6B applied the Designer conformity report for Figma node 406:3983: heading 36/44 Avenir Heavy #263238 with tracking 0 (section-specific classes; shared `sectionTitle` untouched), eyebrow "Industries" on a white chip with a 1px #EEE border, card titles 20/24 at CSS 900 (Heavy), the six approved Figma SVG icons (`public/assets/home-1/industries/*.svg`, exported unmodified, 20px), no autoplay (static, first card open, click/tap or keyboard focus opens a card, no hover switching), and the 8px backdrop blur on the Hero stats band.
- **Dependency:** Designer answers to the open decisions below.
- **Open Designer decisions:**
  1. Keep or remove the visible "Explore sector" text and arrow on the open card (Figma shows icon, title and description only); it is unchanged for now.
  2. Figma sets the eyebrow label in Inter Medium with -0.72px tracking; the site uses Avenir Medium (see PQA-020 item 2).
  3. Figma wraps the heading onto two lines ("…start / here instead."); the site heading is one line at 1440px. Confirm the intended text-box width.
  4. Mobile and tablet use a vertical card stack because Figma has desktop only; confirm.
  5. Approved Arabic eyebrow (see PQA-004).
  6. Hero: Omantel badge and fifth statistic, and the Hero secondary items from the Designer report (accent #3EC1F0, button padding 24px, button shadow, glow blur 12px) are not applied in this batch.
- **Acceptance criteria:**
  - [x] Industries heading, eyebrow, card titles, icons and Hero blur match Figma (computed styles checked at 1440, 768 and 390px, EN and AR).
  - [x] No automatic rotation in either motion mode; keyboard focus and click open cards.
  - [ ] Designer decisions above recorded.

### PQA-023 — Industries / Case Studies / Insights — page QA follow-ups (Batch 6C/6D)

- **Page:** Industries (`components/sections/industries/*`), Case Studies (`components/sections/case-studies/*`), Insights (`components/sections/insights/*`). Figma frames: Industries 406:3027, Case Studies 406:4321, Insights 406:4761.
- **Priority:** Medium
- **Status:** IMPLEMENTED (local, uncommitted) — Awaiting review, preview deploy and Designer decisions
- **Description:** Batch 6C compared the three pages with Figma; Batch 6D fixed the confirmed items below. Measured on a local build at 1440/1280/1024/768/390px, EN and AR; no horizontal overflow, console or hydration errors.
  1. **Featured proof collision (6C F2), Insights:** below 1280px wide the image covered the metrics in both languages (overlap 160px at 1280 and 416px at 1024), and at 1440 the numbers touched it (gap 0; most visible in Arabic, where the screen edge faces them). Now side by side from 1280px only (stacked below, list then image). The list is at most 716px with a 40px logical gap before the image in both directions (Figma 406:4941: 716px list, 39px gap), and the image box takes the remaining width (min 380px; 484px at 1440) and crops the artwork without mirroring. After: gap 40px at 1280 and 1440, EN and AR.
  2. **Hero video and reduced motion (6C F3), Industries only:** the video had `autoPlay` and kept playing with reduced motion on. `hero-video.tsx` now starts playback only while motion is allowed, pauses when the preference changes to reduce and resumes when it changes back; reduced motion shows the first frame. Checked in the browser (EN and AR): initial state, live toggle both ways, no hydration error. About and Solutions hero videos are unchanged (same pattern, see decision 4).
  3. **Container inset (6C F1):** from 1280px (`xl:px-20`) content now sits at x=80 where Figma shows it: Industries hero, Differ card, sector cards, CTA, FAQ and clients; Case Studies chapters and CTA; every Insights section. 768 and 390px unchanged (24px); 1024–1279px unchanged (40px, the header uses 48px there). After at 1440: Case Studies chapter text 460–1355px (Figma 461–1356), Differ and Featured proof headings at 120px (Figma 121/120).
  4. **Industries FAQ question (6C F5):** 16/24 → 20/24, weight 600 (Avenir Heavy per PQA-020; Tajawal in Arabic), per Figma 406:3212. Accordion and icon alignment unchanged.
  5. **Card metadata at tablet width (6C F8), Insights Formats:** a wrapped line could start with a stranded `|` (EN 768: 3 of 3 cards, EN 1024 and 390: 1 card, AR 768: 3 of 3). A divider that wraps to the start of a line is now clipped; dividers between parts on one line are unchanged. After: no stranded divider at any width, EN or AR.
- **Dependency:** Designer answers below; review and a preview deployment of the uncommitted changes.
- **Open Designer decisions:**
  1. Ambiguous insets left at 40px: Case Studies hero (Figma x=44) and the Industries "Six sector groups" header (Figma x=44, with the sector cards at 80). Confirm whether they should align with the 80px content. **Update (final browser audit, 2026-11-03):** Designer Fix #7 (`1e2d277`) moved the Industries "Six sector groups" header (eyebrow, heading and description) to the 80px container together with the cards, so it now sits 36px inside Figma 406:3194 (x=44). Still open: confirm 80px (aligned with the cards) or revert to Figma's 44px.
  2. 1024–1279px inset (no Figma frame at that width): keep 40px or follow the header (48px)?
  3. Featured proof: the image is cropped (empty left margin first, then the screen edge), not mirrored in Arabic. Confirm the crop, or supply an Arabic or mirrored artwork.
  4. About and Solutions hero videos still autoplay under reduced motion; apply the Industries treatment to them?
  5. Deferred from 6C, not implemented: hero eyebrow and stat colour/weight (Figma #74C0E7 Medium / Heavy 32; site #4FC3F7 Regular / 700) on all three pages (F4; resolved on Case Studies by Designer Fix #8, see PQA-026); Industries section titles 40/44 vs Figma 36/44 (F6, see PQA-020 item 3); Industries hero copy sits 34px higher than Figma (F7). **Final browser audit (2026-11-03, Preview `opya12z39`):** F4 eyebrow is resolved on Industries by Designer Fix #7 (#74C0E7, weight 500). F6 still applies to the Differ, FAQ and Clients titles (40/44, 600); the Clients title "Named across the full catalogue." renders 614px wide where Figma 406:3334 renders about 557px (≈36px, heavier) — inferred from rendered widths, Figma type values not read directly. F7 re-measured against Figma 406:3167: eyebrow y 144 vs 178 and h1 y 180 vs 214 (34px higher); h1→description gap 24px vs 5px; hero CTA 188×56 with a 16px "Talk to an expert" label vs Figma 218×56 "Talk to an Expert". The sector list matches within 5px.
  6. Card stack exit (final browser audit, 2026-11-03): when the stack releases, the six stacked card shadows combine into a grey halo wider than the top card (Preview `opya12z39`, 1440px, EN and AR). Existing behaviour, not a regression; confirm it is acceptable or whether only the top card should cast the shadow.
- **Acceptance criteria:**
  - [x] Featured proof figures never overlap or touch the image (EN and AR, 1024–1440px).
  - [x] Industries hero video never plays under reduced motion and follows live preference changes.
  - [x] FAQ question 20/24 Heavy; metadata dividers never start a line.
  - [ ] Verified on a preview deployment.
  - [ ] Designer decisions above recorded.

### PQA-024 — Home / Partners — description reuses the Industries copy

- **Page:** Home — Partners (`components/sections/home/partners.tsx`, `Partners.description` in `locales/en.json` and `locales/ar.json`). Figma 406:4226 (text 406:4233).
- **Priority:** Low
- **Status:** PARTIALLY RESOLVED — English description updated; Arabic description pending approved translation
- **Description:** Designer review `docs/qa/designer-reviews/Infoline-02-Partners-Section.pdf` (page 3): the Partners description ("Each sector page names the operations we already run there, the regulatory constraints we work inside, and the client results we can put in front of an evaluation committee.") describes sector pages, not partners. The build matches Figma, so this is not a frontend defect; the copy must be rewritten in Figma first. The same review's two styling findings (heading weight 800 per `heading/2xl/bold`; description `#90A4AE` per `content/base/inverse-tertiary`) are fixed in the Partners component. Note: in Arabic the heading is now Tajawal 800 (ExtraBold) rather than 700; in English, CSS 700 and 800 both use Avenir Black, so the English face is unchanged.
- **Resolution (English):** `Partners.description` in `locales/en.json` now reads "Our technology partners bring the platforms, infrastructure and specialist expertise that support the services we deliver." The English heading was already the approved text.
- **Dependency:** Designer-approved Arabic Partners description. `locales/ar.json` still holds the old, now mismatched sector-page translation; it has not been edited or translated by engineering.
- **Acceptance criteria:**
  - [x] Approved English copy received and updated in `locales/en.json`.
  - [ ] Approved Arabic description received and updated in `locales/ar.json`.
  - [ ] Designer confirms the Arabic title (`Partners.title`) corresponds to the English heading.
  - [ ] Designer confirms the Arabic heading weight (Tajawal 800).

### PQA-019 — Unconfirmed content differences from the Figma vs Website QA report

- **Page:** About, Home, Industries, Contact (QA report `Infoline_Figma_vs_Website_MFethi.docx`)
- **Priority:** Medium
- **Status:** PENDING CONTENT / DESIGN DECISION — no code change until approved
- **Description:** Differences the QA report asks the team to confirm; none are frontend defects:
  1. **About, Board of Directors:** website names (Khalifa Al Abri, Salim Al Hinai, Hamad Al Rawahi, Saif Al Amri, Bassim Al Kindi) and `I1`–`I5.svg` images differ from Figma, which repeats a placeholder name. Approved names and photos needed.
  2. **Year:** About "Omanis promoted in 2024" vs Figma and Careers "2026".
  3. **Founding year:** About "since 2004" vs Home and Careers "since 2003".
  4. **Eight vs nine:** Home "What we do" says "Eight capabilities"; Solutions lists nine services.
  5. **Contact details:** intro banner `connect@infoline.om` / `+968 2446 2626` vs head-office card `contact@infoline.om` / `+968 2416 2626`; Figma shows `.com`. Tel and Fax share one number.
  6. **Industries clients title:** English updated (Designer Fix #7) to the approved "Named across the full catalogue." Arabic (`IndustriesPage.clients.title`) still reads "أسماء عبر جميع المجموعات الست" ("across all six groups") and no longer matches the English; it is left unchanged until approved Arabic wording is supplied. The Arabic Industries hero eyebrow was shortened to "القطاعات" to mirror the English "Industries".
  7. **Home:** stat label "Agents ready to help you" vs Figma "omani agents…" and the fifth 1,400+ stat; Vendors card wording; Home "What changes" heading (see PQA-011).
  8. **Minor:** About values-chip punctuation.
- **Dependency:** Client/designer decisions. Several look like Figma typos and should be confirmed with the designer.
- **Acceptance criteria:**
  - [ ] Each item above is approved or dismissed in writing.
  - [ ] Approved changes applied in `locales/en.json` and `locales/ar.json` only.

### PQA-020 — Brand typeface Avenir not bundled — pending web licence and files

- **Page:** Site-wide — `app/[locale]/layout.tsx`, `app/[locale]/globals.css` (`--font-latin`), `app/[locale]/fonts/`
- **Priority:** Medium
- **Status:** IMPLEMENTED — Awaiting Designer confirmation and licence record
- **Description:** English now uses Avenir from the supplied desktop TTFs, loaded with `next/font/local` with `preload: false` (four files, about 630 KB raw and about 280 KB transferred, served as TTF without conversion); Inter is removed. Arabic stays on Tajawal. The files' OS/2 weights are not in visual order (Black is marked 800 but is heavier than Heavy, marked 900), so each CSS weight is declared explicitly to follow the Figma styles, whose "semibold" text uses Heavy and "bold" text uses Black:
  - 400 Roman, 500 Medium, 600 Heavy, 700 and 800 Black, 900 Heavy (the Heavy file is declared twice, for 600 and 900).
  - Verified in Chromium (platform font per weight, and network requests): each weight renders the intended face with no system fallback and no synthetic bolding. The same text measures identically at 600 and 900, and at 700 and 800.
  - Before/after screenshots (EN and AR, 1440, 768 and 390px) show Avenir applied, no clipping or horizontal overflow, and some headings and chips now wrap differently because Avenir is narrower than Inter. This was a visual comparison, not a pixel-diff against Figma, and is not an approval.
- **Licensing:** the Project Manager confirmed on 2026-11-01 that Infoline holds the rights to use these files on the website. No licence document is in the repository, the TTFs carry an "embedding: preview and print" flag (`fsType 4`) and empty licence fields, and the copyright is Linotype GmbH (2007). Keep the written licence or proof of purchase with the project record.
- **Dependency:** Designer confirmation of the decisions below; the licence record; a production decision on file format and size.
- **Open Designer decisions:**
  1. 600 mapped to Heavy and 700 to Black for all site UI text (explicit in Figma for headings, inferred for small labels).
  2. The Figma eyebrow pill and some "Regular" subtitles still reference Inter in the file; the site now uses Avenir Medium and Roman for them.
  3. Site section-title scale and tracking (64px with negative tracking) against the Home-2 frame (36px, normal tracking), now that Avenir is in place. Home Industries now follows Figma (36/44, Heavy, tracking 0); the shared `sectionTitle` used by the other sections is unchanged and still needs a decision.
  4. ~~The Hero stats band: Figma has an 8px backdrop blur.~~ Done 2026-11-01 (`backdrop-blur-[8px]` on the band, gradient kept). **Follow-up (final browser audit, 2026-11-03):** the gradient fades correctly, but the blur stops at a hard horizontal edge at the band's top (y=536 at 1440px, EN and AR), where Figma 406:3782 dissolves into the photo (Hero PDF item 7). Not fixed; Designer to confirm whether the blur should be masked to fade in.
- **Font loading:** with preload off, English requests the four faces from the stylesheet (they start about 0.6 s later than with preload on and finish about 0.6 s later on a throttled connection, with no change in first contentful paint and no layout shift), and Arabic pages request no Avenir files (about 280 KB saved and first paint about 1.5 s faster on the same throttled test). WOFF2 versions of the same licensed files would shrink the English download further; that remains a production decision.
- **Acceptance criteria:**
  - [x] Four Avenir faces loaded locally and applied to English; Tajawal unchanged for Arabic.
  - [x] CSS weights 400, 500, 600, 700, 800 and 900 verified to render the mapped faces.
  - [ ] Designer confirms the weight mapping and the open items above.
  - [ ] Licence document or proof of purchase recorded.
  - [ ] Decision on TTF versus WOFF2 for production (preload is already off, so Arabic pages do not fetch Avenir).

### PQA-025 — Home / Industries — Arabic heading typography decisions

- **Page:** Home (`/ar`) and Industries (`/ar/industries`) — `app/[locale]/globals.css` (`.home-headings`, `.industries-headings`), `components/sections/home-1/what-changes.tsx`. Designer review `Infoline-05-Arabic-Build-Review.pdf`.
- **Priority:** Low
- **Status:** IMPLEMENTED (provisional) — Awaiting Designer decision
- **Description:** Arabic Home h1/h2 headings now use a unitless line-height of 1.32 in RTL (about 72→95, 64→84.5, 56→74, 36→47.5px); the 22–24px what-changes card headings use the same ratio. English and body typography are unchanged. Tajawal loads 400/500/700/800 only, so heading weights 600 and 900 already render as 700 and 800; weights were deliberately not changed.
- **Industries (final browser audit follow-up, 2026-11-03):** the same provisional 1.32 rule now also applies to Arabic Industries h1/h2 (the Medium audit finding: the 3-line "كيف تختلف تجربة العميل حسب القطاع؟" at 40/44 was visibly cramped). At 1440px: h1 48/56 (1.17) → 48/63.4; section h2s 40/44 (1.10) → 40/52.8; "ست مجموعات قطاعية" 36/44 (1.22) → 36/47.5. At 768/390px the 32px h2s go 35.2 → 42.2 and the 40px h1 46.8 → 52.8. Sizes and weights unchanged; English unchanged at every width. Industries h3 are deliberately excluded (sector card titles 28/36 and the "Your sector" band 36/44, both single-line at the audited widths) so the 498px sticky card height and the card stack are unaffected.
- **Dependency:** Designer decision on the final Arabic type scale and one weight per heading level (including Industries at 900 and Partners at 800, see PQA-024), and whether to load Tajawal 600/900.
- **Acceptance criteria:**
  - [ ] Designer approves the 1.32 ratio or supplies per-size tokens.
  - [ ] Designer fixes one heading weight per level using loaded weights, or approves loading 600/900.

### PQA-026 — Case Studies — Designer Fix #8 follow-ups

- **Page:** Case Studies (`components/sections/case-studies/*`, `components/ui/motion/count-up.tsx`). Figma 406:4321; review `docs/qa/designer-reviews/Infoline-07-Case-Studies-Page.pdf`.
- **Priority:** Low
- **Status:** IMPLEMENTED — Awaiting Designer decisions
- **Description:** All four review findings are fixed: English weights (hero heading 800, eyebrow and "Headline movement" 500, hero and result figures 900, band heading 800), colours (eyebrow and stat figures #74C0E7, stat labels and hero sub-line #CFD8DC, band sub-line #E3E3E3), results card radius 16px, and the contact band (Figma 406:4474) now plays the approved clip at 30% under the Designer's pre-footer overlay (559:1589: #1C97D4 16% Linear Burn, then a fade to black; see item 3), with the existing still at 30% as poster and fallback (no video under reduced motion or data saving; paused offscreen). Playback gating is shared with the site-wide CTA (`useAmbientVideo`). The page's closing "Start with the outcome you need" band is the shared CTA, which already used the clip. Counters: server render and reduced motion show final values; print now snaps unviewed counters to their final values; count-up unchanged.
- **Open Designer decisions** (not implemented; not confirmed requirements):
  1. Arabic weights: Arabic keeps the previous Tajawal weights (hero heading and figures 700, eyebrows 400, band heading 600) via `rtl:` overrides. See PQA-025.
  2. ~~Band gradient direction.~~ Resolved by the Designer's pre-footer assets (Figma 559:1589): overlay 557:1587 is a linear gradient transparent → #000, top to bottom, which matches the implementation.
  3. ~~Video and tint blend modes.~~ Resolved by 559:1589: the video (557:1586) is a 30% video fill in Normal blend with Fill (centred cover), so the older multiply over #263238 in `section#cta` (406:4475) is superseded. The tint under the gradient is #1C97D4 at 16% in **Linear Burn**. CSS has no cross-browser linear burn (`plus-darker` is WebKit-only), so it is rendered as black at 16%. Measured on the clip and poster, that is 0.7/255 mean and 8.4/255 max from an exact linear burn, where the earlier normal-blend blue tint was 20/255 mean off. The video and poster are now centred (were top-right). Still open: the Case Studies `section#cta` also has a top-end "Back-Light" radial glow (406:4476: #1C97D4 30% → 0 at 68%, 24px layer blur), which is not part of the supplied assets and is not applied. Confirm whether it is required. The panel base under the video is also unconfirmed: the site keeps `bg-ink` #0D161B, `section#cta` is #263238 and the pre-footer frame is #000.
  4. Fallback poster `/assets/options/bg.jpg` is 1349×201 and soft at full width (also used by the shared CTA). Supply a full-resolution frame of the clip if wanted.
  5. Avenir licence record: see PQA-020.
  6. The shared pre-footer CTA (Home and every site page; Figma 406:4485 uses the same three fills) still renders the tint in normal blend. Not changed, because it is outside this fix. Confirm whether it should get the same linear-burn treatment.
- **Accessibility (open):** before a counter scrolls into view it shows its zero start after hydration, so a screen reader's virtual cursor (and JavaScript-rendering crawlers) can read "0" instead of the result. A fix needs a change to the shared `CountUp` markup (for example a visually hidden final value with the animated text hidden from assistive technology), which affects every counter on the site; deferred for a separate decision.
- **Acceptance criteria:**
  - [x] Weights, colours, radius and band layers verified in the browser (EN and AR, 1440/768/390px) and covered by `tests/e2e/case-studies/designer-fixes.spec.ts`.
  - [ ] Designer decisions above recorded.
  - [ ] Decision on the counter screen-reader fix.

### PQA-021 — Unknown localized routes return HTTP 200 (soft 404)

- **Page:** Unmatched URLs under a locale (for example `/en/zzz`, `/ar/a/b/c`) — `app/[locale]/[...rest]/page.tsx`
- **Priority:** Medium for Preview; reassess before Production (SEO and monitoring)
- **Status:** DEFERRED — Pending release decision (known soft-404 issue, not resolved)
- **Owner:** Frontend / PM
- **Description:** QA reported that unknown URLs show the correct 404 page but answer HTTP 200. Confirmed on the local production build and on `demo.infoline.om`; the cause is application code, not hosting. The catch-all route renders the themed 404 and deliberately does not call `notFound()`. The page is server-rendered with the site header and footer and is marked `noindex`, so search engines do not index it, but status-based monitoring and crawlers still see a 200. A technical spike on Next.js 16.3.1 (isolated copy, nothing merged) found:
  1. **Current soft 404 (HTTP 200):** full server HTML with navigation, `noindex`, EN and AR.
  2. **`notFound()` inside the catch-all:** returns HTTP 404 but the initial HTML is blank (the page appears only after client JavaScript), so it is not acceptable.
  3. **Experimental `globalNotFound`:** returns HTTP 404 with server-rendered EN and AR content and `noindex`, but only after deleting the catch-all and `app/[locale]/not-found.tsx`, and the page loses the existing Header and Footer. Mirroring them into the global file failed (the server render fell back to a blank client shell). It also depends on a flag Next marks experimental.
  4. **Not covered either way:** unknown Article and Insights slugs have their own soft 404 and return HTTP 200 once the CMS answers; with no CMS endpoint (the current demo build) they return HTTP 500 by design (a CMS outage is never a cacheable 404). Their behaviour must be verified separately when the CMS is connected.
- **Decision:** The team deferred the implementation. No routing, Next.js configuration, component or test changes were made.
- **Dependency:** PM/Designer decision on whether a correct HTTP 404 is worth a 404 page without the site navigation (or a design for that page), taken before Production.
- **Acceptance criteria:**
  - [ ] Decision recorded: keep the themed soft 404, or move to a real HTTP 404 (for example via `globalNotFound`) with an approved page design.
  - [ ] If a real 404 is chosen: unknown localized URLs return HTTP 404 with visible server-rendered content in EN and AR, `noindex` stays, valid pages and redirects are unaffected, and the e2e 404 specs are updated.
  - [ ] Unknown Article and Insights slugs verified against the connected CMS (themed not-found, no 500 for a missing post).
