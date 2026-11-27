---
name: ardan-integration
description: "The integrator's loop for the Ardan game repo when several builder agents work at once: split a big order into builder briefs (reserved H-/D- numbers, owned files, a test list), merge their branches into the trunk, resolve record conflicts by keeping both sides, verify, push a [full ci] batch, read CI failures from the job logs, tell a real failure from a slow runner or one world's luck, send fixers, and cut the version. Use whenever you are coordinating builder or fixer agents on Ardan, merging their work, reading a red CI run, or cutting a version, even if the user only says 'continue', 'merge it', 'why is CI red' or 'cut the release'. Not for writing one step yourself (ardan-dev-process) or merging an owner's prompt (ardan-prompt-intake)."
---

# Ardan integration

The trunk is `main`, kept level with `v2-integration`: always push `HEAD:main HEAD:v2-integration`. Builders never push
(D-162); the integrator merges, tests, pushes and cuts versions. The owner sees results, not branches, so the loop's job
is to turn several agents' work into one green, versioned trunk with records nobody has to untangle later.

## 1. Brief builders

A builder knows only its brief. Each brief carries:

- **Base:** the trunk sha it starts from, `isolation: "worktree"`, a local branch name, "do not push".
- **Reserved numbers:** an explicit H- and D- range (look at the end of `docs/HISTORY.md` and `docs/DECISIONS.md`,
  plus every range already handed out to agents still running). Parallel branches clashed on D-142 and H-083 before
  ranges were reserved; never let two agents share one.
- **The order's words** (quote the owner; point at `docs/OWNER_ORDERS.md` order N and `docs/prompts/`), the audit item
  numbers, and the decisions already made that it must follow (e.g. a fixed name mapping other builders also use).
- **File ownership:** which files are its own and which belong to builders running at the same time. When two must touch
  one data file, split by field (one edits names and text, the other rarity fields) so the merge is line-clean.
- **Proof:** the private build path (`/tmp/ardan/<name>/x.html`), the tests by name, the lints, the bench if balance can
  move, world-robust tests (H-082), and "do not lower a bar; if a bar reads one world's luck, make it robust and write the
  readings in a comment".
- **Report shape:** root cause with numbers, decisions, tests with results, commit shas, what is left.

Model and effort follow D-009/D-010: the strongest model at max effort for the big designs (a map, a system's shape),
Opus high for systems, Sonnet for interface and data work. Seven builders at once is workable; more makes merges and the
shared CPU (timing tests) the bottleneck. Don't start a timing-sensitive job (speed work) while many builds run.

## 2. Merge

1. `git merge --no-edit <branch>` from the builder's worktree branch (it shares the repo's refs).
2. Record files conflict almost every time. Run `node .claude/skills/ardan-integration/scripts/merge-records.mjs`: it
   keeps both sides of `docs/HISTORY.md` and `docs/DECISIONS.md` ordered by number, and both sides of `CHANGELOG.md` and
   other docs line by line. Read the result once. Code conflicts are resolved by hand, by reading both intents.
3. Re-run the tests the builder named plus `uiSmoke`, `renderRng`, `replayWithRender`, `v2svRoundTrip` on a fresh private
   build of the merged trunk, and `node --test tests/v2/*.test.js`, `tools/lint-stages.mjs`, `tools/lint-reasons.mjs`,
   `node tools/version.mjs check`, `node tools/lint-docs-index.mjs`. Two merged branches can break each other while each
   passed alone.
4. A wave of several branches goes out as one batch: one commit whose message ends `[full ci]`, so both tiers run.

## 3. Read CI

- `mcp__github__actions_list` (`list_workflow_runs`, `check.yml` or `long.yml`, branch `main`) gives the run; its jobs
  (`list_workflow_jobs`) show which shard failed.
- `mcp__github__get_job_logs` with `return_content: false` gives a `logs_url`; then
  `bash .claude/skills/ardan-integration/scripts/ci-failures.sh '<logs_url>'` prints the FAIL lines and out-of-band
  balance numbers. (Asking for the content directly floods the context.)
- A new push cancels a run still going on the same branch; `[skip ci]` makes none. Records-only commits go `[skip ci]`.

## 4. Judge a failure

Before calling anything noise, put numbers on it:

- **A timing test** (scaleTiming, d9OneMap, press-gate, s1Cost) red on one shard: run it locally on the same commit's
  build. If it passes with a wide margin, and the failing shard was slower overall (its duration against the other
  shards, every number in its detail scaled alike), it is the runner. The next batch's run re-checks it; never re-run a
  run just to get green, and never widen the bar for it. If it is tight locally too, it is real: profile it.
- **A test that read one world's luck** (a seed that no longer has a war, a shrine, a blind player): any change moves
  every world's random stream. Make it robust with `T.trySeeds` and pooled numbers, never by lowering the bar.
- **A real bug** shows up as a broken rule (two holders of one post, an error in the console, a number outside a design
  band on several worlds). Find the cause, fix it, add a test that fails before and passes after.
- **A design question** (the world runs out of Grandmasters because only post-holders grow) belongs to whoever holds the
  decision. Under order 100 that is us: decide with a reason, record a D-, and tell the owner in the next update.
- Send a fixer agent with the failing list, the run id, the reserved numbers and these rules; review its report before
  merging (it may leave one item open on purpose).

## 5. Cut the version (D-134)

Only on a commit both tiers tested green:

```sh
node tools/version.mjs new vX.Y.Z-alpha.N "what changed" --at=<sha> --ci=<check run>,<long run> --sample=noble-life
git push origin <sha>:refs/heads/release/vX.Y.Z-alpha.N
git add -A && git commit -m "vX.Y.Z-alpha.N: records (row, changelog, sample save) [skip ci]" && git push origin HEAD:main HEAD:v2-integration
```

If `version.mjs new` ran in another worktree, check that `CHANGELOG.md` got its heading. Then `git gc --prune=now`.

## 6. Tell the owner

After each landed wave: what changed in player words, what to try when playing, what is next, a padded ETA in New York
time, and anything decided on his behalf. Keep the tracker in `docs/PROGRESS.md` ticked with the commit.
