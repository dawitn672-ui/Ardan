# v2 integration lanes

This is the shared brief for the agents that carry out `docs/v2/V2_SPEC.md`'s integration plan. The owner's rules (Nov 1) apply to every lane:

- **No hidden descriptions.** Don't bring back any popup that hides a description behind a click.
- **No percentages for the player.** Replace every percentage the player sees with words plus a tipped-scale icon (`A.V2.odds.oddsWords`). Tests and AI may keep numbers.
- **Determinism.** Every system stays deterministic from the seed.
  - Engine code draws from `A.rand` and its siblings, or from v2's own seeded `makeRng` with a seed derived from the game's seed.
  - Rendering stays pure.
- **Report conflicts first.** If the plan conflicts with how the code works, put the conflict and the fix you propose in your report. Make the smallest safe choice, or stop if the choice can't be undone.

The owner's decisions (Nov 1):

| Question | Decision |
|---|---|
| The Far Lands | Drop them from the build with `.wip` markers, keeping the code in git. Carry their realm identities, peoples, beasts and fighting styles onto the generated continent. |
| Percentages | Replace them all with words. |
| Time | Next month only, plus Next day and Next week during a campaign. The Week / Month / Season stepper goes. |
| Stats | An adapter, not a rewrite. Old checks route through `attempt()`. Old 0–100 stats are derived from the body by percentile, for events that still read them. The UI shows real units and words only. |

## How a lane works

- **Read first:** `CLAUDE.md` (the build model, patches on minified code, rules), `docs/v2/V2_SPEC.md`, `.claude/skills/*/SKILL.md`, and `features/99990-v2/README.md`.
  - The v2 engine is on the page as `A.V2`, from `src/v2`. Change `src/v2` only through `node tools/build-v2.mjs`. Keep `tests/v2` passing; add tests there for engine changes.
- **Own your folder.** You run in your own git worktree. Your work goes in your own new feature folder `features/9999N-v2-<name>/`, which loads after everything else. You may also mark other features `.wip` or make small edits to the features named in your task.
- **Build and test privately.**
  - Build to `/tmp/ardan/<lane>/` with `--out` and `--unpack`.
  - Run your feature's tests plus `boot`, `lives`, `saveRoundTrip`, `uiSmoke`, `renderRng` and `replayWithRender`, with one worker. The machine has 4 cores and is shared with other lanes.
  - Run `tools/lint-events.mjs` and `tools/lint-choices.mjs` for any events you add.
- **Tests that read the old design.** When an existing test checks behaviour the owner asked to remove (the Far Lands, the stepper, percentages), you may change or drop that test. Each change says why, in a comment, and is listed in your report.
- **Commit and push often** to your branch `v2-lane-<name>`, at least every hour. Containers restart and usage limits stop agents; work that isn't pushed is lost. Pushing your branch does not run CI. Don't touch other branches, and never push to `v2-integration`.
- **Playtest loop** (`.claude/skills/game-ux-playtest-loop`):
  - Run a scripted Playwright pass of your change in the real UI at 420 px and 1366 px. Save screenshots to `/tmp/ardan/<lane>/shots/` and look at them.
  - Check the change against the complaint list in `V2_SPEC.md`.
  - Fix what you find, and add a regression test for each structural bug.
- **Report:**
  - what changed;
  - the tests run and their results;
  - the conflicts you met and your choices;
  - what's left;
  - your branch's last commit.
