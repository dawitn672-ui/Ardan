# Retired in W1-6: the faction dice (D-097 to D-103)

The owner's orders 54 and 62: no structural choice by bare dice; a faction, a coup or a revolt follows the realm's
stability, the king's ties to each lord and their own reasons. The last commit with all of this live is `67bca05`
(`docs/HISTORY.md`, the W1-6 entry).

- `persona-faction-answer.js`: 20-ai-personality's `A.aiFactionAnswer` and `A.aiRevolt`: a faction's demand answered by the
  ruler's pride and caution, then the leader rising or backing down by his own temper, rolled. Replaced by
  `A.PEACE.crownAnswer` and `A.PEACE.theirAnswer` (`src/nobility/9999954-realm-peace/b-factions.core.js`), decided
  through `A.WHY`.
- `startwar-ally-rolls.js`: `A.startWar`'s two ally rolls in `src/core/release/core/03-engine-base.js`. Dead code: the branch
  ran only when `A.callToArms` was missing, and it is always on the page. Allies answer through `A.callToArms` ->
  `callToArmsNow` (`A.aiAnswerCall`).

Never built and never tested. To bring one back, paste it into the file named in its first lines.
