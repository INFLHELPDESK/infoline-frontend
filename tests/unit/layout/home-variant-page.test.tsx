// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/[locale]/(site)/page";

vi.mock("@/components/sections/home-1/hero", () => ({
  default: () => <section data-testid="section-hero" />,
}));
vi.mock("@/components/sections/home-1/why-trust", () => ({
  default: () => <section data-testid="section-why-trust" />,
}));
vi.mock("@/components/sections/home-1/what-we-do", () => ({
  default: () => <section data-testid="section-what-we-do" />,
}));
vi.mock("@/components/sections/home-1/industries", () => ({
  default: () => <section data-testid="section-industries" />,
}));
vi.mock("@/components/sections/home-1/proof", () => ({
  default: () => <section data-testid="section-proof" />,
}));
vi.mock("@/components/sections/home-1/three-ways", () => ({
  default: () => <section data-testid="section-three-ways" />,
}));
vi.mock("@/components/sections/home-1/clients", () => ({
  default: () => <section data-testid="section-clients" />,
}));
vi.mock("@/components/sections/home/partners", () => ({
  default: () => <section data-testid="section-partners" />,
}));
vi.mock("@/components/sections/home-1/what-changes", () => ({
  default: () => <section data-testid="changes-current" />,
}));
vi.mock("@/components/sections/home-1/what-changes-toggle", () => ({
  default: () => <section data-testid="changes-new" />,
}));

afterEach(cleanup);

/** A searchParams promise that fails the test if the page reads it. */
function unreadableSearchParams(query: Record<string, string>) {
  return new Proxy(Promise.resolve(query), {
    get(target, prop, receiver) {
      if (prop === "then") throw new Error("searchParams must not be read when the variant is unavailable");
      return Reflect.get(target, prop, receiver);
    },
  });
}

async function renderHome(query: Record<string, string | string[] | undefined>) {
  const ui = await HomePage({ searchParams: Promise.resolve(query) } as never);
  return render(ui);
}

const OTHER_SECTIONS = ["hero", "why-trust", "what-we-do", "industries", "proof", "three-ways", "clients", "partners"];

describe("Home › What changes variant selection", () => {
  // The variant exists only where it is explicitly opted in (non-production).
  beforeEach(() => {
    vi.stubEnv("ENABLE_HOME_VARIANT_PREVIEW", "1");
  });

  it("renders the current design by default", async () => {
    await renderHome({});
    expect(screen.getByTestId("changes-current")).toBeTruthy();
    expect(screen.queryByTestId("changes-new")).toBeNull();
  });

  it("renders the current design for ?homeVariant=current", async () => {
    await renderHome({ homeVariant: "current" });
    expect(screen.getByTestId("changes-current")).toBeTruthy();
    expect(screen.queryByTestId("changes-new")).toBeNull();
  });

  it("renders the new design for ?homeVariant=new", async () => {
    await renderHome({ homeVariant: "new" });
    expect(screen.getByTestId("changes-new")).toBeTruthy();
    expect(screen.queryByTestId("changes-current")).toBeNull();
  });

  it.each(["bogus", "", "NEW"])("falls back to current for %j", async (value) => {
    await renderHome({ homeVariant: value });
    expect(screen.getByTestId("changes-current")).toBeTruthy();
    expect(screen.queryByTestId("changes-new")).toBeNull();
  });

  it("ignores unrelated query parameters", async () => {
    await renderHome({ utm_source: "x" });
    expect(screen.getByTestId("changes-current")).toBeTruthy();
  });

  it("changes only this section: every other Home section renders either way", async () => {
    for (const query of [{}, { homeVariant: "new" }]) {
      const { unmount } = await renderHome(query);
      for (const name of OTHER_SECTIONS) expect(screen.getAllByTestId(`section-${name}`)).toHaveLength(1);
      unmount();
    }
  });

  it("renders the new design on Vercel Preview with the opt-in", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    await renderHome({ homeVariant: "new" });
    expect(screen.getByTestId("changes-new")).toBeTruthy();
  });

  it("never exposes the new design on Vercel Production, even with the opt-in, and does not read the query", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const ui = await HomePage({ searchParams: unreadableSearchParams({ homeVariant: "new" }) } as never);
    render(ui);
    expect(screen.getByTestId("changes-current")).toBeTruthy();
    expect(screen.queryByTestId("changes-new")).toBeNull();
  });
});

describe("Home › What changes variant without the opt-in", () => {
  it.each([undefined, "development", "preview"])(
    "keeps the current design for ?homeVariant=new and does not read the query (VERCEL_ENV=%s)",
    async (env) => {
      vi.stubEnv("ENABLE_HOME_VARIANT_PREVIEW", "");
      if (env) vi.stubEnv("VERCEL_ENV", env);
      const ui = await HomePage({ searchParams: unreadableSearchParams({ homeVariant: "new" }) } as never);
      render(ui);
      expect(screen.getByTestId("changes-current")).toBeTruthy();
      expect(screen.queryByTestId("changes-new")).toBeNull();
      for (const name of OTHER_SECTIONS) expect(screen.getAllByTestId(`section-${name}`)).toHaveLength(1);
    },
  );
});
