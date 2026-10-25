import { test, expect, waitForHydration } from "../support/fixtures";
import { isCmsRequest, trackRequests } from "../support/cms";
import { h1Text, rendersElementText, robotsMeta } from "../support/html";
import { dirFor, locales, messages, type Locale } from "../support/messages";

/**
 * /[locale]/blog/[slug] against the production build and the shared CMS stub
 * (default `ok` scenario): static locale posts, CMS posts, unknown and
 * wrong-locale slugs. Failure scenarios and request counting need their own
 * server and data cache; they live in cms-scenarios.spec.ts.
 *
 * Locale messages are embedded in every page, so UI copy is asserted on the
 * rendered elements (h1, element text), never as a substring of the document.
 */

const CMS = {
  en: { slug: "seasonal-peak", title: "How to staff a seasonal peak", category: "Articles" },
  ar: { slug: "seasonal-peak-ar", title: "كيف تُجهّز فريقك لموسم الذروة", category: "مقالات" },
};
const OTHER: Record<Locale, Locale> = { en: "ar", ar: "en" };
const staticPost = (locale: Locale) => messages[locale].Blog.posts[0];
const notFoundTitle = (locale: Locale) => messages[locale].Blog.page.single.notFoundTitle;

for (const locale of locales) {
  test.describe(`/${locale}/blog/[slug]`, () => {
    test("CMS post: server HTML carries the article, SEO is CMS-driven and single-locale", async ({
      request,
      baseURL,
    }) => {
      const { slug, title, category } = CMS[locale];
      const res = await request.get(`/${locale}/blog/${slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();

      expect(html).toMatch(new RegExp(String.raw`<html[^>]*\blang="${locale}"`));
      expect(html).toMatch(new RegExp(String.raw`<html[^>]*\bdir="${dirFor(locale)}"`));
      expect(h1Text(html)).toBe(title);
      expect(rendersElementText(html, category)).toBe(true); // category chip in the hero
      expect(html).toContain("Second paragraph."); // CMS-only text, not in any locale message

      expect(html).toContain(`<title>${title} — Infoline</title>`);
      expect(html).toMatch(new RegExp(`<meta name="description" content="${title}"`));
      expect(robotsMeta(html)).toBe("index, follow");
      expect(html).toContain(`<link rel="canonical" href="${baseURL}/${locale}/blog/${slug}"`);
      // The CMS has no translation map (EN and AR slugs differ): self only, never a guessed sibling.
      expect(html).toContain(`hrefLang="${locale}" href="${baseURL}/${locale}/blog/${slug}"`);
      expect(html).not.toContain(`hrefLang="${OTHER[locale]}"`);
      // Site-wide Open Graph from the root layout is untouched.
      expect(html).toContain('property="og:site_name" content="Infoline"');
      expect(html).toMatch(/<meta name="twitter:card" content="summary_large_image"/);
    });

    test("CMS post hydrates cleanly and the browser never talks to the CMS", async ({ page, consoleErrors }) => {
      const { slug, title } = CMS[locale];
      const cmsRequests = trackRequests(page, isCmsRequest);
      const assets = trackRequests(page, (url) => url.includes("/_next/static/")); // listener control
      await page.goto(`/${locale}/blog/${slug}`);
      await waitForHydration(page);

      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("main h1")).toHaveText(title);
      await expect(page.getByText("Second paragraph.")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", dirFor(locale));
      // Settle: a late client refetch or hydration swap would show up by now.
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main h1")).toHaveText(title);

      expect(assets.length, "request listener is wired").toBeGreaterThan(0);
      expect(cmsRequests).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });

    test("static post is unchanged: static content, locale-wide alternates", async ({ request, baseURL }) => {
      const post = staticPost(locale);
      const html = await (await request.get(`/${locale}/blog/${post.slug}`)).text();
      expect(h1Text(html)).toBe(post.title);
      expect(html).toContain(`<title>${post.title} — Infoline</title>`);
      expect(robotsMeta(html)).toBe("index, follow");
      expect(html).toContain(`<link rel="canonical" href="${baseURL}/${locale}/blog/${post.slug}"`);
      for (const l of locales) {
        expect(html).toContain(`hrefLang="${l}" href="${baseURL}/${l}/blog/${post.slug}"`);
      }
      expect(html).toContain(`hrefLang="x-default" href="${baseURL}/en/blog/${post.slug}"`);
    });

    test("unknown slug: themed soft 404 and noindex", async ({ request }) => {
      const res = await request.get(`/${locale}/blog/definitely-not-a-post`);
      const html = await res.text();
      expect(res.status()).toBe(200); // existing soft-404 contract for this route
      expect(h1Text(html)).toBe(notFoundTitle(locale));
      expect(robotsMeta(html)).toMatch(/^noindex/);
      expect(html).toContain("<title>Infoline</title>");
      // Only the root layout's alternates (the locale home) apply, as before this change.
      expect(html).not.toContain('/blog/definitely-not-a-post"');
    });

    test(`the ${OTHER[locale]} post's slug is a noindex soft 404 here (locale safety)`, async ({ request }) => {
      const other = CMS[OTHER[locale]];
      const res = await request.get(`/${locale}/blog/${other.slug}`);
      const html = await res.text();
      expect(res.status()).toBe(200);
      expect(h1Text(html)).toBe(notFoundTitle(locale));
      expect(h1Text(html)).not.toBe(other.title);
      expect(html).not.toContain("Second paragraph.");
      expect(robotsMeta(html)).toMatch(/^noindex/);
    });
  });
}

test("blog index lists Insight articles (not Posts) and the sitemap keeps its static behavior", async ({ request }) => {
  for (const locale of locales) {
    const blog = await (await request.get(`/${locale}/blog`)).text();
    // The index is the CMS `article` Insight view (see blog-listing.spec.ts); the Posts-based CMS post is not on it.
    expect(blog).toContain('data-content-source="cms"');
    expect(rendersElementText(blog, messages[locale].Blog.posts[0].title)).toBe(false);
    expect(rendersElementText(blog, CMS[locale].title)).toBe(false);
  }
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`/en/blog/${staticPost("en").slug}`);
  expect(sitemap).not.toContain(CMS.en.slug); // CMS posts are not in the sitemap (out of scope)
});
