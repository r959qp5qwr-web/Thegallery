import { NextResponse } from "next/server";
import { anon } from "@/lib/supabase";
import { imagesFor } from "@/lib/queries";
import { imgSrc } from "@/components/Chrome";

// The saved shelf refreshes through the same public views as every other surface, so a work
// that stopped being public stops carrying its details here too.
export async function GET(req: Request) {
  const tokens = (new URL(req.url).searchParams.get("tokens") ?? "")
    .split(",").map((t) => t.trim()).filter(Boolean).slice(0, 100);
  if (!tokens.length) return NextResponse.json({ rows: [] });

  const db = await anon();
  const { data: live } = await db.from("public_works")
    .select("id,public_token,title,maker_display_name,status").in("public_token", tokens);
  const { data: ended } = await db.from("public_work_endings")
    .select("public_token,title,maker_display_name").in("public_token", tokens);

  type Live = { id: string; public_token: string; title: string; maker_display_name: string; status: string };
  type Ended = { public_token: string; title: string; maker_display_name: string };
  const liveRows = (live as unknown as Live[] ?? []);
  const liveMap = new Map(liveRows.map((r) => [r.public_token, r]));
  // The first image of each live work, through the same public view as every other surface, so
  // the shelf is a wall of pictures (drawing board, screen 5).
  const cover = new Map<string, string | null>();
  for (const i of await imagesFor(liveRows.map((r) => r.id))) if (!cover.has(i.work_id)) cover.set(i.work_id, imgSrc(i, "w640"));

  const rows = tokens.map((t) => {
    const l = liveMap.get(t);
    if (l) { const { id, ...rest } = l; return { ...rest, image: cover.get(id) ?? null, gone: false }; }
    const e = (ended as unknown as Ended[] ?? []).find((r) => r.public_token === t);
    return e ? { ...e, status: "", image: null, gone: true } : null;
  }).filter(Boolean);

  return NextResponse.json({ rows });
}
