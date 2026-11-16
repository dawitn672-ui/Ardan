# Skills with levels and experience

**Work item:** S1b (owner order 63, D-072) · **Design:** `docs/design/skills.md` · **Engine:** `src/people/engine/skills.js`
(`A.V2.skills`, a port of `docs/design/skills/model.mjs`), `src/people/engine/growth.js` · **Data:** `data/skills.json`
(`A.DATA.skills`)

The proficiencies (38 numbers from 0 to 100 that grew by a daily drip) are retired. A skill now has a **level** (seven
words of five steps, Beginner I to Legend V) and **experience** toward the next step. A new word is not bought with
experience: its named **concepts** must be grasped (a chance each month of real work, set per person by a hash, some at
once, some never) and, from Expert up, the word must be **proved**. **Breakthroughs** come at named moments.

## Files

| File | What |
| --- | --- |
| `a-model.core.js` | `A.SK`: levels, the mirror (`p.skills[k]` is the value the level reads), `SK.reads` (what a check reads, with a specialism's steps and rust), `SK.set`, `SK.canon` (the ten legacy keys are specialisms), `A.gainXp` (the one door), the shim behind `A.trainSkill`, the closed form for other people, the season's ledger and the record |
| `b-month.core.js` | the player's month (`A.onMonth`): the queued efforts through the engine, then the ledger, the record and the log; the year's disuse (`SK.year`, called by `A.growthYear`) |
| `c-migrate.core.js` | §9: an old save (step `skills` of `A.V2SAVE.upgrade`, save version 15), a new life (the `A.newGame` stage `skills`), an heir; the yearly pass over everyone else |
| `test.mjs` | `s1Migrate`, `s1Checks`, `s1Mirror`, and the rest of §12.5 |

## State

- The player: `pc.sk[k]` (the engine's shape), `pc.skm` (the month's queued efforts, at most 40), `pc.skl` (this
  season's ledger and the last), `pc.skr` (at most 80 turning points), `pc.tal` (talent letters where not C).
- Anyone else: `p.skills[k]` (one of the 36 level values), `p.skx[k]` (experience toward the next step, only for skills
  that are moving), `p.ssp[k]` (specialisms), `p.tal`.
