# The Gallery — brief for a logo mark

For an image or design tool. Everything here is fixed unless it says otherwise.

## 1. What the product is

The Gallery is a place where Indian makers — potters, weavers, woodworkers, metalworkers,
paper makers — each hold one gallery of their own. Visitors see the work at scale and contact
the maker directly. There is no cart, no checkout, no commission, no ratings and no ranking.
It is a gallery, not a marketplace. It is used almost entirely on a phone, and links to it are
shared in WhatsApp.

The governing line for the visual system: **the work supplies the colour, the interface
supplies the room.**

## 2. The idea to draw

A potter's hand shaping a vessel.

The vessel is hand-built, not factory-thrown: a low wide belly, a short neck, a rim that is cut
slightly unevenly, a narrow flat base. Proportions measured from the product's own reference
photograph, and they should be held:

- width : height ≈ 0.89
- widest point at ≈ 0.62 of the way down
- neck width ≈ 0.62 of the belly width
- base width ≈ 0.65 of the belly width
- the rim is not level — one side sits 3–4 % of the height higher than the other

The hand should read as **shaping**, not holding, presenting or offering. Contact with the clay
is the point.

## 3. Colour

Exactly these, no others:

| Role | Hex |
|---|---|
| Ground (paper) | `#F8F3EA` |
| Ink | `#221E1A` |
| Clay / accent (burnt amber) | `#A5501F` |
| Secondary ground (limestone) | `#E7DECF` |

Two colours plus the ground. The clay body is amber; ink is for the hand, the contour or the
structure. A reversed version on ink ground must work with the same shapes.

## 4. Form constraints

- Flat vector. Solid shapes or a single uniform stroke weight — not both fighting each other.
- No gradients, no glassmorphism, no drop shadows, no 3D, no texture, no outlines-plus-fill.
- No gold, no ornament, no wreaths, no laurel, no badge or crest, no circular seal-with-text.
- No handwriting or script, no calligraphic flourish, no wordmark inside the mark.
- Not a wheel, not a kiln, not a spinning wheel, not a lotus, not a diya, not a mandala, not a
  paisley. No generic "handmade in India" iconography.
- Not cute, not a mascot, not a face. The mark must not accidentally read as a moustache, a
  bowl on a saucer, a cup, a claw or a paw. Check this deliberately.
- The hand must have fingers that separate. A hand rendered as an undifferentiated blob is a
  failure.

## 5. Composition

Square, on a 128 unit grid, with key edges landing on multiples of 4 so a 16 px raster gets
whole pixels. Content inside a 112 unit safe area, centred, so a circular or rounded-square
mask does not cut it.

Two versions are needed and they are allowed to differ in detail:

1. **Full mark** — the hand and the vessel, for use at 48 px and above.
2. **Reduced mark** — the same idea simplified so it still reads at 16 px in a browser tab.
   The vessel alone is an acceptable reduction if the hand cannot survive; the two must
   obviously belong to each other.

## 6. Where it has to work

- 16 px browser tab, on a light and a dark tab strip
- 32 and 48 px
- 180 px iOS home screen, 192 and 512 px Android (the Android one gets masked to a circle)
- as a small avatar beside a link shared in WhatsApp
- beside the wordmark, which is set in IBM Plex Mono, 500 weight, uppercase, 0.2em tracking
- in one flat colour, for a stamp or an impression in clay

## 7. Deliverables

- SVG of the full mark: on paper ground, on ink ground, and transparent
- SVG of the reduced mark, same three
- A one-colour version in ink alone
- The horizontal lockup: mark left, `THE GALLERY` right, with the clear space stated
- PNG at 16, 32, 48, 180, 192, 512

## 8. How to judge what comes back

1. Rasterise at 16 px and look at it at that size, not zoomed. If the hand is mud, the reduced
   mark is not done.
2. Cover the vessel. Does the remaining shape read as a hand?
3. Cover the hand. Does the remaining shape read as a hand-built pot rather than a bucket, a
   vase, a mug or a bag?
4. Put it beside the wordmark. Does it look like the same family, or like a sticker?
5. Invert it to ink ground. Does it survive?
6. Squint. Two clear masses should remain, not one grey area.

## 9. One judgement to make consciously

A potter's hand names clay specifically, and the gallery also holds weavers, woodworkers,
metalworkers and paper makers. That is a real cost and it may be worth paying — clay is the
most legible signal of hand-making there is, and a mark that tries to represent five materials
usually represents none. Decide it deliberately rather than by default.

---

## Prompt to paste

> Design a flat vector logo mark: a potter's hand shaping a hand-built clay vessel. Square
> format, centred, on a 128-unit grid with content inside a 112-unit safe area.
>
> The vessel: low wide belly with the widest point 62% of the way down, short neck about 62%
> of the belly width, narrow flat base, and a rim cut slightly unevenly so one side sits a
> little higher. Width to height about 0.89. It should look hand-built, not machine-thrown.
>
> The hand: shaping the wall, in contact with the clay. Fingers must be distinct and separated
> — not a blob. It may be cropped by the edge of the tile so the whole hand does not have to be
> drawn.
>
> Colour: clay body in burnt amber #A5501F, hand and structure in warm near-black #221E1A, on a
> warm ivory ground #F8F3EA. No other colours. Flat solid shapes, no gradients, no shadows, no
> 3D, no texture, no outline-plus-fill.
>
> Not a badge, crest, seal, circle-with-text, wheel, kiln, lotus, diya or mandala. No script or
> handwriting. No mascot or face. It must not read as a moustache, a cup on a saucer, or a paw.
>
> Restrained, editorial, gallery-like. Quiet confidence, not craft-fair warmth. Produce the
> full mark and a simplified version that still reads at 16 pixels.

## Prompt for the reduced mark

> Simplify the mark above into a version that reads at 16 pixels in a browser tab. Same
> palette, same proportions. Remove any detail that turns to mud below 32 pixels; keep the
> silhouette and one clear gesture. Key edges should land on multiples of 4 in the 128-unit
> grid so that a 16-pixel raster lands on whole pixels. Show it rasterised at 16, 32 and 48
> pixels at true size, and again magnified with no smoothing.
