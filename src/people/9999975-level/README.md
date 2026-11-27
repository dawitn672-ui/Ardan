# 9999975-level: a person's level and its stat points

**Aspect:** skills-v2 §12.1 and §12.2 as the owner's answers 4, 5 and 9 change them (§15; orders 82, 87, 88, 89, 91-94;
D-178, D-181, D-184) · **Kind:** system, three readable core files, two data files (`data/level.json`, `data/classes.json`),
two cards (`level.events.js`), tests.

## What it does

- **One level, the ladder's.** A person's level is the power ladder's level (`A.POWER`, `data/power.json`): the same
  scale as a wolf, a dragon or a legend, on the owner's anchors of order 93 (D-185, replacing order 84's): an average
  person 20-50, a soldier 80-180, an ordinary knight 230-299 (a few past 300), a kingdom's elite 300-420.
  `A.POWER.being(person).level` reads `A.LV.level`.
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
- **The experience** (`data/level.json` xp; orders 91-94, D-184), counted in defeats of a man of one's own level (a
  peer), from the level gap alone, so the ladder's rescale of might cannot move what a life earns. From L to L+1 needs
  `1.01^L` peers: exponential, each gap wider. A stronger foe gives `2^(gap / 20)` (past four, the root of the rest), a
  weaker one `2^(-gap / 6)`: **every foe gives something, whatever his level**, a far weaker one very little (a foe forty
  levels down, under a fiftieth of a level), so farming is slow and never nothing.
- **The walls.** The step into each hundredth level (99 to 100, 199 to 200 ...) asks 6, 10, 12, 12, then 15 times the
  step before it: thresholds, hard but crossable, never ceilings (order 94). Lives thin out as the cost climbs and the
  able break through. Calibration (a model of the rule, on the owner's anchors of order 93):

  | From | Beating | 20 | 80 | 300 | 1,000 |
  | --- | --- | --- | --- | --- | --- |
  | 30 | soldiers (130) | 94 | 128 | 147 | 158 |
  | 30 | his peers (40) | 45 | 56 | 66 | 76 |
  | 200 | knights (265) | 214 | 238 | 265 | 281 |
  | 250 | the best knights (320) | 260 | 280 | 300 | 329 |
  | 280 | a kingdom's elite (360) | 289 | 300 | 334 | 364 |

  In play (twelve bot lives of 35 years with `lvAnchors`' seeds, on D-185's curve, before order 96's bands): peasants
  who never fought end at 29, fighters with 49-67 kills at 120-136; nobody stands at 99, 199 or 299. Since order 96 an
  untrained noble is seeded by his upbringing (`data/level.json` seed.upbringing: gentry 50, noble 58, royal 68, a great
  house 8 more) inside the noble band 50-99, not at 115-170 from his fighting worth (H-165's `lvSeed`).

- **At each wall, a class or a stat boost** (`c-classes.core.js`, `data/classes.json`; orders 91 and 92). The reward is a
  **branch the person chooses**: the classes open to him (those that follow the class he holds, or the first classes of
  a road if he holds none; his best skill of the class's families at C, B or A by its step; the Sword Saint only for the
  bearer of the Sword Saint's title, Cael Vardan's while he lives) or a stat boost instead (6, 10, 15, 20 points by the
  wall, through `LV.grant`). The player chooses on a card (`lv_wall`: two to four choices; `lv_boost` when no class is
  open: where the points go); anyone else through `A.WHY.decide` (his skills, his way of life, his deeds, his temper) on a
  stream of its own, so the main stream never moves.
  - **A tree of 29 classes** in three steps over eight roads (blade, spear, bow, shield, mounted, brawler, hunter, any
    weapon): Swordsman, Spearman, Archer, Shieldbearer, Rider, Brawler, Hunter, Warrior; then Sword Master, Duelist,
    Blade Dancer, Spear Master, Lancer, Marksman, Ranger, Guardian, Warden, Pit Fighter, Beastslayer, Berserker; then
    Sword Saint (one living holder), Blade Master, Dragon Spear, Hawkeye, Bulwark, Warlord, Oathsworn, Banner Rider, Wild
    Hunter. Seventeen classes lead to two or more.
  - **A class adds things to do** (order 92): a **technique** for duels (an active skill in the duel's bar, NPCs use it
    too), a **passive** that fires under its condition (low on blood, against a beast, the first exchange, on horseback,
    behind a shield, against a guard, a long fight), a **buff** (an activity: a stat raised for some months, or blood
    recovered) and a **way to earn** (an activity: teaching, pit fights, bounties, guarding roads, raids). Every class on
    his road keeps its parts; the one he holds now gives its effects in the skills adapter, under the caps with his skills
    and titles. Each class adds a part its parents lack (`lvClassParts`).
  - **Worn classes.** A person given his held level (the player at his first month or on load, anyone else at his first
    fight) has the walls he already stands past settled with the road his skills give: worn, with their parts and no
    effects, honour or points, so nothing a check reads moves. Someone never recorded is shown the class his road would give.
- **Legendary and mythical classes** (orders 97 and 98, D-201): one living holder each (the census `A.S.lvc.u`, written by
  `CL.take`, freed at the holder's death by `CL.year`; a great being whose road holds one keeps it while he lives), and
  never advanced (`CL.open` refuses every class after one). None is on a road a person's skills would give (the profile,
  a seeded life). Three legendaries (the Dragonslayer Blade, Spear and Bow, once the Wyrm Blade, Spear and Bow: a true dragon slain and five beasts above him), the
  Sword Saint's class mythical. Save step `classOne` (version 24) builds the census from the roads. Test `lvClassOne`.
- **Orders 95 and 96** (D-184 addendum): the level before one is earned is the computed one held in the band of the
  person's life (`LV.band`: commoner, noble by upbringing, service by rank and years, posts by kind, kills), bent softly
  toward the band's top, with a hook for data (`LV.fromData`); every wall is a **breakthrough** (points, a skill's rank
  jump where its conditions allow, `CL.jump`, then the class branch); the tree grows by a **generator** (155 classes,
  rarities on the one ladder, basic to mythical, D-200; a line keeps its rarity); above 400 a level is only 0.05% dearer; the legends refine yearly
  (`LV.legendRefine`); one defeat gives at most sixteen peers; the player's training lands as single +1s (`A.train`, `p.trn`).
- **The legends grow too** (orders 92 and 97): a great being's level is its data's plus what it has gained by the same rule
  (`LV.legendDefeat`, `LV.legendGain`, `A.S.pw.leg[id].lg`): a man it beats, or the King and the Saint on the ridge. Among
  the great, a defeat of an equal (a foe at most 10 levels below, or stronger) pays 21 times (`legends.peerMul`), so a
  hundred defeats of an equal give an archdemon about twenty levels, as order 97 asks (O98, C-30); a man far below pays as
  before. The figures registry's fixed beings (`PW.FIG`: the ancient dragons and demons) refine and gain as the legends do.
- **A ruler's level is his own** (`d-rulers.core.js`; order 97, order 98's answer 3; O98, C-16, D-205). Each ruler but the
  player keeps a **way of rule**, chosen each year (and at the world's birth) through `A.WHY.decide` on a stream of its
  own: **field** (he leads his hosts), **drill** (he keeps his upbringing's arms-practice), **council** (he rules from the
  table) or **ease** (he does little himself). The reasons: his traits and temper, his age (as a man's: a race's old age
  read as fifty) and health, his best skills, his realm at war and its kind (a war-chief leads, a council's elect sits at
  the table), what the lore writes of him at the world's birth (the realm's primer: "won the Nagora Pass", "bedridden",
  "signs whatever the banker reads him"), and the habit of the way he keeps. In `LV.band` the way stands in for his
  upbringing and his crown's own posts (`seed.rule.ownPosts`); service and posts in arms still count. His level moves from
  where it stood when the way began (`L0`) toward the way's end over twenty years: field from 100 toward 320 (his
  drill alone takes him half way, each year at war counts two more), drill from 75 toward 160, council toward 50, ease
  toward 30 (and no strong body carries an idle king above it); at the world's birth a
  grown ruler has kept his way since he was grown. So the kings who do little themselves read lowest, and a warrior king
  after long wars stands among the elite (and in his realm's list of its best, `MIL.elite`). A change of way is kept in
  `A.S.why` (kind `rule`); `p.rway` is optional, and an old save's rulers choose at the next year's turn.
- **Stat points.** Each level brings one point (a race may set `GD.RACES[r].points`), one more at every 50th. Points are
  placed into the six stats and **never move** (`p.lv.put`); what `A.stat` reads is the body's base (`p.st`, or the trained
  body's floor) plus the placed points, held to the **body's room at this age** (the ceiling below the grown age:
  `0.25 + 0.75 x age / grown` of it), the **ceiling** being the person's potential x 1.02 (as `A.train`'s). Old age,
  wounds, hunger and weariness then lower what is read, never what is placed. A point costs 1 below half the ceiling, 2
  to three quarters, 3 above.
  - **The player** places his from age 12 (the profile's "three points to place" opens the sheet). Unplaced points keep.
  - **A child below 12** has his placed by his household's way of life (his father's, else his mother's) through
    `A.WHY.decide`, in the month's log line.
  - **NPCs** place theirs once a year (`A.onYear`: the people in `A.S.lvq`, and since O98's C-29 everyone alive with
    points waiting, so one who fell out of the bounded queue is not forgotten) through `A.WHY.decide`, by their post (a
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
| `c-classes.core.js` | `A.LV.CL`: the class tree, the options at a wall, the choice (the card's answer, `A.WHY.decide` for NPCs), the boost, worn classes at seeding, the parts in play (techniques, passives, activities, buffs), the adapter's sources, the save step `classes` |
| `d-rulers.core.js` | A ruler's way of rule (`LV.ruleBand`, `LV.ruleReasons`, `LV.ruleDecide`, `LV.ruleYear`; at the world's birth and each year) |
| `level.events.js` | `lv_wall` (a class or the strength), `lv_boost` (where the points go) |
| `data/classes.json` | the classes, their needs, the boost |
| `b-sheet.core.js` | The profile's line (`UI.PF.sheetTop`: "Level 24", ten marks toward the next, the button) and the allocation sheet (`UI.ov = { type: 'lvSheet' }`: six rows, a bar with the ceiling and the age's room, the stat's word, the next point's cost in marks, - and +, Keep) |
| `data/level.json` | every number above |

## Edits outside this folder (guarded, commented)

- `src/core/release/core/03-engine-base.js` `A.stat`: the placed points (`A.LV.withPut`) before the age factor.
- `src/core/release/core/07-duels.js` `A.duelConsequences`: `A.LV.duel(pc, D)` as the outcome is known.
- `src/core/release/core/11-armies-divisions-and-council-a.js` `A.fightEnd`: `A.LV.field(F, atkW)`.
- `src/world/9999970-powers/a-power.core.js` `PW.being`: a person's level is `A.LV.level` (his might, and so the odds, unchanged).
- `src/world/9999970-powers/c-meet.core.js` `PW.resolve`: a beast killed outright pays its level.
- `src/ui/999996-profile-tab/profile.b-view.core.js` `PF.sheet`: reads `PF.sheetTop`.
- `src/core/99998-v2-saves/saves.core.js`: `SV.VER` 18, then 22 (the step `classes`, D-184).
- D-184: release `07-duels.js` `A.style` (a class's style id), `A.techsOf` (a class's techniques), `A.styleFighter` (its
  passives), `A.techEdge` (a passive under its condition), `A.techSteal` (never a class's); `04-...-b.js` `A.canAct` (an
  activity held to its class); `03-engine-base.js` `A.stat` (a buff); `37-skills2/c-effects.core.js` `xOf` (`SK2.xClass`);
  `9999970-powers/a-power.core.js` `PW.being` (a legend's gain, a person's class), `b-wilds.core.js` `PW.ridge` and
  `c-meet.core.js` `PW.greatAnswer` (a legend's defeats); `data/titles/vocab.json` (`pupil_taught` has a source).

No `A.addStage`. One wrapper of `UI.ovModal` (as 99998-click-open's sheet does), no new name defined twice.

## State (optional; old saves load)

`p.lv = { L, f, pts, put, why (the last three placements), k0, kc, gx, gw, ct (the walls settled), cr ([[class, year,
earned 1 or worn 0]]), wp (the player's walls waiting for an answer), bf ([stat, v, months]: a buff) }` on the player and on
the people who have fought since; `A.S.lvq` (NPCs with points waiting, at most 400; the year also gathers anyone else with points waiting); `p.rway = { k, r, y0, y, L0, wy, lr }` on a ruler (his way of rule, the year it began, his level then, his years at war in the field, what the lore wrote of him); `A.S.pw.leg[id].lg` (a legend's gain).
Old saves: the step `level` seeds the player; the step `classes` (version 22) settles everyone's walls, worn.

## Tests (`test.mjs`)

`lvFromDefeats` (a duel won pays the rule's experience to the rounding; a beast killed pays; a foe 40 down under a fiftieth
of a level and never nothing), `lvNoFarm` (a thousand defeats of men twenty down: a little, slower and slower; twenty soldiers
do more), `lvWalls` (each wall six to fifteen times its neighbours, every other step rising with widening gaps, a wall's
step several times the defeats of the step before it, and crossable), `lvClass` (a swordsman's card offers the Swordsman
first and he takes it, with its technique and its source; no art of arms gives the boost card and its points; forty NPCs
choose by their reasons, the same on a replay, the main stream unmoved; the Sword Saint shut while Cael lives),
`lvClassParts` (the tree's data; a technique and a passive in a duel; activities held to the class; a buff for its months;
the class and its note on the profile at 375), `lvLegends` (the legends at the data's level in a fresh world; a hundred
defeats of an equal give about twenty levels; the fixed figures refine and gain), `lvRulers` (six worlds' rulers keep ways chosen
with reasons; the ways order the levels, ease lowest and field highest; the lore's infirm rulers at ease; twenty years in
the field reach 300, at ease sink to 40 or less; the same seed gives the same ways; the main stream unmoved; an old save's
rulers read as before and choose at the year's turn), `lvQueueNoDrop` (460 people granted points at once, the 60 the
queue drops among them: everyone with room places at the year's turn), `lvAnchors` (long: pooled bot lives land in the owner's bands),
`statBounds` (180 people with 400 points: nothing past the room or the ceiling, a limp and forty-five years lower the
read and keep the points, the main stream unmoved), `statMigrate` (every sample save loads with the same `A.stat` for
everyone, the player at his held level with nothing waiting), `statNpc` (the same placements on a replay; most points go
to the post's own two stats), `lvPhone` (375 x 667: the button and the sheet fit, 44-point controls, no percentage, notes
on a press, + and Keep place a point).
