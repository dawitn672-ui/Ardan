# Ardan: working rules

Ardan is a single-page life sim and grand strategy game. This repo holds the **shipped release build** (`vendor/ardan-b593143.html`), plus **features** that patch it, add code and add events. `tools/build.mjs` turns those into `index.html`. The game's original source isn't here, so everything is built on top of the release.

## Layout

| Path | What |
| --- | --- |
| `vendor/ardan-b593143.html` | The untouched release. **Never edit.** |
| `features/NN-name/` | One unit of change: `patches.mjs`, `*.core.js`, `*.events.js`, `test.mjs`, `README.md` (see `tools/build.mjs`) |
| `features/00-..09-` | The fix layer, always built |
| `features/*/.wip` | Marks a feature as work in progress: left out of the default build, tests and check, still built by `--only=name` |
| `tools/build.mjs` | Builds the game (`--out=`, `--only=`, `--without=`, `--unpack`) |
| `tools/show.mjs` | Prints minified source of named functions from `.build/` (run `node tools/build.mjs --unpack` first) |
| `tools/lint-events.mjs` | Lints and play-tests a feature's events: `--feature=name --html=built.html` |
| `tests/run.mjs` | Browser tests: `tests/suites/*.test.mjs` and every `features/*/test.mjs` |
| `bench/` | Measurement harnesses that write `reports/` |
| `docs/` | `plan/` (the Road to Ten), `reviews/`, `benchmarks/`, `north-star/` |

## Commands

```sh
node tools/build.mjs                                      # everything -> index.html
node tools/build.mjs --out=/tmp/me.html --only=my-feature # fix layer + one feature, somewhere private
node tools/build.mjs --unpack && node tools/show.mjs A.fightWorth UI.refresh       # the shared .build/ (fix layer)
node tools/build.mjs --out=/tmp/ardan/me/x.html --only=me --unpack=/tmp/ardan/me/blobs
node tools/show.mjs --dir=/tmp/ardan/me/blobs A.fightWorth                         # your own build, privately
node tools/lint-events.mjs --feature=my-feature --html=/tmp/me.html
node tests/run.mjs /tmp/me.html --features=my-feature     # core suites + that feature's tests
node tests/run.mjs                                        # everything against index.html
```

## Rules that keep the build working

**Parallel safety.** When several agents work at once, each owns **only its own `features/NN-name/` folder**.

- Build to `--out=` a private scratch path such as `/tmp/ardan/<name>/`, never to `index.html`.
- Unpack only to a private `--unpack=` folder. The shared `.build/` is the fix layer, for reading.
- Don't edit another feature, `tools/`, `tests/`, `bench/` or `vendor/` unless that is your task.

**Patches edit minified code.** A `find` must be an exact substring of the current blob, and it must match exactly the count given (default 1).

- Read the code with `tools/show.mjs` or grep `.build/*.js`.
- Never reformat a blob. The game reads some of its own functions as text: `A.evAudience` runs regexes over `e.cond.toString()` and `e.text.toString()`.
- Keep patches small and give each one a `why` that would let someone port it to the real source.

**Prefer readable `*.core.js` for new systems.** It is appended to the core blob, wrapped in an IIFE, and runs after `A`, `GD`, `UI`, `MAP` and `SAVES` exist, but before `UI.init`. Use it to define new functions and to register hooks:

- `A.onMonth.push(pc => ...)` runs every month.
- `Object.assign(UI.A, {...})` adds actions for `data-a`.
- `Object.assign(UI.C, {...})` adds change handlers.

Then add the smallest patch needed to call your code from the existing flow.

**Determinism.**

- Engine code uses only `A.rand`, `A.ri`, `A.rf`, `A.chance`, `A.pick`, `A.wpick` and `A.gauss`. Never `Math.random` or `Date.now`.
- **Rendering must be pure.** UI code must not consume `A.rand` or change `A.S`. The `renderRng` and `replayWithRender` tests enforce this.
- If a view needs a random-looking pick, seed it from ids, the way `A.npcStyles` does.

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

**Checks.** `check: { s, s2, d }` takes a skill or stat (`GD.SKILLS` keys, or str spd ins sta int wil). `d` is the difficulty: 45 is typical, and each point is worth 1.6% of odds.

**Memory.**

- `p.flags[name]` holds the year a flag was set.
- `p.flags.ev[eventId]` holds the year the player last saw each event.
- Use `A.schedule({ type: "event", ev: "id", ctx: {...} }, days)` to bring something back years later.

**Tokens.** `{name}` `{home}` `{realm}` `{realmShort}` `{capital}` `{ruler}` `{faith}` `{father}` `{mother}` `{spouse}` `{rival}` `{friend}` `{enemy}` `{year}` `{age}`, plus any `ctx` key. Digits are allowed (`{mate2}`). An unfilled token makes the engine drop the event.

**Voice.** Dry, concrete, period. Second person, present tense. Short sentences. No modern idiom. Avoid the existing tics ("looks at you a long time", "for the rest of your life", a five-word punchline after every outcome).

**Before you finish:** `tools/lint-events.mjs` must pass, and `tests/run.mjs` must pass for your feature.

## Measurement conventions (`bench/`)

`node bench/run.mjs <built.html> --label=x` writes `reports/x.json`. `node bench/compare.mjs release fixes x` writes `reports/scorecard.md` using `bench/rubric.mjs`. Features make themselves measurable by following these conventions:

- **NPC-started events** carry `npc: true` on the event, or `ctx.npcMove = true` on the queued item. The bot counts them as `npcMovesPerDecade`.
- **After-action reports.** A battle object that got one carries it in `b.aar` (`{ causes: [{ label, pct }], text }`). The bot counts `afterActionShare`.
- **Signature systems** register themselves: `A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { chronicle: true })`. The other keys are `beliefTruth` and `bothScales`.
- **Memory.** Events that read another event's flag, or `p.flags.ev`, count as memory events. Prefer `C.flag(p, "x")` in `cond`, so the static analyzer sees the link.
