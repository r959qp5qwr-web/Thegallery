# Governor decisions, 2026-11-09 — Wave 5 scope, and the design pass

## Decisions (governor's word: "I will go with your recommendations.")

| Item | Decided | Effect |
|---|---|---|
| A. Visual system | **Option 2**, a targeted SYSTEM CHANGE | Serif wordmark; one filled primary action per screen; no "→"; mono only for dimensions and price; no rule-plus-italic section opener; 12 px type floor; display type up to ~104 px on desktop; palette unchanged. `tokens.css` and `system.css` change, and the copies in `ux/reference/interface/` stay byte-identical. |
| B. Public navigation | **Option 2** | Public pages get the wordmark, Search and Menu (sections inline on desktop). The tab bar stays in the Studio only. One colophon line. |
| C. Price "On enquiry" vs status "By enquiry" | **Later**, as its own change | No change in Wave 5. |
| `DOCTRINE_READ_TOKEN` | **Set it** (recommendation) | Only the governor can create the token. Until it is set, CI stays red on that check alone. |

Open governor decisions in `PRODUCT_STATE.json` are not settled by this: GAL-OD-05 (entrance composition) keeps its
mechanism (a featured work, then recent work, with material filters); Wave 5 changes only how it is drawn, and hides
material filters that lead to no work.

## The design pass (rendered, not built)

- Static pages in `wave5-design-pass/pages/`. They are the markup the components would render, over the product's
  own `app.css` / `system.css` / `tokens.css` plus the proposed `gallery/wave5.css`.
- Renders are at 390 and 1440 px (`wave5-design-pass/renders/`). The review page is `wave5-design-pass/design-pass.html`,
  also published as a private artifact: https://claude.ai/artifact/NrK3jfHcXvEXurUAx5NiVp
- Object images are rendered 3D studio pieces made for this pass (`wave5-design-pass/tools/objects.html`, three.js).
  They are not any real person's work. Names are fixture names.
- Before images are the Wave 5 review captures (`wave5-review/img/`).

## Skills run for this pass

`ui-consistency:finding-patterns` (sized as a refactor across pages; the family is 12 public pages; shared pieces
`Header`, `Footer`, `EmptyPlinth`, `Action`; counts below), `ui-consistency:values`, `ui-consistency:planning`.
The review that produced the brief used `ux-ui-audit`, the `vectorlab-ux-skills`, `design-skills:design-critique`,
`design-skills:design-elevation`, `frontend-design`, `design-skills:ux-writing`, `design:ux-copy` and
`design-skills:journey-mapping` (`wave5-review/`).

Counts over the 12 public pages (about, browse, maker gallery, For Makers, not-found, participation, privacy, saved,
search, workshops, work, entrance), read 2026-11-09:
- `<Header` on 12 of 12; `place=` on 8 of 12; `<Footer` on 12 of 12.
- `EmptyPlinth` on 6 of 12; `<Action` on 6 of 12.
- `.context` line on 5 of 12; `.lead` openers on 8 of 12.
- inline `style={{` on 10 of 12; "→" glyph on 2 of 12 in page code, plus the shared `Action`.

## Waiting on the governor (published on the review page)

1. Freshness wording on a work. Recommended: "Updated 3 days ago" on its own line; the 90-day stale caution unchanged.
2. GAL-C1 disclosure. Recommended: verbatim in the contact sheet; a plain sentence on the maker's gallery only.
3. `DOCTRINE_READ_TOKEN`: the governor creates it and saves it as a repository secret.
4. Live operator account: yes / no / unknown.

SEEN: the renders listed above. NOT SEEN: any of this in the running product, and any test run for Wave 5.
UNKNOWN: the live operator account; the live Supabase auth settings (403 from this environment).
