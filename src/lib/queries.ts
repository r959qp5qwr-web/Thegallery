import { asAnon, asAccount, type Db } from "./db";

// Every public read goes through the views in db/migrations/002, which carry the visibility
// predicate from DOMAIN_MODEL §3. No surface writes that predicate again in TypeScript: if it
// were repeated here it would drift, and one surface would eventually show a draft.

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

const WORK_COLS = `id, public_token, title, material, medium, process, height_mm, width_mm, depth_mm,
  year, price_mode, price_amount, price_currency, status, status_confirmed_at, published_at, position,
  maker_id, maker_handle, maker_display_name, maker_city, maker_kind`;

export const listRecentWorks = (limit = 12) =>
  asAnon(async (db) => (await db.query<PublicWork>(
    `SELECT ${WORK_COLS} FROM public_works ORDER BY published_at DESC LIMIT $1`, [limit])).rows);

export const listWorksByMaterial = (material: string, limit = 40) =>
  asAnon(async (db) => (await db.query<PublicWork>(
    `SELECT ${WORK_COLS} FROM public_works WHERE material = $1 ORDER BY published_at DESC LIMIT $2`,
    [material, limit])).rows);

export const listWorksByMaker = (handle: string) =>
  asAnon(async (db) => (await db.query<PublicWork>(
    `SELECT ${WORK_COLS} FROM public_works WHERE maker_handle = $1 ORDER BY position, published_at DESC`,
    [handle])).rows);

export const getWork = (token: string) =>
  asAnon(async (db) => (await db.query<PublicWork>(
    `SELECT ${WORK_COLS} FROM public_works WHERE public_token = $1`, [token])).rows[0] ?? null);

/** A retired, taken-down or suspended work keeps its URL and gets a truthful ending. */
export const getWorkEnding = (token: string) =>
  asAnon(async (db) => (await db.query<{
    public_token: string; title: string; lifecycle: string; taken_down: boolean;
    maker_handle: string; maker_display_name: string; maker_status: string;
  }>(`SELECT public_token, title, lifecycle, taken_down, maker_handle, maker_display_name, maker_status
        FROM public_work_endings WHERE public_token = $1`, [token])).rows[0] ?? null);

export const getMaker = (handle: string) =>
  asAnon(async (db) => (await db.query<PublicMaker>(
    "SELECT * FROM public_makers WHERE handle = $1", [handle])).rows[0] ?? null);

export const imagesFor = (workIds: string[]) =>
  asAnon(async (db) => {
    if (!workIds.length) return [] as PublicImage[];
    return (await db.query<PublicImage>(
      `SELECT id, work_id, position, width, height, alt_text, variants
         FROM public_work_images WHERE work_id = ANY($1::uuid[]) ORDER BY work_id, position`,
      [workIds])).rows;
  });

export const routesFor = (makerId: string) =>
  asAnon(async (db) => (await db.query<{ id: string; kind: string; value: string; label: string | null }>(
    `SELECT id, kind, value, label FROM public_contact_routes WHERE maker_id = $1 ORDER BY position, kind`,
    [makerId])).rows);

export const materials = () =>
  asAnon(async (db) => (await db.query<{ key: string; label: string }>(
    "SELECT key, label FROM material_categories WHERE active ORDER BY position")).rows);

/**
 * Search across published works and active makers. Title, maker name, material and medium —
 * the fields a visitor actually types. Ranking is by recency, never by popularity: there is
 * no engagement signal in this product to rank by (GAL-OD-09).
 */
export async function search(q: string) {
  const term = q.trim();
  if (!term) return { works: [] as PublicWork[], makers: [] as PublicMaker[] };
  const like = `%${term.replace(/[%_]/g, (m) => "\\" + m)}%`;
  return asAnon(async (db) => {
    const works = await db.query<PublicWork>(
      `SELECT ${WORK_COLS} FROM public_works
        WHERE title ILIKE $1 OR maker_display_name ILIKE $1 OR material ILIKE $1
           OR COALESCE(medium, '') ILIKE $1
        ORDER BY published_at DESC LIMIT 40`, [like]);
    const makers = await db.query<PublicMaker>(
      `SELECT * FROM public_makers
        WHERE display_name ILIKE $1 OR handle ILIKE $1 OR city ILIKE $1
        ORDER BY display_name LIMIT 20`, [like]);
    return { works: works.rows, makers: makers.rows };
  });
}

// ------------------------------------------------------------------- signed-in maker reads
export type StudioWork = PublicWork & { lifecycle: string; taken_down: boolean; gallery_id: string };

export const studioContext = (accountId: string) =>
  asAccount(accountId, async (db: Db) => {
    const maker = (await db.query<{
      id: string; handle: string; display_name: string; kind: string; city: string;
      practice_note: string | null; commissions_open: boolean; commissions_note: string | null;
      status: string; status_reason: string | null; exact_address: string | null; exact_address_public: boolean;
    }>("SELECT * FROM makers WHERE account_id = $1", [accountId])).rows[0] ?? null;
    if (!maker) return { maker: null, gallery: null, works: [], routes: [] };
    const gallery = (await db.query<{ id: string; lifecycle: string; intro: string | null }>(
      "SELECT id, lifecycle, intro FROM galleries WHERE maker_id = $1", [maker.id])).rows[0] ?? null;
    const works = gallery
      ? (await db.query<{ id: string; title: string; status: string; lifecycle: string; taken_down: boolean;
                          material: string; public_token: string; updated_at: string }>(
          `SELECT id, title, status, lifecycle, taken_down, material, public_token, updated_at
             FROM works WHERE gallery_id = $1 ORDER BY updated_at DESC`, [gallery.id])).rows
      : [];
    const routes = (await db.query<{ id: string; kind: string; value: string; label: string | null;
                                     enabled: boolean; validated: boolean }>(
      "SELECT id, kind, value, label, enabled, validated FROM contact_routes WHERE maker_id = $1 ORDER BY position",
      [maker.id])).rows;
    return { maker, gallery, works, routes };
  });
