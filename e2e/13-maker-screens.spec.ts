import { test, expect, type Page } from "@playwright/test";
import { join } from "node:path";
import { forgetPerson, linkFromOutbox, owner, signIn } from "./helpers";

// Drawing board, part 3 (governor, 2026-11-09): the maker's screens 7–14, and "Show" (2026-11-10).
// One new maker walks them in order. Each test fails if its change is taken away:
//  - For makers: pictures first, then three lines, one docked solid action and a way to sign in;
//  - joining: step 2 asks name, place and how you work, and makes the address from the name;
//  - step 3: WhatsApp, checked, saved as a public way to contact, and skippable;
//  - the Studio: the gallery as a grid, Add a work first, one task until it is done;
//  - Add a work: photos first, choices as taps, Publish docked; Save draft keeps it in the Studio;
//  - Settings: one list, each row opening where that thing is changed;
//  - the Message sheet shows the address under Email.
test.describe.configure({ mode: "serial" });

const NEW = { email: "meera.das@makers.example", password: "glaze-and-ember-12" };
const NAME = "Anika Rao";               // the name of a seeded maker: the address must not collide
const WORK = "Salt Study No. 1";
const PUBLIC_EMAIL = "studio@meeradas.example";
const narrow = (page: Page) => page.viewportSize()!.width < 900;

/** The docked action sits at the very foot of a phone screen. */
async function docked(page: Page, name: string) {
  const btn = page.locator(".workbar.dock").getByRole(/^Open/.test(name) ? "link" : "button", { name });
  await expect(btn).toBeVisible();
  await page.mouse.move(1, 1);   // a tap that opened this page leaves the pointer where the button now is (hover)
  await expect(btn).toHaveCSS("background-color", "rgb(34, 30, 26)");   // solid ink (retried: it eases in over 160 ms)
  if (!narrow(page)) return;
  const bar = (await page.locator(".workbar.dock").boundingBox())!;
  expect(Math.round(bar.y + bar.height)).toBe(page.viewportSize()!.height);
  await expect(page.locator("nav.bar")).toHaveCount(0);
}

test.beforeAll(async () => { await forgetPerson(NEW.email); });
test.afterAll(async () => { await forgetPerson(NEW.email); });

test("For makers: pictures first, three lines, one docked action and a way to sign in", async ({ page }) => {
  await page.goto("/makers");
  const pictures = page.getByTestId("fm-pictures");
  const heading = page.getByRole("heading", { level: 1, name: "A gallery of your own." });
  await expect(heading).toBeVisible();
  expect((await pictures.boundingBox())!.y).toBeLessThan((await heading.boundingBox())!.y);
  // The pictures are works on view, never a stand-in: as many as there are, up to three; the
  // rest of the slots are the empty plinth.
  const onView = (await owner((c) => c.query<{ n: number }>(
    `SELECT count(DISTINCT w.id)::int AS n FROM public_works w JOIN public_work_images i ON i.work_id = w.id`))).rows[0].n;
  await expect(pictures.locator("img")).toHaveCount(Math.min(3, onView));
  await expect(pictures.getByTestId("plinth-slot")).toHaveCount(3 - Math.min(3, onView));
  // The numbered steps are gone, and with them the text that looked like a button.
  await expect(page.getByText("Make an account")).toHaveCount(0);
  await docked(page, "Open your gallery");
  await page.getByRole("link", { name: "I already have a gallery" }).click();
  await expect(page).toHaveURL(/\/makers\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await docked(page, "Sign in");
});

test("joining, step 2: name, place and how you work; the address is made from the name", async ({ page }) => {
  await page.goto("/makers/create-account");
  await docked(page, "Continue");
  await page.getByLabel("Email").fill(NEW.email);
  await page.getByLabel("Password").fill(NEW.password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.goto(await linkFromOutbox(NEW.email, "/makers/confirm/"));
  await expect(page.getByRole("heading", { name: "Your name and place" })).toBeVisible();
  await docked(page, "Continue");

  // How you work is the self-declaration made at gallery creation (GAL-OD-02/03): a choice, said plainly.
  const kinds = page.getByRole("group", { name: "How you work" }).getByRole("radio");
  await expect(kinds).toHaveCount(3);
  await expect(page.getByText("Show only work you made or had a real hand in making. Not resale.")).toBeVisible();

  // A refusal names its field and keeps what was typed.
  await page.getByLabel("Name").fill(NAME);
  await page.getByRole("radio", { name: "A collective" }).check();
  await page.getByLabel("Place").fill("   ");          // passes the browser's check; the server refuses it
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#city-err")).toContainText("town or city");
  await expect(page.getByLabel("Name")).toHaveValue(NAME);
  await expect(page.getByRole("radio", { name: "A collective" })).toBeChecked();

  await page.getByLabel("Place").fill("Kochi");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 3 of 3")).toBeVisible();
  const made = (await owner((c) => c.query<{ handle: string; kind: string; city: string }>(
    `SELECT m.handle, m.kind, m.city FROM makers m JOIN auth.users u ON u.id = m.user_id
      WHERE lower(u.email) = lower($1)`, [NEW.email]))).rows[0];
  // "anika-rao" belongs to the seeded maker: the new gallery takes the next free address.
  expect(made).toEqual({ handle: "anika-rao-2", kind: "collective", city: "Kochi" });
});

test("joining, step 3: WhatsApp is checked, can wait, and the Studio keeps it as one task until done", async ({ page }) => {
  await signIn(page, NEW.email, NEW.password);
  await page.goto("/studio/whatsapp?join=1");
  await expect(page.getByText("Shown to visitors.")).toBeVisible();   // seen as public before it is saved (GAL-P1)
  await page.getByRole("link", { name: "Skip for now" }).click();
  const task = page.getByTestId("task");
  await expect(task).toHaveText("Add WhatsApp so visitors can message you");
  await expect(page.getByTestId("task")).toHaveCount(1);
  await task.click();

  await page.getByLabel("WhatsApp number").fill("98765 43210");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#value-err")).toContainText("country code");
  await page.getByLabel("WhatsApp number").fill("+999 7000 00042");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Visitors can now message you on WhatsApp.")).toBeVisible();
  await expect(page.getByTestId("task")).toHaveCount(0);
  const routes = (await owner((c) => c.query<{ kind: string; enabled: boolean }>(
    `SELECT r.kind, r.enabled FROM contact_routes r JOIN makers m ON m.id = r.maker_id WHERE m.handle = 'anika-rao-2'`))).rows;
  expect(routes).toEqual([{ kind: "whatsapp", enabled: true }]);
});

test("the Studio is the gallery as a grid, Add a work first", async ({ page }) => {
  await signIn(page, NEW.email, NEW.password);
  await page.goto("/studio");
  await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
  await expect(page.getByText("/m/anika-rao-2")).toBeVisible();
  const cells = page.getByRole("list", { name: "Your works" }).getByRole("listitem");
  await expect(cells).toHaveCount(1);
  await expect(cells.first().getByRole("link", { name: "Add a work" })).toBeVisible();
  // A grid, not a list: from a phone up, two or more works sit side by side.
  const cols = await page.getByRole("list", { name: "Your works" }).evaluate((l) =>
    getComputedStyle(l).gridTemplateColumns.split(" ").length);
  expect(cols).toBeGreaterThanOrEqual(2);
  if (narrow(page)) await expect(page.locator("nav.bar")).toBeVisible();
});

test("Add a work: photos first, choices as taps; Publish needs a photo; Save draft keeps it in the Studio", async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page, NEW.email, NEW.password);
  await page.goto("/studio/works/new");
  await docked(page, "Publish");
  await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
  const top = (sel: string) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().top);
  expect(await top("#image")).toBeLessThan(await top("#title"));
  for (const group of ["Material", "Status", "Price"]) {
    await expect(page.getByRole("group", { name: group }).getByRole("radio").first()).toBeAttached();
  }
  // Size and words come after the taps.
  expect(await top('[data-testid="price_mode-exact"]')).toBeLessThan(await top("#medium"));

  // Publish without a photograph is refused, and nothing is created.
  await page.getByLabel("Title").fill(WORK);
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("form-error")).toContainText("Add a photo to publish");
  const none = await owner((c) => c.query("SELECT 1 FROM works WHERE title = $1", [WORK]));
  expect(none.rowCount).toBe(0);

  // Save draft from the header keeps it in the Studio, unpublished.
  await page.getByLabel("Title").fill(`${WORK} (draft)`);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("The label is saved")).toBeVisible({ timeout: 20_000 });
  const draft = (await owner((c) => c.query<{ lifecycle: string }>("SELECT lifecycle FROM works WHERE title = $1", [`${WORK} (draft)`]))).rows;
  expect(draft).toEqual([{ lifecycle: "draft" }]);

  // A photo and a title, then Publish: on view in one go.
  await page.goto("/studio/works/new");
  await page.getByLabel("Add photo").setInputFiles(join(process.cwd(), "e2e/fixtures/square-1x1.jpg"));
  await expect(page.locator(".photo-tiles .thumb img")).toBeVisible();
  await page.getByLabel("Title").fill(WORK);
  await page.getByRole("radio", { name: "Clay" }).check();
  await page.getByRole("radio", { name: "Not for sale" }).check();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("It is on view.")).toBeVisible({ timeout: 45_000 });
  const pub = (await owner((c) => c.query<{ lifecycle: string; status: string }>(
    "SELECT lifecycle, status FROM works WHERE title = $1", [WORK]))).rows;
  expect(pub).toEqual([{ lifecycle: "published", status: "on_view" }]);

  await page.goto("/studio");
  const cells = page.getByRole("list", { name: "Your works" }).getByRole("listitem");
  await expect(cells).toHaveCount(3);
  await expect(cells.first().getByRole("link", { name: "Add a work" })).toBeVisible();
  await expect(cells.filter({ has: page.getByText(`${WORK} (draft)`, { exact: true }) }).locator(".flag")).toHaveText("Draft");
  await expect(cells.filter({ has: page.getByText(WORK, { exact: true }) }).locator(".flag")).toHaveText("On view");
});

test("Settings is one list; each row opens where that thing is changed", async ({ page }) => {
  await signIn(page, NEW.email, NEW.password);
  await page.goto("/studio");
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Place\s*Kochi/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^WhatsApp\s*On/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Email for visitors\s*Off/ })).toBeVisible();
  // The sign-in email is shown, never offered as something it is not.
  await expect(page.getByText(NEW.email)).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(NEW.email.replace(/\./g, "\\.")) })).toHaveCount(0);

  await page.getByRole("link", { name: /^Place/ }).click();
  await expect(page).toHaveURL(/\/studio\/profile#city$/);
  await page.goBack();
  await page.getByRole("link", { name: /^Password/ }).click();
  await expect(page).toHaveURL(/\/makers\/reset\?e=/);
  await expect(page.getByLabel("Email")).toHaveValue(NEW.email);
});

test("the Message sheet shows the address under Email ('Show')", async ({ page, browser }) => {
  await signIn(page, NEW.email, NEW.password);
  await page.goto("/studio/contact-routes");
  await page.getByLabel("Way to contact").selectOption("email");
  await page.getByLabel("Number or address").fill(PUBLIC_EMAIL);
  await page.getByRole("button", { name: "Add this way to contact you" }).click();
  await expect(page.getByTestId("form-notice")).toBeVisible();

  const anon = await browser.newContext({ baseURL: process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100" });
  const visitor = await anon.newPage();
  await visitor.goto("/m/anika-rao-2?contact=1");
  const row = visitor.getByRole("dialog").locator('a[data-route-kind="email"]');
  await expect(row.getByTestId("route-email")).toHaveText(PUBLIC_EMAIL);
  await expect(row).toContainText("Email");
  await anon.close();
});
