# UX Foundation

**Product:** The Gallery  
**Module:** `ux-design-assurance` v1.1  
**Status:** DRAFT for governor review (Stage 1)

## 1. Product-wide interaction architecture

### Target actors
Anonymous visitor on a phone, usually arriving from a WhatsApp link; maker on a phone or laptop in a Studio session; operator on a laptop. The visitor and the maker share one public grammar; the maker gains a Studio.

### Top-level navigation
Bottom bar with four labelled items — **Browse · Saved · Workshops · For Makers** (the fourth reads **Studio** for a signed-in maker). Search is in the global header on every public surface. The bar is present on public and Saved surfaces and absent inside a sheet, a form in progress, and the operator area. Comparison and reasons: `product/PRODUCT_ARCHITECTURE.md` §5.

### Persistent context
Header: the wordmark (returns to the entrance) and search. Within a maker's gallery the header carries the maker's name as the current place; within a work the header carries Back and the maker's name.

### Search / discovery model
Global search across works and makers; results in two sections; material filter and *New* filter are chips on Browse and carry into search; empty results name the query and filter and offer to clear. See `product/PRODUCT_ARCHITECTURE.md` §6.

### Contribution / create model
Everything a maker creates happens in Studio through one pattern: a form that saves as a draft on every field change, shows a preview that is the exact public rendering, and has one primary action (Publish) with a secondary (Save draft). Publishing is a single transaction; failure keeps the draft and says so.

### Back / Close / Dismiss / Cancel semantics
- **Back** (system or header) returns to the previous surface; from a deep link with no history it returns to the entrance or the maker's gallery, whichever is the object's parent.
- **Close** on a sheet returns to the underlying surface without side effects; the URL loses its sheet segment.
- **Cancel** on a form with unsaved changes asks once, naming what will be discarded; a clean form cancels immediately.
- **Dismiss** on a notice removes it for the session only; it never hides a state the person must act on.

### Role / context switching
A maker is a visitor everywhere public. Studio is entered through the fourth tab and left by the same tab or Back. Signing out returns to the entrance. The operator area is a separate door with its own header and no bottom bar; it is never reachable from public navigation.

### Deep-link / route expectations
Every public object has one canonical URL; sheets and overlays are URL-backed (`?contact`, `?image=3`) so a shared link reopens the same state; unknown routes land on the entrance with a one-line notice; share previews carry the work's first image, title and maker for published objects only.

### Responsive information architecture
Compact (phones): bottom bar; single column; work detail is a vertical sequence image → label → actions → maker strip. Medium (tablet): the same structure with wider margins and a two-column work grid. Expanded (desktop): the four items move to the top bar beside search; work detail becomes image column and label column; Studio becomes list-detail; the operator area is list-detail from medium up. Structure changes, hierarchy does not.

## 2. Inherited platform/incumbent grammar

| Act | Inherited pattern | Source | Deliberate deviation |
|---|---|---|---|
| Search | field with placeholder, clear button, results replace the surface, recent queries not stored | Google, WhatsApp | none |
| Browsing images of one work | horizontal swipe with position dots, tap to open full-screen, pinch to zoom, swipe down to close | phone photo viewers, Behance | none |
| Bottom navigation | four labelled items, active item marked by text plus mark, never colour alone | Material / HIG tab bars | labels in the utility mono register |
| Sheets | bottom sheet with a grab handle and a Close control, scrollable, URL-backed | HIG sheets, Material bottom sheets | none |
| Forms | label above field, help text below, validation at the field, one primary action | Material / HIG text fields | none |
| Date and time | native pickers on phones; typed fields with a calendar on desktop | platform | none — the crude-clock scar |
| Confirming a destructive act | dialog that names the consequence and uses the verb as the button label ("Retire work") | HIG alerts | none |
| Sharing | native share sheet (Web Share API) with copy-link fallback | phone OS | none |
| Contacting by WhatsApp | `wa.me` link with a prefilled first line naming the work | AuthIndia, WhatsApp | none |
| Sign-in and recovery | email, password, "forgot password", confirmation email, one denial sentence | every mainstream account door | no social or phone doors (GAL-R12) |
| Upload | tap to add, thumbnails with progress, per-item retry and remove, drag to reorder | phone gallery pickers, Behance | none |

## 3. Product-wide UX constraints

- Work first on every entrance (GAL-01, GAL-D1); the object carries the visual weight; the core question comes first.
- Routine acts finish in one to three taps: save, share, contact, mark sold, reconfirm status.
- No public counts, reactions or comments anywhere (GAL-08); no engagement ordering (GAL-09).
- Contact is always a handoff through a disclosure (GAL-15) to a maker-chosen route; never an in-app conversation (GAL-R04).
- Every state is a named surface; no blank regions; "not signed in", "not permitted", "unreachable" and "nothing here" are four different sentences with four different next actions.
- The maker sees exactly what becomes public before it does (preview = public rendering; contact routes previewed).
- Destructive acts are never one tap; when an act is hardened its inverse is hardened too (retire/restore, suspend/reinstate).
- Prefill, never hide: a maker's saved details are shown on every form that uses them.

## 4. Explicit UNKNOWN / deferred UX decisions

- Whether an optional visitor account for cross-device saves and following is ever wanted (GAL-OD-09; not in the MVP).
- The exact shape of a maker-arranged "presentation mode" beyond the one Gallery system (GAL-OD-10; Stage 3+).
- Operator area on phones: designed for laptop first; phone behaviour deferred to Stage 3 with the operator journey.
- Whether a maker may hold more than one gallery (institutional plan); the model allows it, the UX does not yet.

## 5. Superseded decisions

None yet.

> Typography, colour, spacing, icon family, component visual styling, target-size product policy, and visual state grammar belong in `INTERFACE_FOUNDATION.md`.
