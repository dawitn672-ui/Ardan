# Retired by S1b: the proficiencies (owner order 63, D-072)

The proficiencies were 38 numbers from 0 to 100 that grew by a daily drip, read through five wrappers, and were shown
as category lists with bars, tier words and stars. S1b replaced them with skills that have levels and experience
(`src/people/36-skills`, `src/people/engine/skills.js`, `docs/design/skills.md`). What was retired is kept here, never
built and never tested. The last commit that had each piece in the build is in `docs/HISTORY.md` (H-069 onward).

| Here | Was | Replaced by |
| --- | --- | --- |
| `31-learn-by-doing/` | the `A.trainSkill` wrapper that weighted use over practice, the failed check's top-up at `eventClose`, `pc.grow` and its season line with a percentage | the sources of experience (`36-skills/d-sources.core.js`), the check as a stretch in `A.eventChoose`, the ledger and the season's line in words (`36-skills/b-month.core.js`) |
| `49-body-mind.numbers.core.js` | the player-only merge of nine skills into six, its `A.skill`/`A.trainSkill`/`UI.profBlock` wrappers and `BM.fold` | the legacy keys as specialisms for everyone (`data/skills.json`, `A.SK.canon`), the fold in the migration |
| `69-every-number-counts.merge.js` | "Hafts": the axe read as the spear for the player | the axe as a specialism of Spear, axe and mace |
| `999997-bodies.trainSkill.js` | the wrapper that stopped a skill at what the body carries and trained its stats | `A.SK.bodyStall` (a reason in the ledger) and `A.SK.trainStats` |
| `old-trainSkill.js` | the release's `A.trainSkill`: a curve on the number, aptitude caps of 60 and 80, the perk log | `A.gainXp` and the engine |
