import { Header, Footer } from "@/components/Chrome";
import { PrivacyText } from "@/components/Policies";

export const metadata = { title: "Privacy" };
export const dynamic = "force-static";

// The page links already point to. The same screen as About's Privacy row, opened out.
export default function Privacy() {
  return (
    <>
      <Header back="/about" />
      <main id="main" tabIndex={-1} className="policy-page">
        <h1>Privacy</h1>
        <PrivacyText />
      </main>
      <Footer />
    </>
  );
}
