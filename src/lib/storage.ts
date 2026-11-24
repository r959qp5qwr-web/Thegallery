import type { Db } from "./supabase";

/**
 * Images: read and stored here, made elsewhere.
 *
 * Photographs are decoded, resized and re-encoded in the maker's own browser
 * (src/lib/photo-prepare.ts) and sent straight to storage on signed upload addresses
 * (beginPhotoAction / finishPhotoAction). The server makes no pixels. It runs as a Cloudflare
 * Worker on the Free plan, 10 ms of CPU per request, and decoding one phone photograph took
 * 1.4-1.9 s there before Cloudflare cut the request off: no maker could add a photo
 * (2026-11-23, ledger GAL-L0044). Journey 17 holds this: no codec in the server build, and a
 * photo costs the server little CPU.
 *
 * Variants keep the source's own ratio and are NEVER cropped (promise P-17).
 */
export const VARIANT_WIDTHS = [320, 640, 1280, 1920] as const;
export type VariantMap = Record<string, string>;

/**
 * Read a stored variant, falling back to what exists. Variants are only made up to the image's
 * own width, so a request for one that was never made is answered with the next largest.
 */
export async function readVariant(db: Db, storageKey: string, name: string): Promise<Uint8Array> {
  const requested = /^(original|w320|w640|w1280|w1920)$/.test(name) ? name : "w640";
  const order = requested === "original"
    ? ["original"]
    : [requested, ...[...VARIANT_WIDTHS].reverse().map((w) => `w${w}`).filter((v) => v !== requested), "original"];
  for (const candidate of order) {
    const bytes = await get(db, `${storageKey}/${candidate === "original" ? "original.jpg" : `${candidate}.jpg`}`);
    if (bytes) return bytes;
  }
  throw new Error(`no stored bytes for ${storageKey}`);
}

// ------------------------------------------------------------------ the object store
//
// Supabase Storage, reached through whichever client the caller holds — which means through
// whichever identity that client carries. There is no service-role key here and no separate
// storage credential: a maker uploads as themselves and a visitor reads as `anon`, and the
// policies in db/migrations/004 decide both. The bucket is PRIVATE; if it were public, an
// object URL would keep working after the work behind it was retired, taken down or
// suspended, and /img — which re-checks visibility on every request — would be routed around.

export const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET ?? "gallery-images";


async function get(db: Db, path: string): Promise<Uint8Array | null> {
  const { data, error } = await db.storage.from(BUCKET()).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}
