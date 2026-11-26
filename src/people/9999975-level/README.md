# 9999975-level: a person's level and its stat points

**Aspect:** skills-v2 §12.1 and §12.2 as the owner's answers 4, 5 and 9 change them (§15; orders 82, 87, 88, 89; D-178,
D-181) · **Kind:** system, two readable core files, one data file (`data/level.json`), tests. No events.

## What it does

- **One level, the ladder's.** A person's level is the power ladder's level (`A.POWER`, `data/power.json`): the same
  scale as a wolf, a dragon or a legend, on the owner's anchors (an average human 20-30, a soldier 75-125, a knight
  150-200, a kingdom's strongest 300-380). `A.POWER.being(person).level` reads `A.LV.level`.
- **Seeded, then earned.** Until a person has a held level (`p.lv`), his level is the one the ladder computes from his
  fighting worth (his conscripts, squared), never below the floor of his years. He is *seeded* at that level, with
  nothing waiting and nothing placed, so no stat changes: the player at his first month or on loading a save (the save
  step `level`, save version 18), anyone else at his first recorded defeat. From then on the level moves only by:
  - **defeats** (`A.LV.defeat(p, foeLevel, how)`): a duel won (kill 1, a yield or a beast put to flight 0.7, a spar 0.25)
    and a hunt's beast killed (`A.duelConsequences` calls `A.LV.duel`); a beast settled at once (`PW.resolve`); a man
    killed in a battle, on a mission or in a brawl (the month reads `pc.kills`, less what a duel already paid: a soldier
    of level 100 when he serves, else an average grown person, 25); the commanders of a field battle's winning divisions
    (`A.fightEnd` calls `A.LV.field`: the losing side's best commander, or a soldier); and the man who beats the player in
    a duel;
  - **growing up**: a floor of `grown x (age / grown age)^1.3`, where `grown` is 24 moved by his mean potential (20 to
    30). After the grown age only defeats raise it. Ordinary life, crafts and trade raise skills, never the level (order 88).
- **The experience** (`data/level.json` xp): from L to L+1 needs `1.006^L x might(L)`: exponential, each gap wider. A
  stronger foe gives `might(L) x rho` (`rho` = its might over his; past 8 times, the root of the rest), a weaker one
  `might(L) x rho^2.5`, and none once he stands 25 levels above it, which it can never lift him past. So a man 40 levels
  above his foe gains under a ten-thousandth of a level, and grinding cannot farm. Calibration (a model of the rule):

  | From | Beating | 20 | 80 | any number |
  | --- | --- | --- | --- | --- |
  | 24 | soldiers (100) | 71 | 110 | never past 125 |
  | 24 | his peers (25) | 36 | 50 | 50 |
  | 100 | knights (175) | 136 | 173 | 200 |
  | 225 | a kingdom's best (340) | 261 | 305 | 365 |

- **Stat points.** Each level brings one point (a race may set `GD.RACES[r].points`), one more at every 50th. Points are
  placed into the six stats and **never move** (`p.lv.put`); what `A.stat` reads is the body's base (`p.st`, or the trained
  body's floor) plus the placed points, held to the **body's room at this age** (the ceiling below the grown age:
  `0.25 + 0.75 x age / grown` of it), the **ceiling** being the person's potential x 1.02 (as `A.train`'s). Old age,
  wounds, hunger and weariness then lower what is read, never what is placed. A point costs 1 below half the ceiling, 2
  to three quarters, 3 above.
  - **The player** places his from age 12 (the profile's "three points to place" opens the sheet). Unplaced points keep.
  - **A child below 12** has his placed by his household's way of life (his father's, else his mother's) through
    `A.WHY.decide`, in the month's log line.
  - **NPCs** place theirs once a year (`A.onYear`, the people in `A.S.lvq`) through `A.WHY.decide`, by their post (a
    captain toward will and strength, a lord toward will and wits, a farmer toward strength and endurance), their best
    skills and their temper (a greedy man weighs wits, an ambitious one strength), the cost near the ceiling against.
  - The draws for placements use a stream of their own from the seed, the person and the year: the main stream never moves.
- **Not done here** (D-181): `A.train` and the yearly growth still raise stats (§12.2's "allocation becomes the main road"
  waits for a balance pass); the training screen and professions (§12.3, §12.4); kills that no fight of its own reports
  (an event's murder) are paid as an average person's.

## Files

| File | What |
| --- | --- |
| `a-level.core.js` | `A.LV`: the level, seeding, the floor, experience and defeats, points, room, cost, placing by reasons, the month and the year, the save step; `LV.grant(p, n, why)`, an evolution's gift of points (37-skills2, D-182), recorded on the level (`lv.gx`, `lv.gw`) |
| `b-sheet.core.js` | The profile's line (`UI.PF.sheetTop`: "Level 24", ten marks toward the next, the button) and the allocation sheet (`UI.ov = { type: 'lvSheet' }`: six rows, a bar with the ceiling and the age's room, the stat's word, the next point's cost in marks, - and +, Keep) |
| `data/level.json` | every number above |

## Edits outside this folder (guarded, commented)

- `src/core/release/core/03-engine-base.js` `A.stat`: the placed points (`A.LV.withPut`) before the age factor.
- `src/core/release/core/07-duels.js` `A.duelConsequences`: `A.LV.duel(pc, D)` as the outcome is known.
- `src/core/release/core/11-armies-divisions-and-council-a.js` `A.fightEnd`: `A.LV.field(F, atkW)`.
- `src/world/9999970-powers/a-power.core.js` `PW.being`: a person's level is `A.LV.level` (his might, and so the odds, unchanged).
- `src/world/9999970-powers/c-meet.core.js` `PW.resolve`: a beast killed outright pays its level.
- `src/ui/999996-profile-tab/profile.b-view.core.js` `PF.sheet`: reads `PF.sheetTop`.
- `src/core/99998-v2-saves/saves.core.js`: `SV.VER` 18.

No `A.addStage`. One wrapper of `UI.ovModal` (as 99998-click-open's sheet does), no new name defined twice.

## State (optional; old saves load)

`p.lv = { L, f, pts, put, why (the last three placements), k0, kc }` on the player and on the people who have fought since; `A.S.lvq` (NPCs with
points waiting, at most 400). Old saves: the step `level` seeds the player; everyone else is seeded when he first fights.

## Tests (`test.mjs`)

`lvFromDefeats` (a duel won pays the rule's experience to the rounding; a beast killed pays; a foe 40 down under a fiftieth
of a level, 25 down nothing), `lvNoFarm` (a thousand defeats of far weaker men stop at the line; twenty soldiers do more),
`statBounds` (180 people with 400 points: nothing past the room or the ceiling, a limp and forty-five years lower the
read and keep the points, the main stream unmoved), `statMigrate` (every sample save loads with the same `A.stat` for
everyone, the player at his held level with nothing waiting), `statNpc` (the same placements on a replay; most points go
to the post's own two stats), `lvPhone` (375 x 667: the button and the sheet fit, 44-point controls, no percentage, notes
on a press, + and Keep place a point).
