import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { owner, signIn, MAKER_B } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("failure endings", () => {
  // This walk owns its own draft, so it proves the endings rather than inheriting a state
  // another spec happened to leave behind.
  const DRAFT = "Unfinished Warp";

  test.beforeAll(async () => {
    await owner((c) => c.query("DELETE FROM works WHERE title = $1", [DRAFT]));
  });

  test("the maker starts a draft", async ({ page }) => {
    await signIn(page, MAKER_B.email, MAKER_B.password);
    await page.goto("/studio/works/new");
    await page.getByLabel("Title").fill(DRAFT);
    await page.getByLabel("Material").selectOption("textile");
    await page.getByLabel("Price", { exact: true }).selectOption("enquire");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("The label is saved")).toBeVisible();
  });

  test("a file that is not an image fails alone and says what to do", async ({ page }) => {
    await signIn(page, MAKER_B.email, MAKER_B.password);
    const work = await owner((c) => c.query<{ id: string }>(
      "SELECT id FROM works WHERE title = 'Unfinished Warp'"));
    await page.goto(`/studio/works/${work.rows[0].id}`);

    await page.getByLabel("Image file").setInputFiles({
      name: "not-an-image.txt", mimeType: "text/plain", buffer: Buffer.from("this is not a photograph"),
    });
    await page.getByRole("button", { name: "Add image" }).click();
    await expect(page.getByTestId("form-error")).toContainText("did not go up");
    await expect(page.getByTestId("form-error")).toContainText("try again");

    // The failure is visible as itself, and the work is intact behind it.
    await page.goto(`/studio/works/${work.rows[0].id}`);
    await expect(page.getByText("An image did not go up")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unfinished Warp" })).toBeVisible();

    const rows = await owner((c) => c.query<{ state: string }>(
      "SELECT state FROM work_images WHERE work_id = $1", [work.rows[0].id]));
    expect(rows.rows.map((r) => r.state)).toContain("failed");
  });

  test("an interrupted publish leaves the work whole and publishable", async ({ page }) => {
    await signIn(page, MAKER_B.email, MAKER_B.password);
    const work = await owner((c) => c.query<{ id: string }>(
      "SELECT id FROM works WHERE title = 'Unfinished Warp'"));
    const url = `/studio/works/${work.rows[0].id}`;

    // Publishing with no ready image is refused, and refused in a way that keeps the work.
    await page.goto(url);
    await expect(page.getByTestId("publish")).toBeDisabled();

    // Add a real image, then abandon the page mid-way (a closed tab, a lost signal) and come
    // back: the draft, its label and its images are all still there.
    await page.getByLabel("Image file").setInputFiles(join(process.cwd(), "e2e/fixtures/square-1x1.jpg"));
    await page.getByRole("button", { name: "Add image" }).click();
    await expect(page.getByTestId("form-notice")).toContainText("Image added");
    await page.goto("/");            // walk away mid-journey
    await page.goto(url);            // and come back

    await expect(page.getByRole("heading", { name: "Unfinished Warp" })).toBeVisible();
    await expect(page.getByTestId("publish")).toBeEnabled();
    await page.getByTestId("publish").click();
    await expect(page.getByText("Published work")).toBeVisible();
  });

  test("a retired work keeps its URL and ends truthfully", async ({ page }) => {
    await signIn(page, MAKER_B.email, MAKER_B.password);
    const work = await owner((c) => c.query<{ id: string; public_token: string }>(
      "SELECT id, public_token FROM works WHERE title = 'Unfinished Warp'"));
    await page.goto(`/studio/works/${work.rows[0].id}`);
    await page.getByRole("button", { name: "Take this work off view" }).click();

    const anon = await page.context().browser()!.newContext();
    const visitor = await anon.newPage();
    await visitor.goto(`/work/${work.rows[0].public_token}`);
    await expect(visitor.getByText("This work is no longer shown")).toBeVisible();
    await expect(visitor.getByRole("link", { name: /Visit Dhaaga Studio/ })).toBeVisible();
    await visitor.goto("/browse/textile");
    expect(await visitor.content()).not.toContain("Unfinished Warp");
    await anon.close();
  });
});

test.describe("boundaries the product must not cross", () => {
  const SOURCE_DIRS = ["src", "db", "e2e"];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (name === "node_modules" || name === "fixtures") continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx|sql|css)$/.test(name)) files.push(p);
    }
  };
  for (const d of SOURCE_DIRS) walk(join(process.cwd(), d));

  test("no marketplace concept appears in routes, schema, copy or navigation", async () => {
    // The words used as PRODUCT CONCEPTS — an identifier, a route segment, a column.
    //
    // A sweep that flagged every occurrence would flag the copy that refuses the concept
    // ("no cart, no checkout") and the SQL guard that forbids such a table from existing.
    // That is the over-anchoring mistake the Doctrine ledger records at GAL-L0009: an
    // instrument that punishes naming the thing you refuse teaches you to stop writing the
    // refusal down. So a line that negates or forbids the concept is exempt, and the exemption
    // is narrow enough that an actual cart could not hide behind it.
    const banned = /\b(addToCart|add_to_cart|cartItem|cart_id|checkoutSession|orderTotal|order_id|payment_intent|paymentMethod|shipping_address|refund_id|escrowAccount)\b/;
    const refuses = /\b(no |not |never|refus|forbid|absent|~ '\()/i;
    const hits: string[] = [];
    for (const f of files) {
      if (f.endsWith("04-endings-and-boundaries.spec.ts")) continue;   // the sweep's own pattern
      const text = readFileSync(f, "utf8");
      for (const [i, line] of text.split("\n").entries()) {
        if (banned.test(line) && !refuses.test(line)) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 90)}`);
      }
    }
    expect(hits, hits.join("\n")).toHaveLength(0);
  });

  test("the marketplace sweep is not vacuous: it catches a planted concept", async () => {
    // Anti-vacuous. If the pattern or the exemption ever stops working, this fails first.
    const banned = /\b(addToCart|add_to_cart|cartItem|cart_id|checkoutSession|orderTotal|order_id|payment_intent|paymentMethod|shipping_address|refund_id|escrowAccount)\b/;
    const refuses = /\b(no |not |never|refus|forbid|absent|~ '\()/i;
    const planted = "const orderTotal = items.reduce(sum);";
    expect(banned.test(planted) && !refuses.test(planted)).toBe(true);
    expect(refuses.test("There is no cart, no checkout and no payment here.")).toBe(true);
  });

  test("no engagement or verification claim appears in the copy a person actually reads",
    async ({ page }) => {
      // Swept over RENDERED text, not source lines. A source sweep splits a wrapped sentence
      // and reads "claim to have verified you" as a claim when the "we do not" that governs it
      // sits on the line above. What matters is the sentence a person reads, so the sweep reads
      // sentences from the served pages.
      const banned = /\b(verified|vetted|certified|authentic|guaranteed|trusted seller|followers|likes|trending|most popular)\b/i;
      const negated = /\b(no|not|never|nobody|nothing|neither|without|refus\w*|forbid\w*|does not|do not)\b/i;
      const urls = ["/", "/about", "/participation", "/privacy", "/makers", "/m/anika-rao", "/workshops"];
      const hits: string[] = [];
      for (const url of urls) {
        await page.goto(url);
        const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          if (banned.test(sentence) && !negated.test(sentence)) hits.push(`${url}: ${sentence.slice(0, 120)}`);
        }
      }
      expect(hits, hits.join("\n")).toHaveLength(0);
    });

  test("the claim sweep is not vacuous: it catches a planted claim", async () => {
    const banned = /\b(verified|vetted|certified|authentic|guaranteed|trusted seller|followers|likes|trending|most popular)\b/i;
    const negated = /\b(no|not|never|nobody|nothing|neither|without|refus\w*|forbid\w*|does not|do not)\b/i;
    const planted = "Every maker here is a verified seller.";
    expect(banned.test(planted) && !negated.test(planted)).toBe(true);
    const refusal = "We do not claim to have verified anyone.";
    expect(banned.test(refusal) && negated.test(refusal)).toBe(true);
  });

  test("the served navigation offers only the four accepted sections", async ({ page }) => {
    await page.goto("/");
    const labels = await page.locator("nav.bar a").allTextContents();
    expect(labels).toEqual(["Browse", "Saved", "Workshops", "For Makers"]);
  });

  test("no real contact value is committed in fixtures or seeds", async () => {
    const suspicious = /@(gmail|yahoo|hotmail|outlook|icloud|proton)\.com|\+91[0-9]{10}/i;
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      for (const [i, line] of text.split("\n").entries()) {
        if (suspicious.test(line)) hits.push(`${f}:${i + 1}`);
      }
    }
    expect(hits, hits.join("\n")).toHaveLength(0);
  });
});
