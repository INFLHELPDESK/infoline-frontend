import { test, expect, waitForHydration } from "../support/fixtures";
import { dirFor, locales, messages } from "../support/messages";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
const DETAIL = "/solutions/managed-branch-retail";

for (const locale of locales) {
  const s = messages[locale].SolutionsPage;

  test.describe(`solutions (${locale})`, () => {
    test("hero buttons, partner CTA copy and ninth-service entries", async ({ page }) => {
      await page.goto(`/${locale}/solutions`);
      await waitForHydration(page);
      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));

      const hero = page.locator("main section").first();
      await expect(hero.getByRole("link", { name: s.hero.primaryCta.label })).toHaveAttribute(
        "href",
        `/${locale}${s.hero.primaryCta.href}`,
      );
      await expect(hero.getByRole("link", { name: s.hero.secondaryCta.label })).toBeVisible();

      const partner = page.getByRole("heading", { name: s.partner.title }).locator("xpath=ancestor::section[1]");
      await expect(partner.getByText(s.partner.description, { exact: true })).toBeVisible();
      await expect(partner.getByRole("link", { name: s.partner.cta.label })).toBeVisible();

      const m = s.managedBranch;
      expect(s.catalogue.services).toHaveLength(8);
      await expect(page.locator(`main a[href="/${locale}${DETAIL}"]`)).toHaveCount(2); // hero index + catalogue rail
      await page.locator(`#catalogue a[href="/${locale}${DETAIL}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${DETAIL}$`));
      await expect(page.getByRole("heading", { level: 1, name: m.title })).toBeVisible();
    });

    test("partner CTA secondary button is a disabled, non-link control (pending integration)", async ({ page }) => {
      await page.goto(`/${locale}/solutions`);
      await waitForHydration(page);
      const cta = page.getByRole("heading", { name: s.partner.title }).locator("xpath=ancestor::section[1]");
      const label = s.partner.secondaryCta.label;
      if (!s.partner.secondaryCta.show) {
        // Arabic label pending client approval: nothing renders (no English leak).
        await expect(cta.getByRole("button")).toHaveCount(0);
        return;
      }
      const btn = cta.getByRole("button", { name: label });
      await expect(btn).toBeDisabled();
      await expect(cta.getByRole("link")).toHaveCount(1); // only the primary CTA is a link
    });

    test("services 01-08 still switch the catalogue", async ({ page }) => {
      await page.goto(`/${locale}/solutions`);
      await waitForHydration(page);
      for (const svc of s.catalogue.services) {
        await page.locator("#catalogue button", { hasText: svc.title }).click();
        await expect(page.locator("#catalogue h2", { hasText: svc.title }).last()).toBeVisible();
      }
    });

    for (const vp of VIEWPORTS) {
      test(`${vp.name}: no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        for (const path of ["/solutions", DETAIL]) {
          await page.goto(`/${locale}${path}`);
          await waitForHydration(page);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow, path).toBeLessThanOrEqual(0);
        }
      });
    }

    test("partner CTA keeps the static fallback and mounts no video under reduced motion", async ({ page }) => {
      await page.goto(`/${locale}/solutions`);
      await waitForHydration(page);
      const cta = page.getByRole("heading", { name: s.partner.title }).locator("xpath=ancestor::section[1]");
      await expect(cta.locator("img")).toHaveCount(1);
      await expect(cta.locator("video")).toHaveCount(0);
    });

    test.describe("with motion allowed", () => {
      test.use({ reducedMotion: "no-preference" });

      test("partner CTA video loads lazily, plays in view and pauses out of view", async ({ page }) => {
        await page.goto(`/${locale}/solutions`);
        await waitForHydration(page);
        const video = page.locator("video:has(source[src$='Solutions-partnership-CTA.mp4'])");
        await expect(video).toHaveCount(1);
        await expect(video).toHaveJSProperty("preload", "none");
        await expect(video).toHaveJSProperty("muted", true);
        await expect(video).toHaveJSProperty("loop", true);
        await video.scrollIntoViewIfNeeded();
        // Bundled Chromium has no H.264: assert playback only where it can decode.
        const canPlay = await video.evaluate((v: HTMLVideoElement) => v.canPlayType('video/mp4; codecs="avc1.42E01E"') !== "");
        if (canPlay) {
          await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true);
          await page.locator("footer").scrollIntoViewIfNeeded();
          await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
        }
      });
    });
  });
}

test("sitemap lists the managed-branch route for every locale", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const locale of locales) expect(xml).toContain(`/${locale}${DETAIL}`);
});
