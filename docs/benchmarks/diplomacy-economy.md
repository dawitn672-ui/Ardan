# Diplomacy, politics and economy: benchmark

Oct 13, 2026 · build `b593143` plus the 29 fix patches (`features/00-05`), with every `.wip` feature left out, measured in headless Chromium. Strict scores going in, from "Ardan Road to 100": **Diplomacy 4, Economy 3.5**. The plan's own scores: 5 and 4.

Every number about Ardan below was measured for this doc unless it names a review. The scripts lived in a private scratch folder. This file is the only thing this work added to the repo. The method is in the appendix, so anyone can rerun it.

**About the sources.** This session could not open wikis, forums, GDC Vault or Wikipedia: their hosts failed at DNS, and the shared web-search budget was already spent. GitHub was reachable. So the sources here are mostly better than a wiki: the games' own script and define files, as mirrored in public GitHub repositories, plus one reverse-engineering book. Each source says what it is.

- **Game files** (Crusader Kings III, Victoria 3, Stellaris, Mount & Blade: Warband) are third-party mirrors. The version is not pinned, so a number may have changed in a later patch.
- **Europa Universalis IV** values come from a *mod's* copy of the vanilla files. The structure is vanilla. The values may have been changed by the mod.
- **Patrician III** comes from "Patrician 3 Insights", a community book written by disassembling the game (function addresses are given).
- **Anno 1800** comes from the data file of a popular fan calculator, extracted from the game.
- Port Royale, Bannerlord's trade model, and every developer talk or dev diary are **not sourced** this session and are left out. Anything I say from memory is marked **unverified**.

## 1. The bar

A 10 means every crown acts like the person wearing it, and you can read why before you click: the same numbers the AI adds up are the ones on your screen, and a careful player can predict the answer. Gold in a treasury is always on its way somewhere: to soldiers, walls, bribes and debts, never into a hole. Goods come from land and workshops, people and armies eat them, and the price in a market is a reading of its stock, so a famine, a blockade or a lost caravan shows up as a number that tells a story. Other merchants and caravans compete with you, and no low-risk trade loop beats a well-run estate. CK3 and Stellaris do the readable crowns, Victoria 3 and Patrician III do prices from stock and demand, Mount & Blade does caravans on the map, and Anno does the chains.

## 2. How the best do it

### Crusader Kings III: traits are weights, and every answer is a labelled sum

**Mechanism.** Each trait writes into nine AI values: honor, greed, boldness, compassion, energy, rationality, sociability, vengefulness and zeal. The scale is fixed: very low 10, low 20, medium 35, high 50, very high 75, dominant 200, with the same steps negative ([00_ai_values.txt](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/script_values/00_ai_values.txt), lines 22-34).

| Trait | AI values it sets | War appetite |
| --- | --- | --- |
| Brave | boldness +200, energy +20, rationality −20, sociability +20 | |
| Craven | boldness −200, energy −20, sociability −20 | |
| Ambitious | greed +75, energy +75, boldness +50, honor −20 | `ai_war_chance` +1, `ai_war_cooldown` −0.25 |
| Content | greed −50, energy −35, boldness −35 | `ai_war_chance` −0.25 |
| Greedy | greed +200, compassion −20, honor −10 | `ai_war_chance` +0.5 |
| Wrathful | rationality −35, boldness +35, vengefulness +20 | `ai_war_chance` +0.25 |
| Calm | rationality +75, boldness −20 | `ai_war_chance` −0.25 |
| Just / Arbitrary | honor +200 / −200 | |

Source: [00_traits.txt](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/traits/00_traits.txt). 12 traits carry `ai_war_chance` or `ai_war_cooldown`.

Every interaction has an `ai_accept` block. It is a sum of modifiers, and each modifier carries a `desc` label. For "negotiate alliance" the base is 0 ([00_alliance.txt](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/character_interactions/00_alliance.txt)):

- close family +20, extended family +10, rank difference ±30 to ±120;
- the recipient's opinion of you, counted 1 for 1;
- loyal +20, trusting +20, craven +5, paranoid −20, arrogant −20, ambitious −20, disloyal −40, fickle −10.

For a call to arms, the ally's **honor value is added straight to acceptance** (`ai_value_modifier = { ai_honor = 1 }`). Defending adds +50. Fighting a friend costs −50, a best friend −100, a soulmate −200, an heir or spouse −1000 (same file).

The game shows this sum. The interaction format has headers for an "acceptance breakdown" with three states, will accept, will not accept and maybe ([_character_interactions.info](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/character_interactions/_character_interactions.info), lines 309-324).

Opinion modifiers start to decay 31 days after they are applied. Vassals lose 0.5 opinion a month during an offensive war after a 6-month grace. Each soldier costs 0.003 gold in maintenance ([00_defines.txt](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/defines/00_defines.txt), `NCharacterOpinion`, `GOLD_COST_PER_SOLDIER`).

**Lesson for Ardan.**

- **Ardan already uses CK3's trait names** (brave, craven, ambitious, content, greedy, generous, wrathful, calm, honest, deceitful, just, arbitrary). The weight table can be copied in shape almost line for line. Today Ardan reads **none** of them in 17 diplomacy and war functions (section 3).
- **One sum, two uses.** The number that decides and the list the player reads must be the same object. CK3 makes that structural: the `desc` sits on the term that adds the value.
- **Honor as a direct term** is the cheapest way to make "honorable keeps pacts" visible: an honest ally answers calls; a fickle one doesn't, and the list says so.

### Europa Universalis IV: a ruler's personality multiplies the AI's odds

**Mechanism.** A ruler gets a first personality at 15, a second after 10 years of rule and a third after 25 (file header). Each personality carries AI multipliers and wants ([a mod's copy of `00_core.txt`](https://github.com/SpiritBaker/Difficulty-and-AI/blob/master/common/ruler_personalities/00_core.txt); values may differ from vanilla):

| Personality | AI effect |
| --- | --- |
| Careful | `war_chance_multiplier` 0.5, `enemy_strength_multiplier` 1.2 |
| Calm | war chance ×0.5, easy-war chance ×0.75 |
| Conqueror | war chance ×1.75, easy-war chance ×2, `gift_chance` −50, `wants_land` |
| Bold fighter | war chance ×1.3, enemy strength ×0.85 |
| Kind-hearted | `alliance_acceptance` +10, `gift_chance` +65 |
| Greedy | `wants_gold`, `gift_chance` −100, `war_priority` weighted by treasury |
| Zealot | heathen and heretic ally acceptance −1000 |
| Charismatic negotiator | `other_ai_peace_term_bonus` +10 |
| Lawgiver, Industrious | `custom_ai_explanation` = "AI_RULER_PICK_IDEA_GROUPS" |

Separately, each AI country picks one of five strategic personalities (capitalist, diplomat, militarist, colonialist, balanced), weighted by the ruler's administrative, diplomatic and military skill and the idea groups taken ([mod copy of `00_ai_personalities.txt`](https://github.com/SpiritBaker/Difficulty-and-AI/blob/master/common/ai_personalities/00_ai_personalities.txt)).

The well-known EU4 alliance acceptance breakdown (base −50, opinion ×0.25, trust, "wants to ally", and so on) is **unverified**: I could not reach the wiki.

**Lesson for Ardan.**

- **Multiply, don't replace.** Ardan's `A.AGGRO` is a realm tradition. Keep it as the baseline, and let the ruler's traits multiply it, as EU4 stacks personality on top of country strategy. The WIP feature `20-ai-personality` does exactly this (`war = cult × e^warLog`).
- **Wants are a second channel.** "Greedy wants gold" changes what a ruler asks for, not only how often it fights. Ardan's greedy rulers should demand tribute and sell alliances; generous ones should pay subsidies.
- **`custom_ai_explanation`** is a sentence the player reads. Ardan needs one line per AI decision, not only numbers.

### Stellaris: a personality is a dozen numbers

**Mechanism.** Each AI personality is a short numeric vector ([00_personalities.txt, 3.8.4](https://github.com/ShammyZut/Stellaris-3.8.4-Vanilla/blob/main/common/personalities/00_personalities.txt)). The file's own comments define them:

- `aggressiveness` changes war and insult chance and the share of fleet sent to attack: 50% at 0, about 75% at 1, 100% at 2.
- `trade_willingness`: "At 1.0 willingness they will accept a deal that is equally good for both sides."
- `bravery`: picking rivals of similar strength instead of the weak.
- Acceptance offsets per treaty type.

| Personality | Aggr. | Trade | Bravery | Military spend | NAP | Defensive pact | Commercial pact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Honorbound warriors | 1.75 | 0.7 | 1.5 | 1.2 | −100 | +20 | −20 |
| Peaceful traders | 0.5 | 1.0 | 0.5 | 0.9 | +20 | 0 | +20 |
| Federation builders | 0.75 | 0.95 | 1.25 | 1.0 | +25 | +25 | +15 |
| Xenophobic isolationists | 0.5 | 0.5 | 0.75 | 1.2 | +20 | −20 | −20 |
| Fanatic purifiers | 2.0 | 0.5 | 1.0 | 1.2 | | | |

27 personalities use these fields.

**Lesson for Ardan.** Ten axes are enough. The WIP feature already reduces Ardan's 40 traits to nine axes (honor, greed, caution, pride, social, zeal, patience, wrath, warmth). The test of a personality is that a player can name it from behaviour. "Honorbound" works because one number (NAP −100) produces a visible refusal.

### Victoria 3: price from orders, demand from wealth, acceptance by sign

**Price.** Each good has a base price: grain 20, fabric 20, iron 40, tools 40, steel 50, small arms 60, luxury clothes 60, gold 100 ([00_goods.txt](https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/goods/00_goods.txt)). The market price moves within ±75% of base (`PRICE_RANGE = 0.75`). It reaches the limit when buy orders are twice sell orders, or the reverse (`BUY_SELL_DIFF_AT_MAX_FACTOR = 2`). Below a supply/demand ratio of 0.5, buildings that need the good lose output (`GOODS_SHORTAGE_PENALTY_THRESHOLD`) ([00_defines.txt](https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/defines/00_defines.txt), lines 361-365).

**Trade and distance.**

- Embargo costs a trade center −100 advantage, war −75, lack of interest −50.
- Each trade agreement adds 4 to a route's preference multiplier.
- Preference is divided by `1 + 0.25 × sea nodes` of distance (same file, lines 391-418).

**Demand.** Pops buy "packages" by wealth ([00_buy_packages.txt](https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/buy_packages/00_buy_packages.txt)):

| Wealth | Basic food | Luxury food | Luxury items | Political strength |
| --- | --- | --- | --- | --- |
| 5 | 106 | 0 | 0 | 0.15 |
| 10 | 137 | 0 | 0 | 0.75 |
| 20 | 163 | 8 | 98 | 18 |
| 30 | 0 | 271 | 522 | 65 |

A need is met by substitutes. Basic food takes grain (weight 0.75), fish, meat, fruit or groceries, none above 90% of supply ([00_pop_needs.txt](https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/pop_needs/00_pop_needs.txt)).

**Diplomacy.** "If this value evaluates to above zero, AI will accept this action." A random roll is opt-in per action (`uses_random_approval`: "+50 acceptance = 50% chance"). An AI can also agree to owe a favor to get a deal through (`owe_favor_chance`) ([diplomatic_action.md](https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/diplomatic_actions/diplomatic_action.md), lines 13, 134, 141). Victoria 3 ships at least 37 diplomatic action files.

**Lesson for Ardan.**

- **Bounded prices.** ±75% around base is a design choice, not physics. Ardan should pick its own bound on purpose, wider for food in a famine.
- **Demand by wealth** turns "rich man buys wine" into data. Ardan's lore already sorts people by status (serf, peasant, artisan, merchant, gentry, noble, royal).
- **Deterministic acceptance by default.** Ardan rolls every offer. Victoria 3 rolls only where a designer opted in.
- **Political strength from wealth** (0.15 to 65) is the bridge between economy and politics that Ardan lacks.

### Patrician III: a price is a reading of stock, measured in days

**Mechanism.** Each town has four price thresholds per good, measured in **days of its own consumption** ([thresholds.md](https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/thresholds.md)):

- t0 = 7 days of consumption (14 days for goods flagged by a crisis);
- t1 = t0 + 14 days (28 under siege, blockade, pirate attack or a frozen port);
- grain gets 14 extra days on t1;
- in harvest season, grain and wine t1 rises by 15% in September, 30% in October, 20% in November and 10% in December;
- a **famine** flags grain, meat, fish, beer, salt, honey, spices and wine. A plague flags seven of those. A fire flags them plus timber.

The buy price is base × a factor that slides down as stock rises ([buying-price.md](https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/buying-price.md)). The sell price works the same way at lower factors ([selling-price.md](https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/selling-price.md)):

| Stock | Buy factor | Sell factor (normal difficulty) |
| --- | --- | --- |
| empty to t0 | 4.0 → 1.5 | 2.0 → 1.4 |
| t0 to t1 | 1.5 → 1.0 | 1.4 → 1.0 |
| t1 to t2 | 1.0 → 0.8 | 1.0 → 0.7 |
| t2 to t3 | 0.8 → 0.6 | 0.7 → 0.5 |
| above t3 | 0.6 | 0.5 |

**Demand.** Each class eats a fixed table per 100 citizens per day ([consumption.md](https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/population/consumption.md)). Grain: rich 90, wealthy 120, poor 150, beggars 120. Wine: 150, 38, 0, 0.

- Satisfaction sums weighted goods per class. A siege costs −10, a famine −10, a blockade −6 ([satisfaction.md](https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/population/satisfaction.md)).
- A town slowly eats away a glut of goods it cannot produce ([excess_consumption.md](https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/excess_consumption.md)).

**Automation.** Auto routes hold up to 20 stops, each with a price limit and a quantity for each of 24 goods ([p3-autoroute README](https://github.com/marco-zanella/p3-autoroute/blob/master/README.md)). Hired captains get a trade discount that grows every 43 experience and caps at 215 ([buying-price.md](https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/buying-price.md)).

**Lesson for Ardan.** This is the model to copy first. It needs one number per good per market (stock) and one table (consumption per class). A famine becomes a flag that doubles the low threshold for food. The price curve then does the storytelling: buy grain at 4× base in a starving town. Ardan's "a famine triples grain" falls out of the curve for free. The curve also kills the buy-then-sell-back loop by itself: the buy factor is never below the sell factor at the same stock, and every trade moves the stock against you.

### Mount & Blade: Warband: towns make and eat goods, and caravans carry prices

**Mechanism.** Warband's official module system shows the whole loop ([module_scripts.py](https://github.com/int19h/mb_warband_module_system/blob/master/Module_system%201.171/module_scripts.py), [module_constants.py](https://github.com/int19h/mb_warband_module_system/blob/master/Module_system%201.171/module_constants.py)):

- **Production sources** are concrete: acres of grain, olives, vines, flax and dates; heads of cattle and sheep; fishing fleets, salt pans, apiaries, silk farms; mills, breweries, wine presses, looms, smithies, tanneries and shipyards.
- **Prices.** A price factor of 1000 is average, clamped to 100..10000. Every 72 hours each town and village moves each price by its production minus consumption, ×2 to ×3 with a random part. It is then pulled about 4% back toward average. The code's comment puts equilibrium at "33 cycles, or 100 days". Manufactured goods drift toward the price of their raw material.
- **Caravans.** A caravan carries the price list of the last town it traded in, and moves each visited town's prices 4% toward it. A comment shows the designers tried 10, 20 and 30 first. Each visit pays tariffs scaled by the town's prosperity and can add prosperity. A constant caps kingdom caravans at 12 (`peak_kingdom_caravans`).
- **Raids and prosperity.** Production scales with prosperity, ×(prosperity + 75)/125. A village being raided or looted produces nothing.
- **Design numbers in comments.** "10000 acres is the average across Calradia"; bread demand "3000 across Calradia".

**Lesson for Ardan.**

- **Caravans are price diffusion you can see and kill.** Ardan has trade pacts and embargoes as flags. With caravans, a pact would be a line of wagons on the map. An embargo or a war would stop them, and the two markets' prices would drift apart for a visible reason.
- **Tune convergence low.** The designers walked from 30% per visit down to 4%. Ardan's own monthly pull is 20% toward a fixed target, which erases every shock in about three months.

### Anno 1800: chains with exact ratios

**Mechanism.** From the data in a widely used calculator ([Anno1800Calculator params.js](https://github.com/NiHoel/Anno1800Calculator/blob/master/js/params.js), extracted from the game):

- **Chains.** Grain farm 1 t/min, flour mill 2 t/min, bakery 1 t/min: two farms feed one mill, and one mill feeds two bakeries. Pig farm 1 t/min to slaughterhouse 1 t/min for sausages.
- **Upkeep.** Every building pays coins (grain farm 20, fishery 40, flour mill 50, bakery 60, slaughterhouse 80) and needs workers.
- **Needs per resident.** A farmer eats 0.0025 t/min of fish, so one fishery (2 t/min) feeds 800 farmers. Schnapps feeds 600 per distillery, work clothes 650 per knitter.
- Each need is tied to a number of residents in a 10-resident farmer house (fish 3, work clothes 2). Meeting needs grows the town and its tax.

**Lesson for Ardan.** Ardan is not a city builder and should not become one. What transfers is the **ratio**: the player should be able to say "one smithy eats the iron of two mines". Owning a link of a chain is the merchant and artisan mid-game the plan wants. A link is only interesting if its input price and its output price both move.

### Not sourced this session

Port Royale (same studio and model family as Patrician), Bannerlord's trade price model and workshops, CK3's dev diaries on AI personality, Paradox and Firaxis GDC talks on AI legibility. Any claim about them would be from memory, so they are left out.

## 3. Backtest

First what the code does today, then the table that sets each metric against the best game and a target.

### Ardan today: diplomacy and politics

**Strengths that are real.**

- **Breadth.** The diplomacy card has 25 actions in 4 groups (friendship, treaties, pressure, war). The AI uses 12 kinds of act: alliance, defensive pact, guarantee, subsidy, embargo, trade pact, non-aggression pact, rivalry, tributary, wedding, forged claims and military access. Coalitions form against high infamy, and tributaries pay 8% of income.
- **Memory.** Realms keep 26 kinds of dated memory with half-lives in years (`A.DMEM`): took our land 30, betrayed us 25, declared rivals 25, a royal wedding 15. The opinion tooltip (`A.opinionParts`) lists them with their age.
- **Factions.** Factions form from the realm's houses in 5 kinds: peace, independence, claimant, liberty and war. They are driven by laws (authority, levy) and stability, and the war faction even reads a house's traits.
- **Offer reasons.** Every offer's reason list (`A.interestParts`) is term for term the same as the number the AI uses (`A.interest`). That part is honest.

**What fails.**

1. **Ruler traits are read nowhere.** Static count on the fix layer:
   - 17 AI functions (`diploAI`, `aiWarCheck`, `interest`, `checkPeace`, `queueAiOffer`, `rulerAction`, `forcesAI` and 10 more) contain **0** reads of `traits`.
   - War appetite is `A.AGGRO`, one fixed number for 19 of 34 realms; the other 15 get 1.0.
   - The bench's trait test reads 0.9: rulers with aggressive traits declare war 0.9 times as often as peaceful ones (`reports/fixes.json`). The release's 1.5 was noise.
2. **Every offer is a lottery.** An offer's chance is `clamp(base + interest/100 + chancellor/400, 2%, 95%)`, then rolled.
   - Across 3,639 offers open to three player rulers over 5 years, a player who reads the shown odds perfectly and always bets on the likelier answer is right only **78%** of the time.
   - **37%** of offers sit between 30% and 70%, which is a coin flip.
   - The plan's gate ("players guess the AI's answer 7 times in 10") is therefore met by reading the percentage. It measures nothing.
3. **The "Slowly pulling them" list is fiction.** `A.realmStanding` shows 11 kinds of reason; the yearly drift (`politicsYearNow`) adds 7 terms, mostly different ones, at different sizes.
   - Over 3 worlds × 60 years (1,122 realm pairs a year, about 200,000 pair-years), the correlation between the shown total and the real change in relation the next year is **r = 0.08**.
   - The list shows ±7.6 a year on average. Relations actually move ±1.3.
4. **Gold is deleted, not used.** AI treasuries above 3 years of income first repay debt, then lose 85% of the excess for +1 stability and +1 legitimacy. Over 3 worlds × 60 years (6,050 AI realm-years):
   - **74% of all AI income is deleted.**
   - 14.1% goes to army upkeep.
   - **0.5%** raises new divisions.
   - 1.0% is tribute.
   - 91% of AI realm-years sit at the cap.
   - Only 26 realm-years (0.4%) exceed 6 years of income, so the plan's "0 hoarding flags" gate is nearly met *by destroying the money*.
5. **No decision log.** No AI decision is recorded with a reason. "Why did Valmark attack?" has no answer in the game.
6. **Wars by type.** 105 wars in 180 world-years: rivalry 49, insult 14, liberty 11, incident 11, throne 9, and 11 more from coalitions, tribute, reconquest, justified claims and holy war. Nearly half come from a rivalry roll, none from a want.
7. **The court is a skill number.** Council seats hold named people, but AI decisions read only their skill (`A.councilSkill`). A chancellor's traits, loyalty or goals change nothing.

### Ardan today: economy

**Strengths that are real.**

- 21 goods, one market per realm (34), and prices seeded from each realm's lore exports and imports plus terrain.
- Seasons (grain ×1.2 in spring, ×0.8 at harvest), war factors (grain ×1.3, iron ×1.35, steel ×1.4, horses and arms ×1.5) and trade pacts and embargoes on imports.
- Thin markets with wide spreads (after `ECO-THIN-MARKET-SPREAD`).
- Transport tiers: your back 1 load, cart 6, wagon 15, cog 50.
- Holdings with upkeep, mercenary companies, and a HOI4-style industry for rulers.
- The median price spread across markets is 2.2×, inside the 1.5 to 3× band (bench).

**What fails.**

1. **No stock, no production, no consumption.** A price is pulled 20% a month toward a target (`A.mktMonth`), plus ±4% noise. A shock loses half its size in **3.1 months**. Nothing is made, stored or eaten.
2. **Prices cannot tell a story.** The highest grain multiplier the world can produce is season 1.2 × war 1.3 × instability 1.08 = **1.68×**. Measured over 3 worlds × 60 years and 34 realms (about 98,000 realm-month samples):
   - grain never went above **1.53×** its own median;
   - **0** months reached 2×;
   - grain during wars averaged 1.18×;
   - **0** famine news items fired.
   - "A famine triples grain" is impossible by construction.
3. **Money comes from nowhere.**
   - Job wages are a rank table. A merchant's career runs Pedlar 80, Trader 250, Merchant 700, Merchant prince 3,000, **Banker 9,000** suns a year. A Banker who does nothing earned about **11,800 suns a year** in a 3-year test, 65 times a day laborer's 180.
   - Nobles get 250 a year flat. A player on the council gets 60 + crown income/4,000 a month. No treasury is charged for any of it ("Road to 100"; `A.moneyYear`, `A.councilMonth`).
   - The two scales don't even describe the same money. A realm collects about **0.2 suns per subject per year** (101 million people, median realm income 636,000), while a day laborer earns 180.
4. **Holdings ignore markets and have no limit.** Every holding pays a fixed yield, 6.7% to 16% a year (fishing boat 16%, farm 12.3%, manor 9.5%), times a random 0.6 to 1.3.
   - An estate bot that reinvested every year owned **443 to 652 holdings** after 10 years, mostly fishing boats.
   - The price of fish did not move.
5. **Trading is a menu click.**
   - A run costs initiative (1 to 5 points; an adult merchant gets 7 a year) and **no calendar days**.
   - With the best cargo size, only **5 to 21%** of good-and-destination pairs are profitable after tolls and expected losses.
   - The best run earns +54 to +100 suns at 23 to 37% per run.
   - A greedy trade bot made 34 to 42 runs in 10 years and was robbed 5 to 8 times.
   - Its gain over a do-nothing twin ranged from +2,000 to +77,000, because the twin's career diverged. **Career wages swamp trade.** The plan's exploit test cannot be run fairly until wages stop being printed.
6. **No one else trades.** There are 0 NPC merchants and 0 caravans. Trade pacts are a flag that adds up to +16% to a realm's income.
7. **The bench's Economy score of 7 out of 10 (`reports/scorecard.md`) is a false positive.** Its two metrics (no buy-and-sell-back loop, a 1.5 to 3× spread) are both met by a static price list.

### The table

"Ardan today" is the fix-layer build unless it says "release". Every number was measured for this doc unless it names a report.

| # | Metric | Reference game | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- | --- |
| D1 | AI decision code that reads ruler character | CK3: 9 AI values on every trait; `ai_accept` adds honor directly. EU4: war chance ×0.5 (careful) to ×1.75 (conqueror) | **0 of 17** functions read `traits`; one `A.AGGRO` number for 19 of 34 realms | Every AI decision type reads at least one persona axis | Static analysis: list the AI functions, grep for persona reads |
| D2 | Rulers act in line with their traits | CK3 ambitious `ai_war_chance` +1, content −0.25; Stellaris NAP acceptance −100 to +25 by personality | War ratio aggressive/peaceful **0.9** (`reports/fixes.json`); other decisions unmeasured | ≥ 80% of (decision type × trait) pairs move the declared way by ≥ 1.5×; war ratio ≥ 2× | Bot: 10 seeds × 100 years, every AI act logged with the ruler's traits; compare rates per trait-year |
| D3 | AI decisions logged with reasons | CK3: every acceptance term has a `desc`. EU4: `custom_ai_explanation` | **0%** | 100% of AI acts in a log with top 3 reasons, and readable in the UI | Bot counts acts vs log entries; browser test opens the log |
| D4 | The "why" list matches what really moves opinion | CK3: the shown sum is the decision | Shown total vs next year's change: **r = 0.08**; shown ±7.6 a year, real ±1.3 | r ≥ 0.95, magnitude within ±10% | Bot: per realm pair per year, shown total vs Δ base relation |
| D5 | A reader of the breakdown can predict the answer | Victoria 3: accept if > 0, roll only when opted in. CK3: yes / no / maybe headers | Best possible guess **78%**; **37%** of offers between 30 and 70% | A bot that reads only the sign of the breakdown predicts ≥ 95%; ≤ 10% of offers in a "maybe" band | Bot: 3 rulers × 5 years × all realms × all offers |
| D6 | People predict the AI | The plan's gate: 7 of 10 | **Unmeasured. 0 playtests.** Reading the odds alone already gives 78% | 7 of 10 correct **with the percentage hidden**, reasons shown | Human playtest, 12 players, 10 offers each |
| D7 | Share of AI income spent on something in the world | CK3: soldiers cost gold each; amenity spending set by greed. EU4: greedy `wants_gold`, `war_priority` by treasury | **74% deleted**, 14% upkeep, 0.5% recruits, 1% tribute; 91% of realm-years at the cap | ≤ 5% deleted; at least 4 spending kinds each ≥ 5% | Bot: wrap `A.forcesAI` and the treasury writers; sum per category |
| D8 | The plan's hoarding flag (> 6 years of income) | (plan) | 0.4% of realm-years, met by deletion | Retire it; D7 replaces it | Bot |
| D9 | Memories that last generations | CK3 opinion modifiers with decay | 26 kinds, half-lives up to 30 years | Keep. Add: ≥ 30% of AI wars cite a memory or a want | Bot: war records with cause |
| D10 | Court of people | CK3: councillors and vassals are characters with AI values | Council seats are people, but only their skill is read | Every seat holder's traits and goals enter at least one decision | Static analysis and bot |
| E1 | Prices come from stock | Patrician III: thresholds in days of consumption. Victoria 3: ±75% at a 2:1 order imbalance | **No stock**; 20% monthly pull to target; shock half-life **3.1 months** | 100% of goods priced from stock against consumption | Static analysis; bot logs stock and price per market-month |
| E2 | A famine moves food | Patrician: a famine flags 8 food goods; empty stock buys at 4× | Grain max **1.53×** its median in 180 world-years; **0** months ≥ 2×; ceiling **1.68×** | A scripted famine triples grain within 3 months and recovers within 18 | Bot: force a harvest failure in one realm, track grain |
| E3 | War moves war goods | Warband: production minus consumption every 72 h | Grain in wars averages 1.18×; arms ×1.5 hard-coded | Arms and horses rise 1.5 to 2.5× in realms at war **because armies buy them** | Bot: price vs army purchases |
| E4 | Prices across markets | Victoria 3: preference ÷ (1 + 0.25 × distance); Warband caravans 4% per visit | Median max/min spread **2.2×** (bench); no distance term | 1.5 to 3× spread, and correlation of price gap with distance ≥ 0.5 | Bot |
| E5 | Other traders | Warband: kingdom caravans capped at 12; tariffs per visit | **0** NPC merchants or caravans | ≥ 1 caravan per active trade pact; a war cutting a route widens the price gap ≥ 30% within 6 months | Bot |
| E6 | Money created from nothing | CK3: armies are charged gold per soldier | Wages, noble income and soldier pay printed; Banker ≈ **11,800 a year**; crown income **0.2** suns per subject | 0 suns created outside a logged mint; one money scale | Bot: a ledger that sums every purse, house and treasury each month |
| E7 | Production chains | Anno: 2 farms : 1 mill : 2 bakeries; upkeep 20 to 80 per building | **0** chains | 3 chains of 3+ links; the player can own any link | Static analysis and browser test |
| E8 | Holdings tied to markets | Patrician and Anno: output is goods sold at the market price | Fixed yields 6.7 to 16%; a bot bought **652** holdings with no price effect | Holding income correlates ≥ 0.8 with the local price; the 20th fishing boat earns < 25% of the first | Bot |
| E9 | No low-risk loop beats an estate | Patrician: the buy factor is never below the sell factor at the same stock | Not fairly testable: printed wages swamp both (gains +2,000 to +77,000) | Best greedy loop ≤ 1.5× the estate at equal risk over 10 years, careers frozen | Bot, with careers and events frozen |
| E10 | Trading takes time | Patrician: ships sail, routes of 20 stops. Warband: you ride | A run costs initiative and **0 days** | A run moves the calendar by its length | Browser test |
| E11 | Demand by class | Victoria 3: food 106 → 163 → 0 as wealth rises. Patrician: grain 90 to 150 per 100 a day by class | **None** | 4 classes × 21 goods consumption table, plus armies | Static analysis |
| E12 | People can explain a price | The plan's gate | **Unmeasured** | 8 of 10 explain why a good is cheap here and dear there | Human playtest |

## 4. North star

What this looks like with unlimited time, money and people. Everything here should feed the core line: "one life inside a living history".

### The Chancery and the Court

- **Every crown is a person.**
  - Each ruler, councillor and great house head carries 9 axes on a −200..+200 scale (CK3-style; CK3's exact range unverified in this session), built from traits, the realm bible's want and fear, and the memory ledger.
  - Every AI decision is a sum of at most 12 labelled terms: war, alliance, breaking a pact, tribute, marriage, subsidy, embargo, peace, answering a call, faction demands.
  - It acts when the sum is above 0. A band of −10 to +10 opens a negotiation, where you can add gold, a hostage, a marriage, or a favour owed (Victoria 3's `owe_favor`).
- **The Chancery screen.**
  - For each realm: its 3 current wants ("Recover Tessaria before 1130"), its temper in one line ("Proud and wrathful: slow to forgive, quick to march"), and the last 50 decisions with their top 3 reasons and dates.
  - A world feed shows the 10 biggest decisions of the year.
- **What you know is what your envoys tell you.**
  - Terms you have no source for show as "?" in the breakdown. An envoy at court or a spy fills them in, and sometimes wrongly.
  - This is signature system 2, belief versus truth, applied to politics.
- **Envoys travel.**
  - A proposal takes days to arrive. The answer comes as a letter in the chronicle's voice.
  - A pact has terms and a length. Breaking it writes a 25-year "betrayal" memory with every ruler who weights honor.
- **The court is people.**
  - Five council seats, the realm's great houses (180 deep house histories already exist in the lore) and the 573 cast members with written wants and fears.
  - Laws (succession, tax, levy, authority) pass by council vote.
  - A faction is named houses with a leader, a demand and a deadline. A civil war names its claimant.
- **Treasuries spend.**
  - Each year the AI pays in order: debts, army to target, walls on a rival's border, buildings, faction bribes, subsidies to allies, mercenaries.
  - Idle gold above the reserve is under 5%.
  - A Realm ledger shows the year's income and spending in 8 lines.
- **Numbers.**
  - ≥ 80% trait-consistent behaviour.
  - ≥ 95% of answers predictable from the shown reasons; people predict 7 of 10 with the percentage hidden.
  - 3 to 8 logged decisions per realm-year.
  - ≥ 30% of wars cite a memory or a want.
  - ≤ 5% of income idle.

### Goods that come from somewhere

- **Production.** Each of the 306 provinces makes goods from its terrain, buildings and people:
  - plains and steppe: grain and horses; hills: iron and wool; forest: timber and furs; coast: fish and salt.
  - Each year's harvest is a seeded weather draw per region.
- **Markets.**
  - The 34 capitals plus about 60 market towns (any town with a market building) each hold stock of the 21 goods.
  - The price follows Patrician's curve on days of local consumption: ×4.0 at empty down to ×0.6 at a glut to buy, ×2.0 to ×0.5 to sell.
  - Famine, siege and blockade flags double the low thresholds for food.
- **Demand.**
  - A consumption table per class per 100 people: serfs and peasants eat grain, fish, beer and wool; townsfolk add cloth, tools and salt; nobles add wine, spices, furs and silk.
  - Armies on campaign eat grain and buy iron, horses and arms. A war you can see on the map empties a region's granaries.
- **Chains.**
  - Ore → iron → steel → arms; wool → cloth → fine cloth; grain → malt → ale; timber → tar and ships.
  - The player can own any link: a smithy that buys iron at market and sells arms to the crown in wartime.
- **Caravans.**
  - About one caravan per trade pact, visible on the map as Warband does it. Each carries stock and moves prices a few percent per visit.
  - Bandits, raids and wars cut roads, and tolls go into treasuries.
  - You compete with them: flood a market and the caravans' margins fall too.
- **One money.**
  - Every sun has a payer. Crown income is tax on production and trade, set so a peasant household pays about a tenth.
  - Wages come from employers: crown, houses, guilds, companies. A Banker earns what his loans earn.
  - The only source of new money is a mint, and it is logged.
- **The player's trade.**
  - A run takes calendar days, and the life goes on around it: road events and news missed at home.
  - Later, a factor in another town and auto routes of up to 20 stops, as in Patrician.
- **Screens.**
  - **Market:** stock as "12 days of grain", a 24-month price line, and "why this price" as a nested tooltip ("stock 5 days, low: ×1.9; war in Valmark: armies buying: +20%; Ostra caravans cut since spring").
  - **Ledger:** player, house and realm.
  - A map mode for any good's price.
- **Numbers.**
  - A famine triples grain within 3 months and recovers within 18.
  - Arms rise 1.5 to 2.5× in a realm at war.
  - 0 suns from nowhere.
  - The best trade loop is ≤ 1.5× an estate at equal risk.
  - 8 of 10 players explain a price difference.

## 5. What to build now

Ranked by score gained per week of work, dependencies first. "Code" means `*.core.js` plus small patches in a `features/NN-name/` folder, as `CLAUDE.md` describes. Every acceptance test can fail on today's build.

| # | Feature | Aspect, gain | Effort | Where | Acceptance test (must be able to fail) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Spend, don't delete** | Diplomacy +0.5 | M | Code | Bot, 3 seeds × 60 years: deleted share of AI income ≤ 5% (today 74%); recruits, buildings, subsidies and reserve each ≥ 5%; wars per realm-year within ±25% of today (no arms race) |
| 2 | **Finish trait-weighted AI with a decision log** (`20-ai-personality`, WIP) | Diplomacy +1.0 | L (mostly built) | Code | Bot, 10 seeds × 100 years: war ratio ≥ 2× (today 0.9); ≥ 80% of (decision × trait) pairs move the declared way by ≥ 1.5×; 100% of AI acts logged with 3 reasons; replay and render-purity tests pass |
| 3 | **Make "Slowly pulling them" real** | Diplomacy +0.3 | S | Code | Bot: correlation of shown yearly total with real Δ relation ≥ 0.95 (today 0.08); mean shown magnitude within ±10% of real |
| 4 | **Answers by sign, not dice** | Diplomacy +0.5 | S | Code | Bot over 3,639 offers: a predictor using only the sign of the shown breakdown is right ≥ 95% (today ≤ 78%); ≤ 10% of offers in a "maybe" band that still rolls |
| 5 | **Stock-based markets** | Economy +1.5 | L | Code | Bot: every market holds stock; a forced harvest failure triples grain within 3 months and returns to ×1.2 within 18; normal years stay within ×0.7 to ×1.6; buy-and-sell-back loop ≤ 0; spread 1.5 to 3× |
| 6 | **Wages and incomes as transfers, with a money audit** | Economy +1.0 | L | Code | Bot ledger, 60 years: the sum of all purses, houses and treasuries changes only by logged mint and sink lines (error < 0.1%); a Banker's pay comes from a house or bank account and falls when its loans fail |
| 7 | **Holdings tied to markets, with diminishing returns** | Economy +0.5 | M | Code | Bot: farm income correlates ≥ 0.8 with local grain price; the 20th fishing boat in one market earns < 25% of the first; the estate bot owns < 60 holdings after 10 years (today 652) |
| 8 | **Crisis demand: famine, siege, armies** | Economy +0.5 | S (after 5) | Code + content | Bot: in realms at war, arms and horses average ≥ 1.5× their peace median and grain ≥ 1.3×; each famine or siege event sets a flag the price reads; ≥ 5 events read the new flags |
| 9 | **NPC caravans** | Economy +0.7 | L | Code (map art later) | Bot: ≥ 1 caravan per active trade pact; when a war closes a route, the two markets' price gap widens ≥ 30% within 6 months; raids destroy caravans and log news |
| 10 | **Economy bench metrics and the fair exploit bot** | Economy +0.3 | M | Code (`bench/`) | `bench/run.mjs` reports E1, E2, E5, E6, E8 and E9; the exploit bot freezes careers and events; the scorecard fails if the best loop is > 1.5× the estate at equal risk |
| 11 | **Trade runs take calendar days** | Economy +0.3 | M | Code | Browser test: a 50-day run moves the date 50 days and lets the month's events fire on the road; runs per year are capped by days, not initiative |
| 12 | **Three production chains** | Economy +0.5 | L | Code + content | Static: 3 chains of ≥ 3 links in data. Bot: a smithy owner's margin moves with iron and arms prices (correlation ≥ 0.6) |
| 13 | **A court of people** | Diplomacy +0.7 | XL | Code + writing | Bot: ≥ 50% of faction demands and civil wars name a house leader whose traits and want are logged as a reason; council traits enter ≥ 3 decision types |
| 14 | **People gates** | Diplomacy +0.5, Economy +0.5 | M | Needs people | 12 players: 7 of 10 AI answers predicted with the percentage hidden; 8 of 10 explain a price difference |

**1. Spend, don't delete.** In `A.forcesAI`, replace the 85% deletion with a spending ladder: debt, then army to target, then paid buildings (`A.indQueue` charging gold), then subsidies to friends at war, then bribes to the realm's worst faction (lowers discontent), then mercenaries in war. Cap the reserve at 3 years of income as now, but spend the excess. Weight the ladder by persona once feature 2 lands: greedy rulers keep a bigger reserve, generous ones subsidize. Watch for an arms race: the acceptance test bounds wars per realm-year.

**2. Trait-weighted AI.** `features/20-ai-personality` is mostly built and marked `.wip`. Its own test asks for a war ratio above 1.5. Raise it to 2× and add the per-decision consistency score from D2. Its "why" for each act should become the Chancery's log (section 4).

**3. Make the pull list real.** Show the 6 terms that `politicsYearNow` actually adds each year at their real size, plus the memories. Feature 2's `A.aiPullParts` does this; land it first, because a list that lies costs trust everywhere else.

**4. Answers by sign.** Accept when the shown total is above 0. Keep a roll only inside a −10..+10 band, and label that band "They are torn". Show the total, not a percentage. This makes the plan's human gate (D6) mean something.

**5. Stock-based markets.** One stock number per good per realm market.

- **Production:** from province terrain and buildings, monthly, with a yearly harvest draw.
- **Consumption:** from population by class, using a Patrician-style table per 100 people, plus armies at war.
- **Price:** Patrician's piecewise curve on days of consumption.
- Delete the 20% pull to target. Keep the lore exports and imports, now as production weights. This one change carries most of the Economy score.

**6. Wages as transfers.**

- Every wage (`careerYear`, military pay, noble income) is paid by an account: the crown treasury, a house, a guild or a company. If the account is short, pay falls into arrears, which is an event.
- Rescale crown income so a peasant household pays about a tenth of its income.
- Add a ledger test that fails on any unlogged creation of money.

**7. Holdings tied to markets.** A farm's income is its harvest × the local grain price − upkeep. A fishing boat adds fish to the market's stock, so many boats crash the price. Managing more than 3 + skill/20 holdings needs a paid steward.

**8. Crisis demand.** Famine, siege and blockade flags on a realm market, set by world events and by the 3,199-event library where it already writes famines. Armies at war buy grain, iron, horses and arms from their home market.

**9. NPC caravans.** One caravan per trade pact, running between capitals along the road graph the supply system already uses. Each visit moves stock and prices a few percent; start at 4%, which is where Warband's designers ended up. Bandit and war events can destroy one.

**10. Bench.** Add the metrics from the section 3 table to `bench/run.mjs` and `bench/rubric.mjs`. Drop the "hoarding" idea and replace Economy's two current metrics, which a static price list already passes.

**11. Trade runs take days.** `A.tradeRun` advances the clock by the run's days (or queues the player away from home). It gives the merchant life the road the plan imagines.

**12. Chains.** Three only: iron → steel → arms, wool → cloth → fine cloth, grain → ale. Each link is a holding with input bought at market. No new goods beyond what the 21 already allow, except ale.

**13. A court of people.** Wire the 573 cast members' written wants and fears and the 180 houses into faction leadership and council seats. This needs writing time and is shared with the Relationships aspect.

**14. People gates.** Playtest mode already exists. Add two tasks: predict 10 AI answers with the percentage hidden, and explain one price difference.

**Expected scores.** Features 1 to 4: Diplomacy 4 → about 6. Features 5 to 11: Economy 3.5 → about 6.5. A 9 or 10 needs features 12 to 14: a court of written people, chains, and real players passing the gates.

**What to cut instead.** "Road to 100" suggests dropping Victoria-style prices in favour of production and caravans only. This benchmark agrees on dropping Victoria 3's order book and pop simulation. It disagrees on prices: a Patrician-style stock curve is cheaper than both and is what makes caravans and famines readable. Keep the curve, skip the order book.

## 6. Sources

**Crusader Kings III** (game files, third-party mirror; version not pinned)
- AI value scale: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/script_values/00_ai_values.txt
- Traits and their AI values: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/traits/00_traits.txt
- Alliance and call-to-arms acceptance: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/character_interactions/00_alliance.txt
- Interaction format, acceptance breakdown headers: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/character_interactions/_character_interactions.info
- Defines (opinion decay, offensive war penalty, soldier cost): https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/defines/00_defines.txt

**Europa Universalis IV** (a mod's copy of vanilla files; values may differ)
- Ruler personalities: https://github.com/SpiritBaker/Difficulty-and-AI/blob/master/common/ruler_personalities/00_core.txt
- AI strategic personalities: https://github.com/SpiritBaker/Difficulty-and-AI/blob/master/common/ai_personalities/00_ai_personalities.txt

**Stellaris** (3.8.4 vanilla mirror)
- AI personalities: https://github.com/ShammyZut/Stellaris-3.8.4-Vanilla/blob/main/common/personalities/00_personalities.txt

**Victoria 3** (game files, version-tracking mirror)
- Market defines: https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/defines/00_defines.txt
- Goods and base prices: https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/goods/00_goods.txt
- Buy packages by wealth: https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/buy_packages/00_buy_packages.txt
- Pop needs and substitution: https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/pop_needs/00_pop_needs.txt
- Diplomatic action format (acceptance by sign, random approval, owed favours): https://github.com/tjysdsg/Victoria-3-files/blob/master/game/common/diplomatic_actions/diplomatic_action.md

**Patrician III** (community reverse-engineering book "Patrician 3 Insights")
- Price thresholds: https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/thresholds.md
- Buying price: https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/buying-price.md
- Selling price: https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/selling-price.md
- Base prices: https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/ware-prices/base-price.md
- Consumption by class: https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/population/consumption.md
- Satisfaction: https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/population/satisfaction.md
- Excess consumption: https://github.com/P3Modding/p3modding.github.io/blob/master/src/towns/excess_consumption.md
- Auto-route file format (20 stops, 24 goods): https://github.com/marco-zanella/p3-autoroute/blob/master/README.md

**Mount & Blade: Warband** (official module system 1.171, mirror)
- Trade, price and caravan scripts: https://github.com/int19h/mb_warband_module_system/blob/master/Module_system%201.171/module_scripts.py
- Production slots and price constants: https://github.com/int19h/mb_warband_module_system/blob/master/Module_system%201.171/module_constants.py

**Anno 1800** (fan calculator data extracted from the game)
- Production rates, upkeep, needs per resident: https://github.com/NiHoel/Anno1800Calculator/blob/master/js/params.js

**Ardan**
- `docs/plan/Ardan The Road to Ten.md`, `docs/reviews/Ardan Road to 100.md`, `docs/reviews/Ardan Deep Analysis.md`
- `reports/fixes.json`, `reports/scorecard.md` (bench values quoted as such)
- `features/20-ai-personality/` (work in progress, not measured here)

## Appendix: how the Ardan numbers were measured

Build: `node tools/build.mjs --out=/tmp/ardan/diplo-eco/x.html --unpack=/tmp/ardan/diplo-eco/blobs` (fix layer, 29 patches, no WIP features). Code was read with `tools/show.mjs --dir=...`. Each script loads the page in Playwright Chromium, waits for `ARDAN_CONTENT_READY`, and drives the engine through `A.*`. None of the runs threw a page error.

1. **World run** (diplomacy, AI treasuries, grain). Seeds 606, 1212 and 2424.
   - Each starts as a human peasant in POL-01, age 16, story difficulty, then runs 60 years.
   - Each step is `A.advance(30)` followed by draining the queue with `A.eventAuto` and `A.skipPrompt`. If the player dies, play continues as any living adult.
   - `A.forcesAI` and `A.trainDiv` were wrapped at runtime. Deleted gold = treasury before − treasury after − division spending − debt repaid inside the call.
   - Grain is sampled per realm per step.
   - New wars come from `A.S.wars`, and alliances from each realm's `allies`.
   - Each year, the total of `A.realmStanding(a, b)` is paired with the next year's change in `r.rel[b]`.
   - About 20 seconds per world.
2. **Trade returns.**
   - Four merchant starts (POL-01, POL-05, POL-02, POL-20), age 30, each given a wagon (16 loads).
   - For each of the 21 goods, 33 destinations and cargo sizes 1 to 16: buy cost with slippage from `A.buyPrice`, sale from `A.runPlan`, expected loss = risk × 0.375 (the midpoint of the loss roll).
3. **Exploit test.** Seeds 3, 5, 8 and 21, 1,000 suns, 10 years, three twins:
   - a greedy bot that takes the best expected run whenever initiative allows;
   - a bot that buys the best-yield holding it can afford every year;
   - a twin that does nothing.
   - Careers diverge between twins, which is why the result is reported as "not fairly testable".
4. **Wages.** Seed 77, a merchant in POL-05 set to each rank of the merchant career, coin zeroed, poor lifestyle, 3 years.
5. **Offer predictability.** Seeds 11, 12 and 13, a royal made ruler with `A.makeRuler` and `playerRun`.
   - Each year for 5 years, every offer with a chance in `A.diplOptions(r, t)` toward every living realm (3,639 offers).
   - Best guess rate = mean of max(p, 1 − p).
6. **Static counts.** An acorn walk over `ardan-core.js` counted `traits`, `A.AGGRO` and constant `A.chance(x)` calls in 17 AI functions. Formulas are quoted from `A.mktMonth`, `A.priceTarget`, `A.forcesAI`, `A.worldYear`, `A.diplOptions` and `politicsYearNow`.
