import { Header, Footer } from "@/components/Chrome";
import { SavedShelf } from "@/components/SavedShelf";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved" };

export default function Saved() {
  return (
    <>
      <Header place="Saved" />
      <main id="main" tabIndex={-1}>
      <h1 className="sr-only">Saved works</h1>
      <div className="context"><span>Your shelf</span><span>Private to this device</span></div>
      <SavedShelf />
      </main>
      <Footer />
    </>
  );
}
