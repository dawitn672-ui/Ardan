# Skills with levels and experience

**Work item:** S1b (owner order 63, D-072) · **Design:** `docs/design/skills.md` · **Engine:** `src/people/engine/skills.js`
(`A.V2.skills`, a port of `docs/design/skills/model.mjs`), `src/people/engine/growth.js` · **Data:** `data/skills.json`
(`A.DATA.skills`)

The proficiencies (38 numbers from 0 to 100 that grew by a daily drip) are retired. A skill now has a **level** and
**experience** toward the next. Since the skills rebuild's switch (`docs/design/skills-v2.md` §10 step 5) the level is
held and printed by the rungs of `src/people/37-skills2` ("Basic Swordsmanship · C · Lv 3"); this table is the
experience engine's working form under them, in S1's seven bands of five steps (their old words, Beginner I to Legend V,
are in `archive/s1-skill-words/`). A new rank (a band's edge) is not bought with
experience: its named **concepts** must be grasped (a chance each month of real work, set per person by a hash, some at
once, some never) and, from rank B up, a **deed** done (the engine's `proved`). **Breakthroughs** come at named moments.

## Files

| File | What |
| --- | --- |
| `a-model.core.js` | `A.SK`: levels, the mirror (`p.skills[k]` is the value the level reads), `SK.reads` (what a check reads, with a specialism's steps and rust), `SK.set`, `SK.canon` (the ten legacy keys are specialisms), `A.gainXp` (the one door), the shim behind `A.trainSkill`, the closed form for other people, the season's ledger and the record |
| `b-month.core.js` | the player's month (`A.onMonth`): the queued efforts through the engine, then the ledger, the record and the log; the year's disuse (`SK.year`, called by `A.growthYear`) |
| `c-migrate.core.js` | §9: an old save (step `skills` of `A.V2SAVE.upgrade`, save version 15), a new life (the `A.newGame` stage `skills`), an heir; the yearly pass over everyone else |
| `d-sources.core.js` | where experience comes from (§3.2): the plan once a month, a post against its rank's demand, school as drill, a check and a fight as stretches, an activity's cause; the eventChoose stage `skills` |
| `d-view.core.js` | what the player sees (§8): `UI.skillRows` (the rail's three, the Profile's five), `UI.skillsBlock` (all, by group, folded), `UI.skillSheet` (the popover a row opens: the way to the next step, the next word's concepts, this season, discipline, talent, specialism, knacks, kin, teacher, its story), and "Work at a skill" (`A.SK.work`, `UI.workSheet`) |
| `e-life.core.js` | the month's life (§3.4-§3.6): rival, a new place, a quiet season, overtraining, a mending wound, a near death, pride, memory; the card keys `proof`, `grasp`, `talent`, `specialism` (the applyFx stage `skills`); `C.lvl`, `C.talent`, `C.ready`, `C.stuck` |
| `f-people.core.js` | other people (§10): the closed form once a year for people with a post, the 24 who matter month by month, the census `S.top` (a count, never a cap) |
| `skills.events.js` | twelve moments: the master's word, the deed offered, the rival, the quiet winter, the specialism, some never see it, a better hand, a pupil, the rust, too many things, pride humbled, the old hands |
| `test.mjs` | `s1Migrate`, `s1Checks`, `s1Mirror`, `s1Ledger`, `s1Reasons`, `s1NotLinear`, `s1TwoLives`, `s1SpreadPage`, `s1NoProficiency`, `s1Phone`, `s1Cost` (the engine's own tests: `tests/v2/skills.test.js`) |

## State

- The player: `pc.sk[k]` (the engine's shape), `pc.skm` (the month's queued efforts, at most 40), `pc.skl` (this
  season's ledger and the last), `pc.skr` (at most 80 turning points), `pc.tal` (talent letters where not C).
- Anyone else: `p.skills[k]` (one of the 36 level values), `p.skx[k]` (experience toward the next step, only for skills
  that are moving), `p.ssp[k]` (specialisms), `p.tal`.

## Lint

`tools/lint-skills.mjs` (run by `tools/check.mjs`): no "proficien" a player can read, the data whole (nine concepts
a skill, every one described, every kin and legacy key resolving, every skill with a reader), and the counts of older
code that writes `p.skills`, reads `p.apt` or calls `A.trainSkill` held to `tests/skills-baseline.json` (D-074).
