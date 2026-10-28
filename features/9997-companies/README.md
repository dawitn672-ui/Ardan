# Companies: war to the last unit

**Aspect:** War (backtests item 2, `docs/research/backtests.md`, "Priority design 2") · **Kind:** system (4 core files), 13 events (`co_`), no patches · **Lane:** WD

The owner asked for "detailed wars done to the last unit". The release's war map already fights with divisions of battalions (`GD.BN`), but a battalion was an anonymous code in a template, the line battle made up its own armies from realm shares, morale reset each battle, supply was a ratio, and an order landed the moment it was given. This feature gives every battalion in the world state of its own and builds the line battle from it.

## The fidelity decision: every battalion everywhere, no level of detail

The backtest proposed full state for battalions everywhere but named captains only in the player's theatre, because captains as persons would be about 36,000 people (36 MB). The owner's standing rule is one coherent world at full fidelity with no level of detail, so this feature does not restrict by distance. It changes the representation instead:

- **Companies are arrays inside a battalion record.** `d.bs[i] = { c, o, h, k: [men ×4], q: [morale ×4], x, wd, … }`. A battalion of four companies is a handful of numbers, not four objects.
- **A captain is a seed.** Slots 0–3 are the companies' captains and slot 4 is the battalion's senior captain (M07, "a wing of four companies"). His name, byname, command (22–66) and temper (bold, cautious, cunning or steady) are a pure function of the seed (`CO.fromSeed`), so the same man appears in every view and every replay, at no cost in the save. A seed is stored only when it changes (`cs`), for example when a serjeant takes over.
- **A captain becomes a full person only when he matters** (`CO.person`, through `A.newPerson`): your own company's captain and your senior captain, and a new captain who takes your company. People made this way keep living like anyone else.

Measured (`coEveryBattalion`, one year of play from a new game):

| World | Divisions | Battalion records | Companies | Captains | Made people | Battalion state | Whole state |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Known World | 197 | 1,791 | 6,225 | 7,703 | 0 | 188 KB | 2,152 KB |
| Great Continent | 852 | 7,048 | 24,544 | 30,376 | 2 | 673 KB | 7,524 KB |

So 30,376 named captains with commands and tempers cost 673 KB in all on the Great Continent, against the backtest's 36 MB estimate for persons. That is under the backtest's band of 1 MB of save growth.

## State

```js
d.bs   = [ { c: 'SP', o: 3, h: provId, k: [200, 198, 201, 199], q: [62, 60, 64, 61], x: 18.2, wd: 40,
             cs?: { slot: seed }, p?: { slot: personId }, st?: [sat ×5], hon?: [[name, year]], nw?: 1, ret?: 1, vac?: 1, nm?: n } ]
d.mo   = 61.4    // men-weighted mean morale (kept with the companies; the war map reads it)
d.food = 14      // days of bread, 0..30 (40 with a baggage train)
d.pay  = 0       // months in arrears
d.coCredit       // men the line battle already killed, which the map fight's next days take first
a.orderQ = [ { k, arg, sent, arrive } ]   // orders on the road
r.ofc  = { cmd, n }                        // the realm's officer corps: mean command of its captains, yearly
r.forces.coN     // battalion ordinals by troop and home
pc.mil.co = { div, b, i }                  // your company
S.coOn, S.coRet (retired names), S.coForY (forage records), P.coDes (deserters by home province)
```

- `d.men`, `d.org` and `d.exp` stay authoritative for the war map. **Every loss of men goes through `A.divLose` and every gain through `A.divRefill`**, both wrapped, so the companies always sum to `d.men`. A monthly check (`CO.ensure`) settles any write that went round them and counts it (`CO.stats.mismatch`: 0 in every run so far).
- The records are parallel to the template's battalions and then its support companies (sappers, outriders and so on, one company each). A template change rebuilds them, keeping records of the same troop.
- Everything is optional: an old save builds its battalions at the first month (`coSaveLoad`).

## What it does

**Names.** "3rd Kingsmere Spears": ordinal, home province and troop, with the ordinal counted per realm, troop and home. Support companies are named for their division ("Sappers of the 1st Aldmark Line"). A company is "2nd Company, 3rd Kingsmere Spears", or "Oswin's Hundred" in cultures whose commoners take a clan, patron, band or deed name. Captains are "Nessa of Kingsmere", "Oswy Shepherd" (a home or neighbouring village, or a trade, from `GD.TRADE_NAMES`).

**Losses fall on companies** (wrap of `A.divLose`, inside the fight day). The battalions in line take 70% of the day's losses and the rest 30%; within each group, the split is by men, by largest remainder, with no dice. The line is the first half of the division's battalions, foot first, then beasts, horse and missiles; support companies are never in it. A third of the fight's dead are wounded (`wd`). They come back over 30 days in supply, or at once at peace, but only into the gap below the template. Small losses from sickness and winter come from the fullest companies.

**Morale with its parts** (`CO.restOne`; the tooltip `coMo` lists them):

| Part | Value |
| --- | --- |
| Base | 50 |
| Experience | x / 5 |
| Drill of its kind (60's record: shields for foot, the charge for horse, weapons for missiles) | 0.1 × drill |
| Captains | (mean of company and senior captain's command − 40) / 4 |
| A bold captain | +5 |
| Pay in arrears | −5 a month, at most −20 |
| No bread | −10 |
| Fighting at home | +5 |

- In a fight a company loses 0.3 morale per 1% of its men lost that day; the beaten side loses 15 more at the fight's end.
- Out of the fight, morale comes back 5 a day towards rest (down 1 a day if above it). At peace it settles at the month.
- **On the war map:** `A.divMaxOrg` × (0.85 + 0.3 × mean morale / 100), which is ±15% on the organisation cap. At the typical resting morale of 60–65, that is +3 to +5%.

**Bread, pay and desertion.**

- **Bread.** A division at war eats a day of bread a day, and its supply refills 2 × the supply ratio a day. It is capped at 30 days, or 40 with a baggage train (`GD.SUP.train`, new: 60 men, march −10%).
  - The backtest's formula (0.5 × sr × 2) would never refill a stock at full supply, so the refill is doubled. At full supply the stock grows a day a day, at half supply it holds, and cut off it falls a day a day.
- **Foraging.** Under 5 days, a division forages at most every 10 days: +3 days, and +5 unrest on its province. The first time in a year in each province it is written in 57's chronicle (kind `forage`), and the player's division gets `co_forage`.
- **Hunger.** At 0 bread, morale falls 2 a day and 0.5% of the men desert each day. Deserters are counted to their home province (`P.coDes`). The player gets `co_hungry_march`, then `co_desert` (a named comrade from 37 asks you to go with him).
- **Pay.** A realm in debt (treasury below 0) puts every division a month further in arrears; a paid month clears them. Sellswords (56's `d.riMerc`) two months unpaid march off.

**Captains with wants** (satisfaction −100..100, kept only when non-zero):

- +10 for a won fight of 3,000 men or more, −10 for each month of arrears, +15 for a promotion, −20 when passed over by a man of less command.
- Once a year, +5 under a general of his own temper, −10 under his opposite (bold against cautious).
- It fades 5% a month.
- At −50 a captain leaves. In peace he asks for a transfer (`co_transfer_request` if it is your battalion), and his serjeant takes over. In a war against rebels he takes his company over to the other side: its men go to their levy (`co_turncoat`, or 57 kind `turn`).
- **Promotion.** When a senior captain falls or leaves, the post stays vacant until the New Year. Then, in a realm at war, the best captain of the division by merit (command + satisfaction / 5) takes it, and better men passed over lose 20 (`co_passed_over` if that is you).

**Captains in danger.** At a fight's end, a battalion that lost a quarter or more puts each of its company captains at risk: 3%, or 13% if his side was beaten. In the line battle, a unit that lost a quarter, or routed on the losing side, puts its own captain at the same risk. A fallen captain is replaced by the better of his two serjeants, who is a seed of his own ("Serjeant Ivo takes the company", in the log and the battle log). If it is your company, the serjeant is made a person and `co_new_captain` comes.

**Honours.** A battalion that won or held a named fight (9,000 men or three days) and lost 25% or more earns "Battle of X, year" (at most 8). Yours gets `co_honour` and a record in 57's chronicle (kind `honour`). Small seals on its row show them.

**Retirement.** A battalion below 10% of its men after a fight is struck off: its name goes to `S.coRet`, and when it has half its men again it is "the new 3rd Kingsmere Spears", with new captains and no honours (`co_old_company`). The template, which the war map fights with, is unchanged. A destroyed division's names go to `S.coRet` too.

**Recruits.** New men go to the most depleted battalion first, and dilute its experience: x′ = (x·m + 5·Δ)/(m + Δ). An elite division keeps the release's 8% refill (it is the same `A.divRefill`). Men raised away from a battalion's home count as new; when they are half its men, its home moves.

## The line battle built from the real division

An officer's tactical battle (rank 4–6, the release's "Lead your men in the fight") for a war-map fight now fights that fight's divisions (`A.newBattle` and `A.buildUnits` wrapped; `A._battlePlace` names the fight, so no patch is needed):

- **Your battalion** fights as its four companies, under their captains. Every other battalion of your division fights as one unit under its senior captain. Other divisions are grouped as one unit per troop type ("Spears (18 battalions)"), at most 8 groups a side.
- **Each unit carries:**
  - its men from state (beasts as the release counts them: an elephant for 15 men, a giant for 60);
  - morale + 20, on the release's scale;
  - quality 0.8 + x/250 + 0.1 × drill;
  - its division's real drill (`u.dl`, so 60's gates and counters read the real men);
  - its captain (`u.cap`) and its sources (`u.src`).
- **Wings:** horse to the flanks, foot across the line, your companies in the centre, and 30% of the best other foot in reserve (the reserve's sources are split with it).
- **Folding back** (`CO.fold`, at `A.battleFinish`):
  - each unit's dead return to exactly the companies they came from, a third of them wounded;
  - morale comes back from the battle's end value;
  - the dead are added to the map fight's count;
  - `d.coCredit` makes the map fight's next days take their losses from that credit first, so the dead are recorded once (`coBattleFromDivision`: 1,342 dead in the battle, 1,342 men gone from the divisions, credit 1,342 → 848 after the next map day).
- 44's `A.RANKFX` still moves the map fight by the battle's result, as before.
- **23's report cites units:** "The 2nd Company, 1st Briarbrook Spears held under Captain Oswy Shepherd (lost 0 of 194)."

**Formations, gated by drill** (`GD.FORMATIONS`, data; a unit has `u.form` beside the release's `u.tac`). Effects are read through `A.tfx`, so 23's and 60's machinery sees them, and they scale with drill exactly as 60 scales tactics (55% at 15, 100% at 40, 130% at 100):

| Shape | Who | Frontage | vs missiles | vs horse | Attack | Speed | Drill (≥15) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Line | all foot | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | none |
| Shield wall | SP HI MR GA | 0.9 | 1.35 | 1.2 | 0.8 | 0.5 | shield walls |
| Hedge | PK SP | 0.8 | 0.9 | 1.6 | 0.9 | 0.4 | shield walls |
| Loose | missiles, LI SL SC | 1.3 | 1.4 | 0.6 | 0.9 | 1.2 | skirmish |
| Wedge | HC HI AX MC | 0.6 | 0.9 | 0.9 | 1.4 (first push) | 1.1 | wedge and charge |
| Column | all (before the lines meet) | 0.4 | 0.7 | 0.7 | 0.8 | 1.5 | marches |
| Ring | all | 0.7 | 1.1 | 1.3 | 0.7 | 0 (does not advance) | formation |

These map onto the engine as follows:
- vs missiles → `missileDef`;
- vs horse → `def`, by the horse share of the men it is fighting;
- attack × (0.8 + 0.2 × frontage) → `att`;
- the ring → `flank` ÷ 1.3 and `noAdvance`.

A shape the men never drilled is not offered, and the menu says why ("never drilled (marches 14)").

**Orders to exactly the units your rank commands** (journal commands `A.coOrder`, `A.coForm`, `A.coFollow`):

| Rank | Commands | Orders |
| --- | --- | --- |
| 4–5 Captain | your company | shape · hold · advance · charge · withdraw · rally, each pulse |
| 6 Senior Captain | your battalion's four companies | the same, per company, plus "follow me" (an order to one goes to all four) |
| 7+ | wings | the release's |

- Below rank 7, the release's wing menus are shown but disabled, the reserve is the general's, and `A.battleSetTactic` changes only the units you command.
- Units you do not command move on the AI's wing orders and their captains' tempers. A bold captain charges a shaken line without orders (15% a pulse); a cautious one pulls his men back in order at morale 35, not 15. Each captain picks his shape by temper and by what is in front of him: a ring when flanked, a hedge or wall against horse, a wedge if bold, loose order for missiles.
- **Intents** (`u.next`). The enemy's next pulse is chosen at the end of the pulse before, and the pulse does not choose again (`coIntents`: 35 of 35 intents shown were the moves made, with 0 chosen again). The panel lists them; lane G can draw them as arrows. `CO.unitInfo(B, u)` gives the screen everything about a unit: name, captain, temper, morale, shape, order, next move, and whether you command it.

## Orders by courier

`A.wsSetOrder` is wrapped. An order the player gives an army rides at 60 km a day from where he is (his division, else his home) to the army's centre: ×1.5 when the centre stands in hills, forest, marsh or mountains, and ×0.7 with scouts in the army. It goes into `a.orderQ` and lands at the start of the war day it arrives (`CO.courierDay`, from the `A.wsDay` wrap). An order sent while one is in flight lands after it. A general with his army, and an army with no distance to cover, still order at once. The army row in the war room says "orders on the road: they reach the army in 3 days", and the reply says how far the courier rides.

- 300 km of open country takes 5 days, or 3.5 with scouts, which lands on day 4 of the war clock (`coCourier`).
- **Calibration, measured, not forced.** The backtest wanted the median delay to match a steady AI general's 3-tick thinking. From the capitals of the Known World's realms at war to their armies, the median is 1.2 days. Slowing the courier to 24 km a day to reach 3 days would break the 300 km = 5 days rule, so I kept the honest speed. The player is never slower than the AI's thinking, only honest about distance.

## On screen (`d-view.core.js`)

- **Order of battle** under a division in the war room (`UI.wrDivPanel`):
  - its bread, pay and morale;
  - a row per battalion: name, honours as seals, senior captain, a men bar, a morale bar (tooltip with every part), experience and wounded;
  - for your battalion, its four companies with their captains.
- **Your company** card, in the war room (`UI.wrMyDivCard`) and the Path tab (`UI.armyPathCard`):
  - the captain, his temper and command, and the senior captain;
  - your serjeant and the three comrades beside you (37);
  - the rest as counts: fit, hurt, dead, deserted;
  - morale, bread, pay and honours.
- **The battle's "Your command" panel:** your units, each with its order buttons and its shape menu (shapes not drilled are greyed, with the reason), "follow me" for a senior captain, and the enemy's next moves.
- Tooltips `coMo` (morale parts) and `coCap` (a captain: command, temper, mood). Everything goes through `UI.esc` and nothing is drawn from the random stream.

## Events (`co.events.js`, 13)

- **Queued by the engine:** `co_new_captain`, `co_passed_over`, `co_transfer_request`, `co_turncoat`, `co_forage`, `co_hungry_march`, `co_desert`, `co_honour`.
- **From what your company is:** `co_arrears` (2 months unpaid), `co_mutiny_talk` (3), `co_the_new_men` (150 new men), `co_serjeant` (a 37 veteran can be made serjeant), `co_old_company` (your battalion is "the new" one).
- All are gated on `C.soldier`, and never reach a peasant.
- Effect key `coy` (declared in `A.FX_EXTRA`): `{ mo, sat, food, men, wd }` on your own company.
- `tools/lint-events.mjs` reports 0 errors. `tools/lint-choices.mjs` finds 0 obviously best choices.

## Hooks (all wraps in this folder; no patches, no edits elsewhere)

- **Engine:** `A.divLose` (twice: the split, then the line battle's credit), `A.divRefill`, `A.newDiv`, `A.divRemove`, `A.fightDay`, `A.fightEnd`, `A.divMaxOrg`, `A.wsDay`, `A.wsSetOrder`, `A.newGame`, `A.enlist`, `A.applyFx`.
- **The line battle:** `A.newBattle`, `A.buildUnits`, `A.tfx`, `A.wingClash`, `A.aiPulse`, `A.battleStep`, `A.battleSetTactic`, `A.battleCommitReserve`, `A.battleFinish`.
- **Screens:** `UI.wrDivPanel`, `UI.wrMyDivCard`, `UI.armyPathCard`, `UI.wrArmyRow`, `UI.battleModalBasic`.
- **Registries:** `A.onMonth`, `A.COMMANDS`, `UI.A.coOrd`, `UI.C.coForm` and `UI.C.coFollow`, `UI.TIPS.coMo` and `UI.TIPS.coCap`, `GD.SUP.train`, and `A.WC.KINDS` honour, forage and turn.

## Tests (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `coEveryBattalion` | Both worlds, a year: every division has records in step with `d.men`; at least four captains a battalion; the counts and sizes above |
| `coMoraleParts` | The parts sum to the value. The tooltip draws purely. A hungry, unpaid, green battalion under a poor captain away from home rests at 21.4 (≤ 35); a fed, paid veteran one under a bold good captain at home at 87.5 (≥ 75) |
| `coFoodRunsOut` | Cut off: bread 3 2 1 0, morale falls, men desert (361 in 12 days of 7,462), it forages (unrest +5, a chronicle record) |
| `coBattleFromDivision` | The units hold exactly the fighting battalions' men (25,431 / 2,052); your battalion is 4 companies under named captains; the dead are counted once; the report cites your companies |
| `coOrdersByRank` | Rank 4 commands 1 unit, rank 6 commands 4. Orders to other units are refused, and the wing menu leaves them alone. Walls and hedges are withheld at drill 5 and offered at 70. The panel draws purely |
| `coIntents` | Intents shown are the moves made |
| `coCaptainDies` | A captain who is a person dies in `A.P`, a serjeant takes the company, the log says so, and `co_new_captain` is queued |
| `coCourier` | 5 and 3.5 days for 300 km; the order lands on its day; the median from capitals |
| `coSaveLoad` | A round trip; an old save with no battalions draws purely and builds them at the month |
| `coScreens` | Order of battle, company card and Path tab draw; a captain named `<img data-pwn>` shows as text; drawing changes nothing |

## Limits

- **Far templates use the Known World's naming.** 991's words ("Second Thousand of the Left Wing") are not used for battalions yet.
- **Grain from real stocks is not drawn.** Foraging raises unrest and writes the record, but 66 has no public write to a town's grain, so the town's stock is not reduced.
- **23 does not score formations as causes.** The report names your companies' shapes in the unit lines, but formations get no percentage of their own.
- **The column's speed only matters before the lines meet.** The war map's march does not read it.
- **The courier's median does not match the AI's 3 ticks** (see above).
- **The council office part of satisfaction** waits for 9996-polity.
- **The officer's line battle is the whole fight.** It can be far larger than the release's made-up battle (25,000 against 2,000 in a test), so a captain's company is a small part of the field. That is the point of "to the last unit". Whether it reads well needs a human eye.
