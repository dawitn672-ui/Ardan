# The living ladder

**Aspect:** Power scaling (Road to Ten, Power 7) · **Kind:** system

The plan asks to "cap the ladder (about 12 Legends, 5 Masters per realm)" and to check it with a census. The game's own lore is stricter:

- *"Perhaps five [Legends] alive in all of Ardan."*
- *"[Masters:] one or two in a realm, often the head of its order; most realms have none."*

The release already capped Legends at 5 (`GD.LEGEND_CAP`), but nothing capped Masters, and nothing counted either.

**Decision.** The plan's numbers are upper bounds, and the lore sits inside them. The lore wins on Legends (5). Masters get the plan's bound of 5 per realm (`GD.MASTER_CAP`) as a hard cap, though the lore's "one or two" is what actually happens.

**What it does.**

- **`A.ladderCensus()`.** It counts every living named fighter by tier: the Legends, the Masters by realm, and the number of Elites. It is pure.
- **The cap.** `A.orderRaise` makes every new order leader a Master (worth 96 to 106). In a realm that already has `GD.MASTER_CAP` Masters, the new leader is trimmed to Elite instead (worth 87): weapon skills and the body come down a step at a time, with no dice.
- **The living ladder.** The Codex's "Power & scale" page now says how many Legends live in Ardan, out of the possible 5, and how many Masters your realm has. It names:
  - the Legends whose names have reached you (fame 40 or more, of your realm, or someone you know);
  - your realm's Masters.

  The rest are counted, not named, in the spirit of 26-belief-truth.

**Measured by** (`test.mjs`):

- `ladderCensus`: in two 40-year worlds, at most 2 Legends are alive at once (cap 5) and at most 1 Master is in any realm (cap 5).
- `ladderCap`: with a realm filled to the cap, three new order leaders come out at worth 87, 87 and 87 (Master is 91 or more).
- `ladderPage`: the living ladder is shown, and rendering it is pure.

**Finding.** The ladder isn't crowded, it's sparse. Two Legends and about six Masters live in the whole world at the start, and the census stays there for 40 years. If the designers want the plan's "about 12" Legends, the lever is `GD.LEGEND_CAP` and the 10% chance in `A.orderRaise`, not a cap.

**Limits.**
- **Order leaders only.** The cap covers order leaders, the one place the release makes Masters on purpose. A person who grows into a Master by living (rare) isn't held back.
- **No tier drop from wounds.** Wounds still lower worth only through stats (Power 4).
