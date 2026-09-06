import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// The Gallery on Cloudflare Workers.
//
// No incremental cache and no tag cache: every page that reads governed state is
// `dynamic = "force-dynamic"`, because a cached gallery page is a permission decision made
// once and then repeated after the permission has changed. A suspended maker's work must
// leave every surface at the moment of suspension (J-004), which a shared cache cannot
// promise. Static assets are still served from the assets binding, which is not state.
export default defineCloudflareConfig({});
