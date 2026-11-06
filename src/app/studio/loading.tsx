import { StudioHeader } from "@/components/Chrome";

/** Studio loading: the rows' shape in paper-deep, so the page does not jump when it arrives. */
export default function Loading() {
  return (
    <>
      <StudioHeader title="Studio" />
      <main id="main" tabIndex={-1} aria-busy="true">
        <p className="sr-only" role="status">Loading</p>
        <div className="studio-state"><div className="skeleton-line w50 tall" /><div className="skeleton-line w70" /></div>
        <ul className="rowlist works" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i}><span className="thumb skeleton" /><span className="grow"><span className="skeleton-line w70" /></span></li>
          ))}
        </ul>
      </main>
    </>
  );
}
