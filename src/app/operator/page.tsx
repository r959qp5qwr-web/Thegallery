import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { client } from "@/lib/supabase";
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

  // No operator filter here, and none is needed: the policy on `makers` widens to every row
  // only for a caller is_operator() accepts, and `operator_actions` is readable by nobody
  // else at all. An ordinary maker running this same code sees their own row and no history.
  const db = await client();
  const { data: makerRows } = await db.from("makers")
    .select("id,handle,display_name,status,status_reason,city").order("display_name");
  const { data: actionRows } = await db.from("operator_actions")
    .select("id,action,subject_id,reason,created_at").order("created_at", { ascending: false }).limit(20);

  const makers = (makerRows ?? []) as unknown as { id: string; handle: string; display_name: string;
    status: string; status_reason: string | null; city: string }[];
  const actions = (actionRows ?? []) as unknown as { id: string; action: string; subject_id: string;
    reason: string; created_at: string }[];

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
