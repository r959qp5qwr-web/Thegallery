import { Header } from "@/components/Chrome";

// Scoped to the entrance by its route group, deliberately. A loading boundary makes the response
// stream, so its status is sent as 200 before a page can call notFound(); a page that answers
// "not found" (a work, a gallery, a Studio work that is not yours) must keep a real 404, and a door
// that redirects (the Studio, signed out) must redirect at once rather than after a refresh.
/** Loading (INTERFACE_FOUNDATION §9): paper-deep blocks at the shape the page will have — a wall,
 *  a label, a row of frames — and no spinner standing in for the work. */
export default function Loading() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} aria-busy="true">
        <p className="sr-only" role="status">Loading</p>
        <div className="skeleton-wall" />
        <div className="label"><div className="skeleton-line w30" /><div className="skeleton-line w70 tall" /><div className="skeleton-line w50" /></div>
        <div className="grid skeleton-grid">
          {[0, 1, 2].map((i) => <div key={i} className="tile"><div className="frame r45 skeleton" /><div className="skeleton-line w70" /></div>)}
        </div>
      </main>
    </>
  );
}
