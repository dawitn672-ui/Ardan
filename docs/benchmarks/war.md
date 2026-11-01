# War: benchmark

Oct 13, 2026 · build `b593143` plus the 29 fix patches (`features/00-05`), measured in headless Chromium. Strict score going in (from "Ardan Road to 100"): **5.5**. The plan's own score: 6.

Every number about Ardan below was measured for this doc unless it names a review. The scripts lived in a private scratch folder. The method is in the appendix so `bench/` can adopt it. This file is the only thing this work added to the repo.

**About the sources.** The web tools failed for this doc. Every page fetch failed at DNS, the proxy refused the wiki, store and studio hosts, and the shared search budget was already spent. So claims about other games come from two places:

- sources already opened by the sibling benchmarks (`power-balance.md`, `events-story.md`), marked *(via sibling)*;
- my own knowledge of the games, marked **unverified**.

The Hearts of Iron IV, Total War, Field of Glory II and Ultimate General sections are almost all unverified, and so are the Bannerlord personal-battle and Battle Brothers roster details. Treat them as a designer's memory and check them before quoting. No recommendation below rests on an unverified number about another game; every one rests on a measured number about Ardan.

**What this found, in six lines.**

- **Your choices barely move battles, at any rank.** Over 624 fight prompts, each replayed 8 times per policy, best play beats worst play by **0.8 points at ranks 0–3, 1.9 at ranks 4–6 and 4.5 at ranks 7–9**. The plan's target is 15. An oracle that picks the best tactic in hindsight reaches 3.6 at rank 5 and 14.3 at rank 8.
- **Most fights are decided before you are asked.** Staying out gave the same result in all 8 replays in 80% of soldier prompts, 85% of captain prompts and 92% of general prompts.
- **A soldier's war is theatre.** His line battle moves war score by 11 to 18 points, and a week later the score is back where it was. What stays is a median 4,121 dead, taken from real divisions, for a battle that is on no map.
- **The battle screen misleads.**
  - "Fight it out" trails the best fixed tactic by up to 74 points.
  - Ordering "Rally" on every wing turns 93% losses into 97% draws.
  - "Lead from the front" promises "+morale" and costs an ordinary noble up to 33 points.
- **A general's map orders don't change who wins the war.** Over 288 replayed wars, sending your army at the enemy capital ended no more wars ahead than leaving it to the AI (0.0 points, 95% CI −9.7 to +9.7).
- **Nothing explains a battle once it ends, and nobody on the field is a person.**
  - 0% of battles get an after-action report.
  - War AI reads ruler or general traits 0 times in 17 functions.
  - Sieges ask 0 questions.
  - The 9 named men in your file never get better.

## 1. The bar

A 10 in this genre means three things hold at once.

First, **at every rank the battle you are asked to fight is the battle.** Your choices act on the same model that decides the war. They move the thing your rank owns by a clear, measured margin: your file, your company or your army. Mount & Blade puts you on the field. Hearts of Iron IV makes your plan the lever.

Second, **every battle explains itself after it ends.** A report names the causes and their size, the way Total War's results screen and Field of Glory's combat log do. The named dead carry forward, as in Battle Brothers and Ultimate General.

Third, **the enemy has a face, and a siege is a contest, not a timer.** Generals have tempers you can read and use. A siege is a month-by-month fight over food, disease and nerve.

## 2. How the best do it

### Hearts of Iron IV (battle plans, combat width, division templates)

**Mechanism (unverified).** Land combat runs in hourly rounds. Each division's attacks go against the target's defence (when defending) or breakthrough (when attacking). Attacks that get past it hit 40% of the time; blocked ones hit 10%. Hits remove organisation and strength. Combat width limits how many divisions fight at once. Since patch 1.11 (2021) width depends on terrain and grows with each extra direction of attack. Each phase, both commanders pick a tactic; some tactics counter others, and better reconnaissance and a better general pick counters more often.

The player draws a front line and an offensive line. Divisions waiting on a plan build up a planning bonus, which wears off once the attack starts. The division designer sets each template's battalions and support companies, and the template sets the division's width and stats. Generals have attack, defence, planning and logistics skills and terrain traits. Sources to check: [Land battle](https://hoi4.paradoxwikis.com/Land_battle), [Battle plan](https://hoi4.paradoxwikis.com/Battle_plan), [Division designer](https://hoi4.paradoxwikis.com/Division_designer) (not opened).

**What Ardan already copied (read from the code).** Ardan's division sim is close to a port:

- **Width by terrain** (`A.WIDTH`): plains 70, steppe 80, desert 70, tundra 60, hills 55, forest 50, marsh 40, mountains 35. Each extra attack direction adds +35, up to +70.
- **The same 10%/40% hit rule:** `eff = .1·min(I,D) + .4·max(0, I−D)` in `A.fightDay`.
- **Daily tactics with counters, read through recon** (`A.WTAC`): 8 attack and 9 defence tactics.
- **A planning bonus:** +3% a day while an army waits, capped at 25% plus doctrine plus command/400.
- **Fixed templates:** Aldmark's 20 divisions use 9-, 6- and 4-battalion templates drawn from 21 regular troop types and 13 elite-order types.

**Lesson for Ardan.** Ardan has HOI4's combat model but not HOI4's lever. In HOI4 the player is the planner from the first minute. In Ardan the plan exists only at rank 7+, and there it measurably doesn't decide wars (section 3, W6). HOI4 has nothing to teach about ranks 0–6, because it has no personal scale. The Road to 100 review is right to say: drop the HOI4 screens below general, and keep the HOI4 model as the hidden judge of every battle.

### Mount & Blade II: Bannerlord (personal battles, autoresolve)

**Autoresolve (via sibling).** "Send troops" runs a simulation. It picks fighters from each side and trades hits by a power ratio. The official API exposes `CombatSimulationModel.SimulateHit(striker, struck, …, strikerAdvantage)` ([API docs](https://apidoc.bannerlord.com/v/1.2.7/class_tale_worlds_1_1_campaign_system_1_1_component_interfaces_1_1_combat_simulation_model.html)). Modders who decompiled it say tier gaps are small, so high-tier troops die to low-tier ones in autoresolve ([Better Auto Calc](https://www.nexusmods.com/mountandblade2bannerlord/mods/673), *community*). At least four popular mods exist only to rework it ([1151](https://www.nexusmods.com/mountandblade2bannerlord/mods/1151), [12593](https://www.nexusmods.com/mountandblade2bannerlord/mods/12593), [673](https://www.nexusmods.com/mountandblade2bannerlord/mods/673), [3453](https://www.nexusmods.com/mountandblade2bannerlord/mods/3453)). Players argue about when to fight by hand instead ([Steam](https://steamcommunity.com/app/261550/discussions/0/3596716230234308872/), *community*).

**Personal battles (unverified).** When you fight by hand you are one body on the field and the commander at once. You give formation orders (move, face, charge, hold) and fight in person. Companions are named heroes. The result of that field *is* the result of the battle; there is no second simulation behind it.

**Lesson for Ardan.** In Bannerlord the personal battle is the battle. Ardan's captain fights a separate battle of about 1,000 men (median) that only nudges organisation in the real one. A 12-point swing in his own battle becomes 1.9 points in the real fight. Bannerlord also shows the cost of two maths for one fight: players learn to distrust both. Ardan runs four for one war: the line mission, the wing battle, the division sim, and a war score that the sim overwrites every 7 days.

### Total War (battle results screen)

**Mechanism (unverified).** Before a battle, a balance-of-power bar shows the odds, and autoresolve predicts an outcome. After it, a results screen names the outcome on a scale (Heroic, Decisive, Close or Pyrrhic victory; Valiant, Close, Decisive or Crushing defeat). It lists kills and losses for each unit and often ends with a decision about captives. No URL was opened; check the official Total War wikis.

**Lesson for Ardan.** Ardan ends a tactical battle with one line ("Victory. Dead: X of yours, Y of theirs.") and a division fight with one log line ("Battle of P (N days): your side wins. N fall. Merit +N."). That log line is shown only for the first 6 battles a year or for fights over 20,000 men. Name the outcome tier. Show a line per unit. End with a decision that carries the battle into the campaign: captives, pursuit or loot.

### Battle Brothers (small named units)

**Odds and tiers (via sibling).** Hit chance is plain arithmetic: attacker skill minus defender defence, with flat modifiers such as high ground ±10 ([Hit Chance](https://battlebrothers.fandom.com/wiki/Hit_Chance), [Combat Mechanics](https://battlebrothers.fandom.com/wiki/Combat_Mechanics), *community*). The developers place each new enemy against an old one ([Dev Blog #143](https://www.gamebanshee.com/3drdx), [#118](https://gamebanshee.com/k4cpp)). Combat difficulty and economic difficulty are set separately ([Game Mechanics](https://battlebrothers.fandom.com/wiki/Game_Mechanics), *community*).

**The roster (unverified).** The company holds about 20 men, of whom about 12 fight. Each has a background and traits, levels up into perks, and can come back from a near-death with a permanent injury. A dead man stays dead.

**Lesson for Ardan.** Ardan already gives every soldier a file of 9 named men (`A.makeSquad`). They are picked into mission stages and their stats add to your odds. But:

- They never train: the mission and line-battle outcome code calls no training on them.
- They are topped back up to 9 every year.
- They die in a log line: 39 died in rank-4+ battles across 32 enlisted lives, and none of them is mentioned again.

They are furniture. Battle Brothers proves the men can be the story.

### King of Dragon Pass (raids)

**Scenes and the saga (via sibling).** The game draws scenes from a pool, with conditions and casting from your own clan, and writes the clan's saga year by year ([A Sharp overview](https://www.a-sharp.com/kodp/overview.html), [KoDP blog](http://kingofdragonpass.blogspot.com/2021/08/kodp-on-web-50-years-of-text-games.html)).

**Raids (unverified).** You pick a target clan, how many weaponthanes and warriors to send, and who leads. Advisors argue before you commit. The result comes back as cattle, goods and named dead, and a raid starts or feeds a feud the game remembers.

**Lesson for Ardan.** A raid is a decision with a cost you pick up front and a concrete result someone remembers. Ardan's soldier gets one mission a year at war (`milYearNow`): 3 or 4 stages of skill checks. Its war-score effect is gone within 8 days (W8), and nothing reads it afterwards except merit.

### Field of Glory II and Ultimate General: Civil War (after-action reporting)

**Mechanism (unverified).**

- **Field of Glory II** resolves each combat by comparing points of advantage. It shows the factors and the result per combat, and the battle ends with units broken, routed or fragmented.
- **Ultimate General: Civil War** ends each battle with a report: casualties by brigade, captured weapons and supplies, and career and reputation gains.
  - Brigades persist between battles and gain veterancy.
  - Their officers gain experience and can be wounded or killed.

No URL was opened; check the Slitherine and Game-Labs pages.

**Lesson for Ardan.** An after-action report should tie the result to its causes and carry consequences into the next battle. Ardan's sim already computes the causes every day of a fight:

- terrain, walls, winter, attack directions and width used;
- dig-in and the planning bonus;
- the tactic pair and whether it was countered, read or a trap;
- scouting values and routs.

The War Room's fight panel even shows them live, day by day. Then `A.fightEnd` deletes the fight and keeps only the date, the winner, both sides' losses, the length and the total men.

## 3. Backtest

How the A/B numbers were made (full method in the appendix):

- **Setup.** A real war between two bordering realms, with the player in one division at a fixed rank.
- **Branching.** At every fight prompt the game is saved, then each policy is replayed 8 times with paired random streams. Each replay runs the real province fight to its end.
- **Policies.**
  - "Best" means the highest-odds choice at each mission stage, or the game's own "Fight it out" AI in a battle.
  - "Worst" means the lowest-odds choice, or the opposite of the AI's doctrine (dig in when stronger, charge when weaker, never commit the reserve).
  - "Stay out" means "Do your duty and keep your head down".
- **Coverage.** 6 realm pairings (each side once), 5 seeds, ranks 0–8.

| # | Metric | Reference game | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- | --- |
| W1 | Choice leverage, ranks 0–3: best minus worst play, share of real fights won | Bannerlord: your fight on the field is the battle (unverified) | **+0.8 points** (95% CI −0.9 to 2.1), 200 prompts. Best vs stay out: +1.4 | Your file's or sector's result moves ≥15 points; the battle moves ≥2, and the report shows it | Bot: A/B harness |
| W2 | Same, ranks 4–6 | Bannerlord: formation orders on the field (unverified) | **+1.9** (0.3 to 3.2), 185 prompts. Best vs stay out +5.1. Oracle best minus worst tactic, in hindsight: 3.6 | Company or sector ≥15; battle ≥8 | Bot: A/B harness + oracle |
| W3 | Same, ranks 7–9 | HOI4: the player's plan and tactics are the lever (unverified) | **+4.5** (2.5 to 6.8), 239 prompts. Best vs stay out +0.8 (−8.7 to 8.5). Oracle: 14.3 | Battle ≥15 for ordinary play, not just with an oracle | Bot: A/B harness + oracle |
| W4 | Fights already decided when the player is asked | HOI4 asks for the plan before contact (unverified) | 80% (soldier), 85% (captain), 92% (general) gave the same result in all 8 stay-out replays | ≤50% at every rank: ask before contact, or at the turning point | Bot: A/B harness |
| W5 | How much of your own battle reaches the real fight | Bannerlord: all of it (unverified) | Captain: his battle swings 12.3 points (AI 42.4% vs worst 30.1%) → real fight 1.9. General: 4.1 → 4.5 | One model; your battle is a sector of the real fight | Bot: A/B harness |
| W6 | General's map orders over a whole war | HOI4: the plan decides the front (unverified) | "Strike the capital" vs letting the AI choose: 0.0 points more wars ended ahead (CI −9.7 to 9.7), +0.26 provinces (−0.1 to 0.6). "Hold" loses 1.7 provinces (−3.0 to −0.3). 24 wars × 4 orders × 3 replays | Best order ends ≥15 points more wars ahead than the worst | Bot: whole-war A/B |
| W7 | Standing battle order ("Your battle orders") | HOI4: tactics and counters (unverified) | Best in hindsight minus worst: 6.5 points (ranks 4–6), 5.6 (7–9). Best vs "Commander's judgment": 4.4 and 2.0. The defend order is applied (spear wall on 141 of 221 defending days) but flipped 0 of 33 captain fights | ≥10 points, with counters explained in the report | Bot: A/B harness |
| W8 | Shown war-score changes that last | Total War results feed the campaign (unverified) | Line battle: +11 to +18 or −12 to −17 at once; after 8 days, equal to the control in 7 of 12 seeds and unrelated to the result in the rest. Missions: −3 to +6, same fate. `A.wsScore` rewrites the score every 7 war-days | 100% of shown changes last, or the screen doesn't show them | Bot: control vs branch, 12 seeds |
| W9 | Dead from a battle that isn't on the map | 0 in any reference | Median **4,121** per soldier line battle (3,200 replays), taken from real divisions via `A.applyLosses` | 0 | Bot: A/B harness |
| W10 | Battles with an after-action report | Total War, Ultimate General, Field of Glory II (unverified) | **0%** (bench `afterActionShare`: 0 of 46 battles) | 100%, each with ≥3 causes and their signed share | Bot: `b.aar` convention |
| W11 | Causes kept after a fight | Field of Glory II shows the factors per combat (unverified) | ~10 cause kinds computed and shown live; 0 kept after `A.fightEnd` | All kept in `w.battles` and readable later | Static + browser test |
| W12 | "Fight it out" vs the best fixed tactic | Bannerlord's autoresolve-vs-hand gap is the cautionary tale (via sibling) | Gap ≥10 points in 10 of 12 contested setups, up to **73.5** (hills, outnumbered 1.25×: AI 14.8%, couched lance 88.3%) | AI within 10 points of the best fixed tactic in every setup | Bot: wing-battle study, 200 battles × 16–17 tactics × 18 setups |
| W13 | Degenerate tactics | Battle Brothers: shown factors are the real ones (via sibling) | Couched lance is best in 5 of 6 contested setups against Varenna. "Rally" on every wing vs Gorath at equal numbers: 291 of 300 draws (AI play: 278 losses). "Fighting withdrawal" scores 99 against Varenna in forest at equal numbers, where the AI scores 79 (draws count half) | No tactic best in more than a third of setups; a side that never closes loses | Bot: wing-battle study |
| W14 | "Lead from the front" | Bannerlord: you fight in person, and the risk is visible (unverified) | A champion duel in 86–90% of led battles. The champion is always tier 4. A 35-year-old noble (worth 48) wins 0–6% of them. Net effect −33 to +5 points. The checkbox says "+morale" | Champion matched to your tier ±1; odds shown within 5 points; net effect shown | Bot: 300 battles per setup |
| W15 | AI generals with personalities | HOI4 general traits (unverified); the plan asks for cautious, bold, cunning | Ruler or general traits read **0 times** in 17 war AI functions; generals are chosen by rolled skill | ≥3 temperaments, each moving a measured behaviour ≥25% | Static + bot |
| W16 | Decisions per siege month | Real sieges: food, mining, assault, disease | **0**. Days are a formula: 6 / 17 / 28 / 39 for walls 0–3 with 9,000 men; 61 for a walled capital of 200,000 | ≥1 decision per siege month, with a trade-off the bot can see | Static + bot |
| W17 | Named men who grow and are remembered | Battle Brothers (unverified roster details) | 9 per soldier, refilled yearly, 0 training; 39 deaths in 32 lives, each one log line | Men gain skill and traits, are named in the report, and come back in events | Bot + static + human |
| W18 | Fight prompts per war-year | Pacing aspect target: ≥6 prompts a year | 3.6 (ranks 0–3), 4.5 (4–6), 11.3 (7+), plus 1 mission a year below rank 7 | ≥6 meaningful war decisions per war-year at every rank | Bot: A/B harness |
| W19 | Drill matters in the battle you see | The plan: shield-wall drill should beat a charge | Drill changes only the division sim (+14% attack per weapons level, +12% defence per formation level, +8% per shields level). The wing battle ignores it | Drill changes the tactics and counters you can use, and the report names it | Static + bot |
| W20 | War-day time with many divisions | Plan budget: under 50 ms per battle tick | 6 wars, 140 divisions in armies: median 20 ms, p95 66 ms, max 252 ms. A single fight tick: median 0.1 ms, max 106 ms | p95 ≤ 50 ms and max ≤ 120 ms with 200 divisions | Bot: perf probe |
| W21 | Dead war code | — | `startCampaign` never called; `wsPCBattle` and `wsQueuePCBattles` are empty and still called | 0 | Static |
| W22 | Player can say why they won | Plan: 7 of 10 after reading the report | Unmeasured (no report exists) | 7 of 10 of 12 new players | Human playtest |

**What the war looks like in a real career.** 32 enlisted lives, from age 18 to 62 or death, with the bot taking every war option:

- **Time at war.** 744 service-years, of which 70.8 (9.5%) were at war.
- **Rank at war.** Of those war-years, 40% were at ranks 0–3, 28% at 4–6 and 32% at 7+.
- **How high they got.** 8 of 32 reached General. None went higher.

So most of a soldier's war is spent where W1 is under 1 point.

**Why the A/B numbers are so low (read from the code).**

- **Ranks 0–3** get `wsLine`. It runs a separate line battle, sized from the realm's army, with the result decided by `A.lineBattleResult`. Back in the real fight its only effect is `wsNudge` at weight 0.35: 4% off the enemy's organisation, or 5% off your own division's.
- **Ranks 4–6** get `wsPart`, a separate wing battle sized from the rank: 200, 800 or 3,200 men, times 1 to 1.6 (1 to 1.2 at rank 6). Its effect is `wsNudge` at weight 1: −12% enemy, +8% ours, or −15% to your own division.
- **Ranks 7+** get `wsLeadBattle`. This is the only path that fights the real divisions, and it is decisive: the loser keeps at most 0.5 organisation out of about 60.

Below rank 7, organisation nudges of 4 to 15% can't flip a fight that numbers already decided (W4). At rank 7+ the led battle does decide the fight, but the wing battle is itself settled mostly by numbers and troop mix. At equal numbers, under AI play, Aldmark scores 79–99 against Varenna and 2–16 against Gorath (draws count half). So AI play and a plausible mistake differ by only 4 points, and the best tactic in hindsight by 14.

## 4. North star

With unlimited time, money and people, Ardan's war is **one war seen through three windows**. Nothing is fought twice.

**One judge.** The division sim decides every battle. Each province fight splits into the three sectors the wing battle already uses (left, centre, right), plus a reserve. Every division stands in a sector, and the player's unit holds a stretch of one. The soldier's, captain's and general's screens are views of that one fight. A sector that breaks opens the next sector's flank, as `A.wingClash` already does for wings. Battle ticks stay cheap: under 50 ms at p95 with 200 divisions.

**The soldier (ranks 0–3).** A personal battle in four beats: form up, missiles, the press, the break. It has 3 to 5 choices, and the men beside you are named. Each choice changes your file's cohesion and killing power by a stated amount. Your choices move:

- your file's survival and your sector's result by 15–25 points;
- the battle by 1–3 points, and the report says so ("your file held the ford: +2%").

Your own stakes (life, mates, merit, loot) move by 30 points or more. Your superior's orders arrive as short letters ("hold the mill until the horns"). You can follow them or not, and the report says which.

**The captain (ranks 4–6).** One order per beat to his company: hold, charge, fall back, cover the flank or feed the reserve. Counters come from the sim's own tactic table. Drill decides what you can do: a file drilled in spear wall can form one and stop a charge, and one that isn't, can't. Your orders move the sector 15–30 points and the battle 3–8.

**The general (ranks 7–9).** Before contact he sets the plan: where to strike, when, which sector gets the weight, and how big the reserve is. Then he makes one decision per day of battle. He moves the battle by 15–25 points and the war measurably: the best plan wins at least 15 points more wars than the worst.

**The enemy.** Generals have one of five tempers, built from their traits: bold, cautious, cunning, stubborn, reckless. Each is visible after one battle ("Lord Orsk always throws in his reserve by noon"). A temper changes measured behaviour by 25% or more. Rulers wage wars in their own character (Diplomacy shares this work).

**The after-action report.** One page per battle you were in:

- the outcome tier;
- the three biggest causes with their signed share ("their spear wall broke our charge −9%; terrain −12%; your section held +2%");
- a sector map;
- the named dead and wounded;
- what your side claims next to what happened (the signature "belief vs truth").

A line from it goes into the Chronicle. Old battles stay readable from the War tab and the Chronicle.

**Sieges.** A monthly contest of town food against camp food, disease, mining, assault, sally and terms. There is one decision a month, each with a cost the bot can see: an assault shortens a siege by 40% or more and costs twice the dead.

**Named men.** Your file of 9 grows. Men gain skill and traits and carry injuries. You can promote one. Their deaths go into the report and the Chronicle, and their families turn up in later events. A memorial lists everyone who served with you.

**What money buys.**

- About 60 woodcut-style battle scenes by terrain and outcome tier.
- A hand-drawn sector map.
- Drums and horns for each culture.
- Steel and banners moving on the map.
- A writer's year of battle prose in each culture's voice.
- 12-player playtests every phase, with a recorded "why did you win?" question after every battle.

**The proof.**

- The nightly bench shows choice leverage at each rank's own scale of 15 points or more, with the confidence interval above 10.
- 100% of battles have a report.
- 0 phantom battles.
- 0 shown changes that revert.
- 7 of 10 players explain a win from the report alone.

## 5. What to build now

Ranked by score moved per unit of work. "Code" means `*.core.js` plus the smallest patch, as in CLAUDE.md. "Content" means `*.events.js`. Every acceptance test below can fail.

| Rank | Feature | Effort | Buildable here | Acceptance test (fails if not met) |
| --- | --- | --- | --- | --- |
| 1 | **War bench module.** Port this doc's harness to `bench/run.mjs` as a `war` module: leverage by rank (best−worst, best−stay out), share decided before asked, phantom dead, war-score reversion, AI gap, lead effect, war-day p95 | S | Code (bench/) | `reports/scorecard.md` War section shows ≥6 metrics for `release` and `fixes`; the module runs in ≤10 minutes; two runs on the same build agree within the CI |
| 2 | **After-action report from causes the sim already computes.** Wrap `A.fightDay` to collect each day's modifiers per side. Attribute shares by switching each factor off in the closed-form damage formula (no RNG). Store `{causes:[{label,pct}],text}` in `b.aar` and in the `w.battles` entry. Show it in the battle modal's end screen and the War tab | M | Code | Bench `afterActionShare` = 100% of player battles. Every report has ≥3 causes with \|pct\| ≥ 1. The causes explain ≥70% of the organisation-loss ratio in a 200-fight check. `renderRng` and `replayWithRender` tests pass |
| 3 | **Stop the phantom war.** For fights joined from a prompt (`wsKey`), the line battle applies no `A.applyLosses` and pushes no separate battle. Mission and line war-score effects go into `bscore` at a size that scales with the men involved, or aren't shown | S | Code (patch) | Phantom dead per line battle = 0. In the 12-seed control test, `w.score` 8 days after a won line battle is ≥ control in 12 of 12 seeds, or no score change is shown |
| 4 | **One battle, one result: sectors.** Build `wsPart` and `wsLine` battles from the real fight's divisions in the player's sector, the way `wsLeadBattle` does for generals, and apply their dead and organisation to those divisions, the way `BATTLE_END.wsBattle` does | L | Code | A/B harness: best−worst on the player's sector ≥15 points at ranks 0–6. On the whole fight ≥2 at ranks 0–3, ≥8 at 4–6, ≥15 at 7–9. Every CI lower bound > 0 |
| 5 | **Fix the wing battle's AI and exploits.** `aiDeploy` and `aiPulse` score candidate tactics with a one-pulse lookahead on a saved and restored engine RNG state. A side that never closes by the last pulse loses. "Fighting withdrawal" gives up the field. Stakes and spear wall counter the couched lance in the wing battle, as they do in `A.WTAC` | M | Code | Wing-battle study (18 setups × 200): AI within 10 points of the best fixed tactic in 18 of 18. Rally/withdraw draws ≤20% where AI play loses ≥80%. No tactic best in more than 4 of 12 contested setups |
| 6 | **Lead from the front, honestly.** Match the champion to the player's tier ±1. Show the champion and the duel odds next to the checkbox. Put the duel's effect in the report | S | Code | For a median-worth commander, leading moves the win rate between −5 and +10 points in all 3 test setups. Shown duel odds are within 5 points of 1,000 simulated duels |
| 7 | **Named men who grow.** Mates picked into a mission or battle gain skill (+2 to +4 per stage) and can be wounded; a mate earns a trait after 3 missions. Deaths go into the report and a "The fallen" list. Add 15–20 events that read mate flags | M | Code + content | In 32 enlisted lives, the median surviving mate gains ≥5 skill after 3 missions. Each life has ≥1 mate who appears in ≥3 events. `lint-events` passes with 0 raw tokens |
| 8 | **General temperaments.** Ruler and general traits set the war AI's weights: the attack threshold in `armyThink`, the retreat threshold in `divRetreat`, tactic weights and counter-reading in `tacDay`, and reserve timing in `aiPulse`. Show the enemy general and his temper in the fight panel | M | Code | Static: ≥4 war AI functions read traits. Bot (3 worlds × 60 years): bold generals attack ≥25% more per army-month than cautious ones; cunning generals read counters ≥1.5× as often |
| 9 | **Sieges with a monthly choice.** Town food from population and stores, camp supply, and disease. Choices: assault (cost and chance by wall level), mine (−30% days, collapse risk), starve, offer terms; the defenders can sally. Add camp events | L | Code + content | ≥1 prompt per 30 siege-days when the player's army or division is in a siege. Bot: assault cuts the median siege ≥40% at ≥2× the dead of starving it out. Static: `wsSiegeDay` queues a choice |
| 10 | **Orders from above.** Letters from the AI general to ranks 0–6 ("hold the ford until the 12th") that you follow or ignore, with merit and sector effects, and flags later events read | M | Code + content | ≥2 order letters per war-year below rank 7. Ignoring one costs merit. Following moves the sector result ≥5 points in the A/B bench |
| 11 | **Drill decides what you can do.** Drill levels unlock and strengthen counter tactics in the wing battle (spear wall, shield wall, stakes), and the report names drill as a cause | S | Code | A drilled spear wall beats a charge ≥15 points more often than an undrilled one in 500 wing battles. The report lists drill whenever its share ≥3% |
| 12 | **War-day speed.** Profile `A.wsDay` with 6 wars and 140+ divisions | M | Code | p95 ≤ 50 ms and max ≤ 120 ms (now 66 and 252) on the perf probe |
| 13 | **Delete dead war code.** `startCampaign` (about 440 lines, never called), `warYear`, and the two empty stubs | S | Needs source | Static: 0 uncalled war functions; the 16 browser tests pass |
| 14 | **Battle art.** Woodcut scenes by terrain and outcome, a sector map, banners | XL | Needs art | An outside artist finds 0 off-style battle screens |
| 15 | **Can players say why?** 12 new players fight 3 battles each and read the report | M | Needs people | 7 of 10 explain a win or loss with a cause the report names |

**A note on the plan's target.** "Player choices move battle results by 15%+ at every rank" is the wrong test for a game that sells a realistic world. A sergeant who swings a 29,000-man battle by 15 points is a hero fantasy. Bannerlord gets away with it because its battles are about 1,000 men and you are a hero (unverified). Measure each rank against what it owns: the file or sector at ranks 0–3, the company at 4–6, the battle and the war at 7–9. Then make the battle-level share grow with rank and always show it. Today Ardan fails both versions.

## 6. Sources

**Opened by sibling benchmarks in this repo (not re-opened for this doc)**

- Bannerlord `CombatSimulationModel` API: https://apidoc.bannerlord.com/v/1.2.7/class_tale_worlds_1_1_campaign_system_1_1_component_interfaces_1_1_combat_simulation_model.html
- Bannerlord combat simulation gist: https://gist.github.com/jzebedee/be076d28f162c8d05fd7d2d72109a46f
- Bannerlord mods: Simulations Fix https://www.nexusmods.com/mountandblade2bannerlord/mods/1151 · Fixed Simulations https://www.nexusmods.com/mountandblade2bannerlord/mods/12593 · Better Auto Calc https://www.nexusmods.com/mountandblade2bannerlord/mods/673 · Auto Resolve Rebalanced https://www.nexusmods.com/mountandblade2bannerlord/mods/3453
- Bannerlord autoresolve discussion *(community)*: https://steamcommunity.com/app/261550/discussions/0/3596716230234308872/
- Battle Brothers wiki *(community)*: Hit Chance https://battlebrothers.fandom.com/wiki/Hit_Chance · Combat Mechanics https://battlebrothers.fandom.com/wiki/Combat_Mechanics · Game Mechanics https://battlebrothers.fandom.com/wiki/Game_Mechanics
- Battle Brothers dev blogs: #143 https://www.gamebanshee.com/3drdx · #118 https://gamebanshee.com/k4cpp · #92 https://www.moddb.com/news/dev-blog-92-late-game-crises
- King of Dragon Pass: A Sharp overview https://www.a-sharp.com/kodp/overview.html · KoDP blog (storylets with casting) http://kingofdragonpass.blogspot.com/2021/08/kodp-on-web-50-years-of-text-games.html · Aaron Reed, 50 Years of Text Games https://if50.substack.com/p/1999-king-of-dragon-pass

**Not opened for this doc (web tools down): unverified, check before quoting**

- Hearts of Iron IV wiki: https://hoi4.paradoxwikis.com/Land_battle · https://hoi4.paradoxwikis.com/Battle_plan · https://hoi4.paradoxwikis.com/Division_designer
- Mount & Blade II: Bannerlord personal battles and companions: no source opened.
- Total War results screen and outcome tiers: no source opened.
- Battle Brothers roster size, injuries and levels: no source opened.
- King of Dragon Pass raid setup: no source opened.
- Field of Glory II points of advantage: no source opened.
- Ultimate General: Civil War after-battle report and persistent brigades: no source opened.

**Ardan (measured for this doc)**

- Build: `node tools/build.mjs --only=__none__` (fix layer only), run in headless Chromium through Playwright.
- Code read with `tools/show.mjs`: `A.fightDay`, `A.tacDay`, `A.WTAC`, `A.WIDTH`, `A.divCombat`, `A.wsPCFightStart`, `A.wsNudge`, `A.wsLeadBattle`, `A.BATTLE_END.wsBattle`, `A.newBattleForPC`, `A.newLineBattle`, `A.lineBattleResult`, `A.battleClose`, `A.battlePersonalCombat`, `A.aiDeploy`, `A.aiPulse`, `A.wsSiegeDay`, `A.wsScore`, `A.applyLosses`, `A.makeSquad`, `A.comradeDies`, `A.missionOdds`, `A.fightEnd`, `UI.wrFightPanel`, `UI.battleModalBasic`.
- Reviews: `docs/reviews/Ardan Road to 100.md`, `docs/reviews/Ardan Deep Analysis.md`. Bench: `reports/fixes.json` (`afterActionShare` 0 of 46 battles).

## Appendix: how this was measured

All runs used the fix-layer build in headless Chromium, driving the engine directly. Rendering was not involved.

**Rank A/B (W1–W5, W9, W18).**

- **Setup.** `A.newGame`, then remove other wars involving the two realms, then `A.enlist`. Set the rank and set command to 20 + 6×rank and tactics to 15 + 6×rank. Then `A.startWar(realm, enemy, …, {noAllies, silent})` and `A.wsAttachPC`.
- **Running the war.** Call `A.wsDay()` until `A.wsPCFightStart` queues a fight prompt. Only the war sim runs: no monthly life ticks, so the rank stays fixed.
- **Branching.** At each prompt, save `A.serialize()` (17 ms). For each policy and each replay k = 1..8, call `A.deserialize`, set `A.rngState` to a mix of the saved state and k (the same k for every policy, so streams are paired), reset health, apply the policy, then run `A.wsDay` until the fight's `A.fightEnd` fires (hooked to record the winner).
- **Coverage.** Pairs: Aldmark/Varenna, Drevna/Velgrad, Abara/Zanara, each from both sides. Seeds 101–505. Up to 6 prompts per war, wars of up to 730 days. Ranks 0–8.
- **Totals.** 624 prompts and about 15,000 replayed fights, in 12 minutes.
- **Statistics.** 95% CIs come from a bootstrap over prompts of the per-prompt difference in mean wins.
- **"Decided before asked"** means all 8 stay-out replays gave the same winner.

**Oracle (W2, W3).** The same setup at ranks 5 and 8, with 4 replays. For each prompt, every tactic the player's battle offers at deployment (about 16) is applied to all wings, and the battle is stepped with no AI help for the player's side. The best and worst are picked in hindsight. That makes the oracle an upper bound that also banks luck. 140 prompts, 11,152 replays.

**Standing battle order (W7).** At each prompt the player stays out and sets `pc.tac` to each attack or defence tactic in turn (plus "auto"). 211 prompts, 6 replays each.

**Whole-war orders (W6).** Rank 8, with the player's army taking 12–15 of the realm's divisions. Each war branches 3 days in, into `wsSetOrder` free, "obj" (the enemy capital), front or hold. It then runs to peace (all 288 runs ended, median about 137 days). The final war score is taken from the player's side.

**Wing-battle study (W12, W13).** `A.newBattle` with 8,000 Aldmark men against Varenna or Gorath at 0.8×, 1× and 1.25× their numbers, on plains, hills and forest, with equal quality (0.95) and equal command (50). Each setup ran 200 battles per policy with fixed RNG seeds. Draws count half. The policies:

- AI deploy only;
- the full "Fight it out" AI (`A.battleAuto`);
- the full AI plus leading from the front;
- each available tactic applied to every wing.

**Lead from the front (W14).** 300 battles per setup. The commander's health and record are reset before each battle. Champion duels are counted and their results logged.

**War score (W8).** 12 seeds, Aldmark against Varenna, rank 2, 20 war-days in. Three branches from the same saved state: control, a war mission, and a line battle, each played with the best-odds choices. War score is read right after and again 8 war-days later.

**Enlisted lives.** 32 lives over 8 starts, enlisted at 18, played with `A.advance(30)` to age 62 or death. Every war option is taken; missions and battles are played by the game's own auto routines. War-years by rank are counted from the realm's war state each month.

**Speed (W20).** 6 wars declared at once, 240 war-days, timing `A.wsDay` and `A.fightDay`. The CPU is the sandbox's, not throttled.

**Caveats.**

- The A/B runs skip the monthly life sim, so events, promotions and recruitment don't run during a war.
- "Worst" is a plausible mistake, not sabotage.
- Rank-7+ prompts fire for fights of 12,000+ men; lower ranks need 2,500+ men and their own division in the fight.
- Generals' prompts are capped at 6 per war, so 11.3 per war-year is a floor.
