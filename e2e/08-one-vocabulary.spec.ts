import { test, expect, type Page } from "@playwright/test";
import { owner, signIn, MAKER_A } from "./helpers";

// Wave 3 — one vocabulary. The design review's word table, held by journeys: each test below
// fails if the old word it names comes back on the pages it visits. Stored tokens are unchanged
// (R3); only what a person reads changes. "Contact The Clay Collective" (shortName) and "Retire
// this work" landed in Wave 1 and are held by format.ts and e2e/04, not here.
//
// Uses Maker A's "Monsoon Vessel No. 4" (published by 02, three images). Its status is put
// back to what it was when the walk ends.
test.describe.configure({ mode: "serial" });

const MONSOON = "Monsoon Vessel No. 4";
const SHOWN = ["Available", "Made to order", "By enquiry", "Not for sale", "Sold"];
const STORED = ["available", "made_to_order", "enquire", "on_view", "sold"];

async function monsoon() {
  const r = await owner((c) => c.query<{ id: string; public_token: string; status: string }>(
    "SELECT id, public_token, status FROM works WHERE title = $1", [MONSOON]));
  return r.rows[0];
}

async function visibleText(page: Page): Promise<string> {
  return page.locator("body").innerText();
}

test.describe("one vocabulary", () => {
  let original = "available";
  test.beforeAll(async () => { original = (await monsoon()).status; });
  test.afterAll(async () => {
    await owner((c) => c.query("UPDATE works SET status = $1 WHERE title = $2", [original, MONSOON]));
  });

  test("a visitor reads 'By enquiry' and 'Not for sale', never a status that reads as a button", async ({ page }) => {
    const w = await monsoon();
    for (const [token, shown, old] of [["enquire", "By enquiry", "Enquire"], ["on_view", "Not for sale", "On view"]] as const) {
      await owner((c) => c.query("UPDATE works SET status = $1 WHERE id = $2", [token, w.id]));
      await page.goto(`/work/${w.public_token}`);
      const status = page.locator(".label .status");
      await expect(status).toContainText(shown);
      await expect(status).not.toContainText(new RegExp(`^${old}`));
      // The maker's own gallery shows the same word on this work's tile.
      await page.goto("/m/anika-rao");
      const tile = page.locator(".tile", { has: page.locator(".gt", { hasText: MONSOON }) });
      await expect(tile.locator(".gs")).toContainText(shown);
    }
  });

  test("every status picker in the Studio lists the same five names over the same stored values", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    const w = await monsoon();

    for (const path of [`/studio/works/${w.id}`, "/studio/works/new"]) {
      await page.goto(path);
      const options = page.locator("select#status option");
      expect(await options.allInnerTexts(), path).toEqual(SHOWN);
      expect(await options.evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value)), path).toEqual(STORED);
    }

    // The chip's picker sheet on the Studio list.
    await page.goto(`/studio?status=${w.id}`);
    const choices = page.locator("#status-sheet .choice button");
    expect((await choices.allInnerTexts()).map((t) => t.trim())).toEqual(SHOWN);
  });

  test("a maker never reads 'route' or 'identity' in the Studio", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio");
    await expect(page.getByRole("link", { name: "Ways to contact you" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Your details" })).toBeVisible();

    for (const path of ["/studio", "/studio/contact-routes", "/studio/profile", "/studio/account", "/studio/works/new"]) {
      await page.goto(path);
      const text = await visibleText(page);
      expect(text, path).not.toMatch(/\broutes?\b/i);
      expect(text, path).not.toMatch(/\bidentity\b/i);
    }

    await page.goto("/studio/contact-routes");
    await expect(page).toHaveTitle(/^Ways to contact you/);
    await expect(page.getByLabel("Way to contact")).toBeVisible();
    await expect(page.getByLabel("Number or address")).toBeVisible();
    // Screen-reader names carry no engineering word either.
    const names = await page.locator("[aria-label]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""));
    expect(names.filter((n) => /\broute\b/i.test(n))).toEqual([]);
  });

  test("a visitor reads no engineering word on the public pages", async ({ page }) => {
    const w = await monsoon();
    for (const path of ["/", "/about", "/participation", "/privacy", "/makers", "/m/anika-rao", `/work/${w.public_token}`, `/work/${w.public_token}?contact=1`]) {
      await page.goto(path);
      expect(await visibleText(page), path).not.toMatch(/\broutes?\b|\bviews\b|swipe/i);
    }
  });

  test("closing an account says the works are retired, not taken 'off view'", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio/account");
    await expect(page.getByText(/published works? (is|are) retired/)).toBeVisible();
    expect(await visibleText(page)).not.toMatch(/off view|dead button/i);
  });

  test("a maker at the operator's door is told plainly, without an idiom", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/operator");
    await expect(page.getByRole("heading", { name: "Only the operator can open this page" })).toBeVisible();
    expect(await visibleText(page)).not.toMatch(/door/i);
  });

  test("a work's images say where you are — '1 of 3' — and follow the strip", async ({ page }) => {
    const w = await monsoon();
    await page.goto(`/work/${w.public_token}`);
    const count = page.getByTestId("image-count");
    await expect(count).toHaveText("1 of 3");
    expect(await visibleText(page)).not.toMatch(/\bviews\b|swipe|\d+ images/i);

    const strip = page.locator("#work-images");
    await strip.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
    await expect(count).toHaveText("3 of 3");
    await strip.evaluate((el) => { el.scrollLeft = 0; });
    await expect(count).toHaveText("1 of 3");
  });
});
