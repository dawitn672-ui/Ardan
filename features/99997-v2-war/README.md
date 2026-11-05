# 99997-v2-war: only your war, at your rank, and elite orders worth their numbers

**Aspect:** the owner's v2 complaints 9 (few elite orders, as strong as forces tens of times larger), 10 (you can see wars you're not in) and 16 (combat detail, words not percentages), `docs/v2/V2_SPEC.md` integration step 8 · **Kind:** system (4 core files), tests. No patches, no events.

## What it does

**No view of a war you are not in** (`a-gate.core.js`)

- **A war is yours** when you fight in it. That means your realm as its ruler, the realm you serve in (enlisted, an officer, a general, an order's member), or a sell-sword's employer. Being born in a realm at war is not enough (`A.V2W.inWar`, `fightsIn`, `myWars`).
  - 72-two-scales' levy counts while its scene runs: you stand in that fight.
- **The War Room** belongs to those who serve or rule: a ruler, an enlisted man, an officer, a general, a sell-sword under contract (`A.V2W.canRoom`).
  - In peace it plans your own forces, as before.
  - In war it is drawn with only your wars in `A.S.wars`.
  - For a life outside the army it stays shut (`UI.warRoomOpen`, `A.warRoomView`, a queued `warroom`). The War tab loses its War Room button and reads "is at war, but you are not in it" in place of the release's "is at peace".
- **The surfaces that stay shut** for any other war:
  - a queued battle that belongs to that war;
  - 96-moments' victory and defeat cut-ins;
  - the War place (99992-v2-time's `V2T.atWar` now reads `inWar`).
- **The war lists** in the War tab (the release's, 23's battle causes) and in the World's Wars view are drawn with only your wars. `A.S.wars` is filtered for the call and put back, so no state changes. "Elsewhere" is gone.
  - A subject of a realm at war who is not in it reads "Your realm is at war, but you are not in it…".
  - Both pages end with **Rumours of war**.
- **Battles of other wars are rumour only.**
  - The release's battle news (`A.news(…, 'battle')`) is dropped for them. That covers a fight's report, a division cut off, an order destroyed, and sell-swords marching off.
  - Outside every war, none of it reaches you. In a war, only news naming a realm on either side of your wars does.
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

## Other features' tests changed (they read spectating)

- `99992-v2-time` `v2tNoPlay`: the noble enlists before he opens the War Room (a life outside the army has none).
- `99992-v2-time` `v2tPlaces`: the noble enlists when his realm declares war (the War place is for a war you fight in).
- `58-event-cut` `warRoomByRank`: the peasant enlists before his War Room tabs are read.
- `72-two-scales` (all its tests): the soldier's line and the captain's way into 72's scene now start v2's battle. 72's scene stays for the levy, and its tests and its lab (`lab.mjs`, used by `twoScalesMovesFront`) reach the old entry through `A.V2W.classic.wsLine` / `.wsPart`.

## Playtest round 1 (`e-words.core.js` and small changes)

- **Leaving the field ends the step.** The battle stopped the clock, so "Leave the field" now calls `UI.stepStop` and never resumes into an empty queue. Before, the stepper kept running and the game soft-locked.
- **Numbers by rank** (`A.V2W.retell`), in the release's call to battle and in 34's reckoning:
  - a soldier or sergeant gets estimates ("about 20,000");
  - a captain gets "some 17,600";
  - a commander knows his own side exactly and the enemy's only as an estimate.
- **An outsider's maps.**
  - The war map (`UI.drawWar`, `drawWarBasic`), `MAP.draw`, 62's march arrows and the War Room are drawn with only the divisions and fights you can see (`A.V2W.withSeen`). That means both sides of your wars, plus your own realm's forces when you serve or rule.
  - 64's tavern tale "How the battle went" comes only for a battle of a war you fought in (`S.v2w.fought`).
  - 57's folk memory of a battle is told as hearsay.
- **An empty war list.** World > Wars says "Your realm is at war, but you are not in it" (or "No war of yours") in place of "Ardan is, for once, at peace."
- **Captains' odds.**
  - `src/v2/war.js` `playerOdds` now rates a captain against the unit across from his company, under their general. The difficulty scales with √(their worth / his company's) and is steeper with risk (0.35 + 0.9 × risk).
  - Command grows 0.3 a rank from Captain up.
  - `tests/v2` pass.
- **The orders' page** reads members × v2 worth (14–26 a member) for every order, including one whose realm has no line division.
- **One rank word.** The battle names the army's own title ("a Commander with your men").
- **Test:** `v2wRound1`.
- **Not done:** the War Room's division panels still show the release's exact counts (and "current / full" above full) to a commander for enemy divisions.

## Playtest round 2 (`f-told.core.js`, small gated edits in 57, 72)

What each rank may know, and what outsiders hear (playtest 2 findings 3, 4, 5 and playtest 1's 4).

- **World › Annals and The Book** (57-world-chronicle's views read `WC.tellOf`, which this sets):
  - an entry of a war (war begun, peace, battle, siege, fall, an order cut down) that you fought in, that happened at your door (home and the provinces beside it), or that names you is set down as it was, its counts at your rank's precision (`W.band`: a soldier or sergeant "about 24,000", a captain or commander "some 24,300");
  - any other reaches you 10–80 days late (`W.entLag`) and as hearsay (`W.hearsay`): "In 1116, word came of a battle near Nagdur: Aldmark beat Greyhaven, as it was told, and about 5,500 lay dead, by one account." The winner is wrong at v2's rate (25% + 5% a month late), the place is half heard, the dead are a guess (×0.4–3), and no generals are named. Until it reaches you it is not in the annals;
  - the wars you fought keep their two sides in `S.v2w.fw` (tolerates being missing), so their sieges and falls stay yours after the peace;
  - the hearsay dice are v2's `makeRng`, seeded from the game seed and the entry: pure, the same every draw.
- **64-npc-beliefs:** a battle you had no part in and did not see is not one you know (`NB.pcKnows` returns null for it: a neighbour's war no longer counts), and "The record" where you do know it (`NB.recordLine`: the belief cards, the Tales, the Chronicle, the scene that puts you right) gives the counts at your rank's precision.
- **72-two-scales' levy** reads `TS.told` (this feature's `W.levyCount`): the call to arms ("about 6,500 against about 30,000"), the front's words, the standards' slips ("~5.5k"), their titles and the day's tally are estimates.
- **The commander's battle** (the release's modal, 9997-companies' panel, 60-drill's tags): his own side exactly, the enemy's as an estimate (the side line, the opening line, volleys and the wings' losses in the log, the result); morale in words ("steady", "eager"); drill in words ("drilled", "Drill: the charge (drilled)"), no 0–100 number. 59's tooltip on the two side lines goes with the numbers it explained.
- **Tests:** `v2wAnnalsHearsay`, `v2wBeliefRecord`, `v2wRankCounts`.

### Tests of other features changed (CI run 88)

- `26-belief-truth` `btRumors`: v2 drops an outsider's far battle report, so 26's inflation is tested on `war` news, and the drop is asserted.
- `64-npc-beliefs` (the `NBT.person` helper): the acquaintance is of the player's own people. Since the far peoples came onto the continent it could be an elf of 35, still a child (grown at 50), and every scene about him dropped (`nbRevenge`'s "undefined" outcome). Not the dice.
- `99997-v2-war` `v2wPure`: the first frozen fight now routs after two phases, so the next frozen fights are drawn too, to the same bar of 10 draws.
