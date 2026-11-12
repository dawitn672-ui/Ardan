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
