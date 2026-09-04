# Journey Contract

**Journey ID:** J-003  
**Name:** Maker changes work status and every public surface follows  
**Criticality:** CRITICAL — high-frequency routine act; the truthfulness promise P-11 depends on it  
**Status:** `UX_READY` (interface inherits J-002's Studio grammar and J-001's public grammar; no new interface pattern)

# A. UX CONTRACT

## 1. Actor / situation / job
A maker who has just sold a piece on WhatsApp, or wants to say a piece is now made to order, on their phone between other things. The job: change the status in seconds and trust that everyone sees the change everywhere, then get on with the day.

## 2. Legitimate entry
Studio dashboard work row; the work's edit form; the "status last confirmed" prompt on the dashboard.

## 3. Terminal success / cancellation
- **Success:** the new status renders on the public work page, the entrance and Browse grids, search results, the maker gallery, collections and any visitor's saved shelf on next load; `status_confirmed_at` is now.
- **Cancellation:** Undo within the same surface reverts; closing the picker changes nothing.

## 4. Consequence chain
Know: current status and when it was confirmed. Decide: the new status. Do: one tap on the status control, choose, done — Undo offered. System: one write through the transition function; every surface reads the one column; no cache holds the old state. Other actor: visitors see the truth; nobody is notified (no notices in the MVP).

## 5. Benchmark decision
| Task/pattern | Incumbent/platform | Pattern inherited | Deviation |
|---|---|---|---|
| Changing a single field on a list item | mail and task apps | tap the status chip on the row → picker sheet → immediate apply with Undo | none |
| Undo after a quick change | Gmail "Undo", phone OS toasts | inline undo line for a few seconds; the change is real immediately | none |

## 6. Primary flow
1. Dashboard row shows title · status chip · confirmed-ago line.
2. Tap the chip → picker sheet with the five statuses, current one marked.
3. Choose → sheet closes; row updates; "Marked as sold · Undo" line for eight seconds.
4. Optional: "View public work" from the row to see it.
Reconfirmation: a row older than 90 days shows "Status last confirmed 4 months ago · Confirm" — one tap confirms without opening the picker.

## 7. Major states / recovery
| State | Behaviour | Recovery |
|---|---|---|
| Write fails | the row reverts with "Not changed — try again"; nothing else changes | retry |
| Offline | picker disabled with a named reason | reconnect |
| Work is a draft | picker available; status applies when published | — |
| Maker suspended | picker disabled; row states the suspension | appeal |
| Concurrent edit on another device | last write wins; the row re-reads after the write | — |

## 8. Navigation semantics
Sheet Close changes nothing; Undo is the only reversal affordance; no confirmation dialog because the act is reversible.

## 9. Screen responsibilities
| Surface | One dominant job | Primary action |
|---|---|---|
| Dashboard work row | see and change status | Change status |
| Status picker | choose | (choice) |
| Public surfaces | show the truth | — |

## 10. Wireframe evidence
`ux/wireframes/J-003-flow.png` (three frames: dashboard row · picker · public work after change), source `ux/wireframes/J-003-flow.html`, 390 px, 2026-09-04.

## 11. UX preflight
- **Nielsen:** immediate visibility of the change; the five words are the maker's own vocabulary; Undo gives control; the same chip grammar as the public status line; nothing to mistype; recognition over recall; one-to-two taps; no extra copy; failure named with retry.
- **Platform:** picker sheet and undo line inherited.
- **Accessibility structure:** status is a word; the chip is a button with an accessible name including the current value; Undo is a button, not a timed-only affordance (it also remains under the row's overflow for a minute).
- **Density:** one row, one chip, one line.
- **Blocking unknowns:** none.

## 12. UX verdict
```text
UX_READY
```
**UX section frozen at:** 2026-09-04

---

# B. INTERFACE CONTRACT
Inherits J-002's Studio grammar (row, chip, sheet) and J-001's public status line; introduces no new component. Inheritance is recorded here, not assumed; the interface verdict follows the reference set's acceptance.

```text
INHERITS — NOT_READY until the reference set is accepted
```
