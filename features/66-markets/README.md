# Market towns, and prices by the road

**Aspect:** Economy (Road to Ten, Economy 4; holds Economy 7) · **Kind:** system and 1 patch, on top of 45-economy (does nothing without it)

The plan's step is "more markets: every town with a market building, with prices that differ by distance", and its bar for the economy is that "playtesters can explain why a good is cheap in one place and dear in another." 45-economy gave each realm one stocked market at its capital and priced the provinces by a fixed rule: what a province makes was 15% cheaper, and everything else 2.5% dearer for each step from the capital. A province's goods never left it, and nothing moved inside a realm.

**What it does** (`markets.core.js`).

1. **Market towns.** Each realm has one to four of them. The capital always counts. After it come the realm's best-scoring provinces, judged by kind (city, market town, caravanserai), town size, development and a harbour. One town is added for every four provinces, starting from 1.5 (so two for small realms), and a lesser town never sits right next to another market. That makes **86 towns in 33 realms**: 31 capitals, 36 cities, 15 market towns, a caravanserai and 3 towns. On the full build it is 88 towns in 34 realms. Ten realms of one province have a single market. Every province belongs to the hinterland of the market town nearest it by road.
2. **Each town has its own store of every good.** Its hinterland's fields, mines and flocks feed it (45's production for each province). Its people eat from it, and so do the armies camped nearest it, and its workshops draw on it. The realm's store is the sum of its towns' stores (to within 0.5% after two years). So 45's month runs on the realm as before, and this feature shares out among the towns what 45 made, used, built and carried. The realm's price is still 45's. A town's price is the realm's price times how the town's store stands against its own need, compared with the realm's (between ×0.55 and ×2.6).
3. **Carters and roads.** Each month, carters move goods between a realm's open towns wherever the price gap pays for the road. A move brings the gap down to the carting cost: nine tenths of the way each month, or all the town can spare when even that would not close it.
   - **A load's carting** is 3% of the good's base price plus 2% a step. It is never less than 0.2 suns plus 0.2 a step, because a mule eats the same whatever it carries, so grain (worth 4) and timber are dear to cart and pearls are not. A step is 250 map units of road, longer over hills (×1.3), forest, marsh and mountains (up to ×1.8).
   - **By sea it is cheaper:** 3% plus 1% a step, between coastal towns within 2,400 units.
   - **The map has no rivers**, so there is no river rate.
   - **Bandits** take their expected share where the realm is unstable or the province restless, more on long roads. They roll no dice, so the month draws no random numbers. What they take is gone from the realm's store too.
4. **45's caravans run between towns.**
   - A caravan leaves from the town with the most of the good to spare. It goes to the town where the good fetches most after the road.
   - The market card names the towns ("12 loads of wine in from Lucerna (Varenna)").
   - **More markets, more merchants.** A realm now sends up to 40 caravans a month, where 45 allowed 20. 45's cap had left its best gap open. On the full build without this feature, cloth averaged 0.45× its base price in Varenna over five years, against 1.53–1.69× in Aldmark and Solenne. With 40 caravans it is 0.48–0.56× against 0.96–1.07×, and caravans go from about 350 a month to about 375.
5. **War shows locally.** A besieged or occupied town is cut off:
   - its own fields bring 30% to market;
   - the rest of its hinterland sells at the nearest open town;
   - nothing is carted in or out, and no caravan arrives.

   It eats its store. Once its bread costs twice the capital's, the news says so once a year: "Bread in Ashah, under siege, costs 3 times what it does in …".
6. **The player trades at their nearest market town.** The market card is named for it, and its cheap/fair/dear column and stock word are the town's (patch `MT-MARKET-HERE`). Hovering over a good shows its stock in the town and in the realm.
   - **The five nearest market towns** are listed under the table, at home or across the border. Each shows the road (steps, days, by sea), the carting cost of a load, and the town's buy and sell price for any good the player picks.
   - **The player can travel to any of them with "Go".** The trip sells everything carried there and can bring a load back. It pays the carters for each load both ways, market dues at home (2%) or tolls abroad (as the release's runs), and initiative for the days. Abroad, the carting is never less than 45's road between the two realms, so a border town is no back door into a gap the caravans have not closed.
   - **45's trade runs** now leave from the player's own town. Their carting is that road's, and never less than 45's road between capitals.
7. **A town sells what it has and pays for what it needs.**
   - **The player cannot buy more loads than the town holds.**
   - **Each load moves a town's price by its own share of the realm's need:** the square root of the share, and never less than 0.7 of the realm's depth.
   - **Selling into a town fetches the price along the way from its store now to its store plus the loads sold.** No load fetches less than the release's floor of three tenths of the quote. For grain in a town that eats hundreds of loads a month, this is the release's slide or less. One load of pearls into a town whose rich buy a twentieth of a load a month fetches what that town will pay.
   - **The trip planner and 45's run planner reckon the same way.**
8. **Workshops** buy and sell at their own town's prices.

**What building it found.**
- **45's luxury trade paid on a quote that one load would wipe out.** Pearls bought for 300 sold for 1,900 into a realm whose store was empty. On an early version of this build, that took `noTradeLoop`'s bot to 1.78× the estate. Selling along the town's own store (item 7) closed it.
- **Carters who close half the gap a month leave a producing town holding twice its month's output.** Prices then ran well past the carting cost, and a cloth trader from Varenna reached 2.7× the estate. Closing nine tenths, or all a town can spare, keeps gaps at the carting cost.
- **A town on the border reaches 45's standing gaps more cheaply than a capital does.** Venina is Varenna's weaving town, holding 9 months of cloth at 33 a load. A short road from it reached Solenne at 100–130 a load, and a trader there made 8× the estate in five years. The 40-caravan cap and the abroad carting floor (items 4 and 6) closed that.
- **`bench/exploit.mjs` counts the merchant career's pay as trading.** The bot starts without a job, but events hand it a guild place. Its merit comes from its runs, and at rank 4 the wage is about 20,000 suns a year. Two runs on this build read 41.7× and 26.8× the estate. In both, the trades themselves had lost money (−5,148 and +116 over ten years). Run with the job dropped every month, the same seeds read 0.22×. The bench is not this feature's to change, and it needs a human or the coordinator to decide.

**Measured by** (`test.mjs`, on the economy + markets build; the full build in brackets where it differs).

| Test | Result |
| --- | --- |
| `mtTownsAddUp` | 86 market towns in 33 realms (realms with 1 town: 10, 2: 5, 3: 6, 4: 12) [88 in 34]. Each realm's stock is its towns' sum to within 0.49% across 424 realm-goods |
| `mtGradient` | Three worlds, averaged month by month over the third year. Correlation of a town's price with the road steps to the nearest town that makes more than it uses: positive for all 10 goods, median **0.27** (wine 0.57, timber 0.29, fish 0.28, furs 0.28; grain 0.13, iron 0.14) [0.15, all 10 positive]. Four steps or more from the makers, against at them: median **×1.06** (wine ×1.15, fish ×1.09, timber ×1.09; grain ×1.01) [×1.05] |
| `mtSiegeBread` | A town that grows a fraction of its own bread, held under siege from spring for eight months, against the same town left alone. Its bread at the peak, against the capital's: **×3.21** vs ×1.15, **×2.80** vs ×1.11, **×3.29** vs ×1.36. All three made the news |
| `mtFamineLocal` | A failed harvest frozen in one realm, against an ordinary one. The dearest bread in each of its four towns, × base: POL-05 1.11–1.23 → 1.37–1.45; POL-14 1.60–1.76 → 1.61–2.06; POL-22 1.77–2.05 → 1.87–2.14; POL-01 1.08–1.30 → 1.02–1.24. The famine is 45's (the realm's store); in POL-01 the failed year drew more caravans in |
| `mtTripMovesStock` | 10 wool bought at Northmoor take 10 from its store. Carried 1.1 steps to Kingsmere, they add 10 there, for 6 suns of carting and 2 of dues |
| `mtCardPure` | The card names the town and lists the 5 nearest. Drawing it, the reasons and every trip plan draws no random number and leaves the state unchanged. There are no inline handlers |
| `mtSaveAndDeterminism` | The same seed gives the same towns and prices. A save round trip keeps them. A save without them loads, prices as 45's, and builds them at the next month. They add **33 KB of 1,264 KB** raw state, **8.1 KB of 176 KB** gzipped [34 KB of 1,877; 8.4 KB of 283] |
| `mtMonthCost` | Five years of one world: 45's month 5.8 ms, the market towns' 4.8 ms, so the economy costs **×1.82** of 45's [6.2 against 4.6 ms, ×1.75]. Over ten years of a single profiled run it was 7.2 against 4.6 ms (×1.63). The machine was shared by several agents |
| `mtNoTownLoop` | A greedy trader on the market-town trips alone (the five nearest towns, the best load home), against farms, five years, four seeds: ×0.81, ×0.29, ×0.31, ×0.49, mean **×0.47** [mean ×0.27]. The bar is the mean, because a loop pays on every seed and a shortage pays once |
| 45's tests | All 9 pass on both builds: `econHolds` 93% [92%], `famineTriplesGrain` ×3.57 [×3.46], `warMakesArmsDear`, `caravansPullPricesTogether` 0.94 → 0.32 [0.24], `localPrices` (now the town's price against the capital town's), `playerMovesStock`, `workshopsPayTheSpread`, `marketTableSaysWhy`, `noTradeLoop` 356 and 260 against 1,160 [317 and 260] |

**The exploit bound.**

| Run (the trader's wealth against the estate's) | Without this feature | With it |
| --- | --- | --- |
| `bench/exploit.mjs`, ten years, four seeds, full build | worst ×1.09 | **worst ×0.28** (0.22, 0.28, 0.22, 0.10) |
| `bench/exploit.mjs`, economy only (45 and this) | worst ×1.16 | worst ×1.15 (an earlier version of this build, before the carting floor, the 40 caravans and the floor abroad) |
| Trading only (the job dropped every month), eight seeds of five years, full build | mean ×0.74, worst ×1.58 | **mean ×0.24, worst ×0.57** |

The bar is ×1.3 and it holds. But no greedy trader in these runs makes money with market towns: seven of eight end with only their wagon. That is a design call for a human (see "Expected to move").

**Rules kept.**
- The month draws no random numbers, so the random stream is 45's. A player's trip draws its road mishap in the action, as the release's runs do.
- The market card, the reasons, the nearest towns and the trip plans only read. The road table, the paths and a town's hinterland output are caches of the map and of 45's yearly plan, and a remembered road is checked against the two towns' owners.
- Every value in the card goes through `UI.esc`, and the actions use `data-a`/`data-c`.
- Old saves: `S.mt` is new. Without it, prices are 45's until the next month builds the towns from the realm's store. The towns are rebuilt whenever a province changes hands or a capital moves, and a town that stays keeps its store.
- Stores are kept short in the state: arrays in the order of `S.mt.K`, in whole loads above 100, tenths above 10 and hundredths below.

**Expected to move in the balance league** (not run here).
- **Merchant `medianPeakCoin` will probably fall.** In the trading-only runs above, the greedy trader's mean fell from ×0.74 of the estate to ×0.24. Three things make trade harder: a luxury load now fetches what the town can absorb, towns sell no more than they hold, and the doubled caravans close the gaps the bot used to find. If the band breaks, the knobs are `E.PER_SRC` (40), the depth floor (0.7) and the sale floor (0.3).
- **Artisan coin may move.** Workshop income now comes from the town's prices: `workshopsPayTheSpread` read a forge at 135 to 304 suns a year in this feature's runs of the full build, and at 240 on the economy build, where 45's README reads 47.
- **Peasant and soldier lives** do not trade.

**Limits.**
- **Markets are chosen, not built.** The release has no market buildings, so "every town with a market building" is the capital plus the best-placed towns, cities and ports.
- **Carters move goods only inside a realm.** Between realms only 45's caravans do, and they still decide by the realms' prices and 45's road between capitals.
  - A version with carters crossing the border, between towns three steps apart or fewer, cost 18 ms a month, and was dropped.
  - A border town can still be dear while the next realm's border town is cheap. The player pays 45's road rate to reach it.
- **The cost of a month** is ×1.6–1.8 of 45's alone, depending on how loaded the machine is. The plan asked for ×1.5. Most of it is the carters' search for the right load.
- **Occupied and besieged provinces** are read from the war's own fields (`occ`, `sgBy`). The war lifts a siege that no army keeps up, so the test keeps one up by hand.
- **The gradients are mild:** ×1.06 four steps from the makers, at most ×1.15. (In the round-7 integrated world, with bolder generals and fresh realms, it fell to ×1.03; carting a step now costs 3% of a load's worth, not 2%, and it reads ×1.05, fish ×1.12, salt ×1.13.) Carters close gaps to the carting cost, and that cost is small against the value of most goods. Grain barely varies inside a realm, because every province grows some.
- **The player cannot move to another market.** "Go" is a trip, and the player always comes home to sell.
