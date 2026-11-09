import type { PublicImage } from "@/lib/queries";

/**
 * The URL for an image at roughly the width a surface needs.
 *
 * `variants` records what was actually written for this image, so this picks the requested
 * width when it exists and otherwise the largest that does. Asking for a width that was never
 * made is how two of three images came back broken the first time this ran.
 */
export function imgSrc(image: PublicImage | undefined, variant: "w320" | "w640" | "w1280" | "w1920") {
  if (!image) return null;
  if (image.variants[variant]) return `/img/${image.id}/${variant}`;
  const available = ["w1920", "w1280", "w640", "w320"].filter((v) => image.variants[v]);
  const chosen = available[0] ?? "original";
  return `/img/${image.id}/${chosen}`;
}

