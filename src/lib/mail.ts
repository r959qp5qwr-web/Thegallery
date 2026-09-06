import type { Db } from "./db";

// Local mail. GALLERY_MAIL=outbox writes the message to dev_outbox and SENDS NOTHING.
//
// This exists so the confirmation and recovery doors can be walked end to end locally. It is
// not a transactional sender and must never be described as one: no session may claim a real
// email round trip on the strength of an outbox row. Converting this to a real send needs the
// provider credentials listed in doctrine/EXTERNAL_ENABLEMENT.md and product/STAGE_2_VERTICAL_SLICE.md §4.
export type Message = { to: string; subject: string; body: string; link?: string };

export async function deliver(db: Db, m: Message): Promise<void> {
  const mode = process.env.GALLERY_MAIL ?? "outbox";
  if (mode !== "outbox") {
    throw new Error(`GALLERY_MAIL=${mode} names a sender this build does not have. ` +
      "Only 'outbox' exists; a real send needs the provider credentials in doctrine/EXTERNAL_ENABLEMENT.md.");
  }
  await db.query(
    "INSERT INTO dev_outbox (to_email, subject, body, link) VALUES ($1, $2, $3, $4)",
    [m.to, m.subject, m.body, m.link ?? null]);
}
