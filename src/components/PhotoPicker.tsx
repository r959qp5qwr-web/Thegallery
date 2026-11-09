"use client";
import { useState } from "react";

/** The Studio's photo picker (Wave 5): the native file input stays the control (keyboard, screen
 *  reader, the phone's own camera/gallery chooser), visually replaced by a designed button and a
 *  line naming what was chosen. The browser's grey "Choose File / No file chosen" no longer shows. */
export function PhotoPicker({ required }: { required?: boolean }) {
  const [name, setName] = useState<string | null>(null);
  return (
    <div className="field picker">
      <input id="image" name="image" type="file" accept="image/*" required={required} className="picker-input"
             onChange={(e) => setName(e.currentTarget.files?.[0]?.name ?? null)} />
      <label htmlFor="image" className="btn picker-btn">Choose a photograph</label>
      <span className="picker-name" aria-live="polite">{name ?? "No photograph chosen yet"}</span>
    </div>
  );
}
