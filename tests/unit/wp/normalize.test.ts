import { describe, expect, it } from "vitest";
import {
  normalizeCareer,
  normalizeCaseStudy,
  normalizeClient,
  normalizeCompanyProfile,
  normalizeImage,
  normalizeIndustry,
  normalizePost,
  normalizePostListItem,
  normalizeService,
  normalizeSolution,
} from "@/lib/wp/normalize";

/**
 * Normalizer edge cases that need no network. The stub-driven contract tests
 * cover the common paths; these pin the branches a fixture would not reach.
 */

describe("normalizeImage", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["no node", {}],
    ["null node", { node: null }],
    ["no sourceUrl", { node: { altText: "x" } }],
    ["empty sourceUrl", { node: { sourceUrl: "", altText: "x" } }],
  ])("is null for %s", (_n, input) => {
    expect(normalizeImage(input)).toBeNull();
  });

  it("defaults a missing or null alt to an empty string", () => {
    expect(normalizeImage({ node: { sourceUrl: "/a.jpg" } })).toEqual({ src: "/a.jpg", alt: "" });
    expect(normalizeImage({ node: { sourceUrl: "/a.jpg", altText: null } })).toEqual({
      src: "/a.jpg",
      alt: "",
    });
  });
});

describe("entities without a uri/slug are dropped (null)", () => {
  it.each([
    ["service", () => normalizeService({ title: "t", uri: null } as never)],
    ["case study", () => normalizeCaseStudy({ title: "t", uri: null } as never)],
    ["solution", () => normalizeSolution({ title: "t", uri: null } as never)],
    ["industry", () => normalizeIndustry({ title: "t", uri: null } as never)],
    ["career", () => normalizeCareer({ title: "t", uri: null } as never)],
    ["post", () => normalizePostListItem({ title: "t", slug: null } as never)],
    ["post (single)", () => normalizePost({ title: "t", slug: "" } as never)],
    ["service from null", () => normalizeService(null)],
  ])("%s", (_n, call) => {
    expect(call()).toBeNull();
  });
});

describe("repeater filtering", () => {
  it("case study drops fully empty hero metrics and results, keeps half-filled ones", () => {
    const cs = normalizeCaseStudy({
      title: "t",
      uri: "/c/",
      industrySectors: null,
      caseStudyCoreContent: {
        heroMetrics: [
          { metric: null, measure: null },
          { metric: "9", measure: null },
        ],
        results: [
          { measure: null, before: null, after: null },
          { measure: "AHT", before: null, after: "6m" },
        ],
      },
    } as never);
    expect(cs?.heroMetrics).toEqual([{ metric: "9", measure: "" }]);
    expect(cs?.results).toEqual([{ measure: "AHT", before: "", after: "6m" }]);
  });

  it("industry drops empty procurement items; sector services without uris are dropped", () => {
    const ind = normalizeIndustry({
      title: "t",
      uri: "/i/",
      industryCoreContent: {
        procurementItems: [
          { itemTitle: null, itemDescription: null },
          { itemTitle: "T", itemDescription: null },
        ],
        sectorServices: [
          { service: { nodes: [{ title: "x", uri: null }] }, serviceDescription: null },
          { service: null, serviceDescription: "d" },
        ],
      },
    } as never);
    expect(ind?.procurementItems).toEqual([{ title: "T", description: "" }]);
    expect(ind?.sectorServices).toEqual([
      { services: [], description: null },
      { services: [], description: "d" },
    ]);
  });

  it("service relationships without uris are dropped", () => {
    const svc = normalizeService({
      title: "t",
      uri: "/s/",
      serviceProof: { relatedCaseStudy: { nodes: [{ title: "x", uri: null }] } },
    } as never);
    expect(svc?.proof.relatedCaseStudies).toEqual([]);
  });

  it("categories without a name are dropped and slug defaults to empty", () => {
    const post = normalizePostListItem({
      slug: "s",
      categories: { nodes: [{ name: null, slug: "x" }, { name: "N", slug: null }] },
    } as never);
    expect(post?.categories).toEqual([{ name: "N", slug: "" }]);
  });
});

describe("defaults", () => {
  it("post uri falls back to /blog/<slug> and date to an empty string", () => {
    const post = normalizePostListItem({ slug: "hello", uri: null, date: null } as never);
    expect(post).toMatchObject({ uri: "/blog/hello", date: "", databaseId: 0, title: "" });
  });

  it("client defaults id/databaseId/slug/name", () => {
    expect(normalizeClient({} as never)).toEqual({
      id: "",
      databaseId: 0,
      slug: "",
      name: "",
      logo: null,
    });
    expect(normalizeClient(null)).toBeNull();
  });

  it("career trims and nulls blank values", () => {
    const c = normalizeCareer({
      uri: "/c/",
      careersCoreContent: { location: "   ", discipline: "\nOps\n", jobType: null },
    } as never);
    expect(c).toMatchObject({ location: null, discipline: "Ops", jobType: null });
  });
});

describe("company profile file size", () => {
  const profile = (size: unknown) =>
    normalizeCompanyProfile({
      aboutSettings: {
        companyProfile: {
          profileEnFile: { node: { mediaItemUrl: "/p.pdf", fileSize: size, mimeType: null } },
        },
      },
    } as never).en.file;

  it.each([
    [1024, 1024],
    ["2048", 2048],
    [" 4096 ", 4096],
    ["2.5 MB", null], // a formatted string is not a byte count
    [undefined, null],
    [null, null],
  ])("fileSize %j -> %j", (input, expected) => {
    expect(profile(input)?.fileSize).toBe(expected);
  });

  it("a file without a url is dropped", () => {
    expect(
      normalizeCompanyProfile({
        aboutSettings: { companyProfile: { profileEnFile: { node: { mediaItemUrl: null } } } },
      } as never).en.file,
    ).toBeNull();
  });

  it("handles a null response", () => {
    expect(normalizeCompanyProfile(null).heading).toBeNull();
  });
});
