# PRODUCT HARVEST — THE GALLERY — H-INTERFACE-001

**Boundary:** out-of-cycle harvest, raised by the governor (2026-11-10: "Give me a mechanism level solution, that's replicable, rigid, and learns from itself, and can be applied elsewhere too"); nearest boundary analog H2 (interface settled)  
**Evidence window:** 2026-11-05 → 2026-11-10 (The Gallery default branch `23000f2`; standard branch `claude/vibrant-edison-dr83og`)  
**Status:** DRAFT — for the governor  
**Immutable after acceptance:** YES

---

# 1. Boundary reached

The governor found interface faults he had already corrected, on screens that had passed every
review and test, and stopped all work: "This has been going on so consistently with all the apps
that I build with you." The harvest asks why the Doctrine's interface law did not prevent this, and
proposes the mechanism The Gallery now runs as a cross-product candidate.

# 2. Evidence sources examined

- Doctrine module `modules/ux-design-assurance/v1.1/` (01–08, templates), `builder/INTERFACE.md`,
  `builder/design/frontend-design.md`, `.claude/rules/builder-ux.md`, the Canon and Playbook interface
  sections, `operating/builder_common.py` (`validate_contract`).
- The Gallery: `ux/INTERFACE_FOUNDATION.md`, `ux/UX_MANIFEST.yaml`, `ux/APP_RULES.json`,
  `e2e/14-whole-app.spec.ts`, the ledger GAL-L0019 … GAL-L0040, the corrections table in the handoffs,
  the governor's screenshots of 2026-11-09 and 2026-11-10.
- A DOM measurement of every screen state of The Gallery on Pixel 7 and desktop 1280 (control:
  `kit/interface-standard/CONTROL-2026-11-10-{phone,desktop}.json`).
- Primary sources fetched 2026-11-10: WCAG 2.2 and its Understanding documents; Material 3 token
  source (androidx material3 `TypeScaleTokens.kt`, `TextFieldDefaults.kt`); Apple HIG typography,
  accessibility, navigation; GOV.UK Design System (type scale, spacing, question pages, back link) and
  `govuk-frontend` 6.6.0 source; Android navigation principles; Baymard line length; axe-core rule
  metadata; Lighthouse 12/13 changelogs.

## NOT EXAMINED
- Other products' interfaces (Ahoy, maa.se, Ustaad, TreksFit, Swasthya): the claim "with all the apps"
  is the governor's; this harvest has evidence from one product only.
- Material 3 spacing tokens and Apple layout margins (pages did not render; marked UNVERIFIED in the
  standard). Baymard form spacing (not fetched).

# 3. Incidents reconstructed

**GAL-I-IF-01 — The law is written, never measured.** The module names WCAG 2.2, Material, HIG and
Nielsen, but sizes are "around" / "generally" (02A:222–226), spacing has no number (02A:172–177), and
visual quality is a recorded manual review; Canon:303–306 and Playbook:470–475 call the law centrally
UNARMED. The only code checks that review artefacts exist (`builder_common.py:180–200`).
Cross-product.

**GAL-I-IF-02 — The product's own written rules were broken by its own tokens.** The foundation said
"no text below 12 px" and "44 px targets"; tokens set 11.5 px and 10.5 px text; nothing compared
them. Cross-product (any product whose foundation is prose).

**GAL-I-IF-03 — The governor was the detector.** Each correction became a check for that fault only
(APP_RULES R01–R12, every `source` a governor correction). Back was required on a hand-written route
list; a page not on the list escaped (Join step 2, 2026-11-10). Cross-product.

**GAL-I-IF-04 — Pages were checked, states were not.** The whole-app sweep marked `/studio/join` as
passed because its test maker already had a gallery and was redirected; the screen the governor
opened had never been measured. Empty, error and in-flow states were unmeasured. Cross-product.

**GAL-I-IF-05 — Size judged from thumbnails.** Reviews and renders were read scaled down; type size
and spacing cannot be judged that way. Cross-product.

**Measured size of the gap (control, live code):** 33 of 33 states failed; 391 findings on phone,
511 on desktop (labels 13 px, captions 11.5 px, tab names 10.5 px, fields 24 px apart, no Back on 5
phone and 18 desktop states). After the standard was applied: 0 of 34 states fail on both.

# 4. Pattern groups
One cause: **interface law without an instrument.** I-01 (unarmed law), I-02 (prose rules), I-03
(reactive rules), I-04 (page not state), I-05 (eye not number) are the same failure at five points.

# 5. Candidate cross-product lessons

**Candidate ID:** C-XXXX (to be numbered by the register)  
**Proposed lesson:** Interface law is armed by measurement. Every product holds every screen
*state* (not page) to a versioned, sourced, numeric interface standard, measured from the rendered
DOM on the product's target viewports inside the suite that gates merges; every state is declared
with an archetype, and an undeclared or redirected state fails; a profile may tighten, never loosen;
every interface fault found after the gate is classified (coverage / measure / standard / judgement)
and fixed at the layer that missed it, with a failing control, before any screen is changed; what
cannot be measured is a fixed manual protocol (screen beside two named references, shown at phone
size), not an opinion.  
**Supporting incidents:** GAL-I-IF-01 … 05; GAL-L0031, L0038, L0039, L0040.  
**Products represented:** The Gallery (one product; the governor reports the pattern across all).  
**Existing Canon relationship:** EXTENSION — arms the ux-design-assurance module's G-UX5/G-UX6
(specified, not implemented) and the Canon's "No surface ships without its rendered screenshot being
read" with an instrument; keeps "Pixel judgment is MANUAL" for the unmeasurable residue only.  
**Proposed prevention mechanism:** `kit/interface-standard/` in The Gallery, lifted into the Doctrine
as module `interface-standard` (STANDARD.json, engine, calibration on outside references, escape
log, skill), with the product half (profile + journey + gate) as the adoption template.  
**Possible Playbook impact:** a build step "declare the state and its archetype before building it"; a
close step "standard receipt for both viewports".  
**Possible Audit Protocol impact:** an audit samples escapes: every governor-found interface fault
must appear in ESCAPES.md with its class and control.  
**Evidence confidence:** MEDIUM — mechanism proven on one product (control FAIL 33/33 → PASS 34/34;
calibration on GOV.UK and Are.na read finding by finding); cross-product claim rests on the governor's
report.

# 6. Rejected / product-specific lessons
- The Gallery's taste rules (no city, no "not X, not Y" copy, the colophon) stay in its APP_RULES.
- House values (labels 16 px, fields 32 px apart, 44 px targets) are this standard's version 1.0
  choices for a mostly-Android, middle-aged audience; another product may tighten them, never loosen.

# 7. Existing doctrine reinforced
- Canon: "Every governor-found miss triggers the audit-the-audit retrospective immediately; the
  incident and the probe or mechanism that would have caught it are captured with the fix."
- UX module 01:249–260 already lists contrast and target size as machine-checkable.

# 8. Open questions
- Whether the house values hold for every product's audience (a children's product, an operator tool).
- Whether the engine's role heuristics (caps label, list supporting text, file-picker label) hold
  across component libraries; calibrate.ts is the check, run per product.
- Non-text contrast (WCAG 1.4.11) has no axe rule; not yet measured.

# 9. Promotion queue
- The candidate in §5, for adversarial review before the governor's decision.

# 10. Harvest acceptance
**Governor decision:** ACCEPT / MODIFY / REJECT — pending  
**Accepted at:**  
**Notes:** the governor chose option A on 2026-11-10 ("I will go by your recommendations"): the
standard is proposed into the Doctrine, which only the governor can amend. Until then it binds The
Gallery through `CLAUDE.md` rule 8.
