# 999997-bodies: bodies that make sense, and longer lives (C9)

**Aspect:** owner order 34 ("Bodies that make sense", "Longer lives", and the owner's later word on masters), D-039
items 8 and 12, **D-040** · **Kind:** system (3 code files), small edits in the release (`A.stat`, `A.skill`,
`A.deathChance`, `A.mortalCheck`, the giant's speed, body readouts in the lore), test, measuring script.

The owner: "why is someone who is clearly trained and can lift twice their body weight rated so low. If this man is poor
at speed and endurance then what is a child ... I hate the values that say 66kg can pick up 120kg or reactions speed is
170ms. Remove those entirely ... Who exactly becomes a master of swordsmanship without training their body". Then, on
masters: "if they don't it'll hold them back from becoming masters ... once you get past a certain baseline it's cleanly
up to you to decide what physical attributes and skills are most important for your playstyle". And: "a well fed and
healthy merchant who avoids conflict should easily be able to live until 50-70 without outside factors."

## What it does

**1. A stat's word is its measured place among one's own grown people** (`b-scale.core.js`)

- `r = A.stat / (the people's mean potential × 0.78)`, a stat against an untrained grown person of the same people.
  `VS.STAT_CENTILES` holds r at 19 centiles for every grown person, old age included, at the start of eight worlds (6,064
  people of every people, estate and age), measured before the skill floor, so it is the population as born and grown
  (`measure.mjs` prints it again).
- The words, by centile: under 2, 2-10, 10-30, **30-70 average**, 70-90, 90-98, 98-99.9, and beyond 99.9 **off the chart**
  (Strength: feeble, weak, slight, average, strong, very strong, mighty; Speed: sluggish ... swift; Endurance: frail ...
  tireless; Reflexes: dull ... lightning-quick; Wits: simple ... brilliant; Will: weak-willed ... iron-willed).
- A click on a row says where it stands and what it is read against ("Stronger than all but one in twenty of your
  people. Read against every grown man and woman of your people, young and old ...").
- **A child is a child:** held to an untrained body of its own age, "strong for a child of 9".
- **Another people against men:** the body's four rows also read against men, and past the 2nd or the 98th centile of
  men that is off the chart: a giant's strength, and (the giant's speed potential is now 18, was 28) a giant's speed at
  the other end.
- `VS.statWord` (check chips, another person's "Body:" line, the old words' other readers) and the Profile page's seven
  pips read the same scale.

**2. No real units for a body** (`c-sheet.core.js`, lore)

- The sheet (side profile, phone's You page, full profile, the Profile page's Body fold): height is a word for one's
  place among one's own people and sex ("tall", "a little short", "of middle height for a child of 9"), weight is gone,
  and strength, speed, endurance and reflexes are the words above. No kg, cm, m/s, km a day or ms.
- The full profile's "178 cm, sturdy" reads "tall, sturdy"; the character maker's height slider says the word.
- People's descriptions in the lore no longer give heights, weights or reaction times ("A lean man of 55, 172 cm and 66 kg"
  is "A lean man of 55"; the Lionblood's "reactions of about 110 ms" is "quicker than any other elf's"). Things keep
  their weights (a trebuchet's stone, a crossbow's draw, a beast in the bestiary): those are not a body's readout.

**3. A skill's baseline** (`a-floor.core.js`, the release's `A.stat` and `A.skill`)

Each word of a skill from Journeyman asks a modest baseline of its two governing stats (`GD.SKILL_STAT`), as r:

| Word | Journeyman 30 | Adept 45 | Expert 60 | Master 75 | Grandmaster 88 | Legend 100 |
| --- | --- | --- | --- | --- | --- | --- |
| first stat | 0.65 | 0.78 | 0.88 | 1.00 | 1.08 | 1.15 |
| second stat | 0.9 of that | | | | | |

- **Held back** (`A.skillCap`): a skill past the word its stats carry works at the top of the word they do carry, for
  show: a sword Master with feeble reflexes fights as an Expert. Age, wounds and weariness count.
- **It stalls:** practice and use do not raise a skill past the word its stats carry. Training a skill trains its first
  stat a little and its second less (the player; `A.train` keeps its own limit).
- **Past the baseline any build is fair:** nothing more is asked; the stats beyond it add only through what reads them.
- **The world's people clear it** (`A.statFloor`): an NPC's governing stats are held at least at their skills'
  baselines, and an NPC soldier's drill (1.10) and a labourer's work (1.05) hold Strength and Stamina above the middle.
  The player is never lifted. Pure: it reads the person and stores nothing, so old saves read it with no new state.

**4. Longer lives** (the release's `A.deathChance`, `A.mortalCheck`)

- A grown life not yet old dies of nothing much at 0.6 of the release's yearly odds, and the estate counts: serfs ×1.2,
  slaves ×1.35, peasants ×1.1, the well fed (noble, royal, gentry, merchant) ×0.9. Children and old age's curve are the
  release's.
- A grown body not yet old pulls through a fever or the flux far more often (+0.25 on the survival roll when the cause is
  an ordinary illness). The Harbor Pox, wounds, beasts and battles are not softened.

## Measured

See D-040 and `docs/HISTORY.md` for the numbers before and after (word bands, masters, death ages).

## Tests (`node tests/run.mjs <build> --features=bodies`)

| Test | What it checks |
| --- | --- |
| `bodiesBands` | Over two generated worlds: about four in ten words average, under 6% at each end, under 1% off the chart; an untrained man of 35 at his people's mean reads average in all six; a typical child of 9 "average for a child of 9"; a typical giant off the chart against men for strength, and at the other end for speed |
| `bodiesNoUnits` | Three played lives (a child, a man, a dwarf): the side profile, the sheet, the full profile, the Profile page, every stat popover, six other people's pages and sheets, and the maker's height: no kg, cm, ms, m/s, km a day or "lifts N" |
| `bodiesBaseline` | Every NPC master (skill 75+, grown, not old) clears the Master baseline; a feeble player with sword 80 fights as an Expert and training does not raise it; with the baseline met, the full 80; a skill below its cap rises and trains its first stat a little; the player has no floor |
| `bodiesLifespan` | A healthy merchant at peace, on `A.deathChance`: nine in ten reach 50, most of those die between 50 and 75, under one in five passes 80, a serf a little earlier |
| `bodiesPure` | Words, sheets, the Profile page, `A.stat` and `A.skill` over 200 people draw nothing and change nothing |
| `bodiesOldSave` | A save round trip reads the words with no new state |

## Limits

- The Profile page shows a held-back skill at the level it works at, not the level trained; a line saying "held back by
  your body" is left for G.
- The memory, judgment, presence and cunning rows keep v2's words and "1 in N"; they are not engine stats yet (G).
- Lore keeps measures of things and beasts (stones, bows, a war elephant's weight).
