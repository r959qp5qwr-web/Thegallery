import { test, expect, type Page } from "@playwright/test";
import { inflateSync } from "node:zlib";
import { owner, signIn, MAKER_A } from "./helpers";

// Wave 5, "first impression" (2026-11-09), as amended the same day by the drawing board (governor:
// the original look restored, a bottom bar on public pages, Workshops hidden, 16 screens approved).
// Each test fails if its change is taken away:
//  - say it once: a name or a section appears at most once on a screen;
//  - no route into an empty room, and an empty site that opens on the empty plinth and a sentence;
//  - one solid action per screen, and on a work it is the message, on the first phone screen;
//  - the bar on public screens, off the screens that dock their own action;
//  - the Studio's photo picker is designed, not the browser's;
//  - installable: a manifest and icons that are what they say they are;
//  - The Gallery names no city of its own.
//
// The empty-site test takes every public work down for its duration (taken_down, the operator's
// switch, read by the public views) and puts each back exactly as it was, updated_at included.
test.describe.configure({ mode: "serial" });

const MONSOON = "Monsoon Vessel No. 4";
const PUBLIC = ["/", "/browse/clay", "/search", "/saved", "/workshops", "/makers", "/about",
                "/participation", "/privacy", "/no-such-page", "/m/anika-rao"];

async function monsoonToken(): Promise<string> {
  return (await owner((c) => c.query<{ public_token: string }>(
    "SELECT public_token FROM works WHERE title = $1", [MONSOON]))).rows[0].public_token;
}

/** How many times a phrase is on the screen a person sees: text in rendered, visible elements
 *  only (display:none, a closed menu, a closed sheet do not count). Read from textContent, so
 *  any text-transform cannot hide a repeat (GAL-L0025). */
async function visibleCount(page: Page, phrase: string, within = "body"): Promise<number> {
  return page.evaluate(([p, sel]) => {
    const root = document.querySelector(sel);
    if (!root) return 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n = 0;
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const el = t.parentElement;
      if (!el || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      n += (t.textContent ?? "").split(p).length - 1;
    }
    return n;
  }, [phrase, within] as const);
}

test.describe("first impression", () => {
  test("say it once: For Makers at most once on any public screen, the maker once on a work", async ({ page }) => {
    for (const path of PUBLIC) {
      await page.goto(path);
      expect(await visibleCount(page, "For Makers"), path).toBeLessThanOrEqual(1);
    }
    await page.goto(`/work/${await monsoonToken()}`);
    expect(await visibleCount(page, "Anika Rao", "main")).toBe(1);
  });

  test("no door into an empty room: the rail offers only materials with work, and an empty one leads to work", async ({ page }) => {
    await page.goto("/");
    const offered = await page.getByRole("navigation", { name: "Material" }).getByRole("link").allTextContents();
    expect(offered.length).toBeGreaterThan(0);
    for (const label of offered) {
      await page.goto("/");
      await page.getByRole("navigation", { name: "Material" }).getByRole("link", { name: label }).click();
      await expect(page.locator(".grid .tile").first(), label).toBeVisible();
    }
    // Textile has nothing on view in the test project: its rail names only itself and rooms with
    // work, and its one way out arrives somewhere with work in it.
    await page.goto("/browse/textile");
    const rail = await page.getByRole("navigation", { name: "Material" }).getByRole("link").allTextContents();
    expect(rail).toEqual(["Clay", "Textile"]);
    await page.getByTestId("next-material").click();
    await expect(page.locator(".grid .tile").first()).toBeVisible();
  });

  test("the empty site opens on the empty plinth and a sentence, with no work pictured, no rail and only real routes", async ({ page }) => {
    const live = (await owner((c) => c.query<{ id: string; updated_at: string }>(
      `SELECT id, updated_at::text AS updated_at FROM works WHERE lifecycle = 'published' AND taken_down = false`))).rows;
    try {
      for (const w of live) await owner((c) => c.query("UPDATE works SET taken_down = true WHERE id = $1", [w.id]));
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1, name: "The first works are being hung." })).toBeVisible();
      await expect(page.locator(".hero, main img")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Material" })).toHaveCount(0);
      const routes = await page.getByTestId("opening").getByRole("link").evaluateAll(
        (as) => as.map((a) => new URL((a as HTMLAnchorElement).href).pathname));
      expect(routes).toEqual(["/makers"]);
      // The empty plinth is back (drawing board, screen 1b): decoration, hidden from assistive tech.
      await expect(page.getByTestId("plinth")).toBeVisible();
      expect(await page.getByTestId("plinth").getAttribute("aria-hidden")).toBe("true");
      // The Gallery names no city of its own (GAL-OD-04, amended by the governor 2026-11-09).
      expect(await page.locator("body").textContent()).not.toMatch(/bengaluru|bangalore/i);
      // Every empty room says so once and offers no door into another empty room.
      await page.goto("/browse/clay");
      await expect(page.getByRole("heading", { name: "No clay on view yet" })).toBeVisible();
      await expect(page.getByTestId("next-material")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Material" })).toHaveCount(0);
    } finally {
      for (const w of live) {
        await owner((c) => c.query("UPDATE works SET taken_down = false, taken_down_reason = NULL, updated_at = $1 WHERE id = $2",
          [w.updated_at, w.id]));
      }
    }
    for (const w of live) {
      const row = (await owner((c) => c.query<{ taken_down: boolean; updated_at: string }>(
        "SELECT taken_down, updated_at::text AS updated_at FROM works WHERE id = $1", [w.id]))).rows[0];
      expect(row).toEqual({ taken_down: false, updated_at: w.updated_at });
    }
  });

  test("one filled action per screen; on a work it is the message, on the first phone screen", async ({ page }) => {
    // Filled = solid ink (the docked action). Every other action is the amber-edged line.
    const filled = (p: Page) => p.locator(".btn.solid, .act.solid").evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).checkVisibility()).length);
    for (const path of PUBLIC) {
      await page.goto(path);
      expect(await filled(page), path).toBeLessThanOrEqual(1);
    }
    await page.goto(`/work/${await monsoonToken()}`);
    expect(await filled(page)).toBe(1);
    const message = page.getByRole("link", { name: /^Message Anika$/ });
    await expect(message).toBeInViewport();
    // Filled: ink ground, paper text (tokens.css --ink / --paper).
    expect(await message.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(34, 30, 26)");
    // Nothing on a public page carries the old arrow glyph.
    for (const path of PUBLIC) {
      await page.goto(path);
      expect(await visibleCount(page, "→"), path).toBe(0);
    }
  });

  test("the maker's gallery keeps the handoff disclosure's whole meaning before its routes (GAL-C1)", async ({ page }) => {
    await page.goto("/m/anika-rao");
    const said = page.getByTestId("disclosure");
    for (const term of ["directly", "Payment", "delivery", "returns", "dispute", "no part in the sale"]) {
      await expect(said, term).toContainText(term);
    }
    // Said before the first way to contact, in reading order.
    const order = await page.evaluate(() => {
      const d = document.querySelector('[data-testid="disclosure"]');
      const r = document.querySelector('a[href^="https://wa.me/"], a[href^="mailto:"]');
      return d && r ? d.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING : 0;
    });
    expect(order).toBeTruthy();
  });

  test("the featured work is shown whole, never cropped", async ({ page }) => {
    await page.goto("/");
    const img = page.locator(".hero img");
    await expect(img).toBeVisible();
    const [shown, natural] = await img.evaluate((i) => {
      const im = i as HTMLImageElement; const r = im.getBoundingClientRect();
      return [r.width / r.height, im.naturalWidth / im.naturalHeight];
    });
    expect(Math.abs(shown - natural) / natural).toBeLessThan(0.02);
    expect(await img.evaluate((i) => getComputedStyle(i).objectFit)).not.toBe("cover");
  });

  test("The Gallery names no city of its own: no public screen, Menu or manifest says Bengaluru (GAL-OD-04)", async ({ page, request }) => {
    // Read from textContent, so hidden text (a closed Menu, a colophon) is caught too. A maker's
    // own place may appear on their pages; the seeded makers are elsewhere, so any match is ours.
    for (const path of [...PUBLIC, "/m/dhaaga-studio", `/work/${await monsoonToken()}`]) {
      await page.goto(path);
      expect(await page.locator("html").textContent(), path).not.toMatch(/bengaluru|bangalore/i);
      // Every meta description (name or property, so og: and twitter: too), read without waiting.
      const metas = await page.evaluate(() => Array.from(document.querySelectorAll("meta[content]"),
        (m) => m.getAttribute("content") ?? "").join(" | "));
      expect(metas, path).not.toMatch(/bengaluru|bangalore/i);
    }
    expect(JSON.stringify(await (await request.get("/manifest.webmanifest")).json())).not.toMatch(/bengaluru|bangalore/i);
  });

  test("the bar: on every public screen, on the Studio's home, and off the screens that dock their own action", async ({ page }) => {
    const narrow = page.viewportSize()!.width < 900;
    for (const path of ["/", "/search", "/saved", "/browse/clay", "/m/anika-rao", "/about"]) {
      await page.goto(path);
      if (narrow) await expect(page.locator("nav.bar"), path).toBeVisible();
      else await expect(page.locator("nav.bar"), path).toBeHidden();
    }
    // A work docks its Message; sign-up docks its Continue: no bar beside them.
    for (const path of [`/work/${await monsoonToken()}`, "/makers", "/makers/sign-in"]) {
      await page.goto(path);
      await expect(page.locator("nav.bar"), path).toHaveCount(0);
    }
    // The fourth place is Studio for everyone: a visitor arrives at For Makers, a maker at the Studio.
    await page.goto("/saved");
    expect(new URL(await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Studio" })
      .evaluate((a) => (a as HTMLAnchorElement).href)).pathname).toBe("/makers");
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio");
    if (narrow) await expect(page.locator("nav.bar")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Studio" }))
      .toHaveAttribute("aria-current", "page");
  });

  test("the Studio's photo picker is a designed control over the native input", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio/works/new");
    const input = page.getByLabel("Choose a photograph");
    await expect(input).toHaveAttribute("type", "file");
    const box = (await input.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(1);                       // the browser's button is not shown
    await expect(page.getByText("No photograph chosen yet")).toBeVisible();
    await input.setInputFiles({ name: "kiln-study.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
    await expect(page.getByText("kiln-study.jpg")).toBeVisible();
    // React resets the form after a refused save; the line must not keep naming a file the input
    // no longer holds.
    await input.evaluate((i) => (i as HTMLInputElement).form!.reset());
    await expect(page.getByText("No photograph chosen yet")).toBeVisible();
    // Keyboard focus on the hidden input shows on the designed button.
    await input.focus();
    await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
    expect(await page.locator("label.picker-btn").evaluate((l) => getComputedStyle(l).boxShadow)).not.toBe("none");
  });
});

/** Width and height from a PNG's IHDR, and that it decodes (the IDAT inflates). */
function pngSize(buf: Buffer): { w: number; h: number } {
  expect(buf.subarray(1, 4).toString("latin1")).toBe("PNG");
  const idat: Buffer[] = [];
  for (let at = 8; at < buf.length;) {
    const len = buf.readUInt32BE(at); const type = buf.subarray(at + 4, at + 8).toString("latin1");
    if (type === "IDAT") idat.push(buf.subarray(at + 8, at + 8 + len));
    at += 12 + len;
  }
  expect(inflateSync(Buffer.concat(idat)).length).toBeGreaterThan(0);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

test("installable: a manifest whose icons are what they say they are", async ({ page, request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  const m = await res.json() as { name: string; start_url: string; display: string;
    icons: { src: string; sizes: string; type: string; purpose: string }[] };
  expect(m.name).toBe("The Gallery");
  expect(m.start_url).toBe("/");
  for (const need of ["192x192 any", "512x512 any", "192x192 maskable", "512x512 maskable"]) {
    expect(m.icons.map((i) => `${i.sizes} ${i.purpose}`), need).toContain(need);
  }
  for (const icon of [...m.icons, { src: "/icons/favicon-32.png", sizes: "32x32", type: "image/png", purpose: "any" },
                      { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" }]) {
    const r = await request.get(icon.src);
    expect(r.status(), icon.src).toBe(200);
    expect(r.headers()["content-type"], icon.src).toContain("image/png");
    const { w, h } = pngSize(await r.body());
    expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
  }
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect((await request.get(apple!)).status()).toBe(200);
});

test("the design system the product serves is byte-for-byte the accepted reference", async () => {
  // A change to tokens.css or system.css is a SYSTEM CHANGE (governor's word) and must land in
  // both places at once. Seen 2026-11-09: a review fix reached public/ and not the reference.
  const { readFileSync } = await import("node:fs");
  for (const f of ["tokens.css", "system.css"]) {
    const served = readFileSync(`public/gallery/${f}`);
    const reference = readFileSync(`ux/reference/interface/${f}`);
    expect(served.equals(reference), f).toBe(true);
  }
});
