// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Documents from "@/components/sections/about/documents";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

/**
 * About › Company documents (Figma 406:3687). No approved Company Profile PDF
 * exists yet (PQA-032), so the shipped data keeps `href: "#"`: the DOWNLOAD
 * action must be visible but disabled, never a link. The "available" branch is
 * exercised here with a fixture href that exists only inside this test.
 */

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

type Messages = typeof en;
const renderDocuments = (locale: "en" | "ar", messages: Messages | typeof ar = locale === "en" ? en : ar) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Documents />
    </NextIntlClientProvider>,
  );

describe("About › Documents", () => {
  it.each(["en", "ar"] as const)("shows a disabled DOWNLOAD action on both unavailable cards (%s)", (locale) => {
    const messages = locale === "en" ? en : ar;
    const { container } = renderDocuments(locale);

    // Shipped data has no real target.
    expect(messages.AboutPage.documents.items.map((i) => i.href)).toEqual(["#", "#"]);
    expect(container.querySelectorAll("a")).toHaveLength(0);

    const buttons = [...container.querySelectorAll("button")];
    expect(buttons).toHaveLength(2);
    buttons.forEach((button, i) => {
      const item = messages.AboutPage.documents.items[i];
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("type")).toBe("button");
      expect(button.textContent).toBe(item.cta);
      expect(button.getAttribute("aria-label")).toBe(`${item.cta}: ${item.title}`);
      // Figma overline/sm/medium: 13/16, uppercase, 1.5px tracking, with the arrow icon (rotated in RTL).
      expect(button.className).toContain("text-[13px]");
      expect(button.className).toContain("leading-4");
      expect(button.className).toContain("uppercase");
      expect(button.className).toContain("tracking-[1.5px]");
      expect(button.querySelector("svg")?.getAttribute("class")).toContain("rtl:rotate-180");
      // Not brand blue: it must not look like a working download.
      expect(button.className).toContain("text-slate-400");
      expect(button.className).not.toContain("text-brandblue-500");
    });
  });

  it("turns a card into a download link, brand blue, once its href is real (fixture only)", () => {
    const fixture = structuredClone(en) as Messages;
    fixture.AboutPage.documents.items[0].href = "/fixture/company-profile-en.pdf";
    const { container } = renderDocuments("en", fixture);

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    const link = links[0];
    // A plain anchor: the i18n Link would prefix the locale onto a file path.
    expect(link.getAttribute("href")).toBe("/fixture/company-profile-en.pdf");
    expect(link.hasAttribute("download")).toBe(true);
    expect(link.className).toContain("focus-visible:outline-brandblue-500");
    const action = [...link.querySelectorAll("span")].find((s) => s.textContent === fixture.AboutPage.documents.items[0].cta)!;
    expect(action.className).toContain("text-brandblue-500");
    expect(action.className).toContain("uppercase");

    // The other card stays unavailable.
    expect(container.querySelectorAll("button:disabled")).toHaveLength(1);
  });
});
