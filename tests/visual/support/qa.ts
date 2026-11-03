import { expect, type TestInfo } from "@playwright/test";

/**
 * QA ledger for one test. Every check is recorded with a status, so a run
 * yields a classified table (see summary-reporter.ts) instead of a bare
 * pass/fail:
 *
 * - `pass` / `fail`: the build matches / does not match the Figma reference.
 *   Only `fail` fails the test (soft assertion, so every check still runs).
 * - `designer-decision`: an open, documented question; the measured value is
 *   recorded against Figma but does not fail the run. Must cite its issue.
 * - `approved-exception`: a documented deviation from Figma; the build is
 *   asserted to hold the *exception* value. Must cite its source.
 * - `reference-unavailable`: no Figma frame exists for this case.
 * - `advisory`: evidence a person should look at, but a measurement that
 *   cannot discriminate pass from fail (proved by a negative control), so it
 *   is never gated. The note says which Gate A checks cover it instead.
 */
export type QaStatus =
  | "pass"
  | "fail"
  | "designer-decision"
  | "approved-exception"
  | "reference-unavailable"
  | "advisory";

export type QaRow = {
  id: string;
  title: string;
  category: "typography" | "colour" | "layout" | "assets" | "content" | "motion" | "responsive" | "rtl" | "visual";
  locale: string;
  viewport: string;
  status: QaStatus;
  expected: string;
  actual: string;
  note?: string;
};

type Base = Omit<QaRow, "status" | "expected" | "actual" | "locale" | "viewport">;

export const QA_ATTACHMENT = "qa-results";

export function qaLedger(testInfo: TestInfo, locale: string, viewport: string) {
  const rows: QaRow[] = [];
  const fmt = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));
  const add = (row: Omit<QaRow, "locale" | "viewport">) => rows.push({ locale, viewport, ...row });

  return {
    /** Build must match Figma. */
    match<T>(row: Base, actual: T, expected: T, equal: (a: T, e: T) => boolean = Object.is) {
      const ok = equal(actual, expected);
      add({ ...row, status: ok ? "pass" : "fail", expected: fmt(expected), actual: fmt(actual) });
      expect.soft(ok, `${row.id} ${row.title}: expected ${fmt(expected)}, got ${fmt(actual)}`).toBe(true);
    },
    /** Build must hold a documented exception value instead of Figma's. */
    exception<T>(row: Base & { note: string }, actual: T, exceptionValue: T, figmaValue: T) {
      const ok = Object.is(actual, exceptionValue);
      add({
        ...row,
        status: ok ? "approved-exception" : "fail",
        expected: `${fmt(exceptionValue)} (Figma: ${fmt(figmaValue)})`,
        actual: fmt(actual),
      });
      expect.soft(ok, `${row.id} ${row.title}: exception value ${fmt(exceptionValue)}, got ${fmt(actual)}`).toBe(true);
    },
    /** Open designer/content question: record only, never fails. */
    decision(row: Base & { note: string }, actual: unknown, figma: unknown) {
      add({ ...row, status: "designer-decision", expected: fmt(figma), actual: fmt(actual) });
    },
    advisory(row: Base & { note: string }, actual: string) {
      add({ ...row, status: "advisory", expected: "—", actual });
    },
    unavailable(row: Base & { note: string }, actual = "—") {
      add({ ...row, status: "reference-unavailable", expected: "no Figma frame", actual });
    },
    async attach() {
      await testInfo.attach(QA_ATTACHMENT, {
        body: JSON.stringify(rows, null, 2),
        contentType: "application/json",
      });
    },
  };
}

/** Numeric equality within ±tolerance (CSS px). */
export const within =
  (tolerance: number) =>
  (actual: number, expected: number): boolean =>
    Math.abs(actual - expected) <= tolerance;
