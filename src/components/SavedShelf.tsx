"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readSaved } from "./SaveButton";
import { EmptyState } from "./Chrome";
import { STATUS_LABEL } from "@/lib/format";

type Row = { public_token: string; title: string; maker_display_name: string; status: string; price: string | null; image: string | null; gone: boolean };

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
    // No route onward: Home is one tap away in the bar, and on an empty site it has nothing to
    // show either (no door into an empty room).
    return (
      <EmptyState title="Nothing saved yet">
        Tap Save on any work and it waits here, on this phone.
      </EmptyState>
    );
  }
  // A wall of the saved works (drawing board, screen 5), on the tiles' rule: every status is said
  // but "Available", for which a stated price stands in (P-11, GAL-PR-02).
  return (
    <>
      <div className="shelf-count">{rows.length} {rows.length === 1 ? "work" : "works"} · on this phone</div>
      <div className="grid">
        {rows.map((r) => (
          <Link key={r.public_token} className="tile" href={`/work/${r.public_token}`}>
            <div className="frame r45">
              {r.image ? <img src={r.image} alt="" loading="lazy" /> : <span className="notice">{r.gone ? "No longer shown" : "No image yet"}</span>}
            </div>
            <div className="gt">{r.title}</div>
            <div className="gm">{r.maker_display_name}</div>
            {r.gone ? <div className="gs">No longer shown</div>
              : r.status !== "available" || r.price ? (
                <div className={`gs${r.status === "available" ? " available" : ""}`}>
                  {r.status !== "available" ? STATUS_LABEL[r.status] ?? r.status : null}
                  {r.status !== "available" && r.price ? " · " : null}
                  {r.price ? <span className="price">{r.price}</span> : null}
                </div>) : null}
          </Link>
        ))}
      </div>
    </>
  );
}
