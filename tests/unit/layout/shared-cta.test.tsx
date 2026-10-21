// @vitest-environment jsdom
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SiteLayout from "@/app/[locale]/(site)/layout";

vi.mock("@/components/sections/home-1/cta", () => ({
  default: () => <section data-testid="shared-cta" />,
}));

const root = join(__dirname, "..", "..", "..");
const localeDir = join(root, "app", "[locale]");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

describe("shared closing CTA", () => {
  it("the (site) layout renders the page, then the CTA exactly once", () => {
    const { container } = render(
      <SiteLayout>
        <main data-testid="page" />
      </SiteLayout>,
    );
    expect(screen.getAllByTestId("shared-cta")).toHaveLength(1);
    expect(container.firstElementChild).toBe(screen.getByTestId("page"));
    expect(container.lastElementChild).toBe(screen.getByTestId("shared-cta"));
  });

  it("error states live outside the (site) group, so its layout cannot wrap them", () => {
    expect(existsSync(join(localeDir, "(site)", "layout.tsx"))).toBe(true);
    for (const outside of ["error.tsx", "not-found.tsx", join("[...rest]", "page.tsx")]) {
      expect(existsSync(join(localeDir, outside)), outside).toBe(true);
      expect(existsSync(join(localeDir, "(site)", outside)), outside).toBe(false);
    }
  });

  it("only the (site) layout and the blog article page render the CTA", () => {
    const importers = sourceFiles(localeDir)
      .filter((file) => readFileSync(file, "utf8").includes("@/components/sections/home-1/cta"))
      .map((file) => relative(localeDir, file).replaceAll("\\", "/"))
      .sort();
    expect(importers).toEqual(["(site)/layout.tsx", "blog/[slug]/page.tsx"]);
  });
});
