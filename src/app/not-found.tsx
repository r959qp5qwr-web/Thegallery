import Link from "next/link";
import { Header, Footer, EmptyState } from "@/components/Chrome";

/** Not found, said plainly, inside the room's own landmarks (the skip link lands on main). */
export default function NotFound() {
  return (
    <>
      <Header back="/" />
      <main id="main" tabIndex={-1}>
        <EmptyState level={1} title="Nothing is hung here"
                    routes={<Link className="textlink" href="/">Back to The Gallery</Link>}>
          This address does not lead to a work, a gallery or a page. It may have been mistyped, or
          what was here has been taken down.
        </EmptyState>
      </main>
      <Footer />
    </>
  );
}
