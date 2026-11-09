import { Header, Footer } from "@/components/Chrome";
import { WhoCanOpen, WhatWeActOn } from "@/components/Policies";

export const metadata = { title: "Participation" };
export const dynamic = "force-static";

// GAL-OD-15 as ratified: five report categories, recorded reasons, reversible where
// appropriate, appeal by email. Moderation protects access and safety; it does not curate
// taste and does not certify a maker's claims.
export default function Participation() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="page-head">
        <h1>Fair use of The Gallery</h1>
        <p>Anyone can open a gallery. These are the few things we act on, and how.</p>
      </div>
      <WhoCanOpen />
      <WhatWeActOn />
      </main>
      <Footer />
    </>
  );
}
