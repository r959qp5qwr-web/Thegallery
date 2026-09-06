"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./Icon";

export type FormState = { error?: string; notice?: string };

function Submit({ label, busy, block = true, className = "btn" }:
                { label: string; busy: string; block?: boolean; className?: string }) {
  const { pending } = useFormStatus();
  // Disabling while a submit is in flight is the first defence against a double publish; the
  // idempotency key carried in the form is the one that actually holds, because a reload or a
  // second tab does not see this button.
  return (
    <button className={`${className}${block ? " block" : ""}`} type="submit" disabled={pending}>
      {pending ? busy : label}
    </button>
  );
}

export function ActionForm(
  { action, submitLabel, busyLabel = "Working…", children, hidden, className = "form", secondary }:
  {
    action: (prev: FormState, form: FormData) => Promise<FormState>;
    submitLabel: string; busyLabel?: string; children: React.ReactNode;
    hidden?: Record<string, string>; className?: string; secondary?: React.ReactNode;
  },
) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form className={className} action={formAction}>
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {state.error ? (
        <div className="band fail" role="alert" data-testid="form-error" style={{ marginTop: 16 }}>
          <Icon name="warning" /><div className="grow"><p>{state.error}</p></div>
        </div>
      ) : null}
      {state.notice ? (
        <div className="band" role="status" data-testid="form-notice" style={{ marginTop: 16 }}>
          <Icon name="check" /><div className="grow"><p>{state.notice}</p></div>
        </div>
      ) : null}
      {children}
      <div className="inline-actions" style={{ padding: "20px 0 0" }}>
        <Submit label={submitLabel} busy={busyLabel} />
      </div>
      {secondary}
    </form>
  );
}

export function Field(
  { name, label, help, type = "text", defaultValue, placeholder, required, textarea, children }:
  {
    name: string; label: string; help?: string; type?: string; defaultValue?: string | number | null;
    placeholder?: string; required?: boolean; textarea?: boolean; children?: React.ReactNode;
  },
) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children ?? (textarea
        ? <textarea id={name} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} />
        : <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""}
                 placeholder={placeholder} required={required} />)}
      {help ? <div className="help">{help}</div> : null}
    </div>
  );
}
