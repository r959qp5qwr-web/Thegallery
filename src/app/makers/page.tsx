import Link from "next/link";
import { redirect } from "next/navigation";
import { Header, Footer, imgSrc } from "@/components/Chrome";
import { currentAccount } from "@/lib/auth";
import { listRecentWorks, imagesFor, type PublicImage } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "For makers" };

/** For makers (drawing board, screen 7): pictures first, three short lines, one button.
 *  The pictures are works that are on view. Where there are fewer than three, the empty plinth
 *  stands in: the page never shows a work that is not hung here. */
export default async function ForMakers() {
  if (await currentAccount()) redirect("/studio");
  const works = await listRecentWorks(12);
  const images = await imagesFor(works.map((w) => w.id));
  const cover = new Map<string, PublicImage>();
  for (const im of images) if (!cover.has(im.work_id)) cover.set(im.work_id, im);
  const pictures = works.map((w) => cover.get(w.id)).filter((im): im is PublicImage => !!im).slice(0, 3);
  const slot = (i: number, variant: "w1280" | "w640") => {
    const im = pictures[i];
    const src = imgSrc(im, variant);
    return src ? <img src={src} alt="" /> : <div className="wall" data-testid="plinth-slot"><div className="slab" /></div>;
  };

  return (
    <>
      <Header back="/" />
      <main id="main" tabIndex={-1} className="for-makers has-workbar">
        {/* Decoration: the works stand for the room; their names are on the wall, not here. */}
        <div className="fm-pictures" aria-hidden data-testid="fm-pictures">
          <div className="fm-pic lead">{slot(0, "w1280")}</div>
          <div className="fm-pic">{slot(1, "w640")}</div>
          <div className="fm-pic">{slot(2, "w640")}</div>
        </div>
        <div className="fm-words">
          <p className="lbl">For makers</p>
          <h1>A gallery of your own.</h1>
          <p className="fm-line">Hang your work from your phone. Visitors message you on WhatsApp. No commission.</p>
        </div>
        <div className="workbar dock fm-dock">
          <Link className="btn solid" href="/makers/create-account">Open your gallery</Link>
          <Link className="textlink" href="/makers/sign-in">I already have a gallery</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
