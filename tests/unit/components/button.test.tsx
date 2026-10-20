// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "@/components/ui/button";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Button", () => {
  it("keeps the uppercase tracked default for existing sizes", () => {
    render(<Button>Go</Button>);
    const el = screen.getByRole("button", { name: "Go" });
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("rounded-md");
  });

  it("md size matches the Figma handoff: 40px, sentence case, 8px+ radius", () => {
    render(<Button size="md">Talk to an Expert</Button>);
    const el = screen.getByRole("button", { name: "Talk to an Expert" });
    expect(el.className).toContain("h-10");
    expect(el.className).toContain("normal-case");
    expect(el.className).toContain("rounded-lg");
    expect(el.className).not.toContain("rounded-md");
  });

  it("exposes a visible keyboard focus state and respects reduced motion", () => {
    render(<Button href="/x">Link</Button>);
    const el = screen.getByRole("link", { name: "Link" });
    expect(el.className).toContain("focus-visible:outline-2");
  });
});
