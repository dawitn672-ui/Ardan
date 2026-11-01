# Ardan: The Road to Ten

Oct 11, 2026 · @Nathan Dawit

## How to use this

An aspect hits a realistic 10 when it matches the best game in the genre at that one thing, and a test we can run proves it. Ardan scored 55/100 when this plan was written and about 59 after Phase 1 (results near the end); every section below says what to build, in order, and how we know it's done.

A 10 is not "perfect". It means a player who loves that genre can't name a game that does this one thing clearly better. For a browser game built by one person plus me, some 10s come from cutting things, not adding them.

Three rules apply to every step:

1. Every step ends with a "done when" check: a bot measurement, an automated test, or a playtest result.
2. Bots check numbers (survival, balance, errors). Only people can check fun, clarity and feel, so every phase ends with a recorded playtest of 5 or more new players.
3. Cut before you add. A feature that doesn't move a score gets removed.

| Aspect | Now | The game to match for a 10 | Proof it's a 10 |
| --- | --- | --- | --- |
| World and lore | 6.5 | Crusader Kings III cultures, Kenshi's world that ignores you | Playtesters describe 3 realms by personality without the Codex |
| Power scaling | 5 | Kingdom Come: Deliverance, Mount & Blade | 95% of 1,000 random duels match the tier table; 0 lore clashes in events |
| Character and life sim | 6 | Kingdom Come's learn-by-doing, CK3 lifestyles | New players explain how they get better in one sentence |
| Events and story | 5.5 | King of Dragon Pass, CK3 event chains | 40% of events in a life tie back to something you did earlier |
| Relationships | 4.5 | CK3 schemes, RimWorld social bonds | NPCs start 3+ plots or requests toward you per decade, unprompted |
| War | 6 | Hearts of Iron IV planning, Mount & Blade battles | Player choices move battle results by 15%+ at every rank |
| Diplomacy and politics | 5 | CK3 courts, EU4 treaties | AI rulers act in line with their traits 80%+ of the time |
| Economy | 4 | Mount & Blade trade, Victoria 3 prices, Patrician | No trade loop beats a well-run estate over 10 years without risk |
| Balance | 5 | Slay the Spire and FTL tuning | Every path's curves stay within 10% of target for 3 builds |
| UI and UX | 7.5 (was 5) | CK3 nested tooltips, Slay the Spire clarity | 5 of 5 new players do 10 key tasks in under 10 minutes |
| Visual art | 5.5 | Pentiment, Darkest Dungeon, The Banner Saga | No screen is off-style; screenshots read as Ardan with text hidden |
| Technical | 8 (was 4.5) | Any well-shipped indie | 0 corruptions in 10,000 save and load cycles |
| Replayability | 6 | RimWorld, CK3 | 100 bot runs sort into 8+ life-arc types, none above 25% |
| Uniqueness | 7.5 | Dwarf Fortress legends, Pentiment | Players describe Ardan in one sentence without naming another game |

## World and lore: 6.5 to 10

The world hits 10 when each realm feels like a place with its own wants, and players learn it by living in it, not by reading the Codex. Right now the lore is big and consistent, but it mostly arrives as paragraphs, and many realms are Europe with the names filed off.

1. Write a one-page "realm bible" for each of the 34 realms: one want (what it's trying to do this century), one fear, three customs, and one place that matters. Store it as data next to the realm (`want`, `fear`, `customs`, `place`).
2. Turn every custom into a rule the engine enforces. Examples: the eldest inherits everything in Aldmark; debts are settled by duel in the desert south; no iron is carried into elven groves. Target: 3 rules per realm, about 100 in total.
3. Break the Europe mirror. Pick the 6 most obvious copies (Aldmark, Solenne, Varenna and the rest) and give each a twist in how it governs, prays or earns that no real kingdom had.
4. Swap reading for finding out. The Codex fills only with what your character has seen, heard or been told, each entry marked rumor or truth, the way the bestiary already works.
5. Keep a living world chronicle: wars, deaths, foundings and famines, with dates. NPCs and events refer back to it ("since the burning of Tessaria…").
6. Write 3 to 5 local events per realm (about 136) that only fire there and use its customs and places.
7. Give each culture naming rules and 2 or 3 of its own words that show up in titles and events.

**Done when:** playtesters describe 3 realms by personality without opening the Codex, and bots show 90% of realms have at least 2 rules a typical life actually runs into.

## Power scaling: 5 to 10

Power hits 10 when every fight in every event follows the same rules the duel system uses, and the player can always see why one fighter is stronger. The tier ladder exists now, but 3,191 events were written before it, and many fights still skip it.

1. Audit every event for fights and beasts. Tag each one with the scale it assumes: one person, a party, or an army; animal, great beast or titan. Rewrite any that break the ladder, like a farmer killing a great beast alone.
2. Send every life-or-death fight through the duel or a new skirmish resolver that uses fighting worth. No more plain skill checks deciding who dies.
3. Build a group-fight resolver: you plus your allies against several foes, using tier math (3 Trained beat 1 Elite about two times in three). Use it for ambushes, brawls and hunting parties.
4. Tie wounds to the scale. A lost hand drops your sword tier by 2; a bad knee cuts speed. Losses leave marks you can see on the profile.
5. Show the math everywhere. Duel screens show both tiers and the win chance; profiles break worth into body, skill and gear.
6. Lock the numbers with a test: one tier up wins about 73%, two tiers about 92%. The build fails if either drifts more than 5 points.
7. Cap the top of the ladder in the world: about 12 Legends alive in all of Ardan, about 5 Masters per realm, and elite orders of 200 to 300 each. The world generator and aging keep it that way.

**Done when:** 95% of 1,000 random duels land inside the tier table, the event audit finds 0 clashes with the ladder, and playtesters pick the stronger fighter from the screen alone 9 times in 10.

## Character and life sim: 6 to 10

The life sim hits 10 when each system has one clear job and you grow from what you actually do. Today about 9 systems overlap (plans, aims, intensity, activities, perks, techniques, specs, masteries, styles), and they all mostly mean "get a bit better".

1. Merge down to 4 visible systems: body (stats and health), skills, abilities, and condition (needs and mood). Plans, aims, intensity and activities become one "your days" plan. Perks, techniques, specs and masteries become one abilities tree per skill.
2. Learn by doing. Skills grow mostly from use (fights, work, events); training is a booster. A monthly summary shows where every gain came from.
3. Add needs and moods: food, rest, comfort, faith, company. Low needs start events and stress breaks that make stories, not just penalties.
4. Make health a body, not a bar: wounds on body parts, long illnesses, stats that fade with age one by one, and treatment choices (physician, herbs, prayer) with real tradeoffs.
5. Let personality change. Traits shift from what you do (repeated cruelty earns "cruel"), and the game shows the reason.
6. Give each life stage its own play: childhood choices that set traits, youth as an apprentice, the prime years, and old age (teaching, legacy, decline), each with 2 or 3 actions only that stage has.
7. Cut dead numbers. Any stat or skill that changes fewer than 5 outcomes in a typical bot life is cut or merged.

**Done when:** new players explain how they get better in one sentence, every remaining stat and skill touches at least 5 outcomes per life, and playtesters rate "I understood my character" 8 out of 10 or higher.

## Events and story: 5.5 to 10

Events hit 10 when your past keeps coming back: fewer, deeper events that chain over years and remember what you did. Today most of the 3,191 events follow one recipe (a situation, 2 or 3 choices, a dice roll, a small stat change) and rarely look back.

1. Cut 30 to 40% of events. Remove one-off events whose choices only nudge stats by 1 or 2 and lead nowhere. Keep the best 2,000 or so.
2. Add memories. Any choice can leave a memory (who, what, when), and any event can need or react to one. Target: 40% of events in a life refer to an earlier memory.
3. Write 60 long arcs of 3 to 8 stages over 2 to 20 years: a blood feud, a secret child, a rival's rise, a famous sword's history, a plague year, an apprentice who passes you.
4. End every arc with a lasting change: a title, a bond, a wound, a law, or a province on the map.
5. Guard variety. No event repeats within 10 years unless it's part of a chain, and no two events with the same shape show back to back.
6. Give each culture its own event voice (word choice, sayings), and let NPC lines match their personality.
7. Hold every event to a checklist: real stakes, at least one hard tradeoff, no obviously best choice, and a consequence noted. A bot flags any event where one choice wins 80% of the time.

**Done when:** in a 60-year bot life, 40% or more of events tie to earlier memories; playtesters retell a 3-step story from their run without being asked; the bot finds 0 events with an obviously best choice.

## Relationships and people: 4.5 to 10

People hit 10 when NPCs want things and act on them, toward you and each other, without being asked. You now choose who you know and every face has a profile, but a relationship is still an opinion number with a label.

1. Give every named NPC a goal and a fear, drawn from their traits and post: rise, protect family, revenge, wealth, faith.
2. Let NPCs act every month. Each person you know can take one step toward their goal: ask you for help, offer a deal, court someone, scheme, spread a rumor, challenge, or betray. Budget: 1 to 3 NPC-started moves toward you per year.
3. Add schemes both ways, like CK3: sway, befriend, seduce, slander, murder. Each has hidden progress, a chance of being found out, and helpers you recruit.
4. Keep a shared history per bond, a short log like "saved his son, 1112" or "mocked him at court, 1115". It moves opinion and shows up in events.
5. Add secrets and leverage. NPCs hide things you can uncover and use, at a cost to your honor.
6. Add groups: friend circles, cliques in your unit or guild. A friend of your enemy starts cooler toward you.
7. Turn "Get to know" into a short scene of 2 or 3 choices that shows their personality, instead of one dice roll.

**Done when:** bots show each player gets 3 or more NPC-started plots or requests per decade, 30% of relationship changes come from NPC actions, and playtesters can name an NPC they loved or hated and say why.

## War: 6 to 10

War hits 10 when every rank has real choices, from the shield wall to the war council, and every battle explains why it was won. The division sim is deep already, but a captain mostly watches 200 divisions he can't touch.

1. Give every rank its own battle play. A soldier makes 3 to 5 choices in a personal battle (where to stand, when to push, who to save). A captain orders his company (hold, charge, fall back, cover the flank). A general runs the map layer. Each layer must move the result by 10 to 20%.
2. Add an after-action report that names the 3 biggest causes, like "terrain +12%, flanked −8%, short on food −15%".
3. Give AI generals personalities (cautious, bold, cunning) and visible plans. Your superior's orders arrive as letters you can follow or ignore, with consequences.
4. Link drill to battle tactics. Shield-wall drill should beat a cavalry charge in the resolver, and the report should say so.
5. Make sieges playable: food, mining, assaults, starving them out, and camp disease, with a choice each month.
6. Add small-unit missions for low ranks (raids, scouting, escorts) with your named men, who get better and who die.
7. Keep it fast: a 200-division battle tick in under 50 ms.

**Done when:** bot A/B tests show player choices move battle results by at least 15% at every rank, and playtesters can say why they won or lost after reading the report.

## Diplomacy and politics: 5 to 10

Politics hits 10 when rulers act like people with traits and history, and you can always read why a crown said no. Today there are many treaty types, but AI choices are weighted dice and realms sit on gold they never spend.

1. Let ruler personality drive the AI. Map traits to weights (greedy wants tribute, honorable keeps pacts, ambitious starts wars) and log every AI decision with its top 3 reasons.
2. Make the court out of people. Councillors, vassals and claimants are named NPCs with goals (Relationships, step 1); factions are groups of those people, not a meter.
3. Build the inside-the-realm loop: laws, taxes, vassal deals, and succession fights with named claimants. Civil wars come from real factions.
4. Show "why" on every offer: the list of things pushing a yes or a no, like CK3 and EU4 do.
5. Make gold get used. AI treasuries pay for armies, buildings, bribes and mercenaries. The world audit's hoarding flag must read 0.
6. Give realms long memories: grudges and debts that last generations, like "they burned our capital in 1108".

**Done when:** sims show rulers act in line with their traits 80% of the time or more, 10 seeds of 100 years each show 0 hoarding flags, and playtesters guess an AI's answer before clicking 7 times in 10.

## Economy: 4 to 10

The economy hits 10 when goods come from somewhere, go somewhere, and other people trade too, so a price tells a story. Today there's one market per capital, prices come from the lore's export and import lists, and trade runs are a menu click plus dice.

1. Give every province production from its land, buildings and people: grain from plains, iron from hills, wool from pasture. Stock piles up and gets used.
2. Add demand from people: townsfolk need food, cloth and fuel; armies at war eat grain, iron and horses; nobles buy luxuries.
3. Put NPC merchants and caravans on the map moving goods between markets. You compete with them, and bandits and wars cut their roads too.
4. Add more markets: every town with a market building, with prices that differ by distance.
5. Add production chains: ore to iron to steel to arms, and wool to cloth to fine cloth. You can own a workshop at any link.
6. Add money sinks that matter: upkeep, taxes, bribes, retainers, ransoms, rebuilding after raids.
7. Add an exploit test. A bot running the best trade loop for 10 years must not out-earn a well-run estate of the same starting money, and any low-risk loop paying 3 times a laborer's wage per sun invested gets flagged.

**Done when:** prices visibly react to wars and harvests (a famine triples grain), the exploit bot finds no loop, and playtesters can explain why a good is cheap in one place and dear in another.

## Balance and difficulty: 5 to 10

Balance hits 10 when every path through life works, risk pays but costs, and the numbers are checked by bots and people alike. Today it's tuned by bots only, and fixes still happen late (careful soldiers reached Marshal in 9 of 20 lives until the top seats were capped).

1. Write target numbers for every path (soldier, merchant, noble, priest, scholar, criminal, ruler): median death age, wealth at 40, rank at 40, and how many reach the top.
2. Run a nightly bot league: 1,000 lives per path with 4 bot personalities (careful, greedy, reckless, random). A dashboard shows each path's numbers against its targets.
3. Fail the build when any number drifts more than 10% from its target, for example Marshal reached in more than 5% of careful soldier lives.
4. Make difficulty change decisions, not just dice. Story, Hard and Realism should change what you're told (odds shown or hidden), how fast you recover, and how hard the AI pushes.
5. Run 20 human playthroughs per phase, recorded, and mark where players quit or get stuck.
6. Hunt dominant strategies. Track the 5 most-used actions on each path; any action in more than half of the most successful runs gets a counter or a cost.

**Done when:** every path stays within 10% of its targets for 3 builds in a row, 20 human runs show no single dominant strategy, and nobody quits in the first 30 minutes.

## UI and UX: 5 to 10

The interface hits 10 when a new player finds what to do next in seconds and every number explains itself on hover. Today there are 10 tabs, walls of text, important things hidden in pop-ups, and no tutorial.

1. Cut the tabs from 10 to 6: Life, People, Path and War, Holdings, Realm, and Chronicle (Dynasty, Codex and World together). Rare screens move inside the tab that uses them.
2. Add nested tooltips. Every number and keyword shows its breakdown on hover or tap (fighting worth = body 34 + skill 41 + gear 18), and words inside the tooltip open their own.
3. Add a "What now" panel: the 3 most important things this month, one click each.
4. Teach by doing. The first 10 in-game years introduce one system at a time with hints you can turn off. No walls of text.
5. Put text on a diet: event text at most 80 words, choices at most 12. Longer lore sits behind "read more".
6. Design mobile on its own: a bottom tab bar and cards sized for thumbs, not a squeezed desktop.
7. Cover accessibility: full keyboard play, screen reader labels, color-blind-safe map modes, text that scales to 200%.
8. Run usability tests with 5 new players per phase and time them on 10 key tasks.

**Done when:** 5 of 5 new players finish the 10 key tasks in under 10 minutes without help, a WCAG 2.1 AA audit passes, and phone tasks take no more than 1.5 times as long as desktop.

## Visual art: 5.5 to 10

The art hits 10 when one hand-made style covers every screen, so any screenshot reads as Ardan. The new medieval skin looks right, but underneath are paper-doll portraits, a generated map, and modern military symbols in a medieval frame.

1. Pick one art direction and write a one-page style guide. An illuminated-manuscript ink look, close to Pentiment, fits a game framed as a chronicle.
2. Replace the paper dolls with layered ink portraits (heads, hair, faces, clothes and armor by culture), 3 or 4 poses, with age and scars visible.
3. Redraw the map in the same hand: inked coasts, mountain glyphs, small town icons, a parchment texture, and more detail as you zoom in.
4. Swap the military-style boxes for banners and unit standards when zoomed in, keeping the boxes as a clarity option.
5. Draw 60 to 100 woodcut-style scenes for the most common event types: battle, court, market, road, wedding, death.
6. Add small motion: page turns, ink spreading as new chronicle lines appear, banners moving on the map, steel flashing in duels.
7. Add sound: a calm score per region and UI sounds (quill scratch, wax seal, steel).

**Done when:** an outside artist can't find an off-style screen, and screenshots are recognizable as Ardan with all the text hidden.

## Technical: 4.5 to 10

The tech hits 10 when saves never break, a year passes in a blink, and a new feature can't quietly break an old one. Today the game is one 10.8 MB file built from patches wrapped around older patches, and a single style clash broke a screen last update.

1. Split the single file into modules with a real build step (esbuild or Vite), and load heavy parts (map, lore text, family data) only when needed. Target: first download under 3 MB.
2. Retire the patch-on-patch pattern. Give each system one module with a clear set of functions, and fold the v3, v4 and v6 patches back into their base files.
3. Move saves to IndexedDB instead of browser local storage, with a versioned format, 3 rotating backups, export and import.
4. Set a speed budget: under 150 ms per in-game day at top speed and under 2 seconds per simulated year with 200 divisions. Profile and fix the 5 slowest paths.
5. Run every test on every change: unit tests per system, the bots as whole-game tests, and browser tests for the UI. A failed test blocks a release.
6. Make every run replayable from a save plus its seed, so any bug can be reproduced exactly.
7. Add an in-game "report a problem" button that attaches the save and the log.

**Done when:** 10,000 automated save and load cycles show 0 corruption, every change passes the full test run, the game loads in under 3 seconds on a mid-range phone, and players find no regressions for 3 releases in a row.

## Replayability: 6 to 10

Replayability hits 10 when ten runs tell ten different stories with different goals, places and endings, not the same climb with new names. There are many starts already, but most lives still go work, climb, plateau, grow old.

1. Add 20 hand-made starting stories (escaped slave, exiled prince, plague orphan, pirate's child) with their own first 5 years.
2. Add different endings: retire in peace, found a dynasty, become a legend, flee overseas, rise in an order, die famous. Each gets its own epilogue.
3. Vary the world each run: different starting tensions, history branching differently, and smaller realms generated fresh.
4. Give each main path (soldier, merchant, priest, scholar, criminal, noble, ruler) its own mid-game and late game, not a stats dashboard.
5. When a dynasty ends, export a readable history of the family and the world, like Dwarf Fortress legends.
6. Load events and realms from data files so players can add their own.

**Done when:** a bot classifier sorts 100 runs into 8 or more distinct life-arc types with none above 25%, and playtesters start a third run on their own.

## Uniqueness: 7.5 to 10

Uniqueness hits 10 when Ardan has one thing no other game does and everything else serves it. Today the mix (BitLife, Crusader Kings and Hearts of Iron in one browser file) is unusual, but each piece is borrowed.

1. Name the core in one line and hold every feature to it: "one life, lived day by day, inside a realistic world whose history everyone writes, including you."
2. Build signature system 1, the Chronicle: the game writes your life and the world as a readable book in a period chronicler's voice, wrong rumors included.
3. Build signature system 2, belief versus truth, everywhere: beasts, people, battles and events all have what people believe and what is true, and your character's knowledge can be wrong.
4. Build signature system 3, both scales at once: a nobody in a 200-division war who feels the squad and the front together. Make this the trailer moment.
5. Cut what dilutes the core. Features copied from other games that don't serve "one life in a living history" go (for example the division-template and industry screens for anyone who isn't a ruler or marshal).

**Done when:** playtesters describe Ardan in one sentence without naming another game, and all 3 signature systems show up in every run.

## The order to do it in

Do it in five phases, foundations first and art last, with a gate test that must pass before the next phase starts. The projected overall score after each phase is 62, 72, 83, 93, then 100.

&#91;embedded content: roadmap · 5 phases, 5 gates · scores are projections\]

Foundations come first because every later phase builds on them, and art comes last because drawing screens that will still change is wasted work. Balance closes the road because every other phase moves the numbers.

My rough estimate: phases 1 to 3 are mostly code we can build together, while phases 4 and 5 need a lot of writing time and a hired illustrator. Expect well over a year of steady work in total.

## Phase 1 results: foundations

Phase 1 (Technical and UI/UX) is built. Every number below comes from the test suite running on the release build, measured on Oct 12, 2026. The release passed all 28 test steps; the build now refuses to ship if any one fails.

| Technical step | What was built | Measured |
| --- | --- | --- |
| 1. Build step | esbuild minify, zstd compression, three stages: core, then event packs, then heavy lore on first use | Page 2,790 KB (was 10.8 MB). With the CPU slowed 4x (a mid-range phone): title screen at 1.35 s, a life can start at 3.1 s |
| 2. No patch-on-patch | Every v3, v4 and v6 patch folded in; a lint step checks it | 1,320 functions, each defined once, no wrappers. The engine fold changed nothing: same world, year by year, for 25 years |
| 3. Saves | IndexedDB, versioned format with checksums, 3 rotating backups written in one step, export and import, old saves move over by themselves | 10,000 save and load cycles: 0 corrupted. A run saved and loaded every day ends in the same world as one never saved |
| 4. Speed | Fixed the 5 slowest paths (realm-relation checks, supply maps, army thinking, army lookups, winter checks) | A war year with 209 divisions: 3.3 s down to 1.7 s (budget 2). A day on screen: 31 ms (budget 150) |
| 5. Tests block releases | One runner: event checks, goldens, bots, saves, then the built page in Chromium at 1,500, 390 and 320 px | 28 of 28 steps pass; build --release ships only then |
| 6. Replayable runs | A journal records every player command with the random stream's state | A life played by clicking, saved, reloaded and played on, replays from birth to the same world |
| 7. Report a problem | Menu item, plus a flag on every prompt: one file with save, journal, errors and log | A report replays in Chromium to exactly the world the player had |

| UI/UX step | What was built | Measured |
| --- | --- | --- |
| 1. Six tabs | Life (with Decisions), People, Path & War, Holdings, Realm, Chronicle (Dynasty, World, Codex); old links still work | All pages reached by the browser tests |
| 2. Nested tooltips | Fighting worth opens into body + skill + gear, each part opens again; the six stats explain themselves | Opens by hover, tap or Enter; Esc closes |
| 3. What now | The three things most worth doing, one click each | Covers health, realm crises, career choices, offers, war, training, initiative |
| 4. Teach by doing | 12 hints in the first 10 years; most close when you do the thing | On by default, off in the Menu |
| 5. Text diet | Event text at most 80 words, choices at most 12, Read more for lore | All 3,199 events checked: 0 over. The checker blocks new ones |
| 6. Mobile | Bottom tab bar, two-row top bar, 48 px touch targets, Story and You pages | Ten tasks on a 390 px phone take 19 clicks; on desktop 16 (1.2 times) |
| 7. Accessibility | Keyboard play, dialog focus, labels on every control, color-blind map colors, text size to 200% | axe-core WCAG 2.1 AA on 62 screens, both themes: 0 findings |
| 8. Usability tests | A Playtest mode times ten key tasks and counts clicks; a script runs the same ten | Scripted: all ten done in 0 to 3 clicks each, desktop and phone |

## What Phase 1 did not finish

The code side is done. The people side is not, so Phase 1's gate is not fully passed yet.

- **Real players.** The plan asks for 5 new players timed on the 10 key tasks (done when 5 of 5 finish in under 10 minutes). Playtest mode is ready: title screen, "Playtest mode", and each player's results download as a file. Nobody has played it yet, and a script clicking the right buttons is not a new player.
- **Three clean releases.** "No regressions for 3 releases in a row" can only be shown by shipping 3 releases.
- **Tooltips on everything.** Only fighting worth and the six stats break down so far. A 10 needs every number to explain itself.
- **A real phone.** Load time was measured with Chrome's CPU slowed 4 times, not on an actual mid-range phone.
- **Per-system unit tests.** The engine is covered by whole-game bots and the golden master, not by small tests per system.
- **Hoarding.** The world audit still flags 11 realms sitting on more than 6 years of income. That is Diplomacy step 5 in Phase 3, so the test reports it without blocking.

Bugs the new tests caught and that are now fixed:

- The new minifier renamed words that event matching reads as text, so the shipped game would have shown different events than the tested one. Replaying one run in both builds found it.
- Saves were not exact (house records came back reshaped), a save asked for during another save was dropped, and loading reset the random stream.
- Pressing Enter on a focused button aged you a year instead of pressing the button.
- The death screen still said "Legacy +0" from the removed legacy system.
- A fallen realm stayed in other realms' alliances, and realm stability could drop below 0.
- A word filled in at the start of a sentence stayed lowercase ("she is wanted by the watch").

**New scores:** Technical 4.5 to 8, UI and UX 5 to 7.5. Overall about 59, short of the 62 projected for this phase, mostly because the player tests have not run. Next step: run the 5-player test with Playtest mode, fix what it shows, then start Phase 2.
