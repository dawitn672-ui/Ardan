# v2 status (Nov 5)

**Branch and version:** `v2-integration`, PR #2 (stacked on PR #1); version v2.0.0-alpha.10.
**Where it stands:** the build steps are done (steps 1–9 of `V2_SPEC.md`), and the playtest loop (step 10) is in round 1. Next is CI.

## The plan, step by step

| Step | What | State | Version |
|---|---|---|---|
| 1 | The v2 engine in the build; its tests guard releases | done | alpha.1 |
| 2 | One generated continent; the Far Lands out of play | done | alpha.2 |
| 3 | Next month only; cards one at a time; five places | done | alpha.3 |
| 4 | Body model, `attempt()`, fighting worth, faith, no percentages | done | alpha.4 |
| 5 | Family, relation labels, house law, one holder per title | done | alpha.5 |
| 6 | Courts from `buildHierarchy` | done | alpha.6 |
| 7 | Diplomacy from `monthTick` | done | alpha.7 |
| 8 | No spectating; play your rank; elite orders | done | alpha.8 |
| 9 | Versioned save with one migration | done | alpha.9 |
| 10 | Playtest loop: scripted pass, playtester, fixes, regression tests | round 1 of fixes: 7 of 8 merged (alpha.10); the content round and kingdom names still running | — |

## Health

| Check | Result |
|---|---|
| v2 engine tests (`node --test tests/v2`) | 26 of 26 |
| Each step's browser tests, on the merged build | pass |
| Core suites (boot, saves, replay, render purity, UI smoke, journal) | pass |
| Slow checks | pass: one holder per title (30 seeds), court titles (10 seeds), a century of diplomacy, 6 bot lives |
| Page errors in the playtest | none |
| **Full browser suite (626 tests) on a v2 build** | **not yet run.** CI on PR #2 is the first full run |
| **Balance bands (`bench/balance.mjs`) on a v2 build** | **not yet run.** The step 2 map lane passed them, but no run includes steps 4–8 |

## The complaints, after playtest 1 and its fixes

Verdicts are the playtester's. Notes in brackets cover fixes merged since, not yet re-played.

| # | Complaint | Verdict |
|---|---|---|
| 3 | Remove the Great Continent | met |
| 4 | One connected continent | mostly met (labels and the realm wash are now fixed) |
| 13 | Too few nobles | mostly met (vacant titles are now regranted) |
| 1, 2 | Pop-ups and clutter | partly met (soft-locks, the tap bug and toasts are fixed; the filler is in the content round) |
| 5 | Static or wrong relations | partly met (labels, alliance blocs and what each class sees are fixed) |
| 7 | Forced chapters | partly met (piety is now shown honestly; chapters stay as an optional Life panel) |
| 8 | Remove Play | partly met (the soft-locks are fixed) |
| 9 | Too few elite orders | partly met (the page now shows 14–26 levies a member; there are 8 orders where the spec has 5) |
| 10 | Seeing wars you're not in | not met at the playtest. All five leaks are now fixed; the War Room's exact enemy counts are in the content round |
| 11 | Unclear stats | partly met (0–100 numbers are now words; the needs card remains) |
| 12 | Races and power scaling | partly met (worth is on v2's scale; races not yet play-tested) |
| 14 | Succession and family | partly met (the law panel and the reasons for being passed over are fixed) |
| 15 | Fame and promotion | partly met (renown saturated at 100 by age 38: open) |
| 16 | Too many percentages | partly met (the garbled text and the odds tooltip are fixed) |

## Open risks

1. **Balance.** Steps 4–8 change death rates (bodies, war, hunger), fighting power (orders about 6× stronger) and the world's population (+~550 nobles, +~25 kin a family). CI's balance league may fail and need tuning.
2. **The full suite.** Lanes ran their own tests and the core ones, never all 626 together. Expect some red in older features' tests that read the old design.
3. **Usage limits and restarts.** Four lanes at once spent the weekly limit in two days, and container restarts lost test runs three times. Lanes now push after every fix and test in small batches.
4. **Repo housekeeping that needs the owner.** The session's git proxy refuses tag pushes and branch deletes. Versions are rows in `docs/VERSIONS.md`. 15 merged lane branches (`v2-lane-*` and the merged `v2-fix-*`) can be deleted on GitHub.

## Next

1. Merge the content round and the kingdom names into `v2-integration`.
2. Read PR #2's CI, then fix and push until the full suite and the balance bands are green.
3. Playtest 2, against the complaint list and the 25 findings of playtest 1. Fix and add regression tests. Repeat until it finds nothing structural.
4. Tag v2.0.0-beta.1. Then five real players (`docs/plan/Playtest kit.md`), because bots check numbers but only people judge fun.
5. Merge PR #1, then PR #2, into `main`.
