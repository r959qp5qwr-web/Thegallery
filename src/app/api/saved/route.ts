import { NextResponse } from "next/server";
import { asAnon } from "@/lib/db";

// The saved shelf refreshes through the same public views as every other surface, so a work
// that stopped being public stops carrying its details here too.
export async function GET(req: Request) {
  const tokens = (new URL(req.url).searchParams.get("tokens") ?? "")
    .split(",").map((t) => t.trim()).filter(Boolean).slice(0, 100);
  if (!tokens.length) return NextResponse.json({ rows: [] });

  const rows = await asAnon(async (db) => {
    const live = await db.query<{ public_token: string; title: string; maker_display_name: string; status: string }>(
      `SELECT public_token, title, maker_display_name, status FROM public_works WHERE public_token = ANY($1)`,
      [tokens]);
    const ended = await db.query<{ public_token: string; title: string; maker_display_name: string }>(
      `SELECT public_token, title, maker_display_name FROM public_work_endings WHERE public_token = ANY($1)`,
      [tokens]);
    const liveMap = new Map(live.rows.map((r) => [r.public_token, r]));
    return tokens.map((t) => {
      const l = liveMap.get(t);
      if (l) return { ...l, gone: false };
      const e = ended.rows.find((r) => r.public_token === t);
      return e ? { ...e, status: "", gone: true } : null;
    }).filter(Boolean);
  });
  return NextResponse.json({ rows });
}
