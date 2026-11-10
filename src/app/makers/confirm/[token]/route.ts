import { NextResponse, type NextRequest } from "next/server";
import { confirmEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The confirmation link (drawing board, screen 9: "the link brings the maker straight back to
 *  step 2"). Confirming here, in a route handler, lets the session cookies be written, so the
 *  maker arrives at step 2 signed in. A spent or expired link says so and offers a fresh one. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const outcome = await confirmEmail(token);
  const to = outcome === "confirmed" ? "/studio/join" : "/makers/check-email?expired=1";
  return NextResponse.redirect(new URL(to, process.env.GALLERY_BASE_URL || request.url), 303);
}
