# Tests

| Layer | Tool | Location | Runs against |
|---|---|---|---|
| Unit (pure helpers, translation parity) | Vitest, Node env | `tests/unit/**` | source |
| Component (only where E2E cannot reach) | Vitest + jsdom + React Testing Library | `tests/unit/components/**` | source |
| End-to-end characterization | Playwright (Chromium) | `tests/e2e/**` | `next start` on a production build |

```bash
npm test                 # unit + component (Vitest)
npm run test:watch       # Vitest watch mode
npm run build            # required before E2E
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
same variables) **before `npm run build`**, because `NEXT_PUBLIC_*` is inlined
at build time:

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
3. `tests/support/cms-tripwire.mjs` listens on the configured loopback port,
   answers 503 and logs every request. `global-teardown.ts` fails the run if
   the log is not empty, so any server-side CMS fetch is caught (browser-side
   ones are already aborted by `fixtures.ts`).
4. `tests/unit/setup.ts` makes an unstubbed `fetch` throw in unit tests.
5. `tests/unit/wp/runtime-preservation.test.ts` walks the import graph (static,
   dynamic, re-export, relative and transitive) from `app`, `components`,
   `hooks`, `i18n`, `lib`, `proxy.ts` and `next.config.ts` and fails if any
   path reaches `lib/wp`, `providers` or `lib/content-adapters`. It is a
   source-level guard only: it does not catch computed dynamic imports.

Remove or relax 3 and 5 in the slice that deliberately wires the first page;
the tripwire is then replaced by the real CMS stub.

## Waiting for hydration

`page.goto` resolves on `load`, not on hydration. Specs that click
JS-driven controls right after navigation (for example the language
switcher) must call `waitForHydration` first; an early click is a silent
no-op. `locale-switch.spec.ts` does this through its `open()` helper.
