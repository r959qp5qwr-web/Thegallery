import { anon, client, must } from "./supabase";

// Every public read goes through the views in db/migrations/002, which carry the visibility
// predicate from DOMAIN_MODEL §3. No surface writes that predicate again in TypeScript: if it
// were repeated here it would drift, and one surface would eventually show a draft.
//
// Public reads use the session-less client on purpose. A public page viewed by a signed-in
// maker must render what a stranger would see — otherwise their own drafts appear on a surface
// everyone else sees differently, and the person testing it never notices, because they are
// the one signed in.

export type PublicWork = {
  id: string; public_token: string; title: string; material: string; medium: string | null;
  process: string | null; height_mm: number | null; width_mm: number | null; depth_mm: number | null;
  year: number | null; price_mode: string; price_amount: string | null; price_currency: string;
  status: string; status_confirmed_at: string; published_at: string; position: number;
  maker_id: string; maker_handle: string; maker_display_name: string; maker_city: string; maker_kind: string;
};

export type PublicImage = {
  id: string; work_id: string; position: number; width: number; height: number;
  alt_text: string | null; variants: Record<string, string>;
};

export type PublicMaker = {
  id: string; handle: string; display_name: string; kind: string; city: string; region: string | null;
  country: string; exact_address: string | null; practice_note: string | null;
  commissions_open: boolean; commissions_note: string | null; gallery_id: string;
  gallery_intro: string | null; gallery_published_at: string;
};

const WORK_COLS = "id,public_token,title,material,medium,process,height_mm,width_mm,depth_mm," +
  "year,price_mode,price_amount,price_currency,status,status_confirmed_at,published_at,position," +
  "maker_id,maker_handle,maker_display_name,maker_city,maker_kind";

export async function listRecentWorks(limit = 12): Promise<PublicWork[]> {
  const db = await anon();
  return must(await db.from("public_works").select(WORK_COLS)
    .order("published_at", { ascending: false }).limit(limit), "recent works") as unknown as PublicWork[];
}

export async function listWorksByMaterial(material: string, limit = 40): Promise<PublicWork[]> {
  const db = await anon();
  return must(await db.from("public_works").select(WORK_COLS).eq("material", material)
    .order("published_at", { ascending: false }).limit(limit), "works by material") as unknown as PublicWork[];
}

export async function listWorksByMaker(handle: string): Promise<PublicWork[]> {
  const db = await anon();
  return must(await db.from("public_works").select(WORK_COLS).eq("maker_handle", handle)
    .order("position").order("published_at", { ascending: false }), "works by maker") as unknown as PublicWork[];
}

export async function getWork(token: string): Promise<PublicWork | null> {
  const db = await anon();
  const { data } = await db.from("public_works").select(WORK_COLS).eq("public_token", token).limit(1);
  return (data?.[0] as unknown as PublicWork | undefined) ?? null;
}

/** A retired, taken-down or suspended work keeps its URL and gets a truthful ending. */
export async function getWorkEnding(token: string) {
  const db = await anon();
  const { data } = await db.from("public_work_endings")
    .select("public_token,title,lifecycle,taken_down,maker_handle,maker_display_name,maker_status")
    .eq("public_token", token).limit(1);
  return (data?.[0] as unknown as {
    public_token: string; title: string; lifecycle: string; taken_down: boolean;
    maker_handle: string; maker_display_name: string; maker_status: string;
  } | undefined) ?? null;
}

export async function getMaker(handle: string): Promise<PublicMaker | null> {
  const db = await anon();
  const { data } = await db.from("public_makers").select("*").eq("handle", handle).limit(1);
  return (data?.[0] as unknown as PublicMaker | undefined) ?? null;
}

export async function imagesFor(workIds: string[]): Promise<PublicImage[]> {
  if (!workIds.length) return [];
  const db = await anon();
  return must(await db.from("public_work_images")
    .select("id,work_id,position,width,height,alt_text,variants")
    .in("work_id", workIds).order("work_id").order("position"), "images") as unknown as PublicImage[];
}

export async function routesFor(makerId: string) {
  const db = await anon();
  return must(await db.from("public_contact_routes").select("id,kind,value,label")
    .eq("maker_id", makerId).order("position").order("kind"), "routes") as unknown as
    { id: string; kind: string; value: string; label: string | null }[];
}

export async function materials() {
  const db = await anon();
  return must(await db.from("material_categories").select("key,label").eq("active", true)
    .order("position"), "materials") as unknown as { key: string; label: string }[];
}

/**
 * Search across published works and active makers. Title, maker name, material and medium —
 * the fields a visitor actually types. Ranking is by recency, never by popularity: there is
 * no engagement signal in this product to rank by (GAL-OD-09).
 */
export async function search(q: string) {
  const term = q.trim();
  if (!term) return { works: [] as PublicWork[], makers: [] as PublicMaker[] };
  const db = await anon();

  // PostgREST's `or` filter is a comma-separated list, and its values are quoted strings. A
  // search for `a,b` or for a stray quote would otherwise be read as filter syntax rather than
  // as what someone typed, so the term is escaped for both layers: `\` and `%` and `_` for
  // LIKE, then `"` for the filter grammar.
  const like = term.replace(/[\\%_]/g, (m) => "\\" + m);
  const quoted = `"*${like.replace(/["\\]/g, (m) => "\\" + m)}*"`;
  const anyOf = (cols: string[]) => cols.map((c) => `${c}.ilike.${quoted}`).join(",");

  const works = await db.from("public_works").select(WORK_COLS)
    .or(anyOf(["title", "maker_display_name", "material", "medium"]))
    .order("published_at", { ascending: false }).limit(40);
  const makers = await db.from("public_makers").select("*")
    .or(anyOf(["display_name", "handle", "city"]))
    .order("display_name").limit(20);

  return {
    works: (works.data ?? []) as unknown as PublicWork[],
    makers: (makers.data ?? []) as unknown as PublicMaker[],
  };
}

// ------------------------------------------------------------------- signed-in maker reads
export type StudioWork = PublicWork & { lifecycle: string; taken_down: boolean; gallery_id: string };

export type StudioMaker = {
  id: string; handle: string; display_name: string; kind: string; city: string;
  practice_note: string | null; commissions_open: boolean; commissions_note: string | null;
  status: string; status_reason: string | null; exact_address: string | null; exact_address_public: boolean;
};

/**
 * Everything the Studio needs about the signed-in maker.
 *
 * No `where user_id = ...` anywhere below, and that is the point: row-level security scopes
 * every one of these reads to the caller. A filter written here as well would be a second
 * opinion about who someone is, and the day the two disagreed the filter would win silently.
 */
export async function studioContext(_accountId: string) {
  const db = await client();
  const { data: makers } = await db.from("makers").select("*").limit(1);
  const maker = (makers?.[0] as unknown as StudioMaker | undefined) ?? null;
  if (!maker) return { maker: null, gallery: null, works: [], routes: [] };

  const { data: galleries } = await db.from("galleries").select("id,lifecycle,intro").limit(1);
  const gallery = (galleries?.[0] as unknown as { id: string; lifecycle: string; intro: string | null } | undefined) ?? null;

  const { data: works } = gallery
    ? await db.from("works")
        .select("id,title,status,lifecycle,taken_down,material,public_token,updated_at")
        .eq("gallery_id", gallery.id).order("updated_at", { ascending: false })
    : { data: [] };

  const { data: routes } = await db.from("contact_routes")
    .select("id,kind,value,label,enabled,validated").order("position");

  return {
    maker, gallery,
    works: (works ?? []) as unknown as { id: string; title: string; status: string; lifecycle: string;
                              taken_down: boolean; material: string; public_token: string; updated_at: string }[],
    routes: (routes ?? []) as unknown as { id: string; kind: string; value: string; label: string | null;
                                 enabled: boolean; validated: boolean }[],
  };
}
