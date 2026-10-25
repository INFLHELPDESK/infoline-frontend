import { describe, expect, it } from "vitest";
import { resolveCmsHref, sanitizeCmsHtml } from "@/lib/cms-html";

describe("sanitizeCmsHtml", () => {
  it("keeps the allowed structure", () => {
    const html = "<h2>Title</h2><p>One <strong>two</strong> <em>three</em></p><ul><li>a</li></ul><blockquote>q</blockquote>";
    expect(sanitizeCmsHtml(html)).toBe(html);
  });

  it("drops script-like elements together with their content", () => {
    const out = sanitizeCmsHtml('<p>a</p><script>alert(1)</script><style>p{}</style><iframe src="x">inner</iframe><p>b</p>');
    expect(out).toBe("<p>a</p><p>b</p>");
  });

  it("strips every attribute except a vetted href, including event handlers", () => {
    const out = sanitizeCmsHtml('<p onclick="x()" style="color:red" class="c">t <img src=x onerror="y()"></p>');
    expect(out).toBe("<p>t </p>");
  });

  it("drops comments and unknown tags but keeps their text", () => {
    expect(sanitizeCmsHtml("<!-- c --><div><span>kept</span></div>")).toBe("kept");
  });

  it("demotes h1 so the page keeps a single h1", () => {
    expect(sanitizeCmsHtml("<h1>x</h1>")).toBe("<h2>x</h2>");
  });

  it("escapes stray angle brackets and rebalances unclosed tags", () => {
    expect(sanitizeCmsHtml("<p>1 < 2 and <b>bold")).toBe("<p>1 &lt; 2 and <b>bold</b></p>");
    expect(sanitizeCmsHtml("</p>text</li>")).toBe("text");
  });

  it("returns an empty string for nothing", () => {
    expect(sanitizeCmsHtml(null)).toBe("");
    expect(sanitizeCmsHtml("")).toBe("");
  });

  describe("links", () => {
    it("opens external links safely in a new tab", () => {
      expect(sanitizeCmsHtml('<a href="https://example.test/a?x=1&y=2">x</a>')).toBe(
        '<a href="https://example.test/a?x=1&amp;y=2" target="_blank" rel="noopener noreferrer">x</a>',
      );
    });

    it("leaves internal links in-tab, and prefixes /ar only for Arabic", () => {
      expect(sanitizeCmsHtml('<a href="/services">s</a>', "en")).toBe('<a href="/services">s</a>');
      expect(sanitizeCmsHtml('<a href="/services">s</a>', "ar")).toBe('<a href="/ar/services">s</a>');
    });

    it("never duplicates the locale prefix", () => {
      expect(sanitizeCmsHtml('<a href="/ar/services">s</a>', "ar")).toBe('<a href="/ar/services">s</a>');
      expect(resolveCmsHref("/ar", "ar")?.href).toBe("/ar");
      expect(resolveCmsHref("/arabic-news", "ar")?.href).toBe("/ar/arabic-news");
    });

    it.each([
      'javascript:alert(1)',
      ' JaVa\tScRiPt:alert(1)',
      "jav&#x61;script:alert(1)",
      "&#106;avascript:alert(1)",
      "data:text/html,<script>1</script>",
      "vbscript:x",
      "//evil.test/x",
      "relative/path",
      "",
    ])("drops the link but keeps the text for %j", (href) => {
      expect(sanitizeCmsHtml(`<a href="${href}">label</a>`)).toBe("label");
    });

    it("drops an anchor with no href and does not let its close tag end an outer link", () => {
      expect(sanitizeCmsHtml('<a href="/x">out <a name="n">in</a> after</a>')).toBe('<a href="/x">out in after</a>');
    });

    it("keeps fragment, mailto and tel links", () => {
      expect(sanitizeCmsHtml('<a href="#top">t</a><a href="mailto:a@b.test">m</a><a href="tel:+96812345678">p</a>')).toBe(
        '<a href="#top">t</a><a href="mailto:a@b.test">m</a><a href="tel:+96812345678">p</a>',
      );
    });

    it("escapes quotes inside an href so it cannot break out of the attribute", () => {
      const out = sanitizeCmsHtml("<a href='https://example.test/\"onmouseover=\"x'>l</a>");
      expect(out).toBe(
        '<a href="https://example.test/&quot;onmouseover=&quot;x" target="_blank" rel="noopener noreferrer">l</a>',
      );
    });
  });
});

describe("images and figures", () => {
  it("keeps a safe image with alt and size, lazy-loaded, and drops other attributes", () => {
    expect(
      sanitizeCmsHtml('<img src="https://cms.test/a.jpg?x=1&y=2" alt="A &amp; B" width="800" height="400" class="c" onerror="x()" srcset="evil 1x">'),
    ).toBe('<img src="https://cms.test/a.jpg?x=1&amp;y=2" alt="A &amp; B" width="800" height="400" loading="lazy" decoding="async">');
  });

  it("keeps figure and figcaption, and an image with no alt gets an empty one", () => {
    expect(sanitizeCmsHtml('<figure class="w"><img src="/wp/a.png"><figcaption>Cap <em>x</em></figcaption></figure>')).toBe(
      '<figure><img src="/wp/a.png" alt="" loading="lazy" decoding="async"><figcaption>Cap <em>x</em></figcaption></figure>',
    );
  });

  it.each(["javascript:alert(1)", "data:image/svg+xml,<svg/>", "//evil.test/a.png", "a.png", " jav&#x61;script:x", ""])(
    "drops an image with unsafe src %j",
    (src) => {
      expect(sanitizeCmsHtml(`<p>t<img src="${src}" alt="a"></p>`)).toBe("<p>t</p>");
    },
  );

  it("does not prefix /ar on image paths", () => {
    expect(sanitizeCmsHtml('<img src="/wp/a.png" alt="">', "ar")).toContain('src="/wp/a.png"');
  });
});
