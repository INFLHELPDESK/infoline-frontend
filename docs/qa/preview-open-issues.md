# Preview QA — Open Issues

Tracker for issues found during Frontend Preview QA that are not yet resolved.
Resolved issues are removed from this file (history lives in Git).

**Branch:** `feature/home-2-redesign`
**Last updated:** 2026-10-26

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
| [PQA-020](#pqa-020--contact-form-e2e-test-stale-after-country-default) | Contact (tests) | Contact form e2e test stale after Country default | Low | OPEN — Test update |

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
- **Description:** Arabic strings for card 4 and the new CTA (title, description, button labels) need native-speaker/client review. Current strings are in `locales/ar.json` under `CareersPage.learn`.
- **Dependency:** Approved Arabic copy from a native speaker or the client.
- **Acceptance criteria:**
  - [ ] Existing translations stay unchanged until replacements are provided.
  - [ ] Approved copy is applied in `locales/ar.json` only.
  - [ ] Card heights, wrapping and CTA layout verified in RTL at 1440, 768 and 390px.

### PQA-004 — Industries badge — Arabic translation pending

- **Page:** Industries / Home V1 Industries section (`components/sections/home-1/industries.tsx`); Industries page "How does CX differ by industry?" (`components/sections/industries/differ.tsx`)
- **Priority:** Low
- **Status:** PENDING CONTENT REVIEW
- **Description:** The English badge now reads "CX / Industries" (`HomeV1.industries.eyebrow` and `IndustriesPage.differ.eyebrow` in `locales/en.json`). The Arabic badges are still `القطاعات` because no approved Arabic translation of "CX / Industries" exists.
- **Dependency:** Approved Arabic translation.
- **Acceptance criteria:**
  - [ ] English and Arabic convey the same approved meaning.
  - [ ] Only `HomeV1.industries.eyebrow` and `IndustriesPage.differ.eyebrow` change; unrelated Industries labels stay unchanged.
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

- **Page:** Home (`/`) — `components/sections/home-1/what-changes-toggle*.tsx`, `what-changes-dial.tsx`; preview only via `?homeVariant=new` (off on Vercel Production)
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
- **Description:** Both missing sections are now built from the Figma handoff. (1) `HomeV1.clients.title` in `locales/ar.json` is an English placeholder (no approved Arabic for "Trusted by Oman's ministries, authorities and national institutions"); the Arabic eyebrow and description reuse the approved `Proof` strings. (2) `public/assets/clients/paew.svg` is actually the Social Insurance logo, not the Electricity & Water authority; other pages (Solutions, Industries, legacy home logos) still reference it under the Electricity & Water name. The Home section uses the Figma export `electricity-water.png` for PAEW and `paew.svg` for Social Insurance. The Home client row is static (single row from 1024px, wraps below) to match Figma; no approved Arabic was found elsewhere in the project. The partner logos and the Electricity & Water logo were exported from the Figma handoff as PNG, not vendor-supplied originals.
- **Dependency:** Approved Arabic title; confirmation of the `paew.svg` mislabel and its fix on other pages; vector originals of the logos if available. **Batch 4B deliberately left `paew.svg` unchanged; it stays open until an approved replacement asset is supplied.**
- **Acceptance criteria:**
  - [ ] `HomeV1.clients.title` in `locales/ar.json` replaced with approved copy.
  - [ ] `paew.svg` renamed/replaced and other pages corrected.
  - [ ] Verified in RTL at 1440, 768 and 390px.

### Other untranslated Arabic labels — tracked under existing issues

No new entries; each is already recorded: `AboutPage.cta.secondaryButton.label` (PQA-007), `InsightsPage.proof.description` (PQA-008), `InsightsPage.cta.button.label` and `.secondaryButton.label` (PQA-010), `HomeV1.whatChangesToggle.description` (PQA-011).

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
  6. **Industries clients title:** "Named across all six sector groups" vs Figma "Named across the full catalogue."
  7. **Home:** stat label "Agents ready to help you" vs Figma "omani agents…" and the fifth 1,400+ stat; Vendors card wording; Home "What changes" heading (see PQA-011).
  8. **Minor:** About values-chip punctuation; Contact Country default ("Oman" in Figma vs "Select country").
- **Dependency:** Client/designer decisions. Several look like Figma typos and should be confirmed with the designer.
- **Acceptance criteria:**
  - [ ] Each item above is approved or dismissed in writing.
  - [ ] Approved changes applied in `locales/en.json` and `locales/ar.json` only.

### PQA-020 — Contact form e2e test stale after Country default

- **Page:** Contact (`/contact`) — `tests/e2e/contact/contact-form.spec.ts` ("service route: touched empty fields show every required error and block submit")
- **Priority:** Low
- **Status:** OPEN — Test update (not a product defect)
- **Description:** Batch 1 (`a7f5a23`) pre-filled Country with the first option ("Oman") to match Figma (`defaultCountry` in `components/sections/contact/form.tsx`). The spec still expects a "Select your country" error after touching the empty Country field, so it fails at HEAD and on this branch (deterministic; unrelated to the motion changes).
- **Dependency:** None. Update the spec to the approved behaviour (Country pre-filled, no required-country error on an untouched form).
- **Acceptance criteria:**
  - [ ] The spec no longer expects a Country error on an untouched form and passes.
