# active-memory handoff: The Gallery — drawing-board rebuild, parts 1–2 live; next: part 3 (maker screens)

**Handoff #7** · 2026-11-10 · Lineage:
- **#1 (2026-11-05 → 06):** re-pinned to the new Builders' Doctrine; rebuilt the vanished Supabase project and restored the live site; e2e journeys on a test project; built Wave 1.
- **#2 (2026-11-06):** shipped Wave 1 (PR #4) and Wave 2 (PR #5); ledger GAL-L0019..22.
- **#3 (2026-11-06 → 07):** shipped Wave 3 (PR #6) and Wave 4 (PR #7); ledger GAL-L0023.
- **#4 (2026-11-07 → 09):** governor decisions shipped (PR #8, PR #9); ledger GAL-L0024..25; phone-walk checklist; five-reviewer design review.
- **#5 (2026-11-09):** governor chose A2 / B2 / C-later; design pass approved; app icon option 4; Wave 5 merged (PR #10 → `cc28867`); ledger GAL-L0026..30.
- **#6 (2026-11-09):**
  - The governor judged Wave 5 a regression.
  - Drawing board: 16 screens approved.
  - No-city fix: PR #11 → `8890c52`.
  - Part 1: PR #12 → `ed26f1d`.
  - Ledger GAL-L0031..33.
- **#7 (2026-11-09 → 10):**
  - Built part 2, the visitor screens: the work page, the Message sheet, the maker's gallery as a profile, About on one screen.
  - Full process run; PR #13 merged on "Merge PR 13, Keep, Show" → `3e1af09`, live.
  - Ledger GAL-L0034.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: Start every reply with exactly "Yes Boss!"
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** rebuild The Gallery (`https://atthegallery.in`) to the governor-approved 16-screen drawing board.
  - The base is the original look.
  - The app layer adds a bottom bar with icons, image grids, a heart, fixed bottom actions and short sign-up steps.
  - It ships in 3 parts, one PR each. Parts 1 and 2 are live; part 3 (maker screens) is next. Then the phone walk.
- **Done looks like:**
  - All 16 board screens are live, each matching the board.
  - Every part went through the full process (rule 14) and was merged on the governor's word.
  - Then the governor walks the maker journey on their Android phone against the live site, one step at a time.
- **Why it matters (user's words):**
  - "This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of design orientation… be cutting edge."
  - On Wave 5: "The earlier home page was a beautiful display. Which has become like a notebook now. The copy reads very much written by an AI… Like a doctors notebook. Copy is horrible."
  - "I have never seen an app designed like this… compare it against any reference of how an app should look like, and it will come out a fail… The original design system of the gallery app was good. We reinstating it. But we are also going back to the drawing board. Look at each function and journey. And copy."

## 2. About the user (as relevant to this work)
- Systems-minded wellness entrepreneur and capability designer.
- The **Governor** of products built under the Builders' Doctrine (The Gallery, Ahoy, maa.se, Ustaad, TreksFit, Swasthya…).
- Uses ChatGPT for sense-making, Claude for building, another tool for research.
- Works on an Android phone (Chrome) and an iPad. Reaches the Supabase, Cloudflare and GitHub dashboards in a browser.
- Has installed many design skills and expects them to be used on anything people see.
- Answers tersely: "Yes", "Go.", "Merge.", "Approved.", "Yes, hide, yes", "Merge PR 13, Keep, Show".

## 3. Style & communication
- **Language:** English.
- **Tone:** grounded, calm, precise, direct, low-hype. No fluff, no motivational padding, no generic coach or branding language.
- **Reply length:** short and structured; details on request.
- **Formatting:**
  - headings, short lists and tables;
  - report SEEN / NOT SEEN / UNKNOWN separately;
  - plain words, not code names, in user-facing summaries;
  - send renders and sheets as images (SendUserFile) or published artifacts.
- **Working style:**
  - Work in layers: architecture → domain → workflow → templates. Containers over tips.
  - Give a few strong options with a recommendation, then treat the choice as fixed. Turn decisions into one-word replies.
  - Ask only when it materially affects design, safety or implementation; otherwise act. Resolve things rather than hand over chores.
  - Show visual decisions as rendered pages or images.
  - Each change set ends with a summary, decisions with a recommendation, and "Merge PR #n?".
  - On long waits, give short progress lines ("The user hasn't heard from you" means: say what you are doing).
  - Phone walk: "One step at a time." Give one step, wait for the result, record it.
- **Avoid:**
  - reopening settled decisions;
  - vague best practices;
  - claiming green without a receipt;
  - asking for secrets in chat;
  - naming a cause before testing it;
  - calling a design reviewed when no design skill was run;
  - settling a FIXED or OPEN decision through copy or visuals;
  - machine-sounding copy: "quiet", "not X, not Y" lists, groups of three, abstract nouns.

## 4. Hard rules (word for word)
1. "Never write to `builders-doctrine`. The guard denies it; the rule stands without the guard."
2. "Work on a branch; the default branch is merged through review."
3. "No real person's art, address, phone number or email in fixtures, screenshots or tests." Third-party reference screenshots stay out of the repository and live in the scratchpad.
4. "Report what was SEEN, NOT SEEN and UNKNOWN. A green claim needs a receipt."
5. "An indeterminate verdict is a denial."
6. "Read `active_stage.next_acceptance_condition` in `PRODUCT_STATE.json` before building anything. Do not silently settle an OPEN decision through code."
7. Run `python3 scripts/doctrine-orient.py orient` first. The pre-commit gate refuses a commit after governing state changes (PRODUCT_STATE, ledger…) until you re-orient, so re-run orient before such a commit.
8. "No merge, deployment, purchase or schedule is authorized" unless the user says so. Merges are authorised case by case:
   - PR #4: "Merge" + "1."
   - PR #5: "Yes"
   - PR #6: "Merge."
   - PR #7: "Yes."
   - PR #8: "Yes."
   - PR #9: "Yes."
   - PR #10: "Yes."
   - PR #11: "Merge."
   - PR #12: "Yes."
   - PR #13: "Merge PR   13, Keep, Show"
9. "the design system has to be adhered to" (user).
   - `public/gallery/tokens.css` and `system.css` must be byte-identical to `ux/reference/interface/`, and journey 11 enforces it.
   - Copy to the reference at the end of every change.
   - App styling goes in `public/gallery/app.css`.
   - Tokens and system changes are SYSTEM CHANGES and need the governor's word. The part 1–3 rebuild is authorised.
10. Journeys only touch the test project; `e2e/helpers.ts` refuses the live project and site.
11. Secrets go only through the environment's secure form, never in chat.
12. Never test a server whose served page lacks the current `.next/BUILD_ID` (`e2e/run-hosted.sh` enforces it).
13. Run one journey suite at a time (runner lock; a second run exits 3).
    - Nothing heavy (a build, renders) beside a suite.
    - Each suite is its own background command with timeout 3600000.
    - **Start `next start -p 3100` as its own background command with timeout 7200000** (it is killed at 2 h; restart it for longer sessions).
    - A run without a summary line and an exit code is "no result".
14. Every change set needs all of the following:
    - full suite, phone and desktop;
    - independent review by an agent that did not write the code (builder-reviewer);
    - installed design skills run and named in the receipt;
    - axe, keyboard and reflow checks;
    - before/after renders, including the empty site;
    - a receipt at `doctrine/receipts/…md`;
    - a ledger entry per incident;
    - a PR;
    - merge only on the user's word;
    - live confirmed afterwards.
15. Before merging, all of the following hold:
    - a clean tree;
    - the PR head is the tested head (merge with `expectedHeadSha`);
    - the red CI log has been read and confirmed to be only `DOCTRINE_READ_TOKEN` unset, and the merge message says so.
16. After a merge, fast-forward the working branch to the default branch (`git fetch origin <default> && git merge --ff-only`, then push). Never force-push.
17. A Stop hook refuses to end a turn with uncommitted or untracked files: commit and push before ending each turn.
18. FIXED decisions keep their meaning whatever a drawing shows. Wording may be refined, never the meaning (GAL-C1, account boundary "created or materially produced", GAL-P1, P-11, GAL-PR-02, GAL-OD-04).
19. Each new or changed test must be able to fail. Prove it, for example with a planted defect and a rebuild (or the build before the fix as the control).
20. Before restoring a file from history, list the rules added after that point and carry each one forward or drop it on purpose (GAL-L0033).
21. A design review compares rendered screens against named external references and the original foundation, and lists what each change removes (GAL-L0031).
22. A subset run of the journeys must include the journeys whose fixtures it reads (03 marks the seeded work Sold; 04 leaves the failed image), or it is reported as indicative only. The full suite is the receipt (GAL-L0034).
23. The `ui-consistency:verifying` check uses a separate agent, calibrated first on a copy with one planted difference.

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
| 8 | Wave 1 claims written from intent | Each claim needs a journey that fails without it (GAL-L0019) |
| 9 | Let two suite runs overlap | Never; runner lock (GAL-L0020) |
| 10 | `overflow-x: clip` on `<html>` | No layout-affecting rule for decoration (GAL-L0021) |
| 11 | Loading states broke 404/307 | Loading state on the entrance only (GAL-L0022) |
| 12 | Render caption hard-coded an old build ID | Label evidence with the build actually rendered |
| 13 | Ran a build beside a suite, then blamed the load | Never run heavy work beside a suite; name a cause only after a control run (GAL-L0023) |
| 14 | `cd` + `rm -rf *` in one command; blocked | Unpack into a new `mktemp -d` folder instead |
| 15 | Tile class `lead` collided; tests measured only outer boxes | Check class names against system.css; test inner layout |
| 16 | Chained suites in one background command | One suite per background command, timeout 3600000 (GAL-L0024) |
| 17 | Journey counted words with `innerText` on uppercase text | Read `textContent`; the review checks that each test can fail (GAL-L0025) |
| 18 | Tried `git push -f` after a merge | Fast-forward; plain push |
| 19 | Shipped waves 1–4 without design skills | Run design skills on every human-facing change (GAL-L0026) |
| 20 | Design pass dropped GAL-C1 meaning | Keep a FIXED decision's meaning (GAL-L0027) |
| 21 | Price-only tiles narrowed P-11 | Tiles keep every status but "Available" |
| 22 | Reference copies drifted | Copy at the end; byte-identity journey (GAL-L0030) |
| 23 | Bare `cat` reading stdin | Never |
| 24 | Wave 5: rule-based checks stripped the gallery character; copy read as AI; no external references; "Make an account" was a list step that looked like a button | Old look restored; compare against real apps; hand-written terse copy; nothing that looks tappable but isn't (GAL-L0031) |
| 25 | The site named Bengaluru as The Gallery's city (broke GAL-OD-04) | "This is not a Bengaluru centric store. Remove such references if they exist anywhere." (GAL-L0032) |
| 26 | Restoring system.css dropped the pinned work bar; a hero rule stretched the image box | Carry later rules forward; Message pinned on a phone (GAL-L0033) |
| 27 | Heredocs with JS or a backgrounded `( … &)` tripped the shell safety check | Write scripts with the Write tool; run servers as their own background command |
| 28 | Part 2: hid the phone work page's header with `display:none`, removing the banner landmark (journey 07 caught it) | Keep landmarks; hide visually with a clip and show on keyboard focus |
| 29 | Part 2: a scratch script crashed mid-way and left test rows and a moved position in the test project | Scripts that change test data clean up in `finally`, with SQL the `bind` helper supports (no `ANY($1)` with arrays) |

## 6. Decisions
| Decision | Why |
|---|---|
| Doctrine pin `6dc016c485ec1ddf31163534d84e02e0f74772f0` | user |
| Live Supabase `thegallery` (`kemrceegbyizpcfewgri`); journeys on `thegallery-test` (`fbgrumcwlnoljkkbiqfe`) | user, option 1 |
| Vocabulary: work · maker · gallery · Studio · The Gallery · on view = published · retired (maker) · taken down (operator) · ways to contact; "By enquiry" (`enquire`), "Not for sale" (`on_view`) | Wave 3 |
| Price rule (`labelPrice`, `src/lib/format.ts`): no price beside Sold or Not for sale; tiles, entrance, Saved and a maker's squares show every status except "Available", for which a stated price stands in; a stated price also stands beside Made to order / By enquiry | governor 2026-11-07; P-11 / GAL-PR-02 |
| Keep the tile→hero morph (~280 ms, 1.5 s budget); "Hang this first" control | governor 2026-11-07 |
| App icon option 4 (stacked "The / Gallery", paper on ink) | "Option 4." |
| Original look restored (2026-09-06 tokens and system) + app layer | "Of course I want the old look. That is option 1 for sure." |
| Bottom bar with icons on public pages | "Yes" (reverses B2) |
| Workshops hidden until the first workshop exists (page stays reachable) | "hide" |
| About + Participation + Privacy → one screen, full text folded per row; `/participation` and `/privacy` stay, fed from `Policies.tsx` | "yes"; built in part 2 |
| 16 rendered screens approved, including solid ink bars for Message, Continue and Publish (other actions keep the amber-edged line) | "Approved." |
| The Gallery names no city of its own; a place is only a maker's own field (GAL-OD-04 `amendment_2026_11_09`) | "This is not a Bengaluru centric store. Remove such references if they exist anywhere." |
| Bar: Home · Search · Saved · Studio. Studio → `/studio` if signed in, else `/makers`. No bar on `/work/*`, `/makers/*` subpages, `/studio/works/*` or `/operator`. From 900 px the four sit in the header | board + review |
| GAL-C1 sheet sentence word for word: "You are contacting the maker directly. Payment, delivery, returns and any dispute are arranged with them; The Gallery does not process the transaction." Maker-gallery variant: "You're talking to {first name} directly. Payment, delivery, returns and any dispute are arranged between you; The Gallery takes no part in the sale." | GAL-C1 fixed in meaning |
| The GAL-C1 sentence sits **above** the route rows on the sheet (the board draws it below) | GAL-C1 meaning: first for every reader, screen reader included |
| The sheet's three intent choices stay removed; the message follows the work's status (sold → "one like it", else "this one"); `?intent=` still honoured | "Keep" (2026-11-10) |
| The Email row on the sheet will show the address under "Email" | "Show" (2026-11-10); to land in part 3's PR |
| No "Report a gallery or a work" row on About until a report route exists | nothing to link to (correction 24) |
| No "Newest" beside the count on a maker's gallery | works hang in the maker's own order |
| The maker's head keeps their intro, a public exact address and commissions; the kind label and region/country are dropped | maker's own fields; board |
| On a phone, the work page's header is hidden by a clip, stays a landmark and shows when the keyboard reaches it | journey 07 |
| A sold work keeps "Message {name}" | pre-Wave 5 behaviour |
| Decision C (price "On enquiry" vs status "By enquiry") → later, its own change | governor 2026-11-09 |
| Merged PR #11, #12 and #13 over red CI (`DOCTRINE_READ_TOKEN` unset) | "Merge." / "Yes." / "Merge PR 13" |

## 7. Changed / rejected
- A2 (serif wordmark, sentence-case sans labels, roman lead, filled ink primary everywhere) → original registers restored (mono spaced-capital wordmark and labels, italic serif curator lines with the amber rule, amber-edged actions); solid ink only for the docked action.
- B2 (wordmark + Search + Menu; bar only in the Studio) → the bar of four on every screen; the Menu removed.
- Words-only empty states (`EmptyState`, no plinth) → the plinth is back on the empty home (`Plinth` component).
- Bookmark Save on the work page → a round heart over the photograph (part 2).
- Search button + Clear + hint → one field; results follow the typing (`SearchBox`).
- Saved as a list of names → a picture grid with "N works · on this phone".
- Colophon "The Gallery, Bengaluru" → "The Gallery".
- Demo makers all in Bengaluru → Khurja (Anika Rao), Jaipur (Dhaaga Studio), Moradabad (Kabir Lohar Works), Kolkata (Folded Hours).
- Sheet intent choices ("Ask about this work / Commission something like this / General enquiry") → removed ("Keep").
- Sheet route values (email address, "Message Anika about this work") → row names only; the Email address returns under "Email" ("Show", part 3).
- Maker gallery one-column hang, lead work large from 900 px, "Get in touch" with bare routes → profile head, one Message button opening the sheet, three-across squares.
- About "What The Gallery is", "How it works", "What you won't find here" → the board's three-line lead and folding rows. These sentences are no longer said anywhere: "no advertising", "sells no ranking", "no follower counts, likes or popularity charts".
- The For Makers numbered steps ("Make an account" looked like a button) → to be replaced by the board's screen 7 in part 3.
- Earlier rejections still stand:
  - journeys on the live site; direct Postgres;
  - loading states beyond the entrance;
  - cropped featured image;
  - "Contact" (→ "Message");
  - restoring the old Supabase project;
  - `hero-vessel.jpg` as test imagery;
  - committed implemented PNGs as "before";
  - blaming build load or Wave 5 for timeouts or upload stalls;
  - force-push;
  - claiming "It is free";
  - icon options 1–3.
- ❌ Board's "Available · ₹6,800" on the home label: the fixed rule wins (price only). (On the work page's own label "Available · ₹6,800" is shown, as the board draws it.)
- ❌ An "All" chip on Search (not built; the rail lists only materials with work).

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Live site | https://atthegallery.in (Cloudflare Worker `thegallery`, auto-deploys the default branch within ~1 min) |
| Repo / default branch | `r959qp5qwr-web/Thegallery`, `claude/the-gallery-foundation-7plo1e`, tip `3e1af09` (Merge PR #13) |
| Working branch (session #7) | `claude/exciting-euler-9njd08` at `84b74f7` = `3e1af09` + one receipt commit ("Part 2 receipt: merged and live"). A new session gets its own designated branch: create it from `claude/exciting-euler-9njd08` (or from the default branch and cherry-pick `84b74f7`) |
| Doctrine repo | `r959qp5qwr-web/builders-doctrine`, main `6dc016c485ec…`, version 1.1.0 ACTIVE_PENDING_REPIN |
| Live Supabase | `kemrceegbyizpcfewgri`, publishable `sb_publishable_joD-RqEyX63-Y1CwQSErxg_nuGsUB7N` |
| Test Supabase | `fbgrumcwlnoljkkbiqfe`, URL `https://fbgrumcwlnoljkkbiqfe.supabase.co`, publishable `sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd`, schema `gallery`, bucket `gallery-images` |
| `.env.local` (gitignored, recreate) | `SUPABASE_URL` (test), `SUPABASE_PUBLISHABLE_KEY` (test), `SUPABASE_STORAGE_BUCKET=gallery-images`, `GALLERY_SCHEMA=gallery`, `GALLERY_BASE_URL=http://127.0.0.1:3100` |
| Server start | `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx next start -p 3100` (own background command) |
| Suite command | `bash e2e/run-hosted.sh --project=phone --trace off --reporter=line` (and `--project=desktop`), each its own background command |
| Environment | "The Gallery (with Doctrine)" `env_015jqYRQ2fkV9xhRroHttVvw`; `api.supabase.com` token proxy-injected [secret removed: re-enter it]; reaches the test project only |
| PRs | #10 → `cc28867`; #11 → `8890c52` (head `49e6f4e`); #12 → `ed26f1d` (head `95b1787`); #13 → `3e1af09` (head `82f6c29`, tested code `eb2cf52`) |
| PR #12 proof | build `6GlFOZpa4BS4HQUuI8xVv`; phone 80 passed + 1 skipped; desktop 81 passed; axe 0 on 9 screens; reflow 320 OK |
| PR #13 proof | build `QRdLEjL0sUPlglMRNBfkZ`; phone 90 passed + 1 skipped (24.8 min); desktop 91 passed (24.0 min); axe 0 on 18 states; reflow 320 on 8 pages; controls failed on builds `z9U0wYgyjdf-Q_UKeW29u` and `AC4r1Mi5P3YUW0ThrKPKL` (planted: focus trap removed) |
| PR #13 unexplained | phone run 1 on `QRdL…`: journey 10 "Hang this first" failed at its last step, and a control of journey 10 alone failed the same way; the next control passed 6/6, as did full runs 2 and 3. Cause UNKNOWN. Run 2 was voided by an HTTP 502 from the management API |
| Live checks after PR #13 | app.css has "Drawing board, part 2"; `/about` new lead + 3 rows; `/participation`, `/privacy` 200 with unchanged text; `/`, `/search`, `/saved`, `/makers` 200. NOT SEEN: a work/sheet/maker page with content (live has no published work) |
| Live entrance today | empty (no published works) |
| Test seeds | Maker A `anika.rao@makers.example` / `kiln-and-monsoon-9` (anika-rao, Khurja); Maker B `studio@dhaaga.example` / `warp-and-weft-11` (dhaaga-studio, Jaipur); Operator `operator@thegallery.example` / `operator-of-record-7` |
| Test works | "Monsoon Vessel No. 4" (Maker A, published, Sold in the seed state after journey 03, price exact 6800, 3 images, position 0); "Unfinished Warp" (Maker B). The seed does not reset positions |
| Journeys | 01–12; 91 tests per project (phone 1 skipped) |
| Saved key | localStorage `gallery.saved.v1` |
| Ledger latest | GAL-L0034 |
| Upload limit | `bodySizeLimit: "12mb"`; only JPEG is read (`src/lib/storage.ts`); the picker accepts `image/*` |
| Breakpoints / widths | 600 / 900 px; page max 1200 px; Studio column 760 px; forms ≤ 560 px; `--bar-h` 66 px |
| Spacing scale | `--s1` 4 · `--s2` 8 · `--s3` 16 · `--s4` 24 · `--s5` 32 · `--s6` 48 · `--s7` 64 px |
| Type tokens | wordmark `500 14px` mono, tracking 0.2em, uppercase; display 350 40/48/56; heading 30/34; lead and maker italic 17 serif; label `500 11.5px` mono, tracking 0.14em, uppercase; meta 13 mono; nav 10.5 sans; note italic 19 serif. Also `--t-monument` 350 42/56/72; `--t-caption` 400 13 mono; `--track-display` −0.015em |
| Colours | paper #F8F3EA, paper-deep #F0E9DC, limestone #E7DECF, ink #221E1A, amber #A5501F, amber-deep #8A3F14 (= `--accent-text`, rgb(138, 63, 20)) |
| Artifacts (private) | **Approved board** https://claude.ai/artifact/NhfhLaQztV53zwQpYaho7g · phone-walk checklist https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7 · Wave 5 design pass https://claude.ai/artifact/NrK3jfHcXvEXurUAx5NiVp |
| axe | axe-core 4.10.2 installed in a scratch folder (`npm i axe-core@4.10.2`) and injected with `page.addScriptTag` (not a repo dependency) |

## 9. People, terms & names
- **People:** the user = the Governor.
- **Terms:**
  - "drawing board" = the 2026-11-09 restart: references, screen map, 16 screens, rebuilt in parts 1–3.
  - "part 1/2/3" = the rebuild PRs (#12, #13, next).
  - "app layer" = the block appended to system.css.
  - "docked action" = the one solid ink bar a screen pins at its foot.
  - SYSTEM CHANGE = touches tokens.css or system.css.
  - "phone walk" = the live physical-phone proof of the maker journey.
  - GAL-C1 = the handoff disclosure.
  - GAL-OD-04 = geography.
  - GAL-PR-01 = contact not advertised until a route exists.
  - "Keep" / "Show" = the governor's 2026-11-10 answers (intent choices stay removed / show the email address).
- **Names in use:**
  - Components:
    - `Header` (props `className`, `back`, `share`), `Footer`, `Plinth`, `EmptyState`, `WorkTile` (img carries `data-hero`), `Hero`, `MaterialRail`, `Action` in `src/components/Chrome.tsx`;
    - `ContactSheet` (the Message sheet), `PageTools.tsx` (`BackButton`, `ShareButton`), `SaveButton` (round heart, name "Save" + `aria-pressed`), `Policies.tsx` (`WhoCanOpen`, `WhatWeActOn`, `PrivacyText`), `SheetFocus`, `ViewTransition.tsx` (preloads `data-hero`; sets `window.__galleryMoved`), `SectionNav`, `SearchBox`, `SavedShelf`, `Icon`.
  - Classes: `.roundbtn`, `.photo-tools`, `.header.over-work`, `.header.tools`, `.folds` / `.fold`, `.routes.rows`, `.profile-wall`, `.grid3`, `.tile.sq`, `.flag.gs`, `.about-lead`, `.about-folds`, `.workbar`, `.act.solid` / `.btn.solid`.
  - Test ids: `save-work`, `share`, `back`, `disclosure`, `maker-label`, `no-contact`, `freshness`, `price`, `image-count`.
  - Files:
    - receipts `doctrine/receipts/DRAWING-BOARD-PART1-2026-11-09.md`, `DRAWING-BOARD-PART2-2026-11-09.md`;
    - renders `doctrine/receipts/drawing-board-part2/` (`before/`, `after/`, `sheet-ba-phone.jpg`, `hdr-rest-and-focus.png`, `CHECKLIST.md`);
    - journey `e2e/12-visitor-screens.spec.ts`;
    - this file `doctrine/handoffs/handoff-the-gallery.md`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Drawing board (references, screen map, 16 screens) | approved | `doctrine/receipts/drawing-board/` (screens/index.html, png/01–16, REFERENCES-2026-11-09.md); artifact above | source for part 3 (screens 7–14) |
| Part 1: look + shell (Home, empty Home, Search, Saved, bar) | merged, live | PR #12 | done |
| Part 2: visitor screens (2, 2b, 3, 6) | merged, live | PR #13 → `3e1af09`; receipt PART2 | done; live content screens NOT SEEN (no live work) |
| "Show": the email address under "Email" on the sheet | decided, not built | — | build in part 3's PR; add a test that fails without it |
| Part 3: maker screens (board 7–14) | not started | — | see section 11 |
| Phone walk | paused until part 3 | checklist artifact | update the checklist for the new screens first |
| Journey 10 "Hang this first" flake | UNKNOWN | receipt PART2 | if it recurs, rerun with traces on and keep the trace |
| Report route ("Report a gallery or a work") | not built | — | needs schema + operator queue; its own change |
| Live operator account | unknown | — | needed for the suspension walk |
| CI | red on every PR | needs repo secret `DOCTRINE_READ_TOKEN` | governor to create |

## 11. Next steps
1. **Next action:** on the governor's "Go", start part 3:
   - Orient.
   - Create `.env.local` (section 8), then run `npm ci`.
   - Create this session's branch from `claude/exciting-euler-9njd08`.
   - Read board screens 7–14 in `doctrine/receipts/drawing-board/screens/index.html`, and the current `src/app/makers/*` and `src/app/studio/*`.
2. Build part 3:
   - For Makers (screen 7): pictures first, one docked solid "Open your gallery".
   - Join (8): three short steps (account; name and place; WhatsApp), one question at a time.
   - Check your email (9).
   - Sign in (10).
   - Reset password (11).
   - Studio (12): the gallery as a grid with "+ Add a work" first; a missing step shows as one task.
   - Add a work (13): photos first, choices as taps; size and words further down.
   - Settings (14): one list.
   - Plus "Show": the Email address under "Email" on the sheet.
3. Run the full process (rule 14), then PR #14, "Merge PR #14?", confirm live, fast-forward the branch.
4. Update the phone-walk checklist; then the phone walk, one step at a time; receipt `PHONE-WALK-<date>.md`.
5. Afterwards: the live operator account; `DOCTRINE_READ_TOKEN`; decision C; the report route.

## 12. Open questions ⚠️
1. **`DOCTRINE_READ_TOKEN`:** a fine-grained read-only GitHub token on `builders-doctrine` (Contents: read), saved as a Thegallery repository secret. Done yet? (yes / not yet)
2. **Live operator account:** does one exist on the live project? (yes / no / don't know)
3. **Carried:**
   - R1 "save on pick" vs "draft saved on Save";
   - live migration for "no untitled publish" + "a published work keeps its last image";
   - the "Untitled work" sentinel;
   - uploads over 12 MB lose the typed label;
   - JPEG-only reading vs iPhone HEIC;
   - foundation conflicts §4 vs §10 and §5 vs §11;
   - field-error colour;
   - restore Ahoy and treksfit-prod;
   - rotate the test JWT and the Supabase token after testing;
   - minor review notes from part 2: About's "What we act on" row repeats its inner heading; a cold work page's way home is Back → maker → bar (or the header on keyboard focus).

## 13. Re-attach checklist
- [ ] Nothing has to be attached. This file is committed at `doctrine/handoffs/handoff-the-gallery.md` on `claude/exciting-euler-9njd08` (pushed). Open the new session on `r959qp5qwr-web/Thegallery` with `builders-doctrine` beside it, in environment "The Gallery (with Doctrine)", and point it to this file on that branch (or attach this file).

---
<sub>Audit: 13/13 sections · 23 rules · 29 corrections · 78 data points · secrets removed: yes · generated by active-memory</sub>
