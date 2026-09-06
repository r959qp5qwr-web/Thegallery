import { defineConfig, devices } from "@playwright/test";

// Journeys enter through the same doors the product exposes: a browser, at phone width, with
// no privileged hooks. Where a test needs a value a person would read in their email, it
// reads the local outbox table directly and says so — it does not fake a confirmed account.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100",
    // This environment ships Chromium at a fixed path rather than in Playwright's own cache.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM }
      : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Phone width is the primary target (ux/UX_MANIFEST.yaml target_platforms).
    ...devices["Pixel 7"],
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
});
