# Progress

The checklist of every work item, in the order they are being done, split by major version (D-037). Tick an item the
moment it is merged and CI is green, with the stamp and the commit; never delete a line. Details live in
`docs/HISTORY.md`; the plans and reasons in `docs/CRITIQUE.md` §2, `docs/V3_SPEC.md` and `docs/DECISIONS.md`.

*Last updated 2026-11-16 03:30 ET*

## v2 · Round 2: the owner's complaint list (`docs/V2_SPEC.md`, `docs/CRITIQUE.md`)

### Done
- [x] **Step 0** · Repo restructured by system, with a memory (CLAUDE.md, HISTORY, DECISIONS, IDEAS, CHANGELOG, OWNER_ORDERS) · `d906efc`, CI 95 green · 2026-11-11 23:43 ET
- [x] **Step 1** · Harsh critique: 162 flaws rated, 22-step work order (`docs/CRITIQUE.md`) · `f3fca58` · 2026-11-12 06:15 ET
- [x] **Prep C7** · Name data: one common English pool (3,820 given, 4,083 family names) + 9 pools for non-humans and far peoples (`docs/research/c7-name-data.json`) · `6ae93dd` · 2026-11-12 07:05 ET
- [x] **Prep D11** · Military branches and battlefield strategy draft (`docs/research/d11-branches.*`) · `85df7b0` · 2026-11-12 05:57 ET
- [x] **A0** · Stop the bleeding: the lag's main cause (whole-page restyle), the two-lords crash, text fixes, bench harnesses · `db98217`, CI 96 green · 2026-11-12 11:02 ET
- [x] **X6** · Naming pass: 79 clear renames, `docs/NAMES.md` lookup, `docs/README.md` index · `7a5e71d` (CI pending) · 2026-11-12 12:03 ET (moved to immediate priority by the owner, 2026-11-12 11:17 ET)
- [x] **A3a** · The net: hidden errors fail tests; 12 coherency checks in the build; baseline that may only shrink; nightly 60-year audit · merged (CI pending) · 2026-11-12 12:07 ET
- [x] **B4** · Click-to-open descriptions; nothing on hover; activities open a sheet first · `c00a91b` (CI pending) · 2026-11-12 15:05 ET
- [x] **C8a** · Character design plan, realistic version (`docs/design/characters.md`) · `e7d199d` · 2026-11-12 11:48 ET
- [x] **C8b gate 1** · Character demos: 8 sheets + live face maker (`docs/design/demo/`) — a working draft, below the bar · `397b55f` · 2026-11-12 15:52 ET · reviewed: owner chose **detailed 2D illustration** (D-024)
- [x] **C8 2D plan** · The 2D illustrated part system (`docs/design/characters.md`) · `389041f` · 2026-11-12 17:27 ET
- [x] **C8 2D gate 1** · Style frame: four sitters in two finishes (`docs/design/demo-2d/gate1.*`) · `655fe2c` · 2026-11-12 18:16 ET · **with the owner for review**
- [x] **C8 2D gate 2** · Tone-led demo: 15 full figures, cards, face and build maker, armour by piece, make × rarity (`docs/design/demo-2d/gate2.*`) · `9d68308` · 2026-11-13 06:49 ET · **approved by the owner (D-035)**
- [x] **CI fix** · The 22 tests CI 97 failed after A3a: 5 game bugs fixed, 17 tests made robust · `d5f42ab` · 2026-11-12 18:29 ET
- [x] **CI fix 2** · CI 100: B6 draws 6x slower (fixed), iconsWired, two bot-life bars (D-027) · `57180f4` · 2026-11-13 00:55 ET
- [x] **v2.1.0-alpha.2** · cut on green CI 101, `release/v2.1.0-alpha.2` pushed, sample save · `f37c62f` · 2026-11-13 01:35 ET
- [x] **A1** · Lag, drawing side: one redraw per press, log in place, year 50 = year 0; engine share left to X5/D12b (D-023) · `b9a656c` · 2026-11-12 16:27 ET
- [x] **B6** · Next month or Next year; no initiative cap; only notable events stop time (D-019, D-026; `src/ui/999995-next-year`) · `bacd0a2` · 2026-11-12 19:26 ET
- [x] **X1** · Own the release: the build reads readable source in `src/core/release/`, all 203 patches baked in, proven the same program · `5056e98` · 2026-11-13 01:44 ET

### Next, in order
- [x] **A2 stage 1** · One registry of posts; one holder per post; Marshal empty in peace (D-017, D-031); coherency to 0 · `1e914c0` · 2026-11-13 18:25 ET
- [x] **A2 stage 2** · The Marshal's seat optional, a ruler may fill it in peace (D-049); battalion and company slots, order masters, staff, companies, house heads and land titles as posts; route the adopted writers · `5f58aed`, fixes `fd52661`, CI 114 green but one test · 2026-11-14 22:18 ET
- [x] **B5 part 1** · Declutter the shell: story drawer, folds, six activities, info buttons out of the flow; first view 479 → 171 words · `66291b1` · 2026-11-13 12:13 ET
- [x] **B5 part 2** · UI.scope (`src/ui/999997-scope`), the six-life draw test, one goal stack (`src/ui/999998-goal-stack`) (D-055); the tablet's phone shell is not done (D-055 "not done"), its 44 px touch targets are held by `b5Tablet`
- [x] **C8b** · The gate 2 figure library draws every portrait; face and build maker at creation; face codes · `9a2cbeb` · 2026-11-13 13:02 ET
- [x] **P** · Profile tab (D-038, `src/ui/999996-profile-tab`): a game-like page of your character, card and figure, titles, stats, skills, styles, renown, gear (owner order 33; after B5)
- [x] **C9** · Bodies that make sense: measured stat words, no body units, skill baselines, longer lives, honest odds, Swordsmanship · `cd2e54d` · 2026-11-13 21:17 ET
- [x] **P2** · A clean Profile page (card, sheet, four tabs); the past in Records (D-041) · `c56f9d4` · 2026-11-13 19:21 ET
- [x] **X7 part 1** · Phone speed, the first load: title world without the continent, the new life's continent built ahead in a worker, cheaper event-pack setup; `tools/bench/phone-load.mjs` (D-054, H-042)
- [x] **W0** · Remove the war score and the army templates (order 34) (H-036)
- [x] **X2** · Named stages: seven hot functions run named stages from a manifest (`src/core/01-stages`), `tools/lint-stages.mjs` holds them and the count of names defined twice (364 → 357), the muted diplomacy path held by `v2DipMutedPath` (D-056)
- [x] **D10** · War screens only when deployed (H-036)
- [x] **C6** · Relationships and households: the household at birth (commoner ≤ 8, noble ≤ 12 with nurse, maid, guard knight, tutor at 6), how you met on every entry, no kin minted (`tools/lint-kin.mjs`, `c6NoKinMinted`), one resolver for a house (`A.HOUSE`), a parish as seeds, nine months (D-057, H-048)
- [x] **X3 part 1** · No initiative left; feasts on their dates; fight stakes; illness shown; kilometres (D-051) · `839d0c6` · 2026-11-14 11:19 ET
- [x] **X3 part 2** · Station words held to their gates, home-town cards not dealt abroad, counsel only from those present, nothing adult asked of a child under six, the pronoun lint, the 400-scene preview replay, a fatal illness as an arc (D-059) · branch `x3-part2`
- [x] **C7** · Names and cultures in the game: one common English pool, a lean per realm, people from the neighbour and trade partners, no twins, fiefs in their own people's language, four realm names fit their governments, the renaming hack deleted (D-058, `docs/design/names-and-cultures.md`)
- [x] **Order 52** · Legendaries and arts renamed; ordinary arms as made things (45 forms); Sickle Moon (D-050) · `334f81e` · 2026-11-14 11:22 ET
- [x] **C8c** · Dress, class and regalia: dress by station, people (four cuts), occasion and place; only a livery is shared; a soldier's bust; hoods for the road; a scene tag on every event and the print that follows it; outfits the player changes (D-060, `docs/design/demo-2d/c8c/`). **Blind reading 83 in 100 over six readings, 81 on the final sheet: the bar of 85 is not held (serf, peasant, merchant)**
- [x] **D9** · The map's ground: roads in two ranks, fords and bridges, named passes, tributaries, woods and marsh, named seas, ranges, rivers and forests; towns on water; oases on dry land; terrain read from the ground; 36 realm colours; one map component (`MAP.paint`); roads, supply and attacks read the same ground (D-061, H-077, branch `d9-map`). **Left:** the burn (D12b), seasons on roads, sea lanes, `fieldAt`, one canvas for the map and the war room (owner order 62), the independent roads-or-borders read
  - [ ] **D9-2** · Roads read as roads: three blind playtests scored 69, 75, 73 of 100 (target 90); tracks and province borders still confused at a glance. A bolder pass (tracks clearly heavier than any border), ideally with the image model's art direction (order 60). Merged without it by choice (2026-11-16).
- [x] **D12a-2** · War design revised with the owner's ten answers (order 54): part two of `docs/design/war.md` (§9 to §16), two diagrams, sixteen stages (D-064, H-059) · branch `d12a-2` · 2026-11-15 21:35 ET
- [x] **T1** · Faster testing: a quick tier on every push, the long bot-life tier nightly and before versions
- [x] **P3** · Order 54 playtest round: new life after a save; ambitions, chapters and handed goals retired (free will); reasoned consequences for crimes against rulers (no automatic forgiveness); first mission within months; a step completes after its cards are answered (branch `p3-playtest`, H-059, D-062 addendum; to merge into v2-integration)
- [x] **D12a** · War design: theatre, field, press; sight by rank; one engine with a cause ledger; nine stages (`docs/design/war.md`) · `0378b9e` · 2026-11-14 05:43 ET · **10 owner decisions pending**

- [x] **v2.1.0-alpha.10** · cut on green CI 145 and long 15 at `b8a779a`, `release/v2.1.0-alpha.10` pushed, sample save `v2.1.0-alpha.10-noble.ardan` · 2026-11-18 06:39 ET
- [x] **v2.1.0-alpha.11** · cut on green CI 146 and long 17 at `65eb7ba` (I1-2 iPhone readiness), `release/v2.1.0-alpha.11` pushed · 2026-11-18 07:34 ET
- [x] **v2.1.0-alpha.12** · cut on green CI 149 and long 22 at `059d686` (W1-3 commands and the summons, W1-4 no levies, world-robust tests H-082/H-083), `release/v2.1.0-alpha.12` pushed · 2026-11-18 12:45 ET
- [x] **v2.1.0-alpha.13** · cut on green CI 151 and long 29 at `a88513b` (W1-5 surrender or defeat, H-084, H-085), `release/v2.1.0-alpha.13` pushed · 2026-11-18 15:25 ET

### Open, in build order (re-sorted 2026-11-16 by what the rest stands on; owner: "start with the more important or more
structurally necessary things")
Why this order: first the game must work (P3); then the removals the rest is built on (W1-1: the
Marshal; levies and the war score follow in W1); then the one way of deciding every figure uses (R1 core = W1-2), and access built
on it (R2); the growth standard (G0) before training is built on it (D11, D11+); the map (D9) before war on it (D12b, which also
brings X7 part 2's speed). Looks (C8d, L2) block nothing and run beside the rest when an agent is free; Gaps ride along with the
item that touches them; balance (X4) and the state diet (X5) last, once the systems hold still. Re-sorted again whenever an order
or a finding changes what stands on what.
- [ ] **W1** · No Marshal: General the highest rank, several Generals by army size, nobles' own commands under the king; old saves map the Marshal; conscription instead of levies (with D11). Stages (war.md §16): **W1-1** no Marshal, five ranks · **W1-2** minds (reasons and feelings; R1's core) · **W1-3** commands and the summons · **W1-4** no levies · **W1-5** surrender or defeat · **W1-6** the realm's peace (stability, factions, private wars, risings, coups)
  - [x] **W1-1** · No Marshal, five ranks: soldier, sergeant, captain, commander, General; one General to each host (a war-map division of 3,000 men or more), a column under a Commander; the senior General (the crown's first host) at council; an army's commander by the king's commission; old saves map the Marshal (D-066, H-061) · branch `w1-1` · 2026-11-16
  - [x] **W1-2** · Minds (R1's core): `A.WHY.decide`, one way of deciding (reasons with kind, weight and source; the temper's bend; feelings with a cause and a heat that discounts a hot king's reckoning; a seeded draw only among close options; a bounded record); wars (v2's `DV.tryWar` and the release's `A.aiWarCheck`), faction choices and the crown's choice of a General go through it; wrongs light feelings; the war's news says why, by rank; the owner's two lab kings as tests; `tools/lint-reasons.mjs` (66, may only fall) (D-069, H-064) · branch `w1-2` · 2026-11-16
  - [x] **W1-3** · Commands and the summons: every armed man in one command (the crown's, or a tenant-in-chief's, led by him by right or a General he names; hosts dealt by `GD.NOBLE_RUNGS`' strength; contingents kept whole); the king commands in person, by a commission or through a council of war; the summons' six answers with the reason given and the true one; a lord's men a season at his own cost; the refused summons' ladder, the lord's answer, a march lord's unsummoned rising; `w.kind`; the player lord's summons and judgment, the War tab's muster roll, the news by rank; `A.wsGeneralFor`, the punishment of an ignored summons and `A.callExtra` through `A.WHY` (lint-reasons 63); the other three disputes' ladders are W1-6's (D-081 to D-085, H-075) · branch `w1-3` · 2026-11-16
  - [x] **W1-4** · No levies: the levy retired as a troop, a yearly tax of men, a law, events and a word (`w4NoLevyLint`: no file of the game's source, data or tools carries it but the old-save converter); sworn men (1 in 400), enlisted regiments and the roll (1 in 100), conscripts only by a call for a named need, decided through `A.WHY` (kinds conscript, raise, release, mutiny), three calls by lot (3, 6, 12 in 100 working men), raised by each lord in his lands, a cost in the fields (45-economy's output, doubled at the reaping) and a remembered grievance; a company's ledger of holds and pulls (desertion by kind with reasons, mutiny needs grievance, voice and occasion); the player's lot, proclamation, release and ledger in words; old saves convert; lint-reasons 62 (D-086 to D-090, H-076) · branch `w1-4` · 2026-11-16
  - [x] **W1-5** · Surrender or defeat: wars end only when a side asks for terms (its decider's choice through `A.WHY`, from war.md §11.3's two pans, re-read monthly and after a great battle) or can fight no more (defeat, a fact); envoys ride; the victor names terms of real things from his cause and what he holds, the asker takes, refuses or counters; eight pathways and a record on every ending (`w.end`, `A.S.warEnds`); the player's peace table in words and cards only as a side's ruler; news by rank; `w.score`, `A.checkPeace`, `A.peaceOdds`, `A.warYear` retired (`archive/w1-5-war-score-and-peace`); old saves' wars go on; lint-reasons 58 (D-091 to D-096, H-084) · branch `w1-5` · 2026-11-18
  - [x] **W1-6** · The realm's peace: stability as a reading of named pressures (the realm's old temper, the throne's right, the lords, the commons, the towns, the faith, the army, the king himself; no luck of ±3), a house's loyalty from named terms (no random walks), each lord's stance; factions by §13.3's test (two houses, a tie, a leader with standing) and a ladder of decisions (petition, the crown's answer: grant, buy, arrest, refuse; theirs: back down, wait, withhold, rise; sides chosen when one rises); claimants, a lord's and the commons' risings as named people's decisions; coups with an opening, access and a motive, approaches, the spymaster's watch, the night settled by who holds what; private wars, border wars and the army's quarrel as ladders (the three disputes W1-3 left); a ruler made to yield (lords refusing service, a council's vote, a coup); the council's counsel of war, an alliance or a pact through `A.WHY`; `A.startWar`'s dead ally rolls retired; the coherency check "an unreasoned upheaval" at 0; lint-reasons 58 → 42 (D-097 to D-103, H-086) · branch `w1-6` · 2026-11-18
- [ ] **R1** · Nothing without reason (rule 18): every AI, noble, faction, commander and NPC decision carries a nameable reason from post, circumstance, personality and emotion; a lint and a run audit · **core built (W1-2):** `A.WHY`, the lint and its baseline (66 bare-dice decisions left, each listed with the reasons it needs in `docs/design/r1-audit.md`; crown crimes (P3) are the next natural users); W1-3 routed three (63 left); W1-4 one (62 left; its own four new decisions built on `A.WHY`); W1-5 four (58 left: the war's ending, D-091); W1-6 sixteen (42 left: the realm's peace, D-097 to D-103; what is left is diplomacy, appointments and the v2 kit's monthly ticks, listed in `docs/design/r1-audit.md`)
- [ ] **S1** · Proficiencies retired; skills with levels and experience, dynamic growth (order 63, D-072): design (S1a), then build (S1b) on the growth standard with concepts and breakthroughs; old saves convert; before D11+
  - [x] **S1a** · the design, 2026-11-16: `docs/design/skills.md` (28 skills with 99 specialisms; 35 levels, the eight words in five steps; experience by the standard's curve; 252 named concepts, proof and breakthroughs at the word edges; discipline, rivals, a new land, needs, kin, hours and specialisms move it; migration; six build stages) and the runnable model `docs/design/skills/` (`lives.svg`: nine lives and a 400-person spread). D-072, H-067. For the owner: ten choices in its §11
  - [x] **S1b** · the build, six stages (`docs/design/skills.md` §12.7), 2026-11-16, branch `s1b` (D-074, H-069); CI's both tiers and the balance league still to run
    - [x] 1 the engine (`src/people/engine/skills.js`, `growth.js`, `tests/v2/skills.test.js`; the nine lives reproduce)
    - [x] 2 the store and the mirror (`src/people/36-skills`, save version 15, every save loads)
    - [x] 3 sources and the ledger (the drip and the old rust gone)
    - [x] 4 concepts, proof, breakthroughs, the life, twelve moment cards
    - [x] 5 the page and the words (no proficiency a player can read; 375 × 667)
    - [x] 6 other people and the census, `C.lvl`/`C.talent`, `tools/lint-skills.mjs`, docs
- [x] **R2** · Every relationship needs a base (rule 19, order 55): access to a person by the gap in standing, their pride and personality, need and circumstance; knighthood, renown, mastery, fame, wealth and introductions shift it; NPC bonds alike · built: `A.REACH` (`src/people/9999960-reach`, engine `src/people/engine/reach.js`), a decision of the higher man's through `A.WHY`; get to know, the befriending, audience, favour and courting actions, events' close bonds, patrons, a child's great match and circles' newcomers gated (D-080, H-073) · branch `r2` · 2026-11-16
- [x] **G0** · (amended by order 59, D-070: no timetable; concepts, grasp and breakthroughs, §3.16) Growth non-linear: research and a standard (before G): `docs/design/growth-standard.md` (today measured over nine bot lives; the practice curve, quality, teachers, age, trials, disuse, the body by age, a reason for every change; worked lives; tests and budget for G1/G2 and D11+), scripts and chart in `docs/design/growth/` (H-062) · branch `g0` · 2026-11-16
- [ ] **D11** · Military branches (feudal armies, D-012). Stages (war.md §16, with D11+): **D11-1** the muster · **D11-2** units that differ, tailored training, duties · **D11-3** careers
  - [x] **D11-1** · The muster: fifteen branches and ten roles as data (`data/military/`); enlisting as scenes (`md_muster`): the muster-master of the crown's or a lord's command reads weapon, way of fighting, every aptitude, birth, patron and the command's gaps and makes two or three offers with reasons, one `A.WHY.decide` (kind `muster`); the branch fixes troop, arm and command; the lot makes no offers; roles offered by the captain through `A.WHY` (kind `role`), with pay, practice and their own work; one glossary of rank and unit words (R14: `A.MUSTER.post`, `A.milUnitWord`, 9997's places by the five ranks); old saves read a branch from the troop; lint-reasons 42 (D-110 to D-115, H-088) · branch `d11-1` · 2026-11-18
  - [x] **D11-2** · Units that differ: 36 drills and 10 duties as data; each company's make-up, abilities (grades in words, read from the war map; stored only for the player's company) and tendencies (its ledger after every fight, its captain, its men); the syllabus worked out with reasons (lacks, the task, a tendency's remedy, cut by ground and teacher) and the month's drill decided through `A.WHY` (kind `drill`) or picked by the player as captain; support branches in their own support companies; a duty in peace always (`A.WHY` kind `duty`); transfers (kind `transfer`); what a role changes on campaign (morale, wounded, bread, the ledger, sight, river crossings); `A.drillMonth`'s roll a count; lint-reasons 42 → 41 (D-116 to D-121, H-092) · branch `d11-2` · 2026-11-18
  - [x] **D11-3** · Careers: each branch's ladder (what each rank does), key skill and missions as data; a mission's kind the commander's choice through `A.WHY` (kind `mission`), the branch's own work first (a half or more for every branch); promotion weighs the branch's key skill and command; peace service counts (duties as deeds of service, duties done and long service raise the board's hazard, R12); a role's line (kind `role`); pay rebased (W11: a soldier 100 a year); the world's companies' role-holders and drill in aggregate, revising D-120 (measured: about 1 to 1.5 ms a month on CI; −4% men lost a war over four worlds) (D-122 to D-127, H-093) · branch `d11-3` · 2026-11-18
- [x] **D11+** · Military path by weapon, way of fighting and every useful aptitude; training tailored to each unit's make-up · built: each branch's road through the five ranks as data (`data/military/paths.json`): what each rung trains (through `A.gainXp`, bent by talent, said in words), its trial as S1's proof (`pa_trial`), the specialisms by way of fighting (`pa_spec`), the role a rung opens, the board weighing the next rung's wants and the trials stood; the year in the ranks drills the road; units' tailored training was D11-2's (D-128 to D-132, H-095) · branch `d11p` · 2026-11-18
- [x] **S9** · The owner's alpha.9 playtest survey (answered 2026-11-18): findings in `docs/v2/playtest-owner-alpha9.md`; the page https://claude.ai/artifact/P2Yi13TMRBRp3ynrhW6Pjo, answers at `survey/alpha9`
- [ ] **M1** · One fixed continent (order 68, D-142): every life on the same geography from one canonical map seed, chosen by measured quality; the title shows it; saves keep their map. First after alpha.14, its own batch
- [ ] **M2** · The map in extreme depth (order 69, D-143): places of every kind with a reason to be there, every border's state and history, disputes, alliances, trade routes by land, river and sea, and more; M2a a design (with E0's trade), then built in stages; shown by rank and knowledge. Right after M1
- [ ] **T14** · Playtest alpha.14 against the owner's alpha.9 survey (`docs/v2/playtest-owner-alpha9.md`): which findings the work since alpha.9 already answers, in play
- [ ] **Y1** · A year worth living (survey finding 11, the owner: time too slow, "both": the press is slow and too little happens): the press's wait (with X7 part 2, I1-1) and what fills each month and year of a life, from its station, career and people
- [ ] **PA** · Parity (order 67, D-140, D-136): everyone grows by the player's rules and margins; people never met age and die (`x5-deaths`); the world's masters brought down to what their years allow; no promotion or appointment through friendship alone
- [ ] **LC** · Legends and crowns as hard as the world makes them (D-138), and every trial says plainly what its deed is (D-137)
- [ ] **R3** · Relationships that change a life (survey finding 3): kin, friends, rivals and the parish act on you and on each other, for their reasons
- [ ] **E0** · One economy (D-139): every price, wage, pay, rent, upkeep, loot and treasury set against the others from a few anchors
- [ ] **K1** · Cards that know your rank (survey finding 6: a duke forced to kneel) and a writing pass on the cards a noble's and a soldier's life see most (finding 13)
- [ ] **U1** · Honest odds with room for the unexpected (order 66, D-135): upsets from will, circumstance, adaptability and talent, each a named reason on the result and in the after-fight words; the scale stays honest pooled; duels first, then every attempt through the odds engine. Next batch after the current one clears (D-134)
- [ ] **D9** · The inked, detailed map; war fronts that spread like a burn (D-016). *iPhone audit (I1, D-076 point 1): one tile cache for both map layers (today 150 + 140 tiles), one kept view per canvas on screen, freed when it closes; decide the map's pixel ratio*
- [ ] **D12b** · War and command depth. Stages (war.md §16): **D12b-1** hosts on roads (X7 part 2's gate) · **D12b-2** one engine, the field by your eye · **D12b-3** reports and the people you know · **D12b-4** the theatre and the burn · **D12b-5** the press · **D12b-6** sieges and the verbs · **D12b-7** balance, retire, records
- [ ] **X7 part 2** · Phone speed, each press: the engine's month (A.wsDay and the war sim are half a press at year 0), with D12b/X5 (D-023). *iPhone audit (I1, roadmap §7.7, §8 item 9): the map pan draws once per pointer move (`23-ui-c.js:1302`, `23-ui-d.js:1146`), not once a frame; `UI.gmDraw` allocates arrays, objects and closures per draw; load and Next month to the I1-1 budget*
- [ ] **C8d** · ⏸ *Postponed until the owner's image-model key (order 60).* **Gate 1 first (order 57): manhwa profile cards in the owner's reference style, shown before building in;** *(gate 1 drawn and waiting for the owner, H-063, D-068: `docs/design/c8d-gate1.md`, `docs/design/demo-2d/c8d/sheet.png`; not in the game)* (order 56: every design, weapon and garment differs by nation, border and culture, small differences between neighbours to drastic ones between far peoples) Hair in depth; dress and appearance variety compounded (serf / peasant / merchant read right); looks matter in play where it fits
- [ ] **L2** · ⏸ *Postponed until the owner's image-model key (order 60).* Legendaries: mythical names, character and aura; the bow redrawn to be truly legendary
- [ ] **Gaps** · (the visual ones wait for the image-model key, order 60) Every known leftover: "the" before realm forms, lore people's names, tablets' phone shell, missions abroad for cards, U6/U10/U12/U17/U21, 200% text, mourning dress, NPC dress by occasion, jewellery, mounts, interiors (V19), cut-in tone (V11-12). *iPhone audit (I1, roadmap §7.2, §7.6): 58 of 382 controls under 44 points at 375×667 (You 29, Profile 12, Path 6, Holdings 6: description words, chips, stat rows), with a test that holds it at 0; the 57 `:hover` rules inside `@media (hover:hover)`; the bar `width` and the `left` sweep as `transform`*
- [ ] **X4** · Balance pass
- [ ] **X5** · State diet; stop committing index.html every round (D-018). *iPhone audit (I1, `docs/IOS_ROADMAP.md` §7.7): the state is 1.78 MB at year 0 and 4.01 MB at year 50 (people ×2, realms ×2.7, `wrec` 135 KB, `aiLog` 88 KB): cap or compact what grows with years and hold the save size by a test (rule 21: no data that grows forever)*
  - [x] **X5 part 1** · Measured (`tools/bench/state-size.mjs`); the story log's old years and former lives compacted each year and on load (999996-state-diet), the save held by bars at year 0, 50, 100 (D-104, D-105, H-087) · branch `x5` · 2026-11-18. *Left: the unknown never die (D-106, the bulk of people ×2: a death pass for every NPC, for the owner's yes); `S.wrec` kept whole on purpose (D-104 point 4); stop committing `index.html` (a proposal in H-087, for the owner)*
- [ ] **I1** · iPhone App Store route (order 62, rule 21, D-071, D-075, D-076; `docs/IOS_ROADMAP.md`, `.claude/skills/ios-capacitor-release`). Built toward from today; stages I1-3 to I1-7 start on the owner's word, whenever he decides to test it (order 70)
  - [x] **I1-0** · The route researched from today's docs and written: the six facts re-checked, seven stages, the audit against the build rules, the skill (H-065) · branch `ios-route` · 2026-11-16
  - [ ] **I1-1** · Performance: load and Next month inside the iPhone budget at 4 to 6x (title < 3 s, first Life < 6 s, Next month < 1 s); with X7 part 2, X5, D12b-1
  - [~] **I1-2** · iPhone readiness: `viewport-fit=cover`; no selection, callout or bounce; `pointercancel` on the four drags; 50 `vh` to `dvh`; one audio module (one AudioContext, first tap, suspended in the background, `audioSession`); `SAVES.backend` and `UI.store` switches, profile tab's 4 direct `localStorage` calls through `UI.store`, `UI.download`'s native branch (roadmap §8 items 1-3, 6-8)
    - [x] `viewport-fit=cover` · [x] no selection, callout, bounce or double-tap zoom (`touch-action`, no `maximum-scale`) · [x] 49 `vh` to `dvh` with a `vh` fallback · [x] one audio context (`UI.AUDIO`, `src/ui/60-audio-context`) · [x] profile tab's 4 `localStorage` calls through `UI.store` · [x] `UI.download` native hook · [x] two animations to `transform` (the rest listed in the roadmap §7.6) · [x] tap targets: 58 of 382 to 10 of 385 under 44 points, `tapTargets44` · branch `i1-2` (H-074)
    - [ ] left: `pointercancel` on the four map drags (D9); `SAVES.backend` and `UI.store`'s native switch (I1-4); the 57 `:hover` rules into `@media (hover:hover)` (Gaps)
  - [ ] **I1-3** · `www/` build: the one-file page to `app/www/index.html`; the split build only if the iPhone misses the budget (D-075)
  - [ ] **I1-4** · Capacitor shell in `app/` (made on Linux): `capacitor.config.ts`, SPM iOS project, iPhone only, portrait, iOS 17, Info.plist keys, privacy manifest, native audio session, plugins wired (owner: bundle id, name)
  - [ ] **I1-5** · Codemagic signing and TestFlight: `codemagic.yaml`, first green upload, the first-build checklist on a real iPhone (owner: developer account, API key, app record, Codemagic account)
  - [ ] **I1-6** · App Store listing, privacy ("Data Not Collected", a privacy policy page), age rating, screenshots, export compliance (owner answers; agents draft)
  - [ ] **I1-7** · App Review

## v3 · The living world: economy, armoury, growth in depth (`docs/V3_SPEC.md`, owner orders 28-33)

Designed now, built after v2's last item on its own integration branch (D-037).

### Done
- [x] **E1/E2 design** · `docs/design/economy-and-items.md`: one market model, 281 markets, 28 goods, named trading houses and caravans; 845 item kinds in five grades; ~100 unique named pieces; eight build stages · `39e3164` · 2026-11-13 02:45 ET · owner answered (D-032)

### Next, in order
- [x] **G design** · `docs/design/growth.md`: 17 stats, 4,599 skills, ~550 styles, ~2,300 arts, legendary arts; stages G1-G6 · `f1a556d` · 2026-11-13 11:56 ET · revised for order 34 (`e7812cf`) · all decisions settled (D-046)
- [ ] **G** · Growth in depth: more stats, skills learned by doing (8 words, Beginner to Myth), hidden talents, hundreds of arts (sword arts and every weapon's, murim-like) by nation, regiment, house, line and order (orders 32, 34; D-034, D-039)
- [ ] **E1** · A much bigger economy: bigger markets that simulate themselves over time (owner order 28; stages E1a, E1b, E1c, E1d)
- [ ] **E2** · Hundreds of weapons and armour pieces by quality; items unique to one person (owner order 29; stages E2a, E2b, E2c, E2d, interleaved with E1 as the design says)
- [ ] **L1** · Lives without ladders: careers by performance and relations, merchants by fame, influence and wealth; paths worth playing (order 36; design first)
- [ ] **N1** · Noble life in full: gatherings, balls, courtship, disputes, succession fights (order 36; design first)
- [ ] **V3-X** · v3 balance pass and state diet

## Versions
Every finished step is a version: a row in `docs/VERSIONS.md`, a section in `CHANGELOG.md`, a `release/<version>`
branch on GitHub, and a sample save in `tests/saves/`.

| Version | Stamp | What it holds |
|---|---|---|
| v2.0.0-beta.1 | 2026-11-06 15:06 ET | Playtest 2 and CI round 2 fixed (the last version before round 2) |
| v2.1.0-alpha.1 | 2026-11-12 11:20 ET | Round 2 begins: repo by system with a memory, the critique and work order, A0 (lag's main cause and the two-lords crash fixed), name and military prep |
| v2.1.0-alpha.2 | 2026-11-13 01:35 ET | X6 naming pass, A3a coherency net, B4 click-to-open, A1 one redraw a press, B6 Next month or Next year, CI 97-101 fixes |
| v2.1.0-alpha.3 | 2026-11-13 02:40 ET | X1: the release is readable source (`src/core/release/`), all 203 patches baked in, same program |
| v2.1.0-alpha.4 | 2026-11-13 15:01 ET | C8b: the approved character art draws every portrait, face and build maker; B5 part 1: a calmer screen |
| v2.1.0-alpha.5 | 2026-11-14 18:49 ET | v2.1 foundations milestone (`release/v2.1-foundations`): A2 stage 1, P and P2 profile, C9 bodies, X3 part 1, order 52 names, W0 and D10; CI 111 green on `3801932` |
| v2.1.0-alpha.6 | 2026-11-15 04:20 ET | A2 stage 2, X7 part 1, B5 part 2, X2; CI 118 green on `f87617d` |
| v2.1.0-alpha.7 | 2026-11-15 10:33 ET | C6 households and its fixes; CI 121 green on `0e0996a` |
| v2.1.0-alpha.8 | 2026-11-15 15:36 ET | C7 names and cultures and its fixes; CI 124 green on `d5abc55` |
| v2.1.0-alpha.9 | 2026-11-15 21:24 ET | C8c dress, X3 part 2 honest cards, counsel by letter; CI 129 green on `7aee21c` |

## Milestones
- [ ] `release/v2.1-foundations` (after A1, A3a, B6, A2)
- [ ] `release/v2.2-interface` (after B4, B5)
- [ ] `release/v2.3-people` (after C6, C7, C8)
- [ ] `release/v2.4-war` (after D9 to D12)
- [ ] `release/v2.5` (v2 complete: after X4, X5)
- [ ] `release/v3.0-growth` (after G)
- [ ] `release/v3.1-economy` (after E1)
- [ ] `release/v3.2-armoury` (after E2)
