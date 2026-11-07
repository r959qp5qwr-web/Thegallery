import type { Metadata, Viewport } from "next";
import { IconSprite } from "@/components/Icon";
import { SectionNav, SignedIn } from "@/components/SectionNav";
import { currentAccount } from "@/lib/auth";
import { ViewTransitions } from "@/components/ViewTransition";

export const metadata: Metadata = {
  // Absolute addresses for share previews (og:image, og:url); the live Worker sets the domain.
  // `||`, not `??`: an empty value must not reach new URL() and fail every page.
  metadataBase: new URL(process.env.GALLERY_BASE_URL || "http://127.0.0.1:3100"),
  // Every page names itself first, so a screen reader announces where a navigation landed.
  title: { default: "The Gallery", template: "%s · The Gallery" },
  description:
    "A maker-led digital gallery for art and craft objects. Makers present their own work; " +
    "visitors approach the maker directly.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F3EEE6" };

// Nothing under this layout is prerendered, including the built-in 404. Every page here reads
// governed state, and a page rendered once and replayed is a permission decision repeated
// after the permission may have changed — a suspended maker's work must leave every surface at
// the moment of suspension (J-004), which a build-time render cannot promise.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const account = await currentAccount();
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/gallery/app.css" />
      </head>
      <body>
        <IconSprite />
        <a className="skip" href="#main">Skip to content</a>
        <SignedIn value={!!account}>
          {/* Each page renders its own header, then its <main>, then its footer, so the header
              and footer are landmarks of their own rather than content inside main. */}
          <div className="phone"><ViewTransitions>{children}</ViewTransitions></div>
          <SectionNav placement="bar" />
        </SignedIn>
      </body>
    </html>
  );
}
