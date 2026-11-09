import { test, expect } from "@playwright/test";
import { owner, signIn, MAKER_A } from "./helpers";

// Wave 4 — cutting edge (design review R4). Each test fails if its move is taken away:
// the desktop hang and the lead work, the one view transition (and its absence under reduced
// motion), the self-standing contact message and the publish moment, and status freshness with
// one-tap reconfirmation (J-003).
//
// Uses Maker A's "Monsoon Vessel No. 4" (published by 02, three images). Two plain works are
// hung beside it for the lead-work check and removed afterwards. Monsoon's status and its
// confirmation time are put back as they were.
test.describe.configure({ mode: "serial" });

const MONSOON = "Monsoon Vessel No. 4";
const EXTRA = ["Hang Study One", "Hang Study Two"];

async function monsoon() {
  const r = await owner((c) => c.query<{ id: string; public_token: string; status: string; status_confirmed_at: string; gallery_id: string }>(
    "SELECT id, public_token, status, status_confirmed_at, gallery_id FROM works WHERE title = $1", [MONSOON]));
  return r.rows[0];
}

test.describe("cutting edge", () => {
  let before: (Awaited<ReturnType<typeof monsoon>> & { updated_at: string }) | undefined;
  test.beforeAll(async () => {
    before = (await owner((c) => c.query<NonNullable<typeof before>>(
      "SELECT id, public_token, status, status_confirmed_at, gallery_id, updated_at FROM works WHERE title = $1", [MONSOON]))).rows[0];
  });
  test.afterAll(async () => {
    await owner((c) => c.query("DELETE FROM works WHERE title IN ($1, $2)", [EXTRA[0], EXTRA[1]]));
    if (!before) return;
    await owner((c) => c.query("UPDATE works SET status = $1, status_confirmed_at = $2, updated_at = $3 WHERE id = $4",
      [before!.status, before!.status_confirmed_at, before!.updated_at, before!.id]));
  });

  test("from 900 px a work's images hang one under another beside its label", async ({ page }) => {
    const w = await monsoon();
    await page.goto(`/work/${w.public_token}`);
    const shots = page.locator("#work-images .shot img");
    await expect(shots).toHaveCount(3);
    const boxes = await shots.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    const vh = page.viewportSize()!.height;
    if (page.viewportSize()!.width >= 900) {
      // Stacked: each below the one before, none taller than 85 % of the window.
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
      for (const b of boxes) expect(b.height).toBeLessThanOrEqual(vh * 0.85 + 1);
      // The portrait image reaches past the old 80vh cap, so 85vh is what holds it.
      expect(Math.max(...boxes.map((b) => b.height))).toBeGreaterThan(vh * 0.80 + 2);
      // The wall label stays beside the images while they scroll.
      const label = page.locator(".detail-label");
      const top0 = (await label.boundingBox())!.y;
      await page.mouse.wheel(0, 600);
      await expect.poll(async () => Math.abs((await label.boundingBox())!.y - top0)).toBeLessThan(80);
    } else {
      // A swiped strip: side by side, on one line.
      expect(Math.abs(boxes[1].top - boxes[0].top)).toBeLessThan(2);
      expect(boxes[1].left).toBeGreaterThan(boxes[0].left);
    }
  });

  test("on a short laptop window the wall label scrolls with the page instead of hiding its lower half", async ({ browser }) => {
    const w = await monsoon();
    for (const [height, expected] of [[600, "static"], [900, "sticky"]] as const) {
      const ctx = await browser.newContext({ viewport: { width: 1024, height } });
      const page = await ctx.newPage();
      await page.goto(`/work/${w.public_token}`);
      expect(await page.locator(".detail-label").evaluate((e) => getComputedStyle(e).position), `${height}`).toBe(expected);
      await ctx.close();
    }
  });

  test("a maker's gallery hangs the lead work large, with the next two beside it", async ({ page }) => {
    const w = await monsoon();
    for (const [i, t] of EXTRA.entries()) await hang(t, i + 1, w.gallery_id);
    await page.goto("/m/anika-rao");
    const tiles = page.locator(".grid .tile");
    await expect(tiles).toHaveCount(3);
    const [lead, a, b] = await tiles.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    if (page.viewportSize()!.width >= 900) {
      expect(await tiles.first().getAttribute("class")).toContain("hang-first");
      // The lead is still a tile: its frame spans its width, with the label below, not beside it.
      const frame = (await tiles.first().locator(".frame").boundingBox())!;
      const title = (await tiles.first().locator(".gt").boundingBox())!;
      expect(frame.width).toBeGreaterThan(lead.width - 2);
      expect(title.y).toBeGreaterThan(frame.y + frame.height - 1);
      expect(lead.width).toBeGreaterThan(a.width * 1.8);          // two columns against one
      expect(a.left).toBeGreaterThan(lead.right - 1);              // beside it, not below
      expect(b.left).toBeGreaterThan(lead.right - 1);
      expect(b.top).toBeGreaterThan(a.top);                        // the two stack in the third column
    } else {
      // Below 900 px the hang is the plain grid; no tile is made larger by its order.
      expect(Math.abs(lead.width - a.width)).toBeLessThan(2);
    }
  });

  test("a tile becomes the work through one view transition, and never under reduced motion", async ({ browser }) => {
    const w = await monsoon();
    for (const motion of ["no-preference", "reduce"] as const) {
      const ctx = await browser.newContext({ reducedMotion: motion, viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        const d = document as unknown as { startViewTransition?: (...a: unknown[]) => unknown; __vt: number };
        d.__vt = 0;
        const real = d.startViewTransition?.bind(document);
        const w = window as unknown as { __vtReady: number };
        w.__vtReady = 0;
        // Count transitions that actually animated (ready resolves), not merely calls.
        if (real) d.startViewTransition = (...a: unknown[]) => {
          d.__vt++;
          const t = real(...a) as { ready: Promise<void> };
          t.ready.then(() => { w.__vtReady++; }, () => undefined);
          return t;
        };
      });
      await page.goto("/m/anika-rao");
      await page.locator(`.tile[href="/work/${w.public_token}"]`).click();
      await page.waitForURL(`**/work/${w.public_token}`);
      await expect(page.getByRole("heading", { level: 1, name: MONSOON })).toBeVisible();
      const calls = await page.evaluate(() => (document as unknown as { __vt: number }).__vt);
      expect(calls, motion).toBe(motion === "reduce" ? 0 : 1);
      await expect.poll(() => page.evaluate(() => (window as unknown as { __vtReady: number }).__vtReady), { message: motion })
        .toBe(motion === "reduce" ? 0 : 1);
      // The hero is the work's first image, named once on the page.
      const named = await page.evaluate(() => [...document.querySelectorAll("img")]
        .filter((i) => getComputedStyle(i).viewTransitionName === "work-hero").length);
      expect(named).toBe(1);
      await ctx.close();
    }
  });

  test("the contact message carries the work's title, status, what the visitor wants and its link", async ({ page }) => {
    const w = await monsoon();
    await owner((c) => c.query("UPDATE works SET status = 'available' WHERE id = $1", [w.id]));
    await page.goto(`/work/${w.public_token}?contact=1&intent=commission`);
    const href = decodeURIComponent((await page.locator('a[data-route-kind="whatsapp"]').getAttribute("href")) ?? "");
    expect(href).toContain(`"${MONSOON}" (Available)`);
    expect(href).toContain("commissioning something like it");
    expect(href).toContain(`/work/${w.public_token}`);
  });

  test("a shared link shows the work: its cover, title, maker and status", async ({ page, request }) => {
    const w = await monsoon();
    await page.goto(`/work/${w.public_token}`);
    const og = async (p: string) => page.locator(`meta[property="${p}"]`).getAttribute("content");
    expect(await og("og:title")).toBe(`${MONSOON} by Anika Rao`);
    expect(await og("og:description")).toContain("Available");
    const image = await og("og:image");
    const base = process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100";
    expect(image!.startsWith(`${base}/img/`), image!).toBe(true);
    expect(image).toMatch(/\/img\/[0-9a-f-]+\/w1280$/);
    const res = await request.get(new URL(image!).pathname);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/");

    // A work that is not on view shares nothing: no cover, no description.
    const retired = (await owner((c) => c.query<{ public_token: string }>(
      "SELECT public_token FROM works WHERE lifecycle = 'retired' LIMIT 1"))).rows[0];
    if (retired) {
      await page.goto(`/work/${retired.public_token}`);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(0);
    }
  });

  test("after publishing, the maker sees how the link will look and can share it in one tap", async ({ page }) => {
    const w = await monsoon();
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto(`/studio/works/${w.id}`);
    const share = page.getByTestId("share");
    await expect(share.locator(".share-title")).toHaveText(`${MONSOON} by Anika Rao`);
    await expect(share.locator(".share-card img")).toBeVisible();
    const href = decodeURIComponent((await page.getByTestId("share-whatsapp").getAttribute("href")) ?? "");
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(href).toContain(`/work/${w.public_token}`);
  });

  test("visitors see when a status was confirmed; past 90 days the Studio asks, and one tap confirms", async ({ page }) => {
    const w = await monsoon();
    await owner((c) => c.query(
      "UPDATE works SET status = 'available', status_confirmed_at = now() - interval '3 days' WHERE id = $1", [w.id]));
    await page.goto(`/work/${w.public_token}`);
    await expect(page.getByTestId("freshness")).toHaveText("Updated 3 days ago");

    await owner((c) => c.query("UPDATE works SET status_confirmed_at = now() - interval '125 days' WHERE id = $1", [w.id]));
    await page.goto(`/work/${w.public_token}`);
    await expect(page.getByTestId("freshness")).toHaveText("Status last confirmed 4 months ago");

    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio");
    const row = page.locator("li", { has: page.getByText(MONSOON, { exact: true }) });
    const ask = row.getByTestId("reconfirm");
    await expect(ask).toContainText("Status last confirmed 4 months ago");
    await page.getByRole("button", { name: `Confirm ${MONSOON} is still Available` }).click();
    await expect(page.getByText("Confirmed. Visitors now see Available as current.")).toBeVisible({ timeout: 15_000 });
    await expect(row.getByTestId("reconfirm")).toHaveCount(0);

    const after = (await owner((c) => c.query<{ status: string; fresh: boolean }>(
      "SELECT status, status_confirmed_at > now() - interval '5 minutes' AS fresh FROM works WHERE id = $1", [w.id]))).rows[0];
    expect(after).toEqual({ status: "available", fresh: true });   // confirmed, not changed

    await page.goto(`/work/${w.public_token}`);
    await expect(page.getByTestId("freshness")).toHaveText("Updated today");
  });

  test("Confirm refuses a status the maker did not see, and changes nothing", async ({ page }) => {
    const w = await monsoon();
    await owner((c) => c.query(
      "UPDATE works SET status = 'available', status_confirmed_at = now() - interval '125 days' WHERE id = $1", [w.id]));
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio");
    const row = page.locator("li", { has: page.getByText(MONSOON, { exact: true }) });
    await expect(row.getByTestId("reconfirm")).toBeVisible();
    // Changed on another device after this page loaded.
    await owner((c) => c.query("UPDATE works SET status = 'sold', status_confirmed_at = now() - interval '125 days' WHERE id = $1", [w.id]));
    await page.getByRole("button", { name: `Confirm ${MONSOON} is still Available` }).click();
    await expect(page.getByText("That did not go through; the status is as it was.")).toBeVisible({ timeout: 15_000 });
    const after = (await owner((c) => c.query<{ status: string; old: boolean }>(
      "SELECT status, status_confirmed_at < now() - interval '100 days' AS old FROM works WHERE id = $1", [w.id]))).rows[0];
    expect(after).toEqual({ status: "sold", old: true });
  });
});

/** A plain published work beside Monsoon, so the gallery has three to hang. Removed in afterAll. */
async function hang(title: string, position: number, galleryId: string) {
  await owner((c) => c.query(
    `INSERT INTO works (public_token, gallery_id, title, material, price_mode, status, lifecycle, published_at, position)
     VALUES ($1, $2, $3, 'clay', 'enquire', 'available', 'published', now(), $4)`,
    [`hang${position}${Date.now().toString(36)}`, galleryId, title, position]));
}
