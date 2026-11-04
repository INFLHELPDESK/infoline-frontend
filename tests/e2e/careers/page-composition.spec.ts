import { test, expect, waitForHydration } from "../support/fixtures";
import { messages } from "../support/messages";

/**
 * Careers page composition — Figma 406:4538: no embedded application form,
 * approved section order, and the Talent Network CTA kept unavailable until a
 * destination is approved (PQA-001).
 */
for (const locale of ["en", "ar"] as const) {
  const t = messages[locale].CareersPage;

  test(`${locale}: approved section order, no application form`, async ({ page }) => {
    await page.goto(`/${locale}/careers`);
    await waitForHydration(page);

    await expect(page.locator("#apply")).toHaveCount(0);
    await expect(page.locator("main form")).toHaveCount(0);

    const order = [t.learn.title, t.vacancies.title, t.cta.title].filter(Boolean);
    const tops: number[] = [];
    for (const text of order) {
      const h = page.getByRole("heading", { name: text }).first();
      tops.push(await h.evaluate((el) => el.getBoundingClientRect().top + window.scrollY));
    }
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);
  });

  test(`${locale}: Talent Network CTA stays a disabled button, never a link`, async ({ page }) => {
    await page.goto(`/${locale}/careers`);
    await waitForHydration(page);
    await expect(page.getByRole("button", { name: t.learn.cta.secondary.label })).toBeDisabled();
    await expect(page.getByRole("link", { name: t.learn.cta.secondary.label })).toHaveCount(0);
  });
}
