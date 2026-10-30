# Fresh realms and starting tensions

**Aspect:** Replayability (Road to Ten, Replayability 3) · **Kind:** system, no patches, no events, plus a bench (`classify.mjs`, the life-arc classifier)

The plan asks to "vary the world each run: different starting tensions, history branching differently, and smaller realms generated fresh". Its bar: "a bot classifier sorts 100 runs into 8 or more distinct life-arc types with none above 25%".

The release rolls 13 scripted branches of history in the first year. 43-varied-worlds varies fortunes, moves 2 to 4 borders by an older war, starts feuds and breaks alliances. Neither makes a new realm: the map's provinces are fixed shapes. But a realm is a set of provinces with a ruler, a house, laws, a culture and a faith, so a smaller one can be made by splitting a larger one.

**What it does.** A game started from the menu (`o.world: 'varied'`, the guard 43 uses) also:

- **Splits 1 to 3 of the larger realms.** A realm of 8 provinces or more, at peace, loses 2 to 4 contiguous provinces on its far side from the capital. The breakaway holds at most 30% of the parent's provinces and 35% of its people, and the rest of the parent stays in one piece. It broke away 6 to 40 years ago (2 to 12 for a prince). There are four kinds:
  - a duchy that broke free;
  - a march on a border;
  - a league of free towns (two towns of 4,000 or more);
  - a rebel prince's holding, ruled by a sibling of the parent's ruler, from the royal house.
- **Names it in its people's style.** The name follows the people and their naming rule (`GD.NAMING`). A league takes the culture's own word for a council (54-voices). Some examples from the tests:
  - *Clan Thamad of Jalar Oasis*, a Sand Clans breakaway whose ruler is Chieftain Ghanim Thamad;
  - *Priory of Bellcrest*, from Skyhold, under Abbess Lhamo Bluewater;
  - *Prince Nimrovan's Sylvaran*, from the elves;
  - *Emirate of Nahin*, from Qadir;
  - *the Grakzag Oasis Clans*, from the Horde;
  - *the Gorur Caravanserai Clans*, from the Horde; *Duchy of Castella*, from Varenna; *March of Zorek*, *Duchy of Zorek*.
- **Gives it a ruling house.** This is the strongest great house seated in its provinces, whose head (often a lore character) takes the throne. If no great house is seated there, a new house is made with a surname in the culture's style. The other great houses seated there go with it, and so do the people who live there.
- **Gives it its parent's ways.** It keeps the parent's laws, faith, culture, coin, army quality and doctrine. Its realm bible (47) has its own want, fear and place, and inherits the parent's customs. Its culture and faith are registered in the realm tables (`GD.REALM_CULTURE`, `GD.REALM_FAITH`, `A.AGGRO`, `GD.DOCTRINE`), so its children, its voice (54) and its customs are its parent's people's.
- **Shares out what the parent had** in proportion to the people taken: the army, the levy, the ships, the treasury and the income. The parent's divisions in the lost provinces fall back to its own garrisons, and the parent sheds the men. The breakaway musters its own divisions and gets a market with its parent's exports and imports.
- **Leaves a quarrel.** The parent:
  - claims every lost province;
  - writes "Took Zorek from us" in its feud ledger (55-bonds), dated to the year of the break;
  - remembers the land taken (`took_land`);
  - and is either under a truce that ends in 1 to 4 years, or (one time in four) still at war to take it back, by right of reconquest.

  The parent's rivals are warm to the breakaway and its allies are cool. A bordering rival may already be its ally. All of this is in the release's own diplomacy, so the AI reads it in its war choices: a claim counts 12 points of opinion and a cause 10.
- **Seeds 1 to 3 starting tensions.** Each is a state the engine runs:

  | Tension | What is set | What runs it |
  | --- | --- | --- |
  | Disputed succession | a claimant faction of the 2 or 3 strongest houses, their opinion of the crown at 18 to 32, the ruler's legitimacy at 30 to 42 | the release's factions: discontent, demand, concession or revolt |
  | Famine | the last harvest failed: the granary at a fifth of normal, the year's harvest no better than poor, stability and unrest | 45-economy's stocks and prices, caravans, and 52's "hungry year" arc (or ×2.5 on grain in the release's market) |
  | Holy war brewing | a zealous realm's holy cause against a neighbour of another faith, and an incident between them | the AI's war check (`A.cbOn`), cheaper infamy and the stability a holy war gives |
  | Regency | the ruler died last winter, and a child of 4 to 13 rules under a regent: the spouse, a sibling or the strongest lord | the release's succession, which may be contested. With 20-ai-personality, the regent's traits set the realm's temper. The regency ends at the coming of age (legitimacy +10, news) or passes to a new regent if the regent dies |
  | Unpaid debt | one realm owes a neighbour 30 to 60% of a year's income | each New Year: a fifth paid, or a payment missed. Two missed give the creditor a cause for war ("Refused tribute") |

- **Records it.** The new realms and the tensions go into the world's history and the world record (57: "founded, its freedom won in war against Aldmark"). They are told at birth: "Older quarrels shape the year you come into. March of Juwalo broke away from Zanara 32 years ago, and Zanara still claims it. Sylvaran owes Eldergrove 40,800 suns from a loan of 1098, and has paid none of it back. Raja Indrajit Ranavir of Ranpur died last winter; Raja Vikram Ranavir, aged 12, rules …"
- **Adds a card to the Realm tab.** "Old quarrels" lists the fresh realms and tensions in your realm and its neighbours, such as "Princess Elswyth's Aldmark (a rebel prince's holding) holds Carrness, Thornstone, taken from Aldmark in 1101."

Games started by code, such as the tests and the bot league, keep the world as written. A varied world started with `fresh: false` is varied but not split.

**Measured by** (`test.mjs`; every test passes on `--only=fresh-realms` and on the full build of 65 features).

| Test | Result |
| --- | --- |
| `freshRealmsValid` | In 24 varied worlds there are 47 fresh realms, 1 to 3 a world: 19 duchies, 17 marches, 9 princes and 2 leagues. Each one: 2 to 4 contiguous provinces that are all it owns; its capital among them; not the parent's capital; 0 to 29% of the parent's people (median 14%); a living ruler; a house; words with no raw token; every province claimed by the parent; the parent still in one piece; opinion of −30 or worse both ways; a truce or the war; divisions; the parent's culture and faith; a bible with customs; a feud-ledger line. 0 invalid. The treasury and income are shared out exactly in 47 of 47 parents (`--only` build: 49 realms, 0 invalid) |
| `freshDeterministic` | The same seed gives the same world. 10 seeds give 10 different sets of fresh realms and tensions. The world as written gets no fresh realm, no notes and no tensions. `fresh: false` gets none. No table entry is left from an earlier game |
| `freshRealmsRun` | Four worlds played 6 years. Every standing fresh realm's treasury and relations move, and its market has prices and stocks (with 45-economy). 8 to 23 news lines a world name a fresh realm. On `--only`, 1 of 8 fell in that time |
| `freshRealmsRender` | Every tab is drawn twice with the player living in a fresh realm, plus the codex's houses and power views (66 draws, no error). The second pass changes neither `A.S` nor the random stream. The first pass is a warm-up, because the release fills a realm's market and a job's standing the first time it draws them. Markup in a fresh realm's name and want is drawn as text. The parent's Realm tab shows "Old quarrels" |
| `freshSaveLoad` | A new game drops the fresh realm's table entries. The save loads with the same realms and the culture registered again, and plays on. A save with none of the new fields loads and plays |
| `tensionsRun` | **Succession:** a claimant faction of 2 houses, whose discontent the release moves (45 → 43 in a year on the full build, 54 → 58 on `--only`). **Famine:** in its dearest month, grain is at 1.89× its base price against 1.23× in the median realm (2.52× against 1.14× in the release's market). With 45-economy, caravans refill the granary within two months, and the price falls back toward the median by month six. **Holy war:** the AI's cause reads "holy", and opinion is −39. **Regency:** a king of 9 under his kin, the persona read from the regent, and the regency over when he comes of age. **Debt:** a debtor who cannot pay misses 4 payments and the creditor gains "tribute"; one who can pays 220,080 of 550,200 in a year (two New Years) |
| `freshTold` | Three lives are told 2 to 4 notes at birth, with no raw token |

43-varied-worlds: three of its four tests pass on the full build with this feature. `variedWorldPlays` passes or fails on the random stream. It plays three fixed seeds and needs all three to live 4 years. On the current full build, seed 423's life dies in 1106 of "a bad tooth that poisoned the blood", in Solenne, where no split or tension reached. It lives with `fresh: false`, and the test passes on the same build without this feature. An earlier full build passed it with this feature. The fix belongs in 43's test (more seeds, or allow one early death), which this package does not own.

**The classifier** (`classify.mjs`). It plays 100 bot lives in menu worlds (`world: 'varied'`), 60 years from 16, over 16 starts: seven peoples' realms; slave, serf, peasant, artisan, merchant, gentry, noble and royal. It rotates four personalities, and plays two lives in three engaged and one passive. Each life is sorted by what the game recorded, the first type that fits:

| Type | Rule |
| --- | --- |
| Cut short | died before 25 |
| The crowned | held a throne |
| Risen from below | freed, or ended The Risen or From the Dust to the Throne, or two rungs up from common |
| The commander | captain or above, or ended The Commander |
| Outlaw and prisoner | died in chains, a third of the life on the outlaw's path, or five years in prison |
| A soldier's life | a third of the life a soldier, ten battles, or five years a sellsword |
| Lord and courtier | half the life a lord (46's path), or an office of state |
| The trader's fortune | half the life a trader, or died wealthy |
| Master of a craft | ended Master of the Craft, or rank 4 in a trade |
| A life in the faith | a third of the life a priest, or Of Good Repute Before the Gods |
| The learned | a third of the life a scholar, or The Learned or Keeper of Secrets |
| Road and wild | The Wanderer, Who Knew the Wild, Remembered |
| Kin and household | Root of a Great Tree, Well Loved, or two kin stories (50) past their second scene |
| The common lot | none of these |

Results, on the full build (65 features) before this feature (built without it) and after, the same 200 seeds in two sets of 100:

| Type | Before, set 1 | Before, set 2 | **Before, pooled (200)** | After, set 1 | After, set 2 | **After, pooled (200)** |
| --- | --- | --- | --- | --- | --- | --- |
| Cut short | 23 | 23 | **23%** | 27 | 23 | **25%** |
| The crowned | 5 | 3 | 4% | 1 | 3 | 2% |
| Risen from below | 6 | 5 | 5.5% | 5 | 5 | 5% |
| The commander | 17 | **27** | 22% | 15 | 19 | 17% |
| Outlaw and prisoner | 6 | 3 | 4.5% | 9 | 9 | 9% |
| A soldier's life | 5 | 3 | 4% | 7 | 5 | 6% |
| Lord and courtier | 13 | 15 | 14% | 10 | 13 | 11.5% |
| The trader's fortune | 21 | 12 | 16.5% | 17 | 15 | 16% |
| Master of a craft | 0 | 0 | 0% | 3 | 0 | 1.5% |
| A life in the faith | 2 | 2 | 2% | 3 | 4 | 3.5% |
| The learned | 1 | 5 | 3% | 3 | 0 | 1.5% |
| Road and wild | 0 | 0 | 0% | 0 | 1 | 0.5% |
| Kin and household | 1 | 0 | 0.5% | 0 | 1 | 0.5% |
| The common lot | 0 | 2 | 1% | 0 | 2 | 1% |
| **Types found** | 11 | 11 | **12** | 11 | 12 | **14** |
| **Largest** | cut short 23% | commander **27%** | cut short 23% | cut short **27%** | cut short 23% | cut short 25% |
| **The bar** (8+ types, none above 25%) | pass | **fail** | pass | **fail** | pass | pass, at the edge |
| Effective number of types (e^entropy) | 7.69 | 7.41 | 7.82 | 8.04 | 8.36 | **8.55** |

- **The bar sits on the edge either way, and this feature does not decide it.** Two types carry it:
  - *Cut short*: 21 to 27% of bot lives die before 25. The causes are ordinary: hanging, fevers, a fall on the ice, a bad tooth, a wound gone bad. No early death in either build came in battle. After the feature, 9 of the 50 early deaths were of lives living in or next to a fresh realm, about the share of all lives that were (39 of 200).
  - *The commander*: 15 to 27%. 28-endings' "The Commander" is the most common ending after the wealthy.

  Each of those swings by four or more points between two sets of 100 seeds, so one run of 100 passes or fails on the random stream. Over 200 lives, both builds pass.
- **What moved.** Three changes held in both seed sets: more types were found (12 pooled before, 14 after), the effective number of types rose (7.69 and 7.41 before, 8.04 and 8.36 after), and the share of commanders fell (22% to 17% pooled). Outlaw and soldier lives rose. This is a small effect, measured on bot lives whose random stream the feature also changes.
- **How many lives a fresh realm touches.** All but 4 of 200 lives were in a world with one. 39 of 200 (13 and 26) ended living in a fresh realm, its parent or a neighbour. There were 2.0 starting tensions a world.

Run it with `node features/70-fresh-realms/classify.mjs <built.html> --lives=100 --json=out.json` (about 35 to 40 minutes a hundred lives). `--seed=19001` was the second set, and `--from=a.json,b.json` pools saved runs.

**Rules kept.**
- Everything is drawn from the game's own seed, in `A.initWorld`, while the world is made. The month hook draws nothing. The same seed gives the same world (`freshDeterministic`).
- The new state is optional, so old saves load: `r.fresh`, `r.regency`, `S.freshTensions`, `S.freshNotes`, `S.freshTold` and `S.nextFreshHouse`. The realm tables are data, rebuilt from the save on every load (a wrapper of `A.migrate`) and cleared on every new game.
- The card only reads, and every word on it goes through `UI.esc`. Names and notes hold no `<`, `>` or `"`.
- No patches: wrappers of `A.newGame`, `A.initWorld`, `A.migrate`, `A.housesFor` and `A.familiesFor` (a noble start is not given a house that went with the breakaway), `A.rulerPersona` (the regent) and `A.BIBLE.of`, plus a month hook.

**Limits.**
- **Smaller realms only, from existing shapes.** No province is made or reshaped. A fresh realm is cut from a larger one, so the map has 35 to 37 realms rather than 34. No two small realms are merged by an old union; that was optional and left out.
- **You cannot be born in one.** The creation screen lists the 34 realms of the lore. A life can move to a fresh realm, serve it or be conquered by it, and every tab draws there.
- **Leagues are rare.** A league needs two towns of 4,000 or more in the breakaway, and the outer provinces of large realms seldom have them: 2 of 47.
- **The bible is short.** A fresh realm's want, fear and place come from 2 or 3 written lines per kind, filled with its own names. Its customs are its parent's.
- **The classifier's bar is met by the world before this feature.** See the results above. The plan's second half, that playtesters start a third run on their own, needs people.

## Writer's pass (round 7)

Each kind of fresh realm has four wants, four fears and two places instead of two, two and one, worded so that the
parent's name needs no verb to agree with it and no 's ("a crown other than that of {parent}", "the lords of {parent}").
The pick is still one `A.pick` each, so the random stream is drawn as before. (No fresh realm formed in the 12 harvested
lives, so the new lines were not seen in play.)
