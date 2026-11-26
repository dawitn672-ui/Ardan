# The skills rebuild: ranked rungs hold the level

**Work item:** the skills rebuild, steps 3 to 5 of `docs/design/skills-v2.md` §10 (the owner's answers of order 82,
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

## Files

| File | What |
| --- | --- |
| `a-adapter.core.js` | `A.SK2`: the data as one object (`SK2.DATA`), the engine on first use (`SK2.E`, `SK2.IX`), S1's table as rungs (`SK2.fromS1`, landing the even level since the switch), what a check reads through the rungs (`SK2.reads`; `SK2.read` adds the body's hold, wounds and the clamp as `A.skill` does), the player's store (`SK2.build`, `SK2.sync` after every month's pass, `SK2.syncFam` after `SK.set`, `SK2.stale`); the switch: `SK2.rungNow`, `valueOfEntry` (the mirror), `oddBar`, `holdBack` and `land` (a save's day of the switch); the labels: `SK2.label`, `labelS1`, `labelValue`, `labelAtLeast`, `labelRung`, `nextLabel`, `gateLabel`, `rungFor`, `rungName` |
| `b-migrate.core.js` | `SK2.migrate`: the save step `skills2` (`A.V2SAVE.upgrade`; save version 16, and 17 since the switch: `S.sk2v` 2) |
| `test.mjs` | `sk5Lives` (three bot lives, every month: what each check reads through the rungs against S1's read of the same state; anyone but the player the same, the player the same but on an even level of C, B or A, half way up the same S1 step; the rungs never stale), `sk2Migrate` (every sample save, version 15 and 16: on load every read equals S1's before the step, every rung in band, the step idempotent, only its own fields written; the first month lands the held half steps on their even levels) |

The engine's unit tests are `tests/v2/skills2.test.js` (with the switch's `landed`, `label`, `s1Label`, `gateLabel`);
the data's, `tests/v2/skills2-data.test.js`.

## State

- The player: `pc.ks` (one entry a held rung: `{ lv, xp, held, rust, best, used, streak, focus, proved }`, defaults left
  out; an evolved rung stays beside its evolution, so a B holder keeps his D and C rungs at Lv 10), `pc.kc` (per
  family: the concepts grasped, `got`, and the insight toward the next, `ins`), `S.sk2v` (1: the rungs written; 2: the
  switch made), `pc.sk[c].hold` (experience held back on a save's day of the switch, landed by the first month).
- Anyone else: nothing new. His rung is a function of his number (`p.skills[k]`): rank by band, the odd level of its S1
  step (the closed form of other people is S1's, on its steps).
- All tolerate absence; a new life gets `pc.ks` at its first month.

## The mapping (D-174, D-NEW-1)

Each rank's levels sit on S1's 35 values: D is S1's levels 1 to 10 one for one, C, B and A take two levels to an S1
step (an odd level is the step, an even level half way to the next), S is levels 26 to 35 one for one. An S1 step and
its experience land on the rung that holds them: in C, B and A, past the odd level's bar, the even level. A level set
outright (`SK.set`, an adopted number) reads its step's odd level. On a save's day of the switch the experience past an
odd level's bar is held back, so every check reads on load what it read before; the first month lands it.
