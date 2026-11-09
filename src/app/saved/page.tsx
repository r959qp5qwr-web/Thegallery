import { Header, Footer } from "@/components/Chrome";
import { SavedShelf } from "@/components/SavedShelf";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved" };

export default function Saved() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="page-head"><h1>Saved</h1><p>Only on this phone. There is no account.</p></div>
      <SavedShelf />
      </main>
      <Footer />
    </>
  );
}
