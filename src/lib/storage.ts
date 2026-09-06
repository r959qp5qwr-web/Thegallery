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

let codecs: Promise<void> | undefined;
function initCodecs(): Promise<void> {
  return (codecs ??= (async () => {
    const [dec, enc, rsz] = await Promise.all([
      WebAssembly.compile(decodeB64(DEC_WASM_B64)),
      WebAssembly.compile(decodeB64(ENC_WASM_B64)),
      WebAssembly.compile(decodeB64(RESIZE_WASM_B64)),
    ]);
    await Promise.all([initJpegDecode(dec), initJpegEncode(enc), initResize(rsz)]);
  })().catch((cause) => {
    codecs = undefined;   // let a later request try again rather than caching a failure
    throw new Error(`image codecs would not initialise: ${cause}`);
  }));
}

export async function ingestImage(bytes: Uint8Array): Promise<Ingested> {
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

  const storageKey = crypto.randomUUID();
  const original = await encodeJpeg(image, { quality: 92 });
  await put(`${storageKey}/original.jpg`, new Uint8Array(original));

  const variants: VariantMap = {};
  for (const width of VARIANT_WIDTHS) {
    // Never enlarge: an upscaled variant is a worse image than the maker supplied.
    if (image.width < width && width !== VARIANT_WIDTHS[0]) continue;
    const target = Math.min(width, image.width);
    const height = Math.max(1, Math.round((image.height / image.width) * target));
    const scaled = await resize(image, { width: target, height });
    const jpeg = await encodeJpeg(scaled, { quality: 82 });
    await put(`${storageKey}/w${width}.jpg`, new Uint8Array(jpeg));
    variants[`w${width}`] = `w${width}.jpg`;
  }

  return { storageKey, width: image.width, height: image.height, variants };
}

/**
 * Read a stored variant, falling back to what exists. Variants are only made up to the image's
 * own width, so a request for one that was never made is answered with the next largest.
 */
export async function readVariant(storageKey: string, name: string): Promise<Uint8Array> {
  const requested = /^(original|w320|w640|w1280|w1920)$/.test(name) ? name : "w640";
  const order = requested === "original"
    ? ["original"]
    : [requested, ...[...VARIANT_WIDTHS].reverse().map((w) => `w${w}`).filter((v) => v !== requested), "original"];
  for (const candidate of order) {
    const bytes = await get(`${storageKey}/${candidate === "original" ? "original.jpg" : `${candidate}.jpg`}`);
    if (bytes) return bytes;
  }
  throw new Error(`no stored bytes for ${storageKey}`);
}

// ------------------------------------------------------------------ the object store
//
// Two backends behind one pair of functions. `supabase` is the deployed one; `disk` exists so
// the journeys can run locally without a bucket credential. The interface is deliberately two
// functions wide, so the thing that could drift between them is as small as possible.

const backend = () => process.env.GALLERY_STORAGE ?? "disk";

async function put(path: string, bytes: Uint8Array): Promise<void> {
  if (backend() === "supabase") return supabasePut(path, bytes);
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const file = join(process.env.GALLERY_STORAGE_DIR ?? "./var/storage", path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

async function get(path: string): Promise<Uint8Array | null> {
  if (backend() === "supabase") return supabaseGet(path);
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    return new Uint8Array(await readFile(join(process.env.GALLERY_STORAGE_DIR ?? "./var/storage", path)));
  } catch {
    return null;
  }
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_STORAGE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "gallery-images";
  if (!url || !key) {
    throw new Error("GALLERY_STORAGE=supabase needs SUPABASE_URL and SUPABASE_STORAGE_KEY");
  }
  return { url: url.replace(/\/+$/, ""), key, bucket };
}

async function supabasePut(path: string, bytes: Uint8Array): Promise<void> {
  const { url, key, bucket } = supabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`, apikey: key,
      "content-type": "image/jpeg", "cache-control": "3600", "x-upsert": "true",
    },
    body: bytes as BodyInit,
  });
  if (!res.ok) throw new Error(`storage refused ${path} (${res.status}): ${await res.text()}`);
}

async function supabaseGet(path: string): Promise<Uint8Array | null> {
  const { url, key, bucket } = supabaseConfig();
  // The bucket is private. Bytes are read server-side and served through /img, which re-checks
  // public visibility, so a draft's images are not reachable by URL.
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    headers: { authorization: `Bearer ${key}`, apikey: key },
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`storage refused to read ${path} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}
