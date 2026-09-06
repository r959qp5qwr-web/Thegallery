# The chain walked against the hosted project — 2026-09-06

Session `9e4e9e82-091a-58bd-96d4-39aae1304020`, decision GAL-SUPA-1.

The Supabase-native rewrite, walked in a browser against the governor's own Supabase project.
This is the first time any of it has been exercised by a browser, and the first time this
product has written a byte to a real object store.

## SEEN

| Step | Instrument | Result |
|---|---|---|
| Create an account | Supabase Auth (GoTrue), through the product's own form | account created |
| Sign in | the product's sign-in door | session established |
| The Studio recognises the maker | `currentAccount()` via `auth.getUser()` | rendered |
| Maker identity written | INSERT under row-level security as that person | row created, confirmed by reading it back as the same person |
| Create a work | INSERT under RLS | work created |
| **Upload an image** | WASM decode/resize, then Supabase Storage as the maker's own token | **accepted into the private bucket** |
| Publish | `publish_work` RPC | published |
| A visitor meets it | anonymous browser, entrance page | title rendered |
| The pixels | `/img/<id>/w640` as `anon` | **HTTP 200, 9,358 bytes of real JPEG** |

Read back afterwards, as a stranger holding only the publishable key: `public_works` returns
the one published work; the `makers` base table still returns **401**. The wall stands with
data behind it now, which is the thing the earlier anonymous probes could not establish —
they ran against an empty schema, where nothing had the chance to leak.

## What this cost, and what it found

Three failures on the way, and only one was the product.

**The product's own defect.** `price_mode` defaults to *exact*, and the guard against a
missing price was `!(Number(rawPrice) >= 0)`. `Number("")` is `0`, so a blank price passed the
check written to catch it, reached the insert as an empty string, and returned "We could not
save that work. Nothing was created." The journeys never caught it because they always typed a
price; a walk that left the field as a maker might leave it did. Fixed: an empty field is not
a zero price.

**The storage wall, working.** The first upload was refused with *new row violates row-level
security policy* — migration 004 had not been applied to the project. An upload no policy
permitted was refused by the database rather than accepted. The refusal was the evidence.

**Two of my own.** A session-hydration change went in on a hypothesis about empty reads that
the diagnostics then contradicted; it was removed and the walk reaches the same point without
it. And `waitForURL(/studio\/works\//)` matches `/studio/works/new`, so the walk was inspecting
the form it had just submitted rather than the work it had created. Both were mine, and both
looked like product failures until they were instrumented.

## NOT SEEN

- Any deployed build. This ran against a local server pointed at the hosted project.
- Email. The project is on `mailer_autoconfirm`, so no confirmation message was sent or
  needed. The confirmation and recovery doors are implemented and have never been walked.
- The operator surfaces, suspension and reinstatement, account closure, the saved shelf, and
  the endings — none reached by this walk. The journey suite still has to be rebuilt for the
  hosted project.
- The Worker. Nothing has been deployed.

## Left behind on the project

Synthetic makers under `.example` addresses from several attempts, and one published work
("Monsoon Vessel No. 4", handle `anika-mtpypzm7`). Reserved values only — nothing can reach a
real person — but it is visible to anyone who opens the entrance, and it should be cleared
before the product carries a real maker's work.
