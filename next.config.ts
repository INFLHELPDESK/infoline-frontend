import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { cmsImageConfig } from "./lib/cms-images";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: cmsImageConfig(),
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
