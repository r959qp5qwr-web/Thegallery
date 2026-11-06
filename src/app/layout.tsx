import type { Metadata, Viewport } from "next";
import { IconSprite } from "@/components/Icon";
import { BottomBar } from "@/components/BottomBar";
import { currentAccount } from "@/lib/auth";

export const metadata: Metadata = {
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
        <a className="skip" href="#content">Skip to content</a>
        <div className="phone">
          <main id="main" tabIndex={-1}>{children}</main>
          <BottomBar signedIn={!!account} />
        </div>
      </body>
    </html>
  );
}
