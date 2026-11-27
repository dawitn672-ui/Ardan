# Repo layout and the rules that keep the build working (moved from CLAUDE.md, order 102)

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

