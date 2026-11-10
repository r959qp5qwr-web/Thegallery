import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { confirmEmail, JOIN_COOKIE, joinMark } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The confirmation link (drawing board, screen 9: "the link brings the maker straight back to
 *  step 2"). Confirming here, in a route handler, lets the session cookies be written, so the
 *  maker arrives at step 2 signed in — but only in the browser that began joining with this
 *  address (JOIN_COOKIE). Opened anywhere else, the address is confirmed and nobody is signed in:
 *  a forwarded link cannot put a maker into an account someone else controls. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const base = process.env.GALLERY_BASE_URL || request.url;
  const { outcome, email } = await confirmEmail(token);
  if (outcome !== "confirmed") return NextResponse.redirect(new URL("/makers/check-email?expired=1", base), 303);
  const jar = await cookies();
  const mark = jar.get(JOIN_COOKIE)?.value;
  if (!email || !mark || mark !== (await joinMark(email))) {
    // Drop the session the link just made, by name, so this browser never holds it; it ends up
    // signed out and is asked to sign in. (signOut() would read the old cookies, not the new ones.)
    const ref = new URL(process.env.SUPABASE_URL ?? "https://x.invalid").hostname.split(".")[0];
    const names = new Set([...jar.getAll().map((c) => c.name).filter((n) => n.startsWith(`sb-${ref}-auth-token`)),
      `sb-${ref}-auth-token`, ...[0, 1, 2, 3, 4].map((i) => `sb-${ref}-auth-token.${i}`)]);
    for (const n of names) jar.delete(n);
    return NextResponse.redirect(new URL("/makers/sign-in?confirmed=1", base), 303);
  }
  jar.delete(JOIN_COOKIE);
  return NextResponse.redirect(new URL("/studio/join", base), 303);
}
