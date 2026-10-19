import type { NextConfig } from "next";

type Images = NonNullable<NextConfig["images"]>;

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/**
 * `next/image` settings for CMS media, derived from the configured endpoint
 * (no hardcoded host). Only that one host (and port) is allow-listed; when the
 * endpoint is unset or invalid, no remote hosts are.
 *
 * Next 16 refuses upstream images that resolve to a private address. The local
 * CMS stub lives on loopback, so `dangerouslyAllowLocalIP` is switched on only
 * when `CMS_ISOLATED=1` (tests, CI, `build:isolated`) AND the endpoint host is
 * itself loopback. A production build, or any endpoint that is not loopback,
 * keeps the default protection.
 */
export function cmsImageConfig(env: Record<string, string | undefined> = process.env): Images {
  const endpoint = env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT;
  if (!endpoint) return { remotePatterns: [] };
  try {
    const { protocol, hostname, port } = new URL(endpoint);
    return {
      remotePatterns: [
        {
          protocol: protocol === "http:" ? "http" : "https",
          hostname,
          ...(port ? { port } : {}),
        },
      ],
      ...(env.CMS_ISOLATED === "1" && LOOPBACK_HOSTS.has(hostname)
        ? { dangerouslyAllowLocalIP: true }
        : {}),
    };
  } catch {
    return { remotePatterns: [] };
  }
}
