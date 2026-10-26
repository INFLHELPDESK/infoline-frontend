import { test, expect, waitForHydration } from "../support/fixtures";
import { dirFor, locales, messages } from "../support/messages";

/**
 * Blog article page (/[locale]/blog/[slug]) after the Figma redesign: header
 * with share controls, the story card, related-article links and horizontal
 * overflow, for a static locale post and a CMS post (shared local stub).
 *
 * SEO, hydration and soft-404 contracts are covered in cms/blog-detail.spec.ts;
 * this file covers presentation and the share controls only. Nothing is sent
 * off-origin: `window.open` is intercepted and the clipboard is a local grant.
 */

const CMS_SLUG = { en: "seasonal-peak", ar: "seasonal-peak-ar" } as const;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const locale of locales) {
  const single = messages[locale].Blog.page.single;
  const [post, second, third] = messages[locale].Blog.posts;
  const socials = messages[locale].Footer.socials as { label: string; network: string }[];

  test.describe(`/${locale}/blog/[slug] article`, () => {
    test("static post: header, share controls, story card and related links", async ({ page }) => {
      await page.goto(`/${locale}/blog/${post.slug}`);
      await waitForHydration(page);

      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
      await expect(page.locator("main h1")).toHaveText(post.title);
      await expect(page.locator("main aside")).toHaveCount(0);
      await expect(page.getByRole("link", { name: single.backLabel })).toHaveAttribute(
        "href",
        `/${locale}/blog`,
      );

      // Share controls: copy link + the three footer networks, each labelled.
      const share = page.getByRole("list", { name: single.shareLabel });
      await expect(share.getByRole("button")).toHaveCount(4);
      await expect(share.getByRole("button", { name: `${single.shareLabel} — link`, exact: true })).toBeVisible();
      for (const network of ["facebook", "x", "linkedin"]) {
        const label = socials.find((s) => s.network === network)!.label;
        await expect(
          share.getByRole("button", { name: `${single.shareLabel} — ${label}` }),
        ).toBeVisible();
      }

      // Story card: lead paragraph plus the remaining body paragraphs.
      await expect(page.getByText(post.body[0], { exact: true })).toBeVisible();
      for (const paragraph of post.body.slice(1)) {
        await expect(page.getByText(paragraph, { exact: true })).toBeAttached();
      }

      // Related articles link to the next posts in this locale.
      for (const next of [second, third]) {
        await expect(page.locator(`main a[href="/${locale}/blog/${next.slug}"]`).first()).toBeAttached();
      }

      // Reading time: same 200 wpm calculation as the Insights cards, from the body.
      const words = post.body.join(" ").split(/s+/).filter(Boolean).length;
      const minutes = new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "short" }).format(
        Math.max(1, Math.ceil(words / 200)),
      );
      await expect(page.locator("main section").first()).toContainText(minutes);

      // Related row: up to three distinct other posts (the shipped locale has four).
      const hrefs = await page
        .locator(`main a[href^="/${locale}/blog/"]`)
        .evaluateAll((links) => links.map((l) => l.getAttribute("href")));
      const related = new Set(hrefs.filter((h) => h !== `/${locale}/blog` && h !== `/${locale}/blog/${post.slug}`));
      expect(related.size).toBe(3);
    });

    test("CMS post: header, share controls and body render through the local stub", async ({ page }) => {
      await page.goto(`/${locale}/blog/${CMS_SLUG[locale]}`);
      await waitForHydration(page);

      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("main aside")).toHaveCount(0);
      await expect(page.getByRole("list", { name: single.shareLabel }).getByRole("button")).toHaveCount(4);
      await expect(page.getByText("Second paragraph.")).toBeAttached();
    });

    for (const vp of VIEWPORTS) {
      test(`no horizontal overflow on ${vp.name} (static and CMS posts)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        for (const slug of [post.slug, CMS_SLUG[locale]]) {
          await page.goto(`/${locale}/blog/${slug}`);
          await waitForHydration(page);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(overflow, `${slug} overflows horizontally`).toBeLessThanOrEqual(0);
        }
      });
    }

    test("share buttons open the network's share intent for the current page", async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { __opened: string[][] }).__opened = [];
        window.open = ((...args: string[]) => {
          (window as unknown as { __opened: string[][] }).__opened.push(args);
          return null;
        }) as typeof window.open;
      });
      await page.goto(`/${locale}/blog/${post.slug}`);
      await waitForHydration(page);

      const pageUrl = page.url();
      const share = page.getByRole("list", { name: single.shareLabel });
      const expected: Record<string, string> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
      };
      for (const [network, url] of Object.entries(expected)) {
        const label = socials.find((s) => s.network === network)!.label;
        await share.getByRole("button", { name: `${single.shareLabel} — ${label}` }).click();
        const opened = await page.evaluate(
          () => (window as unknown as { __opened: string[][] }).__opened.at(-1),
        );
        expect(opened?.[0]).toBe(url);
        expect(opened?.[2]).toContain("noopener");
      }
      // X carries the page URL and the post title.
      const xLabel = socials.find((s) => s.network === "x")!.label;
      await share.getByRole("button", { name: `${single.shareLabel} — ${xLabel}` }).click();
      const x = await page.evaluate(
        () => (window as unknown as { __opened: string[][] }).__opened.at(-1)?.[0],
      );
      expect(x).toContain("https://twitter.com/intent/tweet?url=" + encodeURIComponent(pageUrl));
      expect(x).toContain(encodeURIComponent(post.title));
    });
  });
}

test("copy-link button writes the article URL to the clipboard and confirms with a check icon", async ({
  page,
  context,
  baseURL,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseURL!).origin });
  const single = messages.en.Blog.page.single;
  const post = messages.en.Blog.posts[0];
  await page.goto(`/en/blog/${post.slug}`);
  await waitForHydration(page);

  const copy = page.getByRole("button", { name: `${single.shareLabel} — link`, exact: true });
  await expect(copy.locator("svg.lucide-check")).toHaveCount(0);
  await copy.click();

  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(page.url());
  await expect(copy.locator("svg.lucide-check")).toHaveCount(1);
  // The confirmation is temporary: the link icon returns.
  await expect(copy.locator("svg.lucide-check")).toHaveCount(0, { timeout: 5_000 });
});
