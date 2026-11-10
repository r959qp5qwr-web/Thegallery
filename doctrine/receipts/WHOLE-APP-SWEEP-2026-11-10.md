# Receipt: the whole-app sweep, and the policy screens (2026-11-10)

**Authority:** governor, 2026-11-10, on three screenshots of the live site (Participation, its end, the empty Home):
- "Please review these screens. Identify what's wrong, should not be there and correct it. There are too many issues for me to talk about and most we have already spoken against."
- "Can you identify the reason why such issues persist, build a skill to resolve them. Create a hook that scans through the full app, before rendering so that I don't have to bring you back these issues one off. Learn from mistakes, create a mechanism to do so."

Not a SYSTEM CHANGE: `tokens.css` and `system.css` are untouched. Page styling is in the "Policy screens" block of `public/gallery/app.css`.

## Why the issues persisted (ledger GAL-L0038)
1. Each review, render set and design pass covered only the pages its change touched. Part 2 rebuilt About and left `/participation`, `/privacy` and the footer as they were.
2. The governor's corrections lived as prose: the handoff's corrections table, the ledger, a session's memory. They were never checked on every page.
3. The journeys proved that new things work, not that rejected things are gone everywhere.
4. The governor sees the whole app on a phone; the builder looked at a slice.

## The mechanism
| Layer | File | What it does |
|---|---|---|
| Rules | `ux/APP_RULES.json` | 12 corrections as checks, each with its source: no city (R01); no monospace sentences (R02); no "not X, not Y" copy (R03); no rejected words (R04); nothing that looks tappable but isn't (R05); the colophon is the name and About (R06); no empty band under the footer (R07); one h1 (R08); at most one solid action (R09); no sideways scroll (R10); a visible way back (R11); no paragraph over 75 words (R12) |
| Sweep | `e2e/14-whole-app.spec.ts` | Finds every page from `src/app/**/page.tsx`; a page with no entry fails. Opens each as its viewer (visitor, maker, operator) and checks that the page reached is the page asked for. Reads text at rest, folded text and control names, and applies every rule. Saves a full-page picture of each page to `test-results/app-sweep/<project>/`. Writes `.doctrine/runtime/app-sweep-<project>.json` with a fingerprint of the code it saw. Runs inside the full suite |
| Gate | `scripts/app-sweep-gate.py` | Open only with PASS receipts for phone and desktop on exactly the current code (src/, public/, the rules, the sweep, helpers, Next config, package files). Anything missing, stale, failed, unreadable or uncounted keeps it shut |
| Guard | `scripts/doctrine-hook.py` rule SWEEP-1 | Refuses to open or merge a pull request while the gate is shut |
| Learning | `.claude/skills/gallery-app-sweep/SKILL.md`; CLAUDE.md standing rule 7 | Each correction becomes a rule, is proved to fail on the screen shown, every flagged page is fixed, a ledger entry is written; rules are never loosened to pass |

**Configured vs enforced.**
- The suite is enforced everywhere: every merge already needs a passing full suite (rule 14).
- The guard rule SWEEP-1 is ARMED_AS_CONFIGURED. The repo's hooks do not load when a session opens on a parent folder, which is this session's topology. SEEN: the guard's own GUARD-3 would have refused this session's PR merges, and did not.
- The same gate is also wired in this session's own settings (`/workspace/.claude/settings.json`). Whether the host picked it up mid-session is UNKNOWN.
- A hook that travels with the governor into every session needs a plugin on the account. Not built.

## What changed on the screens
| Screen | Before (live) | After |
|---|---|---|
| Participation | "Fair use of The Gallery" at display size, "Anyone can open a gallery" (then "Retailers… are not admitted"), italic section labels, sentences in monospace, no Back | Back · wordmark. "Who can open a gallery", then "What we act on" with the five categories by name, each with one plain sentence; the reason, reversal ("most can be reversed") and reply line; "No one here rates the work or checks who a maker is." |
| Privacy | A 94-word paragraph, "we neither carry nor keep them", no Back | Back · wordmark. Four short sections: Visiting, Messaging a maker, Making, Closing your account |
| About (folds) | The same old text, mono sentences | The same new text as the two pages |
| Footer, every screen | "The Gallery · About · Participation · Privacy", 100 px of empty paper under it | "The Gallery · About" (on About, the name only); its own padding only |
| Close account, operator pages | Reasons and consequences as monospace sentences | The body face |

### Removed (rule 21)
- The words "Fair use", "Anyone can open a gallery", "not admitted", "We do not judge … and we do not verify …", the long Privacy paragraph.
- Participation and Privacy links in the footer. Both pages stay, and both are reached from About's rows.

### Meanings kept (checked against `git show 8d90a72:src/components/Policies.tsx`)
GAL-OD-02 (makers, studios and collectives; made or materially produced; not retailers or ordinary resellers), GAL-OD-03 (opened with an email address, no review before publishing, no mark of approval), GAL-OD-15 (the five categories by name, a written reason, reversible where appropriate, reply to the notice), GAL-07 / GAL-OD-12, GAL-P1, GAL-OD-09.

## Proof
| Check | Result | Status |
|---|---|---|
| The sweep fails on the old code (control) | On the live build `UhdkxbzpibZovSIAXEp2u`: FAIL, findings on 15 of 27 pages. Every issue in the governor's screenshots was flagged: mono sentences, the doubled negative, "Fair use", no Back, the footer links, the empty band. Not raised by him, and also found: a 94-word Privacy paragraph and mono sentences on Close account and the operator pages | SEEN |
| The landing check catches a redirect (control) | `/studio/join` without its declared redirect: "asked /studio/join, landed on /studio" | SEEN |
| The sweep caught the builder | It flagged a new doubled negative written in this change ("no visitor account, and no tracking") on About and Privacy; reworded | SEEN |
| Phone suite, build `Uowbq2yNGbEZJtp4r91Gu` (code `b223f75`, previous session) | 100 passed, 1 skipped (28.9 min); superseded below | SEEN |
| Desktop and phone, build `A_gODj5BRF1PfBLYc2Yu0` (code `b223f75`, this container) | desktop **101 passed** (27.5 min); phone **100 passed, 1 skipped** (28.8 min); gate OPEN. Superseded by the heading fix | SEEN |
| axe, keyboard, reflow on /about, /participation, /privacy (build `A_gODj5BRF1PfBLYc2Yu0`) | axe `heading-order` on /about with the rows open (h1 then h3), phone and desktop; 0 elsewhere. Fixed in `435a224` (GAL-L0039) | SEEN |
| Desktop and phone, build `PmoFum7aIcB42fwmIYemr` (code `435a224`) | desktop 101 passed; phone 100 passed, 1 skipped; gate OPEN. Superseded by the design-review fixes | SEEN |
| R03 widened to "not X, or not Y" (control) | the sweep alone (journey 14, phone) on build `PmoFum7aIcB42fwmIYemr` with the widened rule: FAIL, R03 on /about and /participation ("Anything not allowed here, or not lawful…"), nothing else | SEEN |
| **Desktop suite, build `X_B_m5XR5Pz6eVmoBTotD` (code `c8683ed`)** | **101 passed** (26.7 min), summary line read. Sweep receipt PASS, 27 of 27 pages, 12 rules | SEEN |
| **Phone suite, same build** | **100 passed, 1 skipped** (29.2 min), summary line read. Sweep receipt PASS, 27 of 27 pages, 12 rules | SEEN |
| **Gate** `python3 scripts/app-sweep-gate.py`, same code | `OPEN — phone and desktop passed on this code` | SEEN |
| **axe** (4.10.2: wcag2a, wcag2aa, wcag21aa, best-practice), same build | 0 violations on 8 states: /about (rows closed and open), /participation, /privacy; phone and desktop | SEEN |
| **Keyboard**, same build | every Tab stop visible, named and ringed: /about 10 / 9, /participation 8 / 7, /privacy 8 / 7 (phone / desktop) | SEEN |
| **Reflow 320 px**, same build | scrollWidth 320 on all four states | SEEN |
| Shared fixtures before and after the runs (rule 26) | Monsoon Vessel No. 4 Sold; Unfinished Warp retired; no work left taken down after the empty-Home render | SEEN |
| Gate refuses a shut state | `app-sweep-gate.py`: SHUT on a stale receipt and on a missing one; hook mode denies an unreadable payload; guard SWEEP-1 denied `create_pull_request` | SEEN |
| Repository gates and drill | 5 of 5 green; drill 89 PASS | SEEN |
| Independent review (builder-reviewer) | 2 High, 6 Medium, 5 Low; all fixed or recorded, as listed in the PR | SEEN |
| Renders | `policy-screens/before/` (live build) and `after/` (build `X_B_m5XR5Pz6eVmoBTotD`), phone and desktop: Home, empty Home, About closed and open, Participation, Privacy | SEEN |
| Independent review of the heading fix (builder-reviewer) | no blocking finding; Low: About's outline is flat (the row names are in `<summary>`, not headings); Low: the sweep runs no axe | SEEN |

## Design skills run (independent agents) and what was done with them
| Skill | Verdict / main findings | Done |
|---|---|---|
| `ui-consistency:verifying` (separate agent; calibrated first on copies with one planted difference: found the wrong Back on the /participation copy by reading) | INCONSISTENT, 4 Medium: heading block unlike About's; same text with different outlines; "not …, or not …" copy; (footer "·" is shorthand, not a finding) | heading block and tracking matched to About; copy fixed; R03 widened; tab title = h1; indentation |
| `vectorlab-ux-skills:anti-slop` | no hard-rule violation; Low: desktop About ends thin | kept |
| `vectorlab-ux-skills:typography` | Medium: fold sub-headings larger than the row; /participation title and section title equal; Low: long lines | row name leads (grid-title), inner headings body; section title subheading; measure 34rem |
| `vectorlab-ux-skills:spacing` | Medium: ~72 px hole before "What we act on"; Low: narrow left column on wide screens | gap 48 → 32; column kept |
| `design-skills:ux-writing` | Medium: "not …, or not …"; Visiting a five-sentence block, three negatives, heading echo; Low: "Making" unclear | all fixed |
| `design-skills:design-critique` (refs: Are.na about/guidelines, Etsy House Rules, Tate / Whitechapel footers) | Medium: no Privacy in the footer; HOME lit on About | footer kept: the governor's 2026-11-10 decision (name and About); HOME lit on About is app-wide and live already, listed below |

Not reopened (fixed): the footer's links; "Makers, studios and collectives" (GAL-OD-02 wording).

## Open
- Already on the live site, outside this change: HOME shows as current on About and the policy pages; desktop has no Back on these pages (the header hides it from 900 px); Back follows history, so /participation opened from Join goes back to Join.
- An axe pass inside the sweep, so the gate covers accessibility too (GAL-L0039).
- About's heading outline is flat: the row names are `<summary>` text, not headings. A heading inside `<summary>` is announced unevenly by screen readers; left as is.
- An appeal address published on the site (GAL-OD-15 says "by email"; the text points to the notice).
- A plugin so the gate follows the governor into every session.
- A drill case for SWEEP-1 in `scripts/doctrine-drill.py`.
