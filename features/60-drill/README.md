# Drill decides what a unit can do in battle

**Aspect:** War (Road to Ten, War 4) · **Kind:** system (2 code files), 2 patches, a lab and a calibration bench (`calibrate.mjs`)

The plan says: "Link drill to battle tactics. Shield-wall drill should beat a cavalry charge in the resolver, and the report should say so." The status line said the report already named what tactics did (23-after-action), but "tactic choice is still not gated by drill."

The release already keeps a drill record on every division, `d.dr`, with six drills: formation, weapons, marches, skirmish, shield walls and siege work. The player's drill yard builds it (`A.drillDay`). But it had three gaps:

- No AI division ever drilled.
- No tactic asked whether the men had learned it.
- All the record did in battle was a small attack and defence bonus.

**What it does.**

- **Two more drills**: *Wedge and charge* and *Feigned flight* (`GD.DRILLS.charge`, `.feint`). They appear in the drill yard next to the release's six.
- **Every tactic needs a drill.** This covers both resolvers, the line battle (`GD.BATTLE_TACTICS`) and the war map (`A.WTAC`):

  | Drill | Line battle | War map |
  | --- | --- | --- |
  | Shield walls | Shield Wall, Spear Wall, Set Spear Line, Pike Hedge, Hidden Spear Line | Spear wall, Shield wall |
  | Wedge and charge | Couched Lance, Flanking Charge, Cavalry Sweep, Relay, Elephant, Camel and Noon Charges | Shock charge |
  | Feigned flight | Feigned Retreat | Feigned retreat |
  | Skirmish | Skirmish Screen, Horse Archery, Javelin Volley | Infiltration |
  | Weapons | Massed Archery, Longbow Volley, Crossbow Volley | Arrow storm |
  | Field works (siege) | Stake Line, Ditch and Stakes, Wagon Fort | |
  | Formation | Bull's Horns, Fighting Withdrawal | Elastic defence |

  These need no drill: holding, advancing, rallying, culture rites (Blood Fury, the Laughing Charge, Drum Storm), the giants' pairs, and style manoeuvres.
- **The gate: a formation never drilled is not offered.**
  - Below 15, a formation isn't offered at all. Above 15, its effect grows with the drill:
    - 55% of the release's effect at 15;
    - the release's full effect at 40 ("drilled");
    - up to 130% at 100.
  - Why "unavailable" and not "a penalty and a chance to break": the release's AI picks formations from a fixed list of preferences (`A.aiDeploy`). With only a penalty, it would keep marching into formations it never drilled.
  - One filter in `A.tacticsFor` serves the player's menu, `A.battleSetTactic`, `A.aiDeploy` and `A.aiPulse` alike. On the map, a filter in each `A.WTAC[k].ok` serves the AI's daily pick and the player's standing order.
  - A random "break" on top of the line battle's own morale breaks would also read as noise in the after-action report.
- **Counters in the resolver** (`drill.core.js`, read through `A.tfx`, so 23's report scores them):
  - A drilled shield wall sets its spears against horse (`antiCav`).
  - Horses balk at a drilled wall. This is morale: a charge loses some each push.
  - A wedge goes through a line that never drilled to stand.
  - A skirmish screen bleeds a slow block of foot.
  - On the war map:
    - drilled formation keeps order under pressure;
    - a charge countered by a drilled spear wall comes off it in disorder;
    - a shock charge into foot with no wall drill hits harder;
    - every tactic's multipliers scale with its drill.
- **AI armies drill.** Each month in camp (not marching, not fighting), every division drills one of its three drills, in turn 3, 2, 1:
  1. What it is: horse charges or feints, bows volley or skirmish, foot make walls.
  2. Its general's temper (38-orders; when it is absent, the steady choice).
  3. A third.

  Every other drill fades by 0.4 a month, half as much again on campaign, but never below half of what its kind of troops always know. A realm that pays for drill in a year lets its sergeants take the men 10 points further. That covers the release's "Drill the host" and 56-realm-inside's spending; those buy experience and quality, so the payment is not counted twice.
- **The player drills.**
  - An officer drills his own share of his division in the release's drill yard.
  - A general's whole army drills the focus he sets there, faster with a better command skill.
- **The report says it in words** (wrapping `A.aarBuild` when 23-after-action is built). Examples:
  - "Their lances broke on a hard-drilled hedge: +34%."
  - "Their wedge went through your line, which had not drilled to stand: −29%."
  - "Your foot had never drilled a wall against horse, and met the charge in a crowd."

  The figure is the tactic's own cause from 23's report.
- **On screen** (`view.core.js`):
  - Each wing's tactic menu says how well each option is drilled ("Shield Wall · drilled 62"), and under it which formations it never drilled and why they are missing.
  - The drill yard shows what each drill opens, on the line and in the field, at what strength. For a general, it also shows his army's divisions with their two best drills.
  - The war room marks standing orders the troops have not drilled.

**Measured by.**

`calibrate.mjs` changes only the drill: the same troops, the same seed, the same odds.

Line battles, 200 hand-set fights per arm, in five blocks of 40 (the range is the spread over blocks):

| Counter | Win rate | Their own dead | Enemy dead |
| --- | --- | --- | --- |
| Shield wall vs couched lance: drilled (70) against never drilled (5; the wall is not offered, they hold) | 66% vs 47%: **+19** (15 to 22) | **−32%** (−33 to −30) | +6% |
| The same wall, drilled (70) against ordinary drill (40, the release's strength) | +10 (7 to 13) | −13% | +8% |
| Ordinary drill against the release | +6 | −6% | +7% |
| Pike hedge vs lance: drilled against never drilled | 42% vs 13%: **+30** (28 to 30) | −41% | +46% |
| Pike hedge: drilled against the release | +18 (15 to 20) | −15% | +26% |
| Wedge of heavy horse into foot that never drilled to stand (5) against foot that did (40) | +7 (3 to 13) | −9% | +15% |
| Skirmish screen vs a slow block: drilled against never drilled | +18 (15 to 20) | −13% | +34% |

War map, real fights frozen at their start (`bench/rankfx-lab.mjs`, as 44-rank-battles measured War 1). Every division on the player's side is set to one drill level, then the fight is run out:

| Drill of our side | Never (5) | Ordinary (40) | Drilled (70) |
| --- | --- | --- | --- |
| Fights won, of 80 | 43% | 54% | 56% |

That is a **13-point swing**. A first version that only scaled the tactics' multipliers moved 3 points over 40 fights: organisation decides a map fight, so the formation drill now acts on it.

`test.mjs`:

| Test | Result |
| --- | --- |
| `drillWallVsCharge` | 100 seeded fights: the drilled wall wins 64%, half-drilled 45%, never drilled 45% (+19 points); spearmen dead 206 / 260 / 297 (−31%). Every block of 20 points the same way (+15 to +25 points, −29% to −33%) |
| `drillGate` | Never drilled, the centre is offered hold, advance and rally. Drilled, it is also offered the walls, stakes, volleys and withdrawal. The player's order for a shield wall is refused. In 40 AI deployments, 0 units go on drill-gated tactics when undrilled and 168 to 175 when drilled. Map defences: never drilled loses spear wall, shield wall and elastic defence |
| `drillMonthInCamp` | 209 divisions start with no record and read their kind's default. A foot division's shield walls go 0.42 → 0.58 in two years in camp, and its charge fades 0.12 → 0.06. A bold and a cautious general drill the same division differently (with 38-orders) |
| `drillSaves` | A save keeps every record exactly. In an old save without `d.dr` and `u.dl`, a battle is ungated (the release's behaviour), and a division reads its default and has a record after a year |
| `drillReportSaysIt` | 12 of 12 reports say "Their lances broke on a hard-drilled hedge", 12 with the tactic's own figure. Raw foot get "met the charge in a crowd" (skipped without 23-after-action) |
| `drillOnScreen` | The battle menu shows tags and locks, the drill yard shows what each drill opens, and the war room marks undrilled orders. Drawing them changes neither the state nor the random stream; names are escaped |

All of this passes on a build of every feature, and on `--only=drill`, alongside the core suites. Run on the full build:

- the tests of 23-after-action, 36-sieges, 37-squad, 44-rank-battles and 01-replay (`renderRng`, `replayWithRender`) all pass;
- in 38-orders, `planIsVisible` fails with or without this feature.

The month hook takes 3.3 ms for 178 divisions.

**Rules kept.**
- **No new random draws.** The month's focus turns by the month and the division's id, not by a draw.
- **Drill only reads in battle.** `A.tfx`, the gate and the map scaling read the record; the month hook writes `d.dr`; nothing else does.
- **Rendering only reads**, and every value goes through `UI.esc`.
- **Old saves load.**
  - A division without `d.dr` reads a default made from its troops, and gets a record at the next month.
  - A battle unit without `u.dl` (an old save, or hand-built units like 23's tests) fights exactly as in the release.

**Limits.**
- **Line-battle units carry their side's drill.** The release builds line-battle units from a realm's mix of troops, not from divisions. So a side's drill is the men-weighted record of its divisions (of those really in the fight when a commander leads one from the war map), weighted per drill by the men it is for. A wing does not have its own.
- **The balk is morale and is not scored.** 23's report measures kills, so the horses' balking at a wall is told in the battle log but not in the figures.
- **Never drilled is a steep cliff for pikes.** Unlike the release, pikemen who never drilled the hedge just hold, so drilled pikes against never drilled is 30 points and −41% dead. Against the release's own pike hedge, the drill's share is 18 points and −15%.
- **The balance bench was not run here** (the coordinator runs it on the integrated build). Fighting changes for every soldier through the war map. I expect the soldier and officer paths' death and fame bands to move a little, and AI wars to swing toward realms whose doctrine fits their troops.
- **Not human-tested.** Whether the drill yard's "what it opens" list reads clearly to a player needs a playtest.
