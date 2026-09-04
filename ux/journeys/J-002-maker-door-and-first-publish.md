# Journey Contract

**Journey ID:** J-002  
**Name:** Maker enters by email, creates a gallery and publishes a first work  
**Criticality:** CRITICAL — admission and sign-in door; creates a consequential public commitment; privacy of the account email  
**Status:** `INTERFACE_DESIGNING` (UX section frozen at `UX_READY`; interface section awaits governor acceptance of the reference set)

# A. UX CONTRACT

## 1. Actor / situation / job
A maker, studio or collective on a phone or laptop who has decided to show work here. The job: get an account through email, say who they are and how the public may reach them, and put one work in front of visitors — truthfully, with strong images — in one sitting, and be able to find their way back.

## 2. Legitimate entry
For Makers (bottom bar) → Create account; or Sign in for a returning maker; or a confirmation link in email; or a shared "publish your work" link to `/makers`.

## 3. Terminal success / cancellation
- **Success:** one work is published and the maker has opened its exact public page; the Studio dashboard shows it.
- **Safe partial:** account confirmed and profile saved, work saved as a draft — resumable from the dashboard.
- **Cancellation:** leave at any step; every entered field is kept as a draft; nothing partially publishes.

## 4. Consequence chain
- **Know:** what The Gallery is and is not (no payment, no cut, no certification), what becomes public (name, kind, city, practice note, contact routes, work), what stays private (account email, exact address unless opted in).
- **Decide:** identity kind; which contact routes to expose; price mode and status for the first work.
- **Do:** create account → confirm email → profile → contact routes → add work → preview → publish.
- **System:** sends the confirmation; creates the maker and gallery; stores originals and generates variants; publishes transactionally; makes the work discoverable; renders the share preview.
- **Other actor:** visitors can now encounter the work; the operator sees nothing unless reported.

## 5. Benchmark decision
| Task/pattern | Incumbent/platform | Pattern inherited | Deviation |
|---|---|---|---|
| Creating an account with email | mainstream account doors | email, password with visible rule, "check your email" pending screen, resend | no phone or social doors (GAL-R12); same "check your email" response whether or not the email exists (non-enumeration) |
| Signing in | same | email + password; one denial sentence; "forgot password" | none |
| Choosing images | phone gallery picker | tap to add; thumbnails with progress; per-item retry/remove; drag to reorder | none |
| Filling a form | Material / HIG text fields | label above; help below; inline validation; one primary action | none |
| Previewing before publishing | Behance project preview | the preview is the exact public rendering | none |

## 6. Primary flow
1. For Makers: two paragraphs (what it is; what it is not), participation rules link, Create account / Sign in.
2. Create account: email, password (rule shown), one line on what becomes public → "Check your email" (resend after 60 s).
3. Confirmation link → Studio set-up: three steps shown as a list — Your identity · Contact routes · First work — each a plain form.
4. Identity: display name, kind (individual · studio · collective), city, region, practice note (optional, attributed), exact address (off by default).
5. Contact routes: add WhatsApp / public email / phone / website / form; each validated on save; a preview shows exactly how the public will see them; zero routes is allowed and named.
6. Add work: images first (add up to 8; reorder; set focal point; alt text per image); then title, material (five), medium, process (optional), dimensions, year, price mode (exact · enquire · made to order) with amount when exact, status; Save draft is automatic; Preview.
7. Preview: the public work page as it will render, with a "Publish" bar. Publish is one transaction.
8. Published: "Your work is now shown" with View public work and Share; the dashboard lists it with its status.

## 7. Major states / recovery
| State | Surface behaviour | Recovery |
|---|---|---|
| Weak password / invalid email | field-level message; input kept | correct the field |
| Email already registered | identical "check your email" screen; the email explains an account exists | sign in / reset |
| Confirmation expired | named state; resend | resend |
| Sign-in denied | one sentence for unknown email and wrong password alike | reset |
| Suspended maker signs in | named: suspended, reason, appeal route; Studio read-only | appeal by email |
| Session expired mid-form | draft kept locally; sign in; the same form reopens | sign in |
| Upload failed / partial | failed thumbnails marked; others kept; retry only the failed | retry |
| Unsupported or unsafe file | refused at selection with the accepted formats and limits | choose another |
| Publish failed | "Not published — saved as a draft"; no half-published object | retry |
| Duplicate tap | one work | — |
| No contact route at publish | publish proceeds; the public page states routes are not yet published; Studio shows the task | add a route |

## 8. Navigation semantics
Studio has its own header (Studio · maker name) and no bottom bar inside forms; Back from a form asks only when there are unsaved changes; Cancel discards after confirmation; the set-up list is always reachable from the dashboard; sign-out returns to the entrance.

## 9. Screen responsibilities
| Surface | One dominant job | Primary action |
|---|---|---|
| For Makers | understand the boundary; enter | Create account |
| Create account / Check email / Sign in | pass the door | Create account / Resend / Sign in |
| Studio dashboard | see the gallery's state and the next step | Add work |
| Identity form | say who is responsible | Save |
| Contact routes | choose what the public may use | Save |
| Add work | put one truthful object in front of people | Preview |
| Preview | confirm the exact public rendering | Publish |
| Published | verify and share | View public work |

## 10. Wireframe evidence
`ux/wireframes/J-002-flow.png` (seven frames: For Makers · Create account · Check email · Studio set-up · Add work · Preview · Published), source `ux/wireframes/J-002-flow.html`, 390 px, 2026-09-04.

## 11. UX preflight
- **Nielsen:** every step names its state and the next; plain language; Back/Cancel everywhere with drafts kept; one form grammar; validation at the field and a preview before the consequential act; recognition (materials as tabs, statuses as words); efficiency (automatic drafts, one-tap resend); minimalist (only fields the product reads); recovery named for every failure; participation rules one tap away.
- **Platform:** account door, picker, forms and preview all inherited (§5).
- **Accessibility structure:** labels are text; errors are text tied to fields; upload progress is text and bar; reorder has button alternatives to drag; no colour-only meaning; targets ≥ 44 px.
- **Density:** the first work needs images plus six facts; process, year and dimensions are optional or short; no field is shown that the public does not see.
- **Blocking unknowns:** none. Open, non-blocking: whether the provider's password flow or an emailed code proves sturdier on the deployed walk (GAL-OD-16).

## 12. UX verdict
```text
UX_READY
```
**UX section frozen at:** 2026-09-04

---

# B. INTERFACE CONTRACT

Interface Design may not silently edit Section A after `UX_READY`.

## 13. Handoff lock
Email as the only door; the three set-up steps and their order; preview is the public rendering; publish is one action; drafts are automatic; no route is required to publish; account email never shown publicly.

## 14. Visual hierarchy
| Surface/state | First | Second | Third/deferred |
|---|---|---|---|
| For Makers | what the Gallery is, in one line | the two doors | rules link |
| Create account | the email field | the password rule | the public/private note |
| Studio dashboard | the gallery's state and next step | the works list with statuses | account |
| Add work | the image area | title and material | remaining label fields, status, price |
| Preview | the work exactly as public | the Publish bar | — |

## 15. Component mapping
| Wireframe region | Component/pattern | Inherited/new | Reference |
|---|---|---|---|
| Door forms | text fields with labels above; primary button | inherited | I-4 |
| Pending screen | centred mono state with resend text button | new | I-4 |
| Set-up list | numbered list rows with done marks | inherited | J-002 wireframe |
| Image area | add tile + thumbnails with progress, retry, remove, reorder handles | inherited | R-3 |
| Field groups | grouped sections with rules; segmented control for material and price mode; select for status | inherited | R-3 |
| Publish bar | fixed bottom action bar inside Studio forms | inherited (action bar) | R-3 |

## 16. Interface Foundation inheritance / deviations
Inherits `ux/INTERFACE_FOUNDATION.md`; Studio uses the same tokens with a slightly denser rhythm (16 px section spacing instead of 24 px) — recorded as the Studio density variant.

## 17. Critical visual states
Uploading (progress bar in the tile), failed (stone tile with retry), draft saved (mono timestamp line), publish failed (amber-tint notice band with the draft reassurance), published (stone band with two actions), disabled Publish (stone button with the reason).

## 18. Responsive notes
Compact: single column, publish bar fixed. Medium and expanded: form at 640 px max width beside a live preview column.

## 19. Reference evidence
R-3 `ux/reference/interface/renders/R-3-studio-add-work.png`; I-4 `I-4-maker-door.png`; I-5 `I-5-states.png` (upload failure).

## 20. Interface accessibility preflight
See `INTERFACE_REFERENCE_SET.md`.

## 21. Fresh-eye review
See `INTERFACE_REFERENCE_SET.md`.

## 22. Interface verdict
```text
NOT_READY — awaiting governor acceptance of the reference set.
```
**Interface section frozen at:** pending
