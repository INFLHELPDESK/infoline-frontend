# Preview QA — Open Issues

Tracker for issues found during Frontend Preview QA that are not yet resolved.
Resolved issues are removed from this file (history lives in Git).

**Branch:** `feature/home-2-redesign`
**Last updated:** 2026-10-22

## Summary

| ID | Page | Title | Priority | Status |
| --- | --- | --- | --- | --- |
| [PQA-001](#pqa-001--talent-network-cta-pending-destination) | Careers | Talent Network CTA — pending destination | Medium | BLOCKED — Awaiting decision |
| [PQA-002](#pqa-002--careers-arabic-copy-pending-review) | Careers | Arabic copy — pending review | Medium | PENDING CONTENT REVIEW |
| [PQA-003](#pqa-003--vacancy-apply-links-broken-navigation) | Careers | Vacancy Apply links — broken navigation | High | OPEN — Functional bug |
| [PQA-004](#pqa-004--industries-badge--arabic-translation-pending) | Industries | Badge — Arabic translation pending | Low | PENDING CONTENT REVIEW |
| [PQA-005](#pqa-005--about--who-we-are--arabic-copy-mismatch) | About | Who We Are — Arabic copy mismatch | Medium | PENDING CONTENT REVIEW |
| [PQA-006](#pqa-006--about--built-on-trust--arabic-eyebrow-mismatch) | About / Built on Trust | Arabic eyebrow — mismatch with English | Medium | PENDING CONTENT REVIEW |

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

### PQA-003 — Vacancy Apply links — broken navigation

- **Page:** Careers (`/careers`) — vacancies table, `components/sections/careers/vacancies.tsx`
- **Priority:** High
- **Status:** OPEN — Functional bug
- **Description:** Each vacancy "Apply" link targets `#apply`, but `components/sections/careers/apply.tsx` is not rendered on the page, so the anchor does not exist and the links do nothing. Pinned by the known-defect test `[D-6]` in `tests/e2e/contact/careers-application.spec.ts`.
- **Dependency:** Confirmation of the approved application flow. Do not invent a new route or form integration.
- **Acceptance criteria:**
  - [ ] Every Apply link reaches the approved application flow.
  - [ ] No dead `#apply` anchors remain.
  - [ ] `[D-6]` is updated to assert the fixed behaviour.
  - [ ] Works in English LTR and Arabic RTL, with no layout shift or horizontal overflow.

### PQA-004 — Industries badge — Arabic translation pending

- **Page:** Industries / Home V1 Industries section (`components/sections/home-1/industries.tsx`)
- **Priority:** Low
- **Status:** PENDING CONTENT REVIEW
- **Description:** The English badge now reads "CX / Industries" (`HomeV1.industries.eyebrow` in `locales/en.json`). The Arabic badge is still `القطاعات` because no approved Arabic translation of "CX / Industries" exists.
- **Dependency:** Approved Arabic translation.
- **Acceptance criteria:**
  - [ ] English and Arabic convey the same approved meaning.
  - [ ] Only `HomeV1.industries.eyebrow` changes; unrelated Industries labels stay unchanged.
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
  1. **Reading time (CMS):** WordPress returns no reading-time field and the list query carries no body, so CMS cards show none. Static fallback cards compute it from the locale post body (200 wpm).
  2. **Static fallback content vs Figma:** the Figma sample shows "26 sep / 24 sep / 22 sep 2026", different excerpts, and titles for cards 2 and 3 that do not exist in the locale content. Static cards keep their own dates (17 Sep, 2 Aug, 10 Jun 2026) and excerpts from `Blog.posts`. The COPC card's excerpt there describes a utilities contact-centre story, which looks mismatched with its title.
  3. **Static date data:** `Blog.posts` stores ISO dates in 2025 but display labels in 2026 (e.g. `2025-09-17` vs "17 Sep 2026"). Cards show the display label, as the Blog pages do; the source data needs a correction.
  4. **Label:** the action reuses the approved `Blog.page.readMore` ("Read more" / "اقرأ المزيد"); Figma shows "Read More".
- **Dependency:** Backend decision on a reading-time field (or approval to fetch post content for the cards); client-approved static card copy and dates; confirmation of the "Read More" capitalisation.
- **Acceptance criteria:**
  - [ ] CMS cards show reading time from an approved source, or the design drops it for CMS content.
  - [ ] Static card dates, excerpts and titles match the approved content (including the COPC excerpt).
  - [ ] `Blog.posts` ISO `date` and `dateLabel` agree for every post, in English and Arabic.
  - [ ] Action label matches Figma in English and Arabic.

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
