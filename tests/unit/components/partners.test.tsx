// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Partners from "@/components/sections/home/partners";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(cleanup);

const renderPartners = (locale: "en" | "ar") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      <Partners />
    </NextIntlClientProvider>,
  );

describe("Home › Partners", () => {
  it.each(["en", "ar"] as const)("uses the Figma heading and body tokens (%s)", (locale) => {
    const { container } = renderPartners(locale);
    const messages = locale === "en" ? en : ar;
    const heading = container.querySelector("h2")!;
    const description = container.querySelector("section p")!;

    // Figma heading/2xl/bold: Avenir Black, weight 800, 36/44 from sm.
    expect(heading.className).toContain("font-extrabold");
    expect(heading.className).toContain("sm:text-[36px]");
    expect(heading.className).toContain("sm:leading-11");
    expect(heading.className).not.toContain("font-bold");
    expect(heading.textContent).toBe(messages.Partners.title);

    // Figma content/base/inverse-tertiary: #90A4AE (--color-slate-300).
    expect(description.className).toContain("text-slate-300");
    expect(description.className).not.toContain("text-slate-400");
    expect(description.textContent).toBe(messages.Partners.description);
  });

  it("keeps two opposing, seamless rows of the 17 partner logos", () => {
    const { container } = renderPartners("en");
    const tracks = [...container.querySelectorAll("ul.partners-track")];
    expect(tracks.map((t) => t.className)).toEqual([
      "partners-track partners-track--left",
      "partners-track partners-track--right",
    ]);

    const visible = tracks.map((t) => [...t.querySelectorAll("li:not([aria-hidden]) img")].map((i) => i.getAttribute("alt")));
    expect(visible.map((row) => row.length)).toEqual([8, 9]);
    expect(new Set(visible.flat()).size).toBe(17);

    // Each track holds an identical aria-hidden copy, so the −50% travel loops seamlessly.
    for (const track of tracks) {
      const items = track.querySelectorAll("li");
      const hidden = track.querySelectorAll("li[aria-hidden]");
      expect(hidden.length * 2).toBe(items.length);
    }
  });
});
