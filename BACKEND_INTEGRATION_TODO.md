# Backend Integration - Component Updates

## ✅ Pages Updated (Fetching Data)
- ✅ `/solutions` → Fetches SOLUTIONS_QUERY
- ✅ `/industries` → Fetches INDUSTRIES_QUERY  
- ✅ `/about` → Fetches COMPANY_PROFILE_QUERY
- ✅ `/` (home) → Fetches CLIENTS_QUERY
- ✅ `/contact` → Fetches SERVICES_QUERY

## 📝 Components Needing Updates

### 1. **Solutions Page**

#### `components/sections/solutions/catalogue.tsx`
```tsx
// Change from:
const services = t.raw("catalogue.services") as Service[];

// To:
export default function Catalogue({ solutions }: { solutions: any[] }) {
  const mappedServices = solutions.map(s => ({
    id: s.slug,
    number: s.databaseId,
    title: s.title,
    image: s.featuredImage?.node?.sourceUrl,
    // ... map other fields
  }));
  // Use mappedServices instead of hardcoded services
}
```

---

### 2. **Industries Page**

#### `components/sections/industries/sectors.tsx`
```tsx
// Change from:
const sectors = t.raw("sectors.items") as Sector[];

// To:
export default function Sectors({ industries }: { industries: any[] }) {
  const mappedSectors = industries.map(i => ({
    id: i.slug,
    number: i.databaseId,
    title: i.title,
    image: i.featuredImage?.node?.sourceUrl,
    // ... map other fields from industryCoreContent
  }));
  // Use mappedSectors instead of hardcoded sectors
}
```

---

### 3. **About Page**

#### `components/sections/about/documents.tsx`
```tsx
// Change from:
const documents = t.raw("documents.list");

// To:
export default function Documents({ companyProfile }: { companyProfile: any }) {
  const downloads = [
    {
      label: companyProfile?.profileEnLabel,
      url: companyProfile?.profileEnFile?.node?.mediaItemUrl,
      size: companyProfile?.profileEnFile?.node?.fileSize,
    },
    {
      label: companyProfile?.profileArLabel,
      url: companyProfile?.profileArFile?.node?.mediaItemUrl,
      size: companyProfile?.profileArFile?.node?.fileSize,
    },
  ].filter(d => d.url); // Remove null entries
  
  // Format fileSize: bytes to MB
  // size / (1024 * 1024)
}
```

---

### 4. **Home Page**

#### `components/sections/home/partners-logos.tsx`
```tsx
// Change from:
const logos = t.raw("partners.logos");

// To:
export default function PartnersLogos({ clients }: { clients: any[] }) {
  const logos = clients.map(c => ({
    name: c.clientContent?.clientName,
    logo: c.clientContent?.clientLogo?.node?.sourceUrl,
    alt: c.clientContent?.clientLogo?.node?.altText,
  }));
  // Use logos in marquee/carousel
}
```

---

### 5. **Contact Forms**

#### `components/sections/contact/form.tsx`
```tsx
// Add form submission:
const handleSubmit = async (formData) => {
  const response = await graphqlRequest(SUBMIT_INQUIRY, {
    input: {
      action: "service_inquiry", // or project_inquiry, media_inquiry
      ...formData,
      website: "", // honeypot
      turnstileToken: "", // add Turnstile later
    }
  });
  
  if (response.submitInquiry.success) {
    // Show confirmation
  } else {
    // Show validation errors
    response.submitInquiry.validationErrors.forEach(err => {
      setFieldError(err.field, err.message);
    });
  }
};

// For job application (REST):
const handleJobSubmit = async (formData, cvFile) => {
  const form = new FormData();
  form.append('name', formData.name);
  form.append('email', formData.email);
  form.append('phone', formData.phone);
  form.append('position', roleTitle);
  form.append('message', formData.message);
  form.append('cv', cvFile);
  form.append('website', ''); // honeypot
  form.append('turnstileToken', token);
  
  const response = await submitJobApplication(form);
};
```

---

## 🔒 Forms Implementation

### Important Notes:
1. **Always submit from browser, NOT server** (rate limiting per IP)
2. **Check `success` field**, not HTTP status
3. **Add honeypot field** `website` (hidden)
4. **Add Turnstile token** (currently inactive, enable later)
5. **Rate limit:** 5 submissions per IP per 10 minutes

### Form Validation:
- Validate frontend for UX
- Trust server for security (re-validates)
- Map errors to fields: `validationErrors[].field`
- Show `message` as general error if `success: false` with empty errors

---

## 🎨 SEO Integration

Add to all pages with content:
```tsx
import { SOLUTION_BY_URI_QUERY, INDUSTRY_BY_URI_QUERY } from '@/lib/queries';

// In your page fetch:
const data = await graphqlRequest(query, variables);

// In metadata:
export async function generateMetadata() {
  const seo = data.solution.seo; // or industry.seo, etc.
  
  return {
    title: seo.title,
    description: seo.metaDesc || undefined, // omit if empty
    robots: `${seo.metaRobotsNoindex ? 'noindex' : 'index'}, ${seo.metaRobotsNofollow ? 'nofollow' : 'follow'}`,
    openGraph: {
      title: seo.opengraphTitle,
      description: seo.opengraphDescription,
      images: seo.opengraphImage?.sourceUrl,
    },
  };
}

// In layout/component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: seo.schema.raw }}
/>
```

---

## 📊 Implementation Priority

1. **High Priority** (Affects UX)
   - [ ] Catalogue component (Solutions)
   - [ ] Sectors component (Industries)
   - [ ] PartnersLogos component (Home)
   - [ ] Documents component (About)

2. **Medium Priority** (Forms)
   - [ ] Contact form submissions
   - [ ] Job application submission
   - [ ] Validation error handling

3. **Low Priority** (SEO)
   - [ ] SEO metadata on pages
   - [ ] JSON-LD schema injection

---

## ✨ Testing Checklist

- [ ] Solutions page displays backend data
- [ ] Industries page displays backend data
- [ ] Home page shows partner logos
- [ ] About page has downloadable PDFs
- [ ] Contact form submits successfully
- [ ] Form validation errors display
- [ ] Job application accepts file uploads
- [ ] SEO tags render in HTML

---

## 🚧 WordPress Blog Detail — Production Blocker Register (WS-05C-3)

`/[locale]/blog/[slug]` and the Insights → Blog links are wired to WordPress
(`lib/blog-post.ts`, commits `ec58e3a` and `6a8beda`). Everything below is
**OPEN**. This register is the "WS-05C-3 report" that the comments in
`lib/blog-post.ts` refer to.

**Verified** = derived from this repository and exercised against the local CMS
stub only (`tests/support/cms-stub`). **Assumed** = cannot be proven offline;
needs confirmation against a non-production WordPress before CMS blog pages are
enabled in production. Nothing here has been run against live WordPress.

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| BLK-1 | WPML activation and EN/AR language filtering | **High** (production-activation blocker) | OPEN |
| BLK-2 | 100-post lookup limit | Medium | OPEN |
| BLK-3 | CMS posts missing from the sitemap | Medium | OPEN |
| BLK-4 | CMS outage behaviour on Blog Detail | Medium | OPEN |
| BLK-5 | Insights cache-key coupling | Low | SUPERSEDED |

### BLK-1 — WPML activation and EN/AR language filtering

- **Severity:** High. Blocks enabling CMS-backed blog pages in production.
- **Current behavior (verified):**
  - The single-post query `POST_BY_SLUG` (`lib/wp/queries.ts`) takes only a slug;
    there is no language argument, and the normalized `Post`
    (`lib/wp/normalize.ts`, `lib/wp/types.ts`) has no language field. `uri`
    cannot identify locale either (the stub's AR post has no `/ar` prefix).
  - A slug from the other locale therefore resolves for any locale.
    `loadBlogPost` (`lib/blog-post.ts`) fails closed on the contract: a CMS post
    renders only if its slug is in that locale's own `posts(where: { language })`
    list; otherwise it is a noindex soft 404 (`locale-mismatch`). Insights cards
    skip this check (`slugFromLocaleList`) because their slugs come from that list.
- **Assumed (needs backend confirmation):** WPML is active; `where: { language }`
  is *enforced* on `posts` (`lib/wp/api.ts` still says "the WPML layer is not
  configured yet" and `tests/README.md` lists this as assumed); slugs are unique
  per language; whether Arabic posts use `/ar/` URIs.
- **Risk:** If the filter is a no-op, both locales' posts appear in both lists and
  the guard protects nothing: `/en/blog/<ar-slug>` would render Arabic content
  under an EN URL with a self-canonical (wrong-language duplicate content).
- **Owner / dependency:** WordPress/backend team (WPML configuration); frontend
  follow-up once the schema is confirmed.
- **Resolution criteria:** Backend confirms WPML is active, the `posts` language
  filter is enforced, and slugs are unique per language. Then either (a) keep the
  list-membership guard as is, or (b) switch to a language-aware single-post query
  or a confirmed language field and remove the extra list request.
- **Verification requirements:** On a non-production WordPress, query
  `posts(where:{language:EN})` and `AR` and confirm they differ and exclude each
  other's slugs; request an AR slug under `/en/blog/` and confirm a noindex soft
  404. Update the stub fixtures if the contract changes. Keep
  `tests/unit/wp/blog-post.test.ts` (locale mismatch) and the blog-detail /
  cold-server locale tests in `tests/e2e/cms/` green.
- **Status:** OPEN

### BLK-2 — 100-post lookup limit

- **Severity:** Medium.
- **Current behavior (verified):** The locale check uses `prefetchPosts` →
  `getPosts(locale)` with the default `first = 100` (`lib/wp/api.ts`,
  `lib/wp/server.ts`); no pagination. A CMS post outside the newest 100 for its
  locale is treated as `locale-mismatch` and served as a noindex soft 404 (HTTP
  200). The limit is stated in the `loadBlogPost` comment.
- **Risk:** Older posts silently disappear from the site (and from search) once
  more than 100 posts exist per locale. Today nothing links to them: the blog index is
  static and Insights shows only the newest 3.
- **Owner / dependency:** Frontend; depends on BLK-1's outcome (a language-aware
  single-post query removes the need for the list check entirely).
- **Resolution criteria:** A post's locale can be verified without the 100-post
  bound (language-aware single-post query, confirmed language field, or paginated
  list lookup).
- **Verification requirements:** A stub or non-production fixture with more than
  100 posts per locale where the oldest post still renders; unit test for the
  chosen approach in `tests/unit/wp/blog-post.test.ts`; request-count assertions
  in `tests/e2e/cms/cms-scenarios.spec.ts` ("cache sharing and request counts")
  updated to the new request pattern.
- **Status:** OPEN

### BLK-3 — CMS posts missing from the sitemap

- **Severity:** Medium (SEO).
- **Current behavior (verified):** `app/sitemap.ts` is synchronous and lists
  static paths plus `enMessages.Blog.posts` only. CMS post URLs are not listed.
  The gap is pinned by `tests/e2e/cms/blog-detail.spec.ts` ("blog index and
  sitemap keep their static behavior": CMS slug must not appear).
- **Risk:** Indexable CMS articles are discoverable only through Insights links,
  not through the sitemap. Adding them naively would also emit hreflang
  alternates that do not exist (EN and AR slugs differ and there is no
  translation map; the page itself emits self-only hreflang).
- **Owner / dependency:** Frontend; depends on BLK-1 (locale correctness) and on
  a CMS source of post slugs/dates for the sitemap.
- **Resolution criteria:** The sitemap includes valid CMS posts per locale with
  self-only alternates (or true alternates once a translation map exists),
  fails safe when the CMS is unreachable, and excludes soft-404 posts.
- **Verification requirements:** Flip the pinned sitemap assertion; add unit and
  e2e coverage for inclusion, per-locale URLs, and sitemap behavior under CMS
  failure scenarios (stub scenarios in `tests/support/cms-stub`).
- **Status:** OPEN

### BLK-4 — CMS outage behaviour on Blog Detail

- **Severity:** Medium (availability).
- **Current behavior (verified):** For a slug not in the static locale copy, any
  CMS failure (`http`, `graphql`, `network`, `timeout`, `malformed`,
  `missing-root`, config) becomes `kind: "error"` in `loadBlogPost` and the page
  rethrows it, so the response is **500** (never a not-found page; the error
  response carries `noindex`). There is no `error.tsx` boundary and no stale
  fallback. Static posts never depend on the CMS. A failing render costs more than
  one CMS request: Next resolves the lookup twice (metadata runs again for the
  error response): 2 requests, or 3 when a 200 carries an unusable body.
  Successful and not-found answers are cached in the Next data cache for
  `WP_REVALIDATE` (300 s); failures are not (`lib/wp/client.ts`).
  Covered by the `blog detail, scenario <name>` suites in
  `tests/e2e/cms/cms-scenarios.spec.ts` and `tests/unit/wp/blog-post.test.ts`.
- **Risk:** A CMS outage takes down every CMS-only article page, and a flapping
  CMS multiplies upstream requests on those pages. Verified only against the
  stub; real-CMS latency and the 10 s timeout (`WP_TIMEOUT_MS`) are untuned.
- **Owner / dependency:** Product/frontend decision (accept 500, add a themed
  error boundary, or serve stale content); CMS team for availability targets.
- **Resolution criteria:** An explicit decision recorded here, and, if changed,
  implemented without turning outages into indexable 404s.
- **Verification requirements:** Keep the scenario matrix green; if an error
  boundary or stale fallback is added, add SSR assertions for status, noindex and
  recovery, and tune `WP_TIMEOUT_MS` against the non-production CMS.
- **Status:** OPEN

### BLK-5 — Insights cache-key coupling

- **Severity:** Low.
- **Current behavior (verified):** `app/[locale]/insights/page.tsx` reads the
  cards back from the server `QueryClient` with
  `queryClient.getQueryData(wpKeys.latestPosts(wpLocale, INSIGHTS_LIMIT))` and a
  cast, after `loadInsightsFeed` (`lib/insights-feed.ts`) prefetched them. If the
  key shape or limit ever diverges, `cards` becomes `[]`, no CMS card is linked
  and nothing fails visibly (safe, but silent). Today it is covered indirectly:
  `tests/e2e/cms/insights.spec.ts` and the cold-server cache-sharing tests in
  `tests/e2e/cms/cms-scenarios.spec.ts` assert the card is linked.
- **Risk:** A refactor of keys or limits silently unlinks CMS cards.
- **Owner / dependency:** Frontend; no backend dependency.
- **Resolution criteria:** `loadInsightsFeed` returns the cards it prefetched (or
  the page otherwise stops depending on a cache-key cast), and the invariant
  "cards are available whenever the source is `cms`" is enforced in code.
- **Verification requirements:** A unit test in `tests/unit/wp/insights-feed.test.ts`
  asserting the cards are returned for `source: "cms"`; the existing Insights
  e2e link assertions stay green.
- **Status:** SUPERSEDED. `/insights` no longer reads cards back from the
  `QueryClient`: `loadInsightsListing` (`lib/insights-listing.ts`) returns the
  items it fetched, and the page renders them directly (no dehydration, no
  `getQueryData` cast). The legacy Posts feed (`lib/insights-feed.ts`,
  `formats-live.tsx`) is unused and awaits the Posts-integration cleanup.
