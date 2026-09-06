import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { asAccount } from "@/lib/db";
import { StudioHeader, Band } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { setMakerAccessAction } from "@/app/actions/operator";

export const dynamic = "force-dynamic";

export default async function OperatorMaker({ params }: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in");
  if (!account.is_operator) redirect("/operator");
  const { id } = await params;

  const data = await asAccount(account.id, async (db) => {
    const maker = (await db.query<{ id: string; handle: string; display_name: string; status: string;
                                    status_reason: string | null; city: string; kind: string }>(
      "SELECT id, handle, display_name, status, status_reason, city, kind FROM makers WHERE id = $1", [id])).rows[0];
    if (!maker) return null;
    const history = (await db.query<{ id: string; action: string; reason: string; created_at: string }>(
      `SELECT id, action, reason, created_at FROM operator_actions
        WHERE subject_type = 'maker' AND subject_id = $1 ORDER BY created_at DESC`, [id])).rows;
    return { maker, history };
  });
  if (!data) notFound();
  const { maker, history } = data;
  const suspended = maker.status === "suspended";

  return (
    <>
      <StudioHeader title="Maker" back="/operator" />
      <div className="studio-state">
        <h1>{maker.display_name}</h1>
        <p className="small">{maker.kind} · {maker.city} · <Link href={`/m/${maker.handle}`}>/m/{maker.handle}</Link></p>
      </div>
      {suspended ? (
        <Band kind="warn" label="Suspended">{maker.status_reason ?? "No reason recorded."}</Band>
      ) : null}

      <ActionForm action={setMakerAccessAction}
                  submitLabel={suspended ? "Reinstate this maker" : "Suspend this maker"}
                  busyLabel="Recording…"
                  hidden={{ maker_id: maker.id, action: suspended ? "reinstate" : "suspend" }}>
        <Field name="reason" label="Reason" textarea required
               help={suspended
                 ? "Why the suspension is being lifted. It goes on the record."
                 : "What rule was broken, in words the maker will read. Required, and recorded permanently."} />
      </ActionForm>

      <div className="section">
        <div className="lead">Record</div>
        {history.length ? (
          <ul className="rowlist" style={{ padding: 0 }}>
            {history.map((h) => (
              <li key={h.id}>
                <span className="grow">
                  <span className="primary">{h.action}</span>
                  <span className="secondary">{h.reason} · {new Date(h.created_at).toLocaleString("en-IN")}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="body">No action has been taken on this maker.</p>}
        <p className="small" style={{ marginTop: 12 }}>This record cannot be edited or deleted, by anyone.</p>
      </div>
    </>
  );
}
