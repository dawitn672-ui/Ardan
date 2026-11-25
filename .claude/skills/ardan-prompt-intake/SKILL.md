---
name: "ardan-prompt-intake"
description: "Merge a new prompt from Ardan's owner into docs/MASTER_PROMPT.md: save it unchanged, split it into requests, classify each (already here, refines, new, conflicts, later), place it by topic, update the roadmap, metrics, register and records, and report on one screen with YOUR NEXT ACTIONS. Use whenever the owner gives Ardan a new prompt, order, plan, spec, complaint list or list of skills or plugins to fold in. Not for doing the work a prompt asks for (that is ardan-dev-process), not for a one-line question or a bug report that changes no rule, and not for prompts about another project."
---

# Ardan prompt intake

**One job:** turn a new prompt into edits to the one living file, `docs/MASTER_PROMPT.md`, so it never becomes a pile of
orders. The procedure is the master prompt's own; this skill is the checklist for running it in this repo. Read the
sections it names rather than this summary when in doubt: **§1.1** (the nine steps), **§1.2** (register), **§1.3**
(carry-over checklist), **§0.2** (sync with work in progress), **§13.1** (priority rules), **§16.6** (skill lists).

## Before you start
- Read the whole master prompt again (§1.1 step 8 assumes you know it), then the new prompt in full.
- Note the next free numbers: an `H-` and `D-` range from your brief, else write `D-NEW-1` / `H-NEW` and let the
  integrator number them (CLAUDE.md, parallel safety). Orders keep their own numbering in `docs/OWNER_ORDERS.md`.

## The steps, with this repo's files
1. **Save the original, unchanged:** `docs/prompts/YYYY-MM-DD-short-name.md`. Add the order to `docs/OWNER_ORDERS.md`
   with its date and time, as every earlier order was.
2. **Split it** into single requests. Number them in your notes; quote the owner's words for each.
3. **Classify each request** (§1.1 step 3): *already here* (register only), *refines* (edit that place so one clear
   version remains), *new* (add it under its topic with a "Done when" a test or a playtest can check), *conflicts*
   (the newest instruction wins; move the old text to Appendix C with the reason; **ask first** if undoing it costs money,
   accounts, the store, the save format or deleted work), *later or unclear* (`docs/IDEAS.md`, one line on why).
4. **Place it by topic,** not at the end. A section over about 300 lines sends its detail to `docs/design/<topic>.md`.
   Keep the contents list at the top true.
5. **Roadmap and work in progress:** update §13 (phase, dependencies, what it delays) and apply the §0.2 verdicts
   (Finish, Redirect, Park, Drop) to anything it touches. Today the checklist of work items is `docs/PROGRESS.md`;
   `docs/STATUS.md` and `docs/ROADMAP.md` are written in the Phase 0 sync. Update whichever exist; never invent a second
   checklist.
6. **Metrics:** every new item has a "Done when" and, where it can be measured, a number. Fix targets the prompt moves.
7. **Records:** a row in §1.2, rows in §1.3 if it carries old work over, a `docs/DECISIONS.md` entry (what, what else was
   considered, why) for each real choice, and a `docs/HISTORY.md` entry (append only; never edit an old one).
8. **Check the whole file:** rules said twice, numbers that disagree, broken section references. If the prompt names
   skills, plugins or connectors, run §16.6 too and update `docs/TOOLING.md`.
9. **Report on one screen** in plain words: new, refined, conflicts and how they were settled, what moved, what happens
   to work in progress, the roadmap now, questions (batched). End with **YOUR NEXT ACTIONS** (§0.1: what only the owner
   can do, with page names and buttons; what you do next; what to check when playing; any cost, before spending it).

## Rules that are easy to break
- Never drop a requirement silently. A cut or a postponement is said out loud in the report.
- Do not paste the prompt into the master file. Each requirement once, short, in its topic.
- Keep intent over wording. A vague request gets the most reasonable reading, stated, and you move on; ask only when a
  wrong guess is costly.
- The merge is its own commit on its own branch (`work/<item>`), docs only, with its HISTORY entry. Commit messages that
  touch only docs may carry `[skip ci]`.
- Do not start the work the prompt asks for in the same commit. Finish the merge, then plan the work with
  `ardan-dev-process`.
- "Round N" and "version N" labels do not go into the master prompt or `docs/` (the master prompt's header).

## Done when
The original is in `docs/prompts/`; every request has a classification and a home; the register, roadmap, metrics and
records are updated; the whole-file check found nothing contradictory; the owner has a one-screen report ending in
YOUR NEXT ACTIONS.
