# Cycle 2 review: the world and its systems

*Reviewer "world and systems", Oct 29. The question: does one world run together, month by month, for a century? Judged on two halves: which of cycle 1's world findings were fixed, and how the new systems (9996 polity, 9997 companies, 9995 trade roads, 66 markets, 9990 journeys, 9991 atlas, 57 world chronicle) hold up over decades. Built game: commit 89dfb45, built privately. Lore: `canon/lore/` (read, not quoted).*

## Method

All scripts and outputs are in `/tmp/ardan/cycle2/world/` (written `W/` below).

- **Builds.** `W/kw.html` is the default build (`node tools/build.mjs --out=…`). The Great Continent is the same file with `A.newGame({ lands: 'great' })`; `tools/build.mjs` has no lands flag. `W/nopol.html` is built `--without=polity`, for an A/B of the Polity's effect.
- **Century soaks.** `W/s/soak.cjs` starts a peasant of 16, auto-chooses every event, and plays months of 30 days. When the player dies it moves to another adult, of the same realm if one lives. Each month it records the month's time, province owners and wars. Each year it records every realm (provinces, people, treasury, income, debt, army, legitimacy, stability, ruler, the eight laws, the five estates' approval, market prices, offices, divisions), factions and their power, `A.POL.stats`, `A.CO.stats`, divisions' morale, bread and pay, goods on the road, and the chronicle's record by kind. Analyser: `W/s/an.cjs`; summaries `W/an-*.json`.
  - **Known World:** seeds 606, 1212, 2424 and 4848, from Aldmark, Lucerna, Solenne and Ashmere, 110 years each (`W/kw-*.json`).
  - **Great Continent:** the same four seeds, from Taulen and Aldmark in turn, 105 years each (`W/gc-*.json`).
  - **Known World without the Polity:** the same four seeds and homes, 110 years (`W/kwnopol-*.json`).
  - 12 worlds, 1,300 world-years. **No page error in any of them.**
- **Lore check.** The 118 far rulers at the start against cycle 1's `lore-rulers.json` (taken from `far-lands.json`).
- **Turn time.** Each soak's median month and year-turn month by decade, as `performance.now()` inside the page. The machine was shared with three other reviewers (load 8 to 10 on 4 cores), so treat single readings as ±30%. Plus `features/09-scale/great-bench.mjs --profile` for 13 months from Taulen.
- **Caveats.**
  - The harness swaps the player by setting `S.pc`, so a realm the player once ruled stays `playerRun` and spends nothing (56's ladder skips the player's realm). Taulen's 476 M hoard in seed 606 is that, and it is left out below.
  - The atlas (9991) and journeys (9990) are player-only by design, and an auto-played peasant never takes a road. I judged them by their code and tests, not by the soaks.

## Verdict

Cycle 1's lore fixes held for a century. All 118 far rulers have the lore's sex and birth year, Hvaldi is a giantess, and the khagan's death, the War of the Felt, the Strait and the Sunrise election all fire. The 1105 border wars move one to three provinces, far news arrives late and wrong and is then mended, and silk is now nine times dearer in the west than in Taulen.

The new systems run every month in every realm without errors. The Polity holds 2,100 bills and 130 named elections a Known World century, and 700 elections on the Great Continent. Treasuries are not running away: they climb from a quarter-year purse to three years of income by about 1145 and then stay flat.

What breaks the world over decades is **its edges**. A realm that goes broke raises armies without limit: the Nine Wells, a one-province oasis league, ends with 1.47 million men. A winning revolt leaves a realm that is a rebel forever. 9997 turns both into millions of deserters. In the middle, the world is **too content to change**:
- legitimacy sits near 90 everywhere, with the Polity or without it;
- fewer than 4% of estates are ever angry;
- Zanara falls in seven worlds of eight, Kethra in four of four.

The machinery is all there. What is missing is the pressure that makes it move.

## Ranked summary

| # | Finding | Impact | Size | Owner |
| --- | --- | --- | --- | --- |
| B1 | A bankrupt realm raises armies without limit (the Nine Wells: 1.47 M men, 309 divisions, debt 33.6 M) | 5 | M | 04-world-fixes, 56-realm-inside |
| B2 | A revolt that wins leaves a realm marked rebel forever: frozen income, no diplomacy (8 to 10 such realms in 4 worlds) | 4 | S | 03-engine-fixes |
| F1 | Legitimacy sits at about 89 in every realm, so claimant factions cannot form; civil wars −12% with the Polity, not −35% | 4 | S | 9996-polity |
| F3 | The same history every seed: Zanara falls (22 → 0–6) in 7 of 8 worlds, Kethra halves in 4 of 4 | 4 | M | 20-ai-personality, 68-casus-belli |
| B3 | 9997 turns permanent arrears into endless churn (up to 706,000 captains leave and 3.5 M men desert a century) | 3 | S | 9997-companies |
| F2 | Estates are almost never angry (0–2 of 170 in the Known World), so petitions and anger in factions barely fire | 3 | S | 9996-polity |
| F5 | The Silk Road's brokers are broke for most of a century (Lake Steppe, Felt Keepers, Ushivar, Navesht) | 3 | M | 9995-trade-roads, 56-realm-inside |
| F4 | Twin Rivers peaces still move 16 to 21 provinces; 11 to 16 peaces of 10 or more a world | 3 | S | 09-scale |
| F7 | Prices that only climb: Known World ivory ×3.8 in every world; far silver ×3.8, jade and paper ×3 | 3 | M | 45-economy, 9995-trade-roads |
| F8 | 9997's bread, pay and promotion sleep in a healthy realm; up to 25% of battalions lack a senior captain | 3 | M | 9997-companies |
| F9 | Turn time: Great Continent month 0.33–0.92 s, year turn 1.0–2.7 s, worst 8.5 s; people ×2.7 | 3 | M | 09-scale |
| F6 | Treasuries ×13–20 is convergence, not runaway; the far ledger is still off; taxes at an extreme for 62–67% of realms | 2 | S | 56-realm-inside, 9995-trade-roads |
| B4 | 9997's companies drift from `d.men` 400 to 2,400 times a century (README: 0) | 2 | S | 9997-companies |
| B5 | Words: "Sand Clans wins", "The The Chain Keepers", "of Ridges"; Known World war names repeat | 2 | S | 991-far-war, 09-scale |
| F10 | 10 to 19 far realms never fight or change a border in 105 years | 2 | S | 20-ai-personality |

---

## Cycle 1's findings: what was fixed

| Cycle 1 | Status | Seen in cycle 2 |
| --- | --- | --- |
| B1 lore rulers wrong sex and age | **Fixed** | 118 of 118 rulers have the lore's sex and birth year (3 seeds). Hvaldi is a giantess born 1004. "The War of the Felt" is fought in 1105–1106 (seed 606); `fwLoreDates` covers Tegur and Ulgai. |
| B2 first-year avalanche | **Fixed** | The three lore wars are border wars: Kethra loses 3 provinces in "The War of Saar", the Right Wing 3, the Black Lamp 1. Wars begun and ended inside 1105: 3 to 5 (was 6 to 10), several of them Known World wars. |
| B3 Twin Rivers trade provinces by the score | **Partly** | The 15% share cap holds, but 15% of the Twin Rivers' people is still about 20 districts (F4). |
| B4 Fjorund Northfolk, two realms with no faith | **Fixed** | Fjorund is `CUL-82`, faith `REL-12`; Hadun `REL-07`; no realm has no faith. |
| B5 unheld land with millions | **Fixed** | 194 unheld far provinces with 1.32 M people (219 and 3.12 M with the Known World's 25). Only about 10 are settled in a century, which fits the lore's refuges. |
| B6 repeated war names, singular verbs | **Partly** | Far wars take ordinals ("The Sixth Red War"). Known World wars do not, and succession wars bypass the namer everywhere (B5). |
| B7 stuttering place names | Fixed by its test (`flLoreWorld`) | Not re-measured. |
| B8 legend and neighbour colours | Fixed by 62 and 91 (`inkLegendView`) | Not re-measured; the visual reviewer's ground. |
| B9 far wars on the first day | **Fixed** | `S.newsPre` holds them; no far line on 1 January. |
| I1 the Silk Road is not a road | **Fixed** (9995) | Silk is 103–127 in Taulen and 870–1,050 in Aldmark and Ostra. 6,500 to 9,800 consignments are on the road at once. |
| I2 lore conflicts never trigger | **Fixed** (991) | The War of the Strait (1106–1108), the War of the Felt and the Sunrise election all fire. |
| I3 far treasuries balloon | **Open** | See F6: it is convergence, and `A.TRADE.APPLY_LEDGER` is still off. |
| I4 Known World institutions abroad | **Partly** | Offices have far names (Prefect, Chief of a thousand). Coin names show only on 9995's long-roads card. |
| I5 word from the east late but never wrong | **Fixed** | "Word from the east, by way of Nine Winds (of 1204)"; 5 or 6 "Later word … mends the first" lines in the last 220 news lines. |

---

## Bugs

### B1. A bankrupt realm raises armies without limit
- **What I saw.**
  - **Seed 2424, Great Continent: the League of the Nine Wells (`POL-81`).** The lore's oasis league starts with 1 province, an income of 10 and 2,400 men. It takes two provinces by 1120, and its treasury goes negative and stays negative for 96 years. Its army:

    | Year | Men | Divisions | Debt |
    | --- | ---: | ---: | ---: |
    | 1148 | 4,260 | 4 | 0 |
    | 1155 | 332,689 | 112 | 3.8 M |
    | 1162 | 868,460 | 184 | 9.9 M |
    | 1197 | 1,468,313 | 309 | 33.6 M |

    It does this on an income of 26,690, and every jump is a war year. That is a larger army than Taulen's.
  - **Seed 4848, Known World: the Hall of Valdhall (`NEW-3`, 3 provinces).** It reaches 128 divisions of about 650 men each, with debt between 0.4 M and 2.1 M for 60 years.
  - **Every Great Continent world has 4 to 8 realms that are broke for 40 to 105 years** (see F5).
- **The cause.** In the release's `A.indMonth`, `A.emergencyLevy(r)` (at war) and `A.queueStep(r, 30)` raise and build divisions with no money gate. Its industry lines also charge `work × 9` suns a month to the treasury, whatever the treasury holds. 56's sellswords do check the purse (`RI.hireMercs` needs treasury above half a year), so they are not the cause.
- **Why it matters.** A broke oasis outnumbering the Twin Rivers is the opposite of the lore. These armies also feed 9997's desertion churn (B3) and slow the war tick.
- **Fix.** In `04-world-fixes`:
  - no emergency levy or new division while `treasury < 0` and debt is above a year's income;
  - pay the industry's work only from a positive treasury;
  - when debt passes two years' income, disband the newest divisions down to what the income can keep (3.2 suns a man).
- **Size M · Impact 5.**

### B2. A revolt that wins leaves a realm that is a rebel forever
- **What I saw.**
  - The release sets `isRebel = true` at a revolt (`A.factionRevolt`) and never clears it. When a liberty war ends without the rebels' defeat, the new realm lives on as a rebel. Rebel realms alive at the end:
    - **with the Polity:** 8 in 4 Known World worlds;
    - **without it:** 10 ("Clan Emberhand 1113", "Breadbreakers of Graknak 1114", "Qatrani 1114" …).
  - **Hall of Valdhall (seed 4848, born 1131):**
    - its income stays exactly 404,551 for 80 years;
    - it is left out of `A.diplomacyYear`, `politicsYear` and every alliance pick (`!o.isRebel` in about 50 places);
    - its treasury stays below zero from 1163;
    - its legitimacy falls from 30 to 0 (9996's "claimant 30" start, with no way up).
  - **Hall of Valdgard (born 1120):** income 807 for 95 years.
- **Why it matters.** These are the world's new nations, the thing a living map should make. They become frozen, friendless, bankrupt shells that the AI cannot even attack as a normal realm.
- **Fix.** In `03-engine-fixes`: when a `liberty` or `independence` war ends without the rebel realm's return to its parent, clear `isRebel`, set `isNew`, give it a truce with the parent, and run `A.polInit` and an income pass. A save with an old rebel realm older than its war: clear it on load. 9996 should then treat such a realm's legitimacy as "founded" (about 45), not "claimant 30".
- **Size S · Impact 4.**

### B3. 9997 turns permanent arrears into endless churn
- **What I saw.** `CO.month` puts every division a month further in arrears while `treasury < 0`, takes 10 a month from captains' satisfaction, and lets a captain leave at −50. His serjeant takes over and goes the same way.
  - Over a century, seed 4848 (Known World): **626,925 captains left** and 301,426 men deserted, from realms in B1 and B2.
  - Seed 2424 (Great Continent): 705,978 left and 3,509,045 deserted.
  - Seed 606 (Known World), with no such realm: 548 and 5,188.
- **Why it matters.** The numbers drown every real story of pay (an unpaid army before a battle). They also cost time on every record of the realms that can least use it.
- **Fix.** In `9997-companies` (`CO.month`):
  - arrears count only while debt grows, or past a year of income;
  - a captain who leaves through arrears is not replaced until the New Year;
  - a division a year unpaid melts away as one: its men go home (`P.coDes`), with one chronicle record and one news line.
  - Fixing B1 and B2 removes most of the cases.
- **Size S · Impact 3.**

### B4. Companies drift from `d.men`
- **What I saw.** `CO.stats.mismatch` counts `CO.ensure` settling a division whose companies no longer sum to `d.men`:
  - 416 to 668 a century in the Known World;
  - 2,051 to 2,414 on the Great Continent;
  - 21 within the first 3 years of seed 606.

  The README says "0 in every run so far".
- **Why it matters.** Each settle is a write that went round `A.divLose` and `A.divRefill`, so losses are not on the companies that fought. 23's report and the honours read those companies.
- **Fix.** In `9997-companies`, log the first settle's `d.id`, its delta and the month's fight and refill events in a debug run, find the release path that writes `d.men` directly (likely `A.divReinforce` from `A.forcesReconcile`, or a merge), and wrap it.
- **Size S · Impact 2.**

### B5. Words: plural verbs, double articles, repeated names
- **What I saw** (history and news of the four Great Continent worlds; 32 hits):
  - **Singular verbs:**
    - "The War of Zahira ends: Sand Clans wins" (a Known World realm, so 991's `A.realmVerb` is off);
    - "The Cloud Ridges declares war";
    - "The Salt Wells of Moi becomes a tributary of The Elephant Lords".
  - **Articles:**
    - "The The Chain Keepers is cut off and destroyed at Shulai" (the release's ``The ${d.name}``, with a far order named "The …");
    - "Raaoo Jiashing of Ridges is dead";
    - "War declared by Longhouses".
  - **Names:**
    - "Saru the House of the Nine Horns of Tanomin";
    - "King (the Mountain King) Srinlea".
  - **Repeated names.** Known World war names repeat, because 991's `FW.uniqueWarName` returns early outside a far game:
    - "The Crown War" 4 times in seed 606;
    - "The Long War" 5 times in seed 1212;
    - "The Bitter War" 5 times in seed 2424.

    Succession wars are named by `A.startWar` directly and skip the namer in both lands: "The War of the Tessaria Succession" appears 7 times in seed 606 (Great Continent) and 5 times in seed 1212 (Known World).
- **Fix.**
  - In `991-far-war` `e-words.core.js`, run `uniqueWarName` and the plural verbs in both lands, and apply the ordinal in `A.startWar` too.
  - Use `A.realmRef` in the division-destroyed line, and in 09-scale's death and war-declared news lines.
- **Size S · Impact 2.**

---

## Findings

### F1. Legitimacy sits at about 89 everywhere, and claimant factions cannot form
- **What I saw.**
  - **Median AI legitimacy:**
    - 71 to 72 in 1106;
    - 84 to 86 by 1115;
    - **89 to 90 from about 1125 to the end**, in all four Known World worlds.
    - p10 at the end: 65 to 83. Minimum: 37 to 70.
    - The Great Continent median is 87 to 88.
  - **Without 9996** it is higher: 94 to 98 at the end, p10 65 to 90.
  - **The release's claimant faction needs `r.legit < 45`** (`A.factionsYear`), so neither build ever comes near it.
  - **Civil wars over 4 × 110 years:** with the Polity, 29 (21 throne, 8 liberty); without it, 33 (23 and 10). That is −12%, with all wars −10% (175 against 194). Cycle 1's "about 35% lower" (6 worlds) does not hold up on 440 world-years: the Polity is not what suppresses civil war. Both builds are a world of secure thrones.
- **Why it matters.** 9996's legitimacy parts are its best idea: a crown that sits easy or not, for reasons the tooltip shows. But the parts add up to a near-constant. Here is the mark for a ruler of 15 years:
  - heir by law 60;
  - years on the throne +15;
  - renown up to +10;
  - laws kept to custom up to +8;
  - the estates in government, about +4.

  That is about 90, against a −5 for each lost war and −5 for famine. A ruler crowned young is near the cap for life, so dynastic decay (S3 in `world-foundations.md`: "over about 120 years it is brittle") has nothing to act on.
- **Fix.** In `9996-polity` (`POL.legitParts`):
  - years on the throne add +1 only to 10, and fall away again after 25 years (a reign grown old);
  - a dynasty part: −1 for each 15 years the house has held the throne past 60;
  - a part for each estate that is angry (not only those in government);
  - stability under 30: −10;
  - debt above a year's income: −5.
  - Then measure the share of realm-years under 45 against a target band (say 5–10%), and check that claimant factions appear.
- **Size S · Impact 4.**

### F2. Estates are almost never angry
- **What I saw.** Approval at the end of each world, over all realms' five estates:

  | | Angry (≤ −5) | Loyal (≥ 5) | Median |
  | --- | --- | --- | --- |
  | Known World | 0 to 2 of 165–170 | 79 to 85 | 4 to 5 |
  | Known World, mid-run | 0 of 170 | 93 | |
  | Great Continent | 12 to 30 of 700–725 (2–4%) | 201 to 231 | 2 to 3 |

  The README's power from anger (+0.1 × clout to factions), the petitions of angry estates with clout 0.2 or more, and `po_estate_meets` all wait on ≤ −5.
- **Why it matters.** The estates are 9996's map of who is unhappy and why. A world where a third of them are loyal and almost none are angry reads as calm everywhere, and the faction meter seldom moves. Factions at 40% power or more at any time: 0 to 5 of about 40 in the Known World, 1 to 9 of about 70 on the Great Continent.
- **Fix.** In `9996-polity` (`POL.approvalParts`):
  - centre the law marks on each realm's custom, so the start is 0, not positive;
  - add the realm's own state: −2 a lost war for the nobility as well as the host, −1 a year of debt for the guilds, −2 for the commons under heavy taxes, −1 for every 10 points of unrest;
  - let the +1 a council seat count only while the seat holder's estate is in government.
  - Target: 5–15% of estates angry at any time.
- **Size S · Impact 3.**

### F3. The same history every seed
- **What I saw.** Provinces at the start → after 105 to 110 years:

  | Realm | Known World 606 / 1212 / 2424 / 4848 | Great Continent 606 / 1212 / 2424 / 4848 |
  | --- | --- | --- |
  | Zanara | 22 → 5 / 6 / 4 / 5 | 22 → 14 / 1 / 0 / 3 |
  | Kethra | | 30 → 12 / 13 / 12 / 21 |
  | Vahra | | 56 → 87 / 118 / 93 / 70 |
  | Aldmark | 20 → 46 / 38 / 50 / 39 | 20 → 57 / 52 / 8 / 0 |
  | Abara | 14 → 31 / 30 / 22 / 29 | 14 → 18 / 53 / 22 / 23 |

  Taulen varies (122 → 70 / 67 / 141 / 133). Hesh mostly grows (109 → 141 / 144 / 95 / 117).
- **Why it matters.** A player who starts a second life in Zanara is in a realm that falls in seven worlds of eight. The lore's Vahra–Kethra standoff ("they fight most dry seasons") is settled the same way every time, only more slowly than in cycle 1. A world that "runs for decades" should be able to surprise.
- **Fix.**
  - First find out why. Read `S.aiLog` for Zanara's wars: who declares, which casus belli (68), and whether its coalition calls fail. The likely causes are its neighbours' tempers (20) and a long border with two hungry realms.
  - Then add a defensive pull to `20-ai-personality`: a realm that has lost a third of its land in 30 years gets +defence, alliance and guarantee weight, and attackers face a coalition sooner.
  - Track a bench measure: the share of seeds in which each great power ends smaller than it began, kept between 25% and 75%.
- **Size M · Impact 4.**

### F4. Twin Rivers peaces still move a score of districts
- **What I saw.**
  - **Peaces that move 10 or more provinces** (from "takes … from" lines in `S.history`): 13, 16, 11 and 13 in the four Great Continent worlds, against 1 to 3 in each Known World. The largest moves 16 to 21.
  - **Seed 606, Hesh against Taulen:** "Hesh takes … 21 … from Taulen" (1115), "Taulen takes … 15 … from Hesh" (1116), "Hesh takes … 20 … from Taulen" (1119). The same districts (Morylo, Tirutok, Siokiat, Yuren) go back and forth.
  - **Why the cap allows it.** 09-scale's `W.capTreaty` holds a peace to 15% of the loser's people and land, and Twin Rivers districts are small, so 15% of Taulen is about 20 provinces. Wars in the first year: 3 to 5, and fair.
- **Why it matters.** Cycle 1's B3 complaint is softened, not gone. A Venshai player still sees a fifth of his empire change hands in a war of under a year, and back again the next.
- **Fix.** In `09-scale` (`W.capTreaty`): add a cap of about 6 provinces (or 8% of the loser's provinces) for a war of under two years, rising with the war's length. Count a province taken back within 10 years toward a truce (68's `reconquest` weighed down for 10 years after a peace).
- **Size S · Impact 3.**

### F5. The Silk Road's brokers are broke for most of a century
- **What I saw.** Years with a negative treasury, out of 105:

  | Realm | 606 | 1212 | 2424 | 4848 |
  | --- | --- | --- | --- | --- |
  | Lake Steppe | 90 | 105 | 61 | 105 |
  | Felt Keepers | 92 | 88 | 92 | 91 |
  | Ushivar | 66 | 100 | 90 | 48 |
  | Navesht | 103 | 42 | 105 | |
  | Khozinj | | 54 | 24 | 66 |
  | Nine Wells | 24 | | 96 | |

  Ushivar's income is 1,480 to 34,941. Its lore is "the Weighing" on the Silk Road, and 9995 gives it a toll of a twentieth.
- **Why it matters.** The lore's richest middlemen (the brokers of `TR-09`, the Weighing, the Wells' secret track) are the poorest crowns in the game. They are also where B1's runaway armies start.
- **Fix.**
  - In `9995-trade-roads`: book a broker's tenth at each relay, as well as the tolls, to the relay realm's treasury, not only to the price.
  - In `56-realm-inside`: start these realms at the reserve (1.5 years). Read their income with the relay cut.
  - Measure: no realm broke for more than 10 years running.
- **Size M · Impact 3.**

### F6. Treasuries: ×13 to ×20 is convergence, not runaway
- **What I saw.**
  - **Known World:**
    - total AI treasury ×13.4 to ×16.1 over 110 years; income ×1.3 to ×1.6;
    - the median treasury is 0.34 years of income at the start, 1.8 by 1115, about 3.0 from 1145 to the end (p90 3.6 to 3.9);
    - hoarding (over 6 years): none outside player-run realms.
  - **Great Continent:**
    - ×16 to ×20 in all;
    - far realms ×10 to ×18 in 20 years and ×17 to ×22 at the end;
    - the west ×10 in 20 years and ×10 to ×16 at the end;
    - the same plateau at 3.0 years.
  - **Taxes at Light or Crushing at the end:** 19 to 22 of 33–34 Known World realms (56–67%, above 56's own bar of 60%); 52 to 58 of 140–152 on the Great Continent (about 38%). Without the Polity the Known World is the same (17 to 24 of 33–34).
- **Why it matters.** The cycle 1 "×10" is real but harmless: a quarter-year start purse filling to 56's steady state, then flat. Two things remain:
  - the far ledger (`A.TRADE.ledgerYear`, armies at the lore's share of revenue) is still off, so Taulen's "failing money" never fails;
  - the light-tax drift that 56's README called "a design call" is past its bar in the Known World.
- **Fix.**
  - In `56-realm-inside` `treasury.core.js`, add the line lane E wrote (`up += lore.army + lore.notes`) and start every realm at its reserve.
  - Read the court's treasury against spending, not income (56's own note), which stops the drift to Light.
- **Size S · Impact 2.**

### F7. Prices that only climb
- **What I saw.** Each realm's price at the end against its own at the start (median, min and max over realms):
  - **Known World ivory ×3.70 to ×3.87 in every world** (min about 0.6, max about 4.6). Cycle 1 saw ivory ×4 in 6 years (Aldmark 287 → 1,184). It is unfixed, and every other Known World good stays between ×0.8 and ×1.5.
  - **Great Continent far goods:**
    - silver ×3.79 to ×3.85;
    - jade ×2.56 to ×3.29;
    - paper ×2.57 to ×3.25;
    - porcelain ×1.3 to ×1.6.
  - **14 to 18% of all far realm-goods end above ×3** (silver in 121 to 131 realms), against 4.5 to 6% in the Known World (ivory and pearls).
  - **Broker swings:** the Tusk Clans' silk moves between 168 and 724 from one 25-year sample to the next, as 9995's README warned for small broker markets.
- **Why it matters.** A price that climbs to the ceiling in every market is a good that is never made enough. The merchant life and 66's "explain why a good is cheap here" both read nonsense from it.
- **Fix.**
  - In `45-economy`: find the ivory source deficit (its weight in `E.LAND` against its demand) and add a supply response, so production rises when a good sits at ×2 for 5 years.
  - In `9995-trade-roads`: raise silver, jade and paper production to their lore demand, and give the broker cities an entrepôt stock (the README's own next step).
  - Test: no good's median above ×2 after 50 years.
- **Size M · Impact 3.**

### F8. 9997's bread, pay and promotion sleep in a healthy realm
- **What I saw.**
  - **Bread.** Divisions at war have 26 to 30 of 30 days of bread in every sample. No division is at 0 bread in any yearly sample in two Known World worlds, and in 1 to 6 years of 110 in the others. Foraging comes to 99 to 1,414 a Known World century.
  - **Pay.** Arrears happen only in broke realms (B1, B2). In seeds 606 and 1212 (Known World) a division was unpaid in 2 to 3 years of 110.
  - **Promotion.** It happens only at a New Year while the realm is at war (`CO.promote` from `CO.month`). A senior captain who falls in peace leaves his battalion vacant until the next war:
    - at the end of seed 2424 (Great Continent), **2,597 of 10,232 battalions (25%)** had no senior captain, none of them in a realm at war;
    - in seed 4848, 116 of 8,302.

    Promotions over a century: 4 and 8 in two Known World worlds.
  - **Captains who turn.** 0 in two Known World worlds and in two Great Continent worlds.
  - **Couriers.** They carry only the player's orders: 0 to 21 a century, with a median of 150 and 153 days in the two Great Continent worlds that sent any (the player's home far from the front).
- **Why it matters.** 9997 has a whole economy of the soldier (bread, pay, a captain's wants) that a healthy realm at war never feels. The README's ±15% morale effect sits at its resting value (median morale 64 to 66 all century).
- **Fix.** In `9997-companies`:
  - let refill read the province's real grain (66's town store, the README's own limit) and the season, so a winter siege far from home runs short;
  - promote at the New Year in peace too (the vacancy is a man passed over, not a war need);
  - put a cost of pay on mustering: 56's books do book host upkeep, so a realm whose spend passes its income for a year falls a month behind, not only one whose treasury is below zero.
- **Size M · Impact 3.**

### F9. Turn time on the Great Continent
- **What I saw.** Median month and year-turn month, by decade (machine at load 8 to 10):

  | | Month | Year turn | Worst month | People alive | State |
  | --- | --- | --- | --- | --- | --- |
  | Known World | 31–91 ms (no trend) | 127–312 ms | 0.5 s | 590 → 2,050 | 2.6 → 5.8–6.6 MB |
  | Known World without 9996 | 41–56 ms | 87–129 ms (1155) | | | |
  | Great Continent | 325–922 ms | 1.0–2.7 s | 4.4–8.5 s | 1,770 → 4,800–4,940 | 9.4 → 14.8–15.5 MB |

  - Seed 1212's month rose from 481 ms in the 1100s to 922 ms in the 1200s, and its year turn from 1.2 s to 2.2 s. The other three worlds held flat (330 to 540 ms at the end).
  - A Great Continent century takes 17 to 22 minutes of wall time for the bot.
  - **Profile** (13 months from Taulen, `W/prof-POL-36-on.json`): 9995's `TR.month`, `TR.trips` and `TR.cost` are about 12% of the samples, and 9997's `CO.day`, `restNow`, `drillsNow`, `CO.month` and `A.divLose` about 7%.
  - **9996** adds about 70 to 90 ms to each Known World year turn (152–224 against 87–129 ms), as its README says.
- **Why it matters.** The world-foundations target is "the month tick stays within 10% of today's". On the Great Continent a month near a second, and a year turn near 2 s, is what the stepper's Month and Season wait on. People nearly triple in a century, and the cost grows with them.
- **Fix.** In `09-scale`, the README's own next step: a coarse tick for lands far from the player, where 9995's trips and 9997's day are worked a season at a time. Cap the named people of a realm's lesser offices (9996 made 1,751 people in one world). Watch seed 1212's growth with `great-bench --months=1200`.
- **Size M · Impact 3.**

### F10. Realms that never change
- **What I saw.** Realms alive all through that never went to war and never changed a border in 105 years: 13, 19, 10 and 15 of about 145 on the Great Continent; 0, 0, 2 and 5 of 34 in the Known World.
  - Repeated across seeds: Blackreef, Frostholm, Highland, Lucerna, the Amber Isles in the Known World; Silo, Teranu, Terraces, Bonevar, the Bird Coast, the Drifting Houses and Fjorund in the east.
  - Every one of them changed ruler (only 1 of 144 kept the same ruler), and most changed laws.
- **Why it matters.** A tenth of the far map is scenery for a century. Some of it fits the lore (a pirate haven, a giant hall), but not all.
- **Fix.** In `20-ai-personality`: give every realm a want toward a neighbour (`world-foundations.md` S4: "a neighbour it fears and a neighbour it covets") and let a small realm raid, ally or pay tribute. Measure: realms with no war and no border change in 100 years at 5% or fewer.
- **Size S · Impact 2.**

---

## What holds up (no action)

- **Stable over the long run.** 12 worlds and 1,300 world-years with no page error and no stuck loop.
- **The Polity runs in every realm.** A Known World century has about 2,100 bills (about 32% pass), 127 to 135 elections with 987 to 1,070 named votes, and law changes in every group. A Great Continent century has 4,700 to 5,100 bills and 680 to 720 elections. Offices are filled; 8% of holders over a Known World century were made new for the office (307 of 3,930), 11% on the Great Continent.
- **Every battle has an after-action report** (`aarShare` 1.0, 1,500 to 7,700 battles a world).
- **The world record keeps 17 to 20 kinds:** 2,900 to 7,900 entries a Known World century and 14,000 to 15,500 a Great Continent century, each with a place and people.
- **Far news.** It goes by way of brokers, takes up to two years and is mended.
- **The Silk Road's gradient.** Silk is about 110 in Taulen and 870 to 1,050 in the west across all four worlds.
- **Treasuries plateau** at 3 years of income. Hoarding is 0 outside player-run realms.

## Top 10

1. **B1** A broke realm raises armies without limit: the Nine Wells' 1.47 M men on 3 provinces (M, 5).
2. **B2** A winning revolt stays a rebel forever: frozen income, no diplomacy, legitimacy 0 (S, 4).
3. **F1** Legitimacy is about 89 in every realm, so claimant factions cannot form; the Polity cuts civil war 12%, not 35% (S, 4).
4. **F3** The same history every seed: Zanara falls in 7 of 8 worlds, Kethra in 4 of 4, Vahra always grows (M, 4).
5. **B3** Arrears churn: up to 706,000 captains leave and 3.5 M men desert a century (S, 3).
6. **F2** Under 4% of estates are ever angry; petitions and faction anger barely fire (S, 3).
7. **F5** The Silk Road's brokers (Ushivar, the Felt Keepers, the Lake Steppe, Navesht) are broke for 40 to 105 years (M, 3).
8. **F7** Ivory ×3.8 in the Known World; far silver ×3.8, jade and paper ×3 (M, 3).
9. **F8** 9997's bread and pay sleep; 25% of battalions wait for a war to get a senior captain (M, 3).
10. **F4 and F9** Twin Rivers peaces of 16 to 21 districts; a Great Continent month of 0.3 to 0.9 s and a year turn of 1 to 2.7 s (S to M, 3).
