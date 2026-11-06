"use client";
import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./Icon";

/** `field` names the input a refusal is about; `values` is what the person typed, handed back so
 *  a refusal never empties the form (React resets uncontrolled fields after an action). */
export type FormState = { error?: string; notice?: string; field?: string; values?: Record<string, string> };

const FormStateContext = createContext<FormState>({});
export function useFormState(): FormState { return useContext(FormStateContext); }

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
  const bandRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // After a refusal, focus goes to the field it is about, or to the message when it is about the
  // whole form, so a keyboard or screen-reader user lands on the problem instead of the page.
  useEffect(() => {
    if (!state.error) return;
    const target = state.field ? formRef.current?.querySelector<HTMLElement>(`[name="${state.field}"]`) : null;
    (target ?? bandRef.current)?.focus();
  }, [state]);
  return (
    <FormStateContext.Provider value={state}>
    <form className={className} action={formAction} ref={formRef}>
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {state.error ? (
        <div className="band fail" role="alert" data-testid="form-error" style={{ marginTop: 16 }}
             tabIndex={-1} ref={bandRef}>
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
    </FormStateContext.Provider>
  );
}

export function Field(
  { name, label, help, type = "text", defaultValue, placeholder, required, textarea, children, autoComplete }:
  {
    name: string; label: string; help?: string; type?: string; defaultValue?: string | number | null;
    placeholder?: string; required?: boolean; textarea?: boolean; children?: React.ReactNode;
    autoComplete?: string;
  },
) {
  const state = useFormState();
  const invalid = state.field === name;
  // A password is never handed back: the person types it again.
  const value = type === "password" ? undefined : state.values?.[name] ?? defaultValue ?? "";
  const describedBy = [help ? `${name}-help` : null, invalid ? `${name}-err` : null].filter(Boolean).join(" ") || undefined;
  const common = { id: name, name, placeholder, "aria-invalid": invalid || undefined, "aria-describedby": describedBy };
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children ?? (textarea
        ? <textarea {...common} defaultValue={value ?? ""} />
        : <input {...common} type={type} defaultValue={value ?? ""} required={required} autoComplete={autoComplete} />)}
      {invalid ? <div className="err" id={`${name}-err`}><Icon name="warning" small />{state.error}</div> : null}
      {help ? <div className="help" id={`${name}-help`}>{help}</div> : null}
    </div>
  );
}
