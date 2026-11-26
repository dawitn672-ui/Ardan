# Skills, ranked and levelled (the skills rebuild)

*Stamped 2026-11-25 · design only: no game code changed · the owner's model is the master prompt's section 9 and
Appendix B (D-159, order 76), with the owner's later word of the same day: "substitute masters, legends etc for lvls"
(the seven words go; a skill shows its rank and level), and the same day's orders on titles (§11) and on a person's
level, stat points and training (§12) · replaces `docs/design/skills.md` (S1, D-072) as the design the
game is built to; S1's engine is reused under it · stands beside the world's power ladder of levels for every being
(order 77, D-167), which is being built in parallel and has no design note in the tree yet (§3.6 says what this design
assumes of it).*

The owner's words: "skills can merge advance and evolve. think about reincarnated as a slime for reference of just how
many skills there should be in this world. stats and skill should be separate though." The genre's ideas are taken
(ranked skills, evolution at the top of a level, fusion of held skills, awakening in a crisis, one-of-a-kind skills,
a great many of them); no name, skill or story of that work is.

---

## For the owner, on one page

- **A skill is a card:** *Basic Swordsmanship · C-rank · Lv 3*. Rank (D, C, B, A, S) is its power band; level (1 to 10)
  is how far you have taken it. Rarity (common to legendary) is how hard it is to find. Kind says how it works
  (passive, active, reaction, aura, blessing, flaw).
- **No more words.** Beginner, Intermediate, Advanced, Expert, Master, Grandmaster and Legend leave every screen. A skill
  reads "C · Lv 6"; a fighter's standing is the power ladder's level. "Master swordsman" survives only as an **honour**
  someone gives you for a reason (a school's chair, the king's champion, a song), never as a number crossed (§6).
- **Stats stay apart.** Strength, speed, insight, stamina, intellect and will are the body and mind. A skill may need a
  stat; an ordinary skill never raises one (only blessings, curses, racial skills and titles may). The player shapes
  stats with the points his level gives (§12).
- **Every old skill becomes a ladder.** Swordsmanship is now Stick and Lath (D) → Basic Swordsmanship (C) → Measured
  Blade (B) → Master of the Long Edge (A), and one or two S-rank summits held by one person at a time. Next to the
  ladders stand hundreds of named skills: culture arts, house secrets, auras, blessings, knacks, flaws.
- **Growth by doing, gates by reasons.** Experience fills a level as it does today. A level 10 skill **evolves** into the
  next rank only when its conditions are met (a concept grasped, a deed, a teacher, an age). Several held skills can
  **merge** into one stronger skill. A rare crisis can **awaken** a skill a rank higher. None of these is a timetable.
- **Hard to the top.** Plain work alone takes about 4 years to the end of D, 12 to the end of C, 27 to the end of B and
  58 to the end of A. The best teacher, a gift and a hard life cut that to a third at most. An S-rank skill is a few
  people on the continent; the alpha 9 life (Legend and emperor in under thirty years) cannot happen again.
- **Nothing breaks.** Every one of the 5,723 card checks keeps its odds on the day of the switch: a check reads the
  ladder, and the ladder's levels sit exactly on today's numbers.
- **The first library is 200 skills** (§9), then the 265 fighting styles of the lore become arts (about 500), then
  magic and monsters (1,000 and more).
- **Titles** (§11) stand beside skills: earned for deeds, very hard to get, their requirements never shown (at most a
  rumour), stackable, each giving honour, renown, buffs and stat boosts under the same budget and caps as skills.
- **A person has a level** (§12): the power ladder's level, earned in every walk of life, not only fighting. Each level
  gives **stat points the player places** among the six stats, inside his race's ceiling and his body's room at his
  age. **Training is chosen** on a training screen: a skill, and a way (alone, a master, a school, a book, a harder
  test), with its months, coin and odds in words. Crafts and trade plug in as professions.

Five questions for you are at the end (§14); each has a default, and work can start on the defaults.

---

## 1 · What is measured today

Counted in this tree on 2026-11-25 (`grep` over `src/`, the bundled engine left out). These are the readers the
adapter (§5) must keep whole.

| What | Count | Where most live |
|---|---|---|
| Card checks `check: { s, s2, d }` | 5,723 (5,124 with a literal key; 44 keys; 4,129 with `d` from 40 to 59) | 4,494 in `src/core/release/` |
| Card grants `fx: { skill: { k: n } }` | 4,311 (38 keys) | 3,605 in the release |
| `A.skill(p, k)` | 354 in 85 files | core 210, people 50, ui 30, nobility 20, war 18 |
| `C.lvl(p, k, min)` | 254 (none with a word: all numbers; 30, 35, 40, 25, 45, 50 the commonest) | 240 in the release's content |
| `A.trainSkill(p, k, amt)` (the S1 shim) | 333 in 51 files | 293 in the release |
| `A.gainXp(p, k, effort, cause)` | 31 in 13 files | S1 and its sources |
| Direct `p.skills[k]` reads and writes | 279 in 60 files | core 139, people 39 |
| `GD.SKILLS` and `GD.SKILL_*` tables | 185 and 58 | 61 and 19 files |
| Perks (`GD.PERKS`: 114 rows over 38 keys) via `A.perkOf/perksOf/perkSum` | 21 calls | `03-engine-base.js` |
| `A.fightWorth(p)` | 51 in 20 files | duels, war, the sheet |
| `A.checkVal` | 15 | odds and the honest-duel view |
| Fighting styles (`p.styles`, `styleXp`, 265 styles in `lore/04-styles.json`) | 135 `styleXp` sites | `07-duels.js` |
| S1 only: `A.SK.*` 92, `SK.set` 19, `C.talent/ready/stuck` 10, `grasp/talent/specialism` fx 7, `p.tal` 21, `p.ssp` 5 | | `src/people/36-skills/` |
| **The words a player reads:** `SK.levelName/wordName/WORDS` 38 in 14 files; `GD.TIERS` and its readers 63 in 15 files; `GD.STYLE_RANKS` 6; `LEGEND_CAP/MASTER_CAP` 14; "Master/Legend/Expert II"-style strings 16 in src and 4 in tests; "master swordsman"-style prose 95 in 35 files | | §6 |

Save version today: 15 (`SV.VER`, S1b). Sample saves that must keep loading: 19 in `tests/saves/` and 2 in
`tests/saves/press/`.

---

## 2 · The data model

### 2.1 Where it lives

```
data/skills/
  families.json      the 28 families (today's S1 skills): id, name, group, governing stats, legacy keys, focuses
                     (today's specialisms), kin, concepts (S1's 252, kept), check tags
  ladders/*.json     one file a group (arms, body, war, land, sea, crafts, trade, letters, faith, court, shadow):
                     the D-to-A rungs of each family, and its S summits
  arts/*.json        culture arts (from lore/04-styles.json, wave 2), merge results
  named/*.json       body, mind, command, social, wilds, offices, trauma, knacks
  faith.json         blessings, one file
  houses.json        house-secret templates (instances are generated from the house, §2.6)
  flaws.json         flaws and curses
  recipes.json       merges (evolution lives on the skill itself)
  vocab.json         the effect types, tags, triggers, deeds, places and their costs (§2.4)
```

The build puts them on the page as `A.DATA.skills2` (one object, ids as keys), as `data/names.json` is today.
`data/skills.json` (S1) stays until step 9 of §10, then goes to `archive/`.

### 2.2 A skill

```jsonc
{
  "id": "measured_blade",                 // lowercase, unique, stable forever (saves hold it)
  "name": "Measured Blade",
  "rank": "B",                            // D C B A S
  "rarity": "uncommon",                   // common uncommon rare unique legendary
  "kind": "passive",                      // passive active reaction aura blessing flaw
  "category": "combat.sword",             // group.sub; the screen's tabs are the groups
  "family": "sword",                      // a ladder rung reads its family (§5); null for a named skill
  "reads": ["sword"],                     // families this skill's level stands for in a check (rungs, arts, merges)
  "levels": [                             // effects by level band; a band's effects hold until a later band of the
                                          // same type and tag replaces them
    { "at": 1, "effects": [{ "type": "fight", "tag": "sword", "v": 2, "legacy": "perk:sword:65" }] },
    { "at": 5, "effects": [{ "type": "reaction", "on": "parried", "do": { "type": "fight", "tag": "sword", "v": 3 },
                             "limit": "1/duel" }] },
    { "at": 10, "effects": [{ "type": "unlock", "what": "teach:sword:B" }] }
  ],
  "gates": [ { "at": 6, "needs": { "concept": ["sword:the-tempo"] } } ],   // rare: a level gate inside a rank
  "acquire": [                            // one or more routes, each with conditions (§2.5)
    { "via": "evolve", "from": "basic_swordsmanship",
      "needs": { "concept": ["sword:the-measure", "sword:the-bind"], "deed": { "kind": "won_vs", "rank": "B", "n": 1 } } }
  ],
  "evolvesTo": [ { "id": "long_edge_master" } ],   // one or more; each target lists its own route from this skill
  "transfer": { "teach": "any", "inherit": false, "steal": false, "sell": false, "lose": [] },
  "slot": false,                          // an active needs a slot when readied (§3.5)
  "census": "count",                      // count (no cap) | one (one living holder) | age (once per age)
  "text": "You no longer fence at a man; you keep him at the distance you choose.",
  "never": "Every blade that reaches you was let in."   // optional: what lacking it looks like (S1's "never" lines)
}
```

Fields refined from Appendix B: `family` and `reads` (the adapter), `gates` (S1's concepts inside a rank),
`evolvesTo` as a list (a skill may branch), `census` (the one-holder rule in data), `slot`, `never`, and effects in a
fixed vocabulary with costs. `maxLevel` is always 10 and is dropped.

### 2.3 Effects (the vocabulary)

Every effect is `{ type, tag?, v?, ... }`. Magnitudes are points on the 0-to-100 scale a card's check reads (one point
is 1.6 in 100 of odds), or the native unit named below. The player never sees `v`: it is said in words (§8.3).

| Type | Fields | Unit | Reads it |
|---|---|---|---|
| `stat` | `stat`, `v` | stat points | `A.stat`; **only** kinds blessing and flaw, or category `racial` (validator) |
| `edge` | `tag` (a family, `family:focus`, or a check tag such as `bargain`, `court`, `night`), `v` | check points | `A.checkVal` through the adapter |
| `fight` | `tag` (weapon family or `all`), `part` (`atk`, `def`, `burst`, `adapt`), `v` | fight-worth points | `A.fighterFrom` |
| `blunder` / `surge` | `tag`, `v` (steps) | steps of VS.attempt | `VS.attempt` |
| `aura` | `of` (`morale`, `discipline`, `speed`, `supply`), `scale` (`squad`, `company`, `army`), `v` | steps | the war core (section 10) |
| `trigger` | `on` (win, wound, dawn, outnumbered, home, parried, rout, ...), `do` (an effect), `limit` | | its system's hook |
| `active` | `name`, `cost` (`stamina`, `time`, `coin`, `health`), `limit` (`1/duel`, `1/battle`, `1/month`, `1/year`), `do` | | readied in a slot (§3.5) |
| `economy` | `of` (`income`, `upkeep`, `yield`, `train`), `tag`, `v` | hundredths | economy |
| `social` | `group` (soldiers, clergy, peasants, nobles, a faith, a culture), `v` | opinion | `A.opinion` |
| `resist` | `of` (wounds, poison, fear, illness, mind), `v` | steps | body, moods |
| `unlock` | `what` (`activity:x`, `choice:x`, `tactic:x`, `title:x`, `order:x`, `teach:fam:rank`) | | the system it names |
| `growth` | `tag`, `v` | hundredths of experience | `A.gainXp` |
| `perk` | `legacy` (`perk:key:threshold`), `key`, `v` | the release's perk keys | `A.perkOf` (migration identity, §6.2) |

`trigger` and `active` wrap other effects. Every effect may carry `legacy` naming the old perk it continues.

### 2.4 The power budget and the stacking caps

**Budget.** Each rank has points per level: **D 1, C 2, B 4, A 8, S 16**. A skill at level L may spend at most
`perLevel × L` (D at Lv 10: 10; S at Lv 10: 160). Rarity adds nothing below unique; unique +25%, legendary +50%.
A flaw's effects are negative and must spend at least its budget (rank is its weight).

**Costs** (in `vocab.json`, tuned by the balance harness, never by feel):

| Effect | Cost |
|---|---|
| `edge` +1 on a narrow tag (`family:focus`, one check tag) / a family / a whole group | 1 / 2 / 4 |
| `fight` +1 on one weapon family / all | 2 / 4 |
| `blunder` or `surge`, one step on a family | 3 |
| `aura` one step at squad / company / army scale | 3 / 6 / 12 |
| `resist` one step | 2 (fear, mind: 3) |
| `social` +5 opinion with a group | 2 |
| `economy` +5 hundredths | 2 |
| `growth` +10 hundredths on a family | 2 |
| `unlock` an activity or choice / a tactic, order or title | 2 / 4 |
| `stat` +1 (blessing, racial, flaw only) | 4 |
| `trigger` | its effect's cost × 0.5 (× 0.25 for rare triggers: dawn, home, outnumbered) |
| `active` | its effect's cost × the limit's factor (1/duel or 1/battle 1, 1/month 0.5, 1/year 0.25) |
| a ladder rung's read of its family | free: the read **is** the level (§5) |

**Stacking caps** (in the adapter, so no data can break them):
- **Edge on one check** from skills' effects (not the family read): at most **+12 points** (about 19 in 100), the
  sources sorted largest first and weighed 1, ½, ¼, ⅛.
- **Fight** from skills' effects on one fight: at most **+15% of the person's fight worth**, the same weights.
- **Auras:** the best one of each `of` and scale counts; at most **+3 steps** of any `of`, whatever is held.
- **Blunder and surge:** at most 2 steps either way.
- **Resist:** at most 3 steps of each.
- **Growth:** at most +50 hundredths on one family (and S1's cap on all multipliers together, ×3, stays).
- A skill's `stat` effects, summed over everything a person holds: at most +10 on any one stat.

### 2.5 Routes and their conditions

A route is `{ via, needs, months?, chance?, hidden?, rumour? }`. `via` is one of: `practice` (doing it), `teacher`,
`school`, `bloodline`, `culture`, `faith`, `deed`, `event` (a card), `office`, `item` (a manual, a relic, a weapon),
`evolve`, `merge`, `awaken`, `trauma`, `birth` (a talent at birth, found by use).

`needs` holds any of: `stat: { str: 40 }` · `family: { sword: 45 }` (a family's read, a number on the check scale) ·
`skill: { id: { rank, lv } }` · `age: [16, 60]` · `race`, `culture`, `faith`, `house` (a list) · `teacher: { reads:
"sword", rank: "B" }` · `months` · `place` (`monastery`, `battlefield`, `masters_hall`, `holy_site`, ...) · `item` ·
`deed: { kind, n, rank? }` (from `vocab.json`: `won_vs` a better fighter, `held_gate`, `survived_beast`, `commanded_won`,
`masterwork`, `case_carried`, `near_death`, `long_siege`, `betrayed`, `oath_broken`, ...) · `flag` · `office`,
`title` · `devotion: { faith, min }` · `trait` · `talent: { sword: "B" }` · `concept: ["sword:the-measure"]` ·
`fame` · `not: { ... }`.

A route can be `hidden` (on no screen until met) or carry a `rumour` (a line a teacher, a book or a tavern gives, which
puts the route on the "How to learn" view, §8.4).

### 2.6 Transfer flags

`teach`: `any`, `school`, `house`, `faith`, `culture`, `none` (who may teach it; a teacher teaches a skill only at a
rank he holds, and a rung only up to his own level). `inherit`: passed to an heir of the blood at birth as a **talent**
(an easier route), never as the skill, except blessings that say so. `steal`: can be taken by watching or by theft of a
manual (house secrets, arts). `sell`: a manual can be sold. `lose`: conditions that take it (apostasy, a grave sin, the
house dying out, a maiming).

**House secrets.** Four templates (sword, command, stewardship, intrigue) make one skill a noble house: name from the
house ("Blake Family Hidden Swordsmanship"), rank A (B for a minor house), seeded by `A.NAMES` and the house id, so
the same house always has the same secret and nothing is stored but which houses' secrets exist. Routes: blood or
adoption, a house tutor, `months: 36`, a prior rung. Lost if the house dies out; open to theft and sale.

### 2.7 The validator (`tools/lint-skills.mjs`, rewritten; run by `tools/check.mjs`)

1. Schema: every field typed; ids unique and lowercase; names unique; `text` at most 40 words; `never` at most 15.
2. Every reference exists: skills, families, concepts, focuses, cultures, faiths, house templates, places, items, deed
   kinds, flags (declared in `vocab.json`), effect types and tags.
3. Budget: at every level band, spend ≤ `perLevel × at` (rarity's share added); flaws spend at least their budget.
4. Stats apart: a `stat` effect only on a blessing, flaw or racial skill.
5. Ladders whole: every family has D, C, B, A rungs, each evolving to the next; every rung `reads` its family; the 38
   keys a check or grant may name (28 families and 10 legacy keys) each resolve.
6. Reachable: from a newborn of every start (peasant, artisan, merchant, soldier, noble, royal) and every culture, a
   breadth-first walk of routes reaches every skill (unique and legendary may need one route each that no start has).
7. No loops: the evolve and merge graph is acyclic; a merge's result never feeds back into its parts; no route needs
   the skill itself or anything after it; teaching never grants the teacher experience in the skill taught.
8. Evolution and merging go up: an evolution target is exactly one rank higher; a merge result is at least the highest
   part's rank and at most one above it.
9. Rank and rarity shares: D 25 to 35, C 25 to 35, B 18 to 26, A 8 to 15, S 3 to 7 in 100; unique and legendary have
   `census: one` or `age`.
10. Names: no word on `vocab.json`'s deny list (names and skills of existing works); no "Master/Legend/Expert" used as a
    level word (§6).

---

## 3 · Progression

### 3.1 Levels: experience by doing (S1's engine, kept)

S1's experience is kept whole: `A.gainXp(p, k, effort, cause)` is the one door; ten experience is a month of plain
drill alone; work, practice, drill, stretch, failed stretch, teacher, talent, age, condition, discipline, kin, rivals,
quiet seasons and overtraining all count as S1 measured them (`docs/design/skills.md` §3, archived with this note as
its reference); the season's ledger and the record keep every cause. Experience goes to the skill being worked: for a
family, the rung held; for a named skill, the skill whose tags the effort carries (commanding feeds Gifted Leader;
haggling feeds Honeyed Tongue).

**Each rank's levels sit on today's scale**, so a level is exactly what a check reads and the price of a level is S1's
curve (`120 × (e^(v'/21.6) − e^(v/21.6))`). D is S1's Beginner and Intermediate (ten steps, ten levels); C is Advanced,
B Expert, A Master (each S1 step becomes two levels); S is Grandmaster and Legend (ten steps, ten levels).

| Rank | What a check reads, Lv 1 → Lv 10 | Experience a level, Lv 1 → Lv 10 | The rank, in months of plain drill alone | Years from nothing to its end |
|---|---|---|---|---|
| D | 1 · 4 · 7 · 9 · 12 · 15 · 19 · 23 · 27 · 31 | 17 → 103 | 48 | 4 |
| C | 35 → 53 by 2 | 59 → 135 | 92 | 12 |
| B | 55 → 70 by 1.7 | 125 → 255 | 183 | 27 |
| A | 72 → 86 by 1.6 | 259 → 504 | 369 | 58 |
| S | 88 · 90 · 91 · 93 · 94 · 96 · 97 · 98 · 99 · 100 | 542 → 583 | 582 | 106 |

Nobody drills alone. A master's teaching, stretches and devotion multiply a month by up to three (S1's cap). So the
end of B is a decade for the best-placed, the end of A twenty years or more, and S a life's work for the few who get
there at all. A named (non-ladder) skill uses the same row of costs for its rank.

**Talent** (S1's letters, per family, kept) sets the reach: past it, experience is quartered. F: D10; E: C1; D: B1;
C: A1; B: A5; A: S1; S: S6. (S1's reaches, read through the band table.)

**Rust** (S1's, kept): unused, a skill reads lower ("Rusty: acts as Lv 4"), can lose levels, **never a rank**.

### 3.2 What gates a level and a rank

Conditions, not a timetable (order 59):
- **Inside a rank:** only experience, the talent's reach and the body's hold (C9: a skill acts no higher than its
  governing stats carry). A few skills have a `gate` (S1's Intermediate concept at D Lv 6; Legend's concept at S Lv 6).
- **At level 10:** the bar fills and stops. Experience is stored at half (S1's rule), up to one level's worth.
- **Into the next rank (evolution):** the target's route. For a family rung: the next rank's concepts (S1's 252, as
  they were at the word edges: one into C, two into B, two into A, two into S) and a deed (S1's proofs become these
  conditions: into B, a stretch at 55 or more won, or a fight won against a B-rank hand; into A, a fight won against an
  A-rank hand, a masterwork, a battle commanded and won, a case carried; into S, a deed the realm knows and age 30 or
  more). The insight engine, blind spots and breakthroughs are S1's, unchanged.
- When the conditions are met the skill evolves at once: the stored experience lands, the record names the moment.

### 3.3 Evolution

A level 10 skill with an `evolvesTo` whose route's conditions hold **becomes** the target at Lv 1 (the old card is
gone; its story stays in the record; §14 question 2). Where two targets are open, the player chooses on a card;
everyone else chooses through `A.WHY.decide` (temper and post as reasons). Rarity of each step, as targets for the
balance harness (§10 step 12), in bot lives of 60 years:
- D → C: most working adults in the family they live by (seven in ten);
- C → B: one in five of those who work at it all their lives;
- B → A: well under one life in a hundred (A1: Master well under 1 in 100); one or two holders a realm in a family;
- A → S: about one life in a thousand (A1: Legend about 1 in 1,000), and it costs years and wounds; the census counts
  them (about five alive on the continent in all families of arms), and S summits are one living holder each.

### 3.4 Merging and advancing

**Merging.** A recipe (`recipes.json`) names parts (`{ id, rank, lv }`, at least two), conditions and a result. When
every part is held at its level and the conditions hold, the merge is offered. Parts are **absorbed**: the result
`reads` every family its parts read, at the result's level (it starts at Lv 1 but its read is never below the best
part's read: the adapter keeps the higher of the two until the result's own level passes it). Three kinds:
- **known** (a teacher, a school or a manual knows the recipe; it shows on "How to learn" once rumoured): about one in
  ten lives that hold the parts makes one;
- **found** (no one knows it: a chance at a named moment, a stretch in a crisis with every part at Lv 7 or more, 1 in
  200 a moment, at most once a life): about one life in fifty;
- **once an age** (`census: age`): one in the world until the holder dies and an age passes.

**Advancing (awakening).** A skill held at Lv 5 or more jumps to the next rank's Lv 1 without the rest of its levels,
at a named moment only (a near death, a deed far above you, a blessing, a long siege survived), with a chance of
1 in 100 a moment and **one advance a life**. It shares D-163's breakthrough budget (it is a breakthrough) and always
costs something named: a wound that stays, a flaw gained (Night Terrors), years. Its concepts are deemed grasped; its
deed is the moment itself.

*As built (steps 7 and 8, D-182), with §15's answers 2 and 8:* an evolution adds the next rung at Lv 1 and keeps the old
at Lv 10; its conditions are the target rung's `evolve` route, read at S1's edge (the concepts are S1's, the deed S1's
proof, the S rung's renowned deed that proof by someone of renown, at thirty or more); the player's card comes from rank B
and for his first; anyone else's deed is his post or a stretch won. Every merge asks level-10 parts of different families
(the found kind's Lv 7 is gone); known recipes are offered when a school or a teacher at the result's rank is near, found
ones at a named moment (`deed_above`, `near_death` so far). An advance is the top rung at Lv 5 or more, 1 in 100 a named
moment by the moment's hash, once a life, inside D-163's budget, its price a scar.

### 3.5 Slots for actives

A person readies at most `slots` actives: 1 at 12, 2 at 16, +1 for intellect and will both 50 or more, +1 at 30 if
any held skill is B or higher, +1 if any is A or higher; at most 5. Changing what is readied takes a month (not in a
fight). Passives, reactions and auras need no slot and are held to the caps of §2.4.

### 3.6 Skills and the power ladder: capabilities, not one number

The power ladder (order 77) gives every being a **level** (at least ten, each a large multiple of the one below; today's
best human swordsman near the middle), from its kind, body and growth. Beings of the same level differ in what they
can do. **Skills are that difference.** `A.CAPS(p)` (built by step 6 of §10, cached a month) returns a person's
capabilities from what he holds, with the caps of §2.4:

```
{ fight: { sword: { atk, def, burst, adapt }, bow: {...}, ... }, mounted, ranged, defence,
  command: { squad, company, army },  auras: [...],  resist: { fear, poison, wounds, illness, mind },
  edges: { tag: v },  actives: [readied],  unlocks: Set,  growth: { family: v } }
```

*As built (step 6, D-180):* `A.CAPS(p)` returns `{ held, edges, fight: { tag: { atk, def, burst, adapt } }, blunder,
surge, resist, auras, growth, stat, social, economy, unlocks, actives, triggers }`, every bonus capped by its own tag
(a check and a fight add their tags' sources together under one cap: `SK2.edgeOf`, `SK2.fightOn`), frozen, and kept for
the month keyed by the skills and levels it reads. `mounted`, `ranged`, `defence` and `command` are read from `fight` and
`auras` by whoever needs them. A person's power (`A.POWER`) reads his fight effects once, inside his fighting worth; the
legends' art is their data's and is untouched.

The power ladder reads `CAPS` to set a person's place inside his level (two level-6 swordsmen: one with a parry
reaction and fear resisted, one with a burst and a mounted art), and the fight and war cores read it to fight. A skill
never moves a being up a power level by itself: a level is the body and kind. An S-rank human skill is the human summit,
near the middle of the ladder; magic and monster skills (section 17) may lift a being's level through skills written
for that, in their own families. Until the power ladder's note lands, this design assumes only that it exposes
`level(p)` and reads `CAPS`.

---

## 4 · Kinds, in play

| Kind | How it acts | Example |
|---|---|---|
| passive | always on, inside the caps | Measured Blade |
| active | readied in a slot; used on purpose with a cost and a limit; on a card a choice appears only for one who holds it | Long Edge Master's "the Single Time" |
| reaction | fires on a trigger, with a limit | Veteran's Calm on a wound or a rout |
| aura | acts on the men you command, by scale; only while you hold the command | Gifted Leader |
| blessing | granted by a god, a patron or a bloodline; can be lost by its `lose` conditions; may touch stats | Sun God's Blessing |
| flaw | a negative skill: gained by a deed, a trauma or birth; can be worked off by a named route | Coward's Instinct |

---

## 5 · The adapter: every reader keeps working

### 5.1 The rule

`A.skill(p, k)` keeps its signature and meaning: **the number a check reads for key `k`**. It becomes:

```
read(p, k):
  [fam, focus] = canon(k)                         // S1's map: 'xbow' -> ['bow', 'the-crossbow']
  base = max over held skills s with fam in s.reads of value(s.rank, s.lv)   // §3.1's table; 0 if none
         - rust(s)
  base += focusShift(p, fam, focus)               // S1's specialism, now a rung's focus: two S1 steps up inside it,
                                                  // one down in another focus of the family
  base = max(base, kinRead(p, fam))               // S1's kin, unchanged
  base += cappedEdges(p, k)                       // §2.4: effects tagged fam, fam:focus or k
  then the release's order: the body's hold (C9), wounds, clamp 0..100
```

`p.skills[k]` stays the **mirror** (S1's): the family's base read, written by `SK2.set` whenever a held skill's rank
or level changes, so the 279 direct reads see the right number and old code that writes a number is adopted on the
month's pass (S1's `SK.adopt`: the number becomes the rung and level under it, cause `set`).

### 5.2 The call-site families and what each reads

| Family of call sites | Count | Reads, after the switch | Change at the switch |
|---|---|---|---|
| Card checks `check: { s, s2, d }` → `A.checkVal` → `A.skillEff` → `A.skill` | 5,723 | the family read (+ perk sums, now effects) | none: values identical |
| `C.lvl(p, k, min)` in conditions | 254 | the family read against a number | none (no call passes a word; the word form is removed, §6) |
| `A.skill` direct | 354 | the family read | none |
| `p.skills[k]` direct | 279 | the mirror | none; writes adopted |
| Card grants `fx: { skill: { k: n } }` | 4,311 | `A.gainXp` to the family's held rung | none: S1's rate |
| `A.trainSkill` (shim) | 333 | `A.gainXp` | none |
| `A.gainXp` | 31 | the held rung, or the named skill its cause tags | lands in rungs instead of S1's table |
| `GD.SKILLS`, `GD.SKILL_*` | 243 | generated from `families.json` (28 families + 10 legacy keys) | none |
| Perks: `A.perkOf/perksOf/perkSum/perkNames` | 21 | sums of `perk` effects of held skills | identical at migration (§6.2) |
| `A.fightWorth` (via `A.fighterFrom` → `A.skill`) | 51 | the family read + `fight` effects (capped) | none until effects switch on (step 6) |
| Fighting styles (`p.styles`, `styleXp`, `GD.STYLE_PROF`) | 135+ | an art's rank needs its family read (S1's thresholds) | kept until wave 2 turns styles into arts |
| S1-only (`A.SK.*`, `C.talent/ready/stuck`, `grasp`, `talent`, `specialism` fx) | ~150 | ported: `C.ready` = at Lv 10 with the deed missing; `C.stuck` = at Lv 10 behind a concept (or at a gate); `specialism` = a focus | renamed in place, tests ported |
| `VS.attempt` (v2 odds) | 8 | capability from the read; `blunder`/`surge` effects | effects at step 6 |

Events migrate gradually as they are touched (section 9 B7.2): a card may name a skill (`C.has(p, "gifted_leader")`,
`C.rank(p, "sword", "B")`, `fx: { skillId: "honeyed_tongue" }`) once the library holds it. Nothing is migrated in one
batch.

### 5.3 New condition helpers and effect keys

`C.has(p, id, lv?)` · `C.rank(p, fam, letter)` (the family's held rung at that rank or higher) · `C.lvl(p, k, min)`
(numbers only) · `C.ready(p, k)` · `C.stuck(p, k)` · `C.talent(p, k, letter)`. Effect keys (declared in `A.FX_EXTRA`):
`gain: "id"` (grants a skill whose route this card is), `deed: { kind }` (a condition met), `grasp` (kept),
`lose: "id"`, `focus: { fam: id }` (was `specialism`).

---

## 6 · Words to levels (the owner's later order)

### 6.1 What the player read, and what replaces it

| Today | Count | Becomes |
|---|---|---|
| S1's level names: "Swordsmanship · Expert II" (`SK.levelName`, `SK.wordName`, `SK.WORDS`) | 38 in 14 files | "Measured Blade · B · Lv 3" on rows, chips, the plan picker, the log; the family's name only in a tab |
| The choice chip "Swordsmanship, Expert II" | (in the 38) | "Measured Blade B·3" |
| Fight tiers Untrained, Brawler, Trained, Veteran, Elite, Master, Legend (`GD.TIERS`, the worth chips) | 63 in 15 files | the power ladder's level ("Level 6"), owned by the power-ladder work; this design only drops the words from skill screens |
| Style ranks Novice to Grandmaster (`GD.STYLE_RANKS`) | 6 | until wave 2: "Lv" of the art (1 to 5 shown as 2, 4, 6, 8, 10); after, the art is a skill with rank and level |
| Strings that print a word with a step ("Expert II") | 16 in src, 4 in tests | the rank and level |
| `C.lvl(p, k, "expert")` word form | 0 calls (the helper accepts it) | removed; `SK.levelOfWord` archived |
| The seven words in tests (`x3.test.mjs`, S1's `test.mjs`) | 4 + S1's | assertions on rank and level |
| Prose that says "a master swordsman", "the old master" (lore, cards) | 95 in 35 files | **kept**: in prose "master" is a man's standing among others, not a number on your page |

`tools/lint-skills.mjs` adds a check: no player-facing string built from a skill's level uses the seven words
(`SK2.label` is the only way a skill's level is printed).

### 6.2 Honours in place of words

A word used to be crossed; an honour is **given, for a reason, by someone**. None is automatic from a number, and each
has one holder where it is a post:
- **School honours:** a fencing school, a guild or an order names its own master (one chair a school; a post, so the
  one-holder rule, A.WHY for who is chosen: the head weighs your deeds, rank and his feelings). Gives the title
  "Master of the X School", the right to teach at your rank and take pupils, and renown.
- **The realm's honours:** king's champion, master of horse, master-at-arms of a house (existing posts gain a skill
  condition: a B rung or better in the family, as a reason in the appointment, never a bar alone).
- **Epithets** (the `epithet` fx key, kept): "the Measured", "Long Edge" given by a song or a deed the realm knew
  (99999-v2-renown already gives them).
- **Earned titles** (§11): the honours that are not posts are titles, with hidden requirements.
- **The census of the summits** (`32-legend-and-master-caps`): `GD.LEGEND_CAP` (5) and `GD.MASTER_CAP` (5 a realm)
  stop being caps on a number and become the **census** of A and S rungs (a count shown in Records, used by A.WHY to
  make an A-rank holder notable, never a wall); the S summits keep one living holder each by `census: one`.
- The renown words ("known in the realm", "known across the continent") stay renown's own (`99999-v2-renown`), earned
  from deeds and fame, not read off a skill.

---

## 7 · Migration from S1 saves (version 15 → 16)

One step, `skills2`, in `A.V2SAVE.upgrade` after `skills`; `SV.VER` 16. It draws no dice and is the same on every load.
Because each rank's levels sit on S1's values (§3.1), the conversion is exact.

| S1 field | Rule |
|---|---|
| `pc.sk[k].lv` (0 to 35) | rank by S1 word: 1-10 D, 11-15 C, 16-20 B, 21-25 A, 26-35 S. Level: D and S one for one (`lv`, `lv − 25`); C, B, A `2 × step − 1`. The held rung is the family's rung of that rank (S: the family's common S rung, never a unique summit; the summit waits for its own route) |
| `pc.sk[k].xp` | the same share of the bar. In C, B, A a step's bar spans two levels: below half, the odd level with xp × 2; at half or more, the even level with the rest × 2 |
| `.stored`, `.held` | kept as the rung's `held`; lands as S1's rule says |
| `.proof` (words proved) | deeds deemed done for every rank held and the next one's deed if proved |
| `.best`, `.rust`, `.used`, `.streak` | kept on the rung, `best` as a value |
| `.insight`, `.grasped` | kept, per family (`pc.kc[fam]`): concepts are evolution conditions |
| `.specs` / `p.ssp[k]` (S1 specialisms) | the rung's `focus` (at most two, as now); for NPCs `p.sfoc` |
| `p.skills[k]` mirror | rebuilt from the rung; equal to the old number by construction |
| `p.skills[k]` of NPCs (no table) | unchanged: an NPC's rung is a function of his number (rank by band, level by value), held nowhere |
| `p.skx` (NPC carry) | kept |
| `p.tal` talents | kept, keyed by family |
| knacks (perks read from the value) | each family's C, B and A rungs carry, at Lv 1, `perk` effects equal to the old perk rows at 35, 55, 72 (S1's thresholds); the legacy keys' perks carry a `tag` of that key. So `A.perkOf` gives the same sum. The 16 knacks that are a capability of their own (§9) are granted as skills where the old perk was held |
| `pc.skm`, `pc.skl`, `pc.skr` | kept; one `migrate` line in the record |
| `pc.habit`, `pc.used` | already folded by S1 |

New fields: `p.ks = { id: { lv, xp, held, best, rust, used, streak, focus, y, via } }` (the player: at most 80
skills; a folded rung's history is the record), `p.kn = [[id, lv], ...]` for NPCs' named skills (at most 12, only
for people with a post or a story), `pc.kc` (concepts), `pc.krd` (readied actives), `S.kcensus` (unique, age and
summit holders). All tolerate absence.

**The save-compat test** (`sk2Migrate`, a browser test): load every save in `tests/saves/` and `press/`; for the
player and every living person, for each of the 38 keys, `A.skill(p, k)` before the step equals it after; `A.checkOdds`
equal on 200 sampled checks from the content; `A.perkSum` equal for every perk key; every held rung's level in 1 to 10
and its rank's band; a second load is a no-op; the coherency checks pass. A shifted-world build (CLAUDE.md) runs it too.

---

## 8 · The player's view

Phone first (375 × 667, 16-point gutters, 44-point targets, Pointer Events, descriptions on tap through `data-note`,
no hover, no percentages, no bare numbers but the level).

### 8.1 The skill row and card

```
┌───────────────────────────────────────────────┐   a row: one control, 56 points
│ [B] Measured Blade                    Lv ●●●○○○○○○○│   rank letter in a shape (D circle, C square, B diamond,
│     Arms · passive · ◆ uncommon   steady        │   A hexagon, S star: meaning without colour); ten pips
└───────────────────────────────────────────────┘
```

A tap opens the **card** (a sheet on a phone, one column, a close of 44 points):
1. **Measured Blade** · B-rank · Lv 3 · pips · passive · Arms, the sword · uncommon (gem and word).
2. **Now:** what it does at this level, in words: "A fair edge with a sword. When your parry holds, your next cut comes
   truer (once a fight)." Magnitudes in four words: slight (1-3), fair (4-6), strong (7-10), great (11+).
3. **At Lv 4:** the next level's change, one line. A thin bar to it: "about half way", the pace in a word and its
   cause (S1's ledger lines).
4. **Beyond:** at Lv 10, what it can become and what is wanted, each condition a row with a tick or a word: "the tempo:
   clearer · the feint read: dark · a fight won against an A-rank hand: not yet".
5. **How you came by it:** "Evolved from Basic Swordsmanship at Harl's Ford, 1112." Focus, talent letter, rust, the
   body's hold, a teacher who has it.
6. **Its story ›** (the record).

### 8.2 The skills screen

Tabs as chips that scroll sideways: All · Arms · Body · Mind · Command · Court · Craft · Land and sea · Faith · Shadow
· House · Flaws. A filter row: "Can grow now", "Actives", "Merges open". The **Readied** strip at the top holds the
slots (a tap swaps one, through a sheet). A held skill list, sorted by rank then level; families show only their held
rung. At most 80 rows, drawn when the tab opens; pips are one `<i>` each, the bar a `transform: scaleX()`.

### 8.3 Elsewhere

The Profile's best five; the rail's three; the chip on a card's choice ("Measured Blade B·3"; the odds stay the tipped
scale and words); the log lines for a new skill, an evolution, a merge, an advance, a level at 5 and 10, rust; an
evolution, merge or advance is notable and may stop a Next month (a card, the moment named).

### 8.4 How to learn

A third view: routes the person knows of (rumoured, taught, read), each with its conditions as rows, met or not, in
words; hidden routes appear only when met. "Who here can teach me?" answers from the people present.

---

## 9 · The first library: 200 skills

### 9.1 Families and counts

| Family | What | Count | Ranks | Notes |
|---|---|---|---|---|
| Ladders of arms | sword, spear-axe-mace, shield, bow, footwork, riding and lance, wrestling: D, C, B, A rungs | 28 | 7 each | from S1's Arms and body |
| Ladders of the rest | athletics, command, tactics, woodcraft, tracking, husbandry, seamanship, craft, medicine, music, trade, stewardship, gaming, letters, faith, persuasion, diplomacy, courtesy, intimidation, stealth, intrigue | 84 | 21 each | every S1 skill a ladder |
| S summits | one-holder S skills at the top of ladders: The Unbroken Edge (sword), Unbreakable Line (shield), the Far Mark (bow), the Host's Heart (command), the Hand That Outlasts Ages (craft), the Death Put Off (medicine), the Word That Binds Kings (diplomacy), the One Never There (stealth), the Realm as a Board (intrigue), the Peace Given (faith) | 10 | S | unique |
| Culture arts | hand-picked from `lore/04-styles.json`, two a weapon family, six of them merge results | 14 | B 10, A 4 | the 265 styles in wave 2 |
| Knacks | the old perks that are a capability of their own (Light Feet's dodge, the Feint, Second Wind, the Long Shot, Quick Draw, Iron Stomach, Bone-Setter's Touch, Ledger Eye, the Hard Bargain, Lie Spotter, Night Walker, Lockpick's Ear, Weather-Wise, Horse Whisperer, Steady Hands, Rally Cry) | 16 | D 6, C 10 | the other 98 perks live as `perk` effects of rungs |
| Body and mind | Iron Constitution, Quick Mending, Long Breath, Deep Memory, Calm Focus, Quick Study | 6 | D 2, C 3, B 1 | none touches a stat |
| Command and war | Gifted Leader, Shield Wall Discipline, Quartermaster's Mind, Siege Patience, Night March, Keeper of the Host (merge), Hard Drillmaster, Scout's Ear | 8 | C 3, B 4, A 1 | auras and passives |
| Social | Honeyed Tongue, Courtly Memory | 2 | C | |
| Wilds and beasts | Quiet Feet, Beast Sense, Falconer, Fen-Walker | 4 | D 2, C 2 | beast-craft grows with section 17 |
| Faith and blessings | one a faith's chief god (Sun God's Blessing and five more), one holder each | 6 | A 3, S 3 | lost on apostasy |
| House secrets | four templates (sword, command, stewardship, intrigue), one instance a noble house | 4 | A (B minor) | instances generated, not counted |
| Offices and titles | Seneschal's Ledger, Judge's Patience, Captain's Bearing, Abbot's Rule | 4 | B 3, A 1 | from holding a post for years |
| Trauma-born | Siege-Hardened, Survivor's Luck, Night Terrors' answer (Sleepless Watch), Betrayed Eye | 4 | C 2, B 2 | from a named near-death, siege or betrayal |
| Flaws and curses | Coward's Instinct, Drunkard's Hand, Glass Jaw, Gambler's Itch, Short Temper, Night Terrors, Oathbreaker's Brand, Kinslayer's Mark, Fever-Weak, Faithless Shadow | 10 | D 3, C 4, B 2, A 1 | each with a route to work it off |
| **Total** | | **200** | D 54, C 67, B 52, A 33, S 13 (validator check 9 bands: 27 · 34 · 26 · 17 · 7 in 100; the A share sits at the top of its band because every ladder needs an A rung) | |

The ladders' rungs, D → C → B → A (names are first drafts for the data review):

| Family | D | C | B | A |
|---|---|---|---|---|
| sword | Stick and Lath | Basic Swordsmanship | Measured Blade | Master of the Long Edge |
| spear | Haft and Head | Basic Polearm | Line-Breaker | Master of the Haft |
| shield | Shield Arm | Shield Work | Iron Door | Living Wall |
| bow | Hedge Archer | Basic Archery | Steady Draw | Master Bowman |
| melee (footwork) | Beginner Footwork | Footwork | Fleet Fighter | Dancer in Harness |
| riding | Saddle-Sore | Horsemanship | Knight's Seat | Born in the Saddle |
| unarmed | Scrapper | Wrestler | Iron Grip | Bone-Breaker |
| athletics | Hardy Legs | Athlete | Tireless | Untiring Stride |
| command | Corporal's Voice | Steady Command | Captain's Eye | General's Grasp |
| tactics | Lay of the Land | Field Tactics | Siege and Sally | Strategist |
| survival | Forager | Woodcraft | Hunter's Patience | Master of the Hard Country |
| tracking | Sharp Eyes | Tracker | Pathfinder | The Unlost |
| husbandry | Field Hand | Husbandry | Herd and Furrow | Valley-Maker |
| sea | Deckhand | Seamanship | Helmsman | Master of the Sea Road |
| craft | Apprentice's Hands | Journeyman Craft | Mastercraft | The Hand That Stops |
| medicine | Bandager | Leechcraft | Physician | Master of Bones and Fevers |
| music | Tavern Voice | Minstrelsy | Court Singer | Keeper of the Long Lay |
| trade | Haggler | Trader | Merchant's Eye | Master of the Counting House |
| stewardship | Tally-Keeper | Stewardship | Estate-Keeper | Master Steward |
| gambling | Dice-Thrower | Gamester | Card-Sharp | Fortune's Reader |
| learning | Letters | Scholar | Lettered Mind | Master of the Old Books |
| faith | Pious Habit | Devout | Preacher of the Word | Keeper of Souls |
| persuasion | Smooth Talk | Persuasion | Silver Speech | Voice That Moves Halls |
| diplomacy | Peacemaker's Patience | Diplomacy | Envoy | Treaty-Maker |
| etiquette | Manners | Courtesy | Courtier | Grace of Halls |
| intimidation | Hard Stare | Intimidation | Dread Presence | Iron Presence |
| stealth | Sneak | Stealth | Shadow-Walker | Unseen |
| intrigue | Gossip | Intrigue | Plotter | Web-Spinner |

("Master of ..." in a rung's name is a name, as a sword is called a "bastard sword"; the validator's check 10 forbids
the seven words only as level labels. The data review may rename them if the owner wants no "Master" at all.)

The waves after: **500** with the 265 styles as arts (by a template: rank from the style's top rank, B or A; routes
from its school and culture; most `teach: school`), offices and titles for every post in `999990-posts`, and the rest
of the perks named; **1,000 and more** with magic (a ladder per element and school), spirit and bond, monster and
resistance families (section 17).

### 9.2 Twenty skills, written

Effects are shown in the vocabulary; costs are checked in brackets (spend / budget at that band).

**Evolution line 1 (the owner's): Beginner Footwork → Footwork → Fleet Fighter**

```jsonc
// 1
{ "id": "beginner_footwork", "name": "Beginner Footwork", "rank": "D", "rarity": "common", "kind": "passive",
  "category": "arms.footwork", "family": "melee", "reads": ["melee"],
  "levels": [ { "at": 1, "effects": [] },
              { "at": 4, "effects": [{ "type": "fight", "tag": "all", "part": "def", "v": 1, "legacy": "perk:melee:40" }] } ],  // [4/4]
  "gates": [ { "at": 6, "needs": { "concept": ["melee:the-footing"] } } ],
  "acquire": [ { "via": "practice", "needs": { "age": [6, 99] } } ],
  "evolvesTo": [ { "id": "footwork" } ],
  "transfer": { "teach": "any", "inherit": false, "steal": false, "sell": false },
  "text": "Children's games and drill: you keep your feet when others lose theirs." }
// 2
{ "id": "footwork", "name": "Footwork", "rank": "C", "rarity": "common", "kind": "passive",
  "category": "arms.footwork", "family": "melee", "reads": ["melee"],
  "levels": [ { "at": 1, "effects": [{ "type": "fight", "tag": "all", "part": "def", "v": 1 }] },          // [2/2]
              { "at": 5, "effects": [{ "type": "edge", "tag": "athletics:the-run", "v": 3 }] } ],         // [5/10]
  "acquire": [ { "via": "evolve", "from": "beginner_footwork", "needs": { "concept": ["melee:the-press"] } } ],
  "evolvesTo": [ { "id": "fleet_fighter" } ],
  "transfer": { "teach": "any" }, "text": "The line, the step back, the step in: your feet do the thinking." }
// 3
{ "id": "fleet_fighter", "name": "Fleet Fighter", "rank": "B", "rarity": "uncommon", "kind": "reaction",
  "category": "arms.footwork", "family": "melee", "reads": ["melee"],
  "levels": [ { "at": 1, "effects": [{ "type": "trigger", "on": "attacked_first", "limit": "1/duel",
                                       "do": { "type": "fight", "tag": "all", "part": "def", "v": 4 } }] },   // [4/4]
              { "at": 6, "effects": [{ "type": "trigger", "on": "outnumbered", "limit": "1/battle",
                                       "do": { "type": "resist", "of": "wounds", "v": 2 } }] } ],            // [5/24]
  "acquire": [ { "via": "evolve", "from": "footwork",
                 "needs": { "concept": ["melee:the-second-man", "melee:the-gap"], "deed": { "kind": "won_vs", "rank": "B", "n": 1 },
                            "stat": { "spd": 45 } } } ],
  "evolvesTo": [ { "id": "dancer_in_harness" } ], "transfer": { "teach": "any" },
  "text": "The first blow finds where you were." }
```

**Evolution line 2: Basic Swordsmanship → Measured Blade → Master of the Long Edge**

```jsonc
// 4
{ "id": "basic_swordsmanship", "name": "Basic Swordsmanship", "rank": "C", "rarity": "common", "kind": "passive",
  "category": "arms.sword", "family": "sword", "reads": ["sword"],
  "levels": [ { "at": 1, "effects": [{ "type": "perk", "key": "check", "tag": "sword", "v": 2, "legacy": "perk:sword:40" }] },  // [2/2]
              { "at": 5, "effects": [{ "type": "active", "name": "Riposte", "cost": "stamina", "limit": "1/duel",
                                       "do": { "type": "fight", "tag": "sword", "part": "atk", "v": 4 } }] } ],              // [10/10]
  "acquire": [ { "via": "evolve", "from": "stick_and_lath", "needs": { "concept": ["sword:the-line"] } },
               { "via": "teacher", "needs": { "teacher": { "reads": "sword", "rank": "C" }, "months": 12, "family": { "sword": 25 } } } ],
  "evolvesTo": [ { "id": "measured_blade" } ], "slot": true, "transfer": { "teach": "any" },
  "text": "A year with a sword and someone who knew it. You are steadier than most men in a fight." }
// 5: Measured Blade, as in §2.2
// 6
{ "id": "long_edge_master", "name": "Master of the Long Edge", "rank": "A", "rarity": "rare", "kind": "active",
  "category": "arms.sword", "family": "sword", "reads": ["sword"],
  "levels": [ { "at": 1, "effects": [{ "type": "fight", "tag": "sword", "part": "atk", "v": 3 },
                                      { "type": "active", "name": "The Single Time", "cost": "stamina", "limit": "1/duel",
                                        "do": { "type": "surge", "tag": "sword", "v": 1 } }] },        // [6 + 3 = 9 / 8]: over
              { "at": 2, "effects": [] },                                                            // [9/16]: the cut is learnt at Lv 2
              { "at": 10, "effects": [{ "type": "unlock", "what": "teach:sword:A" }, { "type": "social", "group": "soldiers", "v": 5 }] } ],
  "acquire": [ { "via": "evolve", "from": "measured_blade",
                 "needs": { "concept": ["sword:the-single-time", "sword:the-stillness"], "deed": { "kind": "won_vs", "rank": "A", "n": 1 }, "age": [25, 99] } } ],
  "evolvesTo": [ { "id": "unbroken_edge" } ], "slot": true, "census": "count", "transfer": { "teach": "any" },
  "text": "Attack and defence in one movement. There are one or two of you in a realm." }
```

(Example 6 shows the validator at work: written with both effects at Lv 1 it spends 9 against 8 and is refused; the
active moves to Lv 2.)

**Merge 1: Measured Blade (B, Lv 7) + Fleet Fighter (B, Lv 7) + Battle Sense (C, Lv 5) → Riverwind Form**

```jsonc
// 7
{ "id": "battle_sense", "name": "Battle Sense", "rank": "C", "rarity": "uncommon", "kind": "reaction",
  "category": "war.field", "family": null, "reads": [],
  "levels": [ { "at": 1, "effects": [{ "type": "trigger", "on": "ambushed", "do": { "type": "resist", "of": "fear", "v": 1 } }] },  // [0.75/2]
              { "at": 5, "effects": [{ "type": "trigger", "on": "battle_start", "do": { "type": "edge", "tag": "tactics", "v": 3 } }] } ],  // [3.75/10]
  "acquire": [ { "via": "deed", "needs": { "deed": { "kind": "battle_survived", "n": 2 } } } ],
  "transfer": { "teach": "none" }, "text": "Two battles taught you where the danger comes from before it comes." }
// 8
{ "id": "riverwind_form", "name": "Riverwind Form", "rank": "A", "rarity": "rare", "kind": "active",
  "category": "arms.sword", "family": null, "reads": ["sword", "melee"],
  "levels": [ { "at": 1, "effects": [{ "type": "fight", "tag": "sword", "part": "adapt", "v": 2 },
                                      { "type": "edge", "tag": "melee", "v": 2 }] },                                   // [8/8]
              { "at": 3, "effects": [{ "type": "active", "name": "The River Turns", "cost": "stamina", "limit": "1/battle",
                                       "do": { "type": "fight", "tag": "all", "part": "def", "v": 4 } }] } ],           // [24/24]
  "acquire": [ { "via": "merge", "recipe": "riverwind", "needs": { "culture": ["CUL-river-folk"] }, "rumour": "An old master in the river towns fights as if the line were water." } ],
  "slot": true, "transfer": { "teach": "culture", "steal": true },
  "text": "Blade and feet and the field's mood made one. Its parts are gone into it." }
```

`recipes.json`: `{ "id": "riverwind", "kind": "known", "parts": [ { "id": "measured_blade", "lv": 7 }, { "id":
"fleet_fighter", "lv": 7 }, { "id": "battle_sense", "lv": 5 } ], "result": "riverwind_form", "needs": { "teacher":
{ "has": "riverwind_form" }, "months": 6 } }`. Its read of sword and melee starts at the higher of its own level and
the absorbed rungs' reads (§3.4), so nobody's odds fall when they merge.

**Merge 2 (found): Gifted Leader + Quartermaster's Mind → Keeper of the Host**

```jsonc
// 9
{ "id": "gifted_leader", "name": "Gifted Leader", "rank": "B", "rarity": "rare", "kind": "aura", "category": "command.lead",
  "levels": [ { "at": 1, "effects": [{ "type": "aura", "of": "morale", "scale": "squad", "v": 1 }] },        // [3/4]
              { "at": 4, "effects": [{ "type": "aura", "of": "morale", "scale": "company", "v": 1 },
                                      { "type": "aura", "of": "discipline", "scale": "squad", "v": 1 }] },  // [9/16]
              { "at": 8, "effects": [{ "type": "aura", "of": "morale", "scale": "company", "v": 2 },
                                      { "type": "aura", "of": "discipline", "scale": "company", "v": 1 }] } ],  // [18/32]
  "acquire": [ { "via": "birth", "needs": { "talent": { "command": "A" }, "office": "captain_or_above" }, "hidden": true },
               { "via": "deed", "needs": { "deed": { "kind": "commanded_won_outnumbered", "n": 3 }, "office": "captain_or_above" } } ],
  "transfer": { "teach": "none", "inherit": true }, "text": "Men under you hold longer and obey faster." }
// 10
{ "id": "quartermasters_mind", "name": "Quartermaster's Mind", "rank": "B", "rarity": "uncommon", "kind": "passive", "category": "war.supply",
  "levels": [ { "at": 1, "effects": [{ "type": "aura", "of": "supply", "scale": "squad", "v": 1 }] },             // [3/4]
              { "at": 5, "effects": [{ "type": "aura", "of": "supply", "scale": "company", "v": 1 },
                                      { "type": "edge", "tag": "stewardship:supply", "v": 4 }] } ],          // [10/20]
  "acquire": [ { "via": "office", "needs": { "office": "company_supply", "deed": { "kind": "campaign_supplied", "n": 2 } } } ],
  "transfer": { "teach": "any" }, "text": "Armies you feed march farther." }
// 11
{ "id": "keeper_of_the_host", "name": "Keeper of the Host", "rank": "A", "rarity": "unique", "kind": "aura", "category": "command.host",
  "reads": ["command"],
  "levels": [ { "at": 1, "effects": [{ "type": "aura", "of": "morale", "scale": "army", "v": 1 }] },        // [12/10]: unique +25% = 10, over
              { "at": 2, "effects": [{ "type": "aura", "of": "morale", "scale": "army", "v": 1 }] },        // [12/20]
              { "at": 6, "effects": [{ "type": "aura", "of": "supply", "scale": "army", "v": 1 },
                                      { "type": "trigger", "on": "rout", "do": { "type": "aura", "of": "discipline", "scale": "company", "v": 2 } }] } ],  // [42/60]
  "acquire": [ { "via": "merge", "recipe": "keeper", "needs": { "deed": { "kind": "long_campaign", "n": 1 } } } ],
  "census": "one", "transfer": { "teach": "none" },
  "text": "A host that is fed and believes it will win. One living commander has this." }
```

(Example 11 at Lv 1 is refused by the validator, as written above, and moves its first aura to Lv 2: a unique A skill
is weak at its first level, by design.) `recipes.json`: `{ "id": "keeper", "kind": "found", "parts": [ { "id":
"gifted_leader", "lv": 8 }, { "id": "quartermasters_mind", "lv": 6 } ], "result": "keeper_of_the_host", "moment":
"a campaign's last month with the host fed and unbroken", "chance": 0.005 }`.

**The other nine**

```jsonc
// 12
{ "id": "quiet_feet", "name": "Quiet Feet", "rank": "D", "rarity": "common", "kind": "passive", "category": "wilds.hunt",
  "levels": [ { "at": 1, "effects": [{ "type": "edge", "tag": "night", "v": 1 }] }, { "at": 6, "effects": [{ "type": "edge", "tag": "stealth", "v": 3 }] } ],  // [1/1], [6/6]
  "acquire": [ { "via": "practice", "needs": { "family": { "survival": 12 } } }, { "via": "practice", "needs": { "family": { "stealth": 12 } } } ],
  "transfer": { "teach": "any" }, "text": "Hunting or housebreaking taught you where to put your feet in the dark." }
// 13
{ "id": "honeyed_tongue", "name": "Honeyed Tongue", "rank": "C", "rarity": "uncommon", "kind": "passive", "category": "social.speech",
  "levels": [ { "at": 1, "effects": [{ "type": "edge", "tag": "persuasion:the-bargain", "v": 2 }] },                             // [2/2]
              { "at": 5, "effects": [{ "type": "edge", "tag": "persuasion", "v": 3 }, { "type": "social", "group": "merchants", "v": 5 }] } ],  // [8/10]
  "acquire": [ { "via": "practice", "needs": { "months": 36, "place": ["court", "market"], "family": { "persuasion": 30 } } } ],
  "transfer": { "teach": "any" }, "text": "Strangers trust you sooner than they should." }
// 14
{ "id": "veterans_calm", "name": "Veteran's Calm", "rank": "C", "rarity": "uncommon", "kind": "reaction", "category": "war.field",
  "levels": [ { "at": 1, "effects": [{ "type": "trigger", "on": "wounded", "limit": "1/battle", "do": { "type": "resist", "of": "fear", "v": 1 } }] },  // [1.5/2]
              { "at": 4, "effects": [{ "type": "trigger", "on": "rout", "do": { "type": "resist", "of": "fear", "v": 2 } }] } ],                       // [4.5/8]
  "acquire": [ { "via": "deed", "needs": { "deed": { "kind": "battle_survived", "n": 3 } } } ],
  "transfer": { "teach": "none" }, "text": "A wound or a rout does not shake you any more." }
// 15
{ "id": "cowards_instinct", "name": "Coward's Instinct", "rank": "D", "rarity": "common", "kind": "flaw", "category": "flaw.nerve",
  "levels": [ { "at": 1, "effects": [{ "type": "trigger", "on": "outnumbered", "do": { "type": "blunder", "tag": "all", "v": -1 } },
                                      { "type": "social", "group": "soldiers", "v": -5 }] } ],    // [−2.75, owes 1]
  "acquire": [ { "via": "deed", "needs": { "deed": { "kind": "fled_in_shame" } } } ],
  "lose": [ { "via": "deed", "needs": { "deed": { "kind": "held_gate" } } } ], "transfer": { "teach": "none" },
  "text": "Outnumbered, your legs decide before you do. Men remember it." }
// 16
{ "id": "sun_gods_blessing", "name": "Sun God's Blessing", "rank": "S", "rarity": "legendary", "kind": "blessing", "category": "faith.blessing",
  "levels": [ { "at": 1, "effects": [{ "type": "resist", "of": "fear", "v": 2 }, { "type": "resist", "of": "wounds", "v": 1 },
                                      { "type": "social", "group": "faith:REL-01", "v": 10 }] },                 // [12/24]
              { "at": 4, "effects": [{ "type": "stat", "stat": "wil", "v": 3 },
                                      { "type": "active", "name": "Dawn's Judgment", "limit": "1/battle", "cost": "health",
                                        "do": { "type": "aura", "of": "morale", "scale": "army", "v": 2 } }] } ],  // [12 + 12 + 24 = 48/96]
  "acquire": [ { "via": "faith", "needs": { "devotion": { "faith": "REL-01", "min": 80 }, "deed": { "kind": "holy_victory" }, "place": "holy_site", "flag": "solstice" } } ],
  "census": "one", "transfer": { "teach": "none", "lose": [ { "flag": "apostate" }, { "deed": { "kind": "grave_sin" } } ] },
  "text": "Chosen at the solstice. Wounds close, fear does not take you, the faithful follow." }
// 17 (a template: one instance a house)
{ "id": "house_secret_sword:{house}", "name": "{House} Family Hidden Swordsmanship", "rank": "A", "rarity": "rare", "kind": "active",
  "category": "house.sword", "reads": ["sword"],
  "levels": [ { "at": 1, "effects": [{ "type": "fight", "tag": "sword", "part": "atk", "v": 2 }] },                         // [4/8]
              { "at": 4, "effects": [{ "type": "active", "name": "{House} Cut", "cost": "stamina", "limit": "1/duel",
                                       "do": { "type": "fight", "tag": "sword", "part": "burst", "v": 6 } }] },              // [16/32]
              { "at": 10, "effects": [{ "type": "unlock", "what": "title:blade-of-the-house" }] } ],
  "acquire": [ { "via": "bloodline", "needs": { "house": "{house}", "teacher": { "has": "house_secret_sword:{house}" }, "months": 36,
                                                "skill": { "basic_swordsmanship": { "rank": "C", "lv": 5 } }, "age": [16, 60] } } ],
  "slot": true, "transfer": { "teach": "house", "inherit": true, "steal": true, "sell": true, "lose": [ { "flag": "house_extinct" } ] },
  "text": "A style kept inside one family for generations." }
// 18
{ "id": "unbroken_edge", "name": "The Unbroken Edge", "rank": "S", "rarity": "unique", "kind": "passive", "category": "arms.sword",
  "family": "sword", "reads": ["sword"],
  "levels": [ { "at": 1, "effects": [{ "type": "fight", "tag": "sword", "part": "def", "v": 4 }, { "type": "resist", "of": "fear", "v": 1 }] },  // [11/20]
              { "at": 6, "effects": [{ "type": "surge", "tag": "sword", "v": 1 }, { "type": "social", "group": "soldiers", "v": 10 }] } ],             // [18/120]
  "gates": [ { "at": 6, "needs": { "concept": ["sword:the-sword-forgotten"] } } ],
  "acquire": [ { "via": "evolve", "from": "long_edge_master", "needs": { "deed": { "kind": "renowned_duel", "n": 1 }, "age": [30, 99], "fame": 60 } } ],
  "census": "one", "transfer": { "teach": "none" },
  "text": "One living swordsman holds this. When he dies, it is free." }
// 19
{ "id": "seneschals_ledger", "name": "Seneschal's Ledger", "rank": "B", "rarity": "rare", "kind": "passive", "category": "governance.estate",
  "levels": [ { "at": 1, "effects": [{ "type": "economy", "of": "yield", "tag": "estate", "v": 5 }] },                              // [2/4]
              { "at": 5, "effects": [{ "type": "economy", "of": "upkeep", "tag": "estate", "v": -5 }, { "type": "economy", "of": "yield", "tag": "estate", "v": 10 }] } ],  // [6/20]
  "acquire": [ { "via": "office", "needs": { "office": "steward_great_house", "months": 48, "family": { "stewardship": 45 } } } ],
  "transfer": { "teach": "any", "sell": false }, "text": "Estates under you earn more and steal less." }
// 20
{ "id": "oathbreakers_brand", "name": "Oathbreaker's Brand", "rank": "B", "rarity": "uncommon", "kind": "flaw", "category": "flaw.honour",
  "levels": [ { "at": 1, "effects": [{ "type": "social", "group": "nobles", "v": -10 }, { "type": "edge", "tag": "diplomacy", "v": -3 }] } ],  // [−10, owes 4]
  "acquire": [ { "via": "deed", "needs": { "deed": { "kind": "oath_broken" } } } ],
  "lose": [ { "via": "faith", "needs": { "deed": { "kind": "pilgrimage" }, "months": 24 } } ],
  "transfer": { "teach": "none" }, "text": "Your word was given and broken. Every hall knows it before you enter." }
```

Coverage: kinds passive (1, 2, 4, 5, 10, 12, 13, 18, 19), active (6, 8, 17), reaction (3, 7, 14), aura (9, 11),
blessing (16), flaw (15, 20); ranks D (1, 12, 15), C (2, 4, 7, 13, 14), B (3, 5, 9, 10, 19, 20), A (6, 8, 11, 17),
S (16, 18); rarities common to legendary; two evolution lines (1-2-3, 4-5-6, and 6 to 18); two merges (8, 11).

---

## 10 · The build order

Each step is one commit, on the trunk through the integrator, with its tests; steps 1 to 4 change nothing a player
sees.

| # | Step | Tests | Status |
|---|---|---|---|
| 1 | `data/skills/` with `families.json` (from S1's data), `vocab.json` and the 112 rungs; the validator (§2.7) in `tools/lint-skills.mjs` | `tests/v2/skills2-data.test.js`: the ten checks on the data, and each fails on a planted fault | Done (H-131) |
| 2 | The engine module `src/people/engine/skills2.js` (pure): bands, costs, levels, the budget, the caps, evolution, merge and advance checks; bundled by `build-v2.mjs` | unit tests: band values equal S1's `VALUES`; costs equal S1's; caps and diminishing weights; an acyclic recipe graph | Done (H-131) |
| 3 | The adapter (§5) behind `A.SK2.on = false`, computing beside S1 | browser test `sk2Shadow`: over three bot lives, `read(p, k)` equals S1's `A.skill(p, k)` for every person, key and month | Done (H-131) |
| 4 | Migration step `skills2`, `SV.VER` 16 | `sk2Migrate` (§7) on every sample save; `version.mjs check` | Done (H-131) |
| 5 | The switch: rungs hold the level, `A.gainXp` lands in rungs, `SK2.label` prints levels; S1's words, level names and proofs go to `archive/s1-skill-words/` | `tools/release/identity-probe.mjs` before and after (same event classes; fixed-seed lives the same); S1's `test.mjs` ported to rungs; `s1Reasons` (the ledger closes) | Done (H-138, D-179) |
| 6 | Effects on: edges, fight, resist, blunder and surge, perks served from `perk` effects, `A.CAPS`; caps | `sk2Caps` (no check above +12, no fight above +15%); `A.perkSum` identical; balance bands hold | Done (H-142, D-180): the readers and the caps on; the rungs carry only perks until the data review writes effects |
| 7 | Evolution at Lv 10 with concepts and deeds; the evolution card | `sk2Evolve`: a bot life evolves D → C with the reason in the log; none evolves without its conditions | Done (H-146, D-182): S1's edges read the rung's route; the card from B and for the first; the closed form's deed is a post or a stretch won |
| 8 | Merging and advancing; D-163's budget shared | `sk2Merge`, `sk2Advance`: one each in a bot life (seed fallback), each named; at most one advance a life | Done (H-146, D-182): eight recipes (level-10 parts only), the parts absorbed; an advance 1 in 100 a named moment by its hash, once a life, a breakthrough of the budget; the tests plant the parts (seed fallback for a teacher) |
| 9 | The rest of the 200 (named, faith, houses, offices, trauma, flaws), the census, `C.has/C.rank`, `gain/lose/focus` fx; `data/skills.json` to `archive/` | `sk2OneHolder` (no unique or summit with two living holders over a 100-year life, the one-holder audit); house secrets deterministic from the seed |  |
| 10 | The skills screen and card (§8); every player-facing word of §6.1 replaced | `sk2Phone` (375 × 667, no horizontal scroll, 44-point targets), click-open lint, no-percent lint, no level word lint; the `ardan-ui-review` pass |  |
| 11 | Actives and slots in duels and battles; auras into the war core | `sk2Active` (a readied active used once a duel at most); war unit tests read auras |  |
| 12 | Balance: the harness measures A and S shares per path | `balance.mjs`: B → A under 1 in 100 lives, A → S near 1 in 1,000, no life at S before 30; bands written in `targets.mjs` |  |

Titles (§11.9, three commits) come after step 9; the person's level, stat points, training and professions
(§12.6, three commits) after step 6 and before step 10's screens, which then draw the allocation sheet and the training
screen too.

**Archived from S1** (`archive/s1-skill-words/`, with a note and the last commit that had them): the seven words and
Roman steps (`SK.WORDS`, `levelName`, `wordName`, `levelOfWord`), the proof wall and `proof` fx key, the specialism's
model as a separate thing (now a rung's focus), `d-view.core.js`'s rows and sheet, `data/skills.json`,
`docs/design/skills.md` (kept in `docs/design/` as the reference for experience, marked superseded) and its model files
under `docs/design/skills/` (they still feed `tests/v2/skills.test.js` until step 2 ports it). **Kept and reused:**
`A.gainXp` and the month's pass, the life's factors, talent letters, concepts, insight and blind spots, breakthroughs
(budgeted), rust, the ledger and the record, NPCs' closed form, kin.

---

## 11 · Titles (the owner's order of the same day)

"titles can stack and give buffs and stat boosts as well as honour. they're very difficult to get though and have
requirements that need to be met that can't be seen."

### 11.1 What a title is

A **title** is a name the world gives a person for what he has done or become: *Undefeated*, *the Hundred-Day Wall*,
*Wyrm-Slayer*. It is its own system beside skills:
- **Earned, never bought, never trained.** No experience, no levels, no shop, no card choice that grants one directly.
- **Very hard to get.** An ordinary life ends with none; a remarkable one with one or two; the great with four or five.
- **Hidden requirements.** The player never sees a title's conditions or his progress toward it. At most a **hint**,
  heard as a rumour or an old soldier's tale, that something exists ("they say a man who never lost a duel in twenty
  is called something by the soldiers"), and only when a hint card fires.
- **Stackable.** A person holds several, each giving honour and renown once, and buffs (and, unlike ordinary skills,
  stat boosts) for as long as it is held.
- **Under the same budget and caps as skills** (§2.4): its effects join the same pool, so stacked titles cannot
  snowball.
- **Not a noble title.** Land and offices (count, marshal, steward: `999990-posts`, one holder a post) stay what they
  are. An earned title may *need* a post, and a post may *carry* one (§6.2's honours become titles here, the post
  itself stays a post).

### 11.2 The schema (`data/titles/*.json`, on the page as `A.DATA.titles`)

```jsonc
{
  "id": "undefeated",
  "name": "Undefeated",
  "rarity": "rare",                 // uncommon rare unique legendary (no common titles)
  "weight": "B",                    // its budget's rank: a title spends at most perLevel(weight) x 5 (half a skill at Lv 10)
  "unique": false,                  // true: one living holder in the world; legendary: once an age
  "kind": "deed",                   // deed mastery service faith world infamy
  "beings": ["person"],             // person, monster, legend (section 17's beings hold titles too)
  "requires": {                     // predicates, never shown (§11.3)
    "all": [ { "streak": "duel_won", "min": 20 }, { "age": [16, 99] } ]
  },
  "watch": ["duel_won"],            // the deed kinds that wake its check (§11.4); "month" for state predicates
  "hint": "The soldiers have a name for a man who has never lost a fight. You have not heard it said of you.",
  "effects": [ { "type": "fight", "tag": "all", "part": "def", "v": 2 },        // [4 + 2 = 6 / 20]
               { "type": "social", "group": "soldiers", "v": 5 } ],
  "honour": 3, "renown": 8,         // given once, on earning (the fx keys honor and fame)
  "lose": [ { "deed": "duel_lost" } ],                 // some titles go; most are for life
  "style": "{name} the Undefeated",                     // how it reads beside a name when chosen to be shown
  "text": "Twenty fights and never put down. Soldiers say it before they say your name."
}
```

**Predicates** (a small grammar, evaluated by one pure function `TT.met(p, req)`): `all`, `any`, `not`;
`count: kind, min` and `streak: kind, min` over the deed ledger; `skill: { fam, rank }` and `has: id`; `held: office,
years`; `age`, `race`, `culture`, `faith`, `house`; `stat: { str: 60 }`; `wealth`; `fame`, `honor`, `infamy`;
`flag`; `realm: { stab, war, ruler }`; `first: kind` (the first in the world since the age began, from the census);
`only: { census key }` (the best living by a measure, such as the highest sword rung in his realm). Every kind and key
is declared in `vocab.json`; nothing reads the dice.

**The deed ledger.** `p.deeds` today is 40 kinds of text line (126 readers). It gains a counted twin, `p.dl = { kind:
[count, streak, lastYear] }` (at most 64 kinds a person, only kinds some title or skill watches), written by one door,
`A.deedDone(p, kind, ctx)`, which the deed sources (duels, battles, sieges, treaties, hunts, wounds, alms, bribes
refused) call beside their existing text line. The skills' `deed` conditions (§2.5) read the same ledger.

### 11.3 Hidden, and how a hint works

- The title view and card never print `requires`, `watch` or a count. A lint (`tools/lint-titles.mjs`) fails any file
  under `src/ui/` or any `d-view` that reads `.requires` or `.watch`, and a browser test renders the profile of a
  fresh life and of a 60-year bot life and finds no condition text.
- A title with a `hint` has one hint card in the pool (an old hand, a minstrel, a priest), firing only for a person
  who has done at least one of its watched deeds, at most once a life. It names nothing exact, and is recorded in
  "Things you have heard".
- Earned, the title's card says why in a sentence of the world's ("After the twentieth bout at Harl's Ford, the
  soldiers began to call you Undefeated"), never the rule.

### 11.4 How titles are checked (deterministic)

- **On a deed:** `A.deedDone` updates the ledger, then checks only the titles whose `watch` holds that kind (an index
  built once from the data). Cost: a handful of predicate checks a deed.
- **Once a month** (the player, `A.onMonth`) and **once a year** (everyone else with a post, the 24 who matter, the
  world's legendary beings, in the yearly pass that already steps them): titles watched by `month` (state predicates:
  held an office five years, the best sword in a realm).
- **Unique titles:** the census (`S.kcensus`) holds the holder; when two would earn one in the same pass, the person
  processed first holds it (the pass runs in id order, so the same seed gives the same holder). On the holder's death
  it is free; `first:` titles are never given twice in an age.
- Earning: the effects switch on, honour and renown are paid once, a notable card (it stops a Next month), a record
  line, a log line. Losing (`lose`): a card that says so; the honour paid stays, the renown fades as renown does.
- A title never draws on `A.rand`. A test replays a seed twice and compares every title, holder and year.

### 11.5 Stacking without a snowball

- A title spends at most `perLevel(weight) × 5`: D 5, C 10, B 20, A 40, S 80 (×1.25 unique, ×1.5 legendary).
- Its effects join the skills' pool: **the caps of §2.4 bind skills and titles together** (+12 on a check, +15% of
  fight worth, +3 aura steps, 2 blunder or surge steps, 3 resist steps, all with the diminishing weights).
- **Stats:** titles may boost stats (the owner's order), at most +3 a title; skills' and titles' stat effects together
  at most +10 on any one stat, and never past the body's potential (`p.pot`) by more than 5.
- Honour and renown are paid once, so ten titles do not pay ten times a year.

### 11.6 On the profile

Under the name, the one title the person chooses to bear ("Aldric the Undefeated"; a tap changes it, from his titles).
Below, a strip of title chips (rarity gem and name); a tap opens the card: name, rarity, when and why it was earned,
what it gives in words (slight, fair, strong, great), honour. Records lists all titles held and lost. Other people's
profiles show their titles the same way; a duel's or a court's card can name an opponent's title ("Sir Rauf, called
the Hundred-Day Wall"). Nothing about titles not yet held, except "Things you have heard".

### 11.7 NPCs and the world's great beings

The same predicates hold for everyone, read from the same ledger. A king's champion earns *Undefeated* by his own
duels; a marshal *the Hundred-Day Wall* by his own siege; a dragon of the bestiary (order 77) earns *Calamity of the
Fens* by the villages it has burned, and a hunter who kills it may earn *Wyrm-Slayer*. Titles give A.WHY reasons
(a lord weighs a rival's *Kingmaker*; soldiers follow an *Undefeated* captain), and the census of unique titles is in
Records.

### 11.8 Fifteen titles

(The *Requires* column is for builders; the player never sees it.)

| Title | Rarity · weight | Requires (hidden) | Gives |
|---|---|---|---|
| Blooded | uncommon · D | first battle survived with a serious wound, under 25 | resist fear 1; soldiers +5; honour 2 |
| The Unbought | uncommon · C | five bribes refused, never one taken | clergy and peasants +5; edge on `court:honesty` +3; honour 4 |
| Ironhide | rare · B | ten serious wounds survived, alive at 40 | stamina +2; resist wounds 2 |
| Undefeated | rare · B | twenty duels won in a row (lost on a loss) | fight defence +2; soldiers +5 |
| Breaker of Champions | rare · B | three realms' champions beaten in single combat | fight attack +2; strength +1; renown |
| The Hundred-Day Wall | rare · B | commanded a holding that stood a siege of 100 days and did not fall | discipline aura (company) 1; resist fear 1 |
| Peacemaker | rare · B | three wars ended by treaties you made | edge on diplomacy +4; nobles +5 |
| Silver Sage | rare · B | age 60, a B rung in letters, five pupils taught to a C rung | growth +20 on letters for your pupils (an aura of learning); intellect +1 |
| Faithful Unto Death | rare · C | kept faith through prison or torture, never recanted | will +2; your faith's people +10 |
| Butcher of {place} | rare · C (infamy) | a town sacked with its people put to the sword | edge on intimidation +4; honour −10, infamy |
| Beast-Bane | rare · A | ten beasts slain whose power level stood above yours (section 17) | fight against beasts +4; resist fear 2 |
| Kingmaker | unique · A | a ruler crowned through your plot or arms, not yourself, and still on the throne a year later | edge on intrigue +4; nobles +10; reasons for lords in A.WHY |
| Sword of the Realm | unique · A | the highest sword rung in your realm, and the realm's tourney won | speed +1; fight with a sword +3; the realm's soldiers +10 |
| Wyrm-Slayer | unique · S | a beast of dragon kind slain (section 17) | strength +2; resist fear 3; every group +10; beasts of dragon kind fear you |
| First of the Age | legendary · S | the first in this age to hold an S-rank skill | will +2, insight +1; renown; the age is named in the chronicle |

### 11.9 Titles: build and tests

Titles are built after step 9 (they need the census and the deed ledger) and before step 10's screens, as three
commits: (a) `data/titles/`, `A.deedDone` and the ledger, the validator; (b) the checks, earning and losing, NPCs and
beings; (c) the profile line, chips and card, and the hint cards.

| Test | What it proves |
|---|---|
| validator (`lint-titles.mjs`) | every predicate and deed kind declared; budget by weight; stat ≤ +3 a title; unique titles have a census key; every title satisfiable by some start (a predicate walk) |
| `ttlHidden` | no rendered page of a fresh life or a 60-year bot life shows a condition; the lint finds no UI read of `requires` |
| `ttlDeterministic` | the same seed and choices give the same titles, holders and years, twice |
| `ttlUnique` | over a 100-year life no unique title has two living holders; a `first:` title is never given twice in an age |
| `ttlCaps` | a person given eight titles and his skills reads no more than the caps on any check, fight, aura or stat |
| `ttlRare` | pooled over 200 bot lives: most lives hold none; under one in ten holds a rare title; a unique title under one in a hundred |
| `ttlNpc` | an NPC champion earns *Undefeated* from his own duels (seed fallback) and loses it to a loss |
| `ttlSave` | every sample save loads with no titles and no ledger; the first deed after loading starts the ledger |

---

## 12 · A person's level, stat points and skill training (the owner's order of the same day)

"add stat allocation. per level stat points. skill training." The newest order wins: how stats grow changes here.

### 12.1 One level for a person, the power ladder's

**Built (D-181, `src/people/9999975-level`):** the level and the points as §15's answers 4, 5 and 9 change this section:
the level comes from defeats on the ladder (seeded from the computed level, a floor while growing up), not from every
walk; `A.train` still raises stats until a balance pass (deferred). The tables below are the old defaults.

- A person has a **level**, and it is **the power ladder's level** (order 77): one number for every being, person,
  beast or legend. This note does not make a second scale; where the ladder's numbers land differently from the
  defaults below, these tables scale with them.
- **Beings of one level differ in what they can do.** The level gives the body and mind room (stat points, §12.2); the
  skills and titles a being holds are its capabilities (`A.CAPS`, §3.6). A level 20 merchant and a level 20 knight
  stand at the same level; the knight wins the fight and the merchant the bargain.
- **The level is gained in every walk of life.** Every experience a person earns in any skill (§3.1: work, practice,
  drill, stretches, a card) also goes to his **life experience**, and so do deeds (an evolution, a merge, a title, a
  fight won above one's level, a masterwork, a treaty, a harvest saved). Fighting is one road among many.
- **No farming a cheap skill.** Experience counts in full toward the level only from skills whose read stands at or
  above the level's *par* (the read an ordinary person of that level has in his best skill); below par it counts a
  quarter. Deeds count once.

**Defaults, until the ladder lands** (to be scaled to it): a human level runs 1 to 60. Life experience for the next
level grows by 12% a level (level 2 at 60, level 10 at about 900 in all, level 30 at about 10,000, level 50 at about
110,000). An ordinary working life ends near level 12 to 18, a soldier's or a master craftsman's near 20 to 25, the
great at 30 to 40, the human summit near 50. The ladder's great beings stand far above (order 77).

### 12.2 Stat points, allocated by the player

- **Each level gives stat points**: 3 a level for most peoples (the race sets its own: `GD.RACES[r].points`, with the
  ladder), plus 1 at each tenth level. The player **places them himself** among the six stats (strength, speed,
  insight, stamina, intellect, will). Unplaced points keep.
- **Bounds.** A stat cannot pass the **race's ceiling** (`GD.RACES[r]` and the person's own potential `p.pot`, as now),
  nor the **body's room at this age**: a child's room grows with his years (the release's growth curve becomes a cap),
  prime age gives the whole ceiling, old age lowers it year by year. Points cost more near the ceiling: 1 a point below
  half of it, 2 to three quarters, 3 above. **What a stat reads** (`A.stat`) is the placed value, held to the age's
  room, less wounds, hunger and illness as today: a wound still costs strength; old age still takes speed.
- **Stats stay apart from skills.** Points never buy a skill level; a skill never buys a point (only blessings,
  curses, racial skills and titles touch stats, inside their caps, §2.4 and §11.5).
- **Allocation becomes the main road.** Today stats grow by age and by training (`A.train`, 54 calls; `p.st`, `p.pot`).
  After the switch, `A.train` no longer raises a stat: its effort becomes life experience (body work still builds the
  level) and conditioning (a month's freshness), and age sets the room, not the gain. Children below 12, whose years
  pass by Next year, get their points placed by the household's way of life (a smith's son toward strength, a clerk's
  toward intellect) through `A.WHY.decide`, shown in the year's digest; from 12 the player places them.
- **No re-placing.** Points placed stay placed (§14 question 5).
- **NPCs** place theirs once a year through `A.WHY.decide`, with their post, their temper and their skills as reasons
  (a captain toward strength and will, a steward toward intellect): deterministic, recorded.

**Migration:** today's `p.st` becomes the placed value, `p.pot` the person's ceiling; the level is set from the
experience already held in his skills (S1's tables and the NPC closed form), and the points of levels already held are
deemed placed as his stats stand; nobody's stats change on loading.

**On the profile:** "Level 14" with ten pips toward the next (in words: "about half way"), and when points wait, a
button "3 points to place" (44 points tall). It opens the **allocation sheet**: six rows, each the stat's name, its
bar with the ceiling marked and the age's room shaded, its word as today (99993-v2-stats), and − and + controls; the
cost of the next point in pips; "Keep" commits. A tap on a stat's name opens what it does (`data-note`). No
percentages.

### 12.3 Skill training: the player's choice

S1's "Work at a skill" (`SK.work`: alone, a lesson, a harder test, thinking it over) grows into a **training screen**:
1. **Pick a skill:** one held, or one whose route is known (§8.4), or a family not yet tried.
2. **Pick a way:**
   - **Alone** (practice): free, slow; any skill you hold.
   - **A master** (drill): a person present who holds the skill at your rank or above; he agrees or not by
     `A.WHY.decide` (his opinion of you, your coin, his pupils, his pride); a fee a month by his rank; he teaches up to
     his own level and shows only concepts he has.
   - **A school** (drill and its arts): a place (a fencing school, a monastery, a guild hall, a university); tuition,
     months of residence, a chance at its arts and at concepts; some take only nobles or the faithful.
   - **A book** (a manual, an item): needs letters; slow; teaches a route and concepts, and levels only up to the end of
     C (B and above need a teacher, a school or deeds).
   - **A harder test** (a stretch with stakes): the most experience and insight, a chance of failure in front of
     others, and of a wound in arms.
3. **See the price and the outlook** before committing: months, coin, what is risked, the pace in a word ("quickly",
   "steadily", "slowly", "hardly at all") with its reason, and for a test its odds in words and a tipped scale.
4. **Commit:** the plan runs month by month (the plan of today's `pc.plan`), each month's gain in the ledger, until
   done, broken off or stopped by a notable card.

Training feeds the skill's experience by S1's rules and the person's level (§12.1). Overtraining, weariness, rest and
company stay S1's.

### 12.4 Professions: hooks for crafts, trade and every other walk

The owner's later waves (blacksmithing, many weapons, merchant trade as a simple profession, many non-combat roads)
plug in without new code paths:
- **A profession** is data (`data/professions/*.json`): `{ id, name, families: ["craft:smithing"], skills: [ids of its
  named skills], work: [ { action, reads, inputs, output, quality } ], posts, titles }`. `A.PROF.register` reads it.
- **Its work** is an activity: a month at the forge or the stall reads the family (quality from the read, odds in
  words), makes goods or coin through the economy (`docs/design/economy-and-items.md`), and earns experience with the
  profession's id in the cause, so the skill levels and the person's level rises like a fighter's.
- **Its own standing** inside a trade (apprentice, journeyman, guild master) is a post or a title (§6.2, §11), given for
  reasons, never a level word.
- **Growth room:** a family can split into its own ladder when a profession needs it (smithing out of craft, as a focus
  today), with the migration rule of §7 for the read; new weapons add `fight` tags and arts, not new rules.

### 12.5 No road is a shortcut

- Experience per level is fixed per rank (§3.1); everything multiplies a month by at most three, whatever coin buys.
- Evolution, merging and advancing need conditions no money buys (§3.2 to §3.4).
- The person's level is steep and counts only work at or above par; stat points are bounded by race, age and the
  cost near the ceiling; skills' and titles' effects share one budget and one set of caps.
- The balance harness (§10 step 12) measures level, stat totals and ranks by path and age, and fails a path that beats
  its band: no path to the human summit before forty, and none to it at all for most lives.

### 12.6 Build and tests

Three commits after step 6 (they need effects and caps) and before the screens: (a) life experience and the level
(`A.LV`), with the ladder's numbers; (b) stat points, the bounds, `A.train`'s change, NPC and child placement,
migration; (c) the training screen and the profession registry, with smithing and trade as the first two professions'
data.

| Test | What it proves |
|---|---|
| `lvEveryWalk` | over pooled bot lives a merchant, a priest and a smith reach levels within a band of a soldier's of the same years |
| `lvNoFarm` | a bot that grinds a D skill for twenty years gains under a third of a varied life's level |
| `statBounds` | no placed stat passes race ceiling or the age's room; a wound and old age lower what is read, not what is placed |
| `statMigrate` | every sample save loads with the same `A.stat` for everyone and no points waiting |
| `statNpc` | NPCs' placements are the same on a replay and fit their posts |
| `trainPrice` | a master's month costs his fee, never teaches past his level; a book stops at the end of C; the ×3 cap holds |
| `profHooks` | a registered profession's work levels its family and the person's level, and makes its goods |
| phone and lint | the allocation sheet and training screen at 375 × 667, 44-point targets, no percentages, click-open notes |

---

## 13 · Risks

- **The identity at the switch** rests on the band table matching S1's values exactly; step 3's shadow test proves it
  before anything changes.
- **The S rung of a family** is a common S rung for migration (a Grandmaster from an old save must land somewhere) and
  the summits are unique; the data review must keep the two clear on the card.
- **Perks as effects** keep their sums only while the caps do not bite; step 6 measures it and the balance bands hold.
- **The power ladder** is not written yet; §3.6 and §12.1 assume only `level(p)`, that it is the person's level
  earned from life experience, and that it reads `A.CAPS`. The level and point defaults of §12 scale to its numbers.
- **Stat points as the main road** change every stat in play over a life; the balance bands are re-measured at §12.6's
  second commit, and the press gate (a month's cost) checks the yearly NPC placement.
- **Hidden title requirements** are easy to leak through a log line or a test hook shown in dev; the lint and
  `ttlHidden` guard it.

---

## 14 · Questions for the owner (each with a default)

1. **Ranks above S for monsters and magic?** Default: no new letters. A being's power level (order 77) carries the
   great gaps; skills stay D to S, and magic and monster families write S skills that may lift a being's level.
2. **Does an evolved skill vanish?** Default: yes, it becomes the new skill (its story stays in the record), and a
   merge absorbs its parts, so a page holds tens of skills, not hundreds.
3. **"Master" in skill names** (Master of the Long Edge, Master Bowman)? Default: kept as names; the seven words never
   appear as a level. Say so if you want "Master" gone from names too.
4. **Training no longer raises stats directly** (§12.2): age sets the room, wounds take from it, and the player
   places 3 points a level. Default: yes, as your order reads; children's points are placed by their household's way
   of life until 12.
5. **Can placed stat points ever be moved?** Default: no; a rare blessing or curse may move a few, with a named reason.

(Settled by default, not asked: house secrets' generated instances do not count toward the 500 and 1,000 targets, only
their four templates; honours are titles and posts given for reasons, never automatic for a rank.)


## 15. The owner's answers (2026-11-25, order 82), which override the sections above where they differ

1. **Ranks run D, C, B, A, S, SS, SSS;** a god's skills (and the like) stand above SSS. The power budget extends upward in the
   same doubling (SS 32, SSS 64 a level), with the stacking caps rising by rank.
2. **An evolved skill does not vanish:** the old skill stays, the evolved one is added (its levels start low). **A merge
   absorbs its parts.**
3. **Names:** "Master" may stand in a skill's name; titles carry honours such as **Sword Saint**; a being can be **born with a
   title** (a Primordial Demon is born "Primordial Demon"). "Unique" is kept only for what is one of a kind.
4. **Stats are raised by levels** (the points a level brings); **skills and titles grow by actions and training.**
5. **Placed points never move,** but an **evolution in any area** (a skill, a title, the person's own kind) can bring
   explosive growth or extra points.
6. **Scale:** thousands of skills at completion, built in waves from the first 200; each skill fully specified for use:
   cooldown, mana (or stamina) cost, damage or effect as a share or amount, range, duration, conditions. The player reads
   them in words and pips; the numbers live in the data and the tests.

7. **No range** (order 83): skills are used in combat or training; a rare skill may note a special reach where it truly matters.
8. **Level 10 is the cap** (order 87): past it a skill only evolves or merges with a compatible level-10 skill; no level 11.
9. **Where experience comes from** (order 88): a skill's experience comes from using it (each related move, movement or use of the ability, in a fight or in training or at work); a person's level, and so his stat points, from experience for killing or defeating people and monsters, more for a stronger foe (read on the power ladder). §12's "level from every walk of life" is replaced: the roads beyond combat raise their skills, and their titles and standing, not the level.
