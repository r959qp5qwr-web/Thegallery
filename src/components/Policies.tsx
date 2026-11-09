// The policy text, written once and shown in two places: folded under About (drawing board,
// screen 6) and whole on /participation and /privacy, which stay reachable for links already
// shared. The words are unchanged from the pages they came from (2026-11-09).
type H = "h2" | "h3";

/** GAL-OD-15 as ratified: who may hold a gallery, and that opening one is not a mark of approval. */
export function WhoCanOpen({ h: Hn = "h2" }: { h?: H }) {
  return (
    <>
      <div className="section">
        <Hn className="lead">Who can hold a gallery</Hn>
        <p className="body">Individual makers, studios and collectives showing work they created or materially
          produced. Retailers and ordinary resellers are not admitted.</p>
      </div>
      <div className="section">
        <Hn className="lead">Opening a gallery</Hn>
        <p className="body">Anyone may create an account with an email address and open a gallery. Nobody
          reviews your work before you publish it, and nothing here is a mark of approval.</p>
      </div>
    </>
  );
}

/** GAL-OD-15: five report categories, recorded reasons, reversible where appropriate, appeal by
 *  email. Moderation protects access and safety; it does not curate taste or certify claims. */
export function WhatWeActOn({ h: Hn = "h2" }: { h?: H }) {
  return (
    <>
      <div className="section">
        <Hn className="lead">What we act on</Hn>
        <ul className="rowlist flush">
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
        <Hn className="lead">How a decision is made and undone</Hn>
        <p className="body">Every action carries a written reason. A take-down can be restored and a
          suspension can be reinstated. If you think a decision is wrong, reply by email to the address in
          the notice and it will be looked at again.</p>
        <p className="small follow">We do not judge whether work is good, and we do not
          verify that a maker is who they say they are.</p>
      </div>
    </>
  );
}

export function PrivacyText({ h: Hn = "h2" }: { h?: H }) {
  return (
    <>
      <div className="section">
        <Hn className="lead">If you&rsquo;re visiting</Hn>
        <p className="body">There is no visitor account and no tracking of what you look at. Saved works
          are kept in your own browser on this device. When you open Saved, the page asks The Gallery
          for those works&rsquo; current status, so it can tell you whether each is still available.
          That request names the works, not you. Like any website, the servers that run The Gallery keep
          short-lived technical logs of requests, such as which page address was asked for, to keep the site
          working. They are not used to follow what any visitor looks at.</p>
      </div>
      <div className="section">
        <Hn className="lead">When you contact a maker</Hn>
        <p className="body">You leave The Gallery. The message, the negotiation and anything that follows are
          between you and the maker; we neither carry nor keep them.</p>
      </div>
      <div className="section">
        <Hn className="lead">If you&rsquo;re a maker</Hn>
        <p className="body">The address you sign in with is never shown on a public page and is not included
          in any public response. If you want people to email you, add a public email under Ways to contact
          you in your Studio; that is a separate address you choose.</p>
      </div>
      <div className="section">
        <Hn className="lead">Closing your account</Hn>
        <p className="body">Closing retires your published work and closes your gallery. Public links end
          with a plain notice rather than disappearing. Your sign-in email is not deleted when you close: it
          stays, private and never shown, as the record that the account existed and was closed.</p>
      </div>
    </>
  );
}
