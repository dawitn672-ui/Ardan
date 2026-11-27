# Ardan: build, test, measure (moved from CLAUDE.md, order 102)

## Build, test, play

```sh
node tools/build.mjs                                      # everything -> index.html (not committed, D-109; open it in a browser to play)
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
node tools/lint-docs-index.mjs                            # docs/README.md lists every doc under docs/ and links nothing that is gone: add a line when you add a doc
node tools/lint-skills.mjs                                # S1: no proficiency a player reads, the skills data whole, older code's skill writes only falling
node tools/lint-reasons.mjs [--list]                      # no new bare-dice decision in AI code (R1, W1-2): the count may only fall
node tools/lint-titles.mjs                                # data/titles/ whole and within budget, every hidden condition declared, no screen reading one (D-183)
node tests/run.mjs /tmp/me.html --features=my-feature     # core suites + that feature's tests
node tests/run.mjs --only=testA,testB --workers=4         # some tests by name
node tests/run.mjs --tier=quick --shard=0/8 --plan        # T1: the tier split and each shard's estimated time, runs nothing
node tests/run.mjs --check-tiers                          # a test over the threshold on CI must be in tests/long-tests.json
node tests/run.mjs                                        # everything (both tiers) against index.html (961 tests on 2026-11-19: 898 quick, 63 long)
node tools/bench/balance.mjs /tmp/me.html                 # each path's numbers within tools/bench/targets.mjs
node tools/bench/next-month-speed.mjs /tmp/me.html --save=tests/saves/press/y50-noble.ardan [--death] [--throttle=4]   # real Next month presses, in CPU time
node tools/bench/press-gate.mjs /tmp/me.html [--report]   # the A1 gate (CI): year 0 and 50, fresh and after a death, held to budgets
node tools/bench/style-probe.mjs /tmp/me.html             # one <span> insert's style time after a hint and a death (< 1 ms)
node tools/bench/phone-load.mjs /tmp/me.html --runs=3 --profile --out=/tmp/ardan/me   # X7: as a Pixel 7 at 1x/4x/6x CPU: load, title, first Life screen, Next month, and where the boot's time goes
node tools/bench/clutter.mjs /tmp/me.html --out=/tmp/c.json --shots=/tmp/s   # B5: words, controls, elements, scroll and width share of every page, for three lives at 1366x768 and 420x900
node tools/bench/long-life-audit.mjs /tmp/me.html --seed=7 --years=60    # a long bot life with the one-holder audit and error counts
node tools/bench/state-size.mjs /tmp/me.html --years=100 [--dump=dir]    # X5: the state's size by key and field at year 0 to 100 (what grows)
node tools/check.mjs                                      # everything CI runs
node tools/lint-stages.mjs                                # the named stages and the count of names defined more than once (X2)
node tools/coherency.mjs --quick                          # the coherency checks over a few lives (src/core/08-coherency-checks)
node tools/coherency.mjs --baseline=quick                 # the same run CI holds to tests/coherency-baseline.json
node tools/version.mjs get v2.0.0-beta.1                  # any version, playable: versions/ardan-<v>.html
git gc --prune=now                                        # after every integration round (see below)
```

**Two test tiers (T1, D-063).** `tests/long-tests.json` lists the long tests (bot lives and replays of 200 to 1,500 s: 63 of
961 on 2026-11-19, about 60% of the suite's CPU time; `node tests/run.mjs --tier=long --plan` gives today's count); `tests/test-times.json` holds each test's seconds on CI. **Quick** (everything not
listed) runs on every push and pull request (`check.yml`, `--tier=quick --shard=k/8`, about 13 minutes of tests a shard);
**long** runs in `long.yml`: every night, by hand (workflow_dispatch), on a push whose commit message has `[full ci]`, on
`release/*`, and from other workflows. **A version needs both tiers green on the commit** (`check.yml` and `long.yml`) before
`tools/version.mjs new`. Shards are split by measured time, longest first, not by count. A new test with no time is planned at
30 s; if a test takes over the threshold (200 s) add it to `tests/long-tests.json` (`--check-tiers`, run by `tools/check.mjs`,
fails until you do). The long run's `test-times` artifact (`tools/test-times.mjs` merges the shards' `--times-out=` files;
it is already merged onto the file as it stood at that commit, so it can replace `tests/test-times.json` whole) is committed
back now and then so the plan stays true (last: long run 74, 2026-11-19). A local `node tests/run.mjs` still runs both tiers; `[skip ci]` skips both workflows.

**The net (round 2 A3a).** A test, bench, soak or coherency run fails on any uncaught error *and any `console.error`*
(the few messages that are not the game's faults are listed with reasons in `tools/lib/page-errors.mjs`; a test that
provokes an error on purpose calls `expectError(/.../)`). A test that cannot run in a build returns `{ ok: true, skip:
'why' }` and shows as SKIP. Each test has a time limit (`--limit=`, default 1800 s) and the runner relaunches a crashed
browser. Time with the runner's `cpu()` (main-thread CPU), never the wall clock. Known contradictions are counted in
`tests/coherency-baseline.json`, which may only shrink.

**World-robust tests (H-082).** Any change to the game moves the random stream, and every seeded world with it. A test
must test the rule, not one world's luck:
- **Seed fallback.** When a test needs a situation (a war, a living priest, a councillor to kill), try worlds in turn
  with a cap: `T.trySeeds(T.seedRun(9711, 6), seed => { ...; return found; })` gives `{ seed, res, tried }`. Name the
  world read in the detail. If none has it: SKIP with the reason when the situation is rare by design; FAIL, naming the
  worlds tried, when its absence across the cap is itself a fault (no war in eighty crown-years).
- **Pooled numbers, bars from measured spread.** Pool over several worlds or lives until the count is enough (a bar on
  12 lives or 100 fights reads the world, not the rule). Measure the spread on several seeds, write the readings in a
  comment, and set the bar outside it but where a broken rule still fails.
- **Standby lives.** A life that ends early is followed by the next seed's; play standbys only while the count falls short.
- **Poll, never sleep for a state.** `waitForFunction` with a timeout, not `waitForTimeout`, for anything that should come
  to pass; a fixed wait is only for proving that nothing happens.
- **Try it on a shifted world:** a scratch build whose `A.newState` draws one extra `A.rand()` after `A.seed(seed)` (never
  committed) moves every world at once.

The browser tests use the container's Playwright (`/opt/node-tools/node_modules/playwright`): if `npm ci` installs
the pinned one, delete `node_modules/playwright*` or point `PLAYWRIGHT_PATH` at the container's copy.
**A failure only CI sees** (layout off by a few px, a font metric): CI runs Playwright 1.56.1's Chromium 141, the
container a newer one. Reproduce with CI's browser: `cd /tmp/x && npm i playwright@1.56.1 && PLAYWRIGHT_BROWSERS_PATH=/tmp/x/b
npx playwright install chromium`, then `PLAYWRIGHT_BROWSERS_PATH=/tmp/x/b NODE_PATH=/tmp/x/node_modules node tests/run.mjs ...`.


## Measurement conventions (`tools/bench/`)

`node tools/bench/run.mjs <built.html> --label=x` writes `tools/bench/reports/x.json`. `node tools/bench/compare.mjs release fixes x` writes `tools/bench/reports/scorecard.md` using `tools/bench/rubric.mjs`. Features make themselves measurable by following these conventions:

- **NPC-started events** carry `npc: true` on the event, or `ctx.npcMove = true` on the queued item. The bot counts them as `npcMovesPerDecade`.
- **After-action reports.** A battle object that got one carries it in `b.aar` (`{ causes: [{ label, pct }], text }`). The bot counts `afterActionShare`.
- **Signature systems** register themselves: `A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { chronicle: true })`. The other keys are `beliefTruth` and `bothScales`.
- **Memory.** Events that read another event's flag, or `p.flags.ev`, count as memory events. Prefer `C.flag(p, "x")` in `cond`, so the static analyzer sees the link.
