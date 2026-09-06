import type { Metadata, Viewport } from "next";
import { IconSprite } from "@/components/Icon";
import { BottomBar } from "@/components/BottomBar";
import { currentAccount } from "@/lib/auth";

export const metadata: Metadata = {
  title: "The Gallery",
  description:
    "A maker-led digital gallery for art and craft objects. Makers present their own work; " +
    "visitors approach the maker directly.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F3EEE6" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const account = await currentAccount();
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/gallery/app.css" />
      </head>
      <body>
        <IconSprite />
        <div className="phone">
          {children}
          <BottomBar signedIn={!!account} />
        </div>
      </body>
    </html>
  );
}
