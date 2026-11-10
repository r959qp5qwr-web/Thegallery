"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

// Saves are private and device-local (GAL-OD-09, GAL-OD-08 as it stands): nothing is sent to
// a server, there is no visitor account, and no count is ever shown to anyone. The shelf is
// the visitor's notebook, not a signal the product reads.
const KEY = "gallery.saved.v1";

export function readSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; }
}

/** The heart on a work's photograph (drawing board, screen 2). The same mark as Saved in the
 *  bar; filled when the work is on this phone's shelf. A round toggle over the picture: one
 *  name, "Save", and its state in aria-pressed, so a screen reader says it once. */
export function SaveButton({ token }: { token: string }) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { setSaved(readSaved().includes(token)); setReady(true); }, [token]);

  function toggle() {
    const next = saved ? readSaved().filter((t) => t !== token) : [...new Set([...readSaved(), token])];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: the page still works */ }
    setSaved(!saved);
  }

  return (
    <button className={`roundbtn${saved ? " on" : ""}`} type="button" onClick={toggle}
            aria-pressed={ready ? saved : undefined} aria-label="Save"
            data-testid="save-work">
      <Icon name={saved ? "heart-on" : "heart"} />
    </button>
  );
}
