import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

// Local object store. One directory per image; the original is kept and variants are derived,
// exactly as DOMAIN_MODEL §1 describes. Swapping this for Supabase Storage is a change to
// this file only — nothing above it knows where the bytes live.

const ROOT = () => process.env.GALLERY_STORAGE_DIR ?? "./var/storage";
export const VARIANT_WIDTHS = [320, 640, 1280, 1920] as const;
export type VariantMap = Record<string, string>;

export type Ingested = { storageKey: string; width: number; height: number; variants: VariantMap };

/**
 * Take an uploaded image and produce the stored original plus width variants.
 *
 * Variants use `fit: inside` and never enlarge, so a portrait stays portrait, a landscape
 * stays landscape and a square stays square. The product crops nothing: a maker's framing is
 * the maker's decision, and a gallery that silently squares its works is not showing them.
 * EXIF is dropped on the way in — an image can carry a home address in it.
 */
export async function ingestImage(bytes: Buffer): Promise<Ingested> {
  const probe = sharp(bytes, { failOn: "error" });
  const meta = await probe.metadata();
  if (!meta.width || !meta.height) throw new Error("that file is not an image we can read");
  if (meta.width < 200 || meta.height < 200) throw new Error("that image is too small to show at gallery scale");

  const key = randomUUID();
  const dir = join(ROOT(), key);
  await mkdir(dir, { recursive: true });

  // rotate() applies the EXIF orientation and then the metadata is dropped, so the stored
  // pixels are upright and carry nothing from the camera.
  const upright = sharp(bytes).rotate();
  const original = await upright.clone().toFormat("jpeg", { quality: 92 }).toBuffer();
  await writeFile(join(dir, "original.jpg"), original);
  const uprightMeta = await sharp(original).metadata();

  const variants: VariantMap = {};
  for (const w of VARIANT_WIDTHS) {
    if ((uprightMeta.width ?? 0) < w && w !== VARIANT_WIDTHS[0]) continue;
    const out = await sharp(original)
      .resize({ width: w, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true })
      .toBuffer();
    await writeFile(join(dir, `w${w}.jpg`), out);
    variants[`w${w}`] = `w${w}.jpg`;
  }

  return {
    storageKey: key,
    width: uprightMeta.width ?? meta.width,
    height: uprightMeta.height ?? meta.height,
    variants,
  };
}

/**
 * Read a stored variant, falling back to what actually exists.
 *
 * Variants are only made up to the image's own width — a 900px-wide original has no w1280,
 * because inventing one would be upscaling, and a gallery that upscales is showing a worse
 * image than the maker gave it. So a request for a variant that was never made is answered
 * with the next largest that was, and finally with the original.
 */
export async function readVariant(storageKey: string, name: string): Promise<Buffer> {
  const requested = /^(original|w320|w640|w1280|w1920)$/.test(name) ? name : "w640";
  const order = requested === "original"
    ? ["original"]
    : [requested, ...[...VARIANT_WIDTHS].reverse().map((w) => `w${w}`).filter((v) => v !== requested), "original"];
  for (const candidate of order) {
    try {
      return await readFile(join(ROOT(), storageKey, candidate === "original" ? "original.jpg" : `${candidate}.jpg`));
    } catch { /* try the next one down */ }
  }
  throw new Error(`no stored bytes for ${storageKey}`);
}
