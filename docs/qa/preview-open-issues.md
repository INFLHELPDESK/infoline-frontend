# Preview QA — Open Issues

Tracker for issues found during Frontend Preview QA that are not yet resolved.
Resolved issues are removed from this file (history lives in Git).

**Branch:** `feature/home-2-redesign`
**Last updated:** 2026-10-21

## Summary

| ID | Page | Title | Priority | Status |
| --- | --- | --- | --- | --- |
| [PQA-001](#pqa-001--talent-network-cta-pending-destination) | Careers | Talent Network CTA — pending destination | Medium | BLOCKED — Awaiting decision |
| [PQA-002](#pqa-002--careers-arabic-copy-pending-review) | Careers | Arabic copy — pending review | Medium | PENDING CONTENT REVIEW |
| [PQA-003](#pqa-003--vacancy-apply-links-broken-navigation) | Careers | Vacancy Apply links — broken navigation | High | OPEN — Functional bug |

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
