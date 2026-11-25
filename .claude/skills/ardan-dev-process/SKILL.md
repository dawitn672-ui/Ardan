---
name: "ardan-dev-process"
description: "How to make and land one code step in the Ardan game repo: pick the next work by the priority rules, size the step, branch, test first, find the root cause before fixing, build privately, run the checks the step size demands (tests by tier, coherency, lints, playtest, balance), prove it with evidence, get it reviewed, and write the records (HISTORY append-only, DECISIONS, STATUS, CHANGELOG, archive). Use for every change to Ardan's code, data, tests or tools, including bug fixes and refactors. Not for merging a new owner prompt (ardan-prompt-intake), not for judging a screen's design (ardan-ui-review), and not for docs-only edits."
---

# Ardan development process

**One job:** take one step of Ardan from chosen to pushed, the same way every time, with checks scaled to its size.
The rules are the owner's: `docs/MASTER_PROMPT.md` §2 (standing rules), §4.5 (step sizes), §4.6 (patch stack), §13.1
(priority rules), and `CLAUDE.md` (commands, determinism, security, events). Read those; this is the working order.

## 1. Choose the step
- Apply §13.1 in order: skills and tools first; a broken build or save; finish or park work in progress; safety nets;
  bugs that break play or corrupt state; stopgaps; foundations before what sits on them; never polish what will be
  rebuilt (war gets bug fixes only until its new core switches on, §10); one main workstream plus at most one side track.
- Check `docs/STATUS.md` (once written) or `docs/PROGRESS.md` and `docs/BRANCHES.md`: is someone already on it? Which
  modules does it touch? Two sessions never touch one module at once.
- If the step conflicts with how the code works, say the conflict and the fix you propose before doing it (§0.1), and
  record the fix in `docs/DECISIONS.md`.

## 2. Size it (§4.5) and decide the checks now
| Size | Looks like | Checks before it is done |
|---|---|---|
| Small | one module, no save change, a bug fix | tests, coherency, a scripted pass; one HISTORY line |
| Medium | several modules or a visible change | the above + a playtester agent (`game-ux-playtest-loop`) + `ardan-ui-review` on a screen change + a balance run if numbers moved |
| Large | a new system, a save-format change, a rebuild | the above + a design note in `docs/design/` + a review by a separate agent + a save-migration test + a batched request for the owner to play |

## 3. Plan (medium and large steps)
- A short design check first: two or three approaches, the one you take and why. Ask the owner only when a wrong guess
  is costly; otherwise state the reading and go.
- A numbered plan: each task small enough to have its own test and commit, with the files it touches. Put large plans
  in `docs/design/`, never in a tool's own folder.
- Independent tasks can go to parallel subagents, one folder each (CLAUDE.md, parallel safety), each in its own local worktree.

## 4. Work
- One step per commit on the trunk `main` (or a local worktree for a helper; push no working branch: order 76, D-162).
- **Test first** where the rule can be tested: write the failing test (a feature's `test.mjs`, or `tests/v2/*.test.js`
  for the engine) with calibration targets, see it fail, then make it pass. Tests must be world-robust (CLAUDE.md:
  seed fallback, pooled numbers with bars from measured spread, poll never sleep).
- **Root cause before any fix.** Reproduce it (a seed, a save in `tests/saves/`, a bot life), read the whole error, find
  where the bad value is born, then fix there. A symptom patch is not a fix. Add a regression test for each structural bug.
- Change the module that owns the code (`src/core/release/` in place, `tools/show.mjs --where A.name` finds it).
  **No new `A.addStage` wrapper** (§2, newer than CLAUDE.md's stage recipe); if one is truly unavoidable, write why in
  `docs/DECISIONS.md`. `tools/lint-stages.mjs` and `tests/stages-baseline.json` may only fall.
- Every structural choice by a person goes through `A.WHY.decide`; `tools/lint-reasons.mjs` and
  `tests/reasons-baseline.json` may only fall. Engine code draws only from `A.rand` and friends; rendering is pure.
- Event functions are read as text: keep `src/core/release/content/` lines exact, or run
  `tools/release/identity-probe.mjs` before and after.
- A stopgap is marked `STOPGAP: replaced by <item>` in the code and recorded in DECISIONS.

## 5. Check (evidence, not belief)
Build privately, never to `index.html`: `node tools/build.mjs --out=/tmp/ardan/<name>/x.html` (add `--only=<wip>` for a
`.wip` feature). Then, as the size demands:
- `node tests/run.mjs /tmp/ardan/<name>/x.html --features=<feature>` (core suites + yours); the quick tier by shard
  with `--tier=quick --shard=k/8`; the long tier (`--tier=long`) for anything touching lives, war, saves or pacing.
  A new test over 200 s goes into `tests/long-tests.json` (`--check-tiers`).
- `node tools/coherency.mjs --baseline=quick` (counts in `tests/coherency-baseline.json` may only shrink).
- `node tools/check.mjs` (everything CI runs: lints, engine unit tests, docs index, version records).
- Events: `tools/lint-events.mjs` and `tools/lint-choices.mjs --feature=<name>`; kin: `tools/lint-kin.mjs`.
- Numbers: `node tools/bench/balance.mjs <html>` against `tools/bench/targets.mjs`; speed: `tools/bench/press-gate.mjs`.
- A refactor meant to change nothing: build before and after and run `tools/release/verify.mjs a.html b.html`.
- Any uncaught error or `console.error` fails a run (the net); fix it, do not list it away.
Before saying "done", "fixed" or "passing": name the command that proves it, run it fresh, read the result, then say it
with the evidence (counts, the failing-then-passing test). An agent's "success" is a claim; check its diff.

## 6. Review and land
- Medium and large steps: a separate agent reviews the diff against the spec and these rules; answer each finding with
  a fix or a reason, never by silence.
- Records, in the same branch: a `docs/HISTORY.md` entry (append only: date, commit, what and why, the owner's complaint
  it answers, files, test and coherency results, what was archived, how to undo); `docs/DECISIONS.md` for real choices;
  `docs/STATUS.md`; `CHANGELOG.md` for what a player notices; `CLAUDE.md` when a command or rule changes.
- Retired code goes to `archive/<name>/` with a note on what it was and why it went, and HISTORY names the last commit
  that had it. Nothing is deleted.
- Versions are cut only from a commit green on both tiers, with `node tools/version.mjs new ... --at=<sha>` (D-134);
  batches merge with one `[full ci]` push.
- End the step with **YOUR NEXT ACTIONS** for the owner (§0.1).
