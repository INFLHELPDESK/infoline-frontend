import { describe, expect, it } from "vitest";
import { cmsImageConfig } from "@/lib/cms-images";

const STUB = "http://127.0.0.1:3199/graphql";

describe("cmsImageConfig", () => {
  it("allow-lists exactly the endpoint's host and port", () => {
    expect(cmsImageConfig({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "https://cms.example.com/graphql" })).toEqual({
      remotePatterns: [{ protocol: "https", hostname: "cms.example.com" }],
    });
    expect(cmsImageConfig({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB }).remotePatterns).toEqual([
      { protocol: "http", hostname: "127.0.0.1", port: "3199" },
    ]);
  });

  it("allows no remote host without a valid endpoint", () => {
    expect(cmsImageConfig({})).toEqual({ remotePatterns: [] });
    expect(cmsImageConfig({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: "not a url" })).toEqual({ remotePatterns: [] });
  });

  it("permits local-IP upstream images only for an isolated loopback endpoint", () => {
    expect(cmsImageConfig({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB, CMS_ISOLATED: "1" }).dangerouslyAllowLocalIP).toBe(true);
    // no isolation flag: a production-style build keeps the protection
    expect(cmsImageConfig({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: STUB }).dangerouslyAllowLocalIP).toBeUndefined();
    // isolation flag but a non-loopback host: never relaxed
    for (const endpoint of ["https://cms.example.com/graphql", "http://10.0.0.5:3199/graphql", "http://169.254.169.254/graphql"]) {
      expect(cmsImageConfig({ NEXT_PUBLIC_WPGRAPHQL_ENDPOINT: endpoint, CMS_ISOLATED: "1" }).dangerouslyAllowLocalIP).toBeUndefined();
    }
  });
});
