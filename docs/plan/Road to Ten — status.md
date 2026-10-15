# Road to Ten: status of every step

Oct 15, 2026 · checked against `index.html` (19 features) and the measured `reports/scorecard.md`

Each of the plan's 94 steps is marked:

- ✅ **done**: built, and covered by a test or a measurement;
- ◐ **partial**: some of it exists, and the note says what is missing;
- ✗ **not started**;
- 👥 **needs people**: playtests or a panel;
- 🎨 **needs art**: an illustrator, a composer or a conlanger.

"Base" means the release already had it.

## Summary

These counts are from Oct 15. The tables below are kept current; see "Round 3 changes" at the end for what has moved since.

| Aspect | Steps | ✅ | ◐ | ✗ | 👥/🎨 |
| --- | --- | --- | --- | --- | --- |
| World and lore | 7 | 1 | 1 | 4 | 1 |
| Power scaling | 7 | 1 | 4 | 2 | 0 |
| Character and life sim | 7 | 0 | 3 | 4 | 0 |
| Events and story | 7 | 0 | 4 | 3 | 0 |
| Relationships | 7 | 2 | 1 | 4 | 0 |
| War | 7 | 0 | 0 | 7 | 0 |
| Diplomacy and politics | 6 | 2 | 4 | 0 | 0 |
| Economy | 7 | 0 | 2 | 5 | 0 |
| Balance | 6 | 0 | 2 | 3 | 1 |
| UI and UX | 8 | 5 | 2 | 0 | 1 |
| Visual art | 7 | 0 | 0 | 0 | 7 |
| Technical | 7 | 6 | 1 | 0 | 0 |
| Replayability | 6 | 0 | 2 | 4 | 0 |
| Uniqueness | 5 | 2 | 0 | 3 | 0 |
| **All** | **94** | **19** | **26** | **39** | **10** |

That is 20% done and 28% partial. 41% is not started but buildable here, and 11% can only be done by people or art.

## World and lore

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Realm bible per realm (want, fear, 3 customs, place) as data | ✗ | No realm has the fields |
| 2 | Every custom becomes an engine rule (~100) | ✗ | Only the base legal traditions exist (8 cover 25 realms) |
| 3 | Break the Europe mirror for 6 realms | 🎨 | Needs a writer, and ideally a conlanger |
| 4 | Codex fills only with what you have learned (rumor or truth) | ✗ | All 64 bestiary entries show belief and truth at birth |
| 5 | A living world chronicle that NPCs and events cite | ◐ | `S.history` keeps only war ends and falls; the Chronicle (22) writes your life, but events don't cite it |
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
| 7 | Cap the ladder (about 12 Legends, 5 Masters per realm) | ✗ | Base caps Legends at 5 (`GD.LEGEND_CAP`), which disagrees with the plan's 12; no census test |

## Character and life sim

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Merge about 9–12 systems into 4 | ✗ | Not started (a large refactor of minified code; needs the source) |
| 2 | Learn by doing; monthly summary of gains | ✗ | Training gives about 31 points a year, doing about 1.5 per check; no summary |
| 3 | Needs and moods that start events | ✗ | Only `happy` |
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
| 5 | Variety guard: no repeat within 10 years, no same shape back to back | ✗ | Default cooldown is 6 years; no shape guard |
| 6 | Culture event voice; NPC lines match personality | ✗ | Not started |
| 7 | Event checklist; a bot flags events with an obviously best choice | ✗ | Lint covers shape, length and tokens, not "obviously best" |

## Relationships and people

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Every named NPC has a goal and a fear | ✅ | Base cast data, now driving behavior (21-npc-initiative reads wants and fears) |
| 2 | NPCs act every month (1–3 moves a year) | ✅ | 21-npc-initiative: 9.8 moves per decade, capped at 3 a year |
| 3 | Schemes both ways (sway, befriend, seduce, slander, murder) | ✗ | Not started |
| 4 | Shared history per bond | ◐ | `rel.hist` from NPC moves and interactions; doesn't yet move opinion by itself or appear in events |
| 5 | Secrets and leverage | ✗ | Base has 71 lore secrets; there are no personal secrets |
| 6 | Groups and cliques | ✗ | Not started |
| 7 | "Get to know" as a 2–3 choice scene | ✗ | Still one dice roll (`A.getToKnow`) |

## War

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Every rank has battle choices that move the result 10–20% | ✗ | Ranks 4–6 get a fixed nudge |
| 2 | After-action report with the 3 biggest causes | ✗ | The spec was written; the build was cut by the usage limit |
| 3 | AI general personalities and order letters | ✗ | |
| 4 | Drill linked to battle tactics | ✗ | |
| 5 | Playable sieges | ✗ | Sieges are a day counter |
| 6 | Small-unit missions with named men | ✗ | Base missions exist without persistent named men |
| 7 | A 200-division tick under 50 ms | ✗ | Not measured per tick (a year with about 210 divisions takes 229 ms of sim) |

## Diplomacy and politics

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Ruler personality drives the AI; decisions logged with reasons | ✅ | 20-ai-personality: warlike to peaceful war ratio 1.3× → 5.3× |
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
| 1 | Target numbers per path | ✗ | No targets file |
| 2 | Nightly bot league (1,000 lives × 4 personalities) | ◐ | `bench/` league: 64 lives × 4 personalities, engaged and passive; not per path, not nightly |
| 3 | Fail the build on drift | ✗ | CI runs tests, not balance targets |
| 4 | Difficulty changes information and recovery | ✗ | |
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
| 5 | Every test on every change | ✅ | 41 browser tests, the event linter and CI on every push |
| 6 | Replayable runs | ✅ | Base journal, plus render-purity fixes; replay now holds with the UI in use (01-replay) |
| 7 | Report a problem | ✅ | Base, plus a fix for reports from restarted journals |

## Replayability

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | 20 hand-made starting stories | ✗ | |
| 2 | Different endings with epilogues | ✗ | |
| 3 | Vary the world each run | ✗ | |
| 4 | A mid-game and late game per path | ✗ | |
| 5 | Export a readable history of the family and world | ◐ | The Chronicle (22) exports a life; no dynasty or world legends |
| 6 | Load events and realms from data files | ◐ | Developers can add features and events here; players can't |

## Uniqueness

| # | Step | Status | Evidence or gap |
| --- | --- | --- | --- |
| 1 | Name the core in one line | ✅ | `docs/north-star` |
| 2 | Signature 1: the Chronicle | ✅ | 22-chronicle: chapters in a chronicler's voice, exportable (more to do: corrections, a period voice for every line) |
| 3 | Signature 2: belief versus truth everywhere | ✗ | |
| 4 | Signature 3: both scales at once | ✗ | |
| 5 | Cut what dilutes the core | ✗ | |
