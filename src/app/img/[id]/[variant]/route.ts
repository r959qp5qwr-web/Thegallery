import { NextResponse } from "next/server";
import { readVariant } from "@/lib/storage";
import { anon, client } from "@/lib/supabase";

// Pixels are a permission surface, not a static asset.
//
// The bytes of a draft, retired, taken-down or suspended work must not be fetchable by anyone
// who guesses the URL. So this route asks the same public view every other public surface
// asks; only if the image is publicly visible does it read the file. A maker may additionally
// see their own images while they are still drafts, checked separately as that maker.
//
// The bucket is private, and the storage policies refuse the bytes to the same callers this
// route refuses the key to. Both walls are independent: if this route were wrong, the store
// would still say no.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  // Published: ask the database for the key of an image it already considers public. The
  // visibility predicate is not restated here — the function reads the same view every other
  // public surface reads.
  const visitor = await anon();
  const { data: publicKey } = await visitor.rpc("storage_key_for_public_image", { p_image_id: id });
  let storageKey = (publicKey as string | null) ?? null;
  let reader = visitor;

  // Not published: a maker may still see their own draft's images. This runs as that maker, so
  // row-level security decides — no privileged credential is involved anywhere in this route.
  if (!storageKey) {
    const mine = await client();
    const { data } = await mine.from("work_images").select("storage_key").eq("id", id).limit(1);
    storageKey = (data?.[0] as { storage_key: string } | undefined)?.storage_key ?? null;
    reader = mine;
  }
  if (!storageKey) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await readVariant(reader, storageKey, variant);
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
