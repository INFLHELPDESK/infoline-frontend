import { afterEach, describe, expect, it, vi } from "vitest";
import { loadBlogPost, renderableSlugs } from "@/lib/blog-post";
import type { BlogPost } from "@/lib/blog";
import { WpRequestError, wpFetch } from "@/lib/wp/client";
import { wpKeys } from "@/lib/wp/keys";
import { POST_BY_SLUG } from "@/lib/wp/queries";
import type { prefetchPost } from "@/lib/wp/server";
import en from "@/locales/en.json";
import { startCmsStub } from "../../support/cms-stub/harness";

/**
 * The blog detail lookup: static locale posts first, then the CMS through the
 * shared prefetch helper, with every outcome kept distinct. Real client,
 * normalizers and adapters against the CMS stub.
 */

const stub = startCmsStub();
const statics = en.Blog.posts as BlogPost[];
const SLUG = { en: "seasonal-peak", ar: "seasonal-peak-ar" };
const ops = () => stub.graphqlRequests().map((r) => [r.operation, r.variables?.id]);

afterEach(() => vi.restoreAllMocks());

describe("loadBlogPost", () => {
  it("serves a static post without asking the CMS", async () => {
    const r = await loadBlogPost(statics, statics[0].slug, "en");
    expect(r).toEqual({ kind: "static", post: statics[0] });
    expect(stub.graphqlRequests()).toHaveLength(0);
  });

  it.each(["en", "ar"] as const)("renders the %s CMS post (one PostBySlug + one locale list request)", async (locale) => {
    const r = await loadBlogPost(statics, SLUG[locale], locale);
    expect(r.kind).toBe("cms");
    if (r.kind !== "cms") return;
    expect(r.post.slug).toBe(SLUG[locale]);
    expect(r.post.body.length).toBeGreaterThan(1); // content paragraphs, not just the excerpt
    expect(r.post.dateLabel).not.toBe("");
    expect(ops()).toEqual([
      ["PostBySlug", SLUG[locale]],
      ["Posts", undefined],
    ]);
    expect(stub.graphqlRequests().at(-1)?.variables?.language).toBe(locale === "ar" ? "AR" : "EN");
  });

  it.each([
    ["en", "ar"],
    ["ar", "en"],
  ] as const)("a %s page does not render the %s post: it is not in the locale's own list", async (locale, other) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // The CMS answers the single-post query for any slug (no language argument),
    // so this is the case the list check exists for.
    const r = await loadBlogPost(statics, SLUG[other], locale);
    expect(r.kind).toBe("locale-mismatch");
  });

  it("does not repeat the locale check when the slug came from the locale list", async () => {
    const r = await loadBlogPost(statics, SLUG.en, "en", undefined, { slugFromLocaleList: true });
    expect(r.kind).toBe("cms");
    expect(ops()).toEqual([["PostBySlug", SLUG.en]]);
  });

  it("reports a failing locale list as an error, never as a mismatch", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await loadBlogPost(statics, SLUG.en, "en", undefined, {
      prefetchList: () => Promise.reject(new WpRequestError("http", "boom", { status: 503 })),
    });
    expect(r.kind).toBe("error");
  });

  it("resolves null (valid not-found) for an unknown slug", async () => {
    expect((await loadBlogPost(statics, "no-such-post", "en")).kind).toBe("not-found");
  });

  it("does not ask the CMS for an empty or absurd slug", async () => {
    expect((await loadBlogPost(statics, "", "en")).kind).toBe("not-found");
    expect((await loadBlogPost(statics, "x".repeat(500), "en")).kind).toBe("not-found");
    expect((await loadBlogPost(statics, "a b", "en")).kind).toBe("not-found");
    expect((await loadBlogPost(statics, "a.php?x=1", "en")).kind).toBe("not-found");
    expect(stub.graphqlRequests()).toHaveLength(0);
  });

  it("decodes a percent-encoded slug before the lookup", async () => {
    await loadBlogPost(statics, encodeURIComponent("بوست"), "ar");
    expect(ops()).toEqual([["PostBySlug", "بوست"]]);
  });

  it("treats the empty scenario as not-found (a valid answer, not a failure)", async () => {
    stub.setScenario("empty");
    expect((await loadBlogPost(statics, SLUG.en, "en")).kind).toBe("not-found");
  });

  it("treats a post with no body and no excerpt as incomplete", async () => {
    stub.setScenario("partial");
    expect((await loadBlogPost(statics, SLUG.en, "en")).kind).toBe("incomplete");
  });

  it("treats a null-acf post (no content, no excerpt) as incomplete", async () => {
    stub.setScenario("null-acf");
    expect((await loadBlogPost(statics, SLUG.en, "en")).kind).toBe("incomplete");
  });

  it.each([
    ["graphql-error", "graphql"],
    ["partial-errors", "graphql"],
    ["http-error", "http"],
    ["malformed-json", "malformed"],
    ["malformed-shape", "missing-root"],
    ["no-data", "malformed"],
    ["network-error", "network"],
  ] as const)("reports %s as an error (%s), never as not-found", async (scenario, kind) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stub.setScenario(scenario);
    const r = await loadBlogPost(statics, SLUG.en, "en");
    expect(r.kind).toBe("error");
    if (r.kind === "error") expect(r.failure.kind).toBe(kind);
  });

  it("reports a CMS timeout as an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stub.setScenario("hang");
    // Proves loadBlogPost classifies a timeout as an error. The request path here is a short-budget
    // copy of prefetchPost (production is 10s); the production path itself is covered by the
    // `hang` / `stalled-body` scenarios in tests/e2e/cms/cms-scenarios.spec.ts.
    const shortBudget: typeof prefetchPost = (qc, slug, locale) =>
      qc.fetchQuery({
        queryKey: wpKeys.post(slug, locale ?? "en"),
        queryFn: () =>
          wpFetch<{ post: null }>(POST_BY_SLUG, { id: slug }, undefined, {
            roots: ["post"],
            timeoutMs: 150,
          }).then(() => null),
      });
    const r = await loadBlogPost(statics, SLUG.en, "en", shortBudget);
    expect(r.kind).toBe("error");
    if (r.kind === "error") expect(r.failure.kind).toBe("timeout");
  });

  it("rethrows anything that is not a CMS failure", async () => {
    await expect(
      loadBlogPost(statics, SLUG.en, "en", () => Promise.reject(new Error("adapter bug"))),
    ).rejects.toThrow("adapter bug");
  });
});

describe("renderableSlugs", () => {
  it("keeps static and renderable CMS slugs, drops missing, incomplete and failed ones", async () => {
    const slugs = [statics[0].slug, SLUG.en, "ghost"];
    expect([...(await renderableSlugs(statics, slugs, "en"))].sort()).toEqual([SLUG.en, statics[0].slug].sort());

    stub.setScenario("partial");
    expect([...(await renderableSlugs(statics, slugs, "en"))]).toEqual([statics[0].slug]);

    vi.spyOn(console, "error").mockImplementation(() => {});
    stub.setScenario("http-error");
    expect([...(await renderableSlugs(statics, slugs, "en"))]).toEqual([statics[0].slug]);
  });
});
