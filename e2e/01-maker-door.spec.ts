import { test, expect } from "@playwright/test";
import { forgetPerson, linkFromOutbox, owner, signIn } from "./helpers";

// J-002, first half: the door. A person with an email address and nothing else.
const NEW = { email: "kavya.iyer@makers.example", password: "slipware-and-salt-3" };

test.describe("the maker door", () => {
  test.beforeAll(async () => {
    await forgetPerson(NEW.email);
  });

  test("open a gallery in three steps: account, name and place, WhatsApp; then sign out", async ({ page }) => {
    await page.goto("/makers");
    await page.getByRole("link", { name: "Open your gallery" }).click();
    await expect(page.getByRole("heading", { name: "Open your gallery" })).toBeVisible();
    await expect(page.getByText("Step 1 of 3")).toBeVisible();

    // The door says plainly that this address stays private.
    await expect(page.getByText("For signing in. Never shown.")).toBeVisible();

    await page.getByLabel("Email").fill(NEW.email);
    await page.getByLabel("Password").fill(NEW.password);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByText(NEW.email)).toBeVisible();

    // Signing in before confirming is refused, and says why.
    await signIn(page, NEW.email, NEW.password, false);
    await expect(page.getByTestId("form-error")).toContainText("has not been confirmed");

    // The link signs the maker in and brings them straight to step 2 (drawing board, screen 9).
    const link = await linkFromOutbox(NEW.email, "/makers/confirm/");
    await page.goto(link);
    await expect(page).toHaveURL(/\/studio\/join$/);
    await expect(page.getByRole("heading", { name: "Your name and place" })).toBeVisible();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();

    // A confirmation link is single use.
    const again = await page.context().newPage();
    await again.goto(link);
    await expect(again.getByRole("heading", { name: "That link has expired" })).toBeVisible();
    await again.close();

    // Step 2: name, place and how you work. The address is made from the name.
    await page.getByLabel("Name").fill("Kavya Iyer");
    await page.getByLabel("Place").fill("Mysuru");
    await page.getByRole("radio", { name: "A studio" }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    const made = await owner((c) => c.query<{ handle: string; kind: string; city: string }>(
      `SELECT m.handle, m.kind, m.city FROM makers m JOIN auth.users u ON u.id = m.user_id
        WHERE lower(u.email) = lower($1)`, [NEW.email]));
    expect(made.rows[0]).toEqual({ handle: "kavya-iyer", kind: "studio", city: "Mysuru" });

    // Step 3 can wait: a work can be published without a way to contact (GAL-OD-06).
    await page.getByRole("link", { name: "Skip for now" }).click();
    await expect(page).toHaveURL(/\/studio\?joined=1$/);
    await expect(page.getByRole("heading", { name: "Kavya Iyer" })).toBeVisible();
    await expect(page.getByTestId("task")).toHaveText("Add WhatsApp so visitors can message you");

    await page.goto("/studio/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/studio");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("a wrong password and an unknown address are refused in the same words", async ({ page }) => {
    await signIn(page, NEW.email, "not-the-password", false);
    const wrong = await page.getByTestId("form-error").textContent();
    await signIn(page, "nobody.at.all@makers.example", "not-the-password", false);
    const unknown = await page.getByTestId("form-error").textContent();
    expect(wrong).toBe(unknown);
    expect(wrong).toContain("do not match an account");
  });

  test("recovery answers the same way whether or not the account exists", async ({ page }) => {
    await page.goto("/makers/reset");
    await page.getByLabel("Email").fill("nobody.at.all@makers.example");
    await page.getByRole("button", { name: "Send link" }).click();
    const unknown = await page.getByTestId("form-notice").textContent();

    await page.goto("/makers/reset");
    await page.getByLabel("Email").fill(NEW.email);
    await page.getByRole("button", { name: "Send link" }).click();
    const known = await page.getByTestId("form-notice").textContent();
    expect(known).toBe(unknown);

    // The real account does get a usable link, and setting a password works.
    const link = await linkFromOutbox(NEW.email, "/makers/reset/");
    await page.goto(link);
    await page.getByLabel("New password").fill("re-fired-and-cooled-8");
    await page.getByRole("button", { name: "Set password" }).click();
    await expect(page.getByText("Your new password is in place")).toBeVisible();
    await signIn(page, NEW.email, "re-fired-and-cooled-8");
    await expect(page).toHaveURL(/\/studio/);
  });

  test("an ended session returns to the door rather than half-working", async ({ page }) => {
    await signIn(page, NEW.email, "re-fired-and-cooled-8");
    await expect(page).toHaveURL(/\/studio/);
    // GoTrue owns sessions now. Ending this person's sessions server-side is what an expiry or
    // a revocation does: the cookie still holds a token, and getUser() must refuse it.
    await owner((c) => c.query(
      `DELETE FROM auth.sessions WHERE user_id = (SELECT id FROM auth.users WHERE lower(email) = lower($1))`,
      [NEW.email]));
    await page.goto("/studio");
    await expect(page).toHaveURL(/sign-in/);
  });
});
