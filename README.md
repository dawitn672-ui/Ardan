# Ardan

*Bloodlines & Banners*: a medieval life simulation and grand strategy game. You live one person's life, from birth to
death, inside a simulated continent of realms, courts, families and wars, in the year 1105 AR. Be a peasant, a soldier, a
merchant, a priest or a noble; marry, fight, scheme, rule, or just survive. Every figure acts for a reason that fits his
post and his character; nothing in the world happens for no reason at all.

The game is one HTML file. It needs no server and no network, and everything works offline. Time moves by two buttons,
*Next month* and *Next year*; only things that matter (a choice, a battle, a duel, a deadline) stop a step midway. The same
seed and the same choices always give the same world.

**State of the project (2026-11-19).** The newest version is v2.1.0-alpha.15, built on the shipped release and on the
owner's v2 design (`docs/V2_SPEC.md`). It is an alpha under active work: the plan and what is done are in
[docs/PROGRESS.md](docs/PROGRESS.md). The end goal is an iPhone app ([docs/IOS_ROADMAP.md](docs/IOS_ROADMAP.md)).

## Play it

The built game is not committed to the repo (it is made from the source in a few seconds), so you build or fetch it.
You need Node 22.15 or newer and a full clone (`git clone`, not a shallow one, for the second way).

```sh
node tools/build.mjs                       # writes index.html; open it in a recent Chrome, Edge, Firefox or Safari
node tools/version.mjs list                # every version of the game, oldest first
node tools/version.mjs get v2.1.0-alpha.15 # writes versions/ardan-v2.1.0-alpha.15.html: that version exactly as it was
```

`main` holds only the original upload, so check out `v2-integration` (the branch the game is built on) before building.
A version's file rebuilds from that commit's own source and is checked against the build hash its row in
[docs/VERSIONS.md](docs/VERSIONS.md) records. Saves load and save through the game's menu; every version's sample save
is in `tests/saves/` ([tests/saves/README.md](tests/saves/README.md) says what each shows).

## Where to start reading

1. [CLAUDE.md](CLAUDE.md): the rules, the layout, every command, how to write events. Written for people and agents alike.
2. [docs/README.md](docs/README.md): an index of every document, one line each.
3. [docs/OWNER_ORDERS.md](docs/OWNER_ORDERS.md): every standing order of the owner's, the rules the work is held to.
4. [docs/PROGRESS.md](docs/PROGRESS.md): the checklist of what is done and what is next.
5. Then [docs/HISTORY.md](docs/HISTORY.md) (what was done, step by step, and how to undo it), [docs/DECISIONS.md](docs/DECISIONS.md)
   (what was chosen and why), [docs/V2_SPEC.md](docs/V2_SPEC.md) and [docs/V3_SPEC.md](docs/V3_SPEC.md) (the owner's designs),
   [CHANGELOG.md](CHANGELOG.md) (what changed for the player, version by version).

## What is in the repo

```
CLAUDE.md                the rules, layout and commands
CHANGELOG.md             player-facing changes, one section per version
src/core/release/        the shipped release as readable source (core/, content/ with its 30 event packs, lore/, page.html)
src/<system>/NN-name/    a feature: one unit of change (*.core.js code, *.events.js events, test.mjs, README.md)
src/<system>/engine/     the v2 engine's modules (plain ES modules), bundled by tools/build-v2.mjs
data/                    content kept as data (JSON), on the page as A.DATA
assets/                  fonts and art sources, embedded at build time
vendor/                  the untouched original release (b593143), kept as the record; the build does not read it
archive/                 retired features and code, each with a NOTE.md; never built
tests/                   run.mjs (browser tests), suites/, v2/ (engine unit tests), saves/ (sample saves of every version)
tools/                   build, check, version, linters, bench/ (measurement harnesses)
docs/                    HISTORY, DECISIONS, PROGRESS and the rest; docs/README.md indexes them
.claude/skills/          the project's skills (playtest loop, life-sim systems, continent maps, iOS release)
```

The systems are `core`, `map`, `world`, `people`, `family`, `nobility`, `diplomacy`, `war`, `economy`, `events` and `ui`;
features apply in folder-name order across all of them. The release's own source is in `src/core/release/`: change it there
(there are no patches in the default build any more; the 203 old ones are baked in and listed in
`src/core/release/PATCHES.md`). `node tools/build.mjs` turns all of it into the one file.

## Versions and branches

Every significant change is a version (a row in [docs/VERSIONS.md](docs/VERSIONS.md)). A version is the commit CI tested green on
both test tiers; `node tools/version.mjs new` writes its row, moves its changelog bullets under its heading and saves a
sample game, and the commit is pushed as `release/<version>`. `node tools/version.mjs check` keeps the rows, branches, changelog
headings and sample saves in agreement.

| Branch | What it holds |
| --- | --- |
| `main` | The original upload of the release (Nov 1). Pull request #1 will bring the rest in |
| `claude/dreamy-sagan-anwszt` | The base of PR #1: the v1 rounds, and v2 up to alpha.9 |
| `v2-integration` | Where the work is merged and CI runs. Start from here |
| `release/<version>` | One per version, at exactly its commit: the restorable record |
| `work/<item>` | One agent's task, merged whole into `v2-integration` and then deleted |
| `archive/v2-lanes` | Keeps the unmerged commits of the old v2 lanes reachable |

[docs/BRANCHES.md](docs/BRANCHES.md) lists every branch on GitHub, which are active and which may be deleted.

## Tests

```sh
npm install && npx playwright install chromium    # once
node tools/check.mjs                              # everything CI runs: build, v2 engine tests, linters, browser tests, balance
node tests/run.mjs /tmp/me.html --features=my-feature   # core suites plus one feature's tests
node --test tests/v2/*.test.js                    # the v2 engine's unit tests
```

There are 961 browser tests (2026-11-19), in two tiers (T1, D-063). The **quick** tier (898 tests) runs on every push
and pull request (`check.yml`, eight shards, about 13 minutes of tests each). The **long** tier (63 tests: bot lives and
replays of several minutes each, listed in `tests/long-tests.json`) runs every night and on release branches and `[full ci]`
pushes (`long.yml`, which also plays the balance league that holds each starting path's numbers to its bands); a version
needs both green. `nightly.yml` adds larger balance, exploit and customs checks. A test fails on any uncaught error and any `console.error`. A change that moves the random stream moves
every seeded world, so a test must test the rule, not one world's luck (CLAUDE.md, "World-robust tests").

## Rules the build keeps

Pointer events only and nothing that needs hover, layout from 375x667 up, relative paths and no network (the game is meant to
ship as an iPhone app), rendering that is pure and never draws from the seeded random stream, every value put in HTML escaped,
no inline handlers and no `eval`. [CLAUDE.md](CLAUDE.md) has the full list.
