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
