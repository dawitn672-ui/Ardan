# Lessons: mistakes, their causes, and the rule that stops each one

The owner's order 101 (standing): criticise our own work constantly and as harshly as possible; let improvements
compound; **never make the same mistake twice**. Every mistake goes here with its root cause and the rule now in force,
newest at the bottom, numbered L-NNN. Read this file at the start of every session and before writing any brief. It is
mirrored to the Notion "Lessons" database (🪞 Lessons and self-critique, under the Ardan page); the repo is the source of
truth.

**How to add one.** The moment a mistake is seen (by a test, a review, the owner, or ourselves): one entry, written
harshly and plainly; the root cause, not the symptom; a rule a future session can follow mechanically; where the rule
now lives (a skill, a lint, a test, CLAUDE.md). A lesson that only lives here is weak; move it into a gate where possible.

**The self-critique pass** (every wave, every brief, every report to the owner): what did we get wrong, what did we
assume without checking, what will the owner find that we didn't, what would a hostile reviewer say? Write the answer
here before reporting success.

---

### L-001 · 2026-11-27 · Ran ten agents at once; the 5-hour usage limit stopped them all mid-step
- **What went wrong:** nine builders and skill writers ran together after order 100. Within about an hour the account's
  usage limit stopped every one of them at the same moment, mid-step, with half-written records in their worktrees.
- **Root cause:** speed was treated as "more agents", with no budget for the account's usage and no staging.
- **Rule now:** at most **five** agents at once (four builders and one light one); start the next wave's builders only as
  earlier ones land; long builders checkpoint (commit in their worktree) after each step so a stop loses nothing.
  Lives in: `ardan-integration` §1.

### L-002 · 2026-11-27 · A record-merge script silently dropped one side of a conflict
- **What went wrong:** `merge-records.mjs`, written to keep both sides of HISTORY/DECISIONS conflicts, kept only one
  version when both branches edited the same entry. Caught only by a later review, before any use.
- **Root cause:** tested on the happy path only (different entries on each side).
- **Rule now:** every script that touches records or data is tested on adversarial cases before commit: the same key
  edited on both sides, duplicates, empty sides, trailing newlines. When unsure, leave a conflict for a person; never
  drop data. Lives in: `ardan-integration` scripts.

### L-003 · 2026-11-27 · A delegated skill banned the owner's own words
- **What went wrong:** the `cold-reader-naming` skill's ban list included "archdemon" and every "X-slayer", which would
  have made builders rename the owner's own "Dragon Slayer" and "archdemon".
- **Root cause:** the brief set rules without listing the owner's fixed terms; the writer generalised past them.
- **Rule now:** every brief that sets rules names the owner's chosen terms as fixed; every skill that bans or renames
  carries "the owner's own words win" first. Lives in: `cold-reader-naming` rule 0, `ardan-integration` §1.

### L-004 · 2026-11-27 · Skills taught retired rules for days
- **What went wrong:** `game-ux-playtest-loop` taught two time buttons (retired by D-160) and `life-sim-systems` taught
  S1's skill words, the retired duel breakthrough and "Legend, about five alive", the very confusion order 98 removed.
- **Root cause:** systems were replaced without a step to update the skills that described them.
- **Rule now:** each wave updates every skill it made stale, in the same batch (owner's "update skills as you go").
  Lives in: `ardan-integration` §1, CLAUDE.md.

### L-005 · 2026-11-27 · A world-census test passed for versions by luck
- **What went wrong:** `s1Census` (1 to 12 Grandmasters) passed until the standing military moved the random stream;
  the count had been decaying in every world for many versions, because only post-holders grow their skills.
- **Root cause:** a census test read one world's snapshot, not the trend across worlds; nobody looked at the curve.
- **Rule now:** a census or population test reads the trend across several seeds and decades and fails on a decline,
  not only on a bound. Lives in: `rpg-progression-design` §5, H-082 practice.

### L-006 · 2026-11-27 · A wrong path in a builder's brief
- **What went wrong:** the lore builder's brief named `src/core/release/lore/00-lore.json`; the file is
  `src/core/release/core/00-lore.json`.
- **Root cause:** a path written from memory, not checked.
- **Rule now:** every path in a brief is checked with `ls` before the brief is sent. Lives in: `ardan-integration` §1.

### L-007 · 2026-11-27 · A grep over `.claude/` hung for two minutes
- **What went wrong:** a search over `.claude` walked every agent worktree (dozens of full repo copies).
- **Root cause:** forgot that `.claude/worktrees/` holds whole checkouts.
- **Rule now:** never search `.claude/` whole; search `.claude/skills` or exclude `.claude/worktrees`.

### L-008 · 2026-11-27 · Half-written skills committed to the trunk
- **What went wrong:** skill writers wrote straight into the trunk's working tree; the stop hook asked for a commit, so
  drafts went to `main` where any session would load them.
- **Root cause:** skill writers were not given a worktree and branch like builders.
- **Rule now:** skill writers work in a worktree branch like builders; the integrator merges the finished, reviewed skill.

### L-009 · 2026-11-26 · Planning documents fell eleven days behind
- **What went wrong:** `docs/STATUS.md`, `docs/ROADMAP.md` and `docs/PROGRESS.md` stood at order 76 while orders 77 to 97
  landed (audit C-36, C-37); `docs/MASTER_PROMPT.md` two days behind.
- **Root cause:** records were written for history (HISTORY, DECISIONS) but the forward-looking docs had no owner step.
- **Rule now:** every wave's batch ticks `docs/PROGRESS.md` and brings STATUS level; every owner order runs
  `ardan-prompt-intake` (master prompt, roadmap). Lives in: `ardan-integration` §6.

### L-010 · 2026-11-27 · A generator's check fails and nothing runs it
- **What went wrong:** `node tools/c7/build-names-data.mjs --check` fails: a hand edit to `data/names.json` (commit
  35b2f9e3, "Marshal" to "Marcher") would be undone by the next regeneration. No CI job runs the three data generators'
  `--check`. (Found by the `ardan-world-data` skill's survey.)
- **Root cause:** generated data edited by hand; no gate.
- **Rule now:** generated data changes only through its generator; the generators' `--check` belongs in
  `tools/check.mjs` (to do in wave 1's batch).

### L-011 · Earlier rounds (from the session record) · Small slips that cost time
- Edited the wrong file for a failing test (lfRepeats) because the assert's text matched two files: **read the test's
  path from the runner's output, never from a grep of the message.**
- An accidental `git stash` (restored at once): **never run stash in a shared trunk with agents' work about.**
- Overwrote a scratch profiling script: **new scratch files get new names.**

### L-012 · 2026-11-27 · A bulk upload briefed without pricing it first
- **What went wrong:** a Notion agent was briefed to mirror "every piece" of the records (about 3 MB) through the Notion
  chat tool, where every character passes through the model twice. It stopped at 83 of 521 entries, summaries only, after
  about 225K tokens, and said so (rightly).
- **Root cause:** the brief chose the tool before estimating the cost of the volume through it.
- **Rule now:** before any bulk job, estimate size × route cost and pick the route that does not pass bulk data through a
  model: a script with an API key (asked for through the secure credential form), file uploads, or generated batches.
  Model-routed tools are for structure and small edits.

### L-013 · 2026-11-27 · "Small rows" through the Notion tool still cost 400K tokens
- **What went wrong:** a Haiku agent wrote 438 one-line Chronicle rows through the Notion tool and used about 400,000
  tokens (about 900 a row), because every row is written out by the model and echoed back by the tool.
- **Root cause:** L-012 was applied to page bodies but not to rows; the per-call overhead (schema, echoes, retries) was
  not priced.
- **Rule now:** price row jobs too (rows × about 900 tokens); prefer fewer, richer pages and attached files over hundreds
  of rows; batch the largest calls the tool accepts; and ask whether a row is needed at all before creating it.

### L-014 · 2026-11-27 · Ten unrelated skills listed on every turn of every agent
- **What went wrong:** office-document, browser and computer-use skills (docx, pptx, xlsx, pdf, Google Workspace, Chrome,
  the built-in browser, computer use, memory import, docs) were listed with their long descriptions in every turn of every
  Ardan agent, though Ardan never uses them.
- **Root cause:** the account's synced skills apply to every project; nobody pruned them for this one.
- **Rule now:** the project's `.claude/settings.json` turns them off (`skillOverrides`); review the listing each wave.

### L-015 · 2026-11-27 · The secure key form fails in a very long session
- **What went wrong:** the owner wanted to give a Notion key; the secure credential form failed twice with "this session is
  too long for the request to be saved".
- **Root cause:** the form cannot save from a session past a certain length; asking again in the same session fails the
  same way.
- **Rule now:** when a credential request fails for length, start a short side session whose only job is to show the form
  (it saves to the same environment), instead of asking again here or sending the owner to settings first. It worked.

### L-016 · 2026-11-27 · The record merger brought back a stale skill
- **What went wrong:** `merge-records.mjs`, run with no file list, merged every conflicted `.md` line by line, including a
  skill file; a branch made before this morning's skill rewrite brought the retired text (S1 words, GD.TIERS, "Legend
  about five alive") back into `life-sim-systems`. Caught in review before the commit.
- **Root cause:** the script's default took every markdown file, but "keep both sides" is only right for append-only
  records.
- **Rule now:** the script touches only HISTORY, DECISIONS and CHANGELOG by default; skills, design notes and other docs
  are merged by hand, taking the newer text and adding the branch's new facts.
