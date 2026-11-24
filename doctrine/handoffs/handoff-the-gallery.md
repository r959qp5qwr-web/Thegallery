# active-memory handoff: The Gallery — photo uploads fixed in PR #18 (open); review pack out; shared-project hole and curator idea pending

**Handoff #11** · 2026-11-24 · Lineage:
- **#1 (2026-11-05 → 06):** re-pinned to the new Builders' Doctrine; rebuilt the vanished Supabase project; e2e journeys on a test project; built Wave 1.
- **#2 (2026-11-06):** Wave 1 (PR #4) and Wave 2 (PR #5); ledger GAL-L0019..22.
- **#3 (2026-11-06 → 07):** Wave 3 (PR #6) and Wave 4 (PR #7); ledger GAL-L0023.
- **#4 (2026-11-07 → 09):** governor decisions (PR #8, #9); ledger GAL-L0024..25; phone-walk checklist; five-reviewer design review.
- **#5 (2026-11-09):** A2 / B2 / C-later; design pass approved; app icon option 4; Wave 5 merged (PR #10); ledger GAL-L0026..30.
- **#6 (2026-11-09):** Wave 5 judged a regression; drawing board (16 screens) approved; PR #11, #12; ledger GAL-L0031..33.
- **#7 (2026-11-09 → 10):** part 2 (visitor screens) PR #13; ledger GAL-L0034.
- **#8 (2026-11-10):** part 3 (maker screens) PR #14; whole-app sweep built; ledger GAL-L0035..38.
- **#9 (2026-11-10 → 11):** PR #15 and PR #16 merged and live; ledger GAL-L0039..42; Doctrine candidate H-INTERFACE-001 drafted.
- **#10 (2026-11-11 → 12):** real studio instead of a demo; Resend SMTP + templates set by the governor; PR #17 (no dead end after sign-up, R13, GAL-L0043, E08) merged and live; studio instructions PDF sent to the studio.
- **#11 (2026-11-12 → 24):**
  - Pre-release review mechanism and pack built (`doctrine/review/`, `scripts/review-pack.py`); pack `43a97e8` sent to the governor for Gemini (broad audit) and Grok (adversarial). No findings back yet.
  - Governor paused `thegallery-test` (option "C") to restart TreksFit.
  - Another session's handoff: `thegallery` Supabase project will also host the paused apps and needs anonymous sign-ins; verified the hole (`maker_self_insert`); the governor proposed a **curator** role; options given; no answer yet.
  - Real studio could not upload photos. Cloudflare log: **"Worker exceeded CPU time limit"** (Workers Free plan, 10 ms). Governor: Paid plan "No", fix "A", local test stack "Go". Built a local Supabase test stack and the fix; **PR #18 open, not merged**.

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
  - The Gallery (`https://atthegallery.in`), an artists' portal, built to the governor-approved drawing board, held to every governor correction (whole-app sweep) and the measured Interface Standard.
  - It is going consumer-facing soon. Governor (2026-11-12): "before that happens I want to be one hundred percent sure that there are no unforeseen glitches, oversights in this app… I want… the best chance possible."
  - Now: the real studio must be able to upload photos and reach its public gallery (PR #18), then the pre-release review runs to its release gate.
- **Done looks like:**
  - The studio's gallery shows its works with photos on the live site; a receipt `PHONE-WALK-<date>.md` records what its walk showed (SEEN / NOT SEEN / UNKNOWN).
  - Review: every finding from Gemini, Grok and Claude reproduced and marked CONFIRMED / NOT REPRODUCED / BY DESIGN / DUPLICATE in `doctrine/review/FINDINGS.md`; 0 open S1; 0 open S2 unless the governor accepts in writing; receipt `RELEASE-READINESS-<date>.md`; governor says "Release".
  - Every change through the full process (rule 14) and the gate.
- **Why it matters (user's words):**
  - "This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of design orientation… be cutting edge."
  - "Instead of a demo run, I would like a real studio to go through the process of uploading and creating their page."
  - "Stop fucking around, I told you we will get these checked with a real studio."
  - "Give me a mechanism level solution, that's replicable, rigid, and learns from itself."

## 2. About the user (as relevant to this work)
- Systems-minded wellness entrepreneur and capability designer; the **Governor** of products under the Builders' Doctrine (The Gallery, Ahoy, maa.se, Ustaad, TreksFit, Swasthya, my neighbourhood, Nukkad…).
- Uses ChatGPT for sense-making, Claude for building, another tool for research; plans to use **Gemini** (broad review) and **Grok 4.7** (adversarial review) on The Gallery.
- Works on an Android phone (Chrome) and an iPad; reaches Supabase, Cloudflare, Resend, Railway and GitHub dashboards in a browser. Can export Cloudflare Worker logs as CSV.
- Has installed many design skills and expects them to be used on anything people see.
- Answers tersely: "Yes", "Go.", "C", "A", "Paid plan. No.", "Merge it.", "Where".
- Reviews by sending screenshots of the live site and dashboards; forwards the studio's screenshots.
- Is irritated by being asked to do testing he has assigned elsewhere.
- Cost-conscious: chose to keep Supabase Free (pause the test project) and Cloudflare Workers Free.

## 3. Style & communication
- **Language:** English.
- **Tone:** grounded, calm, precise, direct, low-hype. No fluff, no motivational padding, no generic coach or branding language.
- **Reply length:** short and structured; details on request.
- **Formatting:**
  - headings, short lists and tables;
  - report SEEN / NOT SEEN / UNKNOWN separately;
  - plain words, not code names, in user-facing summaries;
  - send renders and sheets as images (SendUserFile) or published artifacts;
  - messages for third parties (the studio) as paste-ready WhatsApp text;
  - decisions as one-word answers with a recommendation.
- **Working style:**
  - Layers (architecture → domain → workflow → templates). Containers over tips.
  - Give a few options with a recommendation, then treat the choice as fixed.
  - Ask only when it materially affects design, safety or implementation. Resolve rather than hand over chores. Never hand the governor a test he has assigned to someone else.
  - "Was going to be blocked by X. Workaround: Y. Status: done / running / needs your one word."
  - Show visual decisions as rendered pages or images.
  - Each change set ends with a summary, decisions, and "Merge PR #n?".
  - On long waits, give short progress lines.
  - When the governor sends a screen with a fault: follow `.claude/skills/interface-standard/SKILL.md` and `.claude/skills/gallery-app-sweep/SKILL.md` — measure, classify the escape (C1 coverage / C2 measure / C3 standard / C4 judgement), fix the layer first with a failing control, then every flagged state.
  - For a runtime fault on the live site: get the Cloudflare log (Workers & Pages → `thegallery` → Observability, or CSV export) before naming a cause.
- **Avoid:**
  - reopening settled decisions; vague best practices;
  - claiming green without a receipt; naming a cause before evidence or a control run;
  - asking for secrets in chat;
  - calling a design reviewed when no design skill was run;
  - settling a FIXED or OPEN decision through copy or visuals;
  - machine-sounding copy: "quiet", "not X, not Y" lists, doubled negatives, groups of three (including lists of three formats like "JPEG, PNG and WebP"), abstract nouns, jargon for makers;
  - sentences in monospace; document-style pages;
  - shrinking type or spacing to fit;
  - recording something as SEEN before naming exactly which email, screen or log line was seen.

## 4. Hard rules (word for word)
1. "Never write to `builders-doctrine`. The guard denies it; the rule stands without the guard."
2. "Work on a branch; the default branch is merged through review."
3. "No real person's art, address, phone number or email in fixtures, screenshots or tests." The real studio's name, email, number, photos, screenshots and the Cloudflare log CSV (it holds their address data) never go into the repository or the review pack.
4. "Report what was SEEN, NOT SEEN and UNKNOWN. A green claim needs a receipt."
5. "An indeterminate verdict is a denial."
6. "Read `active_stage.next_acceptance_condition` in `PRODUCT_STATE.json` before building anything. Do not silently settle an OPEN decision through code."
7. Run `python3 scripts/doctrine-orient.py orient` first, and `python3 scripts/doctrine-orient.py check` before commits (the pre-commit gate refuses otherwise).
8. "No merge, deployment, purchase or schedule is authorized" unless the user says so. Merges are authorised case by case: PR #4–#16 as recorded; PR #17 "Merge it."; **PR #18 not yet authorised**. Purchases refused so far: Supabase Pro (chose "C"), Cloudflare Workers Paid ("Paid plan. No.").
9. "the design system has to be adhered to" (user). `public/gallery/tokens.css` and `system.css` byte-identical to `ux/reference/interface/` (journey 11). App styling in `public/gallery/app.css`. Token/system changes are SYSTEM CHANGES and need the governor's word.
10. Journeys only touch a test target; `e2e/helpers.ts` refuses the live project (`kemrceegbyizpcfewgri`) and the live site. Allowed targets: hosted test project `fbgrumcwlnoljkkbiqfe`, or the local stack `http://127.0.0.1:54321` (loopback only).
11. Secrets go only through the environment's secure form or the dashboard's own form, never in chat.
12. Never test a server whose served page lacks the current `.next/BUILD_ID` (`e2e/run-hosted.sh` enforces it).
13. Running suites:
    - One suite at a time (runner lock). Nothing heavy beside a suite. Each suite its own background command (timeout 3600000).
    - Start `next start -p 3100` as its own background command; kill the old one first (`pkill -f next-server; pkill -f "next start"`).
    - Read results from the summary line, never from a wrapper's exit code.
    - Never wait with a bare `sleep`; use a background `until` loop.
14. Every change set needs: full suite phone and desktop; independent review (builder-reviewer); design skills run and named; axe/keyboard/reflow (journey 15); before/after renders; receipt `doctrine/receipts/…md`; ledger entry per incident; a PR; merge only on the user's word; live confirmed afterwards.
15. Before merging: clean tree; PR head = tested head (merge with `expectedHeadSha`); red CI log read and confirmed to be only `DOCTRINE_READ_TOKEN` unset, said in the merge message; Cloudflare "Workers Builds" check green.
16. After a merge, fast-forward the working branch to the default branch (`git merge --ff-only`, then push). Never force-push.
17. A Stop hook refuses to end a turn with uncommitted or untracked files: commit and push before ending each turn.
18. FIXED decisions keep their meaning whatever a drawing shows (GAL-C1, GAL-P1, P-11, GAL-PR-02, GAL-OD-04, GAL-OD-02/03/15, GAL-14, GAL-R10).
19. Each new or changed test must be able to fail. Prove it with a planted defect or a control build (run the new test against the previous build).
20. Before restoring a file from history, list the rules added after that point and carry each forward or drop it on purpose.
21. A design review compares rendered screens against named external references and lists what each change removes.
22. A subset run that skips fixture-producing journeys (03, 04) is indicative only; the full suite is the receipt.
23. `ui-consistency:verifying` uses a separate agent, calibrated first on a copy with one planted difference.
24. CLAUDE.md standing rule 7: the whole-app sweep (journey 14, `ux/APP_RULES.json`) must pass before showing any screen or opening a PR.
25. Never delete or loosen an `APP_RULES` rule or an Interface Standard rule to pass. A wrong rule changes on the governor's word.
26. After an interrupted suite, check the shared fixtures or let a full run reseed.
27. CLAUDE.md standing rule 8: every screen state measured by journey 15 and listed in `ux/INTERFACE_PROFILE.json`; follow `.claude/skills/interface-standard/SKILL.md`. "Never shrink type or spacing to fit, and never loosen a rule to pass."
28. **Build with `npm run build`, never `npx next build`.** Its postbuild stamps `.next/SOURCE_FINGERPRINT`. `npx opennextjs-cloudflare build` also rebuilds `.next` and **shuts the gate**: run `npm run build` again and re-run both suites afterwards.
29. **The gate** (`python3 scripts/app-sweep-gate.py`) needs four PASS receipts per viewport on the build on disk: suite, app-sweep, interface, interface-drill.
30. A new screen state goes into `ux/INTERFACE_PROFILE.json` before it is built.
31. Editing any fingerprinted file (src/, public/, db/migrations, `ux/APP_RULES.json`, `ux/INTERFACE_PROFILE.json`, `e2e/helpers.ts`, `e2e/14-…`, `e2e/15-…`, `e2e/16-…`, `e2e/support/…`, kit STANDARD/engine, package.json, next.config.ts, open-next.config.ts, tsconfig, playwright.config) voids the build stamp and the running suite: stop it, rebuild, restart, rerun. Docs, ledger, receipts, `doctrine/review/`, `scripts/`, `tools/`, `ESCAPES.md` are outside the fingerprint.
32. The site answers the same whether or not an address has an account (non-disclosure). Copy near sign-up says "may", never "does".
33. The server must stay within Cloudflare Workers Free (10 ms CPU per request): no image processing or other heavy compute on the server; journey 17 enforces no codec in the build and a server-CPU budget per photo.
34. Reviewers (Gemini, Grok, any agent) never run active tests against the live site; live checks by Claude are read-only and anonymous. A reviewer's finding is not acted on until reproduced.

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
| 37 | Join step 2 shipped with no Back, 13 px labels and 24 px field gaps | A measured standard on every state (GAL-L0041) |
| 38 | The first Interface Standard could pass bad screens | Fail-closed engine, policed profile, exact drill, stamped builds (GAL-L0042) |
| 39 | The gate opened while the full suite was red | Suite receipt required beside the others |
| 40 | Kept steering the governor into a phone-walk step after he had said a real studio would be the test | "Stop fucking around, I told you we will get these checked with a real studio." Never route the test back to him |
| 41 | Recorded "It came" as the sign-up email; it was the password-reset email | Name which email or screen was seen before recording SEEN |
| 42 | Left the sign-up screen with no way out when the address already had an account | A waiting screen names the exit (R13, GAL-L0043) |
| 43 | Named Worker *memory* as the likely cause of the upload failure before seeing logs | The log showed CPU time. Get the Cloudflare log before naming a cause |
| 44 | Review-pack PDFs held 42 broken-image icons each and the tool reported success | Tools refuse to write output with any image unloaded (proved with a planted copy) |
| 45 | A new try/catch swallowed Next's server-action redirect, so a successful publish landed on "did not finish sending" (full suite caught it) | Let `NEXT_REDIRECT`/`NEXT_NOT_FOUND` digests pass through every catch |
| 46 | A new stuck-upload test passed on the old build (another failure on the page showed the band) | Run each new test against the previous build; make it target the exact thing |
| 47 | Did not check the hosting plan's limits against the app before going live (GAL-L0044) | Check production runtime limits, not only the test runtime |

## 6. Decisions
| Decision | Why |
|---|---|
| Doctrine pin `6dc016c485ec1ddf31163534d84e02e0f74772f0` | user |
| Live Supabase `thegallery` (`kemrceegbyizpcfewgri`); hosted test project `thegallery-test` (`fbgrumcwlnoljkkbiqfe`) **paused** | governor "C" (2026-11-12) |
| Supabase stays on the **Free plan**; two active projects: `treksfit-prod` and `thegallery` | governor ("C"; the other session's handoff) |
| Cloudflare stays on **Workers Free** (10 ms CPU) | governor "Paid plan. No." (2026-11-24) |
| **Photo fix A:** photos prepared in the maker's browser, sent straight to storage on signed upload URLs; server only reserves, checks, records | governor "A" |
| **Test place: local Supabase stack** in the session (Docker) | governor "Go." |
| Pre-release review: three independent readers (Gemini broad, Grok adversarial, Claude live-behaviour), triage register, release gate (`doctrine/review/REVIEW-PLAN.md`) | governor asked; plan built |
| A real studio, not a demo, is the first walk of sign-up and upload | governor 2026-11-11 |
| Auth email through Resend as Supabase custom SMTP; Confirm and Reset templates link to `/makers/confirm/{token}` and `/makers/reset/{token}` | set by the governor |
| Sign-up keeps non-disclosure and names an exit (R13) | governor "Yes. Do that fix." |
| Vocabulary: work · maker · gallery · Studio · The Gallery · on view · retired · taken down · ways to contact; "By enquiry", "Not for sale" | Wave 3 |
| Price rule (`labelPrice`): no price beside Sold or Not for sale; tiles show every status but "Available" | P-11 / GAL-PR-02 |
| The Gallery names no city of its own | GAL-OD-04 |
| Bottom bar Home · Search · Saved · Studio; Back on every non-top-level state | board; IS-N1 |
| Footer = "The Gallery · About"; About + Participation + Privacy as one screen | governor |
| Workshops hidden until the first workshop exists | "hide" |
| SYSTEM CHANGE approved: `--t-field-label` 16 px; `--t-label` 12; `--t-nav` 12; `--t-meta` 14; `--t-caption` 14; `--bar-h` 64; `.field` 32 px apart; help 8 px under its field; 4 px grid | governor |
| Standard → Doctrine via option A (candidate drafted; only the governor promotes) | governor |
| Decision C (price "On enquiry" vs status "By enquiry") → later | governor 2026-11-09 |
| Merged PR #11–#17 over red CI (`DOCTRINE_READ_TOKEN` unset) | governor's word per PR |

## 7. Changed / rejected
- Governor's own phone walk → the real studio's walk.
- Supabase default email sender → Resend SMTP and custom templates.
- Server-side photo processing (WASM codecs in the Worker) → browser-side preparation (PR #18).
- Hosted test project for journeys → local Supabase stack while it is paused.
- Studio error page "images up to 12 MB go up…" → "Nothing you had already saved is lost. Try again. If it keeps happening, come back in a few minutes."
- ❌ Supabase Pro plan (offered so test + TreksFit + live run together, with backups): governor chose "C".
- ❌ Cloudflare Workers Paid plan: "Paid plan. No."
- ❌ Option C for photos (slim the server codecs): cannot get under limits.
- ❌ Asking the studio to retry with small photos as a stopgap: not reliable.
- A2 / B2 → original registers; words-only empty states → plinth back; bookmark Save → round heart; Search button + Clear → one field; Saved list → picture grid; colophon "The Gallery, Bengaluru" → "The Gallery · About"; sheet intent choices → removed; maker gallery one-column → three-across; Join long form → three steps; Back hidden from 900 px → Back at every width; type 10.5–13 px → 12–16 px; 24 px rhythm → 32 px; `npx next build` → `npm run build`.
- ❌ Footer Privacy link; rewording "Makers, studios and collectives"; "Available · ₹6,800" on the home label; an "All" chip on Search; journeys on the live site; restoring the old Supabase project; force-push; "It is free"; icon options 1–3; a report row before a report route exists; board sample photos on For Makers; telling sign-up whether an address has an account.

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Live site | https://atthegallery.in (Cloudflare Worker `thegallery`, Workers **Free** plan, auto-deploys the default branch within ~1 min; observability logs on) |
| Repo / default branch | `r959qp5qwr-web/Thegallery`, `claude/the-gallery-foundation-7plo1e` |
| Default branch tip | `de0401e70e522bcfc5565c7d9a0f5c007156d680` (Merge PR #17) |
| Working branch (session #11) | `claude/modest-wozniak-rhqebe` (a new session gets its own designated branch: create it from the default branch, or continue PR #18's branch if instructed) |
| PR #18 | https://github.com/r959qp5qwr-web/Thegallery/pull/18 — "Photos are prepared in the maker's browser (uploads were cut off on the Free plan)". Tested code head `29c8516333a63866fc56437af82367028e8a6bf8` (this handoff adds a docs-only commit after it; docs are outside the fingerprint). Commits: b29514e, f4e57a0, 903945d, 43a97e8 (review pack), 9d5e1a4 (local stack), f62ee24 (fix), 29c8516 (review fixes, copy, receipt). Workers Builds: success. "Orientation, gates and drill": failure (expected `DOCTRINE_READ_TOKEN`; log not yet read). **Not merged** |
| PR #18 results (local stack) | build `22b13d0gXFCgXiN9ztuuT`; phone **107 passed, 1 skipped** (5.3 min); desktop **108 passed** (3.6 min); gate OPEN; journey 17 server CPU per photo 60–199 ms across runs (budget 400; old code 1,044 ms) |
| Worker size | `wrangler deploy --dry-run`: 7,274.49 KiB / gzip 1,465.94 KiB (Free limit 3 MB) |
| Cloudflare log (23 Nov, UTC) | studio session: account created 10:00:21; signed in from link 10:00:54 (`/makers/sign-in?confirmed=1`); join 10:02:01; WhatsApp 10:02:12; upload POST `/studio/works/new` 11:28:52 **exceededCpu** at 1,419 ms; POST `/studio/works/{id}?confirm=remove-{id}` 11:36:26 **exceededCpu** at 1,892 ms; 43 of 129 requests killed 11:28–11:45, plain pages killed at 10–16 ms; 0 kills outside that window. Export covered 2026-11-22T03:19 → 2026-11-24T02:04, 898 invocations; ok median CPU 13 ms, max 927 ms (cold starts). CSV kept out of the repo |
| Local codec measure (Node) | 4000×3000: ~720–850 MB, 8–20 s CPU; 2400×1800: ~330 MB, 4 s; 1000×750: ~150 MB, 2.5 s |
| Live Supabase | `kemrceegbyizpcfewgri`, publishable `sb_publishable_joD-RqEyX63-Y1CwQSErxg_nuGsUB7N`. The proxy-injected management token cannot read it (403) |
| Hosted test Supabase (paused) | `fbgrumcwlnoljkkbiqfe`, publishable `sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd`, schema `gallery`, bucket `gallery-images` |
| Local test stack | `bash e2e/local/up.sh` (Docker; starts dockerd if needed; images from `public.ecr.aws` because Docker Hub returns 429; Supabase CLI `supabase@2.122.1`; Postgres 15). API `http://127.0.0.1:54321`, DB `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, mail `http://127.0.0.1:54324`, publishable key `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` (CLI default, public). Config `e2e/local/supabase/config.toml`; migrations generated into `e2e/local/supabase/migrations/` (gitignored) from `db/migrations` + `e2e/support/test-project.sql` + bucket |
| `.env.local` for the local stack (gitignored; recreate) | `SUPABASE_URL=http://127.0.0.1:54321`, `SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`, `SUPABASE_STORAGE_BUCKET=gallery-images`, `GALLERY_SCHEMA=gallery`, `GALLERY_BASE_URL=http://127.0.0.1:3100` |
| Setup | `npm ci`; `bash e2e/local/up.sh`; `npm run build`; server `npx next start -p 3100` (own background command; for the hosted target add `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`) |
| Suite command | `GALLERY_TEST_TARGET=local bash e2e/run-hosted.sh --project=phone --trace off --reporter=line` (and `--project=desktop`); without `GALLERY_TEST_TARGET=local` it targets the hosted test project |
| Environment | "The Gallery (with Doctrine)" `env_015jqYRQ2fkV9xhRroHttVvw`; `api.supabase.com` token proxy-injected [secret removed: re-enter it] |
| Live auth email | Custom SMTP on: `smtp.resend.com`, port `465`, username `resend`, password = Resend API key [secret removed: re-enter it], sender `no-reply@atthegallery.in`, name `The Gallery`. Templates: Confirm `{{ .SiteURL }}/makers/confirm/{{ .TokenHash }}`; Reset `{{ .SiteURL }}/makers/reset/{{ .TokenHash }}` |
| Email seen working | Reset email (2026-11-11). Sign-up confirmation for a brand-new address: **SEEN in the Cloudflare log** (studio, 23 Nov, 33 s from create to sign-in) |
| Photo pipeline (PR #18) | Browser: `createImageBitmap(file,{imageOrientation:"from-image"})` with fallbacks; original long edge ≤ 3000 px (JPEG 0.9); variants w320/w640/w1280/w1920 (JPEG 0.82), never enlarged except w320; min 200 px each side on the sent size; files `original.jpg`, `w320.jpg`… Server: `beginPhotoAction` (row `uploading`, signed upload URLs), `finishPhotoAction` (list, sizes ≤ 6 MB, mark `ready` with variants `{w320:"w320.jpg",…}` or `failed`), `finishNewWorkAction`. Uploads `uploading` > 10 min show as failed. Default 1 MB server-action body limit (12 MB allowance removed) |
| Interface Standard | version 1.3.0; 16 rules; 36 profile states; drill 38 cases per viewport |
| Key thresholds | body ≥16 px; labels ≥16; secondary ≥14; nothing <12; typed text ≥16; line height ≥1.4; ≤80 chars/line; targets ≥44×44; inputs ≥48 tall; fields ≥32 apart; side margin ≥16 on phone; 4 px grid; one primary; Back in the top 96 px; axe WCAG 2.2 AA |
| App rules | R01–R13 (R13-no-dead-end) |
| Journeys | 01–17 (14 sweep, 15 standard, 16 drill, **17 server budget**); phone 108 tests |
| Ledger latest | **GAL-L0044** (photo uploads cut off on Workers Free); escapes latest **E09** (C1 runtime coverage) in `kit/interface-standard/ESCAPES.md` |
| Test seeds | Maker A `anika.rao@makers.example` / `kiln-and-monsoon-9` (anika-rao, Khurja); Maker B `studio@dhaaga.example` / `warp-and-weft-11` (dhaaga-studio, Jaipur); Operator `operator@thegallery.example` / `operator-of-record-7` |
| Test works | "Monsoon Vessel No. 4" (Maker A), "Unfinished Warp" (Maker B, retired) |
| Shared-project plan (from the my neighbourhood session, 2026-11-13) | `thegallery` will also host AHOY RIDESHARING APP (`mupctqclstbnvrvxycep`: my neighbourhood, Ahoy, Ustaad, Nukkad) and maase (`mrazsrziwmbwrlsbzglq`) in `public` or own schemas; anonymous sign-ins to be switched on project-wide; order: Gallery fixes first, then the owner switches anonymous on, then data copied in |
| Hole verified | `gallery.makers` policy `maker_self_insert` = `WITH CHECK (user_id = auth.uid())` (`db/migrations/002…sql:103`); `operational_failures` `failure_insert` `WITH CHECK (true)` (line 144); `is_operator()` reads the `operators` table (safe); storage writes need an active maker (safe). With anonymous sign-ins on, anyone with the public key can become a maker by API |
| Review pack | commit `43a97e8`; files `00-READ-FIRST.md`, `01-APP-SOURCE.md` (~102K tokens), `02-PRODUCT-AND-TESTS.md` (~140K), `03-SCREENS-phone.pdf` / `-desktop.pdf` (42 screens each, mixed sources labelled), `04-PROMPTS.md`, `MANIFEST.txt`; zip 2.5 MB. Rebuild: `python3 scripts/review-pack.py <out> --screens <dir>` (needs a clean tree) |
| Breakpoints / widths | 600 / 900 px; page max 1200; Studio column 760; forms ≤ 560 |
| Colours | paper #F8F3EA, paper-deep #F0E9DC, limestone #E7DECF, ink #221E1A, ink-soft rgb(61, 54, 48), amber #A5501F, amber-deep #8A3F14 |
| Artifacts (private) | Board https://claude.ai/artifact/NhfhLaQztV53zwQpYaho7g · checklist v2 https://claude.ai/artifact/TXrno4ACqCY1pEdD8vKKz7 · Wave 5 pass https://claude.ai/artifact/NrK3jfHcXvEXurUAx5NiVp |
| Studio flow (live code) | `/makers` → `/makers/create-account` (Step 1 of 3) → `/makers/check-email` → `/makers/confirm/{token}` → `/studio/join` (Step 2) → `/studio/whatsapp?join=1` (Step 3) → `/studio` → `/studio/works/new` → work page; public `/m/<handle>` |

## 9. People, terms & names
- **People:** the user = the Governor. The first real studio = a studio the governor knows (name, email, number, photos stay out of the repository). "my neighbourhood build session" = another Claude session preparing the shared Supabase project.
- **Terms:**
  - "drawing board" = the 16-screen restart; "docked action" = the solid ink bar at a screen's foot.
  - "the sweep" = journey 14; "the standard" = journey 15; "the drill" = journey 16; "server budget" = journey 17; "the gate" = `scripts/app-sweep-gate.py`.
  - "escape" = a fault found after the gate was open: C1 coverage / C2 measure / C3 standard / C4 judgement.
  - "phone walk" = live proof on a physical phone; now the real studio's walk.
  - "review pack" = the files given to Gemini and Grok; "release gate" = phase 7 of `REVIEW-PLAN.md`.
  - "curator" = governor's proposed role that reviews and approves maker requests (scope not decided).
  - "local stack" = Supabase in Docker in the session.
- **Names in use:**
  - Review: `doctrine/review/REVIEW-BRIEF.md`, `REVIEW-PLAN.md`, `REVIEW-PROMPTS.md`; `scripts/review-pack.py`; `tools/review-pack-screens.mjs`.
  - Photo fix: `src/lib/photo-prepare.ts`, `src/components/PhotoForms.tsx` (`AddPhotoForm`, `NewWorkForm`, `rethrowNavigation`), `src/app/actions/studio.ts` (`beginPhotoAction`, `finishPhotoAction`, `finishNewWorkAction`, `createWorkAction` returns `{created}` when `photo=1`), `src/lib/storage.ts` (`readVariant`, `BUCKET`), `worker-entry.ts` (re-export only), `e2e/17-server-budget.spec.ts`.
  - Local stack: `e2e/local/up.sh`, `e2e/local/supabase/config.toml`; helpers `LOCAL_URL`, `isLocal`, `TEST_API`.
  - Receipts: `doctrine/receipts/PHOTO-UPLOAD-WORKER-CPU-2026-11-24.md`, `doctrine/receipts/photo-upload/after-*.png` (synthetic).
  - Skills: `.claude/skills/interface-standard/SKILL.md`, `.claude/skills/gallery-app-sweep/SKILL.md`; design skill used this session: `design-skills:ux-writing`.
  - This file: `doctrine/handoffs/handoff-the-gallery.md`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Photo upload fix | **PR #18 open, awaiting the governor's word** | head `29c8516` (+ handoff commit) | read the red CI log before merging; then live confirm with the studio's retry and the Worker log |
| Local test stack | working | `e2e/local/` | containers die with the session; rerun `up.sh` |
| Hosted test project | paused | — | journeys use the local stack |
| Review pack | sent to the governor | `43a97e8` | Gemini and Grok findings NOT received |
| Claude's own review (step 3c) | not started | `REVIEW-PLAN.md` | governor's yes/no not given |
| Shared-project anonymous-sign-in fix | **not started; urgent before anonymous sign-ins switch on** | — | the other session waits for Gallery's confirmation |
| Curator role | idea; options given | — | governor's answer pending |
| Drawing board parts 1–3, sweep, standard, R13 | live | PR #12–#17 | — |
| Studio walk | stalled at photo upload | live site | draft with a stuck "Uploading" image row; now shows as failed after merge |
| Doctrine candidate H-INTERFACE-001 | DRAFT | `doctrine/harvests/` | governor: accept / modify / reject |
| CI | red on every PR | needs `DOCTRINE_READ_TOKEN` | gate receipts are local |
| `PRODUCT_STATE.json` | stale (says nothing deployed; architecture names Vercel) | — | drift finding for the review |
| Pre-existing UI oddity | noted | work edit screen of a retired work | "Title" label shows with no visible field above "Save label" |

## 11. Next steps
1. **Next action:** ask "Merge PR #18?". On the word: read the red CI log (confirm only `DOCTRINE_READ_TOKEN`), confirm Workers Builds green, merge with `expectedHeadSha`, fast-forward the branch, confirm live, then give the governor the studio message: "The photo problem is fixed. Please open your Studio and add your photos again. If anything doesn't work, send me a screenshot." Then check the Cloudflare log for the studio's upload (no exceededCpu).
2. The anonymous-sign-in fix for the shared project (before the owner switches anonymous on): block anonymous identities at `maker_self_insert` and `failure_insert` (proposed `coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false`), prove with the local stack (enable anonymous sign-ins there), full process. Tell the other session (through the governor) when it is live.
3. Curator role, once the governor chooses a scope.
4. Receive Gemini and Grok findings; build `doctrine/review/FINDINGS.md`; reproduce each; fix by area.
5. After the studio's walk: `PHONE-WALK-<date>.md`.
6. Later: page CPU (~13 ms vs 10 ms on Free); real-device checks (iPhone Safari iOS 15–17, mid-range Android Chrome, 48–50 MP photos); bucket size/type limits; Doctrine candidate; `DOCTRINE_READ_TOKEN`; report route; live operator account; "Continue" tap before confirm links; HEIC on Android; decision C; the missing Title field.

## 12. Open questions ⚠️
1. **Merge PR #18?** (yes / not yet)
2. **Curator scope:** A taste gatekeeper (reverses GAL-OD-03, GAL-14, GAL-R10) / **B admission steward (recommended:** reviews join requests against the participation rules only, approve or decline with reason and appeal, no public badge; amends OD-03) / C inviter (invitations only).
3. **Pending makers may prepare works privately before approval?** (yes / no)
4. **Start the anonymous-sign-in fix now?** (go / wait)
5. **Claude's own live-behaviour review (step 3c, including read-only anonymous checks of the live site)?** (yes / no)
6. **Dashboard screenshots for the review** (backups, auth settings, rate limits, Resend limits, operator account): now / later.
7. Carried: Doctrine candidate H-INTERFACE-001 (accept / modify / later); `DOCTRINE_READ_TOKEN` (yes / not yet); live operator account (yes / no / don't know); sweep + standard plugin (yes / later); PR #17 after-the-fact design review (yes / no); decision C; rotate test credentials; Supabase auth email rate limit and Resend plan limit (UNKNOWN); shared Free-plan quotas (500 MB DB, 1 GB storage, 5 GB egress) across all apps on `thegallery`; shared email templates would send other apps' sign-ups as "The Gallery".

## 13. Re-attach checklist
- [ ] Nothing has to be attached. This file is committed at `doctrine/handoffs/handoff-the-gallery.md` on `claude/modest-wozniak-rhqebe` (PR #18). Open the new session on `r959qp5qwr-web/Thegallery` with `builders-doctrine` beside it, in environment "The Gallery (with Doctrine)", and point it to this file.
- [ ] Optional: the review pack zip (`the-gallery-review-pack-43a97e8.zip`) if the governor wants it re-sent; otherwise rebuild it with `scripts/review-pack.py` at a clean commit.
- [ ] Gemini's and Grok's findings files, when they exist.

---
<sub>Audit: 13/13 sections · 34 rules · 47 corrections · 140 data points · secrets removed: yes · generated by active-memory</sub>
