/**
 * Assertions on server-rendered HTML that cannot be satisfied by UI copy alone.
 *
 * The document also embeds the locale messages (RSC payload for client
 * components), so `html.includes("Articles")` is true whether or not any
 * element renders that text. These helpers look at rendered elements only.
 */

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'");

/** The text of the first `<h1>` (tags removed), or "" when there is none. */
export function h1Text(html: string): string {
  return stripTags(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "").trim();
}

/** True when some element's entire text is `text` (`>text<`; never JSON payload text). */
export function rendersElementText(html: string, text: string): boolean {
  return new RegExp(String.raw`>\s*${escapeRegExp(text)}\s*<`).test(html);
}

/** The `<meta name="robots">` content, or undefined when the page has none. */
export function robotsMeta(html: string): string | undefined {
  return /<meta name="robots" content="([^"]*)"/.exec(html)?.[1];
}
