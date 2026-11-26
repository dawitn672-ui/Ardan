# Retired by order 95: the advance, a rare leap as an event

The skills rebuild's step 8 (`docs/design/skills-v2.md` §3.4, D-182) gave the player one **advance** a life: at a named
moment (a fight won far above him, `deed_above`; a near death, `near_death`) a skill at Lv 5 or more of its rank leapt to
the next rank's Lv 1, by a hash of the moment's key, 1 in 100, only while D-163's breakthrough budget was open (it spent
one), its concepts deemed grasped, its price a wound that stays. The owner's order 95 (2026-11-26) ended it: "a rare leap
isn't an event". In its place a breakthrough comes at every hundredth level, where stats are boosted and skills can jump
ranks "if multiple conditions allow it": `E.rankJump` (`src/people/engine/skills2.js`) and `A.SK2.rankJump`,
`jumpVerdict`, `jumpFacts`, `rankJumps` (`src/people/37-skills2/e-merge.core.js`), which the level calls (D-192).

What was retired is kept here, never built and never tested. The last commit that had it in the build is `5e5dab5e`
(`docs/HISTORY.md`, H-156).

| Here | Was | Replaced by |
| --- | --- | --- |
| `engine-canAdvance.js.txt` | the engine's `ADVANCE_FROM`, `ADVANCES_A_LIFE`, `canAdvance` (and `ADVANCE_CHANCE`, 0.01) | `JUMP_FROM` (5), `JUMP_NEED` (2 of 3), `JUMP_CONDITIONS`, `JUMP_TALENT`, `rankJump(ix, held, facts)` |
| `e-merge-advance.core.js.txt` | the adapter's `SK2.advanceAt` (the family an advance took at a moment) and `SK2.advance` (the leap, the budget spent, the scar `SK2.ADVANCE_COST`, the record `how: 'advance'`); `SK2.moment` called it after a found merge | `SK2.rankJump(p, k, o)` and `SK2.rankJumps(p, o)`; `SK2.moment` weighs only a found merge |
| `test-sk2Advance.mjs.txt` | the test `sk2Advance` (an advance after some hundreds of planted moments; once a life; none with the budget spent; the hash rate) | `sk2Jump` (no moment moves a rank; two of three conditions jump; one does not; `rankJumps`' cap; an NPC by his number) and the engine's `rankJump` unit test |

Kept: `SK2.moment` and the found merge (1 in 200 by the moment's hash, once a life, at `deed_above` and `near_death`), the
moments' list in `data/skills/vocab.json`, and old saves' `pc.ke.adv` and `how: 'advance'` records (read as history only).
