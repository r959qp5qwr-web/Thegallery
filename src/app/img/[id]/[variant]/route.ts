import { NextResponse } from "next/server";
import { publicImageByIdAny } from "@/lib/queries";
import { readVariant } from "@/lib/storage";
import { asAuthStore } from "@/lib/db";
import { currentAccount } from "@/lib/auth";

// Pixels are a permission surface, not a static asset.
//
// The bytes of a draft, retired, taken-down or suspended work must not be fetchable by anyone
// who guesses the URL. So this route asks the same public view every other public surface
// asks; only if the image is publicly visible does it read the file. A maker may additionally
// see their own images while they are still drafts, checked separately against their account.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  let storageKey: string | null = null;
  const pub = await publicImageByIdAny(id);
  if (pub) {
    storageKey = await asAuthStore(async (db) =>
      (await db.query<{ storage_key: string }>("SELECT storage_key FROM work_images WHERE id = $1", [id]))
        .rows[0]?.storage_key ?? null);
  } else {
    const account = await currentAccount();
    if (!account) return new NextResponse("Not found", { status: 404 });
    storageKey = await asAuthStore(async (db) =>
      (await db.query<{ storage_key: string }>(
        `SELECT i.storage_key FROM work_images i
           JOIN works w     ON w.id = i.work_id
           JOIN galleries g ON g.id = w.gallery_id
           JOIN makers m    ON m.id = g.maker_id
          WHERE i.id = $1 AND m.account_id = $2`, [id, account.id])).rows[0]?.storage_key ?? null);
  }
  if (!storageKey) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await readVariant(storageKey, variant);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(bytes.length),
        // Private: the same URL stops being public when a work is retired or its maker
        // suspended, so a shared cache must not keep serving it.
        "cache-control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
