# Ardan: start here

Ardan is a single-page medieval life sim and grand strategy game: you live one person's life inside a simulated
continent of realms, courts, families and wars. This repo holds the **shipped release** as readable source
(`src/core/release/`, made by X1 from the untouched minified original `vendor/ardan-b593143.html`, D-028) and everything
built on top of it: **features** that add code and events, the **v2 engine** (plain ES modules), content kept as
**data**, and the tools that build, test and play it. `node tools/build.mjs` turns it all into one playable file, `index.html`.

## Every session, first

1. Read this file, `docs/OWNER_ORDERS.md` (every standing order of the owner's), `docs/PROGRESS.md` (the checklist of what is done and what is next), the end of `docs/HISTORY.md` (what was done last and how to undo it), `docs/DECISIONS.md` (do not
   undo a recorded decision without a new record), `docs/V2_SPEC.md` (the owner's design rules) and the skills in
   `.claude/skills/`.
2. Work on a branch, one step per commit. After each step: tests, the coherency checks, a playtest pass
   (`.claude/skills/game-ux-playtest-loop`), then a `docs/HISTORY.md` entry, `CHANGELOG.md` and this file if they change.
3. Token efficiency first, model and effort at your discretion (`docs/DECISIONS.md` D-010), using the owner's model plan (D-009) as the default: for example Fable at max effort
   for the critique and the big designs, Opus at high effort for systems, Sonnet at high effort for interface and
   data work, Sonnet at default effort for playtester agents.

## Standing rules (the owner's)

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
- **Time moves by Next month or Next year** (D-008, D-019, D-026), two buttons in fixed places that never become a stop
  control. Only notable things stop a step midway (a card that needs a real answer, a battle, a duel, a call to arms, a
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
| `docs/` | `README.md` (an index of every doc), `NAMES.md` (old name -> new name), `HISTORY.md`, `DECISIONS.md`, `IDEAS.md`, `CRITIQUE.md`, `V2_SPEC.md`, `VERSIONS.md`; `v2/` (v2 status, lanes, playtests), `plan/`, `reviews/`, `benchmarks/`, `research/`, `design/`, `north-star/`, `art/` |
| `archive/` | Retired features and code (`x1-patch-layer/`: the old patches.mjs files), each with a note on what it was and why it was replaced. Never built. |
| `CHANGELOG.md` | Player-facing changes in plain words, one section per version |
| `.claude/skills/` | `life-sim-systems`, `realistic-continent-maps`, `game-ux-playtest-loop`, `ios-capacitor-release` (keep them true to the code) |

**Systems** (`src/<system>/`): `core` (engine fixes, saves, time, scale, replay, mods, pacing), `map` (the continent,
terrain, journeys, the map view), `world` (realms, cultures, names, lore, the world record, beliefs), `people` (the
body, stats, skills, moods, relationships, advisors, renown), `family` (kin, households, succession), `nobility`
(titles, courts, offices, the polity), `diplomacy` (relations between realms, reasons for war), `war` (armies,
battles, sieges, orders, companies), `economy` (goods, markets, trade), `events` (event packs, arcs, memory,
chronicle, endings), `ui` (look, layout, portraits, icons, motion, phone). Features apply in folder-name order across
all systems (`00-security` first, `999999-one-redraw` last: its redraw wrappers are the outermost), as `tools/lib/features.mjs` lists them.

## Build, test, play

```sh
node tools/build.mjs                                      # everything -> index.html (open it in a browser to play)
node tools/build.mjs --out=/tmp/me.html --only=my-feature # the default build plus a work-in-progress feature, somewhere private
node tools/show.mjs --where A.fightWorth                  # which src/core/release/ file and line defines a release function
node --stack-size=65500 tools/release/verify.mjs a.html b.html   # two builds are the same program (for a neutral refactor)
node tools/release/identity-probe.mjs a.html b.html       # ...and give the same event classes and fixed-seed lives
node tools/build.mjs --unpack && node tools/show.mjs A.fightWorth UI.refresh       # the shared .build/ (read only)
node tools/build.mjs --out=/tmp/ardan/me/x.html --only=me --unpack=/tmp/ardan/me/blobs
node tools/show.mjs --dir=/tmp/ardan/me/blobs A.fightWorth                         # your own build, privately
node tools/build-v2.mjs                                   # rebundle the v2 engine (src/*/engine) after editing it
node docs/design/demo-2d/c8c/sheet.mjs                    # the dress sheets (stations x peoples, soldiers, occasions, the 24 cultures) from the figure library
node --test tests/v2/*.test.js                            # the engine's unit tests
node tools/lint-events.mjs --feature=my-feature --html=/tmp/me.html
node tools/lint-choices.mjs --feature=my-feature --html=/tmp/me.html   # no obviously best choice
node tools/lint-kin.mjs                                   # no event mints kin or names one it did not take from the tree (C6)
node tools/lint-skills.mjs                                # S1: no proficiency a player reads, the skills data whole, older code's skill writes only falling
node tools/lint-reasons.mjs [--list]                      # no new bare-dice decision in AI code (R1, W1-2): the count may only fall
node tests/run.mjs /tmp/me.html --features=my-feature     # core suites + that feature's tests
node tests/run.mjs --only=testA,testB --workers=4         # some tests by name
node tests/run.mjs --tier=quick --shard=0/8 --plan        # T1: the tier split and each shard's estimated time, runs nothing
node tests/run.mjs --check-tiers                          # a test over the threshold on CI must be in tests/long-tests.json
node tests/run.mjs                                        # everything (both tiers) against index.html (852 tests)
node tools/bench/balance.mjs /tmp/me.html                 # each path's numbers within tools/bench/targets.mjs
node tools/bench/next-month-speed.mjs /tmp/me.html --save=tests/saves/press/y50-noble.ardan [--death] [--throttle=4]   # real Next month presses, in CPU time
node tools/bench/press-gate.mjs /tmp/me.html [--report]   # the A1 gate (CI): year 0 and 50, fresh and after a death, held to budgets
node tools/bench/style-probe.mjs /tmp/me.html             # one <span> insert's style time after a hint and a death (< 1 ms)
node tools/bench/phone-load.mjs /tmp/me.html --runs=3 --profile --out=/tmp/ardan/me   # X7: as a Pixel 7 at 1x/4x/6x CPU: load, title, first Life screen, Next month, and where the boot's time goes
node tools/bench/clutter.mjs /tmp/me.html --out=/tmp/c.json --shots=/tmp/s   # B5: words, controls, elements, scroll and width share of every page, for three lives at 1366x768 and 420x900
node tools/bench/long-life-audit.mjs /tmp/me.html --seed=7 --years=60    # a long bot life with the one-holder audit and error counts
node tools/check.mjs                                      # everything CI runs
node tools/lint-stages.mjs                                # the named stages and the count of names defined more than once (X2)
node tools/coherency.mjs --quick                          # the coherency checks over a few lives (src/core/08-coherency-checks)
node tools/coherency.mjs --baseline=quick                 # the same run CI holds to tests/coherency-baseline.json
node tools/version.mjs get v2.0.0-beta.1                  # any version, playable: versions/ardan-<v>.html
git gc --prune=now                                        # after every integration round (see below)
```

**Two test tiers (T1, D-063).** `tests/long-tests.json` lists the long tests (bot lives and replays of 200 to 1,800 s: 54 of
852, over half of the suite's CPU time); `tests/test-times.json` holds each test's seconds on CI. **Quick** (everything not
listed) runs on every push and pull request (`check.yml`, `--tier=quick --shard=k/8`, about 11 minutes of tests a shard);
**long** runs in `long.yml`: every night, by hand (workflow_dispatch), on a push whose commit message has `[full ci]`, on
`release/*`, and from other workflows. **A version needs both tiers green on the commit** (`check.yml` and `long.yml`) before
`tools/version.mjs new`. Shards are split by measured time, longest first, not by count. A new test with no time is planned at
30 s; if a test takes over the threshold (200 s) add it to `tests/long-tests.json` (`--check-tiers`, run by `tools/check.mjs`,
fails until you do). The long run's `test-times` artifact (`tools/test-times.mjs` merges the shards' `--times-out=` files)
is committed back now and then so the plan stays true. A local `node tests/run.mjs` still runs both tiers; `[skip ci]` skips both workflows.

**The net (round 2 A3a).** A test, bench, soak or coherency run fails on any uncaught error *and any `console.error`*
(the few messages that are not the game's faults are listed with reasons in `tools/lib/page-errors.mjs`; a test that
provokes an error on purpose calls `expectError(/.../)`). A test that cannot run in a build returns `{ ok: true, skip:
'why' }` and shows as SKIP. Each test has a time limit (`--limit=`, default 1800 s) and the runner relaunches a crashed
browser. Time with the runner's `cpu()` (main-thread CPU), never the wall clock. Known contradictions are counted in
`tests/coherency-baseline.json`, which may only shrink.

The browser tests use the container's Playwright (`/opt/node-tools/node_modules/playwright`): if `npm ci` installs
the pinned one, delete `node_modules/playwright*` or point `PLAYWRIGHT_PATH` at the container's copy.
**A failure only CI sees** (layout off by a few px, a font metric): CI runs Playwright 1.56.1's Chromium 141, the
container a newer one. Reproduce with CI's browser: `cd /tmp/x && npm i playwright@1.56.1 && PLAYWRIGHT_BROWSERS_PATH=/tmp/x/b
npx playwright install chromium`, then `PLAYWRIGHT_BROWSERS_PATH=/tmp/x/b NODE_PATH=/tmp/x/node_modules node tests/run.mjs ...`.

## Versions and milestones

Every foundational or significant change is a version (`docs/VERSIONS.md`, `tools/version.mjs`):

- **Major:** a new design the owner set (v1 = the shipped release and its rounds; v2 = `docs/V2_SPEC.md`, the Nov 12
  complaint list; v3 = `docs/V3_SPEC.md`, the living world: economy, armoury, growth in depth, D-037).
- **Minor:** a round, cycle or step that adds or replaces a system. **Patch:** fixes only.
- **Pre-release** (`-alpha.N`, `-beta.N`, `-rc.N`) while a major is being built.
- Tag a clean commit whose CI is green (quick tier and `long.yml`, T1), or the end of a step the owner asked for: `node tools/version.mjs new vX.Y.Z "what changed"`, commit `docs/VERSIONS.md`, push.
- **Milestones** also get a release branch, `release/<name>` (for example `release/v2.1-foundations`): this
  session's git proxy refuses tag pushes, so the branch is the restorable record on GitHub. Save a sample game of the
  milestone in `tests/saves/`.

## The v2 engine

The owner's v2 spec is `docs/V2_SPEC.md`; lanes follow `docs/v2/LANES.md`; status is `docs/v2/STATUS.md`. The engine
modules live with their systems (`src/people/engine/body.js`, `src/war/engine/war.js`, ...; entry
`src/core/engine/index.js`), bundled by `node tools/build-v2.mjs` into `src/core/99990-v2-engine/a-v2.core.js` (on the page
as `A.V2`; never edit the bundle). Their unit tests are `tests/v2/` (`tools/check.mjs` runs them).

## Rules that keep the build working

**Repack after each round.** The last step of an integration round, after the push, is `git gc --prune=now`. Every round commits a rebuilt `index.html` of about 3.7 MB, and git keeps each one as a loose object: twenty of them had `.git` at 74 MB with no packfile at all, which repacked to 18 MB. Repacking is cheap, it is safe on a pushed branch (it touches only local object storage, never history), and skipping it makes every later clone slower.

**Parallel safety.** When several agents work at once, each owns **only its own `src/<system>/NN-name/` folder** (or its own `data/` files).

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

## Writing events (`*.events.js`)

Each file calls `A.defEvents([...])`. Plain readable JS is fine.

```js
A.defEvents([{
  id: "mt_first_love_letter",          // unique, lowercase; prefix with your feature's short code
  title: "A letter in an old hand",
  cond: (p, C) => C.adult(p) && C.flag(p, "ch_first_love") && C.age(p) >= 25,  // ALWAYS (p, C) => using C.* helpers
  w: 1, cool: 10,                       // weight; cooldown in years (default 6); once: true to fire once ever
  setup: (p, ctx) => { /* fill ctx tokens; ctx.pid = someone's id makes {them}, {khe}/{khim}/{khis} work; ctx.skip = true to drop */ },
  text: "Years ago, {them} ...",        // <= 80 words once rendered; may be (p, ctx) => string
  choices: [                            // 2 to 4 choices, each label <= 12 words
    { t: "Write back", r: "Result text.", fx: { happy: 4, flag: "mt_wrote_back" } },
    { t: "Burn it unread", check: { s: "wil", s2: "int", d: 45 },
      win: { r: "...", fx: { wil: 1 } }, lose: { r: "...", fx: { happy: -3 } } },
  ],
}]);
```

**Condition helpers.** `C.` age, adult, child, teen, young, old, ageAdj, noble, rich, poor, unfree, soldier, atWar, ruler, married, hasKids, job(p,k), race(p,...), realm(p,"POL-01",...), cult, faith, terr(p,"hills",...), coast, town, blood, trait(p,t), flag(p,f), prison, male, female, stat(p,s), skill(p,k), hasRel(p,"friend",...), parentsAlive, fame, literate, lvl(p,k,min), talent(p,k,letter), ready(p,k), stuck(p,k), gear, family, famKind, famHead, atSchool, jobRank, rep, ownShop, myRealm, faction, allies, office, superior, favors, owes, sworn, letter, ambition (what the player seeks of his own will: his plan's aim, his chosen training, his post; `A.SEEK`, 9989-what-you-seek; nothing is handed, order 54).

Using these helpers matters, because `A.CX_RX` classifies events by matching them in the source (`C.ruler(`, `C.noble(`, `C.poor(`, `C.soldier(`, `C.child(`, `.job`). The text classifiers in `A.EV_RX` (tavern, street, master/overseer, favour asked by a lord) can hide an event from the wrong class.

**Effect keys** (`fx`): str spd ins sta int wil health happy looks fame honor piety coin coinPct family skill rep masterwork promote style styleXp apt trait untrait wound flag unflag rel them newRel lover die prison punish free merit patronOp rulerOp realmStab realmGold armyXp secret epithet deed ach job perf lang literate gear asset duel beast event stability treasury legit realmRel favor mission cause why infamy authority houseOp factionDisc owed oweThem letter bossOp sworn claim pact ally warOn proof grasp talent specialism.

- `fx` may be a function `(p, ctx) => "extra result text"`.
- `skill: { persuasion: 2 }` is **experience** (S1, D-072): n × 0.2 of a month's effort, a stretch when the choice had a
  check or stakes, else practice (so 2 is about four experience: a quarter of a Beginner's step, a hundredth of a
  Master's). It never buys a word: a word also asks its concepts and, from Expert, a proof.
- `proof: "sword"` (or `"ctx"` for `ctx.sk`) is a proving moment for the next word; `grasp: { k, sure }` a breakthrough's
  moment (the engine's chance, or sure); `talent: { sword: "B" }` raises a talent letter (the old `apt` is read as a
  letter); `specialism: { sword: "the-knife" }` takes one. `deed` stays the release's record of a deed.
- Skills: `C.lvl(p, k, min)` (min a number, as a check reads it, or a word: `"expert"`; k `"any"` is the best skill),
  `C.talent(p, k, letter)`, `C.ready(p, k?)` (at an edge, wanting a proof), `C.stuck(p, k?)` (at an edge, behind a
  concept). `C.prof` and `C.apt` are gone. Experience moves only through `A.gainXp(p, k, effort, cause)` (`A.trainSkill`
  is a shim for older code); a level only through `A.SK.set`. Never write `p.skills[k]`: it is the level's mirror.
- `flag: "x"` sets `p.flags.x = year`.
- `them: { op: 10 }` changes opinion with `ctx.pid`.
- `event: "id"` queues another event right after this one.
- `need: { rest, company, purpose, comfort }` meets the four needs of 35-moods.
- A feature that adds an effect key declares it in its core code: `(A.FX_EXTRA = A.FX_EXTRA || []).push('key')`. The linter reads that declaration.

**Checks.** `check: { s, s2, d }` takes a skill or stat (`GD.SKILLS` keys: the 28 skills and the 10 legacy keys, which read their skill with that specialism; or str spd ins sta int wil). `d` is a level's value: even odds for someone whose skill reads `d` (45 is Advanced III, 55 Expert I), and each point is worth 1.6% of odds. A check trains its skill as a stretch against `d`, and one at the next word's value or above, succeeded, proves a person standing at that edge.

**Memory.**

- `p.flags[name]` holds the year a flag was set.
- `p.flags.ev[eventId]` holds the year the player last saw each event.
- Use `A.schedule({ type: "event", ev: "id", ctx: {...} }, days)` to bring something back years later.

**Scene.** Every event has a scene tag (`src/events/26-scene-tags`: court, home, church, market, field, workshop, road, sea, wild, war, fight, tavern, street, sickbed, school, prison, grave, feast), read from its words, shape and audience; the event's print follows it and the people on the card dress for it. When the reader would get it wrong, say it: `scene: "field"` on the event.

**Tokens.** `{name}` `{home}` `{realm}` `{realmShort}` `{capital}` `{ruler}` `{faith}` `{father}` `{mother}` `{spouse}` `{rival}` `{friend}` `{enemy}` `{year}` `{age}`, plus any `ctx` key. Digits are allowed (`{mate2}`). An unfilled token makes the engine drop the event.

**Kin come from the tree** (C6, D-057). The family tree holds every relative; `pc.rel` holds only the people met. Never make
a relative for a scene: take one with `A.KIN.take(p, ["cousin"], { sex, adj })` (met then; it throws, dropping the card,
when the tree has none), name one with `A.KIN.nameOf`, and write a story's secret into the tree with `A.KIN.reveal`.
`tools/lint-kin.mjs` fails a scene that links a person it made under a blood word, or says "your cousin {x}" with no kin source.

**Voice.** Dry, concrete, period. Second person, present tense. Short sentences. No modern idiom. Avoid the existing tics ("looks at you a long time", "for the rest of your life", a five-word punchline after every outcome).

**Before you finish:**

- `tools/lint-events.mjs` must pass.
- `tools/lint-choices.mjs --feature=<name>` must find no obviously best choice. It flags a choice that beats the others on every count and is no riskier, so give the other side a reason or the favourite a cost.
- `tests/run.mjs` must pass for your feature.
- CI (the long tier, `long.yml`) also runs `tools/bench/balance.mjs`, which holds each starting path to the bands in `tools/bench/targets.mjs`. Widen a band only with a reason in the file.

## Measurement conventions (`tools/bench/`)

`node tools/bench/run.mjs <built.html> --label=x` writes `tools/bench/reports/x.json`. `node tools/bench/compare.mjs release fixes x` writes `tools/bench/reports/scorecard.md` using `tools/bench/rubric.mjs`. Features make themselves measurable by following these conventions:

- **NPC-started events** carry `npc: true` on the event, or `ctx.npcMove = true` on the queued item. The bot counts them as `npcMovesPerDecade`.
- **After-action reports.** A battle object that got one carries it in `b.aar` (`{ causes: [{ label, pct }], text }`). The bot counts `afterActionShare`.
- **Signature systems** register themselves: `A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { chronicle: true })`. The other keys are `beliefTruth` and `bothScales`.
- **Memory.** Events that read another event's flag, or `p.flags.ev`, count as memory events. Prefer `C.flag(p, "x")` in `cond`, so the static analyzer sees the link.
