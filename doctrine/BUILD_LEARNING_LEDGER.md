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

## Ledger rules

- Capture the event in the governed change that fixes or formally records it where feasible.
- Preserve evidence; do not rewrite history to make the incident look cleaner later.
- Do not write the universal law here.
- If a later understanding changes the interpretation, append the new evidence rather than erasing the original event.
