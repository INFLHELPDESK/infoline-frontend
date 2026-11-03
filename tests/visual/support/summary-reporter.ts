import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { QA_ATTACHMENT, type QaRow, type QaStatus } from "./qa";

/**
 * Collects every test's `qa-results` ledger into one Markdown table, grouped
 * by status (fail first), so a run ends with the classified QA report.
 *
 * The file is written only when at least one test actually ran. Playwright
 * calls onBegin/onEnd for `--list` (and for runs that execute nothing) without
 * any onTestEnd; writing then would replace the last real report with an
 * empty table. `VISUAL_SUMMARY_OUT` overrides the path (used by the
 * regression check in tests/visual/summary-reporter.spec.ts).
 */
const ORDER: QaStatus[] = ["fail", "designer-decision", "reference-unavailable", "advisory", "approved-exception", "pass"];

const cell = (s: string | undefined) => (s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

export default class SummaryReporter implements Reporter {
  private rows: QaRow[] = [];
  private testsEnded = 0;
  private outputFile: string;

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = process.env.VISUAL_SUMMARY_OUT || options.outputFile || "test-results/visual-summary.md";
  }

  onTestEnd(_test: TestCase, result: TestResult) {
    this.testsEnded++;
    for (const a of result.attachments) {
      if (a.name === QA_ATTACHMENT && a.body) this.rows.push(...(JSON.parse(a.body.toString()) as QaRow[]));
    }
  }

  /** Markdown for the collected rows (exposed for the regression check). */
  render(): string {
    const counts = ORDER.map((s) => `${s}: ${this.rows.filter((r) => r.status === s).length}`).join(" · ");
    const lines = [
      "# Visual QA summary",
      "",
      counts,
      "",
      "| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |",
      "|---|---|---|---|---|---|---|---|---|",
    ];
    // Total order (status, id, locale, viewport, title), so parallel workers
    // finishing in a different order cannot reorder the report.
    const cmp = (x: string, y: string) => x.localeCompare(y, "en", { numeric: true });
    const sorted = [...this.rows].sort(
      (a, b) =>
        ORDER.indexOf(a.status) - ORDER.indexOf(b.status) ||
        cmp(a.id, b.id) || cmp(a.locale, b.locale) || cmp(a.viewport, b.viewport) || cmp(a.title, b.title),
    );
    for (const r of sorted) {
      lines.push(
        `| ${r.status} | ${r.id} | ${cell(r.title)} | ${r.category} | ${r.locale} | ${r.viewport} | ${cell(r.expected)} | ${cell(r.actual)} | ${cell(r.note)} |`,
      );
    }
    return `${lines.join("\n")}\n`;
  }

  onEnd() {
    if (this.testsEnded === 0) return; // --list, or nothing executed: keep the last real report
    mkdirSync(dirname(this.outputFile), { recursive: true });
    writeFileSync(this.outputFile, this.render());
  }

  printsToStdio() {
    return false;
  }
}
