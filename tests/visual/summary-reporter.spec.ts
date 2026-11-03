import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import SummaryReporter from "./support/summary-reporter";

/**
 * Regression check: `playwright test --list` (and any run that executes no
 * test) must never overwrite the real visual QA summary. Uses a temporary
 * output path, never test-results/visual-summary.md.
 */
const SENTINEL = "# sentinel: last real report\n";

test("reporter writes nothing when no test ended (unit)", () => {
  const out = join(mkdtempSync(join(tmpdir(), "vqa-")), "summary.md");
  writeFileSync(out, SENTINEL);
  const reporter = new SummaryReporter({ outputFile: out });
  reporter.onEnd();
  expect(readFileSync(out, "utf8")).toBe(SENTINEL);
});

test("reporter writes the table once a test ended (unit)", () => {
  const out = join(mkdtempSync(join(tmpdir(), "vqa-")), "summary.md");
  writeFileSync(out, SENTINEL);
  const reporter = new SummaryReporter({ outputFile: out });
  reporter.onTestEnd({} as never, { attachments: [] } as never);
  reporter.onEnd();
  expect(readFileSync(out, "utf8")).toContain("# Visual QA summary");
});

test("`playwright test --list` leaves an existing summary untouched (real CLI)", () => {
  const out = join(mkdtempSync(join(tmpdir(), "vqa-")), "summary.md");
  writeFileSync(out, SENTINEL);
  const run = spawnSync(process.execPath, [require.resolve("@playwright/test/cli"), "test", "-c", "playwright.visual.config.ts", "--list"], {
    env: { ...process.env, VISUAL_SUMMARY_OUT: out },
    encoding: "utf8",
  });
  expect(run.status, run.stderr).toBe(0);
  expect(run.stdout).toMatch(/Total: \d+ tests/);
  expect(readFileSync(out, "utf8")).toBe(SENTINEL);
});
