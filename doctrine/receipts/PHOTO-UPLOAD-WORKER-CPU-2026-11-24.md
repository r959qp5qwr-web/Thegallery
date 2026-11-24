# Receipt: photos are prepared in the browser (GAL-L0044, escape E09)

Date 2026-11-24 · test target: local Supabase stack (`e2e/local/up.sh`; the hosted test project is paused) · standard 1.3.0

## What the governor found
The first real studio could not add a photograph on the live site. The Studio showed a draft with "No image" and "That did not go through".

## Cause (seen)
- Cloudflare Workers log export (governor, 2026-11-24; kept out of the repository): "Worker exceeded CPU time limit" on both photo uploads (1,419 ms and 1,892 ms of CPU) and on 41 other requests between 11:28 and 11:45 UTC on 23 Nov. Plain pages were killed at 10–16 ms. The account is on the Workers Free plan: 10 ms per request.
- Local measure of the codecs: 4000×3000 photo 8–20 s and 720–850 MB; 1000×750 still ~2.5 s and ~150 MB.
- The suite runs the app under Node, which has no CPU limit, so every journey passed (escape class C1, runtime coverage).

## Change
- `src/lib/photo-prepare.ts`: the browser opens the photo (orientation applied, falling back for older browsers), checks its size, and makes the original (long edge ≤ 3000 px) and width variants 320/640/1280/1920 as JPEG. No crop (P-17); re-encoding drops location data (GAL-R22).
- `beginPhotoAction` reserves the image row and signed upload addresses; the browser sends the files straight to storage; `finishPhotoAction` checks they are there and marks the image ready, or failed. `finishNewWorkAction` publishes or saves the new work and lands on its page.
- Codecs, their WebAssembly, `@jsquash/*` and the 12 MB server-action allowance removed. Worker 1.47 MB gzip (Free-plan limit 3 MB).
- Review fixes: server-step failures caught without swallowing Next's redirects; a second press cannot create a second work; long-stuck uploads (over 10 minutes) show as failed; too-long-and-thin photos refused before anything is stored; refused updates detected; untitled publish blocked on the new path; the description kept after a refusal; canvases released; device-neutral HEIC wording.
- Copy (design skill `design-skills:ux-writing`): no format list; "get the photo ready" for "prepare"; Studio error page no longer blames image size.
- Journeys: 17 (no codec in the server build; server CPU for one photo under 400 ms); 04 (non-photo refused with nothing stored; transfer cut off leaves `failed`; abandoned upload shown as failed; panorama refused). Journey 11 waits for the rendered rail.
- Test infrastructure: local Supabase stack in Docker; helpers accept it on loopback only and still refuse the live project and site.

## Results
| Check | Result |
|---|---|
| Control: journey 17 on the old code | FAIL: codec in `.next/server`; 1,044 ms server CPU for one photo (budget 400) |
| Control: abandoned-upload and panorama tests on the pre-review build | FAIL, both |
| Journey 17 on the fix | 60–199 ms server CPU for one photo across runs (budget 400) |
| Full suite, phone (local stack) | 107 passed, 1 skipped (5.3 min) |
| Full suite, desktop (local stack) | 108 passed (3.6 min) |
| Gate | OPEN, phone and desktop, build `22b13d0gXFCgXiN9ztuuT` |
| Cloudflare build (`opennextjs-cloudflare build`) and `wrangler deploy --dry-run` | pass; 7,274 KiB / 1,466 KiB gzip |
| Independent review (builder-reviewer) | no S1, no new authorisation hole; 2 S2 and 10 S3; S2 1–2 and S3 3–7, 9, 10 fixed; 8 guarded; 11–12 recorded below |

## Not proven here
- **Live:** no photo has yet been uploaded on the deployed Worker. The first studio's upload after merge, with no "exceeded CPU" in the Worker log, is the proof (NOT SEEN).
- **Devices:** real iPhone Safari (iOS 15–17) and a mid-range Android Chrome are not tested; decoding of 48–50 MP photos in a phone browser is UNKNOWN.
- Journey 17 measures Node, not workerd, and the codec scan names known codecs only (review 11).
- The bucket's own size and type limits are not set; `SUPABASE_STORAGE_BUCKET` and the policies' hard-coded bucket name must stay equal (review 12).
- Plain pages cost ~13 ms of CPU on the live Worker, over the Free plan's 10 ms (governor kept the Free plan; separate change).

## Renders (390 px, after)
`doctrine/receipts/photo-upload/after-not-a-photo.png`, `after-photo-added.png`, `after-new-work-photo-chosen.png`. Before: the studio's own screenshots (a real studio; not stored).
