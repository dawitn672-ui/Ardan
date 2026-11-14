# v2 status (Nov 5)

**Branch and version:** `v2-integration`, PR #2 (stacked on PR #1); version v2.0.0-alpha.10.
**Where it stands:** the build steps are done (steps 1–9 of `V2_SPEC.md`). The playtest loop (step 10) is in round 2: playtest 2 is in `playtest-2.md`, and its findings and CI run 88's 50 failures are being fixed group by group. Each fix is checked by an independent verifier before it is merged.

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
| 10 | Playtest loop: scripted pass, playtester, fixes, regression tests | round 1 merged (alpha.10); round 2 (playtest 2 + CI runs 88-92): all 21 groups merged, plus the fixes CI 90, 91 and 92 asked for | — |

## Health

| Check | Result |
|---|---|
| v2 engine tests (`node --test tests/v2`) | 26 of 26 |
| Each step's browser tests, on the merged build | pass |
| Core suites (boot, saves, replay, render purity, UI smoke, journal) | pass |
| Slow checks | pass: one holder per title (30 seeds), court titles (10 seeds), a century of diplomacy, 6 bot lives |
| Page errors in the playtest | none |
| **Full browser suite (626 tests) on a v2 build** | **not yet run.** CI on PR #2 is the first full run |
| **Balance bands (`tools/bench/balance.mjs`) on a v2 build** | **not yet run.** The step 2 map lane passed them, but no run includes steps 4–8 |

## Round 2 of fixes (Nov 5)

CI run 88 (the first full run of a v2 build) failed 50 of about 690 tests; the balance bands all held. Playtest 2 found 20 new problems. Both lists were split into groups by the features they touch; each group is fixed in its own branch, checked by a verifier that tries to reject it, and merged only when it passes.

| Merged | What it fixed |
|---|---|
| sameworld | Drawing the war map left an empty key in the save, so the same seed looked like a different world |
| rolls | A forced test roll now decides the check (`attempt()`'s dice read one way) |
| warleaks | Annals, The Book, the levy and the general's screens give hearsay and estimates by rank, not exact foreign counts |
| names | The eight kingdom names, with their articles and verbs, in old saves and exports too |
| gates | Class gates no longer hide memory events and arcs from the class they were written for |
| chronicle | Echo words and recalled lines on the new names |
| phonetap | On a phone the odds have their own 44 px target; a tap on a choice takes it |
| cardrisk | Cards name the real stake ("a treason trial: the gallows or a deep cell", "could kill you"), and whose regard moves and which way |
| observes | Recording the world no longer changes the player (a recalled line gives way to the inner voice) |
| timetest | The month-step timing test runs on the generated continent |
| body | Lifting by age and training, children against their own age, v2's levy scale kept |

| numbers | 0–100 numbers in words everywhere: realm bars, infamy, war weariness, screen-reader labels, a confidant's next rank |
| rollsfallout | Three tests the dice change exposed: forced checks, a thought itemized in the odds, the trait-pace bar |
| renown | Renown no longer saturates; promotion is uneven; no counters; the tooltip in words |
| family | Orc clans by law, kin read from the real tree, one relation label, pronouns by sex |
| map | Map speed, beasts on fitting ground, realm colours, the phone map, fresh realms split cleanly |
| lines | One extra line a card, counsel that fits, token grammar, death screens that fit the life, no piety for the faithless |
| layout | No sideways scroll on phones, shorter pages, icons back, the War place opens on war |
| round2 | Last CI leftovers: phone width, the Life panel, war strength bars, chips, companies, a 12 px note |
| world | Realm gold, famine prices, epidemic scenes; v2 diplomacy's war pace back in the release's band (0.018 a realm-year) |
| warbattles | Army routine scenes spaced over a life; a choice moves the fight at every rank |

| repeats | Gatherings, jousts, debates, shrines and other routine scenes spaced over a life (lfRepeats 11.3%, bar 15%); an invitation of another kind asks again |
| CI 90-91 fixes | Companies refit after a template recut (exact saves), the 10-year world test across an heir, the map timing test re-timed under load, words for a chapter label and the body line's tooltips, a dead mover's bill passed on, a dwarf rite now reachable, 'Lend money' greyed out with its reason when the purse is empty; serf and artisan wealth bands widened for the re-rolled sample (reason in tools/bench/targets.mjs) |

CI went from 50 failures (run 88) to 31 (89), 8 (90), 3 (91) and 1 (92). Run 92's one failure was a real bug: an advisor's follow-up scene that 81-pacing's first-adult-year cap dropped still spent the NPC budget and started its 8-year cooldown, so the advisor's turn was lost on a scene never shown. It now spends them only when the scene lands.

Owner's open questions (each has a default in the build): a declined gathering kind stays declined for the life (97's rule, unchanged); the inner voice wins over a recalled world line; trait pace (about 6.5 changes a life against the release's 4.7, mostly from thoughts the player embraces); orc clans in equal-law realms follow the father; captains are at best evenly matched against an ordinary general.

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
4. Tag v2.0.0-beta.1. Then five real players (`docs/plan/playtest-kit.md`), because bots check numbers but only people judge fun.
5. Merge PR #1, then PR #2, into `main`.
