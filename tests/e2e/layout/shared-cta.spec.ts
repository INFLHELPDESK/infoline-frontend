import type { Page } from "@playwright/test";
import { test, expect, waitForHydration } from "../support/fixtures";
import { dirFor, locales, messages } from "../support/messages";
import { setMotionPreference } from "../support/motion";

/**
 * The shared closing CTA ("Start with the outcome you need") belongs on the
 * regular site pages, once, directly above the footer — and on no error state.
 */
const SITE_ROUTES = [
  "",
  "/about",
  "/solutions",
  "/solutions/managed-branch-retail",
  "/industries",
  "/case-studies",
  "/insights",
  "/careers",
  "/contact",
  "/blog",
  `/blog/${messages.en.Blog.posts[0].slug}`,
];

// Unknown URL (catch-all) and an unknown blog slug (inline soft 404).
const ERROR_ROUTES = ["/this-page-does-not-exist", "/blog/this-post-does-not-exist"];

const sharedCta = (locale: (typeof locales)[number]) => ({
  title: messages[locale].HomeV1.cta.title,
  href: messages[locale].HomeV1.cta.cta.href,
});

for (const locale of locales) {
  const cta = sharedCta(locale);

  test.describe(`shared CTA (${locale})`, () => {
    for (const path of SITE_ROUTES) {
      test(`${path || "/"}: exactly one CTA, directly above the footer`, async ({ page }) => {
        await page.goto(`/${locale}${path}`);
        await waitForHydration(page);
        await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));

        const heading = page.getByRole("heading", { name: cta.title, exact: true });
        await expect(heading).toHaveCount(1);

        const section = heading.locator("xpath=ancestor::section[1]");
        // The page template wraps the content, so the footer is not the CTA's own sibling:
        // the CTA must be the last thing in that wrapper, and the footer must come right after it.
        const adjacent = await section.evaluate(
          (el) =>
            el.parentElement?.lastElementChild === el &&
            el.parentElement?.nextElementSibling === document.querySelector("footer"),
        );
        expect(adjacent).toBe(true);
        // ...and, once the page template has settled, the CTA ends exactly where the footer starts.
        await expect
          .poll(() =>
            section.evaluate((el) =>
              Math.round(document.querySelector("footer")!.getBoundingClientRect().top - el.getBoundingClientRect().bottom),
            ),
          )
          .toBe(0);
        await expect(section.getByRole("link", { name: messages[locale].HomeV1.cta.cta.label })).toHaveAttribute(
          "href",
          new RegExp(`${cta.href}$`),
        );
      });
    }

    for (const path of ERROR_ROUTES) {
      test(`${path}: error page without the CTA, footer kept`, async ({ page }) => {
        await page.goto(`/${locale}${path}`);
        await expect(page.getByRole("heading", { name: cta.title, exact: true })).toHaveCount(0);
        await expect(page.locator("footer")).toHaveCount(1);
      });
    }
  });
}

test("no horizontal overflow with the CTA at 390px, LTR and RTL", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const locale of locales) {
    await page.goto(`/${locale}/about`);
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw);
  }
});

test("the CTA button goes to its own destination", async ({ page }) => {
  await page.goto("/en/about");
  await waitForHydration(page);
  const cta = sharedCta("en");
  const heading = page.getByRole("heading", { name: cta.title, exact: true });
  const link = heading
    .locator("xpath=ancestor::section[1]")
    .getByRole("link", { name: messages.en.HomeV1.cta.cta.label });
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(/\/en\/contact\/?$/);
});

test("reduced motion: the CTA photo is not parallax-transformed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/about");
  const heading = page.getByRole("heading", { name: sharedCta("en").title, exact: true });
  const section = heading.locator("xpath=ancestor::section[1]");
  await section.scrollIntoViewIfNeeded();
  const transform = await section.locator("div").first().evaluate((el) => getComputedStyle(el).transform);
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
});

const ctaSection = (page: Page) =>
  page
    .getByRole("heading", { name: sharedCta("en").title, exact: true })
    .locator("xpath=ancestor::section[1]");

test("desktop geometry matches the Figma handoff (1280×422 block, 56/70 heading, 243×48 button)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/about");
  await waitForHydration(page);
  const section = ctaSection(page);
  const heading = page.getByRole("heading", { name: sharedCta("en").title, exact: true });
  const button = section.getByRole("link", { name: messages.en.HomeV1.cta.cta.label });

  expect(Math.round((await section.boundingBox())!.height)).toBe(422);
  await expect(heading).toHaveCSS("font-size", "56px");
  await expect(heading).toHaveCSS("line-height", "70px");
  const box = (await button.boundingBox())!;
  expect([Math.round(box.width), Math.round(box.height)]).toEqual([243, 48]);
  await expect(button).toHaveCSS("font-size", "18px");
});

for (const preference of ["reduce", "no-preference"] as const) {
  test(`${preference}: the CTA reveal ends with no blur or offset left from the server render`, async ({ page }) => {
    await setMotionPreference(page, preference);
    await page.goto("/en/about");
    await waitForHydration(page);
    const heading = page.getByRole("heading", { name: sharedCta("en").title, exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect.poll(() => heading.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    await expect
      .poll(() => heading.evaluate((el) => getComputedStyle(el).filter))
      .toMatch(/^(none|blur\(0px\))$/);
    await expect
      .poll(() => heading.evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  });
}
