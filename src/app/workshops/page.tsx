import { Header, Footer, EmptyPlinth, Action } from "@/components/Chrome";

export const dynamic = "force-dynamic";

// Workshops are a Stage 3 journey (product/STAGE_2_VERTICAL_SLICE.md §6). The route exists
// because the navigation names it, and it states its own emptiness rather than pretending to
// a programme that has not been built.
export default function Workshops() {
  return (
    <>
      <Header place="Workshops" />
      <div className="context"><span>Programme</span><span className="accent">Nothing scheduled</span></div>
      <EmptyPlinth title="No workshops yet" action={<Action href="/">Back to the entrance</Action>}>
        Makers will publish workshops here — dates, place and how to register. Nothing is
        scheduled at the moment.
      </EmptyPlinth>
      <Footer />
    </>
  );
}
