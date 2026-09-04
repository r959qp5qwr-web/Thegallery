# The Gallery

A maker-led digital gallery for art and craft objects. Makers present their own work with the
dignity of an exhibition; visitors discover the object, understand who made it, and approach the
maker directly to buy, commission or learn. Payment, delivery, returns and disputes stay outside
the product.

> The Gallery hosts the encounter. The maker owns the transaction.

## Layout

```text
CLAUDE.md                      session orientation (discovery only)
doctrine/                      Doctrine binding, product state, learning ledger, receipts, harvests
scripts/doctrine-orient.py     product-local seam over the central Doctrine bootstrap
scripts/doctrine-hook.py       Claude Code hooks: automatic orientation, pre-act guard
scripts/doctrine-drill.py      negative drill for the seam and guards
.githooks/                     git-level consequence gates (core.hooksPath is set by the seam)
ux/                            human-surface state under ux-design-assurance v1.1
product/                       Stage 1 product, domain and access architecture
```

## Orientation

```bash
python3 scripts/doctrine-orient.py orient
python3 scripts/doctrine-orient.py check
python3 scripts/doctrine-drill.py
```

Requires Python 3.11+ and a checkout of the central `builders-doctrine` repository beside this
one (or at `$DOCTRINE_ROOT`). The central repository is read-only from here.
