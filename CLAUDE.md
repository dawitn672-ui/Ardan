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

## Layout (full table: `.claude/skills/ardan-dev-process/references/repo-layout-and-build-rules.md`)

`src/core/release/` is the release's readable source (edit it in place); `src/<system>/NN-name/` is a feature (`*.core.js`,
`*.events.js`, `test.mjs`, `README.md`); `src/<system>/engine/` the v2 engine (bundle with `node tools/build-v2.mjs`, never
edit the bundle); `data/` content as JSON; `tests/`, `tools/`, `docs/` (reference only), `archive/` (retired code, never
deleted); `vendor/` is the untouched original (**never edit**). Features apply in folder-name order across systems.

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

## Rules that keep the build working (details and examples: the same reference file)

- **The built game is not committed** (`index.html` is ignored; never `git add -f` it). Build privately: `--out=/tmp/ardan/<you>/x.html`.
- **Parallel safety:** a builder owns only its own feature folder or data files, works in a worktree, **pushes nothing**,
  takes H-/D- numbers only from its brief (else `D-NEW-1`, `H-NEW`), and says so when it touches a shared file.
- **Change the release in its source**, with a comment where the reason is not obvious; no new `patches.mjs`. Event
  functions in `src/core/release/content/` are read as text: run `tools/release/identity-probe.mjs` before and after.
  A refactor meant to change nothing: build before and after and run `tools/release/verify.mjs`.
- **New systems in `*.core.js`**: hooks with `A.onMonth.push`, `UI.A`/`UI.C`, and `A.addStage(...)` for the seven staged
  functions (never assign them; `tools/lint-stages.mjs`). Call your code from the flow with a guarded `if (A.myHook)`.
- **Determinism:** engine code uses only `A.rand`, `A.ri`, `A.rf`, `A.chance`, `A.pick`, `A.wpick`, `A.gauss`; never
  `Math.random` or `Date.now`. **Rendering is pure:** UI never consumes `A.rand` or changes `A.S`. One redraw a press.
- **Security:** every interpolated value through `UI.esc`; no inline handlers (`data-a`/`data-v` with `UI.A`); no `eval`.
- **State:** new fields tolerate old saves where missing; `SAVES.clean` strips `<`, `>` and `"` from loaded strings.

## When an approach fails, and long sessions

- **Rewind, don't patch around a failed approach:** `git checkout -- <files>` or `git restore` to the last good state,
  then try the next idea clean (the owner's own `/rewind` does the same for a session). **Three failed fixes in a row
  mean the design is wrong:** stop, find the root cause, and say so in the report.
- **Hand off, don't drag history:** a builder ends each step with a short handoff in its report (done, evidence, open,
  next, files) so a fresh agent can continue without the conversation.

# Compact instructions
When compacting, keep: the owner's newest orders and their numbers; the task in progress, its branch and worktree; the
reserved H-/D- numbers; commit shas pushed or pending; agents running and what each owns; failing tests with their
causes; decisions made this session. Drop: file contents already committed, tool output already acted on, search results.

## Writing events

Use the `ardan-event-writing` skill (the event shape, `C.*` helpers, `fx` keys, checks, tokens, kin from the tree, the
voice, the lints). Events are read as text by classifiers: never reformat one in `src/core/release/content/` without
`tools/release/identity-probe.mjs` before and after.
