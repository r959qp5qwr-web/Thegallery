import { test, expect } from "@playwright/test";
import { linkFromOutbox, owner, signIn } from "./helpers";

// J-002, first half: the door. A person with an email address and nothing else.
const NEW = { email: "kavya.iyer@makers.example", password: "slipware-and-salt-3" };

test.describe("the maker door", () => {
  test.beforeAll(async () => {
    await owner((c) => c.query("DELETE FROM auth_accounts WHERE email_normalised = lower($1)", [NEW.email]));
  });

  test("create an account, confirm the email, sign in, sign out", async ({ page }) => {
    await page.goto("/makers");
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page.getByRole("heading", { name: "Your email opens the Studio" })).toBeVisible();

    // The door says plainly that this address stays private.
    await expect(page.getByText("It stays private")).toBeVisible();

    await page.getByLabel("Email").fill(NEW.email);
    await page.getByLabel("Password").fill(NEW.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByText(NEW.email)).toBeVisible();

    // Signing in before confirming is refused, and says why.
    await signIn(page, NEW.email, NEW.password, false);
    await expect(page.getByTestId("form-error")).toContainText("has not been confirmed");

    const link = await linkFromOutbox(NEW.email, "/makers/confirm/");
    await page.goto(link);
    await expect(page.getByRole("heading", { name: "Your email is confirmed" })).toBeVisible();

    // A confirmation link is single use.
    await page.goto(link);
    await expect(page.getByRole("heading", { name: "That link no longer works" })).toBeVisible();

    await signIn(page, NEW.email, NEW.password);
    await expect(page).toHaveURL(/\/studio/);
    await expect(page.getByRole("heading", { name: "Set up your gallery" })).toBeVisible();

    await page.goto("/studio/account");
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
    await page.getByRole("button", { name: "Send the link" }).click();
    const unknown = await page.getByTestId("form-notice").textContent();

    await page.goto("/makers/reset");
    await page.getByLabel("Email").fill(NEW.email);
    await page.getByRole("button", { name: "Send the link" }).click();
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

  test("an expired session returns to the door rather than half-working", async ({ page }) => {
    await signIn(page, NEW.email, "re-fired-and-cooled-8");
    await expect(page).toHaveURL(/\/studio/);
    await owner((c) => c.query(
      `UPDATE auth_sessions SET expires_at = now() - interval '1 minute'
        WHERE account_id = (SELECT id FROM auth_accounts WHERE email_normalised = lower($1))`, [NEW.email]));
    await page.goto("/studio");
    await expect(page).toHaveURL(/sign-in/);
  });
});
