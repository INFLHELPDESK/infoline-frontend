// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cta from "@/components/sections/insights/cta";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  // Parallax reads the reduced-motion preference, which jsdom lacks.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe("Insights closing CTA", () => {
  it("renders exactly the two approved English buttons and their destinations", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={en}>
        <Cta />
      </NextIntlClientProvider>,
    );
    expect(container.querySelector("h3")?.textContent).toBe("Want the detail behind the result?");
    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => [a.textContent?.trim(), a.getAttribute("href")])).toEqual([
      ["View Case Studies", "/case-studies"],
      ["Discuss Your Operation", "/contact"],
    ]);
  });

  it("keeps locale key parity and the same destinations in Arabic", () => {
    const cta = ar.InsightsPage.cta;
    expect(cta.button.href).toBe("/case-studies");
    expect(cta.secondaryButton.href).toBe("/contact");
    expect(Object.keys(cta).sort()).toEqual(Object.keys(en.InsightsPage.cta).sort());
  });
});
