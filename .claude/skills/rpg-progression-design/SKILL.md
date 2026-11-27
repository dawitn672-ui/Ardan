---
name: rpg-progression-design
description: "Design or rebalance character progression in Ardan or any realistic fantasy RPG: levels and experience curves, walls and breakthroughs, stat points (what each point gives, exactly), classes (trees, hidden and legendary classes, one holder), titles (earned, hidden, stackable, game-changing), skills (thousands of them: kinds, levels, rarity, evolution, merging, heredity), item rarity, sets and the power scale from peasant to legend. Holds the saved study of Overgeared's Satisfy system that the owner's order 97 asks for. Use it whenever you touch data/level.json, data/classes.json, data/titles/, data/skills/, data/power.json or the rarity ladder, whenever a brief says Overgeared, wave 3 or 4 of order 100, 'stats', 'titles', 'classes', 'skills in the thousands', 'rarity', 'mythical' or 'legendary', and before inventing any number that makes one person stronger than another."
---

# RPG progression design (Ardan, after *Overgeared*)

Use this to design or rebalance how people grow stronger: level, stat points, classes, titles, skills, item rarity and
the power scale. It gives the method. Two references give the facts:

- `references/overgeared-study.md`: the saved study of *Overgeared*'s game, Satisfy, with sources. It covers what a stat
  point gives at each 100-level awakening, classes and the nine legendary classes, titles and their numbers, skills,
  ratings, sets, enhancement, legends and myths, and **a table of what fits Ardan's rule 18 and what does not**. Order 97
  asks for this study "saved in the knowledge base"; this is it. Read it before designing titles or stats.
- `references/ardan-progression-today.md`: today's numbers and files. It covers the level ladder's log10 formula and a
  table, the experience rule and its walls, points, what `A.CR` and `A.fighterFrom` read from a stat, 155 classes, 66
  titles, 194 skills, budgets, caps and the tests. Read the data files again before quoting a number: data wins over prose.

## 0. Before you design

1. Read the owner's orders 78 to 100 in `docs/OWNER_ORDERS.md`. The prompts are kept whole in `docs/prompts/`; the main
   ones here are `2026-11-26-world-rebuild-and-diagnostic.md` (order 97), `2026-11-27-fix-the-contradictions.md` (98),
   `2026-11-26-knights-dragons-breakthroughs.md` (95) and `2026-11-26-classes-and-scale.md` (92). **The newest order
   wins.** Read the plan's waves 3 and 4 in `docs/PROGRESS.md` ("Order 100").
2. Check whether branch `o98-rarity` (D-200 to D-202) has merged. It brings the one ladder (`data/rarity.json`,
   `A.RARITY`), one holder for each legendary class, and mythical sets. Build on it; never on today's mixed words.
3. Follow `ardan-dev-process` for how a step lands. This skill covers *what* to build, not the process.

## 1. The owner's target, in one list (orders 79 to 98)

- **One rarity ladder for everything:** basic, rare, epic, legendary, mythical. Levels are a separate system beside it.
- **Levels** (1 to 1000) come only from defeating people and beasts (order 88), on the power ladder's one scale. They grow
  exponentially harder. A **wall** stands at every hundredth level: a breakthrough (stats boosted, a skill may jump a rank)
  and a **branch the person chooses** (a class or a stat boost). A wall is a threshold, never a ceiling (order 94).
- **Stats:** say exactly what each point gives (damage, health, stamina ...), *Overgeared* in mind. Placed points never
  move. Training gives single +1s.
- **Classes:** as many as are worth having (300+ if sensible), branching from the base ones. A class's rarity never
  changes along its line. Rarer hidden branches exist. A class change **adds things to do**. **Legendary classes have one
  holder each and cannot be advanced.**
- **Titles:** stackable, with buffs, very hard to earn, hidden, **no hints anywhere**. Basic titles give fitting
  reputation and small boosts. Legendary titles are very few, nearly impossible, and life-changing (experience, stat gain
  per level, skills of their own). Mythical titles and skill sets belong to the Primordials, the Dragon King and the Sword
  Saint; ancient demons and dragons hold legendaries of their own.
- **Skills:** thousands, far rarer up each rank; kinds passive, active, buff and debuff, spells, each with subkinds.
  **Level** (1 to 10) **from training alone**, never race. **Quality** (rarity) from evolution, heredity or race.
  **Merging can raise rarity; evolving does not** (it shows its stage; the evolved skill replaces the old). **Family arts
  cannot merge** and may reject an heir of low affinity. **Skill and its use both matter:** a swordmaster with a basic
  technique beats an unskilled man with an epic style.
- **Counts follow conditions, not caps.** Elites have no set number; their count comes from how hard the level is to
  reach, the realm's people, families, wealth, schooling and events. Numbers are guides; **never pad with useless entries.**

## 2. What *Overgeared* teaches (the study's lessons, in short)

- **A point is stated in units, and its worth rises at each 100 levels.** Strength gives 0.1 attack and 3 health a point
  before level 100, 0.2 and 5 after it, and 0.7 to 0.8 and 7 to 9 by the third and fourth awakenings. The wall rewards
  every point already placed, not only the next ones.
- **Two kinds of stat.** Basic stats take free points; **character stats** (persistence, insight, composure, dignity,
  courage) **are earned by living a certain way, never with points.** A perfect fit for Ardan's realism.
- **Normal classes catch up.** The rare hidden classes are front-loaded; the base lines hold "the greatest potential per
  advancement", so the commoner's road stays worth walking.
- **A legendary class is a calling with one holder.** It is inherited by a qualified successor or taken by beating the
  holder (the Sword Saint's "Beat a Legend"). It cannot be aimed at deliberately, and one failure does not close it. It
  gives **rule-breaking lines** (wear anything, immunity, a creation skill that makes new techniques) **and real drawbacks**.
  It is not an all-rounder.
- **Titles are where the big numbers live.** One raid's title equals tens of levels of points (Savior of the World: all
  stats +200). Titles can open a stat, generate a skill, carry a conditional passive (below a tenth of your health, all
  stats +30%), be upgraded along a chain (Candidate, then King), or be lost or sealed. Top players hold 12 titles; the
  greatest, 30 or more.
- **Rarity buys scaling and new verbs, not one big number.** Rare skills of fixed damage age badly; legendary skills grow
  with their user. A crafter's skill stage caps the rarity he can make (beginner normal, up to master unique).
- **Legend is a status of feats that fades with fame.** Transcendence is a second axis raised by feats.
- **Do not copy:** level reset on a legendary class, stats in the thousands, announcements and rumours of titles,
  enhancement by dice, myth by faith or gods, 120,000 classes (the study's §8 says why).

## 3. The design method

### 3.1 One ladder, one power budget per step

Give every rarity step **both** a budget and a *kind* of gift. Then no system prices rarity on its own scale.

| Step | What it may do | Budget (multiplier on the rank's `perLevel × L`) |
| --- | --- | --- |
| basic | numbers only: an edge, a share, a stat point | × 1 |
| rare | adds a condition or trigger (fires on a moment), or narrows to a niche at a higher number | × 1.25 |
| epic | a second effect, or a new action (a technique, an activity) | × 1.5 |
| legendary | breaks one ordinary rule (resists a state outright, wears any arms, creates techniques) or changes a life's growth (experience, stat per level); carries a drawback | × 2 |
| mythical | one holder's set, world-scale: a dominion, a form (Dragonoid Form), a rule no one else has | × 3, and only for the named few |

The multipliers are **a proposal**, to be measured, not law. Today's numbers it must reconcile:
- skills' `rarityBonus` (unique +25%, legendary +50%);
- titles' `statMax` (2, 3, 5, 6) and boost caps (0.02, 0.05, 0.15, 0.25);
- classes' `rarityStat`, `rarityFight` and `rarityHonour`.

Put one table in `data/rarity.json` and make every validator read it: `tools/lib/skills2-check.mjs`,
`tools/lint-titles.mjs` and the classes' generator.

- **Rank and rarity are two axes.** Rank (D to SSS, X) is how deep a skill goes. Rarity is how rare its *kind* is. Price
  both, and do not double-count: a rare D skill must not beat a basic B skill on the same check.
- **The caps stay in the adapter** (`37-skills2/c-effects.core.js`): +10 a stat from all sources, +12 edge, 15% fight from
  skills and the titles' own boost pool. A new rarity raises a cap only by the rank of the strongest source, as `caps` in
  `data/skills/vocab.json` already does.

### 3.2 How rare each tier is: conditions, then a census

Never write "at most N epic swordsmen". Write **the conditions** (a level or rung reached, a deed in the ledger via
`A.deedDone`, a teacher or school via `SK2.knows`, a bloodline via `transfer.inherit`, a post) and let the world produce
the count. Then measure, and move the *conditions* until the count lands in the owner's guide:

1. Write the conditions in data, hidden where order 79 says so.
2. Run worlds (bot lives, seeds pooled; see §5) and count holders by realm and decade, with a census key like
   `A.S.tt.u` or `A.S.lvc.u`.
3. Compare with the guides: knights the top 50 to 3,000 of a kingdom; elites with **no set number** (an empire may hold
   2, 30 or, very rarely, 72: the count follows the realm's people, families, wealth and schooling); soldiers tens to
   hundreds of thousands; at most 300 dragons, 33 ancient demons, three ancient dragons; mythical only for the
   Primordials, the Dragon King and the Sword Saint.
4. Write the spread you measured in a comment and set the test's bar outside it.

**One holder** only where the owner says: legendary classes, one-holder titles ("unique" is no longer a rarity word), the irreplaceable beings (only an heir
succeeds, order 97). The census frees the place on death. A successor needs a reason (a pupil taught, a duel won, an heir
by blood), never a draw.

### 3.3 Stats: say what a point gives

Today no table says it. The meaning is spread through the release's formulas: `A.CR` gives duel worth per point (str
0.20, spd 0.24, ins 0.26, wil 0.08); duel blood is `60 + 0.45 × sta`; checks run through `attempt()`. Build the table:

1. **List every reader of each stat** with `node tools/show.mjs --where A.CR` and a grep for `st.str` and `A.stat(p, "str"`
   (fight worth, blood, carry, march, checks, mood). Write one row a stat: what one point adds, in the game's units.
2. **Give each stat a job no other stat has:** str for damage and carry, sta for blood and armour's burden, spd for tempo,
   ins for reading a fight, int for learning and spells, wil for holding under stakes. Remove overlaps; do not add stats
   for the sake of it.
3. **Rising worth at the walls** (Overgeared's awakening, order 95's "stats are boosted"): each wall a person crosses may
   raise a point's coefficient. This is a reasoned body change, a breakthrough.
4. **Recalibrate the coupling.** Fight worth gives might, might gives the *computed* level, and the level gives points.
   Change what a point gives and you move every seeded level and every duel's odds. Rerun `lvAnchors`, the powers tests,
   `ttGameChanger` and `balance.mjs`.
5. **Show it the house way:** the point's gain in plain units on a click-open note (`data-note`), the stat as a word, and
   **never a percentage**. If "a share more" must be said, say it in words. Record the reading in `docs/DECISIONS.md` if it
   bends the "no percentages" rule.
6. **Character stats** (composure, insight, dignity, courage) belong as earned traits or skills, raised by deeds and posts,
   not as a seventh pointable stat.

### 3.4 Classes: trees that add verbs

- A **road** is a family of arms or a walk of life. **Step 1 is the base class; each wall offers 2 to 4 branches.** A line
  keeps its rarity; a *hidden branch* is rarer and asks hidden conditions (`req`).
- **Every class adds a thing to do:** a technique, a conditional passive, a buff, a way to earn. One more number is not
  enough (order 92). The generator must refuse a template that only adds numbers.
- **To reach 300+ without padding,** grow the roads and templates, not the clones:
  - roads beyond arms (crafts, trade, faith, the sea, command, letters, the wilds, magic);
  - templates as *styles* of a road (storm, iron, shadow, ...).
  - Each generated class must have a **distinct part** (a technique of its own, a passive on a different condition) and a
    **reachable** condition, and in simulation someone must take it unless it is rare by design. Count what the generator
    makes and drop what shares every part with a sibling.
- **Normal lines catch up:** a basic line's late steps carry its best parts, as Overgeared's normal classes do.
- **Legendary classes:** one holder; no advancement (it grows by its skills, titles and deeds instead); a creation verb
  (makes techniques, a knightly order, a school); a drawback; reached by a hidden deed or by beating the holder. **The level
  never resets:** a class never moves the level.
- **NPCs choose through `A.WHY.decide`** with reasons (skills, way of life, deeds, temper). `tools/lint-reasons.mjs` may
  only fall.

### 3.5 Titles after *Overgeared*, inside Ardan's rules

- **Kinds to cover:** slayer of a kind (a knight, a dragon); first-to-do (`once` an age); saviour of a place
  (`per: "realm"`); rank and office (named by a ruler through `A.WHY`); mastery (a skill's rank); endurance (streaks, a
  siege's days); infamy; born (a Primordial).
- **Gifts by step.** Basic: reputation (`social`) and a small edge. Rare: a conditional passive (a trigger). Epic: opens a
  new action or a character stat. Legendary: growth (`boost` of `growth`), a stat point per level or a skill of its own,
  i.e. life-changing. Mythical: the named few's sets.
- **Chains:** a title may be upgraded by a later deed (it replaces the lesser title), lost by a deed (`lose`), or sealed.
- **Rules that stay:** hidden conditions; no hint anywhere (`tools/lint-titles.mjs` fails one); announced only when
  earned; one door for deeds (`A.deedDone`); deterministic checks; the budget (`perLevel(weight) × 5`), `statMax` and
  the boost caps.
- **Every deed kind a title watches needs a source** that records it. `king_made` and `pupil_taught` have none yet.

### 3.6 Thousands of skills without padding

**Generate, do not hand-write.** A skill is a cell in **families × concepts × kinds × rank**, kept only if it passes four tests:

1. **A distinct verb.** It differs from every skill of its family and rank in at least one of these: trigger, target,
   resource, condition or effect type. "Quick Cut II, +1 more" is padding.
2. **A reader.** Something uses it: a duel move, a check tag, an activity, a battle aura, a craft's output.
3. **A route.** Some start can reach it (`starts`, `vias`). The validator's "reachable" check holds this.
4. **A holder.** Bot lives produce holders in proportion to its rank's share (`shares` in `data/skills/vocab.json`: D 25-35
   in 100 down to SSS 0-1), or it is declared rare by design.

**Rules the generator must encode:** level by training only; rarity by birth, race or heredity (`transfer.inherit`,
`vias` bloodline, birth, culture), by evolution's line (the same rarity, a new stage) or by a merge (may rise one step,
never two); family arts carry `merge: false` and an affinity gate that can reject; kinds and subkinds from the owner's
list (spells by element or school; debuffs as the mirror of buffs).

Seed rung data with `tools/skills2/seed-data.mjs` (it writes `families.json` and `ladders/`; `--check` must pass). The arts
in `kinds/` and `arts/` are hand-written today, so give them a generator of their own before the count grows.
**Specify every skill whole** (`spec`: cooldown, cost, effect, duration, conditions, §15.6). Respect `denyNames`; names are
our own.

### 3.7 Skill against use

Order 97: the user's insight, body and experience can beat a better technique. Encode it so the numbers agree:
- **A technique's effect reads through the user's mastery.** An art's share is multiplied by how far the family's level
  reaches the art's rank. An epic style held by a novice gives little.
- **The body and the family read stay the larger part of worth** (`A.CR`: skill 0.42 a point against an art's capped share).
- **Rarity buys scaling, not a flat sum.** A legendary art grows with its user, as Overgeared's legendary skills do.

Hold it with a test: in pooled duels, a master (family A Lv 5) with a basic art beats a novice (family D) with an epic art
most of the time, and the art still shows when masters meet.

### 3.8 Items

- Keep **make** (the smith's care) and **rarity** (what the thing is) apart, as the figure library already does
  (`src/ui/engine/figure/make.js`).
- An item's rarity comes from **its maker's rank and its material**: a smith's stage caps the rarity he can make, as in
  Overgeared. Never a drop roll.
- Sets give a bonus for wearing their pieces together; growth-type arms rise with deeds.
- Reworking an item has a risk read from the smith's skill and the metal, not a gamble.
- Use conditions (strength to wield, the skill to use) are realistic. Keep them.

## 4. The realism check (rule 18) for any progression feature

- Can every gain be **explained in the world's words** (who taught him, what he did, what he survived)?
- Does any number come from a **bare die**? Structural choices go through `A.WHY.decide`, the rest through a seeded
  stream, never `Math.random`.
- Is a rare thing rare because its **conditions** are rare, not because of a cap?
- Does the player learn of a title or class only **when it happens**, and does it add something **to do**?
- Do the caps still hold when everything stacks (`ttCaps`, `sk2Caps`)?

## 5. Testing balance

```sh
node tools/build.mjs --out=/tmp/ardan/<me>/x.html                    # private build
node tools/skills2/seed-data.mjs --check && node tools/lint-skills.mjs && node tools/lint-titles.mjs && node tools/lint-figures.mjs
node tools/lint-reasons.mjs                                          # bare-dice decisions may only fall
node --test tests/v2/skills2.test.js tests/v2/skills2-data.test.js   # engine and data
node tests/run.mjs /tmp/ardan/<me>/x.html --only=lvAnchors,lvWalls,lvNoFarm,lvLegends,ttCaps,ttUnique,ttGameChanger,sk2Caps,sk2KindCaps,s1Census
node tools/bench/balance.mjs /tmp/ardan/<me>/x.html                  # each start's numbers in tools/bench/targets.mjs
node tools/bench/long-life-audit.mjs /tmp/ardan/<me>/x.html --seed=7 --years=60   # one holder a post or title, errors
node tools/coherency.mjs --quick
```

- **A census test for every rarity tier you add**, shaped like `s1Census` (`src/people/36-skills/test.mjs`): several seeds,
  40 years, count holders, bars from the measured spread (H-082: seed fallback, pooled numbers, poll never sleep).
- **A power test for every new budget:** pairs at near-even odds, as `ttGameChanger` does, giving how many points of odds
  each step moves. Write the readings in a comment.
- **Long tests over 200 s** go in `tests/long-tests.json` (`node tests/run.mjs --check-tiers`).
- **Widen a band** in `tools/bench/targets.mjs` only with a reason written in the file.

## 6. Where each system lives

| System | Data | Code | Validator and tests |
| --- | --- | --- | --- |
| Power ladder | `data/power.json`, `data/legends.json`, `data/bestiary.json` | `src/world/9999970-powers` (`A.POWER`) | powers tests; `docs/design/powers.md` |
| Level, points, walls | `data/level.json` | `src/people/9999975-level/a-level.core.js` (`A.LV`) | `lvAnchors`, `lvWalls`, `statBounds` |
| Classes | `data/classes.json` | `src/people/9999975-level/c-classes.core.js` (`A.LV.CL`), `level.events.js` | `lvClass`, `lvClassParts` |
| Titles | `data/titles/*.json` | `src/people/9999976-titles` (`A.TT`, `A.deedDone`) | `tools/lint-titles.mjs`, `tt*` tests |
| Skills | `data/skills/`, `data/skills.json` | `src/people/engine/skills2.js`, `src/people/36-skills`, `src/people/37-skills2` | `tools/lint-skills.mjs`, `tests/v2/skills2*.test.js`, `sk2*` tests |
| Rarity ladder | `data/rarity.json` (o98-rarity) | `src/people/9999974-rarity` (`A.RARITY`, o98-rarity) | the validators above |
| Figures (profiles) | `data/figures/` | `src/world/9999977-figures` | `tools/lint-figures.mjs` |
| Stats and body | `GD.STATS`, `GD.RACES` | release `03-engine-base.js` `A.stat`; `06-prison-travel-school-ai.js` `A.fighterFrom`, `A.CR`; `src/people/99993-v2-stats`, `999997-bodies` | `statBounds`, `statMigrate` |
| Decisions | none | `src/people/9999950-why` (`A.WHY`) | `tools/lint-reasons.mjs` |
| Design notes | `docs/design/skills-v2.md` (§2.4 budget, §11 titles, §12 level and points, §15 the owner's answers, §16 the three kinds) | | |

## 7. Pitfalls seen here

- **Big flat title numbers** snowball: keep Overgeared's *shape* (titles outweigh levels) inside the caps and boost pool.
- **Rescaling might moves every seeded level;** experience counted in peers keeps a life's earnings still. Keep it so.
- **Hand-editing generated data:** `ladders/` and `families.json` are overwritten by `seed-data.mjs`.
- **Two words for one rarity** across systems: read every word through `A.RARITY` once it lands.
- **A count written as a cap** ("at most 72 elites") breaks order 97. Write the conditions and measure.
- **A card never grants a title directly:** it records a deed through `A.deedDone`, in the house event shape.
- **Buzzword names.** Classes, titles and skills are named in plain English a newcomer reads cold ("Dragon Slayer", not
  "Wyrm-Slayer"; a `storm` style, not an invented word). The owner's standing rule (order 100 follow-up); see the
  `cold-reader-naming` skill. Overgeared's own names are not ours either (`denyNames`).
