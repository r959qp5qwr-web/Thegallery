import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { asAccount } from "@/lib/db";
import { StudioHeader } from "@/components/Chrome";

export const dynamic = "force-dynamic";

// "not permitted" is distinct from "not signed in" (PRODUCT_ARCHITECTURE §4.3). Telling a
// signed-in maker to sign in again when the real answer is that this door is not theirs is a
// small lie that costs people minutes.
export default async function OperatorHome() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/operator");
  if (!account.is_operator) {
    return (
      <>
        <StudioHeader title="Operator" back="/" />
        <div className="centre">
          <div className="lbl">Not permitted</div>
          <h1>This door is not yours</h1>
          <p>You are signed in, but this area belongs to the platform operator.</p>
          <Link className="btn" href="/studio">Back to your Studio</Link>
        </div>
      </>
    );
  }

  const { makers, actions } = await asAccount(account.id, async (db) => {
    const makers = (await db.query<{ id: string; handle: string; display_name: string; status: string;
                                     status_reason: string | null; city: string }>(
      "SELECT id, handle, display_name, status, status_reason, city FROM makers ORDER BY display_name")).rows;
    const actions = (await db.query<{ id: string; action: string; subject_id: string; reason: string;
                                      created_at: string }>(
      "SELECT id, action, subject_id, reason, created_at FROM operator_actions ORDER BY created_at DESC LIMIT 20")).rows;
    return { makers, actions };
  });

  return (
    <>
      <StudioHeader title="Operator" back="/" />
      <div className="studio-state">
        <h1>Makers</h1>
        <p className="small" style={{ marginTop: 6 }}>
          Access and safety only. Nothing here ranks, features or judges work.
        </p>
      </div>
      <ul className="rowlist">
        {makers.map((m) => (
          <li key={m.id}>
            <Link className="grow" href={`/operator/makers/${m.id}`} style={{ textDecoration: "none" }}>
              <span className="primary">{m.display_name}</span>
              <span className="secondary">{m.city} · {m.status}
                {m.status_reason ? ` · ${m.status_reason}` : ""}</span>
            </Link>
            <span className={`chip ${m.status === "active" ? "available" : ""}`}>{m.status}</span>
          </li>
        ))}
      </ul>
      <div className="section">
        <div className="lead">Recorded actions</div>
        {actions.length ? (
          <ul className="rowlist" style={{ padding: 0 }}>
            {actions.map((a) => (
              <li key={a.id}>
                <span className="grow">
                  <span className="primary">{a.action.replace("_", " ")}</span>
                  <span className="secondary">{a.reason} · {new Date(a.created_at).toLocaleString("en-IN")}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="body">Nothing has been actioned.</p>}
      </div>
    </>
  );
}
