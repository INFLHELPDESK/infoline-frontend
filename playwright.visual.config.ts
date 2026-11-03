import { defineConfig, devices } from "@playwright/test";
// Importing the main config runs its CMS isolation guards and reuses its web
// servers (CMS stub + `next start` of the isolated build) and global teardown.
import base from "./playwright.config";

/**
 * Figma-to-browser visual QA (`npm run test:visual`). Kept in its own config so
 * `npm run test:e2e` and CI never pick these specs up: the default config only
 * looks in tests/e2e. See tests/visual/README.md.
 */
export default defineConfig({
  ...base,
  testDir: "tests/visual",
  outputDir: "test-results/visual",
  // A visual verdict must come from one deterministic run, never a retry.
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "test-results/visual-report" }],
    ["./tests/visual/support/summary-reporter.ts", { outputFile: "test-results/visual-summary.md" }],
  ],
  projects: [
    {
      name: "visual",
      use: {
        ...devices["Desktop Chrome"],
        // Figma frames are 1x; compare at CSS pixel scale.
        deviceScaleFactor: 1,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
