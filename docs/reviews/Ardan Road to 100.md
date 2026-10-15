# Ardan: The Road to 100

Oct 13, 2026 · a hard review of "The Road to Ten" and of build `b593143`, with what was fixed and what is left

## The verdict first

The plan says Ardan is at **59/100**. A strict grader puts the release build at about **50**, and at about **51** after the 29 patches in this repo.

The gap is not that the plan lies. It grades its own homework, it counts things as done when the code exists but no player has touched it, and it scores Phase 1 on claims that the tests in this repo disproved (replays broke as soon as anyone looked at the People screen, a save file could run script, keyboard play didn't work, failed saves were silent).

100/100 is reachable only in the sense the plan defines it: "no game does this one thing clearly better", for each of 14 aspects. For one person, that is not "well over a year". Honestly it is three to five years with a hired artist, a writer's year of events, and real playtests every phase, **or** a much smaller game that cuts half the aspects down to "good enough and invisible". The plan says "cut before you add" and then adds in every section. That is the first thing to fix.

## Round 3 (Oct 15): what changed, and the new grade

Round 3 worked through the Road to Ten's buildable steps, one feature folder at a time, each with its own tests and a README that says what it measured. The status of all 94 steps is in `docs/plan/Road to Ten — status.md`: **31 done, 29 partial, 24 not started**, and 10 that need people or art. The first audit that morning counted 19 done and 39 not started.

**What landed** (83 browser tests, every event lint, the choice check and the balance league pass; CI is green):

| Change | Measured effect |
| --- | --- |
| `23-after-action` | Every line battle and war-map fight names its three biggest causes. The forest's cost to the riders was reported as 68 kills against 67 measured, and a pike hedge as 67 against 52. Reports on player battles: **0% → 100%**. |
| `25-variety-guard` | 10-year cooldown, 24 event shapes, and recency weights for duty pools and NPC moves. Same shape back to back **4.6% → 3.0%**, three in a row **2 → 0**, NPC moves repeated within 10 years **38% → 16%**. |
| `26-belief-truth` (signature 2) | Beasts are known by tale, by sight or truly. Secrets are told against their truth, with 11 scenes. Far news is inflated, then corrected. Your legend grows in the telling. |
| `34-both-scales` (signature 3) | After each war-map fight you were in: what you saw, the front, and the chronicle's version, side by side and disagreeing. Signature systems present: **1 → 3 of 3**. |
| `28-endings`, `29-starts` | 20 endings and 9 manners of death, with epilogues and a collection. 20 hand-made starts, each with an opening scene and a callback years later (40 events). |
| `30-get-to-know` | A first meeting is a scene: four approaches, whose odds the person's traits move by 12 points a trait. |
| `31-learn-by-doing` | Growth from doing **44–49% → 67–73%** at the same total for a passive life. A failed check teaches 1.5 times a passed one. A monthly summary. |
| `35-moods` | Four needs settle toward where a life puts them, and moods come with causes and 14 scenes. A neglected year ends at happiness 37, a tended one at 64. |
| `32-ladder` | A census of Legends and Masters and a Master cap per realm. The ladder is sparse (2 Legends alive), not crowded. |
| `33-choices` and `tools/lint-choices.mjs` | Events with an obviously best choice: **19 → 0**, and CI blocks new ones. |
| `bench/balance.mjs` and `bench/targets.mjs` | Target bands per starting path, held in CI. On its first real run the balance check caught a drift (see below). |
| Bench `perf.warTick` | The war-map tick with 212 divisions: **9.4 ms at the 95th percentile** (target 50). |

**Corrections to Round 2.**

- **The war ratio.** Round 2 reported warlike rulers starting **5.3×** as many wars as peaceful ones, from 3 worlds × 60 years. One world's ratio swings from 1.5× to 6× with the random stream: a later feature that draws one more number a month moved it from 5.3 to 1.45 on the same seeds. Pooled over 12 worlds it is **2.4×**, and two builds on a fresh seed set agree (1.98 and 2.06). The effect is real and about two to three times.
- **Risk costs.** The bench's "careful bots outlive reckless ones" read 2 years after this round, from a 16-life median that mixed in elves and dwarves. Deaths are bimodal, and a small median jumps between the two humps. The metric now uses the mean death age of humans and orcs: **5.2 years**. Forty human lives each read 52 against 24 (medians) and 49 against 30 (means), with or without learn-by-doing.

**What the balance check found** (the notes are in `bench/targets.mjs`):

- **Freedom was close to automatic.** Every serf was free by 33, most by buying freedom at 21–22 for 40 suns, because the event that sold it had no way to say no. With "Not this year" (33-choices), half stay bound.
- **Peasants get nearly as rich as merchants.**
- **Four lives a path is too few for an age band.** The dice alone move a serf's median age at death between 26 and 54.

**The new strict grade** (the same rules: no aspect rises without evidence, and human-only aspects stay capped):

| Aspect | Round 2 | Round 3 | Why it moved, or didn't |
| --- | --- | --- | --- |
| World and lore | 6 | **6.5** | The Codex fills with what you have learned. There are no realm bibles or enforced customs. |
| Power scaling | 5.5 | **6** | The ladder is counted and capped. Event fights still skip the duel resolver. |
| Character and life sim | 5 | **6** | Growth from doing, plus needs and moods. The systems aren't merged, and check success is 40% against a 45–65% target. |
| Events and story | 6 | **6.5** | Variety guard, no obvious choices, 40 story events. Memory is still 15.9%, the recipe share 22.6%, and there are 50 old-age events. |
| Relationships | 5.5 | **6** | First meetings are scenes and secrets can be found. There are no schemes or cliques. |
| War | 5.5 | **6.5** | Every battle explains itself, and the soldier sees both scales. There are no rank choices, sieges or named squads. |
| Diplomacy and politics | 6 | 6 | The ratio is corrected to 2.4×, still past its target. Nothing new was built here. |
| Economy | 3.5 | 3.5 | Not touched: the economy rebuild is the plan's largest job. |
| Balance | 4.5 | **5.5** | Targets per path, a drift check in CI, and a freedom fix. Death ages and check odds are still short of target. |
| UI and UX | 6.5 | 6.5 | New cards and panels, but still no playtests. |
| Visual art | 5 | 5 | Needs an artist. |
| Technical | 7 | **7.5** | 83 tests, a choice lint and a balance league in CI, and the war tick measured. The source still isn't here. |
| Replayability | 5.5 | **6.5** | 20 starts and 20 endings. The top life arc is still 26.6% of lives. |
| Uniqueness | 7.5 | **8.5** | All three signature systems exist, though belief-vs-truth doesn't reach NPCs and both-scales is after the fight, not in it. |
| **Overall** | **56** | **65** | |

The measured scorecard (bots and tests only) reads **34.5** for the release, **35.8** for the fix layer, and **66.5** now.

**What is left is mostly not code.**

- **People.** UI, Character and Uniqueness are capped without playtests.
- **Writing.** Old age (50 events against 150), long arcs, and realm bibles.
- **The economy rebuild.** It is the largest code job.

**Buildable next:**

- War step 1 (choices at every rank) and step 5 (sieges).
- Schemes.
- AI generals with order letters.
- Varied worlds per run.

## Round 2 (Oct 14): what changed, and the new grade

Round 2 tried to get as close to 100 as code and content can get without people or art. It built a measurement system first, then the features with the most measured leverage, each in its own folder with its own tests. A usage limit stopped the multi-agent work part-way, so this section says plainly what landed and what did not.

**What landed** (all in `index.html`; 41 browser tests pass; the numbers are in `reports/scorecard.md`):

| Change | Measured effect |
| --- | --- |
| `20-ai-personality`: ruler traits drive war, alliances, peace and tribute; every AI decision is logged with its reasons; the "why" list is real | Wars per ruler-year, aggressive traits vs peaceful: **1.3× → 5.3×** (3 worlds × 60 years; corrected in Round 3 to 2.4× over 12 worlds) |
| `21-npc-initiative`: people act first, with a history per bond; the 573 cast members' written wants and fears drive them | NPC-started moves per decade: **0 → 9.8** (target ≥ 3) |
| `40-memory-*` (8 of 12 chunks): 471 callback events for memories the release recorded and never read | Events that read a memory: **3% → 15.8%**; fired in bot lives: **1.8% → 8.4%**; flags never read: **369 → 139** |
| `22-chronicle`: "The Book", your life as chapters in a chronicler's voice, exportable | Signature systems present: **0 → 1 of 3** |
| `24-honest-odds`: shown duel odds fitted on 2,100 real duels | Largest gap between shown and real odds: **14 → 4 points** |
| `27-accessibility`: landmarks, headings, 24px targets | axe WCAG 2.2 AA + best practice, 26 screens: **50 → 0 violations** |
| `ENG-OCC-SEX`: titles by sex | Noble parents with a wrong-sex title: **21 of 120 → 0** |
| Measurement and tooling | A bench with 8 modules and a rubric scorecard; an event linter that plays every choice with the memories each event needs; CI on every push; feature folders with their own tests |

**What did not land** (specs exist; each is a next step):

- After-action reports, age-aware childhood (teen check odds are still 36% overall, 32% for reckless bots), tooltips for every number, an economy where gold is spent rather than deleted, and storyteller pacing.
- Four memory chunks: customs, houses and politics, careers and learning, school and duty, covering 129 flags.
- Old-age content (still 49 events) and starts and endings.
- The fact-check pass on the eight benchmark documents, and two research tracks (UI and art, test methods).

**The new strict grade** (same rules as below: no aspect rises without evidence; human-only aspects stay capped):

| Aspect | Strict, release | After round 1 | After round 2 | Why it moved, or didn't |
| --- | --- | --- | --- | --- |
| World and lore | 6 | 6 | 6 | No world work this round |
| Power scaling | 4.5 | 4.5 | **5.5** | The screen tells the truth now; event fights still skip the ladder |
| Character and life sim | 5 | 5 | 5 | Bugs fixed, but no system merge, and teen checks are unchanged |
| Events and story | 5 | 5 | **6** | Memory is real (15.8%), but the recipe share is still 22.6% and old age is thin |
| Relationships | 4 | 4 | **5.5** | NPCs act first; no schemes, web or secrets yet |
| War | 5.5 | 5.5 | 5.5 | The after-action feature didn't land |
| Diplomacy and politics | 4 | 4 | **6** | Rulers act in character (5.3× as first measured; 2.4× pooled over 12 worlds, see Round 3) and explain themselves |
| Economy | 3 | 3.5 | 3.5 | Leaks plugged in round 1; gold is still deleted rather than spent |
| Balance | 4.5 | 4.5 | 4.5 | Measured now, not yet tuned |
| UI and UX | 5.5 | 6 | **6.5** | WCAG 2.2 clean; still zero playtests and five tooltip kinds |
| Visual art | 5 | 5 | 5 | Needs an artist |
| Technical | 5 | 6.5 | **7** | 41 tests, a bench and CI; the source still isn't in the repo |
| Replayability | 5.5 | 5.5 | 5.5 | 10 arc types, top 22%; same climb shape |
| Uniqueness | 7 | 7 | **7.5** | The Chronicle exists; belief-vs-truth and both-scales don't |
| **Overall** | **50** | **51** | **56** | |

The plan said 59 before any of this. On evidence, the game is at 56 now. That is +6 over the release, earned where it can be measured.

The next big jumps don't need more code first:

- **Playtests** unlock UI, Character and Uniqueness, which are capped at about 6–7 without people.
- **The four unfinished memory chunks and old age** are writing.
- **Art** is hiring.

The ordered path is in [docs/north-star](../north-star/README.md).

## How the plan grades itself, and what is wrong with it

**1. The scores are self-assigned and unanchored.** Nothing outside the plan sets what a 5 or a 7 means. Each aspect is compared to the best game in its genre (CK3, HOI4, Mount & Blade, Pentiment), made by studios of 50 to 300 people. That is a fine north star, but it makes the numbers feelings, not measurements. Fix: give each aspect a five-step rubric with an observable test at each step, not only at 10.

**2. "Done" means "built", not "proven".** Phase 1 raised Technical from 4.5 to 8 and UI from 5 to 7.5 before a single new player sat down, and while:

- a hand-edited save could run any script it liked;
- rendering a fighter's tier moved the random stream, so a run replayed only if nobody opened the People tab;
- opening the People tab hired new NPCs into existence;
- every autosave failure was silent, two tabs overwrote each other, and a new life rotated the old one out with no warning;
- 49 of 50 clickable cards could not be reached by keyboard ("full keyboard play" was claimed);
- 39 events printed raw `{mate2}` tokens (the text-diet checker reported 0 problems).

The plan's own rule 2 says only people can check clarity and feel. Phase 1 graded UI anyway. Fix: an aspect's score cannot rise until its "done when" test has passed, and Technical and UI each get capped at 6 until the source and tests live in the repo.

**3. The source is not in the repo.** The plan describes esbuild, a 28-step test runner, bots, goldens, a lint step and an event checker. None of it is here: only the built HTML. That one fact should hold Technical at 5 by itself. A game you cannot rebuild is a game one disk failure away from being frozen.

**4. The proofs are gameable proxies.** "40% of events tie back to a memory" is met by mechanically checking flags, without one story getting better. "NPCs start 3 plots per decade" is met by spam. "5 of 5 players finish 10 tasks" with n = 5 is a smoke test, not a measurement. Each bot metric needs a paired human metric (retell, recall, would-play-again), and human tests need 12+ players to mean anything.

**5. There is no aspect for the thing that matters most.** None of the 14 aspects is "is the minute-to-minute loop fun". A game can score 10 on all 14 systems and still be a spreadsheet you watch. Add a 15th aspect, **Pacing and core loop**: share of real time spent on a meaningful choice, decisions per in-game year, how long a player goes with nothing to do, and how often they press "Let time run" just to get somewhere. Sound, which the plan buries as step 7 of Visual art, deserves its own line too.

**6. The roadmap isn't in the file.** "The order to do it in" points to an embedded chart that did not survive export (`[embedded content: roadmap …]`). The phases after Phase 1 exist only as score projections (62, 72, 83, 93, 100), which go up in straight lines as if every step lands.

**7. Steps contradict each other.**

- Events step 1 cuts 30 to 40% of events.
- World step 6 adds about 136 local events and Events step 3 adds 60 arcs. But 623 realm-gated events already exist, 13 to 36 per realm, so the 136 are already written several times over.
- Uniqueness says "each piece is borrowed" and proposes cutting copied features, while War, Diplomacy, Relationships and Economy each import another game's signature system (HOI4 planning, CK3 schemes, EU4 "why" lists, Victoria prices).

Decide which identity wins before building more.

## Scores, harshly

| Aspect | Plan | Strict, release | After patches | The one thing holding it down |
| --- | --- | --- | --- | --- |
| World and lore | 6.5 | 6 | 6 | Earth with the names filed off; learned by reading |
| Power scaling | 5 | 4.5 | 4.5 | The odds on screen are not the odds in the duel |
| Character and life sim | 6 | 5 | 5 | About 12 overlapping progression systems |
| Events and story | 5.5 | 5 | 5 | 3% of events remember anything |
| Relationships | 4.5 | 4 | 4 | NPCs never act first |
| War | 6 | 5.5 | 5.5 | Below rank 7 you are a spectator |
| Diplomacy and politics | 5 | 4 | 4 | Ruler traits are read nowhere |
| Economy | 4 | 3 | 3.5 | Money appears from nowhere and disappears into nothing |
| Balance | 5 | 4.5 | 4.5 | No targets on record; the player seat is favoured |
| UI and UX | 7.5 | 5.5 | 6 | Zero playtests; text walls; a newborn could work the court |
| Visual art | 5.5 | 5 | 5 | Paper dolls; a newborn is drawn as an adult |
| Technical | 8 | 5 | 6.5 | Source and tests are not in the repo |
| Replayability | 6 | 5.5 | 5.5 | Most lives are the same climb |
| Uniqueness | 7.5 | 7 | 7 | The core is named but not yet built |
| **Overall** | **59** | **50** | **51** | |

## Aspect by aspect: what a real 10 needs

Each section says what is true in the code today, what the plan gets wrong, the exact work, and a gate that a bot or a person can fail.

### World and lore: 6 → 10

**True today.** About 72,000 words of lore plus 473,000 in lazy tables, and they are internally consistent: every realm, culture, faith, creature and secret id used by events resolves. It is the strongest raw material in the game.

**Harsh.** The plan says "many realms are Europe with the names filed off". It is worse: Ardan is *Earth*.

- **Languages:** Old Solen is Latin, Northfolk Old English, Eastfolk Slavic, Qadiri Arabic, Tamari Egyptian, Abari Ge'ez, Ranpuri Sanskrit, Skyfolk Tibetan, Amberfolk Malay.
- **Realms:** Lucerna is Venice, Solenne the Papal States, Nine Winds the Mongols, Skyhold Tibet.

Breaking 6 mirrors (step 3) won't fix a whole world built by translation.

Other problems:

- Three capitals (Lucerna, Wolfhaven, Qadira) and 81 of 180 house seats aren't on the map.
- 9 of 20 "ally" pairs aren't alliances in the relations table.
- No realm has `want`, `fear` or `customs` yet.
- Event coverage is lopsided: Ostra is named 61 times, Frostholm 7.

**Work.**

1. Pick a **rule of invention** and apply it everywhere, for example "one real root, one invented twist, one cross-cultural borrowing per realm".
2. Rewrite the word lists of the 8 most direct translations (Latin, Italian, Arabic, Egyptian, Swahili, Sanskrit, Tibetan, Malay) into invented languages with consistent sound rules. One naming generator per culture, not a vocabulary list.
3. Do the plan's realm bibles, but as engine data with teeth. Every custom must be a rule some event or system reads.
4. Put every place the text mentions on the map, or stop mentioning it.
5. Balance event coverage: no realm under 25 local events.

**Gate.** 10 players get 30 minutes in two realms each, then describe both without the Codex. 7 of 10 name a want or a custom correctly. A blind panel can't name the real-world source of 6 random realm word lists more than half the time.

### Power scaling: 4.5 → 10

**True today.** A clean tier ladder (0/40/50/63/77/91/118) and a real duel system.

**Harsh.** The plan's own proof ("one tier up wins about 73%") measures the **odds shown on screen** (a logistic on the worth gap), not the duels.

- With the same AI on both sides, one tier up wins 82 to 92% and two tiers 98 to 100%.
- With auto-play, the player's seat wins about 72% of *even* fights. The player wins ties (fixed by `ENG-DUEL-DOUBLE-KO`), may refuse to fall once, and the NPC yields at 30% HP.
- Tier widths run 10, 13, 14, 14, then 27.
- The underdog catch-up closes about half the gap when the code reads as if it means 95%.
- The game says "perhaps five" Legends are alive; the plan says about 12.

**Work.**

1. Decide the player-seat rules on purpose (refuse to fall: yes or no; NPC yield threshold), then measure both seats.
2. Recalibrate the shown odds from simulation, per tier gap and per seat, or show a range.
3. Even out the tier widths, or make Master's width a deliberate cliff and say so.
4. Fix or remove the catch-up cap.
5. Route all 400 event outcomes that kill or maim through the duel or group resolver (plan step 2).

**Gate.** A test duels 1,000 pairs per tier gap in each seat. Shown odds land within 5 points of results for both seats, and a CI test fails the build if they drift.

### Character and life sim: 5 → 10

**True today.** Six stats with potentials, 38 skills, aging stat by stat, wounds, diseases.

**Harsh.** The plan counts 9 overlapping progression systems. There are about 12: plan, intensity, 13 aims, 39 activities, 114 perks, aptitudes, 35 specs plus arms and doctrines, 3 masteries, 265 styles with 1,284 techniques, two school systems, masters, drill.

The numbers behind them don't hold up either:

- **Training swamps learning by doing:** training is about 31 skill points a year; doing is +1.5 per check.
- **Willpower only rises:** it can reach 160 and never declines.
- **Checks are cruel to the young:** a 16-year-old's median chance on event checks is 4 to 8%, and 42 to 53% of their checks sit at the 4% floor.

Before `ENG-PLAN-FOLLOWS-LIFE`, every automatic plan trained athletics for life.

**Work.**

1. Merge to 4 visible systems as the plan says, and delete code, not just UI.
2. Invert the growth split: 70% from use, 30% from training.
3. Give will a ceiling and a decline (grief, age, defeat).
4. Make check odds respect life stage. A child's checks should be against child difficulties, not the adult 45.
5. Add the needs (food, rest, company, faith) only if each one drives at least 3 events.
6. Cap personality traits or give them weight, so 9 traits doesn't happen.

**Gate.** Every stat and skill touches 5+ outcomes per bot life. Median teen check odds are 35 to 65%. 10 new players explain how they got better in one sentence, and 8 of 10 are right.

### Events and story: 5 → 10

**True today.** 3,199 events, 9,635 choices, good dry prose ("Your back becomes a door.").

**Harsh.**

- **The recipe is real.** 82% of events have exactly 3 choices and 53% of choices have no check. Median effects are happy 3, fame 2, skill 2.
- **Almost nothing remembers.**
  - Only **95 events (3%)** read a flag another event set.
  - 9 events queue a follow-up.
  - **287 of 450 flags are written and never read** (`ch_first_love`, `fm_affair`, `wr_traitor`, `ch_hates_lord`…). The memories are already being recorded; nothing listens.
- **Old age is thin:** 35 events, about 1%.
- **The prose has tics:**
  - "Refuse" ×41 as a choice;
  - "looks at you a long time" ×20;
  - a quarter of outcomes end on a ≤5-word punchline.

**Work.**

1. **Wire the 287 orphan flags first.** Each gets 1 to 3 events that read it, years later. That is the cheapest route to the 40% target and it touches no engine code.
2. Write the 60 arcs. Write old age: 150 events, teaching and legacy.
3. Cut the 893 strict-recipe events whose every outcome only nudges a stat by ≤3, or give each one a lasting mark.
4. Ban the top 10 tics in the event checker.
5. The plan's "a bot flags any event where one choice wins 80%": build it.

**Gate.**

- **Bot:** in a 60-year bot life, 40% of events read a memory, and 0 flags are written without a reader.
- **People:** 10 players retell a 3-step story unprompted, and 7 do.

### Relationships and people: 4 → 10

**True today.** One opinion number and a type per pair; the other side moves 0.8× as much. NPCs do nothing first.

**Harsh.** The plan's step 1 ("give every named NPC a goal and a fear") is already done in the data and unused: 573 cast members in the lazy lore have written `wants` and `fears` ("She wants her son Tarn to stay across the Gordush and not raid before Return Day"). The engine never reads them.

**Work.**

1. Turn wants and fears into structured goals (who, what, by when) for the cast.
2. A monthly NPC step, as the plan says.
3. Schemes with hidden progress.
4. Shared history per bond.

Start with the 573 cast members; generated NPCs can borrow templates.

**Gate.**

- **Bot:** 3+ NPC-started moves toward the player per decade, and 30% of opinion change comes from NPC actions.
- **People:** 7 of 10 players name an NPC they loved or hated, and why.

### War: 5.5 → 10

**True today.** A real HOI4-style division sim with terrain width, supply, organisation, recon and tactics, and a 3-wing battle for commanders.

**Harsh.**

- **Rank decides how much you matter.** Rank 7+ can replace a province fight with one battle that decides it. Ranks 4 to 6 get a fixed −12%/+8% organisation nudge. Ranks 1 to 3 get a mission with the same kind of nudge. So "15%+ at every rank" holds only at the top.
- **Sieges are a day counter.** No food, assault, disease or choice.
- **No after-action report.**
- **The whole campaign layer is dead code.** It is about 440 lines; `startCampaign` is never called.
- **Generals have no personality.**
- **Armies think every 3rd day** to save time, which slows the AI.

**Work.**

1. Small-unit missions with named men (plan step 6) before anything else, because that is where most lives spend their war.
2. Sieges with a monthly choice.
3. After-action report with the three biggest causes, computed from the modifiers the sim already has.
4. General personalities from traits.
5. Delete the campaign layer.

**Gate.** Bot A/B at every rank: best vs worst play moves the result by 15%+. 7 of 10 players say why they won after reading the report.

### Diplomacy and politics: 4 → 10

**True today.** Many treaty types, factions from real houses, coalitions, tribute, succession.

**Harsh.**

- **Ruler traits are read nowhere** in `diploAI`, `aiWarCheck`, `interest`, `callToArmsNow` or `checkPeace`.
- **"Personality" is `A.AGGRO`,** one fixed number for 19 realms.
- **The AI is dice:** 152 constant-probability rolls in that code.
- **The diplomacy "Slowly pulling them" list is partly fiction.** It shows border, race, kin and rival modifiers that feed nothing.
- **Gold surplus above 3× income was deleted.** Before `WLD-AI-DEBT` this happened even while realms sat on 8.3 million suns of debt they never repaid.

**Work.**

1. Traits → weights in every AI decision, with each decision logged with its top 3 reasons (plan step 1).
2. Make the "why" list read the same numbers the AI uses, then show it for every offer.
3. Spend surplus on armies, buildings, bribes and mercenaries instead of deleting it.
4. Realm memories that last generations.

**Gate.** Rulers act in line with traits 80%+ of the time over 10 seeds × 100 years. Players guess the AI's answer 7 of 10 times.

### Economy: 3.5 → 10

**True today.**

- One market per realm.
- Prices are built from lore keywords and terrain, then pulled 20% a month back to target.
- Trade runs are a click plus dice; you never travel.
- AI buildings cost no gold.
- Soldier pay, merc pay and noble income come from nowhere: no treasury is charged.

**Harsh.** It is a shop with a price list, not an economy. Before `ECO-THIN-MARKET-SPREAD`, buying and selling one load at home printed money in small markets. Before `WLD-MERC-NO-CONTRACT`, an idle mercenary earned 9,100 suns a year from nobody.

**Work.** This is the biggest rebuild. Do the plan's steps 1 to 7, in this order:

1. Production per province.
2. Stockpiles.
3. Demand.
4. Price from stock.
5. NPC caravans.
6. Chains.
7. Sinks.

Then make every wage a transfer from a treasury, so a war really costs a realm what its soldiers earn.

**Gate.** A famine visibly triples grain in its region. The exploit bot (a version of this repo's `economy` test, extended to trade runs) finds no loop over 10 years. Players explain a price difference.

### Balance and difficulty: 4.5 → 10

**True today.** Tuned by bots only. The targets, bot league and dashboards the plan describes are not in the repo.

**Harsh.** Several balance rules are invisible to players:

- A commoner's chance of promotion to general is cut to about a fifth (a 60% gate, then ×0.5), and the UI shows the soft requirement as hard.
- The duel player seat is favoured (see Power).
- Teen checks sit at the floor.

**Work.**

1. Commit the targets per path as data.
2. Put the bot league in CI.
3. Make every hidden multiplier visible in a tooltip.
4. Difficulty that changes information and recovery, as the plan says.

**Gate.** As the plan says: every path within 10% of target for 3 builds, and no single dominant strategy in 20 human runs.

### UI and UX: 6 → 10

**True today, after the patches.** Six tabs, What now, 12 hints, 2-level tooltips, phone layout. Keyboard focus now survives the clock and every card is reachable.

**Harsh.**

- **Zero human playtests.**
- **Tooltip coverage:** only 5 tooltip kinds exist (worth and its parts, stats). "Every number explains itself" is about 5% done.
- **The redraw model:** the whole tab rebuilds every 1.5 s while time runs, which costs CPU, kills hover states and makes every interaction fragile.
- **Map canvases** ignore screen density (blurry on phones) and can't be used by keyboard or touch.
- **Screens didn't check age:** a newborn noble could attend court and ride the estate (fixed by `ENG-NOBLE-AGE`). The screens still offer adult actions to children; they just refuse now.
- **Hints** are tied to the calendar (before 1115), not the life.

**Work.**

1. Run the 5-player test now, then 12 players. That's the only thing that moves this score.
2. Redraw only what changed.
3. Tooltips for every number on the profile, then every number in events.
4. Hide what a life can't do yet, instead of refusing it.
5. A last-saved indicator.
6. Map with density scaling and keyboard focus.

**Gate.** As the plan says, plus 12 players instead of 5.

### Visual art: 5 → 10

**True today.** A consistent medieval skin, a handsome generated map, SVG paper-doll portraits.

**Harsh.** A newborn is drawn as an adult-proportioned figure. The map labels use Georgia while the UI uses Alegreya. This aspect needs a hired artist. The plan's direction (illuminated manuscript, Pentiment) is right, and it is the most expensive line in the plan.

**Gate.** As the plan says. Add: portraits read correct age and sex at thumbnail size for 9 of 10 viewers.

### Technical: 6.5 → 10

**True today.** One seeded RNG, deterministic, with a journal that records RNG state per command. Checksummed saves with atomic rotation. Escaping used almost everywhere.

**After the patches:**

- A CSP blocks injected script.
- Loaded saves are sanitized.
- Replays survive UI use.
- One tab saves at a time.
- Failed autosaves speak up.
- A save happens on tab hide.
- This repo has a build pipeline and 16 browser tests.

**Harsh.** The source, build and tests are not in the repo, so every fix here is a patch on a minified file that the next release from the real source will undo unless it is ported.

The code itself still has rough spots:

- `applyFx` is 430 lines.
- Silent `try {} catch {}` blocks swallow errors.
- About 550 lines of dead war code.
- 41 existence checks guard functions that always exist.
- 13 caught errors never reach the problem report.

**Work.**

1. Commit the source and the real test runner.
2. Port all 29 patches (each `why` in `tools/patches.mjs` is written for that).
3. Make this repo's 16 tests part of the release gate.
4. Unit tests per system.
5. Delete dead code.
6. Route every caught error to `UI.noteError`.

**Gate.** As the plan says, plus: the build runs from a clean clone with one command, and the tests run in CI on every push.

### Replayability: 5.5 → 10

**Harsh.** Many starts, one shape: work, climb, plateau, age. Most bot deaths fall between 55 and 80, mostly to old age, strokes and wounds gone bad.

**Work.** As the plan says (starts, endings, varied world, per-path mid and late game, legends export). Add a life-arc classifier to the bot league now, before writing content, so you can see the effect of each addition.

**Gate.** As the plan says.

### Uniqueness: 7 → 10

**Harsh.** "One life, lived day by day, inside a realistic world whose history everyone writes" is a great line, and none of the three signature systems exists yet:

- **The Chronicle** is a log.
- **Belief vs truth** exists only in the bestiary.
- **Both scales at once** is undercut by rank-gated war.

Everything else in the plan should be judged by whether it feeds these three.

**Gate.** As the plan says.

### Missing aspect: pacing and core loop (no score yet)

**Harsh.** The bot plays a 60-year life in about 15 seconds of compute, but a person plays it in hours, and nobody has measured how much of that time is spent choosing versus watching.

**Work.** Instrument Playtest mode:

- time with a meaningful choice on screen;
- time with "Let time run" being the only sensible action;
- choices per in-game year;
- the longest stretch without a decision.

**Gate.** Median dead stretch under 60 seconds of real time. 70% of session time is spent on a choice or reading its result.

## What was fixed in this repo

All 29 are in `tools/patches.mjs`, each with a reason, built into `index.html`, and covered by `tests/run.mjs`. The untouched release fails 13 of the 16 tests; `index.html` passes all 16.

| Patch | What it fixes |
| --- | --- |
| `SEC-CSP` | Content-Security-Policy: injected handlers and scripts cannot run |
| `SEC-SAVE-CLEAN`, `SEC-LOG-CLASS` | Loaded saves are sanitized; the log class is escaped. A crafted save ran script 23 times in testing; now 0 |
| `ENG-STYLE-RNG` | Fighter-style rolls use their own seeded stream; worth questions leave no trace |
| `ENG-ROSTER-PURE` | Opening the People tab no longer hires colleagues; the monthly tick does |
| `ENG-GEAR-ROLL` | Removed an always-true dice roll that burned random numbers on every Holdings draw |
| `EVT-TOKEN-DIGITS` | `{mate2}` and 38 other events' digit tokens are filled; 144 of 152 views showed raw braces |
| `EVT-DELEG-COUSIN`, `EVT-SERV-SECRET` | Two events that were silently dropped now fire |
| `EVT-TEXT-DIET` | The three text-diet misses |
| `ENG-TRAIT-OPP` | Children no longer inherit opposite traits (176 of 4,000 did) |
| `ENG-DUEL-TECH` | NPCs only plan techniques they can use, and only spend uses they use |
| `ENG-DUEL-DOUBLE-KO` | A double knockout no longer always goes to the player |
| `ENG-PLAN-FOLLOWS-LIFE` | The automatic training plan moves on from childhood athletics |
| `ENG-NOBLE-AGE` | A newborn can no longer attend court or run the estate |
| `TXT-MENTOR-LEGACY` | A mastery no longer promises the removed legacy system |
| `WLD-MERC-NO-CONTRACT` | No contract, no pay |
| `WLD-REPARATIONS-EXCLUSIVE` | The two reparation terms are one choice |
| `WLD-AI-DEBT` | AI realms repay debt (8.27 million suns: never repaid before, all repaid within 40 years now) |
| `WLD-STABILITY-FLOOR` | Five stability drops floored at 0 |
| `WLD-FACTION-WAR-CHECKS` | A conceded war faction respects truces, defensive treaties and the war cap |
| `WLD-SIEGE-OWNER` | Sieges no longer reset when an ally's division is listed first |
| `ECO-THIN-MARKET-SPREAD` | Thin markets have wider spreads; the buy/sell-back loop made +398 suns, now 0 |
| `SAVE-WARN` | Failed autosaves warn; manual saves ask the browser to keep storage |
| `SAVE-ONE-TAB` | One tab saves at a time (Web Lock); the second says so and takes over later |
| `SAVE-NEW-LIFE-CONFIRM` | A new life asks before pushing out a living save |
| `SAVE-BACKUP-MESSAGE` | Loading a backup on purpose no longer says the save was damaged |
| `SAVE-JOURNAL-BASE` | Reports from restarted or imported journals replay from the right base |
| `UI-KEYBOARD` | Focus survives redraws; Enter skips time only from nothing; every clickable card works by keyboard; save on tab hide |

Plus a safe load path: a save that decodes but breaks on entry now returns to the title with a message instead of failing silently.

## What was deliberately not changed

These are balance or design calls that need playtests, not quiet edits:

- The underdog catch-up cap in duels.
- The player's once-per-duel "refuse to fall" and the NPC yield threshold.
- The commoner promotion penalty (about ×0.2 at rank 8+).
- Event check difficulty for children and teens.
- Will's one-way growth.
- The trait count.
- The diplomacy "why" list (needs a decision: show the real numbers, or make the shown ones real).
- The dead campaign layer (delete it in the source, not by patch).

## Everything between here and 100, by who has to do it

| Who | Work | Rough size |
| --- | --- | --- |
| **Code** | Source and tests into the repo; port the 29 patches; system merge to 4; growth from use; trait-weighted AI with reasons; real "why" lists; NPC monthly actions and schemes; production, stock, caravans and wages as transfers; sieges and small-unit missions; after-action report; redraw-what-changed; tooltips everywhere; bot league, life-arc classifier and pacing metrics in CI | 12 to 18 months |
| **Writing** | Wire 287 orphan flags (~500 events); 60 arcs; 150 old-age events; invented languages for 8 cultures; realm bibles as rules; 20 starting stories and endings; cut ~900 recipe events | 12 months |
| **Art and sound** | Style guide; layered portraits by culture and age; redrawn map; banners; 60 to 100 scenes; score and UI sounds | A hired illustrator for 6 to 12 months, plus a composer |
| **People** | 12-player tests every phase; 20 recorded runs for balance; an outside artist's style audit | Every phase, forever |

**The cuts that make 100 reachable sooner.** If you must pick, these four make the plan honest:

1. Drop the HOI4 division sim for anyone below general.
2. Drop CK3-style schemes in favour of the 573 cast members' own goals.
3. Drop Victoria-style prices in favour of production and caravans only.
4. Build the three signature systems first.

A smaller game that does "one life inside a living history" better than anything else scores higher than a bigger one that does six genres at 7.

## The next five steps

1. Commit the source, build and tests. Port the 29 patches.
2. Run the 5-player Playtest-mode test (Phase 1's real gate). Then do it with 12.
3. Wire the 287 orphan flags. It's the cheapest real move on Events and Uniqueness at once.
4. Feed ruler traits and the cast's wants and fears into the AI. Both are already in the data.
5. Add pacing to the 14 aspects, and measure it before Phase 2 starts.
