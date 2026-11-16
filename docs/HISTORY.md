# History

An append-only log: one entry per step or commit, newest at the bottom. Never edit or delete an entry; if one was
wrong, add a new entry that corrects it. Each entry has an id (`H-NNN`) that its commit message carries in brackets,
so `git log --grep='\[H-001\]'` finds the commit, and `git revert <that commit>` undoes it.

Entry fields: date and commit (or tag / release branch) · what changed and why · the owner's complaints it answers ·
files touched · tests and coherency checks · what was archived · how to undo.

## Before round 2 (summary)

Everything up to v2.0.0-beta.1 is recorded elsewhere and is not repeated here:
- `docs/VERSIONS.md`: every version from v1.0.0 (the shipped release, Oct 12) to v2.0.0-beta.1 (`86d8cc2`, Nov 6),
  each with its commit; `node tools/version.mjs get <version>` rebuilds any of them as a playable file.
- `docs/v2/STATUS.md`: the v2 steps, playtests 1 and 2 and the CI rounds that fixed them (runs 88 to 94).
- `docs/reviews/`, `docs/plan/`, `docs/north-star/`: the v1 rounds, cycles and reviews.
- beta.1 is kept on the branch `release/v2.0.0-beta.1`.

## Round 2 (the owner's "Round 2 orders", Nov 12)

### H-001 · 2026-11-11 23:43 ET · Step 0: the repo restructured, and given a memory
- **Commit:** `git log --grep='\[H-001\]'` on `v2-integration`, on top of `b8ca78c` (v2.0.0-beta.1's record commit).
- **What and why:** the owner's Step 0: a layout anyone can find their way around, nothing thrown away, and files that
  let any later session retrace and undo every step.
  - 121 live feature folders moved with `git mv` from `features/NN-name/` to `src/<system>/NN-name/` (11 systems;
    `tools/lib/features.mjs` lists them; folder-name order across systems is the build order, as before).
  - The v2 engine's modules moved from `src/v2/` to `src/<system>/engine/` (entry `src/core/engine/index.js`);
    relative imports rewritten; `tools/build-v2.mjs` bundles from there into `src/core/99990-v2/a-v2.core.js`.
  - `bench/` → `tools/bench/`, `reports/` → `tools/bench/reports/`; fonts → `assets/fonts/`; the cycle-2 sample
    save → `tests/saves/v2-cycle2-1106.ardan`; `docs/v2/V2_SPEC.md` → `docs/V2_SPEC.md`.
  - New: `data/` (the build puts `data/**/*.json` on the page as `A.DATA[...]` before any feature code; empty for
    now), `assets/`, `archive/` (with notes), `CHANGELOG.md`, `docs/HISTORY.md` (this file), `docs/DECISIONS.md`
    (D-001 to D-007), `docs/IDEAS.md`; `CLAUDE.md` rewritten as the first file to read; `README.md` layout updated.
  - Every tool, test and bench that listed `features/` now asks `tools/lib/features.mjs`; 211 files had their path
    references rewritten (code, comments and docs); relative paths inside moved features gained one `../`.
- **Complaints answered:** Round 2, Step 0 (items 1–7 of it; item 8, tags and sample saves per version, is started:
  release branches instead of tags, D-005, and `tests/saves/`).
- **Files touched:** all of `features/` (moved), `src/v2/` (moved), `bench/`, `reports/`, `tools/*.mjs`,
  `tests/run.mjs`, `tests/v2/*.test.js`, 211 files' path strings, `CLAUDE.md`, `README.md`, the new docs.
- **Tests and checks:**
  - Build: 119 features, 196 patches, 225 code files, 80 event packs, exactly as before. The new core and content
    blobs differ from beta.1's only in comment lines (58 lines, all path names in comments; 0 lines of code). The
    lore blob is identical. The v2 bundle is identical apart from its path comments.
  - `node --test tests/v2`: 29 of 29 pass. `tests/run.mjs --list`: the same 751 tests in the same order (so CI's 8
    shards hold the same tests). Lint of every event pack and the choices check: see the CI run on this commit.
  - 34 tests that read repo files while they run (saves, event sources, mods, sieges, axe checks, scale sites,
    chronicle export) were run locally against the rebuilt game: see the commit message for the count.
- **Archived:** the five Far Lands features (`archive/99-far-lands`, `990`–`993`; out of the build since `f933c89`,
  last built at `437efa6`) and the v2 kit's demo UI (`archive/v2-kit-demo-ui`, never shipped).
- **Undo:** `git revert` the H-001 commit (it is moves plus path rewrites; nothing else depends on it yet).

### H-002 · 2026-11-12 00:32 ET · Step 0 verified by CI; the coherency registry started (out of the build); owner orders recorded
- **Commits:** `d906efc` (H-001, step 0), `f4bcc66` (08-coherency, `.wip`), `93fcd5a` (DECISIONS D-008, D-009), and the
  commit that adds this entry (`git log --grep='\[H-002\]'`).
- **What and why:**
  - CI run 95 on `d906efc` (step 0) passed everything: the build check (`index.html` current), every event pack's
    lint, the choices check, the 752 browser tests in 8 shards and the balance league. Step 0 changed no behaviour.
  - `src/core/08-coherency/` (A.COHERENCY: read-only checks for contradictions) and `tools/coherency.mjs` (plays lives
    of every class and runs them) are committed with a `.wip` marker: the default build and `index.html` are
    unchanged until the post registry lands. A first run (8 lives, 10 years, built with `--include-wip`) found dead
    people still holding council seats in 3 of 8 lives (for example "Kesh spymaster: held by Majaliwa Mnazi, dead"),
    and v2 diplomacy's store missing in fresh games played by the bot (to be explained by the critique).
  - The owner's orders of Nov 12: time by Next month or Next year (D-008, to be built as B6); the model and effort for
    each part of round 2 (D-009); and "once you finish the full critique, pause everything and wait for me".
- **Complaints answered:** Round 2 Step 0 (verified); A3 started (not yet in the build).
- **Files touched:** `src/core/08-coherency/*`, `tools/coherency.mjs`, `docs/DECISIONS.md`, `CLAUDE.md`, this file.
- **Tests and checks:** CI run 95 green. Coherency run: see above (no fixes made; the owner asked for the critique first).
- **Archived:** nothing.
- **Undo:** delete `src/core/08-coherency/` and `tools/coherency.mjs` (nothing depends on them yet); D-008 and D-009
  are the owner's orders and stay.

### H-003 · 2026-11-12 06:11 ET · Step 1 done: the critique and the order of work; prep for C7 and D11; timestamps
- **Commit:** `git log --grep='\[H-003\]'`.
- **What and why:**
  - `docs/CRITIQUE.md`: the harsh critique of beta.1 by the lead critic (Fable, max effort) from five lens reports
    (engineering and UX redone by deciding Fable critics), the post map and the first coherency run: 162 flaws in 11
    areas, each rated /10 with a fix, a Keep list, and claims rejected. Its sources are in `docs/reviews/round-2/`;
    the critics' probe scripts (the seeds of the A1, A2, C6 and B5 regression tests) in `tools/critique-probes/`.
  - **The order of work** (CRITIQUE §2), recorded here as the owner asked: 1 A0 stop the bleeding · 2 A3a the net ·
    3 A1 lag · 4 B6 Next month or Next year · 5 B4 click-to-open · 6 C8a character design plan · 7 X1 own the release
    · 8 A2 one holder per post · 9 B5 declutter · 10 C8b faces and bodies · 11 X2 named stages · 12 D10 war screens
    only when deployed · 13 C6 relationships and households · 14 X3 honest cards and clocks · 15 C7 names and
    cultures · 16 C8c dress and regalia · 17 D9 map detail · 18 D12a branches and command design · 19 D11 military
    branches · 20 D12b war and command depth · 21 X4 balance · 22 X5 state diet. Seven decisions for the owner are
    listed at the end of CRITIQUE §2.
  - Prep the owner approved during the pause (not wired into the game): `docs/research/c7-names.*` (basic names for
    the 24 cultures) and `docs/research/d11-branches.*` (game-like branches, counters, terrain, tactics).
  - The owner's orders 9 (keep it game-like and simple) and 15 (time-stamp every memory entry, mark what is
    superseded): stamps added to every order, decision and history heading (the time each line was committed, from
    git blame). This is the only change to earlier entries, made by the owner's order.
- **Complaints answered:** Round 2 Step 1.
- **Files touched:** `docs/CRITIQUE.md`, `docs/reviews/round-2/*`, `tools/critique-probes/*`, `docs/research/c7-*`,
  `docs/research/d11-*`, `docs/OWNER_ORDERS.md`, `docs/DECISIONS.md`, this file.
- **Tests and checks:** documents only; the game is unchanged (`index.html` untouched).
- **Archived:** nothing.
- **Undo:** `git revert` the H-003 commit (documents only).
- **State:** paused by the owner's order 11 until the owner has reviewed `docs/CRITIQUE.md`.

### H-004 · 2026-11-12 09:56 ET · A0: stop the bleeding (P1, P20, R5, E10, Q7)
- **Commits:** `6d22b09` (the work, by an Opus agent in a worktree), merged as `db98217`; `git log --grep='\[H-004\]'`.
- **What and why:**
  - **P1, the lag's main cause.** Four `:has(#modal …)` rules on `<body>` (91-look, 28-endings) and two rules with a
    structural pseudo-class after a `:has()` made every DOM insert restyle the whole page once a hint or the dead
    player's bar had been drawn. Now three body classes (`lk-mbox`, `lk-mhint`, `en-obit`) set after each draw, on
    close and by MutationObservers. One insert: 5.6–18 ms → 0.01–0.05 ms. A year-50 month after a death: 1,303 →
    529 ms CPU; with a hint on, 1,473 → 661 ms.
  - **P20.** The toasts' `--ts-h` moved from `:root` to `#toast`.
  - **R5.** `N.regrant` decides first and creates last, takes back a failed raise, and each title is tried on its
    own: seed 7's 60-year life has no throw and an empty title audit (was 3 throws and two lords of one seat).
  - **E10.** "would teach you f" and "1 armies in the field · 1 battles raging" fixed (`TXT-WAR-PLURALS`, `A.plural`).
  - **Q7.** `tools/bench/press.mjs`, `life.mjs`, `style-probe.mjs`: the press harness, long-life auditor and style
    probe, taking a built page's path.
- **Complaints answered:** owner's complaint 1 (lag), in large part; complaint 2 (two holders of one post), the crash
  that caused one case. CRITIQUE P1, P20, R5, E10, Q7.
- **Files touched:** 91-look (b-base, c-layout, z-wire), 28-endings, 99993-v2-stats e-sheet, 96-moments toasts,
  99995-v2-nobility a-court and test, 998-people-want, 02-content-fixes (patch, plural.core.js, test), 59-tooltips
  tt.wire2, `tests/suites/style.test.mjs`, `tools/bench/{press,life,style-probe}.mjs`, READMEs, CLAUDE.md, index.html.
- **Tests and checks:** new `cssHasLint`, `styleInsertProbe`, `v2nRegrantHeadless`, `warPlurals`, `peopleWantTeach`;
  94 of 94 pass in the touched features plus tests/suites; full suite: the CI run on this push. The CSS lint exempts
  selectors under `#modal` (two phone-sheet rules measured harmless at 0.014 ms); kept as is.
- **Archived:** nothing (press.cjs and gen.cjs moved with git mv; superseded probes stay in tools/critique-probes/).
- **Undo:** `git revert -m 1 db98217`, then rebuild `index.html`.

### H-005 · 2026-11-12 10:57 ET · Queued: X6, the naming pass (owner's order)
- **What:** the owner asked to go through the whole repo and relabel everything with clear, self-explanatory names.
  Queued as work item X6, right after X1 (own the release) and before A2, so the renames happen once the release is
  readable source and before A2 routes its ~70 write sites. Rules: `git mv` (history kept), feature build order kept
  (numeric prefixes unchanged in order), a redirect table `docs/NAMES.md`, every tool and doc updated, the build
  shown unchanged as in step 0.
- **Files touched:** `docs/OWNER_ORDERS.md` (order 20), this file. **Undo:** nothing to undo (a plan).


### H-006 · 2026-11-12 12:03 ET · X6: the naming pass (owner's orders 20, immediate)
- **Commits:** `caed4d4` (the work, by an Opus 5.5 agent in a worktree), merged as `7a5e71d`; `git log --grep='\[H-006\]'`.
  Also recorded here: CI run 96 on `3f68f42` (A0) passed everything, and v2.1.0-alpha.1 was made at `af27000`.
- **What and why:** clear, self-explanatory names across the repo so it is easy to navigate. `tools/rename-pass.mjs`
  reads `tools/rename-map.json` (old path → new path), renames with `git mv` and rewrites every reference; it is safe to
  re-run after any merge. 79 renames: 41 feature folders (prefixes and build order unchanged: 59-tooltips →
  59-descriptions, 88-queue-head → 88-skip-dropped-events, 9998-stakes → 9998-choice-stakes, 90-fold →
  90-collapsible-sections, 91-look → 91-visual-style, 47-realm-bible → 47-realm-customs, 68-casus-belli →
  68-reasons-for-war, 99990-v2 → 99990-v2-engine, ...), 12 files inside features, 15 docs (no spaces or parentheses),
  11 tools (pack.mjs → blob-pack.mjs, bench/press.mjs → next-month-speed.mjs, ...). `docs/NAMES.md` maps every old
  name to its new one; `docs/README.md` is an index of every doc. Records of the past (this file, VERSIONS,
  CHANGELOG, archive/, reports, saves) keep the old names. Five strings the player sees that leak folder names were
  kept word for word (to be fixed by B4/B5).
- **Complaints answered:** the owner's order 20 (navigation).
- **Tests and checks:** the built code matches the old build token for token, comments aside; the same 757 tests in
  the same order; 29/29 engine tests; boot, savesStillLoad, scaleSites, cutNotFromFeatures, sgNoInfants, phoneTasks
  pass; full suite: the CI run on this push.
- **Archived:** nothing. **Undo:** `git revert -m 1 7a5e71d`, rebuild.

### H-007 · 2026-11-12 12:07 ET · A3a: the net (Q1, Q3, Q5, Q10, P22; part of Q4, Q8)
- **Commits:** `eb64f8b` (the work, by an Opus 5.5 agent in a worktree), merged as `git log --grep='\[H-007\]'`.
- **What and why:** every later step changes systems whose errors were swallowed, so failures become loud first.
  - Tests, benches, the soak, the 60-year life and the coherency run fail on any `console.error`
    (`tools/lib/page-errors.mjs`: one watcher, one allowlist entry for the security tests' own CSP probes; a test that
    provokes an error names it with `expectError`).
  - `src/core/08-coherency-checks` is in the default build with 12 checks (adds: no dead holder of titles, house heads,
    shire offices; every realm has a council; no child in an adult office; one office, one styled holder).
  - `tests/coherency-baseline.json`: the known contradictions, which may only shrink (nightly 8 lives × 60 years:
    one office/one styled holder 1,110, dead shire officers 232, realms without a council 229, dead title holders 64,
    dead councillors 58, children in adult offices 37, family links 10). A2 and C6 empty it.
  - Day 0 passes every check: `A.newGame` makes the v2 stores (same world, different key order); `RI.fillCouncil`
    passes over children (the 2-year-old Chancellor of Kesh is gone), which changes every seed's world from day 0.
  - The runner survives a browser crash, limits each test's time (1,800 s default), reports SKIP, offers `cpu()`.
  - CI builds and lints once, then shards the tests; the nightly `net` job runs the 8×60 coherency run, seed 7's
    60-year life and the soak.
  - Its decision record arrived numbered D-015, which was taken; it is **D-021** (what the net counts, the day-0 fixes).
- **Complaints answered:** owner's complaint 2 (contradictions now counted and guarded); CRITIQUE Q1, Q3, Q5, Q10, P22.
- **Tests and checks:** suites and the touched features (63) pass; boot, coherencyDay0, savesStillLoad pass after the
  merge; the full suite and the balance league (the council fix moves every world) run on CI with this push; X6's
  CI run is superseded by this one, which checks both.
- **Archived:** nothing. **Undo:** `git revert -m 1` the merge, rebuild.

### H-008 · 2026-11-12 15:05 ET · B4: click-to-open (D-007); CI 97 red after A3a, as expected
- **Commits:** `33bfb9a` (the work, by a Sonnet 5.5 agent in a worktree), merged as `c00a91b` (`git log --grep='\[H-008\]'`).
- **What and why:** descriptions open on click, tap, Enter or Space; nothing opens on hover (the owner's rule). The
  hover listener and timer of `src/ui/59-descriptions` are gone; every `title` over three words and every
  `data-note` becomes a click-to-open note (`descriptions.note.core.js`, an ⓘ beside buttons); event choices keep
  their tap and get an ⓘ for the odds; map and battle-field cards open on a press; an activity opens a sheet (what,
  cost, how it may go, Do it) before it commits, and its answer is shown whole (`src/ui/99998-click-open`). Last
  commit with hover tooltips: `d558b1d`.
- **Tests:** new clickNoHover (48 pages, 3,949 anchors, 196 real pointer moves: nothing opened), clickOpens,
  clickLint, clickActSheet; hover-based tests of 59, 91, 84, 97, 98, 9997, v2-stats and v2-names now press. All pass
  after the merge, with boot and coherencyDay0. Gap: the map-card press/Esc path was not hit by the sample (no land
  under the presses); to be covered.
- **CI 97** (on `c7840f8`, X6 + A3a): 22 tests failed across the 8 shards (list in
  `tools/bench/reports/ci97-failures.txt`), the net doing its job: tests that logged console errors, and seed-bound
  tests moved by the council fix. A fix agent works through them next.
- **Undo:** `git revert -m 1 c00a91b`, rebuild.

### H-009 · 2026-11-12 15:52 ET · C8b first gate: the character demos (a working draft); pause for the owner's review (order 23)
- **Commits:** `2d8e4c6` (by an Opus 5.5 agent), merged as `397b55f`. Nothing wired into the game (`index.html`
  untouched; the v2 bundle unchanged).
- **What:** `docs/design/demo/characters.html` (offline, 6.9 MB, with a live face maker: 39 features, colours, hair,
  height, build, station, views, an age strip, copy/paste of the face code) and eight sheets
  (`sheet-{faces,ages,scars,builds,hair,outfits,sizes,registers}.png`); engine modules `src/people/engine/{face,anatomy,
  basemesh}.js` and `src/ui/engine/paint/*`; 21 new engine tests (50/50 pass). Source of the base mesh: D-022.
- **Honest judgement (the builder's and the session's):** growth, ageing, scars, clothing and identity all read, and
  20 faces are distinct; but people look like CG mannequins with a paint filter, hair reads as a helmet, cloth is
  crude, babies read as small adults in a bust, and a portrait costs 230–1,150 ms against a 3–105 ms budget.
- **State:** paused by the owner's order 23 until the owner has reviewed the demos; A1 (lag) and the CI-97 fixes
  that were already running finish and are merged.
- **Undo:** `git revert -m 1 397b55f` (files only).

### H-010 · 2026-11-12 16:27 ET · A1: lag, the drawing side (one redraw per press)
- **Commits:** `03e143c` (by an Opus 5.5 agent), merged as `b9a656c`.
- **What and why:** the owner's first complaint. New last feature `src/ui/999999-one-redraw`: while a step runs only the
  card and the clock are drawn, the clock repaints only when what it says changes, and one full refresh ends the step;
  post-draw passes run once per outermost draw; the story log keeps 2 years on the page (earlier on demand) and appends
  in place; FOLD.cards, LOOK.chipFit and LOOK.nameFit read before they write; a progress line while a life starts;
  `UI.stepTarget('year')` ready for B6. Bench: `tools/bench/press-gate.mjs` on `tests/saves/press/`, a CI job (D-023).
- **Numbers (CPU ms, before → after):** full redraws per press 5–7 → 1; layouts in a quiet press 29–46 → 10–14; each
  card 190–395 → 54–211; quiet month 212–338 → 176–197 (engine 80–170 of it); year 50 vs year 0 1.59× → 0.90×; year 50 at
  4× throttle 3.1 s → 1.4–1.5 s. Still over: quiet month and throttle (engine), year-50 layouts 14 vs 12.
- **Also fixed in this merge:** CLAUDE.md, which the B4 merge had overwritten with B4's whole copy, dropping A0/X6/A3a's
  notes; rebuilt from A1's copy plus B4's rule.
- **Tests:** rdOnePerPress, rdLogInPlace, rdStartLine, renderRng, tbStepSameWorld, boot, savesStillLoad, clickOpens,
  clickNoHover pass on the merged build; full suite on CI once the CI-97 fixes land.
- **Undo:** `git revert -m 1 b9a656c`, rebuild.

### H-011 · 2026-11-12 · C8 2D, gate 1: the style frame (characters.md §15)
- **What and why:** the owner's first look at the 2D illustrated register (D-024, D-025, order 24) before any library
  is drawn. Four sitters by the plan's part system, each in the two finishes (line-led, tone-led) at tier L (480 px),
  46 px and 88 px, with a face zoom at full detail: Wat Hollin (man-at-arms, 32: quilted collar, mail with a brass-ring
  border, a riveted strap and buckle, a cut on the cheek still red), Alys (27: russet kirtle laced over a gathered
  linen shift, one plait), Mae (6: woad smock with a patch and a running stitch, two plaits, freckles), Sir Oswin
  Garde (71: crimson gown with gold work and buttons, green mantle lined with vair, a gold ring brooch with a garnet,
  balding, a full grey beard, an old cut through the brow, the nose broken).
- **Files:** engine `src/ui/engine/draw/` (`geom`, `compose`, `hair`, `dress`, `canvas`, `svg`, `index`; plain ES
  modules, not yet imported by `src/core/engine/index.js`, so the game's bundle is unchanged); art `assets/parts/`
  (path data: head, eyes, brows, nose, mouth, ear, bust; 4 hair styles, 2 beards, wounds, 9 dress pieces; palettes);
  deliverables `docs/design/demo-2d/` (`build.mjs`, `lib.mjs`, `pngq.mjs`, `gate1.html`, `gate1.png`); tests
  `tests/v2/draw.test.js` (11). Nothing in `data/`, `index.html` or any feature.
- **How a portrait is made:** a master is a warp (a few handles), so the face sliders, sex, age (child, elder) and a
  broken nose bend the same drawing; the head's warp carries hair, beard and scars; features hang on the head's
  anchors; locks are guide curves with widths (shadow strip, light ribbon, a highlight at the lock's own height,
  strands, an outer contour only on the outline); mail, rivets, fur, embroidery, stitches, quilting and hatching are
  generated from a few numbers. Deterministic: whole-number art, arithmetic only, ids hashed for anything that looks
  random; a test hashes the list.
- **Measured (headless Chromium, software canvas, median of 48):** S 64 px ≈ 2.5 ms compose + 0.7 ms draw (185
  items); M 144 px ≈ 3–5 + 1.2 ms (287); L 480 px ≈ 4–6 + 1.5 ms (361). Over the plan's S budget (1 ms) and its 150
  shapes; within M and L.
- **Undo:** delete the four paths above (no other file depends on them).

### H-012 · 2026-11-12 18:29 ET · CI 97's 22 failures fixed (5 game bugs, 17 tests made robust)
- **Commits:** `e4d5c90` (by an Opus 5.5 agent), merged as `d5f42ab`.
- **What and why:** building without D-021's day-0 council fix showed 19 of the 21 failures came from the worlds it
  legitimately changed. **Game bugs fixed:** the duel's intent mark used the instinct's words and misnamed half the
  tells (now the duel's own read); the duel's Adapting bar showed "+2" (now words); a disinherited heir the line search
  never reached was not told why; a clickable phone chip was 43 px (now 44); a person row with a friend's pips grew to
  34 px (now 26). **Tests made robust, no bar changed:** fight searches skip a seed whose war ended in peace; coScreens
  renames a captain who is not the player; flDuelFace counts moves, not B4's ⓘ buttons; and eleven more choose their
  scenario robustly (list in the merge). saveSafety expects the error it provokes.
- **Found, for a design look:** with 81-pacing on, engaged bot lives die young far more often (5 of 8 against 1 of 8),
  including a lethal duel chosen at 15 and a wolf at 13.
- **Tests:** all 22 pass; suites and touched features 105/105; balance league within every band. After the merge with A1,
  B4 and the demos: boot, saveSafety, lookRows, flDuelFace, phoneTargets, coScreens, rdOnePerPress, clickOpens,
  v2sNoBareNumbers pass. This push runs the full CI on X6 + A3a + B4 + A1 + these fixes.
- **Undo:** `git revert -m 1 d5f42ab`, rebuild.

### H-013 · 2026-11-12 19:26 ET · B6: Next month or Next year (D-008, D-019, D-026)
- **Commits:** `7cae0f7` (by a Sonnet 5.5 agent), merged as `bacd0a2`. Its decision record arrived as D-025, taken by
  the 2D plan's calls, and is **D-026**. Also in this stretch: CI 98 on `909f492` failed 5 tests; stRegistry (`14d05aa`)
  and fitsOneScreen (`cb6ff55`, B4's ⓘ marker wrapping grid rows; reproduced with CI's Chromium 141) are fixed, and an
  agent works on foldFits, endingsMoment and npcInitiativeDeterminism (looking at people changed later NPC moves).
- **What and why:** two buttons in fixed places, Next month (N, M) and Next year (Y); neither becomes a stop control
  (Esc ends a year at its month's end). A year runs month by month under A1's one redraw and ends with one digest. It
  stops early, saying why, for a notable card (`A.V2Y.classify`, from the event's definition), a battle or call to war,
  an illness or wound, a death or birth at home, coming of age, a deadline. Routine cards wait for the step's end (at
  most 6 after a year, 3 after a month; kept in `S.v2t.parked`). Initiative is lifted (cap 60, topped up daily); what
  is spent becomes load: weariness, then health, then a strain wound. Childhood leads with Next year. A phone's clock
  reads "Age 9 · March 1105".
- **Numbers:** newborn to 12 in 18–21 Next year presses (was about 155 month presses); a quiet year costs a median
  1.3–1.55 s of CPU with 1 full redraw; twelve month presses and one year press reach the same world; balance in bands.
- **Tests:** 11 new (`ny*`); after the merge 15 of 15 pass (ny*, rdOnePerPress, clickOpens, fitsOneScreen,
  savesStillLoad, coherencyDay0, comingUpShows, phoneTargets, boot).
- **Undo:** `git revert -m 1 bacd0a2`, rebuild.

### H-014 · 2026-11-12 22:02 ET · CI 98's last three failures fixed (both regressions came with B4)
- **Commits:** `68fa5a4` (by an Opus 5.5 agent), merged on top of `ee37f46`.
- **foldFits:** B4's ⓘ after a block trigger was an extra box, so a new cell and row in grid/flex rows (every v2 stat row,
  advisers' rows). `TT.markHost` now puts the glyph on the block's own words or its first child with words; a marker
  never adds a row or cell. **endingsMoment:** the death screen was 39 px narrow (the dialogs' report button got an ⓘ that
  fell into the modal's flex row); a description that only repeats an action's name is now a label (`TT.sameAsName`).
  **npcInitiativeDeterminism (a real determinism bug):** looking at a merchant's Holdings tab created `pc.staff`, which
  turns on the monthly staff step; 97's disabled reasons priced the market outside the draw guard once B4 lifted
  `data-note` at once. The outermost draw wrappers (999999-one-redraw) now run under `A.asDrawing`, and 97 reads its
  reasons as a draw. **renderRng** now fails on any state change (it measured but did not fail) and covers a merchant.
  New test `ttMarkNoCell`.
- **Open (to B5 declutter):** an info button beside an action still adds a cell in grid and column-flex parents
  (`.plan-grid`, `.card.dec`).
- **Tests:** under CI's Chromium foldFits, endingsMoment, renderRng, replayWithRender, fitsOneScreen, clickOpens,
  clickNoHover, rdOnePerPress, nyYearSameWorld, tbStepSameWorld, journalReplay, lookRows, ttMarkNoCell; suites 9/9; the
  tests of 59, 97 and 999999 40/40; npcInitiativeDeterminism passes. This push runs the full CI.
- **Undo:** `git revert -m 1` the merge, rebuild.

### H-015 · 2026-11-13 00:55 ET · CI 100's five failures fixed (one real slowdown from B6, four tests)
- **Commits:** `eaaf92c`, `24f7121`, `57180f4` (all on v2-integration).
- **A real slowdown:** B6's cost-mark pass (`A.V2Y.strip`) read `document.body.textContent` after every draw, and the body
  holds the game's script blobs (about 5 MB of text): a load-and-draw went from about 53 ms to 330 ms.
  `childrenSeeOnlyWhatTheyCan` (1,800 presses) and `npcInitiativeDeterminism` ran out of time. The pass now walks the
  body's drawn children only; draws are back to about 58 ms. New test `nyStripSkipsScripts` (fails on the old build).
- **iconsWired:** B6 took the initiative hourglass off the top bar on purpose; the test expects it only while drawn.
- **bondsInRealLives, kinBotLives (D-027):** with no pool the engaged bots act about twice as often; two share-based bars
  moved on the same seeds and follow the no-pool game (10% → 7%; half → 40%). Kin arcs and the one-arc-at-a-time rule
  go to C6.
- **Tests:** locally the 12 ny* tests, renderRng, iconsWired, npcInitiativeDeterminism and childrenSeeOnlyWhatTheyCan
  pass; the two bot-life tests were not re-run locally (each needs ~30 minutes of a free machine; CI's numbers are the
  same seeds). This push runs the full CI.
- **Undo:** `git revert 57180f4 24f7121 eaaf92c`, rebuild.

### H-016 · 2026-11-13 01:44 ET · v2.1.0-alpha.2 cut; X1 merged: the release is readable source
- **v2.1.0-alpha.2:** CI 101 green on `3769630`; version at `f37c62f`, branch `release/v2.1.0-alpha.2`, save
  `tests/saves/v2.1.0-alpha.2-noble.ardan`.
- **X1 commits:** `755467d`, `d6e0206`, `a4f82ec`, `f632d54` (by an Opus 5.5 agent), merged as `5056e98`.
- **What:** the build's input is `src/core/release/` instead of the minified vendor file (untouched): `core/` (35 files by
  section, de-minified by rule then prettier), `core/00-lore.json`, `content/` (the 30 release event packs, laid out on
  lines with every function's text unchanged, because `A.evAudience`/`A.CX_RX`/`A.EV_RX` read it), `lore/` (five JSON
  tables), `page.html`. All 203 patches (393 edits) are written in, each marked `[X1 baked patch <feature> <id>] <why>`;
  `PATCHES.md` lists where. The `patches.mjs` files are in `archive/x1-patch-layer/` (last built with them: `88b671f`).
  9991's two edits are baked into `62-inked-map/inkmap.core.js`; WIP `82-early-years` keeps its two patches, refitted.
- **Tools:** `tools/release/` (bake, format, transform, verify, identity-probe); `build.mjs --release=`; `--only=x` now
  means the default build plus x (the baked release calls feature code); `show.mjs --where`. Rule (CLAUDE.md, D-028):
  change the release by editing its source; no new patches.
- **Identity:** the agent's bake gave byte-identical blobs; `verify` says SAME PROGRAM (1,824 core statements, 13,132
  event function texts unchanged, lore byte-identical, page the same); the probe: 5,004 events, 0 class changes; 9
  fixed-seed 10-year lives identical in fingerprint, state hash, rng and journal. After the merge, `verify` against the
  alpha.2 build again says SAME PROGRAM.
- **Tests:** `check.mjs --skip-tests --skip-balance` passes; boot, savesStillLoad, renderRng, journalReplay, scaleSites,
  aiPersonalityWhy, startsDeterministic, iconsWired, nyStripSkipsScripts pass after the merge. This push runs the full CI.
- **Undo:** `git revert -m 1 5056e98`, rebuild (the patch files come back from the archive).

### H-017 · 2026-11-13 02:45 ET · E1/E2 design written (owner orders 28, 29)
- **Commit:** `39e3164` (by a Fable 5.2 agent), cherry-picked from its worktree.
- **What:** `docs/design/economy-and-items.md`. E1: one market model in place of today's three layers; a market in each
  of 281 settled provinces, 28 goods, prices as readings of how full a store is (every price has a nameable cause);
  weather, seasons, war, raids, plague and guilds move them; nameless carters spread prices, about 100 named trading
  houses run about 240 caravans on one route graph (trade with, ride with, guard, rob or toll them); loans with pledges,
  crowns that borrow and default, coin that can be thinned; per-rank money in words, at most three money decisions a
  year; budget 6 ms a month (today 11). E2: 845 item kinds from 110 drawn forms (132 swords) in five grades with makers,
  wear and repair; about 100 unique named pieces, never copied; lords' armouries arm their levies (D11). Eight stages:
  E1a, E1b, E2a, E1c, E2b, E1d, E2c, E2d. Two trial scripts in `docs/design/trials/` back its measured claims.
- **To record when approved:** the economy and items get their own seeded streams (a DECISIONS exception to "only
  A.rand"); retiring the release's market noise changes every seed's world once.
- **Owner decisions pending:** markets, goods, merchants, income, money depth, grades, armour on the figure, named things.
- **Undo:** `git revert 39e3164`.

### H-018 · 2026-11-13 06:49 ET · C8 2D gate 2 built (tone-led, after the owner's two references)
- **Commits:** `1a8df5f`…`56d92aa` (by a Fable 5.2 agent), merged as `9d68308`. Demo only: `src/` and `tests/` untouched.
- **What:** `docs/design/demo-2d/gate2.html` (offline, 347 KB) with source in `demo-2d/gate2/` (~2,100 lines): fifteen
  full figures to one scale (all eight estates, ages 8-68, ten skin tones, nine stances, builds from a stooped serf to a
  198 cm housecarl, six scars, five in harness); profile cards with words, no percentages; a maker with 38 face sliders,
  49 named variants, 29 hair styles, 11 beards, 10 builds plus 7 build sliders, 10 stances, 18 outfits; four ages;
  armour as 42 separate pieces; one sword in all 16 pairings of make and rarity. A 23-character face code.
- **Timings:** compose 3-6 ms; paint about 55 ms a card, 150 ms a large portrait (over D-025's 16 ms; the light and
  depth passes are about three quarters of it and can be switched off).
- **Honest standing:** past gate 1 and reads as one hand, but clean vector art (closest to a visual-novel sprite set):
  even lines, few folds, one gradient a form, plain faces at full size, mitten hands, front view only. Not yet the
  painted richness of the owner's second reference. **Owner verdict pending**, with ten questions in `gate2.md`.
- **Undo:** `git revert -m 1 9d68308`.

### H-019 · 2026-11-13 11:56 ET · G design written (owner order 32); Fable's weekly limit reached
- **Commit:** `f1a556d` (by a Fable 5.2 agent), cherry-picked from its worktree.
- **What:** `docs/design/growth.md` (7,235 words). Stats: 17 in four groups (body, mind, spirit, standing), each with
  what it does, how it rises and falls, and seven limits (birth ceiling, people's limit, age, the month's load, use,
  wounds and gear, skills). Skills: one system with proficiencies merged in, 4,599 skills (1,698 passive, 2,901
  active: 1,553 re-housed, 784 by rule, 541 by template, 1,721 written whole), levels, evolutions and merges, a tree
  for every route; limits by talent, time, age and rust. Styles: about 550 (225 realm standards by regiment with their
  tactics, 180 house and family styles, 8 order styles, 80 company and folk ways, 61 masters' lineages) with about
  2,300 arts, graded weaker → beyond compare against the realm's standard; skill outweighs style. Legendary arms with
  signature arts and hand-designed drawings. Six stages G1-G6 (G6 inside E2). **8 owner decisions pending.**
- **Fable 5.2's weekly limit** was reached at 11:40 ET (resets 2026-11-18 01:00 ET). Work that D-009 gives Fable runs
  on Opus 5.5 until then (D-010: model at the session's discretion); C8b is finished by an Opus 5.5 agent in the same
  worktree.
- **Undo:** `git revert f1a556d`.

### H-020 · 2026-11-13 12:13 ET · B5 declutter, part 1 (the shell)
- **Commits:** `d8c1ad9`…`2101e45` (8, by a Sonnet 5.5 agent), merged as `66291b1` (DECISIONS: both sides kept). D-033.
- **What:** at 1100-1599 px the story is a drawer behind a top-bar Story button (new `src/ui/9992-story-drawer`), the
  Life page shows its newest two lines, and the open page gets 81% of a 1366 screen (was 36%); from 1600 px the story
  is a column after the page. Every life starts with six suggested activities and "More activities". Decisions shows what
  can be done now ("Not yet possible" folded). Folded: the market, the second People list, a ruler's roster, the elite
  orders, Laws; the rail's duplicate buttons are gone. The scene card docks over the page from 1100 px. Help names the
  places from `UI.GROUPS`. Info buttons in grid or column-flex parents are out of the flow (H-014's follow-up). Unread
  story dots are neutral. Tablet top-bar buttons are 44 px.
- **Numbers** (1366×768 / 420×900, medians over a peasant, a noble, a ruler): desktop first view 479 → 171 words, 49 → 40
  controls, 2.02 → 1.0 screens; phone 119 → 108 words, 2.21 → 1.36 screens; worst page 4.7 → 2.3 (desktop), 6.1 → 2.7
  (phone). The critique's 120/12 and 250/25 are out of reach without removing navigation; `b5Budget` holds the reached
  numbers as a ratchet (D-033).
- **Tests:** 10 new (ttInfoNoCell, sdPageWidth, sdWidths, b5Budget, b5NoSideways, b5NoHoverOnly, b5HelpNames, b5CardFits,
  b5Activities, b5Decisions); about 55 UI tests pass; 7 adjusted to the new layout (phoneTargets, phoneDesktopSame,
  tbActsSix, scEvery, phoneLife, lookTiles, phoneTasks, foldToggles). The full suite runs in CI with A2.
- **Open (part 2 and after):** UI.scope, the six-life draw test, one goal stack; the tablet phone shell; 200% text; U10,
  U12, U17, U21; lazy closed folds. **Found while merging (for X3):** "initiative" still shows after B6 removed the pool:
  the Activities line ("60.0 initiative"), What now's "Train in an extra session" / "Spend your initiative"
  (15-specialisms), the plan's session button title (23-ui-e), market trips (66-markets, 18-event-view-b), "Not enough
  initiative" in 56-court and 9996 f-fief, the step summary (84-top-bar), the clock's glossary and aria (59-descriptions).
- **Undo:** `git revert -m 1 66291b1`.

### H-021 · 2026-11-13 13:02 ET · C8b: the gate 2 figure library draws every portrait (owner order 33, D-035, D-036)
- **Commits:** `56e2307`, `2f24e3f` (Fable 5.2), `6bd6d37`, `7f6a04e`, `89d03d1` (Opus 5.5, after Fable's weekly limit),
  branch `c8b-figures`, merged as `9a2cbeb` (DECISIONS both sides kept; index.html rebuilt).
- **What:** every portrait is drawn by the figure library (`src/ui/engine/figure`, `A.V2.figure`; game side
  `src/ui/93-figures`): a square under 120 px, a 2:3 card crop from 120 px, the whole figure on request; pictures are
  baked off the press (one PNG per look, up to 600 kept) with a flat stand-in until ready. Everyone gets a 23-character
  face code at birth from their parents' (old saves get theirs on load, deterministically). The face and build maker is
  on the creation screen (52 sliders in words, 49 shapes, 29 hair styles, 11 beards, ten frames, the face code). Gear is
  drawn by item with make and rarity (`GEAR_ART`, `registerGear` for E2). Large faces gained eye, brow, nose and lip
  detail and a mood; hair sits under headwear; the dead are drawn grey with eyes shut. `93-anime-portraits` and
  `63-miniature-portraits` retired to `archive/` (last built `f574229`).
- **Timings:** compose 2.7-3.7 ms; paint 4.9 ms (46 px), 7.4 ms (88 px); a 176 px picture about 41 ms once, off the press.
- **Tests:** 10 `fg*`, 41 portrait-related, core suites 9/9, `tests/v2` 71/71; identity probe: same dice, journal and
  events (state differs only by the face codes). After the merge `fgAxe` failed once under load (a modal's text read
  mid fade-in): it now waits for animations to finish. This push runs the full CI on B5 and C8b.
- **Open:** a duel guard pose; pre-baking the player's large picture (half a second of stand-in on first open); a
  tighter 2:3 crop; fur and arms still crude; war paint, jewellery, bows, mounts, infants; gate 1's engine to archive.
- **Undo:** `git revert -m 1 9a2cbeb` (the archive notes say how to restore the old renderers).

### H-022 · 2026-11-13 14:18 ET · CI 103's four failures fixed (all tests that followed the old layout)
- **Commits:** `0d7cf45`, `5ec399c`, `049e533` on v2-integration.
- **ttCoverage:** B5 folds the profile's best proficiencies by default, so the test saw 4 numbers (needs 8) and counted a
  closed fold's aria-hidden one-line preview. It now counts with every fold open and skips aria-hidden previews: 13 of
  13 numbers carry a description.
- **v2mapRoseClear:** its control (a world that would place a name where the rose stands, with the rose hidden) found
  none in seeds 11-16 after the layout change; seed 17 restores it. No name sits under the rose.
- **v2sNumbers:** the season's training line lives in the story drawer from 1100 px; the test reads the drawer's lines.
- **phoneDesktopSame:** a portrait is a stand-in until its picture is baked off the press; both sides wait for the
  figure queue to be idle.
- **Tests:** the four pass locally; this push runs the full CI on B5, C8b and these fixes.
- **Undo:** `git revert 049e533 5ec399c 0d7cf45`.

### H-023 · 2026-11-13 18:00 ET · P: the Profile page, first page of the You place (owner order 33, D-035, D-038)
- **Commits:** `7e29156`, `4e7511f`, `5c1a66e`, `f707cbe`, `63b0b37` (by a Sonnet 5.5 agent), merged as `50b02b5`.
- **What:** `src/ui/999996-profile-tab`: a game-like character sheet. The whole standing figure, the gate 2 card (estate
  kicker, name, epithet, title, house and place, arms, a line about the person, Body / Purse / Name / Honour in words),
  the six stats as words on a seven-pip scale with the potential as an open pip, health, mood and looks, and eight
  folded sections (titles, posts and offices with past posts; skills and fighting style; renown, honour and deeds; house
  and household; gear and heirlooms; years, health and marks; measured in the world's units; character, birth and faith).
  It is the first page of You (D-038: five places is the cap); on a phone the old You page stays as "Glance". The
  rail's Full profile opens it; the old overlay still draws. A month hook records posts held and left (`pc.pf`). It
  grows through `UI.PF.addStat` and `UI.PF.addSection` (for G and E2).
- **Tests:** 12 new `pf*`; 98 existing UI tests; after the merge 17 of 17 (pf*, boot, renderRng, b5Budget, fgPure,
  savesStillLoad). Budgets at 1366×768: about 186 words, 50 controls (B5's ratchet), 1.02 screens.
- **Open:** a parchment ground for the card, equipment tiles by the figure, make and rarity badges (E2), a pre-baked figure.
- **Undo:** `git revert -m 1 50b02b5`.

### H-024 · 2026-11-13 18:25 ET · A2 stage 1: one registry of posts; the Marshal's seat empty in peace (D-017, D-031)
- **Commits:** `695c065`, `69e1f7d`, `df2d027`, `9725baa`, `8fb2a56`, `a11578f`, `3307b9e`, `48e89db`, `6e43403`,
  `c83d76f`, `4a1fecc`, `8f1f72a` and two merges (by an Opus 5.5 agent), merged as `1e914c0`.
- **What:** `src/nobility/999990-posts`: the registry `A.POSTS` (`A.S.posts.h`: council seats, shire offices, army and
  division commands, each with holder, since, why, appointer and the last three holders; `can`, `appoint`, `vacate`,
  `leaveAll`, `sync`, `audit`, `title`). The old fields are mirrors written only by the registry. No one holds two
  clashing posts; the dead, children, prisoners, foreigners and rulers are refused; a promotion hands over the real
  command and moves the man replaced. The Marshal's seat is empty in peace and goes to the best General when a war needs
  one, who leads the main host; at peace he stands down. Every exit (death, resign, desert, prison, the crown) vacates;
  resigning at war and deserting cost. Old saves are rebuilt and repaired on load, without a draw. No dice in the registry.
- **Coherency:** quick baseline all 0 (was 5/8/30/2/123); nightly 0 except one family-links count (C6's).
- **Fixes it exposed (the world re-rolled):** B6's classifier: a commoner's forced trade-duty card (`du_cm_tax`) now waits
  for the step's end (a ruler's or noble's duties stay notable); the Wars pages' bare war score is now in words; a
  latent throw in `ct_banneret`; 99994's grandmother's clan; 99994's invented "Marshal of the host/levies" are Captains.
  Tests made robust to the new world (reasons in each file); `pcLives`' "pacing adds actions" bar relaxed to "pacing
  does not cut them", since D-019 lifted the pool that rationed actions.
- **Tests:** 5 new posts tests; core suites, renderRng, replayWithRender, journalReplay, the B5/C8b/P quick tests pass;
  balance in bands (before the merges). This push runs the full CI.
- **Open (stage 2):** battalion and company slots, order masters, staff, free companies, house heads and land titles as
  posts; armies that outlive a war; routing the writers the month's sync still adopts; more costs of leaving a post.
- **Undo:** `git revert -m 1 1e914c0`; old saves made with the registry keep an unused `A.S.posts`.

### H-025 · 2026-11-13 18:40 ET · After the A2 merge: checks pass; full CI on A2 and P; order 34 recorded
- **Merged build:** boot, coherencyBaseline (no check above its baseline), postsMarshalRepro, nyEsc, pfPure and pcLives
  (on 8.4 vs off 8.7 actions a year, inside the relaxed bar) pass. This push runs the full CI on A2 and P.
- **Order 34** recorded (D-039): new v2 items C9 (bodies that make sense, longer lives), P2 (a clean profile, a Records
  area), X7 (phone speed), W0 (no war score or army templates); D12a becomes war as a board; G revised (arts, 8 skill
  words, learning by doing, hidden talent). C9, P2 and the G revision are running.
- **Branches:** the 35 merged branches could not be deleted from this session (its git connection refuses ref
  deletions); the owner was told how to delete them on GitHub; their tips are in `docs/BRANCHES.md`.

### H-026 · 2026-11-13 18:50 ET · G design revised for order 34 (D-039)
- **Commit:** `aefc2d5` (by an Opus 5.5 agent), cherry-picked as `e7812cf`.
- **What:** `docs/design/growth.md` now carries order 34: arts in place of styles (every weapon family's arts with
  numbered forms, lines of holders, secret manuals, keepers; 20 example arts; grades Lesser, Standard, Strong, Great,
  Peerless); eight skill words on today's 0-100 scale (no check's odds move; 1-10 Grandmasters, at most one Legend, kept by
  proofs and surpassing; `GD.LEGEND_CAP` 5 → 1); no trees (a first try teaches nothing or gives Beginner; merges at the
  top); disuse (safe for 5-12 idle years, then slow, at most one word, back five times as fast); hidden talent (16 areas
  and 14 single attributes, F to SS with a number, found in play; NPCs by hash); application in a fight (fit, match,
  one's own hand, read; a top art wins about 7-3 or 8-2 at equal skill, and a standard spear art can beat a peerless
  sword art); house arts (knights', line, both, neither); legendaries with their own command skill and bound art, about
  one word of skill at full command; training a skill trains its governing stats. Stages G1-G6 renewed; §7 records every
  replaced part. **Six owner decisions still open** (§6.5).
- **Undo:** `git revert e7812cf`.

### H-027 · 2026-11-13 19:21 ET · P2: a clean Profile page; the past in Records (owner order 34, D-041)
- **Commits:** `6f10137`, `ca74101`, `37d9342` (by a Sonnet 5.5 agent, branch `p2-profile`), merged as `c56f9d4`.
- **What:** the main Profile page is the figure, the card (parchment ground and gilt frame, posts held now, one line
  about the person, Body / Purse / Name / Honour in words), the stat sheet and one panel chosen by four tabs (Skills,
  Gear, Family, Traits; `UI.PF.addPanel`). The eight stacked section buttons are gone. The past and the long reads
  (posts held before, deeds, all skills, house and kin, gear and heirlooms, years and marks, the measured sheet, birth
  and faith) live on a Records view of the same page, behind one small "Records" link (`UI.PF.addSection` feeds it).
- **Numbers:** page-zone words at 1366 about 140 → 83; phone 1.7 → 1.35 screens; controls unchanged (reshaped, not cut).
- **Tests:** 15 pf* tests (pfLean, pfRecords new); after the merge 17 of 17 with boot, renderRng, b5Budget.
- **Open:** fewer controls; the Measured section when C9 removes real units; "styles" to "arts"; equipment tiles.
- **Undo:** `git revert -m 1 c56f9d4`.

### H-028 · 2026-11-13 19:33 ET · Fable 5.2 is available again; the legendary designs move to it
- H-019's "Fable's weekly limit until Nov 18" no longer holds: the owner said Fable is not out, and a test call answered.
  Work that D-009 gives Fable goes back to Fable 5.2. The ten legendary weapon designs (order 36), begun on Opus 5.5, were
  restarted on Fable 5.2 at max effort (the Opus draft notes kept for it).
- **lfRepeats** (CI 105 shard 3): with the feature on, prompts a year held steady (10.1 → 10.2) while the "off" world
  grew busier after A2's re-roll (11.9 → 13.1); the bar is 75% of "off" (was 80%), and at least 6 a year.

### H-029 · 2026-11-13 20:13 ET · CI 105: one failure (lfRepeats, fixed in 9bf37ee); orders 36-47 recorded
- **CI 105** on A2 and P: 10 of 11 jobs green; shard 3's lfRepeats failed and was fixed (H-028). This push runs the
  full CI on A2, P, P2 and the fix.
- **Orders 36-47** (talents at birth by a 45-point budget with one SSS at most, growth S ×1.8 and SSS ×3.0, prices by
  reach; art grades; combat ranks without caps; fusion by choice; careers without ladders L1; noble life N1; legendaries
  without levels, each from its own realm and craft, with an owner, a wielder and a reason; the owner's legendary blade
  example as Aldmark's signature; the master key withdrawn) are in OWNER_ORDERS, DECISIONS D-043 to D-045 and growth.md
  §§9-10. The ten legendary designs are being drawn (Fable 5.2); then the owner's pause (order 36).

### H-030 · 2026-11-13 21:08 ET · Ten legendary arms drawn; the owner's pause begins (order 36)
- **Commits:** `57dc996`, `f17e4f5`, `fe04c34`, `f8b9c15`, `9339711` (by a Fable 5.2 agent), merged as `1cc5e31`. Demo only.
- **What:** `docs/design/legendaries/`: ten legendaries, each from its own realm and craft, each with its making,
  history, owner, bearer and why, feel in the hand, Legendary art, drawn large, at portrait scale on its bearer, and to
  scale beside an ordinary arm of its kind. I Winter Wheat (longsword, Aldmark; after the owner's example; the crown's,
  borne by the Marshal by office), II The Last Page (greatsword, Solenne), III Last Well (sabre, the Sand Clans; held by
  an outlaw with no right), IV Held Breath (dagger, Greyhaven; the direct heir), V Thaw (war axe, Northreach; lost since
  1090), VI The Latch (war hammer, Irondeep; the Keeper, for life), VII Grandfather (spear, Zanara; in pawn), VIII
  Midsummer (glaive, the Tusk Clans; by the kill), IX The Unbending (longbow, Sylvaran; unstrung), X Paymaster (crossbow,
  the Highland League).
- **Honest standing:** ten different things at a glance, each clearly finer than its ordinary cousin, seamless on the
  figures; clean vector, not paint; few sculpted forms; long thin arms read thin; no scabbards yet. Lore note: the lore
  seats a Marshal (Leofric Stane) while D-017 keeps the seat empty until needed; the plate holds either way.
- **Pause:** shown to the owner now; per order 36 no new step starts until the owner says go. Work already running (C9)
  finishes and is kept.
- **Undo:** `git revert -m 1 1cc5e31`.

### H-031 · 2026-11-13 21:17 ET · C9: bodies that make sense, skill baselines, longer lives, honest odds, Swordsmanship (D-040, D-042, D-046)
- **Commits:** `582691b`, `7e60872`, `9f802d5`, `b714b92`, `6c677dc`, `a1b6abb`, `703b57b`, `8cf245c` (by an Opus 5.5
  agent, branch `c9-bodies`), merged as `cd2e54d`. Begun before the pause, finished and kept under it.
- **What:** `src/people/999997-bodies`. Stat words are a measured centile among one's whole grown people (6,064 people
  from 8 worlds; 30-70 average; past the 99.9th "off the chart"); children and youths are read against their age, in
  words; other peoples against men too; the giant's speed potential 28 → 18. No real units for a body on any page or in
  about 45 lore lines. Skill baselines per level (0.65-1.15 of the people's middle in the first governing stat; the
  second 0.9 of that): below one the skill stalls and works at the lower level; NPCs are held at their skills'
  baselines; the player is never lifted; training a skill trains its stats a little. Lifespans: prime adults ×0.6 death
  odds, estate factors, a better chance against an ordinary illness. Honest odds: `A.checkOdds` counts blunders and
  surges exactly and the roll uses the shown number; the popover names that share. "Blades" reads Swordsmanship.
- **Measured:** NPC masters under their baseline 27% → 0; careful bot lives' non-violent deaths under 50: 3 of 13 → 0 of
  9 (median 65 → 73); a healthy merchant reaches 50 at 0.94. flHonest's worst bin 3.6/7.5 → 4.7/5.6 (shown/real).
- **Tests:** 6 bodies tests; v2-stats, profile, body-mind, old age, learn-by-doing, fair checks, honest odds and the core
  suites pass; after the merge 10 of 10 smoke tests. phoneDesktopSame now masks portraits in its screenshots (their
  pixels shift as a picture decodes on a loaded runner; layout is still compared; portraits have fg* tests). The balance
  league runs in this push's CI.
- **Undo:** `git revert -m 1 cd2e54d`; old saves need nothing.

### H-032 · 2026-11-14 05:43 ET · D12a: the war design (order 49, D-047)
- **Commits:** `a65ce92`, `16d5909`, `cd3ce26`, `3f9c76a` (by a Fable 5.2 agent), merged as `0378b9e`. Design only.
- **What:** `docs/design/war.md` and four sketches in `docs/design/war/`. One war, one simulation, three distances: the
  **theatre** (the war on the inked map: standards on roads, a front that burns, carts, siege rings, raids, weather), the
  **field** (one engagement seen from a hill behind your line; companies as small figures; Pause / Orders / Watch; orders
  by courier; 1-12 minutes; "Fight it out" always offered), the **press** (your place in the line; your art's forms as
  choices; a legendary breaks a front but must land). Sight by rank: what your post could know. One deterministic
  engagement engine in beats for every battle, with a cause ledger read back as the after-action report. War score →
  "How the war stands" in named reasons; templates → who came, by rank and oath. Budgets: all wars about 12 ms a month;
  the trial ran a 9,000-man battle in about 1 ms. Nine build stages (W0, D9's pieces, D11a, D12b-1..5, D11b).
  **Ten owner decisions pending.**
- **Undo:** `git revert -m 1 0378b9e`.

### H-033 · 2026-11-14 10:42 ET · CI 107's failures after C9: 13 of 17 fixed; the slowdown was the skill cap, not longer lives
- **Commits:** `8d13cca`, `0596169`, `bef511d`, `a1b2edc` (by an Opus 5.5 agent, branch `c9-ci107`), merged as `5b5d528`.
- **Speed:** longer lives did not grow the world (living people in a 60-year life about the same, a little fewer). The
  cost was C9's skill cap: 9996-polity reads `A.skill` about 100,000 times a year and each read made two `A.stat`
  calls (2.79 million in a 20-year bot life). Memoised per person on everything it reads: `A.stat` calls 148,000; that
  life 20 s of CPU against 25 s before C9. Next month on y50-noble: median 220 ms before and after.
- **Fixed:** wcRecordWhole (the test compared entries not yet written), pfLean / pfFits (a child's age said once, in
  the heading), pfNumbers (ordinals in names), famineTriplesGrain (the test's month is thirty days), ttCov2Realm (the
  court's "Because" line is a click-to-open note), mwOddsAreTheOddsPlayed (follows honest odds), v2sDerive and
  v2sPlaytest2Body (on Story difficulty, so the child lives to grow), ttWorthSums (1ad1adc), phoneDesktopSame (masked).
- **Open:** rankMovesTheFight (the officer layer moves 9 points against a bar of 10: the new world gives fewer close
  fights), csWorlds (74 of 83 AI wars in the news against 74.7), kinBotLives, and the two long tests not re-timed here.
  This push runs the full CI to measure them.
- **Undo:** `git revert -m 1 5b5d528`.

### H-034 · 2026-11-14 11:19 ET · X3 part 1: honest cards and clocks (D-051)
- **Commits:** `d89097c`, `7b7b278`, `41159f3`, `3513e2c`, `2af63aa`, `ecc3132`, `77d3c2d` (by a Sonnet 5.5 agent), merged as `839d0c6`.
- **What:** every initiative word the pool's removal left (the Activities line, What now, the plan button, market trips,
  13 refusals now "You cannot spare the time for that today", the step summary, the clock, help, ⧗ marks) is gone; the
  Activities line says weariness in words (`A.weariness`, read-only). New feature `src/events/99999-x3-honest-cards`: a
  feast comes on its date and a dated scene only in its month; a fight's chip says whether it can end in death (396
  fight choices checked, 98 lethal); a sick body reads "ill with …" not "hale"; endings' titles only when earned;
  kilometres replace miles; no quiet line twice in a year; the love-philtre drugging choice is cut.
- **Tests:** 10 new (x3 suite); nyWords, pcWinter updated; mtDrawingPure caught a draw that wrote state (fixed).
  Identity probe: 0 audience differences over 5,004 events. After the merge 8 of 8 smoke tests pass.
- **Open (part 2):** station words and gates, card place vs deployment, counsel from the absent, pronoun lint, the
  400-scene preview replay, the full fatal-illness arc.
- **Undo:** `git revert -m 1 839d0c6`.

### H-035 · 2026-11-14 11:22 ET · Order 52: names worth saying, ordinary arms as made things, Sickle Moon (D-050)
- **Commits:** `7345e0c`, `95fbe90`, `5a5a5ef`, `98457a3` (by a Fable 5.2 agent), merged as `334f81e`.
- **Names:** a piece is named for the sky, season, sea or hour of its country; its art for what that weather does to a
  man; its forms read as the fight in order. Winter Storm (Snowfall), White Noon (Sunwise), Dry Rain (Mirage), Undertow
  (Slack Water), Killing Frost (Black Ice), Deep Fire (Stone Oath), Long Shadow (Slow Drum), Summer Thunder (Cloudburst),
  Sickle Moon (Owl-Light), Lodestar (Falling Star). The twenty example arts renamed (Briar, Two Waves, Kingfisher, Iron
  Under Silk, Vigil, The Long Hunt…). Guides: growth.md §12 (arts) and economy-and-items.md Part 6 (weapons). 137 new
  names checked against 1,620 lore names and 613 mottoes: no clash ("Red Rain" dropped: a name from another work).
- **Ordinary arms:** `src/ui/engine/figure/arms.js` draws 45 forms (nine swords, five knives, 21 hafted arms, bows with a
  quiver, a crossbow, six shields): make changes the work (crude to masterwork), rarity the steel (nothing glows), six
  peoples' makes. `GEAR_ART` and `registerGear` kept; the old rule-drawn arms archived (`archive/figure-rule-drawn-arms/`).
  Draw cost unchanged within noise. Sheet: `docs/design/legendaries/ordinary.png`.
- **Sickle Moon:** the bow redrawn from scratch: yew with horn ears, a carved heart-oak riser with a moonstone, seven
  silver moons on each limb, its own string, arrow and quiver.
- **Tests:** tests/v2 74/74; the fg tests and boot, renderRng pass after the merge.
- **Undo:** `git revert -m 1 334f81e`.

### H-036 · 2026-11-14 12:20 ET · W0 and D10: no war score, no army templates; war screens by post (D-052)
- **Commits:** `6979e99`, `2d02ee1`, `0657db4`, `dabb8f0`, `86ad183`, `12b76d4` (by an Opus 5.5 agent), merged as `9f78825`.
- **W0 (owner order 34):** the war score is off every screen. `A.warFactsText` states the land each side holds and the
  great battles won instead; `w.score` still drives the AI's peace and terms. The Templates tab, the editor,
  "Reorganize as…", the doctrine choice and the player's template and doctrine actions are retired to
  `archive/w0-war-score-and-templates/` (last commit with them: `39ee589`). Templates stay the engine's recipe for divisions.
- **D10 (owner order 5):** the War Room by post (crown and Marshal; in your war a commander, or a captain in the field;
  never a soldier or sergeant). The map is drawn within your rank's reach; enemy counters are estimates below a
  commander; no Wars map mode outside a war; Arms from 14 or on enlisting; the War tab lists only the orders you have heard
  of. Rules in 99997-v2-war (`a-gate`, new `g-post`), release hooks `UI.mapModes` and `A.orderHeard`.
- **Found, left to its own step:** the release's staff card draws candidates with `A.rand` on first draw (impure render).
- **Tests:** new `v2wByPost` (14 lives); war, 59, 58, 62, 71, 99992, 20, 68 and the core render/replay suites pass.
- **Also (CI 108):** `honestOddsCells` reads the odds after the seat is taken (C9 lifts NPCs, never the player), and
  `phoneDesktopSame` waits for the farewell cut-in to leave (`f50316f`). Five slow bot-life tests are with an agent.
- **Undo:** `git revert -m 1 9f78825`.

### H-037 · 2026-11-14 15:54 ET · CI 108's bot-life tests: two test fixes; three pass on f50316f as they stand
- **Commits:** `20ac136`, `dffa374` (by an Opus 5.5 agent, branch `ci108-botlives`). Tests only; no game code changed.
- **csWorlds (fixed, test):** the test matched the first 30 letters of a casus belli in the news, but 99999-v2-names
  writes a realm's name for a lore name in every line ("to push the Horde back" is told "to push Gorath back"). On
  786a52d all nine wars counted missing were Aldmark's want, each the top line of the news (74 of 83, CI 108). Matched
  through `A.V2NAMES.fix`: 89 of 89 on f50316f.
- **rivalsBotLives (fixed, test):** timed out in CI 108. The game's cost a bot-year did not rise with C9 (CI: 2.1 s
  before, 1.75 s after; a profile puts C9's floor and cap at about 5% of a war-heavy year); C9's worlds needed a fourth
  round of six lives (CI 107: 24 lives, 910 years, 1,588 s) and CI's speed varies by a quarter. Dealing now stops at the
  tenth long life: 16 lives, 670 years on f50316f (was 18, 750); passes.
- **Pass on f50316f with no change** (CI 108 ran on 786a52d; X3 and W0+D10 changed the worlds since):
  kinBotLives (12 long, 9 met a kin arc, 19 began, 17 finished, 11 of 13 kinds; CI 108: 6, 4, 4 kinds),
  temperMovesTheWar (cunning 15.5 taken per 100k men down against cautious 14.7; CI 108: 13.5 against 14.3),
  rankMovesTheFight (13 and 12 points against a bar of 10; CI 108: 10 and 9), ttCov2Realm (91.2% and 91.2%).
  Their margins are thin and C9-era: the pre-C9 build (391813a) read 19 and 17 points, cunning 16.5 against 14.8.
- **Undo:** `git revert 20ac136 dffa374`.

### H-039 · 2026-11-14 17:02 ET · CI 109: nine reds, all fixed (eight tests that had not followed the game, one calendar rule)
- **What:** CI 109 (`632ba73`) failed 13 tests in seven shards. Fixed:
  - `oaDeathbed`, `oaRenderPure`, `oaPlayEverything`, `oaChains`, `oaOldSave` (74-old-age): the fixture life of seed 7401 drowned in its
    played years, so the "family" and "priest" fixtures vanished; a dead fixture life is now dealt again on the next seed.
  - `iconsWired`: asks for the initiative tip only while the clock shows the pool (X3 removed it).
  - `scPhoneFit`: the philtre has two choices since X3 cut the drugging one.
  - `lookTiles`: hovers a shown tile (B5 hides the tiles past the six suggested).
  - `phoneDesktopSame`: closes the farewell cut-in before a shot (it outlived the 4 s wait on CI's runner).
  - `mpeMemory` -> **a game fix**: X3's calendar dated a scene by any month in its first 260 characters, so "she means to
    cross the passes in June" held a dwarf's confession to June. Only a scene's opening sentence dates it now: 11 scenes
    freed (loans "by Harvest Home", a sailing season, a famine "by March"), 113 still dated; `x3Calendar` passes.
  - `pcLives`: actions are compared over the engaged lives whole in both sets, as prompts are, and held within 1.5 a year
    (81 has no rule that can cut an activity; five lives' noise is about a point). The reasons are in the test.
- **Undo:** revert the CI 109 commits (`git log --grep "CI 109"`).

### H-040 · 2026-11-14 18:05 ET · CI 110: six reds fixed (two in the game)
- **Game:** the odds popover's rows under the honest-odds row now add up to the old chain's number, and that row is the rest
  (`ttSums2`: a near-certain check read 97 against 94; the odds rolled were always right). "The Wealthy" is read after the
  saint, the learned, the keeper, the famous, the root and the wanderer: with longer lives most long lives passed 20,000
  suns and the purse took five of six endings (`endingsVariety`).
- **Tests:** `v2wAnnalsHearsay` reads "about 30,000" in The Book as rounded; `phoneDesktopSame` closes the farewell cut-in
  right before each shot; `varietyGuard` does not count a run made by scenes another system set in front of a rolled one.
- **Undo:** revert the CI 110 commits (`git log --grep "CI 110"`).


### H-041 · 2026-11-14 18:50 ET · A2 stage 2: an optional Marshal; seven more kinds of post; every writer through the registry (D-053)
- **Commits** (branch `a2-stage2`, by an Opus 5.5 agent): `9ee9311` (2.1, the optional Marshal), `c2dad50` (2.2, the new
  posts), `717d766` and `43aecd3` (2.3, the routed writers), and the coherency/docs commit after them.
- **2.1 (D-049, owner order 51):** the Marshal's seat is optional. The crown's pick for a war that needs one stays and
  stands down at peace; a ruler may name a General or a proven commander in peace or war, who stays (record `own`); the
  court, the council's offer and the board still need such a war. The lore's sitting Marshals (Aldmark's Leofric Stane
  and four more) start in their seats, made on a stream of their own. The audit's "a Marshal in peace" rule is gone; a
  General does not take the army a sitting Marshal leads.
- **2.2:** `999990-posts` also holds 9997's battalion and company captains (when persons), the orders' Grand Masters with
  their divisions, the player's staff and free company, the heads of houses and the court titles (README table). A
  person leaving a 9997 slot spends its seed (R15) and keeps a past style; a dead Grand Master's order gets another at
  once (`A.orderMaster`); a division or army taken off the rolls leaves its posts; rebuilt battalions move their
  captains' posts. Houses go through `A.setHead`, titles through `A.POSTS.note`.
- **2.3:** every writer the month's sync adopted now writes through the registry (`A.setGen`, `A.setCmd`,
  `POL.setHolder`, `A.POSTS.place`; content `pa_court_scandal`, `ct_corrupt`). Seed-7 60-year bot life: adopted 1,626
  writes before (office 1,427, army 198, division 1), none after; audit empty every month.
- **Coherency:** new checks `one captain per company` and `one master per order`; `one holder per post` covers the new
  kinds. Quick baseline: no check rose (all 0).
- **Tests:** new `postsMarshalOptional`, `postsStage2Kinds`, `postsNothingAdopted`; made robust to the re-rolled world:
  `postsHandover` (the lore Marshal moved aside), `coSaveLoad`, `nySmallMattersWait` (first quiet seed of a few).
- **Undo:** `git revert` the branch's commits, newest first; saves made with them keep extra records in `A.S.posts`,
  which an older build drops on load (their objects are not its posts).

### H-042 · 2026-11-14 21:09 ET · CI 112 on A2 stage 2: one game fix, a faster registry, tests on the new world
- **Game:** when a lord loses his county (the release's `punishNow`) and it goes to anyone but his house's head, the house's
  seat now follows the head's own land; before, head and cousin both held province 11 (`v2fOneHolder`, seed 9005;
  99995's `N.regrant`, older than stage 2) (`38ac992`).
- **Speed:** the registry's monthly pass 2.8 -> 1.1 ms on the year-50 save: the court-title index reads the titles, not every
  person daily; houses and court titles are re-read at the New Year only (all their writers go through the registry) (`7555b31`).
- **Tests on the new world:** `inkBriefMarks` waits for a marching division the player can see (the seeded Marshal marches
  later); `v2wRankCounts` and `v2wAnnalsHearsay` read "about N" as rounded; `fcLives` hard-check bar 2% -> 1.5% (9 of 515);
  `temperMovesTheWar` sets the Marshal's seat aside in its two warring realms (seeded Marshals leading the main armies erased
  the steady/bold gap; the game keeps its Marshals; a design note for D-049). By me: `sdPageWidth` waits for the drawer;
  `cuStoryBeats` deals a story again when its life dies early; `pcLives` falls back to all engaged lives;
  `phoneDesktopSame` runs with cut-ins off.
- **Open:** `nyOneRedraw` about 10% slower than before stage 2 (within its limit); `temperMovesTheWar` and
  `worldArcsInBotLives` near the 1800 s limit locally.
- **Undo:** `git revert -m 1` the merge of `a2-stage2-fix`.

### H-043 · 2026-11-14 21:10 ET · X7 part 1: phone speed at load (D-054, owner order 34)
- **Commits** (branch `x7-phone-speed`, by an Opus 5.5 agent): `1ac4241` (the bench), `b5be226` (the title's world
  without the continent; cheaper pack setup), `77c65c7` (the continent built ahead in a worker), `a30272c` (the title
  painted before the packs), then the docs, reports and rebuild commits after them.
- **The bench:** `tools/bench/phone-load.mjs`, the built page as a Pixel 7 at 1x, 4x and 6x CPU: the loader's marks,
  the title's world, a new life (no seed typed) to its first Life screen, Next month on the year 0 and year 50 saves,
  and a V8 profile of the boot. Reports: `tools/bench/reports/phone-before.md`, `phone-after.md` (3 runs each, medians,
  on a shared 4-core machine at load 9 to 10, so read them as ±15%).
- **Before → after** (ms from navigation; 1x / 4x / 6x): the title painted 635 / 2,565 / 3,563 → 557 / 2,561 / 3,456;
  the event packs in 2,518 / 9,302 / 12,848 → 2,186 / 8,153 / 11,320; the title ready for a life (its world made)
  4,501 / 16,125 / 21,203 → 2,741 / 9,551 / 13,688; Begin to the first Life screen 1,674 / 5,866 / 8,625 → 395 / 1,863
  / 2,942; **load to the first Life screen 6,048 / 21,605 / 29,986 → 3,169 / 11,834 / 18,420**. Boot CPU (1x) 3,040 →
  1,723 ms. Next month: unchanged within the noise (year 0 about 0.3 / 1.3 / 2.1 to 2.7 s; year 50 quiet 0.2 / 0.8 to
  1.0 / 1.1 to 1.4 s); half of it is the engine's month (the war sim), left to D12b/X5.
- **What changed:** see D-054 (the title's world without the continent; the worker; the seed drawn ahead; the beast
  lookup, the event cut and the ladder census; the loader's frame). The worker on this loaded 4-core machine slows the
  packs' loading by up to 2 s at 4x (`--no-worker`: packs in 6.1 s, first Life 13.2 s); a phone's spare cores should
  not, and a worker still building when Begin is pressed is let go so the page builds alone.
- **Proof of sameness:** `tools/release/identity-probe.mjs` IDENTICAL (9 lives, 10 years); the event pool after load and
  a new life through the creation screen identical for a fixed clock (seed 42 typed, and no seed: the worker's world);
  `v2mapAhead`: the worker's world is the page's own build to the bit.
- **Tests run:** the core suites, 71-phone, 93-figures, 999999-one-redraw, 99991-v2-map (with the new `v2mapAhead`),
  29-starting-stories, 32-legend-and-master-caps, 48-event-fight-rules, 58-event-cut, 84-top-bar, 86-title-screen-in-view,
  00-security, 77-offline-fonts: all pass; `node --test tests/v2`, `tools/build-v2.mjs --check`.
- **Undo:** revert the branch's commits, newest first. Saves are untouched (no state field added).

### H-044 · 2026-11-14 22:18 ET · CI 114 on A2 stage 2 and X7 part 1: one test left, fixed
- CI 114 (`f5cccff`) failed only `phoneDesktopSame`, on the death screen. Reproduced with CI's Playwright 1.56.1 (Chromium
  141): a gradient's dither in the obit panel moves a level or two of colour between two paints of the same layer. The test
  now reads a pixel as changed only past three levels (4 of 4 green on CI's browser, 3 of 3 on the container's). Cut-ins
  stay off for the comparison.

### H-045 · 2026-11-14 23:41 ET · CI 115: the woodcut masked; the year's cost measured (no code change)
- `phoneDesktopSame` masks the woodcut scenes as it masks portraits (their filtered texture repaints apart on CI's
  Chromium 141); they are compared by layout.
- `nyOneRedraw` read 2592 ms on CI 115 (limit 2000; CI 114 passed on the same code). Profiled by the A2 agent over 16
  seeds: stage 2's own code costs about 1.6% of a quiet year (the registry about 0.7% of samples). The rest is the world:
  with the five lore Marshals seated in peace (D-049) the scenario runs about 10% more war-days (more wars at once), likely
  because a peacetime Marshal musters and speaks for war on the council. Left as it is pending the owner's call on D-049
  (whether a Marshal in peace should push for war); the test is not loosened.

### H-046 · 2026-11-14 23:45 ET · B5 part 2: one UI.scope, the six-life draw test, one goal stack (D-055)
- **Commits** (branch `b5-part2`, by a Sonnet 5.5 agent): `254c2cd` (UI.scope and its routes, the six-life test), `69b5efc` (the goal
  stack, the tablet test, D-055), `98a0f83`, `0d3b2ce` (the chapter's card stays a folded card after the goals card: nested, it
  could not fold and the Life panel overflowed by 17 px), `0ff0458`, `2df86f5`.
- **Tests run on the final build:** the core suites (boot, saveRoundTrip, savesStillLoad, uiSmoke, renderRng, replayWithRender,
  journalReplay), every test of 9992-story-drawer (incl. b5Budget: 78 screens within budget), 59-descriptions, 71-phone,
  999996-profile-tab, 996-coming-up, 99997-v2-war, 84-top-bar, 90, 91, 99992-v2-time, 97, 9993, 99998-click-open and the new
  ones (131 + 94, 0 failed once fitsOneScreen was fixed); `tools/bench/balance.mjs`: all within their bands. Not run: the
  full suite (CI shards it), the Great Continent league, `tools/check.mjs`; `index.html` is not rebuilt on this branch.
- **UI.scope(pc)** (`src/ui/999997-scope`): one pure reader of age, class, posts (`A.POSTS`), war rank (`A.V2W`) and household.
  `sees`, `page`, `act`, `social`. `A.canAct`, `A.interactOptions` and `A.whatNow` take it as their last wrapper; the bar's
  places, the Life, Path and profile pages and the rail read it. What no life like his is offered is not listed, instead of a
  disabled line with a reason. An infant has no activities, no looks line, no proficiency list and one action on a card; a
  minor has no crime, dice, plots, duels or courting; a dependent does not pick a fight with, insult, duel, murder or plot
  against a parent; nobody duels a child; "Find work" is not told to a squire, a lord or a councillor.
- **The six-life test** (`scopeSixLives`): a newborn, a child of 9, a squire of 16, a File-Leader at war, a captain in garrison
  and a councillor draw 14 pages at 1366 and 420 px, five overlays and three cards each; the forbidden strings are data per life
  (`LIVES` in the test). On the build before this step: 41 leaks; after: none.
- **One goal stack** (`src/ui/999998-goal-stack`): What now, the ambition, the chapter's next aim and Coming up's dated items,
  by score, five at most, as the Life page's one card; the chapter's card, folded, after it; the Coming up strip and the ambition
  card are no longer drawn on their own (their data and rules are unchanged). `UI.GOALS.source` adds a source.
- **Edits outside the two folders:** the release's rail (Looks), Life page's hidden reasons, plan aims, Path rows, "Get to know"
  and What now's "Find work"; the profile (looks, skills); `996-coming-up` (the strip yields to the stack) and its tests.
- **Tablet:** `b5Tablet` holds part 1's 44 px touch targets and no sideways scroll at 768 and 1024 px. The phone shell on a
  tablet is not done (D-055).
- **Undo:** revert the branch's commits, newest first; saves are untouched (no state field added).

### H-047 · 2026-11-15 03:46 ET · X2: named stages for the seven hot functions; the muted diplomacy path held (D-056)
- **Commits** (branch `x2-named-stages`, by an Opus 5.5 agent): `420ea98` (the stage runner `src/core/01-stages`, its
  manifest, every wrapper of the seven converted, the journal's runtime wrap through `A.addStage`), `23f1220`
  (`tools/lint-stages.mjs`, `tests/stages-baseline.json`, wired into `tools/check.mjs`), `40bdff6` (`A.V2DIP.MUTED` and the
  test `v2DipMutedPath`), and this record (D-056, PROGRESS, CLAUDE.md).
- **What changed:** `A.applyFx`, `A.eventView`, `A.eventChoose`, `A.newGame`, `UI.render`, `UI.refresh` and
  `UI.renderModal` each have one definition, the release's, and run named stages in the order of
  `src/core/01-stages/manifest.core.js`: 31, 12, 20, 22, 20, 14 and 18 stages. Definitions per function by the P3 census
  before: 32, 12, 19, 22, 21, 14, 18 (it missed 97's `during` on A.eventChoose, 999999's `counted` on UI.renderModal and
  99992's `watch` on UI.refresh, and the journal's wrap at `UI.init`); after: 1 each. Names defined more than once: 364
  before, 357 after (definitions 2,487 to 2,358), held by the lint. Every wrapper is an around stage with its body
  unchanged (75 feature files); the release's `A.journalStart` (`src/core/release/core/19-journal-and-replay.js`)
  registers the journal as the stage `journal`.
- **Proven:** `tools/release/identity-probe.mjs` before/after: IDENTICAL (5004 event classes, nine fixed-seed lives of ten
  years), after step 1 and again on the final build. `tools/release/verify.mjs`: content, lore and page the same; it
  cannot judge two built cores (it reports DIFFERENT for a build against itself).
- **Tests run on the final build:** the full suite, every test of the default build, 830 by name, 0 failed (607 in one run
  with three workers that its time limit cut off, the other 223 by name afterwards), including the core suites,
  `stagesOneDefinition`, `stagesApi` and `v2DipMutedPath`. `tools/bench/balance.mjs`: all within their bands.
  `tools/bench/press-gate.mjs --report`, before and after, twice each: the same full-redraw counts (2, 2, 2, 3), quiet
  months within the run-to-run noise (before 147 to 180 ms, after 129 to 176 ms); the gate is over some budgets on this
  loaded machine for the build before X2 too. `index.html` is not rebuilt on this branch.
- **Undo:** revert the branch's commits, newest first; saves are untouched (no state field added; `A.V2DIP.muted` is not
  saved).

### H-048 · 2026-11-15 06:41 ET · C6: households, how you met, no kin minted, one resolver for a house, the parish, nine months (D-057)
- **Commits** (branch `c6-households`, from `v2-integration` at `5ae6a28`, by an Opus 5.5 agent): `d5aaed1` (design note
  `docs/design/households.md`, D-057), `cdd1327` (step 1: the household at birth, gatherings, `met` on every new entry),
  `48c38f5` (step 2: kin helpers take from the tree, the guard, `tools/lint-kin.mjs`), `df967e7` (steps 3-4: `A.HOUSE`,
  `A.conceive`), `07ff129` (step 5: the parish), `4726731` (the people sweep keeps the player's tree), `1de2ad2` (`ctx.noKin`;
  the kin arcs' fixtures), `a5be0d9` (step 6: tests, README, skill, CLAUDE.md, CHANGELOG), `b2cbade` (`newRel` with a kin
  word; claimants recognised into the tree), and this record.
- **What changed:** see D-057 and `src/family/999991-households/README.md`. New state: `A.S.household`, `A.S.parish`,
  `A.S.pregs`, `rel.met`, `rel.hh`; all optional (an old save without them loads and plays on: `c6OldSave`).
- **Edits outside the new folder:** the release's core (`A.link`, `applyFx` `them`/`newRel`, `A.eventView`'s setup catch,
  `A.makeAcquaintance`, `A.familyYear`, `A.kill`, `A.houseHead`, `A.marry`, `A.gcPeople`, the person view's "Known") and
  packs 04, 07, 08, 10, 11, 13, 14, 15; 99994-v2-family (household label; `A.HOUSE` in `c-succession.core.js`),
  99995-v2-nobility (the court lord's case to the resolver), 999990-posts and 9999-advisors (`met`), 50-arcs-kin (no kin
  made; `recognize`; fixtures in its test), 53-arcs-things, 80-orphan-flag-callbacks, 40-memory-peoples, -realm-blood,
  -regional-a (and their tests read a `noKin` drop as by design), the stage manifest, `tools/check.mjs`.
- **Measured:** 42 births: commoners knew at most 5 people, nobles at most 8 (before: 13 to 32 for every rank, with 4
  grandparents dead or alive, 3-9 uncles, up to 13 cousins). 12 worlds × 30 years: no kin word given outside the tree, no
  relative made (before: 13 links to people the tree did not place, and the minting helpers wrote uncles and cousins into
  it). Event classes: 5004, 0 differ (`identity-probe` against `v2-integration`).
- **Tests:** on the build of step 5 (`07ff129`), 127 by name (the core suites, `renderRng`, `replayWithRender`, `journalReplay`,
  `savesStillLoad`, the families, kin, bonds, circles, posts, old age, echo scenes, memory packs, advisors, saves, the
  new `c6*`): 121 passed; the 6 that failed (`coherencyBaseline`, `mpeMemory`, `mrbMemory`, `kinArcsPlayThrough`,
  `kinRealTree`, `c6NoKinMinted`) were fixed and pass on the final build with 18 more (kin, things and callback arcs, their
  bot lives: `kinBotLives` 6 of 12 long lives met a kin arc, bar 40%), and on the final build 76 by name again (the core
  suites, the replay tests, the households, v2-family, bonds, posts, circles, get-to-know, echo scenes, v2-saves): all
  passed. Coherency quick: no check above its baseline.
  `tools/lint-kin.mjs`, `tools/lint-stages.mjs` (357 names defined more than once, unchanged), `lint-events` for the four
  event features edited: clean. `tools/bench/balance.mjs`: all within their bands (no band changed).
- **Not done:** F8-F10 (the People page's Household block, the tree centred on you, the person card's order), F6 beyond
  the parish, P9's per-realm target. `index.html` is not rebuilt on this branch.
- **Undo:** revert the branch's commits, newest first. Saves made with it keep `household`, `parish`, `pregs` and `met`
  fields the build before ignores.

### H-049 · 2026-11-15 08:24 ET · CI 119 on C6: five game fixes, two tests
- **Game:** the household fits the age (a nurse until 7, a tutor 6-16, "your old nurse" after; household people under
  Family), so the People page keeps its three-screen budget; `A.skill` takes a wound's penalty after C9's skill cap (a
  capped fighter lost nothing to two lost fingers, a C9 bug C6's dice exposed); an office given up for a higher post is
  refilled when the appointment completes and a dead holder's the next day (`A.S.polRefill`); the war-strength bar opens
  a click-to-open note; a promotion reason built from a title with an unfilled token is skipped (`a77ac92`, `823de18`).
- **Tests:** `deathNamesTheHurt` draws its stale case 40 times (one draw of `A.naturalCause` can be "a wound gone bad");
  `tensionsRun` reads three famine worlds (caravans relieve a famine realm before grain is dear in about a quarter of
  worlds, 5 of 20 seeds).
- **Undo:** revert the merge of `c6-ci119` and the `tensionsRun` commit.

### H-050 · 2026-11-15 09:44 ET · CI 120: oaFireRate on twelve lives
- CI 120 failed only `oaFireRate` (46 years past 55 over six lives, bar 50). Not a C6 regression: `A.deathChance` reads age,
  race, health, blood and estate, none changed; over 40 seeds the mean life past 55 is 15.8 years before C6 and 15.3 after,
  single lives 3 to 22 years in both, so six lives' sum swings by about 12. The test plays twelve lives (sex flipped), bar
  100 years (`0e05066`).


### H-051 · 2026-11-15 10:38 ET · C7: names are data, flavour is a weighting, people from the neighbour, no twins, realm names in the source (D-058)
- **Game:** new people are named from one common English pool (a hashed subset per culture and realm, a lean per realm, an accent per
  culture) or, for the far and non-human peoples, their own pools (`data/names.json`, `src/world/engine/names.js`, `A.NAMES` in
  `src/world/999981-names-and-cultures`); the parish's people are of their realm, a port, a market town and a border province draw some
  from a trade partner or the neighbour; a monthly pass leaves no full name twice in a town and no given name twice among siblings
  and first cousins; fiefs are named from their realm's culture; the character screen offers the realm's names. Four realms are named
  for their governments (Khanate of Ulun, League of Brannoch, Free Port of Corvasse, Ughrak Clans); the eight Nov 5 names are written
  into the lore and 906 strings of the source (`tools/c7/rename-realms.mjs`) and the renaming hack (`99999-v2-names`) is deleted
  into `archive/c7-realm-renaming-hack/` (last built at `b87c908`); the old syllable namer is in `archive/c7-syllable-names/`.
- **Measured:** census of 35 realms (`nmCensus`): 69 ports and market towns draw 17-35% (mean 27%) from trade partners, 185 border
  provinces 20-40% (mean 30%) from the neighbour. `nmTwins`: the build before had 21 twins in a town in 3 worlds; this one none in
  12 worlds x 30 years (see the run below). `nmOldNames`: 19.6 MB of scripts, lore, events and a new game hold none of the old names.
  `identity-probe` against the build before: 5004 events, 0 audience classes differ.
- **Old saves:** keep every person's name and the prose of their log; the eight realms are renamed by id on load.
- **Undo:** revert the branch's commits, newest first; `git show b87c908:src/world/99999-v2-names` has the hack.

### H-052 · 2026-11-15 14:05 ET · CI 122 on C7: one game fix, tests on the new pools and on many worlds
- **Game:** `ga_open` (27-gs) names "the great of the realm" when a gathering has no attendees (a raw `{who}` showed);
  the place namer draws twice as the old syllable namer did, so a court's titles keep their stream (`84df6f4`,
  `2918ba6`, `7eb4eb9`).
- **War unchanged:** `temperMovesTheWar` and the rarer sieges come from C7's names drawing differently from the stream,
  not from any war rule: with `A.NAMES.ok` off the pre-C7 numbers return exactly, and the pre-C7 build itself gives steady
  a field share of 16%, 34% or 20% on three other twelve-world sets. The test pools four world sets (seeds 71-371); it
  passes on both builds, no bar changed. `siegeInARealWar` reads 20 seeds.
- **Tests on the new pools or one world:** `namingEveryCulture` (reads each culture's pool, accent and leans: all 24 keep
  their rule), `fbEnlistSays`, `v2cPlaytest2Class`, `v2sPlaytest1`, `carRaised`, `lnWorkAndYear` (bodies that carry the
  skill under C9's cap), `oaChains` (advances the stream; 24 tries), `nySmallMattersWait` (first seed nothing stops),
  `aarSoldierLog` (16 soldiers, bar 4), `localEventsUseWords` (8 lives a culture; the voiced line is hashed from the
  player's id), `riPushesFollowNeed` (6 worlds, 3 must show every part; greedy 90% against generous 3% in all six),
  `v2wFightWaits` (30 lives; one fight that ended the day it was asked is allowed).

### H-053 · 2026-11-15 15:02 ET · CI 123 on C7: two tests on new worlds
- CI 123 (`5061948`) failed two tests, both a test's few seeds meeting the new world:
  - `postsSaveMigration`: seed 41's noble dies in the year before the save loads, and the repair skips a dead player by
    design; the test takes the first of seeds 41, 43, 47, 53 whose noble lives (`1bc4508`).
  - `idVoiceOnce`: seeds 555-557 drew no voice. Voices still come (53 in 36 lives against 72 on alpha.7); fewer because
    more counsel and recall cards take the card's voice slot (`A.V2C.voiceFits`). The test plays twelve lives (`3c5d29d`).


### H-054 · 2026-11-15 16:56 ET · C8c: dress, class and regalia (D-060)
- **Branch** `c8c-dress` from `38a4568`, not pushed. Steps: `e3484b6` the figure library (four cuts, livery, rank on a
  soldier, jewels by rank, ten headwear; `cultures.js`; the dress sheets), `a628932` scene tags (`src/events/26-scene-tags`;
  `UI.WOODCUT.shapeOf` asks it; two prints, a `data-shape` and `data-scene` on every print), `30cc3f6` the game's side
  (the sheet's `wear`, `where`, `dye`, `job`, `role`, `mil`, `livery`; `A.setDress`; the Dress control; the blind readings),
  then this record.
- **Other features edited in place** (each marked `[C8c]`): `61-illuminated-chronicle/woodcut.core.js` (the shape from the
  tag), `94-woodblock-skies/skies.core.js` (the fields, a market, the sea by tag) and its test (27 scenes),
  `999996-profile-tab` (the Dress control in the Gear panel; the About line when the harness is off),
  `93-figures/figures.a-peoples.core.js` (the table moved to the library).
- **Tests added:** `fgDressStations`, `fgSoldierBust`, `fgLivery`, `fgHoods`, `fgOutfits` (93-figures), `stTags`,
  `stPictures` (26-scene-tags), `tests/v2/figure-dress.test.js` (seven unit tests).
- **Undo:** revert the four commits. Nothing in a save depends on it (`dress` on the player is ignored by an older build);
  the journal's `setDress` entries would not replay on an older build.
- **To integrate:** rebuild `index.html` (not committed here); the count of browser tests rises by seven.

### H-055 · 2026-11-15 17:25 ET · X3 part 2: cards held to the life they are dealt to (D-059)
- **Branch** `x3-part2` from `v2-integration` (`38a4568`): `52399a3` (preview replay and three honest previews), `ddd45bd` (station
  words, place, counsel, children), `15cb503` (pronoun lint and 22 mended scenes), `22a4de4` (the fatal illness arc), `40cb124` (tests and docs), `f3e967b` and `820b74a`: the advisors' ring seats only people who are there (`advLives` bars 80% -> 60%, 3 -> 2.5 advisors, D-059).
  Not pushed.
- **What:** `99999-x3-honest-cards` gains `c-preview` (no piety chip for a man with no faith), `d-station` (words that address the player
  by a station, with gates), `e-place` (where you stand; home-town scenes; who is present), `f-guard` (the last look at the card, an
  `A.eventView` stage `x3-honest-cards`), `g-illness` (worsening and the turn of the fever; `A.X3.illAfter` is called from the end of
  `A.bmIllMonth`). `9998-choice-stakes`: a share of the purse is its own chip, and its large size is an eighth (it was 20, for a
  fraction). `tools/lint-cards.mjs` and `tools/lib/card-lint.mjs`: the pronoun lint (0 slips; 20 reasoned exceptions) and the
  station gaps against `tests/cards-baseline.json` (0).
- **Tests (new, `tests/suites/x3b.test.mjs`):** `x3PreviewReplay400` (400 scenes, eight lives, 253 preview claims: it found three false
  previews, now fixed), `x3HonestCards` (12 worlds x 30 years and six nurseries, 2,782 cards: 0 station, 0 place, 0 child, 0 counsel
  breaches; the last look dropped 0 station, 16 place, 4 child, 3 counsel), `x3Pronouns`, `x3IllnessArc` (40 sick adults, 39 reach the
  turn, 15 live, 24 die of it, named, none without the scene). Part 1's 10 x3 tests, the core suites and the body-mind, advisors and
  choice-stakes tests pass.
- **Identity probe** against the build before: 5,004 events, audience classes differ for the 2 new scenes only; fixed-seed lives
  differ, as they must (weights changed, and 22 results read differently).
- **Undo:** revert the branch's commits, newest first; `A.X3.illAfter` is one call in `body.core.js`.

### H-056 · 2026-11-15 18:45 ET · CI 126 on C8c and X3 part 2: the gates spare story steps
- **Game:** a scene that follows a story (its condition asks for a set flag; or forced, an arc's, a chain's) is exempt from
  X3's station and place weights and the last-look guard (`A.X3.followsStory`): 19 tests had arcs, chains and memory
  callbacks dropped mid-story. An ending is decided for any dead player without one (a death in childbed called `A.kill`
  before `A.pcDeath`, an older bug). `fl_st_master` keeps its one-sex reading (a pronoun edit had hidden it).
- **Bars moved (tests):** `fcLives` hard-check share 1.5% -> 0.7% (0.8% measured; about 3 checks in 340, so the bar reads
  that a few hard checks remain); `v2wChoicesMove` order edge allows 3 points' fall (222 -> 220).
- `f1be556`, `b4aabf3`.

### H-057 · 2026-11-15 19:42 ET · CI 127: counsel by letter
- CI 127 (`242517b`) failed only `advLives`: a peasant conscripted at 17 stood with his division far from home, so his
  household was absent and the advisors ring was empty (peasant 0 advisors). `A.X3.reaches(pc, t)` now answers 'here' for
  someone present and 'letter' for the household he left (parents, spouse, children, siblings; alive and free); the ring
  seats both and an absent one speaks as "A letter from home: ...". advLives at its 60% bar: 74% of big choices counselled,
  3.3 advisors a life, peasant 2 (`16b21ca`; an addendum to D-059).

### H-058 · 2026-11-15 20:38 ET · CI 128: lfRepeats at 70%
- CI 128 (`f28a996`) failed only `lfRepeats` (with the first-life fixes 10.1 prompts a year against 13.5 without, 0.748
  against a bar of 0.75; it read 0.77 before X3 part 2's gates). 97 cuts repeats by design; the bar is 0.7 of off's.

### H-059 · 2026-11-16 · T1: two test tiers, shards by time
- The owner asked to cut the long testing. Measured from 14 CI shard logs (`/tmp/ardan/ci*.txt`, four workers a job): 852
  tests, about 14 CPU-hours; 42 tests of 200 to 1,800 s (kinBotLives, temperMovesTheWar, worldArcsInBotLives, rivalsBotLives, pcLives,
  aoArcsEveryBranch, ...) are 28,400 s of it, and the old `i % 8` split put several of them in one shard (35 to 45 minutes a run).
- `tests/run.mjs`: `--tier=quick|long|all`, shards balanced by `tests/test-times.json` (longest first onto the lightest shard,
  and run longest first within a shard), `--plan`, `--check-tiers`, `--times-out=`; `tests/long-tests.json`; `tools/test-times.mjs`;
  `tools/check.mjs` runs `--check-tiers`. `check.yml` runs the quick tier (estimate: 810 tests, 12 minutes a shard); new `long.yml`
  runs the long tier nightly, on demand, on `[full ci]` and `release/*`. Build, balance and press jobs unchanged (balance not
  measured here: no log has it). 167 tests had no CI time in the logs (planned at 30 s): the first long and quick runs' time artifacts fix that.
- Undo: `git revert` the commit; the old runner split was `i % n` over the test list, and `check.yml` ran all tests.

- **First run (CI 131, both tiers green, 2026-11-16):** long tier 26 minutes; quick shards 9 to 19 minutes of tests, but the
  balance job took 37 and held the run to 38. Balance moved to `long.yml`; all 16 shards' times merged into
  `tests/test-times.json`; 12 tests over 200 s joined the long list (54). New plan: quick about 11 minutes a shard, long about 22.
  Undo the move: put the `balance` job back in `check.yml` from `long.yml`.
- **Measured after the move (CI 132, push 540b1cc, green):** the whole quick check took 14 minutes 21 seconds, start to finish (was 38).

### H-060 · 2026-11-15 21:35 ET · D12a-2: the war design revised with the owner's ten answers (design only)
- **Docs:** `docs/design/war.md` revised (part one kept, changes marked *(D12a-2)*; part two new, §9 to §16: command
  without a Marshal, manpower without levies, why wars start and end, your place in it, stability and upheavals, the
  military path and training, records and old saves, the build order in sixteen stages); a one-page summary for the
  owner at its top; two diagrams, `docs/design/war/5-command.svg` and `6-reports.svg`, drawn by
  `docs/design/war/build-command.mjs`. D-064 records the choices made where the answers left room.
- **Game:** nothing. No code, data or test changed.
- **Left open:** every stage of §16; CRITIQUE §2's "done when" for D11 and D12b still read the first plan; the
  `life-sim-systems` skill carries a note of the direction, not yet the built rules.
- **Undo:** revert branch `d12a-2`'s commits; the first design is `0378b9e`.

### H-061 · 2026-11-16 · W1-1: no Marshal, five ranks
- **Game:** five ranks (soldier, sergeant, captain, commander, General); `GD.MIL` keeps eight grades as steps (0-7; High
  General and Marshal gone; `A.rankLabel` adds "(second step)"). A war-map division of 3,000+ men is a host led by a
  General, under 3,000 a column under a Commander (`A.HOSTS`, new feature `src/war/9999905-five-ranks`; seed Generals by
  `A.oobLeader`, no persons made); an army of two hosts or more is led by its commanding General by the king's written
  word (the `army:<id>` post); `a.sub` army groups retired. The council's `marshal` seat is now `general`, read from the
  crown's first host (`A.POSTS.firstHost`, `r.firstHost`; `seat:<r>:general` redirects to `div:<first host>`); the crown
  fills it monthly (`A.POSTS.fillGenerals`); a General's superior is the crown. Old saves: `A.POSTS.migrateMarshal` /
  `seatMarshals` (Marshal -> senior General; player grade 9 -> 7 with the first host; old words in styles, the
  achievement `marshal` -> `senior_general`, the advisors' ring and 9996's council task renamed). Rank-8/9 events
  (`rk_gen_treaty`, `rk_gen_hang_officer`, `rk_mar_*`) re-gated to rank 7 or the senior General. Words swept in the
  release source, content, lore, `data/names.json` (trade surname "Marshal" -> "Marcher"), the v2 engine and features;
  orders' "Marshal of the ..." -> "Seneschal of the ...", Sunrise's Spear-Marshal -> Spear-Lord.
- **Tests:** new `w1NoMarshalLint`, `w1NoMarshalWorld`, `w1GeneralsFollowHosts`, `w1SeniorGeneral`, `w1OldSaveMarshal`
  and the sample save `tests/saves/v2.1.0-alpha.9-marshal.ardan` (made from 6dbabd3's build); `postsMarshalRepro` and
  `postsMarshalOptional` replaced by `postsSeniorGeneralCourt` and `postsSeniorGeneralFill`; other tests' rank words and
  Marshal setups updated (99992, 97, 994, 56, 38, 9997, 99997, 96, 999996, 999997, 99993). Bars moved, with reasons
  in the tests: `postsDeathVacates` counts posts other than a court title (the army's general is now a great house's
  head, whose title passes at the law's own pass); `pfNumbers` asks two numbers a life, not three (seed 4104's orc girl
  reads two now that the crown names senior Generals with the game's dice).
- **Left for W1-3:** the reasons for the king's choice of a commanding General, the king leading in person, the council
  of war's cost; unit words ("division", "battalion") outside the order of battle (D11-1).
- **Checks:** new tests 5/5 pass; posts 8/8; savesStillLoad 13 saves; 99992, 97, 994, 56, 9996, 9997, 9999, 99997,
  999996, 999997 tests touched pass; `node --test tests/v2` 89/89; lint-stages, lint-kin, lint-events (the four changed
  packs), `build-v2 --check`, `--check-tiers` ok; `coherency --quick` no contradiction; `long-life-audit --seed=7
  --years=30` clean (0 errors, audit empty, 0 broken post months).
- **Commits:** `35b2f9e` (the stage), `1f69eed` (test bars, long tier).
- **Undo:** revert branch `w1-1`'s commits (base `6dbabd3`); D-066 records the choices.

### H-062 · 2026-11-16 · G0: the growth standard (research and design only)
*Numbered H-062, not H-061: another agent may take H-061 in parallel.*
- **Docs:** `docs/design/growth-standard.md`: a one-page summary for the owner; §1 today's growth measured over nine
  fixed-seed bot lives from birth; §2 the research put plainly, with sources, and six games compared; §3 the standard
  (a cause for every change, the formula family, the practice curve, quality of effort and the routine ceiling, teachers
  and their ceiling, the learner's age by kind, condition, named plateaus, trials at Expert and Master with stored effort,
  disuse by kind, each stat's curve over a life, detraining and setbacks, how every source feeds in, words for the
  player, three worked lives, NPC kits); §4 for the builders (files and functions, saves and migration, thirteen tests
  that prove "not linear", a cost budget); §5 choices for the owner. Scripts in `docs/design/growth/`: `measure.mjs`
  (bot lives, year by year), `analyze.mjs`, `model.mjs` (the standard, runnable), `lives.mjs` (the worked lives),
  `chart.mjs` → `curves.svg`; the measured data `today.json`. D-067 records it. `growth.md` points to it; PROGRESS ticks G0.
- **Game:** nothing. No code, data or test changed.
- **Left open:** the owner's choices in §5 (trials at Expert and Master above all); building it is G1/G2 and D11+.
- **Undo:** revert branch `g0`'s commits.

### H-063 · 2026-11-16 · C8d gate 1: profile cards in the owner's manhwa reference style (a style frame; nothing in the game)
- **Asked** (orders 56, 57, 58): the reference's card (navy, gold edge, realm banner and crest, a waist-up figure before
  a scene, station with icon, three keywords, a motto), drawn by code, with dress, arms and headwear differing by people,
  border and wealth, and the reference's weak spots fixed.
- **Code (new, used only by the demo):** `src/ui/engine/figure/manhwa/` (`ink.js` the pen: flat cel forms, tapered
  lines, trims with motifs, tiles; `head.js`, `locks.js`, `body.js`, `wear.js`, `hats.js`, `props.js`, `scenes.js`,
  `peoples.js` the kits and their reasons, `card.js`, `index.js`). Not exported by `figure/index.js`, not in the engine
  bundle, no game file, build or test changed. Same dice (`g.js stream`) and palettes as the library; no `Math.random`.
- **Sheets:** `node docs/design/demo-2d/c8d/sheet.mjs` writes `docs/design/demo-2d/c8d/sheet.png` (8 stations × Northreach,
  Qadir, Ulun, Zanara, at 2x), `details.png` (Qadir and Sabra, Northreach and Aldmark across a border; a Qadir and Zanara
  border town; wealth in one craft; eight herders of Ulun), `one.png` (cards at 420 px), `compare.png` (beside the
  reference); `--measure` writes `measure.json`.
- **Measured:** a card is 75 KB of SVG (21 KB gzipped), about 3 ms to make, about 10 to 14 ms to draw here and 35 to 42 ms
  with the CPU slowed four times; the layer is 245 KB of source (72 KB gzipped, unminified); no raster image (a painted
  background would cost more than the card).
- **Not reached, said to the owner in `docs/design/c8d-gate1.md`:** it is clean cel drawing, not painting; near front
  views; simple arms and hands; flat scenes. The repo gains about 13 MB of PNG for the owner's eye.
- **Checked:** the same person gives the same string twice; `sheet.png` is byte-identical across two runs;
  `node --test tests/v2/figure*.test.js` 20 of 20 (the old library is untouched).
- **Left open:** the owner's verdict and the seven choices in the gate note; the other twenty peoples; children, the old,
  wounds; the face code feeding the new head; tests for the layer; building it into 93-figures and the Profile tab.
- **Undo:** remove `src/ui/engine/figure/manhwa/`, `docs/design/demo-2d/c8d/`, `docs/design/c8d-gate1.md` (branch `c8d-gate1`).

### H-068 · 2026-11-16 04:00 ET · P3: the owner's playtest fixes (order 54, D-062 addendum)
Branch `p3-playtest` from `v2-integration` at `2aaf1ba`; one commit a fix; not pushed.
- **Fix 1, "Start a new life" (`e54b20f`).** The confirm's yes cleared its pass in a `finally` before 999999's deferred start
  ran, so "Start the new life" asked again for ever; the menu also stayed open over the creation screen. The yes hands a
  one-use pass `UI.startLife` spends; `UI.A.newLife` closes its box. Test `newLifeAfterSave` (real clicks; fails on the
  build before).
- **Fix 5, a step completes after its cards (`c6fb716`).** 84's `UI.stepGo` no longer ends a year once its card is
  settled; 99992's battle/duel stop ends a step only when it put you on campaign; 999995's happenings (wound, illness,
  death or birth in the household, coming of age, a call to war) go into the digest (`sum.met`) instead of ending the year.
  Test `nyYearGoesOn` replaces `nyEarlyStops`.
- **Fix 2, free will (`82bd806`).** Retired to `archive/p3-ambitions/` (97's `c-ambition.core.js`, `ambition.events.js`;
  tests `lfAmbition`, `lfAfterTheTop`, `lfWhatNowSystems`) and `archive/p3-chapters/` (9993-life-chapters whole; v2-time's
  `v2tChapterPanel`, `v2tChapters`). **Last commit that built them: `c6fb716`.** Goal stack rewritten (debts, favours owed,
  promises only); `C.ambition` reads `A.SEEK` (new `src/people/9989-what-you-seek`); hint and help texts.
- **Fix 3, crimes against a ruler (`d1eb73d`).** New `src/nobility/999993-crown-crimes` (reach, discovery with reasons, the
  record, the sentence by law and nature, the block, forgiveness, regicide's aftermath: the realm, the inquiry, kin
  vengeance, the price, avengers); 39-schemes routes a king's murder through it. Tests `ccReach`, `ccAttempts`,
  `ccRegicide`, `ccForgive`.
- **Fix 4, the first mission (`ea699f4`).** New `src/war/99972-unit-work` (monthly unit work by war, post and officer; a
  recruit's first within ~100 days); `A.milYear`'s yearly mission waits when the unit had work in 90 days. Test
  `uwFirstMission`. `tests/stages-baseline.json` 356 -> 355.
- **Checks:** lint-events and lint-choices clean for the touched features, lint-kin clean, lint-stages ok, coherency quick:
  no contradiction, no check rose.
- **Undo:** revert the five commits, newest first; to bring the ambitions or chapters back, move their folders from
  `archive/` into `src/events/` and restore their manifest stages.

### H-066 · 2026-11-16 · The old Ardan Codex reviewed (research only)
- **Asked:** the owner uploaded an old, outdated Codex (the Far Lands, 1105) and asked what in it is useful.
- **Docs:** `docs/research/codex-review.md` (what it is, what matches, contradicts or is gone, 12 useful items by work item,
  recommendations); `docs/research/codex/reasons-and-cracks.md` and `docs/research/codex/martial-concepts.md` (plain lifts, no
  code); the file itself as `docs/research/ardan-codex-old.html`. `docs/README.md` indexes them.
- **Found:** its data is already in `archive/` (99-far-lands, 990 to 993, retired in H-001); it adds prose, quarrels, money and
  chokepoint tables, realm secrets. Outdated: military templates, Marshal, levies (the war score is not in it).
- **Game:** nothing. No code, data or test changed.
- **Undo:** revert the branch `codex-review` commits.

### H-067 · 2026-11-16 · S1a: the design for skills with levels and experience (order 63; nothing in the game)
- **Asked** (order 63): retire the proficiencies everywhere; skills with levels and experience; growth that moves with
  the life. Design only.
- **Written:** `docs/design/skills.md`: the owner's page; §1 what is removed (data, engine, every place the player reads
  it, tests), counted with `git grep` at `962791e` (5,695 checks, 4,989 skill grants in effects, 337 `A.trainSkill`
  calls, 349 `A.skill` reads, 252 `C.prof`, 110 direct writes to `.skills`, 51 "proficien"); §2 the model (28 skills,
  99 specialisms, 35 levels, the experience table, 252 concepts, grasp, proof, breakthroughs, talent, rust); §3 sources
  and the fourteen things that move growth; §4-§5 checks and effects; §6 kept and cut; §7 the ledger; §8 the page at
  375 × 667; §9 migration; §10 other people and the census; §11 ten choices for the owner; §12 for S1b (the engine
  module, twelve file steps, data bounds, cost, eighteen tests, lints, six stages with done-when).
- **Scripts** (`docs/design/skills/`, not game code): `gen-data.mjs` → `skills.json`; `model.mjs` (imports the growth
  standard's `../growth/model.mjs`); `lives.mjs` → `lives.json` and the tables; `chart.mjs` → `lives.svg` (rendered in
  Chromium, light and dark, and looked at). Twelve concept names come from `docs/research/codex/martial-concepts.md`.
- **Measured in the model:** a prodigy (talent S, easy needs, a grandmaster's drill) is Master in 4 years; an ordinary
  plodder in 27; a gifted, well-taught man with one blind concept ends at Expert V; of 400 people of talent C given
  the same best training 343 reach Master in 8 to 49 years (middle 11) and 57 never.
- **Game:** nothing. No code, data or test changed.
- **Left open:** the owner's choices (§11; two are conflicts between earlier orders, recorded in D-072); S1b.
- **Undo:** revert branch `s1a`'s commits (`docs/design/skills.md`, `docs/design/skills/`, and the lines added to
  DECISIONS, HISTORY, PROGRESS and `docs/README.md`).

### H-065 · 2026-11-16 03:30 ET · I1-0: the route to the iPhone App Store, researched and written (order 62; nothing in the game)
*Numbered H-065: H-064 is another agent's.*
- **Asked** (order 62, rule 21): re-check the owner's six facts from today's official docs; map the route (performance,
  iPhone readiness, a `www/` build, Capacitor, Codemagic and TestFlight, the listing, review) with commands, config, the
  owner's own steps and pitfalls; write the roadmap, a skill, a CLAUDE.md section with the build rules, and the decisions.
- **Written:** `docs/IOS_ROADMAP.md` (verdicts on the six facts, what else is true now, seven stages with a sample
  `capacitor.config.ts`, Info.plist keys, a privacy manifest and a `codemagic.yaml` for a Capacitor 8 SPM project; the
  one-file page in WKWebView; the owner's steps and when; the audit against each build rule with file:line; 13 fixes,
  sized and placed); `.claude/skills/ios-capacitor-release/SKILL.md`; CLAUDE.md "End goal: iPhone App Store" and the
  skill in the Layout table; D-071 (the route), D-075 (eight choices: `app/`, one file first, Filesystem and Preferences,
  iPhone and portrait only, iOS 17, the audio session, plugins without a bundler, builds by hand), D-076 (six readings of
  the rules against the code); PROGRESS I1 with seven stages, and the audit's fixes folded into X5, X7 part 2, D9 and Gaps;
  `docs/README.md`.
- **Probes** (`docs/research/ios/`): `tap-probe.mjs` (Chromium and WebKit, 375×667: 58 of 382 controls under 44 points, none
  on the title, the event card and seven pages; no sideways scroll) and `webkit-boot.mjs` (the one-file page booted in
  Playwright's WebKit with its CSP, `'strict-dynamic'` and a blob worker; a save landed in IndexedDB, 345 KB). WebKit was
  installed into the session's scratch folder with `playwright install webkit` and `install-deps webkit`.
- **Run, not kept:** `npx cap add ios` with `@capacitor/cli` 8.6.2 in a scratch folder on Linux, which confirmed the SPM
  layout (`ios/App/App.xcodeproj`, `CapApp-SPM/Package.swift`, no Podfile) and the template's defaults (iOS 15, iPhone and
  iPad, landscape, a SceneDelegate).
- **Sources:** capacitorjs.com, ionic.io, developer.apple.com, docs.codemagic.io and Codemagic's CLI docs, WebKit Bugzilla,
  MDN, docs.expo.dev, the npm registry; listed in the roadmap §11. Three Apple pages would not render (privacy manifest,
  encryption export, the HIG on audio): what rests on them is marked unverified.
- **Game:** nothing. No game code, data, test or tool changed.
- **Left open:** every stage after I1-0; the [U] items (audio session and blob worker inside WKWebView under
  `capacitor://`, CSS bounce control, the first automated upload without a Mac) wait for the first TestFlight build.
- **Undo:** revert branch `ios-route`'s commit.

### H-064 · 2026-11-16 · W1-2: minds (R1's core)
- **Asked:** `A.WHY.decide`, one way of deciding for every decider (D-064 point 9); the owner's two lab kings as tests;
  the first structural decisions routed through it; a lint against bare dice with a baseline; reasons shown where the
  player sees the outcome, by rank; under 1 ms a month; determinism kept.
- **Engine:** `src/people/engine/why.js` (`A.V2.why`): `decide`, `weigh`, `odds`, `feel`, `cool`, `tell`, `hotness`,
  the kinds and the feelings. Pure; `tests/v2/why.test.js` (8 tests).
- **Game:** new `src/people/9999950-why` (`A.WHY`: minds from 20's persona plus ambition, feelings on people, the bounded
  log `A.S.why`, `wrong` for the release's incidents and a lost war, `warReasons`, `warDecision`, `warOdds`,
  `factionChoice`, `factionFormed`, `appointGeneral`, `tell`/`tellFor`). Routed: v2 diplomacy's `DV.tryWar` (the live war
  path; its nerve gate and bare roll become the decision, v2's own stream draws), the release's `A.aiWarCheck` (a yearly
  council per crown and a council called by a hot wrong), `A.factionsYear`'s join, stay and leave, 999990-posts'
  `P.fillGenerals`. Shown: the war's news ("Because: ... Despite: ...", the council's count only to its ruler and
  councillors), 20's rulers' log takes a war's record reasons, 9996's Factions card shows a faction's founding reasons.
- **Found:** with v2 diplomacy on (the default) the release's `A.aiWarCheck` never runs in play (muted in the turn); every
  AI war comes from `DV.tryWar`. Both paths are routed (D-069 point 5).
- **Lint:** `tools/lint-reasons.mjs`, `tests/reasons-baseline.json`: 72 bare-dice decisions before, 66 after; run by
  `tools/check.mjs`. `docs/design/r1-audit.md` lists the 66 with file, line and the reasons each should use.
- **Calibration** (scratch `worldstats`, a noble life from 20, 40 years, AI wars started by a crown's decision; before ->
  after): seed 1 12 -> 15, seed 2 21 -> 12 (one calibration earlier), seed 3 17 -> 24, so 50 -> 51; all wars 71 -> 70;
  civil wars 14 -> 10; faction memberships begun 5,183 -> 5,044. Wars declared at under even strength (friends counted)
  rose, 11 -> 31: above the ruler's nerve as before, and now also from feelings (a council a hot wrong calls) and
  grudges; left for W1-5 and the balance stage (D12b-7) to judge, noted in D-069.
- **Cost** (20 years, seed 7, in-page wall time): `A.WHY.decide` 0.36 ms a month on average (16.6 decisions a month,
  most at the New Year's faction choices), feelings 0.2, the General's choice 0.04; all of W1-2's work with `DV.tryWar`'s
  own previews about 0.9 ms a month against 146 ms of simulation. A choice costs 2 to 3 µs, a faction choice about
  10 µs with its record. The record: about 450 bytes, at most 150 kept (about 70 KB of a save). `next-month-speed` on
  `y50-noble` (24 presses, a loaded machine, worlds diverge): median 213 ms before, 255 after, quiet months 129 / 197,
  noise-dominated (cards a month 0.71 / 0.92).
- **Tests:** `node --test tests/v2/*.test.js` 97/97 (why 8/8); new browser tests `whyLabKings` (in a real realm: the proud king
  10/10, the cold king 0/10, and 9/10 within four councils once the count turns), `whyRecordsKept`, `whyToldByRank`,
  `whyFactionsAndGenerals`; with them 50 of the touched features' and the determinism tests on the merged build (renderRng,
  replayWithRender, journalReplay, savesStillLoad, aiPersonality*, cs*, v2Dip*, bondsLedgerWeighs, bondsOldSave, posts*,
  ri*, po*, w1*): 50 pass. `bondsFeudInherited` and `nbCourtWeighs` read the war's pull through `A.WHY.warOdds` now
  (the roll they stubbed is gone) and pass; `v2DipWarPace` reads "reasons" where it read "chance". lint-stages,
  lint-kin, lint-events (why), `build-v2 --check`, `--check-tiers` ok; lint-reasons 66 = baseline.
  `coherency --quick` (8 lives, 12 years): no contradiction; `long-life-audit --seed=7 --years=30`: 0 errors, audit empty,
  0 months with a broken post rule.
  Long tier, touched: `aiPersonalityLongSim` (warlike to peaceful wars per trait-year 5.39), `csWorlds` (102 AI wars in 150
  world-years, every one with a casus belli; in character 81.5%; 0.0197 wars a realm-year on, 0.0210 off),
  `bondsFeudWorlds`, `w1NoMarshalWorld`, `csRevengeIsPatient`: all pass (csWorlds took 1,837 s with the machine at a load
  of 13; 451 s on CI). Not run here: the full suite and the balance league (CI's long tier).
- **Commits:** `113515b` (the engine and its tests), `fb259de` (A.WHY in the game, the routing), `577e6d6` (the lint),
  `8c05e03` (merge of `v2-integration` be59d5c), `87c8f15` (odds, costs, caps), then the records and `index.html`.
- **Undo:** revert the branch `w1-2`'s commits (base `2d7de66`, merged with `be59d5c`); the old war roll is
  `git show 2d7de66:src/core/release/core/17-careers-and-event-engine-a.js` and the old `DV.tryWar` the same commit's
  `src/diplomacy/99996-v2-diplomacy/diplomacy.core.js`.
