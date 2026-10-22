// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import WhatChangesToggle from "@/components/sections/home-1/what-changes-toggle";
import WhatChanges from "@/components/sections/home-1/what-changes";

// Entrance animation is framer-motion (IntersectionObserver); out of scope here.
vi.mock("@/components/ui/motion", async () => {
  const React = await import("react");
  const passthrough = (tag: string) =>
    function Stub({ children, as, className }: { children?: React.ReactNode; as?: string; className?: string }) {
      return React.createElement(as ?? tag, { className }, children);
    };
  return { Stagger: passthrough("div"), StaggerItem: passthrough("div") };
});
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// jsdom does not apply [hidden]; resolve the visible panel through the selected tab.
function activePanel() {
  const tab = screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true")!;
  const panel = document.getElementById(tab.getAttribute("aria-controls")!)!;
  expect(panel.hasAttribute("hidden")).toBe(false);
  return panel;
}

afterEach(cleanup);

const locales = { en, ar } as const;

function renderIn(locale: "en" | "ar", ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locales[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}

for (const locale of ["en", "ar"] as const) {
  const copy = locales[locale].HomeV1.whatChanges;

  describe(`What changes — toggle design (${locale})`, () => {
    it("starts on Without Infoline, with the Figma pills for that state only visible", () => {
      renderIn(locale, <WhatChangesToggle />);
      const tabs = screen.getAllByRole("tab");
      expect(tabs.map((t) => t.textContent)).toEqual([copy.columns.without, copy.columns.with]);
      expect(tabs[0].getAttribute("aria-selected")).toBe("true");

      const panel = activePanel();
      for (const row of copy.rows) expect(within(panel).getByText(row.without)).toBeTruthy();
      expect(within(panel).queryByText(copy.rows[0].with)).toBeNull();
    });

    it("switches to With Infoline: its pills and the business-impact pills show", () => {
      renderIn(locale, <WhatChangesToggle />);
      fireEvent.click(screen.getByRole("tab", { name: copy.columns.with }));

      expect(screen.getByRole("tab", { name: copy.columns.with }).getAttribute("aria-selected")).toBe("true");
      const panel = activePanel();
      for (const row of copy.rows) {
        expect(within(panel).getByText(row.with)).toBeTruthy();
        expect(within(panel).getByText(row.impact)).toBeTruthy();
        expect(within(panel).queryByText(row.without)).toBeNull();
      }
      expect(within(panel).getAllByRole("listitem")).toHaveLength(8);
    });

    it("pairs every tab with its panel and supports arrow keys", () => {
      renderIn(locale, <WhatChangesToggle />);
      const [first, second] = screen.getAllByRole("tab");
      expect(first.getAttribute("aria-controls")).toBeTruthy();
      expect(document.getElementById(first.getAttribute("aria-controls")!)).toBeTruthy();

      first.focus();
      fireEvent.keyDown(first, { key: "ArrowRight" });
      expect(second.getAttribute("aria-selected")).toBe("true");
      expect(document.activeElement).toBe(second);
      fireEvent.keyDown(second, { key: "Home" });
      expect(first.getAttribute("aria-selected")).toBe("true");
    });

    it("renders the section header copy and no invented content", () => {
      renderIn(locale, <WhatChangesToggle />);
      const header = locales[locale].HomeV1.whatChangesToggle;
      expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(header.title);
      expect(screen.getByText(copy.eyebrow)).toBeTruthy();
      expect(screen.getByText(header.description)).toBeTruthy();
      expect(screen.queryByText(copy.title)).toBeNull();
      expect(screen.queryByText(copy.description)).toBeNull();
    });

    it("uses logical offsets and no motion beyond a colour transition (reduced-motion safe)", () => {
      const { container } = renderIn(locale, <WhatChangesToggle />);
      expect(container.innerHTML).not.toMatch(/animate|framer|transition-transform|translate-/);
      for (const tab of screen.getAllByRole("tab")) {
        expect(tab.className).toContain("motion-reduce:transition-none");
      }
      fireEvent.click(screen.getByRole("tab", { name: copy.columns.with }));
      const offset = [...container.querySelectorAll<HTMLElement>("li[style]")];
      expect(offset.length).toBeGreaterThan(0);
      for (const li of offset) expect(li.getAttribute("style")).toMatch(/margin-inline-(start|end)/);
    });
  });
}

describe("What changes — existing three-column design still works", () => {
  it("renders Without / With / Business impact columns and the CTA unchanged", () => {
    renderIn("en", <WhatChanges />);
    const copy = en.HomeV1.whatChanges;
    for (const heading of [copy.columns.without, copy.columns.with, copy.columns.impact]) {
      expect(screen.getByRole("heading", { level: 3, name: heading })).toBeTruthy();
    }
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("link", { name: copy.cta.label }).getAttribute("href")).toBe(copy.cta.href);
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
  });
});
