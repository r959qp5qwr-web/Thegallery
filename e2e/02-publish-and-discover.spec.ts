import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { owner, signIn, MAKER_A, ROUTE_WHATSAPP, ROUTE_EMAIL } from "./helpers";

// J-002 second half and J-001: the maker publishes, the visitor arrives.
// One ordered walk — this is a vertical slice, and the steps are the slice.
test.describe.configure({ mode: "serial" });

const FIXTURES = join(process.cwd(), "e2e", "fixtures");
const TITLE = "Monsoon Vessel No. 4";

test.describe("publish a work and meet it as a visitor", () => {
  test.beforeAll(async () => {
    // Start from a maker with an identity but no works, so the walk creates everything it proves.
    await owner((c) => c.query(
      `DELETE FROM works WHERE gallery_id IN
        (SELECT g.id FROM galleries g JOIN makers m ON m.id = g.maker_id WHERE m.handle = 'anika-rao')`));
    await owner((c) => c.query(
      `DELETE FROM contact_routes WHERE maker_id IN (SELECT id FROM makers WHERE handle = 'anika-rao')`));
    await owner((c) => c.query(
      `UPDATE galleries SET lifecycle = 'draft', published_at = NULL WHERE maker_id IN
        (SELECT id FROM makers WHERE handle = 'anika-rao')`));
  });

  test("the maker adds contact routes without exposing the account email", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio/contact-routes");

    // The Studio states the separation in words, on the page where it matters.
    await expect(page.getByText(MAKER_A.email)).toBeVisible();
    await expect(page.getByText("is not one of them and never becomes one")).toBeVisible();

    // Each add is settled on the list, not on the notice. The notice from the previous add is
    // still on screen when the next one is typed, so waiting for it proves nothing; the row
    // appears only after the server has answered and the form has reset.
    const rows = page.locator("ul.rowlist li");

    await page.getByLabel("Kind").selectOption("whatsapp");
    await page.getByLabel("The route").fill(ROUTE_WHATSAPP);
    await page.getByRole("button", { name: "Add route" }).click();
    await expect(page.getByTestId("form-notice")).toContainText("Route added");
    await expect(rows).toHaveCount(1);

    await page.getByLabel("Kind").selectOption("email");
    await page.getByLabel("The route").fill(ROUTE_EMAIL);
    await page.getByRole("button", { name: "Add route" }).click();
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText(ROUTE_EMAIL);

    // A malformed route is refused with a sentence that says how to fix it.
    await page.getByLabel("Kind").selectOption("whatsapp");
    await page.getByLabel("The route").fill("98765 43210");
    await page.getByRole("button", { name: "Add route" }).click();
    await expect(page.getByTestId("form-error")).toContainText("international form");
  });

  test("the maker creates a work with three differently shaped images and publishes it", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio/works/new");
    await page.getByLabel("Title").fill(TITLE);
    await page.getByLabel("Material").selectOption("clay");
    await page.getByLabel("Medium").fill("Wood-fired stoneware");
    await page.getByLabel("About this work").fill("Fired over four days; the ash fell where it chose.");
    await page.getByLabel("Height in centimetres").fill("28");
    await page.getByLabel("Width in centimetres").fill("19");
    await page.getByLabel("Year").fill("2026");
    await page.getByLabel("Price", { exact: true }).selectOption("exact");
    await page.getByLabel("Amount (₹)").fill("6800");
    await page.getByLabel("Status").selectOption("available");
    await page.getByRole("button", { name: "Save draft" }).click();

    await expect(page.getByText("The label is saved")).toBeVisible();
    const workUrl = page.url();

    // Publish is closed until an image has finished uploading — the button says why.
    await expect(page.getByTestId("publish")).toBeDisabled();
    await expect(page.getByText("Add one image that finished uploading")).toBeVisible();

    for (const shape of ["portrait-3x4.jpg", "landscape-3x2.jpg", "square-1x1.jpg"]) {
      await page.goto(workUrl);
      await page.getByLabel("Image file").setInputFiles(join(FIXTURES, shape));
      await page.getByLabel("Describe the image").fill(`${TITLE}, ${shape.split("-")[0]} view`);
      await page.getByRole("button", { name: "Add image" }).click();
      await expect(page.getByTestId("form-notice")).toContainText("Image added");
    }

    await page.goto(workUrl);
    await expect(page.getByText("Images · 3 ready")).toBeVisible();

    // Each image keeps its own proportion: nothing was cropped to a common shape.
    const stored = await owner((c) => c.query<{ width: number; height: number }>(
      `SELECT width, height FROM work_images WHERE work_id =
        (SELECT id FROM works WHERE title = $1) ORDER BY position`, [TITLE]));
    const ratios = stored.rows.map((r) => Number((r.width / r.height).toFixed(2)));
    expect(ratios).toEqual([0.75, 1.5, 1]);

    await page.getByTestId("publish").click();
    // Publishing re-renders the page as a published work: the Publish button is replaced by
    // the status control. That replacement IS the outcome, so it is what gets asserted.
    await expect(page.getByText("Published work")).toBeVisible();
    await expect(page.getByLabel("This work is")).toBeVisible();
  });

  test("pressing publish again does not publish twice", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    const work = await owner((c) => c.query<{ id: string }>("SELECT id FROM works WHERE title = $1", [TITLE]));
    await page.goto(`/studio/works/${work.rows[0].id}`);

    // A published work shows status controls rather than a second Publish button; the
    // idempotency record is what makes a replayed submit safe, and it is checked directly.
    await expect(page.getByLabel("This work is")).toBeVisible();
    const intents = await owner((c) => c.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM write_intents WHERE kind = 'publish_work' AND subject_id = $1",
      [work.rows[0].id]));
    expect(intents.rows[0].n).toBe(1);

    const published = await owner((c) => c.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM works WHERE title = $1 AND lifecycle = 'published'", [TITLE]));
    expect(published.rows[0].n).toBe(1);
  });

  test("an anonymous visitor meets the work at the entrance, in Clay and in search", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(page.getByText("Available")).toBeVisible();
    await expect(page.getByText("₹6,800")).toBeVisible();

    await page.goto("/browse/clay");
    await expect(page.getByText(TITLE)).toBeVisible();

    await page.goto("/search?q=Monsoon");
    await expect(page.getByText(TITLE)).toBeVisible();
    await page.goto("/search?q=Anika");
    await expect(page.getByText(TITLE)).toBeVisible();
    await page.goto("/search?q=zzzznotathing");
    await expect(page.getByText("Nothing found")).toBeVisible();
  });

  test("the visitor opens the work, then the maker's wider gallery", async ({ page }) => {
    await page.goto("/browse/clay");
    await page.getByText(TITLE).first().click();
    await expect(page).toHaveURL(/\/work\//);
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(page.getByText("Wood-fired stoneware")).toBeVisible();
    await expect(page.getByText("2.8 cm h").or(page.getByText("28 cm h"))).toBeVisible();

    // Three images are present, each is served at its own proportion, and each actually
    // returns bytes. The first run of this journey rendered two broken images because the
    // surface asked for a width that is never generated for an image narrower than it.
    const shots = page.locator(".imgstrip img");
    await expect(shots).toHaveCount(3);
    for (const src of await shots.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src))) {
      const res = await page.request.get(src);
      expect(res.status(), `${src} did not return an image`).toBe(200);
      expect((await res.body()).length, `${src} returned an empty body`).toBeGreaterThan(1000);
    }
    const decoded = await shots.evaluateAll((els) =>
      els.map((e) => ({ w: (e as HTMLImageElement).naturalWidth, h: (e as HTMLImageElement).naturalHeight })));
    expect(decoded.every((d) => d.w > 0 && d.h > 0), "an image failed to decode").toBe(true);
    expect(decoded.map((d) => Number((d.w / d.h).toFixed(2)))).toEqual([0.75, 1.5, 1]);

    await page.getByRole("link", { name: /View the gallery/ }).click();
    await expect(page).toHaveURL(/\/m\/anika-rao/);
    await expect(page.getByRole("heading", { name: "Anika Rao" })).toBeVisible();
    await expect(page.getByText("I fire in a wood kiln")).toBeVisible();
  });

  test("the visitor sees the disclosure and the maker's own routes", async ({ page }) => {
    const token = (await owner((c) => c.query<{ public_token: string }>(
      "SELECT public_token FROM works WHERE title = $1", [TITLE]))).rows[0].public_token;
    await page.goto(`/work/${token}`);
    await page.getByRole("link", { name: /Contact Anika/ }).click();

    await expect(page.getByText("You are contacting the maker directly")).toBeVisible();
    await expect(page.getByText("The Gallery does not process the transaction")).toBeVisible();

    const whatsapp = page.locator('a[data-route-kind="whatsapp"]');
    await expect(whatsapp).toHaveAttribute("href", new RegExp(`wa\\.me/${ROUTE_WHATSAPP.replace("+", "")}`));
    await expect(whatsapp).toHaveAttribute("href", /text=/);

    const email = page.locator('a[data-route-kind="email"]');
    await expect(email).toHaveAttribute("href", new RegExp(`^mailto:${ROUTE_EMAIL}\\?subject=`));

    // The private account email is nowhere in the payload of the surface that offers contact.
    expect(await page.content()).not.toContain(MAKER_A.email);
  });
});
