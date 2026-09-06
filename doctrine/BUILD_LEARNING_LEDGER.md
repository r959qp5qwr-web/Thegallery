# BUILD LEARNING LEDGER
**Product:** The Gallery  
**Status:** Living evidence ledger  
**Rule:** Record incidents here. Do not universalise them into doctrine here.

---

### GAL-L0001
**Date:** 2026-09-04  
**Observed event:**  
The commission asks Stage 1 for a key-screen set of at least nine surfaces (entrance, work detail, maker gallery, discovery, workshops, email door, dashboard/add-work, an error or empty state, the operator report surface). The bound `ux-design-assurance` v1.1 module fixes the interface reference set at 1–3 representative high-fidelity surfaces and refuses "mock every screen".

**Evidence:**  
`THE_GALLERY_FABLE_5_BUILD_COMMISSION_v1.1.md` §15 Stage 1; `modules/ux-design-assurance/v1.1/01_UX_SYSTEM_CORE.md` §7 and §12; Playbook §5A stop rules.

**Why it mattered:**  
Two authorities the product must obey read as conflicting at first sight. Silently following one would either bloat the pre-build design (Doctrine breach) or leave the governor unable to judge the operator and maker doors (commission breach).

**What changed:**  
Reconciled rather than chosen: the INTERFACE REFERENCE SET is three accepted surfaces that establish the grammar; the remaining key screens are rendered from the same token and component system as *inheritance demonstrations* (Playbook §5A "a minor surface may inherit … inheritance is recorded, not assumed"). Nine screens is not "every screen" of a product with several dozen surfaces. Recorded in `ux/UX_MANIFEST.yaml` and `ux/reference/interface/INTERFACE_REFERENCE_SET.md`.

**Status:** RESOLVED  
**Related finding / decision IDs:** GAL-G3 (authority order)  
**Harvest status:** UNHARVESTED

---

### GAL-L0002
**Date:** 2026-09-04  
**Observed event:**  
The product repository was unborn at binding: no commits locally, no refs on the remote, therefore no `main` branch although the commission names `main` as the base branch.

**Evidence:**  
`git ls-remote origin` returned nothing; `git status` reported "No commits yet" on the designated branch.

**Why it mattered:**  
A binding cannot point product decisions at a branch that does not exist, and a session must not invent `main` by pushing to it without instruction.

**What changed:**  
Governance became commit #1 on the designated branch `claude/the-gallery-foundation-7plo1e` (Canon Day Zero #4). The governor's merge establishes `main`. Recorded as OBL-GAL-005.

**Status:** OPEN (until `main` exists and is protected)  
**Related finding / decision IDs:** OBL-GAL-005  
**Harvest status:** UNHARVESTED

---

### GAL-L0003
**Date:** 2026-09-04  
**Observed event:**  
The central bootstrap validates every artifact a binding names but cannot see a working-tree edit on the pinned commit, cannot verify the commit itself, and does not expand the module manifest to the module's other 19 files. The central README states the first of these as the caller's obligation.

**Evidence:**  
`builders-doctrine/README.md` "The one thing this file cannot do for you"; `operating/doctrine_bootstrap.py` `validate()`.

**Why it mattered:**  
A product that ran the bootstrap directly would accept a tampered bootstrap, a checkout on the wrong commit, or an edited module file.

**What changed:**  
`scripts/doctrine-orient.py` fingerprints the bootstrap before executing it, verifies HEAD equals the bound commit and that bound paths are clean, cross-checks `VERSION.json`, and expands the module manifest. `scripts/doctrine-drill.py` D-04, D-07, D-08 and D-09 prove each of these fires.

**Status:** RESOLVED (product-local); candidate cross-product lesson for the H1 harvest  
**Related finding / decision IDs:** GAL-G2  
**Harvest status:** UNHARVESTED

---

### GAL-L0004
**Date:** 2026-09-04  
**Observed event:**  
Full-page captures of the reference surfaces showed the sticky bottom bar and the Studio action bar in the middle of the page, covering the "View maker's gallery" row and two form fields. The viewport captures of the same surfaces were correct.

**Evidence:**  
First renders of `R-1-entrance-full.png`, `R-2-work-detail.png`, `R-3-studio-add-work.png` (superseded; not retained). Cause: a `position: sticky` element is captured at the viewport's bottom edge when the page is expanded for a full-page screenshot.

**Why it mattered:**  
A capture defect looked like a design defect. Rendered evidence must state what it is evidence of (Audit Protocol L-A25); a render whose mode changes what is seen can produce both false findings and false reassurance.

**What changed:**  
Full-page renders now pass `?full=1`, which sets the bars static at the end of the page; every artifact in `INTERFACE_REFERENCE_SET.md` records its capture mode (viewport or full page).

**Status:** RESOLVED  
**Related finding / decision IDs:** L-A25  
**Harvest status:** UNHARVESTED

---

### GAL-L0005
**Date:** 2026-09-04  
**Observed event:**  
The first work-detail render carried icon-only Save and Share buttons, contradicting the Interface Foundation rule that only Back, Close and Search may be icon-only. The same pattern had been copied to the workshop detail.

**Evidence:**  
First render of `R-2-work-detail.png` and `I-3-workshops.png` (superseded); Foundation §6 "icon-only rule".

**Why it mattered:**  
A rule written the same day was broken the same day by the person who wrote it; the fresh-eye review, not the rule, caught it. The Canon's class rule applied: the defect was swept across every surface, not fixed on one.

**What changed:**  
Secondary actions are now icon plus underlined label on a second row on both surfaces; the review matrix records the correction under Affordance. Candidate product gate for Stage 2: an icon-only-button sweep over the component source (allowlist: back, close, search).

**Status:** RESOLVED  
**Related finding / decision IDs:** Foundation §6; L-A24  
**Harvest status:** UNHARVESTED

---

### GAL-L0006
**Date:** 2026-09-04  
**Observed event:**  
The pre-act guard shipped on 2026-09-04 caught its own top-level exception and exited 0, and the drill's case D-23 sent it malformed input, observed the resulting permission, and recorded PASS. A mechanism whose purpose is to withhold permission was converting its own malfunction into permission, and its own drill was ratifying that rather than testing it. The session report published the behaviour plainly, which is how the governor found it.

**Evidence:**  
Superseded `scripts/doctrine-hook.py` bottom-level `except Exception` returning `SystemExit(0)`; superseded `scripts/doctrine-drill.py` case D-23 "guard: malformed hook input → fails OPEN with a notice", expectation `expect_fail=False`; `THE_GALLERY_SESSION_REPORT_2026-09-04.md` §2.5.

**Why it mattered:**  
Two failure classes at once. The guard: an indeterminate verdict is not a permission, and the Canon's fail-open ruling protects the operator's access to the repository, which a hook cannot take away from a human with a terminal — so the ruling never licensed this. The drill: a test written against the implementation instead of the property will pass forever while the property is false. That is the L-A8 DECORATIVE shape wearing a green label.

**What changed:**  
GUARD-0 added: every indeterminate path — unparseable payload, absent payload, missing tool name, unknown tool, corrupt mutation-surface file, unhandled exception — now exits 2. Two things keep that from locking anyone out: the hook matcher covers only mutation-capable tools, so read-only work survives any guard malfunction, and the governance paths stay writable, so the guard can always be repaired. D-23 was replaced with a case that corrupts the guard's own configuration and requires the consequential act to be denied; D-19 to D-25 cover the other indeterminate paths. Recorded as FIXED decision GAL-G6, with the Governor instruction of 2026-09-04 taken as the derogation the Canon reserves.

**Status:** RESOLVED  
**Related finding / decision IDs:** GAL-G6, OBL-GAL-010, L-A8  
**Harvest status:** UNHARVESTED

---

### GAL-L0007
**Date:** 2026-09-04  
**Observed event:**  
The guard was wired to `Bash` alone. The session's actual tool surface offered ninety-four tools, of which sixty-one can change repository, published or external state: `Write`, `Edit` and `NotebookEdit` write files with no shell involved, and twenty-four GitHub MCP tools change the remote repository — including the central Doctrine — through the API, a route that touches neither the working tree nor the git hooks.

**Evidence:**  
Superseded `.claude/settings.json` with `"matcher": "Bash"`; the session's tool listing; `doctrine/MUTATION_SURFACE.json`.

**Why it mattered:**  
"Protect the shell" is the hand-written list the Canon warns about, and it was short in the most consequential direction available: `mcp__github__create_or_update_file` against `builders-doctrine` would have written to the read-only central authority while every local protection stayed green and silent.

**What changed:**  
`doctrine/MUTATION_SURFACE.json` inventories the surface by class, with verb rules so an unlisted tool inside a covered namespace is classified rather than ignored. The matcher in `.claude/settings.json` is generated from it, the guard classifies from it, the drill derives its coverage from it, and gate G2 fails when any two of those drift. Read-only tools are deliberately excluded from the matcher so a broken guard cannot block inspection. The routes that remain uncovered are named in the file itself and carried as OBL-GAL-009 and UNK-GAL-002.

**Status:** RESOLVED for the inventoried surface; the drift risk is a standing obligation  
**Related finding / decision IDs:** OBL-GAL-009, UNK-GAL-002, Canon "derive every guarded set"  
**Harvest status:** UNHARVESTED

---

### GAL-L0008
**Date:** 2026-09-04  
**Observed event:**  
Both git hooks exited 0 when `python3` was unavailable, printing "FAIL-OPEN (Governor ruling 2026-08-09)". The Canon ruling they cited is about not locking the operator out of the repository; it was being used to justify letting an unverifiable commit through on the one layer that binds a human.

**Evidence:**  
Superseded `.githooks/pre-commit` and `.githooks/pre-push`, the `command -v python3` branch.

**Why it mattered:**  
This layer exists precisely because the harness hook layer cannot be trusted to run. A fail-open here left no fail-closed boundary anywhere, which is the state the session report described as "as close as the environment permits to fail-closed" while it was not.

**What changed:**  
Both hooks refuse the act when the interpreter is absent, when orientation is invalid, or when the repository gates are red. Gate G3 parses the hooks themselves and fails when any failure path reaches `exit 0`; D-54 runs the pre-commit hook with `python3` removed from `PATH` and requires a refusal; D-64 restores the fail-open shape in a scratch copy and requires the gate to catch it. The residue is `--no-verify`, which is deliberate and visible, and is what the CI layer in `doctrine/EXTERNAL_ENABLEMENT.md` is for.

**Status:** RESOLVED  
**Related finding / decision IDs:** GAL-G7, OBL-GAL-003  
**Harvest status:** UNHARVESTED

---

### GAL-L0009
**Date:** 2026-09-04  
**Observed event:**  
The first run of the new binding-document gate disarmed two enforcement clauses because they contained the words "when" and "once" — "refuse the act when the interpreter is absent" describes a mechanism precisely and does not weaken it. The gate written to stop laundering was itself over-anchored, in the opposite direction to the AHOY-I-003 scar it was modelled on.

**Evidence:**  
First run of `scripts/doctrine-gate.py` G1: `GAL-G2` and `GAL-G7` absent from the armed set; the superseded `WEAKENING` pattern.

**Why it mattered:**  
An honesty instrument that under-counts teaches its author to write vaguer clauses to satisfy it, which is the same corruption as one that over-counts, arriving from the other side. The floor exists to make both movements visible.

**What changed:**  
The disarming vocabulary was narrowed to the tokens that actually admit an unbuilt mechanism (`MANUAL`, `UNARMED`, `ADVISORY`, `TODO`, `PLANNED`, `NOT YET`, `WILL BE`, `IS NOT BUILT`, `DOES NOT EXIST`, `NOTHING RUNS/EXECUTES/CHECKS`). In the same pass the gate learned to refuse an `ARMED` claim that rests only on the harness hook layer, so host invocation can no longer stand in for repository enforcement (drilled by D-61). A second false positive found in the same run — the reserved `.example` TLD read as a real domain — was corrected against RFC 2606 and RFC 6761 rather than by exempting the file.

**Status:** RESOLVED  
**Related finding / decision IDs:** L-A16, L-A18, C-0006  
**Harvest status:** UNHARVESTED

---

### GAL-L0010
**Date:** 2026-09-06  
**Observed event:**  
A hook-liveness verification in a genuinely fresh session found that this project's hooks still do not execute, and found in passing that the compulsory git layer was inert in the same clone. A deliberate `git commit --allow-empty` reached the branch with no refusal from any layer, and was reset. Two distinct defects, both of which had been reasoned about rather than observed.

**Evidence:**  
`doctrine/receipts/HOOK_LIVENESS_ATTEMPT-2026-09-06.md`. The harness's own diagnostics recorded exactly one `hook_spawn` in the whole session — its own git-identity SessionStart hook, 58 ms, from a settings file at the project root — and zero `PreToolUse` spawns against 14 `Bash` calls and one `Write` call that the matcher covers. Session working directory `/home/user`; the only `settings.json` on the machine at `/home/user/Thegallery/.claude/settings.json`, one level deeper; `/home/user/.claude/` absent. `git config core.hooksPath` returned nothing.

**Why it mattered:**  
Attempt 1 named host snapshot timing as the cause and explicitly ruled out settings discovery, because the file sits at the standard project path and passes gate G2. Both halves of that were true and the conclusion was still wrong: the path is standard *relative to the repository*, and the harness resolves it relative to the session's project root, which was the parent directory. A cause ruled out from inside the repository, using only facts about the repository, is a cause that was never tested. The second defect is worse in kind — `core.hooksPath` is set only inside `scripts/doctrine-hook.py session_start`, so the layer described as compulsory is armed by the layer described as as-configured. Two layers that were counted as independent are one, and `README.md` attributes the arming to the seam, which never touches it. The honest description of that container is that no enforcement layer was live in it.

**What changed:**  
The verification procedure gained two preconditions beside the freshness check that attempt 1 added: 0b requires `pwd` to be the repository root with `.claude/` directly inside it, and 0c requires reading the harness's own `hook_spawn` records before trusting any probe, since a probe that appears to pass and a dead hook look identical from inside. Step 6 requires `git config core.hooksPath` to print `.githooks`. The git-layer defect is recorded as OBL-GAL-013 with two candidate repairs named; `GAL-G7` is deliberately not reclassified and `armed_fixed_decisions` is deliberately not moved, because that is a recorded governed movement and the session that found this was bounded to verification. No enforcement script was changed and the drill was not weakened.

**Status:** OPEN — OBL-GAL-002 needs an external session-shape change; OBL-GAL-013 needs a governor ruling  
**Related finding / decision IDs:** OBL-GAL-002, OBL-GAL-013, OBL-GAL-010, GAL-G7, UNK-GAL-002  
**Harvest status:** UNHARVESTED

---

## Ledger rules

- Capture the event in the governed change that fixes or formally records it where feasible.
- Preserve evidence; do not rewrite history to make the incident look cleaner later.
- Do not write the universal law here.
- If a later understanding changes the interpretation, append the new evidence rather than erasing the original event.
