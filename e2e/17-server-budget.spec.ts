import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { signIn, owner, MAKER_B } from "./helpers";

/**
 * The server's share of the work stays small (ledger GAL-L0044).
 *
 * Production runs as a Cloudflare Worker on the Free plan: 10 ms of CPU per request. The suite
 * runs the app under Node, which has no such limit, so on 2026-11-23 every journey passed while
 * the live site cut off every photo upload (decode + resize + re-encode on the server took
 * 1.4-1.9 s of CPU before Cloudflare killed it). These checks hold the class, not the instance:
 *
 *   1. No image codec is in the server build at all.
 *   2. Adding a photo costs the server little CPU, measured on the running server process.
 *
 * Node is not workerd, so (2) is a budget, not an emulation: it is set far below what image
 * processing costs (seconds) and above what plain page work costs here (tens of ms).
 */
const BUDGET_MS = 400;

function serverPid(): number {
  const out = execSync("pgrep -f '^next-server' || true").toString().trim().split("\n").filter(Boolean);
  if (out.length !== 1) throw new Error(`expected one next-server process, found ${out.length}`);
  return Number(out[0]);
}

/** CPU time of every thread of the process, in ms (schedstat: nanoseconds on CPU). */
function cpuMs(pid: number): number {
  let ns = 0;
  for (const t of readdirSync(`/proc/${pid}/task`)) {
    try { ns += Number(readFileSync(`/proc/${pid}/task/${t}/schedstat`, "utf8").split(" ")[0]); } catch { /* thread ended */ }
  }
  return ns / 1e6;
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

test.describe("the server's share of the work", () => {
  test("no image codec is built into the server", () => {
    const hits = filesUnder(join(process.cwd(), ".next/server"))
      .filter((f) => /\.(js|wasm)$/.test(f))
      .filter((f) => f.endsWith(".wasm") || /@jsquash|mozjpeg|jsquash_resize/.test(readFileSync(f, "utf8")));
    expect(hits, "image decoding belongs in the maker's browser, not the Worker").toEqual([]);
  });

  test("adding a photo costs the server little CPU", async ({ page }) => {
    await signIn(page, MAKER_B.email, MAKER_B.password);
    const work = (await owner((c) => c.query<{ id: string }>(
      "SELECT id FROM works WHERE title = 'Unfinished Warp'"))).rows[0];
    await page.goto(`/studio/works/${work.id}`);
    await page.waitForLoadState("networkidle");

    const pid = serverPid();
    const before = cpuMs(pid);
    await page.getByLabel("Choose a photograph").setInputFiles(join(process.cwd(), "e2e/fixtures/landscape-3x2.jpg"));
    await page.getByRole("button", { name: "Add image" }).click();
    await expect(page.getByTestId("form-notice")).toContainText("Image added", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    const spent = cpuMs(pid) - before;
    console.log(`server CPU for one photo: ${spent.toFixed(0)} ms (budget ${BUDGET_MS})`);
    expect(spent).toBeLessThan(BUDGET_MS);
  });
});
