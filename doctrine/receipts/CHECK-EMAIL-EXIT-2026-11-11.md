# Receipt: no dead end after sign-up (GAL-L0043, escape E08)

Date 2026-11-11 · build `-UYwxHaLcLJQvNW0l88Up` (stamped) · standard 1.3.0

## What the governor found
A real sign-up with an address that already had an account: "Check your email", then no email. The site answers the same whether or not an address has an account, so the screen gave no way out.

## Change
- Rule R13 in `ux/APP_RULES.json`, check kind `has-links` (exact path, visible, inside main) in `e2e/14-whole-app.spec.ts`.
- Check your email: "No email? You may already have a gallery with this address." with Sign in and Reset your password.
- Join step 1: "I already have a gallery".
- Interface profile: the expired state `check-email-expired` (was never measured). It then failed IS-T5 (line height 1.35 < 1.4); fixed with line-height 1.5 on `.flow-line` in `app.css`. No token changed.
- Runner: `grep -q --` so a build id starting with a dash is not read as an option.

## Results
| Check | Result |
|---|---|
| Control: R13 on the old screen | FAIL, two findings on `/makers/check-email` only |
| Control: IS-T5 on the new profile state before the fix | FAIL, 1 finding |
| Full suite, phone | 102 passed, 1 skipped (33.4 min) |
| Full suite, desktop | 103 passed (31.4 min) |
| Gate | OPEN, phone and desktop |
| Independent review (builder-reviewer) | 2 points taken (exact path match; expired state profiled); the 44 px claim was wrong (`system.css:67`, journey 15 measured) |

## Design skills
No separate design skill was run for this two-link change; the interface standard (journey 15) measured every state, and the renders were read at 390 px. IS-M1 side-by-side against two outside references was not made: SEEN here are only before/after of this app. Say if you want it.

## Renders (390 px, 2x)
`check-email-exit/`: `check-email`, `check-email-expired`, `join-1`, each `-before` (live site) and `-after`.

## SEEN / NOT SEEN / UNKNOWN
- SEEN: suites, gate, renders above.
- NOT SEEN: the change on the live site; a brand-new address's confirmation email (still untested by anyone); the signed-in screens on a phone.
- UNKNOWN: live operator account; whether CI is green (it is red on every PR for `DOCTRINE_READ_TOKEN`).
