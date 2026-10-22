import { describe, expect, it } from "vitest";
import { toBlogPost, toInsight } from "@/lib/content-adapters";
import { getPost, getPosts } from "@/lib/wp/api";
import { startCmsStub } from "../../support/cms-stub/harness";
import type { Post, PostListItem } from "@/lib/wp";

startCmsStub();

const base: PostListItem = {
  databaseId: 1,
  title: "Title",
  slug: "title",
  uri: "/blog/title/",
  date: "2026-03-05T09:30:00",
  excerpt: "<p>Excerpt &amp; more&nbsp;text</p>\n",
  image: { src: "/img.jpg", alt: "a" },
  categories: [{ name: "Cat", slug: "cat" }],
};

describe("toBlogPost", () => {
  it("maps a list item and strips HTML from the excerpt", () => {
    expect(toBlogPost(base, "en")).toEqual({
      slug: "title",
      category: "Cat",
      date: "2026-03-05",
      dateLabel: "05 Mar 2026",
      title: "Title",
      excerpt: "Excerpt & more text",
      body: ["Excerpt & more text"], // list items have no content: excerpt becomes the body
      image: "/img.jpg",
    });
  });

  it("splits a single post body into plain-text paragraphs", () => {
    const post: Post = { ...base, content: "<p>One</p>\n\n<p>Two <b>bold</b></p>" };
    expect(toBlogPost(post, "en").body).toEqual(["One", "Two bold"]);
  });

  it("falls back for missing category, image, body and excerpt", () => {
    const bare: Post = { ...base, categories: [], image: null, excerpt: null, content: null };
    expect(toBlogPost(bare, "en")).toMatchObject({
      category: "Articles",
      image: "/assets/insights/i1.svg",
      excerpt: "",
      body: [],
    });
  });

  it("formats the date per locale (en-GB vs ar)", () => {
    expect(toBlogPost(base, "en").dateLabel).toBe("05 Mar 2026");
    const ar = toBlogPost(base, "ar").dateLabel;
    expect(ar).not.toBe("05 Mar 2026");
    expect(ar).toMatch(/2026|٢٠٢٦/);
  });

  it.each([
    ["empty", ""],
    ["invalid", "not a date"],
  ])("%s date yields empty labels without throwing", (_n, date) => {
    const post = toBlogPost({ ...base, date }, "en");
    expect(post.dateLabel).toBe("");
    expect(post.date).toBe(date ? date.slice(0, 10) : "");
  });
});

describe("toInsight", () => {
  it("links to /blog/<slug> and falls back for category and image", () => {
    expect(toInsight(base)).toEqual({
      category: "Cat",
      title: "Title",
      image: "/img.jpg",
      date: "2026-03-05T09:30:00",
      excerpt: "Excerpt & more text",
      href: "/blog/title",
    });
    // Missing optional fields stay absent instead of rendering empty values.
    expect(toInsight({ ...base, date: "", excerpt: null })).toMatchObject({ date: undefined, excerpt: undefined });
    expect(toInsight({ ...base, categories: [], image: null })).toMatchObject({
      category: "Insights",
      image: "/assets/insights/i1.svg",
    });
  });
});

describe("toInsight link safety", () => {
  it("links only slugs the blog detail route can render", () => {
    expect(toInsight(base, new Set(["title"])).href).toBe("/blog/title");
    expect(toInsight(base, new Set(["other"])).href).toBe("");
    expect(toInsight(base, new Set()).href).toBe("");
  });
});

describe("adapters on stub data (EN / AR)", () => {
  it("adapts English and Arabic posts end to end", async () => {
    const [en] = await getPosts("en");
    const [ar] = await getPosts("ar");
    expect(toBlogPost(en, "en")).toMatchObject({ title: "How to staff a seasonal peak", category: "Articles" });
    const arPost = toBlogPost(ar, "ar");
    expect(arPost.title).toBe("كيف تُجهّز فريقك لموسم الذروة");
    expect(arPost.category).toBe("مقالات");
    expect(arPost.excerpt).toBe("كيف تُجهّز فريقك لموسم الذروة");
  });

  it("builds a body from the full post and falls back for null content", async () => {
    const post = await getPost("seasonal-peak");
    expect(toBlogPost(post!, "en").body).toEqual(["How to staff a seasonal peak", "Second paragraph."]);
  });
});
