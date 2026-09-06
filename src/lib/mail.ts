import type { Db } from "./db";

/**
 * Outbound mail.
 *
 * Every message is recorded in `dev_outbox` first, in every mode. That record is the retry
 * path and the audit trail: if a send fails, the link still exists and can be re-sent rather
 * than being lost inside a provider's error.
 *
 * Modes:
 *   outbox  — record and SEND NOTHING. The local default. No session may describe an outbox
 *             row as a delivered email; nothing leaves the machine.
 *   resend  — record, then POST to the Resend API. IMPLEMENTED, NOT TESTED: this environment
 *             has no sender credential and no egress to a mail provider, so the first real
 *             deployment is what proves it. Until then it is code, not evidence.
 */
export type Message = { to: string; subject: string; body: string; link?: string };

export async function deliver(db: Db, m: Message): Promise<void> {
  await db.query(
    "INSERT INTO dev_outbox (to_email, subject, body, link) VALUES ($1, $2, $3, $4)",
    [m.to, m.subject, m.body, m.link ?? null]);

  const mode = process.env.GALLERY_MAIL ?? "outbox";
  if (mode === "outbox") return;

  if (mode === "resend") {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.GALLERY_MAIL_FROM;
    if (!key || !from) {
      throw new Error("GALLERY_MAIL=resend needs RESEND_API_KEY and GALLERY_MAIL_FROM. " +
        "The message is recorded in dev_outbox and can be re-sent once they are set.");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from, to: [m.to], subject: m.subject,
        text: m.link ? `${m.body}\n\n${m.link}\n` : `${m.body}\n`,
      }),
    });
    if (!res.ok) {
      throw new Error(`the mail provider refused this message (${res.status}). ` +
        "It is recorded in dev_outbox and can be re-sent.");
    }
    return;
  }

  throw new Error(`GALLERY_MAIL=${mode} names a sender this build does not have. ` +
    "Only 'outbox' and 'resend' exist.");
}
