// @vitest-environment jsdom
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Callout from "@/components/sections/insights/callout";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

const root = join(__dirname, "..", "..", "..");

// Motion's in-view trigger needs IntersectionObserver, which jsdom lacks.
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

describe.each([
  ["en", en, "What results has Infoline delivered?", "results"],
  ["ar", ar, "ما النتائج التي حققتها إنفولاين؟", "النتائج"],
] as const)("Insights callout (%s)", (locale, messages, heading, accent) => {
  const view = () =>
    render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Callout />
      </NextIntlClientProvider>,
    );

  it("keeps the approved heading copy", () => {
    const { container } = view();
    const h2 = container.querySelector("h2")!;
    expect(h2.textContent?.replace(/\s+/g, " ").trim()).toBe(heading);
  });

  it("accents only the key word with the brand-blue token", () => {
    const { container } = view();
    const accented = container.querySelectorAll("h2 > span.text-brandblue-500");
    expect(accented).toHaveLength(1);
    expect(accented[0].textContent?.trim()).toBe(accent);
  });
});

describe("Insights callout artwork", () => {
  it("uses the transparent person cut-out over a CSS circle, not a baked polygon", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={en}>
        <Callout />
      </NextIntlClientProvider>,
    );
    const img = container.querySelector("img")!;
    expect(decodeURIComponent(img.getAttribute("src")!)).toContain("callout-person.png");
    expect(existsSync(join(root, "public/assets/insights/callout-person.png"))).toBe(true);
    // PNG colour type 6 = RGBA, so the circle behind it stays visible.
    expect(readFileSync(join(root, "public/assets/insights/callout-person.png"))[25]).toBe(6);
    expect(container.querySelector('.rounded-full[class*="bg-[#74c0e7]"]')).not.toBeNull();
  });
});
