# Tests

| Layer | Tool | Location | Runs against |
|---|---|---|---|
| Unit (pure helpers, translation parity) | Vitest, Node env | `tests/unit/**` | source |
| Component (only where E2E cannot reach) | Vitest + jsdom + React Testing Library | `tests/unit/components/**` | source |
| End-to-end characterization | Playwright (Chromium) | `tests/e2e/**` | `next start` on a production build |

```bash
npm test                 # unit + component (Vitest)
npm run test:watch       # Vitest watch mode
npm run build:isolated   # required before E2E (CMS-isolated build)
npm run test:e2e:install # once per machine: Playwright Chromium
npm run test:e2e         # Playwright; starts `next start` on 127.0.0.1:3100
npx playwright show-report
```

Playwright runs 2 workers by default, locally and in CI; override with
`--workers=N` or `PW_WORKERS=N`.

Locally, Playwright reuses a server already listening on port 3100 (`E2E_PORT`
overrides the port). Rebuild after changing app code: the server serves the
last build.

## Isolation rules

- **No real network.** `tests/e2e/support/fixtures.ts` aborts every request
  that leaves the app origin (CMS, Cloudflare, fonts CDNs, …). Tests register
  explicit mocks on top (`mockSubmitInquiry`). Nothing can reach the
  production WordPress API, even when a mock is forgotten.
- **No live form submissions.** Contact and Careers flows are exercised only
  against `mockSubmitInquiry`, which also captures request bodies.
- **Uncaught page errors fail the test.** A describe block may tolerate a
  specific known defect with `test.use({ knownPageErrors: [/narrow pattern/] })`;
  any error that does not match still fails.
- **Copy comes from `locales/*.json`** via `support/messages.ts`; tests never
  hard-code UI strings.
- **No visual baselines** until the font decision is resolved.

## Known defects

Existing defects are not fixed by the test suite and are not hidden by loose
assertions. Each known-defect test (`[D-n]` in its title, plus a
`known-defect` annotation) has three parts:

1. **Setup** that must pass (navigation, filling the form, the response).
2. **A pin** of today's defective behaviour, asserted exactly (for example
   `projectType: "New build"`).
3. `test.fail()`, then the assertion of the *intended* contract.

Playwright reports these as expected failures. Because `test.fail()` is only
reached after the setup and the pin pass, a broken setup step or any change
to the defective behaviour (a fix *or* a different regression) fails the run
instead of being absorbed as "expected". When a defect is fixed, delete the
pin and the `test.fail()` line so the contract assertion becomes a normal
test.

Where the brief asked for current behaviour to be captured (the careers
submission payload), a separate test pins the exact current payload and is
annotated so it is updated deliberately alongside the fix.

## Motion testing strategy

Motion is the most fragile thing to test, so the suite follows these rules
(helpers live in `tests/e2e/support/motion.ts`):

1. **Reduced motion by default.** `playwright.config.ts` sets
   `reducedMotion: "reduce"`, so ordinary assertions never race entrance
   animations. Specs that characterize motion opt back in with
   `test.use({ reducedMotion: "no-preference" })` or `setMotionPreference()`.
   Every motion feature should be tested under **both** preferences: the
   reduced path is an accessibility contract, not a fallback.
2. **No sleeps.** Never use `waitForTimeout` or fixed delays. Wait on an
   observable condition instead:
   - `scrollToY` / `scrollElementTo`: instant scroll, then wait until
     `scrollY` matches plus two animation frames (scroll listeners,
     IntersectionObserver and scroll timelines have run).
   - `waitForAnimationsSettled`: awaits `finished` on every finite Web
     Animation in a subtree (CSS transitions/animations and framer's WAAPI
     props). Infinite loops (marquees, pings) are ignored.
   - `waitForStableStyle`: waits until computed `transform` / `opacity` /
     `clip-path` stay unchanged for N frames. This covers JS-driven (rAF)
     framer animations that `getAnimations()` cannot see.
   - `waitForHydration` (fixtures): waits for a React fiber on an element
     before interacting with or asserting hydration errors.
3. **Auto-advancing UI → fake clock.** Install `page.clock` before `goto`, bring
   the component into view, then `page.clock.runFor(period)`. Assert both that
   it advances with motion on and that it **never** advances under reduced
   motion. Keyboard focus and hover must pause it.
4. **Sticky / pinned sections → geometry, not pixels.** Compute the sticky
   range from the DOM (`getBoundingClientRect` + parent bounds), scroll to
   points inside and outside it, and assert `viewportTop` with
   `expectPinnedAt`. Do not hard-code page-specific scroll offsets.
   Scroll-driven (scroll-timeline / `useScroll`) visuals: assert end states at
   deterministic scroll positions (e.g. progress 0, 0.5, 1), not mid-animation
   frames.
5. **Image transitions.** Assert the semantic end state (the right image is
   visible/attached, `alt` is correct, the previous one is gone) after
   `waitForAnimationsSettled`. Do not snapshot intermediate frames.
6. **Keyboard navigation.** Drive with `page.keyboard` (Tab / Enter / Escape),
   assert `toBeFocused()` and ARIA state (`aria-expanded`, `aria-pressed`,
   `aria-current`), never CSS classes alone.
7. **Layout stability.** `measureLayoutShift` records CLS while an action runs
   (load + full-page scroll on the home page today). Keep the budget at the
   "good" threshold (< 0.1).
8. **No animation snapshots.** Screenshot comparison of moving content is out
   of scope until baselines are approved, and even then only for settled
   states with reduced motion.

### Covered today

| Behaviour | Spec |
|---|---|
| Industry rail auto-advance (fake clock), reduced-motion opt-out, keyboard focus, tap-to-open | `motion/motion.spec.ts` |
| Blog article sticky rail (`top-32`) pins within its range and scrolls outside it | `motion/motion.spec.ts` |
| Template page entrance settles with no lasting transform (motion on); D-7 under reduced motion | `motion/motion.spec.ts` |
| Home hero heading visible and settled under reduced motion | `motion/motion.spec.ts` |
| Home page CLS while loading and scrolling | `motion/motion.spec.ts` |
| Header theme on scroll and on the light-hero Contact page | `navigation/header.spec.ts` |

### Not yet covered (gaps)

- `/home-1` "why trust" pinned story (`why-trust.tsx`, sticky + `useScroll`):
  the route currently raises a hydration error under reduced motion (D-9), and
  the section is expected to be redesigned.
- Industries `sectors.tsx` stacked sticky cards with `animation-timeline: view()`.
- `ClipReveal` image reveals, `Parallax`, `CountUp`, logo marquee.
- Turnstile with a configured site key in a real browser (the key is inlined at
  build time; covered at component level in `tests/unit/components`).
- Cross-browser (Firefox/WebKit) and mobile-device projects.

## CMS isolation (WordPress)

`lib/wp` has no default endpoint, and the suite refuses to run unless the CMS
configuration is isolated. Copy `.env.example` to `.env.local` (or export the
same variables) **before building**, because `NEXT_PUBLIC_*` is inlined at build time. The
safest way to build for tests is `npm run build:isolated`: it forces
`CMS_ISOLATED=1`, defaults the endpoint to the stub, and refuses anything that
is not a loopback URL with a port (shell and `.env.local` values cannot
override it, because Next never overwrites variables that are already set).

```
CMS_ISOLATED=1
NEXT_PUBLIC_WPGRAPHQL_ENDPOINT=http://127.0.0.1:3199/graphql
```

Layers, all fail-closed:

1. `playwright.config.ts` calls `assertIsolatedCmsEnv()`: the flag must be set
   and the endpoint must be an explicit loopback host and port.
2. `assertBuildIsIsolated()` scans `.next/static` and `.next/server` (not
   source maps) for the production CMS host. `lib/forms` still falls back to
   the production endpoint when the env var is unset, so a build made without
   the isolation env would otherwise ship it unnoticed.
3. `tests/support/cms-stub/main.mjs` (the CMS stub, see below) listens on the
   configured loopback port and logs every non-control request
   (`POST /graphql op=<Operation>`, `GET /stub-media/<file>`).
   `global-teardown.ts` fails the run on any line not allow-listed in
   `tests/support/cms-allowlist.ts` (only `Posts`, for `/[locale]/insights`,
   plus stub media), so any other server-side CMS fetch is caught (browser-side ones are already aborted by
   `fixtures.ts`).
4. `tests/unit/setup.ts` makes an unstubbed `fetch` throw in unit tests.
5. `tests/unit/wp/runtime-preservation.test.ts` walks the import graph (static,
   dynamic, re-export, relative and transitive) from `app`, `components`,
   `hooks`, `i18n`, `lib`, `proxy.ts` and `next.config.ts` and fails if any
   path reaches `lib/wp`, `providers` or `lib/content-adapters`, except from
   the `WIRED_ROUTE_FILES` of the one wired route (`/[locale]/insights`);
   nothing else may import those files and they must be the only direct
   importers of the WP layer. It is a
   source-level guard only: it does not catch computed dynamic imports.

6. `assertBuildMatchesEndpoint()` requires the build to embed this run's
   endpoint, so a stale `.next`, or a build made with another endpoint (even a
   non-production one), is refused.
7. `fixtures.ts` fails any test whose browser made a request the guard had to
   abort that looks like CMS/form traffic (production host, `/graphql`,
   `/wp-json/`). Contact and Careers flows must mock `submitInquiry`; an
   unmocked submission can no longer pass silently on the abort. The
   `lib/forms` production fallback itself is untouched (production behavior).

Wiring another route means adding its files to `WIRED_ROUTE_FILES` and its
operation to `cms-allowlist.ts`; no guard is relaxed globally. `cms/cms-stub.spec.ts`
still asserts every other page makes no CMS request.

### Wired route: `/[locale]/insights`

Only the "Formats" cards are CMS-backed. `lib/insights-feed.ts` prefetches `Posts`
into a per-request `QueryClient`, the page hydrates it, and `formats-live.tsx`
reads it with `usePosts` (no browser request). Outcomes, shown in
`data-content-source`: `cms` (first 3 posts); `fallback-empty` (valid empty list);
`fallback-error` (http, graphql, network, timeout, malformed, missing-root, config;
logged once, never treated as empty). Cancellations and adapter bugs are rethrown.
CMS posts link to `/blog/<slug>` only when the static blog detail route has that
slug; otherwise the card is plain content (`data-unlinked`).

Server fetches use the Next data cache, so `e2e/cms/cms-scenarios.spec.ts` (project
`cms-scenarios`, runs after the rest) starts a fresh `next start` per stub scenario
with `.next/cache/fetch-cache` deleted and asserts each first request reached the
stub. Do not run it with `--repeat-each` (copies would share the port and stub).
`lib/cms-images.ts` enables `dangerouslyAllowLocalIP` only for `CMS_ISOLATED=1`
with a loopback endpoint.

## CMS stub and contract tests

`tests/support/cms-stub/` is a zero-dependency, loopback-only WPGraphQL stand-in:

| File | Role |
|---|---|
| `fixtures.mjs` | Deterministic EN/AR data per operation, in four variants: `full`, `empty`, `null-acf`, `partial` |
| `server.mjs` | `createCmsStub()`; routes by operation name and `$language`/`$uri`/`$id`; scenarios; request log; mutations always rejected |
| `main.mjs` | Playwright `webServer` entry (port from the endpoint env, tripwire log) |
| `harness.ts` | Vitest helper: stub on an ephemeral port, endpoint env set, fetch restricted to the stub's origin |

Scenarios: `ok`, `empty`, `null-acf`, `partial`, `graphql-error`, `partial-errors`,
`no-data`, `http-error`, `malformed-json`, `malformed-shape`, `network-error`,
`hang` (never answers), `stalled-body` (headers, then a body that never ends)
(global `POST /__scenario`, or per request via `x-cms-stub-scenario`).
Fixtures are synthetic; nothing is copied from the live CMS.

Contract tests (`tests/unit/wp`):

- `stub-fixtures.test.ts` parses the query text actually sent and asserts every
  fixture has exactly the selected fields, so fixtures cannot drift from
  `lib/wp/queries.ts` / `api.ts` or invent schema fields.
- `cms-contract.test.ts`: request envelope, locale mapping, normalized output,
  empty/null/partial ACF, error handling.
- `client-reliability.test.ts`: typed failures for every fetcher, valid empty vs
  malformed responses, root-field validation, timeout and cancellation.
- `prefetch-contract.test.ts`: the error contract of every `prefetch*` helper.
- `normalize.test.ts`, `content-adapters.test.ts`: pure edge cases.
- `hydration.test.tsx`: server prefetch, dehydrate, server markup and client
  hydration with the real query client, EN and AR, no refetch, error fallback.
- `stub-server.test.ts`: the stub itself.

### Client reliability contract (`lib/wp/client.ts`)

- **Timeout.** Every request has a 10 s budget (`WP_TIMEOUT_MS`), covering the
  response body as well as the headers. It is not read from env; override per
  call with `wpFetch(query, vars, revalidate, { timeoutMs })`. The `get*`
  fetchers use the default. Nothing retries inside `wpFetch`; React Query's
  client-side retry policy still applies in the browser, so a hung CMS can take
  several timeouts there before `useQuery` reports an error.
- **Cancellation.** `{ signal }` aborts the request; the rejection is the
  caller's own abort reason, never a `WpRequestError`. No `get*` fetcher
  forwards a signal yet.
- **Typed errors.** Failures reject with `WpRequestError` and a `kind`: `http`
  (with `status`), `graphql`, `network`, `timeout`, `malformed`, `missing-root`.
  Bad endpoint configuration still rejects with `WpConfigError`.
- **Root fields.** Each fetcher declares the root fields its query selects. An
  absent root is `missing-root`; an explicit `null` root is valid (single
  lookup not found, unset options page). A list root that is `null` or has no
  `nodes` array is `malformed`; `nodes: []` is a valid empty list.
- **Prefetch.** `prefetch*` helpers resolve with valid content (including
  `null` and empty lists) and reject with the typed error otherwise. They do not
  swallow errors, do not retry, and a failed query is not dehydrated. The page
  decides the fallback; no page or UI fallback exists yet.

All of this is verified against the local stub only, not against live
WordPress.

**Verified** means derived from this repository (queries, normalizers, fetchers).
**Assumed** (not provable offline, to be confirmed against a non-production
WordPress when the first page is wired): the live schema still exposes these
fields (notably `hubHeadin`), WPML honours `where: { language }` and `/ar/`
URIs, option pages stay language-neutral, `fileSize` keeps its two encodings,
and case studies still cannot be filtered by sector server-side.

Deferred: the 10 s default is untuned against the real CMS; `get*` fetchers do
not yet accept an `AbortSignal` (so React Query cancellation is not forwarded);
`AbortSignal.any` is only used when a signal is passed, and requires a modern
browser; interaction between the abort signal and Next's server data cache is
not exercised until a page is wired and gets its own E2E.

## Git hook and CI policy

`.husky/pre-commit` runs `npm run validate` (lint, typecheck, unit tests; about
20 s, stops at the first failure). It deliberately does **not** build: a build
compiles whatever endpoint the shell or `.env.local` provides and overwrites
`.next`, which could point a hook run at a real CMS once a page fetches at build
time. The production build lives in CI only, as `npm run build:isolated`, which
forces `CMS_ISOLATED=1`, accepts only a loopback endpoint, and is followed by
the E2E suite that re-verifies the build (no production host, embeds this run's
endpoint). `git commit --no-verify` skips the hook; CI is the gate.

Isolation also covers `lib/wp`: with `CMS_ISOLATED=1`, `getWpEndpoint()` refuses the
production host family (trailing dots, subdomains, case) and any non-loopback
endpoint. That flag is server-only, so the browser bundle relies on the E2E
network guard instead.
