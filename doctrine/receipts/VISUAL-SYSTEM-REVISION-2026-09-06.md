# The visual system, recomposed — 2026-09-06

Session `9e4e9e82-091a-58bd-96d4-39aae1304020`. Governor's mandate, verbatim in intent: *the
work supplies the colour; the interface supplies the room.* The implemented treatment had
reduced the Gallery to cream, black rules and isolated amber marks — orderly, dull, a museum
directory. The instruction was to recompose the experience as a visual system, not to add
colour, and to show the result rendered rather than described.

This receipt records what changed, what it was judged against, and what is still weak.
Behaviour, data architecture and permissions are untouched: this is `tokens.css`,
`system.css`, `app.css`, the shared chrome components, the composition of eight surfaces,
and the synthetic photography.

## What was found before changing anything

The accepted plate R-1 only looks alive because of one thing: the governor's approved
photograph of a vessel on a limestone plinth, lit from the left. Every other object in the
live build was a flat procedural gradient. Half of the dullness was photography, not palette,
and no palette change would have fixed it.

R-1 itself carried the faults the mandate names — a black full-width rule under the header,
above and below the rail, above the bar; mono uppercase as the voice of every label, lead and
navigation item; a black filled block for the primary action. Restoring the reference would
not have met the brief. The brief goes past the reference.

## The system, revised

**Ground.** `#F3EEE6` grey-beige became `#F8F3EA` luminous ivory; a limestone `#E7DECF` was
added as the ground a work stands on (hero, image strip, plinths); one paper grain over the
whole page at 4.5 %, multiplied in. Ink softened and warmed to `#221E1A`, with an `ink-soft`
for structure and a warm charcoal for metadata.

**Rules.** Three kinds and no more: a hairline (ink at 16 %) under the header and above the
bar; a stone rule between rows; a structural ink-soft rule, reserved. The black rules are gone.

**Amber.** `#A5501F`, now the curatorial mark rather than a technical indicator: a 9 px
square before availability and the active place; the short rule that opens every section
lead; the 3 px left edge of the primary action; the active material's underline; the active
bar item — icon, label and a rule above it; field focus. Never a fill behind text.

**Actions.** A line and a label with an arrow in amber, never a filled block. The primary
carries the amber edge. The one filled button left is the irreversible act's alarm confirm,
because that act is the one that cannot be undone.

**Typography.** Three registers with jobs of their own. Serif now carries the curatorial
voice as well as the object: the context line, section leads and the maker line are serif
italic (`lead`, `maker` roles), so "Recently added", "The maker", "On view now" read as a
gallery speaking rather than a label printed. Mono uppercase is confined to the institution's
labels — rail, status word, route kind, chip — and no longer voices leads, field labels or the
bar. Field labels are sans words. The bar's labels are sans, small, tracked. Display grew to
40 px at weight 350; headings to 30.

**Composition.** The hero takes the photograph's own proportion: landscape fills the width,
square and portrait stand on the limestone. A wide tile takes its image's shape rather than
cropping it to a fixed frame. A ledge shadow closes the hero. Section rhythm opened from 32 to
48 px.

**Empty states.** A lit wall, a plinth with nothing on it, and — for a material — a fragment
of that material; then the truth in words and a route onward. Not decoration: it is what an
empty gallery looks like.

**Photography.** The vessel is the governor's approved reference photograph, the one real
image this product may carry. The bowl and the textile were restaged procedurally in that
photograph's room — plaster wall lit from the upper left, limestone plinth, stone floor, cast
shadow to the right — so the three makers' work reads as one commissioned set with variation.
They remain drawn, and the receipt says so below.

## Judged against

Every principal surface rendered at 390 × 844 @2x with the three synthetic works on the
hosted project, before and after, and inspected in two passes: entrance (fold and full), Clay,
an empty material, work detail with and without the handoff sheet, maker gallery, the maker
door, sign in, search, the saved shelf, workshops, the Studio, add-work, identity, contact
routes, and the operator's refused door. Screenshots are in `ux/reference/implemented/`.

Faults found and corrected across the passes, none of them in the first design pass's plan:
the Studio row list ran title and status onto one line (a latent inline-span bug exposed by
the larger serif); wide tiles cropped a 4:3 photograph into 3:2; sign in had no voice; the
bottom bar lit Browse and Workshops together on `/workshops` (`startsWith("/work")`); the
saved shelf's empty state bypassed the plinth; the footer's hairline sat too far above its
links; the bowl floated above its plinth in the first two renders.

## Refusals held

No cards, no gradients on surfaces, no glassmorphism, no gold, no handwriting, no filled CTA
blocks (one alarm confirm excepted and stated), no texture behind fields, no ratings, counts
or marketplace language, no animation beyond a 160 ms hover on actions.

## What is still weak, seen honestly

- **The photographs are drawn.** The bowl and the textile are procedural SVG, however well
  staged. They establish scale, colour and shadow; they do not carry the grain of glaze or the
  hand of a weave. The palette cannot be finally judged until a real photograph of a real
  handloom sits on that wall, and the rule against a real person's art means that photograph
  must come from a maker or the governor.
- **The entrance fold on a square work.** A square hero at phone width leaves the title below
  the fold; only the mark and the first line of the title show above the bar. A landscape
  hero does not have this problem. Whether the featured work should be chosen for shape as
  well as recency is a product question, not a styling one, and is left open.
- **The empty plinth without a fragment** (workshops, the entrance with nothing hung) is quiet
  to the point of blankness at 168 px. It is intentional and it is truthful; it could carry
  more light.
- **Operator surfaces beyond the refused door were not rendered.** No operator exists on the
  hosted project, so the maker list and the suspend dialog were revised by the same grammar
  and not inspected. That is the one representative surface the mandate names that this
  receipt cannot show.
- **The material fragments are abstract** — a clay sphere, a wood ellipse — and read as
  shapes rather than objects. They do their compositional job at 34 px and no more.

## NOT SEEN

The revised system on the deployed Worker. It is built and pushed; the governor's phone is the
instrument, as before.
