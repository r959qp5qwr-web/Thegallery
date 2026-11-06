import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { owner, signIn, MAKER_A, MAKER_B } from "./helpers";

// Wave 2 — the room at every width. Runs on both projects; checks that depend on the width read
// the viewport rather than the project name. Leaves the test project as it found it.
test.describe.configure({ mode: "serial" });

const MONSOON = "Monsoon Vessel No. 4";
const STARTED = "Untitled work";
const wide = (page: import("@playwright/test").Page) => (page.viewportSize()?.width ?? 0) >= 900;

test.describe("the room at every width", () => {
  // Only Maker B's image-first drafts: never another maker's work that happens to share a title.
  const clearStarted = () => owner((c) => c.query(
    `DELETE FROM works WHERE title = $1 AND gallery_id IN
      (SELECT g.id FROM galleries g JOIN makers m ON m.id = g.maker_id WHERE m.handle = 'dhaaga-studio')`, [STARTED]));
  test.afterAll(clearStarted);

  test("the window stays the size of the screen, with no sideways scroll", async ({ page }) => {
    // Regression: overflow-x: clip on <html> made a phone size its layout viewport to the whole
    // page (innerHeight 2548 on an 839 px screen) and taps landed on the wrong element.
    for (const path of ["/", "/about", "/makers/sign-in"]) {
      await page.goto(path);
      const m = await page.evaluate(() => ({ ih: innerHeight, vh: visualViewport!.height,
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(Math.abs(m.ih - m.vh), path).toBeLessThan(2);
      expect(m.sw, path).toBeLessThanOrEqual(m.cw);
    }
  });

  test("one Sections navigation at any width, in the bar or in the header", async ({ page }) => {
    await page.goto("/");
    // Exactly one is exposed: the other is display:none, so it is not in the accessibility tree.
    await expect(page.getByRole("navigation", { name: "Sections" })).toHaveCount(1);
    const nav = page.getByRole("navigation", { name: "Sections" });
    await expect(nav.getByRole("link", { name: "Browse" })).toHaveAttribute("aria-current", "page");
    const inHeader = await nav.evaluate((n) => !!n.closest("header"));
    expect(inHeader).toBe(wide(page));
  });

  test("header and footer are landmarks of their own, outside main", async ({ page }) => {
    // Every kind of public page, /search included: one page missed is how the skip link broke.
    for (const path of ["/", "/browse/clay", "/search", "/saved", "/workshops", "/makers", "/makers/sign-in", "/privacy"]) {
      await page.goto(path);
      await expect(page.getByRole("banner"), path).toHaveCount(1);
      await expect(page.getByRole("main"), path).toHaveCount(1);
      await expect(page.locator("main#main"), path).toHaveCount(1);
      expect(await page.locator("main header, main footer").count(), path).toBe(0);
    }
    await page.goto("/about");
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    // The skip link lands on main, past the header.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("on a wide screen the work hangs beside its label, which stays in view", async ({ page }) => {
    test.skip(!wide(page), "the two-column hang begins at 900 px");
    const t = await owner((c) => c.query<{ public_token: string }>(
      "SELECT public_token FROM works WHERE title = $1", [MONSOON]));
    await page.goto(`/work/${t.rows[0].public_token}`);
    const img = await page.locator(".detail-media").boundingBox();
    const label = await page.locator(".detail-label").boundingBox();
    expect(label!.x).toBeGreaterThan(img!.x + img!.width - 1);           // beside, not below
    const heading = page.getByRole("heading", { name: MONSOON });
    const before = (await heading.boundingBox())!.y;
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);   // it did scroll
    await expect(heading).toBeInViewport();
    // The page moved and the label did not move with it: it is held beside the work.
    expect(Math.abs((await heading.boundingBox())!.y - before)).toBeLessThan(400);
  });

  test("the Studio chip changes status in place, and Undo puts it back", async ({ page }) => {
    const before = (await owner((c) => c.query<{ id: string; status: string }>(
      "SELECT id, status FROM works WHERE title = $1", [MONSOON]))).rows[0];
    const next = before.status === "available" ? "sold" : "available";
    const label = next === "sold" ? "Sold" : "Available";
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio");

    // The row shows the work itself, and the chip is a control whose name carries the value.
    await expect(page.locator(".rowlist.works .thumb img").first()).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`^Status: .*Change status of ${MONSOON}`) }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByText(`Marked as ${label}`)).toBeVisible({ timeout: 15_000 });
    expect((await owner((c) => c.query<{ status: string }>(
      "SELECT status FROM works WHERE id = $1", [before.id]))).rows[0].status).toBe(next);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Status put back to")).toBeVisible({ timeout: 15_000 });
    expect((await owner((c) => c.query<{ status: string }>(
      "SELECT status FROM works WHERE id = $1", [before.id]))).rows[0].status).toBe(before.status);
  });

  test("a refused image-first save keeps what was typed and asks for the image again", async ({ page }) => {
    await clearStarted();
    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto("/studio/works/new");
    await page.getByLabel("Image file").setInputFiles(join(process.cwd(), "e2e/fixtures/square-1x1.jpg"));
    await page.getByLabel("Medium").fill("Kept medium probe");
    await page.getByRole("radio", { name: "Fixed price" }).check();       // fixed price, no amount: refused
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByTestId("form-error")).toContainText("Choose the image again");
    await expect(page.getByLabel("Title")).toHaveValue("");              // not "Untitled work"
    await expect(page.getByLabel("Medium")).toHaveValue("Kept medium probe");
    expect((await owner((c) => c.query("SELECT 1 FROM works WHERE medium = 'Kept medium probe'"))).rowCount).toBe(0);
  });

  test("a work can start from a picture alone, and is not published untitled", async ({ page }) => {
    await clearStarted();
    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto("/studio/works/new");
    // Plate R-3: the images come first.
    const order = await page.evaluate(() => {
      const img = document.querySelector("#image")!.getBoundingClientRect().top;
      const title = document.querySelector("#title")!.getBoundingClientRect().top;
      return img < title;
    });
    expect(order).toBe(true);

    await page.getByLabel("Image file").setInputFiles(join(process.cwd(), "e2e/fixtures/square-1x1.jpg"));
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft work")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("saved with its first image")).toBeVisible();
    await expect(page.getByRole("heading", { name: STARTED })).toBeVisible();
    const w = (await owner((c) => c.query<{ id: string }>("SELECT id FROM works WHERE title = $1", [STARTED]))).rows[0];
    const imgs = await owner((c) => c.query<{ state: string }>("SELECT state FROM work_images WHERE work_id = $1", [w.id]));
    expect(imgs.rows.map((r) => r.state)).toEqual(["ready"]);

    await page.getByTestId("publish").click();
    await expect(page.getByTestId("form-error")).toContainText("Give this work its title");
    const lc = await owner((c) => c.query<{ lifecycle: string }>("SELECT lifecycle FROM works WHERE id = $1", [w.id]));
    expect(lc.rows[0].lifecycle).toBe("draft");
  });
});
