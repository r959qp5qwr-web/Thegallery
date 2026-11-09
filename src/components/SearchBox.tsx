"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

/**
 * One field with its icon (drawing board, screen 4). Results follow the typing after a short pause;
 * the phone's own Search key, or Enter, sends it at once. Without script the form still submits.
 */
export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      const v = q.trim();
      router.replace(v ? `/search?q=${encodeURIComponent(v)}` : "/search", { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [q, router]);
  return (
    <form className="search-form" action="/search" method="get" role="search">
      <label className="sr-only" htmlFor="q">Search work and makers</label>
      <div className="searchbox">
        <Icon name="search" />
        <input id="q" name="q" type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="A title, a maker, a material" autoFocus={!initial} autoComplete="off" />
        <button className="sr-only" type="submit" tabIndex={-1}>Search</button>
      </div>
    </form>
  );
}
