import { describe, expect, it } from "vitest";
import { getBlogPost, nextBlogPosts, type BlogPost } from "@/lib/blog";
import en from "@/locales/en.json";

const post = (slug: string): BlogPost => ({
  slug,
  category: "Category",
  date: "2026-01-01",
  dateLabel: "1 January 2026",
  title: `Title ${slug}`,
  excerpt: "",
  body: [],
  image: "/image.jpg",
});

const slugs = (posts: BlogPost[]) => posts.map((p) => p.slug);
const posts = ["a", "b", "c", "d"].map(post);

describe("nextBlogPosts", () => {
  it("returns the following posts in publishing order", () => {
    expect(slugs(nextBlogPosts(posts, "a"))).toEqual(["b", "c"]);
  });

  it("wraps around to the start of the list", () => {
    expect(slugs(nextBlogPosts(posts, "c"))).toEqual(["d", "a"]);
    expect(slugs(nextBlogPosts(posts, "d"))).toEqual(["a", "b"]);
  });

  it("honours a custom count", () => {
    expect(slugs(nextBlogPosts(posts, "b", 3))).toEqual(["c", "d", "a"]);
  });

  it("falls back to the first posts for an unknown slug", () => {
    expect(slugs(nextBlogPosts(posts, "missing"))).toEqual(["a", "b"]);
  });

  // The blog page filters the current slug out afterwards; this pins the raw
  // helper output that filter relies on.
  it("includes the current post when count reaches past the list length", () => {
    expect(slugs(nextBlogPosts(posts.slice(0, 2), "a", 2))).toEqual(["b", "a"]);
  });

  it("works against the shipped EN posts", () => {
    const shipped = en.Blog.posts as BlogPost[];
    const [first, second, third] = shipped;
    expect(slugs(nextBlogPosts(shipped, first.slug))).toEqual([second.slug, third.slug]);
  });
});

describe("getBlogPost", () => {
  it("finds a post by slug and returns undefined otherwise", () => {
    expect(getBlogPost(posts, "c")?.title).toBe("Title c");
    expect(getBlogPost(posts, "missing")).toBeUndefined();
  });
});
