import type { NextConfig } from "next";

// The Gallery — Stage 2 vertical slice, hosted on Cloudflare.
//
// Images are served through /img/[id]/[variant], a route handler that re-checks public
// visibility, so a draft or suspended work's pixels are not fetchable by URL. That is a
// permission control, not a performance choice, so the built-in image optimiser is not used.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
