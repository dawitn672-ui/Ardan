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
| `24-honest-odds` | Power scaling | Duel odds on screen fitted to 2,100 real duels |
| `27-accessibility` | UI | WCAG 2.2 AA clean across 24 screens (axe) |
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
node tools/build.mjs --unpack && node tools/show.mjs A.fightWorth
```

**Port to the real source.** Every patch's `why` is written so it can be ported. A release from the original source without them brings the bugs back.
