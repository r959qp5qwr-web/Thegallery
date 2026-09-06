import { Header, Footer } from "@/components/Chrome";
export const dynamic = "force-static";

// GAL-OD-15 as ratified: five report categories, recorded reasons, reversible where
// appropriate, appeal by email. Moderation protects access and safety; it does not curate
// taste and does not certify a maker's claims.
export default function Participation() {
  return (
    <>
      <Header place="Participation" back="/" />
      <div className="section">
        <h2 style={{ font: "var(--t-heading)", margin: "0 0 12px" }}>Who may hold a gallery</h2>
        <p className="body">Individual makers, studios and collectives presenting work they created or
          materially produced. Retailers and ordinary resellers are not admitted.</p>
      </div>
      <div className="section">
        <div className="lead">How admission works</div>
        <p className="body">Anyone may create an account with an email address and open a gallery. Nobody
          reviews your work before you publish it, and nothing here is a mark of approval.</p>
      </div>
      <div className="section">
        <div className="lead">What we act on</div>
        <ul className="rowlist" style={{ padding: 0 }}>
          <li><span className="grow"><span className="primary">Impersonation</span>
            <span className="secondary">Presenting someone else&rsquo;s identity or work as your own</span></span></li>
          <li><span className="grow"><span className="primary">Prohibited or unlawful content</span>
            <span className="secondary">Material that may not lawfully be shown or sold</span></span></li>
          <li><span className="grow"><span className="primary">Spam or systematic misuse</span>
            <span className="secondary">Bulk or automated abuse of the gallery</span></span></li>
          <li><span className="grow"><span className="primary">Prohibited resale</span>
            <span className="secondary">Reselling work you did not create or materially produce</span></span></li>
          <li><span className="grow"><span className="primary">Safety concern</span>
            <span className="secondary">A risk to a person</span></span></li>
        </ul>
      </div>
      <div className="section">
        <div className="lead">How a decision is made and undone</div>
        <p className="body">Every action carries a written reason. A take-down can be restored and a
          suspension can be reinstated. If you think a decision is wrong, reply by email to the address in
          the notice and it will be looked at again.</p>
        <p className="small" style={{ marginTop: 12 }}>We do not judge whether work is good, and we do not
          verify that a maker is who they say they are.</p>
      </div>
      <Footer />
    </>
  );
}
