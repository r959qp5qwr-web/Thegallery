import { Header, Footer } from "@/components/Chrome";

export const metadata = { title: "Privacy" };
export const dynamic = "force-static";
export default function Privacy() {
  return (
    <>
      <Header place="Privacy" back="/" />
      <main id="main" tabIndex={-1}>
      <h1 className="sr-only">Privacy</h1>
      <div className="section">
        <h2 style={{ font: "var(--t-heading)", margin: "0 0 12px" }}>Your account email stays private</h2>
        <p className="body">The address you sign in with is never shown on a public page and is not included
          in any public response. If you want people to email you, add a public email under Ways to contact you in your Studio —
          that is a separate value you choose.</p>
      </div>
      <div className="section">
        <div className="lead">What visitors leave behind</div>
        <p className="body">There is no visitor account and no tracking of what you look at. Saved works
          are kept in your own browser on this device. When you open Saved, the page asks The Gallery
          for those works&rsquo; current status, so it can tell you whether each is still available.
          That request names the works, not you. Like any website, the servers that run The Gallery keep
          short-lived technical logs of requests, such as which page address was asked for, to keep the site
          working. They are not used to follow what any visitor looks at.</p>
      </div>
      <div className="section">
        <div className="lead">When you contact a maker</div>
        <p className="body">You leave The Gallery. The message, the negotiation and anything that follows are
          between you and the maker; we neither carry nor keep them.</p>
      </div>
      <div className="section">
        <div className="lead">Closing your account</div>
        <p className="body">Closing retires your published work and closes your gallery. Public links end
          with a plain notice rather than disappearing. Your sign-in email is not deleted when you close: it
          stays, private and never shown, as the record that the account existed and was closed.</p>
      </div>
      </main>
      <Footer />
    </>
  );
}
