// The policy text, written once and shown in two places: folded under About (drawing board,
// screen 6) and whole on /participation and /privacy, which stay reachable for links already
// shared. Rewritten short on 2026-11-10 (governor's review of the live screens); every fixed
// meaning is kept: GAL-OD-02 (who), GAL-OD-03 (open by email, no review, no mark of approval),
// GAL-OD-15 (five things acted on, a written reason, reversible, reply by email), GAL-07 and
// GAL-OD-12 (no rating, no identity check), GAL-P1 (the sign-in email stays private), GAL-OD-09.
type H = "h2" | "h3";

/** GAL-OD-02 and GAL-OD-03: who may hold a gallery, and that opening one is not a mark of approval. */
export function WhoCanOpen({ h: Hn = "h2" }: { h?: H }) {
  return (
    <div className="policy">
      <Hn className="policy-h">Makers, studios and collectives</Hn>
      <p>Showing work they made or had a real hand in making. Retailers and resellers can’t open a gallery.</p>
      <Hn className="policy-h">Opening one</Hn>
      <p>All it takes is an email address. Nothing is reviewed before it goes up, and being here is no
        mark of approval.</p>
    </div>
  );
}

/** GAL-OD-15: five things acted on, each action with a written reason, reversible, and a reply by
 *  email. Moderation protects access and safety; it does not rate work or check identity. */
export function WhatWeActOn({ h: Hn = "h2" }: { h?: H }) {
  return (
    <div className="policy">
      <ul className="policy-list">
        <li><Hn className="policy-h">Impersonation</Hn><p>Pretending to be someone else, or showing their work as your own.</p></li>
        <li><Hn className="policy-h">Unlawful content</Hn><p>Anything that may not lawfully be shown or sold.</p></li>
        <li><Hn className="policy-h">Spam and misuse</Hn><p>Bulk or automated abuse of the site.</p></li>
        <li><Hn className="policy-h">Prohibited resale</Hn><p>Selling work you did not make or have a real hand in making.</p></li>
        <li><Hn className="policy-h">Safety</Hn><p>A risk to a person.</p></li>
      </ul>
      <p>Every action comes with a written reason. A take-down can be restored and a suspension lifted.
        To ask for another look, reply to the email that told you.</p>
      <p className="policy-aside">No one here rates the work or checks who a maker is.</p>
    </div>
  );
}

/** The privacy text: GAL-OD-09 (saves on this device), GAL-P1 (the sign-in email stays private). */
export function PrivacyText({ h: Hn = "h2" }: { h?: H }) {
  return (
    <div className="policy">
      <Hn className="policy-h">Visiting</Hn>
      <p>No account, and nothing follows what you look at. Saved works stay in this browser. When you open
        Saved, the page asks which of them are still available; the request names the works, not you. The
        servers keep short technical logs, such as which page was asked for, to keep the site running.</p>
      <Hn className="policy-h">Messaging a maker</Hn>
      <p>You leave The Gallery. What you say and agree is between you and the maker. We don’t carry or keep it.</p>
      <Hn className="policy-h">Making</Hn>
      <p>The email you sign in with is never shown on the site. To let visitors email you, add a public
        email in your Studio’s Settings.</p>
      <Hn className="policy-h">Closing your account</Hn>
      <p>Your work is retired and your gallery closes; its links show a short notice. Your sign-in email
        stays on record, private, to show the account existed and was closed.</p>
    </div>
  );
}
