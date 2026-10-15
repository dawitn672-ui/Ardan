# Road to Ten: status of every step

Oct 15, 2026 · checked against `index.html` (32 features, counting the fix layer) and the measured `reports/scorecard.md`

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
| World and lore | 7 | 2 | 1 | 3 | 1 |
| Power scaling | 7 | 2 | 4 | 1 | 0 |
| Character and life sim | 7 | 2 | 3 | 2 | 0 |
| Events and story | 7 | 2 | 3 | 2 | 0 |
| Relationships | 7 | 5 | 2 | 0 | 0 |
| War | 7 | 5 | 1 | 1 | 0 |
| Diplomacy and politics | 6 | 2 | 4 | 0 | 0 |
| Economy | 7 | 0 | 2 | 5 | 0 |
| Balance | 6 | 3 | 2 | 0 | 1 |
| UI and UX | 8 | 5 | 2 | 0 | 1 |
| Visual art | 7 | 0 | 0 | 0 | 7 |
| Technical | 7 | 6 | 1 | 0 | 0 |
| Replayability | 6 | 2 | 3 | 1 | 0 |
| Uniqueness | 5 | 2 | 2 | 1 | 0 |
| **All** | **94** | **38** | **30** | **16** | **10** |

That is 40% done and 32% partial. 17% is not started but buildable here, and 11% can only be done by people or art. The first audit, the same morning, counted 19 done and 39 not started (it also miscounted Events, which had 3 partial steps, not 4).

## World and lore

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Realm bible per realm (want, fear, 3 customs, place) as data | ✗ | No realm has the fields |
| 2 | Every custom becomes an engine rule (~100) | ✗ | Only the base legal traditions exist (8 cover 25 realms) |
| 3 | Break the Europe mirror for 6 realms | 🎨 | Needs a writer, and ideally a conlanger |
| 4 | Codex fills only with what you have learned (rumor or truth) | ✅ | 26-belief-truth: each beast is unknown, heard, seen or known, and the bestiary shows only that; secrets show the accepted story until you find the truth (a new peasant knows 22 of 64 beasts by tale, 0 truths) |
| 5 | A living world chronicle that NPCs and events cite | ◐ | `S.history` keeps only war ends and falls; the Chronicle (22) writes your life; far news is hearsay, corrected later (26); events still don't cite the world record |
| 6 | 3–5 local events per realm | ✅ | Base: 623 realm-gated events, 13–36 per realm |
| 7 | Culture naming rules and words in titles and events | ✗ | 17 of 468 culture words appear in any event |

## Power scaling

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Audit every event fight against the ladder | ✗ | Not done |
| 2 | Life-or-death fights go through the duel or skirmish resolver | ◐ | 6 event choices use the group resolver; about 400 kill or maim outcomes are plain checks |
| 3 | Group-fight resolver on tier math | ◐ | Base `A.groupFightPC` exists; it isn't used for ambushes or hunts |
| 4 | Wounds tied to scale (a lost hand drops tier) | ◐ | Wounds change stats, so worth falls; no explicit tier drop; scars show on the profile |
| 5 | Show the math (tiers, win chance, worth parts) | ◐ | Base worth tooltip; odds made honest (24-honest-odds); no "Measure" panel on fight screens |
| 6 | Lock the tier odds with a test | ✅ | `honestOdds` test plus the bench `duels` module (gap 4 points) |
| 7 | Cap the ladder (about 12 Legends, 5 Masters per realm) | ✅ | 32-ladder: a census, a Master cap per realm (order leaders in a full realm come out Elite), the living ladder in the Codex; the lore's 5 Legends are kept inside the plan's bound. Two 40-year worlds peak at 2 Legends and 1 Master in a realm: the ladder is sparse, not crowded |

## Character and life sim

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Merge about 9–12 systems into 4 | ✗ | Not started (a large refactor of minified code; needs the source) |
| 2 | Learn by doing; monthly summary of gains | ✅ | 31-learn-by-doing: every gain tagged practice or use; use ×1.2, practice ×0.4, a failed check teaches 1.5× a passed one; a monthly summary. Growth from doing 44–49% → 67–73% with the same total for a passive life (an engaged one grows 25% faster) |
| 3 | Needs and moods that start events | ✅ | 35-moods: four needs (rest, company, purpose, comfort) that drift toward what your life gives you; the lowest sets a mood with its cause, the mood moves happiness, and 14 scenes start from moods. Bot lives spend about 9% of months in a low mood |
| 4 | Health as a body (parts, long illness, treatment choices) | ◐ | Wounds and 7 diseases; no body parts or treatment tradeoffs |
| 5 | Personality changes from what you do, and shows why | ◐ | 372 events add traits; no reason shown; trait count uncapped |
| 6 | Each life stage has its own play (2–3 actions only it has) | ◐ | Child and teen events exist; old age has 49 events and no actions of its own; infants were offered court actions (fixed) |
| 7 | Cut dead numbers | ✗ | Not audited |

## Events and story

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Cut 30–40% of events | ✗ | Not done (the strict recipe share is 22.6%) |
| 2 | Memories; 40% of events refer to one | ◐ | 3% → **15.8%** of events, and 8.4% of fired events (40-memory-*, 471 events); 139 flags still unread |
| 3 | 60 long arcs of 3–8 stages | ◐ | Dozens of 2-step arcs in the memory chunks; no 3–8 stage arcs |
| 4 | Every arc ends with a lasting change | ◐ | Memory callbacks leave marks; no arc system |
| 5 | Variety guard: no repeat within 10 years, no same shape back to back | ✅ | 25-variety-guard: 10-year default cooldown, 24 shapes, recency for pools and NPC moves. A/B in the full build: rolled repeats 0.3% → 0%, same shape back to back 4.6% → 3.0%, three in a row 2 → 0, NPC move repeats 38% → 16% |
| 6 | Culture event voice; NPC lines match personality | ✗ | Not started |
| 7 | Event checklist; a bot flags events with an obviously best choice | ✅ | `tools/lint-choices.mjs` (33-choices): 19 events had one (16 release, 3 of our own), all fixed; CI fails any new one |

## Relationships and people

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Every named NPC has a goal and a fear | ✅ | Base cast data, now driving behavior (21-npc-initiative reads wants and fears) |
| 2 | NPCs act every month (1–3 moves a year) | ✅ | 21-npc-initiative: 9.8 moves per decade, capped at 3 a year |
| 3 | Schemes both ways (sway, befriend, seduce, slander, murder) | ✅ | 39-schemes: five plots that grow each month by your skills, theirs and the friends who hate them, with an opening halfway, a last move, and a 2–6% chance a month of being found out. The people who hate you plot slanders and murders against you; you may notice, unmask them and answer. Four bot lives met 5 such scenes in 64 years, inside the shared NPC budget |
| 4 | Shared history per bond | ◐ | `rel.hist` from NPC moves and interactions; doesn't yet move opinion by itself or appear in events |
| 5 | Secrets and leverage | ◐ | The 71 lore secrets can now be found (26-belief-truth: 7 reveal scenes, rationed one in eight years) and are shown truth against story; no personal secrets, no leverage |
| 6 | Groups and cliques | ✅ | 41-circles: a new acquaintance is often already close to someone you know, so the share of the people you know who are close to someone else you know goes from 0% to 35%; a friend of your foe starts 12 cooler (a friend of your friend 8 warmer), and the person view says why; a great harm reaches the victim's friends at a third of its weight; cliques of three in the unit or the street that you can join or lead |
| 7 | "Get to know" as a 2–3 choice scene | ✅ | 30-get-to-know: a scene with four approaches; the person's traits move each one's odds by 12 points a trait (asking a gregarious person 36%, a shy one 4%); insight reads them first |

## War

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Every rank has battle choices that move the result 10–20% | ✗ | Ranks 4–6 get a fixed nudge |
| 2 | After-action report with the 3 biggest causes | ✅ | 23-after-action: line battles and war-map fights; causes in kill-equivalents, calibrated against counterfactuals (forest cost said 68 kills, measured 67); on the battle screen, the story log and the war views |
| 3 | AI general personalities and order letters | ✅ | 38-orders: a temper from the general's traits (bold, cautious, cunning, steady) moves four dials of the AI army; over the same pooled wars a bold side made 6–28% more assaults than a steady one in each of three builds; cautious and cunning sit within the noise of a chaotic war. The war room shows each army's temper and plan. A soldier gets the plan as a letter, and sixty days on the map decides whether obeying or ignoring it was right |
| 4 | Drill linked to battle tactics | ◐ | The report now names what drill and tactics did (a pike hedge against lances +27%, "Drill and kit"); tactic choice is still not gated by drill |
| 5 | Playable sieges | ✅ | 36-sieges: a choice each month from either side of the wall (mine, storm, hold the ring, latrines; ration, sortie, smuggled food, terms), camp sickness that thins the besiegers, and the sack or the terms at the end. The choices move a 40-day siege by 3 to 12 days |
| 6 | Small-unit missions with named men | ✅ | Base: the missions and a named squad who can die (the first audit missed this). 37-squad: survivors learn, earn a standing (seasoned, veteran, old hand) and carry the odds (+8 points with old hands) |
| 7 | A 200-division tick under 50 ms | ✅ | Bench `perf.warTick`: 212 divisions in six wars, 9.4 ms at the 95th percentile, 18 ms at worst |

## Diplomacy and politics

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Ruler personality drives the AI; decisions logged with reasons | ✅ | 20-ai-personality: warlike to peaceful war ratio 0.9× → 2.4× pooled over 12 worlds (one world reads anywhere from 1.5× to 6×) |
| 2 | The court is made of people | ◐ | Base councils and houses are named NPCs; the persona applies to rulers and claimants |
| 3 | Inside the realm: laws, taxes, vassals, succession fights | ◐ | Base laws, factions and claimant wars; AI civil wars now persona-driven |
| 4 | Show "why" on every offer | ✅ | 20-ai-personality: the real factors on treaties, peace and offers |
| 5 | AI gold gets used; the hoarding flag reads 0 | ◐ | Hoarding is 0 and debt is repaid (04-world-fixes); surplus is still deleted, not spent |
| 6 | Long memories: grudges and debts across generations | ◐ | Base decaying relation memories; nothing generational |

## Economy

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Production per province | ✗ | |
| 2 | Demand from people and armies | ✗ | |
| 3 | NPC merchants and caravans | ✗ | |
| 4 | More markets with distance pricing | ✗ | One market per realm |
| 5 | Production chains | ✗ | |
| 6 | Money sinks | ◐ | Debt repayment; idle merc pay removed; still no upkeep or ransoms for the player |
| 7 | Exploit test | ◐ | The buy/sell-back loop is closed and tested; trade-run loops are untested |

## Balance and difficulty

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Target numbers per path | ✅ | `bench/targets.mjs`: six starting paths, each with bands for age at death, peak wealth, peak fame and notable lives (plus freedom for serfs), and notes where the game sits somewhere the designers may not want |
| 2 | Nightly bot league (1,000 lives × 4 personalities) | ◐ | `bench/` league: 64 lives × 4 personalities, engaged and passive. `bench/balance.mjs`: 48 lives per path (8 per path, on two pages), run by CI on every push. Not 1,000, not nightly |
| 3 | Fail the build on drift | ✅ | `bench/balance.mjs`: a fixed-seed league of 24 lives in CI (`tools/check.mjs`); the build fails when a path leaves its band |
| 4 | Difficulty changes information and recovery | ✅ | 42-difficulty: Story always shows each choice's odds as a number, Realism only in words, Hard as the player sets it; the year's healing (Story 52, Hard 35, Realism 24 from 20 health), a timed wound (2, 4, 6 years) and a prison sentence (2, 4, 5 years of four) scale with the setting. Hard is the release's, so the league is unchanged |
| 5 | 20 human playthroughs per phase | 👥 | |
| 6 | Hunt dominant strategies | ◐ | The buy/sell loop was found and fixed; no systematic search |

## UI and UX

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Six tabs | ✅ | Base (Phase 1) |
| 2 | Nested tooltips on every number | ◐ | Five kinds; the profile's other numbers have none |
| 3 | What now panel | ✅ | Base |
| 4 | Teach by doing | ✅ | Base: 12 hints |
| 5 | Text diet | ✅ | Base plus 02-content-fixes; the linter enforces it for new events |
| 6 | Mobile design | ◐ | Base bottom bar; adult actions still shown to children (they refuse) |
| 7 | Accessibility | ✅ | 05-saves-ui keyboard plus 27-accessibility: WCAG 2.2 AA with 0 axe violations |
| 8 | Usability tests with 5 new players | 👥 | Playtest mode is ready; no players yet |

## Visual art

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Style guide | 🎨 | |
| 2 | Layered ink portraits | 🎨 | A newborn is still drawn as an adult |
| 3 | Redrawn map | 🎨 | |
| 4 | Banners for unit boxes | 🎨 | |
| 5 | 60–100 woodcut scenes | 🎨 | |
| 6 | Small motion | 🎨 | |
| 7 | Sound | 🎨 | |

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
| 3 | Vary the world each run | ◐ | Base: 13 scripted branches of history rolled at the start and played out in the first year. 43-varied-worlds: a menu game also varies fortunes, moves 2–4 borders by an older war (the loser still claims them), starts up to two feuds and breaks up to three alliances; ten seeds give ten different maps. No new realms are generated |
| 4 | A mid-game and late game per path | ✗ | |
| 5 | Export a readable history of the family and world | ◐ | The Chronicle (22) exports every life of the save, with each ending and the tale as told (26, 28); no world legends |
| 6 | Load events and realms from data files | ◐ | Developers can add features and events here; players can't |

## Uniqueness

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Name the core in one line | ✅ | `docs/north-star` |
| 2 | Signature 1: the Chronicle | ✅ | 22-chronicle: chapters in a chronicler's voice, exportable (more to do: corrections, a period voice for every line) |
| 3 | Signature 2: belief versus truth everywhere | ◐ | 26-belief-truth: beasts, secrets, far news and your own legend; NPCs don't yet hold beliefs of their own, so not "everywhere" |
| 4 | Signature 3: both scales at once | ◐ | 34-both-scales: after every war-map fight you were in, three panels (what you saw, the front, what the chronicle will say) that disagree; registered. In-fight choices at every rank (War 1) are still the release's |
| 5 | Cut what dilutes the core | ✗ | |

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
| 38-orders | War 3 ✅ | Generals have a temper from their traits, and it moves how their army fights: how good the odds must be, how many divisions go at once, how rested they must be, and whether it hunts the undefended. The war room shows each army's temper and plan. A soldier gets the plan as a letter, and the map settles it sixty days later: credit, blame, a reckoning, or being proved right. |
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
