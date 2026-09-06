import type { Db } from "./supabase";
// Explicit .js paths: @jsquash ships no export map, so Node's strict ESM resolver needs the
// extension. Bundlers accept it too, which keeps one spelling that works in both runtimes.
import decodeJpeg, { init as initJpegDecode } from "@jsquash/jpeg/decode.js";
import encodeJpeg, { init as initJpegEncode } from "@jsquash/jpeg/encode.js";
import resize, { initResize } from "@jsquash/resize/index.js";
import DEC_WASM_B64 from "./wasm/jpeg-dec";
import ENC_WASM_B64 from "./wasm/jpeg-enc";
import RESIZE_WASM_B64 from "./wasm/resize";

/**
 * Images: one implementation for Node and for Cloudflare Workers.
 *
 * `sharp` is gone. It is a native libvips binary and a V8 isolate takes no native addons, so it
 * could never have run on Workers. These are the same WASM codecs in both runtimes, which
 * matters more than the runtime question: two image paths would eventually disagree about what
 * a maker's photograph looks like.
 *
 * Variants use the source's own ratio, derived from its height, and NEVER crop. A gallery that
 * silently squares a maker's work is editing it (promise P-17).
 */
export const VARIANT_WIDTHS = [320, 640, 1280, 1920] as const;
export type VariantMap = Record<string, string>;
export type Ingested = { storageKey: string; width: number; height: number; variants: VariantMap };

// The codecs are compiled from bytes carried in the bundle as base64.
//
// Not the obvious choice, and it is deliberate. These WASM files are emscripten and
// wasm-bindgen output that import their glue from modules named `a` and `wbg`; a bundler asked
// to treat them as WebAssembly modules tries to resolve those as JavaScript and fails. Both
// Turbopack and webpack fail that way. Carrying the bytes means no bundler feature is load
// bearing, and Node and Workers compile the identical module — one image path, not two.
const decodeB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/**
 * Where the compiled codecs come from.
 *
 * A Worker isolate refuses `WebAssembly.compile` anywhere but module evaluation — "Wasm code
 * generation disallowed by embedder" — and the Next server bundle is evaluated inside a
 * request, so nothing here may compile on Cloudflare. The Worker entry (`worker-entry.ts`)
 * imports the same three `.wasm` files directly, which wrangler compiles at deploy time, and
 * leaves the compiled modules here. Under Node, where there is no such rule, they are compiled
 * on first use from the bytes carried as base64.
 *
 * Either way these are the same codecs over the same bytes, written by one generator. The
 * runtime decides where compilation happens, not what a maker's photograph looks like.
 */
type Codecs = { dec: WebAssembly.Module; enc: WebAssembly.Module; rsz: WebAssembly.Module };

function compiledCodecs(): Codecs {
  const handedOver = (globalThis as { __GALLERY_CODECS__?: Codecs }).__GALLERY_CODECS__;
  if (handedOver) return handedOver;
  return {
    dec: new WebAssembly.Module(decodeB64(DEC_WASM_B64)),
    enc: new WebAssembly.Module(decodeB64(ENC_WASM_B64)),
    rsz: new WebAssembly.Module(decodeB64(RESIZE_WASM_B64)),
  };
}

let codecs: Promise<void> | undefined;
function initCodecs(): Promise<void> {
  return (codecs ??= (async () => {
    const { dec, enc, rsz } = compiledCodecs();
    await Promise.all([initJpegDecode(dec), initJpegEncode(enc), initResize(rsz)]);
  })().catch((cause) => {
    codecs = undefined;   // let a later request try again rather than caching a failure
    throw new Error(`image codecs would not initialise: ${cause}`);
  }));
}

export async function ingestImage(bytes: Uint8Array, db: Db, storageKey: string): Promise<Ingested> {
  await initCodecs();
  let image: ImageData;
  try {
    image = await decodeJpeg(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  } catch {
    throw new Error("we can read JPEG images; that file is something else");
  }
  if (image.width < 200 || image.height < 200) {
    throw new Error("that image is too small to show at gallery scale");
  }

  const original = await encodeJpeg(image, { quality: 92 });
  await put(db, `${storageKey}/original.jpg`, new Uint8Array(original));

  const variants: VariantMap = {};
  for (const width of VARIANT_WIDTHS) {
    // Never enlarge: an upscaled variant is a worse image than the maker supplied.
    if (image.width < width && width !== VARIANT_WIDTHS[0]) continue;
    const target = Math.min(width, image.width);
    const height = Math.max(1, Math.round((image.height / image.width) * target));
    const scaled = await resize(image, { width: target, height });
    const jpeg = await encodeJpeg(scaled, { quality: 82 });
    await put(db, `${storageKey}/w${width}.jpg`, new Uint8Array(jpeg));
    variants[`w${width}`] = `w${width}.jpg`;
  }

  return { storageKey, width: image.width, height: image.height, variants };
}

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

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET ?? "gallery-images";

async function put(db: Db, path: string, bytes: Uint8Array): Promise<void> {
  const { error } = await db.storage.from(BUCKET()).upload(path, bytes as unknown as ArrayBuffer, {
    contentType: "image/jpeg", cacheControl: "3600", upsert: true,
  });
  if (error) throw new Error(`storage refused ${path}: ${error.message}`);
}

async function get(db: Db, path: string): Promise<Uint8Array | null> {
  const { data, error } = await db.storage.from(BUCKET()).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}
