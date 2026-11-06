"use client";
import { useEffect, useState } from "react";

/** Where the visitor is in a work's images: "1 of 3", following the strip as it is swiped,
 *  scrolled or arrowed. A position, never "views": a view count is a public engagement figure
 *  the product refuses (GAL-R07; design review vocabulary table). Without script it stays at
 *  "1 of n", which is true when the page opens. */
export function ImageCount({ stripId, total }: { stripId: string; total: number }) {
  const [at, setAt] = useState(1);

  useEffect(() => {
    const strip = document.getElementById(stripId);
    if (!strip) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = strip.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      let nearest = 0, best = Infinity;
      Array.from(strip.children).forEach((shot, i) => {
        const r = shot.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - middle);
        if (d < best) { best = d; nearest = i; }
      });
      setAt(nearest + 1);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    strip.addEventListener("scroll", onScroll, { passive: true });
    return () => { strip.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [stripId]);

  return <span data-testid="image-count">{at} of {total}</span>;
}
