# First real studio: instructions to send, and the checks before sending

Prepared 2026-11-11. Button and screen names match the live code at `5ae491c`.
Do not paste the studio's name, email, number or photos into this repository (standing rule 4).

## A. Before sending (governor, about 10 minutes)

| # | Check | Why | State |
|---|---|---|---|
| 1 | Supabase → project `thegallery` → Authentication → Emails → SMTP settings: is a custom sender switched on? | Supabase's built-in sender delivers only to the project team's own addresses and a few per hour. Without a custom sender the studio never gets the step 1 link. | UNKNOWN (this session's token cannot read the live project) |
| 2 | Same project → Authentication → URL configuration: Site URL `https://atthegallery.in`, redirect list includes `https://atthegallery.in/**` | The email link must come back to the live site, not to a default address | UNKNOWN |
| 3 | Sign up once yourself on the phone, using an address that is **not** on the Supabase team, and get as far as "Add a work" | Proves the email arrives and the signed-in screens work on a real phone. It is phone-walk steps 1–3 | NOT SEEN |
| 4 | A live operator account exists | Someone can take a work down if needed | UNKNOWN |

Send the message in section B only when checks 1–3 pass.

## B. Message to send (WhatsApp)

*The Gallery: opening your gallery*
It takes about 15 minutes, all on your phone.

*Have ready*
• An email address you can open on this phone
• Your WhatsApp number
• 1 to 3 photos of one work, taken on your phone in daylight
• The work's title, and its price if it has one

*1. Start*
Open atthegallery.in/makers in Chrome (Safari on an iPhone). Tap *Open your gallery*.

*2. Account*
Enter your email and a password of at least 10 characters. Tap *Continue*.

*3. Email*
Open the email from The Gallery *on this same phone* and tap the link.
No email after 5 minutes? Check Spam, then tap *Send it again*.
If the link opens a sign-in page, sign in with the email and password from step 2.

*4. Your name and place*
Name: your studio's name. Place: your town or city. Both are shown on your gallery.
Under "How you work", tap *A studio*. Tap *Continue*.

*5. WhatsApp*
Enter your number with + and the country code, for example +91 98xxxxxxxx. Tap *Continue*.
This is the number visitors will message.

*6. Your first work*
Tap *Add a work*, then *Add photo* and pick your photos.
Add the title, tap the material, and choose the price: *Fixed price*, *On enquiry* or *Made to order*.
Size, year and a few words about the work are optional.
Tap *Publish* once and wait for the next screen. It can take up to 10 seconds.
*Save draft* (top right) keeps it private if you want to finish later.

*7. See it*
Your gallery's address is under your name in the Studio. Open it and check how it looks.

*If something goes wrong*
Take a screenshot and send it to me here. Please don't try again until I reply.

## C. Known limits the message works around

| Limit | What the message says |
|---|---|
| Only JPEG photos are read; screenshots (PNG) fail | "taken on your phone" |
| Photos over 12 MB are refused | phone photos are normally 2–8 MB; nothing to say |
| Tapping Publish twice can make the work twice | "Tap Publish once and wait" |
| The link signs in only the browser that started | "on this same phone"; sign in if it lands on sign-in |
| Signed-in screens not yet seen on a real phone | check A3 |
