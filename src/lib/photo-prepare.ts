"use client";
/**
 * Photographs are prepared in the maker's own browser, never on the server.
 *
 * The server is a Cloudflare Worker on the Free plan: 10 ms of CPU per request. Decoding and
 * resizing one phone photograph takes seconds and hundreds of megabytes (measured 2026-11-23,
 * ledger GAL-L0044), so the Worker was cut off mid-upload and no maker could add a photo. A phone
 * or laptop does the same work in well under a second with its own image decoder.
 *
 * What comes out is what the server used to make: a re-encoded original (long edge at most
 * 3000 px) and width variants 320/640/1280/1920, all JPEG, in the photo's own ratio and never
 * cropped (P-17). Re-encoding drops every metadata block, the location included (GAL-R22), and
 * the browser applies the camera's orientation while decoding, so a portrait stays a portrait.
 * Any format the browser can open works: JPEG, PNG, WebP, screenshots, and HEIC where the
 * browser reads it (Safari).
 */
export const VARIANT_WIDTHS = [320, 640, 1280, 1920] as const;
export const ORIGINAL_MAX = 3000;
export const MIN_SIDE = 200;

export type PreparedPhoto = { width: number; height: number; files: { name: string; blob: Blob }[] };

export class PhotoProblem extends Error {}

async function open(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const heic = /\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type);
    throw new PhotoProblem(heic
      ? "This photo is in the iPhone's HEIC format, which this browser cannot open. On the iPhone, share it as JPEG (or set Camera → Formats → Most Compatible) and choose it again."
      : "We could not open that file as a photograph. JPEG, PNG and WebP photos work.");
  }
}

function encode(source: CanvasImageSource, w: number, h: number, quality: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoProblem("This browser could not prepare the photo. Try another browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // A white ground under transparent PNGs: JPEG has no transparency and would show black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return new Promise((resolve, reject) => canvas.toBlob(
    (b) => (b ? resolve(b) : reject(new PhotoProblem("This browser could not prepare the photo. Try another browser."))),
    "image/jpeg", quality));
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const bitmap = await open(file);
  try {
    if (bitmap.width < MIN_SIDE || bitmap.height < MIN_SIDE) {
      throw new PhotoProblem("That photo is too small to show at gallery scale. Use one at least 200 pixels on each side.");
    }
    const scale = Math.min(1, ORIGINAL_MAX / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const files: PreparedPhoto["files"] = [{ name: "original.jpg", blob: await encode(bitmap, width, height, 0.9) }];
    for (const w of VARIANT_WIDTHS) {
      // Never enlarge: an upscaled variant is a worse image than the maker supplied.
      if (width < w && w !== VARIANT_WIDTHS[0]) continue;
      const tw = Math.min(w, width);
      const th = Math.max(1, Math.round((height / width) * tw));
      files.push({ name: `w${w}.jpg`, blob: await encode(bitmap, tw, th, 0.82) });
    }
    return { width, height, files };
  } finally {
    bitmap.close();
  }
}
