import type { Post, PostCard, PostListItem } from "@/lib/wp";
import type { BlogPost } from "@/lib/blog";
import type { Insight } from "@/lib/insights";

/**
 * Bridges backend WP `posts` onto the designed `BlogPost` / `Insight` shapes
 * the blog and insights sections render. Type-only import from `@/lib/wp`, so
 * this stays a pure (server-safe) module with no client/runtime coupling.
 */

/** Fallback card art for posts with no featured image (e.g. the WP default). */
const DEFAULT_IMAGE = "/assets/insights/i1.svg";

export function stripHtml(html: string | null): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split WP post HTML into plain-text paragraphs for the designed article body. */
function htmlToParagraphs(html: string | null): string[] {
  if (!html) return [];
  return html
    .split(/<\/p>|\n{2,}/i)
    .map((chunk) => stripHtml(chunk))
    .filter(Boolean);
}

function formatDate(iso: string, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

export function toBlogPost(p: Post | PostListItem, locale: string): BlogPost {
  const content = "content" in p ? p.content : null;
  const body = htmlToParagraphs(content);
  const excerpt = stripHtml(p.excerpt);
  return {
    slug: p.slug,
    category: p.categories[0]?.name || "Articles",
    date: p.date ? p.date.slice(0, 10) : "",
    dateLabel: formatDate(p.date, locale),
    title: p.title,
    excerpt,
    // Single-post pages need a body; fall back to the excerpt as one paragraph.
    body: body.length ? body : excerpt ? [excerpt] : [],
    image: p.image?.src || DEFAULT_IMAGE,
  };
}

/**
 * `linkable` lists the slugs whose blog detail page renders (static locale
 * posts plus CMS posts the route confirmed, see lib/blog-post). A post outside
 * it gets an empty `href`, which the card renders as plain, non-clickable
 * content instead of a link to a soft 404. Omit it to link every post.
 */
export function toInsight(p: PostCard, linkable?: ReadonlySet<string>): Insight {
  return {
    category: p.categories[0]?.name || "Insights",
    title: p.title,
    image: p.image?.src || DEFAULT_IMAGE,
    date: p.date || undefined,
    excerpt: stripHtml(p.excerpt) || undefined,
    href: !linkable || linkable.has(p.slug) ? `/blog/${p.slug}` : "",
  };
}

/** Cards shown in the Insights "Formats" section. */
export const INSIGHTS_LIMIT = 3;

/** The latest posts (WP returns newest first) as Insights cards. */
export function toInsights(
  posts: PostCard[],
  limit = INSIGHTS_LIMIT,
  linkable?: ReadonlySet<string>,
): Insight[] {
  return posts.slice(0, limit).map((p) => toInsight(p, linkable));
}
