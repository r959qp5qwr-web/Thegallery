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

  // `pg` reaches for pg-cloudflare's socket when it detects a Worker, and that package
  // publishes its real implementation only under the `workerd` export condition. The file
  // tracer resolves under the default condition, so it copies the empty stub and the Worker
  // bundler then cannot resolve the module it is told to use. Naming the files keeps both
  // in the traced output; nothing else in the build knows the difference.
  outputFileTracingIncludes: {
    "**": ["./node_modules/pg-cloudflare/dist/**", "./node_modules/pg-cloudflare/esm/**"],
  },
};

export default nextConfig;
