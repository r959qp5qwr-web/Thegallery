import { test, expect } from "@playwright/test";
import { owner, signIn, MAKER_A, MAKER_B, OPERATOR } from "./helpers";

// J-003 (status propagates), J-004 (operator acts and undoes it), the isolation and privacy
// promises, and the closure ending.
test.describe.configure({ mode: "serial" });

const TITLE = "Monsoon Vessel No. 4";
const surfaces = async () => {
  const t = await owner((c) => c.query<{ public_token: string }>(
    "SELECT public_token FROM works WHERE title = $1", [TITLE]));
  return { token: t.rows[0].public_token };
};

test.describe("status, authority and privacy", () => {
  test("available to sold reaches every surface that shows the work", async ({ page }) => {
    const { token } = await surfaces();
    const work = await owner((c) => c.query<{ id: string }>("SELECT id FROM works WHERE title = $1", [TITLE]));

    // Before: the entrance, the material page, search, the detail and the maker's gallery all
    // say Available. Recording the "before" is what makes the "after" mean something.
    for (const url of ["/", "/browse/clay", "/search?q=Monsoon", `/work/${token}`, "/m/anika-rao"]) {
      await page.goto(url);
      await expect(page.getByText("Available").first()).toBeVisible();
    }

    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto(`/studio/works/${work.rows[0].id}`);
    await page.getByLabel("This work is").selectOption("sold");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByText("Sold").first()).toBeVisible();

    for (const url of ["/", "/browse/clay", "/search?q=Monsoon", `/work/${token}`, "/m/anika-rao"]) {
      await page.goto(url);
      await expect(page.getByText("Sold").first()).toBeVisible();
      await expect(page.getByText("Available")).toHaveCount(0);
    }

    // The saved shelf reads the same view, so a saved reference follows too.
    const shelf = await page.request.get(`/api/saved?tokens=${token}`);
    expect((await shelf.json()).rows[0].status).toBe("sold");
  });

  test("an operator suspends a maker with a reason, and every public surface loses the work", async ({ page }) => {
    const { token } = await surfaces();
    await signIn(page, OPERATOR.email, OPERATOR.password);
    await page.goto("/operator");
    await expect(page.getByRole("heading", { name: "Makers" })).toBeVisible();
    await page.getByText("Anika Rao").click();

    await page.getByLabel("Reason").fill("Reported for impersonation; withheld while it is checked.");
    await page.getByRole("button", { name: "Suspend this maker" }).click();
    await expect(page.getByTestId("form-notice")).toContainText("Suspended");

    // Anonymous: the work, the gallery and the image are all gone, each with a truthful ending.
    const anon = await page.context().browser()!.newContext();
    const visitor = await anon.newPage();
    await visitor.goto("/");
    await expect(visitor.getByText(TITLE)).toHaveCount(0);
    await visitor.goto(`/work/${token}`);
    await expect(visitor.getByText("This gallery is not available")).toBeVisible();
    await visitor.goto("/m/anika-rao");
    await expect(visitor.getByRole("heading", { name: "This gallery is not available" })).toBeVisible();
    await visitor.goto("/search?q=Monsoon");
    await expect(visitor.getByText("Nothing found")).toBeVisible();

    // The pixels are gone too: an image URL that worked a moment ago now 404s for a stranger.
    const img = await owner((c) => c.query<{ id: string }>(
      `SELECT i.id FROM work_images i JOIN works w ON w.id = i.work_id WHERE w.title = $1 LIMIT 1`, [TITLE]));
    const res = await visitor.request.get(`/img/${img.rows[0].id}/w640`, { failOnStatusCode: false });
    expect(res.status()).toBe(404);
    await anon.close();
  });

  test("the suspended maker's Studio states the suspension and its reason", async ({ page }) => {
    await signIn(page, MAKER_A.email, MAKER_A.password);
    await page.goto("/studio");
    await expect(page.getByText("Your gallery is suspended")).toBeVisible();
    await expect(page.getByText("Reported for impersonation")).toBeVisible();
    await expect(page.getByText("read-only until the suspension is lifted")).toBeVisible();
  });

  test("reinstatement returns everything exactly as it was, and both acts are on the record",
    async ({ page }) => {
      const { token } = await surfaces();
      await signIn(page, OPERATOR.email, OPERATOR.password);
      const maker = await owner((c) => c.query<{ id: string }>(
        "SELECT id FROM makers WHERE handle = 'anika-rao'"));
      await page.goto(`/operator/makers/${maker.rows[0].id}`);
      await page.getByLabel("Reason").fill("Report dismissed; the work is the maker's own.");
      await page.getByRole("button", { name: "Reinstate this maker" }).click();
      await expect(page.getByTestId("form-notice")).toContainText("Reinstated");

      await page.goto(`/work/${token}`);
      await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
      await expect(page.getByText("Sold").first()).toBeVisible();   // status survived the sanction

      // The record is append-only and accumulates across runs by design, so this asserts the
      // two acts THIS walk performed — the most recent pair — rather than the whole table.
      // Asserting the table's total length would quietly demand that history be erasable.
      const record = await owner((c) => c.query<{ action: string; reason: string }>(
        `SELECT action, reason FROM operator_actions WHERE subject_type = 'maker'
          ORDER BY created_at DESC LIMIT 2`));
      expect(record.rows.map((r) => r.action)).toEqual(["reinstate", "suspend"]);
      expect(record.rows.every((r) => r.reason.trim().length > 10)).toBe(true);
      expect(record.rows[0].reason).toContain("Report dismissed");
      expect(record.rows[1].reason).toContain("impersonation");
    });

  test("Maker B cannot reach Maker A's work through the product's own doors", async ({ page }) => {
    const work = await owner((c) => c.query<{ id: string }>("SELECT id FROM works WHERE title = $1", [TITLE]));
    await signIn(page, MAKER_B.email, MAKER_B.password);

    // The Studio shows Maker B their own works and none of Maker A's.
    await page.goto("/studio");
    await expect(page.getByText(TITLE)).toHaveCount(0);

    // Reaching for Maker A's work by its id lands on not-found, not on someone else's work.
    const res = await page.goto(`/studio/works/${work.rows[0].id}`);
    expect(res?.status()).toBe(404);

    // The operator door says "not yours" rather than pretending Maker B is not signed in.
    await page.goto("/operator");
    await expect(page.getByRole("heading", { name: "This door is not yours" })).toBeVisible();
  });

  test("a draft work is absent from every anonymous response", async ({ page }) => {
    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto("/studio/works/new");
    await page.getByLabel("Title").fill("Unfinished Warp");
    await page.getByLabel("Material").selectOption("textile");
    await page.getByLabel("Price", { exact: true }).selectOption("enquire");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("The label is saved")).toBeVisible();

    const anon = await page.context().browser()!.newContext();
    const visitor = await anon.newPage();
    for (const url of ["/", "/browse/textile", "/search?q=Unfinished", "/m/dhaaga-studio"]) {
      await visitor.goto(url);
      expect(await visitor.content()).not.toContain("Unfinished Warp");
    }
    await anon.close();
  });

  test("no account email appears in any public page or payload", async ({ page }) => {
    const emails = await owner((c) => c.query<{ email: string }>("SELECT email FROM auth_accounts"));
    const { token } = await surfaces();
    const urls = ["/", "/browse/clay", "/search?q=Monsoon", `/work/${token}`, `/work/${token}?contact=1`,
                  "/m/anika-rao", "/saved", "/workshops", "/about", "/participation", "/privacy", "/makers"];
    for (const url of urls) {
      await page.goto(url);
      const body = await page.content();
      for (const { email } of emails.rows) {
        expect(body, `${email} leaked on ${url}`).not.toContain(email);
      }
    }
    // And through the JSON door as well, not only the rendered HTML.
    const api = await page.request.get(`/api/saved?tokens=${token}`);
    const text = await api.text();
    for (const { email } of emails.rows) expect(text).not.toContain(email);
  });

  test("closing an account has a stated consequence and carries it out", async ({ page }) => {
    // A third disposable maker, so the slice's own maker survives for inspection.
    const disposable = { email: "closing.soon@makers.example", password: "one-last-firing-4" };
    await owner((c) => c.query("DELETE FROM auth_accounts WHERE email_normalised = lower($1)",
      [disposable.email]));

    await page.goto("/makers/create-account");
    await page.getByLabel("Email").fill(disposable.email);
    await page.getByLabel("Password").fill(disposable.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    const link = await owner(async (c) => (await c.query<{ link: string }>(
      "SELECT link FROM dev_outbox WHERE to_email = $1 ORDER BY created_at DESC LIMIT 1",
      [disposable.email])).rows[0].link);
    await page.goto(link);
    await signIn(page, disposable.email, disposable.password);

    await page.goto("/studio/profile");
    await page.getByLabel("Name shown to visitors").fill("Closing Soon");
    await page.getByLabel("Gallery address").fill("closing-soon");
    await page.getByLabel("City").fill("Mysuru");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Your identity is saved")).toBeVisible();

    await page.goto("/studio/account");
    // The consequence is stated before the act, in specifics rather than a warning triangle.
    await expect(page.getByText("Closing is not a dead button")).toBeVisible();
    await expect(page.getByText("/m/closing-soon")).toBeVisible();

    // A mistyped confirmation changes nothing.
    await page.getByLabel("Type close to confirm").fill("yes");
    await page.getByRole("button", { name: "Close my account" }).click();
    await expect(page.getByTestId("form-error")).toContainText("Nothing has been changed");

    await page.getByLabel("Type close to confirm").fill("close");
    await page.getByRole("button", { name: "Close my account" }).click();
    await page.waitForURL(/closed=1/);

    // The consequence happened: signed out, cannot sign back in, gallery closed.
    await page.goto("/studio");
    await expect(page).toHaveURL(/sign-in/);
    await signIn(page, disposable.email, disposable.password, false);
    await expect(page.getByTestId("form-error")).toContainText("closed");
    await page.goto("/m/closing-soon");
    await expect(page.getByRole("heading", { name: "This gallery is not available" })).toBeVisible();

    const state = await owner((c) => c.query<{ access_state: string; status: string; lifecycle: string }>(
      `SELECT a.access_state, m.status, g.lifecycle FROM auth_accounts a
         JOIN makers m ON m.account_id = a.id JOIN galleries g ON g.maker_id = m.id
        WHERE a.email_normalised = lower($1)`, [disposable.email]));
    expect(state.rows[0]).toMatchObject({ access_state: "closed", status: "closed", lifecycle: "closed" });
  });
});
