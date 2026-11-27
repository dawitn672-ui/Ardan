# The living ladder of fighters

**Aspect:** Power scaling (Road to Ten, Power 7) · **Kind:** system

The fighter tiers (`GD.TIERS`) read a person's fighting worth: Untrained, Brawler, Trained, Veteran, Elite,
**Formidable** (worth 91) and **Peerless** (worth 118). The top two were "Master" and "Legend" until order 98: "Legend"
now means one thing, the level 800-1000 legends of `data/legends.json`, and order 83 says Master and Legend are no
measures, so the tiers took plain words (D-203). The folder was `32-legend-and-master-caps`; `GD.LEGEND_CAP` is
`GD.PEERLESS_CAP`, `GD.MASTER_CAP` is `GD.FORMIDABLE_CAP`, `A.legendCount` is `A.peerlessCount`. A tier is a reading of
steel and body, not a rank: a person's standing is his level (`src/people/9999975-level`).

The plan asks to "cap the ladder (about 12 at the top, 5 per realm below it)" and to check it with a census. The game's
own lore is stricter:

- *"Perhaps five [Peerless fighters] alive in all of Ardan."*
- *"[Formidable fighters:] one or two in a realm, often the head of its order; most realms have none."*

The release already capped the top tier at 5 (`GD.PEERLESS_CAP`), but nothing capped the next, and nothing counted either.

**Decision.** The plan's numbers are upper bounds, and the lore sits inside them. The lore wins at the top (5). The
Formidable get the plan's bound of 5 per realm (`GD.FORMIDABLE_CAP`) as a hard cap, though the lore's "one or two" is
what actually happens.

**What it does.**

- **`A.ladderCensus()`.** It counts every living named fighter by tier: `{ peerless, formidable (by realm), elites }`. It is pure.
- **The cap.** `A.orderRaise` makes every new order leader Formidable (worth 96 to 106). In a realm that already has
  `GD.FORMIDABLE_CAP` of them, the new leader is trimmed to Elite instead (worth 87): weapon skills and the body come
  down a step at a time, with no dice.
- **The living ladder.** The Codex's "Power & scale" page says how many Peerless fighters live in Ardan, out of the possible 5,
  and how many Formidable fighters your realm has. It names:
  - the Peerless fighters whose names have reached you (fame 40 or more, of your realm, or someone you know);
  - your realm's Formidable fighters.

  The rest are counted, not named, in the spirit of 26-belief-versus-truth.

**Measured by** (`test.mjs`):

- `ladderCensus`: in two 40-year worlds, at most 2 Peerless fighters are alive at once (cap 5) and at most 1 Formidable fighter
  is in any realm (cap 5).
- `ladderCap`: with a realm filled to the cap, three new order leaders come out at worth 87, 87 and 87 (Formidable is 91 or more).
- `ladderPage`: the living ladder is shown under its new words (and the old ones are gone), and rendering it is pure.

**Finding.** The ladder isn't crowded, it's sparse. Two Peerless fighters and about six Formidable fighters live in the whole
world at the start, and the census stays there for 40 years. If the designers want more at the top, the lever is
`GD.PEERLESS_CAP` and the 10% chance in `A.orderRaise`, not a cap.

**Limits.**
- **Order leaders only.** The cap covers order leaders, the one place the release makes Formidable fighters on purpose.
  A person who grows into one by living (rare) isn't held back.
- **No tier drop from wounds.** Wounds still lower worth only through stats (Power 4).

## Entry by merit (cycle 1, `docs/reviews/cycle-1/lives.md`, I1)

A commoner General with fighting worth 108 failed the Iron Wolf on birth alone, and no bot life joined an order. Each order's `lore.join` now says whether merit stands in for birth or an invitation (`A.orderMerit`, read from the lore, not kept as a list):

- "a knighthood" (the Iron Wolf): the birth line says that the crown knights commoners of renown (994-careers, `cr_knighted`). A knighted commoner meets it.
- "deeds ... worthy" with an invitation (the Gold Masks): renown 60 and three deeds in the life's record meet the invitation line.

The other six orders ask no birth and no invitation. **Measured by** `ladderOrderMerit`.

**X7 (phone speed).** `A.ladderCensus(rid)` weighs only realm `rid`'s people; `A.ladderRoom` asks it so. Weighing every
living fighter for each order raised at world creation was a tenth of making a world. Same answers (identity probe).
