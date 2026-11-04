# 99997-v2-war: only your war, at your rank, and elite orders worth their numbers

**Aspect:** the owner's v2 complaints 9 (few elite orders, as strong as forces tens of times larger), 10 (you can see wars you're not in) and 16 (combat detail, words not percentages), `docs/v2/V2_SPEC.md` integration step 8 · **Kind:** system (4 core files), tests. No patches, no events.

## What it does

**No view of a war you are not in** (`a-gate.core.js`)

- **A war is yours** when you fight in it. That means your realm as its ruler, the realm you serve in (enlisted, an officer, a general, an order's member), or a sell-sword's employer. Being born in a realm at war is not enough (`A.V2W.inWar`, `fightsIn`, `myWars`).
  - 72-two-scales' levy counts while its scene runs: you stand in that fight.
- **The surfaces that stay shut** for any other war:
  - the War Room (`UI.warRoomOpen`, `A.warRoomView`, and a queued `warroom`);
  - a queued battle that belongs to that war;
  - 96-moments' victory and defeat cut-ins;
  - the War place (99992-v2-time's `V2T.atWar` now reads `inWar`).
- **The war lists** in the War tab (the release's, 23's battle causes) and in the World's Wars view are drawn with only your wars. `A.S.wars` is filtered for the call and put back, so no state changes. "Elsewhere" is gone.
  - A subject of a realm at war who is not in it reads "Your realm is at war, but you are not in it…".
  - Both pages end with **Rumours of war**.
- **Battles of other wars are rumour only.**
  - The release's battle news (`A.news(…, 'battle')`) is dropped for them.
  - `A.fightEnd` keeps a rumour instead, using `A.V2.war.rumourOfBattle`. It arrives 18–80 days later (`A.onMonth`). It is wrong about the winner at v2's rate (25% + 5% a month late), the place is half heard, and the dead are a guess (×0.4–3).
  - The dice are v2's `makeRng`, seeded from the game seed and the fight. Nothing is drawn from `A.rand`.
- **New state:** `S.v2w = { rum, heard }`. It tolerates being missing.

**In your war you play your rank** (`b-battle.core.js`, `d-view.core.js`)

- **Ranks:** soldier (ranks 0–1), sergeant (2–3), captain (4–6), commander (7 and up, a ruler, an army's general).
- **The soldier's and sergeant's line** (`wsLine`) and **the captain's company** (`wsPart`) are now v2's battle (`A.V2.war.battlePhase`). It is played phase by phase: Skirmish, Clash, Press, Decision. It is a queued `v2battle` card, so the clock stops until it's done.
- **The armies come from the real fight.**
  - Each army has its divisions, at most 6 a side with the rest grouped. Each division's order sets its morale.
  - Worth in levies comes from the troop types: attack + defence + toughness per man against a levy's (`GD.BN.LV`), times experience.
  - An order adds its worth and terror. Your company (about 200 men) is its own unit.
  - When we defend, the ground's defender bonus is ours.
- **Choices are v2's `CHOICES`.**
  - Each is rated against what you face: the unit across from you (`facing`), or the best troops for the standard. A captain is rated on command (tactics, command, judgment) against the enemy general.
  - Choices are rolled with `attempt()`, blunders and surges included, on the game's dice.
  - A captain also sets his company's tactic.
  - Odds show as words plus the tipped balance. A soldier and a sergeant see numbers only as estimates ("about 3,500"). A captain sees "some 3,400".
- **The commander keeps the release's command of the battle** (`wsLead`: 9997-companies' company and division simulator, a tactic for each wing, and the reserve).
- **The result moves the real fight.** It is a performance from −1 to 1 (your grade each phase, your part in the result, and the result), fed into 44-rank-battles' `A.RANKFX.apply` (layers `line` and `part`). The war map's division simulator then decides the fight.
- **The after-action report** has three causes in words (`afterAction`'s contributions: ground, tactics, numbers, quality, elites, your part).
  - It is kept as `b.aar = { causes: [{ label, pct }], text }`, which is 23's shape. `pct` is the signed contribution × 40, for the bench; the player sees only the words.
  - It is also kept in the story, and on the war's battle record when 23 didn't already give one.
- **Skipping the card** (a bot's `skipPrompt`) is the same as not taking part.

**Elite orders** (`c-orders.core.js`)

- v2's rules are laid onto the game's own orders (`GD.ORDERS`: the Iron Wolf, the Sun, the Greyfeathers, the Shadow, the Last Door, the Stormriders, the Tenth Wind, the Gold Masks), each already a division with its lore and ranks.
  - **Members:** the release's 200–300.
  - **Worth per member:** 14 + 1.2 × (experience − 80), within 14–26.
  - **Terror:** 0.25–0.45.
  - Both are fixed by the order's record, not drawn.
- **Division simulator:** every order battalion (`A.orderBuildCompanies`) is scaled so that its attack, defence and toughness per man are its worth times a levy's. That is about 6× the release's (which had about 3 levies a knight). In `A.fightDay` an order of 260 fights like 3,600–6,800 levies and takes no more front than its few men.
- **Terror:** each day of a war-map fight with an order in it, the divisions facing it lose terror × 3% of their full order.
- **Joining:** `A.orderJoin` first runs v2's three trials (the endurance march, the weapon trial, the oath night) on `attempt()`. Failing one sends you away for 2 years (`p.flags.v2w_trial_<id>`).

## Rules kept

- **Deterministic.** The scene and the trials draw only `A.rand` (`A.gauss` for v2's normal). Rumours use v2's seeded `makeRng`.
- **What moved:** taking part now draws the scene's dice (the release's line battle and tactical battle drew theirs). Orders hit harder on the war map, so every war with an order in it plays out differently from the same seed.
- **Rendering is pure.** The view reads the scene (`playerOdds`, `facing` and the minds view draw nothing). The war lists filter `A.S.wars` and put it back (test `v2wPure` and the core `renderRng` and `replayWithRender`).
- **No percentages on screen.** Every interpolated value goes through `UI.esc`. No inline handlers.

## Tests (`node tests/run.mjs <build> --features=v2-war`)

| Test | What it checks |
|---|---|
| `v2wNoSpectate` | A peasant in a realm at war: no War place, no war room, no battle or war room queued, no war cards, no war in the World's Wars view, no battle news in 3 years, rumours instead. Enlisted, the war is his |
| `v2wRankScreens` | The soldier, sergeant and captain screens: their own choices, estimates for the ranks, the captain's tactic row and enemy general. The commander gets the battle with wing tactics and the reserve |
| `v2wChoicesMove` | Paired seeds on 6 frozen fights: the bold choice gives a higher grade and a better order balance in the real fight at soldier, sergeant and captain; the commander's reserve changes his battle |
| `v2wAfterAction` | Three distinct causes in 23's shape, in the story |
| `v2wOrders` | 150–350 members × 14–26 levies, 10× their numbers or more; in the division simulator 21–44 a member against an ordinary division of the realm (the simulator adds the orders' own bonuses: the Shadow's +35% soft attack, the Last Door's +45% defence); 250 knights beat 3,000 levies; three trials |
| `v2wPure` | Drawing the scene changes neither the state nor the dice; no percentage |

## Limits

- **The map's "wars" mode** still colours every war. That is the map lane's code, so it was left alone.
- **36-sieges' "behind the walls"** stays for a besieged home town: being besieged puts you in the war.
- **The scene's result and the war map's result can differ.** The scene is your part of the field; the real fight is decided by the division simulator, which your performance moves.
- **The release has 8 orders, not v2's 5.** All 8 keep their lore and get v2's numbers. Cutting 3 would remove realms' identities.
