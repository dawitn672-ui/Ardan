# Ardan v2: how each complaint gets fixed

This spec is for Claude Code. It goes with the drop-in modules in `src/` (plain ES modules, no dependencies, seeded and deterministic) and 24 passing tests (`npm test`). A playable demo of everything working together is in `dist/ardan-demo.html`. Every row below names the module and the test that proves it.

## Complaint → fix → proof

| # | Complaint | What changes | Module | Proof |
|---|---|---|---|---|
| 1 | Too many pop-ups; you must click to see a description | Each month's events come as cards, one at a time, with everything on the card (odds in words, consequences). Quiet months show a 2-second toast and no card. Event text is 80 words or fewer. **Round 2, B4 (`docs/DECISIONS.md` D-007) replaces the old rule "never hide a description behind a click":** descriptions now open on click, tap or Enter (a button or an info icon) and close on Esc or a second press; nothing opens on hover, and no description sits in a `title=`. An activity opens a sheet before it commits. The cards still carry what is needed to decide. | `game.js nextMonth`, `ui/app.js showCard/toast`; round 2: `src/ui/59-descriptions`, `src/ui/99998-click-open` | Playwright pass: a quiet month opens no dialog; round 2: `clickNoHover`, `clickOpens`, `clickLint`, `clickActSheet` |
| 2 | Interface is cluttered | Five places at most: Life, You, Family, World, and War only while at war. One button. | `ui/` | Screenshots at 420 px |
| 3 | Remove the greater continent | Delete the Far Lands / Great Continent map layer and its realms from the playable world. Keep the Codex lore as rumour only, never as playable map. | integration step | No realm or province outside the one continent |
| 4 | The continent looks drawn and lands don't connect | Procedural plates, erosion, climate and rivers. **One connected landmass is guaranteed**, with sea all around. Satellite-style rendering with zoom detail and cloud drift. | `map/continent.js`, `map/render.js` | `one continent…`, `no land touches the map frame` |
| 5 | Alliances are static; relations are shown wrongly ("rivals but married"; "mother has a mutual friend who is my father") | Relations are sums of named reasons that change every month (incidents, favours, common threats, marriages, new rulers). Status is derived from all the parts, so marriage + feud reads "uneasy marriage alliance". One relation-label resolver with strict priority: spouse > blood > in-law > feudal > bond. | `diplomacy.js`, `kin.js relationLabel` | `marriage plus feud…`, `a parent is never "a mutual friend"`, `diplomacy is alive…` |
| 6 | Study the best motion, UI, colour and map design | Researched BitLife's loop, CK3's tooltips and relations, Disco Elysium's checks, Dwarf Fortress's descriptors, KCD's learn-by-doing, Lanchester combat and Azgaar/mewo2 terrain. Captured in 3 skills. | `.claude/skills/*` | |
| 7 | Forced "chapter one" for piety | No scripted chapters. Events only offer. Faith appears only for the clergy-born or for a player who takes it up. | `events.js` (`faith-call`, `seek-faith`) | game test: no chapters, `me.faith` undefined by default |
| 8 | Remove Play and sim-a-week | Two buttons in fixed places, **Next month** and **Next year** (round 2 B6, `docs/DECISIONS.md` D-008, D-019, D-026; this replaces the old "only Next month"). A year runs month by month, with one redraw and one digest at the end, and stops early, saying why in one line, only for what is notable: a card that needs a real answer (not talk or the day's small happenings, which wait for the end of the step), a battle or a call to war, an illness or a wound, a death or a birth in the household, coming of age, a deadline. Neither button ever becomes a stop control (Esc ends a year at its month's end). Childhood defaults to Next year. No initiative pool or cap; overtraining has its own consequences. In war, **Next day** and **Next week** with standing orders; battles run phase by phase. | `game.js`, `war.js campaignStep`; round 2: `src/core/99992-v2-time`, `src/ui/999995-next-year` | game test: `play` and `simWeek` don't exist; round 2: `nyButtons`, `nyYearSameWorld`, `nyEarlyStops`, `nySmallMattersWait`, `nyChildhood`, `nyNoInitiative`, `nyOvertraining` |
| 9 | Few elite orders, as strong as forces tens of times larger | 5 orders of 150–350 sworn members, each worth 14–26 levies, plus terror. Joining takes 3 trials. | `orders.js`, `war.js` | `elite orders fight like forces tens of times their size` |
| 10 | You can see wars you're not in; months fly by spectating | You get no view of a war you're not in, only delayed and sometimes wrong rumour. When you're in one, you play your rank: soldier, sergeant, captain or commander. Odds are rated against the unit or commander you actually face. Soldiers see only estimates. An after-action report gives the top 3 causes. | `war.js` | `player choices move battle results at every rank`, `after-action…outsiders only get rumours` |
| 11 | Stats are unclear (22/100), height never grows | Real units with comparisons: lift in kg ("a big hog"), sprint m/s, march km/day, reaction ms, toughness in blows. Height follows WHO growth curves from birth; strength rises, peaks and declines. Minds are words plus "1 in N" rarity. Skills are named tiers with hours practised. | `body.js`, `races.js` | `height grows…`, `strength grows…`, `descriptions are concrete words` |
| 12 | Races treated the same; humans must be able to beat giants | Races have distinct bodies (square-cube giants, orcs about 2.2× human lift). Ardan's human ceiling sits far above Earth's, reachable only through **breakthroughs**. Fighting worth is measured in levies: a giant is about 20 and an order knight 15–25, so a human at Master tier with lift around 500 kg stands level with a giant. | `races.js`, `body.js fightingWorth` | `races differ…`, `fighting worth calibration`, `breakthroughs raise the ceiling` |
| 13 | Too few nobles | Per realm: at most 3 dukes; at most 6 marquises (2–3 per duke, on the borders); one count per county; 2–3 viscounts per count; 2–4 barons per viscount; 3–6 lords per baron. Lower tiers are generated on demand. A 30-county realm has about 1,000 nobles. | `nobility.js` | `noble pyramid: caps hold…` |
| 14 | Succession and family lines unclear; you can pick heir or bastard | You can no longer pick a birth position. A three-generation family is generated with uncles, aunts and cousins, plus their offices and heir claims. The line follows house law (male-preference, absolute, agnatic, seniority, elective) and an optional "pass over the unfit" rule. One holder per title. | `world.js createPlayerFamily`, `kin.js`, `succession.js` | `kinship terms are exact`, `notable kin…`, `succession follows the house law`, `one holder per title…(30 seeds)` |
| 15 | Fame and promotion are linear | Deeds are weighted by the odds beaten and by the witnesses. Renown is dominated by your best deeds. Promotion is a monthly chance driven by vacancies, standout deeds and patrons, and a great deed can skip a rank. | `renown.js` | `renown: one great deed…; promotion is not linear` (requires CV > 0.6) |
| 16 | Combat lacks detail; too many percentages; no room for stupidity or will | Odds are shown as words plus a tipped scale. Outcomes include **blunders** (low judgment, fatigue, overconfidence) and **surges** (will, stakes, desperation). A surge win against long odds becomes a breakthrough. | `odds.js` | `odds: favourites usually win, but blunder…`, `poor judgment blunders more; strong will surges more` |

## Integration plan for the main Ardan repo (in order)
1. **Copy the modules.** Put `src/*` under `src/v2/` in the Ardan repo and the tests under `tests/v2/`. Add them to the existing test runner, so a failure blocks a release (Road to Ten, Technical step 5).
2. **Map.**
   - Replace the generated or drawn map with `generateContinent` + `renderMap`.
   - Delete the Great Continent / Far Lands layer from play (complaint 3) and map Ardan's existing realms onto `makeRealms` output. Keep realm identities from the Codex, but let the map decide the borders.
   - Draw rivers and borders as canvas vectors. Render zoomed regions with `opts.region` and a higher `scale`.
3. **Time.**
   - Remove the Play button, speed controls and "sim a week" (round 2 B6: the two buttons are Next month and Next year).
   - Route the main loop through `nextMonth()`. Show `cards` one at a time and treat `quiet` as a toast.
   - Map existing events onto the card format (`text`, `choices[{label, check, fx}]`). Run the 80-word text check that already exists.
4. **Stats.**
   - Migrate the old 0–100 stats once, by percentile, onto genes, conditioning and practice hours, and drop the old fields.
   - Remove piety as a universal stat. Keep `faith` only for the devout or clergy.
   - Point every check in the 3,199 events at `attempt()` and every fight at `fightingWorth` (this also closes Road to Ten "Power scaling").
5. **Family and succession.**
   - Generate the player's family with `createPlayerFamily` and delete the birth-position picker.
   - Compute all relation text through `relationLabel`. Search the event text for "mutual friend" and gate it with `canCallMutualFriend`.
   - Store `house.seat` and move titles only in `inherit()`.
6. **Nobility.** Build realm courts from `buildHierarchy`. Create named nobles for dukes, marquises and counts, and use `lowerNoble()` for everyone below.
7. **Diplomacy.** Replace the treaty dice with `monthTick`. Show "Drawing together / Pulling apart" lists. Filter world news through `newsFor`.
8. **War.**
   - Remove spectating. Wars the player isn't in produce only `rumourOfBattle`.
   - The player's rank sets the screen: soldier and sergeant choices, the captain's company tactic, the commander's army tactic and reserve.
   - Keep the existing division simulator for commanders and wire `battlePhase` in for the personal and company layers.
9. **Saves.** Add the new fields (genes, body, memories, deeds, flags, the diplomacy factor maps) to the versioned IndexedDB save, with a migration step.
10. **Playtest loop.** After each step, run the `game-ux-playtest-loop` skill: a scripted pass, then a playtester agent working from the complaint list, then fixes and regression tests.

## Not done yet (honest gaps)
- **Visual realism beyond the map.** Animated, detailed portraits and scenes need an art pipeline: layered painted portraits that age, plus event illustrations. That is a hired illustrator or an image pipeline, and it is Road to Ten Phase 5.
- **Event volume.** The demo has 18 events. The main game's 3,199 events need migrating and pruning (Road to Ten "Events").
- **Diplomacy depth.** Wars move no provinces in the demo, and the allies of a realm at war aren't pulled in yet.
- **Commander layer.** It uses the 4-phase battle. Hook it to the existing 200-division simulator for campaigns with several armies.
- **Real players.** Bots and agents checked the numbers and the complaints; only 5 real new players can confirm the feel.
