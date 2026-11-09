# active-memory handoff: The Gallery — Wave 5 live; next: the phone walk on the live site, one step at a time

**Handoff #5** · 2026-11-09 · Lineage:
- **#1 (2026-11-05 → 06):**
  - Re-pinned The Gallery to the new Builders' Doctrine.
  - Rebuilt the vanished Supabase project and restored the live site.
  - Passed the e2e journeys on a test project.
  - Built Wave 1.
- **#2 (2026-11-06):** shipped Wave 1 (PR #4) and Wave 2 (PR #5); ledger GAL-L0019..22.
- **#3 (2026-11-06 → 07):** shipped Wave 3 (PR #6) and Wave 4 (PR #7); ledger GAL-L0023.
- **#4 (2026-11-07 → 09):**
  - Shipped the governor's decisions (PR #8, PR #9); ledger GAL-L0024..25.
  - Published the phone-walk checklist.
  - Ran a five-reviewer design review (98 findings) after the governor called the live site "novice".
- **#5 (2026-11-09):**
  - Governor chose A2 / B2 / C-later.
  - Built a rendered design pass, which the governor approved, and app icon option 4.
  - Built, independently reviewed, design-skill-checked and proved Wave 5.
  - Merged PR #10 → `cc28867`; confirmed live. Ledger GAL-L0026..30.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: Start every reply with exactly "Yes Boss!"
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** keep The Gallery (`https://atthegallery.in`) live and governed under the central Builders' Doctrine, at an artist-first, world-class standard. Now: prove the real maker journey on a physical phone against the live site.
- **Done looks like:** the governor walks sign-up → confirm email → set up gallery → add a work with photos → publish → share → a visitor messages on WhatsApp on their Android phone (Chrome) against the live site. Each step is reported SEEN / NOT SEEN / UNKNOWN. Anything broken is fixed through the normal change process.
- **This walk also proves:**
  - the live Supabase auth settings (Site URL, redirects, email templates; the user said "1 is done", but they are NOT SEEN, a 403 from this environment);
  - the install prompt for the new app icon;
  - the Wave 5 interface on a real device.
- **Why it matters:** the user, in their own words:
  - "This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of design orientation… be cutting edge."
  - On 2026-11-09, before Wave 5: "The interface looks so novice like. There is duplication. Very pathetic."

## 2. About the user (as relevant to this work)
- Systems-minded wellness entrepreneur and capability designer.
- Acts as **the Governor** of products built under the Builders' Doctrine (The Gallery, Ahoy, maa.se, Ustaad, TreksFit, Swasthya…).
- Uses ChatGPT for sense-making, Claude for building and implementation, and another tool for research.
- Works on an Android phone (Chrome) and an iPad. Reaches the Supabase, Cloudflare and GitHub dashboards in a browser.
- Has installed many design skills and expects them to be used on anything people see.
- Answers decisions tersely: "Yes", "Yes.", "Go with your recommendation.", "I will go with your recommendations.", "Looks good. Approved.", "Option 4.", "Merge", "1.".

## 3. Style & communication
- **Language:** English.
- **Tone:** grounded, calm, precise, direct, low-hype. No fluff, no motivational padding, no generic coach or branding language.
- **Reply length:** short and structured; details on request.
- **Formatting:**
  - headings, short lists, tables;
  - report SEEN / NOT SEEN / UNKNOWN separately;
  - plain words, not code names, in user-facing summaries.
- **Working style:**
  - Order of work: architecture → domain → workflow → templates. Containers over tips.
  - Give a few strong options with a recommendation, then treat the choice as fixed.
  - Ask only when it materially affects design, safety or implementation; otherwise act.
  - Resolve things yourself rather than hand over dashboard chores.
  - Visual decisions are shown as rendered pages or images, not only described.
  - Each change set ends with a summary, decisions for the governor with a recommendation, and "Merge PR #n?".
  - **Phone walk (user, 2026-11-09): "One step at a time."** Give one step, wait for the user's result (what they saw, or a screenshot), record it, then give the next step.
- **Avoid:**
  - reopening settled decisions;
  - vague best practices;
  - claiming green without a receipt;
  - asking for secrets in chat;
  - naming a cause before testing it;
  - calling a design reviewed when no design skill was run;
  - settling a FIXED or OPEN decision through copy or visuals.

## 4. Hard rules (word for word)
1. "Never write to `builders-doctrine`. The guard denies it; the rule stands without the guard." (Thegallery CLAUDE.md)
2. "Work on a branch; the default branch is merged through review."
3. "No real person's art, address, phone number or email in fixtures, screenshots or tests."
4. "Report what was SEEN, NOT SEEN and UNKNOWN. A green claim needs a receipt."
5. "An indeterminate verdict is a denial."
6. "Read `active_stage.next_acceptance_condition` in `PRODUCT_STATE.json` before building anything. Do not silently settle an OPEN decision through code."
7. Run `python3 scripts/doctrine-orient.py orient` first in a session. The pre-commit gate refuses commits after governing state changes until re-oriented.
8. "No merge, deployment, purchase or schedule is authorized" unless the user says so. Merges are authorised case by case:
   - PR #4: "Merge" + "1."
   - PR #5: "Yes"
   - PR #6: "Merge."
   - PR #7: "Yes."
   - PR #8: "Yes."
   - PR #9: "Yes."
   - PR #10: "Yes."
9. "the design system has to be adhered to" (user).
   - `public/gallery/tokens.css` and `system.css` must stay byte-identical to `ux/reference/interface/`. A journey now enforces this (GAL-L0030).
   - All app styling goes in `public/gallery/app.css`.
   - Any change to tokens or system is a SYSTEM CHANGE and needs the governor's word.
10. Journeys only ever touch the test project; `e2e/helpers.ts` refuses the live project and the live site.
11. Secrets go only through the environment's secure credential form, never in chat.
12. Never test a server whose served page lacks the current `.next/BUILD_ID` (`e2e/run-hosted.sh` enforces it).
13. Run one journey suite at a time (the runner takes a lock; a second run exits 3).
    - Nothing heavy (a `next build`, a second loaded server, screenshot runs) runs beside a suite.
    - Run each suite as its own background command with timeout 3600000.
    - A run without a summary line and an exit code is "no result" (GAL-L0024).
14. Every change set needs all of the following:
    - full suite, phone and desktop;
    - independent review by an agent that did not write the code;
    - the installed design skills run on every human-facing change, and named in the receipt;
    - axe, keyboard and reflow checks;
    - before/after renders, including the empty site;
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
17. A Stop hook in this environment refuses to end a turn with uncommitted changes: commit and push to the working branch before ending each turn.
18. FIXED decisions keep their meaning even when a design is approved. Wording may be refined, never the meaning (GAL-C1, account boundary "created or materially produced", GAL-P1, P-11, GAL-PR-02).

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
| 16 | Chained phone + desktop suites in one background command; stopped at the 30-min limit | Each suite its own background command, timeout 3600000 (GAL-L0024) |
| 17 | Journey 10 counted words with `innerText` on uppercased text, so the check could never fail | Read `textContent`; independent review must check that each test can fail (GAL-L0025) |
| 18 | Tried `git push -f` after restarting a merged branch; refused | Plain push; the merged tip is an ancestor, so it fast-forwards |
| 19 | Shipped waves 1–4 without running any installed design skill; never reviewed the live empty state | Run the design skills on every human-facing change; review the empty state as a first impression (GAL-L0026) |
| 20 | Design pass drew a maker-gallery contact line that dropped "returns and any dispute" (GAL-C1) | Keep a FIXED decision's meaning whatever a drawing shows (GAL-L0027) |
| 21 | Design pass drew price-only tiles, silently narrowing P-11 / GAL-PR-02 | Tiles keep every status but "Available"; check promises before building a drawing |
| 22 | Edited system.css after copying it to the reference; copies drifted | Copy at the end, and keep the byte-identity journey green (GAL-L0030) |
| 23 | Wrote `cat > /dev/null` in a command (blocked waiting on stdin) | Never leave a bare `cat` reading stdin in a command |

## 6. Decisions
| Decision | Why |
|---|---|
| Re-pin to Doctrine `6dc016c485ec1ddf31163534d84e02e0f74772f0` | user |
| Live Supabase `thegallery` (`kemrceegbyizpcfewgri`); journeys on test project `thegallery-test` (`fbgrumcwlnoljkkbiqfe`) | old project vanished; user chose option 1 |
| Waves 1–5 live | adopted |
| Canonical vocabulary: work · maker · gallery · Studio · The Gallery · on view = published · retired (maker) · taken down (operator) · ways to contact; shown "By enquiry" (stored `enquire`), "Not for sale" (stored `on_view`) | Wave 3 |
| Price rule (`labelPrice`, `src/lib/format.ts`): no price beside Sold or Not for sale; a price never repeats its status; tiles and entrance show only a stated amount | governor 2026-11-07 (PR #8) |
| Motion: keep the tile→hero size morph (~280 ms) | same |
| "Hang this first" Studio control | same |
| Keep "For Makers" (capital M) as the section name | governor 2026-11-09 |
| **A2**: targeted SYSTEM CHANGE; palette unchanged (details in section 8) | governor 2026-11-09: "I will go with your recommendations." |
| **B2**: public pages carry the wordmark + Search + Menu; the tab bar is in the Studio only; one colophon | same |
| **C**: price "On enquiry" vs status "By enquiry" → later, as its own change | same |
| Wave 5 design pass approved | "Looks good. Approved." |
| App icon: **option 4**, the stacked wordmark "The / Gallery" in the paper colour on ink | "Option 4." |
| Freshness on a work: "Updated N ago" on its own line; the 90-day "Status last confirmed N ago" is unchanged | design pass (approved) |
| Maker gallery contact line: "You're talking to {first name} directly. Payment, delivery, returns and any dispute are arranged between you; The Gallery takes no part in the sale." The contact sheet keeps the governed GAL-C1 sentence word for word | GAL-C1 fixed in meaning |
| Tiles and entrance: every status except "Available" is shown; for an available work a stated price stands in | P-11, GAL-PR-02 |
| A sold work keeps "Message {name}" (intent defaults to commission) | pre-Wave 5 behaviour; no decision moved |
| Merge PR #10 over red CI (`DOCTRINE_READ_TOKEN` unset) | user "Yes." |

## 7. Changed / rejected
- Journeys on the live site → separate test project
- Direct Postgres → Supabase Management API over HTTPS (`api.supabase.com`, proxy-injected token)
- Loading states on root/Studio/operator → entrance only
- Header: a centred page title, a back arrow and a mono wordmark → **one public header**: serif wordmark left, Search and Menu
- Bottom tab bar on public pages → **Studio only**
- Footer row of four links (including For Makers) → **one colophon**: "The Gallery, Bengaluru · About · Participation · Privacy"
- Empty states drawn as a plinth illustration (`EmptyPlinth`) → **words only** (`EmptyState`)
- Amber-edged outlined actions with "→" → **one filled ink action per screen**; the rest are text links
- Mono uppercase labels → sentence-case sans with a 12 px floor; mono for dimensions and price only
- Italic section lead with an amber rule → roman serif line
- "Contact Anika" → **"Message Anika"** (pinned on a phone)
- Image count "1 of 3" visible → a segmented 2 px line, with "1 of 3" for screen readers
- Native file input → designed photo picker "Choose a photograph"
- "Remove 1…" → "Remove image 1"; "Remove…" → "Remove WhatsApp"
- Browse "next" = any other material (it looped between empty rooms) → only a material with work, else "What The Gallery is"
- Featured image `object-fit: cover` (cropped) → whole, never cropped
- Price-only tiles (as drawn in the pass) → status word kept except "Available"
- Upload notice waits of 10 s → 30 s (GAL-L0029)
- ❌ Restoring the old Supabase project (gone)
- ❌ `ux/reference/interface/img/hero-vessel.jpg` as test imagery (provenance unknown)
- ❌ Committed `ux/reference/implemented/*.png` as "before" renders; build the live default branch in a worktree instead
- ❌ Blaming concurrent build load for the 02 timeout (disproved)
- ❌ Blaming Wave 5 for the upload stalls (the control showed the same 6–8 s on the live build)
- ❌ Force-push to restart a merged branch
- ❌ Claiming "It is free" on For Makers (nothing in the product state fixes it); kept "There is no commission on your sales."
- ❌ Icon options 1 to 3 (G on paper, G on ink, doorway)

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Live site | https://atthegallery.in (Cloudflare Worker `thegallery`, auto-deploys the default branch; PR #10 was live ~45 s after merge) |
| Repo / default branch | `r959qp5qwr-web/Thegallery`, `claude/the-gallery-foundation-7plo1e`, tip `cc28867` (Merge PR #10) |
| Working branch | `claude/great-edison-33c2ex`, fast-forwarded to `cc28867` |
| Doctrine repo | `r959qp5qwr-web/builders-doctrine`, main `6dc016c485ec…`, version 1.1.0 ACTIVE_PENDING_REPIN |
| Live Supabase | `kemrceegbyizpcfewgri`, publishable `sb_publishable_joD-RqEyX63-Y1CwQSErxg_nuGsUB7N` |
| Test Supabase | `fbgrumcwlnoljkkbiqfe`, URL `https://fbgrumcwlnoljkkbiqfe.supabase.co`, publishable `sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd`, schema `gallery` |
| Supabase org / paused | org `cfswptemcrgviaelohne` (free, 2 active); paused: Ahoy `mupctqclstbnvrvxycep`, treksfit-prod `yeyaaufiitsznxtuhoee`, maase `mrazsrziwmbwrlsbzglq` |
| Environment | "The Gallery (with Doctrine)" `env_015jqYRQ2fkV9xhRroHttVvw`; `api.supabase.com` proxy-injected token [secret removed: re-enter it]; reaches the test project only (a read of live auth config returned 403) |
| PRs | #1 `b22f02e`, #2 `c659e98`, #3 `d7c00a1`, #4 → `336928b`, #5 → `388f914`, #6 → `4986e07`, #7 → `fa59a7c`, #8 → `5563d28`, #9 → `5a23906`, #10 → `cc28867` (head `b7b4ac8`) |
| PR #10 proof | build `njBeMoHo-oqzbxTCKElVB1` (app code `8bb15d2`); phone 78 passed + 1 skipped; desktop 78 passed + 1 skipped; axe 0 violations / 33 states; reflow 16/16 at 320 px; gates 5/5; drill 89 PASS; before build `C019BiWtkr74F0tTHwmhF` (`5a23906`) |
| Live checks after PR #10 | 200: `/` `/about` `/privacy` `/makers` `/saved` `/workshops` `/manifest.webmanifest` `/icons/maskable-512.png` `/icons/apple-touch-icon.png` `/favicon.ico` · 404: `/no-such-page` `/work/not-a-real-token` · 307: `/studio` · `/m/nobody` 200 "This gallery is not available" |
| Live entrance today | empty: "The first works are being hung." (no published works) |
| Upload timing (test project) | Wave 5 5.9–7.4 s; live build 6.4–7.9 s (8 uploads each) |
| Test seeds | Maker A `anika.rao@makers.example` / `kiln-and-monsoon-9` (anika-rao); Maker B `studio@dhaaga.example` / `warp-and-weft-11` (dhaaga-studio); Operator `operator@thegallery.example` / `operator-of-record-7` |
| Test works | "Monsoon Vessel No. 4" (Maker A, published, price exact 6800, 3 images); "Unfinished Warp" (Maker B) |
| Journeys | 01–11; 79 tests per project; `e2e/11-first-impression.spec.ts` |
| Ledger latest | GAL-L0030 |
| Receipts (this chat) | `GOVERNOR-DECISIONS-2026-11-09-WAVE5.md`, `WAVE5-FIRST-IMPRESSION-2026-11-09.md`, folders `wave5/` (before/after renders, sheets), `wave5-design-pass/` (pass pages, renders, 3D object tools), `wave5-review/` |
| Artifacts (private) | Phone-walk checklist https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7 · Wave 5 design pass https://claude.ai/artifact/NrK3jfHcXvEXurUAx5NiVp · Wave 5 findings https://claude.ai/artifact/6SN1PoKuEUPWgsXPhmcbTt · old design review https://claude.ai/artifact/6UtifvpBuyytm4Nj68C6h4 |
| A2 type tokens | wordmark `400 22px` serif, −0.01em; display `300` 42 / 56 / 72 px; monument `300` 52 / 76 / 104 px; heading 26 / 30 px; lead `400 19px` roman serif; maker/status `400 15px` sans; label `500 12px` sans; caption `400 13px` sans; nav `400 15px` sans; menu `400 30px` serif; note `400 20px` serif; meta mono `13px` (dimensions and price only) |
| Filled action | background `--ink` #221E1A (rgb 34,30,26), text `--paper` #F8F3EA |
| Icons | `public/icons/` icon-192/512 (any), maskable-192/512, apple-touch-icon (180), favicon-32; `public/favicon.ico`; manifest `src/app/manifest.ts` (name "The Gallery", display standalone, colours #F8F3EA) |
| Breakpoints / widths | 600 / 900 px; page max 1200 px; 12-column grid from 600 px; Studio column 760 px; forms ≤ 560 px |
| Upload limit | `bodySizeLimit: "12mb"`; only JPEG is read (`src/lib/storage.ts`); the picker accepts `image/*` |

## 9. People, terms & names
- **People:** the user = the Governor.
- **Terms:**
  - Doctrine tooling: orient / check / gate / drill (`scripts/doctrine-*.py`); receipt; ledger.
  - "first impression" = Wave 5.
  - SYSTEM CHANGE = touches tokens.css or system.css.
  - A2 / B2 / C = the Wave 5 governor choices.
  - "monument" = the display step for the one name or sentence that stands in for an image.
  - "phone walk" = the live, physical-phone proof of the maker journey.
  - GAL-PR-01: contact is not advertised until a way to contact exists.
  - GAL-C1: the handoff disclosure, fixed in meaning.
- **Names in use:**
  - Components: `Header`, `PublicNav` (Menu popover with class-toggle fallback), `Footer` (colophon), `EmptyState`, `PhotoPicker`, `WorkTile`, `Hero` in `src/components/`.
  - `.workbar` (the pinned "Message {name}").
  - `materialsOnView` in `src/lib/queries.ts`.
  - Tools: `e2e/run-hosted.sh`; this file is `doctrine/handoffs/handoff-the-gallery.md`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Waves 1–5 | merged, live | PRs #4–#10 | Wave 5 confirmed live 2026-11-09 |
| Phone walk | not started | checklist artifact TXrno4ACqCY1pEdD8vKKz7 | next; one step at a time |
| Live operator account | unknown | — | needed for the suspension walk |
| CI | red on every PR | needs repo secret `DOCTRINE_READ_TOKEN` | governor to create |
| Design-pass LATER items | not started | `WAVE5-FIRST-IMPRESSION-2026-11-09.md` | About repeats the entrance sentence and has no forward link; About top spacing at 1440 |

## 11. Next steps
1. **Next action:** orient (`python3 scripts/doctrine-orient.py orient`), read the phone-walk checklist with the Artifact tool (`action: "read"`, https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7) and bring it up to date for Wave 5. Since it was written, "Create an account" became "Open your gallery", "Contact" became "Message", and the Menu and the app icon are new. Then give the governor **step 1 only**: on the Android phone in Chrome, open https://atthegallery.in and report what the first screen shows, and whether Chrome offers "Install app" in its menu. Wait for the result.
2. Continue one step at a time: For Makers → Open your gallery → create account with a real email the governor controls → confirmation email arrives (this proves the live Supabase templates and redirects) → Studio set-up → Ways to contact you (WhatsApp) → add a work with phone photos (watch for iPhone HEIC; Android is JPEG) → publish → share link → open as a visitor → Message on WhatsApp.
3. Record each step as SEEN / NOT SEEN / UNKNOWN in a receipt (`doctrine/receipts/PHONE-WALK-<date>.md`). Fix any defect through the normal change process (rule 14).
4. Afterwards: the live operator account and the suspension walk; `DOCTRINE_READ_TOKEN`; the design-pass LATER items; decision C.

## 12. Open questions ⚠️
1. **`DOCTRINE_READ_TOKEN`:** the governor chose "set it". Only they can create it: a fine-grained read-only GitHub token on `builders-doctrine` (Contents: read), saved as a repository secret on Thegallery. Has it been done? (yes / not yet)
2. **Live operator account:** does one exist on the live project? (yes / no / don't know)
3. **Carried:**
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
- [ ] Nothing has to be attached. This file is committed at `doctrine/handoffs/handoff-the-gallery.md` on branch `claude/great-edison-33c2ex`. The checklist is the artifact in section 8.
- [ ] Open the new session on `r959qp5qwr-web/Thegallery` (with `builders-doctrine` beside it) in environment "The Gallery (with Doctrine)", and attach or point to this file.

---
<sub>Audit: 13/13 sections · 18 rules · 23 corrections · 78 data points · secrets removed: yes · generated by active-memory</sub>
