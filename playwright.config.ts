import { defineConfig, devices } from "@playwright/test";
import {
  assertBuildIsIsolated,
  assertBuildMatchesEndpoint,
  assertIsolatedCmsEnv,
} from "./tests/support/cms-guard";
import { TRIPWIRE_LOG } from "./tests/support/tripwire-log";

// Developer convenience: pick up .env.local (Next reads it for build/start too).
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local; rely on the process environment (CI sets it explicitly)
}
// Fail closed: never run the suite without an isolated, non-production CMS config.
assertIsolatedCmsEnv();
assertBuildIsIsolated();
assertBuildMatchesEndpoint();

const CI = !!process.env.CI;
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

const cmsUrl = new URL(process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT!);

/**
 * E2E runs against a production build (`next build` must run first — CI does
 * this as its own step; locally use `npm run build:isolated`). All off-origin
 * traffic is blocked by the shared fixture in tests/e2e/support/fixtures.ts.
 */

export default defineConfig({
  globalTeardown: "./tests/support/global-teardown.ts",
  testDir: "tests/e2e",
  outputDir: "test-results/e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // Same as CI everywhere: more workers saturate one `next start` plus Chromium
  // on a typical dev machine and turn load into timeouts. Override explicitly
  // with `--workers=N` (or PW_WORKERS) when you know the machine can take it.
  workers: Number(process.env.PW_WORKERS) || 2,
  reporter: CI
    ? [["github"], ["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  expect: { timeout: 7_500 },
  use: {
    baseURL,
    locale: "en-US",
    timezoneId: "Asia/Muscat",
    // Default to reduced motion so assertions never race entrance animations.
    // Motion specs opt back in with `test.use({ reducedMotion: "no-preference" })`.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /cms-scenarios.spec.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // Spawns its own `next start` per CMS scenario (empty Next data cache each
      // time) and changes the shared stub's global scenario, so it runs only
      // after every other spec has finished.
      name: "cms-scenarios",
      testMatch: /cms-scenarios.spec.ts/,
      dependencies: ["chromium"],
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      // Local CMS stub (tests/support/cms-stub): serves fixtures, and logs every
      // request so any server-side or browser-side CMS fetch fails the run in
      // global teardown while no page is wired to WordPress.
      command: "node tests/support/cms-stub/main.mjs",
      url: `${cmsUrl.origin}/__health`,
      reuseExistingServer: false,
      timeout: 15_000,
      env: { CMS_TRIPWIRE_LOG: TRIPWIRE_LOG },
    },
    {
      command: `npm run start -- -p ${PORT} -H 127.0.0.1`,
      url: `${baseURL}/en`,
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
