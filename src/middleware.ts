import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refresh the Supabase session on every request.
 *
 * A Server Component cannot set cookies, so it cannot write back a rotated refresh token. This
 * middleware is the one place that can, and without it a maker is signed out the moment their
 * access token expires — which looks exactly like a permission failure and is not one.
 *
 * getUser() is called deliberately rather than getSession(): it asks GoTrue whether the token
 * is real instead of trusting what the cookie says about itself.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Everything except static assets and the image route, which does its own permission check
  // and has no session to refresh.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|img/).*)"],
};
