import { Header, Footer } from "@/components/Chrome";
export const dynamic = "force-static";
export default function About() {
  return (
    <>
      <Header place="About" back="/" />
      <div className="section">
        <h2 style={{ font: "var(--t-heading)", margin: "0 0 12px" }}>What The Gallery is</h2>
        <p className="body">A maker-led digital gallery for art and craft objects. Makers present their own
          work with the dignity of an exhibition. Visitors discover the object, understand who made it, and
          approach the maker directly to buy, commission or learn.</p>
        <p className="note" style={{ marginTop: 16 }}>The Gallery hosts the encounter. The maker owns the
          transaction.</p>
      </div>
      <div className="section">
        <div className="lead">What it is not</div>
        <p className="body">There is no cart, no checkout and no payment here. The Gallery takes no
          percentage, carries no advertising and sells no ranking. It makes no claim about a maker&rsquo;s
          identity, the quality of their work, or their reliability as a seller — what you read is what the
          maker wrote.</p>
      </div>
      <div className="section">
        <div className="lead">No counts</div>
        <p className="body">There are no public follower counts, likes, comments or popularity charts. A work
          is shown because a maker published it, not because it performed.</p>
      </div>
      <Footer />
    </>
  );
}
