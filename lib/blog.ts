export type BlogPost = {
  slug: string;
  /** CMS Insight id; set only on CMS-backed posts (de-duplicates paged results). */
  id?: number;
  /** Router path to open instead of `/blog/<slug>`; set only on CMS-backed posts. */
  href?: string;
  category: string;
  date: string; // ISO, used for ordering
  dateLabel: string; // localized display date
  title: string;
  excerpt: string;
  body: string[]; // article paragraphs
  image: string;
};

/** Event metadata the article hero can show (CMS Insights of type `event`); each field optional. */
export type PostEvent = {
  start: string | null;
  end: string | null;
  location: string | null;
  url: string | null;
};

export function getBlogPost(posts: BlogPost[], slug: string) {
  return posts.find((p) => p.slug === slug);
}

/** The next posts in publishing order after the given one (wraps around). */
export function nextBlogPosts(posts: BlogPost[], slug: string, count = 2) {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return posts.slice(0, count);
  return Array.from({ length: count }, (_, k) => posts[(i + 1 + k) % posts.length]);
}
