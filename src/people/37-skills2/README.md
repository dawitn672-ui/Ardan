# The skills rebuild: ranked rungs hold the level

**Work item:** the skills rebuild, steps 3 to 8 and 11 of `docs/design/skills-v2.md` §10 (the owner's answers of order 82,
§15, D-171; orders 78 and 83: levels, never words) · **Engine:** `src/people/engine/skills2.js` (`A.V2.skills2`) ·
**Data:** `data/skills/` (validated by `tools/lint-skills.mjs`, seeded by `tools/skills2/seed-data.mjs`)

A skill is a card with a rank (D to SSS, X above for the few legends) and a level from 1 to 10; S1's 28 skills are
families, each a ladder of rungs (D, C, B, A and a common S rung). **Since step 5, the switch (`A.SK2.on = true`), the
rungs hold the level:** what every check reads (`A.skill` → `A.SK.reads` → `SK2.reads`), the mirror `p.skills[k]`, and
how a level is printed (`SK2.label`: "Basic Swordsmanship · C · Lv 3"). S1's seven words and Roman steps are gone from
everything a player reads (`archive/s1-skill-words/`). S1's table (`pc.sk`, `src/people/36-skills`) stays the
experience engine's working form under the rungs: `A.gainXp` queues the month's efforts, the month's pass runs S1's
arithmetic (the life's factors, insight, breakthroughs, the gates of concepts and the deed from rank B) and the
experience lands in the rungs (`SK2.sync` at the end of the pass).

**Since step 6 (D-180) the rungs' effects are in play,** with the stacking caps here, in the adapter, so no data can break
them: `edge` in `A.skillEff` (every check; at most +12 on one check), `fight` in `A.fighterFrom` and `A.CR` (at most +15%
of the fighter's worth), `blunder` and `surge` in `VS.minds` (the honest odds and the roll alike; at most 2 steps),
`resist` (wounds, fear, illness; at most 3 steps), the knacks served from the rungs' `perk` effects (`A.perkRows`: the
release's rows, so every perk sum is what it was), and `A.CAPS(p)`, the capability profile. Today's rungs carry only
perks, so every other bonus is 0 and every reader takes the fast path.

## Files

| File | What |
| --- | --- |
| `a-adapter.core.js` | `A.SK2`: the data as one object (`SK2.DATA`), the engine on first use (`SK2.E`, `SK2.IX`), S1's table as rungs (`SK2.fromS1`, landing the even level since the switch), what a check reads through the rungs (`SK2.reads`; `SK2.read` adds the body's hold, wounds and the clamp as `A.skill` does), the player's store (`SK2.build`, `SK2.sync` after every month's pass, `SK2.syncFam` after `SK.set`, `SK2.stale`); the switch: `SK2.rungNow`, `valueOfEntry` (the mirror), `oddBar`, `holdBack` and `land` (a save's day of the switch); the labels: `SK2.label`, `labelS1`, `labelValue`, `labelAtLeast`, `labelRung`, `nextLabel`, `gateLabel`, `rungFor`, `rungName` |
| `c-effects.core.js` | Step 6: what a person holds that carries effects (`SK2.held`: the rungs of the families that carry any, each with the rungs below at Lv 10), `A.CAPS(p)` (= `SK2.caps`, a frozen profile kept for the month, keyed by the skills and levels it reads), the tags a check reads (`SK2.tagsOf`), `SK2.edgeOf`, `SK2.mindSteps`, `SK2.resistSteps`/`resistShare`, `SK2.fightOn` (A.fighterFrom's hook: `f.sk2`, `f.woundRes`, `f.fearRes`), `SK2.perkRows` (the knacks), `SK2.capsReset` |
| `d-evolve.core.js` | Step 7 (D-182): evolution at Lv 10; since order 95 (D-192) the old rung becomes the new one and is gone (`SK2.migrateLine`, save step `skills2line`, version 21, retires an older save's rungs below each top and any art beside its evolution). `SK2.gate(p)` is what S1's engine asks at every edge of the player's table (the rung's route through `E.edgeVerdict`: S1's concepts, the deed `proved`, for S a renowned deed and thirty years, a part a merge sealed), `SK2.npcGate` the closed form's (the deed: a post or a stretch won), `SK2.factsAt`, `SK2.evolved` (S1's crossing of a rank's edge: `pc.ke.ev`, the record, the log, the digest), `SK2.evoGift` (the card `sk2_evolved` from rank B and for the first, else the first months), `SK2.cardFx` (the card key `skTurn`: a point through `A.LV.grant`, growth, a merge), `SK2.npcEvolved` (a point from B up), `SK2.migrateEvo` (save step `skills2evo`, version 19) |
| `e-merge.core.js` | Step 8 (D-182): merging; since order 95 (D-192) a rank's jump (`SK2.jumpFacts`, `jumpVerdict`, `rankJump`, `rankJumps`, below; the advance is archived in `archive/skills2-advance/`). `SK2.mergedRead`/`mergedOf` (a family absorbed reads through its merge, never below the floor), `SK2.tops` (each family's top rung unless absorbed, and the merged skills), `SK2.knows` (a school, or a teacher-relation at the result's rank), `SK2.mergeOpen`, `SK2.doMerge`, `SK2.afterMonth` (a merged skill grows by its families' mean monthly experience to Lv 10; a known recipe offered once in three years; the near death's moment), `SK2.offer` (the card `sk2_merge_offer`), `SK2.moment` (a named moment: `SK2.foundAt`, 1 in 200 once a life) |
| `f-kinds.core.js` | Step 11 (D-186; §16): the owner's three kinds (order 92), the arts of `data/skills/kinds/`. Who holds what (`SK2.artsHeld`: the player's `pc.ka`, anyone else's closed form `E.npcArts`, a beast's `E.beingArts` with its mana), slots and readying (`SK2.slotsOf`, `readiedOf`, `readyArt`, `unready`: in hand from next month), the month (`SK2.artsMonth`: learned by a route, at most two, grown by use and half the family's month; `useOutside`: a wound, an illness, a stat for a month, read by `A.stat` through `SK2.statOf`), the fight (`duelStart`, `duelPick` for the player's button, `duelPlanFor` by the pure `E.plan`, `duelRound`, `duelAfter`, `duelTick`, `duelEnd`; every bonus capped), the honest odds (`SK2.artsWorth` for the duel screen's measure, `SK2.artsWorthOf` for `A.shownDuelOdds`), the save step `skills2arts` (`SK2.migrateArts`, version 20) |
| `g-view.core.js` | Step 11's view: `UI.artsBlock` (on the Skills sheet and the old profile, after the ladders: the places in hand, every art with its kind, rank and level, its description in words on a press, Ready, Put away, Use), `UI.duelArtsBar` (the duel's bar of readied arts), `SK2.artNote` and `doWords` (no percentages, no digits) |
| `skills2.events.js` | `sk2_evolved` and `sk2_merge_offer`, both queued, never drawn |
| `b-migrate.core.js` | `SK2.migrate`: the save step `skills2` (`A.V2SAVE.upgrade`; save version 16, and 17 since the switch: `S.sk2v` 2) |
| `test.mjs` | Step 11: `sk2Active` (a readied active used at most once per its cooldown, on both sides; a buff raises or guards for its rounds and wears off; a heal; the person untouched), `sk2KindCaps` (every art at Lv 10 readied, against swordsmen and two monsters with mana: every cap holds in every exchange), `sk2DuelReplay` (a duel with arts the same alone, drawn at every exchange, and again), `sk2ArtsMonth` (bot lives: arts learned only by an open route, two a month at most, never mana; the closed form; a month's buff heals a wound once, a month's raise lasts its month), `sk2ArtsView` (375 x 667: kinds, 44 points, no percentage, a press opens, a hover does not; the duel's bar); `sk2Evolve` (step 7: planted, no evolution without the deed and one with it, the old rung gone and the family read through the new one, its record, log and card; an older save's rungs and art beside their evolutions retired on load, every read the same; the S rung's thirty years; the closed form's gate; bot lives where every rung gained is an evolution with its conditions or a level set), `sk2Merge` (step 8: a known merge offered and joined, its parts sealed, it grows and stops at 10; a found merge once; no die drawn), `sk2Jump` (order 95, D-192: no moment moves a rank; the concepts alone do not jump; the concepts and the deed, or the concepts and talent, jump to the next rank's Lv 1, the old rung gone; `rankJumps` jumps at most its max; an NPC by his number; no die drawn, D-163's budget untouched), `sk2Caps` (step 6: effects of every kind planted on the sword rungs, far past any budget; for 120 holders a check gains exactly the cap of 12, the fighting worth at most 15%, judgment and will 2 steps, resisting 3; as before once the plant is gone; no die drawn, the state untouched), `sk6PerkSums` (the knacks served from the rungs are GD.PERKS's 114 rows; over three bot lives every `A.perkSum`, `A.perkOf` and `A.perksOf` equals the release's reading of GD.PERKS), `sk5Lives` (three bot lives, every month: what each check reads through the rungs against S1's read of the same state; anyone but the player the same, the player the same but on an even level of C, B or A, half way up the same S1 step; the rungs never stale), `sk2Migrate` (every sample save, version 15 and 16: on load every read equals S1's before the step, every rung in band, the step idempotent, only its own fields written; the first month lands the held half steps on their even levels) |

The engine's unit tests are `tests/v2/skills2.test.js` (with the switch's `landed`, `label`, `s1Label`, `gateLabel`, and step 6's `heldOfRung`, `gather`, `edgeOn`, `fightOn`, `stepsOn`, `resistOn`, `profile`, `perkRows` and the human ranks' ceiling `CAP_HUMAN`);
the data's, `tests/v2/skills2-data.test.js`.

## State

- The player: `pc.ks` (one entry a held rung: `{ lv, xp, held, rust, best, used, streak, focus, proved }`, defaults left
  out; of each family's ladder only the top rung: an evolved rung became the next and is gone (order 95, D-192; until
  version 20 a B holder kept his D and C rungs at Lv 10, retired on load), what it gave passing on through the line), `pc.kc` (per
  family: the concepts grasped, `got`, and the insight toward the next, `ins`), `S.sk2v` (1: the rungs written; 2: the
  switch made), `pc.sk[c].hold` (experience held back on a save's day of the switch, landed by the first month).
- The player's turning points (steps 7, 8; D-192): `pc.ke` = `{ v, ev: [{ y, k, from, to, why, how?, rc?, of?, met? }] (at
  most 24; how: 'merge', 'jump', or an old save's 'advance'), m: [merged skill ids], adv (an old save's advances, history
  only), n (moments counted), fd (the year a found merge came), nd, off: { recipe:
  year offered }, cm (the month of the last evolution card), pre (rungs held above D before step 7) }`; a merged skill's
  entry in `pc.ks` is `{ lv, xp, via: 'merge', rc, of, fams, floor, y }`, beside the ladders' entries (the parts' stay, as
  S1's working form: absorption is read through `pc.ke.m`).
- The player's arts (step 11, D-186): `pc.ka` = `{ id: { lv, xp, y, via, n, fr? } }` (via: practice, teacher, school, deed, evolve; n: uses; fr: the arts gone into it by evolution, never learned again, D-192), `pc.kr` = `[{ id, m }]` (readied; in hand once the month `m` is past), `pc.kcd` = `{ id: month }` (a month's cooldown, forgotten after three years), `pc.kb` = `[{ id, stat, v, until }]` (a month's raise in force), `pc.kd` = `{ won_vs, near_death, survived_beast }` (deeds a route may ask). In a fight each fighter's `f.k2` (on the duel only). Anyone else's arts: the closed form, nothing stored.
- Anyone else: nothing new. His rung is a function of his number (`p.skills[k]`): rank by band, the odd level of its S1
  step (the closed form of other people is S1's, on its steps).
- All tolerate absence; a new life gets `pc.ks` at its first month.

## The mapping (D-174, D-179)

Each rank's levels sit on S1's 35 values: D is S1's levels 1 to 10 one for one, C, B and A take two levels to an S1
step (an odd level is the step, an even level half way to the next), S is levels 26 to 35 one for one. An S1 step and
its experience land on the rung that holds them: in C, B and A, past the odd level's bar, the even level. A level set
outright (`SK.set`, an adopted number) reads its step's odd level. On a save's day of the switch the experience past an
odd level's bar is held back, so every check reads on load what it read before; the first month lands it.

## Evolution replaces; a rank's jump (order 95, D-192)

- **An evolved skill becomes the next skill and is gone.** At Lv 10 with its route met, Basic Swordsmanship becomes
  Measured Blade: `pc.ks` keeps only the family's top rung (`SK2.fromS1` writes no rung below it), the family reads
  through it (`SK2.reads`, the mirror, `SK2.label`), and the card, the log and the record say it became the new one. What
  the old rungs gave is not lost: `E.heldOfRung` returns the top rung with its `line` (the rungs it evolved from), and
  `E.lineEffects` gathers the line's effects at Lv 10, lowest first, then the top's own, a later rung's effect replacing
  an earlier one's of the same slot (as a later band does within a skill). Perks are served by the read of their key, so
  every perk sum is what it was (`sk6PerkSums`). Anyone else's closed form is the same rule through `SK2.rungFor`. An art
  that evolves is gone into its evolution (`SK2.artGone`: its place in hand passes on, its cooldown is forgotten, and the
  new art's `fr` keeps it from being learned again); the closed form (`E.npcArts`) drops the source of an evolution held.
  A merge's parts stay as they were (sealed, read through `pc.ke.m`); a rung a merge absorbed gives no effect of its own.
- **Old saves** (version 20 and older, step `skills2line`, version 21): `SK2.migrateLine` deletes the player's rungs below
  each family's top and any art whose evolution he holds; every check reads what it read (the top rung, the line's
  effects). Idempotent.
- **A rank's jump** replaces the advance ("a rare leap isn't an event"; `archive/skills2-advance/`). The level calls it at
  every hundredth wall ("a breakthrough happens every 100 levels where your stats are boosted and skills can jump ranks
  if multiple conditions allow it"):

  | Call | What |
  | --- | --- |
  | `E.rankJump(ix, held, facts)` | Pure. `held` `{ id, lv }`; `facts` as `E.missing`'s (`concepts`, `deeds`, `talent`, `age`, `fame`, `sealed`, `skills`). Returns `{ ok, from, to, rank, met, missing }`. It jumps when the skill is at Lv `E.JUMP_FROM` (5) or more, at least `E.JUMP_NEED` (2) of `E.JUMP_CONDITIONS` are met in full (`concepts`: every concept the evolution's route asks; `deed`: the route's deed, or for a route that asks none a `proved` deed of the target's rank; `talent`: the family's letter at least `E.JUMP_TALENT[rank]`, C for C up to S for S), every other need of the route holds (the S rung's thirty years), and the skill is neither absorbed by a merge nor its evolution already held |
  | `A.SK2.jumpFacts(p, c)` | Pure. The facts of family `c` for a person: the player's table (concepts grasped, S1's proof as his deed, renown), anyone else's closed form (concepts by S1's hash for his years of work, his post as his deed, an office, a crown or fame 30 as renown), talent letters, age, fame, the rungs a merge sealed |
  | `A.SK2.jumpVerdict(p, k)` | Pure. `E.rankJump`'s verdict for key `k`'s family at his top rung, or null |
  | `A.SK2.rankJump(p, k, o)` | `o = { why, dry }`. Jumps when the verdict allows (unless `dry`): `SK.set` to the next rank's Lv 1 (its concepts deemed grasped), the old rung gone; for the player a record in `pc.ke.ev` (`how: 'jump'`, `met`), the skill's record, the log and the digest. Returns the verdict, `done: true` when it jumped. Draws no die |
  | `A.SK2.rankJumps(p, o)` | Every family whose verdict allows, best read first, at most `o.max` (default 1); returns the verdicts that jumped (with `k`) |

  **D-163's budget:** a jump neither reads nor spends it (the advance spent one of its three). The budget now covers only
  the body's stopgap breakthroughs (`A.breakthrough` at a duel won far above you, `VS.breakthrough` at a surge), until the
  level's hundredth walls replace them (the level builder's call, A2). How often a jump can come is set by how often a
  life reaches a wall.
