# Retired in W1-5: the war score and the peace it made (D-091 to D-096)

The owner's order 54, answer 6: "They end when one side surrenders or is defeated." There is no score, no timer and no
peace nobody asked for (`docs/design/war.md` §11.3). The last commit with all of this live is `84b7f92`.

- `war-years.js`: the release's `A.checkPeace` (a war ended at a score of 80, by a roll on a fallen capital or on
  weariness, or by a white peace rolled after four years or between two worn-out realms), the old `A.settleWar` (land
  sized by the score's budget, a crushing peace at 90 that annexed a realm on a roll, a claimant who knelt or split the
  realm on a roll), and `A.warYear` / `A.warFront` (the release's yearly war, which nothing had called since the war map).
  Replaced by `src/war/9999953-surrender` (`A.WAR`): defeat as a fact, surrender as a decider's choice through `A.WHY`,
  envoys on the road, terms of real things; `A.settleWar` stays as the call for an ending decided elsewhere.
- `war-map.js`: the war map's weekly score (`A.wsScore`: the land each side held, the capital twice, plus the battle score
  `w.bscore`), the treaty land's budget from the score, and the War Room's peace buttons that rolled against it
  (`A.wsOfferPeace`). The weekly weariness stays (`A.wsWeary`); the treaty land is the land held, by the victor's demand;
  the buttons send envoys.
- `peace-table.js`: the ruler's peace table priced against the score and a willingness number, its odds as a
  percentage (`A.peaceOdds`) and its roll (`A.peaceOffer`); the AI's offers to a ruling player read from the score (sue,
  demand, white peace) and their answers; the old `UI.peacePanel`. Replaced by `A.WAR.table`, `A.WAR.tableLean` and
  `A.WAR.send` (terms in words, a tipped scale, the other crown's reasons, envoys), and by choice cards when an AI crown
  asks, offers or is beaten.
- `ruler-actions.js`: the ruler's "Offer peace" (a roll against the score), the council's counsel of peace (settled by the
  score) and the advisor's goals read from it. Now envoys, the ruler's own weighing of counsel, and `A.WAR.standing`.
- `persona-peace.js`: 20-ai-personality's log of a settlement the score forced (`A.aiNotePeace`, and 68's mark of a forced
  one), the old table's willingness parts and wrapper, the white-peace and willingness weights. A ruler's yielding is
  logged from his `A.WHY` record.
- `one-world-peace.js`: 09-engine-at-scale's nine-month floor on a far war's peace (a timer) and its hold on the crushing
  peace (the score kept under 90). What it meant stays as a reason: a far realm too large to swallow in one peace.
