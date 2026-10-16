# Market towns, and prices by the road

**Aspect:** Economy (Road to Ten, Economy 4; holds Economy 7) · **Kind:** system and 1 patch, on top of 45-economy (does nothing without it)

The plan's step is "more markets: every town with a market building, with prices that differ by distance", and its bar for the economy is that "playtesters can explain why a good is cheap in one place and dear in another." 45-economy gave each realm one stocked market at its capital and priced the provinces by a fixed rule: what a province makes was 15% cheaper, and everything else 2.5% dearer for each step from the capital. A province's goods never left it, and nothing moved inside a realm.

**What it does** (`markets.core.js`).

1. **Market towns.** Each realm has one to four of them. The capital always counts. After it come the realm's best-scoring provinces, judged by kind (city, market town, caravanserai), town size, development and a harbour. One town is added for every four provinces, starting from 1.5 (so two for small realms), and a lesser town never sits right next to another market. That makes **84 towns in 33 realms**: 31 capitals, 35 cities, 14 market towns, a caravanserai and 3 towns. Ten realms of one or two provinces have a single market. Every province belongs to the hinterland of the market town nearest it by road.
2. **Each town has its own store of every good.** Its hinterland's fields, mines and flocks feed it (45's production for each province). Its people eat from it, and so do the armies camped nearest it, and its workshops draw on it. The realm's store is the sum of its towns' stores (to within 0.45% after two years). So 45's month runs on the realm exactly as before, and this feature shares out among the towns what 45 made, used, built and carried. The realm's price is still 45's. A town's price is the realm's price times how the town's store stands against its own need, compared with the realm's (between ×0.55 and ×2.6).
3. **Carters and roads.** Each month, carters move goods between a realm's open towns wherever the price gap pays for the road. A load moves only far enough to bring the gap down to the carting cost, and half that much each month.
   - **Carting costs** 3% of the good's base price plus 2% a step. A step is 250 map units of road, and is longer over hills (×1.3), forest, marsh and mountains (up to ×1.8).
   - **By sea it is cheaper:** 3% plus 1% a step, between coastal towns within 2,400 units.
   - **The map has no rivers**, so there is no river rate.
   - **Bandits** take their expected share where the realm is unstable or the province restless, more on long roads. They take no dice, so the random stream is 45's. What they take is gone from the realm's store too.

   So prices settle into gradients: cheap where a good is made, dearer down the road by about what the carting costs.
4. **45's caravans run between towns.** A caravan leaves from the town with the most of the good to spare and arrives at the open town nearest it. Imports land at the border and the harbour, and they are dearer inland. The market card names the towns ("12 loads of wine in from Lucerna (Varenna)").
5. **War shows locally.** A besieged or occupied town is cut off:
   - its own fields bring 30% to market;
   - the rest of its hinterland sells at the nearest open town;
   - nothing is carted in or out, and no caravan arrives.

   It eats its store. Once its bread costs twice the capital's, the news says so once a year: "Bread in Ashah, under siege, costs 3 times what it does in …".
6. **The player trades at their nearest market town.** The market card is named for it, and its cheap/fair/dear column and stock word are the town's (patch `MT-MARKET-HERE`). Hovering over a good shows its stock in the town and in the realm.
   - **The five nearest market towns** are listed under the table, at home or across the border. Each shows the road (steps, days, by sea), the carting cost of a load, and the town's buy and sell price for any good the player picks.
   - **The player can travel to any of them with "Go".** The trip sells everything carried there and can bring a load back. It pays the carters for each load both ways, market dues at home (2%) or tolls abroad (as the release's runs), and initiative for the days.
   - **45's trade runs** now leave from the player's own town. Their carting is that road's, and never less than 45's road between capitals.
7. **A town sells what it has and pays for what it needs.**
   - **The player cannot buy more loads than the town holds.**
   - **Selling into a town fetches the price along the way from its store now to its store plus the loads sold.** For grain in a town that eats hundreds of loads a month, this is the release's slide or less. For pearls in a town whose rich buy a twentieth of a load a month, three loads fetch half of what the quote suggests.
   - **The trip planner and 45's run planner reckon the same way.**

   Building this found that 45's luxury trade paid on a quote that one load would wipe out. Pearls bought for 300 sold for 1,900 into a realm whose store was empty. That is why the bot in `noTradeLoop` reached 1.78× the estate on this build before the fix.
8. **Workshops** buy and sell at their own town's prices.

**Measured by** (`test.mjs`, on the economy + markets build unless noted).

| Test | Result |
| --- | --- |
| `mtTownsAddUp` | 84 market towns in 33 realms (1 town: 10 realms, 2: 6, 3: 6, 4: 11). Each realm's stock is its towns' sum to within 0.45% across 406 realm-goods |
| `mtGradient` | Three worlds, three years. Correlation of a town's price with the road steps to the nearest town that makes more than it uses: positive for all 10 goods, median **0.20** (fish 0.34, wool 0.33, horses 0.32, furs 0.26, salt 0.25; grain 0.05, timber 0.10). Four steps or more from the makers, against at them: median **×1.16** (wool ×1.33, fish ×1.32, salt ×1.17; grain ×1.01, since every province grows some) |
| `mtSiegeBread` | A town that grows a fraction of its bread, held under siege from May for six months, against the same town left alone. Its bread at the peak, against the capital's: **×2.72** vs ×1.07, **×4.19** vs ×2.09, **×3.21** vs ×0.94. All three made the news |
| `mtFamineLocal` | A failed harvest frozen in one realm, against an ordinary one. The dearest bread in each town (× base): POL-01 1.12–1.30 → 1.21–1.48; POL-14 1.31–1.83 → 1.49–1.98; POL-22 1.66–1.81 → 1.52–2.12. In POL-05 it went the other way (1.18–1.93 → 1.02–1.21): the failed year drew more caravans in |
| `mtTripMovesStock` | 10 wool bought at Northmoor take 10 from its store. Carried 1.1 steps to Kingsmere they add 10 there, for 6 suns of carting and 2 of dues |
| `mtCardPure` | The card names the town and lists the 5 nearest. Drawing it, the reasons and every trip plan draws no random number and leaves the state unchanged. There are no inline handlers |
| `mtSaveAndDeterminism` | The same seed gives the same towns and prices. A save round trip keeps them. A save without them loads, prices as 45's, and builds them at the next month. They add **34 KB of 1,306 KB** raw state, **8.8 KB of 185 KB** gzipped |
| `mtMonthCost` | Five years of one world: 45's month 14.3 ms, the market towns' 7.3 ms, so the economy costs **×1.51** of 45's. The machine was shared and loaded; other runs gave ×1.62 and ×1.67 (6.6 against 4.4 ms) |
| `mtNoTownLoop` | A greedy trader who also uses the town trips (12 and 11 of its trips went to market towns), against farms, five years: ×0.44 and ×0.28 of the estate |
| 45's tests | All 9 pass on this build: `econHolds` 93%, `famineTriplesGrain` ×3.2, `caravansPullPricesTogether` 0.94 → 0.32, `localPrices` (now the town's price against the capital town's: wool ×0.87 four steps out), `noTradeLoop` 1,018 and 260 against 1,160 |

`bench/exploit.mjs`, ten years on four seeds: EXPLOIT_RESULT

**Rules kept.**
- The month draws no random numbers. Bandits take an expected share, so the random stream is 45's. A player's trip draws its road mishap in the action, as the release's runs do.
- The market card, the reasons, the nearest towns and the trip plans only read. The road table and paths are caches of the map, and a memo of a road is checked against the two towns' owners.
- Every value in the card goes through `UI.esc`, and the actions use `data-a`/`data-c`.
- Old saves: `S.mt` is new. Without it, prices are 45's until the next month builds the towns from the realm's store. The towns are rebuilt whenever a province changes hands or a capital moves, and a town that stays keeps its store.
- Stores are kept short in the state: arrays in the order of `S.mt.K`, rounded to two significant places below 100 loads.

**Expected to move in the balance league** (not run here). Merchant `medianPeakCoin` will probably fall: a luxury load now fetches what the town can absorb, and towns sell no more than they hold. Artisan coin may move a little, since workshop income now comes from the town's prices. Peasant and soldier lives do not trade.

**Limits.**
- **Markets are chosen, not built.** The release has no market buildings, so "every town with a market building" is the capital plus the best-placed towns, cities and ports.
- **Carters move goods only inside a realm.** Between realms only 45's caravans do, and they still decide by the realms' prices and the road between capitals. A border town can be dear while the next realm's border town is cheap.
- **The cost of a month** is about 1.5–1.7× 45's alone, depending on how loaded the machine is (the plan asked for 1.5×). Most of it is the carters' search for the right load.
- **Occupied and besieged provinces** are read from the war's own fields (`occ`, `sgBy`). The war lifts a siege that no army keeps up, so the test keeps one up by hand.
- **The gradients are mild** (×1.16 four steps out) because carting is cheap against the value of most goods. Grain barely varies inside a realm, because every province grows some.
- **The player cannot move house to another market.** "Go" is a trip, and the player always comes home to sell.
