---
name: gallery-app-sweep
description: The Gallery's whole-app check and its learning loop. Use before showing the governor any screen, before opening or merging a pull request, after any change a person can see, and every time the governor corrects something on a screen ("this should not be there", a screenshot of a problem, "we have spoken about this"). Turns each correction into a rule that is checked on every page, so the same issue never comes back one page at a time.
---

# The whole-app sweep, and learning from each correction

## Why this exists (ledger GAL-L0038)
Corrections the governor had already made kept coming back on pages nobody had touched. Every
review, render and design pass looked only at the pages in that change; the rules lived in prose
(the handoff's corrections table, the ledger) and were applied only where someone remembered them.
The governor sees the whole app on a phone; the builder saw a slice.

## The pieces
| Piece | Where | What it does |
|---|---|---|
| Rules | `ux/APP_RULES.json` | Each correction as a check, with its source |
| Sweep | `e2e/14-whole-app.spec.ts` | Finds every page from `src/app/**/page.tsx`, opens each as its viewer (visitor, maker, operator) on phone and desktop, applies every rule, saves a full-page picture of each to `test-results/app-sweep/<project>/`, writes `.doctrine/runtime/app-sweep-<project>.json` |
| Gate | `scripts/app-sweep-gate.py` | Open only when both receipts say PASS for exactly the current code |
| Guard | `scripts/doctrine-hook.py` rule SWEEP-1 | Refuses to open or merge a pull request while the gate is shut (where the repo's hooks load) |

The sweep runs inside the full suite (`bash e2e/run-hosted.sh --project=phone|desktop`), which every
merge already needs. To run it alone while working: add `e2e/14-whole-app.spec.ts` to the command;
that is indicative only (rule 22), the full suite is the receipt.

## When to run it
1. **Before showing the governor any screen** (renders, an artifact, "it's live"): run the sweep,
   and look at the pictures in `test-results/app-sweep/` for the pages you did NOT change, not
   only the ones you did.
2. **Before a pull request**: `python3 scripts/app-sweep-gate.py` must say OPEN.
3. **After a merge**: open the live pages the sweep lists, not only the changed ones.

## When the governor corrects something: the loop
Do every step, in order, in the same change set.
1. **Name the pattern, not the instance.** "Participation has mono sentences" is an instance; the
   pattern is "a sentence is set in mono". Read the corrections table and the ledger: has this
   pattern been corrected before? If yes, say so plainly: it is a repeat.
2. **Write the rule** in `ux/APP_RULES.json`: `id`, `says` (one plain sentence), `source` (the
   governor's words and date, the correction or ledger id), `check`. Use an existing check kind
   where one fits; add a new kind to `apply()` in `e2e/14-whole-app.spec.ts` where none does. A
   pattern no machine can see (taste, tone) still gets a rule entry with `"kind": "manual"` and is
   listed in the receipt as a manual check, so it is read every time.
3. **Prove the rule can fail**: run the sweep on the code before the fix. It must flag the page the
   governor showed. If it does not, the rule is wrong; fix the rule, not the page.
4. **Fix every page it flags**, not only the one in the screenshot.
5. **Run the full suite**, both projects; the gate must open.
6. **Ledger entry** for the correction, naming the rule id; the receipt lists the rule and the
   control run.
7. **Never** delete or loosen a rule to make a sweep pass. A rule that is wrong changes on the
   governor's word, recorded in the ledger.

## Reading the result
The receipt lists findings by page and rule. Report it as SEEN with the counts, e.g. "sweep:
27 pages × 12 rules, phone and desktop, 0 findings". A sweep that did not reach every page is a
FAIL, whatever else it says.
