import { test, expect, waitForHydration } from "../support/fixtures";
import { messages } from "../support/messages";

/**
 * The switcher's onClick only exists once React has hydrated, and goto()
 * resolves on the load event, not on hydration. Clicking earlier is a silent
 * no-op, so every test waits for hydration before interacting.
 */
async function open(page: import("@playwright/test").Page, url: string) {
  await page.goto(url);
  await waitForHydration(page, "header");
}

const switcher = (page: import("@playwright/test").Page) =>
  page.locator("header").getByRole("group", { name: /Language|اللغة/ }).first();

test.describe("language switcher", () => {
  test("switches EN -> AR -> EN and keeps the current path", async ({ page }) => {
    await open(page, "/en/about");
    const en = switcher(page);
    await expect(en.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");

    await en.getByRole("button", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/about$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(
      page.locator("header nav").getByRole("link", { name: messages.ar.Header.nav[0].label }),
    ).toBeVisible();

    const ar = switcher(page);
    await expect(ar.getByRole("button", { name: "العربية" })).toHaveAttribute("aria-pressed", "true");
    await ar.getByRole("button", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("keeps nested paths such as a blog article", async ({ page }) => {
    const slug = messages.en.Blog.posts[1].slug;
    await open(page, `/en/blog/${slug}`);
    await switcher(page).getByRole("button", { name: "العربية" }).click();
    await expect(page).toHaveURL(new RegExp(`/ar/blog/${slug}$`));
    await expect(page.locator("main h1")).toHaveText(messages.ar.Blog.posts[1].title);
  });

  test("clicking the active locale is a no-op", async ({ page }) => {
    await open(page, "/en/solutions");
    await switcher(page).getByRole("button", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/solutions$/);
  });

  // Characterization: router.replace(pathname) is called with the
  // locale-stripped pathname only, so query strings are dropped. This loses
  // the Careers deep link (/contact?route=careers). Reported as an observation.
  test("drops the query string when switching (current behaviour)", async ({ page }) => {
    await open(page, "/en/contact?route=careers");
    await switcher(page).getByRole("button", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/contact$/);
  });
});
