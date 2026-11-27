# Ardan: start here

Ardan is a single-page medieval life sim and grand strategy game: you live one person's life inside a simulated
continent of realms, courts, families and wars. This repo holds the **shipped release** as readable source
(`src/core/release/`, made by X1 from the untouched minified original `vendor/ardan-b593143.html`, D-028) and everything
built on top of it: **features** that add code and events, the **v2 engine** (plain ES modules), content kept as
**data**, and the tools that build, test and play it. `node tools/build.mjs` turns it all into one playable file, `index.html`.

## Every session, first

0. **You MUST start every session by fetching the owner's enabled skills in Notion via `notion-get-enabled-skills`** (Notion
   MCP; Notion's setup guide, order 101's Notion integration). Load a Notion skill when it fits the task and say so. Then
   read the Notion page "🤖 Agent Operating Guide" if the task touches Notion. The repo stays the source of truth.
1. Read this file, `docs/LESSONS.md` (every mistake made so far and the rule that stops it: order 101, never the same
   mistake twice), `docs/OWNER_ORDERS.md` (every standing order of the owner's), `docs/PROGRESS.md` (the checklist of what is done and what is next), the end of `docs/HISTORY.md` (what was done last and how to undo it), `docs/DECISIONS.md` (do not
   undo a recorded decision without a new record), `docs/V2_SPEC.md` (the owner's design rules) and the skills in
   `.claude/skills/`.
2. Work on a branch, one step per commit. After each step: tests, the coherency checks, a playtest pass
   (`.claude/skills/game-ux-playtest-loop`), then a `docs/HISTORY.md` entry, `CHANGELOG.md` and this file if they change.
3. Token efficiency first, model and effort at your discretion (`docs/DECISIONS.md` D-010), using the owner's model plan (D-009) as the default: for example Fable at max effort
   for the critique and the big designs, Opus at high effort for systems, Sonnet at high effort for interface and
   data work, Sonnet at default effort for playtester agents.

## Standing rules (the owner's)

> **The owner's newest instruction always wins** over every older construct here, in `docs/`, in a skill or in the code's
> design (order 76, D-158). The living source of truth is `docs/MASTER_PROMPT.md`; where this file disagrees with it, it wins.

> **Constant, harsh self-critique (order 101).** Criticise every piece of our own work as harshly as possible before
> calling it done; write each mistake, its root cause and the rule that stops it in `docs/LESSONS.md` (mirrored to
> Notion's Lessons database) and move the rule into a gate (a lint, a test, a skill) where possible.

> ### ⚑ NOT A SINGLE THING IN THIS WORLD HAPPENS OUTSIDE OF REASON.
> Things may come down to chance, luck, reasoned or calculated action, even petty and emotional reasons, but **never to
> no reason at all.** Every figure acts from a thought process that fits his post, circumstances and personality. Coups,
> rebellions and factions follow a kingdom's stability, the king's relations with each noble, and their own ambitions,
> desires and circumstances. Everything is intertwined. (The owner, order 54, for the rest of this game's making; D-062.)

- **Decide through `A.WHY`** (W1-2, D-069). Any choice a king, lord, General, captain or NPC makes (war, a faction, an
  appointment, a betrayal, a plot) goes through `A.WHY.decide(who, kind, options, ctx)`: each option with reasons
  `{ kind, weight, source, label, pub }` (log-odds weights; the source names the record), bent by the decider's temper and
  feelings, with a bounded record. No bare `A.chance(p)` for a structural choice: `tools/lint-reasons.mjs` counts them
  and `tests/reasons-baseline.json` may only fall. See `src/people/9999950-why/README.md` and `docs/design/r1-audit.md`.

- **Descriptions open on click, never on hover.** A button or an info icon opens a description; nothing pops up on
  hover. (Round 2 order B4, done: `src/ui/59-descriptions` opens on click, tap and Enter only, a `title=` of more than
  three words is lifted into a click-to-open note, an activity opens a sheet first, and `src/ui/99998-click-open/test.mjs`
  lints it. Write `data-note="..."` for a description, never a long `title=`. Replaces the older "never hide a
  description behind a click" rule, D-007.)
- **No percentages for the player.** Odds and amounts are words and a tipped scale. Percentages are fine in tests,
  tools and AI.
- **One holder per post.** Every title, office and command has exactly one holder at a time. A promotion hands over
  the real command, men and powers and takes the old post away; leaving a post has consequences.
- **Time moves by Next year below age 12 and by Next month from 12** (D-160, replacing the two buttons of D-008, D-019,
  D-026), in a fixed place, never a stop control. Only notable things stop a step midway (a card that needs a real answer, a battle, a duel, a call to arms, a
  deadline), and once the card or chain of cards is answered **the same step carries on to its end** (order 54, D-062
  addendum); a wound, an illness, a death or birth in the household and coming of age go into the year's digest. Only Esc,
  death or being put on campaign end a step early. Talk and the day's small happenings wait for the step's end.
  No initiative pool: overtraining has its own consequences. See `src/ui/999995-next-year/README.md`.
- **Deterministic from the seed.** The same seed and the same choices give the same world, always.
- **No war screens unless you are in the war,** at your rank, on a mission or deployed.
- **Never throw work away.** Retired code goes to `archive/` with a note (and the last commit that had it is recorded
  in `docs/HISTORY.md`), never deleted.
- If an order conflicts with how the code works, record the conflict and the fix chosen in `docs/DECISIONS.md`.

## End goal: iPhone App Store

Ardan ships as an iPhone app: the one-file page inside **Capacitor 8** (Swift Package Manager), built and signed on
**Codemagic**'s cloud Mac from this repo, through **TestFlight** to App Review (order 62, rule 21, D-071, D-075, D-076). The
route, the owner's facts re-checked, what only the owner can do and today's audit: `docs/IOS_ROADMAP.md`. The how-to for
when the stage comes: `.claude/skills/ios-capacitor-release`. **The build rules bind all work from today:**

- **Input:** Pointer Events only (`pointerdown/move/up/cancel`), never mouse-only events; nothing depends on hover,
  right-click, double-click or the keyboard; tap targets at least 44×44 points.
- **Layout:** from 375×667 to a Pro Max; room for `env(safe-area-inset-*)`; `dvh`, not `vh`.
- **Assets:** relative paths only; no CDN, no web font from the net, no network call; everything works offline.
- **Rendering:** HTML for menus and panels, updating only what changed; one canvas for the map and the war map, culled,
  redrawn only on a change; animate only `transform` and `opacity`.
- **Performance:** no data that grows forever, no new objects in a per-frame loop, look up by id with a `Map`; test with
  the CPU slowed 4 to 6 times.
- **Saves:** only through `SAVES` (small keys through `UI.store`), so the storage under it can become Capacitor's.
- **Audio:** one `AudioContext`, unlocked on the first tap, paused in the background.
- Source stays in `src/`, `data/`, `assets/`; no path assumes a folder layout (a later build writes `www/`).
- When a change would make the iPhone version harder, say so and offer the version that keeps the route open.

## Layout

| Path | What |
| --- | --- |
| `src/core/release/` | **The release's own source** (X1, D-028): `core/*.js` (engine and interface by section), `content/*.js` (its 30 event packs), `lore/*.json`, `page.html`; `PATCHES.md` lists the 203 baked patches. The build's input. Edit it here. See its `README.md` |
| `src/<system>/NN-name/` | A **feature**: one unit of change (`*.core.js`, `*.events.js`, `test.mjs`, `README.md`; a `patches.mjs` only for work in flight) |
| `src/<system>/engine/` | The **v2 engine** modules of that system (plain ES modules, unit-tested by `tests/v2/`) |
| `src/core/00-..09-` | The fix layer, always built |
| `src/*/*/.wip` | Work in progress: left out of the default build, tests and check; built by `--only=name` |
| `data/` | Content kept as data (`*.json`), put on the page as `A.DATA[...]` before any feature code (`names.json`: every name pool, built by `tools/c7/build-names-data.mjs`; new people are named by `A.NAMES`, D-058) |
| `assets/` | Art, fonts, portrait and VFX source files |
| `vendor/ardan-b593143.html` | The untouched original release, minified. **Never edit.** The build no longer reads it |
| `tests/` | `run.mjs` (browser tests: `tests/suites/` and every feature's `test.mjs`), `v2/` (engine unit tests), `saves/` (sample saves of every version; they must keep loading) |
| `tools/` | `build.mjs`, `build-v2.mjs`, `check.mjs`, linters, `show.mjs`, `version.mjs`, `lib/features.mjs` (where features live), `rename-pass.mjs` + `rename-map.json` (the naming pass: renames and the references to them), `bench/` (measurement harnesses; reports in `tools/bench/reports/`), `v2/` (the v2 kit's playtest and map scripts) |
| `docs/` | Only the reference set (order 76): `README.md` (the index), `MASTER_PROMPT.md` (the source of truth), `prompts/`, `OWNER_ORDERS.md`, `STATUS.md`, `ROADMAP.md`, `HISTORY.md`, `DECISIONS.md`, `VERSIONS.md`, `TOOLING.md`, `IDEAS.md`, `NAMES.md`, `V2_SPEC.md`, `V3_SPEC.md`; `design/` (notes of systems in play), `research/` (data the tools read). No plans, reports or scratch |
| `archive/` | Retired features and code (`x1-patch-layer/`: the old patches.mjs files), each with a note on what it was and why it was replaced. Never built. |
| `CHANGELOG.md` | Player-facing changes in plain words, one section per version |
| `.claude/skills/` | `ardan-dev-process`, `ardan-integration`, `ardan-prompt-intake`, `ardan-ui-review`, `ardan-world-data`, `ardan-event-writing`, `agent-token-economy`, `life-sim-systems`, `rpg-progression-design`, `cold-reader-naming`, `realistic-continent-maps`, `game-ux-playtest-loop`, `ios-capacitor-release` (keep them true to the code, and update them as each wave lands: order 100) |

**Systems** (`src/<system>/`): `core` (engine fixes, saves, time, scale, replay, mods, pacing), `map` (the continent,
terrain, journeys, the map view), `world` (realms, cultures, names, lore, the world record, beliefs), `people` (the
body, stats, skills, moods, relationships, advisors, renown), `family` (kin, households, succession), `nobility`
(titles, courts, offices, the polity), `diplomacy` (relations between realms, reasons for war), `war` (armies,
battles, sieges, orders, companies), `economy` (goods, markets, trade), `events` (event packs, arcs, memory,
chronicle, endings), `ui` (look, layout, portraits, icons, motion, phone). Features apply in folder-name order across
all systems (`00-security` first, `999999-one-redraw` last: its redraw wrappers are the outermost), as `tools/lib/features.mjs` lists them.

## Build, test, play

```sh
node tools/build.mjs                                      # everything -> index.html (not committed, D-109; open it in a browser to play)
node tools/build.mjs --out=/tmp/me.html --only=my-feature # the default build plus a work-in-progress feature, somewhere private
node tools/show.mjs --where A.fightWorth                  # which src/core/release/ file and line defines a release function
node --test tests/v2/*.test.js                            # the engine's unit tests
node tools/lint-events.mjs --feature=my-feature --html=/tmp/me.html
node tools/lint-choices.mjs --feature=my-feature --html=/tmp/me.html   # no obviously best choice
node tools/lint-reasons.mjs [--list]                      # no new bare-dice decision in AI code (R1, W1-2): the count may only fall
node tests/run.mjs /tmp/me.html --features=my-feature     # core suites + that feature's tests
node tests/run.mjs --only=testA,testB --workers=4         # some tests by name
node tools/bench/balance.mjs /tmp/me.html                 # each path's numbers within tools/bench/targets.mjs
node tools/check.mjs                                      # everything CI runs
node tools/coherency.mjs --quick                          # the coherency checks over a few lives (src/core/08-coherency-checks)
```

The full command list, the two test tiers, the net (any console error fails a test), **world-robust tests** (seed
fallback, pooled numbers, bars from measured spread, poll never sleep; H-082), CI-only failures and the bench conventions:
`.claude/skills/ardan-dev-process/references/testing-and-tools.md`. Read it before writing or fixing a test.
Browser tests use the container's Playwright (`PLAYWRIGHT_PATH=/opt/node-tools/node_modules/playwright`). **Models:** the
biggest model only for real design; Sonnet for systems, data and test fixing; Haiku for bulk and mechanical work.
**Library and API docs come from Context7** (the connector: `resolve-library-id`, then `query-docs`) before memory or a web
search: Playwright, Capacitor, Node, Codemagic and the like. Never put code, keys or the owner's data in a query.

## Versions

Major = the nature of the game (v2 realistic, v3 levels and monsters, v4 high fantasy, v5 the phone release); minor = a
round or system; patch = fixes; pre-release `-alpha.N` while a major is built. A version is a commit CI tested green on
both tiers, cut only with `tools/version.mjs new` (D-134). Details: `.claude/skills/ardan-integration/references/versions.md`
and the `ardan-integration` skill.

## The v2 engine

The owner's v2 spec is `docs/V2_SPEC.md`; what is done and next is `docs/PROGRESS.md` (`docs/v2/LANES.md` and
`docs/v2/STATUS.md` are the Nov 1 to 6 lane era, marked historical). The engine
modules live with their systems (`src/people/engine/body.js`, `src/war/engine/war.js`, ...; entry
`src/core/engine/index.js`), bundled by `node tools/build-v2.mjs` into `src/core/99990-v2-engine/a-v2.core.js` (on the page
as `A.V2`; never edit the bundle). Their unit tests are `tests/v2/` (`tools/check.mjs` runs them).

## Rules that keep the build working

**The built game is not committed** (X5, D-109). `index.html` is in `.gitignore`: build it with `node tools/build.mjs`
to play or test it. CI builds it once a run (the `game` job, twice to prove the bytes the same) and shares it with the
test shards, the press gate, the long tier and the nightly runs as an artifact. `tools/version.mjs get` rebuilds an old
version from its commit's own source (checking the build hash its row records). A release branch points at exactly the
version's commit (D-134), so it holds no built file either. Never `git add -f index.html`.

**Repack after each round:** `git gc --prune=now` after the push (history holds old builds; a fresh clone is large; use
`--depth=1` or `--filter=blob:none`).

**Parallel safety.** When several agents work at once, each owns **only its own `src/<system>/NN-name/` folder** (or its own `data/` files).

- Work in a local worktree; **push no working branch** (order 76, D-162, replacing D-133's `work/<item>`). The integrator
  merges the work into the trunk, `main` (kept level with `v2-integration` until the owner deletes it), and pushes only
  the trunk and `release/<version>` branches. The repo keeps only what reference needs: no plans, reports or scratch.
- Take decision and history numbers (`D-`, `H-`) only from the range your brief reserves; with none given, write
  `D-NEW-1`, `H-NEW` and the integrator numbers them at the merge (parallel branches clashed on D-142, H-083, H-085).
- Build to `--out=` a private scratch path such as `/tmp/ardan/<name>/`, never to `index.html`.
- Unpack only to a private `--unpack=` folder. The shared `.build/` is the fix layer, for reading.
- Don't edit another feature, `src/core/release/`, `tools/`, `tests/`, `tools/bench/` or `vendor/` unless that is your
  task (two agents editing one release file is a merge, not a conflict, but say so in your report).

**Change the release in its source** (X1, D-028). The release is `src/core/release/`, readable and maintained: to change
a release function, edit it there, in place, with a comment when the reason is not obvious. There are no patches in the
default build any more and there should be no new ones (the build still applies a feature's `patches.mjs`, matched
against the built text, for work already in flight such as `82-early-years`).

- Find a function with `tools/show.mjs --where A.name`, or grep `src/core/release/`.
- **Event functions are read as text.** `A.evAudience` runs `A.CX_RX` over `e.cond.toString()` and `A.EV_RX` over
  `e.text.toString()`, and the bot and tests read `cond`, `setup` and `fx` too. In `src/core/release/content/` every
  function keeps the release's exact text (one minified line); reformat or edit one only with
  `tools/release/identity-probe.mjs` run before and after.
- A change meant to change nothing (a refactor, a rename): build before and after, then `tools/release/verify.mjs`.

**Prefer readable `*.core.js` for new systems.** It is appended to the core blob, wrapped in an IIFE, and runs after `A`, `GD`, `UI`, `MAP` and `SAVES` exist, but before `UI.init`. Use it to define new functions and to register hooks:

- `A.onMonth.push(pc => ...)` runs every month.
- `Object.assign(UI.A, {...})` adds actions for `data-a`.
- `Object.assign(UI.C, {...})` adds change handlers.
- `A.addStage('A.applyFx', 'my-feature', next => function (pc, fx, ctx) { ...; return next.apply(this, arguments); })`
  adds a named stage to one of the seven staged functions (`A.applyFx`, `A.eventView`, `A.eventChoose`, `A.newGame`,
  `UI.render`, `UI.refresh`, `UI.renderModal`; X2, D-056). Never assign them: add the stage's name to
  `src/core/01-stages/manifest.core.js` where it should run (the manifest orders them, not the folder names), or use
  `{ before }` / `{ after }`. `tools/lint-stages.mjs` fails a reassignment, and fails when more names are defined more
  than once than `tests/stages-baseline.json` allows (it may only fall): prefer a stage, or one definition, to a new wrapper.

Then call your code from the existing flow by editing the release source (`if (A.myHook) A.myHook(pc);`, guarded so a
build without your feature still runs).

**Determinism.**

- Engine code uses only `A.rand`, `A.ri`, `A.rf`, `A.chance`, `A.pick`, `A.wpick` and `A.gauss`. Never `Math.random` or `Date.now`.
- **Rendering must be pure.** UI code must not consume `A.rand` or change `A.S`. The `renderRng` and `replayWithRender` tests enforce this.
- If a view needs a random-looking pick, seed it from ids, the way `A.npcStyles` does.
- **One redraw a press** (`src/ui/999999-one-redraw`). While a step runs, `UI.refresh` draws only the card and the clock
  and the page waits for the step's end. A new post-draw pass wraps the draws like 91's do and returns early when
  `UI.REDRAW.depth > 1` (a draw inside a draw); it reads all the layout it needs before it writes.

**Security.**

- Every value interpolated into HTML goes through `UI.esc(...)`.
- No inline handlers (`onclick=`). The CSP blocks them; use `data-a="action" data-v="arg"` with `UI.A`.
- No `eval` and no `new Function`.

**State.**

- New fields on people or realms must tolerate old saves where the field is missing.
- `SAVES.clean` strips `<`, `>` and `"` from loaded non-prose strings, so don't store markup in state.

## Writing events

Use the `ardan-event-writing` skill (the event shape, `C.*` helpers, `fx` keys, checks, tokens, kin from the tree, the
voice, the lints). Events are read as text by classifiers: never reformat one in `src/core/release/content/` without
`tools/release/identity-probe.mjs` before and after.
