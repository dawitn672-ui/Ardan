# The living economy: goods, roads with distance, monies, and a trade life

**Aspect:** Economy and world (growth lane E, cycle 1: world review I1 and I3, lives review I4) · **Kind:** system (three `*.core.js`), 7 events (`roads.events.js`, prefix `tr_`), tests. Edits in 45-economy and 66-markets (listed below). No patches.

**Why.** The lore's world turns on trade: the Silk Road is a chain of hands 8,900 km long, the Nine Wells keep its secret, Taulen's paper money is failing. In the game, 45's caravans went from any market to any other at peace in one month: 1% of them ran more than 10,000 km, the far lands' goods (tea, jade, porcelain, paper, silver) did not exist, and silk did not move west. A merchant could do nothing with a fortune.

Everything here runs only on the **Great Continent**. A Known World game is unchanged: the same seed gives the same state hash and random stream with and without this feature (checked on three years of a Known World life).

## What it does

### 1. The far goods (`a-goods.core.js`)

- **Five new goods:** tea (50 suns a load), jade (350), porcelain (160), paper (40) and silver (150).
  - They are put into `GD.GOODS` when the far lands are installed (a wrap of `A.FAR.install`) and taken out for a Known World game.
  - Each far realm's lore exports and imports price them, as the release's `A.mktInit` does.
- **Where they are made:** `A.ECON.REGION` sets a weight per lore region code (`P.region` on every far province), on top of 45's weight by ground. The weights come from the regions' *Resources* in `far-lands-atlas.md`:
  - **tea:** the Southern Hills, the Ninefold Lakes, the Red Basin, the Delta and the Hill Country;
  - **jade:** the Southern Strand, the Jade Wall, the Swallowing Sand's riverbeds and the Mirror Rift;
  - **porcelain:** the Delta, the Southern Hills' kiln valleys and the Southern Coast;
  - **paper:** the Delta, Sokdal and the Southern Hills, plus Qadir's rag paper in the west.
- **The goods that already existed now come from where the lore puts them:**
  - **silk:** the Delta first;
  - **spices:** the Isles and the Rainwall;
  - **horses:** the Khagan's Grass and the Wide Grass;
  - **furs:** the Pines.
- **Silver** comes from the west: Highland's and Stonehold's mines, and a little from the Mirror Rift. The Southern Hills' "dearly guarded" silver is left out.
- **Who wants them:** `A.ECON.DEMAND_LAND` sets a share per land. The plateau and the grass drink tea, the Twin Rivers hoard silver, and the west pays most for silk and porcelain.
- **Resold, not made:** Velgrad and the Tusk Clans sell silk on. Their lore export ("silk re-sold from the east") no longer makes them silk producers (`A.ECON.RESOLD`).

### 2. Roads with distance (`b-roads.core.js`)

**The road graph.** It is rebuilt each year, or when a realm rises or falls. One hand reaches:
- realms whose land touches the merchant's own;
- open-sea ports within 2,400 km. A far "coast" on a lake or an inland sea is not a port, and no ship sails between the Known World and the Far Lands;
- realms up to 3,000 km along one of the lore's routes (99's `D.routes`: 58 strands).

**Trips.** A market's merchants send goods to any market within 8 hands and 16,000 km, by the fastest way. Each relay counts as 75 days when the way is chosen, so a merchant would rather pay one broker than three.

**What a load costs by the time it arrives** (`A.TRADE.cost`):
- each hand's carting (45's rates, a route at 99's 0.55);
- the tolls of the lore's chokepoints;
- 1.2% a month of interest on the money on the road;
- the next broker's tenth at every relay.

**The chokepoints** (`A.TRADE.CK`, 21 of the lore's 25):
- the Lantern Gate takes a tenth on silk and tea going west and a twentieth on silver going east;
- Ushivar's Weighing takes a twentieth;
- Kraoth takes a tenth on silk;
- Marast's Jade Gate takes a third of the jade;
- the Strait of Suraeng lets no silk pass west.

The toll goes to the holder's treasury.

**Time.** The goods are on the road for the road's days: 20 km a day by land, 35 by river and 90 by sea, plus a fortnight at each relay. While they travel they are out of both markets' stores. They are kept in `S.eco.way` and arrive at the market (66 puts them in the town). A market counts what is already on its way to it, and wants its normal store plus what it will use while the goods travel.

**Closures.** A road is shut:
- by war: any realm on the way at war with either end;
- by passes: the Red Saddle is shut December to March, and the Pilgrim Stair outside June to September;
- by the monsoon: a southern sea lane sails out on the north-east wind (November to March) and home on the south-west (June to September).

**Risks.** Cyclones take more from July to October, and bandits take more on long roads and where any realm on the way is unruly.

**The League's secret.** The Nine Wells' Cross-Desert Track is a hand only for the League's own caravans, and for a player the League has taken in (event `tr_nine_wells`).

**News with the goods.** A far line held by 09-scale waits as long as the brokers' letters take along the roads (`A.TRADE.newsDays`: 40 km a day and 20 days at each hand, at most 1,100 days). It says which way it came: "Word from the east, by way of Ozand: …". This is a wrap of `A.news` that re-dates 09's queued item; 09 is not edited.

### 3. Money (`a-goods.core.js`, `A.MONEY`)

**The lore's money table.** 21 coins, from the string, the half-note and the saddle bar to the ozani, the sealed purse, cowries and the cattle count. Each has its worth in suns (the hidden unit) and its kind.
- A realm takes its own coin from the lore, or else its land's.
- The Known World counts in suns.

**What crossing costs.**
- **The money-changers** (`A.MONEY.change(a, b)`): 2 in 100 from silver to silver, 3 for gold, 4 for bronze strings, notes and tin, and 6 where the money is goods.
- **Taulen's half-notes:** Taulen pays a quarter of what it owes a seller in half-notes, which pass at 60 in 100, so a seller loses a tenth (`A.MONEY.noteLoss`).

**Silver as carried coin.** Silver is a good, and the roads carry it. Over the third year of the measured world it costs 495 a load in Taulen and 87 at Highland and Stonehold. The lore's "a third more at Venshai" is the coin's premium; a commodity carried 10,000 km gains more.

**Display.** `A.MONEY.fmt(suns, rid)` writes a sum as "120 strings (about 240 suns)".

### 4. A trade life (`c-ventures.core.js`, `roads.events.js`)

**The long roads.** This block on the Holdings tab's market card lists, for each good the player carries, the two best markets the roads reach. Each row gives the hands, the months, the freight and what the goods would fetch. The row's tooltip gives the way, the sale before cuts and what the goods would fetch at home now. "Send" (`data-a="trSend"`) starts a **venture**:
- **Before it leaves**, the player pays the freight (carting, tolls and the brokers' tenths); the tolls go to the gates' holders.
- **On the road**, the goods take the trip's real time. At each hand the road may happen to them:
  - a scene: riders on the road, toll-men who want more, a shut pass, a war, a ship that missed the monsoon, or a night by one of 997's wild places;
  - or, without a scene, a loss of 5–20%.

  Every scene has a choice with a cost either way. A wait moves the arrival, a sale "where it stands" settles at the relay, and a lost check costs loads.
- **At the end**, the goods sell at that market down a slide. No load fetches more than the price the market's store would set once it holds them (`A.TRADE.fetch`, 45's scarcity rule). The sale pays the factor's tenth, the money-changers and the half-notes.
- **The money comes home** as a letter of credit, as slowly as letters travel (`pc.credits`). The log gives the gain or loss against the goods' worth at home and the freight.

**Limits.** At most 3 ventures are out at once. The League's track is cut 40 days shorter for a member.

## Measured

Before means the build without this feature, on the same seed and day. These are 20-year soaks of the Great Continent (seed 777, an Aldmark merchant kept alive), run with `/tmp/ardan/E/probe.cjs`. Prices are the last five years' averages.

**Silk along the Silk Road** (suns a load, averaged over all 20 years):

| Market | Before | After |
| --- | ---: | ---: |
| Taulen | 164 | 110 |
| Phelkar | 170 | 238 |
| Varinj | 423 | 356 |
| Ushivar | 495 | 379 |
| Ozand | 548 | 668 |
| Tusk Clans (Kraoth) | 138 | 460 |
| Velgrad | 296 | 590 |
| Ostra | 400 | 760 |

**The spread and the road:**

| | Before | After |
| --- | ---: | ---: |
| The west (Tusk, Velgrad, Ostra) against Taulen | ×1.70 (×2.25 over the last 5 years) | **×5.48** (×5.65) |
| Tea, Taulen to Ostra | (no tea) | 25 → 151 |
| Silver, Taulen and Ostra | (no silver) | 667 and 408 |
| A caravan's road | the distance between capitals, in one month; 1% over 10,000 km | **592 km a month by land**, 790 with sea legs; a trip at most 16,000 km |
| Venshai to Ozand | one month | **4 hands, 16 months, 8,538 km** (Phelkar, Varinj, Ushivar); Kraoth about 20 months (the lore says 22 to 26, with 3 to 5 hands) |
| Goods on the road at once | none | about 9,000 consignments, 350,000 loads; 6,200 of them on trips over 5,000 km; 3.7 hands each |

- **What fixed the gradient.** Before, Ushivar sat above Ozand and the Tusk Clans (Kraoth) below Taulen's own neighbour. After, silk rises at every hand but one: Ozand's tiny market sits above the Tusk Clans because its own silk is often late.
- **Merchant coin.** In the one merchant life of these soaks the peak was 108k before and 184k after. One life is not a measure; the balance league is below.
- **Far treasury growth over 20 years:** ×10.7 before and ×10.2 after; Taulen ×9.3 and ×7.6.
- **Ventures.** A Venshai merchant sending 6 loads of silk 2 hands to Varinj pays 675 suns of freight and waits 8 months.

**Treasuries (world review I3).** Far treasuries grow about ×10 over 20 years with and without this feature. **The cause is not in 45 or 66.**
- **The release's ledger.** Every AI realm gets 92% of its income less 3.2 suns a soldier a year. Taulen's 470,000 men cost it 14% of its income, where the lore says two thirds.
- **The starting treasuries.** The far realms start at about a quarter of a year's income.
- **56-realm-inside's ladder** spends down to a reserve and lets the coffers settle at 1.5 to 4 years of income.

So the ×10 is the convergence from a quarter-year purse to 56's steady state. The economy pays no money into treasuries except the tolls to the chokepoints' holders.

`A.TRADE.LEDGER` is the lore's far ledger, and `A.TRADE.ledgerYear(r)` returns what it would take from a crown in a year:
- the army at its lore share of revenue (Taulen two thirds, Hesh a half, Kethra 55%, Vahra 45%, the Khaganate 30%);
- the half-notes' fall of 2 in 100 a year on the share of a treasury held in notes.

It is off by default. With `A.TRADE.APPLY_LEDGER = true` (seed 777, 20 years, on the revision before the pipeline demand and the merged consignments):

| Treasury | Off | On |
| --- | ---: | ---: |
| Taulen | ×11.1 | **×5.3** (its army fell from 470k to 305k, so the crown paid by shrinking the host) |
| Hesh | ×10.1 | ×8.1 |
| Vahra | ×17.4 | ×16.2 |
| The far lands together | ×10.6 | ×8.9 |

**The hook for 56** (not made; lane L owns it). In `treasury.core.js`, where the crown's yearly book opens, add the ledger's army line to the upkeep:

```js
const lore = A.TRADE && A.TRADE.ledgerYear ? A.TRADE.ledgerYear(r) : null;   // up: … + (lore ? lore.army + lore.notes : 0)
```

Two other steps would bring the far realms nearer the lore:
- start each far realm at 56's reserve (1.5 years) rather than a quarter-year;
- read the reserve against spending rather than income.

## Tests (`test.mjs`)

| Test | What it checks |
| --- | --- |
| `trGoodsAndRoads` | The far goods are in on the Great Continent and out of the Known World. Tea comes from the Twin Rivers and silver from the west. Venshai to Ozand is at least 3 hands and 12 months. Land caravans go 400–800 km a month, and no trip is over `MAX_KM`. Silk in the west is at least 3 times Taulen's, and silver is dearer in Taulen than at the mines. A Known World game has no far goods, no roads and 45's caravans. |
| `trMoney` | The coins of Taulen, Ozand, the Khaganate, Aldmark and the Pines. The changers' cut between monies, and 0 within one. The half-notes' tenth. The coin formatting. |
| `trVenture` | The card offers sends. Drawing it draws no random number and changes no state. No inline handlers. A venture goes out, all six road scenes render without a raw token and work on it, it sells, and the letter of credit brings coin home. |
| `trOldSave` | A save with goods on the road round-trips. A save stripped to the release's shape loads and plays on: no `S.eco.way`, no ventures, and markets without the far goods. The far goods are filled in at the lore's price, and the roads start again. |

`lint-events`: 7 events, 0 errors. `lint-choices`: 0 obviously best; the 7 events' `fx` are functions, so it reads them as unreadable.

## Cost

- **The month.** On the shared, loaded machine (`TR.last` keeps the last month's timings), the roads' month (`TR.month`) is 150–350 ms against 45's caravans at about 350 ms, so about even. Building the graph and every market's trips is 0.6–1 s, once a year.
- **The state.** After 3 years, goods on the road add about 455 KB to 7.8 MB of raw state, and 110 KB to a 1.35 MB save (+8%). Consignments on one road that arrive close together travel as one.

## Edits outside the folder

These are both mine (lane E's folders), and both build alone.

**45-economy (`economy.core.js`):**
- **New tables,** empty unless a feature fills them: `E.REGION`, `E.DEMAND_LAND` and `E.RESOLD`. With them:
  - `landW` adds the region's weight;
  - `E.plan` walks `landKeys()`: 45's `E.LAND` keys first, in the same order, so a Known World plan sums the same goods in the same order;
  - `E.demand` multiplies the people's and the rich's use by `landWant` (1 with no table; a realm with no far land is `'W'`).
- **`E.fillGoods` and `E.init`.** A market made before a good existed gets it at its lore price and normal store, with no dice.
- **`E.caravans` hook.** It starts with `if (E.roadMode && E.roadMode()) return E.roadMonth();`.
- **`E.why` and `E.card`.** They read a caravan's `dep` and `arr` flags: a caravan is listed when it leaves and when it arrives. A caravan with neither flag did both in the month, as before. The card line adds "N months on the road".

**66-markets (`markets.core.js`).** In the month's caravan loop, a `dep` caravan only leaves its town and an `arr` caravan only reaches its town.

**Checked.** The default build (no work in progress) with and without these edits gives the same state hash and random stream after 3 years, in a Great Continent noble life and in a Known World one. The edits move nothing until 9995 is built in.

## Limits and next

- **Ozand and the oasis markets have tiny demand.** Their prices swing to the ceiling when their goods are late. Broker cities should hold an entrepôt stock for the onward trade, not only their own use.
- **NPC merchants are still traffic.** A next step is named caravans the player can join, rob or hire, using `S.eco.way` and the trips.
- **The coin name is shown only on the long-roads card.** Writing every purse in the realm's coin (world review I4) can use `A.MONEY.fmt`.
- **Ventures go from the player's home market only.** Leading a caravan yourself (a journey through 997's sites and the chokepoints, week by week) is the natural sequel.
- **The Pearl Meeting (TR-41)** is not a road. No ship sails between the Known World and the Far Lands.
