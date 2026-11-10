"use client";
import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./Icon";

/** `field` names the input a refusal is about; `values` is what the person typed, handed back so
 *  a refusal never empties the form (React resets uncontrolled fields after an action). */
export type FormState = { error?: string; notice?: string; field?: string; values?: Record<string, string> };

const FormStateContext = createContext<FormState>({});
export function useFormState(): FormState { return useContext(FormStateContext); }

function Submit({ label, busy, block = true, className = "btn", name, value, otherBusy }:
                { label: string; busy: string; block?: boolean; className?: string; name?: string; value?: string;
                  /** What this button says while the form was sent by another button (Save draft). */
                  otherBusy?: string }) {
  const { pending, data } = useFormStatus();
  const mine = !name || !data || data.get(name) === value;
  // Disabling while a submit is in flight is the first defence against a double publish; the
  // idempotency key carried in the form is the one that actually holds, because a reload or a
  // second tab does not see this button.
  return (
    <button className={`${className}${block ? " block" : ""}`} type="submit" disabled={pending} name={name} value={value}>
      {pending ? (mine ? busy : otherBusy ?? busy) : label}
    </button>
  );
}

export function ActionForm(
  { action, submitLabel, busyLabel = "Working…", children, hidden, className = "form", secondary, bar, dock, id }:
  {
    action: (prev: FormState, form: FormData) => Promise<FormState>;
    submitLabel: string; busyLabel?: string; children: React.ReactNode;
    hidden?: Record<string, string>; className?: string; secondary?: React.ReactNode;
    /** Plate R-3: the form's action stays in reach in a bar fixed to the bottom of the form. */
    bar?: React.ReactNode;
    /** Drawing board: the screen's one action, solid ink, docked at the foot of a phone (in the
     *  form's flow from 900 px). `name`/`value` say which act it is when a form has two. */
    dock?: { name?: string; value?: string; otherBusy?: string; extra?: React.ReactNode } | true;
    id?: string;
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
    <form className={className} action={formAction} ref={formRef} id={id}>
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
      {dock ? (
        <div className="workbar dock">
          <Submit label={submitLabel} busy={busyLabel} block={false} className="btn solid"
                  name={dock === true ? undefined : dock.name} value={dock === true ? undefined : dock.value}
                  otherBusy={dock === true ? undefined : dock.otherBusy} />
          {dock !== true && dock.extra ? dock.extra : null}
        </div>
      ) : bar !== undefined ? (
        <div className="actionbar form-bar">
          <Submit label={submitLabel} busy={busyLabel} block={false} />
          {bar}
        </div>
      ) : (
        <div className="inline-actions" style={{ padding: "20px 0 0" }}>
          <Submit label={submitLabel} busy={busyLabel} />
        </div>
      )}
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

/** A select that keeps the person's choice through a refusal, like Field does for text. */
export function KeptSelect(
  { name, defaultValue, children }: { name: string; defaultValue: string; children: React.ReactNode },
) {
  const state = useFormState();
  const invalid = state.field === name;
  return (
    // Keyed on the kept value: React applies a select's default only when it mounts, so the form
    // reset after a refusal would otherwise put back the saved choice instead of the typed one.
    <select key={state.values?.[name] ?? ""} id={name} name={name} defaultValue={state.values?.[name] ?? defaultValue}
            aria-invalid={invalid || undefined}>
      {children}
    </select>
  );
}

/** A checkbox that keeps its state through a refusal. An unticked box sends nothing, so once a
 *  refusal has handed values back, absence means unticked. */
export function KeptCheckbox({ name, defaultChecked }: { name: string; defaultChecked?: boolean }) {
  const state = useFormState();
  const checked = state.values ? state.values[name] === "on" : !!defaultChecked;
  return <input key={String(checked)} type="checkbox" id={name} name={name} defaultChecked={checked} />;
}
