"use client";
import { useEffect, useRef, useState } from "react";

/** The Studio's photo picker (Wave 5): the native file input stays the control (keyboard, screen
 *  reader, the phone's own camera/gallery chooser), visually replaced by a designed button and a
 *  line naming what was chosen. The browser's grey "Choose File / No file chosen" no longer shows.
 *  React resets a form's fields after each action (ActionForm), so the line is cleared on the
 *  form's reset too: it must never name a file the input no longer holds. */
export function PhotoPicker({ required }: { required?: boolean }) {
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
    </div>
  );
}
