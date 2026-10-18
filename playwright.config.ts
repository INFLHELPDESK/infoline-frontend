import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * E2E runs against a production build (`next build` must run first — CI does
 * this as its own step; locally use `npm run test:e2e:build`). All off-origin
 * traffic is blocked by the shared fixture in tests/e2e/support/fixtures.ts.
 */
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
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
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT} -H 127.0.0.1`,
    url: `${baseURL}/en`,
    reuseExistingServer: !CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
