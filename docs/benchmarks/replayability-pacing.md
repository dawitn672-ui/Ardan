# Replayability, and Pacing and core loop: benchmark

Oct 13, 2026 · build `b593143` plus the fix layer (features 00 to 05, build id `b593143+f8.897e9d0`, 3,199 events), measured in headless Chromium. Strict scores going in, from "Ardan Road to 100": **Replayability 5.5**. **Pacing and core loop** had no score; that review added it as a 15th aspect. The bench scorecard (`reports/scorecard.md`) gives Replayability a "measured" 8 and Pacing 5.6. This doc argues both are too generous, and shows why.

Every number about Ardan below was measured for this doc unless it names a review. Every claim about another game carries a link. Anything I could not source is marked *unverified* or left out.

**About the sources.** This session could not open wikis, Wikipedia, GDC Vault, Steam or any game site: their hosts failed at DNS or were refused by the proxy, and the shared web-search budget was already spent before this doc started. GitHub was reachable. So most outside numbers here come from **the games' own data and script files, as mirrored in public GitHub repositories**: Hades' Lua scripts, RimWorld's storyteller defs and decompiled engine code, Crusader Kings III's script and localization, Slay the Spire's decompiled code, FTL's sector data, a mirror of the Dwarf Fortress wiki, and an accessibility mod that reads Reigns' game state. Each link says which mirror. Mirrors can be an older version of a game; treat exact counts as "in that version". A few claims reuse sources that the sibling benchmark docs found through search; those say so.

**What this found, in seven lines.**

- **The default start is three minutes of nothing.** "Random life" starts a newborn. No event can fire before age 1, an infant rolls 5% a month, and free time is 0 until age 3. Median wait for the first prompt of any kind: **731 game days, about 3 minutes of clock at the default speed, with nothing to click.**
- **At the default speed, about half of a session is watching the clock.** A year takes 91 seconds of clock. Reading a year's events takes about 63 seconds. Counting 5 seconds per decision, **52% of real time is the clock running with nothing to do.** The median life has **9 stretches of more than a minute** with no prompt, and its longest stretch is about **1,000 game days (over 4 minutes)**.
- **Time does not bend.** The clock runs at one speed the player picks. Every event stops it, and "quiet mode" answers **97% of events** for you. There is no middle: nothing speeds up when nothing can happen (infancy), and nothing lets small news wait. An elf's childhood is **76 minutes of clock**; a full elf life is about **10 hours**.
- **The world starts the same every time.** Every run begins in 1105 with the same 306 provinces, the same 35 realms and the same rulers. Thirteen coin flips in the first year decide which wars start. After 60 years, **any two worlds still agree on 64% of province owners**, and only **1 to 3 realms fall**.
- **Lives differ by luck, not by plan.** The bench classifier finds 12 arc types, but the most common "arc" is **"cut short" (died before 20), at 21%**. Ignore that and the top arc ("fortune made") is 28%. By trajectory, **36% of lives are "grow up, take a job, keep it until death."** The start a player picks barely predicts the arc: the link is no stronger than random labels give at this sample size.
- **Replays run dry fast.** From the same start, the 4th life sees about 30% events it has not seen before, and the 8th about 18%. Within one life, **29% of events are repeats**.
- **Death is a menu, not a scene.** There is one ending: death. Only **20% of deaths leave a living child** to go on as. The 37 achievements and the score reset with every new life. Nothing in the next life knows how the last one ended. Nothing can be exported.

## 1. The bar

A 10 in this genre means every run starts somewhere new, goes somewhere different, and ends in a way that makes you start the next one. RimWorld, Dwarf Fortress and Crusader Kings III make the *world* different each time; Slay the Spire, FTL and Hades make every few seconds a decision and every death a step forward. Pacing at a 10 means **the player never waits for the game**: time skips what is empty (BitLife's one tap per year, RimWorld's 12× speed while the colony sleeps, FTL's cap of 1 to 2 empty beacons per sector) and slows for what matters. Death is content: the next run knows how the last one ended (Hades has 57 dialogue sets keyed to what killed you), and long goals carry across runs. A player who loves the genre cannot name a life sim whose tenth run feels fresher, or whose hour holds more real choices.

## 2. How the best do it

### RimWorld (a storyteller, and a clock that bends)

**Mechanism.** Pacing is data, not a fixed dice roll. Each storyteller is a set of components in `Storytellers.xml` ([mirror of RimWorld's Core defs](https://github.com/RimWorld-zh/RimWorld-Core/blob/master/Core/Defs/Storyteller/Storytellers.xml)):

- **Cassandra Classic** alternates 4.6 days "on" with 6.0 days "off", sends 1 to 2 big threats per "on" phase at least 1.9 days apart, starts after day 11, and forces a raid before day 20.
- **Phoebe Chillax** uses 8 days on, 8 off, starting after day 13.
- **Randy Random** fires on a mean of 1 day (`mtbDays` 1.00), never lets 13 days pass without a big threat (`maxThreatBigIntervalDays` 13), and scales each threat by 0.5 to 1.5.
- **All of them adapt.** Threat size ramps from 0.7 at day 10 to 1.0 at day 40. Losing a colonist subtracts 28 "adaptation days", which lowers the next threats.

**The clock bends** (decompiled engine, [RW-Decompile](https://github.com/josh-m/RW-Decompile)):

- 60 ticks a second at Normal and 60,000 ticks a day, so a day is **1,000 seconds (16.7 min) at 1×** ([GenDate.cs](https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/GenDate.cs)). A year is 60 days in four 15-day quadrums.
- Fast is 3×, Superfast 6×, and Superfast **doubles to 12× when every colonist is asleep** (`NothingHappeningInGame`), Ultrafast 15× ([TickManager.cs](https://github.com/josh-m/RW-Decompile/blob/master/Verse/TickManager.cs)).
- **Not every event stops play.** An urgent letter pauses the game if the player wants that. A letter marked `forcedSlowdown` drops to normal speed for 240 ticks. Everything else stacks at the side of the screen and waits ([LetterStack.cs](https://github.com/josh-m/RW-Decompile/blob/master/Verse/LetterStack.cs), [TimeSlower.cs](https://github.com/josh-m/RW-Decompile/blob/master/Verse/TimeSlower.cs)).

Tynan Sylvester calls RimWorld a story generator ([GDC Vault, 2017](https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and); found through search by `events-story.md`).

**Lesson for Ardan.** Ardan has one fixed monthly chance per life stage and one fixed clock speed. They are two systems that do not talk. RimWorld's director knows how long it has been quiet and forces something; its clock knows when nothing can happen and runs faster. Ardan's clock runs at 4 days a second through an infancy in which nothing can happen, then stops dead for a lullaby. Merge them: the director should set the clock.

### Hades (death moves the story forward)

**Mechanism.** Every death sends you home to the House of Hades, where people talk about what just happened. In a [public mirror of the game's scripts](https://github.com/crazytuzi/LuaFramework/tree/master/Hades):

- `NPCData.lua` holds **4,909 spoken lines**. **1,403** conversation requirements name an earlier conversation (`RequiredTextLines`), and **1,252** conversations play once.
- **57** conversations react to **which enemy killed you last run** (`RequiredLastKilledByUnits`), and **14** to the room you died in (`RequiredDeathRoom`). Hypnos, at the door, reads you the cause from "his list".
- `DeathLoopData.lua` gates House lines by runs played (`RequiredMinCompletedRuns`, 69 uses in NPC data) and by escapes (one line needs 10 clears).
- **Long goals across runs.** The Fated List (`QuestData.lua`) has **56 entries**, from the first escape to reuniting the Olympians. Each pays a currency that buys things for later runs.
- **Difficulty as named rules.** The Pact of Punishment has **16 conditions** with heat costs (boss difficulty costs 1, 2, 3, then 4 per rank) (`MetaUpgradeData.lua`).
- **A pacing number.** The "Tight Deadline" condition gives each of the 4 regions (Tartarus, Asphodel, Elysium, Styx) **9, 7 or 5 minutes** (540, 420, 300 seconds in `BiomeTimeLimits`). The designers think a pressed player clears a region in under 9 minutes.

From sources found by `events-story.md`: over 300,000 words and 21,000 voice lines, written so a game played many times stays reactive ([Cultured Vultures](https://culturedvultures.com/supergiant-hades-word-count-dialogue/); [GDC Podcast ep. 16](https://gdconf.com/article/roguelikes-and-narrative-design-with-hades-creative-director-greg-kasavin-gdc-podcast-ep-16/)).

**Lesson for Ardan.** Ardan's death screen is a ledger: a title, a cause, five counts, the last 5 deeds, a score, and buttons. When you go on as your child, no one mentions how the parent died. Hades turns the gap between runs into the best-written part of the game. Ardan needs that hub (a family hall between lives), lines keyed to the cause and the killer, and a house goal list that survives death.

### Slay the Spire (every step is a choice you can see coming)

**Mechanism** ([decompiled code mirror](https://github.com/AxorusMT/sts)):

- Each act is a map **15 rows tall and 7 wide**; the final act is 3 rows (`AbstractDungeon.java`: `MAP_HEIGHT = 15`, `MAP_WIDTH = 7`, `FINAL_ACT_MAP_HEIGHT = 3`).
- Act 1 rooms are 5% shop, 12% rest, 22% event and 8% elite, the rest monsters (`Exordium.java`). Ascension 1 multiplies elites by 1.6.
- Every card reward offers **3 cards** (`numCards = 3`). Daily runs share one seed (`Settings.isDailyRun`).
- **Ascension** stacks 20 named rules, one per level ([TrueAchievements guide](https://i1.trueachievements.com/game/Slay-The-Spire/walkthrough/2), found by `power-balance.md`). The original game was won 9% of the time at Ascension 0 and 3% at Ascension 20 ([Gamegeeker](https://gamegeeker.com/fr/news/slay-the-spire-2-may-neows-news-update?market=FR), via `power-balance.md`). Mega Crit balanced from pick rates logged from the prototype on ([Game Developer](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder), via `power-balance.md`).

**Lesson for Ardan.** The whole act is on screen, so the player plans 15 choices ahead and every node is a decision. Ardan's next five years are invisible: you cannot see that school ends at 14, that your lord's war call comes in spring, or that the guild exam is next year. And Ascension shows how to add replay without new content: named rules that stack.

### FTL: Faster Than Light (empty time is a budget)

**Mechanism.** `sector_data.xml` ([base game data, mirrored in a test fixture](https://github.com/hahn-kev/ftl-xml-extension/blob/master/test-data/ftl-base/sector_data.xml)) defines **21 sector types**; the final sector is the 8th (`minSector="7"`). Each sector draws its beacons from slot budgets. A standard sector has **13 to 24 beacons**, of which **1 to 2 are "NOTHING"**, 4 to 6 are hostile civilians, 2 hostile ships, 1 to 2 stores, 1 to 2 distress calls and 1 quest. A rebel fleet advances behind you, so you can't linger ([Wikipedia](https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light), via `power-balance.md`). The GDC 2013 postmortem exists ([GDC Vault](https://gdcvault.com/play/1019036)); I could not read it.

**Lesson for Ardan.** In FTL, nothing is a slot with a cap: at most 2 empty beacons in 13 or more, about 8 to 15%. Ardan has no cap on emptiness. In a median life, 33% of the game days sit inside stretches longer than a real minute at the default speed.

### Crusader Kings III (the run is a dynasty)

**Mechanism** ([CK3 game files, mirrored](https://github.com/mgp1212121212/ck3_vanilla)):

- **Death is not the end.** You play on as your heir. The game ends only on "No valid heir of your dynasty" or "Reached the end date" ([`ingame_main_l_english.yml`](https://github.com/mgp1212121212/ck3_vanilla/blob/main/localization/english/gui/ingame_main_l_english.yml)), and the end date is 1453.1.1 ([`00_defines.txt`](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/defines/00_defines.txt)).
- **Starts.** Bookmarks at 867, 1066 and 1178 ([`00_bookmarks.txt`](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/bookmarks/bookmarks/00_bookmarks.txt)). Also **52 "challenge character" starts**, each a hand-picked person with a difficulty label and an achievement to chase ([`00_challenge_characters.txt`](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/bookmarks/challenge_characters/00_challenge_characters.txt)).
- **Meta-progression across heirs.** Dynasty legacies come in **8 tracks** in the base file (blood, kin, glory, guile, law, erudition, warfare, activities) ([`99_legacies.txt`](https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/dynasty_legacies/99_legacies.txt)), bought with renown that the whole dynasty earns.

**Lesson for Ardan.** Ardan has "Go on as your child", but only for a death that leaves a living child (20% of bot deaths), and nothing else carries over. CK3's challenge characters are exactly the plan's "20 hand-made starting stories": a person, a position, a stated goal, a difficulty. Legacies show what a dynasty-level goal looks like.

### Dwarf Fortress (every world has its own past; legends you can take away)

**Mechanism** ([mirror of the DF wiki](https://github.com/CannonCoPilot/DwarfCron/tree/main/data/wiki)):

- **History before play.** World generation simulates **5, 125, 250, 550 or 1,050 years** of history before you start ([World generation](https://github.com/CannonCoPilot/DwarfCron/blob/main/data/wiki/DF2014_World_generation.md)). Toady One, quoted there: "a giant zero-player strategy game going on ... and history is just a record of that."
- **Legends mode** lists historical figures, sites, regions, civilizations and every event by age, with a historical map you can move 10 or 100 years at a time ([Legends](https://github.com/CannonCoPilot/DwarfCron/blob/main/data/wiki/DF2014_Legends.md)).
- **Export.** An XML dump of a 1,000-year world can reach a gigabyte ([XML dump](https://github.com/CannonCoPilot/DwarfCron/blob/main/data/wiki/DF2014_XML_dump.md)). Community viewers read it.

**Lesson for Ardan.** Ardan's world engine already simulates wars at about half a second a game year (bench `perf`: 466 ms per year). Thirty to a hundred years of history before the player's birth would give every run its own recent past, its own fallen realms and its own grudges, for 15 to 50 seconds of loading. And a legends export turns a life into something people pass around.

### Reigns (no clock to watch)

**Mechanism.** An accessibility mod that reads the game's state ([Reigns Access](https://github.com/leoguimaoficial/Reigns-Access), *community*) shows the structure: four gauges, Church, People, Army and Treasury, read as percentages; a card with a left and a right choice; "years in power"; an active objective; a "local leaderboard" of reigns; a king's death screen ([`GameInfoReader.cs`](https://github.com/leoguimaoficial/Reigns-Access/blob/main/ReignsAccess/GameData/GameInfoReader.cs), [`en.json`](https://github.com/leoguimaoficial/Reigns-Access/blob/main/ReignsAccess/Lang/en.json)). Its README quotes the Steam page: "Each year brings another important, seemingly random request", "Royal Challenges: Pursue goals at the start of a reign to cement your legacy and unlock new cards and content", and "Some events span centuries". *Unverified:* a gauge at 0 or 100 ends the reign, and a reign lasts minutes.

**Lesson for Ardan.** Reigns has no idle time at all: a card is a year, and the next card is the next decision. Death is quick and pays out (challenges unlock cards). Ardan at the default speed offers about 1.5 prompts per real minute.

### BitLife (time moves only when you press)

**Mechanism.** A life is lived by pressing **Age Up**: one press, one year, then that year's events with choices (described by a [fan remake built "in homage to BitLife"](https://github.com/jmrothberg/BitLife), *community*). The sheet is four bars, and activities stay greyed out until the minimum age (BitLife wiki pages found by `character-lifesim.md`: [Stats](https://bitlife-life-simulator.fandom.com/wiki/Stats), [Activities](https://bitlife-life-simulator.fandom.com/wiki/Activities), *community*).

**Lesson for Ardan.** There is no dead time because there is no clock. Ardan already has the button: "skip" advances to the end of the year or to the next prompt (`UI.A.clkSkip`). It is the second-class option. The first-class one is a clock that runs at 4 days a second.

### Shorter references

- **Wildermyth** lets 10 to 12 years of peace pass between chapters, and heroes age in the gap ([Wildermyth wiki, Campaign](https://wildermyth.com/wiki/Campaign), *community*, found by `events-story.md`). A time skip is a scene, not a wait.
- **King of Dragon Pass** writes the clan's saga year by year, readable in game or as a text file ([A Sharp](https://www.a-sharp.com/kodp/overview.html), found by `events-story.md`).

## 3. Backtest

### What I measured, and how

Everything ran against a private build of the fix layer (`node tools/build.mjs --out=<scratch> --unpack=<scratch>`). The scripts lived in a scratch folder; nothing in the repo changed except this file.

1. **Engine and UI read** with `tools/show.mjs`: `UI.clk`, `UI.CLK_SPEEDS`, `UI.clkTick`, `UI.quietable`, `A.monthEvents`, `A.freeTime`, `A.stage`, `A.newGame`, `A.initWorld`, `A.rollBranches`, `A.branchYear`, `A.continueAs`, `A.score`, `A.ach`, `UI.deathModal`, `UI.crStepBegin`, `UI.crRandomize`.
2. **128 bot lives.** 8 starts (the same ones as `bench/run.mjs`) × 4 bot styles (careful, reckless, greedy, random) × 4 seeds. Seeds 0 and 2 play "engaged" (spend free time each month on the game's own "What now" pick), seeds 1 and 3 "passive". Every life starts as a newborn, as "Random life" does, and runs to death or 90 years. Driving is the same as `bench/bot.mjs`. For every prompt the bot logged the game day, age, type, event id and words shown (text, choices and result).
3. **8 worlds × 60 years** (seeds 101 to 808), a passive player who is replaced by another adult on death. Snapshots of every province's owner, every realm and every ruler at 1105, 1110, 1120, 1135, 1150 and 1165.
4. **A static count** of start options, events that quiet mode can answer, and achievements.

**The real-time model.** Clock time is game days ÷ the speed (the default is 4 days a second). Reading time is words ÷ 238 words a minute, the average silent reading rate for English non-fiction in a 2019 meta-analysis ([Brysbaert, *Journal of Memory and Language*](https://doi.org/10.1016/j.jml.2019.104047); from memory, not re-checked this session). Decision time is shown at 0, 5 and 10 seconds a prompt. Menus and free-time actions are not counted, so "share of time watching the clock" is an upper bound for a player who also manages their character, and a fair estimate for one who just answers prompts.

### Key results: the clock and the director

**How time moves today.**

- Speeds are 1.5, 4, 10, 24 and 60 game days per real second (`UI.CLK_SPEEDS`); **the default is 4**. A game year is 91 s of clock at the default and 6 s at the top speed.
- **Any queued item stops the clock** (`UI.clkTick` stops on `A.headReady()`). There is no "let it wait".
- **Quiet mode** answers every event that is not a duty, council or flow event with the highest-odds choice. That is **3,091 of 3,199 events (97%)**. So the player's options are "every event stops me" or "almost nothing does".
- **Skip** advances up to 400 days, stopping at year end or at a prompt.
- **The director** is `A.monthEvents`: no events before age 1; then 1 event (2 with a 12% chance) at a fixed monthly chance of 5% (infant), 17% (child), 28% (teen), 32% (adult) or 26% (old). Prison skips 60% of months. Nothing raises the chance after a quiet stretch.
- **Free time** (`A.freeTime`) is 0 until age 3, then 4 days a year for a child, 6 for a teen, 7 for an adult and 6 when old.

**Prompts by life stage** (128 lives, pooled):

| Stage (human ages) | Life-years | Prompts a year | Median gap (days) | 90th percentile gap | ...in real seconds at default |
| --- | --- | --- | --- | --- | --- |
| Infant (0 to 3) | 281 | **0.5** | 425 | 1,026 | **257** |
| Child (3 to 12) | 718 | 2.9 | 90 | 334 | 84 |
| Teen (13 to 15) | 231 | 5.2 | 59 | 181 | 45 |
| Adult | 1,178 | 6.9 | 31 | 122 | 31 |
| Old (50+) | 178 | 7.4 | 31 | 123 | 31 |

**A life in real time at the default speed** (median over lives):

| Measure | Value |
| --- | --- |
| Days to the first prompt from birth | **731** (about 3 min of clock); worst life 2,403 days (10 min) |
| Prompts from birth to 16 (humans) | 41, in 24 min of clock |
| Prompts a year, whole life | 4.7 (engaged bots 4.7, passive 4.3) |
| Words a prompt (events, incl. result) | 59 |
| Reading time a game year | 63 s |
| Clock time a game year | 91 s |
| **Share of real time watching the clock** (0 / 5 / 10 s per decision) | **59% / 52% / 46%** |
| Prompts a real minute (5 s per decision) | **1.5** |
| Stretches with no prompt longer than 30 s / 60 s / 120 s, per life | 36 / **9** / 3 |
| Share of a life's game days inside gaps over 60 s | **33%** |
| Longest gap in a life | **1,004 days (4.2 min)**; 90th percentile 1,492 days (6.2 min) |
| Free-time actions a year (engaged bot) | 4.3 of a cap of 7 |

**Speed changes the picture, but not the shape.**

| Speed | Days a second | Share watching (reading only) | Real minutes a game year |
| --- | --- | --- | --- |
| 1 | 1.5 | 79% | 5.1 |
| 2 (default) | 4 | 59% | 2.6 |
| 3 | 10 | 37% | 1.7 |
| 4 | 24 | 19% | 1.3 |
| 5 | 60 | 9% | 1.2 |

At the top speed the waiting nearly disappears, but every event still stops the clock, and the infant years still hold 0.5 prompts a year. A player who finds speed 5 is a player who has learned that the clock is the enemy.

**Race decides session length.**

| Race | Adult at | Clock to adulthood at default | Prompts before adulthood | Clock for a full life at default |
| --- | --- | --- | --- | --- |
| Human | 16 | 24 min | 41 | 94 min (62-year life) |
| Orc | 13 | 20 min | 31 | 79 min (52 years) |
| Dwarf | 30 | 46 min | 111 | **5.4 h** (215 years) |
| Elf | 50 | **76 min** | 135 | **10.1 h** (400 years) |

Full-life clock uses each race's mean lifespan from `GD.RACES`. Dwarf and elf bots hit the 90-year cap alive.

### Key results: replayability

**What the start screen offers.** 7 races × 34 realms × 8 statuses give **614 valid combinations**, 4 start ages (newborn, child, coming of age, grown), 3 difficulties and a seed. There are **0 hand-made starts**: no origin with its own first years. Every run begins in **1105**.

**How different is the world?** The title screen says: "Every run differs: the wars of 1105 may or may not break out, kings live or die, provinces change hands." The engine's version of that is `A.rollBranches`: **13 coin flips**, at chances from 8% (Ithrien dies) to 78% (the Aldmark wedding), applied once in 1105. The map, the 35 realms, their rulers, treasuries and relations are loaded from the lore, the same every time.

| Year | Provinces changed hands since 1105 | Two worlds agree on an owner | Realms alive | Rulers still the 1105 ruler |
| --- | --- | --- | --- | --- |
| 1105 | 0% | **100%** | 35 | 100% |
| 1110 | 8% | 89% | 34 | 81% |
| 1120 | 14% | 82% | 35 | 63% |
| 1135 | 21% | 72% | 36 | 21% |
| 1150 | 24% | 68% | 36 | 6% |
| 1165 | 26% (21 to 35%) | **64%** (55 to 75%) | 37 | 3% |

People churn fully; the map does not. Each world fought 20 to 29 wars (113 different war names across 8 worlds; only 2 in every world). 1 to 3 realms fell per world, and one of them (Prince Andros's breakaway Tessaria) fell in all 8. A player born in 1105 lives their whole childhood in a world that is 82 to 100% the same as last time.

**How different is the life?**

| Measure | Value |
| --- | --- |
| Arc types (bench classifier, `B.arc`) | 12 |
| Most common arc | **"cut short" (died before 20): 21%** |
| Most common arc if "cut short" is not counted as an arc | "fortune made": 28% |
| Distinct career trajectories (child, job, army, office, prison, ruler) | 24 |
| Most common trajectory | **"child, then job until death": 36%** |
| Start → arc link (mutual information ÷ arc entropy) | 31%, vs **29% for random labels** in 8 groups of this size |
| Bot style → arc link | 18% |
| Deaths before age 20 | 24% |
| Death age, 10th / 50th / 90th percentile | 15 / 37 / 69 |
| Distinct causes of death | 25; the top one ("a kick from a horse") is 11% |

The start a player picks barely predicts how the life goes. That sounds like variety, but it is the wrong kind: what decides the arc is dice (a fever at 15, a horse at 30), not the start, not the plan, and not the player's style.

**How fast do replays run dry?**

| Life number from the same start | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Share of its events never seen in earlier lives | 100% | 71% | 59% | 30% | 33% | 20% | 23% | 18% |

- Two lives from the same start share a median **20%** of their events (Jaccard); two lives from different starts share **13%**. Every life draws on a common core.
- A median life sees **125 distinct events** of 3,199 (4%). All lives together saw 1,239 (39%).
- Within one life, **29% of events are repeats** of one already seen that life (`events-story.md` measured 36% with a different bot).

**How does a run end?**

- **One ending**: death. The death screen shows the title line, cause, age, a few counts, the last 5 deeds and a life score.
- **"Go on as your child"** appears only if a child is alive: **20% of deaths**. Otherwise the choices are "A new life" (a fresh world) or the title screen.
- **Nothing carries over to a new life.** `A.newState` resets the 37 achievements (`S.ach = {}`), the dynasty and the "Lives lived" list. Bots unlocked a median of 2 achievements a life.
- No export of the life or the world. No epilogue. No reaction in the heir's first scene to how the parent died.

### The backtest table

| Metric | Reference game value or practice | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- |
| **P1. Share of real time with nothing to do** (default speed, 5 s a decision) | Reigns: a card is a year, no idle clock (*community*). BitLife: time moves only on Age Up | **52%** | ≤ 20% at the default speed | Bot (real-time model) + human playtest (Playtest mode logs clock-running vs prompt-open time) |
| **P2. Longest dead stretch in a life** | FTL: 1 to 2 "NOTHING" beacons in 13 to 24 a sector. RimWorld Randy: ≤ 13 days without a big threat | **1,004 days** (4.2 min at default); 90th pct 1,492 | ≤ 180 days for ages ≥ 3, and ≤ 45 s real time at default | Bot |
| **P3. Time to the first prompt** (Random life) | Reigns, BitLife: a decision on the first screen | **731 days** (3 min); worst 2,403 | ≤ 10 s real time, first prompt in the first in-game month | Bot + browser test |
| **P4. Prompts a year by stage** | Wildermyth skips 10 to 12 empty years; BitLife: one press a year | Infant 0.5, child 2.9, teen 5.2, adult 6.9, old 7.4 | ≥ 3 per year at every stage (or the stage is skipped as a montage) | Bot |
| **P5. Clock that adapts** | RimWorld: 12× while the colony sleeps; forced normal speed for urgent news; minor letters wait | Fixed speed; every event stops it; quiet mode answers 97% | Auto-fast through empty months, auto-slow before decisions; minor events wait in a tray | Static + browser test |
| **P6. Session length a life** | Hades: 9 / 7 / 5 min a region under Tight Deadline, 4 regions | Human 80 min (clock + reading, default); dwarf 5.4 h and elf 10.1 h of clock | Any race's life in 60 to 120 min at default; a "chapter" fits in 15 to 25 min | Bot (real-time model) |
| **P7. Decisions a real minute** | Slay the Spire: a path choice every room, 1 of 3 cards after every fight (15-row map) | **1.5** prompts a minute | ≥ 4 a minute at default, counting free-time actions | Bot + human playtest |
| **P8. Can you see the next choices coming?** | Slay the Spire shows the whole 15-row act | No: school ends, war calls and exams arrive unannounced | A "years ahead" strip with ≥ 3 known upcoming moments at every age | Static + human playtest |
| **R1. Hand-made starts** | CK3: 52 challenge characters, each with a goal and an achievement | **0** (614 generic combinations) | ≥ 20 origins with their own first 5 years (plan) | Static + bot |
| **R2. World differs at birth** | Dwarf Fortress: 5 to 1,050 years of generated history. CK3: 3 start dates | **100%** of province owners identical at 1105; 64% shared after 60 years | Two random runs share ≤ 50% of owners at the player's birth | Bot (world snapshots) |
| **R3. Life arcs** | Plan: ≥ 8 types, none above 25% | 12 types, but top = "cut short" 21%; top real arc 28%; top trajectory 36% | ≥ 8 types excluding early death, none above 20%; top trajectory ≤ 20% | Bot (bench classifier + trajectory classifier) |
| **R4. The player's choices decide the arc** | Slay the Spire: archetype follows picks (pick-rate data) | Bot style explains 18%; start explains no more than chance | Engaged-bot style explains ≥ 40% of arc entropy; deaths before 20 ≤ 10% on Hard | Bot |
| **R5. Novelty on replay** | Hades: 1,403 lines gated on earlier lines keep later runs new | 4th life from the same start: 30% new events; 8th: 18% | 8th life from the same start: ≥ 40% new events | Bot |
| **R6. Endings** | CK3: game over only when the dynasty has no heir. Hades: an epilogue after 10 clears | **1** (death); heir available in 20% of deaths | ≥ 8 ending types, each with an epilogue; an heir or a successor (pupil, sworn kin) in ≥ 60% of deaths | Bot |
| **R7. Death is content** | Hades: 57 conversations keyed to the killer, 14 to the death room | **0** lines react to how the last life ended | ≥ 1 reaction in the heir's first year for 90% of successions, from ≥ 30 lines | Bot |
| **R8. Goals that survive death** | Hades: 56-entry Fated List. CK3: 8 legacy tracks. Reigns: challenges that unlock cards | 37 achievements, **reset on every new life** | A persistent house record with ≥ 40 goals, kept across lives and new games | Browser test |
| **R9. Named challenge rules** | Hades: 16 Pact conditions. Slay the Spire: 20 Ascension levels | 3 difficulties that change mortality and score | ≥ 10 named "hardships" that stack, each moving one measured outcome ≥ 15% | Bot |
| **R10. A record you can take away** | Dwarf Fortress: Legends export (up to 1 GB XML). King of Dragon Pass: the saga as a text file | None | One-click export of a life and its world as a readable page | Browser test |
| **R11. Players come back** | Plan gate: playtesters start a third run on their own | **Unmeasured** (0 playtests) | ≥ 7 of 12 new players start a 3rd run unprompted | Human playtest |

## 4. North star

With unlimited time, money and people, Ardan's replayability and pacing look like this.

**A life is a book of chapters.** Each life is 8 to 12 chapters: birth and infancy as a 60-second illustrated montage of 3 choices (a name, a first word, a fever); childhood; apprenticeship or school; first love; the first real test (war, debt, a crime, a calling); the prime; the turn (a fall, a betrayal, a crown); old age; the reckoning. Each chapter opens with a title card ("Chapter 4. The Summer of the Gordush Muster, 1121") and closes with a save, a two-line summary and the hooks it leaves. **A chapter fits a 15 to 25 minute session.** A full human life is 90 to 120 minutes; elves and dwarves live the same number of chapters with longer jumps between them.

**The clock is the director.** One system decides both when things happen and how fast time runs:

- It keeps a tension budget like RimWorld's, per life stage and per path, and never lets more than 4 game months pass for an adult without a real decision.
- In quiet stretches the clock runs at 60 days a second and the screen shows a "seasons pass" strip (harvests, births, news) you can read later. Thirty days before a known decision (an exam, a muster, a wedding), it slows to 4 days a second and says why.
- Small news (a cousin married, prices rose, a lord died abroad) never stops play. It lands in a tray, like RimWorld's letters, and turns into a prompt only if you open it.
- On a phone, a BitLife-style "Next" button replaces the clock: one press runs to the next thing worth deciding.
- **Targets:** ≤ 15% of real time with nothing to do; ≥ 4 decisions a real minute; no stretch over 30 s at the default speed; first decision within 10 s of the first screen.

**Every run is a different world.** The game pre-simulates 100 to 300 years of history before your birth, from the 34 realm bibles as seeds, so realms rise and fall, borders move and grudges form before you exist. A start screen offers 5 eras (the 1105 bookmark plus 4 generated ones), a "world summary" card (who rules, who is at war, what the last plague was) and the option to share the world's code. **Two random worlds share ≤ 40% of province owners at the player's birth.** A daily world, the same for everyone, has its own leaderboard.

**Forty origins, twelve endings.** 40 hand-made origins (escaped slave, exiled prince, plague orphan, pirate's child, a dwarf born in a human city, a priest's secret son…), each with its own first 5 years, its own enemies and a stated ambition, like CK3's challenge characters. 12 endings, each with a written epilogue of 300 to 600 words sifted from the life log: retire in peace, found a house, become a legend, take vows, flee overseas, rise in an order, die in battle, die on the gallows, die in exile, vanish, outlive everyone, be remembered wrongly. **No ending above 20% of 1,000 bot lives; ≥ 10 of 12 seen.**

**The family hall between lives.** When you die, you wake as your heir in the family hall. Three to five kin speak, and each line knows the cause, the killer, the place and the last deed: "They say the Varennese captain did it at the ford. Mother does not say anything." The hall holds the **house record**: 60 goals across generations (hold a seat for 100 years, end a feud, raise a Master, buy back the old seat), a shrine of the dead with their epilogues, and the house's grudges and debts. 3,000 hall lines, half of them keyed to how the last life ended, as Hades keys 57 sets to the killer. If no child lives, a pupil, a sworn brother, a bastard or a nephew can take up the line, so **≥ 70% of deaths have a successor**. Goals and achievements live in a cross-life profile that survives "A new life".

**Hardships and seasons.** 16 named hardships that stack, like the Pact of Punishment: "Lean Years" (harvests fail twice as often), "Bad Blood" (one realm hates your house from birth), "No Inheritance", "The Long Plague", "Hard Schooling" (checks −10 until 20) and more. Each moves a measured outcome by 15 to 40%, and the house record notes which hardships a goal was won under.

**A legend you can take away.** Every life and every world exports as an illustrated chronicle (HTML and EPUB) in a period voice, with a family tree, a map of where you lived and a timeline of the world's wars. Players share them. Events and realms load from data files, so the community adds origins and hardships.

**Proof.** 1,000 bot lives a night sort into ≥ 10 arc types (early death not counted), none above 20%. The 8th life from one origin still sees ≥ 40% new events. Recorded playtests of 12 new players a phase: median session 20 minutes ends at a chapter break, not mid-chapter; ≥ 9 of 12 start a third run unprompted; ≥ 7 of 12 retell how their last character died and what the heir did about it.

## 5. What to build now

Ranked by score gain per effort. "Built here" says whether it fits this repo as a feature (`patches.mjs`, `*.core.js`, `*.events.js`, per `CLAUDE.md`) or needs art, people or the real source. Gains are my estimates on each aspect's 10-point score; Pacing starts at about **4** (a fixed clock, three dead minutes at birth, half the session idle) and Replayability at **5**.

| # | Feature | Aspect | Effort | Built here? | Gain | Acceptance test (must be able to fail) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Measure pacing and replay in the bench.** Add to `bench/run.mjs` league: days to first prompt; gaps by life stage; longest gap per life; real-time model (watching share at default, prompts a real minute); trajectory classifier; arc share without "cut short"; start→arc and style→arc mutual information against a shuffle baseline; same-start novelty curve; heir-available share. Score them in `bench/rubric.mjs` with the targets in section 3. | Both | S | Yes: code (`bench/` owner) | +0.3 each (honest numbers; today's 8 and 5.6 drop) | `node bench/run.mjs --only=league` reports every new key; on the fix layer it must reproduce this doc within ±15% (first prompt ~731 days, longest gap ~1,000, watching ~52%). Fails if any key is null |
| 2 | **Adaptive clock.** A `*.core.js` that sets `UI.clk` speed each tick: top speed (60 d/s) while nothing can happen (age < 1, or no event roll possible this month and no scheduled item within 30 days); the player's speed otherwise; drop to speed 2 for 3 s when an item is queued for the next 15 days (`A.S.sched`). A small "time flies" strip shows what passed. Rendering stays pure: speed is UI state, not `A.S`. | Pacing | S | Yes: code | +1.0 | Browser test, newborn "Random life", Play pressed once at default speed: first prompt within **15 s real time** (today ~3 min). Scripted 30-year run: no stretch without a prompt over **45 s real time**. `renderRng` and `replayWithRender` pass (same world with and without the feature) |
| 3 | **A director floor.** Wrap `A.monthEvents` in a `*.core.js`: track months since the last prompt; raise the chance after quiet months (×1.5 after 3, ×3 after 6) and force a stage-appropriate event after 6 months (adult) or 9 (child), the way Randy caps quiet at 13 days. Engine RNG only. | Pacing | S | Yes: code | +0.6 | Bot, same 128 seeds: longest gap for ages ≥ 3 ≤ **270 days** (today median 1,004); prompts a year within +40% of today for adults (no spam). Fails if the floor fires more than once a year for a median adult |
| 4 | **Infancy as a montage.** Replace the empty years 0 to 3 with 3 framed choices on one screen (name meaning, first word, a fever or a festival) that set real flags, then start play at age 3. Optional "live it day by day" toggle keeps the old way. | Pacing | M | Yes: code + content (`*.events.js`, small patch to `A.newGame` flow) | +0.5 | Bot: a newborn start shows its first prompt at game day ≤ 30; ≥ 2 of the 3 montage flags are read by later events (static check with `B.memoryIndex`). Lint passes |
| 5 | **A tray for small news.** Mark low-stakes events (no check, every choice moves ≤ 3 points; about 50% of choices per `events-story.md`) as tray items: the clock keeps running, a counter shows them, they expire after 60 days with the default choice. Big events still stop the clock. | Pacing | M | Yes: code (patch `UI.clkTick` stop rule; `*.core.js` classifier) | +0.6 | Bot real-time model: clock stops a year fall ≥ 30% with the same events shown; human-free check: no event with a check, a wound, death or `newRel` is ever trayed (static test over all 3,199). Fails if a trayed event kills or maims |
| 6 | **Long lives in chapters.** For elves, dwarves, giants and half-elves, compress stages: one "season" tick covers a year in childhood and between chapters, with a summary card. | Pacing | M | Yes: code | +0.4 | Bot: clock time to adulthood at default ≤ **30 min** for every race (elf 76 today); events seen per life-year ≥ 3 in every stage |
| 7 | **Go on as someone.** When no child lives, offer a successor: a sibling's child, a pupil (mentor relation), a sworn friend, a bastard. Keep `A.continueAs`; widen who qualifies. | Replay | S | Yes: code (`*.core.js` + one patch in `UI.deathModal`) | +0.4 | Bot: a successor is offered in ≥ **60%** of deaths after 16 (20% today); a successor inherits the dynasty list and the house record |
| 8 | **The family hall.** After a death, the heir's first scene is a hall prompt with 2 to 4 kin lines keyed to `cause`, killer (`pc.lastHurt`, duel foe, battle) and place, plus one house goal to pick. 60 lines to start. | Replay | M | Yes: content + code (`*.events.js` reading `S.dyn`) | +0.5 | Bot, 50 successions: ≥ **90%** show a line keyed to the parent's cause or killer; ≥ 30 distinct lines across them; lint passes; 0 raw tokens |
| 9 | **A house record that survives.** Store achievements, house goals and the dead (name, years, cause, epilogue) in a cross-life profile in IndexedDB, separate from `cur` and its backups. Show it on the title screen. 40 goals to start (the 37 achievements plus house goals). | Replay | M | Yes: code (new storage key; follow the save rules) | +0.5 | Browser test: unlock an achievement, die, start "A new life": the achievement and the dead list are still shown; a crafted profile with markup is cleaned (`SAVES.clean` rules); two tabs do not corrupt it |
| 10 | **History before birth.** A start option "Born in an older world": pre-simulate 20 to 60 years with the existing world engine (no player), then place the player. Bookmark a second era (about 1140) with its own branches. | Replay | M | Yes: code (`*.core.js` around `A.newGame`; needs speed work) | +0.6 | Bot: two seeds share ≤ **70%** of province owners at birth (100% today) and ≤ 50% with 60 years; boot to first prompt ≤ **20 s** extra on desktop; replay and save tests pass |
| 11 | **Twelve endings with epilogues.** Classify a finished life (path, last state, cause, deeds) into 12 endings and write each an epilogue template of 150 to 300 words filled from the life log. | Replay | M | Yes: content + code | +0.6 | Bot, 128 lives: ≥ **8** ending types seen, none above **25%**; every epilogue ≥ 150 words, 0 raw tokens, names ≥ 2 people from the life |
| 12 | **Twenty origins.** Hand-made starts with their own first 5 years (10 to 15 events each, a stated ambition, an achievement), in the CK3 challenge-character format: a person, a place, a difficulty, a goal. | Replay | L | Yes: content (`*.events.js`, start data) | +0.8 | Bot: in each origin's first 5 years, ≥ 60% of events are unique to it; across 20 origins × 4 seeds, no arc above 25% and style → arc ≥ 30% |
| 13 | **Hardships.** 10 named stacking rules chosen at start (Lean Years, Bad Blood, No Inheritance, Hard Schooling…), each a hook on an existing system, with a score multiplier. | Replay | M | Yes: code | +0.4 | Bot league: each hardship moves its target metric ≥ **15%** vs the same seeds without it; with all off, outcomes are identical to today (golden) |
| 14 | **Legends export.** One button writes the life and the world (dynasty, deeds, wars, realm falls, the epilogue) as a standalone HTML page. | Replay | S (M with a chronicle) | Yes: code | +0.3 | Browser test after a 60-year bot life: the page has ≥ 1,500 words, every war the life saw, 0 raw tokens, and passes the escaping rules (no `<script>`, all values through `UI.esc`) |
| 15 | **Daily world.** A daily seed and start, the same for everyone that day, with a local record of the best score. | Replay | S | Yes: code | +0.2 | Browser test: two page loads on the same date give the same seed and start; a different date gives a different one |
| 16 | **Pacing playtest.** Extend Playtest mode to log, per minute, whether a prompt is open, the clock is running with no prompt, or a menu is open, and where players quit. Run it with 12 new players. | Pacing | S code, then people | Code yes; **needs people** | +1.0 (only people can raise the cap) | 12 players, 45 minutes each: median share of time with the clock running and no prompt ≤ **25%**; no one quits during infancy; ≥ 7 of 12 start a 3rd run on their own |
| 17 | **Per-path mid and late game** (plan step 4): soldier, merchant, priest, scholar, criminal, noble, ruler each get 3 stage-exclusive actions and a late-game goal. | Replay | XL | Content + code here; needs writers for scale | +0.8 | Bot: in every path, ≥ 30% of prompts after 40 are path-exclusive; top trajectory "child, then job until death" ≤ 20% (36% today) |

**Order.** 1 first, so every later step shows its effect. Then 2 and 3 together (a week of code, the biggest jump in Pacing). Then 7, 8 and 9 (death becomes a door, not a wall). Then 4, 5, 6 and 10. Content-heavy 11, 12 and 17 come after the memory work in `events-story.md`, because endings and origins are only as good as the life log they read. 16 should start as soon as 2 and 3 land.

With 1 to 11 built and their tests green, I expect Pacing to reach about **7** and Replayability about **7**. Items 12, 16 and 17, plus real playtests, separate a 7 from a 9. Neither aspect earns a 10 before players have been timed and asked whether they would start again.

## 6. Sources

**RimWorld** (mirrors of the game's defs and decompiled code)
- Storyteller defs: https://github.com/RimWorld-zh/RimWorld-Core/blob/master/Core/Defs/Storyteller/Storytellers.xml
- `GenDate.cs`: https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/GenDate.cs
- `TickManager.cs`: https://github.com/josh-m/RW-Decompile/blob/master/Verse/TickManager.cs
- `TimeSlower.cs`: https://github.com/josh-m/RW-Decompile/blob/master/Verse/TimeSlower.cs
- `LetterStack.cs`: https://github.com/josh-m/RW-Decompile/blob/master/Verse/LetterStack.cs
- GDC 2017, "RimWorld: Contrarian, Ridiculous, and Impossible Game Design Methods" (via `events-story.md`): https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and

**Hades** (mirror of the game's Lua scripts)
- Script folder: https://github.com/crazytuzi/LuaFramework/tree/master/Hades
- `NPCData.lua`, `DeathLoopData.lua`, `QuestData.lua`, `MetaUpgradeData.lua` in that folder
- Cultured Vultures, word count (via `events-story.md`): https://culturedvultures.com/supergiant-hades-word-count-dialogue/
- GDC Podcast ep. 16 with Greg Kasavin (via `events-story.md`): https://gdconf.com/article/roguelikes-and-narrative-design-with-hades-creative-director-greg-kasavin-gdc-podcast-ep-16/

**Slay the Spire**
- Decompiled code mirror (`AbstractDungeon.java`, `Exordium.java`): https://github.com/AxorusMT/sts
- TrueAchievements, Ascension guide (via `power-balance.md`): https://i1.trueachievements.com/game/Slay-The-Spire/walkthrough/2
- Gamegeeker, win rates (via `power-balance.md`): https://gamegeeker.com/fr/news/slay-the-spire-2-may-neows-news-update?market=FR
- Game Developer, data-driven balance (via `power-balance.md`): https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder

**FTL: Faster Than Light**
- `sector_data.xml` (base game data in a test fixture): https://github.com/hahn-kev/ftl-xml-extension/blob/master/test-data/ftl-base/sector_data.xml
- Wikipedia (via `power-balance.md`): https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light
- GDC 2013 postmortem (not read): https://gdcvault.com/play/1019036

**Crusader Kings III** (mirror of the game files)
- Repository: https://github.com/mgp1212121212/ck3_vanilla
- Game-over strings: https://github.com/mgp1212121212/ck3_vanilla/blob/main/localization/english/gui/ingame_main_l_english.yml
- End date: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/defines/00_defines.txt
- Bookmarks: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/bookmarks/bookmarks/00_bookmarks.txt
- Challenge characters: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/bookmarks/challenge_characters/00_challenge_characters.txt
- Dynasty legacies: https://github.com/mgp1212121212/ck3_vanilla/blob/main/common/dynasty_legacies/99_legacies.txt

**Dwarf Fortress** (mirror of the DF wiki)
- World generation: https://github.com/CannonCoPilot/DwarfCron/blob/main/data/wiki/DF2014_World_generation.md
- Legends: https://github.com/CannonCoPilot/DwarfCron/blob/main/data/wiki/DF2014_Legends.md
- XML dump: https://github.com/CannonCoPilot/DwarfCron/blob/main/data/wiki/DF2014_XML_dump.md
- World tokens: https://github.com/CannonCoPilot/DwarfCron/blob/main/data/wiki/DF2014_World_token.md

**Reigns** (*community*)
- Reigns Access, README (quotes the Steam page): https://github.com/leoguimaoficial/Reigns-Access
- `GameInfoReader.cs`: https://github.com/leoguimaoficial/Reigns-Access/blob/main/ReignsAccess/GameData/GameInfoReader.cs
- `en.json`: https://github.com/leoguimaoficial/Reigns-Access/blob/main/ReignsAccess/Lang/en.json

**BitLife** (*community*)
- Fan remake README ("Age Up" turn structure): https://github.com/jmrothberg/BitLife
- BitLife wiki, Stats and Activities (via `character-lifesim.md`): https://bitlife-life-simulator.fandom.com/wiki/Stats · https://bitlife-life-simulator.fandom.com/wiki/Activities

**Others**
- Wildermyth wiki, Campaign (via `events-story.md`): https://wildermyth.com/wiki/Campaign
- A Sharp, King of Dragon Pass overview (via `events-story.md`): https://www.a-sharp.com/kodp/overview.html
- Brysbaert (2019), reading rate meta-analysis (from memory, not re-checked): https://doi.org/10.1016/j.jml.2019.104047

**Ardan**
- `docs/plan/Ardan The Road to Ten.md` (Replayability steps and gate)
- `docs/reviews/Ardan Road to 100.md` (scores; the Pacing aspect and its proposed gate)
- `docs/reviews/Ardan Deep Analysis.md` (16 bot lives, speed)
- `docs/benchmarks/events-story.md`, `power-balance.md`, `character-lifesim.md`, `world-lore-uniqueness.md` (sources reused above)
- `reports/fixes.json` and `reports/scorecard.md` (bench league: 64 lives, promptsPerYear 4.9, p90 gap 153 days)

## Appendix: how to reproduce

1. `node tools/build.mjs --out=/tmp/ardan/rp/fix.html --unpack=/tmp/ardan/rp/blobs` (fix layer only).
2. Lives: load the page in Playwright, install `bench/bot.mjs`'s `BOT`, and run a copy of `B.life` that also logs each prompt as `[gameDay, age, type, eventId, wordsShown, choices, resultWords]` and samples the character once a game year. Starts are `bench/run.mjs`'s `STARTS`; seeds are `4242 + (seedIdx × 32 + styleIdx × 8 + startIdx) × 7919`; engaged on seeds 0 and 2.
3. Worlds: `A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 20 })` for seeds 101 to 808; `A.advance(30)` in a loop, `A.eventAuto()` for events, another adult takes over on death; snapshot `A.S.prov[].owner`, alive realms and rulers at +5, +15, +30, +45 and +60 years.
4. Real-time model: clock seconds = game days ÷ 4; reading seconds = words ÷ 238 × 60; plus 0, 5 or 10 s a prompt.
5. Mutual information: arcs from `B.arc`; start = race/realm/status; baseline = the same calculation with lives shuffled into 8 random groups of the same size, averaged over 200 shuffles.
