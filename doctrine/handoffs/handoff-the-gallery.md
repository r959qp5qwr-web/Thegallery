# active-memory handoff: The Gallery — Wave 5 "first impression" (review done; governor decisions A/B/C next)

**Handoff #4** · 2026-11-09 · Lineage: #1 (2026-11-05 → 06): re-pinned The Gallery to the new Builders' Doctrine, rebuilt the vanished Supabase project and restored the live site, reworked and passed the e2e journeys on a test project, ran a design review, built Wave 1; #2 (2026-11-06): verified and shipped Wave 1 (PR #4) and Wave 2 (PR #5), ledger GAL-L0019..22; #3 (2026-11-06 → 07): built, reviewed, proved and shipped Wave 3 "one vocabulary" (PR #6) and Wave 4 "cutting edge" (PR #7), ledger GAL-L0023; #4 (2026-11-07 → 09): built and shipped the governor's decisions (PR #8: price rule, motion kept, Hang this first; PR #9: docs words), ledger GAL-L0024..25, published the phone-walk checklist, then — after the governor called the live interface "novice" — ran a five-reviewer design review (98 findings) and published the findings page

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: Start every reply with exactly "Yes Boss!"
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** keep The Gallery (`https://atthegallery.in`) live, governed under the central Builders' Doctrine, and raise the interface to a genuinely world-class, artist-first standard. The live site was judged by the governor as not meeting it.
- **Done looks like:**
  - Wave 5 "first impression" built, proved and live: the live empty state, a work page, a maker's gallery and For Makers no longer read as novice or duplicated.
  - Then the first real maker walks sign-up → publish → share on a physical phone against the live site.
- **Why it matters:** user: "This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of design orientation… be cutting edge." On 2026-11-09, on seeing the live site: "The interface looks so novice like. There is duplication. Very pathetic. Have we done the interface review. All the relevant design related skills that are part of your system, have we utilised anything."

## 2. About the user (as relevant to this work)
- Systems-minded wellness entrepreneur and capability designer.
- Acts as **the Governor** of products built under the Builders' Doctrine (The Gallery, Ahoy, maa.se, Ustaad, TreksFit, Swasthya…).
- Uses ChatGPT for sense-making, Claude for building and implementation, and another tool for research.
- Works on an Android phone (Chrome) and an iPad. Reaches the Supabase, Cloudflare and GitHub dashboards in a browser.
- Has installed many design skills and expects them to be used on anything people see.
- Answers decisions tersely ("Yes", "Yes.", "Go with your recommendation.", "Merge", "1.").

## 3. Style & communication
- **Language:** English.
- **Tone:** grounded, calm, precise, direct, low-hype. No fluff, no motivational padding, no generic coach or branding language.
- **Reply length:** short and structured; details on request.
- **Formatting:** headings, short lists, tables. Report SEEN / NOT SEEN / UNKNOWN separately. Use plain words, not code names, in user-facing summaries.
- **Working style:**
  - Order of work: architecture → domain → workflow → templates. Containers over tips.
  - Give a few strong options with a recommendation, then treat the choice as fixed.
  - Ask only when it materially affects design, safety or implementation; otherwise act.
  - Resolve things yourself rather than hand over dashboard chores.
  - Each change set ends with a summary, decisions for the governor with a recommendation, and "Merge PR #n?".
  - Visual decisions are shown as rendered pages, not only described.
- **Avoid:** reopening settled decisions; vague best practices; claiming green without a receipt; asking for secrets in chat; naming a cause before testing it; calling a design reviewed when no design skill was run.

## 4. Hard rules (word for word)
1. "Never write to `builders-doctrine`. The guard denies it; the rule stands without the guard." (Thegallery CLAUDE.md)
2. "Work on a branch; the default branch is merged through review."
3. "No real person's art, address, phone number or email in fixtures, screenshots or tests."
4. "Report what was SEEN, NOT SEEN and UNKNOWN. A green claim needs a receipt."
5. "An indeterminate verdict is a denial."
6. "Read `active_stage.next_acceptance_condition` in `PRODUCT_STATE.json` before building anything. Do not silently settle an OPEN decision through code."
7. Run `python3 scripts/doctrine-orient.py orient` first in a session. The pre-commit gate refuses commits after governing state changes until re-oriented.
8. "No merge, deployment, purchase or schedule is authorized" unless the user says so. Merges are authorised case by case: PR #4 "Merge" + "1.", #5 "Yes", #6 "Merge.", #7 "Yes.", #8 "Yes.", #9 "Yes.".
9. "the design system has to be adhered to" (user). `public/gallery/tokens.css` and `system.css` must stay byte-identical to `ux/reference/interface/`. All app styling goes in `public/gallery/app.css`. Any change to tokens or system is a SYSTEM CHANGE and needs the governor's word.
10. Journeys only ever touch the test project; `e2e/helpers.ts` refuses the live project and the live site.
11. Secrets go only through the environment's secure credential form, never in chat.
12. Never test a server whose served page lacks the current `.next/BUILD_ID` (`e2e/run-hosted.sh` enforces it).
13. One journey run at a time (`e2e/run-hosted.sh` takes a lock; a second run exits 3). Nothing heavy (a `next build`, a second loaded server) runs beside a suite run. Run each suite as its own background command with timeout 3600000 (GAL-L0024).
14. Every change set needs all of the following:
    - full suite, phone and desktop;
    - independent review by an agent that did not write the code;
    - **the installed design skills run on every human-facing change**;
    - axe, keyboard and reflow checks;
    - before/after renders;
    - a receipt at `doctrine/receipts/…md`;
    - a ledger entry per incident;
    - a PR;
    - merge only on the user's word;
    - live confirmed afterwards.
15. Before merging, all of the following hold:
    - the working tree is clean;
    - the PR head is the tested commit (merge with `expectedHeadSha`);
    - the red CI log has been read and confirmed to be only `DOCTRINE_READ_TOKEN` unset, and the merge commit message says so.
16. After a PR is merged, restart the working branch from the latest default branch (same name) before new work. Never force-push; a fast-forward works because the merged tip is an ancestor.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Said The Gallery had "no deployment yet" (read an older branch) | It was live; check all branches first |
| 2 | Kept handing the user manual steps | "Just resolve it now…": find the self-sufficient path |
| 3 | Only ran functional journeys | Always review design against `ux/INTERFACE_FOUNDATION.md` too |
| 4 | First design pass used one lens | Comprehensive review with all installed design skills, artist-first, cutting-edge |
| 5 | User pasted a Supabase token in chat | Never use it; secrets only via the secure form |
| 6 | Reported 62/62 against a stale `next-server` | Always verify the served BUILD_ID (GAL-L0018) |
| 7 | Seeded extra works, breaking journeys | Seed clears works no journey creates; a journey that adds works removes them in afterAll |
| 8 | Wave 1 claims written from intent, not proof | Each claim needs a journey that fails without it (GAL-L0019) |
| 9 | Let two suite runs overlap on the test project | Never; runner lock (GAL-L0020) |
| 10 | Added `overflow-x: clip` on `<html>`; phones mis-sized the viewport | No layout-affecting rule for decoration; regression journey (GAL-L0021) |
| 11 | Loading states on Studio/operator/root broke 404/307 | Loading state on the entrance only; pinned by a journey (GAL-L0022) |
| 12 | Render caption hard-coded an older build ID | Label evidence with the build actually rendered |
| 13 | Ran a `next build` beside a suite, then named that load as the cause of a timeout | Never run heavy work beside a suite; name a cause only after a control run on the previous build (GAL-L0023) |
| 14 | A shell command combined `cd` with `rm -rf *`; blocked | Don't remove; unpack into a new `mktemp -d` folder instead |
| 15 | Wave 4: tile class `lead` collided with `.section .lead`; tests measured only outer boxes | Check class names against system.css; test inner layout; render with real images before claiming |
| 16 | Chained phone + desktop suites in one background command; stopped at the 30-min limit | Each suite its own background command, timeout 3600000; a run without a summary line is "no result" (GAL-L0024) |
| 17 | Journey 10 counted words with `innerText` on uppercased text, so the check could never fail | Read `textContent`; independent review must check that each test can fail (GAL-L0025) |
| 18 | Tried `git push -f` after restarting a merged branch; refused by the safety classifier | Plain push; the merged tip is an ancestor, so it fast-forwards |
| 19 | Shipped waves 1–4 and the decisions without running any installed design skill; receipts name none; the live **empty** state was never reviewed | User: "looks so novice like… duplication… pathetic… have we utilised anything." Run the design skills on every human-facing change and review the live empty state as a first impression |

## 6. Decisions
| Decision | Why |
|---|---|
| Re-pin to Doctrine `6dc016c485ec1ddf31163534d84e02e0f74772f0` | user |
| Live Supabase `thegallery` (`kemrceegbyizpcfewgri`); journeys on test project `thegallery-test` (`fbgrumcwlnoljkkbiqfe`) | old project vanished; user chose option 1 |
| Waves 1–4 live (trust & access, the room at every width, one vocabulary, cutting edge) | adopted |
| Canonical vocabulary: work · maker · gallery · Studio · The Gallery · on view = published · retired (maker) · taken down (operator) · ways to contact; shown "By enquiry" (stored `enquire`), "Not for sale" (stored `on_view`) | Wave 3 |
| **Price rule** (`labelPrice`, `src/lib/format.ts`): no price beside Sold or Not for sale; a price never repeats its status; tiles and entrance show only a stated amount; Studio shows the stored price + "not shown while …" | governor 2026-11-07 "Yes. With your recommendations." (PR #8) |
| **Motion:** keep the tile→hero size morph (~280 ms) over foundation line 163 | same |
| **Hang this first:** Studio "Order in your gallery" section on a published work; changes only `works.position` (min − 1); shown only when the wall is public and has >1 work; no-op when already first | same |
| Reconfirming a status moves the work to the top of the Studio list (ordered by `updated_at`) | governor 2026-11-09 "Go with your recommendation." |
| Keep "For Makers" (capital M) as the section name; "maker" lower case in running text | same |
| Reference plates and journey docs use the product's words | same (PR #9, documents only) |
| `DOCTRINE_READ_TOKEN`: not needed to run the site, only to make CI a real check and close the platform-enablement gate | Claude's explanation 2026-11-09; user has not decided (section 12) |
| Merge PRs #4–#9 over red CI (`DOCTRINE_READ_TOKEN` unset) | user's word each time; recorded in merge messages |
| Wave 5 = "first impression": review first (done), governor picks A/B/C, then a design pass rendered for the governor before the full build | user "Yes," to the proposal |

## 7. Changed / rejected
- Journeys on the live site → separate test project
- Direct Postgres → Supabase Management API over HTTPS (`api.supabase.com`, proxy-injected token)
- Header full-bleed via `overflow-x: clip` → box-shadows → **border-image outset**
- Loading states on root/Studio/operator → **entrance only**
- "N images" → **"1 of 3"**; status "Enquire"/"On view" → **By enquiry / Not for sale**
- Tile class `lead` → **`hang-first`**; React `<ViewTransition>` → browser `document.startViewTransition` (`src/components/ViewTransition.tsx`)
- "Not for sale · ₹6,800", "By enquiry · Price on enquiry", "Sold · Price on enquiry" → **one price rule** (PR #8)
- Studio "Order" heading → **"Order in your gallery"** (h2); price note `, not shown…` → separate `.status .price-note` sentence
- Plates "Exact / Enquire" → **"Fixed price / On enquiry"**; J-002 "Identity / Contact routes" → **"Your details / Ways to contact you"**
- "Waves 1–4 were design-reviewed" → **not reviewed as a first impression; no recorded skill use** (correction 19)
- ❌ Restoring the old Supabase project (gone)
- ❌ `ux/reference/interface/img/hero-vessel.jpg` as test imagery (provenance unknown)
- ❌ Committed `ux/reference/implemented/*.png` as "before" renders; build the live default branch in a worktree instead
- ❌ Blaming concurrent build load for the 02 timeout (disproved)
- ❌ Force-push to restart a merged branch

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Live site | https://atthegallery.in (Cloudflare Worker `thegallery`, auto-deploys the default branch ~75–150 s after merge; PR #8 went live in ~110 s) |
| Repo / default branch | `r959qp5qwr-web/Thegallery`, `claude/the-gallery-foundation-7plo1e`, tip `5a23906` (Merge PR #9) |
| Working branch | `claude/eloquent-mccarthy-3o5s8m`, tip `6c65bea` (Wave 5 review evidence; on top of `5a23906`; no PR) |
| Doctrine repo | `r959qp5qwr-web/builders-doctrine`, main `6dc016c485ec…`, version 1.1.0 ACTIVE_PENDING_REPIN |
| Live Supabase | `kemrceegbyizpcfewgri`, publishable `sb_publishable_joD-RqEyX63-Y1CwQSErxg_nuGsUB7N` |
| Test Supabase | `fbgrumcwlnoljkkbiqfe`, URL `https://fbgrumcwlnoljkkbiqfe.supabase.co`, publishable `sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd`, schema `gallery` |
| Supabase org / paused | org `cfswptemcrgviaelohne` (free, 2 active); paused: Ahoy `mupctqclstbnvrvxycep`, treksfit-prod `yeyaaufiitsznxtuhoee`, maase `mrazsrziwmbwrlsbzglq` |
| Environment | "The Gallery (with Doctrine)" `env_015jqYRQ2fkV9xhRroHttVvw`; `api.supabase.com` proxy-injected token [secret removed: re-enter it]. It reaches the test project only: a read of the live auth config returned 403. Expires 7 days from 2026-11-06 |
| PRs | #1 `b22f02e`, #2 `c659e98`, #3 `d7c00a1`, #4 → `336928b`, #5 → `388f914`, #6 → `4986e07`, #7 → `fa59a7c`, #8 → `5563d28`, #9 → `5a23906` |
| PR #8 proof | build `hY1Ph5UPDYQ6rusmYPJ5G` (code `789cb86`); phone 67 passed + 1 skipped, desktop 68; axe 24 states 0 violations; reflow 16 clean; gates 5/5; drill 89 PASS; before build `OXHiDrCvRr7rERHCSVLHr` (`fa59a7c`); pre-review build `J9XgdgdBIhxPxIj9N349E` (not proof) |
| Live checks after PR #8 / #9 | `/` `/about` `/privacy` `/makers` 200; `/no-such-page` 404; `/work/not-a-real-token` 404; `/studio` 307; any `/m/<unknown>` 200 "This gallery is not available" (pre-existing, not raised) |
| Live: icons | `/manifest.webmanifest` 404; no `<link rel=icon>`. Chrome shows a grey "A" and "This app cannot be installed" |
| Live Supabase auth settings | User said "1 is done" (2026-11-09): Site URL, redirects, templates. NOT SEEN (403) |
| Test seeds | Maker A `anika.rao@makers.example` / `kiln-and-monsoon-9` (anika-rao); Maker B `studio@dhaaga.example` / `warp-and-weft-11` (dhaaga-studio); Operator `operator@thegallery.example` / `operator-of-record-7` |
| Test works now | "Monsoon Vessel No. 4" (Maker A, published, status `sold`, price exact 6800, 3 images 900×1200, 1500×1000, 1100×1100); "Unfinished Warp" (Maker B, retired) |
| Journeys | 01–10; `e2e/10-governor-decisions.spec.ts` (6) |
| Ledger latest | GAL-L0025 |
| Receipts (this chat) | `GOVERNOR-DECISIONS-2026-11-07.md` (+ `doctrine/receipts/decisions/*.png`), `GOVERNOR-DECISIONS-2026-11-09.md` |
| Wave 5 review | 5 reviewers, 98 findings (17 P0), 9 themes; files in `doctrine/receipts/wave5-review/` (`01-ux-ui-audit.md`, `02-vectorlab.md`, `03-critique-elevation.md`, `04-consistency.md`, `05-writing-journey.md`, `BRIEF.md`, `findings-page.html`, `img/`, `sheet-*.jpg`) |
| Artifacts | Findings page https://claude.ai/artifact/6SN1PoKuEUPWgsXPhmcbTt · Phone-walk checklist https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7 · old design review https://claude.ai/artifact/6UtifvpBuyytm4Nj68C6h4 (all private) |
| Breakpoints / widths | theme 600 / 900 px; page max 1200 px; Studio column 760 px; forms ≤ 560 px; prose ≤ 66ch |
| Upload limit | `bodySizeLimit: "12mb"`; only JPEG is read (`src/lib/storage.ts`) |

**Wave 5 themes (from the findings page):**
1. Empty site looks broken and loops (P0). The browse loop bug is `mats.find(m => m.key !== material)` in the browse page.
2. Everything said 2–5× (P0): "For Makers" 3–4× per screen; three navigations on phone; maker name 5× on the work page.
3. Five header shapes / templates (P0): wordmark missing on 13 of 29 pages; 82 inline styles in 26 files.
4. Contact below the fold on the phone work page (P0; foundation §10 60vh).
5. Policy language (P1).
6. Studio unfinished: native file input, "Remove 1…" (P1).
7. Desktop is a stretched phone: featured work 33% of 1440 (P1/P0).
8. No app icon or manifest (P1).
9. Generated-default look (SYSTEM CHANGE).

**Governor decisions pending (Claude's recommendation first):**
- **A. Visual system:**
  - Option 2 (recommended), targeted system change: serif wordmark; one filled primary action per screen (WhatsApp on a work); no "→"; mono only for dimensions and price; no rule-plus-italic section opener; 12 px type floor; display up to ~104 px on desktop; palette unchanged.
  - Option 1: keep the system.
  - Option 3: full recomposition, including an indigo accent.
- **B. Public navigation:**
  - Recommended: wordmark + Search + Menu on public pages; the tab bar stays in the Studio only; one colophon line.
  - Option 1: keep the tab bar and remove the footer duplicate.
  - Option 3: header only, everywhere.
- **C. Price "On enquiry" vs status "By enquiry":**
  - Recommended: later, as its own change.
  - Alternatives: fold into Wave 5, or leave as is.

## 9. People, terms & names
- **People:** the user = the Governor.
- **Terms:**
  - Doctrine tooling: orient / check / gate / drill (`scripts/doctrine-*.py`); receipt; ledger.
  - Journeys J-001…J-006; plates R-1..R-3, I-1..I-6.
  - GAL-PR-01: contact is not advertised until a way to contact exists.
  - "the hang"; "the room"; "the lead work"; "the publish moment"; "Hang this first".
  - "first impression" = Wave 5.
  - SYSTEM CHANGE = touches tokens.css or system.css.
- **Files (this chat):**
  - `labelPrice` in `src/lib/format.ts`;
  - `hangFirstAction` in `src/app/actions/studio.ts`;
  - "Order in your gallery" section in `src/app/studio/works/[id]/page.tsx`;
  - `.status .price-note` and `.group h2.ghead` in `app.css`;
  - `e2e/10-governor-decisions.spec.ts`;
  - this file, `doctrine/handoffs/handoff-the-gallery.md`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Waves 1–4 | merged, live | PRs #4–#7 | judged "novice" on the live empty state |
| Governor decisions 7 Nov | merged, live | PR #8 → `5563d28` | not yet seen on a live work (no public works) |
| Docs words | merged | PR #9 → `5a23906` | documents only |
| Wave 5 review | done | `doctrine/receipts/wave5-review/`, artifact 6SN1PoKuEUPWgsXPhmcbTt | awaiting A/B/C |
| Wave 5 build | not started | — | design pass first, rendered for the governor |
| Phone walk | not started | checklist artifact TXrno4ACqCY1pEdD8vKKz7 | after Wave 5; also proves the Supabase auth settings |
| CI | red on every PR | needs repo secret `DOCTRINE_READ_TOKEN` | user undecided |

**Fresh-container routine:**
1. `npm ci`.
2. Recreate the gitignored `.env.local`:
   - `SUPABASE_URL` = the test URL;
   - `SUPABASE_PUBLISHABLE_KEY` = the test key;
   - `SUPABASE_STORAGE_BUCKET=gallery-images`;
   - `GALLERY_SCHEMA=gallery`;
   - `GALLERY_BASE_URL=http://127.0.0.1:3100`.
3. `python3 scripts/doctrine-orient.py orient`.
4. `pkill -f next-server; npx next build; npx next start -p 3100 -H 127.0.0.1` with `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.
5. Journeys: `./e2e/run-hosted.sh --project=phone|desktop --reporter=line`. Phone, then desktop, each its own background command with timeout 3600000; ~19 min each.

**Before-renders:**
- `git worktree add --detach <scratch>/before <live sha>`.
- Copy `node_modules` (no symlink).
- `.env.local` with port 3101.
- `next start -p 3101`.

**Axe:** `axe-core@4.10.2` in a scratch tools folder, injected via `addScriptTag`.

**Live captures with Playwright:** `launchOptions.proxy = { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" }`; the browser NSS store already trusts the proxy CA.

**Render fixtures:** insert extra works reusing Monsoon's `work_images.storage_key`. Restore Monsoon's exact status, confirmation time, `updated_at` and position afterwards.

## 11. Next steps
1. **Next action:** get the governor's answers to A, B and C (section 12, item 1).
2. Restart the working branch from the default branch tip, orient, and run `ui-consistency:finding-patterns` → `planning`.
3. Build the Wave 5 **design pass**: the empty entrance, a work page, a maker's gallery and For Makers. Render each at 390 and 1440 from the live-empty state and from the populated state, and show the governor before the full build.
4. Full Wave 5 build, using the themes in section 8 and the exact copy and values in `doctrine/receipts/wave5-review/*.md`:
   - one template, one header, one empty-state component;
   - a written "say it once" rule, plus a journey that counts repeats;
   - no loops into empty rooms;
   - Contact on the first screen of a work;
   - designed Studio controls;
   - app icon and manifest.
5. Prove it per rule 14, PR, merge on the user's word, confirm live.
6. Phone walk (checklist artifact).

## 12. Open questions ⚠️
1. **Wave 5 scope:** A (visual system: 1 / **2 recommended** / 3), B (public navigation: 1 / **2 recommended** / 3), C (price-vs-status: **later recommended** / fold in / leave).
2. **`DOCTRINE_READ_TOKEN`:** set it (recommended, ~5 min, read-only fine-grained token on `builders-doctrine`, Contents read-only, saved as a repo secret), or record a deliberate deferral?
3. **Live operator account:** unknown whether one exists on the live project; needed for the suspension walk.
4. **Carried:**
   - R1 literal "save on pick" vs "draft saved on Save with an image";
   - live migration for "no untitled publish" + "a published work keeps its last image";
   - "Untitled work" sentinel vs `title_pending`;
   - uploads > 12 MB lose the typed label;
   - JPEG-only reading while the picker accepts `image/*` (iPhone HEIC risk);
   - status picker on drafts; medium Studio list-detail; expanded operator list (380 px);
   - foundation conflicts §4 vs §10 and §5 vs §11 (focus ring amber); field-error colour ink vs alarm;
   - restore Ahoy and treksfit-prod;
   - delete or rotate the test project JWT secret and the Supabase token after testing.

## 13. Re-attach checklist
- [ ] Nothing has to be attached: this file is also committed at `doctrine/handoffs/handoff-the-gallery.md` on branch `claude/eloquent-mccarthy-3o5s8m`, and the review evidence is in `doctrine/receipts/wave5-review/` on the same branch.
- [ ] Open the new session on `r959qp5qwr-web/Thegallery` (with `builders-doctrine` beside it) in environment "The Gallery (with Doctrine)", on branch `claude/eloquent-mccarthy-3o5s8m`, and attach or point to this file.

---
<sub>Audit: 13/13 sections · 16 rules · 19 corrections · 64 data points · secrets removed: yes · generated by active-memory</sub>
