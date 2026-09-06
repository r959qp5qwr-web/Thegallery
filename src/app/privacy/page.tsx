import { Header, Footer } from "@/components/Chrome";
export const dynamic = "force-static";
export default function Privacy() {
  return (
    <>
      <Header place="Privacy" back="/" />
      <div className="section">
        <h2 style={{ font: "var(--t-heading)", margin: "0 0 12px" }}>Your account email stays private</h2>
        <p className="body">The address you sign in with is never shown on a public page and is not included
          in any public response. If you want people to email you, add a public email route in your Studio —
          that is a separate value you choose.</p>
      </div>
      <div className="section">
        <div className="lead">What visitors leave behind</div>
        <p className="body">Nothing. There is no visitor account and no tracking of what you look at. Saved
          works are stored in your own browser on this device and are never sent to us.</p>
      </div>
      <div className="section">
        <div className="lead">When you contact a maker</div>
        <p className="body">You leave The Gallery. The message, the negotiation and anything that follows are
          between you and the maker; we neither carry nor keep them.</p>
      </div>
      <div className="section">
        <div className="lead">Closing your account</div>
        <p className="body">Closing retires your published work and closes your gallery. Public links end
          with a plain notice rather than disappearing. Your account email is kept only as long as it is
          needed for the record of the account having existed.</p>
      </div>
      <Footer />
    </>
  );
}
