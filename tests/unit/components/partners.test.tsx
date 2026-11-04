// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Partners, { MARQUEE_COPIES } from "@/components/sections/home/partners";
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

    // Every track repeats its logo group MARQUEE_COPIES times in the same order;
    // only the first group is exposed to assistive technology.
    tracks.forEach((track, row) => {
      const items = [...track.querySelectorAll("li")];
      const group = visible[row].length;
      expect(items).toHaveLength(group * MARQUEE_COPIES);
      expect(track.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(group * (MARQUEE_COPIES - 1));
      const srcs = items.map((li) => li.querySelector("img")!.getAttribute("src"));
      for (let copy = 1; copy < MARQUEE_COPIES; copy++) {
        expect(srcs.slice(copy * group, (copy + 1) * group)).toEqual(srcs.slice(0, group));
      }
      for (const li of items.slice(group)) expect(li.querySelector("img")!.getAttribute("alt")).toBe("");
    });
  });

  it("travels exactly one logo group per cycle and covers screens up to 2560px", () => {
    const { container } = renderPartners("en");
    const css = container.querySelector("style")!.textContent!;
    const travel = `translateX(${-100 / MARQUEE_COPIES}%)`;
    expect(css).toMatch(new RegExp(`partners-left \\{ from \\{ transform: translateX\\(0\\); \\} to \\{ transform: ${travel.replace(/[()%.]/g, "\\$&")}; \\} \\}`));
    expect(css).toMatch(new RegExp(`partners-right \\{ from \\{ transform: ${travel.replace(/[()%.]/g, "\\$&")}; \\} to \\{ transform: translateX\\(0\\); \\} \\}`));
    expect(css).toContain("partners-left 40s linear infinite");
    expect(css).toContain("partners-right 40s linear infinite");

    // Pills are fixed-width (165px + 2 x 8px margin), so a group's width is known
    // without layout. A track covers the row while visible width <= (copies - 1) x group.
    const pill = container.querySelector("ul.partners-track li")!;
    expect(pill.className).toContain("sm:w-[165px]");
    expect(pill.className).toContain("sm:mx-2");
    const narrowestGroup = Math.min(...[...container.querySelectorAll("ul.partners-track")].map((t) => (t.children.length / MARQUEE_COPIES) * 181));
    expect(narrowestGroup).toBe(1448);
    expect((MARQUEE_COPIES - 1) * narrowestGroup).toBeGreaterThanOrEqual(2560);
  });

  it("shrinks pills on mobile so 3-4 show at 375px without distorting logos", () => {
    const { container } = renderPartners("en");
    const pill = container.querySelector("ul.partners-track li")!;
    const img = pill.querySelector("img")!;
    // Mobile base: 100px pill + 2 x 4px margin = 108px, so 375px shows ~3.5 pills.
    expect(pill.className).toMatch(/(^| )w-\[100px\]/);
    expect(pill.className).toMatch(/(^| )mx-1( |$)/);
    expect(375 / 108).toBeGreaterThanOrEqual(3);
    expect(375 / 108).toBeLessThanOrEqual(4);
    // Logo keeps object-contain (original aspect ratio) at both sizes.
    expect(img.className).toContain("object-contain");
    expect(img.className).toMatch(/(^| )w-\[68px\]/);
    expect(img.className).toContain("sm:w-[86px]");
  });
});
