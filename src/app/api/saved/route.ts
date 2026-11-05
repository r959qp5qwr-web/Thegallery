import { NextResponse } from "next/server";
import { anon } from "@/lib/supabase";

// The saved shelf refreshes through the same public views as every other surface, so a work
// that stopped being public stops carrying its details here too.
export async function GET(req: Request) {
  const tokens = (new URL(req.url).searchParams.get("tokens") ?? "")
    .split(",").map((t) => t.trim()).filter(Boolean).slice(0, 100);
  if (!tokens.length) return NextResponse.json({ rows: [] });

  const db = await anon();
  const { data: live } = await db.from("public_works")
    .select("public_token,title,maker_display_name,status").in("public_token", tokens);
  const { data: ended } = await db.from("public_work_endings")
    .select("public_token,title,maker_display_name").in("public_token", tokens);

  type Live = { public_token: string; title: string; maker_display_name: string; status: string };
  type Ended = { public_token: string; title: string; maker_display_name: string };
  const liveMap = new Map((live as unknown as Live[] ?? []).map((r) => [r.public_token, r]));

  const rows = tokens.map((t) => {
    const l = liveMap.get(t);
    if (l) return { ...l, gone: false };
    const e = (ended as unknown as Ended[] ?? []).find((r) => r.public_token === t);
    return e ? { ...e, status: "", gone: true } : null;
  }).filter(Boolean);

  return NextResponse.json({ rows });
}
