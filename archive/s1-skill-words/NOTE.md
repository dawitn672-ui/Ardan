# Retired by the skills rebuild's switch: S1's words for a level

S1 (`docs/design/skills.md`, D-072) printed a skill's level as one of seven words in five Roman steps: Beginner,
Intermediate, Advanced, Expert, Master, Grandmaster, Legend ("Swordsmanship · Expert II"), and asked a "proof" to cross
into Expert and above. The owner's later orders (78 and 83: "substitute masters, legends etc for lvls"; Master and
Legend do not exist as measures) replaced the words with ranked levels. At the switch (`docs/design/skills-v2.md` §10
step 5, §6.1) the rungs of `src/people/37-skills2` hold the level and `A.SK2.label` prints it: "Basic Swordsmanship ·
C · Lv 3". What was retired is kept here, never built and never tested. The last commit that had each piece in the
build is `d99799c2` (`docs/HISTORY.md`, the entry for the switch).

| Here | Was | Replaced by |
| --- | --- | --- |
| `s1-words.core.js` | `SK.WORDS`, the Roman steps, `SK.levelName`, `SK.wordName`, `SK.levelOfWord`, `SK.minValue` (36-skills); the engine's `WORDS`, `ROMAN`, `levelName` (`src/people/engine/skills.js`); `C.lvl`'s word form (`C.lvl(p, k, "expert")`, no call used it but two of S1's own cards) | `A.SK2.label`, `labelS1`, `labelValue`, `labelAtLeast`, `nextLabel`, `gateLabel` (37-skills2); the engine prints a step as its rung (`levelName(lv, xp)` through `skills2.s1Label`); `C.lvl` takes a number |
| `s1-word-views.core.js` | the row's label ("Rusty · Advanced II"), what a skill acts as in words, the proof's words, the sheet's title ("Expert, the second step of five") and its "The next word" section, the glossary's "Levels" entry | the rung's label on rows, the plan picker, the treatise's requirement, the choice chip ("at C · Lv 7 (you are D · Lv 6)"), the sheet ("Basic Swordsmanship · C-rank · Lv 3", "To reach rank B", "And a deed: ..."), the glossary's "Rank and level" |

Kept, as S1's arithmetic under the rungs: the seven bands of five steps (`SK.wordOf`, `SK.stepOf`, `SK.BANDS`), the
values a check reads, the costs, the concepts that gate a band's edge, the deed from rank B (the engine's `proved`,
the card key `proof`: a word only code reads), stored experience, rust, the ledger and the record.
