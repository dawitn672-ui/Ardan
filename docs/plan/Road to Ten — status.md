# Road to Ten: status of every step

Oct 17, 2026 · checked against `index.html` (70 features, counting the fix layer) and the measured `reports/scorecard.md`

Each of the plan's 94 steps is marked:

- ✅ **done**: built, and covered by a test or a measurement;
- ◐ **partial**: some of it exists, and the note says what is missing;
- ✗ **not started**;
- 👥 **needs people**: playtests or a panel;
- 🎨 **needs art**: an illustrator, a composer or a conlanger.

"Base" means the release already had it.

## Summary

Counted from the tables below, which are kept current. "Round 3 changes" at the end lists what moved since the first audit.

| Aspect | Steps | ✅ | ◐ | ✗ | 👥/🎨 |
| --- | --- | --- | --- | --- | --- |
| World and lore | 7 | 6 | 0 | 0 | 1 |
| Power scaling | 7 | 7 | 0 | 0 | 0 |
| Character and life sim | 7 | 5 | 1 | 1 | 0 |
| Events and story | 7 | 5 | 2 | 0 | 0 |
| Relationships | 7 | 7 | 0 | 0 | 0 |
| War | 7 | 6 | 1 | 0 | 0 |
| Diplomacy and politics | 6 | 6 | 0 | 0 | 0 |
| Economy | 7 | 7 | 0 | 0 | 0 |
| Balance | 6 | 5 | 0 | 0 | 1 |
| UI and UX | 8 | 7 | 0 | 0 | 1 |
| Visual art | 7 | 5 | 2 | 0 | 0 |
| Technical | 7 | 6 | 1 | 0 | 0 |
| Replayability | 6 | 6 | 0 | 0 | 0 |
| Uniqueness | 5 | 5 | 0 | 0 | 0 |
| **All** | **94** | **83** | **7** | **1** | **3** |

That is 88% done and 7% partial. One step is not started (Character 1, merging the release's systems, needs the game's source), and three can only be done by people (World 3, Balance 5, UI 8). Rows marked ✅ 🎨 or ✅ 👥 are done in code, and a person (an illustrator, a writer, playtesters) would still raise them. Round 6 counted 74 done and 16 partial; round 5, 47 done and 6 not started.

## World and lore

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Realm bible per realm (want, fear, 3 customs, place) as data | ✅ | 47-realm-bible: all 34 realms have a want, a fear, a place and three customs, written from each realm's lore, and the Realm tab shows them with how often you have met each custom |
| 2 | Every custom becomes an engine rule (~100) | ✅ | 47-realm-bible: 102 customs, each one of ten rule kinds tied to a moment of life (a yearly due, a rite of age, a parent's estate, a wedding, a child's naming, a war levy, a punishment, a standing rule, a market cut, a burial). The first meeting is a scene where you keep it or defy it. The plan's gate holds: in 34 of 34 realms a median life of 30+ years meets at least 2 (`bench/customs.mjs`) |
| 3 | Break the Europe mirror for 6 realms | 🎨 | Needs a writer, and ideally a conlanger |
| 4 | Codex fills only with what you have learned (rumor or truth) | ✅ | 26-belief-truth: each beast is unknown, heard, seen or known, and the bestiary shows only that; secrets show the accepted story until you find the truth (a new peasant knows 22 of 64 beasts by tale, 0 truths) |
| 5 | A living world chronicle that NPCs and events cite | ✅ | 57-world-chronicle: a dated record of the whole run that is never trimmed (18 kinds: wars, battles, sieges, towns taken, provinces changing hands, deaths and successions, falls and foundings, rebellions, famine, epidemics, royal marriages, alliances, tribute, orders destroyed, Legends' deaths), each with a date, a place and named people; 2,825 entries in a 60-year world, about 200 KB. 20.9% of scenes in eight bot lives cite a dated entry (0% before), every one checked against the character's realm, home and lifetime. The record only observes: same seed, same world |
| 6 | 3–5 local events per realm | ✅ | Base: 623 realm-gated events, 13–36 per realm |
| 7 | Culture naming rules and words in titles and events | ✅ 👥 | 47-realm-bible: 2–3 words for each of the 24 cultures in every custom's scene, log line and card, and as `{cw1}`–`{cw3}`; 7 realms name children by custom; GD.NAMING per culture. 54-voices carries the words into the release's own events and titles (46% of events in a culture's voice, 21 of 21 cultures at 30% or more, titles in the place's words). 100% of realms meet at least 2 customs in a typical life. Telling realms apart by personality needs playtesters |

## Power scaling

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Audit every event fight against the ladder | ✅ | 48-fight-ladder: every fight choice is tagged by scale (one, party, army; animal, great beast, titan) and checked against the ladder. The full build's 546 fight choices had 83 clashes as written (deadly plain checks, one man against a titan, free kills, mis-tiered beasts) and 0 after; `bench/fights-audit.mjs` runs on any build |
| 2 | Life-or-death fights go through the duel or skirmish resolver | ✅ | 48-fight-ladder: 185 choices now roll on fighting worth (81 of them can kill or maim), keeping their words and effects; the odds shown are the odds rolled (0 of 2,695 differed; mean error 1.1 points) |
| 3 | Group-fight resolver on tier math | ✅ | 48-fight-ladder: party and army fights go through the group resolver and hold the game's own tier lines (an Elite against 7 Trained 54%, against 10 45%). The plan's "3 Trained beat an Elite two times in three" contradicts the game's ladder (it takes 13); the ladder was kept |
| 4 | Wounds tied to scale (a lost hand drops tier) | ✅ | 48-fight-ladder: a lost hand drops each of 27 test fighters exactly two tiers; lost fingers cost every hand weapon, a bad knee 7 speed; the profile shows each wound's fighting cost |
| 5 | Show the math (tiers, win chance, worth parts) | ✅ | 48-fight-ladder: a "Measured" line under every fight choice, both tiers, worths, the foe's weapon and the win chance on the duel screen (its opening line matches the number in 120 of 120); the profile's odds now count the weapon and health (error 2.8–3.5 points against 8.3). 59-tooltips opens worth into body, skill and gear |
| 6 | Lock the tier odds with a test | ✅ | `honestOdds` test plus the bench `duels` module (gap 4 points) |
| 7 | Cap the ladder (about 12 Legends, 5 Masters per realm) | ✅ | 32-ladder: a census, a Master cap per realm (order leaders in a full realm come out Elite), the living ladder in the Codex; the lore's 5 Legends are kept inside the plan's bound. Two 40-year worlds peak at 2 Legends and 1 Master in a realm: the ladder is sparse, not crowded |

## Character and life sim

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Merge about 9–12 systems into 4 | ✗ | Not started (a large refactor of minified code; needs the source) |
| 2 | Learn by doing; monthly summary of gains | ✅ | 31-learn-by-doing: every gain tagged practice or use; use ×1.2, practice ×0.4, a failed check teaches 1.5× a passed one; a monthly summary. Growth from doing 44–49% → 67–73% with the same total for a passive life (an engaged one grows 25% faster) |
| 3 | Needs and moods that start events | ✅ | 35-moods: four needs (rest, company, purpose, comfort) that drift toward what your life gives you; the lowest sets a mood with its cause, the mood moves happiness, and 14 scenes start from moods. Bot lives spend about 9% of months in a low mood |
| 4 | Health as a body (parts, long illness, treatment choices) | ✅ | 49-body-mind: wounds on head, arms, hands, body or legs lower the checks that part does (a broken arm: craft 50% → 32%, athletics untouched); a serious wound asks how it is tended (festers 27% bound, 4% with a surgeon); illness lasts 1–6 months with a treatment scene every time, each treatment its own tradeoff; each stat fades at its own age. 10 scenes read a lasting wound (the benchmark asks 30) |
| 5 | Personality changes from what you do, and shows why | ✅ | 49-body-mind: deeds counted by kind; a trait comes when its deeds outweigh its opposite's by 3 within 12 years; at most 5 traits (the release reached 13); every change logged with the choices that caused it, and shown on the trait |
| 6 | Each life stage has its own play (2–3 actions only it has) | ✅ | 49-body-mind: childhood, youth, prime and old age each have 3 actions of their own (a master who makes you a journeyman, coin put by for old age, a pupil, a memoir, care that slows the fading); children no longer see court actions (7 children, 167 buttons, 0 refused for age); 74-old-age gives old age 119 scenes of its own (the body failing, the last of your generation at the funerals of real people from the life, the oldest who remembers the world's record, handing on the blade and the holding, the will, the retirement contract, settling scores, the deathbed): old-age events 26 → 155 with the cut on, and lives past 55 meet 12–14 a decade instead of 1–2 |
| 7 | Cut dead numbers | ◐ | 49-body-mind folded nine skills into families for the player. 69-live-numbers made the rest earn their place where the game's own words name them: 19 checks retagged and 37 riders on choices about dice, song, fists, bows, the sea, climbing, mending and herds; trades' second skills; holdings that yield by the owner's skill; flight from a lost fight; 11 short scenes; axe merged with spear ("Hafts"). Numbers under 5 outcomes in a median life: 12 of 35 → 1 of 34 over 36 bot lives (unarmed 2 → 10, bow 1 → 20, sea 1 → 15, music 0 → 9, gambling 1 → 9, athletics 3 → 7, craft 2 → 38, husbandry 3 → 55). Tactics reads 4, a general's number most lives never use: cut or merge it is a design call |

## Events and story

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Cut 30–40% of events | ◐ | 58-event-cut: 826 of the release's 3,199 events (25.8%; 10 old-age scenes with a real choice put back by 74-old-age) retired by a measured audit (`bench/event-audit.mjs`): one-off scenes whose choices only nudge numbers or an opinion and that nothing else reads; never a feature's own, a chain, a memory, a flag someone reads, or a realm's last 5 local events. Over 72 lives a side: events a decade 62 → 49, weak one-offs among fired events 17.4% → 1.5%, memory share 8.5% → 10.2%, empty years within 1.5 points in every class. A menu setting restores the classic pool. Past 26% the next cuts leave a wound or fame behind; the list (`RETIRED.md`) and 159 more proposed cuts wait on a designer's approval |
| 2 | Memories; 40% of events refer to one | ✅ 👥 | 67-memory-weave: every choice leaves a memory (who, which scene and choice, the year, the skill tried and whether it held, what it did, the deed in words), and each scene that comes up looks for one that bears on it: the same person (named, with the year and the deed, and the odds move 6), the scene again ("as in 1139" on the choice taken then), the same skill tried before, the same kind of place. Measured strictly, by drawing each fired scene again with the memories removed and counting it only if its words, labels or odds differ: 9.7% → 53.8% of fired events in 32 bot lives (47.7% on a second seed set); 21 of 24 lives of 40+ years at 40% or more. The wording is built from choice labels and wants a writer's pass and a playtest |
| 3 | 60 long arcs of 3–8 stages | ✅ | 46-life-arcs' story track carries 52 arcs of 3–6 stages over 2–20 years, in four packs of 13: kin (50: a secret child, a blood feud, a heir's fall), rivals and ambition (51: a rival's rise, an apprentice who passes you, a moneylender), the world (52: plague, flood, a siege, heresy) and things (53: a famous sword, a horse, a house); 226 scenes. With the eight three-scene middle-years undertakings of 46, that is 60. Each keeps its people from first scene to last, and later scenes read earlier choices |
| 4 | Every arc ends with a lasting change | ✅ | Every ending choice of 50–53, on both sides of a check, leaves something lasting (a bond, an epithet, a wound, a house, a title, a law, or the map: a plague takes 15% of a province, a dyke adds development, new walls fortify); tested arc by arc |
| 5 | Variety guard: no repeat within 10 years, no same shape back to back | ✅ | 25-variety-guard: 10-year default cooldown, 24 shapes, recency for pools and NPC moves. A/B in the full build: rolled repeats 0.3% → 0%, same shape back to back 4.6% → 3.0%, three in a row 2 → 0, NPC move repeats 38% → 16% |
| 6 | Culture event voice; NPC lines match personality | ◐ | 54-voices: sayings, oaths, greetings, curses and words for lords, rulers and councils for 24 cultures, and manners for 40 traits. Events in a culture's voice 0% → 46% in the full build; 21 of 21 cultures at 30% or more; NPC lines match the speaker's traits in 40 of 40 pairs. Needs a writers' pass and a blind panel |
| 7 | Event checklist; a bot flags events with an obviously best choice | ✅ | `tools/lint-choices.mjs` (33-choices): 19 events had one (16 release, 3 of our own), all fixed; CI fails any new one |

## Relationships and people

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Every named NPC has a goal and a fear | ✅ | Base cast data, now driving behavior (21-npc-initiative reads wants and fears) |
| 2 | NPCs act every month (1–3 moves a year) | ✅ | 21-npc-initiative: 9.8 moves per decade, capped at 3 a year |
| 3 | Schemes both ways (sway, befriend, seduce, slander, murder) | ✅ | 39-schemes: five plots that grow each month by your skills, theirs and the friends who hate them, with an opening halfway, a last move, and a 2–6% chance a month of being found out. The people who hate you plot slanders and murders against you; you may notice, unmask them and answer. Four bot lives met 5 such scenes in 64 years, inside the shared NPC budget |
| 4 | Shared history per bond | ✅ | 55-bonds: each line of a bond's history has a weight that fades by its size (a long talk 2 years, a killing 60) and pulls opinion toward itself each year (14–18% of all opinion change); events cite it (`{history}`, four NPC moves, a "Between you" line), 10–12 citations a decade |
| 5 | Secrets and leverage | ✅ | 55-bonds: about 38% of grown people hide one of 7 kinds of secret, found through scenes, a sixth scheme, gossip and lore; using one gets a favour, money or silence at an honour cost and blocks their hostile moves for 5–10 years; your own secrets can be used against you |
| 6 | Groups and cliques | ✅ | 41-circles: a new acquaintance is often already close to someone you know, so the share of the people you know who are close to someone else you know goes from 0% to 35%; a friend of your foe starts 12 cooler (a friend of your friend 8 warmer), and the person view says why; a great harm reaches the victim's friends at a third of its weight; cliques of three in the unit or the street that you can join or lead |
| 7 | "Get to know" as a 2–3 choice scene | ✅ | 30-get-to-know: a scene with four approaches; the person's traits move each one's odds by 12 points a trait (asking a gregarious person 36%, a shy one 4%); insight reads them first |

## War

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Every rank has battle choices that move the result 10–20% | ✅ | Base: a soldier's line battle of four choices, an officer's tactical battle, a general's map command, but their fixed nudges never changed a map fight (73% won either way, 30 fights). 44-rank-battles: the result becomes a performance that moves order on both sides; on 60 real fights frozen and replayed, a soldier's best against worst moves the win rate 12 points, an officer's 19 (`bench/rankfx.mjs`) |
| 2 | After-action report with the 3 biggest causes | ✅ | 23-after-action: line battles and war-map fights; causes in kill-equivalents, calibrated against counterfactuals (forest cost said 68 kills, measured 67); on the battle screen, the story log and the war views |
| 3 | AI general personalities and order letters | ◐ | 38-orders: a temper from the general's traits now decides whether to take the offensive at all (a cautious one only past 1.15× his odds bar), what to hold back (a cautious general keeps a third of his divisions in reserve), how many go in at once (bold up to 6) and whether to storm walls (cunning wants half again the odds per level). Over 96 wars a temper in the full world a cautious army makes 31% fewer assaults than steady, wins 91% of those it starts and loses the fewest men. (Round 6 found the old dials only delayed attacks, and the test had passed on wars that never ran: queued scenes held the clock.) Round 7 gave bold and cunning moves of their own (`GO-ARMY-MOVES`). Over 288 wars a temper: bold makes 85–97% more assaults than steady, 3.4–4.8 times the pursuits, a field share 9 points higher and wins 13 points more fights, and pays in ground (258 provinces taken against 401); cunning marches round walls (2,046 times), flanks and feints, sends 92% of orders at empty or engaged places (steady 85%), storms the fewest walls and loses the fewest men (1.5M men down against 2.6M). Not yet met: cunning takes the most provinces per man lost only pooled (17.9 against 15.4), not in every seed set. The war room and the letters name the move ("means to go round the walls of Pertello"); a soldier gets the plan as a letter that the map settles sixty days on |
| 4 | Drill linked to battle tactics | ✅ | 60-drill: drill per division, built in camp and by the player's drill yard, fading slowly; a formation never drilled is not offered (to the AI either), a drilled one is stronger. With only the drill changed, a shield wall beats a couched lance 66% against 47% and loses a third fewer men; a drilled pike hedge +30 points; on 80 frozen war-map fights, never drilled 43%, drilled 56%. The report says it: "Their lances broke on a hard-drilled hedge: +34%" |
| 5 | Playable sieges | ✅ | 36-sieges: a choice each month from either side of the wall (mine, storm, hold the ring, latrines; ration, sortie, smuggled food, terms), camp sickness that thins the besiegers, and the sack or the terms at the end. The choices move a 40-day siege by 3 to 12 days |
| 6 | Small-unit missions with named men | ✅ | Base: the missions and a named squad who can die (the first audit missed this). 37-squad: survivors learn, earn a standing (seasoned, veteran, old hand) and carry the odds (+8 points with old hands) |
| 7 | A 200-division tick under 50 ms | ✅ | Bench `perf.warTick`: 212 divisions in six wars, 9.4 ms at the 95th percentile, 18 ms at worst |

## Diplomacy and politics

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Ruler personality drives the AI; decisions logged with reasons | ✅ | 20-ai-personality: warlike to peaceful war ratio 0.9× → 2.4× pooled over 12 worlds (one world reads anywhere from 1.5× to 6×) |
| 2 | The court is made of people | ✅ | 56-realm-inside: all 170 council seats held by named people from day one, each with a want and a fear; every faction-year led by a named head with aims |
| 3 | Inside the realm: laws, taxes, vassals, succession fights | ✅ | 56-realm-inside: taxes, authority and levies move by what named people push (3,002 pushes in 3 worlds × 30 years, 817 passed, each naming who and why); vassals bargain for pensions and seats; claimants backed by named houses take 32% of the army when every house is loyal and 65% when the stronger half hate the crown; the player can speak, give, or hear petitions |
| 4 | Show "why" on every offer | ✅ | 20-ai-personality: the real factors on treaties, peace and offers |
| 5 | AI gold gets used; the hoarding flag reads 0 | ✅ | 56-realm-inside spends the surplus (burned income 84.6% → 0%) on works, upkeep, the host, council pay, drill and pensions; 68-casus-belli found the last flags (a peace that took a province cut income mid-year, so the same treasury read as 7.5 years) and runs the windfall rule as soon as incomes are recomputed: 0 hoarding flags in 40 worlds × 100 years |
| 6 | Long memories: grudges and debts across generations | ✅ | 55-bonds' feud ledger outlives rulers; 68-casus-belli makes it act: a wronged or wanting crown plans its war (saves gold, seeks allies, holds back from other wars) and strikes when the target's host is away, worn or outmatched; a realm that was saved or fed owes a debt, joins its benefactor's defence, sends gold and will not attack it, as long as its ruler is honourable. Every AI war records its casus belli, shown in the war room and the Realm tab. Over 10 worlds × 100 years: wars citing a memory or a want 15% → 27% of all AI wars (33% of wars between realms) for 8% more wars; rulers' decisions in line with their traits 64% → 83% |

## Economy

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Production per province | ✅ | 45-economy: every province makes goods from its terrain, biome, coast and people, more of what the realm exports; grain comes in at harvest, and each realm rolls a good, ordinary, poor or failed harvest each June |
| 2 | Demand from people and armies | ✅ | 45-economy: people per head, the rich by income, armies at war per thousand men; each market keeps a stock and its price follows it. A failed harvest behind closed roads makes grain ×3.5 its normal price where it is not exported (a grain exporter ×1.2); a realm's first months of war raise arms 27% and horses 35% |
| 3 | NPC merchants and caravans | ✅ | 45-economy: about 330 caravans a month carry goods wherever the gap pays the road (cheaper by sea); war closes roads and bandits take a share in unrest. They cut the spread of prices between realms from 0.94 to 0.39 and famines from 325 to 10. They are traffic, not people |
| 4 | More markets with distance pricing | ✅ | 66-markets: 86–88 market towns (1–4 a realm: the capital, the best cities and ports), each with its own stock and prices fed by its own fields, people, armies and workshops; carters move goods between a realm's towns when the gap pays the road (by terrain, cheaper by sea, a floor per load so grain is dear to cart and pearls are not), and 45's caravans run town to town. Price rises with road steps from the nearest producer for all 10 goods (×1.05 at four steps; wine ×1.15); a besieged town's bread reaches ×2.8–3.3 its capital's. You trade at the nearest town and see the five nearest with their road and cost. A month costs ×1.6–1.8 of 45's alone (the target was ×1.5), and a greedy trader no longer turns a profit, which is a design call |
| 5 | Production chains | ✅ | 45-economy: wool to fine cloth, iron and charcoal to steel, steel to arms, run by towns where they pay and placed by their inputs; the player can own a forge, an armory or a weaving shed whose income is the spread |
| 6 | Money sinks | ✅ | 56-realm-inside: horse keep, men-at-arms, stewards' wages, a hearth tax (skipped where a custom already taxes), a tenth on rents, fines and bribes, gifts at court, ransoms after a lost battle, rebuilding burned holdings; each a line in "Where the money goes", and taxes and ransoms land in the realm's treasury |
| 7 | Exploit test | ✅ | `bench/exploit.mjs`: a greedy trader against farms, ten years, four seeds. The release's economy let it reach 11.9× the estate; this one at most 1.19×, after charging haulage and pricing each load by its good's own market. `noTradeLoop` holds it in CI |

## Balance and difficulty

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Target numbers per path | ✅ | `bench/targets.mjs`: six starting paths, each with bands for age at death, peak wealth, peak fame and notable lives (plus freedom for serfs), and notes where the game sits somewhere the designers may not want |
| 2 | Nightly bot league (1,000 lives × 4 personalities) | ✅ | `.github/workflows/nightly.yml`: 1,002 lives a night (167 on each starting path, four personalities in turn), plus the dominance, exploit and customs hunts, kept as the run's artifact; CI on every push still plays 12 lives a path |
| 3 | Fail the build on drift | ✅ | `bench/balance.mjs`: a fixed-seed league of 24 lives in CI (`tools/check.mjs`); the build fails when a path leaves its band |
| 4 | Difficulty changes information and recovery | ✅ | 42-difficulty: Story always shows each choice's odds as a number, Realism only in words, Hard as the player sets it; the year's healing (Story 52, Hard 35, Realism 24 from 20 health), a timed wound (2, 4, 6 years) and a prison sentence (2, 4, 5 years of four) scale with the setting. Hard is the release's, so the league is unchanged |
| 5 | 20 human playthroughs per phase | 👥 | |
| 6 | Hunt dominant strategies | ✅ | `bench/dominance.mjs` plays each activity as a whole-life strategy and flags one that beats the median on wealth, fame and age at once. It found sparring as a death trap (12 of 12 dead by a median 21: each bout cost up to 18 health and was allowed at 3); 49-body-mind refuses risky activities below 50 health and floors a bout at 45 (median death 31). Runs nightly |

## UI and UX

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Six tabs | ✅ | Base (Phase 1) |
| 2 | Nested tooltips on every number | ✅ 👥 | 59-tooltips: one engine opens a popover by hover, tap or Enter, nests six deep, Esc closes the top one; about 140 entries worked out from the live game. Every number on the profile, top bar, People, the War Room and its panels, Holdings (prices, stocks, the money book), the Path tab, event odds (a tap opens the breakdown without taking the choice; words, not digits, on Realism), duels, battles, the Realm tab and the Codex's Power & scale page: 97–100% of numbers per screen (0% on most before). Breakdowns add up to what is shown (largest gap 1 point of rounding over 152 check odds). The Codex lore pages and the World tab's lists are not wired. Reading speed needs players |
| 3 | What now panel | ✅ | Base |
| 4 | Teach by doing | ✅ | Base: 12 hints |
| 5 | Text diet | ✅ | Base plus 02-content-fixes; the linter enforces it for new events |
| 6 | Mobile design | ✅ 👥 | 71-phone: a phone layout of its own (a bottom tab bar, a play dock under the thumb, events as full-height sheets with the choices in the lower half, tables as stacked cards, two-finger zoom on the maps), every rule scoped to small screens so desktop is identical. 35 screens on two phones: 0 sideways scroll, 0 controls under 44 px (696 of 1,228 before), 0 text under 14 px, 0 axe violations; ten key tasks cost at most ×1.09 of desktop (×2.12 before). Real phones and iOS Safari need players |
| 7 | Accessibility | ✅ | 05-saves-ui keyboard plus 27-accessibility: WCAG 2.2 AA with 0 axe violations |
| 8 | Usability tests with 5 new players | 👥 | Playtest mode is ready; no players yet |

## Visual art

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Style guide | ✅ | `docs/art/style-guide.md`: an illuminated-manuscript hand in three surfaces (the leather binding, the vellum page, the woodcut print), five inks and two grounds with a rule of one accent, line weights, hatching in place of gradients, type, motion and sound, the off-style screens in order, and the checks before anything ships |
| 2 | Layered ink portraits | ◐ 🎨 | 63-miniatures: every portrait is drawn as a painted miniature (an arched panel on gold leaf for rank and clergy, lapis for the rest, the bare page for the dead; ink line heavier on the silhouette, two-tone washes with hatched shade); faces in ink that age (furrows, jowls, grey hair), wounds that show (scars, an eye patch, a hook), race and 24 cultures' dress, five poses by id and role, children in child proportions and newborns swaddled (the release drew a newborn as a small adult). Still parametric figures: a hand-drawn parts library needs an artist |
| 3 | Redrawn map | ✅ 🎨 | 62-inked-map: the map is drawn in ink on parchment: coasts with three water lines, a ruled sea, mountain glyphs with a hatched shadow side, trees, marsh, dunes, dotted province bounds, dashed borders, a thin wash per realm, towns from zoom 1.8 and a keep with a gold flag for each capital; detail grows over six zoom levels, on every map view. Same pixels every time, no random draws, about the release's frame time (a wheel step 1.6–2×). Procedural: mountains follow province terrain, not ranges, and there is no cartouche; a hand-drawn map needs an illustrator |
| 4 | Banners for unit boxes | ✅ | 62-inked-map: from zoom 2.2 each army is a standard in its realm's colour with the ruling house's charge, square for foot, swallowtail for horse, pennon for bows, with its strength on a slip; the release's boxes when zoomed out or by setting |
| 5 | 60–100 woodcut scenes | ◐ 🎨 | 61-illumination: 25 woodcut compositions, one per event shape, each varied by a seed from the event and the year (sky, hills, facing, season, hour): 300 distinct pictures from 12 events, 9 KB each on average. 95% of sampled events get a picture that fits (82% by their own shape, 13% guessed from their words). Hand-cut blocks need an illustrator; the frame takes any SVG per shape |
| 6 | Small motion | ✅ | 61-illumination: a woodcut inks in when its scene opens, new story lines ink in, a new year turns in like a page, steel flashes across a fight as it opens; all off for reduced motion, and none of it draws a number or touches the state (`motion`, `renderPure`). Banners moving on the map wait on Visual 4 |
| 7 | Sound | ✅ 🎨 | 61-illumination: quill, paper, wax seal, bell and steel. 73-score: a calm score per land, composed in the page with Web Audio (no files), off until the player turns it on: 14 families for the 24 cultures, each with its own mode, drone and instruments (lute, harp, vielle, flute, tabor, bell, a generated room), pieces of 2–4 minutes from motifs that end on the tonic or the fifth, then a long silence. The game shapes it without being touched: winter thinner, summer fuller, war a tabor and a darker mode, a battle sinks it, a death ends in a bell and a lament. 240 pieces all in mode and all different; about 5% of one core. Written themes and a listener's ear need a composer |

## Technical

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Modules and a build step | ◐ | Base esbuild build; this repo builds features on the release, but the source isn't here |
| 2 | Retire patch-on-patch | ✅ | Base (Phase 1) |
| 3 | IndexedDB saves with backups | ✅ | Base, plus silent-failure, two-tab and new-life fixes (05) |
| 4 | Speed budget | ✅ | 0.63 ms per day, 229 ms per year (bench `perf`) |
| 5 | Every test on every change | ✅ | 61 browser tests, the event linter and CI on every push |
| 6 | Replayable runs | ✅ | Base journal, plus render-purity fixes; replay now holds with the UI in use (01-replay) |
| 7 | Report a problem | ✅ | Base, plus a fix for reports from restarted journals |

## Replayability

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | 20 hand-made starting stories | ✅ | 29-starts: 20 stories over 17 realms and all seven peoples, each with an opening scene and a callback 5–15 years on (40 events) |
| 2 | Different endings with epilogues | ✅ | 28-endings: 20 endings × 9 manners, an epilogue of what became of them, and a collection in the Legacy tab |
| 3 | Vary the world each run | ✅ 👥 | Base: 13 scripted branches of history. 43-varied-worlds varies fortunes, borders, feuds and alliances. 70-fresh-realms generates smaller realms fresh: 1–3 large realms lose a contiguous breakaway (a duchy, a march, a league of free towns, a rebel prince's holding) with a name in its people's style, a ruling house, inherited laws and faith, its own bible entry, a fair share of the army and treasury, and a quarrel with its parent (a claim, a feud line, a truce or a war of reconquest): 47 fresh realms in 24 worlds, 0 invalid. It also seeds 1–3 starting tensions the engine runs (a disputed succession, a famine, a holy war brewing, a child under a regent, a debt between realms). The life-arc classifier (`classify.mjs`, 14 types) over 200 pooled lives: 14 types, the largest 25% (at the bar; early deaths and the commander ending set it, not the world). Whether players start a third run needs people |
| 4 | A mid-game and late game per path | ✅ | 46-life-arcs: each of the seven paths, plus common folk, has a middle-years undertaking in three scenes and a legacy in two, years apart; every choice leaves a mark the later scenes read. Bot lives: every life of 15+ years began one, and 11 finished in 10 lives |
| 5 | Export a readable history of the family and world | ✅ | The Chronicle (22) exports every life of the save; 57-world-chronicle adds "The world in your time" to the book and the export (a 50-year life: 1,450 words of book and 3,678 of world history) and an Annals view in the World tab |
| 6 | Load events and realms from data files | ✅ | 65-mods: a player loads a JSON mod from the title screen or the menu: events (conditions in a small language over the game's 50 condition helpers, effects from a whitelist of its own effect keys, a fixed list of tokens) and realm flavour (local events, culture words, customs of three kinds). No code runs; a bad file is refused whole with every error placed; markup is stripped. The mods a life starts with are recorded in the save and the journal, so a replay plays the same. Whole new realms are out of reach: the map's provinces are fixed geometry |

## Uniqueness

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Name the core in one line | ✅ | `docs/north-star` |
| 2 | Signature 1: the Chronicle | ✅ | 22-chronicle: chapters in a chronicler's voice, exportable (more to do: corrections, a period voice for every line) |
| 3 | Signature 2: belief versus truth everywhere | ✅ 👥 | 26-belief-truth: beasts, secrets, far news and your own legend. 64-npc-beliefs: the people around you and every court hold claims about you, others, battles and beasts, some false (12% at home, 83% far off), and opinion follows them; every realm keeps its own telling of the run's great events from 57's record, which differs by side and distance (the losers claim the field 10 times in 24), drifts with the crown's propaganda and is set right after a peace (15,088 tellings over 16 lives, 60% false); grudges and AI interest read the believed history (9 of 276 feud plans exist only because of it); people act on what they believe (a court puts out believed traitors, a man who believes you killed his kin turns on you); and you take what is said at home on trust and find out (152 tales heard, 70 found wrong, "What the world told you" in the Chronicle). 12 of 12 bot lives of 15+ years met it |
| 4 | Signature 3: both scales at once | ✅ 👥 | 34-both-scales: three disagreeing accounts after each fight. 72-two-scales: the moment itself, during a war-map fight, as an open book: on the left page your three named comrades (37) with their faces and fates and what you see and hear; on the right an inked strip of the front (62's standards, your section in gold, yesterday's line, the general's plan arrow from 38, the gap where a comrade stood). Each day brings one choice read from the real front, and it acts through the engine: 44's performance moves the front, 48's fight odds roll your push, 60's drill decides whether a shield wall is offered, comrades live or die by the risk and the dice. A soldier's best against worst play moves the fight 17 points over 300 frozen fights (0 the wrong way). A draft and a levy bring it to non-soldiers: 6 of 8 soldier and serf lives meet one, 0 of 8 merchants |
| 5 | Cut what dilutes the core | ✅ | 58-event-cut: the War Room's Templates, Industry and Manpower tabs, which the release showed greyed out to everyone, follow its own unlock rules (ruler, Marshal, Commander or General); the War tab no longer promises them to a commoner. No other screen of that kind was found |

## Round 3 changes

Eighteen features and two tools, each with its own tests and README, moved twenty-seven rows.

| Feature | Rows | What changed |
| --- | --- | --- |
| 23-after-action | War 2 ✅, War 4 ◐ | Every line battle and war-map fight ends with its three biggest causes, in kill-equivalents, signed for your side. The figures are calibrated: the forest cost to the riders was reported as 68 kills against 67 measured, and a pike hedge as 67 against 52. Shown on the battle screen, in the story log and in the war views. |
| 25-variety-guard | Events 5 ✅ | 10-year default cooldown. 24 shapes, read from title and text. Recency weights for the small pools (duties, flows) and for NPC moves. |
| 26-belief-truth | World 4 ✅, Uniqueness 3 ◐, Relationships 5 ◐, World 5 note | Four knowledge states for beasts. Secrets told against their truth, with 11 scenes. Far news inflated, then corrected. "As the tale is told" in the Chronicle. Registered as signature 2. |
| 28-endings | Replayability 2 ✅, Replayability 5 note | 20 endings and 9 manners, decided at death. An epilogue on the death screen. A collection in the Legacy tab. |
| 30-get-to-know | Relationships 7 ✅ | A first meeting is a scene with four approaches whose odds the person's traits set, read in advance by a sharp eye. |
| 31-learn-by-doing | Character 2 ✅ | Every gain tagged practice or use; use counts for more, a failed check teaches more, and a monthly summary. Two-thirds of growth now comes from doing, at the same total for a passive life. |
| 32-ladder | Power 7 ✅ | A census of the living ladder, a cap on Masters per realm, and the living ladder in the Codex. |
| 33-choices and `tools/lint-choices.mjs` | Events 7 ✅ | A checker for obviously best choices: 19 found and fixed, and CI blocks new ones. |
| 34-both-scales | Uniqueness 4 ◐ | After each war-map fight, what you saw, the front and the chronicle's account, side by side and disagreeing. Signature 3 is registered. |
| `bench/balance.mjs` and `bench/targets.mjs` | Balance 1 ✅, Balance 3 ✅ | Target bands per starting path, held by a fixed-seed league in CI. |
| Bench `perf.warTick` | War 7 ✅ | The war-map tick with 212 divisions: 9.4 ms at the 95th percentile. |
| 29-starts | Replayability 1 ✅ | 20 hand-made starting stories (17 realms, all seven peoples), each with an opening scene and a callback years later. |
| 35-moods | Character 3 ✅ | Four needs that drift toward what your life gives you, a mood with its cause, happiness that follows the needs, and 14 scenes that start from a mood. `fx.need` lets any event meet a need. |
| 36-sieges | War 5 ✅ | A choice each month from either side of the wall. Each one moves the real siege counter, by 3 to 12 days of a 40-day siege. Camp sickness thins the besiegers. The fall ends in the sack, the mercy or the terms. |
| 37-squad | War 6 ✅ | Comrades who come back from a mission learn its skills and earn a standing; veterans add up to 8 points to a mission's odds. The person card shows the record, and a death says what was lost. |
| 38-orders | War 3 ✅ | Generals have a temper from their traits, and it moves how their army fights: how good the odds must be, how many divisions go at once, how rested they must be, whether it hunts the undefended, and (round 5) how quickly it acts. The war room shows each army's temper and plan. A soldier gets the plan as a letter, and the map settles it sixty days later: credit, blame, a reckoning, or being proved right. |
| 39-schemes | Relationships 3 ✅ | Sway, befriend, seduce, slander and murder as plots that run for months, with an estimate up front, an opening halfway, a last move, and a chance each month of being found out. The people who hate you plot back, and you can notice, unmask and answer them. |
| 41-circles | Relationships 6 ✅ | Circles form around you as you meet people; a friend of your foe starts cooler and a friend of your friend warmer, and the person view says why. A great harm reaches the victim's friends. Cliques of three in the unit or the street. |
| 42-difficulty | Balance 4 ✅ | The three settings now change what you are told (odds as numbers, as words, or as you set them) and how fast you recover (healing, timed wounds, prison terms), not only how often you die. |
| 43-varied-worlds | Replayability 3 ◐ | A game from the menu starts in a varied world: different fortunes, borders an older war moved, feuds already burning and broken alliances, told at birth. The release's 13 scripted branches of history still run on top. No new realms. |

Findings from building these:

- **Repeats were coming from outside the roll.** Most of the repeats a player sees came from job duties, path flows and NPC moves, which skip the event roll and its cooldown. The guard now covers them with a preference rather than a ban, so the pools don't run dry.
- **Fixed: "Keeper of Secrets" ended most lives.** An early draft of the secret scenes made "Keeper of Secrets" the ending of 4 of 6 bot lives. The finds are now rationed to one in eight years.
- **The AI ratio was noisier than reported.** The warlike-to-peaceful war ratio in one world swings from 1.5 to 6 with the random stream: a feature that draws one more number a month moved it from 5.3 to 1.45 on the same seeds. Pooled over four worlds it reads 2 to 5, and two builds on a fresh seed set agree (1.98 and 2.06). The test now pools four worlds.
- **Fixed: one bad event text could freeze the game.** A risk-cost run crashed on `pl_royal_wedding_guest`, a release event whose text reads `A.realm(p.realm).capital` with no guard; about twenty other release texts do the same. The engine dropped an event whose setup threw but not one whose text threw, so the player was stuck on the event screen. `ENG-EVENT-TEXT-GUARD` (fix layer) now drops it too, and `eventTextGuard` fails on the release and passes on the fix.
- **Seed-sensitive tests and bands.** Each new feature changes the random stream, and three checks flipped on it without anything being wrong: an NPC test whose one life ended at 25, a growth test that pooled three lives a side, and two wealth medians of four lives. The two tests now pool more lives (eight a side) or move to the next fixed seed when a life is too short to test. The balance league now plays 8 lives a path instead of 4, on two pages at once. A life gives the same numbers on either page. Four builds that differ only in their random stream all sit inside every band, and the spread that remains is written into `bench/targets.mjs`: for example, a serf's median peak wealth runs from 4,500 to 107,000.
- **Squads turn over almost completely.** In twelve missions, 7 of 9 men died, so few men reach veteran. That is the plan's "who die", but standings are rarer than the ranks suggest.
- **The balance league found three things for the designers** (notes in `bench/targets.mjs`):
  - Every serf was free by 33, most by buying freedom at 21–22 for 40 suns. The event that sells it had no way to say no; it has one now (33-choices).
  - A peasant's peak wealth is close to a merchant's.
  - Artisans are the noisiest path.

## Round 5 changes

| Feature | Rows | What changed |
| --- | --- | --- |
| 47-realm-bible | World 1, 2 ✅, World 7 ◐ | A bible for each of the 34 realms (a want, a fear, a place, three customs) and 102 customs the engine keeps, from Aldmark's hearth mark to Skyhold's sky burial. Each is one of ten rule kinds tied to a moment most lives meet; the first meeting is a scene to keep or defy, and later ones are applied and logged. Every culture has its own words. 34 of 34 realms pass the plan's gate. Written by four writers in parallel against one model realm and a validator. |
| 46-life-arcs | Replayability 4 ✅ | Eight paths, sixteen undertakings, 40 scenes. A command and its ford, a house abroad, a parish and a heresy, a great book, the big job, an estate, a monument; then a protégé and a last campaign, handing on the house, a shrine, a school, going straight, the inheritance, whether to lay down the crown; for common folk, a holding and the village elder. At most two middle-years undertakings and one legacy per life; a stage that no longer fits the life gives the work up. |
| 45-economy | Economy 1, 2, 3, 5, 7 ✅, Economy 4 ◐ | Production from the land, demand from people and armies, stocks that set prices, caravans between all realms at peace, local prices, three production chains with workshops the player can own, and an exploit test. 97% of realm-goods hold a normal stock over ten years; a famine behind closed roads makes grain ×3.5 its normal price where it is not exported. |
| 44-rank-battles | War 1 ✅ | The soldier's line battle and the officer's tactical battle now move the war-map fight they belong to. Measured by replaying 60 real fights frozen at their start: best against worst, 12 points of win rate for the soldier and 19 for the officer. The release's fixed nudges moved it 5 at most. |

Findings:

- **The release's economy had a money loop.** A greedy trading bot turned 1,000 suns into 14,543 in ten years, twelve times a farm estate. Building the new economy first made it worse (two to three hundred times) until trade runs paid haulage and each load's price slid by the market for that good.
- **A purse could become NaN.** The coin effect accepted NaN, and a scene whose setup had failed paid NaN. `ENG-COIN-FINITE` (fix layer) guards it; the release fails the new test.
- **A queued event is shown whatever its `cond` says.** Only the random roll reads `cond`. A chain of scenes queued years apart must check the next scene's `cond` itself, or a soldier who left the army is still sent to hold the ford (46-life-arcs does).
- **General temperament did nothing.** Over 96 wars a temper, bold and cautious armies assaulted alike (331 and 353): the odds, share and rest dials seldom bind. The test had passed on twelve wars and luck, and failed once the economy shifted the random stream. A tempo dial (`GO-ARMY-TEMPO`: bold armies think every second tick of the war clock, cautious every fourth) now separates them, and the test pools 96 wars.
- **The first draft of the customs met the gate on paper, not in lives.** Lives that ended at 16 met nothing, and a grave custom, a cut of home sales, a rule for the mounted, or the estate of a giant's parent are moments a typical life never reaches. Counting only lives of 30 years and moving ten customs to moments lives do reach took it from 65% of realms to 100%.
- **Small samples read as findings.** More tests failed on the random stream alone:
  - learn-by-doing's points-a-year ratio: 0.93–1.28 by stream on eight lives; now pooled over three streams;
  - the soldier's and officer's swings on 16 fights: which is larger is the 60-fight bench's to say;
  - the famine: one realm, measured against an ordinary year's lean spring instead of bread's normal price; now four grain-importing realms, ×3.5;
  - the soldier's battle reckonings: one seed, 0 to 47 by seed; now four soldiers;
  - circles in real lives: three lives, two of them dead within twelve years; now nine;
  - arms used in a war: read at the end of four months, after Solenne's war was over; now the peak;
  - the balance league itself: 8 peasant lives gave a median death age of 26, against about 66 over 24 lives (five of eight died young of falls, kicks and fever). The league now plays 12 lives a path.
- **Two tests measured something other than what they claimed.** `varietyGuard` counted three-in-a-row with duty scenes and NPC moves left out, so travel, work, money, travel, travel read as a triple, and it diluted the back-to-back share with queued scenes the guard never chooses. It now judges each rolled scene against what the player saw just before it: back to back 5.6% → 1.0%, triples 4 → 0. `btRumors` counted corrections still on the 220-line news list; in a year of busy wars the early ones scroll off; it now counts them as they are sent. Both turned up when the economy changed the random stream, and neither was a fault in the game.
- **The random stream lives outside the state.** `A.rngState` is not in `A.S`, so restoring a saved state does not replay the same future. The replay lab (`bench/rankfx-lab.mjs`) restores both.


## Round 6 changes

Twenty features, written in parallel by one agent each against a shared brief and then integrated, moved thirty-six rows.

| Feature | Rows | What changed |
| --- | --- | --- |
| 48-fight-ladder | Power 1–5 ✅ | Every fight choice audited against the ladder; 185 roll on fighting worth with the odds shown being the odds rolled; group fights on tier math; wounds that drop tiers; the math on screen. |
| 49-body-mind | Character 4, 5, 6 ✅, Character 7 ◐ | A body with parts, illness over months with treatment, traits earned by deeds with their reasons, actions of each life stage, dead numbers folded; risky activities refused when hurt. |
| 50–53 arcs | Events 3, 4 ✅ | 52 story arcs of 3–6 stages (kin, rivals, the world, things) on 46's story track; every ending leaves something lasting. |
| 54-voices | Events 6 ◐ | Culture voices and trait manners in events and NPC lines. |
| 55-bonds | Relationships 4, 5 ✅, Diplomacy 6 ◐ | Weighted bond history, secrets and leverage, feuds that outlive rulers. |
| 56-realm-inside | Diplomacy 2, 3 ✅, Diplomacy 5 ◐, Economy 6 ✅ | Courts of named people, laws pushed by people, AI gold spent, the player's money sinks. |
| 57-world-chronicle | World 5, Replayability 5 ✅ | A dated record of the run that scenes cite. |
| 58-event-cut | Events 1 ◐, Uniqueness 5 ✅ | 26% of the release's events retired by audit; war screens shown only to those who use them. |
| 59-tooltips | UI 2 ◐ | Nested tooltips on every number of the profile. |
| 60-drill | War 4 ✅ | Drill gates formations and counters. |
| 61–63 | Visual 1, 3, 4, 6 ✅, Visual 2, 5, 7 ◐ | The style guide, woodcuts, vellum, ink motion and sound; the inked map and standards; painted miniatures. |
| 64-npc-beliefs | Uniqueness 3 ◐ | People and courts believe things, some false. |
| 65-mods | Replayability 6 ✅ | Player mods as data. |
| 66-markets | Economy 4 ✅ | 86 market towns with distance pricing. |
| 67-memory-weave | Events 2 ✅ | 54% of fired events changed by a memory, measured strictly. |
| `nightly.yml`, `bench/dominance.mjs` | Balance 2, 6 ✅ | 1,002 lives a night; a hunt for dominant strategies. |

Findings:

- **Two tests had been passing on nothing.** `temperMovesTheWar` (38-orders) and `planIsVisible` ran wars that never moved: scenes newer features queue for the player (a custom, a plague nearby) held the clock, `A.advance` returned after 0 days, and 0 assaults passed "cautious makes 10% fewer than bold". With the clock running, the temper made no difference in the integrated world: its dials were bars that only delayed an attack a few days. The general's temper now decides whether to attack at all, what to hold back and how many to send.
- **A lucky sample read as a finding.** The soldier's line battle was recorded as moving the war-map fight 12 points; on 150 fights it had always been 8–10. It is now 13 pooled over 300 fights, and the test uses 100 paired fights.
- **A world drifted slowly past its bar.** Taxes slid to Light in 89% of realms by 60 years, mostly from a treasury rule that cut taxes with no court. The 30-year test sat on its 60% bar and read as noise. Taxes now pull toward each realm's custom (29% at an extreme at 30 years, 56% at 100).
- **The exploit bench measured a wage.** A guild post an event handed the trading bot paid 20,000 a year; two runs read ×42 and ×27 while their trades lost money. The bench now drops any job each month.
- **A memory metric saturated.** Once every event's setup reads the memory record, the bot's static memory index counts every event (100%). It now reads each event's own setup, and the honest figure is the runtime one: draw each fired scene again with the memories removed and count it only if it changes.
- **Most integration failures were tests, not the game.** Ten tests broke when the features met. Each was a fixture the newer world no longer fits: an elf of 30 is still a child, a story arc took the roll a life-arc test forced, a father already had sons, a merged skill was never read, a newborn died of a fever on a shifted stream. One was real: giants were drawn shorter than an average man.
- **The suite outgrew CI.** On one page the full suite took about two hours on the integrated build. Tests now run four at a time in CI (`--workers`).
- **The machine is the limit when agents run in parallel.** Ten agents each running balance benches put a 4-core machine at a load of 35, and the container restarted twice. Agents now run one browser each and leave balance to the integration run.

## Round 7 changes

Ten new features and second passes on five older ones, written in parallel against the same brief and then integrated, moved nine rows to done. The measured scorecard went from 65.3 to **69.4** (of about 75 that bots and tests can award): duel odds shown against real 9 → 2 points, check success 38.5% → 51.6%, old-age events 26 → 155, distinct life arcs 12 with the most common at 17%. Still short: median death age in bot lives (39, target 55–70), prompts per year (5.2 of 6), initiative actions (4.7 of 6), and flags never read (1,105).

| Feature | Rows | What changed |
| --- | --- | --- |
| 68-casus-belli | Diplomacy 5, 6 ✅ | Every AI war names its reason, drawn from what the realm remembers and wants; grudges wait for the moment the enemy is weak; debts are paid back by marching to a benefactor's aid. The news reads "War declared by Velgrad. The cause given: …". |
| 59-tooltips (part 2) | UI 2 ✅ | Tooltips on the War Room, Holdings, the Path tab, event odds, duels, battles, the Realm tab and the Codex: 97–100% of numbers per screen, each breakdown adding up to what is shown. |
| 71-phone | UI 6 ✅ | The phone layout on its own: thumb-sized cards and controls (none under 44 px, sliders included), a bottom bar, WCAG 2.1 AA contrast. |
| 70-fresh-realms | Replayability 3 ✅ | Small realms made fresh each run and starting tensions; a classifier sorts 100 lives into 8 or more arc types, none above 25%. |
| 54-voices (part 2) | World 7 ✅ | Culture words carried into the release's own events and titles: 46% of events in a culture's voice, every culture at 30% or more. |
| 73-score | Visual 7 ✅ | A quiet score for each land, off by default: a drone, one voice and long silences, six synthesized instruments. |
| 64-npc-beliefs (part 2) | Uniqueness 3 ✅ | Every realm keeps its own telling of the run's great events, which differs by side and distance, drifts with propaganda and is set right after a peace; grudges and people act on what they believe. |
| 72-two-scales | Uniqueness 4 ✅ | The squad and the front on one page: a common soldier's fight and the war it moves. |
| 69-live-numbers | Character 7 ◐ | Checks retagged and riders added so most stats and skills touch 5 outcomes a life; the rest wait on the source merge. |
| 74-old-age | Character 6 (deepened) | 119 old-age events, the deathbed and a death screen; the scorecard's old-age count 26 → 155. |
| 38-orders (part 3) | War 3 ◐ | Bold generals press, pursue and turn on the enemy host; cunning ones go round walls, flank and feint. Each is as distinct from steady as cautious is; cunning's ground per man lost is best pooled, not in every seed set. |
| 75-fair-checks, 24-honest-odds (refit) | Character, Power | A scene's difficulty eases by the gap between a seasoned adult and a typical person of your life stage, never past what your stage brings, so a young adult no longer wins only 26% of checks: the scorecard's check success 38.5% → 50.2%, checks under 15% 24% → 7%, while untrained or wounded people still face long odds. The duel curve was refit on 14,400 duels (the player's seat −0.22, a width that grows with worth): the largest cell bias held out 2.8 → 1.5 points, and the bench now plays 1,000 duels a cell, since 150 left 4 points of noise. |
| Writer's pass | Events 6 | Generated lines in 55, 56, 57, 64, 67, 68 and 70 agree in number, read in period voice and stop doubling words. |

Findings:

- **A test suite passed on nothing again.** 66-markets gated its tests on `window.A`, but `A` is a script-scope constant, so all fourteen tests skipped and reported success. The gate now reads `typeof A`.
- **Drawing made state.** The market panel created a player's cargo, a realm's market and a trade plan the first time it read them, so opening a tab changed the save. They are now made when a game starts or loads, and the render-purity tests cover the panel.
- **Markup leaked through a cleaner.** Four features stripped `<`, `>` and `"` one character at a time, so `<b>fair</b>` became "bfair/b". They now drop whole tags first.
- **A stale `index.html` turned CI red.** A push carried feature changes without the rebuilt page. Every push that CI checks now rebuilds it.
- **CI outgrew one job.** The full check took 81 minutes and was cancelled at 90. It is now three jobs: two halves of the browser tests (`--shard=k/2`, four pages at a time) and the balance league.
- **A cast scene ran over the word limit.** A noble's description, title and manner reached 82 words. The manner is now dropped when it would push the scene past 80, and the title follows the name.
- **New worlds broke fixtures, not the game.** Seven tests leaned on what a seed used to produce: a life that lasted, a war that had already been raised, a giant only a little taller than one man. The giant was a real drawing bug (now 1.16 times a man's height); the rest now pick a seed that fits or take the engine step they were assuming.
- **A hidden reason.** 64-npc-beliefs' second part made a realm warier of a crown it has heard cruel tales of, but showed no line for it, so the AI card's reasons stopped adding up (5 shown as 8). The card now shows "Tales of cruelty in …".
- **A busier world wore down two effects.** With bold generals standing longer and fresh realms at war, the soldier's line battle moved 9 fights in 100 against a bar of 10 (its weight is up 20%, and it reads 11), and the price gap four steps from the makers fell to ×1.03 (carting a step is now 3% of a load's worth, not 2%: ×1.05).
- **A peaceful control that was at war.** The test of war making arms dear compared a realm at peace with the same realm at war, but the AI attacked the peaceful one in its first month, so both runs were wars. It now picks a realm that stays at peace.
- **A beaten realm spiralled into debt.** Tamar lost six of its seven provinces in a war and kept paying upkeep on the great works of its larger days: 145,712 a year on an income of 9,176. Its debt ran from 0 to 11.1 million in 27 years, and the world test's total debt rose instead of falling. The works it can no longer keep now fall into disrepair (upkeep at most a quarter of its taxes), and an AI crown whose interest eats half its taxes repudiates its debts, at a cost in stability and legitimacy, with a line in the news. The world's total debt over 40 years: 8.3 million → 18,010.
- **Two economy bars pull on one knob.** Dearer carting inside a realm widens the price gap with distance, and lets a failed harvest with open roads sit a point under an ordinary year's lean spring. At 3% a step the gradient holds on every good (×1.05); the famine bar that matters, bread tripling behind closed roads, holds (×3.16). A failed harvest with the roads open barely moves bread, because the neighbours' caravans answer it: a design call.
- **A test measured survival, not stories.** The kin-arc test needs ten bot lives of 40 years; in the round-7 world six tries a start gave eight, and six of those eight met a kin arc. With eight tries it reads 11 long lives, 8 with a kin arc, 18 arcs finished.
- **A fixed seed set read luck as a regression.** The scorecard's median death age (humans and orcs, 64 league lives on fixed seeds) fell from 57 to 39 in round 7. A bisect over seven features pointed at 69-live-numbers (54 without it). On a second set of seeds, the same 48 human and orc lives read a median of 60 with it and 63 without (old-age deaths 21 against 20), inside the 55–70 target. Pooled over 96 lives, 69 may cost 3–5 years of mean life, within the noise. The median of 48 deaths moves by about 5 years from seed luck alone, so a single fixed seed set is a weak measure of it; read it with a second set before acting.
