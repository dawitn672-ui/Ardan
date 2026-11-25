# Status: what is in progress right now

> **Updated 2026-11-25 for order 76** (the owner's answers): phases renumbered (Phase 3 is now magic, races and monsters; the old 3 to 11 are 4 to 12); the order of work is by effect on today's game (master prompt 13.1); Phase 1 now starts with the Emilio findings (`docs/design/emilio-1108-findings.md`). Settled: C1 skills (section 9 replaces S1, D-159), C2 time (Next year below 12, Next month from 12, D-160), C5 export and seed (behind a developer flag, low priority), the magic question (yes, section 17, D-161), the store (game packs), portraits (code-drawn), auto-resume (on), the two unfinished features (dropped). Put to the owner later: the map (C6, C8).

The live view of the work (master prompt 0.2, 4.2). **Keep it current every session.** The plan is `docs/ROADMAP.md`;
the rules are `docs/MASTER_PROMPT.md`. *Last updated 2026-11-25 by the sync (H-108), on `v2-integration` at `0982302`.*

"Main" here means `v2-integration`: GitHub's `main` is still the upload of 2026-11-01 (`1589d44`), 1,328 commits behind,
waiting on PR #1 (see row 4).

## Now

- **Phase 0.** Done so far: the safe point (H-104), the skills and tools review (H-107, `docs/TOOLING.md`, its Keep /
  Merge / Remove table waiting for the owner's yes), this sync (H-108).
- **Main is not green.** The last real check of `v2-integration` (run 44618429139, on `650949f5`, the repo tidy's merge)
  failed one quick test: `w4OldSaves` reads the alpha.15 sample save and counts 8 realms with a roll above the conversion's
  cap. The rule is right and the test too strict: a save made since the conversion keeps its roll as play left it. The fix
  is a test-only hunk already written on `work/m1` (`259c74ca`, `src/war/9999952-men/test.mjs`). Every commit since has
  been `[skip ci]` (docs only). Master prompt 13.1 rule 2: fix first.
- **No agent is working on game code.** The two scheduled check-ins stay disabled (order 74; not re-enabled by the sync).
- **Modules in use:** none. The next code step claims its modules here before it starts.

## Work in progress, one row each

Verdicts (0.2 step 5): **Finish**, **Redirect**, **Park**, **Drop**. **[Q]** marks a verdict that waits on an owner
question (the list is in `docs/ROADMAP.md` section 4). Sections are the master prompt's.

| # | Work | Branch | How far | Modules touched | § | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Main's red test** (`w4OldSaves` on the alpha.15 sample) | none yet (fix on `work/m1` `259c74ca`) | Diagnosed; the fix is a 3-line test change | `src/war/9999952-men/test.mjs` | 4, 13.1 r2 | **Finish** now: bring the test hunk to a `work/fix-w4oldsaves` branch, one `[full ci]` run, then cut nothing (tests only) |
| 2 | **M1, the one designed continent** (orders 68, 69, 71 to 73; D-142, D-151 to D-156) | `work/m1` `993e3116`: 30 commits ahead, 7 behind (docs and skills only) | Built (map version 4, lore pass at 0 of 2,625 claims). Tests at the stop: quick shards 0 and 1 green (112, 113); shards 2 to 7, coherency and seven long tests not run. Waiting on the owner's critique and the nine questions of `docs/design/m1/map-design.md` §9 | map (`99991-v2-map`, `999911-d9-ground`, `engine`, `data/map`, `tools/m1`), release lore and content (13 files: `lore/*.json`, `content/12-ww.js`, `18-cm.js`, `core/03`, `04`, `07`, `23-ui-a`, `23-ui-c`), tests or rules in war (`9999952-men`, `9999953-surrender`, `9999955-muster`, `9999958-paths`, `9997-companies`), family (`99994-v2-family`), people (`999994-generations`, `99993-v2-stats`), nobility (`56-court-and-treasury`, `9999954-realm-peace`), events (`28-endings`, `51-arcs-rivals`, `40-memory-regional-b`), ui (`59-descriptions`, `94-woodblock-skies`, `999996-profile-tab`), saves (`99998-v2-saves`), `tools/lint-lore-map.mjs`, the map skill | 7 | **Finish** **[Q1, Q2]**: rerun the rest of its tests now (no owner time needed); merge alone with `[full ci]` after the owner's critique. Section 7's "procedural plates" text predates the owner's own map orders (72, 73): asked, not assumed |
| 3 | `work/m1-design` (the map's design files) | `bd80b856`, on GitHub | Squashed whole into `work/m1` (`41b7c4e4`) | `docs/design/m1`, `tools/m1` | 7 | **Finish** with M1 (nothing left to do); deletable once M1 merges |
| 4 | **PR #1** (`claude/dreamy-sagan-anwszt` into `main`) | open since 2026-11-16 | Holds v2 up to alpha.9 (PR #2's merge `bf316fe`); `v2-integration` is 328 commits ahead of it | the whole repo | 0.2, 4, 13.3 Phase 0 ("protect `main`") | **Redirect** **[Q3]**: either the owner sets the default branch to `v2-integration`, or a new PR brings `v2-integration` into `main` once it is green. The master prompt's "`main` always builds" then means that branch |
| 5 | The skills and tools review (H-107) | `work/tooling`, merged at `0982302` | Done; the table waits for the owner's yes; the removals are not switched off | `docs/TOOLING.md`, `.claude/skills/` | 16 | **Finish**: on the owner's yes, switch off what he confirms (claude.ai settings, his hands) |
| 6 | 17 merged working branches (`d11-1` … `x5-deaths`, listed in `docs/BRANCHES.md`), plus `work/repo-tidy` and `work/tooling` | on GitHub | Every tip is inside `v2-integration` (`git branch -r --no-merged` lists none of them) | none | 0.2 | No work. **Keep** until the owner deletes them (the sync deletes nothing; order 64 lets him) |
| 7 | `82-early-years` | archived | **Dropped** 2026-11-25 (order 76): `archive/82-early-years/` |
| 8 | `9995-trade-roads` | archived | **Dropped** 2026-11-25 (order 76): `archive/9995-trade-roads/` |
| 9 | 63 local agent worktrees in `.claude/worktrees/` and 3 in `/tmp/ardan/` | local only | No uncommitted file found (files newer than each worktree's index: 0 in all 67, main checkout included); no stash (`refs/stash` has no log). Three local branches hold one commit each not in `v2-integration` (`worktree-agent-a921c71…`, `…aa270e1…`: the G design; `…aefd500…`: the E1/E2 design); `git cherry` shows all three already applied there | none | 0.2 | No work. Leave them; `git worktree prune` is the integrator's, later |
| 10 | The two skill-card errors (`sk_better_hand`, `sk_rival_contest`) | fixed | **Done** 2026-11-25 (H-120): a dropped card is closed unanswered; test `pfSkippedCardNotRun` |
| 11 | Seed leaks and `.ardan` export / import (§2, 12.2) | none | Not started; every leak still there (ROADMAP section 2) | `core/23-ui-a.js`, `core/23-ui-b.js`, `ui/9994-share-a-picture`, `events/995-hall-of-lives`, `04-…-a.js`, `19-journal-and-replay.js` | 2, 12.2 | **Finish** in Phase 0 **[Q4]**: the export behind a developer flag (tests load `.ardan` files); seeds from `crypto.getRandomValues`; the seed-leak test. The share card and hall keep their picture, lose the seed |

## The old queue (`docs/PROGRESS.md`, "Open, in build order")

None of these has a branch or a line of code yet; each gets its verdict and its place in the new phases. Detail and
reasons in `docs/ROADMAP.md` section 3.

| Item | What it was | Verdict | Where it goes |
|---|---|---|---|
| M2 | The map in extreme depth (order 69) | **Park** until M1 merges | Phase 6 (map detail), terrain as data the war core reads (§7) |
| T14 | Playtest alpha.14 against the owner's alpha.9 survey | **Redirect** | Phase 1: part of the baseline report |
| Y1 | A year worth living; press speed | **Redirect** | Press speed: Phase 1 lag (4.4); what fills a year: Phase 6 |
| PA | Parity: everyone grows by the player's rules | **Redirect** | Phase 4 (A3: rivals and the world grow and push back) |
| LC | Legends and crowns as hard as the world makes them (D-138) | **Redirect** | Phase 1 stopgaps (A0) now, Phase 4 (A2) for good |
| R3 | Relationships that change a life | **Park** | Phase 6 (6.1) |
| E0 | One economy (D-139) | **Park** | Phase 6; it feeds A2.3's treasury and the store's later prices |
| K1 | Cards that know your rank | **Park**; a wrong card that breaks play is a quick fix now | Phase 6 (event migration, 1.3 row 29) |
| U1 | Honest odds with named upsets (order 66) | **Redirect** | Phase 2 (skills feed `attempt()`), duels in Phase 4 |
| D12b | War and command depth | **Redirect** (war is frozen, §10) | Phase 1–2 side track (war architecture doc, war harness), Phase 4 new core, Phase 5 depth |
| X4 | Balance pass | **Redirect** | Phase 1: the balance harness (A1, Appendix A) |
| X7 part 2 | Phone speed per press | **Redirect** | Phase 1 (lag, phone smoke test), Phase 7 |
| I1-1 | iPhone budgets for load and Next month | **Redirect** | Phase 1 smoke test, Phase 7 |
| I1-2 (left) | `pointercancel` on map drags, `SAVES.backend`, the 57 `:hover` rules | **Park** | Phase 7 (the `:hover` rules can ride a Phase 1 interface step) |
| I1-3 to I1-7 | `www/`, Capacitor shell, Codemagic, listing, review | **Park** (order 70: on the owner's word) | Phases 10 and 10 |
| C8d, L2 | Manhwa cards; legendaries redrawn (wait for the image key, order 60) | **Park** **[Q5]** | 6.8 parallel track: appearance data first, art by the route the owner picks |
| D9-2 | Roads read as roads (69 to 75 of 100, target 90) | **Park** | After M1; the art pass waits for the art route |
| Gaps | Known leftovers | **Park**; ride along with the step that touches them | Any phase |
| R1 | 41 bare-dice decisions left (`tools/lint-reasons.mjs`) | **Finish as you go** | Every step that touches an AI decision |
| G, E1, E2, L1, N1, V3-X | The v3 designs | **Redirect** (G into §9's library) / **Park** (the rest) | G: Phases 2 and 5; E1/E2: Phase 6; L1/N1: Phase 4 (A2.3 routes by start) and 5 |

## Who touches what (parallel work)

One agent per branch; no two on one module at once (0.2). Today: nobody. `work/m1` holds the map, the lore and the tests
listed in row 2; a step that would touch those waits for M1 or works on `work/m1` itself.
