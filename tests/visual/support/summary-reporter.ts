import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { QA_ATTACHMENT, type QaRow, type QaStatus } from "./qa";

/**
 * Collects every test's `qa-results` ledger into one Markdown table, grouped
 * by status (fail first), so a run ends with the classified QA report.
 */
const ORDER: QaStatus[] = ["fail", "designer-decision", "reference-unavailable", "advisory", "approved-exception", "pass"];

const cell = (s: string | undefined) => (s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

export default class SummaryReporter implements Reporter {
  private rows: QaRow[] = [];
  private outputFile: string;

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = options.outputFile ?? "test-results/visual-summary.md";
  }

  onTestEnd(_test: TestCase, result: TestResult) {
    for (const a of result.attachments) {
      if (a.name === QA_ATTACHMENT && a.body) this.rows.push(...(JSON.parse(a.body.toString()) as QaRow[]));
    }
  }

  onEnd() {
    const counts = ORDER.map((s) => `${s}: ${this.rows.filter((r) => r.status === s).length}`).join(" · ");
    const lines = [
      "# Visual QA summary",
      "",
      counts,
      "",
      "| Status | ID | Check | Category | Locale | Viewport | Expected (Figma) | Actual (build) | Note |",
      "|---|---|---|---|---|---|---|---|---|",
    ];
    const sorted = [...this.rows].sort(
      (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.id.localeCompare(b.id, "en", { numeric: true }),
    );
    for (const r of sorted) {
      lines.push(
        `| ${r.status} | ${r.id} | ${cell(r.title)} | ${r.category} | ${r.locale} | ${r.viewport} | ${cell(r.expected)} | ${cell(r.actual)} | ${cell(r.note)} |`,
      );
    }
    mkdirSync(dirname(this.outputFile), { recursive: true });
    writeFileSync(this.outputFile, `${lines.join("\n")}\n`);
  }

  printsToStdio() {
    return false;
  }
}
