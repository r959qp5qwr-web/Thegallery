# active-memory handoff: The Gallery — drawing board complete (parts 1–3 live); whole-app sweep built, PR #15 next

**Handoff #8** · 2026-11-10 · Lineage:
- **#1 (2026-11-05 → 06):** re-pinned to the new Builders' Doctrine; rebuilt the vanished Supabase project and restored the live site; e2e journeys on a test project; built Wave 1.
- **#2 (2026-11-06):** shipped Wave 1 (PR #4) and Wave 2 (PR #5); ledger GAL-L0019..22.
- **#3 (2026-11-06 → 07):** shipped Wave 3 (PR #6) and Wave 4 (PR #7); ledger GAL-L0023.
- **#4 (2026-11-07 → 09):** governor decisions shipped (PR #8, PR #9); ledger GAL-L0024..25; phone-walk checklist; five-reviewer design review.
- **#5 (2026-11-09):** governor chose A2 / B2 / C-later; design pass approved; app icon option 4; Wave 5 merged (PR #10 → `cc28867`); ledger GAL-L0026..30.
- **#6 (2026-11-09):** Wave 5 judged a regression; drawing board (16 screens) approved; no-city fix PR #11 → `8890c52`; part 1 PR #12 → `ed26f1d`; ledger GAL-L0031..33.
- **#7 (2026-11-09 → 10):** part 2 (visitor screens) PR #13 → `3e1af09`, live; ledger GAL-L0034.
- **#8 (2026-11-10):**
  - Built part 3 (the maker screens 7–14) and "Show"; PR #14 merged on "Yes." → `907e973`, live.
  - Rewrote the phone-walk checklist for the new screens.
  - The governor reviewed the live Participation and Home screens and asked for the root cause plus a mechanism. Built: the whole-app sweep (rules register, journey 14, gate, guard rule SWEEP-1, skill, CLAUDE.md rule 7) and fixed the policy screens and footer.
  - Ledger GAL-L0035..38.
  - Sweep change fully tested (phone 100 passed + 1 skipped, desktop 101 passed, gate OPEN); PR #15 not yet opened.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: Start every reply with exactly "Yes Boss!"
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:**
  - Done: The Gallery (`https://atthegallery.in`) rebuilt to the governor-approved 16-screen drawing board. All three parts are live (PR #12, #13, #14).
  - Now: keep every screen held to every correction the governor has made, through the whole-app sweep. Merge PR #15 (the sweep, its gate and the policy-screen fixes).
  - Then: the phone walk on the governor's Android phone against the live site, one step at a time.
- **Done looks like:**
  - Every page passes the sweep on phone and desktop.
  - Each change goes through the full process (rule 14) and is merged only on the governor's word.
  - The phone walk is complete, with a receipt `PHONE-WALK-<date>.md`.
- **Why it matters (user's words):**
  - "This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of design orientation… be cutting edge."
  - On Wave 5: "The earlier home page was a beautiful display. Which has become like a notebook now. The copy reads very much written by an AI… Like a doctors notebook. Copy is horrible."
  - 2026-11-10: "There are too many issues for me to talk about and most we have already spoken against. So I will not repeat."
  - 2026-11-10: "Can you identify the reason why such issues persist, build a skill to resolve them. Create a hook that scans through the full app, before rendering so that I don't have to bring you back these issues one off. Learn from mistakes, create a mechanism to do so."

## 2. About the user (as relevant to this work)
- Systems-minded wellness entrepreneur and capability designer.
- The **Governor** of products built under the Builders' Doctrine (The Gallery, Ahoy, maa.se, Ustaad, TreksFit, Swasthya…).
- Uses ChatGPT for sense-making, Claude for building, another tool for research.
- Works on an Android phone (Chrome) and an iPad. Reaches the Supabase, Cloudflare and GitHub dashboards in a browser.
- Has installed many design skills and expects them to be used on anything people see.
- Answers tersely: "Yes", "Go.", "Merge.", "Approved.", "Yes, hide, yes", "Merge PR 13, Keep, Show", "Yes.".
- Reviews by sending phone screenshots of the live site.

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
  - Work in layers (architecture → domain → workflow → templates). Containers over tips.
  - Give a few strong options with a recommendation, then treat the choice as fixed. Turn decisions into one-word replies.
  - Ask only when it materially affects design, safety or implementation; otherwise act. Resolve things rather than hand over chores.
  - Show visual decisions as rendered pages or images.
  - Each change set ends with a summary, decisions with a recommendation, and "Merge PR #n?".
  - On long waits, give short progress lines ("The user hasn't heard from you" means: say what you are doing).
  - Phone walk: "One step at a time." Give one step, wait for the result, record it.
  - When the governor sends screenshots and says "identify what's wrong": compare against the board, the corrections and the rules. Fix every instance app-wide, not only the one shown, and add a rule for it (skill `gallery-app-sweep`).
- **Avoid:**
  - reopening settled decisions;
  - vague best practices;
  - claiming green without a receipt;
  - asking for secrets in chat;
  - naming a cause before testing it;
  - calling a design reviewed when no design skill was run;
  - settling a FIXED or OPEN decision through copy or visuals;
  - machine-sounding copy: "quiet", "not X, not Y" lists, doubled negatives ("we do not …, and we do not …"), groups of three, abstract nouns;
  - sentences set in monospace;
  - document-style pages (walls of prose).

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
   - PR #7–#10: "Yes."
   - PR #11: "Merge."
   - PR #12: "Yes."
   - PR #13: "Merge PR   13, Keep, Show"
   - PR #14: "Yes."
9. "the design system has to be adhered to" (user).
   - `public/gallery/tokens.css` and `system.css` must be byte-identical to `ux/reference/interface/`; journey 11 enforces it.
   - App styling goes in `public/gallery/app.css`.
   - Tokens and system changes are SYSTEM CHANGES and need the governor's word.
10. Journeys only touch the test project; `e2e/helpers.ts` refuses the live project and site.
11. Secrets go only through the environment's secure form, never in chat.
12. Never test a server whose served page lacks the current `.next/BUILD_ID` (`e2e/run-hosted.sh` enforces it).
13. Run one journey suite at a time (runner lock; a second run exits 3).
    - Nothing heavy (a build, renders) beside a suite.
    - Each suite is its own background command with timeout 3600000.
    - **Start `next start -p 3100` as its own background command with timeout 7200000.** It is killed at 2 h; restart it when needed.
    - A run without a summary line and an exit code is "no result".
    - **Read a suite's result from its summary line ("N passed / N failed / N did not run"), never from a wrapper's exit code** (GAL-L0037).
14. Every change set needs all of the following:
    - full suite, phone and desktop (journey 14, the whole-app sweep, runs inside it);
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
18. FIXED decisions keep their meaning whatever a drawing shows. Wording may be refined, never the meaning (GAL-C1, account boundary "created or materially produced", GAL-P1, P-11, GAL-PR-02, GAL-OD-04, GAL-OD-02/03/15).
19. Each new or changed test must be able to fail. Prove it, for example with a planted defect and a rebuild (or the build before the fix as the control).
20. Before restoring a file from history, list the rules added after that point and carry each one forward or drop it on purpose (GAL-L0033).
21. A design review compares rendered screens against named external references and the original foundation, and lists what each change removes (GAL-L0031).
22. A subset run of the journeys must include the journeys whose fixtures it reads (03 marks the seeded work Sold; 04 leaves the failed image), or it is reported as indicative only. The full suite is the receipt (GAL-L0034).
23. The `ui-consistency:verifying` check uses a separate agent, calibrated first on a copy with one planted difference, which it must find by reading, not by diffing.
24. **CLAUDE.md standing rule 7 (new):** "Every screen is held to every correction the governor has made, on every page: before showing the governor any screen or opening a pull request, the whole-app sweep must pass (`e2e/14-whole-app.spec.ts`, rules in `ux/APP_RULES.json`, gate `scripts/app-sweep-gate.py`). Each new correction becomes a rule first, proved to fail, then every flagged page is fixed. The routine is `.claude/skills/gallery-app-sweep/SKILL.md`; read it when the governor corrects a screen."
25. Never delete or loosen an `APP_RULES` rule to make a sweep pass. A wrong rule changes on the governor's word, recorded in the ledger.
26. After an interrupted suite (for example a container restart), check that the shared journey works are as a finished run leaves them (Monsoon Sold, "Unfinished Warp" retired) before trusting the next run, or re-run (GAL-L0037).

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
| 30 | Part 3: moving email confirmation into a route handler made a forwarded link sign the opener into the sender's account (the review caught it) | The link signs in only the browser that began joining (hashed `gallery_join` cookie); elsewhere it confirms and asks to sign in (GAL-L0035) |
| 31 | Part 3: a colour check read the hover state left by a tap (false red) | Move the pointer away and use the retrying `toHaveCSS` (GAL-L0036) |
| 32 | Part 3: nearly reported a red desktop run as green from a wrapper's exit code; an interrupted run had left shared test data published | Read the summary line; check the shared fixtures after an interruption (GAL-L0037) |
| 33 | Reviews and renders covered only each change's own screens; /participation, /privacy and the footer kept old faults the governor had already rejected | The whole-app sweep on every page, rules from every correction, a gate before PRs, and the learning loop (GAL-L0038) |
| 34 | In the sweep change, Claude wrote a new doubled negative ("We don't rate the work, and we don't check…"; later "no visitor account, and no tracking") | The sweep caught it; never write that pattern; rule R03 |

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
| Bottom bar with icons: Home · Search · Saved · Studio. Studio → `/studio` if signed in, else `/makers`. No bar on screens that dock their own action: `/work/*`, `/makers`, `/makers/*`, `/studio/works/*`, `/studio/join`, `/studio/whatsapp`; none on `/operator`. From 900 px the four sit in the header | board + review |
| Workshops hidden until the first workshop exists (page stays reachable) | "hide" |
| About + Participation + Privacy → one screen, full text folded per row; `/participation` and `/privacy` stay (now About's rows opened out, Back to `/about`), fed from `Policies.tsx` | "yes"; reworked 2026-11-10 |
| Footer (colophon) = "The Gallery · About" (on About, the name only) | board; governor review 2026-11-10 |
| 16 rendered screens approved, including solid ink bars for Message, Continue and Publish (other actions keep the amber-edged line) | "Approved." |
| The Gallery names no city of its own (GAL-OD-04 `amendment_2026_11_09`) | governor |
| GAL-C1 sheet sentence word for word: "You are contacting the maker directly. Payment, delivery, returns and any dispute are arranged with them; The Gallery does not process the transaction." Maker-gallery variant: "You're talking to {first name} directly. Payment, delivery, returns and any dispute are arranged between you; The Gallery takes no part in the sale." Sits **above** the route rows | GAL-C1 fixed in meaning |
| Sheet intent choices stay removed; the message follows the work's status; `?intent=` still honoured | "Keep" |
| The sheet's Email row shows the address under "Email" (built in part 3) | "Show" |
| Part 3 departures from the board (fixed decisions win): join step 2 asks "How you work" (GAL-OD-02/03); Studio tiles keep the J-003 status chip; Add a work keeps price-mode taps (decision C open); Settings has "Close account"; For Makers pictures = works on view or the empty plinth | rule 18 |
| Confirmation link = GET route handler `src/app/makers/confirm/[token]/route.ts`; signs in only when the `gallery_join` cookie (SHA-256 of the address, set at step 1, 3 days) matches; else deletes the new session cookies and redirects to `/makers/sign-in?confirmed=1` | GAL-L0035 |
| Gallery address made from the name at step 2 (`handleFrom`), retries `-2`…`-5` then a random suffix | part 3 |
| Whole-app sweep mechanism (rules, journey 14, gate, SWEEP-1, skill, CLAUDE.md rule 7) | governor 2026-11-10 request |
| Decision C (price "On enquiry" vs status "By enquiry") → later, its own change; now visible: "Made to order" appears in both Status and Price on Add a work | governor 2026-11-09 |
| Merged PR #11–#14 over red CI (`DOCTRINE_READ_TOKEN` unset) | governor's words per PR |

## 7. Changed / rejected
- A2 (serif wordmark, sentence-case labels, filled ink primary everywhere) → original registers restored; solid ink only for the docked action.
- B2 (bar only in the Studio) → the bar of four on every screen; the Menu removed.
- Words-only empty states → the plinth is back on the empty home.
- Bookmark Save → a round heart over the photograph.
- Search button + Clear + hint → one field; results follow the typing.
- Saved as a list → a picture grid with "N works · on this phone".
- Colophon "The Gallery, Bengaluru" → "The Gallery" → now "The Gallery · About".
- Demo makers all in Bengaluru → Khurja, Jaipur, Moradabad, Kolkata.
- Sheet intent choices → removed ("Keep").
- Sheet route values → row names only, except the Email address under "Email" ("Show", built).
- Maker gallery one-column hang → profile head, one Message button, three-across squares.
- About's old sections → the board's three-line lead and folding rows.
- For Makers numbered steps → board screen 7 (pictures, three lines, docked "Open your gallery").
- Join: account page + "Set up your gallery" steps + long profile form → three steps (account; name, place, how you work; WhatsApp, skippable).
- Studio list rows + "Your details / Ways to contact you / Account" links → grid with "Add a work" first, one task, SETTINGS in the header; Settings list over the old detail pages.
- Confirmation page "Your email is confirmed. Sign in" → route handler straight to step 2.
- "Fair use of The Gallery" page, footer links to Participation and Privacy, mono sentences, the long Privacy paragraph → About-style policy screens (2026-11-10).
- Policy wording "can be restored… reinstated" (unconditional) → "most can be reversed: a take-down restored, a suspension lifted".
- A repo-only Claude hook as the enforcement → rejected as insufficient (project hooks don't load when the session opens on the parent folder); the suite is the topology-independent chokepoint.
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
  - icon options 1–3;
  - "Report a gallery or a work" row before a report route exists;
  - the board's sample photographs on For Makers.
- ❌ Board's "Available · ₹6,800" on the home label: the fixed rule wins (price only).
- ❌ An "All" chip on Search.

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Live site | https://atthegallery.in (Cloudflare Worker `thegallery`, auto-deploys the default branch within ~1 min) |
| Repo / default branch | `r959qp5qwr-web/Thegallery`, `claude/the-gallery-foundation-7plo1e`, tip `907e973` (Merge PR #14) |
| Working branch (session #8) | `claude/continue-wfrmif`, head `4762104` (receipt draft), tested code `b223f75`. A new session gets its own designated branch: create it from `claude/continue-wfrmif` |
| Doctrine repo | `r959qp5qwr-web/builders-doctrine`, main `6dc016c485ec…`, version 1.1.0 ACTIVE_PENDING_REPIN |
| Live Supabase | `kemrceegbyizpcfewgri`, publishable `sb_publishable_joD-RqEyX63-Y1CwQSErxg_nuGsUB7N` |
| Test Supabase | `fbgrumcwlnoljkkbiqfe`, URL `https://fbgrumcwlnoljkkbiqfe.supabase.co`, publishable `sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd`, schema `gallery`, bucket `gallery-images` |
| `.env.local` (gitignored, recreate) | `SUPABASE_URL` (test), `SUPABASE_PUBLISHABLE_KEY` (test), `SUPABASE_STORAGE_BUCKET=gallery-images`, `GALLERY_SCHEMA=gallery`, `GALLERY_BASE_URL=http://127.0.0.1:3100` |
| Server start | `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx next start -p 3100` (own background command) |
| Suite command | `bash e2e/run-hosted.sh --project=phone --trace off --reporter=line` (and `--project=desktop`), each its own background command |
| Environment | "The Gallery (with Doctrine)" `env_015jqYRQ2fkV9xhRroHttVvw`; `api.supabase.com` token proxy-injected [secret removed: re-enter it]; reaches the test project only |
| PRs | #12 → `ed26f1d`; #13 → `3e1af09`; #14 → `907e973` (head `ced5abc`, tested code `beb2365`, build `UhdkxbzpibZovSIAXEp2u`) |
| PR #14 proof | phone 98 passed + 1 skipped (27.4 min); desktop 99 passed (25.3 min; an earlier desktop run 96 passed, 1 failed, 2 did not run, after a container restart, GAL-L0037); 8/8 journey 13 controls failed under planted defects; axe 0 on 15 states; reflow 320 on 13 pages |
| Sweep change (PR #15, not opened) | build `Uowbq2yNGbEZJtp4r91Gu`, code `b223f75`: phone **100 passed, 1 skipped**, suite exit 0 (28.9 min); desktop **101 passed**, suite exit 0 (27.0 min); sweep receipts PASS 27/27 pages, 12 rules, both projects; gate OPEN (SEEN in the old container; the receipts live in gitignored `.doctrine/runtime/` and do not carry over) |
| Sweep control on live code | FAIL with findings on 15 of 27 pages (every issue in the governor's screenshots plus Privacy 94-word paragraph, mono sentences on Close account and operator pages) |
| Pages swept | 27 (`src/app/**/page.tsx`) |
| Test seeds | Maker A `anika.rao@makers.example` / `kiln-and-monsoon-9` (anika-rao, Khurja); Maker B `studio@dhaaga.example` / `warp-and-weft-11` (dhaaga-studio, Jaipur); Operator `operator@thegallery.example` / `operator-of-record-7` |
| Test works | "Monsoon Vessel No. 4" (Maker A, published, Sold after journey 03, price 6800, 3 images); "Unfinished Warp" (Maker B, retired after a full run) |
| Journeys | 01–14; phone 101 tests (100 passed + 1 skipped); journey 13 = maker screens, journey 14 = whole-app sweep |
| Ledger latest | GAL-L0038 |
| Upload limit | `bodySizeLimit: "12mb"`; only JPEG is read; picker accepts `image/*`; new-work takes one photo, more on the work page |
| Breakpoints / widths | 600 / 900 px; page max 1200 px; Studio column 760 px; forms ≤ 560 px; `--bar-h` 66 px |
| Spacing scale | `--s1` 4 · `--s2` 8 · `--s3` 16 · `--s4` 24 · `--s5` 32 · `--s6` 48 · `--s7` 64 px |
| Colours | paper #F8F3EA, paper-deep #F0E9DC, limestone #E7DECF, ink #221E1A (rgb(34, 30, 26)), ink-soft = hover rgb(61, 54, 48), amber #A5501F, amber-deep #8A3F14 (rgb(138, 63, 20)) |
| Artifacts (private) | Approved board https://claude.ai/artifact/NhfhLaQztV53zwQpYaho7g · phone-walk checklist (v2, part 3 screens, localStorage key `gallery-walk-v2`) https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7 · Wave 5 design pass https://claude.ai/artifact/NrK3jfHcXvEXurUAx5NiVp |
| axe | axe-core 4.10.2 in a scratch folder, injected with `page.addScriptTag` (not a repo dependency) |

## 9. People, terms & names
- **People:** the user = the Governor.
- **Terms:**
  - "drawing board" = the 2026-11-09 restart; 16 screens; parts 1–3 (PR #12, #13, #14), all live.
  - "docked action" = the one solid ink bar a screen pins at its foot (`.workbar` / `.workbar.dock` + `.btn.solid`).
  - "the sweep" = journey 14, the whole-app check; "the gate" = `scripts/app-sweep-gate.py`; SWEEP-1 = the guard rule.
  - "phone walk" = the live physical-phone proof of the maker journey.
  - SYSTEM CHANGE = touches tokens.css or system.css.
  - GAL-C1 = the handoff disclosure; GAL-OD-04 = geography; GAL-OD-02/03/15 = who, admission, moderation.
  - "Keep" / "Show" = the governor's 2026-11-10 answers.
- **Names in use:**
  - New/changed in session #8:
    - Components: `ActionForm` (`dock` option with `name`/`value`/`otherBusy`/`extra`, `id`); `Header` (`step`); `StudioHeader` (`end`, `lead`); `Footer` (`here="about"`); `Segmented` (`pick`, help as group description); `PhotoTiles`; `DraftButton`; `Policies.tsx` (`WhoCanOpen`, `WhatWeActOn`, `PrivacyText`).
    - Pages: `src/app/studio/join`, `src/app/studio/whatsapp`, `src/app/studio/settings`, `src/app/makers/confirm/[token]/route.ts`.
    - Actions: `joinAction`, `saveWhatsappAction`, `addRoute`.
    - Classes: `.flow`, `.studio-wall`, `.studio-tile`, `.task`, `.setrows`, `.seg.pick`, `.policy`, `.policy-page`, `.rowlist .secondary.sentence`.
    - Test ids: `task`, `fm-pictures`, `plinth-slot`, `route-email`.
  - Mechanism files: `ux/APP_RULES.json` (R01–R12), `e2e/14-whole-app.spec.ts`, `scripts/app-sweep-gate.py`, `scripts/doctrine-hook.py` (SWEEP-1, `sweep_gate`), `.claude/skills/gallery-app-sweep/SKILL.md`, CLAUDE.md rule 7. Receipts written to `.doctrine/runtime/app-sweep-<project>.json`; pictures to `test-results/app-sweep/<project>/`.
  - Receipts:
    - `doctrine/receipts/DRAWING-BOARD-PART3-2026-11-10.md` (+ `drawing-board-part3/before|after|CHECKLIST.md`)
    - `doctrine/receipts/WHOLE-APP-SWEEP-2026-11-10.md` (phone and desktop recorded; + `policy-screens/before|after`)
  - This file: `doctrine/handoffs/handoff-the-gallery.md`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Drawing board parts 1–3 | merged, live | PR #12, #13, #14 → `907e973` | live signed-in screens NOT SEEN (phone walk) |
| Whole-app sweep + policy screens + footer | built, tested, not merged | branch `claude/continue-wfrmif` (code `b223f75`) | phone and desktop suites passed; re-render policy screens (copy changed after the last render); axe on the policy screens; PR #15 |
| Session-level sweep hook | written at `/workspace/.claude/settings.json` (this container only) | — | ephemeral; loading UNKNOWN; the durable route is a plugin (not built) |
| Phone-walk checklist | updated (v2) | artifact above | walk paused at step 1 (get ready); the governor sent the review screenshots instead of "Ready" |
| Journey 10 "Hang this first" flake | UNKNOWN, not seen since | receipt PART2 | if it recurs, rerun with traces on |
| Report route | not built | — | needs schema + operator queue |
| Live operator account | unknown | — | needed for the suspension walk |
| CI | red on every PR | needs repo secret `DOCTRINE_READ_TOKEN` | governor to create |

## 11. Next steps
1. **Next action:** set up the new session, then re-run both suites so the gate has receipts in the new container (both passed in the old one; receipts don't carry over):
   - Orient.
   - Recreate `.env.local` (section 8) and run `npm ci`.
   - Create this session's branch from `claude/continue-wfrmif`.
   - `npx next build`, then start the server.
   - Run the phone suite, then the desktop suite (each its own background command).
2. Re-render the policy screens: `node render-policy.cjs` writes to `doctrine/receipts/policy-screens/after`. The script was in the old scratchpad; rewrite it: Home, empty Home with works taken down in `finally`, About closed and open, Participation, Privacy, phone and desktop.
3. Run axe and keyboard on /about, /participation, /privacy and add them to `WHOLE-APP-SWEEP-2026-11-10.md`. `python3 scripts/app-sweep-gate.py` must say OPEN.
4. Open PR #15 and read the red CI log; then "Merge PR #15?". After the merge: confirm live, fast-forward the branch.
5. Resume the phone walk at step 1 (get ready), one step at a time.
6. Afterwards:
   - a published appeal address (GAL-OD-15);
   - a plugin so the sweep gate follows into every session;
   - a drill case for SWEEP-1;
   - decision C;
   - `DOCTRINE_READ_TOKEN`;
   - the live operator account;
   - the report route;
   - a server-side create key for works;
   - a "Continue" tap before confirming, so email scanners can't spend the link.

## 12. Open questions ⚠️
1. **`DOCTRINE_READ_TOKEN`:** a fine-grained read-only GitHub token on `builders-doctrine` (Contents: read), saved as a Thegallery repository secret. Done yet? (yes / not yet)
2. **Live operator account:** does one exist on the live project? (yes / no / don't know)
3. **Sweep plugin:** package the sweep gate as a plugin on your account so it runs in every new session? (yes / later)
4. **Carried:**
   - R1 "save on pick" vs "draft saved on Save";
   - live migration for "no untitled publish" + "a published work keeps its last image";
   - the "Untitled work" sentinel;
   - uploads over 12 MB lose the typed label;
   - JPEG-only reading vs iPhone HEIC;
   - foundation conflicts §4 vs §10 and §5 vs §11;
   - field-error colour;
   - restore Ahoy and treksfit-prod;
   - rotate the test JWT and the Supabase token after testing;
   - decision C (now visible on Add a work);
   - an email scanner can spend the confirmation link (pre-existing);
   - a retried Publish could create a second work (needs a schema change).

## 13. Re-attach checklist
- [ ] Nothing has to be attached. This file is committed at `doctrine/handoffs/handoff-the-gallery.md` on `claude/continue-wfrmif`. Open the new session on `r959qp5qwr-web/Thegallery` with `builders-doctrine` beside it, in environment "The Gallery (with Doctrine)", and point it to this file on that branch (or attach this file).

---
<sub>Audit: 13/13 sections · 26 rules · 34 corrections · 92 data points · secrets removed: yes · generated by active-memory</sub>
