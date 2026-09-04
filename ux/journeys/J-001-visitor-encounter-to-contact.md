# Journey Contract

**Journey ID:** J-001  
**Name:** Visitor encounters a work and reaches the maker  
**Criticality:** CRITICAL — delivers core value; crosses roles; ends at the trust-bearing handoff  
**Status:** `INTERFACE_DESIGNING` (UX section frozen at `UX_READY`; interface section awaits governor acceptance of the reference set)

# A. UX CONTRACT

## 1. Actor / situation / job
An anonymous visitor on a phone, most often arriving from a WhatsApp link, sometimes from the public entrance. The job: see a work worth stopping for, understand what it is and who made it, and — if they want it, want something like it made, or want to learn — reach the maker directly, knowing that everything after that is between them and the maker.

## 2. Legitimate entry
- The entrance `/` (Browse) with one featured work at scale.
- A shared work link `/work/{id}`, a maker gallery link `/m/{handle}`, or a collection link.
- A material page or a search result.
No account is ever required (GAL-11).

## 3. Terminal success / cancellation
- **Success:** the visitor leaves for the maker's chosen route (WhatsApp, email, phone, website or form) having read the disclosure; or saves the work privately; or shares the exact link. The product records only an aggregate contact-intent event.
- **Cancellation:** Close on the handoff sheet or Back at any point; nothing is committed.

## 4. Consequence chain
- **Know:** title, maker, material, medium, dimensions, year, price or "enquire", status and how long ago it was confirmed, place, whether commissions are open.
- **Decide:** whether to approach, and with which intention (this work · a commission · a workshop · a general enquiry).
- **Do:** Contact maker → choose the intention → read the disclosure → open one route.
- **System:** opens the route with a prefilled first line naming the work; counts the intent in aggregate; never records a sale (GAL-16).
- **Other actor:** the maker receives the message on their own channel, outside the product.

## 5. Benchmark decision
| Task/pattern | Incumbent/platform | Pattern inherited | Deviation |
|---|---|---|---|
| Reading what an object is | museum and gallery wall label | title · maker · material/medium · dimensions · year · price/enquire, in that order, quiet | status line added, because the label answers a practical question here |
| Looking at several images of one object | phone photo viewer; Behance project | swipe with position dots; tap for full screen; pinch to zoom | none |
| Reaching a seller | AuthIndia; WhatsApp business links | visible enquiry action; `wa.me` link with prefilled first line | a disclosure step before leaving (GAL-15) |
| Sharing | phone OS share sheet | native share with copy-link fallback | none |
| Moving between shared place and owned space | ArtStation community vs portfolio | the owned gallery is the primary identity; the shared place routes into it | one identity, not two |

## 6. Primary flow
1. Enter on one work (entrance) or on the shared work.
2. Work detail: images at scale (swipe), then the label, then the status line, then actions (Contact maker · Save · Share), then the maker strip (View maker's gallery), then the process note if the maker wrote one.
3. Optionally View maker's gallery: identity, place, practice note, collections, works, commissions line, upcoming workshops, contact. Return to a work.
4. Contact maker → handoff sheet: intention (Ask about this work / Commission something like this / Join a workshop when one exists / General enquiry) → the disclosure line → the enabled routes, WhatsApp first when present.
5. Tap a route → it opens outside the product. The sheet remains behind so returning to the browser is a legitimate state.

## 7. Major states / recovery
| State | Surface behaviour | Recovery |
|---|---|---|
| Loading | wordmark, header, skeleton frames at the true aspect; no spinner over the first work | — |
| Image failed | frame holds its aspect; "Image unavailable"; label intact | reload |
| Retired work | "This work is no longer shown" with the maker strip | maker's gallery |
| Taken down / maker suspended | "This work is not available" / "This gallery is not available" | entrance |
| Stale status | label adds "status last confirmed {n} months ago" | — |
| No contact route on a published gallery | Contact action absent; line reads "The maker has not published a contact route yet"; Save and Share remain | — |
| Single route | the sheet shows it alone with the disclosure | — |
| Offline / unreachable | named state with retry; saved shelf still opens | retry |
| Unknown link | entrance with a one-line notice | — |

## 8. Navigation semantics
Header Back → previous surface, or the parent object from a cold deep link. Wordmark → entrance. Bottom bar present on entrance, work and maker gallery; hidden under the sheet. Sheet Close → the underlying URL without `?contact`. Save toggles in place with an "Undo" affordance; nothing asks for confirmation because nothing is destructive.

## 9. Screen responsibilities
| Surface | One dominant job | Primary action |
|---|---|---|
| Entrance | encounter one work; offer materials and the programme | View work |
| Work detail | understand the object and decide | Contact maker |
| Maker gallery | understand the body of work and the practice | View work (Contact maker secondary) |
| Handoff sheet | choose an intention, read the boundary, open a route | Open route |

## 10. Wireframe evidence
`ux/wireframes/J-001-flow.png` (four frames: entrance · work detail · maker gallery · handoff sheet), source `ux/wireframes/J-001-flow.html`, rendered 2026-09-04 at 390 px width.

## 11. UX preflight
- **Nielsen:** status visible on every work; wall-label vocabulary; Close/Back everywhere; one label grammar across entrance, grid, detail and gallery; the disclosure prevents the wrong expectation before the consequential step; routes named by kind; entry by link, material, search or entrance; label carries only decision-critical fields; every failure names itself and a next step; participation and privacy pages linked from the footer.
- **Platform:** bottom navigation, sheet, native share, image viewer all inherited (§5).
- **Accessibility structure:** status is text, never colour alone; maker-authored alt text with a factual fallback ("{title}, {material}, by {maker}") that describes nothing it cannot know; reading order image → label → actions → maker; targets ≥ 44 px; no hidden instructions.
- **Density:** primary question "what is this and can I have it?"; primary action Contact maker; deferred: process note (collapsed), full dimensions (label line), practice (gallery page).
- **Blocking unknowns:** none.

## 12. UX verdict
```text
UX_READY
```
**UX section frozen at:** 2026-09-04

---

# B. INTERFACE CONTRACT

Interface Design may not silently edit Section A after `UX_READY`.

## 13. Handoff lock
Not changed by interface work: the visitor never signs in; the label order; Contact maker as the single primary action on a work; the disclosure before any route; routes are the maker's, opened externally; Save is private; no counts of any kind; the four-item bottom bar and its labels.

## 14. Visual hierarchy
| Surface/state | First | Second | Third/deferred |
|---|---|---|---|
| Entrance | the featured work's image | status · title · maker line | material rail, programme, bar |
| Work detail | the image | status line and title | maker line, dimensions/year, actions, process note |
| Maker gallery | the maker's name and place with the first work | practice note, collections | commissions line, workshops, contact |
| Handoff sheet | the intention choices | the disclosure | the routes |

## 15. Component mapping
| Wireframe region | Component/pattern | Inherited/new | Reference |
|---|---|---|---|
| Header | wordmark + search icon button / Back + place name | new (product grammar) | R-1, R-2 |
| Featured work | full-bleed image frame with reserved aspect | new | R-1 |
| Label block | status line (mono, amber for available) · serif title · mono maker line · sans dimensions | new | R-1, R-2 |
| Material rail | text tabs with underline mark | inherited (tabs) | R-1 |
| Bottom bar | four labelled items, dot mark on active | inherited (tab bar) | R-1 |
| Work images | swipe carousel with dots | inherited | R-2 |
| Actions | primary button (near-black), quiet secondary text buttons | inherited (buttons) | R-2 |
| Maker strip | list row with chevron | inherited (list row) | R-2 |
| Handoff | bottom sheet with handle; choice list rows; disclosure paragraph; route rows with kind icon + label | inherited (sheet, list) | R-2 sheet frame |

## 16. Interface Foundation inheritance / deviations
Inherits `ux/INTERFACE_FOUNDATION.md` in full; no deviation.

## 17. Critical visual states
Loading skeleton (ivory-stone blocks at true aspect); image failed (stone frame, mono notice); retired/unavailable (label block only, muted); stale status (mono suffix, ink-muted); no route (mono line, no button); offline banner (stone band above content).

## 18. Responsive notes
Compact: single column; image 4:5 up to 60 vh. Medium: image column 60 % beside label column. Expanded: the same two columns with the bar moved to the top; maker gallery grid three across.

## 19. Reference evidence
R-1 `ux/reference/interface/renders/R-1-entrance.png`; R-2 `ux/reference/interface/renders/R-2-work-detail.png` and `R-2b-handoff-sheet.png`; inherited demonstration I-1 `I-1-maker-gallery.png`. Build identity, viewport, state and date in `INTERFACE_REFERENCE_SET.md`.

## 20. Interface accessibility preflight
See `INTERFACE_REFERENCE_SET.md` §Preflight (contrast, targets, non-colour state, focus, resize).

## 21. Fresh-eye review
Recorded per surface in `INTERFACE_REFERENCE_SET.md` §Review matrix; the journey-level roll-up is repeated there.

## 22. Interface verdict
```text
NOT_READY — interface work complete for the reference surfaces; INTERFACE_READY is set only when the governor accepts the reference set (G-IF1 requires accepted surfaces).
```
**Interface section frozen at:** pending
