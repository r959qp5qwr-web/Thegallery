import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader, Band } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { signOutAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

function Row({ href, label, value, accent }: { href: string; label: string; value?: string | null; accent?: boolean }) {
  return (
    <li>
      <Link href={href}>
        <span className="k">{label}</span>
        {value ? <span className={`v${accent ? " accent" : ""}`}>{value}</span> : null}
        <Icon name="chevron" />
      </Link>
    </li>
  );
}

/** Settings (drawing board, screen 14): the Studio's three pages — your details, ways to contact
 *  you, account — as one list. Each row opens the page where that thing is changed. */
export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/settings");
  const { maker, routes } = await studioContext(account.id);
  if (!maker) redirect("/studio/join");
  const { saved } = await searchParams;
  const live = routes.filter((r) => r.enabled && r.validated);
  const whatsapp = live.find((r) => r.kind === "whatsapp");
  const email = live.find((r) => r.kind === "email");
  const others = live.filter((r) => r.kind !== "whatsapp" && r.kind !== "email").length;

  return (
    <>
      <StudioHeader title="Settings" back="/studio" />
      <main id="main" tabIndex={-1} className="settings">
        <h1>Settings</h1>
        {saved ? <Band label="Saved">Your details are saved.</Band> : null}
        <h2 className="rows-head">Your gallery</h2>
        <ul className="setrows">
          <Row href="/studio/profile#display_name" label="Name" value={maker.display_name} />
          <Row href="/studio/profile#city" label="Place" value={maker.city} />
          <Row href="/studio/profile#practice_note" label="A line about your work" />
          <Row href={whatsapp ? "/studio/contact-routes" : "/studio/whatsapp"} label="WhatsApp"
               value={whatsapp ? "On" : "Add"} accent={!whatsapp} />
          <Row href="/studio/contact-routes" label="Email for visitors" value={email ? email.value : "Off"} />
          {others ? <Row href="/studio/contact-routes" label="Other ways to contact you" value={String(others)} /> : null}
        </ul>
        <h2 className="rows-head">Account</h2>
        <ul className="setrows">
          {/* The sign-in email is shown, not offered as a link: there is no way to change it here yet. */}
          <li><span className="static"><span className="k">Sign-in email</span><span className="v">{account.email}</span></span></li>
          <Row href="/makers/reset" label="Password" value="Reset" />
          <li>
            <form action={signOutAction}><button type="submit"><span className="k">Sign out</span></button></form>
          </li>
          <Row href="/studio/account" label="Close account" />
        </ul>
      </main>
    </>
  );
}
