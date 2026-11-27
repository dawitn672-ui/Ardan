# Ardan's progression today: numbers and files

Read on the trunk (`v2-integration`, 2026-11-27, after order 100). **Data wins over prose:** where a README and its data
file disagree, the data is newer (for example, `src/people/9999975-level/README.md` still says the floor's `grown` is 24
and 20 to 30, while `data/level.json` holds 30 and 20 to 40 since order 93). Re-read the data before quoting a number.

**In flight:** branch `o98-rarity` (D-200 to D-202, H-171 to H-173). It is not on the trunk at the time of writing, so check
`git log` before relying on it. It brings:
- `data/rarity.json` and `A.RARITY` (`src/people/9999974-rarity`): one ladder, **basic, rare, epic, legendary, mythical**,
  for skills, titles, classes and items. Common and uncommon read as basic. Unique becomes a flag (one holder), not a
  rarity. An item's make stays apart from its rarity;
- legendary classes with one living holder, never advanced (census `A.S.lvc.u`, save step `classOne`, version 24);
- mythical titles and arts for the Primordials, the Dragon King and the Sword Saint; Wyrm-Slayer renamed Dragon Slayer.

Today's rarity words differ by system (below). Design for the target ladder, not for these.

---

## 1. Level: one scale for everything

**Files:** `data/power.json` (`levelCurve`, `bands`, `masters`, `races`), `data/legends.json`, `data/bestiary.json`,
`src/world/9999970-powers/` (`A.POWER`, `PW.being`), `docs/design/powers.md`.

- A being's level runs **1 to 1000**, read from one number, its **might**. For a person, might is his fighting worth in
  conscripts squared, `A.V2S.shownConscripts`, a Lanchester strength. A beast's comes from its duel worth. A legend's is
  written in data.
- **The ladder** (`levelCurve`): `log10(might) = a + b·L + c·L²` from level 20 up, with a = −0.637, b = 0.005858,
  c = 1.5e-6. Below 20, fifteen levels make a tenfold. Each level multiplies might by more than the last:

  | Level | 20 | 35 | 100 | 130 | 200 | 265 | 300 | 360 | 400 | 500 | 600 | 700 | 800 | 1000 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | might | 0.30 | 0.37 | 0.92 | 1.41 | 3.93 | 10.5 | 18.0 | 46.4 | 88.3 | 465 | 2,617 | 15,800 | 102,000 | 5.26 M |
  | ×/level | 1.0137 | 1.0138 | 1.0143 | 1.0145 | 1.015 | 1.0154 | 1.0157 | 1.0161 | 1.0164 | 1.0171 | 1.0178 | 1.0185 | 1.0192 | 1.0206 |

  Computed here from the formula. Inside the code a being also carries `t = 10·log10(might / 0.01)`, the even scale that
  the odds, gaps and draws use.
- **The owner's anchors** (order 93, refined by 94 to 97):

  | Who | Levels |
  | --- | --- |
  | average person | 20-50 |
  | soldier | 80-180 |
  | ordinary knight | 230-299 (past 300 he is more than ordinary) |
  | a kingdom's elite | 300-420 |
  | the strongest of the playable peoples | 500-700, very few |
  | average grown dragon | about 700 |
  | average great demon | about 650 |
  | lower demons | 300-500 |
  | trolls and ogres | 230-270 |
  | legends | 800-1000 (Sarnavoth 1000) |

  `data/legends.json` holds 16 legends at 813 to 1000. `data/power.json` `masters` holds 4 race masters at 615 to 700.
  `bands` gives the words by level, letters G to SSS ("common folk" from 20, "a soldier's match" from 80, "a knight's
  match" from 230 ...).
- **A person's level** (`src/people/9999975-level`, `data/level.json`, `A.LV`):
  - **Seeded.** Until a person earns a level, he stands at the one his fighting worth computes. It is held inside the band
    of his life: a commoner [floor, 50]; a noble [50, 99] by upbringing (gentry 50, noble 58, royal 68, a great house +8);
    service by rank (`[0, 80, 180]`, `[3, 150, 299]`, `[6, 230, 420]`); posts (a knightly order's master `[300, 700]`, a
    host's General `[230, 420]`, a division's `[230, 299]` ...). Above six tenths of the band (`knee`) it bends softly
    toward the top.
  - **Earned** only by defeating people and beasts (order 88). Crafts and trade raise skills, never the level.
  - **Floor of growing up:** `grown × (age / the race's grown age)^1.3`, where `grown = 30 + (mean potential − 42)/3`,
    held to 20..40.

## 2. Experience and the walls

**Files:** `data/level.json` `xp`, `src/people/9999975-level/a-level.core.js` (`A.LV.defeat`, `LV.duel`, `LV.field`).

- **Counted in peers** (defeats of a man of one's own level), from the level gap alone, so a rescale of might cannot move
  what a life earns.
- **Cost of a level:** from L to L+1 costs `1.01^L` peers. Above level 400 each level is only 0.05% dearer than the last
  (`slowGrowth` 1.0005), so at a legend's height a hundred equal defeats give a level or two.
- **Pay for one defeat:**
  - a **stronger** foe gives `2^(gap/20)`; past 4, it is 4 × the root of the rest; at most 16 peers;
  - a **weaker** one gives `2^(−gap/6)`. Every foe gives something.
  - Kill 1, defeat 0.7, spar 0.25 (`how`).
- **Walls** at each hundredth level: the step 99→100 costs 6 × the step before it, then 10, 12, 12, and 15 for every wall
  after. Steps computed here: 98→99 costs 2.65 peers, 99→100 costs 16.1, 199→200 costs 72.4 and 299→300 costs 235.
- **Total peers to reach** a level (computed here): 183 to 100, 709 to 200, 2,172 to 300, 6,128 to 400, 12,403 to 500,
  18,999 to 600, 33,223 to 800 and 48,942 to 1000.
- **Calibration** (the README's model on the anchors): from 30, beating soldiers (130) reaches 94 after 20 defeats and 158
  after 1,000; from 250, beating the best knights (320) passes 300 and reaches 329 after 1,000. Twelve bot lives: peasants
  end at 29, fighters with 49-67 kills at 120-136, nobles at 117-170; nobody stands at 99, 199 or 299.
- **Breakthrough at every wall** (order 95): points, a skill's rank jump where its conditions allow (`A.SK2.rankJumps`,
  `CL.jump`), then the class branch or a stat boost of 6, 10, 15, then 20 points (`classes.json` `boost`).
- **Legends** refine 0.4% of their power a year, up to +25% (`legends`). They also gain levels from defeats (`LV.legendDefeat`).

## 3. Stats and points

**Files:** `GD.STATS` in `src/core/release/core/02-game-data-a.js`; `A.stat` in `.../03-engine-base.js`;
`src/people/99993-v2-stats` (the body); `src/people/999997-bodies` (the stat words); `data/level.json` `points`.

- **Six stats:** `str` Strength, `spd` Speed, `ins` Combat Instincts, `sta` Stamina, `int` Intelligence, `wil` Willpower.
- **Points:** 1 a level (`perLevel`; a race may set `GD.RACES[r].points`), and 1 more at every 50th level (`bonusEvery`).
  - **Ceiling:** potential × 1.02. **Room:** a child has `0.25 + 0.75 × age / grown` of the ceiling.
  - **Cost:** 1 a point below half the ceiling, 2 to three quarters, 3 above.
  - **Placed points never move.** The player places his from 12. Children have theirs placed by the household's way of
    life (`ways`), and NPCs place theirs yearly, both through `A.WHY.decide`.
- **What a point gives today.** No table says so: it is spread through the release's formulas. The ones a fight reads:
  - **Duel worth** (`A.CR`, `src/core/release/core/06-prison-travel-school-ai.js`). Per point:

    | Source | Duel worth a point |
    | --- | --- |
    | `str` | 0.20 (+0.12 more above 100) |
    | `spd` | 0.24 |
    | `ins` | 0.26 |
    | `wil` | 0.08 |
    | the weapon skill read | 0.42 |
    | weapon speed | 1.6 |

    Armour costs 1.5 a weight (×1.4 when `sta` < 50).
  - **Duel blood** (`A.fighterFrom`, same file): `maxHp = (60 + 0.45 × sta)`, times the race (giant 3.2, orc 1.12,
    dwarf 1.1).
  - **Checks:** every stat feeds the odds through `A.checkOdds` → `VS.trueChance` (`attempt()`). Will can win a lost check
    under stakes; judgment, fatigue and overconfidence can throw a won one.
  - **The power ladder:** a person's might is his worth in conscripts squared, so stats that raise worth raise the
    *computed* level. A held level no longer follows worth, so points and the ladder can drift apart. **Any change to what
    a point gives must recalibrate this coupling** (`lvAnchors`, the powers tests).
- **The player reads** a stat as a word for its measured place among his own grown people (C9, D-040). He never sees units
  or percentages.

## 4. Classes

**Files:** `data/classes.json`, `src/people/9999975-level/c-classes.core.js` (`A.LV.CL`), `level.events.js`
(`lv_wall`, `lv_boost`).

- **29 hand-made classes** in three steps over eight roads (blade, spear, bow, shield, mounted, brawler, hunter, any
  weapon). The **generator** (`CL.generate`, `classes.json` `generator`: 9 roads × 8 templates with masters) adds advanced
  and hidden branches. The README counts **155 classes**.
- **Rarity words today:** common, uncommon, rare, epic, legendary, unique. The hand-made ones: 16 common, 8 uncommon,
  3 rare, 1 epic, 1 unique (the Sword Saint). A line keeps its rarity when it advances; a hidden branch may be rarer.
- **Generator weights by rarity:**

  | Rarity | `rarityStat` | `rarityFight` | `rarityHonour` |
  | --- | --- | --- | --- |
  | common | 1 | 1 | 2 |
  | uncommon | 1 | 2 | 3 |
  | rare | 2 | 2 | 5 |
  | epic | 2 | 3 | 8 |
  | legendary | 3 | 3 | 12 |
  | unique | 3 | 4 | 15 |

- **Who may take a class:** his best skill of the class's families must reach `need`: C 35 at step 1, B 55 at step 2,
  A 72 at step 3.
- **A class adds things to do** (order 92): a duel technique (`tech`), a passive under a condition (`passive.on`: lowHp,
  beast, first, mounted, shieldGuard, foeGuard, late), a buff and a way to earn (`act`). Its effects enter the skills
  adapter under the caps.
- **Choosing:** the player chooses on a card; NPCs choose through `A.WHY.decide` on a stream of their own. Walls passed
  before seeding are worn (parts, no effects).

## 5. Titles

**Files:** `data/titles/vocab.json`, `people.json`, `legends.json`, `figures.json`; `src/people/9999976-titles`
(`A.TT`, `A.deedDone`); `tools/lint-titles.mjs`.

- **Counts:**

  | File | Titles | Rarities | One holder |
  | --- | --- | --- | --- |
  | `people.json` | 15 | uncommon 2, rare 9, legendary 4 | 4 |
  | `legends.json` | 30 | all legendary | 29 |
  | `figures.json` | 21 | legendary 11, rare 10 | 13 |

- **Rarities today:** uncommon, rare, legendary (no common titles); `unique` is a flag.
- **Budget:** a title's person effects cost at most `perLevel(weight) × 5`, where weight D..S is 1, 2, 4, 8, 16, ×1.25 for
  a unique title and ×1.5 for a legendary one. Weight X (the great beings) has no person effects, only buffs `A.POWER` reads.
- **Stat at most a title:** uncommon 2, rare 3, legendary 5, unique 6. All sources together give at most +10 a stat, and
  never more than 5 past the body's potential.
- **Share boosts** (order 95, D-192) of `fight`, `check`, `income` and `growth`, capped by the rarest title among the
  sources: uncommon 0.02, rare 0.05, legendary 0.15, unique 0.25. Several titles stack 1, ½, ¼, ⅛. Measured
  (`ttGameChanger`): Blooded moves a near-even duel's odds about 5 points, the Undefeated about 21, Wyrm-Slayer about 45.
- **Hidden, no hints** (order 92): `requires` and `watch` are never read by `src/ui/` or a `*view*.core.js` file (the
  validator fails it). A title is announced only when earned (`tt_earned`).
- **One door for deeds:** `A.deedDone(p, kind, ctx)`, with the kinds in `vocab.json` `deeds` and their sources in the
  README table. `king_made` and `pupil_taught` have no source yet.

## 6. Skills

**Files:** `data/skills/vocab.json`, `families.json`, `ladders/*.json`, `kinds/*.json`, `arts/merges.json`,
`recipes.json`; `data/skills.json` (S1's 28 skills, concepts); `src/people/engine/skills2.js` (`A.V2.skills2`);
`src/people/36-skills` (S1's experience engine) and `src/people/37-skills2` (the rungs, effects, evolution, merging, the
three kinds); `docs/design/skills-v2.md`; `tools/lint-skills.mjs` with `tools/lib/skills2-check.mjs`;
`tools/skills2/seed-data.mjs`.

- **Who writes what.** `families.json` and `ladders/*.json` are **generated** by `node tools/skills2/seed-data.mjs` (`--check`
  fails when the files differ): never hand-edit them; change the generator. `vocab.json`, `recipes.json`, `kinds/*.json`
  and `arts/*.json` are **written by hand**.
- **Counts today: 194 entries.**

  | Group | Entries | Files |
  | --- | --- | --- |
  | ladder rungs | 140 | 11 files, 28 families × D, C, B, A and the family's S |
  | arts of the three kinds | 46 | arms 27, beings 10, body 9 |
  | merged arts | 8 | `arts/merges.json` |

  Order 97 asks for thousands.
- **Ranks** D, C, B, A, S, SS, SSS, and X above SSS for the legends. **Levels 1 to 10** (order 87). Past 10 a skill
  evolves (it becomes the next skill and is gone, order 95) or merges.
- **Budget:** `perLevel` by rank is D 1, C 2, B 4, A 8, S 16, SS 32, SSS 64, X 128, and a skill at level L spends at most
  perLevel × L. `rarityBonus`: unique +25%, legendary +50%. **Rarity words today:** common, uncommon, rare, unique,
  legendary.
- **Costs** (`vocab.json` `costs`): edge +1 narrow/family/group 1/2/4; fight one/all 2/4; blunder or surge step 3; aura
  squad/company/army 3/6/12; resist 2 (fear, mind 3); stat +1 4; trigger × 0.5 (rare × 0.25); active × its limit's factor.
- **Stacking caps** (in the adapter, by the highest rank among the sources):

  | Rank | Edge on a check | Fight share | Aura steps | Blunder or surge steps |
  | --- | --- | --- | --- | --- |
  | D to S | 12 | 15% | 3 | 2 |
  | SS | 18 | 25% | 4 | 3 |
  | SSS | 24 | 40% | 5 | 4 |
  | X | 36 | 60% | 6 | 5 |

  Resist 3 steps; growth +50 hundredths a family.
- **Rank shares** in 100, held once the library has 200 or more skills (`shares`): D 25-35, C 25-35, B 18-26, A 8-15,
  S 3-7, SS 0-2, SSS 0-1, X 0-1. This is the "far rarer up each rank" rule in the validator.
- **Kinds** (`kinds`): passive, active, reaction, aura, blessing, flaw, buff. Order 92's three (active, passive, buff) are
  in play. Order 97 adds debuffs and spells, with subkinds.
- **Routes** (`vias`): practice, teacher, school, bloodline, culture, faith, deed, event, office, item, evolve, merge, awaken,
  trauma, birth, title. `transfer` (`teach`, `inherit`, `steal`, `sell`, `lose`) decides heredity and theft.
- **Experience** moves only through `A.gainXp(p, k, effort, cause)` and a level only through `A.SK.set`. Never write
  `p.skills[k]`.
- **A rank's jump** at a wall (`E.rankJump`): the skill is at Lv 5 or more, two of {concepts, deed, talent} are met in
  full, and the route's other needs hold.
- **Names** the library may not use: `denyNames` (Great Sage, Predator, Gluttony, Raphael ...).

## 7. Items

- `GD.GEAR` (`src/core/release/core/02-game-data-a.js`) holds the arms and armour the fight reads: dmg, spd, reach,
  pierce, prot, weight.
- The figure library (`src/ui/engine/figure/make.js`) draws **two measures**: MAKE (crude, plain, fine, masterwork: the
  smith's care) and RARITY (common, rare, epic, legendary: what the thing is). This is a look only; no fight reads the rarity.
- Named legendaries and arts (order 52, D-050). No sets, no enhancement, no growth-type items exist yet.

## 8. Tests and tools that hold progression

| Test or tool | What it holds |
| --- | --- |
| `src/people/9999975-level/test.mjs` | `lvFromDefeats`, `lvNoFarm`, `lvWalls`, `lvClass`, `lvClassParts`, `lvLegends`, `lvAnchors` (long: pooled bot lives in the owner's bands), `statBounds`, `statMigrate`, `statNpc`, `lvPhone` |
| `src/people/9999976-titles/test.mjs` | `ttEarned`, `ttDeterministic`, `ttUnique` (no key with two living holders over forty years), `ttCaps`, `ttGameChanger` |
| `src/people/37-skills2/test.mjs` | `sk2Caps`, `sk2KindCaps`, `sk2Evolve`, `sk2Merge`, `sk2Jump`, `sk5Lives`, `sk2Migrate` and more |
| `src/people/36-skills/test.mjs` | `s1Census` (long): Grandmasters 1-12 and Legends at most 2 in each of five worlds over 40 years. It is the model for a rarity census |
| `tests/v2/skills2.test.js`, `tests/v2/skills2-data.test.js` | the engine and the data (`node --test`) |
| `tools/lint-skills.mjs`, `tools/lint-titles.mjs`, `tools/lint-figures.mjs`, `tools/lint-reasons.mjs` | the data's validators; no bare dice in AI choices |
| `tools/bench/balance.mjs` with `tools/bench/targets.mjs` | each starting path's numbers in their bands (CI's long tier) |
| `tools/bench/long-life-audit.mjs` | a long bot life with the one-holder audit |
| `tools/coherency.mjs` | the coherency checks; `tests/coherency-baseline.json` may only shrink |
