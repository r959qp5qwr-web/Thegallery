import { Header, Footer } from "@/components/Chrome";
import { PrivacyText } from "@/components/Policies";

export const metadata = { title: "Privacy" };
export const dynamic = "force-static";
export default function Privacy() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="page-head">
        <h1>Privacy</h1>
        <p>We don&rsquo;t track what you look at.</p>
      </div>
      <PrivacyText />
      </main>
      <Footer />
    </>
  );
}
