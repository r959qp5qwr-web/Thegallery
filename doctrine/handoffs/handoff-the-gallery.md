# active-memory handoff: The Gallery — first real studio goes live; PR #17 open, unmerged

**Handoff #10** · 2026-11-12 · Lineage:
- **#1 (2026-11-05 → 06):** re-pinned to the new Builders' Doctrine; rebuilt the vanished Supabase project; e2e journeys on a test project; built Wave 1.
- **#2 (2026-11-06):** Wave 1 (PR #4) and Wave 2 (PR #5); ledger GAL-L0019..22.
- **#3 (2026-11-06 → 07):** Wave 3 (PR #6) and Wave 4 (PR #7); ledger GAL-L0023.
- **#4 (2026-11-07 → 09):** governor decisions (PR #8, #9); ledger GAL-L0024..25; phone-walk checklist; five-reviewer design review.
- **#5 (2026-11-09):** A2 / B2 / C-later; design pass approved; app icon option 4; Wave 5 merged (PR #10); ledger GAL-L0026..30.
- **#6 (2026-11-09):** Wave 5 judged a regression; drawing board (16 screens) approved; PR #11, #12; ledger GAL-L0031..33.
- **#7 (2026-11-09 → 10):** part 2 (visitor screens) PR #13; ledger GAL-L0034.
- **#8 (2026-11-10):** part 3 (maker screens) PR #14; whole-app sweep built; ledger GAL-L0035..38.
- **#9 (2026-11-10 → 11):** PR #15 (sweep + policy screens) and PR #16 (the Interface Standard, larger type, roomier forms, Back everywhere) merged and live; ledger GAL-L0039..42; Doctrine candidate H-INTERFACE-001 drafted.
- **#10 (2026-11-11 → 12):**
  - The governor chose a real studio over a demo run, so the phone walk was replaced by the studio's own walk.
  - Found the live Supabase project had no email sender and default templates; the governor set Resend as custom SMTP and the two templates.
  - The governor's own sign-up showed a dead end ("Check your email", then nothing, because the address already had an account). Fix built and proved: PR #17 (rule R13, ledger GAL-L0043, escape E08), not merged.
  - The first-studio WhatsApp message is final and ready for the governor to send.

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
  - The Gallery (`https://atthegallery.in`), an artists' portal, built to the governor-approved drawing board. Every screen is held to every governor correction (the whole-app sweep) and to the measured Interface Standard.
  - Now: a **real studio** goes through sign-up and creates its page on the live site, using the WhatsApp message in section 8. The studio's own walk replaces the governor's phone walk.
- **Done looks like:**
  - The studio reaches its public gallery with one work on view; faults they report are fixed at the layer that missed them.
  - Every change goes through the full process (rule 14) and the gate.
  - A receipt `PHONE-WALK-<date>.md` records what the studio's walk showed (SEEN / NOT SEEN / UNKNOWN).
- **Why it matters (user's words):**
  - "This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of design orientation… be cutting edge."
  - 2026-11-11: "Instead of a demo run, I would like a real studio to go through the process of uploading and creating their page."
  - 2026-11-11, when asked to test the flow himself: "Stop fucking around, I told you we will get these checked with a real studio."
  - Earlier: "Give me a mechanism level solution, that's replicable, rigid, and learns from itself."

## 2. About the user (as relevant to this work)
- Systems-minded wellness entrepreneur and capability designer.
- The **Governor** of products built under the Builders' Doctrine (The Gallery, Ahoy, maa.se, Ustaad, TreksFit, Swasthya…).
- Uses ChatGPT for sense-making, Claude for building, another tool for research.
- Works on an Android phone (Chrome) and an iPad. Reaches the Supabase, Cloudflare, Resend (new), Railway and GitHub dashboards in a browser.
- Has installed many design skills and expects them to be used on anything people see.
- Answers tersely: "Yes", "Go.", "Merge.", "Approved.", "Yes.", "Continue.", "It came.", "Got here."
- Reviews by sending screenshots of the live site and of dashboards.
- Is irritated by being asked to do testing he has already assigned elsewhere.

## 3. Style & communication
- **Language:** English.
- **Tone:** grounded, calm, precise, direct, low-hype. No fluff, no motivational padding, no generic coach or branding language.
- **Reply length:** short and structured; details on request.
- **Formatting:**
  - headings, short lists and tables;
  - report SEEN / NOT SEEN / UNKNOWN separately;
  - plain words, not code names, in user-facing summaries;
  - send renders and sheets as images (SendUserFile) or published artifacts;
  - messages for third parties (the studio) are given as paste-ready WhatsApp text.
- **Working style:**
  - Layers (architecture → domain → workflow → templates). Containers over tips.
  - Give a few options with a recommendation, then treat the choice as fixed; turn decisions into one-word replies.
  - Ask only when it materially affects design, safety or implementation. Resolve things rather than hand over chores. Never hand the governor a test he has assigned to someone else.
  - When something is "was going to be blocked", report as: "Was going to be blocked by X. Workaround: Y. Status: done / running / needs your one word."
  - Show visual decisions as rendered pages or images.
  - Each change set ends with a summary, decisions, and "Merge PR #n?".
  - On long waits, give short progress lines.
  - When the governor sends a screen with a fault: follow `.claude/skills/interface-standard/SKILL.md` and `.claude/skills/gallery-app-sweep/SKILL.md`.
    - Measure the state.
    - Classify the escape (C1 coverage / C2 measure / C3 standard / C4 judgement).
    - Fix the layer first with a failing control.
    - Then fix every flagged state, app-wide.
- **Avoid:**
  - reopening settled decisions;
  - vague best practices;
  - claiming green without a receipt;
  - asking for secrets in chat (API keys go only into the dashboard form);
  - naming a cause before a control run;
  - calling a design reviewed when no design skill was run;
  - settling a FIXED or OPEN decision through copy or visuals;
  - machine-sounding copy: "quiet", "not X, not Y" or "not X, or not Y" lists, doubled negatives, groups of three, abstract nouns;
  - sentences in monospace; document-style pages;
  - shrinking type or spacing to make things fit;
  - recording something as SEEN before naming exactly which email or screen was seen.

## 4. Hard rules (word for word)
1. "Never write to `builders-doctrine`. The guard denies it; the rule stands without the guard."
2. "Work on a branch; the default branch is merged through review."
3. "No real person's art, address, phone number or email in fixtures, screenshots or tests." Third-party reference screenshots stay out of the repository, in the scratchpad. The real studio's name, email, number and photos never go into the repository.
4. "Report what was SEEN, NOT SEEN and UNKNOWN. A green claim needs a receipt."
5. "An indeterminate verdict is a denial."
6. "Read `active_stage.next_acceptance_condition` in `PRODUCT_STATE.json` before building anything. Do not silently settle an OPEN decision through code."
7. Run `python3 scripts/doctrine-orient.py orient` first, and again before a commit that follows governing-state changes (the pre-commit gate refuses otherwise).
8. "No merge, deployment, purchase or schedule is authorized" unless the user says so. Merges are authorised case by case:
   - PR #4–#14: as recorded in earlier handoffs; PR #15, #16: "Yes.";
   - **PR #17: NOT yet authorised.** Ask "Merge PR #17?" and wait.
9. "the design system has to be adhered to" (user).
   - `public/gallery/tokens.css` and `system.css` must be byte-identical to `ux/reference/interface/`; journey 11 enforces it. Copy both whenever either changes.
   - App styling goes in `public/gallery/app.css`.
   - Token and system changes are SYSTEM CHANGES and need the governor's word. (This session overrode a token only inside `app.css`: `.flow-line { line-height: 1.5 }`.)
10. Journeys only touch the test project; `e2e/helpers.ts` refuses the live project and site.
11. Secrets go only through the environment's secure form or the dashboard's own form, never in chat.
12. Never test a server whose served page lacks the current `.next/BUILD_ID` (`e2e/run-hosted.sh` enforces it; it now uses `grep -q --` because a build id can start with a dash).
13. Running suites:
    - Run one journey suite at a time (runner lock). Nothing heavy beside a suite.
    - Each suite is its own background command with timeout 3600000.
    - Start `next start -p 3100` as its own background command with timeout 7200000. It dies at 2 h, so restart it before a 35-minute suite if it has run for more than about 80 minutes. Kill the old server (`pkill -f next-server; pkill -f "next start"`) before starting a new one, or the port stays held (EADDRINUSE) and the runner refuses.
    - Read results from the summary line, never from a wrapper's exit code ("completed (exit 0)" notices are meaningless).
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
26. After an interrupted suite, check the shared fixtures ("Monsoon Vessel No. 4" Sold; "Unfinished Warp" retired), or let a full run reset them (a full run reseeds).
27. CLAUDE.md standing rule 8: every screen state is measured against the Interface Standard by `e2e/15-interface-standard.spec.ts`; every state, with its archetype, is in `ux/INTERFACE_PROFILE.json`. Before building or changing a screen, and whenever anyone finds an interface fault, follow `.claude/skills/interface-standard/SKILL.md`. "Never shrink type or spacing to fit, and never loosen a rule to pass."
28. **Build with `npm run build`, never `npx next build`.** Its postbuild stamps `.next/SOURCE_FINGERPRINT`. The gate is SHUT for a build not stamped with the current code.
29. **The gate** (`python3 scripts/app-sweep-gate.py`) needs four PASS receipts per viewport on this code: suite, app-sweep, interface, interface-drill. `e2e/run-hosted.sh` writes the suite receipt only after a full, unfiltered run whose Playwright exit code is 0.
30. A new screen state goes into `ux/INTERFACE_PROFILE.json` before it is built. A redirect is never an exemption.
31. **Editing any fingerprinted file (src/, public/, `ux/APP_RULES.json`, `ux/INTERFACE_PROFILE.json`, `e2e/14-…`, `e2e/15-…`, kit STANDARD/engine, `e2e/support/…`) voids the build stamp and the running suite.** Stop the suite, rebuild with `npm run build`, restart the server, rerun. Docs, ledger, receipts and `kit/interface-standard/ESCAPES.md` are outside the fingerprint.
32. The site answers the same whether or not an address has an account (non-disclosure). Copy near sign-up says "may", never "does".

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
| 40 | Kept steering the governor into a phone-walk step (Add a work) after he had said a real studio would be the test | "Stop fucking around, I told you we will get these checked with a real studio." Give the studio message; never route the test back to him |
| 41 | Recorded "It came" as the sign-up confirmation email arrived; it was the password-reset email | Name which email or screen was seen before recording SEEN; ask for a screenshot when unsure |
| 42 | Left the sign-up screen with no way out when the address already had an account | A screen that waits for something the system may never send names the exit (R13, GAL-L0043) |

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
| Interface Standard (kit, profile, journeys 15–16, gate, guard, skill, rule 8, ESCAPES.md) | governor 2026-11-10: "mechanism level solution" |
| SYSTEM CHANGE approved: `--t-field-label` 16 px; `--t-label` 12; `--t-nav` 12; `--t-meta` 14; `--t-caption` 14; `--bar-h` 64; `.field` 32 px apart; help 8 px under its field; spacing on the 4 px grid | "I will go by your recommendations. Do the most reliable thing." |
| Standard → Doctrine via option A (candidate drafted; only the governor promotes) | same words |
| Back on every non-top-level state at every width | standard IS-N1 |
| Journey waits 120 s per test, 20 s per expect | measured test-project latency |
| Decision C (price "On enquiry" vs status "By enquiry") → later, its own change | governor 2026-11-09 |
| Merged PR #11–#16 over red CI (`DOCTRINE_READ_TOKEN` unset) | governor's word per PR |
| **A real studio, not a demo, is the first walk of the sign-up and upload flow** | governor 2026-11-11 |
| **Auth email goes through Resend as Supabase custom SMTP; the Confirm sign up and Reset password templates link to the app's own routes with the token hash** | the app's `/makers/confirm/{token}` and `/makers/reset/{token}` routes need it; governor set it |
| **The sign-up screen keeps non-disclosure and adds an exit: "No email? You may already have a gallery with this address." + Sign in + Reset your password; Join step 1 gets "I already have a gallery"** | governor "Yes. Do that fix." |
| R13 compares exact paths; the expired check-email state is in the profile; `.flow-line` line height 1.5 in `app.css` (token untouched) | review + new profile state's finding |

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
- A repo-only Claude hook as enforcement → insufficient; the suite and gate are the chokepoint.
- **Governor's own phone walk against the live site → the real studio's walk.**
- **Supabase default email sender and templates → Resend SMTP and custom templates.**
- ❌ Footer Privacy link: the governor's footer decision stands.
- ❌ Rewording "Makers, studios and collectives": GAL-OD-02 wording.
- ❌ "Available · ₹6,800" on the home label; an "All" chip on Search.
- ❌ Journeys on the live site; restoring the old Supabase project; force-push; claiming "It is free"; icon options 1–3; a report row before a report route exists; the board's sample photos on For Makers.
- ❌ Telling the sign-up screen whether an address has an account (non-disclosure stays).
- ❌ A reviewer's claim that new text links are under 44 px (`system.css:67` gives `.textlink` min-height `var(--target)`; journey 15 measured it).

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Live site | https://atthegallery.in (Cloudflare Worker `thegallery`, auto-deploys the default branch within ~1 min) |
| Repo / default branch | `r959qp5qwr-web/Thegallery`, `claude/the-gallery-foundation-7plo1e`, tip `5ae491c` (Merge PR #16) |
| Working branch (session #10) | `claude/dreamy-lamport-f7efnw`, head `cbd1ecd73ad8e27680f05b0df895f4204bec3396` before this handoff's commit. A new session gets its own designated branch: create it from the default branch, or from this one if PR #17 is unmerged |
| PR #17 | https://github.com/r959qp5qwr-web/Thegallery/pull/17, open, NOT merged. Head `cbd1ecd`, stamped build `-UYwxHaLcLJQvNW0l88Up`; phone **102 passed, 1 skipped** (33.4 min); desktop **103 passed** (31.4 min); gate OPEN; CI red (expected, `DOCTRINE_READ_TOKEN`: log NOT yet read this session) |
| Doctrine repo | `r959qp5qwr-web/builders-doctrine`, main `6dc016c485ec…`, version 1.1.0 ACTIVE_PENDING_REPIN |
| Live Supabase | `kemrceegbyizpcfewgri`, publishable `sb_publishable_joD-RqEyX63-Y1CwQSErxg_nuGsUB7N`. The proxy-injected management token cannot read it (403 "does not have the necessary privileges"); it can read the test project |
| Test Supabase | `fbgrumcwlnoljkkbiqfe`, URL `https://fbgrumcwlnoljkkbiqfe.supabase.co`, publishable `sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd`, schema `gallery`, bucket `gallery-images`; default email templates; no SMTP |
| `.env.local` (gitignored; recreate) | `SUPABASE_URL` (test), `SUPABASE_PUBLISHABLE_KEY` (test), `SUPABASE_STORAGE_BUCKET=gallery-images`, `GALLERY_SCHEMA=gallery`, `GALLERY_BASE_URL=http://127.0.0.1:3100` |
| Setup | `npm ci`; `npm run build`; server `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx next start -p 3100` (own background command) |
| Suite command | `bash e2e/run-hosted.sh --project=phone --trace off --reporter=line` (and `--project=desktop`), each its own background command |
| Environment | "The Gallery (with Doctrine)" `env_015jqYRQ2fkV9xhRroHttVvw`; `api.supabase.com` token proxy-injected [secret removed: re-enter it]; reaches the test project only |
| Live auth email (set by the governor 2026-11-11) | Custom SMTP ON. Host `smtp.resend.com`, port `465`, username `resend`, password = the Resend API key [secret removed: re-enter it], sender `no-reply@atthegallery.in`, sender name `The Gallery`. Resend domain `atthegallery.in` verified. Site URL must be `https://atthegallery.in` (reported checked but not confirmed by screenshot) |
| Live email templates (set by the governor) | Confirm sign up link: `{{ .SiteURL }}/makers/confirm/{{ .TokenHash }}`. Reset password link: `{{ .SiteURL }}/makers/reset/{{ .TokenHash }}` |
| Email seen working | Reset password email arrived from "The Gallery" and its link opened the governor's own existing Studio (SEEN 2026-11-11). Sign-up confirmation email for a brand-new address: NOT SEEN |
| Rate limits (UNKNOWN) | Supabase custom-SMTP auth email rate limit (default reported 30/hour, adjustable in Authentication → Rate Limits); Resend free plan limits not checked |
| Interface Standard | version 1.3.0; 16 rules (IS-T1…T7, IS-H1, IS-N1, IS-A1, IS-F1, IS-L1…L4, IS-X1); **36 profile states** (added `check-email-expired`); drill 38 cases per viewport |
| Key thresholds | body ≥16 px; labels ≥16; secondary ≥14; nothing <12; typed text ≥16; line height ≥1.4; ≤80 chars/line; targets ≥44×44; inputs ≥48 tall; fields ≥32 apart; help ≥4 under input; side margin ≥16 on phone; 4 px grid; one primary (exactly one on an editor); Back in the top 96 px; axe WCAG 2.2 AA |
| App rules | R01–R13; **R13-no-dead-end** (check kind `has-links`, `routes ["^/makers/check-email$"]`, `hrefs ["/makers/sign-in","/makers/reset"]`, exact pathname, visible, inside `main`) |
| Journeys | 01–16; 14 = whole-app sweep; 15 = Interface Standard; 16 = drill; phone 103 tests |
| Ledger latest | GAL-L0043 (escape E08 in `kit/interface-standard/ESCAPES.md`) |
| Test seeds | Maker A `anika.rao@makers.example` / `kiln-and-monsoon-9` (anika-rao, Khurja); Maker B `studio@dhaaga.example` / `warp-and-weft-11` (dhaaga-studio, Jaipur); Operator `operator@thegallery.example` / `operator-of-record-7` |
| Test works | "Monsoon Vessel No. 4" (Maker A, Sold after a full run); "Unfinished Warp" (Maker B, retired after a full run) |
| Upload limit | `bodySizeLimit: "12mb"`; only JPEG is read (screenshots/PNG and HEIC fail) |
| Publish time | up to about 10 s on the test project (live UNKNOWN); a double tap on Publish could create the work twice |
| Breakpoints / widths | 600 / 900 px; page max 1200; Studio column 760; forms ≤ 560; `--bar-h` 64 px |
| Spacing scale | `--s1` 4 · `--s2` 8 · `--s3` 16 · `--s4` 24 · `--s5` 32 · `--s6` 48 · `--s7` 64 px |
| Colours | paper #F8F3EA, paper-deep #F0E9DC, limestone #E7DECF, ink #221E1A, ink-soft rgb(61, 54, 48), amber #A5501F, amber-deep #8A3F14 |
| Artifacts (private) | Approved board https://claude.ai/artifact/NhfhLaQztV53zwQpYaho7g · phone-walk checklist v2 https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7 · Wave 5 design pass https://claude.ai/artifact/NrK3jfHcXvEXurUAx5NiVp |
| axe | `axe-core@4.10.2` devDependency (journey 15 injects it) |
| Studio flow (live code) | `/makers` For Makers → `/makers/create-account` (Step 1 of 3: Email, Password ≥10) → `/makers/check-email` → link `/makers/confirm/{token}` → `/studio/join` (Step 2 of 3: Name, Place, How you work: On my own / A studio / A collective) → `/studio/whatsapp?join=1` (Step 3 of 3: WhatsApp number with + and country code) → `/studio` ("Add a work") → `/studio/works/new` (Add photo, Title, Material, Status, Price: Fixed price / On enquiry / Made to order, Amount ₹, Medium, size, Year, About this work; Publish docked, Save draft in header) → work page; gallery opens with the first work. Public page `/m/<handle>` |

## 9. People, terms & names
- **People:** the user = the Governor. The first real studio = a studio the governor knows (name, email, number, photos stay out of the repository).
- **Terms:**
  - "drawing board" = the 16-screen restart, parts 1–3 live.
  - "docked action" = the one solid ink bar at a screen's foot.
  - "the sweep" = journey 14; "the standard" = journey 15; "the drill" = journey 16; "the gate" = `scripts/app-sweep-gate.py`.
  - SWEEP-1 / GUARD-3 = guard rules in `scripts/doctrine-hook.py`.
  - "escape" = a fault found by a person after the gate was open, classed C1 coverage / C2 measure / C3 standard / C4 judgement.
  - archetypes: root, flow-step, sub-screen, editor, dialog, operator.
  - "phone walk" = the live proof on a physical phone; now carried out by the real studio.
  - SYSTEM CHANGE = touches tokens.css or system.css.
- **Names in use:**
  - Kit `kit/interface-standard/` (STANDARD.json, engine/measure.ts, calibrate.ts, REFERENCES.json, CALIBRATION.json, CONTROL-2026-11-10-{phone,desktop}.json, drill/cases.ts, ESCAPES.md, SKILL.md, README.md).
  - Product side: `ux/INTERFACE_PROFILE.json`, `ux/APP_RULES.json`, `e2e/14-whole-app.spec.ts`, `e2e/15-interface-standard.spec.ts`, `e2e/16-interface-drill.spec.ts`, `e2e/support/fingerprint.ts`, `e2e/run-hosted.sh`.
  - Receipts in `.doctrine/runtime/`: `suite-*`, `app-sweep-*`, `interface-*`, `interface-drill-*`; `.next/SOURCE_FINGERPRINT`.
  - Skills: `.claude/skills/interface-standard/SKILL.md`, `.claude/skills/gallery-app-sweep/SKILL.md`.
  - Written this session: `doctrine/onboarding/FIRST-STUDIO-INSTRUCTIONS.md` (checks + the WhatsApp message), `doctrine/receipts/CHECK-EMAIL-EXIT-2026-11-11.md`, `doctrine/receipts/check-email-exit/` (six renders at 390 px, `-before` from the live site, `-after` from the new build).
  - Components touched: `src/app/makers/check-email/page.tsx` (`.flow-links`), `src/app/makers/create-account/page.tsx` (`.flow-alt`), `public/gallery/app.css`.
  - Doctrine candidate: `doctrine/harvests/PRODUCT_HARVEST-GALLERY-H-INTERFACE-001.md` (DRAFT); a second candidate idea: "a waiting screen names its exit".
  - This file: `doctrine/handoffs/handoff-the-gallery.md`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Drawing board parts 1–3 | live | PR #12–#14 | signed-in screens: the governor's Studio seen on an iPad (empty gallery) |
| Whole-app sweep + policy screens | live | PR #15 | — |
| Interface Standard + system change + Back everywhere | live | PR #16 → `5ae491c` | — |
| **No dead end after sign-up (R13, exit links, expired state profiled, line height)** | **built, tested, PR open** | PR #17, head `cbd1ecd` | NOT merged; NOT live; CI log not read; no separate design skill run; no IS-M1 side-by-side against outside references |
| Live email sender + templates | set by the governor | Supabase `thegallery` + Resend | reset email SEEN; sign-up confirmation for a new address NOT SEEN |
| First-studio WhatsApp message | final, handed to the governor to send | `doctrine/onboarding/FIRST-STUDIO-INSTRUCTIONS.md` | send status UNKNOWN |
| Local test server | stopped (2 h limit) | port 3100 free | restart before any run |
| Doctrine candidate H-INTERFACE-001 | DRAFT | `doctrine/harvests/` | governor: ACCEPT / MODIFY / REJECT |
| CI | red on every PR | needs `DOCTRINE_READ_TOKEN` | gate receipts are local |
| Live operator account | UNKNOWN | — | needed to take a work down |
| Report route | not built | — | — |
| Fixtures | reset by the last full runs | — | — |

## 11. Next steps
1. **Next action:** the governor sends the WhatsApp message (section 10, file in section 9) to the real studio. Meanwhile, read the red CI log of PR #17 (confirm only `DOCTRINE_READ_TOKEN` unset), check the Cloudflare "Workers Builds" check, and ask "Merge PR #17?". On "Yes.": merge with `expectedHeadSha`, fast-forward the working branch, confirm the change live on `/makers/check-email`.
2. Handle what the studio reports. For each screenshot: reproduce by measurement, classify (C1–C4), fix the layer with a failing control, then every flagged state, then the full process (rule 14). Verify which email or screen the studio actually saw before recording anything as SEEN.
3. After the studio's walk: write `PHONE-WALK-<date>.md` (SEEN / NOT SEEN / UNKNOWN), including the first confirmation email for a brand-new address, Publish time on the live site, and the public gallery page.
4. Later:
   - the governor's decision on the Doctrine candidate;
   - `DOCTRINE_READ_TOKEN`;
   - a sweep/standard plugin so the gate follows into every session;
   - non-text contrast (WCAG 1.4.11);
   - decision C;
   - the report route;
   - the live operator account;
   - a "Continue" tap before confirming email links (scanners can spend them);
   - a server-side create key for works (double Publish);
   - JPEG-only vs iPhone HEIC;
   - IS-M1 side-by-side images for PR #17 if the governor wants them.

## 12. Open questions ⚠️
1. **Merge PR #17?** (Yes / not yet). Asked, no answer yet.
2. **Doctrine candidate H-INTERFACE-001:** accept, modify or reject? (accept / modify / later)
3. **`DOCTRINE_READ_TOKEN`:** created as a Thegallery repository secret (read-only on `builders-doctrine`)? (yes / not yet)
4. **Live operator account:** does one exist? (yes / no / don't know)
5. **Sweep + standard plugin** on the account so the gate follows into every session? (yes / later)
6. **PR #17 design review:** want a design skill run and IS-M1 side-by-side images before merge? (yes / no)
7. **Carried:**
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
   - a retried Publish could create a second work;
   - Supabase auth email rate limit and Resend plan limit for the live project (UNKNOWN).

## 13. Re-attach checklist
- [ ] Nothing has to be attached. This file is committed at `doctrine/handoffs/handoff-the-gallery.md` on the working branch `claude/dreamy-lamport-f7efnw` (and reaches the default branch when PR #17 merges). Open the new session on `r959qp5qwr-web/Thegallery` with `builders-doctrine` beside it, in environment "The Gallery (with Doctrine)", and point it to this file (or attach it).

---
<sub>Audit: 13/13 sections · 32 rules · 42 corrections · 125 data points · secrets removed: yes · generated by active-memory</sub>
