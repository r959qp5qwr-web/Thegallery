"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Field } from "./ActionForm";

/** The Studio's photo picker (Wave 5): the native file input stays the control (keyboard, screen
 *  reader, the phone's own camera/gallery chooser), visually replaced by a designed button and a
 *  line naming what was chosen. The browser's grey "Choose File / No file chosen" no longer shows.
 *  React resets a form's fields after each action (ActionForm), so the line is cleared on the
 *  form's reset too: it must never name a file the input no longer holds. */
export function PhotoPicker({ required, help }: { required?: boolean; help?: React.ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = input.current?.form;
    const clear = () => setName(null);
    form?.addEventListener("reset", clear);
    return () => form?.removeEventListener("reset", clear);
  }, []);
  return (
    <div className="field picker">
      <input ref={input} id="image" name="image" type="file" accept="image/*" required={required} className="picker-input"
             onChange={(e) => setName(e.currentTarget.files?.[0]?.name ?? null)} />
      <label htmlFor="image" className="btn picker-btn">Choose a photograph</label>
      <span className="picker-name" aria-live="polite">{name ?? "No photograph chosen yet"}</span>
      {help ? <div className="help picker-help" id="image-help">{help}</div> : null}
    </div>
  );
}

/** Add a work (drawing board, screen 13): photos first. The chosen photograph shows as a tile
 *  beside an "Add photo" tile; the native file input stays the control under the label. More
 *  photographs are added on the work's own page after the first save. */
export function PhotoTiles() {
  const [chosen, setChosen] = useState<{ name: string; url: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = input.current?.form;
    const clear = () => setChosen(null);
    form?.addEventListener("reset", clear);
    return () => form?.removeEventListener("reset", clear);
  }, []);
  useEffect(() => () => { if (chosen) URL.revokeObjectURL(chosen.url); }, [chosen]);
  return (
    <div className="photo-tiles">
      <div className="thumbs">
        {chosen ? <div className="thumb"><img src={chosen.url} alt="" /></div> : null}
        <input ref={input} id="image" name="image" type="file" accept="image/*" className="picker-input"
               onChange={(e) => {
                 const f = e.currentTarget.files?.[0];
                 setChosen(f ? { name: f.name, url: URL.createObjectURL(f) } : null);
               }} />
        <label htmlFor="image" className="add-photo">
          <Icon name="image" />
          <span>{chosen ? "Change photo" : "Add photo"}</span>
        </label>
      </div>
      <p className="picker-name" aria-live="polite">{chosen ? chosen.name : "The first photo is the cover. Nothing is cropped."}</p>
      {/* Its description is asked for once there is a photo to describe (the board puts the title
          straight after the photos). */}
      {chosen ? (
        <Field name="alt_text" label="Describe the photo" help="For anyone who cannot see it. Optional." />
      ) : null}
    </div>
  );
}
