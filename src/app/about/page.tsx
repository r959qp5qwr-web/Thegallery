import { Header, Footer } from "@/components/Chrome";

export const metadata = { title: "About" };
export const dynamic = "force-static";

// Say each policy once (Wave 5): what The Gallery does and does not do is stated here, in plain
// words, and linked from elsewhere rather than repeated.
export default function About() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="page-head">
        <h1>What The Gallery is</h1>
        <p>A quiet place to see art and craft by makers in Bengaluru, in clay, textile, wood, metal and
          paper, and to talk to the person who made it.</p>
      </div>
      <section className="section">
        <h2 className="lead">How it works</h2>
        <p className="body">Find a piece you like. Read who made it and how. Message the maker directly, on
          WhatsApp or by email. Each maker presents their own work, in their own words.</p>
      </section>
      <section className="section">
        <h2 className="lead">What you won&rsquo;t find here</h2>
        <p className="body">No cart, no checkout and no payment: anything you buy, you arrange with the maker.
          The Gallery takes no percentage, carries no advertising and sells no ranking. There are no
          follower counts, likes or popularity charts; a work is here because its maker chose to show it.</p>
        <p className="body follow">The Gallery makes no claim about a maker&rsquo;s identity,
          the quality of their work, or their reliability as a seller. What you read is what the maker wrote.</p>
      </section>
      </main>
      <Footer />
    </>
  );
}
