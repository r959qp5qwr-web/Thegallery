import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Separate from lib/auth so seeds and tests can make a credential without pulling in the
// request-scoped Next.js pieces.
const scrypt = promisify(_scrypt) as (p: string, s: Buffer, k: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const known = Buffer.from(keyHex, "hex");
  return key.length === known.length && timingSafeEqual(key, known);
}
