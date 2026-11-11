# active-memory handoff: The Gallery — Interface Standard live (PR #15, #16); phone walk next

**Handoff #9** · 2026-11-11 · Lineage:
- **#1 (2026-11-05 → 06):** re-pinned to the new Builders' Doctrine; rebuilt the vanished Supabase project; e2e journeys on a test project; built Wave 1.
- **#2 (2026-11-06):** Wave 1 (PR #4) and Wave 2 (PR #5); ledger GAL-L0019..22.
- **#3 (2026-11-06 → 07):** Wave 3 (PR #6) and Wave 4 (PR #7); ledger GAL-L0023.
- **#4 (2026-11-07 → 09):** governor decisions (PR #8, #9); ledger GAL-L0024..25; phone-walk checklist; five-reviewer design review.
- **#5 (2026-11-09):** A2 / B2 / C-later; design pass approved; app icon option 4; Wave 5 merged (PR #10); ledger GAL-L0026..30.
- **#6 (2026-11-09):** Wave 5 judged a regression; drawing board (16 screens) approved; PR #11, #12; ledger GAL-L0031..33.
- **#7 (2026-11-09 → 10):** part 2 (visitor screens) PR #13; ledger GAL-L0034.
- **#8 (2026-11-10):** part 3 (maker screens) PR #14; whole-app sweep built; ledger GAL-L0035..38.
- **#9 (2026-11-10 → 11):**
  - PR #15 merged (sweep + policy screens; fixes from the design reviews; R03 widened).
  - The governor stopped all work over Join step 2 and asked for a mechanism. Built: the **Interface Standard**, which measures every screen state against sourced numbers. Hardened through two independent reviews and a self-test drill.
  - System change applied (larger type, roomier forms, Back everywhere).
  - PR #16 merged and live.
  - Ledger GAL-L0039..42; Doctrine candidate drafted.

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
  - The Gallery (`https://atthegallery.in`), an artists' portal, built to the governor-approved drawing board. Every screen is held to:
    - every governor correction (the whole-app sweep);
    - the measured Interface Standard.
  - Now: the phone walk on the governor's Android phone against the live site, one step at a time.
- **Done looks like:**
  - Every change goes through the full process (rule 14) and the gate.
  - The governor no longer finds interface faults by eye. Any that slip through are traced and fixed at the layer that missed them.
  - The phone walk is complete, with a receipt `PHONE-WALK-<date>.md`.
- **Why it matters (user's words):**
  - "This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of design orientation… be cutting edge."
  - 2026-11-10, on Join step 2: "How does one go back from this page? Also, the use of space looks off. Items too cramped together. Fonts too small."
  - "Why does it feel like you doing this off the fly… Give me a mechanism level solution, that's replicable, rigid, and learns from itself, and can be applied elsewhere too… Pause anything and everything to fix this now. Take my words seriously. You can't just bypass and do a low effort solution again."
  - On the recommendations: "I will go by your recommendations. Do the most reliable thing."

## 2. About the user (as relevant to this work)
- Systems-minded wellness entrepreneur and capability designer.
- The **Governor** of products built under the Builders' Doctrine (The Gallery, Ahoy, maa.se, Ustaad, TreksFit, Swasthya…).
- Uses ChatGPT for sense-making, Claude for building, another tool for research.
- Works on an Android phone (Chrome) and an iPad. Reaches the Supabase, Cloudflare and GitHub dashboards in a browser.
- Has installed many design skills and expects them to be used on anything people see.
- Answers tersely: "Yes", "Go.", "Merge.", "Approved.", "Yes.", "Continue."
- Reviews by sending phone screenshots of the live site.
- Says interface problems have recurred "with all the app[s] that I build with you"; wants mechanisms that carry across products.

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
  - Layers (architecture → domain → workflow → templates). Containers over tips.
  - Give a few options with a recommendation, then treat the choice as fixed; turn decisions into one-word replies.
  - Ask only when it materially affects design, safety or implementation. Resolve things rather than hand over chores.
  - Show visual decisions as rendered pages or images.
  - Each change set ends with a summary, decisions, and "Merge PR #n?".
  - On long waits, give short progress lines.
  - Phone walk: "One step at a time."
  - When the governor sends a screen with a fault: follow `.claude/skills/interface-standard/SKILL.md` and `.claude/skills/gallery-app-sweep/SKILL.md`.
    - Measure the state.
    - Classify the escape (C1 coverage / C2 measure / C3 standard / C4 judgement).
    - Fix the layer first with a failing control.
    - Then fix every flagged state, app-wide.
- **Avoid:**
  - reopening settled decisions;
  - vague best practices;
  - claiming green without a receipt;
  - asking for secrets in chat;
  - naming a cause before a control run;
  - calling a design reviewed when no design skill was run;
  - settling a FIXED or OPEN decision through copy or visuals;
  - machine-sounding copy: "quiet", "not X, not Y" or "not X, or not Y" lists, doubled negatives, groups of three, abstract nouns;
  - sentences in monospace;
  - document-style pages;
  - shrinking type or spacing to make things fit.

## 4. Hard rules (word for word)
1. "Never write to `builders-doctrine`. The guard denies it; the rule stands without the guard."
2. "Work on a branch; the default branch is merged through review."
3. "No real person's art, address, phone number or email in fixtures, screenshots or tests." Third-party reference screenshots stay out of the repository, in the scratchpad.
4. "Report what was SEEN, NOT SEEN and UNKNOWN. A green claim needs a receipt."
5. "An indeterminate verdict is a denial."
6. "Read `active_stage.next_acceptance_condition` in `PRODUCT_STATE.json` before building anything. Do not silently settle an OPEN decision through code."
7. Run `python3 scripts/doctrine-orient.py orient` first, and again before a commit that follows governing-state changes (the pre-commit gate refuses otherwise).
8. "No merge, deployment, purchase or schedule is authorized" unless the user says so. Merges are authorised case by case:
   - PR #4–#14: as recorded in earlier handoffs;
   - PR #15: "Yes.";
   - PR #16: "Yes."
9. "the design system has to be adhered to" (user).
   - `public/gallery/tokens.css` and `system.css` must be byte-identical to `ux/reference/interface/`; journey 11 enforces it. Copy both whenever either changes.
   - App styling goes in `public/gallery/app.css`.
   - Token and system changes are SYSTEM CHANGES and need the governor's word.
10. Journeys only touch the test project; `e2e/helpers.ts` refuses the live project and site.
11. Secrets go only through the environment's secure form, never in chat.
12. Never test a server whose served page lacks the current `.next/BUILD_ID` (`e2e/run-hosted.sh` enforces it).
13. Running suites:
    - Run one journey suite at a time (runner lock). Nothing heavy beside a suite.
    - Each suite is its own background command with timeout 3600000.
    - Start `next start -p 3100` as its own background command with timeout 7200000. It dies at 2 h, so restart it before a 35-minute suite if it has run for more than about 80 minutes.
    - Read results from the summary line, never from a wrapper's exit code.
14. Every change set needs all of the following:
    - full suite, phone and desktop;
    - independent review (builder-reviewer);
    - design skills run and named;
    - axe, keyboard and reflow checks;
    - before/after renders;
    - a receipt `doctrine/receipts/…md`;
    - a ledger entry per incident;
    - a PR;
    - merge only on the user's word;
    - live confirmed afterwards.
15. Before merging:
    - a clean tree;
    - the PR head is the tested head (merge with `expectedHeadSha`);
    - the red CI log has been read and confirmed to be only `DOCTRINE_READ_TOKEN` unset, and the merge message says so;
    - the Cloudflare "Workers Builds" check is green.
16. After a merge, fast-forward the working branch to the default branch (`git merge --ff-only`, then push). Never force-push.
17. A Stop hook refuses to end a turn with uncommitted or untracked files: commit and push before ending each turn.
18. FIXED decisions keep their meaning whatever a drawing shows (GAL-C1, GAL-P1, P-11, GAL-PR-02, GAL-OD-04, GAL-OD-02/03/15).
19. Each new or changed test must be able to fail. Prove it with a planted defect or a control build.
20. Before restoring a file from history, list the rules added after that point and carry each forward or drop it on purpose.
21. A design review compares rendered screens against named external references and lists what each change removes.
22. A subset run that skips fixture-producing journeys (03, 04) is indicative only; the full suite is the receipt.
23. `ui-consistency:verifying` uses a separate agent, calibrated first on a copy with one planted difference, found by reading.
24. CLAUDE.md standing rule 7: the whole-app sweep (journey 14, `ux/APP_RULES.json`) must pass before showing any screen or opening a PR. Each correction becomes a rule, proved to fail.
25. Never delete or loosen an `APP_RULES` rule or an Interface Standard rule to pass. A wrong rule changes on the governor's word, recorded in the ledger or `ESCAPES.md`.
26. After an interrupted suite, check the shared fixtures ("Monsoon Vessel No. 4" Sold; "Unfinished Warp" retired), or let a full run reset them.
27. **CLAUDE.md standing rule 8 (new):**
    - Every screen state is measured against the Interface Standard (`kit/interface-standard`) by `e2e/15-interface-standard.spec.ts`. Every state, with its archetype, is listed in `ux/INTERFACE_PROFILE.json`.
    - Before building or changing a screen, and whenever anyone finds an interface fault, follow `.claude/skills/interface-standard/SKILL.md`.
    - "Never shrink type or spacing to fit, and never loosen a rule to pass."
28. **Build with `npm run build`, never `npx next build`.** Its postbuild stamps `.next/SOURCE_FINGERPRINT`. The gate is SHUT for a build not stamped with the current code.
29. **The gate** (`python3 scripts/app-sweep-gate.py`) needs four PASS receipts per viewport on this code: suite, app-sweep, interface, interface-drill.
    - `e2e/run-hosted.sh` writes the suite receipt only after a full, unfiltered run whose Playwright exit code is 0.
30. A new screen state goes into `ux/INTERFACE_PROFILE.json` before it is built. A redirect is never an exemption.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Said The Gallery had "no deployment yet" | It was live; check all branches first |
| 2 | Kept handing the user manual steps | "Just resolve it now…" |
| 3 | Only ran functional journeys | Always review design against `ux/INTERFACE_FOUNDATION.md` too |
| 4 | First design pass used one lens | Comprehensive review with all design skills, artist-first |
| 5 | User pasted a Supabase token in chat | Never use it; secrets only via the secure form |
| 6 | Reported 62/62 against a stale `next-server` | Always verify the served BUILD_ID (GAL-L0018) |
| 7 | Seeded extra works, breaking journeys | Seed clears works no journey creates |
| 8 | Wave 1 claims written from intent | Each claim needs a journey that fails without it |
| 9 | Let two suite runs overlap | Never; runner lock |
| 10 | `overflow-x: clip` on `<html>` | No layout-affecting rule for decoration |
| 11 | Loading states broke 404/307 | Loading state on the entrance only |
| 12 | Render caption hard-coded an old build ID | Label evidence with the build actually rendered |
| 13 | Ran a build beside a suite, then blamed load | Never; name a cause only after a control run |
| 14 | `cd` + `rm -rf *` in one command | Unpack into a new `mktemp -d` folder |
| 15 | Tile class `lead` collided | Check class names; test inner layout |
| 16 | Chained suites in one background command | One suite per background command |
| 17 | Counted words with `innerText` on uppercase | Read `textContent`; tests must be able to fail |
| 18 | Tried `git push -f` after a merge | Fast-forward; plain push |
| 19 | Shipped waves 1–4 without design skills | Run design skills on every human-facing change |
| 20 | Design pass dropped GAL-C1 meaning | Keep a FIXED decision's meaning |
| 21 | Price-only tiles narrowed P-11 | Tiles keep every status but "Available" |
| 22 | Reference copies drifted | Copy at the end; byte-identity journey |
| 23 | Bare `cat` reading stdin | Never |
| 24 | Wave 5: rule-based checks stripped character; AI-sounding copy | Old look; real references; terse copy; nothing that looks tappable but isn't |
| 25 | Site named Bengaluru as The Gallery's city | "This is not a Bengaluru centric store. Remove such references if they exist anywhere." |
| 26 | Restoring system.css dropped later rules | Carry later rules forward |
| 27 | Heredocs with JS tripped the shell safety check | Write scripts with the Write tool; servers as own background command |
| 28 | Hid a header with `display:none`, removing the banner landmark | Keep landmarks; hide visually |
| 29 | A scratch script crashed and left test rows | Clean up in `finally` |
| 30 | A forwarded confirmation link signed the opener in | Link signs in only the browser that began joining (GAL-L0035) |
| 31 | Colour check read a hover state | Move the pointer away; retrying `toHaveCSS` |
| 32 | Nearly reported red from a wrapper exit code | Read the summary line |
| 33 | Reviews covered only each change's own screens | Whole-app sweep, rules from every correction (GAL-L0038) |
| 34 | Wrote a doubled negative in the sweep change | Never; rule R03 |
| 35 | About's policy headings h1→h3 (axe heading-order) | Fixed to h2 (GAL-L0039) |
| 36 | R03 missed "not X, or not Y" | R03 widened, proved on the old copy (GAL-L0040) |
| 37 | Join step 2 shipped with no Back, 13 px labels and 24 px field gaps; the governor caught it by eye again | A measured standard on every state; escapes fixed at their layer (GAL-L0041) |
| 38 | The first Interface Standard could pass bad screens (21 holes found by two reviews) | Fail-closed engine, policed profile, exact drill, stamped builds (GAL-L0042) |
| 39 | The gate opened while the full suite was red | Suite receipt required beside the others |

## 6. Decisions
| Decision | Why |
|---|---|
| Doctrine pin `6dc016c485ec1ddf31163534d84e02e0f74772f0` | user |
| Live Supabase `thegallery` (`kemrceegbyizpcfewgri`); journeys on `thegallery-test` (`fbgrumcwlnoljkkbiqfe`) | user |
| Vocabulary: work · maker · gallery · Studio · The Gallery · on view · retired · taken down · ways to contact; "By enquiry", "Not for sale" | Wave 3 |
| Price rule (`labelPrice`): no price beside Sold or Not for sale; tiles show every status but "Available" | governor; P-11 / GAL-PR-02 |
| Tile→hero morph; "Hang this first" | governor |
| App icon option 4 | "Option 4." |
| Original look restored (2026-09-06 tokens and system) + app layer | governor |
| Bottom bar Home · Search · Saved · Studio; none on screens that dock their own action; from 900 px in the header | board |
| Workshops hidden until the first workshop exists (page reachable) | "hide" |
| About + Participation + Privacy as one screen; `/participation`, `/privacy` stay | governor |
| Footer (colophon) = "The Gallery · About" (on About, the name only); no Privacy link added back | governor 2026-11-10; not reopened |
| GAL-C1 sheet sentence word for word, above the route rows | fixed |
| The Gallery names no city of its own | GAL-OD-04 |
| Whole-app sweep (rules, journey 14, gate, SWEEP-1, skill, rule 7) | governor |
| **Interface Standard** (`kit/interface-standard`, profile, journeys 15–16, gate, guard, skill, rule 8, ESCAPES.md) | governor 2026-11-10: "mechanism level solution" |
| **SYSTEM CHANGE approved:** `--t-field-label` 16 px; `--t-label` 12; `--t-nav` 12; `--t-meta` 14; `--t-caption` 14; `--bar-h` 64; `.field` 32 px apart; help 8 px under its field; `.small`, `.disclosure`, `.band p`, row sentences at body size; spacing on the 4 px grid; failure band 4 px edge, announced as an alert | "I will go by your recommendations. Do the most reliable thing." |
| **Standard → Doctrine via option A** (candidate drafted; only the governor promotes) | same words |
| **Back on every non-top-level state at every width.** Join step 2 → `/makers`; step 3 → `/studio/profile`; Browse → `/search`; Workshops, For Makers, 404 → `/`; the work page header carries Back from 900 px; on a phone one Back sits over the photo | standard IS-N1 |
| Journey waits 120 s per test, 20 s per expect | measured test-project latency (control) |
| Decision C (price "On enquiry" vs status "By enquiry") → later, its own change | governor 2026-11-09 |
| Merged PR #11–#16 over red CI (`DOCTRINE_READ_TOKEN` unset) | governor's word per PR |

## 7. Changed / rejected
- A2 / B2 → original registers; the bar of four everywhere.
- Words-only empty states → the plinth back on the empty home.
- Bookmark Save → round heart over the photo.
- Search button and Clear → one field.
- Saved as a list → picture grid.
- Colophon "The Gallery, Bengaluru" → "The Gallery" → "The Gallery · About".
- Sheet intent choices → removed ("Keep").
- Maker gallery one-column hang → profile head with three-across squares.
- For Makers numbered steps → board screen 7.
- Join long form → three steps.
- "Fair use" page and policy footer links → About-style policy screens.
- Back hidden from 900 px wide → Back at every width.
- R11 Back on a hand-written route list → IS-N1 by archetype, fail-closed.
- Checking pages → checking every screen state (no redirect exemption).
- Type 10.5–13 px for labels, tabs and metadata → 12–16 px.
- 24 px form rhythm → 32 px.
- `npx next build` → `npm run build` (stamped).
- Gate on sweep receipts only → four receipts per viewport.
- A repo-only Claude hook as enforcement → insufficient (hooks don't load in this topology); the suite and gate are the chokepoint.
- ❌ Footer Privacy link (design-critique suggestion): governor's footer decision stands.
- ❌ Rewording "Makers, studios and collectives": GAL-OD-02 wording.
- ❌ "Available · ₹6,800" on the home label; an "All" chip on Search.
- ❌ Journeys on the live site; restoring the old Supabase project; force-push; claiming "It is free"; icon options 1–3; a report row before a report route exists; the board's sample photos on For Makers.

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Live site | https://atthegallery.in (Cloudflare Worker `thegallery`, auto-deploys the default branch within ~1 min) |
| Repo / default branch | `r959qp5qwr-web/Thegallery`, `claude/the-gallery-foundation-7plo1e`, tip `5ae491c` (Merge PR #16) |
| Working branch (session #9) | `claude/vibrant-edison-dr83og`, at `5ae491c`. A new session gets its own designated branch: create it from the default branch |
| Doctrine repo | `r959qp5qwr-web/builders-doctrine`, main `6dc016c485ec…`, version 1.1.0 ACTIVE_PENDING_REPIN |
| Live Supabase | `kemrceegbyizpcfewgri`, publishable `sb_publishable_joD-RqEyX63-Y1CwQSErxg_nuGsUB7N` |
| Test Supabase | `fbgrumcwlnoljkkbiqfe`, URL `https://fbgrumcwlnoljkkbiqfe.supabase.co`, publishable `sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd`, schema `gallery`, bucket `gallery-images` |
| `.env.local` (gitignored; recreate) | `SUPABASE_URL` (test), `SUPABASE_PUBLISHABLE_KEY` (test), `SUPABASE_STORAGE_BUCKET=gallery-images`, `GALLERY_SCHEMA=gallery`, `GALLERY_BASE_URL=http://127.0.0.1:3100` |
| Setup | `npm ci`; `npm run build`; server `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx next start -p 3100` (own background command) |
| Suite command | `bash e2e/run-hosted.sh --project=phone --trace off --reporter=line` (and `--project=desktop`), each its own background command |
| Environment | "The Gallery (with Doctrine)" `env_015jqYRQ2fkV9xhRroHttVvw`; `api.supabase.com` token proxy-injected [secret removed: re-enter it]; reaches the test project only |
| PR #15 | merged → `23000f2` (head `b31eca4`); phone 100 passed + 1 skipped, desktop 101 passed (build `X_B_m5XR5Pz6eVmoBTotD`) |
| PR #16 | merged → `5ae491c` (head `01877db`, stamped build `M_yYONQ-Y9kGPhg_ZhcIk`); phone **102 passed, 1 skipped** (35.4 min); desktop **103 passed** (33.0 min); gate OPEN; Workers build success |
| Control on live code before the standard | FAIL, 33 of 33 states: phone 391 findings, desktop 511 |
| Latency control (live vs new code, same test project) | Studio work-page load median 6.8 s vs 7.5 s (ranges 5.5–8.5 / 6.1–10.7 s) |
| Interface Standard | version 1.3.0; 16 rules (IS-T1…T7, IS-H1, IS-N1, IS-A1, IS-F1, IS-L1…L4, IS-X1); 35 profile states; drill 38 cases per viewport |
| Key thresholds | body ≥16 px; labels ≥16; secondary ≥14; nothing <12; typed text ≥16; line height ≥1.4; ≤80 chars/line; targets ≥44×44; inputs ≥48 tall; fields ≥32 apart; help ≥4 under input; side margin ≥16 on phone; 4 px grid; one primary (exactly one on an editor); Back in the top 96 px; axe WCAG 2.2 AA |
| Journeys | 01–16; 14 = whole-app sweep; 15 = Interface Standard; 16 = drill; phone 103 tests |
| Ledger latest | GAL-L0042 |
| Test seeds | Maker A `anika.rao@makers.example` / `kiln-and-monsoon-9` (anika-rao, Khurja); Maker B `studio@dhaaga.example` / `warp-and-weft-11` (dhaaga-studio, Jaipur); Operator `operator@thegallery.example` / `operator-of-record-7` |
| Test works | "Monsoon Vessel No. 4" (Maker A, Sold after a full run); "Unfinished Warp" (Maker B, retired after a full run) |
| Upload limit | `bodySizeLimit: "12mb"`; only JPEG is read |
| Breakpoints / widths | 600 / 900 px; page max 1200; Studio column 760; forms ≤ 560; `--bar-h` 64 px |
| Spacing scale | `--s1` 4 · `--s2` 8 · `--s3` 16 · `--s4` 24 · `--s5` 32 · `--s6` 48 · `--s7` 64 px |
| Colours | paper #F8F3EA, paper-deep #F0E9DC, limestone #E7DECF, ink #221E1A, ink-soft rgb(61, 54, 48), amber #A5501F, amber-deep #8A3F14 |
| Artifacts (private) | Approved board https://claude.ai/artifact/NhfhLaQztV53zwQpYaho7g · phone-walk checklist v2 (localStorage `gallery-walk-v2`) https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7 · Wave 5 design pass https://claude.ai/artifact/NrK3jfHcXvEXurUAx5NiVp |
| axe | `axe-core@4.10.2` is now a devDependency (journey 15 injects it) |

## 9. People, terms & names
- **People:** the user = the Governor.
- **Terms:**
  - "drawing board" = the 16-screen restart, parts 1–3 live.
  - "docked action" = the one solid ink bar at a screen's foot.
  - "the sweep" = journey 14.
  - "the standard" = the Interface Standard (journey 15).
  - "the drill" = journey 16.
  - "the gate" = `scripts/app-sweep-gate.py`.
  - SWEEP-1 / GUARD-3 = guard rules in `scripts/doctrine-hook.py`.
  - "escape" = a fault found by a person after the gate was open, classed C1 coverage / C2 measure / C3 standard / C4 judgement.
  - archetypes: root, flow-step, sub-screen, editor, dialog, operator.
  - "phone walk" = the live physical-phone proof.
  - SYSTEM CHANGE = touches tokens.css or system.css.
- **Names in use:**
  - **Kit** `kit/interface-standard/`: `STANDARD.json`, `engine/measure.ts`, `calibrate.ts`, `REFERENCES.json` (GOV.UK text and date input, GOV.UK home, Are.na about), `CALIBRATION.json`, `CONTROL-2026-11-10-{phone,desktop}.json`, `drill/cases.ts`, `ESCAPES.md` (E01–E07), `SKILL.md`, `README.md`.
  - **Product side:** `ux/INTERFACE_PROFILE.json` (`unmeasured`: `src/app/studio/error.tsx`, `src/app/(entrance)/loading.tsx`), `e2e/15-interface-standard.spec.ts`, `e2e/16-interface-drill.spec.ts`, `e2e/support/fingerprint.ts`.
  - **Receipts** in `.doctrine/runtime/`: `suite-*`, `app-sweep-*`, `interface-*`, `interface-drill-*`, `interface-pending-restore.json`; and `.next/SOURCE_FINGERPRINT`.
  - **Skills:** `.claude/skills/interface-standard/SKILL.md`, `.claude/skills/gallery-app-sweep/SKILL.md`.
  - **Doctrine candidate:** `doctrine/harvests/PRODUCT_HARVEST-GALLERY-H-INTERFACE-001.md` (DRAFT).
  - **Receipts written this session:** `doctrine/receipts/WHOLE-APP-SWEEP-2026-11-10.md` (+ `policy-screens/`), `doctrine/receipts/INTERFACE-STANDARD-2026-11-10.md` (+ `interface-standard/before|after`).
  - **Components changed:** `Header` (`back`, `step`), `Band` (role alert when `fail`), `PhotoPicker` (`help` prop), `Policies.tsx` (`h` prop).
  - **This file:** `doctrine/handoffs/handoff-the-gallery.md`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Drawing board parts 1–3 | live | PR #12–#14 | signed-in screens NOT SEEN on a real phone |
| Whole-app sweep + policy screens | live | PR #15 → `23000f2` | — |
| Interface Standard + system change + Back everywhere | live | PR #16 → `5ae491c` | Join step 2 on the governor's phone NOT SEEN (phone walk) |
| Doctrine candidate H-INTERFACE-001 | DRAFT | `doctrine/harvests/` | governor: ACCEPT / MODIFY / REJECT, then promote in the Doctrine repo |
| Phone-walk checklist | v2 | artifact above | still valid; join steps now have Back |
| CI | red on every PR | needs `DOCTRINE_READ_TOKEN` | gate receipts are local; CI does not enforce them |
| Guard (SWEEP-1, GUARD-3) | configured | `scripts/doctrine-hook.py` | not live-validated (topology does not load project hooks) |
| Studio page latency | 6–8 s on the test project | — | live latency UNKNOWN |
| Report route, live operator account | not built / unknown | — | — |

## 11. Next steps
1. **Next action:** set up the session (orient, `.env.local`, `npm ci`, `npm run build`, start the server), then resume the **phone walk at step 1 ("Before you start")**:
   - a test maker name such as "Walk Test Studio" with the governor's own town;
   - an email alias;
   - three photos (tall, wide, square, each under 12 MB);
   - a normal tab and an Incognito tab in Chrome.

   Give one step, wait for "Ready", record the result.
2. Any fault the governor reports during the walk: interface-standard skill (measure, classify, fix the layer, then the states).
3. After the walk: write the receipt `PHONE-WALK-<date>.md`.
4. Later:
   - the governor's decision on the Doctrine candidate;
   - `DOCTRINE_READ_TOKEN`;
   - a sweep/standard plugin so the gate follows into every session;
   - non-text contrast (WCAG 1.4.11);
   - decision C;
   - the report route;
   - the live operator account;
   - a "Continue" tap before confirming email links;
   - a server-side create key for works.

## 12. Open questions ⚠️
1. **Doctrine candidate H-INTERFACE-001:** accept, modify or reject? (accept / modify / later)
2. **`DOCTRINE_READ_TOKEN`:** created as a Thegallery repository secret (read-only on `builders-doctrine`)? (yes / not yet)
3. **Live operator account:** does one exist? (yes / no / don't know)
4. **Sweep + standard plugin** on the account so the gate follows into every session? (yes / later)
5. **Carried:**
   - R1 "save on pick" vs "draft saved on Save";
   - live migration for "no untitled publish";
   - uploads over 12 MB lose the label;
   - JPEG-only vs iPhone HEIC;
   - foundation conflicts §4 vs §10 and §5 vs §11;
   - field-error colour;
   - restore Ahoy and treksfit-prod;
   - rotate test credentials after testing;
   - decision C;
   - an email scanner can spend the confirmation link;
   - a retried Publish could create a second work.

## 13. Re-attach checklist
- [ ] Nothing has to be attached. This file is committed at `doctrine/handoffs/handoff-the-gallery.md` on the default branch (`5ae491c` + this commit on `claude/vibrant-edison-dr83og`). Open the new session on `r959qp5qwr-web/Thegallery` with `builders-doctrine` beside it, in environment "The Gallery (with Doctrine)", and point it to this file (or attach it).

---
<sub>Audit: 13/13 sections · 30 rules · 39 corrections · 110 data points · secrets removed: yes · generated by active-memory</sub>
