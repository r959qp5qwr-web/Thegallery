/**
 * Password credentials, on Web Crypto only.
 *
 * PBKDF2-HMAC-SHA256 rather than scrypt. Not a preference — `scrypt` is a Node built-in that
 * `nodejs_compat` does not provide, and this code runs on Cloudflare Workers. Web Crypto's
 * PBKDF2 exists identically in Node and in workerd, so there is ONE implementation rather than
 * two that could drift.
 *
 * The stored form carries its algorithm and iteration count, so raising the count later
 * verifies old credentials while writing new ones at the higher cost. Nothing here ever
 * compares two strings with `===`.
 */
const ITERATIONS = 210_000;   // OWASP guidance for PBKDF2-HMAC-SHA256
const KEY_BITS = 256;
const SALT_BYTES = 16;

const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" }, key, KEY_BITS);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const bits = await derive(password, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${b64(salt.buffer as ArrayBuffer)}$${b64(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, itersRaw, saltRaw, hashRaw] = stored.split("$");
  if (scheme !== "pbkdf2-sha256" || !itersRaw || !saltRaw || !hashRaw) return false;
  const iterations = Number(itersRaw);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  const bits = new Uint8Array(await derive(password, unb64(saltRaw), iterations));
  const known = unb64(hashRaw);
  if (bits.length !== known.length) return false;
  // Constant time: compare every byte regardless of where the first difference is.
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ known[i];
  return diff === 0;
}
