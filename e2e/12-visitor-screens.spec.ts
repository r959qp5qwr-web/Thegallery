import { test, expect } from "@playwright/test";
import { owner } from "./helpers";

// Drawing board, part 2 (governor, 2026-11-09): the visitor's screens 2, 2b, 3 and 6.
// Each test fails if its change is taken away:
//  - a work opens on its photograph on a phone, with Back, Share and the heart over it;
//  - the heart saves the work to this phone, and Saved shows it;
//  - the wall label reads status, title, maker · medium, then one line of facts;
//  - the maker's words fold away under one row;
//  - the Message sheet: rows per way to reach the maker, the handoff sentence above them;
//  - a maker's gallery: label "Material · Town", one Message, the routes only in its sheet;
//  - About on one screen, the full policy text folded, /participation and /privacy still whole.
test.describe.configure({ mode: "serial" });

const MONSOON = "Monsoon Vessel No. 4";
async function monsoon() {
  return (await owner((c) => c.query<{ id: string; public_token: string; process: string | null }>(
    "SELECT id, public_token, process FROM works WHERE title = $1", [MONSOON]))).rows[0];
}

test("a work opens on its photograph on a phone, with Back, Share and the heart over it", async ({ page }) => {
  const w = await monsoon();
  await page.goto(`/work/${w.public_token}`);
  const narrow = page.viewportSize()!.width < 900;
  const photo = page.locator("#work-images");
  const heart = page.getByRole("button", { name: "Save" });
  const share = page.getByRole("button", { name: "Share" });
  await expect(heart).toBeVisible();
  await expect(share).toBeVisible();
  const p = (await photo.boundingBox())!;
  for (const control of [heart, share]) {
    const b = (await control.boundingBox())!;
    // Over the photograph, not beside it.
    expect(b.x).toBeGreaterThanOrEqual(p.x - 1);
    expect(b.y).toBeGreaterThanOrEqual(p.y - 1);
    expect(b.y + b.height).toBeLessThan(p.y + p.height);
    expect(b.width).toBeGreaterThanOrEqual(44);
  }
  if (narrow) {
    // The photograph takes the top of the screen: the header takes no room above it, but stays a
    // landmark and shows when the keyboard reaches it.
    const header = page.getByRole("banner");
    await expect(header).toHaveCount(1);
    expect((await header.boundingBox())!.height).toBeLessThanOrEqual(1);
    expect(p.y).toBeLessThan(2);
    await page.getByRole("banner").getByRole("link", { name: "The Gallery" }).focus();
    expect((await header.boundingBox())!.height).toBeGreaterThan(40);
    // One Back on a phone: the one over the photograph (the hidden header's own Back stays out).
    await expect(page.getByRole("link", { name: "Back" })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/m/anika-rao");
  } else {
    // Interface Standard IS-N1: from 900 px Back is in the top bar, once, and leads to the maker.
    await expect(page.locator("header.header")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Back" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Back" })).toHaveAttribute("href", "/m/anika-rao");
    await expect(page.locator(".photo-tools").getByRole("link", { name: "Back" })).toBeHidden();
  }
});

test("the heart saves the work on this phone, and Saved shows it", async ({ page }) => {
  const w = await monsoon();
  await page.goto(`/work/${w.public_token}`);
  const heart = page.getByTestId("save-work");
  await expect(heart).toHaveAttribute("aria-pressed", "false");
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  // One name; the state is the pressed state, so a screen reader says it once.
  await expect(heart).toHaveAccessibleName("Save");
  expect(await heart.locator("use").getAttribute("href")).toBe("#i-heart-on");
  await page.goto("/saved");
  await expect(page.locator(`a.tile[href="/work/${w.public_token}"]`)).toBeVisible();
  await page.goto(`/work/${w.public_token}`);
  await page.getByTestId("save-work").click();
  await expect(page.getByTestId("save-work")).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("gallery.saved.v1"))).toBe("[]");
});

test("the wall label reads status, title, maker and medium, then one line of facts", async ({ page }) => {
  const w = await monsoon();
  await page.goto(`/work/${w.public_token}`);
  const label = page.locator(".detail-label .label");
  const top = async (sel: string) => (await label.locator(sel).first().boundingBox())!.y;
  const status = await top(".status"), title = await top("h1"), maker = await top(".makerline"), facts = await top(".facts .dims");
  expect(status).toBeLessThan(title);
  expect(title).toBeLessThan(maker);
  expect(maker).toBeLessThan(facts);
  // Maker and medium on one line, the maker as the way to their gallery.
  await expect(label.locator(".makerline")).toHaveText(/^Anika Rao · /);
  // The facts end in when the status was last stated, on the same line as the size.
  await expect(label.locator(".facts .dims")).toContainText(/ cm .* · updated /);
});

test("the maker's words fold away under one row and open in place", async ({ page }) => {
  const w = await monsoon();
  expect(w.process, "the seeded work carries the maker's words").toBeTruthy();
  await page.goto(`/work/${w.public_token}`);
  const row = page.locator("details.fold", { has: page.locator("summary", { hasText: "In Anika’s words" }) });
  await expect(row).toHaveCount(1);
  const words = row.locator(".note");
  await expect(words).toBeHidden();
  await row.locator("summary").click();
  await expect(words).toBeVisible();
  await expect(words).toHaveText(w.process!.trim());
});

test("the Message sheet: the handoff sentence first, then one row per way to reach the maker", async ({ page }) => {
  const w = await monsoon();
  await page.goto(`/work/${w.public_token}`);
  await page.getByRole("link", { name: "Message Anika" }).click();
  const sheet = page.getByRole("dialog", { name: "Message Anika" });
  await expect(sheet).toBeVisible();
  const rows = sheet.locator("ul.routes li a");
  await expect(rows.first()).toBeVisible();
  // Each row is the way's name, a whole-row target.
  for (const a of await rows.all()) {
    expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await expect(sheet.locator('a[data-route-kind="whatsapp"]')).toHaveText("WhatsApp");
  // GAL-C1 word for word, above the rows (and so before them for a screen reader and a keyboard).
  const said = sheet.getByTestId("disclosure");
  await expect(said).toHaveText("You are contacting the maker directly. Payment, delivery, returns and any dispute are arranged with them; The Gallery does not process the transaction.");
  expect((await said.boundingBox())!.y).toBeLessThan((await rows.first().boundingBox())!.y);
  // Focus is in the sheet and Tab never reaches the page behind it (inert); Escape gives it
  // back to the Message button.
  expect(await page.evaluate(() => !!document.activeElement?.closest("#contact"))).toBe(true);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    const outside = await page.evaluate(() => {
      const a = document.activeElement;
      return !!a && a !== document.body && !a.closest("#contact") ? (a.textContent || a.tagName).trim().slice(0, 30) : null;
    });
    expect(outside, `Tab ${i + 1} left the sheet`).toBeNull();
  }
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("link", { name: "Message Anika" })).toBeFocused();
});

test("a maker's gallery is a profile: label, name, their words, one Message, the routes only in its sheet", async ({ page }) => {
  await page.goto("/m/anika-rao");
  await expect(page.getByTestId("maker-label")).toHaveText("Clay · Khurja");
  await expect(page.getByRole("heading", { level: 1, name: "Anika Rao" })).toBeVisible();
  await expect(page.locator(".maker-head .practice")).toHaveText(/^“I fire in a wood kiln.*”$/);
  const message = page.getByRole("link", { name: "Message", exact: true });
  await expect(message).toBeVisible();
  // No route is offered bare on the page: only through the sheet, after the sentence.
  await expect(page.locator("a[data-route-kind]")).toHaveCount(0);
  await message.click();
  const sheet = page.getByRole("dialog", { name: "Message Anika" });
  await expect(sheet.getByTestId("disclosure")).toHaveText("You’re talking to Anika directly. Payment, delivery, returns and any dispute are arranged between you; The Gallery takes no part in the sale.");
  await expect(sheet.locator("a[data-route-kind]").first()).toBeVisible();
  // The Message button is offered exactly when the maker has a way to be reached (GAL-PR-01).
  await page.goto("/m/dhaaga-studio");
  await expect(page.getByRole("heading", { level: 1, name: "Dhaaga Studio" })).toBeVisible();
  const routes = (await owner((c) => c.query<{ n: number }>(
    // The public view applies the rule (enabled and validated), as the page does.
    `SELECT count(*)::int AS n FROM public_contact_routes r JOIN public_makers m ON m.id = r.maker_id
      WHERE m.handle = 'dhaaga-studio'`))).rows[0].n;
  await expect(page.getByRole("link", { name: "Message", exact: true })).toHaveCount(routes ? 1 : 0);
  if (!routes) await expect(page.getByTestId("no-contact")).toHaveText("Dhaaga Studio is not taking enquiries here yet.");
});

test("About is one screen: a short lead, then the full policy text folded under three rows", async ({ page, request }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  await expect(page.locator(".about-lead")).toHaveText(/^Art and craft, shown by the people who made it\./);
  const rows = page.locator(".about-folds details.fold > summary");
  await expect(rows).toHaveText(["Who can open a gallery", "What we act on", "Privacy"]);
  // Closed, the policy text is not on the screen; opened, the whole of it is.
  await expect(page.getByText("It is not for retailers or ordinary resellers.")).toBeHidden();
  for (const r of await rows.all()) await r.click();
  // GAL-OD-02/03/15 in full: who, the five things acted on, the reason, reversal and reply.
  for (const words of ["It is not for retailers or ordinary resellers.", "Impersonation", "Prohibited or unlawful content",
                       "Spam or systematic misuse", "Prohibited resale", "Safety concerns",
                       "Every action comes with a written reason", "reply to the notice we send you",
                       "No one here rates the work or checks who a maker is", "Browsing needs no account",
                       "Your sign-in email stays on record, private"]) {
    await expect(page.getByText(words, { exact: false }).first(), words).toBeVisible();
  }
  // The two pages links already point to stay, with the same words.
  for (const [path, words] of [["/participation", "Prohibited resale"], ["/privacy", "Browsing needs no account"]] as const) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(await res.text(), path).toContain(words);
  }
});

test("on the wall label only Available is in amber; every other status is said in the label's quiet colour", async ({ page }) => {
  const w = await monsoon();
  const was = (await owner((c) => c.query<{ status: string }>("SELECT status FROM works WHERE id = $1", [w.id]))).rows[0].status;
  try {
    for (const [status, amber] of [["available", true], ["made_to_order", false], ["enquire", false], ["on_view", false], ["sold", false]] as const) {
      await owner((c) => c.query("UPDATE works SET status = $1 WHERE id = $2", [status, w.id]));
      await page.goto(`/work/${w.public_token}`);
      const line = page.locator(".detail-label .label .status");
      const colour = await line.evaluate((e) => getComputedStyle(e).color);
      // --accent-text is the amber of the label (rgb(138, 63, 20), amber-deep); the quiet label is not.
      expect(colour === "rgb(138, 63, 20)", `${status}: ${colour}`).toBe(amber);
    }
  } finally {
    await owner((c) => c.query("UPDATE works SET status = $1 WHERE id = $2", [was, w.id]));
  }
});

test("Back steps back to where the visitor was once they have moved inside The Gallery", async ({ page }) => {
  const w = await monsoon();
  // Opened cold (no referrer), then into the work from Search: Back returns to Search, not to the
  // maker's gallery its link names.
  await page.goto("/search?q=monsoon");
  await page.locator(`a.tile[href="/work/${w.public_token}"]`).click();
  await page.waitForURL(`**/work/${w.public_token}`);
  // One visible Back at every width (IS-N1): over the photograph on a phone, in the header from 900 px.
  const back = page.locator('[data-testid="back"]:visible');
  await expect(back).toHaveCount(1);
  await back.click();
  await page.waitForURL(/\/search\?q=monsoon$/);
});

test("a maker's square says a stated price beside every status that keeps one", async ({ page }) => {
  const w = await monsoon();
  const was = (await owner((c) => c.query<{ status: string; price_mode: string; price_amount: string | null }>(
    "SELECT status, price_mode, price_amount::text AS price_amount FROM works WHERE id = $1", [w.id]))).rows[0];
  try {
    for (const [status, shown] of [["available", "₹6,800"], ["made_to_order", "Made to order · ₹6,800"],
                                   ["sold", "Sold"], ["on_view", "Not for sale"]] as const) {
      await owner((c) => c.query("UPDATE works SET status = $1, price_mode = 'exact', price_amount = 6800 WHERE id = $2", [status, w.id]));
      await page.goto("/m/anika-rao");
      await expect(page.locator(`.grid3 a.tile[href="/work/${w.public_token}"] .flag`), status).toHaveText(shown);
    }
  } finally {
    await owner((c) => c.query("UPDATE works SET status = $1, price_mode = $2, price_amount = $3 WHERE id = $4",
      [was.status, was.price_mode, was.price_amount, w.id]));
  }
});
