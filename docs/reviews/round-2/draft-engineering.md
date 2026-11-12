# Ardan v2.0.0-beta.1: engineering critique (principal engine programmer and performance engineer)

Scope: architecture, performance, memory, state growth, saves, determinism, code health, tests, build. Measured on
`/tmp/ardan/snap/index.html` (build `b593143+f119.1180324`) in headless Chromium. Scripts, raw JSON, CPU profiles and
screenshots: `/tmp/ardan/critique/engineering/` (`measure.cjs`, `renderprof.cjs`, `exp*.cjs`, `probe*.cjs`, `out/`, `shots/`).

## 1. "It gets slower the longer you play": measured

**Method.** Two 50-year lives, seed 42, Pol-01, male, 16: a noble, and a peasant enlisted at once (`A.enlist`, "1st
Goldburg Crossbows"). Play is `T.play` from `tests/helpers.mjs` (`A.advance(400)`, cards answered by `A.eventAuto`). Every
5 years: 12 months timed one by one (each ends where Next month ends, `V2T.nextTurn`); every tab drawn 3 times; 5
`UI.refresh()` on Life; a save; state sizes; heap after forced GC; and **3 real Next month presses** through the button's
own handler (`UI.A.v2Next`: the stepper's slices, cards answered through the modal's `evChoose`/`evClose`). Four other
critics shared the 4-core box (load 20–54), so wall clock was useless. **Every time below is CPU time of the renderer's
main thread** (CDP `ThreadTime`, `threadTicks`); a fixed calibration loop stayed at 48–100 ms. Wall time was 2–6× higher.

**In one line: the engine does not get slower; the interface does, and the interface is most of the cost from day one.**

- **The engine month is flat**: median 120 → 44 ms (noble), 138 → 74 ms (soldier) over 50 years. It peaks in war years
  (199 ms median at +30 for the noble, where `A.wsDay` grows 4× per month) and every December (year turn, 120–270 ms).
- **A real Next month costs 2–3× more late in life**: mean of the presses at +0/+5/+10 against +40/+45/+50: noble 763 →
  1,580 ms, soldier 699 → 2,020 ms, although late months brought fewer cards (1.1–1.3 → 0.9–1.1). Quiet months (no card):
  median 303–386 → 463–1,175 ms. Worst: **6,880 ms** for a month with 8 cards (noble, +35). The engine (`A.dayTick`) is
  **12.8% of a real month at year 0 and 3.9% at year 50** (profiles `rp-y0-real`, `rp-y50-real`); the rest is redrawing.
- **Every redraw grows**: Life refresh 44 → 375 ms in session (right after drawing every tab, whose DOM is still pinned:
  flaw 18), 49 → 92 ms in a fresh page loaded with a year-50 save;
  Life draw 57 → 454 ms; People tab 133 → 1,023 ms (peak, +40).
- **Why (`exp.cjs`, year-50 save, CPU per refresh).** Year 0: 49 ms, 17 forced layouts. Year 50: 92 ms, 27 forced layouts,
  layout time 13 → 33 ms. Story log cut to 2 years: 58 ms. Post-render passes stubbed (`FOLD.cards`, `LOOK.fitLife`,
  `LOOK.chipFit`, `LOOK.nameFit`, `MOTION.play`): 79 ms and **4 layouts**. Both: **42 ms, below year 0**. The log panel
  keeps 40 years in the DOM (866 lines, 1,612 nodes at year 50, `shots/y50-life-1366.png`, ~25 visible), and every forced
  layout re-lays all of it out.
- **Not a session leak, but DOM churn**: after 100 and 300 more redraws a refresh costs the same (92 → 85 → 84 ms). But each
  redraw's old DOM stays alive for ~1.1 s: 50 quick redraws left 294k Blink nodes after two forced GCs (5.6k before, 27k
  three seconds later, 25k with `MOTION.play` stubbed). Its `setTimeout` closures pin every replaced tree.
- **What grows without limit**: living named people 960 → 1,497 (+56%); `A.S` 2.6 → 5.1 MB; save 299 → 810 KB gzipped;
  `realms` 396 → 1,040 KB (`forces`, `mkt`, `pol`, `riCourt`, `mem`); `S.wrec` 1 → 128 KB ("drops nothing" by design);
  the **player record 4 → 117 KB with 102 keys** (`flags.ev` 349 ids, `mw` 22 KB, `evC`, `evN`, `atlas`, `rn`, `ec`,
  `chap`, `adv`, `retry`, `deedLog`); relation records ~350 → ~1,380; heap after GC 62 → 108–115 MB; Blink nodes 2.3k →
  6.1k against a 3.1k-node document.
- **Hot functions.** Engine month at year 1 (inclusive): `A.monthTick` 38–49% (69 `onMonth` hooks), `A.wsDay` 22–36%,
  v2 `DV.tick` 12% (`buildWorld`/`loadPair`/`gameFactors` rebuilt monthly), `A.armyThink` 7%, `CO.month`/`CO.day` 6–9%,
  `A.yearTurn` 6.5%, `A.memSum` 5.8%, the director 5.7%, `E.caravans` and `MT.month` ~5% each. Slower by year 50 where the
  world is at war: `A.wsDay` ×4 per month, `A.supplyMap` ×5.8 (self). Real month at year 50 (self): `UI.refreshTab`
  17.8%, `FOLD.cards` 16.1%, `LOOK.fitLife` 11.8%, `getBoundingClientRect` 10%, `focus` 5.4%, `MOTION.play` 3.6%.

**Raw numbers** (CPU ms; "real" = median of 3 Next month presses; refresh/draw = per call):

| Life | Year | Engine month med / max | Real Next month | Life refresh | Life draw | People tab | World tab | A.S MB | Save gz KB / CPU | People alive / dead | Log lines | Heap MB | DOM nodes doc / Blink |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noble | +0 | 120 / 250 | 386 | 44 | 57 | 133 | 164 | 2.58 | 299 / 146 | 960 / 4 | 10 | 62 | 1,194 / 2,255 |
| noble | +10 | 51 / 139 | 903 | 182 | 178 | 572 | 117 | 3.94 | 583 / 321 | 1,247 / 47 | 303 | 95 | 1,704 / 2,894 |
| noble | +20 | 51 / 122 | 388 | 294 | 309 | 889 | 170 | 4.37 | 663 / 343 | 1,368 / 91 | 601 | 101 | 2,220 / 3,935 |
| noble | +30 | 199 / 272 | 2,740 | 325 | 328 | 1,016 | 222 | 4.72 | 729 / 382 | 1,446 / 148 | 858 | 106 | 2,683 / 4,818 |
| noble | +35 | 88 / 258 | 3,109 | 354 | 378 | 1,009 | 226 | 4.90 | 768 / 419 | 1,479 / 167 | 1,026 | 107 | 2,972 / 5,356 |
| noble | +40 | 65 / 176 | 1,675 | 386 | 390 | 1,023 | 233 | 5.00 | 784 / 395 | 1,482 / 220 | 1,164 | 110 | 3,155 / 5,849 |
| noble | +50 | 44 / 129 | 2,392 | 375 | 454 | 769 | 226 | 5.09 | 810 / 401 | 1,497 / 198 | 1,425 | 115 | 3,109 / 6,071 |
| soldier | +0 | 138 / 243 | 527 | 46 | 46 | 181 | 168 | 2.60 | 300 / 166 | 970 / 5 | 11 | 62 | 1,125 / 2,168 |
| soldier | +10 | 37 / 116 | 939 | 199 | 220 | 337 | 107 | 3.87 | 572 / 269 | 1,195 / 51 | 321 | 94 | 1,770 / 3,039 |
| soldier | +20 | 41 / 131 | 1,144 | 281 | 277 | 334 | 202 | 4.29 | 647 / 305 | 1,321 / 95 | 592 | 99 | 2,218 / 3,963 |
| soldier | +30 | 37 / 118 | 782 | 303 | 311 | 549 | 159 | 4.58 | 694 / 382 | 1,393 / 150 | 861 | 102 | 2,663 / 4,798 |
| soldier | +35 | 114 / 253 | 2,425 | 315 | 412 | 634 | 187 | 4.68 | 716 / 393 | 1,418 / 168 | 1,011 | 104 | 2,926 / 5,261 |
| soldier | +40 | 45 / 156 | 1,873 | 350 | 371 | 672 | 222 | 4.86 | 754 / 377 | 1,432 / 222 | 1,134 | 106 | 3,094 / 5,753 |
| soldier | +50 | 74 / 218 | 3,319 | 341 | 326 | 512 | 219 | 5.02 | 790 / 459 | 1,498 / 186 | 1,395 | 108 | 3,015 / 5,875 |

All 22 checkpoints (every 5 years; the +5/+15/+25/+45 rows are in `out/*.json`): render purity held (`A.rngState`
unchanged by drawing every tab), and zero page errors and zero `console.error` in 100 simulated years. The noble died at
67 in the last measured year (play went on as Maren, 64); the soldier lived. `A.S` sub-keys, KB, +0 → +50 (noble): people
1,295 → 2,469, realms 396 → 1,040, houses 653 → 680, prov 101 → 210, log 2 → 129, wrec 1 → 120, aiLog 0 → 86 (capped at
300), court 70 → 72; journal 0 → 2,813 entries (small).

## 2. Flaws, most severe first

| # | Flaw (concrete) | Sev. | How to fix |
|---|---|---|---|
| 1 | **Next month is UI-bound and redraws the page many times a month.** `UI.refresh` rebuilds profile, top bar, log and tab by `innerHTML`. The stepper's `UI.clkLight` calls `UI.refreshTab()` on every 20 ms slice that adds a log line, or when 1.5 s have passed (a slow phone redraws *more*). A card costs `waitEvent`→`refresh`, `evChoose`→`renderModal`, `evClose`→`refresh`. Engine = 3.9% of a real month at year 50. | 10 | Dirty regions; while stepping repaint only the clock; one tab draw at step end; append log lines. Budget ≤ 150 ms CPU a month at year 50. |
| 2 | **Every redraw costs more as the life goes on**: Life refresh 44 → 375 ms, People 133 → ~1,000 ms, real month 2–3× (table). This is complaint 1. | 9 | Flaws 1, 3, 7, 17, 18; then the CI gate (8). |
| 3 | **Layout thrashing**: 17 → 27 forced synchronous layouts per refresh (`LayoutCount`). `FOLD.cards` reads `offsetHeight` per card between writes; `LOOK.chipFit` reads `offsetLeft` per chip after `classList.add`; `LOOK.nameFit` calls `getBoundingClientRect` once per word of a name; `LOOK.fitLife` loops on `scrollHeight`; `MOTION.play` forces `void el.offsetWidth` per node; `UI.focusRestore`. | 9 | Read everything, then write, in one rAF; CSS instead of measuring (`clamp()`, `line-clamp`, container queries); `el.animate()` instead of reflow restarts; fold by card kind, not measured height. |
| 4 | **1,928 function assignments to `A`/`UI`/`MAP`/`SAVES`** for 1,317 names: 311 functions are replaced or wrapped. `A.applyFx` has 32 definitions, `A.eventChoose` 18, `A.newGame` 17, `A.eventView` 12, `UI.eventModal` 10; in the profile `UI.render` sits under 19 wrapper frames, `UI.refresh` 12, `UI.renderModal` 9 (plus loop wrappers such as 21-npc-initiative's `for (k of ['render','refresh','refreshTab','renderModal'])`). Behaviour is the sum of folder order. Promotion alone is touched in 14 feature folders, so no single place can enforce "one holder per post" (complaint 2). | 9 | Explicit staged pipelines with one owner each (`A.FX.stages`, `UI.passes`); a lint that fails when reassignments grow. |
| 5 | **The release is patched, not owned**: 196 patch objects (367 exact-string edits, 10 that only match text added by earlier features) on minified code, plus 4,310 KB of feature code appended to a 2,095 KB vendor core. Every fix is find/replace on a blob nobody can read. | 8 | Unminify the patched core once, commit it as `src/engine/` modules, delete the patch layer; features become modules with imports. |
| 6 | **Errors are swallowed and the tests cannot see them**: 1,115 `try` in feature code, 286 empty `catch`, 457 `catch → console.error`; `A.rollEventsN` turns a throwing `cond` into "not eligible" (`catch{ok=!1}`). `tests/run.mjs` fails only on `pageerror` and CSP, never on `console.error` (`tools/soak.mjs` says so itself). | 8 | Fail tests on any `console.error`; a debug flag that rethrows in every hook. |
| 7 | **The log panel holds 40 years in the DOM** (`UI.renderLogWrap`, `S.log.slice(-40)`): 1,612 nodes at year 50 re-laid-out by every forced layout. Cutting it halves layout time (33 → 15 ms). | 7 | Render 2 years, page in more on demand; stopgap: `#log .ly{content-visibility:auto;contain-intrinsic-size:auto 400px}`. |
| 8 | **No long-play performance gate**: `bench/run.mjs perf` times only the first 3 years of a fresh world, engine only, wall clock; the scorecard's "ms per game day" was last measured at 69 features (now 119). Nothing ever draws a 50-year page. | 8 | `bench/longplay.mjs` (this harness) in CI on a committed year-50 save, with ThreadTime budgets per Next month, refresh, layouts, People tab, save size, heap. |
| 9 | **Two engines run side by side**: v2 wraps the release's `A.diploMonth` (`wrapIn('diploMonth','inFlow')`) rather than replacing it, so both diplomacy models run monthly at about equal cost (1.49 s and 1.54 s over 12 months, loaded box); three market layers tick monthly (`A.mktMonth`, 45's economy, 66's `MT.month`); old 0–100 stats are derived from the v2 body for old events. | 7 | Finish the migrations: one diplomacy, one market, one stat model; delete the muted paths. |
| 10 | **Fixing output instead of rendering it right**: 99993's `VS.sweep` walks every text node after each draw and regex-rewrites numbers and percents into words (`VS.deNum` defined in 3 files; playtest 2's "about a quarter more faster" is this kind of rewrite); two `UI.renderTab` wrappers (97) parse the tab into a `<template>` and serialize it back; FOLD, LOOK, 71-phone and 27-a11y restructure others' markup after insertion. | 7 | Words at the source (`oddsWords`, one `fmtStat`); delete the sweeps; each component owns its markup. |
| 11 | **Autosave blocks the main thread every in-game year** (`slice`: `r==='year' → UI.save(!0)`): `JSON.stringify`, `A.packState` (per person, per field `JSON.stringify` against defaults), `A.fingerprint` (a JS loop over every character), gzip: 146–166 → 401–459 ms CPU and rising. | 6 | Serialize in a Worker or save dirty sections; drop the per-field stringify. |
| 12 | **State and save have no ceiling**: `A.S` 2.6 → 5.1 MB, save 299 → 810 KB. Stored data a seed could rebuild: `app` 297 KB, `desc`+`manner`+`wants` 103 KB, `famNote` 71 KB at year 50; the court pyramid; long floats (`st`, `h.op`). | 6 | Derive looks and words from `(seed, id)`; round at the source; cap per-realm histories (`forces` 393 KB). |
| 13 | **The named population only rises** (+56% alive in 50 years) and every per-person system scales with it; `A.gcPeople` keeps anyone in `pc.rel`, every dynasty member and their parents. | 6 | Off-screen NPCs as compact stubs; a target population per realm. |
| 14 | **Boot throws work away**: a full world is generated for the title screen (415 people, v2 continent, always seed 7) and discarded at New life; each new seed costs ~1.1 s CPU of erosion (`erode` 11% of boot, `VM.build` 7%); 5,004 events are regex-classified on every boot (48's `FL.convertEvent` per pack and again in `FL.convertAll`; regexes ≈ 10% of boot); 826 retired events are still parsed. Content-ready 2.6 s on a quiet core (22 s here), heap 131 MB before GC. | 6 | Precompute event metadata at build; a static title picture; generate the continent after the player picks, in a Worker; drop retired events from the blob. |
| 15 | **Timing tests on wall clock** in shared CI: 84-top-bar's slice-gap test, 62-inked-map "timed again ... up to 3 more times", 66-markets "the bar is 1.5 on a quiet machine; a shared one is noisy, so the test holds it to 2", 73-score "the best of three: one try read another page's work", the map test "re-timed under load" (STATUS). | 6 | `ThreadTime` (09-scale already does) or count work (layouts, ticks). |
| 16 | **The built game is committed every round**: 98 versions of `index.html` are **104 MB of the 115 MB pack**; zstd + base-122 output cannot delta. | 6 | Publish the build from CI as an artifact; stop committing it (and the `git gc` ritual goes). |
| 17 | **The People tab is mostly inline SVG**: at year 50, 150 KB of HTML for 23 rows, 131 KB of it 18 portraits (1,741 of 2,088 nodes), re-parsed and re-laid-out on every draw. | 5 | Render each portrait once to a `blob:` image (CSP allows it) and use `<img>`; cache by person and age band. |
| 18 | **`MOTION.play` pins replaced DOM**: `el['_mo_'+cls]=setTimeout(off, ms+200)` closures keep every old tree alive ~1.1 s (294k Blink nodes after 50 quick redraws; 25k without it), so a month with cards churns the collector. | 5 | `el.animate()` with `finished` promises, or track and clear timers when a container is replaced. |
| 19 | **The player record is a junk drawer**: 102 keys, 100–117 KB at year 50; five stores record which events were seen (`flags.ev`, `S.evShown`, `S.evRecent`, `mw.last`, `evC`/`evN`), and `ec`, `rn`, `chap`, `atlas`, `deedLog`, `retry`, `npci` each keep their own history. | 5 | One schema'd life-memory store; migrate and delete the rest. |
| 20 | **The war map runs daily for the whole continent** whenever any war exists (`A.wsDay` 22–36% of a month; `CO.day` per battalion per day; `A.supplyMap` ×5.8 by year 50). | 5 | Simulate far wars weekly or abstractly; daily only near the player. |
| 21 | **The World tab repaints its terrain from noise** each draw (`renderMap`, `noise`, `fbm`, `bilinear`, `hillshade`; `MAP.draw` 26% of drawing every tab; World tab 101–257 ms). | 5 | Cache the base as an `ImageBitmap` per seed and zoom; redraw overlays only. |
| 22 | **CSS weight**: 56 `<style>` elements, 700 KB of CSS, 122 `!important`, matched on each of the 17–27 style recalcs per refresh. | 5 | One stylesheet with tokens; purge dead rules by coverage. |
| 23 | **Load order is folder-name order**, so "last" means more nines: `9990…`, `99990…`, and three `99999-` folders ordered by suffix (content < names < renown). | 5 | `after:`/`before:` in a feature manifest, checked at build; or imports. |
| 24 | **Hidden coupling through optional globals**: `if (A.X)` guards on other features (`A.WC` 23, `A.RI` 23, `A.FAR` 17 for the excluded Far Lands, `A.BONDS` 17, `A.COUNCIL` 16); a missing feature silently changes behaviour. | 5 | Declared dependencies; the build fails on a missing one. |
| 25 | **751 browser tests each boot the full 5 MB game** in a fresh context (2.6–3.4 s of main-thread work each, ≈ 33–43 minutes per CI run), and each of 8 shards rebuilds (52 s here) and reruns every linter. | 5 | Boot once per worker and reset with `A.newGame`; build and lint once and hand `index.html` to the shards. |
| 26 | **Every monthly roll evaluates all 5,004 conditions**, retired ones too, because `EC.rollAsClassic` (58) replays the classic draw to keep the random stream (5.7% of a month). | 4 | Index events by class, age and rank; accept one stream break in a save-version bump. |
| 27 | **69 `onMonth` hooks run unconditionally** for every realm, each in its own try/catch. | 4 | A scheduler with cadence and level of detail per system; per-hook timing in the bench. |
| 28 | **`S.wrec` keeps the whole run by design** (57: "drops nothing"); Annals and beliefs read it. | 4 | Full detail for 30 years, then the greatest entries; index by realm. |
| 29 | **No per-test timeout** (`tests/run.mjs` times only the boot): a hung `evaluate` holds a shard until the 120-minute job limit. | 4 | `Promise.race` each test with a limit; report TIMEOUT. |
| 30 | **Skips report as passes**: `return { ok: true, detail: 'skipped: …' }` in 16 tests (57 ×3, 59, 60, 64 ×8, 66, 96, 99997). | 4 | A SKIP state, counted in CI. |
| 31 | **Save write amplification**: `SAVES.put` reads 3 slots and rewrites all 4 per save (~3 MB at year 50), then `SAVES.list` reads every slot back for its size. | 3 | A ring index in a meta record; one write; sizes in the meta. |
| 32 | **The build takes 52 s for any change** (zstd level 19 over 16 MB); no fast mode. | 3 | `--fast` at zstd 3 for local work. |
| 33 | **Input is scattered**: 9 `keydown` and 8 `click` listeners added by separate features, outside `UI.A`'s router. | 3 | One key map, one delegated router. |
| 34 | **13.4 MB of script text stays in the DOM** (116 injected `<script>` elements) plus a 3.4 MB lore string; base-122 and zstd are decoded in JavaScript at every boot. | 3 | Remove script elements after they run; serve gzip-compressed files when hosted. |
| 35 | **Toasts write `--ts-h` on `:root`** (96-moments), invalidating style for the whole document on each toast. | 2 | Set it on the toast stack element. |

## 3. Keep

- Determinism holds where it matters: no `Math.random`/`Date.now` in engine code; render purity held at all 22
  checkpoints; a save and load through `SAVES.encode`/`decode` left the next 3 years bit-identical (`exp4`); 8 real Next
  months with 20 cards, played through the UI, replayed exactly from the journal (`exp5`).
- The command journal, `A.replay` and the save fingerprint: the right base for bug reports.
- Reproducible build (my rebuild was byte-identical), CSP with script hashes, no inline handlers, `UI.esc` everywhere.
- 09-scale's ThreadTime timing and `tools/soak.mjs` (a seeded monkey that records `console.error`) are the right tools.
- The engine month itself: flat over 50 years at 40–120 ms CPU, with zero errors in 100 simulated years.

## 4. Top 5 to do first

1. **Stop full-page redraws during Next month** (flaw 1): while stepping repaint only the clock; draw the tab once at the
   end; append log lines; refresh only the region that changed. Expect a year-50 month to fall from 1.5–3 s CPU to about
   0.2 s.
2. **Kill forced layouts and DOM bloat** (3, 7, 10, 17, 18): batch reads before writes, CSS instead of measuring, Web
   Animations instead of reflow restarts, words rendered at the source, a windowed log, portraits as images. Target: at
   most 3 layouts and 60 ms CPU per refresh at year 50.
3. **A long-play CI gate, and errors made fatal** (6, 8, 15): a committed year-50 save, ThreadTime budgets for Next month,
   refresh, People tab, save and heap; tests fail on `console.error`.
4. **Collapse the wrapper chains on the hot paths** (4, 9): `applyFx`, `eventChoose`, `eventView`, `newGame`,
   `UI.render`/`refresh`/`renderModal` become explicit staged pipelines; finish v2 so one diplomacy, one market and one
   stat model run.
5. **Put a ceiling on state** (11–13, 19, 28): looks and words derived from the seed, one life-memory store, compacted
   chronicle and realm histories, NPC level of detail, autosave in a Worker. Target: a year-50 save under 400 KB gzipped
   and a heap under 90 MB.
