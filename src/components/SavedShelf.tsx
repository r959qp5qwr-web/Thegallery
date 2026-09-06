"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readSaved } from "./SaveButton";

type Row = { public_token: string; title: string; maker_display_name: string; status: string; gone: boolean };

// The shelf reads the visitor's own device list and asks the server only what those tokens
// currently are. A saved work that has since been retired stays on the shelf and is labelled
// (PRODUCT_ARCHITECTURE §4.1) — losing it silently would be the product editing the visitor's
// notebook.
export function SavedShelf() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const tokens = readSaved();
    if (!tokens.length) { setRows([]); return; }
    fetch(`/api/saved?tokens=${encodeURIComponent(tokens.join(","))}`)
      .then((r) => r.json()).then((d) => setRows(d.rows)).catch(() => setRows([]));
  }, []);

  if (rows === null) return <div className="hint">Reading your shelf…</div>;
  if (!rows.length) {
    return (
      <div className="empty">
        <h2>Nothing saved yet</h2>
        <p>Save a work and it waits here. The list stays on this device and is not sent anywhere.</p>
        <Link className="btn" href="/">Back to the entrance</Link>
      </div>
    );
  }
  return (
    <ul className="rowlist">
      {rows.map((r) => (
        <li key={r.public_token}>
          <Link className="grow" href={`/work/${r.public_token}`} style={{ textDecoration: "none" }}>
            <div className="primary">{r.title}</div>
            <div className="secondary">{r.maker_display_name}{r.gone ? " · no longer shown" : ""}</div>
          </Link>
          {!r.gone ? <span className={`chip ${r.status === "sold" ? "" : "available"}`}>{r.status}</span> : null}
        </li>
      ))}
    </ul>
  );
}
