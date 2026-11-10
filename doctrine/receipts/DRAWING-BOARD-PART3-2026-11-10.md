# Receipt: drawing board, part 3 — the maker's screens (2026-11-10)

**Authority:** governor:
- 2026-11-09: "Approved." (the 16 screens)
- 2026-11-10: "Merge PR 13, Keep, Show". "Show" means the Email row on the Message sheet shows the address. It lands in this PR.
- 2026-11-10: "Yes." (go on part 3)

Not a SYSTEM CHANGE. `tokens.css` and `system.css` are untouched and byte-identical to `ux/reference/interface/`. Page styling is in the "Drawing board, part 3" block of `public/gallery/app.css`.

Code: branch `claude/continue-wfrmif`, head `beb2365`, final build `UhdkxbzpibZovSIAXEp2u`.

## What changed
| Screen | Before (live) | After (board 7–14) |
|---|---|---|
| For makers (7) | "Show your work the way a gallery would", a paragraph, an amber-edged action, three numbered steps (with "Make an account" looking like a button), a Participation line | Three pictures, then "FOR MAKERS", "A gallery of your own.", "Hang your work from your phone. Visitors message you on WhatsApp. No commission." "Open your gallery" docked in solid ink, with "I already have a gallery" under it. No bar. The pictures are covers of works that are on view; where there are fewer than three, the empty plinth stands in |
| Join, step 1 (8) | "Create your account", a privacy paragraph, "Create account", "I already have an account" | Back · "STEP 1 OF 3". "Open your gallery": Email ("For signing in. Never shown."), Password ("At least 10 characters."), "Continue" docked |
| Check your email (9) | A paragraph, "Send it again" as a full button, a spam hint, "Back to sign in" | The envelope in amber, "Check your email", "Tap the link we sent to …", "Send it again" as a text button. An expired link has its own state with "Sign in" |
| The link | A page: "Your email is confirmed. Sign in…" | A route handler. It confirms the address and brings the maker, signed in, to step 2. This happens only in the browser that began joining (GAL-L0035) |
| Join, step 2 (8) | "Set up your gallery": three numbered rows, then a long profile form (name, gallery address, how you work, city, practice, intro, commissions) | "STEP 2 OF 3", "Your name and place": Name, Place, and **How you work** as taps (On my own · A studio · A collective), with "Show only work you made or had a real hand in making. Not resale. Who can open a gallery". The gallery address is made from the name (`anika-rao`, then `anika-rao-2`) |
| Join, step 3 (8) | — | "STEP 3 OF 3", "Your WhatsApp": one field ("With + and the country code. Shown to visitors."), "Continue" docked, "Skip for now" |
| Sign in (10) | "Sign in to your Studio", the action in the form, "Forgot your password?", "New here? Create an account" | Back · wordmark. "Sign in", the two fields, "Forgot password?", "Sign in" docked |
| Reset password (11) | "Get a link to reset your password", a paragraph, "Send the link" | "Reset password", Email ("We'll send a link if it has a gallery."), "Send link" docked. The second step is "New password", one field, "Set password" docked |
| Studio (12) | "Studio" header, the name, a sentence about the gallery, a band "No way to contact you yet", a list of rows (thumb, title, material, chip), "Add a work" as a block button, three secondary links | "STUDIO" where the wordmark stands, Share (once the gallery is open) and "SETTINGS" at the right. The name, then the gallery's address. **One task** until it is done ("Your gallery is still a draft. Open it", or "Add WhatsApp so visitors can message you"). Then the works as a grid of 4:5 tiles with "Add a work" first, each flagged On view / Draft / Retired / Taken down, the title under it, and on a published work the status chip |
| Add a work (13) | "Add a work" header, a paragraph, an images group with a file button, Describe the image, the label in groups, status as a select, "Save draft" in a bar | Cancel · "NEW WORK" · Save draft. A photo tile ("Add photo") first; its description is asked for once a photo is chosen. Title, then Material, Status and Price as taps, then the amount, then "Size and a few words". **Publish docked**: a photo and a title publish in one go. Enter saves a draft |
| Settings (14) | Three pages reached by three links: Your details, Ways to contact you, Account | One list. "YOUR GALLERY": Name · Place · A line about your work · WhatsApp (On / Add) · Email for visitors (address / Off). "ACCOUNT": Sign-in email (shown, not a link) · Password → reset · Sign out · Close account. Each row opens the page where that thing is changed. Those pages stay, and their Back now leads to Settings |
| Message sheet ("Show") | The Email row names the way only | The address sits under "Email". A screen reader hears "Email, address" |

### Removed (rule 21)
- **For makers:** the three numbered steps, the "Make an account" text that looked like a button, the paragraph, and the Participation line. Participation stays in the colophon.
- **Joining:** the account page's privacy paragraph ("It stays private… add a separate public address"); the one line "For signing in. Never shown." carries it. "New here? Create an account" on Sign in. The "Your email is confirmed" page.
- **Step 2:** the gallery-address field (it is made from the name, and changed later in Your details); practice, intro and commissions (they live behind "A line about your work" in Settings).
- **Studio:** the list of rows with thumbnails and the material line; the "No way to contact you yet" band (it is now the one task); the block "Add a work" button; the three secondary links (now Settings). "Set up your gallery" with its numbered steps (an account without a gallery goes to step 2).
- **Add a work:** the page's lead paragraph, the "Images · the first is the cover" heading, "Choose a photograph / No photograph chosen yet", and the status select (now taps).
- **Account page:** Sign out (now a Settings row) and the repeated "Close this account" heading.
- **Copy no longer said** because it was not proven: "It is good for 24 hours" and "Setting it signs out every other session".

### Departures from the board, on purpose
- **"How you work" on step 2.** The board draws name and place only. GAL-OD-02/03 is fixed: the self-declaration is made when the gallery is created, so it is asked here, as taps.
- **The status chip under each published Studio tile.** The board draws bare tiles. J-003 changes status in one tap from the Studio, and that stays.
- **Price taps beside status taps on Add a work.** The board draws only a price field. Decision C is still OPEN, so the price mode stays a choice of its own. "Made to order" appears in both groups (see Open).
- **"Close account" in Settings.** The board's list stops at Sign out. Closing is a promised capability, so it has a row.
- **The pictures on For makers are works on view, or the empty plinth.** Never the board's sample photographs (GAL-G4; a page never shows a work that is not hung).
- **Step 2 and step 3 have no Back.** The account exists by then, and the next screen is the Studio.

## Proof
| Check | Result | Status |
|---|---|---|
| Phone suite, final build `UhdkxbzpibZovSIAXEp2u` (code `beb2365`) | PENDING | — |
| Desktop suite, same build | PENDING | — |
| Phone suite, build `j3qN_XCLgaQIn1ruyVFpI` (code `42cd0c0`, before the consistency fixes) | **98 passed, 1 skipped, exit 0** (27.3 min) | SEEN |
| New tests fail without their change (rule 19) | Journey 13 was run against one planted defect at a time. Each failed at its own test: dock not pinned → test 1 (839 vs 736 px); address not made unique (build `_AipRqjuP6RVEuTW_Rqut`) → test 2; the link signs in any browser (`QvnldJZfpB4pQWohRvOcV`) → test 3, landed signed in on `/studio/join`; no task (`aw1_F4GNOxqqdz7Qzei72`) → test 4; the Studio as one column → test 5 (1 column, not ≥ 2); Publish only drafts (`NKNJoJ21ez8W4St_n7qGe`) → test 6; Settings rows without values (`xmeVbNbV3emn9himKObs1`) → test 7; the sheet without the address (`qpjNEWT4Cl9N1WnG5h6jJ`) → test 8 | SEEN |
| Changed tests fail on the code before (rule 19) | The old code (`9a6277e`, build `rvSdl9_6wUHvd13DfeWgL`) with the new journeys 01, 08 and 11: 5 failed: the three-step join, recovery and session (01), the status taps (08), the bar off For makers (11). 9 passed, 10 did not run (serial) | SEEN |
| Independent review (builder-reviewer agent; did not write the code) | No High. **M1** a forwarded confirmation link signed the opener into the sender's account: fixed (GAL-L0035) and tested. **M2** link scanners can spend the link (GET verifies): pre-existing behaviour, kept; the expired state now offers Sign in. **M3** the header's Save draft had no pending state; a double tap made two works; Enter: fixed (it disables while saving; Enter saves a draft) and tested. **M4** a retried Publish would create a second work: the buttons now disable; a server-side create key needs a schema change and is recorded. **L5** the self-declaration help was not tied to its group: fixed, plus a link to Participation. **L6** unproven copy: dropped. **L7** two "Made to order": decision C, open. **L8** a join race: fixed (constraint told apart; the gallery row ensured). **L9** the email in a URL: removed from Settings; check-email's `?e=` is pre-existing, kept. **L10** `safeNext` and tabs: fixed (parsed as a browser would). **L12** the sheet's name ran together: fixed. Kept: Cancel discards a typed draft without asking | SEEN |
| Design consistency (`ui-consistency:verifying`, separate agent) | Calibrated first on a copy with one planted inline colour and size. It found it **by reading** (line 16), not by diffing. Real findings fixed: the editor header is `StudioHeader` (it had lost the four places from 900 px), `Icon` and `Field` used instead of hand-written ones, Settings names itself. Recorded: spacing literals off the scale, the same drift parts 1–2 have; step 2 and 3 have no Back, on purpose | SEEN |
| axe (WCAG 2.1 A/AA + best practice, axe-core 4.10.2), final build | **0 violations** on 15 states × phone and desktop: For makers, step 1, check email, expired link, sign in, reset, new password, Studio, its status sheet, Settings, WhatsApp, Add a work, Your details, Close account; plus step 2 (phone) | SEEN |
| Reflow at 320 px | No sideways scroll on all 13 pages | SEEN |
| Keyboard | For makers: Skip → wordmark → Open your gallery → I already have a gallery → colophon. Step 1: Skip → Back → Email → Password → Continue. Studio: Skip → Share → Settings → address → Add a work → each work → its chip → the bar. Settings: Skip → Back → every row → Sign out → Close account. Add a work: Skip → Cancel → Save draft → Add photo → Title → the taps → the rest. Every stop shows a focus ring | SEEN |
| Renders | `drawing-board-part3/before/` (build `FXzLGSv4tXyA-oGvsbO9V`, part 2 code; the empty Studio included) and `after/` (final build; Pixel 7 and 1440 desktop; step 2 for a new account, step 3, the expired link and the status sheet included) | SEEN |
| Byte identity, system and reference | Journey 11 asserts it in the suites above | SEEN in the suites |
| Design skills | `ui-consistency:finding-patterns` (the checklist, `drawing-board-part3/CHECKLIST.md`), `design-skills:design-critique` (below), `ui-consistency:verifying` (above) | SEEN |
| Repository gates | 5 of 5 green | SEEN |

## Design critique (design-skills:design-critique), against board screens 7–14 and the references
References: Shopify and Linktree onboarding (one question per screen, chips, progress, Skip), the Instagram profile grid (the Studio), Cosmos (an intro that is only images), and the foundation (`ux/INTERFACE_FOUNDATION.md`).
- **First impression:** each maker screen now does one thing, and its one action sits at the thumb. For makers is pictures, then a three-line promise, then the button. That is Cosmos's intro and the board's screen 7, where before it was a paragraph and a list. Joining is three short screens with "STEP n OF 3" (goal gradient), like Shopify and Linktree, instead of an account page followed by a long form.
- **Usability:**
  - 🟢 Fixed: Add a work put "Describe the photo" between the photos and the title. It now appears once a photo is chosen.
  - 🟡 For makers with fewer than three works on view shows plinths in the empty slots. On the live site today (no work yet) all three are plinths. This is honest, but it is a weaker first picture than the board's. It improves with the first three makers.
  - 🟡 "Made to order" appears twice on Add a work, once as a status and once as a price. Decision C.
  - 🟢 Cancel on Add a work leaves without asking. Low cost: nothing is published, and the draft is not yet saved.
- **Hierarchy:** headings in the heading serif, labels in mono capitals, help in small sans, the one docked solid action. The Studio's first thing after the name is the one missing step, then the work.
- **Consistency:** the docked bar is the work page's Message bar. The taps are one control (`Segmented`, `pick`) wherever a choice is closed. Settings rows are the sheet's and About's hairline rows.
- **Accessibility:** taps are real radios in a fieldset with its legend and description. The hidden file input shows its focus on the tile. Every control is 44 px or more.

## Open, for the governor
- **Decision C**, now visible: "Made to order" sits in both Status and Price on Add a work.
- The confirmation link is still used up by a GET, so an email scanner that opens links can spend it. This is pre-existing. A "Continue" tap before confirming would stop it, at the cost of one tap.
- A server-side key for "create a work", so a retried request cannot create a second work. Needs a schema change.

## Not seen
- The live result (after merge).
- A real email round trip: the test project writes links to an outbox (helpers `linkFromOutbox`).
- Real devices; the phone walk follows this PR.
