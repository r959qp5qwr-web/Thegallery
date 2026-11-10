import Link from "next/link";
import { Header, Footer, EmptyState } from "@/components/Chrome";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workshops" };

// Workshops are a Stage 3 journey (product/STAGE_2_VERTICAL_SLICE.md §6). The route exists
// because the navigation names it, and it states its own emptiness once, with a way on that
// leads somewhere with something in it.
export default function Workshops() {
  return (
    <>
      <Header back="/" />
      <main id="main" tabIndex={-1}>
        <EmptyState level={1} title="No workshops yet"
                    routes={<Link className="textlink" href="/about">What The Gallery is</Link>}>
          Makers will list workshops here, with dates, the place and how to register.
        </EmptyState>
      </main>
      <Footer />
    </>
  );
}
