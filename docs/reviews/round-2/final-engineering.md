# Ardan v2.0.0-beta.1: engineering critique, final (principal engine programmer and performance engineer)

Judged on the frozen copy `/tmp/ardan/snap` (`index.html`, build `b593143+f119.1180324`), headless Chromium, 1366 px and
420 px. I replayed the first draft's claims and ran my own: 400+ real Next month presses (clicks through the page's own
router on the button, on each card's first choice and on Close), a devtools trace, an independent 60-year life (seed 7,
peasant girl from birth), state audits every 10 years, journal replays, a 100-press session, ablations. All times are
**CPU time of the page's main thread** (CDP `ThreadTime`); the box was shared, so wall time is quoted only where it was idle.
Scripts and raw output: `/tmp/ardan/critique/engineering/final/` (`press.cjs`, `trace.cjs`, `hasprobe.cjs`, `stick.cjs`,
`death.cjs`, `ablate.cjs`, `session.cjs`, `gen.cjs`, `analyze.cjs`, `regrant.cjs`, `replay2.cjs`, `uireplay.cjs`, `out/`).

## 1. The verdict in numbers

**The slowdown is real, and the first draft missed its main cause.** The engine is flat (a year of world time is
0.75–1.3 s CPU with nothing drawn). The page is what slows, in two ways:

1. **A sticky "restyle everything" mode (new finding).** Once a tutorial hint box (`.hint`) or the dead player's bar
   (`#agebar`, "Your life is over…") has been drawn once, *every* DOM insertion makes the browser recompute the style of
   the whole document, until the page is reloaded. Dismissing the hint, playing on as the heir or a full `UI.render()`
   does not clear it. Every life ends in a death, so every long session ends up in this mode.
2. **Growth of the page.** The desktop layout rebuilds a story log that grows from 20 to 1,618 elements on every refresh.

| Next month, 1366 px, CPU ms (mean / median / quiet month) | new game, age 16 | year 50 |
|---|---|---|
| normal mode (no hint or death bar drawn yet), 30 presses each | 448 / 425 / 231 | 633 / 500 / 294 |
| restyle mode (a hint on screen, or after one death), 30 presses each | 934 / 884 / 487 | 1,555 / 1,317 / 538 |
| cost of one more card in the month (fit), normal → restyle mode | 173 → 424 | 358 → 1,001 |

- Age alone costs 1.4× (448 → 633). The mode costs 2.1–2.5× at any age. Worst press: 4,523 ms (2 cards, year 50).
- On an idle box a quiet year-50 month took 277 ms wall in normal mode; the same months in restyle mode cost 2.2× the CPU.
- At 420 px there is no growth (604 at year 0, 528 at year 50): the log is not on the Life screen and the page is small.
- Trace of 4 presses in restyle mode at year 50: style recalculation 3,509 ms of about 5,200 (67%); layout 257 ms; HTML
  parsing 84 ms; garbage collection 3 ms. 206 recalcs restyled 560,316 elements: 2,720 each, in a 2,894-element page.
- Proof of cause: on 16 identical presses, deleting four CSS rules before play cut CPU 23,580 → 13,959 ms (−41%) and
  style time 16,085 → 6,789 ms (−58%). Probe: appending one empty `<span>` costs 0.01 ms of style in normal mode and
  13–21 ms once a hint or the death bar has been drawn (`hasprobe.cjs`, `stick.cjs`, `death.cjs`).

**The coherency run** (`/tmp/ardan/coh/run1.txt`). *Dead councillors*: real. Death vacates nothing; a dead councillor sits
until the yearly sweep (one seat in the world at every 10-year audit from year 20). *"no v2dip"*: a day-0 artefact. `S.v2dip`,
`S.v2w` and `S.v2t` are created by the first day tick, not by `A.newGame`; after one day `A.V2SAVE.check()` passes (8 lives ×
3 stores = the 24 "problems"). The check is right and the new-game initialiser is incomplete (row 30). The run did not
play long enough to meet the real failure: in my 60-year life the game's own audit fails for good from year 55 (row 2).

## 2. Flaws, most severe first

`[v]` verified by me, `[d]` from the first draft, not re-checked.

| # | Flaw | Sev. | How to fix |
|---|---|---|---|
| 1 | **Sticky whole-document restyle.** `[v]` Four rules hang `:has()` on `body`: `body:has(#modal .obit) .hint`, `body:has(#modal .obit) #agebar` (`28-endings/endings.core.js:213-215`), `body:has(#modal > .hint) #tabbody .hint…`, `body:has(#modal > .mbox:not(.sc-card)) #clk .hint…` (`91-look/look.b-base.core.js:66-68`). They are evaluated the first time a `.hint` or `#agebar` exists, which flags `body`. Two other rules end in a bare position after `:has()` (`#game.phone .barrow:is(:has(…)) > :nth-child(2)` in `99993-v2-stats/e-sheet.core.js:93,102`, `.prow:has(.v2-tier) > span:first-child` in `91-look/look.c-layout.core.js:127`), so the invalidation covers every element. From then on each insertion restyles ~2,900 elements, and the post-render passes insert and measure 28–30 times a refresh. Numbers in §1. This is complaint 1. | 10 | Delete the four rules: the app is already `inert` behind a modal, so `#app[inert] .hint{display:none}`, and a class on `#game` set in `UI.renderModal` for the obituary. Give the two right-hand sides a class. Lint the built CSS: no `:has()` on `body`, `#app`, `#game`; none followed by a bare `:nth-child`/tag. CI probe: after a hint and after a death, one `<span>` insert must cost under 1 ms of style. One hour of work for about half the cost of a month. |
| 2 | **A swallowed crash makes two lords of one seat** (complaint 2). `[v]` `N.regrant` (`99995-v2-nobility/a-court.core.js:347`) reads `ohd.noble` where `ohd` is null for a headless house. Seed 7: it threw in October, November and December 1159 ("March of Rushzag Oasis"). Each throw came after `newHouse`/`newHolder` had made a house and 2–3 people, and aborted the month's pass (164 titles after it skipped). From 1 January 1160 `A.V2F.audit()` reports `lordship-seat 170 p1n7/p1n5` for the rest of the game: the old house's new head and the orphan house's head both sit at Rushzag Oasis. Only `console.error` saw it. Deterministic (`regrant.cjs`). | 9 | `ohd && ohd.noble`. Decide first, create last: no person or house is made until every check has passed (build a plan, then commit it). One try per title so one title cannot stop the pass. Regression test from the year-50 state in `out/peasant-y50-state.json`. |
| 3 | **Errors are swallowed and no test can see them.** `[v]` 1,112 `try` blocks in the built core (1,040 in features; the release had 72), 297 with an empty `catch`, 436 that only log. `tests/run.mjs` fails on `pageerror` and CSP only. `tools/soak.mjs`, the one tool that records `console.error`, is in no workflow. `v2nOneHolder` plays 10 seeds for 10 years; row 2 needs 54. | 9 | Tests and benches fail on any `console.error`. One `A.guard(name, fn)` that counts failures into the problem report and rethrows in a debug build. Nightly: 8 seeds × 60 years with `A.V2SAVE.check()`, the audits and the round-2 coherency registry every 5 years. |
| 4 | **No single store of who holds a post** (complaint 2). `[v]` `/tmp/ardan/posts-map.md` lists 14 stores (`pc.mil.rank`, `r.council` + `pc.office`, `armies[].gen`, `divs[].cmd`, 9997's slots, `r.pol.off`, `r.orders`, `S.court`…); command is computed from the grade, a promotion takes command from nobody, leaving clears only `pc.mil`. My audits add: death vacates nothing (§1), and realms born in play never get a council (34 → 42 realms by year 60, 8 of them with five empty seats, forever). Promotion code sits in 14 feature folders `[d]`. | 9 | One registry, `S.posts`, as posts-map §5: `A.POSTS.appoint/vacate` the only writers; `A.kill` and realm birth call it; legacy fields become mirrors; `A.POSTS.audit()` in row 3's nightly run. |
| 5 | **A month redraws the page 3–6 times.** `[v]` Per press at year 50: `UI.refresh` 2.9, `refreshTab` 3.3, `renderModal` 3.8, `clkPaint` 4.6, 110 forced layouts, 121 style recalcs. Each card costs `waitEvent`→refresh, `evChoose`→modal, `evClose`→refresh: 173 ms a card at year 0, 358 at year 50. `UI.clkLight` redraws the tab whenever 1.5 s of wall time have passed (`Date.now()`), so a slow device redraws more. The engine is 20–70 ms of the press. | 8 | A redraw policy with one owner: while stepping paint only `#clk`; at a card open the modal and nothing else; one refresh when the step ends; dirty flags per region (profile, bar, log, tab). Budget: 150 ms a quiet month, 100 ms a card, at year 50. |
| 6 | **No performance gate plays the game.** `[v]` `bench/run.mjs perf` times the engine's first years on wall clock. Nothing presses the button, draws a year-50 page, shows a hint or dies, so rows 1 and 7 shipped. | 8 | Put `press.cjs`'s loop in CI on two committed saves (year 0, year 50), in normal mode and after a death: budgets on CPU per month, recalcs per press, the insert probe, save size. |
| 7 | **The story log is rebuilt whole on every refresh and holds 40 years.** `[v]` `UI.renderLogWrap` (`S.log.slice(-40)`): 20 → 1,618 elements, the document 1,250 → 2,900. Cutting it to 2 years takes a year-50 refresh from 109 to 70 ms. It is the whole age effect on desktop: every tab draw doubles or worse (realm 79 → 172 ms, atlas 30 → 139, life 73 → 136) because `UI.render` redraws the log beside it. | 7 | Append-only log: keep its DOM, add the new lines. Two years in the page, older years on demand. Stopgap: `#log .ly{content-visibility:auto}`. |
| 8 | **Behaviour is a stack of wrappers.** `[v]` 2,403 function definitions for 1,679 names on `A`/`UI`/`MAP`/`SAVES`; 351 names defined more than once. `A.applyFx` 32 times (27 features), `A.newGame` 20, `A.eventChoose` 19, `UI.render` 18, `UI.renderModal` 16, `A.eventView` 12, `UI.refresh` and `refreshTab` 11. What a function does is the sum of folder order; row 1 is six features' CSS meeting by accident. | 8 | Named stages with one owner each (`A.FX.stages`, `UI.passes`, `A.onNewGame`); a lint that fails when a hot function gains a wrapper. |
| 9 | **The release is patched, not owned.** `[v]` 196 patches of exact-string edits on minified code; the built core is 6.56 MB against the release's 2.13 MB. 10 patches match only text an earlier feature wrote `[d]`. | 8 | Unminify the patched core once and commit it as modules; features import it; delete the patch layer. |
| 10 | **Kingdoms are renamed by patching the browser.** `[v]` `99999-v2-names/names.core.js:218-235` replaces the setters of `Element.prototype.innerHTML`/`outerHTML`, `Node.prototype.textContent`, `HTMLElement.prototype.title`/`innerText`, plus `insertAdjacentHTML`, `setAttribute` and the canvas's `fillText`/`strokeText`/`measureText`, and runs about 20 regexes over everything written to the page (also `A.T`, `A.log`, `A.news`, a deep rewrite of `LORE`). CPU is small (0.2%); the risk is not: any text that matches is rewritten (a person called Amber, a typed name, a mod), and every DOM API not yet patched leaks the old names. | 7 | Rename in the data: one table of realm names applied to `LORE` and the event packs at build time. Delete the prototype patches; a test greps the built page for the old names. |
| 11 | **Fixing the page after drawing it.** `[v]` FOLD, LOOK, MOTION, 71-phone and 27-a11y restructure other features' markup after insertion and measure as they go: 28–30 forced layouts a refresh. Cheap in normal mode (stubbing them: 109 → 106 ms), ruinous in row 1's mode, where they are the top style forcers (`UI.refreshTab` 824 ms, `FOLD.cards` 770, `LOOK.fitLife` 429, `LOOK.nameFit` 377, `MOT.play` 237 in 4 presses). `VS.sweep` and its `MutationObserver` on `body` re-walk every inserted text node with regexes to turn numbers into words: 19 ms of a 109 ms refresh. Two `UI.renderTab` wrappers parse the tab into a `<template>` and serialise it back `[d]`. | 6 | Words at the source (`fmtStat`, `oddsWords`); each component owns its markup; folding by card kind, not measured height; reads before writes in one pass; `el.animate()` instead of reflow restarts. |
| 12 | **"Next year" (complaint 12) is cheap in the engine and blocked by the interface.** `[v]` A year with nothing drawn: 0.75–1.3 s CPU (1.7–2.3 s the first year after a load), 6–12 stops for cards. 84-top-bar still has `week`, `season` and `until` steps; 99992 deleted their actions (`delete UI.A[k]`). Today a year is 12 presses: 5–8 s CPU of redraws at year 50, about 19 s in row 1's mode. | 6 | `UI.stepStart('year')` to the next 1 January turn, the same stops at cards, one redraw at the end (needs row 5). Offer it as the main step to children. |
| 13 | **Death and realm birth update nothing but themselves.** `[v]` Beside row 4: vacant land titles wait 3–12 months by design (2–8 of 246 vacant at every audit), but a throw in the pass (row 2) leaves them all waiting. | 6 | Row 4's registry; until then call the council sweep from `A.kill`. |
| 14 | **The test runner dies with the browser.** `[v]` One browser for 751 tests; `browser.newContext` is outside the `try`, so a crash ends the shard with an uncaught exception and no summary (`/tmp/ardan/paths-tests.txt`: `cutRollSkips` ran 1,192 s, then "Target page, context or browser has been closed", then Node exits). No per-test timeout. Each of 8 shards runs `tools/check.mjs`, so the build and every linter run 8 times. Every test boots the 5 MB page (1.9 s CPU). | 6 | Relaunch the browser on a crash and mark the test; `Promise.race` each test with a limit; build and lint once, hand `index.html` to the shards; one page per worker reset with `A.newGame` where a test allows. |
| 15 | **State and saves have no ceiling.** `[v]` `A.S` 2.60 → 5.40 MB in 60 years, save 300 → 847 KB. People 977 → 1,756 (alive +63%); realms 396 → 1,117 KB (`forces` 241 → 451, `mkt` 31 → 142, `pol` 25 → 123, `riCourt` 0 → 91); `wrec` 0 → 220 KB; `houses` is 653 KB of lore copied into the state on day 0; `app` (looks) 170 → 306 KB could be rebuilt from `(seed, id)`. | 5 | Derive looks and lore from the seed; cap per-realm histories; stubs for people the player has never met; target 400 KB at year 60. |
| 16 | **Two models run where one should.** `[v]` v2 diplomacy (`DV.tick`, 6.7% of an engine month) runs beside the release's `A.diploMonth` (2.3%), whose dice are muted by flag-wrapped return values (`off('aiBreakAlly', false)`, `off('aiAllyBar', 1e9)`…): a list that must track minified code by hand. Three market layers and old 0–100 stats derived from the v2 body `[d]`. | 5 | Finish each migration and delete the muted path; until then a test asserts every muted function is still called only under the flag. |
| 17 | **Starting a life freezes the page.** `[v]` `A.newGame` and the first draw: 1.7–3.3 s CPU in one task (by seed), no progress shown. Boot: title at about 1.5 s, content ready after 1.9 s CPU. A world is built for the title screen and thrown away; 5,004 events are regex-classified at each boot `[d]`. | 5 | Generate the continent in a Worker (or in slices with a progress line) after the player confirms; event metadata at build time. |
| 18 | **Timing tests on wall clock.** `[v]` 9 test files in the default build read `performance.now`/`Date.now` (84-top-bar, 62-inked-map, 66-markets, 73-score, 96-moments…); their comments record re-timings under load `[d]`. 22 fixed `waitForTimeout` sleeps. | 5 | `ThreadTime` (09-scale already does) or counts of work. |
| 19 | **The built game is committed every round.** `[v]` 98 versions of `index.html` are 103.5 MB of the 115 MB pack. | 5 | CI publishes the build as an artifact; keep only tagged versions. |
| 20 | **Named people only accumulate**, and every per-person system scales with them. `[v]` (+10 a year; `A.gcPeople` keeps kin and houses `[d]`.) | 5 | A target population per realm; compact stubs off screen. |
| 21 | **The war map runs daily for the continent whenever any war exists.** `[v]` `A.wsDay` is 48.7% of an engine month at year 0 with one war; `A.armyThink` 15.3%; 9997-companies 16% of self time. | 4 | Far wars weekly or abstract; daily only near the player. |
| 22 | **Autosave blocks the year turn.** `[v]` `UI.save` on the main thread: 71 → 150 → 180 ms CPU (years 0, 20, 60), on the heaviest day of the year; `SAVES.put` reads three slots and rewrites four (3.4 MB a save at year 60). | 4 | Serialise in a Worker; a ring index, one write. |
| 23 | **Load order is folder-name order** (`9990…`, `99990…`, three `99999-` folders sorted by suffix) and features find each other through optional globals (`if (A.WC)`, `A.FAR` for the excluded Far Lands) `[d]`. | 4 | `after:` in a feature manifest, checked at build; declared dependencies. |
| 24 | **The People tab is 2,100–2,300 nodes of inline SVG from day 0.** `[v]` 147–162 KB of HTML, 18–20 portraits; 102 → 176 ms a draw. Not growth. | 4 | Portraits as cached `blob:` images by person and age band. |
| 25 | **CSS weight.** `[v]` 56 `<style>` elements, 700 KB, 2,753 rules, 1,171 selectors keyed on `:root[…]`, 169 `!important`, 62 `:has()` selectors. | 4 | One generated stylesheet with tokens; purge by coverage; row 1's lint. |
| 26 | **The player record is a junk drawer.** `[v]` 59 keys at birth, 106 keys and 72 KB at 30: `mw`, `rel`, `flags`, `evC`, `evN`, `atlas`, `ec`, `rn`, `npci`, `retry`, `adv`, `chap`… five stores of which events were seen `[d]`. | 4 | One schema'd life-memory store; migrate and delete. |
| 27 | **Toasts write `--ts-h` on `:root`.** `[v]` (`96-moments/toasts.core.js:32,39`): a custom property on the root invalidates the whole document's style, twice a toast, and every quiet month ends with one. | 3 | Set it on `#toast-stack`. |
| 28 | **Garbage churn.** `[v]` Between presses Blink holds 13k–94k nodes for a 2.9k-node page; MOTION's timers pin replaced trees about 1 s `[d]`. It is collected: nodes after GC 5,587 → 5,643 over 100 presses. | 3 | Falls with rows 5 and 7. |
| 29 | **Monthly work that is never skipped.** `[v]` 69 `onMonth` hooks, 10 `onDay`; each roll evaluates all 5,004 event conditions (3.4% of an engine month), 826 of them retired `[d]`. | 3 | A scheduler with cadence per system; an index by class and age; drop retired events from the blob. |
| 30 | **A new game has no complete initialiser.** `[v]` `S.v2dip`, `S.v2w`, `S.v2t` appear on the first tick; fields are born lazily all over (hence row 26). | 2 | `A.newGame` runs the same steps as `A.V2SAVE.upgrade`; the invariant check stays strict. |
| 31 | 13.4 MB of script text stays in the page (116 `<script>` elements) `[v]`; 9 `keydown` and 8 `click` listeners outside `UI.A`'s router `[d]`; 3 tests pass by skipping when a dependency is absent (57 ×2, 60) `[v]`. | 2 | Remove script elements after they run; one key map; a SKIP state. |

## 3. What the first draft got wrong

- **"Not a session leak."** True for nodes, listeners and CPU in a session with no hint and no death (100 presses:
  ratio 1.04 against a fresh page). False as a verdict: row 1 is a session effect, the largest one. The draft's session
  was bot-played between checkpoints (`A.advance`), so it never met it as a change.
- **"Layout thrashing" as the cause** (its flaw 3, rated 9). Layout is 6–17% of a press. The forced reads matter because
  each forces a *style* recalc, and in row 1's mode each recalc is the whole page. With that mode off, stubbing the same
  passes saves 3 ms of 109. Its ablation ran refreshes in a loop without yielding, so `VS.sweep`'s observer never fired.
- **"2–3× more late in life."** On fresh pages with 30 presses each: 1.4× in normal mode, 1.7× in restyle mode. The draft
  compared 9 presses with 9, in a session already in restyle mode.
- **Autosave "146–166 → 401–459 ms".** Its harness ran `SAVES.encode`, then `UI.save`, then `SAVES.list` in one
  measurement. One autosave is 71 → 180 ms. Rated 6 → 4.
- **"Both diplomacy models at about equal cost."** v2's is three times the old one, and together they are 9% of an engine
  month. The flaw is the muting by flags, not the time. Rated 7 → 5.
- **"The build takes 52 s."** 14.5 s wall, 11.8 s CPU on a calmer box. Dropped as a flaw.
- **People tab "133 → 1,023 ms".** 102 → 176 ms on fresh pages; the tab is as heavy at year 0. Rated 5 → 4.
- **"Zero console.error in 100 simulated years."** One seed. Mine logged three in year 54, and they were row 2.
- **Its own 50-year replay failed at step 179 and went unreported.** Not a game fault: its harness called
  `A.deserialize` mid-session, which no journal records. My replays of 10, 30 and 60 years (126, 983 and 2,150 entries,
  one `continueAs`) and of 36 months played through the interface with every tab opened (489 entries) all end on the
  same fingerprint.
- **Counts.** 351 names redefined, not 311 (loops and `Object.assign` were missed); `A.newGame` 20, not 17; 169
  `!important`, not 122; 3 skip-as-pass tests in the default build, not 16.
- **Missed entirely:** rows 1, 2, 10, 12, 13, 14's crash, 27's cost, and the answer to the coherency run.

## 4. Keep

- **Determinism.** Verified harder than the draft did (above). No `Math.random` in engine code; `Date.now` only for seeds,
  save stamps and interface throttles. Rendering every tab moved nothing.
- **The command journal, `A.replay`, the fingerprint in every save** ("the save is damaged" is a real check), the
  four-slot backup ring and the second-tab guard.
- **The engine's month.** Flat for 60 years: 8.4–12.5 s CPU a decade with a bot answering every card.
- **A reproducible build** (my rebuild was byte-identical), the CSP with script hashes, no inline handlers, `UI.esc`.
- **The staged boot** (title first, event packs one per tick, lore last) and `A.packState`.
- **`src/v2` as plain modules with their own unit tests**, and `A.V2F.audit` / `A.V2SAVE.check`: they caught row 2 the
  moment anything ran them long enough. The round-2 coherency registry is the right next step.
- **09-scale's `ThreadTime` timing** and `tools/soak.mjs`: the right tools, not yet wired into CI.

## 5. Order of work for this lens

1. **This week, small and independent.** Row 1 (six CSS rules and a probe): about half the cost of every month for
   anyone who has seen a hint or died, at no risk. Row 2 (a null guard, then create-last). Row 3 (tests fail on
   `console.error`; the nightly 60-year audit). These three stop the bleeding and make every later step measurable.
2. **The gate before the rework.** Row 6: the press harness in CI with budgets, so the next steps are held.
3. **The redraw policy.** Rows 5, 7 and 11 together: one refresh a press, an append-only log, words at the source.
   Expected: a year-50 month near 150–250 ms CPU, flat with age. Row 12 ("Next year") is then a small step on top, and
   should not be attempted before, or a year will cost what twelve months cost now.
4. **Posts.** Row 4 with the design lens (posts-map §5.10's order), behind row 3's net. Row 13 falls out of it.
5. **Own the code.** Rows 8, 9, 10, 16: commit the unminified core, turn the 32-deep wrapper chains into named stages,
   rename in data, delete muted paths. Largest effort, lowest immediate owner impact, and what stops rows 1 and 2 recurring.
6. **Plumbing.** Rows 14, 18, 19 (runner, timing tests, stop committing the build), then ceilings on state (15, 20, 22, 26).
