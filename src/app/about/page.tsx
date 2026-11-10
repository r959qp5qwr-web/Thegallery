import { Header, Footer } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { WhoCanOpen, WhatWeActOn, PrivacyText } from "@/components/Policies";

export const metadata = { title: "About" };
export const dynamic = "force-static";

// About, Participation and Privacy on one screen (drawing board, screen 6; governor 2026-11-09).
// Three lines say what The Gallery is; the full policy text stays, folded under one row each and
// open on a tap. /participation and /privacy still show the same text whole.
export default function About() {
  return (
    <>
      <Header back="/" />
      <main id="main" tabIndex={-1}>
      <div className="page-head about">
        <h1>About</h1>
        <p className="about-lead">Art and craft, shown by the people who made it. You see the work here and talk
          to the maker yourself. The Gallery takes no commission.</p>
      </div>
      <div className="folds about-folds">
        <details className="fold">
          <summary>Who can open a gallery<Icon name="chevron" /></summary>
          <WhoCanOpen h="h2" />
        </details>
        <details className="fold">
          <summary>What we act on<Icon name="chevron" /></summary>
          <WhatWeActOn h="h2" />
        </details>
        <details className="fold">
          <summary>Privacy<Icon name="chevron" /></summary>
          <PrivacyText h="h2" />
        </details>
      </div>
      </main>
      <Footer here="about" />
    </>
  );
}
