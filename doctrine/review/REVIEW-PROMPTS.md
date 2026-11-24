# Messages that start each review

Attach every file in the pack to each reviewer: `00-READ-FIRST.md`, `01-APP-SOURCE.md`,
`02-PRODUCT-AND-TESTS.md`, both `03-SCREENS-*.pdf` and `MANIFEST.txt`. Start a new chat for each
reviewer, and don't show one reviewer another's findings until all three are in. Independent
lists catch more than a list each reviewer has already seen.

The pack is about 250,000 tokens. If a reviewer says the files are too large, attach
`00-READ-FIRST.md`, `01-APP-SOURCE.md` and `MANIFEST.txt` only, and say in the message that
`02-PRODUCT-AND-TESTS.md` was left out for size.

---

## A. Gemini: broad audit (Gemini writes its own prompt first)

```
I am about to release a consumer web app and want the most thorough pre-release audit you can
do. The attached pack is the whole app at one commit. 00-READ-FIRST.md explains the product, how
it is built, what is intended, what is already known, the scope, and the exact format for
findings. Read it fully before anything else.

Step 1. Write the review prompt you would give a senior team (security engineer, backend
engineer, QA lead, accessibility specialist, product designer, Indian privacy/IT-law adviser,
SRE) for a complete release audit of THIS app. Make it specific to what the brief and code
contain, not generic. Show me the prompt.

Step 2. Run that prompt yourself on the attached files. Go file by file through
01-APP-SOURCE.md, and policy by policy through the SQL. Check every intended failure state in
product/PRODUCT_ARCHITECTURE.md §8 against the code. Check every promise P-01..P-20 against the
code. Look at every page of both screen PDFs.

Write every finding in the format in section 8 of the brief, with ID prefix GEM. Do not run any
test against the live site. Finish with the three closing items in section 8.
```

## B. Grok: adversarial review

```
You are the attacker and the hostile user. The attached pack is a consumer web app about to go
public. 00-READ-FIRST.md explains it. Read it, then try to break the app on paper.

Assume the database policies are wrong until the SQL proves them right. Assume an attacker has
the public Supabase URL and publishable key and calls PostgREST and Storage directly, never
through the app. Assume a bored teenager, a spammer, a scraper after WhatsApp numbers, a
jealous rival maker, someone uploading stolen or illegal images, someone impersonating a famous
artist, and a non-technical maker on a cheap Android phone who taps everything twice on 2G.

For each, find the cheapest path to harm: read another maker's drafts or private email, change
or delete their work, take over an account, spend their confirmation links, flood sign-ups,
break the image pipeline with a crafted file, make a page render wrong, get content up that the
operator cannot take down, make the site say something false or illegal under Indian law.

Also attack the brief itself: list every claim in 00-READ-FIRST.md you think is wrong or
unproven, and every "intended behaviour" in section 5 that is actually a risk.

Do not run anything against the live site. Write each attack as a finding in the format in
section 8 of the brief, ID prefix GRK, with exact repro steps against a fresh test project and
the code or SQL lines that allow it. Rank by real-world harm, not by cleverness.
```

## C. Claude: a fresh session, blind to the other two (optional third reader)

```
Attached is a review pack for a web app about to go public. Read 00-READ-FIRST.md first and
follow it exactly. Review the code, SQL and screens for anything that would hurt a real maker
or visitor after release. Write findings in the section 8 format with ID prefix CLA. Report
only what you can point to in the files; mark guesses as Low confidence.
```

---

## After the reviews

Send the three lists back to the builder session as files. Do not fix anything from them
directly. The builder merges them into one register, reproduces each finding on the test project
or by direct probe, and marks each one CONFIRMED, NOT REPRODUCED, BY DESIGN or DUPLICATE before
anything is fixed.
