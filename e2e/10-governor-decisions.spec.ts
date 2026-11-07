import { test, expect } from "@playwright/test";
import { owner, signIn, MAKER_A } from "./helpers";

// The governor's decisions of 2026-11-07. Each test fails if its decision is taken away:
//  1. One price rule (labelPrice): no price beside "Sold" or "Not for sale", and a price never
//     repeats its status ("By enquiry · Price on enquiry"). The Studio says when a stored price
//     is kept off public pages.
//  3. Hang this first: a Studio control that moves one published work to the front of the
//     maker's order, changing only its position.
// (Decision 2, keep the tile-to-hero size morph, changes no code; 09 pins the transition.)
//
// Uses Maker A's "Monsoon Vessel No. 4" (published by 02 at a fixed ₹6,800). Two plain works are
// hung beside it for the order check and removed afterwards; Monsoon's price, status,
// confirmation, position and updated_at are put back exactly.
test.describe.configure({ mode: "serial" });

const MONSOON = "Monsoon Vessel No. 4";
const EXTRA = ["Order Study One", "Order Study Two"];

type Snapshot = { id: string; public_token: string; gallery_id: string; status: string; price_mode: string;
  price_amount: string | null; status_confirmed_at: string; updated_at: string; position: number };

async function monsoon(): Promise<Snapshot> {
  return (await owner((c) => c.query<Snapshot>(
    `SELECT id, public_token, gallery_id, status, price_mode, price_amount::text AS price_amount,
            status_confirmed_at::text AS status_confirmed_at, updated_at::text AS updated_at, position
       FROM works WHERE title = $1`, [MONSOON]))).rows[0];
}

async function setLabel(id: string, status: string, mode: string, amount: number | null) {
  await owner((c) => c.query("UPDATE works SET status = $1, price_mode = $2, price_amount = $3 WHERE id = $4",
    [status, mode, amount, id]));
}

test.describe("governor decisions", () => {
  let before: Snapshot | undefined;
  test.beforeAll(async () => { before = await monsoon(); });
  test.afterAll(async () => {
    await owner((c) => c.query("DELETE FROM works WHERE title IN ($1, $2)", [EXTRA[0], EXTRA[1]]));
    if (!before) return;
    await owner((c) => c.query(
      `UPDATE works SET status = $1, price_mode = $2, price_amount = $3, status_confirmed_at = $4,
              updated_at = $5, position = $6 WHERE id = $7`,
      [before!.status, before!.price_mode, before!.price_amount, before!.status_confirmed_at,
       before!.updated_at, before!.position, before!.id]));
  });

  test("a work's page shows one price line: none beside Sold or Not for sale, never a repeat", async ({ page }) => {
    const w = await monsoon();
    // [status, price mode, amount, the price a visitor reads (null: none)]
    const cases: [string, string, number | null, string | null][] = [
      ["available", "exact", 6800, "₹6,800"],
      ["on_view", "exact", 6800, null],              // Not for sale: the figure is not an offer
      ["sold", "exact", 6800, null],
      ["sold", "enquire", null, null],               // was "Sold · Price on enquiry"
      ["enquire", "enquire", null, null],            // was "By enquiry · Price on enquiry"
      ["available", "enquire", null, "Price on enquiry"],
      ["made_to_order", "made_to_order", null, null], // was "Made to order · Made to order"
      ["available", "made_to_order", null, "Made to order"],
      ["enquire", "exact", 6800, "₹6,800"],
      ["enquire", "made_to_order", null, "Made to order"],
      ["made_to_order", "enquire", null, "Price on enquiry"],
      ["made_to_order", "exact", 6800, "₹6,800"],
      ["on_view", "enquire", null, null],
      ["on_view", "made_to_order", null, null],
      ["sold", "made_to_order", null, null],
    ];
    for (const [status, mode, amount, shown] of cases) {
      await setLabel(w.id, status, mode, amount);
      await page.goto(`/work/${w.public_token}`);
      const line = page.locator(".detail-label .label .status");
      await expect(line, `${status}/${mode}`).toBeVisible();
      if (shown) await expect(line.getByTestId("price"), `${status}/${mode}`).toHaveText(shown);
      else await expect(line.getByTestId("price"), `${status}/${mode}`).toHaveCount(0);
      // Read as textContent (the line is set in label capitals, which innerText would return),
      // so these hold whether or not the price carries its test id.
      if (!shown?.startsWith("₹")) await expect(line, `${status}/${mode}`).not.toContainText("₹");
      if (shown !== "Price on enquiry") await expect(line, `${status}/${mode}`).not.toContainText("Price on enquiry");
      const text = (await line.textContent()) ?? "";
      expect(text.split("Made to order").length - 1, `${status}/${mode}: ${text}`).toBeLessThanOrEqual(1);
    }
  });

  test("a tile and the entrance show only a stated amount, and none beside Not for sale", async ({ page }) => {
    const w = await monsoon();
    const tile = () => page.locator(".tile", { has: page.locator(".gt", { hasText: MONSOON }) }).locator(".gs");
    // Monsoon is the only public work here, so the entrance features it.
    const entrance = () => page.locator(".featured-label .status");
    await setLabel(w.id, "available", "exact", 6800);
    await page.goto("/m/anika-rao");
    await expect(tile()).toHaveText("Available · ₹6,800");
    await page.goto("/");
    await expect(entrance()).toContainText("₹6,800");
    await setLabel(w.id, "on_view", "exact", 6800);
    await page.goto("/m/anika-rao");
    await expect(tile()).toHaveText("Not for sale");
    await page.goto("/");
    await expect(entrance()).not.toContainText("₹");
    // A tile is a glance: words for a price stay on the work's own page.
    for (const mode of ["enquire", "made_to_order"]) {
      await setLabel(w.id, "available", mode, null);
      await page.goto("/m/anika-rao");
      await expect(tile(), mode).toHaveText("Available");
      await page.goto("/");
      await expect(entrance(), mode).not.toContainText(mode === "enquire" ? "Price on enquiry" : "Made to order");
    }
  });

  test("the Studio tells the maker their price is not shown while the work is Not for sale", async ({ page }) => {
    const w = await monsoon();
    await setLabel(w.id, "on_view", "exact", 6800);
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto(`/studio/works/${w.id}`);
    await expect(page.getByTestId("price-hidden")).toHaveText("not shown while Not for sale");
    await setLabel(w.id, "available", "exact", 6800);
    await page.goto(`/studio/works/${w.id}`);
    await expect(page.locator(".label .status .price")).toHaveText("· ₹6,800");
    // A sentence, not a label: the note is not set in the label's capitals.
    await setLabel(w.id, "on_view", "exact", 6800);
    await page.goto(`/studio/works/${w.id}`);
    expect(await page.getByTestId("price-hidden").evaluate((e) => getComputedStyle(e).textTransform)).toBe("none");
    await setLabel(w.id, "available", "exact", 6800);
    await page.goto(`/studio/works/${w.id}`);
    await expect(page.getByTestId("price-hidden")).toHaveCount(0);
  });

  test("Hang this first moves the work to the front of the wall and changes nothing else", async ({ page }) => {
    const w = await monsoon();
    // Two works published after Monsoon at the same position: the most recent hangs first.
    for (const t of EXTRA) {
      await owner((c) => c.query(
        `INSERT INTO works (public_token, gallery_id, title, material, price_mode, status, lifecycle, published_at, position)
         VALUES ($1, $2, $3, 'clay', 'enquire', 'available', 'published', now(), $4)`,
        [`order${Date.now().toString(36)}${t.length}${t.at(-1)}`, w.gallery_id, t, w.position]));
    }
    await page.goto("/m/anika-rao");
    await expect(page.locator(".grid .tile .gt").first()).not.toHaveText(MONSOON);
    const was = await monsoon();

    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto(`/studio/works/${w.id}`);
    const order = page.getByTestId("hang-order");
    await expect(order).toBeVisible();
    // The same page open in a second tab, left stale.
    const stale = await page.context().newPage();
    await stale.goto(`/studio/works/${w.id}`);
    await order.getByRole("button", { name: "Hang this first" }).click();
    await expect(page.getByText("This work now opens your gallery.")).toBeVisible({ timeout: 15_000 });
    // Now first: the page says so instead of offering the act again.
    await expect(order.getByRole("button", { name: "Hang this first" })).toHaveCount(0);
    await expect(order).toContainText("First in your gallery.");

    await page.goto("/m/anika-rao");
    await expect(page.locator(".grid .tile .gt").first()).toHaveText(MONSOON);
    // A second press from the stale tab moves nothing further.
    const once = await monsoon();
    await stale.getByTestId("hang-order").getByRole("button", { name: "Hang this first" }).click();
    await expect(stale.getByText("This work now opens your gallery.")).toBeVisible({ timeout: 15_000 });
    expect((await monsoon()).position).toBe(once.position);
    await stale.close();
    // Only its position moved: nothing a visitor reads about the work changed, and the Studio
    // list (ordered by updated_at) does not reshuffle.
    const now = await monsoon();
    expect(now.position).toBeLessThan(was.position);
    expect({ ...now, position: 0 }).toEqual({ ...was, position: 0 });

    // Another work, not first, is offered the act; the first one is not.
    const other = (await owner((c) => c.query<{ id: string }>("SELECT id FROM works WHERE title = $1", [EXTRA[0]]))).rows[0];
    await page.goto(`/studio/works/${other.id}`);
    await expect(page.getByTestId("hang-order").getByRole("button", { name: "Hang this first" })).toBeVisible();
  });

  test("a wall no visitor can see is offered no order to set", async ({ page }) => {
    const w = await monsoon();
    await owner((c) => c.query("UPDATE galleries SET lifecycle = 'draft' WHERE id = $1", [w.gallery_id]));
    try {
      await signIn(page, MAKER_A.email, MAKER_A.password);
      await page.goto(`/studio/works/${w.id}`);
      await expect(page.getByTestId("share-not-public")).toBeVisible();
      await expect(page.getByTestId("hang-order")).toHaveCount(0);
    } finally {
      await owner((c) => c.query("UPDATE galleries SET lifecycle = 'published' WHERE id = $1", [w.gallery_id]));
    }
  });

  test("a gallery with one work on its wall is offered no order to set", async ({ page }) => {
    await owner((c) => c.query("DELETE FROM works WHERE title IN ($1, $2)", [EXTRA[0], EXTRA[1]]));
    const w = await monsoon();
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto(`/studio/works/${w.id}`);
    await expect(page.getByTestId("share")).toBeVisible();
    await expect(page.getByTestId("hang-order")).toHaveCount(0);
  });
});
