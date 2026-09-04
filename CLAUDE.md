# The Gallery — session orientation (bootstrap discovery only; not Doctrine authority)

This repository is a governed product under the central **Builders' Doctrine**. Doctrine is
central; binding is local; copies are not authority. This file carries no volatile facts
(no hashes, branch names, counts or stages): those live in machine-readable files that the
bootstrap validates.

## Where truth lives

- `doctrine/DOCTRINE_BINDING.json` — the exact central Doctrine commit and fingerprints this
  product is governed by. Local product authority.
- `doctrine/PRODUCT_STATE.json` — product sentence, FIXED decisions with enforcement loci,
  refusals with reopen conditions, OPEN governor decisions, promise table, the active stage
  and the next acceptance condition. Local product authority.
- `doctrine/BUILD_LEARNING_LEDGER.md` — incidents, captured in the change that fixes them.
- `ux/UX_MANIFEST.yaml` — human-surface state (journeys and their `UX_READY` /
  `INTERFACE_READY` status) under the bound `ux-design-assurance` module.
- `product/` — Stage 1 architecture, domain model and decision instruments.
- `.doctrine/runtime/` — derived orientation evidence for this session; never committed,
  never authority.

## How a blank session orients

The SessionStart hook in `.claude/settings.json` runs this automatically and prints the
derived standing assessment. To run it by hand:

```bash
python3 scripts/doctrine-orient.py orient      # verify the Doctrine checkout, emit the receipt
python3 scripts/doctrine-orient.py check       # consequence gate; run before commit/deploy/claims
python3 scripts/doctrine-drill.py              # prove every protection fails under its violation
```

The seam expects the live `builders-doctrine` checkout beside this repository or at
`$DOCTRINE_ROOT`. It fingerprints the central bootstrap before executing it, verifies the
checkout sits on the bound commit with bound artifacts unmodified, and fails closed on any
mismatch. Until orientation is VALID: inspection and diagnosis only.

## Standing rules a session must not need reminding of

1. Never write to `builders-doctrine`. The guard denies it; the rule stands without the guard.
2. Read `active_stage.next_acceptance_condition` in `PRODUCT_STATE.json` before building
   anything. Do not silently settle an OPEN decision through code.
3. Work on a branch; the default branch is merged through review.
4. No real person's art, address, phone number or email in fixtures, screenshots or tests.
5. Report what was SEEN, NOT SEEN and UNKNOWN. A green claim needs a receipt.
