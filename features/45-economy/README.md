# Goods that come from somewhere and go somewhere

**Aspect:** Economy (Road to Ten, Economy 1–5 and 7) · **Kind:** system and 2 patches, plus an exploit bench (`bench/exploit.mjs`)

The plan says the economy "hits 10 when goods come from somewhere, go somewhere, and other people trade too, so a price tells a story." In the release each realm's capital has one market. Its prices drift toward a target set once from the lore's export and import lists, with a fixed seasonal swing for grain and a war markup. Nothing is produced, nothing is eaten, and nobody but the player moves goods.

**What it does.**

1. **Production** (Economy 1). Every province makes goods from its terrain, biome and coast, more where it has more people: grain from plains, wool from hills, iron from mountains, timber from forest, furs from taiga, spices from rainforest. A realm makes much more of what the lore says it exports and less of what it imports. Grain comes in at harvest (June to December, most of it in August and September); everything else comes month by month. Each June every realm rolls its harvest: good (a quarter of the time), ordinary, poor (a fifth), or failed (one year in twenty). A failure makes the news.
2. **Demand** (Economy 2). People eat, wear and burn, per head. The rich buy luxuries in proportion to the realm's income. Armies at war use grain, iron, steel, horses and arms per thousand men. Each market keeps a stock of every good. The price follows the stock: (normal ÷ stock)^0.5, between 0.6 and 4 times the lore price. A granary at a tenth of normal is about three times dearer.
3. **Caravans** (Economy 3). Each month merchants send goods from any market to any other at peace where the price gap pays for the road. A market sends at most 20 caravans a month. The road's cost grows with the distance between capitals, and is cheaper by sea between coastal realms. War closes the road. Bandits take a share more often on long roads and where either realm is in unrest. About 330 caravans run a month.
4. **Local prices** (Economy 4). Away from the capital, what your own province makes is 15% cheaper, and other goods are 2.5% dearer for each step from the capital (up to eight steps).
5. **Chains** (Economy 5). Towns turn wool into fine cloth, iron and charcoal into steel, and steel into arms, whenever the output is worth more than its inputs. Workshops sit where their main input is made (forges by the ore, weavers by the sheep), more of them where the towns are big. The player can own a **forge**, an **armory** or a **weaving shed**. Their income is the spread between their goods at the home market, so it can go negative when inputs get dear.
6. **The world stays solvent.** The world makes each good at 1.06 times what it uses, counted down the chains (arms need steel, steel needs iron), after spoilage and the harvest's average, and allowing for an ordinary year's wars. So exporters make more than they eat, importers less, and the caravans carry the difference.
7. **The exploit test** (Economy 7, `bench/exploit.mjs`). A greedy trader takes the best run it can find every trip for ten years. An estate buys farms with the same 1,000 suns. Building this found two holes, both fixed:
   - **The player's trade runs paid no haulage.** Only tolls and risk, so every gap the caravans left was free. A run now pays carts, fodder and inns per load and by distance, both ways, the same as the caravans, and the trip planner shows it.
   - **Each extra load moved the price by the market's size, not by the market for that good.** Fourteen loads of pearls sold as freely as grain into a realm whose rich buy a third of a load a month. Patch `ECON-GOOD-DEPTH` makes the slide depend on the good's own market.
8. **Why it costs what it costs.** The market table adds the stock in words (famine, scarce, short, ample, glut). Hovering shows why: months of need in store, what was made and used last month, the harvest, armies at war, and caravans in and out. A line under the table lists this month's caravans (patch `ECON-MARKET-WHY`).

**Measured by** (`test.mjs`, on the full build).

| Test | Result |
| --- | --- |
| `econHolds` | After ten years, **97%** of 499 realm-goods hold between a third of normal and five times it. Chains make what is used: cloth 418/335, steel 600/213, arms 314/127 loads a month. |
| `famineTriplesGrain` | The same realm and June, frozen. Grain at its dearest over the next year: an ordinary harvest 1.27× base; a failed one with the roads open 1.36× (neighbours send grain); a failed one with every road closed **3.5×, which is ×2.8**. |
| `warMakesArmsDear` | A realm that buys its arms, in its first four months of war: arms used go from 6 to 26 loads a month; arms rise 27%, iron 32%, horses 35%. |
| `caravansPullPricesTogether` | After three years, the spread of prices between realms falls from 0.94 to 0.39 (log sd), and realm-goods in famine fall from 325 to 10. |
| `localPrices` | Four steps from the capital, fish (made there) costs ×0.85 of the capital's price and grain ×1.10. |
| `playerMovesStock` | Buying 10 loads takes 10 from the market's stock; selling them abroad adds 10. |
| `workshopsPayTheSpread` | A forge makes 47 suns a year at the home market's prices, and loses 589 if iron is 60% dearer. Reading it changes nothing. |
| `marketTableSaysWhy` | The table shows the stock word and the reason, and drawing it is pure. |
| `noTradeLoop` | A greedy trader against farms over five years on two seeds: 701 against 1,160, and 1,151 against 1,508. |

`bench/exploit.mjs`, ten years on four seeds:

| Economy | The trader's wealth, as a multiple of the estate's |
| --- | --- |
| The release's | up to **11.9×** (1,000 suns to 14,543) |
| This one | at most **1.19×**; three of four traders end below the estate |

The plan's bar is that the best trade loop must not out-earn a well-run estate. The test holds it to 1.5×.

**Cost.** About 7 ms a month (caravans 2 ms): a yearly table of roads, targets worked out once a month, and destinations that cannot pay skipped early.

**Rules kept.**
- Everything random (harvests, bandits) is drawn in the month hook.
- The market table, the reasons and the workshop incomes only read.
- Stocks, production and the caravan list are new fields on the market and the state, so old saves load: a market without stocks starts at normal.

**Limits.**
- **One market per realm, at the capital.** "Every town with a market building" is modelled as a local price in each province, not as separate markets with their own stocks.
- **Money sinks** (Economy 6) are untouched beyond the release's.
- **NPC merchants are traffic, not people.** The caravans have no names, and you cannot rob, hire or follow one.
