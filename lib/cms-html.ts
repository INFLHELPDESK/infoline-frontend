/**
 * Allowlist sanitizer for CMS article HTML (WordPress `content`). Pure and
 * server-safe: it re-emits only the tags and attributes below, built from
 * scratch, so nothing the CMS sends is ever passed through verbatim.
 *
 * - Tags outside the allowlist are dropped but their text is kept; script-like
 *   elements are dropped together with their content. Comments are dropped.
 * - Attributes kept: `href` on `<a>` (http(s), `mailto:`, `tel:`, `#fragment` and
 *   root-relative paths; everything else, `javascript:`, `data:`, protocol-relative
 *   and bare relative URLs, loses its link, keeping the text) and, on `<img>`,
 *   `src` (http(s) or root-relative only), `alt` and numeric `width`/`height`.
 *   An `<img>` without a safe `src` is dropped. Images are emitted lazy-loaded.
 * - `<figure>` and `<figcaption>` are kept (structure only, no attributes).
 * - External links open in a new tab with `noopener noreferrer`. Root-relative
 *   links in Arabic content get the `/ar` segment the router expects.
 * - Tags are rebalanced, so malformed CMS markup cannot leak into the page shell.
 */

const ALLOWED = new Set([
  "p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "blockquote", "a", "br", "img", "figure", "figcaption",
]);
const VOID = new Set(["br", "img"]);
/** Headings are demoted so the page keeps one `h1`. */
const RENAME: Record<string, string> = { h1: "h2", h5: "h4", h6: "h4" };
/** Dropped together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "textarea", "title",
]);

const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const HREF = /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

/** Value of attribute `name` in a raw attribute string, or null. */
function attrValue(attrs: string, name: string): string | null {
  const m = new RegExp(`(?:^|[\\s"'])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(attrs);
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
}

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", colon: ":", tab: "\t", newline: "\n" };

function decodeEntities(value: string): string {
  return value.replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));?/gi, (whole, hex, dec, name) => {
    if (name) return NAMED_ENTITIES[name.toLowerCase()] ?? whole;
    const code = hex ? parseInt(hex, 16) : parseInt(dec, 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

const escapeText = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export type CmsLinkKind = "internal" | "external" | "anchor" | "contact";

/** Classifies a raw `href`; null when the link is not allowed. */
export function resolveCmsHref(
  raw: string,
  locale: "en" | "ar",
): { href: string; kind: CmsLinkKind } | null {
  // Browsers ignore control characters and whitespace inside a scheme.
  const value = decodeEntities(raw).replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (!value) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("#")) return { href: value, kind: "anchor" };
  if (value.startsWith("/")) {
    const path = locale === "ar" && !/^\/ar(\/|$|[?#])/.test(value) ? `/ar${value}` : value;
    return { href: path, kind: "internal" };
  }
  if (/^https?:\/\/[^/?#]/i.test(value)) return { href: value, kind: "external" };
  if (/^(mailto|tel):/i.test(value)) return { href: value, kind: "contact" };
  return null;
}

/** Image URLs: http(s) or a single-slash root-relative path; never data:, javascript: or protocol-relative. */
export function resolveCmsImageSrc(raw: string): string | null {
  const value = decodeEntities(raw).replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (!value || value.startsWith("//")) return null;
  if (value.startsWith("/") || /^https?:\/\/[^/?#]/i.test(value)) return value;
  return null;
}

export function sanitizeCmsHtml(html: string | null | undefined, locale: "en" | "ar" = "en"): string {
  if (!html) return "";
  const out: string[] = [];
  const open: string[] = [];
  let skipping: string | null = null;
  let droppedAnchors = 0;
  let last = 0;

  const text = (chunk: string) => {
    if (!skipping && chunk) out.push(escapeText(chunk));
  };
  const closeTo = (name: string) => {
    while (open.length) {
      const top = open.pop() as string;
      out.push(`</${top}>`);
      if (top === name) break;
    }
  };

  for (const match of html.matchAll(TAG)) {
    text(html.slice(last, match.index));
    last = match.index + match[0].length;
    const [, slash, rawName, attrs] = match;
    if (rawName === undefined) continue; // comment

    const name = rawName.toLowerCase();
    const closing = slash === "/";

    if (skipping) {
      if (closing && name === skipping) skipping = null;
      continue;
    }
    if (DROP_WITH_CONTENT.has(name)) {
      if (!closing && !/\/\s*$/.test(attrs)) skipping = name;
      continue;
    }

    const tag = RENAME[name] ?? name;
    if (!ALLOWED.has(tag)) continue;

    if (closing) {
      if (tag === "a" && droppedAnchors > 0) droppedAnchors -= 1; // the close of a link we dropped
      else if (!VOID.has(tag) && open.includes(tag)) closeTo(tag);
      continue;
    }
    if (tag === "img") {
      const src = resolveCmsImageSrc(attrValue(attrs, "src") ?? "");
      if (!src) continue;
      const alt = decodeEntities(attrValue(attrs, "alt") ?? "");
      const size = (n: string) => {
        const v = attrValue(attrs, n);
        return v && /^\d{1,5}$/.test(v) && Number(v) > 0 ? ` ${n}="${v}"` : "";
      };
      out.push(
        `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${size("width")}${size("height")} loading="lazy" decoding="async">`,
      );
      continue;
    }
    if (VOID.has(tag)) {
      out.push(`<${tag}>`);
      continue;
    }
    if (tag === "a") {
      const raw = HREF.exec(attrs);
      const link = raw ? resolveCmsHref(raw[1] ?? raw[2] ?? raw[3] ?? "", locale) : null;
      if (!link) {
        droppedAnchors += 1; // no usable href: keep the text, drop the link
        continue;
      }
      // Anchors do not nest: close an open one first.
      if (open.includes("a")) closeTo("a");
      out.push(
        link.kind === "external"
          ? `<a href="${escapeAttr(link.href)}" target="_blank" rel="noopener noreferrer">`
          : `<a href="${escapeAttr(link.href)}">`,
      );
      open.push("a");
      continue;
    }
    out.push(`<${tag}>`);
    open.push(tag);
  }
  text(html.slice(last));
  while (open.length) out.push(`</${open.pop()}>`);
  return out.join("").trim();
}
