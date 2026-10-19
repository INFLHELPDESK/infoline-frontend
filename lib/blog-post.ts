import type { BlogPost } from "@/lib/blog";
import { getBlogPost } from "@/lib/blog";
import { toBlogPost } from "@/lib/content-adapters";
import { WpConfigError, isWpRequestError, type WpFailureKind } from "@/lib/wp/client";
import { prefetchPost, prefetchPosts } from "@/lib/wp/server";
import type { WpLocale } from "@/lib/wp/api";
import { getQueryClient } from "@/providers/query-client/get-query-client";

/**
 * What the blog detail route has for a slug. Only `static` and `cms` render an
 * article; the rest are distinct so the route can answer each correctly:
 * - `static`      post from the locale copy (never asks the CMS)
 * - `cms`         WordPress post with a title and a body
 * - `not-found`   the CMS answered and has no such post
 * - `incomplete`  the CMS has the post but it cannot be shown (no title or body)
 * - `locale-mismatch`  the CMS has the slug but the locale's own post list does not
 *                  (see "Locale safety" on `loadBlogPost`); treated like not-found
 * - `error`       the CMS request failed; says nothing about whether the post exists
 */
export type BlogPostResult =
  | { kind: "static"; post: BlogPost }
  | { kind: "cms"; post: BlogPost }
  | { kind: "not-found" }
  | { kind: "incomplete" }
  | { kind: "locale-mismatch" }
  | { kind: "error"; error: unknown; failure: { kind: WpFailureKind | "config"; status?: number } };

/**
 * Slugs sent to the CMS: letters, digits, `-` and `_` only (WordPress slugs,
 * including non-Latin ones), bounded. Anything else cannot be a real post, so
 * junk URLs never become upstream requests or data-cache entries.
 */
const MAX_SLUG_LENGTH = 100;
const SLUG_PATTERN = /^[\p{L}\p{N}_-]+$/u;

export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export type LoadBlogPostOptions = {
  /** Post list lookup used for the locale check (defaults to the shared prefetch helper). */
  prefetchList?: typeof prefetchPosts;
  /**
   * The caller already got `slug` from this locale's post list (Insights cards),
   * so the locale check would only repeat that request.
   */
  slugFromLocaleList?: boolean;
};

/**
 * Locale safety. The single-post query (`post(id: $slug, idType: SLUG)`) has no
 * language argument and the post carries no language field, so a slug that
 * belongs to the other locale resolves just as well. Nothing in the existing
 * contract identifies a post's locale (`uri` is not evidence: the stub's AR
 * post has no `/ar` prefix), and no WPML field is assumed. The only locale
 * signal the repo already relies on is `posts(where: { language })`, so a CMS
 * post renders only if its slug is in that locale's list (newest 100, the
 * existing `getPosts` bound); anything else is `locale-mismatch`.
 *
 * This fails closed on the contract, not on proof: it protects only while the
 * backend enforces the `language` filter on `posts` (WPML activation is a
 * production blocker, see the WS-05C-3 report), and a post older than the list
 * bound is not served.
 *
 * Static locale posts win (no CMS traffic, existing pages unchanged); any other
 * slug is looked up in WordPress through the shared prefetch helper. Only CMS
 * infrastructure failures become `error`; anything else is a bug and rethrown.
 */
export async function loadBlogPost(
  staticPosts: BlogPost[],
  rawSlug: string,
  locale: WpLocale,
  prefetch: typeof prefetchPost = prefetchPost,
  { prefetchList = prefetchPosts, slugFromLocaleList = false }: LoadBlogPostOptions = {},
): Promise<BlogPostResult> {
  const slug = decodeSlug(rawSlug);
  const known = getBlogPost(staticPosts, slug);
  if (known) return { kind: "static", post: known };
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) return { kind: "not-found" };

  try {
    const wp = await prefetch(getQueryClient(), slug, locale);
    if (!wp) return { kind: "not-found" };
    if (!slugFromLocaleList) {
      const listed = await prefetchList(getQueryClient(), locale);
      if (!listed.some((p) => p.slug === wp.slug)) {
        console.warn("[blog] CMS post is not in this locale's post list; not rendering it");
        return { kind: "locale-mismatch" };
      }
    }
    const post = toBlogPost(wp, locale);
    if (!post.title.trim() || post.body.length === 0) return { kind: "incomplete" };
    return { kind: "cms", post };
  } catch (error) {
    const failure = isWpRequestError(error)
      ? { kind: error.kind, ...(error.status === undefined ? {} : { status: error.status }) }
      : error instanceof WpConfigError
        ? { kind: "config" as const }
        : null;
    if (!failure) throw error;
    console.error(
      `[blog] CMS unavailable for post (${failure.kind}${"status" in failure ? ` ${failure.status}` : ""})`,
    );
    return { kind: "error", error, failure };
  }
}

/**
 * The subset of `slugs` that open a renderable blog detail page. Used to link
 * Insights cards only to destinations that exist; a failed or unusable lookup
 * leaves the card unlinked.
 */
export async function renderableSlugs(
  staticPosts: BlogPost[],
  slugs: string[],
  locale: WpLocale,
  prefetch: typeof prefetchPost = prefetchPost,
): Promise<Set<string>> {
  const results = await Promise.all(
    slugs.map(async (slug) => {
      const r = await loadBlogPost(staticPosts, slug, locale, prefetch, {
        slugFromLocaleList: true,
      });
      return r.kind === "static" || r.kind === "cms" ? slug : null;
    }),
  );
  return new Set(results.filter((s): s is string => s !== null));
}
