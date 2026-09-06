# Governor's Stage 1 ruling — recorded 2026-09-06

**Branch:** `claude/gallery-hook-liveness-verify-bzn5c6` · **Doctrine:** `dfdecb651df8cef5387487fee21d8ee2f798db95`, read-only, unchanged
**Recorded by:** the session that carried out the repository-governance correction accepted at `b8e890e`
**Scope:** record the ruling through the existing Doctrine and UX mechanisms. No approved screen, product architecture document or application functionality was altered, and Stage 2 was not started.

---

## 1. What the governor ruled

**The Stage 1 interface reference set is accepted** as the authoritative design direction for implementation.

| Accepted | Not frozen | Bounded |
|---|---|---|
| visual grammar, hierarchy, typography, palette, imagery treatment, interaction direction | ordinary responsive, accessibility and implementation refinement stay the builder's; acceptance freezes no defect and does not prevent evidence-based improvement | the interface may not drift into a generic marketplace, social feed or administrative template; any later change that materially alters the approved product character returns for governor review |

**All nine strategic decisions ratified as recommended.**

| Decision | Ruling |
|---|---|
| GAL-OD-01 · Working name | The Gallery, used consistently |
| GAL-OD-02 · Account boundary | Individual makers, studios and collectives presenting work they created or materially produced; retailers and ordinary resellers excluded |
| GAL-OD-03 · Admission | Open email account creation, self-declaration, post-publication moderation; no pre-publication taste or quality gate |
| GAL-OD-04 · Geography | Bengaluru for realistic demonstration content, geography configurable; no Bengaluru-only and no India-wide launch claim |
| GAL-OD-06 · Direct contact | Maker chooses WhatsApp, public email, phone, website or external form; one route required before contact is advertised, not before publishing; account email stays private; no in-app chat |
| GAL-OD-09 · Social depth | Private device-local saves in the MVP; public counts, comments, reactions and popularity ranking refused; count-free following and low-volume notices reconsidered later as a separate candidate |
| GAL-OD-12 · Identity confirmation | Deferred beyond the MVP; no verification claim at launch |
| GAL-OD-13 · Revenue | No monetisation in the MVP; architecture stays subscription-capable; no transaction percentage, advertising or paid ranking |
| GAL-OD-15 · Moderation standard | The minimal published standard — five report categories, recorded reasons, reversible where appropriate, appeal by email; protects access and safety, does not curate taste or certify maker claims |

---

## 2. How it was recorded

### 2.1 Decisions moved from OPEN to governor-ratified FIXED

The nine now sit in `fixed_product_decisions` in `doctrine/PRODUCT_STATE.json`, keeping their original ids so the trail from instrument to ruling to enforcement is one thread. Each carries:

`question` · `source` · `reason` · `consequence_of_rejection` · `reopen_condition` · `ratified_by` · `ratified_at` · `ratification_receipt` · `stage_1_instrument` · `enforcement_locus` · `enforcement_state`

Nothing was compressed away. The reason a decision was taken and the cost of rejecting it are what make a later reopening judgeable, and a ruling that keeps only the outcome destroys that.

**Seven decisions remain open**, unchanged and reversible by design, and none of them gates Stage 2: GAL-OD-05, GAL-OD-07, GAL-OD-08, GAL-OD-10, GAL-OD-11, GAL-OD-16 (product recommendations) and GAL-OD-14 (ordinary implementation).

### 2.2 Enforcement states — and why the ratchet did not move

All nine are recorded **MANUAL** or **UNARMED**, never armed. The mechanisms that will hold them — the publish gate, the ownership rule, the route inventory, the schema, the claim sweep over rendered surfaces — are Stage 2 code that does not exist. `armed_fixed_decisions` stays at **8** and `doctrine/RATCHETS.json` is untouched.

A ruling is authority, not enforcement. Recording nine new ARMED claims on the strength of a governor's signature is exactly the laundering gate G1 exists to catch, and it would have been caught: G1 refuses an armed claim whose locus names nothing that executes.

### 2.3 Interface state

`ux/UX_MANIFEST.yaml`:

- `interface_reference_set.status` → **ACCEPTED**, with `accepted_by`, `accepted_at`, the receipt path, and three explicit fields recording what acceptance fixes (`approved`), what stays the builder's (`remains_the_builders`) and what it forbids (`boundary`).
- **J-001, J-002, J-004 → `INTERFACE_READY`.** These are the three journeys carrying interface references drawn from the accepted set; `INTERFACE_READY` was withheld from exactly them pending this acceptance (G-IF1).
- **J-003 stays `UX_READY`.** It has no interface references of its own and its surfaces are inherited, so there is nothing accepted to raise it on. Moving it would be a status without evidence.
- **J-005 and J-006 stay `IDENTIFIED`**, with their deferral reasons unchanged.
- `human_surface_state` in `PRODUCT_STATE.json` mirrors all of it.

`INTERFACE_READY` is a design status. It is not authorisation to implement, and the manifest now says so in the file rather than leaving it to be inferred.

### 2.4 Stage 1 review obligation closed

`OBL-GAL-001` → **RESOLVED**, naming all nine ratifications, the interface acceptance, the three journeys raised, and the seven decisions that remain open. Its acceptance test is rewritten to something a later session can re-run against the tree.

### 2.5 Active stage: the pre-Stage-2 platform-enablement gate

`active_stage.code` → **`PLATFORM_ENABLEMENT_GATE`**, inserted in the ladder between Stage 1 and Stage 2.

> **Next acceptance condition.** The repository and platform enforcement boundary is live, and only then is Stage 2 authorised: `main` exists, created from `claude/gallery-hook-liveness-verify-bzn5c6` and protected so the default branch is reached through review (OBL-GAL-005, OBL-GAL-011); GitHub Actions is enabled and the repository secret `DOCTRINE_READ_TOKEN` grants read-only access to `builders-doctrine` (OBL-GAL-003); and the check named **`Doctrine / Orientation, gates and drill`** from `.github/workflows/doctrine.yml` completes green on a pull request and is a required status check on `main`. Until every one of those is observed, application source, database schema and deployment configuration are not created and no session claims Stage 2 is authorised.

`blocked_until_acceptance` is **unchanged** — application source, database schema and migrations, deployment and hosting configuration, feature commits — so `GAL-G9` still denies exactly what it denied yesterday. The stage carries an explicit `not_authorised_by_this_stage` field, because "Stage 1 accepted" is the sentence most likely to be misread as "Stage 2 may begin".

`current_product_phase` label updated: architecture settled, H1 harvest now due and not yet taken. The phase code stays `PRE_H1` because no harvest exists.

---

## 3. What was deliberately not done

- **No enforcement claim upgraded.** Nine ratifications, zero movement in the armed count.
- **No approved screen touched.** `ux/reference/interface/renders/`, `surfaces/`, `tokens.css`, `system.css`, `plates.css` and the wireframes are byte-identical.
- **No product architecture or domain model edit.** `product/PRODUCT_ARCHITECTURE.md`, `product/DOMAIN_MODEL.md` and `product/STAGE_2_VERTICAL_SLICE.md` are byte-identical.
- **No application functionality.** No source, schema or deployment configuration exists or was created.
- **No Doctrine audit and no hook-liveness experiment.** The topology disposition of `b8e890e` stands and was not reopened.
- **No `main`, no merge, no platform change.** Those are the governor's and the platform's acts.
- **The rejected options were not deleted** from the instrument. Section A keeps every option verbatim under "The options as they stood", above the ruling table.

---

## 4. Obligations after this ruling

| Obligation | State |
|---|---|
| OBL-GAL-001 Stage 1 review | **RESOLVED** by this ruling |
| OBL-GAL-002 host topology | OPEN, dispositioned, activation-conditioned on a material topology change |
| OBL-GAL-003 CI | **UNARMED**, and now part of the active stage's acceptance condition |
| OBL-GAL-005 create `main` | **OPEN**, and now part of the active stage's acceptance condition |
| OBL-GAL-011 branch protection | **OPEN**, and now part of the active stage's acceptance condition |
| OBL-GAL-008 Stage 2 provisioning | OPEN, unchanged |
| OBL-GAL-004, 006, 009, 010, 012, 013 | unchanged |

CI, branch protection and the trunk layer are **not armed**. Nothing in this ruling makes them live.

---

## 5. Verification

| Check | Result |
|---|---|
| `doctrine-orient.py orient` | VALID, six-step sequence, hook path ARMED |
| `doctrine-orient.py check` | PASS for this session |
| `doctrine-gate.py` | 5 of 5 PASS; G1 reports 8 armed, count equals the recorded ratchet |
| `doctrine-drill.py` | 88 PASS, 0 DECORATIVE, 0 STALE, 0 RED |
| `builders-doctrine` before / after | HEAD, tree, digest and worktree identical |

---

## 6. What the governor and the platform must do next

1. Create `main` from `claude/gallery-hook-liveness-verify-bzn5c6` and protect it: require a pull request before merging, and require the status check `Doctrine / Orientation, gates and drill`.
2. Enable GitHub Actions for `r959qp5qwr-web/Thegallery`.
3. Create the repository secret `DOCTRINE_READ_TOKEN`, read-only to `builders-doctrine` and nothing else.
4. Observe one green run of the check on a pull request, then authorise Stage 2.

Details and exact settings: `doctrine/EXTERNAL_ENABLEMENT.md` items 1–3.

**Stage 2 is not authorised by this ruling.** It is authorised when the boundary above is live.
