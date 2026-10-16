# Ardan

*Bloodlines & Banners* — a life simulation and grand strategy game in the world of Ardan, 1105 AR. One HTML file, no server.

**Play:** open `index.html` in a recent Chrome, Edge, Firefox or Safari.

## How this repo works

The game's original source is not here. What is here is the shipped release (`vendor/`), and on top of it a set of **features**: each one a folder that patches the release, adds readable code or events, and brings its own tests. `tools/build.mjs` applies them in order and writes `index.html`.

```
index.html                  the game: release + every feature
vendor/                     the untouched release build b593143
features/NN-name/           one unit of change each
  patches.mjs               exact edits to the minified code, each with a "why"
  *.core.js                 new engine/UI code, appended to the core
  *.events.js               new events, appended as content packs
  test.mjs                  browser tests for this feature
  README.md                 what it does, which aspect it serves, how it is measured
tools/                      build, pack/unpack, function viewer, event linter
tests/                      test runner, shared helpers, whole-game suites
bench/                      measurement harnesses (bot league, duels, pacing...) -> reports/
reports/                    generated scorecards
docs/plan/                  the Road to Ten
docs/reviews/               the deep analysis and the Road to 100 review
docs/benchmarks/            how Ardan compares with the best-designed games, aspect by aspect
docs/north-star/            what Ardan looks like with unlimited time and resources
CLAUDE.md                   working rules for anyone (human or agent) changing the game
```

`features/00-` to `09-` are fixes and are always built. Higher numbers are new systems and content.

## What is in the build

| Feature | Aspect | What it does |
| --- | --- | --- |
| `00-security` | Technical | A Content-Security-Policy and a sanitizer for loaded saves; a crafted save can no longer run script |
| `01-replay` | Technical | Looking at the screen never changes the world; journals replay exactly |
| `02-content-fixes` | Events | Digit tokens filled (39 events), dropped events restored, text-diet misses |
| `03-engine-fixes` | Character | Opposite traits, duel bugs, a training plan that follows the life, newborns at court, gendered titles |
| `04-world-fixes` | Economy, Diplomacy, War | Idle mercenary pay, stacking reparations, AI debt repaid, stability floor, siege resets, a money loop |
| `05-saves-ui` | UI, Technical | Failed saves warn, one tab saves at a time, a new life asks first, keyboard reach and focus |
| `20-ai-personality` | Diplomacy | Ruler traits drive war, alliances, peace and tribute; every decision logged with its reasons |
| `21-npc-initiative` | Relationships | People you know act first: requests, offers, hostile moves, gifts; a history per bond |
| `22-chronicle` | Uniqueness | "The Book": your life written as chapters in a chronicler's voice, exportable |
| `23-after-action` | War | Every battle ends with its three biggest causes ("numbers +40%, the fog −4%"), calibrated against counterfactuals |
| `24-honest-odds` | Power scaling | Duel odds on screen fitted to 2,100 real duels |
| `25-variety-guard` | Events | No event again within 10 years; no two of the same shape back to back; pools and NPC moves prefer what you haven't seen |
| `26-belief-truth` | Uniqueness, World | Signature 2: you know beasts and secrets only as far as you learned them; far news is hearsay, corrected later; your legend grows in the telling |
| `27-accessibility` | UI | WCAG 2.2 AA clean across 24 screens (axe) |
| `28-endings` | Replayability | 20 named endings and 9 manners of death, an epilogue of what became of them, a collection |
| `29-starts` | Replayability | 20 hand-made starting stories, each with an opening scene and a callback years later |
| `30-get-to-know` | Relationships | A first meeting is a scene: four approaches, odds set by the person's traits, read in advance by a sharp eye |
| `31-learn-by-doing` | Character | Using a skill teaches more than drilling it, a failure more than a success; a monthly summary of what you gained |
| `32-ladder` | Power scaling | A census of the living Legends and Masters, a Master cap per realm, the living ladder in the Codex |
| `33-choices` | Events | 19 events where one choice beat the rest on every count, fixed; `tools/lint-choices.mjs` keeps it so |
| `34-both-scales` | Uniqueness | Signature 3: after a war-map fight, what you saw, the front, and what the chronicle will say, side by side |
| `35-moods` | Character | Four needs (rest, company, purpose, comfort) that drift toward what your life gives you, a mood that reads them, and 14 scenes |
| `36-sieges` | War | Sieges you play: a choice a month from either side of the wall, camp sickness, and the sack or the terms at the end |
| `37-squad` | War | Your named men learn on missions, earn a standing (seasoned, veteran, old hand) and carry the odds; you see their record |
| `38-orders` | War | Generals with a temper (bold, cautious, cunning) that changes how their army fights, a plan the war room shows, and orders by letter that the map judges sixty days later |
| `39-schemes` | Relationships | Plots that run for months (sway, befriend, seduce, slander, murder) with a risk of being found out, and enemies who plot against you |
| `41-circles` | Relationships | Friend circles that form as you meet people, first impressions that follow them, word that gets around, and cliques you can join |
| `42-difficulty` | Balance | Story, Hard and Realism change the odds you see and how fast wounds, illness and prison pass, not only how often you die |
| `43-varied-worlds` | Replayability | A menu game starts in a varied world: fortunes, borders moved by older wars, feuds and broken alliances differ each run |
| `44-rank-battles` | War | A soldier's line battle and an officer's tactical battle now move the war-map fight they belong to: 12 and 19 points of win rate, best against worst |
| `45-economy` | Economy | Goods made by the land, eaten by people and armies, carried by caravans; prices follow stocks, a famine triples bread, and the best trade loop no longer beats a farm |
| `46-life-arcs` | Replayability | A middle-years undertaking and a last-years legacy for each path, scenes years apart whose choices carry forward; shown on the Life tab |
| `47-realm-bible` | World | Each realm's want, fear, place and three customs; 102 customs the engine keeps (dues, rites, estates, weddings, naming, levies, wards), met first as a scene to keep or defy; words for every culture |
| `48-fight-ladder` | Power | Every event fight audited against the ladder; 185 fight choices roll on fighting worth with honest odds, group fights on tier math, wounds that drop tiers, the math shown |
| `49-body-mind` | Character | Wounds by body part, illness over months with treatment choices, traits earned by deeds with reasons, actions of each life stage, dead numbers folded; risky activities refused when hurt |
| `50-arcs-kin` | Events | 13 family story arcs of 3–6 stages over years (a secret child, a blood feud, an heir's fall) |
| `51-arcs-rivals` | Events | 13 arcs of rivals and ambition (a rival's rise, an apprentice who passes you, a moneylender), with the same people from first scene to last |
| `52-arcs-world` | Events | 13 arcs of the world's troubles (plague, flood, siege, heresy) tied to real harvests and wars, some changing the map |
| `53-arcs-things` | Events | 13 arcs of things with a history (a famous sword, a horse, a house) |
| `54-voices` | Events | Sayings, oaths, greetings and words of rank for 24 cultures; NPC lines that match their traits |
| `55-bonds` | Relationships | Weighted, fading history per bond that moves opinion and is cited; secrets and leverage; feuds carried by families and realms across rulers |
| `56-realm-inside` | Diplomacy, Economy | Councils of named people with wants and fears; laws and taxes pushed by people; vassal deals and backed claimants; AI gold spent; the player's money sinks |
| `57-world-chronicle` | World | A dated record of the whole run that scenes cite; "The world in your time" in the book and an Annals view |
| `58-event-cut` | Events, Uniqueness | 836 weak release events retired by audit (a setting restores them); war screens shown only to those who can use them |
| `59-tooltips` | UI | Nested tooltips on every number of the profile and top bar, by hover, tap or Enter |
| `60-drill` | War | Drill per division gates formations and counters (a drilled wall beats a charge), and the report says so |
| `61-illumination` | Visual art | A woodcut for every event, the Chronicle on vellum, ink and paper motion, synthesized sounds; the style guide is `docs/art/style-guide.md` |
| `62-inked-map` | Visual art | The world map in ink on parchment, with more detail as you zoom, and standards with the house's charge for armies |
| `63-miniatures` | Visual art | Portraits as painted miniatures: ink faces that age and scar, culture dress, poses, children and swaddled newborns |
| `64-npc-beliefs` | Uniqueness | People and courts hold beliefs about you, others, battles and beasts, some false, which move opinion and can be corrected |
| `65-mods` | Replayability | Player mods as JSON data: events and realm flavour, checked, escaped and recorded in the save |
| `40-memory-*` (8 chunks) | Events | 471 callbacks that bring back 269 memories the release recorded and never used |

How far each moved the game is measured in `reports/scorecard.md`; the plan for the rest is in `docs/north-star/`.

## Commands

Needs Node 22.15+ (built-in zstd).

```sh
npm install && npx playwright install chromium   # once
npm run build                                    # -> index.html
npm test                                         # every test against index.html
npm run test:original                            # the same tests against the untouched release
node tools/build.mjs --out=/tmp/x.html --only=chronicle   # fixes + one feature, elsewhere
node tools/lint-events.mjs --feature=chronicle --html=/tmp/x.html
node tools/lint-choices.mjs --all-features                 # no event a feature adds may have an obviously best choice
node bench/balance.mjs                                    # each starting path's numbers held to bench/targets.mjs
node tools/build.mjs --unpack && node tools/show.mjs A.fightWorth
```

**Port to the real source.** Every patch's `why` is written so it can be ported. A release from the original source without them brings the bugs back.
