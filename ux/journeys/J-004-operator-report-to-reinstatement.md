# Journey Contract

**Journey ID:** J-004  
**Name:** Operator resolves a report, suspends and reinstates a maker  
**Criticality:** CRITICAL — the operator journey that keeps promise P-14; a sanction with a release path; the door every prior build forgot  
**Status:** `INTERFACE_DESIGNING` (UX section frozen at `UX_READY`; interface demonstrated by inherited surface I-6)

# A. UX CONTRACT

## 1. Actor / situation / job
The operator (the founder, at a laptop, once or twice a day), having been told a report exists. The job: see what was reported, look at the thing itself with enough context, act within the enumerated powers with a recorded reason, and be able to undo a sanction later — without ever judging taste or touching the maker's words.

## 2. Legitimate entry
The operator door `/operator` with an operator account; a report link in the operator's notification email (Stage 3).

## 3. Terminal success / cancellation
- **Success:** the report is `actioned` or `dismissed` and then `closed`, with a reason; if a sanction was applied its consequence is visible publicly and in the maker's Studio; a later reinstatement restores exactly what was suspended.
- **Cancellation:** closing any dialog without a reason changes nothing.

## 4. Consequence chain
Know: category, note, subject's public rendering and governed state, prior actions on the same maker. Decide: dismiss, take down the object, or suspend the maker. Do: choose the action, write the reason, confirm. System: transition function checks the operator role, applies the change, appends the audit row, updates the report. Other actor: the maker sees the suspension reason and appeal route at sign-in; visitors see the object absent.

## 5. Benchmark decision
| Task/pattern | Incumbent/platform | Pattern inherited | Deviation |
|---|---|---|---|
| Working a queue | support inboxes | list newest-first with category and age; open → detail with the subject beside the report | none |
| Taking a privileged action | admin consoles | dialog naming the consequence; required reason field; the verb as the button | reason is mandatory, never optional |
| Reversing a sanction | same | Reinstate from the same place the suspension is shown | none |

## 6. Primary flow
1. Operator door → queue: submitted reports first (category · subject · age), then under review.
2. Open a report: reporter's note; the subject exactly as the public sees it; governed state (lifecycle, status, maker status); history of actions on this maker.
3. Choose: Dismiss · Take down work · Suspend maker (each opens a dialog with a required reason and the named consequence).
4. Confirm → the report becomes `actioned` or `dismissed`; the consequence is visible in the detail (subject now "not available"); Close report.
5. Later: Maker page → Reinstate (reason) → the gallery and works return; history shows both rows.

## 7. Major states / recovery
| State | Behaviour | Recovery |
|---|---|---|
| Not signed in | "Sign in to continue" (distinct wording) | sign in |
| Signed in, not operator | "Not permitted" (distinct wording); nothing revealed | — |
| Empty queue | "No open reports" | — |
| Reason missing | the confirm button stays disabled with the reason named | write it |
| Action fails | nothing recorded; named failure; retry | retry |
| Already actioned elsewhere | detail re-reads and shows the newer state | — |
| Take down of an already retired work | action offered as "already not shown"; only dismiss/close apply | — |

## 8. Navigation semantics
The operator area has its own header and no bottom bar; Back goes to the queue; dialogs Close without effect; no public link leads here.

## 9. Screen responsibilities
| Surface | One dominant job | Primary action |
|---|---|---|
| Queue | see what needs attention | Open report |
| Report detail | understand and act | Act (with reason) |
| Maker page | see governed state; lift or apply a sanction | Reinstate / Suspend |

## 10. Wireframe evidence
`ux/wireframes/J-004-flow.png` (four frames: queue · report detail · suspend dialog · maker page with reinstate), source `ux/wireframes/J-004-flow.html`, 390 px, 2026-09-04 (laptop-first; rendered at phone width to prove the structure survives).

## 11. UX preflight
- **Nielsen:** the queue shows age and state; the subject is shown as the public sees it; every dialog can be closed; one action grammar; the required reason prevents silent acts; actions are named by their consequence; two clicks from queue to decision; no decorative copy; failure named; participation rules linked as the standard the operator applies.
- **Platform:** queue, detail, dialog inherited.
- **Accessibility structure:** actions are buttons with names; reason field labelled; state as text; keyboard-operable dialogs.
- **Density:** the detail shows report, subject, governed state and history in four groups; nothing else.
- **Blocking unknowns:** none. Open, non-blocking: the moderation standard's published categories and response expectation (GAL-OD-15) — the queue works with the five categories proposed there.

## 12. UX verdict
```text
UX_READY
```
**UX section frozen at:** 2026-09-04

---

# B. INTERFACE CONTRACT
Inherits the Interface Foundation with the Studio density variant; demonstrated by I-6 `ux/reference/interface/renders/I-6-operator-report.png`. Introduces one new pattern — the required-reason dialog — shown in I-6.

```text
NOT_READY — awaiting governor acceptance of the reference set.
```
