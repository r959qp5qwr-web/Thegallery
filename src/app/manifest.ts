import type { MetadataRoute } from "next";

// Installable (Wave 5): the stacked wordmark, chosen by the governor 2026-11-09 (option 4).
// The maskable icons keep the wordmark inside the 80 % safe circle Android crops to.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Gallery",
    short_name: "The Gallery",
    description: "Art and craft, shown by the makers themselves.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F3EA",
    theme_color: "#F8F3EA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
