/**
 * The rendered "Formats" section of a server-rendered /insights page. The
 * whole document also carries the RSC payload (dehydrated posts, the static
 * fallback props), so card assertions must look at this markup only.
 */
export function formatsSection(html: string): string {
  const match = /<section[^>]*data-content-source[\s\S]*?<\/section>/.exec(html);
  if (!match) throw new Error("no Formats section (data-content-source) in the server HTML");
  return match[0];
}

/**
 * The dehydrated React Query state the page streams to the browser (inside the
 * RSC payload, so its quotes are backslash-escaped, to a depth that varies).
 * Only this region is asserted on for payload size and contents: the document
 * as a whole also carries the locale messages, which legitimately contain
 * words like "excerpt".
 */
export function dehydratedQueries(html: string): string {
  const match = /\\*"queries\\*":\[\{[\s\S]*?\\*"queryHash\\*"/.exec(html);
  if (!match) throw new Error("no dehydrated query state in the server HTML");
  return match[0];
}

/** True when the escaped payload has a JSON object key `key`. */
export function payloadHasKey(payload: string, key: string): boolean {
  return new RegExp(`\\\\*"${key}\\\\*":`).test(payload);
}

/** Fields a whole CMS list item has and a teaser card must not. */
export const NON_CARD_FIELDS = ["databaseId", "excerpt", "uri", "date", "content"];
