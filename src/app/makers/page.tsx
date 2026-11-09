import Link from "next/link";
import { Header, Footer, Action } from "@/components/Chrome";
import { currentAccount } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "For Makers" };

// Pitched to a potter, not written as terms (Wave 5): one paragraph, one filled action, three
// steps. Who may hold a gallery and what is acted on live on Participation, linked once.
export default async function ForMakers() {
  if (await currentAccount()) redirect("/studio");
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="for-makers">
        <div className="intro">
          <h1>Show your work the way a gallery would</h1>
          <p>A room of your own: your photographs at full size, your words beside them. Visitors message
            you directly, on WhatsApp or by email. There is no commission on your sales.</p>
          <div className="do">
            <Action href="/makers/create-account" primary>Open your gallery</Action>
            <Link className="textlink" href="/makers/sign-in">I already have an account</Link>
          </div>
        </div>
        <div className="how-wrap">
          <ol className="how">
            <li><span><b>Make an account</b>With the email you sign in with. It is never shown.</span></li>
            <li><span><b>Hang your work</b>Photographs from your phone, a title, a few words.</span></li>
            <li><span><b>Open your gallery</b>Publish, and share its link wherever you like.</span></li>
          </ol>
          <p className="fine">Who can open a gallery, and what we act on: <Link href="/participation">Participation</Link>.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
