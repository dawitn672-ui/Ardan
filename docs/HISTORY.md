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
