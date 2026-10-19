import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * CMS media is served from the WordPress host, so next/image needs it
 * allow-listed. Derived from the configured endpoint (no hardcoded host);
 * when the endpoint is unset or invalid, no remote hosts are allowed.
 */
function cmsImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const endpoint = process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT;
  if (!endpoint) return [];
  try {
    const { protocol, hostname, port } = new URL(endpoint);
    return [
      {
        protocol: protocol === "http:" ? "http" : "https",
        hostname,
        ...(port ? { port } : {}),
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: cmsImagePatterns(),
  },
  experimental: {
    // framer-motion isn't in Next's built-in optimizePackageImports list
    // (lucide-react already is); it ships many named exports and is imported
    // across most sections, so per-export tracing keeps unused exports out
    // of each route's client bundle.
    optimizePackageImports: ["framer-motion"],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
