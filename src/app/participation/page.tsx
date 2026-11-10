import { Header, Footer } from "@/components/Chrome";
import { WhoCanOpen, WhatWeActOn } from "@/components/Policies";

export const metadata = { title: "Who can open a gallery" };
export const dynamic = "force-static";

// The page links already point to (GAL-OD-15 as ratified). The same screen as About's rows,
// opened out: Back to About, the heading, then the text (drawing board, screen 6).
export default function Participation() {
  return (
    <>
      <Header back="/about" />
      <main id="main" tabIndex={-1} className="policy-page">
        <h1>Who can open a gallery</h1>
        <WhoCanOpen />
        <h2 className="policy-title">What we act on</h2>
        <WhatWeActOn h="h3" />
      </main>
      <Footer />
    </>
  );
}
