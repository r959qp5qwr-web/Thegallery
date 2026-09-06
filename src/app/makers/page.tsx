import Link from "next/link";
import { Header, Footer, Action } from "@/components/Chrome";
import { currentAccount } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ForMakers() {
  if (await currentAccount()) redirect("/studio");
  return (
    <>
      <Header place="For Makers" />
      <div className="context"><span>For makers</span><span className="accent">One gallery of your own</span></div>
      <div className="section" style={{ paddingTop: 8 }}>
        <h1 style={{ font: "var(--t-display)", margin: "0 0 14px", letterSpacing: "-0.015em" }}>Show your work the way a gallery would</h1>
        <p className="body">One gallery of your own. Your objects at scale, your words, your way of being
          reached. Visitors come to you directly.</p>
        <p className="note" style={{ marginTop: 16 }}>The Gallery hosts the encounter. You own the transaction.</p>
      </div>
      <div className="section">
        <div className="lead">What this is not</div>
        <p className="body">No cart, no checkout, no commission on your sales. We do not rank you, judge your
          work or claim to have verified you. Nobody reviews what you publish before it goes up.</p>
      </div>
      <div className="section">
        <div className="lead">Who may hold a gallery</div>
        <p className="body">Individual makers, studios and collectives presenting work you created or
          materially produced. Not retailers or resellers.</p>
      </div>
      <div className="actions">
        <Action href="/makers/create-account" primary block>Create an account</Action>
      </div>
      <div className="actions secondary">
        <Link className="btn quiet" href="/makers/sign-in"><span>I already have one</span></Link>
      </div>
      <Footer />
    </>
  );
}
