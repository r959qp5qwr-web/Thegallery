"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { publishWorkAction } from "@/app/actions/studio";
import { Icon } from "./Icon";

function Button({ can }: { can: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn block" type="submit" disabled={pending || !can} data-testid="publish">
      {pending ? "Publishing…" : "Publish"}
    </button>
  );
}

export function PublishButton(
  { workId, intentKey, canPublish }: { workId: string; intentKey: string; canPublish: boolean },
) {
  const [state, action] = useActionState(publishWorkAction, {} as { error?: string; notice?: string });
  return (
    <form action={action} className="form">
      <input type="hidden" name="work_id" value={workId} />
      {/* The key is minted on the server when the page renders. Both presses of a
          double-click carry it, so the second one is answered rather than applied. */}
      <input type="hidden" name="intent_key" value={intentKey} />
      {state.error ? (
        <div className="band fail" role="alert" data-testid="form-error" style={{ marginTop: 12 }}>
          <Icon name="warning" /><div className="grow"><p>{state.error}</p></div>
        </div>
      ) : null}
      {state.notice ? (
        <div className="band" role="status" data-testid="form-notice" style={{ marginTop: 12 }}>
          <Icon name="check" /><div className="grow"><p>{state.notice}</p></div>
        </div>
      ) : null}
      {!canPublish ? (
        <div className="hint" style={{ padding: "12px 0 0" }}>
          Add one image that finished uploading, and Publish opens.
        </div>
      ) : null}
      <div className="actionbar" style={{ marginTop: 16 }}>
        <Button can={canPublish} />
        <Link className="btn quiet" href="/studio"><span>Back</span></Link>
      </div>
    </form>
  );
}
