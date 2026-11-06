import { test, expect } from "@playwright/test";
import { owner, signIn, MAKER_A, MAKER_B } from "./helpers";

// Wave 1 — trust and access. Each act here is one a maker or visitor must be able to rely on:
// a refusal keeps what they typed, a destructive act names its consequence first, a success
// notice appears only when the change happened, and contact carries what the visitor meant.
//
// Runs after 04, which leaves Maker B's "Unfinished Warp" retired with one ready image and one
// failed one. This walk restores it, so it ends published, as 04 left it before retiring.
test.describe.configure({ mode: "serial" });

const WORK = "Unfinished Warp";
const MONSOON = "Monsoon Vessel No. 4";

async function warp() {
  const r = await owner((c) => c.query<{ id: string; public_token: string; lifecycle: string }>(
    "SELECT id, public_token, lifecycle FROM works WHERE title = $1", [WORK]));
  return r.rows[0];
}

test.describe("trust and access", () => {
  test("sign-in never sends a maker to another site", async ({ page }) => {
    for (const next of ["//evil.example/studio", "/\\evil.example"]) {
      await page.goto(`/makers/sign-in?next=${encodeURIComponent(next)}`);
      await page.getByLabel("Email").fill(MAKER_B.email);
      await page.getByLabel("Password").fill(MAKER_B.password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL((u) => !u.pathname.includes("/sign-in"), { timeout: 15_000 });
      const landed = new URL(page.url());
      expect(landed.origin).toBe(new URL(process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100").origin);
      expect(landed.pathname).toBe("/studio");
      await page.context().clearCookies();
    }
  });

  test("a refused identity save keeps everything the maker typed", async ({ page }) => {
    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto("/studio/profile");
    const before = await owner((c) => c.query<{ city: string; handle: string }>(
      "SELECT city, handle FROM makers WHERE handle = 'dhaaga-studio'"));

    await page.getByLabel("Gallery address").fill("anika-rao");          // taken by Maker A
    await page.getByLabel("City").fill("Kept-City Probe");
    await page.getByLabel("How you work").selectOption("studio");
    const box = page.locator("#commissions_open");
    const wasTicked = await box.isChecked();
    await box.setChecked(!wasTicked);
    await page.getByRole("button", { name: "Save" }).click();

    // The refusal sits under the field it is about, and nothing typed is lost.
    await expect(page.locator("#handle-err")).toContainText("taken");
    await expect(page.getByLabel("Gallery address")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("City")).toHaveValue("Kept-City Probe");
    await expect(page.getByLabel("How you work")).toHaveValue("studio");
    expect(await box.isChecked()).toBe(!wasTicked);

    const after = await owner((c) => c.query<{ city: string; handle: string }>(
      "SELECT city, handle FROM makers WHERE handle = 'dhaaga-studio'"));
    expect(after.rows).toEqual(before.rows);                             // nothing was written
  });

  test("a retired work comes back exactly, and only a real restore says so", async ({ page }) => {
    const w = await warp();
    expect(w.lifecycle).toBe("retired");
    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto(`/studio/works/${w.id}`);
    await expect(page.getByText("Retired work")).toBeVisible();           // not mislabelled as a draft

    await page.getByRole("button", { name: "Restore to view" }).click();
    await expect(page.getByText("This work is on view again")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Published work")).toBeVisible();
    expect((await warp()).lifecycle).toBe("published");

    const anon = await page.context().browser()!.newContext();
    const visitor = await anon.newPage();
    await visitor.goto(`/work/${w.public_token}`);
    await expect(visitor.getByRole("heading", { name: WORK })).toBeVisible();
    await anon.close();
  });

  test("removing an image is confirmed first, and a published work keeps its last image", async ({ page }) => {
    const w = await warp();
    const imgs = await owner((c) => c.query<{ id: string; state: string }>(
      "SELECT id, state FROM work_images WHERE work_id = $1 ORDER BY position", [w.id]));
    const ready = imgs.rows.filter((r) => r.state === "ready");
    const failed = imgs.rows.find((r) => r.state === "failed");
    expect(ready).toHaveLength(1);
    expect(failed).toBeTruthy();

    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto(`/studio/works/${w.id}`);

    // The failed image: one tap only opens the confirm, which names the consequence.
    await page.goto(`/studio/works/${w.id}?confirm=remove-${failed!.id}`);
    await expect(page.getByText("This cannot be undone")).toBeVisible();
    expect(await owner((c) => c.query("SELECT 1 FROM work_images WHERE id = $1", [failed!.id])))
      .toMatchObject({ rowCount: 1 });                                    // still there until confirmed
    await page.getByRole("button", { name: /^Remove image/ }).click();
    await expect(page.getByText("The image is removed")).toBeVisible({ timeout: 15_000 });

    // The last ready image of a published work is kept, whatever is pressed.
    await page.goto(`/studio/works/${w.id}?confirm=remove-${ready[0].id}`);
    await page.getByRole("button", { name: /^Remove image/ }).click();
    await expect(page.getByText("A published work keeps at least one image")).toBeVisible({ timeout: 15_000 });
    expect(await owner((c) => c.query("SELECT 1 FROM work_images WHERE id = $1", [ready[0].id])))
      .toMatchObject({ rowCount: 1 });
  });

  test("a label can be corrected after it was saved", async ({ page }) => {
    const w = await warp();
    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto(`/studio/works/${w.id}`);
    await page.getByLabel("Medium").fill("Handloom cotton, corrected");
    await page.getByRole("button", { name: "Save label" }).click();
    await expect(page.getByTestId("form-notice")).toContainText("The label is updated");
    const r = await owner((c) => c.query<{ medium: string }>("SELECT medium FROM works WHERE id = $1", [w.id]));
    expect(r.rows[0].medium).toBe("Handloom cotton, corrected");
  });

  test("removing the only live route warns that Contact disappears, then does it", async ({ page }) => {
    await owner((c) => c.query(
      "DELETE FROM contact_routes WHERE maker_id IN (SELECT id FROM makers WHERE handle = 'dhaaga-studio')"));
    await signIn(page, MAKER_B.email, MAKER_B.password);

    // With no route, the Studio itself shows the task (GAL-PR-01), not only the routes page.
    await page.goto("/studio");
    await expect(page.getByRole("link", { name: "Add a contact route" })).toBeVisible();

    await page.goto("/studio/contact-routes");
    await page.getByLabel("Kind").selectOption("website");
    await page.getByLabel("The route").fill("https://dhaaga.example");
    await page.getByRole("button", { name: "Add route" }).click();
    await expect(page.locator("ul.rowlist li")).toHaveCount(1);

    await page.getByRole("link", { name: "Remove Website route" }).click();
    await expect(page.getByText("This is your only live route")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove Website" })).toHaveClass(/alarm/);
    await page.getByRole("button", { name: "Remove Website" }).click();
    await expect(page.getByText("The route is removed")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("ul.rowlist li")).toHaveCount(0);
  });

  test("the visitor's choice of intent changes the message the maker receives", async ({ page }) => {
    const t = await owner((c) => c.query<{ public_token: string }>(
      "SELECT public_token FROM works WHERE title = $1", [MONSOON]));
    const here = `/work/${t.rows[0].public_token}`;
    for (const [intent, phrase] of [
      ["ask", "would like to ask about it"],
      ["commission", "commissioning something like it"],
      ["general", "while looking at"],
    ] as const) {
      await page.goto(`${here}?contact=1&intent=${intent}`);
      await expect(page.locator(`[data-intent="${intent}"]`)).toHaveAttribute("aria-current", "true");
      const href = decodeURIComponent(
        (await page.locator('a[data-route-kind="whatsapp"]').getAttribute("href")) ?? "");
      expect(href).toContain(phrase);
      expect(href).toContain(MONSOON);
      expect(href).toContain(here);                       // the link back to the work travels with it
    }
    // The account email is never part of what the visitor hands over.
    expect(await page.content()).not.toContain(MAKER_A.email);
  });
});
