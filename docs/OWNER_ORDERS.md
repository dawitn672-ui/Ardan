# The owner's standing orders

Every instruction the owner has given that still holds, in one place, so no session makes them repeat it. Read at the
start of every session (CLAUDE.md points here). Add new orders at the bottom of their section with the date; when an
order is replaced, strike it through and say by what.

## How to work
1. **Read before starting:** CLAUDE.md, the end of docs/HISTORY.md, docs/DECISIONS.md, docs/V2_SPEC.md, this file, the skills. (Nov 12) · recorded 2026-11-12 05:44 UTC
2. **Plan first, then exceed the ask.** Research, build or improve skills, troubleshoot with your own judgment instead of stopping. (Nov 12) · recorded 2026-11-12 05:44 UTC
3. **Rebuild freely**, any tools or languages, as long as the goal is clear. (Nov 12) · recorded 2026-11-12 05:44 UTC
4. **Never throw work away:** retired code goes to archive/ with a note; record the last commit that had it. (Nov 12) · recorded 2026-11-12 05:44 UTC
5. **Record everything:** append-only docs/HISTORY.md per step, docs/DECISIONS.md, docs/IDEAS.md, CHANGELOG.md; update CLAUDE.md and the skills when they change. (Nov 12) · recorded 2026-11-12 05:44 UTC
6. **Milestones:** a release branch `release/<name>` (tags are refused by the git proxy) and sample saves in tests/saves that must keep loading. (Nov 12) · recorded 2026-11-12 05:44 UTC
7. **After each step:** tests, coherency checks, a playtest pass (scripted, then a playtester agent), fix what they find, then tell the owner what changed and what to test. (Nov 12) · recorded 2026-11-12 05:44 UTC
8. **Honest ETAs, padded for at least one extra CI round;** give a playable build early rather than waiting for green. (Nov 6) · recorded 2026-11-12 05:44 UTC
9. **CI:** `[skip ci]` on intermediate pushes while a run is going; never an empty commit to kick CI. One full CI run per finished step, not per commit. (Nov 6, Nov 12) · recorded 2026-11-12 05:44 UTC
10. **Branch deletion is left to the owner.** (Nov 6) · recorded 2026-11-12 05:44 UTC
11. **Pause after the critique:** once docs/CRITIQUE.md is done, stop all work and wait for the owner's review. (Nov 12) · recorded 2026-11-12 05:44 UTC
12. **Token efficiency by any means, with the game's goals in mind; full discretion over model and effort** (the Nov 12 model table, docs/DECISIONS.md D-009, is guidance, not a rule). See D-010. (Nov 12) · recorded 2026-11-12 05:44 UTC
13. **Don't make the owner repeat instructions:** save them here. (Nov 12) · recorded 2026-11-12 05:44 UTC
14. **Any outside tool or AI is allowed** (web search, web pages, ChatGPT, Codex, anything) where it makes the work cheaper or better. **Everything it produces goes back into the repo, fully structured** (data in `data/`, research in `docs/research/`, code in `src/`, with a HISTORY entry naming the source). Outside AIs that need an account are reached through their API with a key the owner saves via the secure credential form; none is set up yet. (Nov 12) · recorded 2026-11-12 05:47 UTC
15. **Time-stamp every entry** in the repo's memory (orders, decisions, history, critique, research, ideas) with the date and UTC time it was recorded, so it is clear which matters more and which is out of date; when an entry is replaced, mark the old one `superseded by <id>, <stamp>` and the new one `supersedes <id>`. · recorded 2026-11-12 11:11 UTC
16. **Auto-resume after limits, even when the owner is away:** a scheduled task ("Ardan auto-resume after limits", id `trig_01Brt9jMjwCyjDebRAxoZpfc`, hourly at :12 into this session) resumes agents stopped by a usage limit or restart, pushes stray work and checks PR #2's CI; it never starts new steps while a pause is in force and stays silent when nothing changed. If the session is replaced, recreate it. · recorded 2026-11-12 11:12 UTC

## Permissions (what a session may do on its own, and what needs the owner)
**Free to do without asking:**
- Change, rebuild or replace any game code, data, tests, tools, docs and skills (`.claude/skills/`: research, add,
  remove, improve; keep them true to the code). Never edit `vendor/ardan-b593143.html` (the untouched release).
- Use any language, tool, model, effort level, agent, web search, web page or outside AI (orders 3, 12, 14).
- Commit and push to `v2-integration` (the round 2 working branch, PR #2), push `release/<name>` milestone branches,
  run and re-run CI once per failure, watch PR #2 and fix its CI.
- Spend tokens and time where the game's goals need it, efficiently (D-010).

**Ask the owner first:**
- Merging any pull request, deleting any branch, pushing to `main` or another person's branch, rewriting pushed
  history (no force-push, rebase or amend on pushed commits).
- Opening a new pull request, or anything else outward-facing beyond PR #2's normal CI work.
- Starting new work while a pause the owner ordered is in force (order 11).
- Saving any secret: API keys go only through the secure credential form, never into chat or the repo.

## Talking to the owner
- Friendly game-companion voice, short plain sentences, a little personality, mild language fine; straight and
  serious when something really matters. Not bullet-heavy.
- Give times in New York time. Give honest, padded ETAs, and say plainly when something slipped and why.
- After each major step: what changed, and what to test by playing. Send a playable build early.

## Memory
The cloud container is wiped between sessions; only what is pushed survives. The memory is this repo: this file
(orders), `CLAUDE.md` (how to work), `docs/HISTORY.md` (what was done, how to undo), `docs/DECISIONS.md` (why),
`docs/IDEAS.md` (later), `CHANGELOG.md` (for players), `docs/CRITIQUE.md` (what is wrong, in what order to fix it).
Push every change; a session that ends with unpushed work has lost it. Every entry carries a UTC stamp (order 15);
the newest stamp wins when two entries disagree, unless the older one is an owner's order that was never superseded.

## Game rules (design)
1. Descriptions open on click (button or info icon), never on hover. (Nov 12, replaces "never hide a description behind a click") · recorded 2026-11-12 05:44 UTC
2. No percentages the player sees: words and a tipped scale. (v2) · recorded 2026-11-12 05:44 UTC
3. Every system deterministic from the seed. (v2) · recorded 2026-11-12 05:44 UTC
4. One holder per post; a promotion hands over the real command and takes the old post; leaving a post has consequences. (Nov 12) · recorded 2026-11-12 05:44 UTC
5. War screens only when deployed, on a mission, or the situation allows. (Nov 12) · recorded 2026-11-12 05:44 UTC
6. Time: Next month or Next year (a year stops early when something needs you); Next day/week in campaigns. (Nov 12, D-008) · recorded 2026-11-12 05:44 UTC
7. Relationships start with only the people really in your life (commoner: parents, siblings; noble: also maids, nurses, tutors, guard knights); others enter through what you do. (Nov 12) · recorded 2026-11-12 05:44 UTC
8. Names and cultures modelled on real-world ones; humans mainly white/European, diverse where it makes sense. (Nov 12) · recorded 2026-11-12 05:44 UTC
9. **Keep it game-like and simple** (Nov 12): names are basic, mostly simple names (not exotic or scholarly); "medieval military" means the strategy of fighting with knights, cavalry, infantry and archers (what beats what, terrain, timing), not historical detail for its own sake. · recorded 2026-11-12 10:55 UTC
10. If an order conflicts with how the code works, record the conflict and the fix chosen (DECISIONS). (v2, Nov 12) · recorded 2026-11-12 10:55 UTC

## Round 2 work list (Nov 12)
Step 0 restructure (done) · Step 1 harsh critique (in progress) · A1 lag · A2 one holder per post · A3 coherency
checks · B4 click-to-open · B5 declutter · B6 Next month or Next year · C6 relationships and households · C7 names and
cultures · C8 character design (high priority) · D9 map detail · D10 war only when deployed · D11 military branches ·
D12 war and command depth.
