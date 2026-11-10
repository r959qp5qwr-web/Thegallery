"use client";
import { useEffect, useState } from "react";

/** Save draft in the editor's header (drawing board, screen 13). It sits outside the form and
 *  submits it through the form attribute, so the form's own pending state does not reach it:
 *  it watches the form instead — disabled and "Saving…" from the moment the form is sent until
 *  the form is reset after an answer — so a second tap cannot create a second work. */
export function DraftButton({ form }: { form: string }) {
  const [busy, setBusy] = useState<"draft" | "other" | null>(null);
  useEffect(() => {
    const el = document.getElementById(form) as HTMLFormElement | null;
    if (!el) return;
    const sent = (e: SubmitEvent) => {
      const s = e.submitter as HTMLButtonElement | null;
      setBusy(s?.value === "publish" ? "other" : "draft");
    };
    const done = () => setBusy(null);
    el.addEventListener("submit", sent);
    el.addEventListener("reset", done);
    return () => { el.removeEventListener("submit", sent); el.removeEventListener("reset", done); };
  }, [form]);
  return (
    <button className="hdr-link" type="submit" form={form} name="intent" value="draft" disabled={!!busy}>
      {busy === "draft" ? "Saving…" : "Save draft"}
    </button>
  );
}
