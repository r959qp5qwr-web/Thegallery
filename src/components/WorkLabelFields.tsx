"use client";
import { Field, useFormState } from "./ActionForm";

/** The work as a person writes it, used by Add a work and by Edit label so the two can never
 *  drift apart. Material and price mode are segmented controls (INTERFACE_FOUNDATION §7):
 *  a small closed set reads best laid out, not hidden in a menu. */
export type LabelValues = {
  title?: string; material?: string; medium?: string | null; process?: string | null;
  height_mm?: number | null; width_mm?: number | null; depth_mm?: number | null; year?: number | null;
  price_mode?: string; price_amount?: string | null; status?: string;
};

const cm = (mm?: number | null) => (mm ? String(mm / 10) : "");

export const PRICE_MODES = [
  { key: "exact", label: "Fixed price" },
  { key: "enquire", label: "On enquiry" },
  { key: "made_to_order", label: "Made to order" },
];

export function Segmented({ name, legend, options, value, help }:
  { name: string; legend: string; options: { key: string; label: string }[]; value?: string; help?: string }) {
  const state = useFormState();
  const chosen = state.values?.[name] ?? value;
  return (
    <fieldset className="field segfield">
      <legend>{legend}</legend>
      <div className="seg">
        {options.map((o, i) => (
          <label key={o.key}>
            <input type="radio" name={name} value={o.key} defaultChecked={chosen ? chosen === o.key : i === 0}
                   data-testid={`${name}-${o.key}`} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {help ? <div className="help">{help}</div> : null}
    </fieldset>
  );
}

export function WorkLabelFields({ materials, values = {}, withStatus = true, defaultMaterial, titleOptional }:
  { materials: { key: string; label: string }[]; values?: LabelValues; withStatus?: boolean; defaultMaterial?: string;
    /** Add work: a draft may start from an image alone (decision R1); the server asks for the
     *  title when there is no image, and before publishing. */
    titleOptional?: boolean }) {
  const typed = useFormState().values;
  return (
    <>
      {/* Plate R-3: the label in groups, each with its lead rule; short values in short fields. */}
      <div className="group"><div className="ghead">The label</div></div>
      <Field name="title" label="Title" required={!titleOptional} defaultValue={values.title}
             help={titleOptional ? "Needed before you publish." : undefined} />
      <Segmented name="material" legend="Material" options={materials}
                 value={values.material ?? defaultMaterial} />
      <Field name="medium" label="Medium" defaultValue={values.medium}
             help="How you would write it on a wall label, for example “Wood-fired stoneware”." />
      <fieldset className="field segfield">
        <legend>Dimensions (cm)</legend>
        <div className="inline dims-inputs">
          {(["height", "width", "depth"] as const).map((d) => (
            <label key={d} className="sub">
              <span>{d[0].toUpperCase() + d.slice(1)}</span>
              <input name={`${d}_cm`} inputMode="decimal" defaultValue={typed?.[`${d}_cm`] ?? cm(values[`${d}_mm`])}
                     aria-label={`${d[0].toUpperCase() + d.slice(1)} in centimetres`} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field-short"><Field name="year" label="Year" defaultValue={values.year ?? undefined} /></div>
      <div className="group"><div className="ghead">Price and status</div></div>
      <Segmented name="price_mode" legend="Price" options={PRICE_MODES} value={values.price_mode}
                 help="Whatever you choose, the sale happens between you and the visitor. The Gallery takes no part in it." />
      <div className="field-short"><Field name="price_amount" label="Amount (₹)" defaultValue={values.price_amount ?? undefined}
             help="Only shown with a fixed price." /></div>
      {withStatus ? (
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={typed?.status ?? values.status ?? "available"}>
            <option value="available">Available</option>
            <option value="made_to_order">Made to order</option>
            <option value="enquire">Enquire</option>
            <option value="on_view">On view</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      ) : null}
      <Field name="process" label="About this work" textarea defaultValue={values.process}
             help="Optional, shown in your words under “About this work”." />
    </>
  );
}
