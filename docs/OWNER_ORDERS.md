# The owner's standing orders

Every instruction the owner has given that still holds, in one place, so no session makes them repeat it. Read at the
start of every session (CLAUDE.md points here). Add new orders at the bottom of their section with the date; when an
order is replaced, strike it through and say by what.

## How to work
1. **Read before starting:** CLAUDE.md, the end of docs/HISTORY.md, docs/DECISIONS.md, docs/V2_SPEC.md, this file, the skills. (Nov 12) · recorded 2026-11-12 00:44 ET
2. **Plan first, then exceed the ask.** Research, build or improve skills, troubleshoot with your own judgment instead of stopping. (Nov 12) · recorded 2026-11-12 00:44 ET
3. **Rebuild freely**, any tools or languages, as long as the goal is clear. (Nov 12) · recorded 2026-11-12 00:44 ET
4. **Never throw work away:** retired code goes to archive/ with a note; record the last commit that had it. (Nov 12) · recorded 2026-11-12 00:44 ET
5. **Record everything:** append-only docs/HISTORY.md per step, docs/DECISIONS.md, docs/IDEAS.md, CHANGELOG.md; update CLAUDE.md and the skills when they change. (Nov 12) · recorded 2026-11-12 00:44 ET
6. **Milestones:** a release branch `release/<name>` (tags are refused by the git proxy) and sample saves in tests/saves that must keep loading. (Nov 12) · recorded 2026-11-12 00:44 ET
7. **After each step:** tests, coherency checks, a playtest pass (scripted, then a playtester agent), fix what they find, then tell the owner what changed and what to test. (Nov 12) · recorded 2026-11-12 00:44 ET
8. **Honest ETAs, padded for at least one extra CI round;** give a playable build early rather than waiting for green. (Nov 6) · recorded 2026-11-12 00:44 ET
9. **CI:** `[skip ci]` on intermediate pushes while a run is going; never an empty commit to kick CI. One full CI run per finished step, not per commit. (Nov 6, Nov 12) · recorded 2026-11-12 00:44 ET
10. **Branch deletion is left to the owner.** (Nov 6) · recorded 2026-11-12 00:44 ET
11. ~~**Pause after the critique:** once docs/CRITIQUE.md is done, stop all work and wait for the owner's review.~~ Done; **superseded by order 17**, 2026-11-12 06:49 ET. (Nov 12) · recorded 2026-11-12 00:44 ET
12. **Token efficiency by any means, with the game's goals in mind; full discretion over model and effort** (the Nov 12 model table, docs/DECISIONS.md D-009, is guidance, not a rule). See D-010. (Nov 12) · recorded 2026-11-12 00:44 ET
13. **Don't make the owner repeat instructions:** save them here. (Nov 12) · recorded 2026-11-12 00:44 ET
14. **Any outside tool or AI is allowed** (web search, web pages, ChatGPT, Codex, anything) where it makes the work cheaper or better. **Everything it produces goes back into the repo, fully structured** (data in `data/`, research in `docs/research/`, code in `src/`, with a HISTORY entry naming the source). Outside AIs that need an account are reached through their API with a key the owner saves via the secure credential form; none is set up yet. (Nov 12) · recorded 2026-11-12 00:47 ET
15. **Time-stamp every entry** in the repo's memory (orders, decisions, history, critique, research, ideas) with the date and US East Coast time (New York/Maryland, written `ET`) it was recorded (changed from UTC 2026-11-12 06:49 ET; older UTC stamps converted), so it is clear which matters more and which is out of date; when an entry is replaced, mark the old one `superseded by <id>, <stamp>` and the new one `supersedes <id>`. · recorded 2026-11-12 06:11 ET
16. **Auto-resume after limits, even when the owner is away:** a scheduled task ("Ardan auto-resume after limits", id `trig_01Brt9jMjwCyjDebRAxoZpfc`, hourly at :12 into this session) resumes agents stopped by a usage limit or restart, pushes stray work and checks PR #2's CI; it never starts new steps while a pause is in force and stays silent when nothing changed. If the session is replaced, recreate it. · recorded 2026-11-12 06:12 ET
17. **Continue with the structure according to plan:** the owner reviewed the critique and answered its decisions (DECISIONS D-011 to D-014); work follows docs/CRITIQUE.md §2 in order. · recorded 2026-11-12 06:49 ET
18. **Many more names:** the name pools must be large enough to name whole kingdoms, and then noticeably larger again. · recorded 2026-11-12 06:49 ET
19. **Model versions:** whenever Fable is used it must be **Fable 5.2** (`claude-fable-5-2`); whenever Opus is used it must be **Opus 5.5** (`claude-opus-5-5`). The Agent tool's `fable` and `opus` choices map to exactly these (the API errors of Nov 12 name `claude-fable-5-2` and `claude-opus-5-5`); check the model named in any agent's error or report, and stop and tell the owner if it ever differs. · recorded 2026-11-12 10:53 ET
20. **Queued: a naming pass (work item X6).** Go through the whole repo and rename folders, files, docs, scripts, tests and branches with clear, self-explanatory titles so it is much easier to navigate. Done with `git mv` (history kept), keeping every feature's build order (the numeric prefixes and their order stay), with a redirect table in `docs/NAMES.md` from old name to new. ~~Scheduled right after X1~~ **Moved to immediate priority by the owner (2026-11-12 11:17 ET), so the repo is easy to navigate now.** · recorded 2026-11-12 10:57 ET
21. **Keep `docs/PROGRESS.md` current:** tick every work item the moment it is merged and green (stamp and commit), so progress is always visible at a glance. · recorded 2026-11-12 11:17 ET
22. **Every finished step is a new version, organised and tracked:** `node tools/version.mjs new` (row in docs/VERSIONS.md), a CHANGELOG section, a pushed `release/<version>` branch, a line in docs/PROGRESS.md "Versions", a sample save in tests/saves; pre-releases `v2.1.0-alpha.N` until a milestone. · recorded 2026-11-12 11:20 ET
23. ~~**Pause for review after the character demos:** once the C8 demo sheets are done (faces, ages, scars, builds, hair, outfits), stop starting new work, finish and merge only what is already running, show the owner the demos, and wait for the owner's review.~~ Done: the owner reviewed and chose the 2D style (2026-11-12 17:05 ET, D-024) · recorded 2026-11-12 11:44 ET
24. **Characters in a detailed 2D illustrated style** (D-024): a layered library of designer-drawn parts; show the owner a new demo before building it into the game. · recorded 2026-11-12 17:05 ET
25. **Tone-led finish; the look of Pick Me Up's character profile cards** (D-029): painted, semi-realistic webtoon portraits where soft shading carries the form (not ink outlines), shown on a profile card. Take the *look* only, never its characters, art or card design. An outside image AI may be used for reference sheets where it is needed (key through the secure form only). · recorded 2026-11-13 02:00 ET

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
Push every change; a session that ends with unpushed work has lost it. Every entry carries an ET stamp (order 15);
the newest stamp wins when two entries disagree, unless the older one is an owner's order that was never superseded.

## Game rules (design)
1. Descriptions open on click (button or info icon), never on hover. (Nov 12, replaces "never hide a description behind a click") · recorded 2026-11-12 00:44 ET
2. No percentages the player sees: words and a tipped scale. (v2) · recorded 2026-11-12 00:44 ET
3. Every system deterministic from the seed. (v2) · recorded 2026-11-12 00:44 ET
4. One holder per post; a promotion hands over the real command and takes the old post; leaving a post has consequences. (Nov 12) · recorded 2026-11-12 00:44 ET
5. War screens only when deployed, on a mission, or the situation allows. (Nov 12) · recorded 2026-11-12 00:44 ET
6. Time: Next month or Next year (a year stops early when something needs you); Next day/week in campaigns. (Nov 12, D-008) · recorded 2026-11-12 00:44 ET
7. Relationships start with only the people really in your life (commoner: parents, siblings; noble: also maids, nurses, tutors, guard knights); others enter through what you do. (Nov 12) · recorded 2026-11-12 00:44 ET
8. ~~Names and cultures modelled on real-world ones; humans mainly white/European, diverse where it makes sense. (Nov 12)~~ **Superseded by rule 11**, 2026-11-12 06:49 ET. · recorded 2026-11-12 00:44 ET
9. **Keep it game-like and simple** (Nov 12): names are basic, mostly simple names (not exotic or scholarly); "medieval military" means the strategy of fighting with knights, cavalry, infantry and archers (what beats what, terrain, timing), not historical detail for its own sake. · recorded 2026-11-12 05:55 ET
10. If an order conflicts with how the code works, record the conflict and the fix chosen (DECISIONS). (v2, Nov 12) · recorded 2026-11-12 05:55 ET
11. **One common language, different cultures:** most countries speak the same (English) language, so most realms use plain English-language names; cultures differ in customs, dress, faith and ways, not in language. A few far or non-human peoples may sound different. · recorded 2026-11-12 06:49 ET
12. ~~**Art: animated (anime), but far more detailed, as if a real character designer drew it,** with many more customisation options for hair, height, facial features and build.~~ superseded by rule 14 · recorded 2026-11-12 06:49 ET
13. **Feudal armies** (the Marshal part superseded by rule 16). Armies are feudal: nobles hold troops in proportion to their rank; the crown has royal knights; the elite orders serve the crown but draw their men from the whole kingdom by prowess; a duchy's knights march with the kingdom in war but, forced to choose, stay loyal to their duchy. · recorded 2026-11-12 06:49 ET
14. **Characters as realistic as possible** (anime optional): accurate growth and ageing, lasting scars that change face and body, armour and clothing in full detail (D-015). Refined 2026-11-12 10:52 ET (D-020): full hand customisation of the face first, genes second; scars mostly looks with small debuffs where fitting; clothing changeable; **show the owner demo sheets before building**. · recorded 2026-11-12 10:46 ET
15. **An inked, detailed map** (rivers, valleys, mountains, trade routes, terrains, habitats); **war territory spreads like a burn**, never hex tiles, so momentum shows (D-016). · recorded 2026-11-12 10:46 ET
16. **The Marshal's seat stays vacant until truly needed,** then goes to a General or someone proved more capable than the generals; **General is the army's highest everyday rank** (D-017). · recorded 2026-11-12 10:46 ET
17. **No initiative cap;** overtraining has its own consequences. **Only notable events or problems stop a month or a year,** never ordinary conversations or happenings (D-019). · recorded 2026-11-12 10:46 ET

## Round 2 work list (Nov 12)
Step 0 restructure (done) · Step 1 harsh critique (in progress) · A1 lag · A2 one holder per post · A3 coherency
checks · B4 click-to-open · B5 declutter · B6 Next month or Next year · C6 relationships and households · C7 names and
cultures · C8 character design (high priority) · D9 map detail · D10 war only when deployed · D11 military branches ·
D12 war and command depth. Added: X6 naming pass (after X1).
