import { test, expect } from "../support/fixtures";
import { dirFor, locales, messages } from "../support/messages";

/** Locale-stripped public routes (mirrors app/sitemap.ts plus one blog post). */
const ROUTES = [
  "",
  "/about",
  "/solutions",
  "/industries",
  "/case-studies",
  "/insights",
  "/careers",
  "/contact",
  "/blog",
  `/blog/${messages.en.Blog.posts[0].slug}`,
];

test.describe("route smoke", () => {
  for (const locale of locales) {
    for (const path of ROUTES) {
      test(`/${locale}${path} renders with layout, direction and SEO links`, async ({
        page,
        baseURL,
      }) => {
        const response = await page.goto(`/${locale}${path}`);
        expect(response?.status()).toBe(200);

        const html = page.locator("html");
        await expect(html).toHaveAttribute("lang", locale);
        await expect(html).toHaveAttribute("dir", dirFor(locale));

        // Exactly one page heading.
        await expect(page.locator("main h1")).toHaveCount(1);
        await expect(page.locator("main h1")).not.toBeEmpty();

        // Header (desktop nav) and footer from the shared layout.
        const nav = page.locator("header nav");
        for (const item of messages[locale].Header.nav) {
          await expect(nav.getByRole("link", { name: item.label, exact: true })).toBeVisible();
        }
        const footer = page.locator("footer");
        for (const column of messages[locale].Footer.columns) {
          await expect(footer.getByText(column.title, { exact: true })).toBeAttached();
        }

        // Canonical + hreflang come from lib/site localeAlternates.
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `${baseURL}/${locale}${path}`,
        );
        for (const l of locales) {
          await expect(page.locator(`link[rel="alternate"][hreflang="${l}"]`)).toHaveAttribute(
            "href",
            `${baseURL}/${l}${path}`,
          );
        }
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
          "href",
          `${baseURL}/en${path}`,
        );
      });
    }
  }
});

test.describe("home page content", () => {
  for (const locale of locales) {
    test(`/${locale} shows the localized title and hero`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page).toHaveTitle(messages[locale].Metadata.title);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main section").first()).toBeVisible();
    });
  }
});

test.describe("locale resolution", () => {
  test("bare / redirects to the default locale for an English browser", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("bare / redirects to /ar for an Arabic Accept-Language", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale: "ar-OM" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await context.close();
  });

  test("unprefixed paths redirect into the default locale", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL(/\/en\/about$/);
  });

  test("unknown paths render the themed noindex 'coming soon' page with HTTP 200", async ({
    page,
  }) => {
    const response = await page.goto("/en/this-route-does-not-exist");
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeAttached();
  });

  test("unknown blog slugs render a noindex soft 404 linking back to the blog", async ({
    page,
  }) => {
    const response = await page.goto("/en/blog/no-such-post");
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("main h1")).toHaveText(
      messages.en.Blog.page.single.notFoundTitle,
    );
    await expect(
      page.getByRole("link", { name: messages.en.Blog.page.single.notFoundCta }),
    ).toHaveAttribute("href", "/en/blog");
  });
});

test.describe("blog article", () => {
  test("lists the next two posts in publishing order", async ({ page }) => {
    const [first, second, third] = messages.en.Blog.posts;
    await page.goto(`/en/blog/${first.slug}`);
    await expect(page.locator("main h1")).toHaveText(first.title);
    await expect(page.locator(`main a[href="/en/blog/${second.slug}"]`).first()).toBeAttached();
    await expect(page.locator(`main a[href="/en/blog/${third.slug}"]`).first()).toBeAttached();
  });
});
