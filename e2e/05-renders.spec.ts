import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { owner, signIn, MAKER_A, OPERATOR } from "./helpers";

// Phone-width renders of the implemented surfaces, kept as evidence beside the accepted
// reference set so the two can be compared by eye (Audit Protocol L-A24). These are
// screenshots of the RUNNING product, not mockups.
const OUT = join(process.cwd(), "var", "renders");
mkdirSync(OUT, { recursive: true });

// Two captures per surface. The viewport shot is what a person actually sees on a phone; the
// full-page shot shows the whole surface but renders the fixed bottom bar at its viewport
// position, so it must not be read as the bar sitting in the middle of the page.
const shot = async (page: import("@playwright/test").Page, name: string) => {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  await page.screenshot({ path: join(OUT, `${name}-full.png`), fullPage: true });
};

test.describe.configure({ mode: "serial" });

test("public surfaces at phone width", async ({ page }) => {
  const token = (await owner((c) => c.query<{ public_token: string }>(
    "SELECT public_token FROM works WHERE title = 'Monsoon Vessel No. 4'"))).rows[0].public_token;

  await page.goto("/");                       await shot(page, "S1-entrance");
  await page.goto("/browse/clay");            await shot(page, "S2-browse-clay");
  await page.goto("/search?q=Monsoon");       await shot(page, "S3-search");
  await page.goto(`/work/${token}`);          await shot(page, "S4-work-detail");
  await page.goto(`/work/${token}?contact=1`); await shot(page, "S5-handoff");
  await page.goto("/m/anika-rao");            await shot(page, "S6-maker-gallery");
  await page.goto("/makers");                 await shot(page, "S7-maker-door");
  await page.goto("/participation");          await shot(page, "S8-participation");
});

test("studio surfaces at phone width", async ({ page }) => {
  await signIn(page, MAKER_A.email, MAKER_A.password);
  await page.goto("/studio");                 await shot(page, "S9-studio");
  await page.goto("/studio/profile");         await shot(page, "S10-studio-identity");
  await page.goto("/studio/contact-routes");  await shot(page, "S11-studio-routes");
  await page.goto("/studio/works/new");       await shot(page, "S12-studio-add-work");
  const work = await owner((c) => c.query<{ id: string }>(
    "SELECT id FROM works WHERE title = 'Monsoon Vessel No. 4'"));
  await page.goto(`/studio/works/${work.rows[0].id}`); await shot(page, "S13-studio-work");
  await page.goto("/studio/account");         await shot(page, "S14-studio-account");
});

test("operator surfaces at phone width", async ({ page }) => {
  await signIn(page, OPERATOR.email, OPERATOR.password);
  await page.goto("/operator");               await shot(page, "S15-operator");
  const maker = await owner((c) => c.query<{ id: string }>(
    "SELECT id FROM makers WHERE handle = 'anika-rao'"));
  await page.goto(`/operator/makers/${maker.rows[0].id}`); await shot(page, "S16-operator-maker");
});
