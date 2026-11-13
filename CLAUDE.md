# Ardan: start here

Ardan is a single-page medieval life sim and grand strategy game: you live one person's life inside a simulated
continent of realms, courts, families and wars. This repo holds the **shipped release** as readable source
(`src/core/release/`, made by X1 from the untouched minified original `vendor/ardan-b593143.html`, D-027) and everything
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
  control. Only notable things stop a year (a card that needs a real answer, a battle or call to war, an illness or wound, a
  death or birth in the household, coming of age, a deadline); talk and the day's small happenings wait for the step's end.
  No initiative pool: overtraining has its own consequences. See `src/ui/999995-next-year/README.md`.
- **Deterministic from the seed.** The same seed and the same choices give the same world, always.
- **No war screens unless you are in the war,** at your rank, on a mission or deployed.
- **Never throw work away.** Retired code goes to `archive/` with a note (and the last commit that had it is recorded
  in `docs/HISTORY.md`), never deleted.
- If an order conflicts with how the code works, record the conflict and the fix chosen in `docs/DECISIONS.md`.

## Layout

| Path | What |
| --- | --- |
| `src/core/release/` | **The release's own source** (X1, D-027): `core/*.js` (engine and interface by section), `content/*.js` (its 30 event packs), `lore/*.json`, `page.html`; `PATCHES.md` lists the 203 baked patches. The build's input. Edit it here. See its `README.md` |
| `src/<system>/NN-name/` | A **feature**: one unit of change (`*.core.js`, `*.events.js`, `test.mjs`, `README.md`; a `patches.mjs` only for work in flight) |
| `src/<system>/engine/` | The **v2 engine** modules of that system (plain ES modules, unit-tested by `tests/v2/`) |
| `src/core/00-..09-` | The fix layer, always built |
| `src/*/*/.wip` | Work in progress: left out of the default build, tests and check; built by `--only=name` |
| `data/` | Content kept as data (`*.json`), put on the page as `A.DATA[...]` before any feature code |
| `assets/` | Art, fonts, portrait and VFX source files |
| `vendor/ardan-b593143.html` | The untouched original release, minified. **Never edit.** The build no longer reads it |
| `tests/` | `run.mjs` (browser tests: `tests/suites/` and every feature's `test.mjs`), `v2/` (engine unit tests), `saves/` (sample saves of every version; they must keep loading) |
| `tools/` | `build.mjs`, `build-v2.mjs`, `check.mjs`, linters, `show.mjs`, `version.mjs`, `lib/features.mjs` (where features live), `rename-pass.mjs` + `rename-map.json` (the naming pass: renames and the references to them), `bench/` (measurement harnesses; reports in `tools/bench/reports/`), `v2/` (the v2 kit's playtest and map scripts) |
| `docs/` | `README.md` (an index of every doc), `NAMES.md` (old name -> new name), `HISTORY.md`, `DECISIONS.md`, `IDEAS.md`, `CRITIQUE.md`, `V2_SPEC.md`, `VERSIONS.md`; `v2/` (v2 status, lanes, playtests), `plan/`, `reviews/`, `benchmarks/`, `research/`, `design/`, `north-star/`, `art/` |
| `archive/` | Retired features and code (`x1-patch-layer/`: the old patches.mjs files), each with a note on what it was and why it was replaced. Never built. |
| `CHANGELOG.md` | Player-facing changes in plain words, one section per version |
| `.claude/skills/` | `life-sim-systems`, `realistic-continent-maps`, `game-ux-playtest-loop` (keep them true to the code) |

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
node --test tests/v2/*.test.js                            # the engine's unit tests
node tools/lint-events.mjs --feature=my-feature --html=/tmp/me.html
node tools/lint-choices.mjs --feature=my-feature --html=/tmp/me.html   # no obviously best choice
node tests/run.mjs /tmp/me.html --features=my-feature     # core suites + that feature's tests
node tests/run.mjs --only=testA,testB --workers=4         # some tests by name
node tests/run.mjs                                        # everything against index.html (759 tests; CI shards it 8 ways)
node tools/bench/balance.mjs /tmp/me.html                 # each path's numbers within tools/bench/targets.mjs
node tools/bench/next-month-speed.mjs /tmp/me.html --save=tests/saves/press/y50-noble.ardan [--death] [--throttle=4]   # real Next month presses, in CPU time
node tools/bench/press-gate.mjs /tmp/me.html [--report]   # the A1 gate (CI): year 0 and 50, fresh and after a death, held to budgets
node tools/bench/style-probe.mjs /tmp/me.html             # one <span> insert's style time after a hint and a death (< 1 ms)
node tools/bench/long-life-audit.mjs /tmp/me.html --seed=7 --years=60    # a long bot life with the one-holder audit and error counts
node tools/check.mjs                                      # everything CI runs
node tools/coherency.mjs --quick                          # the coherency checks over a few lives (src/core/08-coherency-checks)
node tools/coherency.mjs --baseline=quick                 # the same run CI holds to tests/coherency-baseline.json
node tools/version.mjs get v2.0.0-beta.1                  # any version, playable: versions/ardan-<v>.html
git gc --prune=now                                        # after every integration round (see below)
```

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

- **Major:** a new design the owner set (v1 = the shipped release and its rounds; v2 = `docs/V2_SPEC.md`).
- **Minor:** a round, cycle or step that adds or replaces a system. **Patch:** fixes only.
- **Pre-release** (`-alpha.N`, `-beta.N`, `-rc.N`) while a major is being built.
- Tag a clean commit whose CI is green, or the end of a step the owner asked for: `node tools/version.mjs new vX.Y.Z "what changed"`, commit `docs/VERSIONS.md`, push.
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

**Change the release in its source** (X1, D-027). The release is `src/core/release/`, readable and maintained: to change
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

**Condition helpers.** `C.` age, adult, child, teen, young, old, ageAdj, noble, rich, poor, unfree, soldier, atWar, ruler, married, hasKids, job(p,k), race(p,...), realm(p,"POL-01",...), cult, faith, terr(p,"hills",...), coast, town, blood, trait(p,t), flag(p,f), prison, male, female, stat(p,s), skill(p,k), hasRel(p,"friend",...), parentsAlive, fame, literate, prof(p,k,min), apt, gear, family, famKind, famHead, atSchool, jobRank, rep, ownShop, myRealm, faction, allies, office, superior, favors, owes, sworn, letter, ambition.

Using these helpers matters, because `A.CX_RX` classifies events by matching them in the source (`C.ruler(`, `C.noble(`, `C.poor(`, `C.soldier(`, `C.child(`, `.job`). The text classifiers in `A.EV_RX` (tavern, street, master/overseer, favour asked by a lord) can hide an event from the wrong class.

**Effect keys** (`fx`): str spd ins sta int wil health happy looks fame honor piety coin coinPct family skill rep masterwork promote style styleXp apt trait untrait wound flag unflag rel them newRel lover die prison punish free merit patronOp rulerOp realmStab realmGold armyXp secret epithet deed ach job perf lang literate gear asset duel beast event stability treasury legit realmRel favor mission cause why infamy authority houseOp factionDisc owed oweThem letter bossOp sworn claim pact ally warOn.

- `fx` may be a function `(p, ctx) => "extra result text"`.
- `skill: { persuasion: 2 }` trains skills.
- `flag: "x"` sets `p.flags.x = year`.
- `them: { op: 10 }` changes opinion with `ctx.pid`.
- `event: "id"` queues another event right after this one.
- `need: { rest, company, purpose, comfort }` meets the four needs of 35-moods.
- A feature that adds an effect key declares it in its core code: `(A.FX_EXTRA = A.FX_EXTRA || []).push('key')`. The linter reads that declaration.

**Checks.** `check: { s, s2, d }` takes a skill or stat (`GD.SKILLS` keys, or str spd ins sta int wil). `d` is the difficulty: 45 is typical, and each point is worth 1.6% of odds.

**Memory.**

- `p.flags[name]` holds the year a flag was set.
- `p.flags.ev[eventId]` holds the year the player last saw each event.
- Use `A.schedule({ type: "event", ev: "id", ctx: {...} }, days)` to bring something back years later.

**Tokens.** `{name}` `{home}` `{realm}` `{realmShort}` `{capital}` `{ruler}` `{faith}` `{father}` `{mother}` `{spouse}` `{rival}` `{friend}` `{enemy}` `{year}` `{age}`, plus any `ctx` key. Digits are allowed (`{mate2}`). An unfilled token makes the engine drop the event.

**Voice.** Dry, concrete, period. Second person, present tense. Short sentences. No modern idiom. Avoid the existing tics ("looks at you a long time", "for the rest of your life", a five-word punchline after every outcome).

**Before you finish:**

- `tools/lint-events.mjs` must pass.
- `tools/lint-choices.mjs --feature=<name>` must find no obviously best choice. It flags a choice that beats the others on every count and is no riskier, so give the other side a reason or the favourite a cost.
- `tests/run.mjs` must pass for your feature.
- CI also runs `tools/bench/balance.mjs`, which holds each starting path to the bands in `tools/bench/targets.mjs`. Widen a band only with a reason in the file.

## Measurement conventions (`tools/bench/`)

`node tools/bench/run.mjs <built.html> --label=x` writes `tools/bench/reports/x.json`. `node tools/bench/compare.mjs release fixes x` writes `tools/bench/reports/scorecard.md` using `tools/bench/rubric.mjs`. Features make themselves measurable by following these conventions:

- **NPC-started events** carry `npc: true` on the event, or `ctx.npcMove = true` on the queued item. The bot counts them as `npcMovesPerDecade`.
- **After-action reports.** A battle object that got one carries it in `b.aar` (`{ causes: [{ label, pct }], text }`). The bot counts `afterActionShare`.
- **Signature systems** register themselves: `A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { chronicle: true })`. The other keys are `beliefTruth` and `bothScales`.
- **Memory.** Events that read another event's flag, or `p.flags.ev`, count as memory events. Prefer `C.flag(p, "x")` in `cond`, so the static analyzer sees the link.
