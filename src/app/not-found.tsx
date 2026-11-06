import { Header, Footer, EmptyPlinth, Action } from "@/components/Chrome";

/** Not found, said plainly, inside the room's own landmarks (the skip link lands on main). */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <EmptyPlinth title="Nothing is hung here" action={<Action href="/" primary>Back to the entrance</Action>}>
          This address does not lead to a work, a gallery or a page. It may have been mistyped, or
          what was here has been taken down.
        </EmptyPlinth>
      </main>
      <Footer />
    </>
  );
}
