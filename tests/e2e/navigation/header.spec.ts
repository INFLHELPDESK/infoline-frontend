import type { Page } from "@playwright/test";
import { test, expect } from "../support/fixtures";
import { messages } from "../support/messages";
import { scrollToY } from "../support/motion";

const header = (page: Page) => page.locator("header").first();
const logo = (page: Page) => header(page).getByRole("img", { name: messages.en.Header.logoAlt });
const darkLogo = (page: Page) => header(page).locator('img[src*="logo-dark"]');
const TRANSPARENT = "rgba(0, 0, 0, 0)";

test.describe("desktop navigation", () => {
  test("marks the current section and navigates between pages", async ({ page }) => {
    await page.goto("/en/about");
    const nav = header(page).locator("nav");
    const about = nav.getByRole("link", { name: "About", exact: true });
    await expect(about).toHaveAttribute("aria-current", "page");
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);

    await nav.getByRole("link", { name: "Solutions", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/solutions$/);
    await expect(nav.getByRole("link", { name: "Solutions", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("routes outside the primary nav mark no item as current", async ({ page }) => {
    await page.goto(`/en/blog/${messages.en.Blog.posts[0].slug}`);
    // Blog is not in the primary nav, so nothing is marked current.
    await expect(header(page).locator('nav [aria-current="page"]')).toHaveCount(0);
  });

  test("hides the mobile menu toggle on desktop", async ({ page }) => {
    await page.goto("/en");
    await expect(header(page).locator("button[aria-expanded]")).toBeHidden();
  });
});

test.describe("header theme", () => {
  test("dark pages: transparent at the top, solid ink once scrolled past 16px", async ({ page }) => {
    await page.goto("/en/about");
    await expect(header(page)).toHaveCSS("background-color", TRANSPARENT);
    await expect(logo(page)).toHaveCSS("opacity", "1");

    await scrollToY(page, 400);
    await expect(header(page)).not.toHaveCSS("background-color", TRANSPARENT);
    await expect(header(page)).toHaveClass(/bg-ink/);

    await scrollToY(page, 0);
    await expect(header(page)).toHaveCSS("background-color", TRANSPARENT);
  });

  test("restores the scrolled state when loading mid-page", async ({ page }) => {
    await page.goto("/en/about");
    await scrollToY(page, 600);
    await page.reload();
    await expect(header(page)).toHaveClass(/bg-ink/);
  });

  test("light-hero pages (Contact) use the light theme and dark logo", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(darkLogo(page)).toHaveCSS("opacity", "1");
    await expect(logo(page)).toHaveCSS("opacity", "0");

    await scrollToY(page, 400);
    await expect(header(page)).toHaveClass(/bg-white\/85/);
  });
});

test.describe("mobile drawer", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  const toggle = (page: Page) => header(page).locator("button[aria-expanded]");
  const drawer = (page: Page) => page.locator("nav[id]").filter({ has: page.getByRole("list") });

  test("toggle opens and closes the drawer with correct ARIA state", async ({ page }) => {
    await page.goto("/en");
    const button = toggle(page);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAccessibleName(messages.en.Header.menuToggle);
    await expect(drawer(page)).toHaveCount(0);

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const menu = drawer(page);
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute("aria-controls", (await menu.getAttribute("id"))!);
    for (const item of messages.en.Header.nav) {
      await expect(menu.getByRole("link", { name: item.label, exact: true })).toBeVisible();
    }
    await expect(menu.getByRole("link", { name: messages.en.Header.cta.label })).toBeVisible();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(drawer(page)).toHaveCount(0);
  });

  test("Escape closes the drawer", async ({ page }) => {
    await page.goto("/en");
    await toggle(page).click();
    await expect(drawer(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(drawer(page)).toHaveCount(0);
  });

  test("keyboard: Enter on the toggle opens it and Tab reaches the drawer links", async ({
    page,
  }) => {
    await page.goto("/en");
    await toggle(page).focus();
    await page.keyboard.press("Enter");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");

    // The drawer follows the header in DOM order (the backdrop is tabIndex -1).
    await page.keyboard.press("Tab");
    await expect(
      drawer(page).getByRole("link", { name: messages.en.Header.nav[0].label, exact: true }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("tapping the backdrop closes the drawer", async ({ page }) => {
    await page.goto("/en");
    await toggle(page).click();
    await expect(drawer(page)).toBeVisible();

    // The backdrop shares the toggle's label but is removed from the tab order.
    const backdrop = page.locator(
      `button[tabindex="-1"][aria-label="${messages.en.Header.menuToggle}"]`,
    );
    const box = (await backdrop.boundingBox())!;
    await backdrop.click({ position: { x: box.width / 2, y: box.height - 10 } });
    await expect(drawer(page)).toHaveCount(0);
  });

  test("following a link navigates and closes the drawer", async ({ page }) => {
    await page.goto("/en");
    await toggle(page).click();
    await drawer(page).getByRole("link", { name: "Industries", exact: true }).click();

    await expect(page).toHaveURL(/\/en\/industries$/);
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(drawer(page)).toHaveCount(0);
  });

  test("the drawer switches the Contact header to the dark theme while open", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(darkLogo(page)).toHaveCSS("opacity", "1");

    await toggle(page).click();
    await expect(logo(page)).toHaveCSS("opacity", "1");
    await expect(header(page)).toHaveClass(/bg-ink/);
  });

  test("renders Arabic items in the RTL drawer", async ({ page }) => {
    await page.goto("/ar");
    await toggle(page).click();
    for (const item of messages.ar.Header.nav) {
      await expect(drawer(page).getByRole("link", { name: item.label, exact: true })).toBeVisible();
    }
  });
});
