# The skills rebuild: ranked rungs beside S1

**Work item:** the skills rebuild, steps 3 and 4 of `docs/design/skills-v2.md` §10 (the owner's answers of order 82,
§15, D-171) · **Engine:** `src/people/engine/skills2.js` (`A.V2.skills2`) · **Data:** `data/skills/` (validated by
`tools/lint-skills.mjs`, seeded by `tools/skills2/seed-data.mjs`)

A skill becomes a card with a rank (D to SSS, G above for gods) and a level from 1 to 10; S1's 28 skills become
families, each a ladder of rungs (D, C, B, A and a common S rung). This feature **changes nothing a player sees**:
`A.SK2.on` is false, S1 (`src/people/36-skills`) still owns every level, and the rungs are computed beside it so the
switch (step 5) can be proved before it is made.

## Files

| File | What |
| --- | --- |
| `a-adapter.core.js` | `A.SK2`: the data as one object (`SK2.DATA`), the engine on first use (`SK2.E`, `SK2.IX`), S1's table as rungs (`SK2.fromS1`), what a check reads through the rungs (`SK2.reads`, and `SK2.read`, which adds the body's hold, wounds and the clamp as `A.skill` does), the player's store (`SK2.build`, `SK2.sync` once a month after S1's month, `SK2.stale`) |
| `b-migrate.core.js` | `SK2.migrate`: the save step `skills2` (`A.V2SAVE.upgrade`, save version 16) |
| `test.mjs` | `sk2Shadow` (three bot lives, every month: `SK2.read(p, k)` equals `A.skill(p, k)` for every living person and the 38 keys; the player's rungs never behind S1's table), `sk2Migrate` (every sample save: the reads after the step equal S1's before it, every rung in band, the step idempotent, only its own fields written) |

The engine's unit tests are `tests/v2/skills2.test.js`; the data's, `tests/v2/skills2-data.test.js`.

## State

- The player: `pc.ks` (one entry a held rung: `{ lv, xp, held, rust, best, used, streak, focus, proved }`, defaults left
  out; an evolved rung stays beside its evolution, so a B holder keeps his D and C rungs at Lv 10), `pc.kc` (per
  family: the concepts grasped, `got`, and the insight toward the next, `ins`), `S.sk2v` (the step has run).
- Anyone else: nothing new. His rung is a function of his number (`p.skills[k]`): rank by band, level by value.
- All tolerate absence; a new life gets `pc.ks` at its first month.

## The mapping (D-NEW-1)

Each rank's levels sit on S1's 35 values: D is S1's levels 1 to 10 one for one, C, B and A take two levels to an S1
step (an odd level is the step, an even level half way to the next), S is levels 26 to 35 one for one. An S1 level
becomes the **odd** level of its step, so every check reads the same on the day of the step; experience past that
level's bar is kept as `held`, to land as the even level when the rungs hold the level (step 5). Nothing is lost and
nothing is read differently.
