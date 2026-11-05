import { Header, Footer } from "@/components/Chrome";
import { SavedShelf } from "@/components/SavedShelf";

export const dynamic = "force-dynamic";

export default function Saved() {
  return (
    <>
      <Header place="Saved" />
      <div className="context"><span>Your shelf</span><span>Private to this device</span></div>
      <SavedShelf />
      <Footer />
    </>
  );
}
