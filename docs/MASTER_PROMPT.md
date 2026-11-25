# Ardan — Master Prompt

This is the one living instruction file for Ardan. It is not a numbered release or a round. When I give you a new prompt, you **merge it into this file** with the procedure in section 1. You do not stack it next to the old ones. Every prompt I give you is kept unchanged in `docs/prompts/` and listed in the register (1.2), but **this file is the source of truth**.

**The code is being worked on right now.** This file arrives in the middle of that work. It must mesh with what is already happening, not restart it.

**My newest instruction always wins.** Whenever I give you something new, it takes precedence over every older construct: an earlier order, a decision record, a design already built, a rule in this file, `CLAUDE.md`, a skill or a spec. Merge it (section 1), move what it replaces to Appendix C, and build from the new one. Ask first only when following it would cost money, accounts, the store, players' saves or deleted work. This holds for the rest of the project.

**Order of work:** by what has the greatest effect on the game as it is today, in descending order (13.1). **Every new order is placed in the work by its importance under 13.1, not by when I gave it** (order 78). Skills and tools are refined first whenever I add new ones (section 16).

Read this whole file at the start, and again after every merge (section 1). In other sessions, read section 0, `docs/STATUS.md`, section 13 and the section for the work at hand.

I am early in development. The game will change a lot before the roadmap is finished. So **plan in rolling waves**: the next phase in detail, later phases only in outline. Re-plan after every phase and after every prompt I add (sections 1 and 13).

**Progress is measured by the "Done when" lines and the numeric targets in each section, not by version or round names.** Do not label anything "Round N" or "version N" in this file or in `docs/` (old source file names in the register are the only exception).

**Contents**
0. How you work with me (next actions, syncing with work in progress, permissions)
1. Merging new prompts into this file (procedure, register, carry-over checklist)
2. Decisions and standing rules
3. Current state: alpha 15 analysis
4. Foundations: repo, memory, quality
5. Interface and time
6. People, bodies, family, nobility, diplomacy, look
7. Map
8. Difficulty and progression (Workstream A)
9. Skills (Workstream B)
10. War (Workstream C)
11. Research loop
12. Platform plan (no Mac)
13. Roadmap and order of work (priority rules, critical path, phases, lead times)
14. Tools and services
15. First session script
16. Skills, plugins and connectors (top priority)
17. Magic, races, monsters and legendary beings (Workstream D)
18. Professions and pathways (Workstream E)
- Appendix A: balance harness. Appendix B: skill schema. Appendix C: superseded instructions.

Keep this list current when sections are added, split or renumbered.

---

## 0. How you work with me

### 0.1 YOUR NEXT ACTIONS
I run this project from GitHub and Claude Code. **I do not have a Mac.** Do not assume I know the tools. At the start of every session, and again at the end of each step, give me a block called **YOUR NEXT ACTIONS**:

1. **What only I can do.** Exact steps, with the page names and buttons. Examples: create an account, accept an agreement, add a secret in GitHub settings, install an app on my phone.
2. **What you will do next** without me.
3. **What to check** when I play, in plain words.
4. **Cost.** Tell me the price before any step that costs money, and wait for my yes.

Rules for this:
- One step at a time. Short sentences. No jargon without a one-line explanation.
- **My time is the scarcest resource.** Batch your questions and your requests for me to play. Ask me to play at milestones, not after every small step. Never sit idle waiting for an answer: move on to work my answer does not affect.
- Never ask me to paste a secret key into chat or into a file in the repo. Use GitHub Secrets or the service's own settings page, and tell me exactly where.
- Store rules, prices and service limits change. **Before you recommend any service or tell me about any store rule, search for the current official page** and say what you found.
- If a step conflicts with how the code works, tell me the conflict and your proposed fix before doing it.
- If you hit a roadblock, research it, use or build a skill, and troubleshoot with your own judgment instead of stopping.

### 0.2 Work already in progress: sync before anything else
Do this the first time you read this file, and again whenever I tell you that work happened outside your session. On the first read, do step 1, then the skills refinement (section 16), then steps 2 to 8.

1. **Reach a safe point.** Finish the commit you are on and get the tests passing. Do not start anything new yet.
2. **Take stock.** List every branch, open pull request, uncommitted change and stash. Read the end of `docs/HISTORY.md`, `docs/ROADMAP.md` and any to-do lists. Note which step of the earlier orders (register, 1.2) you are on. For each piece of work, note which modules it touches.
3. **Re-check section 3.** It describes the alpha 15 build, and the code has moved on since. Re-check its numbers against the current `main` (wrapper count, patches, the exploits, the errors) and write down what changed.
4. **Write `docs/STATUS.md`.** One row per piece of work in progress: what it is, branch, how far along, modules touched, which section of this file it belongs to, and its verdict.
5. **Give each piece a verdict:**
   - **Finish:** still right under this file, and finishing costs less than parking (rough rule: about two days of work left or less) and it does not touch a module this file rebuilds soon.
   - **Redirect:** the aim still stands but the design changed. Keep the part that survives and redo the rest to this file. Example: work on the old numeric skills moves to the ranked model (section 9).
   - **Park:** right, but not now. Push the branch, tag it `parked/<name>`, and add a note to `docs/IDEAS.md` on how to resume.
   - **Drop:** it conflicts with a decision in section 2 (for example seed sharing, hover pop-ups or export features). Archive it as in 4.3.
6. **Special cases:**
   - *War:* stop adding features to the current war modules at the next safe point. Bug fixes only until the new war core switches on (section 10).
   - *Numeric skills and perks:* do not extend them. The adapter in section 9 keeps them working.
   - *Interface:* keep going if it is the shell (five places, click-to-open descriptions, the one time button). Hold any new screen that the skills interface will redo.
   - *Map:* keep going, but spend nothing on the Great Continent until I answer (section 2).
   - *Characters and portraits:* keep going. It is a parallel track (6.8).
7. **Map it onto the roadmap.** Finished work ticks off rows in 1.3. Redirected work becomes tasks in its phase in section 13. Where the earlier orders' sequence differs from section 13, section 13 wins, but never abandon a half-done step: bring it to a safe commit first.
8. **Tell me on one screen:** what was in progress, the verdict for each, and what changes in the plan. Carry on with the Finish items straight away. Wait for my yes only on Drop verdicts and on anything costly to undo.

**Keep `docs/STATUS.md` current every session.** It is the live view of what is happening now. `docs/ROADMAP.md` is the plan.

**If more than one session or agent works on the repo at once:** each works on its own branch, `docs/STATUS.md` lists the modules each one touches, and no two touch the same module at the same time.

Rules for the sync: never delete a branch, never force-push `main`, and never throw away uncommitted work (commit it to a branch first).

**Done when:** every branch and uncommitted change has a verdict in `docs/STATUS.md`; `main` builds and passes its tests; nothing was deleted.

### 0.3 Permissions
Once the sync in 0.2 is done, rebuild freely, even things already built or planned, as long as the goal is clear. Use any language, tool or mix (JavaScript, HTML, Python, Java or others), whichever gives the best result. Add, fix or delete skills in `.claude/skills/`, and keep every skill accurate to what the code actually does. Section 16 says which skills, plugins and connectors to keep, merge and remove. Never throw work away: move replaced code to `archive/` with a note, and tag the last commit that had it (section 4.3).

---

## 1. Merging new prompts into this file

I will keep giving you prompts, plans, lists of skills and loose requests. **Each one is merged into this file, organised by topic.** The file is reorganised around what I add. It must never turn into a pile of separate orders.

### 1.1 Procedure (every time I give you something new)
1. **Save the original.** Copy my text unchanged to `docs/prompts/YYYY-MM-DD-short-name.md`.
2. **Read it all, then split it** into single requests.
3. **Classify each request:**
   - *Already here:* note it in the register. Change nothing.
   - *Refines something here:* edit that place so there is one clear version.
   - *New:* add it to the section for its topic, with a "Done when" line that can be tested or played.
   - *Conflicts with something here:* my newest instruction wins. Move the old instruction to Appendix C with the reason. If the old one is costly to undo (money, accounts, the store, the save format, deleting work), **ask me before applying the change** and say what it would cost.
   - *Later or unclear:* put it in `docs/IDEAS.md` with one line on why it could matter, and tell me.
4. **Put it in the right place.** Add each item under its topic, not at the end of the file. If it fits no topic, make a new section and renumber. If two sections now say the same thing, merge them. If a section passes about 300 lines, move the detail to `docs/design/<topic>.md` and leave a short summary and a link here.
5. **Update the roadmap (section 13) and `docs/STATUS.md`.** Say which phase the new work belongs to, what it depends on and what it delays. Say whether it changes, redirects or cancels any work in progress, and apply the verdicts from 0.2. Re-plan only the phases it touches, using the priority rules in 13.1.
6. **Update the metrics.** Every new item needs a "Done when" and, where it can be measured, a number or target. Fix any target the new prompt changes.
7. **Update the records:** the register (1.2), the checklist (1.3), `docs/DECISIONS.md` (what, what else was considered, why) and `docs/HISTORY.md`.
8. **Check the whole file.** Look for rules said twice in different ways, numbers that disagree and section references that broke. Fix them. The `ardan-prompt-intake` skill (section 16) runs this procedure.
9. **Tell me, in simple terms and on one screen:** what was new; what refined something; what conflicted and how you resolved it; what moved; what happens to the work in progress; what the roadmap looks like now; and any questions. End with YOUR NEXT ACTIONS.

**Rules for merging**
- Never drop a requirement silently. If you cut or postpone one, say so.
- Do not paste a whole prompt into this file. Write each requirement once, short and clear, in the topic where it belongs.
- Keep my intent over my wording. If a request is vague, take the most reasonable reading, say which one you took, and move on. Ask only when a wrong guess is costly.
- A change to this file is its own commit, with a `docs/HISTORY.md` entry.
- A prompt that is only a list of skills, plugins or tools also goes through section 16.6.

### 1.2 Source register
One row per prompt I give you. Add a row every time. "Status" says whether it is merged and where it landed.

| ID | Date | Source | What it asked for | Landed in | Status |
|---|---|---|---|---|---|
| K | 2026-11-01 | Kit integration plan (`ardan/CLAUDE_CODE_PROMPT.md`) | Fold the v2 drop-in modules into the game in ten steps, one commit each | 4, 5, 6, 7, 10, 12 | Merged. Which steps are built is unknown: see 1.3. |
| V | 2026-11-01 | V2 complaint spec (`ardan/V2_SPEC.md`) | 16 complaints, each with a fix, a module and a test, plus an honest list of gaps | 5, 6, 7, 8, 10, 13 | Merged. |
| O | 2026-11-12 | Orders on repo, interface, people, map and war (`ardan/CLAUDE_CODE_PROMPT_ROUND2.md`) | Repo layout and memory files, a harsh critique, lag, one holder per post, click not hover, less clutter, relationships, names, character design, map detail, war only when deployed, military branches, war depth | 0, 4, 5, 6, 7, 10 | Merged. May be in progress: see 0.2. |
| P | 2026-11-25 | Platform and tools audit (`ardan/ROADMAP_AND_TOOLS.md`) | Backend, store, leaderboard and tool plan from the alpha 15 audit | 12, 14 | Merged. The file stays as the first-pass audit. |
| W | 2026-11-25 | Alpha 15 analysis and the three workstreams | Why alpha 15 is too easy, ranked game-like skills, a war rebuild, the research loop, the roadmap, and these decisions: free with a later store, cloud saves, leaderboards, no Mac, no seed sharing, no export or import, saves by device or account | 2, 3, 8, 9, 10, 11, 12, 13 | Merged. |
| S | 2026-11-25 | Skills, plugins and connectors review | What to keep, merge and remove; the `ardan-*` skills; how to review skills I add later | 16 | Merged. |
| M | 2026-11-25 | "This is not a numbered round" instruction | One living master prompt. Each new prompt is merged and the file is reorganised around it | 1 | Merged. |
| I | 2026-11-25 | "The code is under work right now" instruction | Mesh this file with the work already in progress; order the work and set priorities for the most efficient route | 0.2, 1.1, 2, 4.5, 4.6, 8 (A0), 10, 13, 15 | Merged. |
| T | 2026-11-25 | "Refining the skills comes first" instruction | Make the skills and tools review the top priority, because it helps every later step | Header, 0.2, 13.1, 13.2, 13.3, 15, 16 | Merged. |
| A | 2026-11-25 | Answers to the Phase 0 questions (`docs/prompts/2026-11-25-answers-and-direction.md`), with the Emilio save | Newest instruction wins, everywhere; GitHub `main` brought up to date; no working branches or working files left in the repo, only versions; plugins folded into the Ardan skills, the rest cut; drop the two unfinished features; the map decision put to me later; seed and export behind a dev flag; skills rebuilt as ranked skills that merge, advance and evolve, in great number, stats kept apart; Next month only from age 12; magic, many races, monsters and legendary beings, after the skills; paid game packs for more allowances; portraits improved as often as needed; the Emilio life; auto-resume on; the order of work rebuilt by effect on the game | Header, 2, 4.1, 5, 9, 12.5, 13, 16, 17 | Merged. |
| P2 | 2026-11-25 | "Make the power scaling of this world much larger" (`docs/prompts/2026-11-25-power-scale.md`) | Countless beasts and mythical beings; today's strongest warrior weak beside race masters and monsters; full speed, no stopping every few minutes | 13, 17 | Merged. |
| L | 2026-11-25 | Levels and beings (`docs/prompts/2026-11-25-levels-and-beings.md`) | Levels replace tier words; same level, different capabilities; intelligence classes; minds, titles and a ranking for every unique being, lairs for some; every order placed by importance | Header, 9, 13.1, 17 | Merged. |
| T2 | 2026-11-25 | Titles (`docs/prompts/2026-11-25-titles.md`) | Stackable titles with honour, buffs and stat boosts; very hard to earn; hidden requirements | 9 | Merged. |
| PW | 2026-11-25 | Pathways (`docs/prompts/2026-11-25-pathways.md`) | Stat allocation with points per level; skill training; blacksmithing and diverse weapons; trade and business as an easy profession; countless paths beyond combat | 9, 13.1, 18 | Merged. |
| AS | 2026-11-25 | Answers on skills, titles, paths, creatures (`docs/prompts/2026-11-25-answers-skills-titles.md`) | Ranks to SSS, gods above; evolved skills stay, merges absorb; titles like Sword Saint or born-with; stats by levels, skills and titles by action; evolution can give explosive growth; thousands of fully specified skills; paths: adventurer, spy, guild master; creatures specified by nature | 9, 17, 18 | Merged. |
| LT | 2026-11-25 | Legends and the throne (`docs/prompts/2026-11-25-legends-and-throne.md`) | Paths are principles; no gods but faint myth; the King of Dragons, Primordial Archdemons, a legendary human Sword Saint (the best-known figure of history); skills have no range; no crown baseline; no Master or Legend measures; an outsider's road to a throne as hard as it truly is | 8, 9, 17, 18 | Merged. |
| LM | 2026-11-25 | Level anchors, legends, the map (`docs/prompts/2026-11-25-levels-legends-map.md`) | The ladder's numbers from a commoner (20-30) to the Dragon King (about 800); legends as national threats, challengeable, ranked; races changed by lineage; the map redesigned freely then locked | 7, 13.1, 17 | Merged. |

### 1.3 Carry-over checklist
Earlier prompts asked for a lot that may already be built, or be in progress. **Before you plan any phase, check each row in the repo.** Record the result (Done, In progress, Partly, Not done or Changed) and the evidence in `docs/ROADMAP.md`. Work only on what is not done. New prompts add rows here. Item IDs: K1 to K10 are the kit steps, V1 to V16 are the complaint numbers in `docs/V2_SPEC.md`, O-letter-number are the orders of 2026-11-12.

| # | Item | From | Section | Known so far |
|---|---|---|---|---|
| 1 | The kit's 24 tests run in the release test runner and block a release | K1 | 4 | Check |
| 2 | One connected generated continent; the Great Continent is gone from play | K2, V3, V4 | 7 | Partly: the build still mentions it 35 times. I must answer. |
| 3 | Only "Next month"; cards one at a time; quiet months as a toast; Next day and Next week only in a campaign; no Play or sim-a-week | K3, V1, V8 | 5 | Check |
| 4 | At most five places: Life, You, Family, World, War (while at war) | V2 | 5 | Check |
| 5 | Stats in real units, growth by age, distinct races; no universal piety; checks through `attempt()`, fights through `fightingWorth` | K4, V7, V11, V12 | 6, 8, 9 | Partly: numeric skills exist; breakthroughs are an exploit (changed in 8) |
| 6 | One relation-label resolver; no "rivals but married" or "mutual friend" errors | K5, V5 | 6 | Check |
| 7 | A generated three-generation family; no birth-position picker; one holder per title | K5, V14 | 6 | Check |
| 8 | Noble pyramid caps | K6, V13 | 6 | Check |
| 9 | Diplomacy changes monthly with reasons ("Drawing together" and "Pulling apart") | K7, V5 | 6 | Check |
| 10 | Renown and promotion are not linear | V15 | 6 | Check |
| 11 | Odds in words, with blunders and surges | V16 | 6 | Check |
| 12 | Elite orders | V9 | 10 | Check |
| 13 | War only when I am in it; I play my rank; outsiders get rumours | K8, V10, O-D10 | 10 | Partly: war exists but is undeveloped and buggy |
| 14 | Saves carry the new fields and migrate | K9 | 12 | Check |
| 15 | The playtest loop runs after every step | K10 | 4 | Check |
| 16 | Repo layout, `CLAUDE.md`, `HISTORY.md`, `DECISIONS.md`, `IDEAS.md`, `CHANGELOG.md`, `archive/`, tags, `tests/saves/` | O-Step0 | 4 | Check |
| 17 | `docs/CRITIQUE.md`: a harsh critique with each flaw rated out of 10 | O-Step1 | 4, 11 | Check |
| 18 | No lag at year 50 | O-A1 | 4 | Check |
| 19 | One holder per post; a promotion hands over real command | O-A2 | 4, 6 | Check |
| 20 | Coherency checks after every update | O-A3 | 4 | Partly: some checks exist |
| 21 | Descriptions open on click; no hover pop-ups | O-B4 | 5 | Check |
| 22 | Less clutter on every screen | O-B5 | 5 | Check |
| 23 | Relationships start small and grow through what I do | O-C6 | 6 | Check |
| 24 | Diverse names and cultures | O-C7 | 6 | Check |
| 25 | Distinct, individual characters (a high priority) | O-C8 | 6.8 | Not done |
| 26 | Map detail: borders, trade routes, roads, rivers, fords, passes, forests, marshes, towns | O-D9 | 7 | Check |
| 27 | Military branches with their own ranks, training and missions | O-D11 | 10 | Check |
| 28 | War depth: flanking, stealth, attrition, blockades, encirclement, sieges, supply, ambushes, scouting | O-D12 | 10 | Check |
| 29 | Migrate and prune the 3,199 events | V gaps | 13 | Not done |
| 30 | Diplomacy depth: wars move provinces, allies are pulled in | V gaps | 6.5 | Not done |
| 31 | Real new players confirm the feel (five of them) | V gaps | 13 | Not done |

---

## 2. Decisions and standing rules

**Decisions**
- The game is **free to download**, with an in-game store. **The list of items for sale is decided much later.** Build the plumbing late and keep it switched off until then.
- **Cloud saves and leaderboards: yes.**
- **No Mac.** iPhone builds must come from a cloud route (section 12).
- **Players must never be able to send a world seed to anyone.**
- **Saves belong to a device or an account, never to a seed.** A save's identity is a random ID created on install or on the account, plus a random life ID.
- **Remove `.ardan` export and import** from release builds. Keep them behind a developer flag for tests. Cloud saves and the local backup slots replace them. Low priority: no players have the game yet.
- **Magic: yes,** and much of it (section 17), with many races, monsters and legendary beings. Any canon may be rewritten to make it fit.
- **The store sells game packs that give more allowances,** for example editing your birth or choosing your station (12.5). Nothing else is decided.
- **Portraits:** the code-drawn portraits, improved as many times as needed (6.8).
- **The map:** the designed continent (M1) stands for now; the final decision is put to me later, when the canon is rewritten (Phase 3).

**Standing rules**
- No hover pop-ups. Descriptions open on click.
- No percentages in the player-facing UI. Use words, pips and scales.
- One holder per post, title and unique thing.
- Deterministic from the seed. Looking at something must never change the dice.
- One step per commit. Tests and coherency checks run after every step. `docs/HISTORY.md` is append-only.
- **The repo is versions being updated:** GitHub holds `main` (the one trunk) and a `release/<version>` branch per version. No working branches are pushed and no working files are kept: helpers work in local worktrees and their work lands on `main`; plans, reports and scratch stay out of the repo unless they are needed for reference (4.1).
- `main` always builds, passes its tests and loads old saves. A broken `main` is fixed before anything else.
- The seed is never shown, copied, typed in, printed or saved where a player can read it.
- Do not auto-format `data/` or the event packs. The game reads event functions as text (`A.evAudience`).
- **Do not add new wrapper layers (`A.addStage`) in any system.** Change the module that owns the function. If a wrapper is truly unavoidable, record why in `docs/DECISIONS.md`. CI counts them (4.6).
- Never polish a system that is scheduled to be rebuilt. It gets bug fixes only (war, until its new core switches on).
- **Precedence:** my newest instruction wins over every older construct, everywhere (the header). The replaced instruction goes to Appendix C (section 1.1).

**Open questions for me.** Ask all of them in one batched message. Each has a "needed by" phase. Work around them until then.

| # | Question | Needed by | Default until I answer |
|---|---|---|---|
| 1 | The map: does the designed continent (M1) stand, and the Great Continent go for good? (Answered 2026-11-25: ask me again later.) | Phase 3 | The designed continent; no new work on the Great Continent. |
| 2 | ~~Does Ardan have magic?~~ Answered 2026-11-25: yes, much of it (17). | | |
| 3 | ~~Should anything bought change the game?~~ Answered 2026-11-25: game packs that give more allowances (12.5). Whether a life started with a pack counts on the leaderboards is still open. | Phase 9 | Lives started with a pack are marked and ranked apart. |
| 4 | ~~Which art route for portraits?~~ Answered 2026-11-25: code-drawn, improved as often as needed. | | |

---

## 3. Current state: alpha 15 analysis

Build `b593143+f150.7515a83`. I unpacked the file and ran it in headless Chrome. **This is a snapshot. Work has continued since, so re-check these numbers against the current `main` during the sync (0.2, step 3).**

### 3.1 What it is
- One 5.7 MB HTML file. About 139k lines of game code, 136k lines of events (30 event packs) and 3.5 MB of lore, compressed with zstd and unpacked at boot (about 20 MB of text in memory).
- **310 source modules** (ui 60, people 54, war 51, events 48, nobility 21, core 21, world 17, map 16, diplomacy 11, family 9, economy 2).
- **130 `A.addStage` wrapper layers and 354 baked patches.** The game is a vendored release (`vendor/ardan-b593143.html`) with numbered patch layers on top. `A.newGame` is wrapped 21 times and `A.applyFx` 37 times.
- No network at all: the page's security rule is `connect-src data: blob:`. No `fetch`, no service worker.
- Saves: IndexedDB `ardan`, four slots, localStorage fallback, gzip, versioned migrations, `.ardan` export and import.
- Art and sound are made in code (SVG portraits, canvas map, WebAudio). No image or audio files ship.
- Deterministic, with a replay journal (`A.replay`, `A.fingerprint`) and a problem-report bundle that stays on the device.
- Already has an iPhone hook (`UI.nativeDownload`), a Mods system, heavy `aria-` use and reduced-motion support.
- The old skills are 38 numeric skills (0–100), each with perks at thresholds (`GD.PERKS`), plus specialisms and rust. Fighting strength is measured as "fighting worth" in tiers (`GD.TIERS`: Untrained, Brawler, Trained, Veteran, Elite, Master, Legend).

### 3.2 Why it is too easy (what the code shows)
1. **The throne is a retryable roll.** `A.plotThrone` needs a "power" of 45. Power is built from noble rung, military rank, being of the ruling house, intrigue, fame and company size. Odds are clamped between 5% and 75% and rise as the realm's legitimacy and stability fall. The activity can be tried **once every year**, and "Wait for a better moment" in the event costs nothing. A strong character simply keeps rolling. Failure is punished by `A.punish(p, "treason")` only on the "Strike now" branch.
2. **Breakthroughs raise the ceiling with no cap.** `A.breakthrough` runs whenever you win a fight in which the foe's combat rating started more than 8 above yours. As far as the code shows, sparring is not excluded. It adds to current strength, speed, insight and stamina, **raises the potential (`pot`) of each by 70% of the gain (up to 200)**, and adds willpower. I found no lifetime limit, no cooldown and no cost in that code. Duels and sparring can each be repeated up to three times a year (with diminishing returns), and the tournament once a year. Check how a duel picks its opponent, because that decides how easy it is to find a foe 8 points above you.
3. **Difficulty settings change only dying, information and healing.** Story, Hard and Realism change child and wound mortality, whether odds show as numbers, and recovery speed. They do not change how clever the world is, how fast rivals grow, or how the world reacts to a rising player.
4. **The world does not push back.** Nothing in the code makes rulers, rivals, churches or families respond to the strongest or most famous person in the realm.
5. **The start barely changes the route.** The same activity list and gates apply to everyone, so the same sequence works from any start.

### 3.3 What I measured, and what I could not
About 40 lives with simple scripted bots (hard difficulty, human, default realm, age 16 start):

| Strategy | Lives | Result |
|---|---|---|
| Duel and tournament farming, peasant | 8 | Nobody crowned. Military rank 0. Strength 35–71. Fighting worth 30–51. 7–39 duel wins. |
| Career-seeking, noble | 8 | Nobody crowned. Military rank 3–4. One reached noble rung 6. |
| Career-seeking, peasant | 8 | Nobody crowned. Rank 2–4. Strength 40–126: one life reached **strength 126 (potential 124) after 163 duel wins**; the rest 40–84. |
| Royal, training only | 8 | **5 of 8 reached the throne by succession** at ages 41–62. |
| Mercenary company, peasant | 8 | Never reached a company battle. Rank 0–1. |

- **Highest fighting worth any bot reached: 75.** Elite starts at 77. So these bots were not "absurdly strong".
- **I could not reproduce your route from peasant to king.** Simple bots cannot. Your real runs use event choices and war that these bots do not. **I cannot prove the causes in 3.2 are the whole story.** They are the levers the code exposes.
- **I could not drive the bots into the war screens**, so I counted war structure instead of finding war bugs. Building a proper war test harness is step 2 of the war workstream.
- A life takes about 20 seconds headless, so a nightly balance run is affordable.
- Two real runtime errors appeared in the skills events: `sk_better_hand: Cannot read properties of undefined (reading 'lv')` and `sk_rival_contest: Cannot read properties of null (reading 'given')` (seven times). Find and fix both. They show the skill events are already fragile.

### 3.4 War
- **51 war modules, about 11,600 lines**, stacked as wrappers. Examples: after-action, squad and front panels, sieges, named squads, orders, rank battles, unit drill, "one battle two scales", battle labels, companies, unit work.
- A battle is queued as a screen (`type: "battle"`) and resolved by `A.battleAuto` or `A.battleClose`. Duels nest inside it.
- You describe it as undeveloped and buggy. The layered structure is the likely reason bugs are hard to find and fix.

### 3.5 Skills
- 38 skills as plain numbers. Perks switch on at thresholds (for example 40, 65 and 85 for melee). Nothing is named, ranked, rare, conditional or collectible. There is no "learn this from that person under those conditions".
- `A.skill(p, k)` is read by thousands of event checks. Any new system must keep that call working through an adapter while events migrate.

### 3.6 Seeds and saves
- The seed appears in: a "World seed (optional)" box on the creation screen; a "Copy the seed" button and seed row on the share card; "seed 48213" printed on the card; the legacy records. The `.ardan` export and import also hands over a whole world.
- The default seed comes from the clock and is 32 bits, so it is guessable and could be scanned for good worlds.

---

## 4. Foundations: repo, memory and quality

**Goal:** any new session can find its way, and any step can be retraced or undone. Check what already exists first (the 310 modules already sit in folders by system). Do not reshuffle what works, and do not move files that an in-progress branch is editing (0.2).

### 4.1 Repo layout (target)
`src/` split by system (map, people, family, nobility, diplomacy, war, events, ui); `data/` (events, cultures and names, military branches, items, skills); `assets/` (art, portraits, VFX); `tests/`; `tools/` (build, playtest scripts, coherency checks, harnesses); `docs/`; `archive/`; `.claude/skills/`. Move files with `git mv`, so their history follows.

**Only what is needed** (the owner, 2026-11-25): the repo is the game and versions of it being updated. `docs/` keeps the reference set (this file, the prompts, orders, decisions, history, status, roadmap, versions, changelog, tooling, the design notes of systems still in play) and nothing else: old plans, reports, reviews, lane files, playtest kits and scratch leave the tree (git history keeps them; `docs/HISTORY.md` records the last commit that had them). No working branches stay on GitHub. **Done when:** `docs/` holds only the reference set and `node tools/lint-docs-index.mjs` passes.

### 4.2 Memory files
- `CLAUDE.md` at the repo root, the first file any session reads: the layout, how to build, test and play, the standing rules (section 2) and pointers to the files below. Update it whenever any of these change.
- `docs/MASTER_PROMPT.md` (this file) and `docs/prompts/` (every prompt I gave you, unchanged).
- `docs/STATUS.md`: what is in progress right now (0.2), with branch, modules touched and next step. Updated every session.
- `docs/ROADMAP.md`: the working copy of section 13 and the checklist in 1.3, with a status for every row.
- `docs/HISTORY.md`, append-only: one entry per step or commit, with the date and commit or tag, what changed and why, which of my complaints it answers, the files touched, the test and coherency results, what was archived and how to undo it. Never edit old entries. Add a correcting entry instead.
- `docs/DECISIONS.md`: each important choice, what else was considered, and why. It stops later sessions from undoing good decisions or repeating rejected ones.
- `docs/IDEAS.md`: ideas, cut features, parked work and postponed work, each with a line on why it could be useful.
- `docs/CRITIQUE.md`: the harsh critique (section 11).
- `CHANGELOG.md`: player-facing changes in plain words, one section per version.
- `docs/TOOLING.md`: the skills and plugins record (section 16).
- `tests/saves/`: a sample save from each version. After every change, test that old saves still load.
- Tag a git release at every milestone, so any version can be restored or played.

### 4.3 Never throw work away
When you remove or replace a feature (the tile map, hover pop-ups, the old stats, the old war), move the old code to `archive/` with a short note on what it was and why it was replaced. Keep it out of the shipped build. Tag the last commit that still had it.

### 4.4 Fix early, because other work depends on it
1. **Lag.** The game slows down the longer you play. Profile a 50-year game, find what grows without limit (logs, dead characters, event history, map redraws and so on) and fix it, so year 50 runs about as fast as year 1.
2. **One holder per post.** Example of the bug: I was promoted to marshal but kept only a captain's command and no army, while another character also held the marshal title. Every post has exactly one holder. A promotion hands over the real command, men and powers and takes the old post away. Leaving a post has real consequences. Look for the same kind of problem in every other system.
3. **Coherency checks** after every update: two holders of one title, labels that disagree, impossible states, broken links between systems. Fix what they find before telling me the update is done.

### 4.5 How every step runs (scaled to the size of the step)
- At the start of a session, read `CLAUDE.md`, `docs/STATUS.md`, the end of `docs/HISTORY.md`, `docs/DECISIONS.md` and the skills. Read `docs/V2_SPEC.md` and `docs/CRITIQUE.md` when the step touches what they cover.
- Work on a branch, one step per commit.
- **Match the checks to the step**, so small fixes stay fast and big changes stay safe:

| Step size | Examples | Checks before merge |
|---|---|---|
| Small | One module, no save change, a bug fix | Tests, coherency checks, a scripted pass. One HISTORY line. |
| Medium | Several modules or a visible change | The above, plus a playtester agent pass with `game-ux-playtest-loop`, and a balance harness run if numbers changed. |
| Large | A new system, a save format change, a rebuild | The above, plus a short design note in `docs/design/`, a code review by a separate agent, a save-migration test, and a request for me to play it (batched with others). |

- After each step: fix what the checks find and add a regression test; add the HISTORY entry; update `docs/STATUS.md`, `CHANGELOG.md` and `CLAUDE.md` where needed.
- Aim to exceed what I ask, not only meet it.

### 4.6 Shrink the patch stack as you go
Do not do a big-bang rewrite. Each workstream retires the wrapper layers and baked patches **in its own system** while it works there, by folding them into the module that owns the function. CI counts `A.addStage` wrappers and baked patches on every push, and fails if either count rises. Record both counts in `docs/HISTORY.md` at the end of each phase.

**Proposed targets** (set the real ones from the counts on current `main`): war wrappers at zero once the new war core switches on; total wrappers under 40 by the end of Phase 6.

**Done when (section 4):** a new session can orient itself from `CLAUDE.md` and `docs/STATUS.md` alone; `docs/HISTORY.md` has an entry for every merged step; the coherency checks report zero contradictions across 100 seeded lives; a month in a 50-year game takes no more than about 1.5 times a month in year 1; the wrapper count has not risen since Phase 0. These numbers are proposals. Set the exact budgets from measurement and record them in `docs/DECISIONS.md`.

---

## 5. Interface and time

- **Descriptions open on click or tap** (a button or an info icon), never on hover. This replaces the older rule that no description may sit behind a click (Appendix C). Update `docs/V2_SPEC.md` and the `game-ux-playtest-loop` skill to match.
- **Cards.** Each month's events arrive as cards, one at a time, with everything needed on the card: odds in words and the consequences. Quiet months show a two-second toast and no card. Event text is 80 words or fewer.
- **Time.** Below the age of 12, one button: **Next year** (childhood passes by years). From 12, one button: **Next month**; Next year is gone. In war, **Next day** and **Next week** with standing orders, and battles run phase by phase. No Play button, no speed controls, no "sim a week".
- **Five places at most:** Life, You, Family, World, and War only while at war. Cut each screen down to what matters right now. Everything else sits one click deeper.
- **No percentages** for the player. Use words, pips, scales and a tipped scale for odds.
- **Faith** has no scripted chapter. Events only offer it. It appears for the clergy-born or for a player who takes it up. Piety is not a universal stat.
- **Phones first.** Check layouts at 360, 390 and 420 px wide. Touch targets are 44 px or more.
- **This shell comes before new screens.** The skills screen (section 9) and any other new screen wait until rows 3, 4, 21 and 22 of 1.3 are Done, so they are built once.

**Done when:** a scripted Playwright year opens no dialog in a quiet month; no hover pop-up exists (a test exercises every screen); screenshots at the three widths pass `ardan-ui-review`; `Play` and `simWeek` no longer exist; a test shows Next year only before twelve and Next month only from twelve.

---

## 6. People, bodies, family, nobility, diplomacy and look

### 6.1 Relationships
Start with only the people who would really be part of the life. A commoner knows their parents and siblings. A noble may add maids, nurses, tutors and the knights who guard them. New people enter through what I do: school, work, the army, court, marriage. The extended family lives in the tree and the line of succession, and fills my relationships only when I meet them. Build out households, servants, guards, mentors, comrades and rivals.

One label resolver, with strict priority: spouse, then blood, then in-law, then feudal, then bond. Status comes from all the parts, so a marriage plus a feud reads "uneasy marriage alliance". A parent is never "a mutual friend".

### 6.2 Bodies, races and fighting worth
- Real units: lift in kg ("a big hog"), sprint in m/s, march in km/day, reaction in ms, toughness in blows. Height follows growth curves from birth. Strength rises, peaks and declines. Minds are words plus rarity ("1 in N"). Skills are in section 9.
- Races have distinct bodies (giants scale by the square-cube law, orcs lift about 2.2 times a human). Ardan's human ceiling sits far above Earth's.
- Fighting worth is measured in levies: a giant is about 20, an order knight 15 to 25, and a Master-tier human with a lift near 500 kg stands level with a giant. A human can pass the normal ceiling only through a **breakthrough**, which is rare and costly (section 8, A0 and A2).
- Odds show as words plus a tipped scale. Outcomes include **blunders** (low judgment, fatigue, overconfidence) and **surges** (will, stakes, desperation). A surge win against long odds can become a breakthrough.

### 6.3 Family and succession
There is no birth-position picker. A three-generation family is generated (uncles, aunts, cousins, their offices and claims). The line follows the house law (male-preference, absolute, agnatic, seniority or elective) and an optional "pass over the unfit" rule. One holder per title.

### 6.4 Nobility
Per realm: at most 3 dukes; at most 6 marquises (2 to 3 per duke, on the borders); one count per county; 2 to 3 viscounts per count; 2 to 4 barons per viscount; 3 to 6 lords per baron. Named nobles are created for dukes, marquises and counts, and lower tiers are made on demand. A 30-county realm has about 1,000 nobles.

### 6.5 Diplomacy
Relations are sums of named reasons that change every month (incidents, favours, common threats, marriages, new rulers). Show them as "Drawing together" and "Pulling apart". World news is filtered by what I could know. **Gap to close:** wars move no provinces yet, and allies are not pulled in.

### 6.6 Renown and promotion
Deeds are weighted by the odds beaten and by the witnesses. Renown is dominated by the best deeds. Promotion is a monthly chance driven by vacancies, standout deeds and patrons, and a great deed can skip a rank.

### 6.7 Names and cultures
Model cultures and names on real ones from all over the world. Humans are mainly white and European to fit medieval times, with diversity where it makes sense (trade cities, borderlands, distant realms, other races).

### 6.8 Character design (high priority)
Every character looks and feels like an individual: face, build, age, scars, clothing by class and culture, and personality showing through. Study character art, VFX and UI/UX from the best games. Build layered portrait parts that age (they can become shop items later) and event illustrations. I ordered this as a high priority, so it runs as a **parallel track from Phase 1** (section 13), not only in the late content phase. Build the character appearance data (which parts, how they age, what culture and class change) before any art, so art plugs into it. The art route is priced and decided with me first (open question 4 in section 2).

**Done when:** the kinship, noble-count and one-holder tests pass on 30 seeds; no event text contains a "mutual friend" error; a new commoner life starts with only their household; in a side-by-side screenshot of 20 characters I can tell them apart by face and clothing.

---

## 7. Map

**The map, redesigned and then locked (order 84):** I may change it as I see fit: as big as it needs, realms and places where they belong, room for the legends' domains (the dragons' heights, the demons' lands, the sea's lord). The designed continent of the owner's picture (M1, `work/m1`) is the base. **Once the redesign is merged, the map is locked:** places may be added later, the land, seas, borders of the ground and realm positions are not edited again. Put to the owner once, with renders, before the lock.

- **One connected continent**, made by procedural plates, erosion, climate and rivers, with sea all around and no land touching the frame. Satellite-style rendering with zoom detail and cloud drift. Rivers and borders are canvas vectors, and zoomed regions render at a higher scale.
- **The Great Continent and the Far Lands are removed from play.** The lore may remain as rumour only. Ardan's realms keep their identities, but the map decides the borders. **Open:** the build still mentions the Great Continent 35 times. Ask me which stands (section 2, question 1).
- **Detail that matters:** borders and border information, trade routes, roads, rivers, fords, passes, forests, marshes and towns. Terrain changes movement, supply and battles (section 10). Build terrain as data the war core can read, so war depth (Phase 5) reuses it rather than redoing it.
- Use and keep updating the `realistic-continent-maps` skill.

**Done when:** the tests `one continent` and `no land touches the frame` pass; no realm or province lies outside the continent; a march across a ford, a pass and a marsh each shows a different, visible cost.

---

## 8. Workstream A: difficulty and progression

**Goal:** the start matters, the world fights back, strength is rare, and a crown is hard and different by route.

### A0. Stopgaps now (Phase 1)
The full redesign (A2 to A4) needs the skill system first. Until then, close the worst exploits with small changes, so every playtest from now on is closer to the real game:
1. **Breakthroughs:** no rise in `pot`, or a small capped one; at most 3 in a lifetime; at least 2 in-game years apart; sparring never triggers one.
2. **Throne plot:** "Wait for a better moment" uses up that year's attempt and costs standing; at least 5 years between attempts; failure on any branch has consequences; a lower odds ceiling (for example 40% instead of 75%).
3. **Duel opponents:** check how they are chosen. A foe 8 or more above you must not be easy to find on demand.

Rules: change the module that owns the code (no new wrappers); mark each change `STOPGAP: replaced by A2`; record it in `docs/DECISIONS.md`; measure each one with the balance harness before and after. The numbers are proposals. Tune them from the harness.

### A1. Measure first
Build the balance harness (Appendix A) in `tools/balance/`. Run it in CI nightly and on demand. Keep several strategies: random, greedy, duel-farmer, careerist, courtier, mercenary, and a replay of my winning run (see the first session script).

**No target numbers for a crown or for the top of a skill (order 83).** The harness measures each start's crowns and its best skill levels so a change that makes them easier shows, but nothing is banded to a number: the measure of a crown is how hard the road is, not how often it is reached. "Master" and "Legend" are not measures (levels only, order 78).

CI fails if any strategy beats a target by a wide margin.

### A2. Close the exploits for good
1. **Breakthroughs become rare and costly.** A lifetime budget (about three to five true breakthroughs), a cooldown of years, a real chance of crippling injury or death that grows with the gap, and a hard ceiling from the body model. Remove the unlimited rise in `pot`.
2. **The throne is not a roll (and for an outsider it is as complicated as it truly is, order 83):** what one person would really need: a claim or a cause men accept, lords won one by one for their own reasons, coin, swords that obey him, the church's nod or its silence, the moment, and survival after. **The throne is not a roll.** Replace the `power` number with a coalition of **named people**. Each lord and officer has an opinion, an ambition and a price. A plot needs recruited conspirators found through relationships, money or favours. One attempt per lifetime for most routes. Failure is severe: execution, exile, an attainted house, or a civil war you lose.
3. **Routes differ by start.** Add the prerequisites that make a peasant's road to a crown different from a noble's and a prince's: legitimacy, claims, church backing, treasury, army loyalty, marriage alliances.
4. **A crown is the start of the hard part.** Make ruling harder than rising: succession wars, debts, revolts, vassal leagues, foreign wars, plots against you, an heir problem. Check that the realm and diplomacy systems scale up when the player rules.

### A3. The world pushes back
- A **Notoriety** value for the player: strength, fame, deeds, company size and wealth. Rulers, rival champions, families, churches and neighbours react to it with named people and scenes: summons, rivals, assassins, offers, blackmail, tests of loyalty.
- Opponents for duels and tournaments scale to the player's worth, with real lives and grudges behind them.
- Difficulty settings change **the world's competence** too: rival growth, AI quality in war, check difficulty, how fast notoriety draws a response. Add a harder top setting.
- Events and checks scale with the player's real standing, not only age.

### A4. Pace
Keep the diminishing returns on repeated activities (`A.DIM`). Add fatigue, injuries and ageing that bite earlier. Make skill rust matter.

**Exit criteria:** the A0 stopgaps are replaced and removed; the harness meets the targets for every strategy; my winning-run replay no longer reaches a crown by the same sequence; I play three lives from different starts that feel different.

---

## 9. Workstream B: the skill system (game-like)

**What changed (2026-11-25).** This model replaces the S1 skills of order 63 (28 skills, 35 levels in seven words, concepts, proofs): the newest instruction wins. Skills **merge, advance and evolve**, and the world holds **a great many of them** (the scale of a fantasy world where nearly everyone has a few and the great have dozens, common skills combine into rarer ones, and the rarest are one of a kind). **Stats and skills stay separate:** the six stats (strength, speed, insight, stamina, intellect, will) are the body and mind, grown by age, training, food and wounds, and shown on their own; skills are what a person can do. A skill may ask for a stat as a condition; an ordinary skill never adds to a stat (only blessings, curses and racial skills may). What S1 built is reused where it serves this model (experience earned by doing fills a level; its concepts become conditions for evolving), and its 35 levels, seven words and proofs retire to `archive/`.

### B1. What a skill looks like
Every skill shows as a card, for example:

- **Basic Swordsmanship** — C-Rank Skill — Lv 3
- **Blake Family Hidden Swordsmanship** — A-Rank Skill — Lv 1
- **Gifted Leader** — B-Rank Skill — Lv 4
- **Sun God's Blessing** — S-Rank Skill — Lv 7
- **Beginner Footwork** — D-Rank Skill — Lv 6

The card shows: name, rank letter, level out of 10 as pips, kind, category, rarity gem, what it does **at this level**, a preview of the next level, how it was gained, and its conditions. No percentages. The rank letter carries meaning without colour.

### B2. The model
- **Rank = power band:** D, C, B, A, S. A higher rank has a bigger effect budget per level and needs far more experience per level.
- **Level = progress inside the skill:** 1 to 10. Level and rank are independent: a D-rank skill can be level 6 and an S-rank skill level 7. The level thresholds grow steeply with rank.
- **Rarity = how hard it is to find:** Common, Uncommon, Rare, Unique (only one living holder, which fits the one-holder rule) and Legendary (once per age).
- **Kind:**
  - passive (always on)
  - active (used on purpose, with a cost and a limit per duel, battle, month or year)
  - reaction (fires on a trigger)
  - aura (affects the people you command, at squad, company or army scale)
  - blessing (granted by a god, a patron or a bloodline, and can be lost)
  - flaw or curse (a negative skill)
- **Slots:** a limited number of active skills can be readied at once. It grows with the mind, rank and age. Passives and auras have no slot limit but are capped by the stacking rule below.
- **Evolution:** a skill can evolve at level 10 into a higher-rank skill if its conditions are met (Beginner Footwork D → Footwork C → Fleet Fighter B).
- **Merging:** several held skills can fuse into one stronger skill when their conditions meet (Swordsmanship + Footwork + Battle Sense → a named sword art), and the parts are absorbed into it. Some merges are known recipes, some are found by chance in a crisis, and a few happen only once in an age.
- **Levels and stat points (order 80):** a person has a level on the one ladder every being shares (17), gained in every walk of life, not only war. Each level gives **stat points the player allocates** among the six stats, inside his race's ceilings and his body's state (age and wounds still bound them). **Skill training** is the player's choice on its own screen: a skill, a way (alone, a master, a school, a book), time and coin, odds in words.
- **Titles (order 79):** a system beside skills. Earned, never bought; very hard to get; their requirements are **hidden** (at most a rumour hints at one); they **stack**, each giving honour and buffs or stat boosts, held under the same power budget and stacking caps as skills so a stack cannot snowball; one-of-a-kind titles have one holder. People and the great beings hold them too. **Done when:** a title is earned in a bot life by meeting hidden conditions it was never shown; two stacked titles stay inside the caps.
- **Levels, not words (order 78):** the player reads a skill's rank and level, never "Master", "Legend" or the other tier words; honours such as "master swordsman" are titles given for deeds, not the measure.
- **Advancing:** a skill can also be awakened at a higher rank by a deed, a near-death or a blessing, without passing through every level (rare, and always with a named reason).
- **Rust:** unused skills slip. Rust already exists, so reuse it.
- **Teaching and inheritance:** each skill says whether it can be taught, inherited, stolen, sold, lost or only earned.

### B3. Effect vocabulary (data-driven)
Effects are built from a small set of types, so thousands of skills need no new code:
- **stat**: a change to a body or mind stat.
- **edge**: a step up or down on checks with a tag (for example `persuasion`, `command`, `stealth`). It feeds `attempt()`.
- **fight**: a change to duel edge or to a part of fighting worth, per weapon or style.
- **blunder / surge**: lowers blunders or raises surges.
- **aura**: morale, discipline, speed or supply for units you command, by scale.
- **trigger**: when something happens (a win, a wound, dawn, outnumbered, defending home), apply an effect.
- **active**: a move with a cost (stamina, time, coin), a limit and an effect.
- **economy**: income, upkeep, training speed.
- **social**: opinion with a group (soldiers, clergy, peasants, nobles) or a reputation tag.
- **resist**: wounds, poison, fear, illness, mind effects.
- **unlock**: new activities, choices, tactics, titles, orders or teachers.
- **growth**: faster learning for tagged skills.

**Power budget.** Each rank has a points budget per level (for example D 1, C 2, B 4, A 8, S 16, tune later). A validator rejects any skill that spends more than its budget. **Stacking cap:** total edge on one check, and total fight bonus, are capped, and repeated sources give diminishing returns. This is what stops the "absurdly strong" snowball.

### B4. How skills are acquired
Each skill lists one or more acquisition routes, and each route lists its conditions. Conditions can include:
- stat or skill minimums (for example Basic Swordsmanship at C, Lv 5)
- an age window
- race, culture, faith or house
- a teacher of high enough rank, and the months of study
- a place (a monastery, a battlefield, a master's hall)
- an item (a manual, a relic, a weapon)
- a deed (win against a higher-ranked foe, hold a gate, survive a beast)
- an event flag (survived near-death, was chosen at a festival)
- an office or title
- devotion to a god, or a patron's favour
- a trait or a talent (hidden at birth, revealed by use)
- evolution from another skill

Routes are **discoverable**: rumours, teachers and books point the player at them. Some are hidden until found. The start matters: a noble child has tutors and house secrets; a peasant has hard-won common skills and rare luck.

Examples of routes: training with a teacher (Blake secret: bloodline or adoption, a house tutor, three secluded years, and a prior sword skill); a deed (Gifted Leader: three victories against the odds as a captain or above, or an inborn talent revealed on the first command); a blessing (Sun God's Blessing: a devout follower chosen at the solstice after leading the faithful to victory at the holy site, one holder at a time, lost if you turn apostate or commit a grave sin).

### B5. Categories (start with these, add more as the game grows)
Combat (a weapon art per weapon and per culture's tradition, defence, mounted, ranged, unarmed, duelling), Body (endurance, footwork, toughness, recovery), Mind (focus, memory, learning), Command (leadership, drill, morale auras, tactics), War and Siege (logistics, siegecraft, scouting, engineering), Stealth and Intrigue (infiltration, assassination, espionage, forgery), Social (persuasion, diplomacy, intimidation, etiquette, charm), Governance (stewardship, law, taxation), Economy and Craft (trade, smithing, building, farming), Wilds (survival, tracking, beast-craft, seamanship), Medicine, Faith and Blessings, Bloodline and House Secrets, Racial, Unique and Legendary, Flaws and Curses. Magic is in (section 17): **Magic** (one ladder per element and school), **Spirit and Bond** (contracts, familiars), **Monster** (skills of non-human kinds) and **Resistance** join the list.

### B6. How many, and how to build them
"Countless" means a large library, built mostly from templates:
- Convert the 38 old skills into ladders of ranked skills (D → S), and turn each old perk into a named skill.
- Weapon arts per culture and tradition.
- A **hidden skill for every noble house**, generated deterministically from the house, with a unique name and a conditional route. Lost if the house dies out, and open to theft and sale.
- Blessings per faith and god, one holder at a time.
- Skills tied to offices and titles.
- Beast-craft, racial, and trauma-born skills (born of near-death, a long siege, a betrayal).
- Flaws and curses.
- At least **60 hand-written Unique and Legendary skills**.

**Targets:** about 200 skills in the first release of the system, 500 in the next, and **thousands at completion** (order 82), each fully specified (cooldown, mana or stamina, damage or effect, duration, conditions; no range: skills are used in combat or training, a rare exception at the designer's call, order 83); ranks D to SSS, a god's above; evolved skills stay beside their evolution, merges absorb their parts; stats rise by levels, skills and titles by action and training; an evolution in any area may bring explosive growth or extra points. The first wave counted toward 1,000, counting magic and monster skills. Keep skills in data files (`data/skills/`).

### B7. Build order
Steps 1 to 3 need no interface, so they can start while the shell (section 5) is being finished. Step 4 waits for the shell.
1. **Schema and validator** (Appendix B). Tests: every skill reachable, every prerequisite exists, no skill above its power budget, no orphans, no skill that can only be reached through an exploit loop, rank distribution as intended.
2. **Adapter.** Keep `A.skill(p, k)` working: derive its number from the skills the person holds. Do not break the thousands of event checks. Events then migrate gradually, as they are touched or pruned. Never migrate them in one big batch.
3. **Migration.** S1's skill levels, talents and knacks, and the old perks, become ranked skills and levels, once, with a save migration step and a test save from each version.
4. **UI.** The skill card, a skills screen with category tabs and filters, readied actives, and a "how to learn" view. Descriptions open on click. Make it good on a phone.
5. **Wire into systems.** `attempt()`, `fightWorth`, teaching, inheritance, theft, title and office unlocks. War units and auras hook into the new war core (section 10), not into the old war modules.
6. **Fill the library** in the waves above, with a data review after each wave.
7. **Fix the two skill-event errors** from 3.3 in Phase 0, before the rest.

**Exit criteria:** the five example skills work end to end; a new life shows named, ranked skills apart from its stats; at least one evolution and one merge happen in a bot life for a reason the log names; every route can be followed in a test; S1's level words and proofs are archived and every old save loads.

---

## 10. Workstream C: war

You say it is far too undeveloped and buggy. Fix the structure first, then add depth.

**Freeze until the new core switches on:** the current war modules get bug fixes only (crashes, stuck queues, wrong numbers that block play). No new war features on the wrapper stack, because the consolidation replaces it.

**Rules that carry over and must hold in the new core:**
- War screens exist only while I am deployed. A war I am not in produces only rumours, delayed and sometimes wrong.
- When I am in a war I play my rank: soldier, sergeant, captain or commander. Odds are rated against the unit or commander I actually face. Soldiers see only estimates. An after-action report gives the top three causes.
- Elite orders: five orders of 150 to 350 sworn members, each member worth 14 to 26 levies plus terror. Joining takes three trials.
- Keep what works in the old war code (the division simulator and the four-phase battle) inside the new core, proven by the harness.

**Steps:**
1. **Map it.** Write `docs/design/war-architecture.md`: every war module, every function it wraps (`A.addStage` names), every screen, and every place war touches people, family, diplomacy and events. (A side track during Phases 1 and 2. It changes no code.)
2. **War test harness.** A headless harness that creates wars and runs thousands of seeded campaigns, battles, sieges and duels with no UI. It checks invariants: men are conserved, no NaN, supply never negative, one commander per unit, every battle ends, the queue never sticks, no unit is in two places. Log every error and every console error. This finds the bugs I cannot describe. (Also a side track during Phases 1 and 2, in new test files only.)
3. **Build the new core alongside the old one.** Pure, seeded functions in new files, behind a flag, with a thin UI on top. Run the harness on both, and compare. (Start as the side track in Phase 4.) When the new core passes and matches the behaviour worth keeping, switch it on, archive the old modules and remove their wrappers.
4. **Deepen** (in this order): the detailed map and terrain, reusing the terrain data from section 7 (borders, roads, rivers, fords, passes, forests, marshes, towns, supply); the military branches (heavy lancers, mounted men-at-arms, knights on foot, a Scout Regiment, infantry, archers, crossbowmen, siege engineers, garrisons, levies, mercenaries, elite orders, each with ranks, training, gear and missions); then flanking, stealth, attrition, blockades, encirclement, sieges, supply lines, ambushes, scouting and intelligence.
5. **Tie it to skills and difficulty.** Command, tactics, logistics, scouting and auras (Gifted Leader) change real outcomes at squad, company and army scale. Enemy AI has doctrines per realm and gets better on harder settings.
6. **Make mercenary and company routes real.** In my test the mercenary route never reached a battle. Check that the road from soldier to captain to a company to land is open and fair. It is also the peasant's only road to a crown (section 8).

**Exit criteria:** the harness passes thousands of seeded wars; the old war modules are archived and the war wrapper count is zero; I play a war from soldier, captain and commander and it feels deep and fair.

---

## 11. Keep studying: the research loop

"Keep on studying solutions and improvements to every aspect of the game" is a standing order.

- **At the start of each phase**, do a short research pass on how comparable games and systems solve that phase's problem. Keep it to about half a day, aimed at decisions you are about to make. Examples: Crusader Kings 3 (succession, opinions, claims), Mount & Blade Bannerlord and Battle Brothers (armies, companies, tactics), Wartales and Kenshi (rise from nothing), Dwarf Fortress (descriptive stats), Disco Elysium (skill checks), RimWorld (a story generator that pushes back), Skyrim and Path of Exile (perk and skill trees), BitLife (the life loop), and RPG status screens and skill cards. Write what you learned in `docs/research/` with sources.
- **At the end of each phase**, critique the game harshly again from the view of designers, developers, artists and programmers. Add to `docs/CRITIQUE.md` as a list of flaws rated out of 10, each with a fix. Add cut features and good ideas to `docs/IDEAS.md`.
- Use the `game-ux-playtest-loop` skill as set out in 4.5. Update or create skills for anything learned the hard way (balance harness, war harness, skill schema, content generation).
- **Look beyond what I listed.** If you find a better solution to a problem than the one I wrote, propose it with the reason.

---

## 12. Platform plan (no Mac)

**Do the platform work after the gameplay phases pass, except for the cheap items marked "now".** There is no point polishing store and backend work for a game that is about to change.

### 12.1 Order
**Now (Phases 0 and 1):** protect the repo, tag the current build, add CI, remove seed leaks, remove export and import in release builds, build the balance and war harnesses, and a one-time phone smoke test.
**Later:** playtests, backend, apps, store, launch. Start the long lead-time items early (13.4).

### 12.2 Seeds and saves
- Remove the seed box, the copy button, the seed text on the share card, and any seed in a player-visible record. The share picture can stay.
- Use a random seed from `crypto.getRandomValues` for casual lives. For ranked lives the server picks the seed, so players cannot choose a world.
- Add a Playwright test that opens every screen and the share path and fails if the current seed appears.
- Honest limit: the game runs on the player's device, so a determined person can read the seed from memory. The goal is that the game never offers a way to share it and that ranked results cannot be faked.
- Saves live in IndexedDB plus a native-storage mirror in the app, and in the cloud for signed-in players, owned by the account with Row Level Security.

### 12.3 Backend (when the gameplay phases pass)
- **Supabase:** Auth, a database with Row Level Security, Storage, Edge Functions. Add only the project's address to the game's `connect-src`, in the build step (the script hashes change on every build). Load the client in one module. The publishable key may go in the repo; the `service_role` key never does.
- Tables: `profiles`, `saves`, `reports`, `runs`, `leaderboard_entries`, `entitlements`.
- **Leaderboards by replay:** the server issues a seed, the player plays, the app uploads the replay journal, the server replays it on the same engine version and compares the fingerprint and score. Pin the engine version per season. This needs a headless build of the simulation (the balance harness in Phase 1 is a first step towards it); check how long a replay takes and use a small worker if an Edge Function is too slow.
- Display names need a filter and a report button.
- Set up your own email sender before launch.
- Add a privacy policy and terms pages (GDPR, and both stores need them).

### 12.4 Apps without a Mac
- Wrap the built HTML with **Capacitor** (the current major version). Android builds on any computer with Android Studio.
- **iPhone builds need Apple's tools.** Without a Mac, research and propose the best current route, with price and steps, for me to choose. Candidates to check: a cloud build service built for Capacitor; GitHub Actions macOS runners with Fastlane; a rented cloud Mac. Check current availability and cost first.
- Finish `UI.nativeDownload` with Filesystem and Share for the share picture. Mirror saves to native storage, because the OS can clear WebView storage. Add haptics, status bar, splash screen and app lifecycle handling.
- Memory is the main phone risk (20 MB of text at boot). A quick smoke test in Phase 1 shows whether this is a problem early. Measure properly on an older iPhone and a cheap Android in Phase 7, and cut if needed.
- Live updates for web-layer fixes without a store review (check current tools: Capgo and Capawesome are candidates).

### 12.5 Store
- Apple Developer Program (check the current fee), App Store Connect, TestFlight.
- Google Play Console (check the fee). Check the current rule for new personal accounts: when I last checked, they had to run a closed test with at least 12 testers for 14 continuous days before publishing. **Start collecting testers during the playtest phase.**
- Both stores need a privacy policy and a support link. If I offer any social login, Apple needs Sign in with Apple. The backend must be live during review.
- **Game packs.** The shop sells packs that give more allowances in a life, for example editing your birth or choosing your station. Check the stores' current rules for paid digital content before designing them.
- **The rest of the shop is deferred.** When I decide, both stores require their own billing for digital goods, randomised paid items must show their odds before purchase, purchased currency must not expire, and there must be a way to restore purchases. Recommended defaults: no randomised paid items; nothing bought changes the simulation or a ranked result. Use a purchase service (RevenueCat is a candidate) with a webhook into the `entitlements` table. Do not build any of this until I say so.

---

## 13. Roadmap and order of work

### 13.1 How work is ordered (priority rules)
**Descending order of effect on the game as it is today** (the owner's answers of 2026-11-25): what changes the current game most, and what the most later work depends on, comes first. When choosing what to do next, apply these in order:
1. **Keep `main` playable and releasable.** A broken build or a broken save is fixed before anything else.
2. **Bugs the owner meets in play** (his lives: the alpha 9 survey, the Emilio life of 1105 to 1108, `docs/design/emilio-1108-findings.md`) and the open exploits (breakthroughs, the throne plot): they change every life now. Fix current issues before new ones (order 54).
3. **The power scale and the bestiary (section 17, its first wave; order 77):** now, beside the last of Phase 1.
3b. **The map redesigned and locked (section 7, order 84):** the base the legends, habitats and lore are placed on; right after the power-scale wave lands.
4. **The skills rebuild (section 9),** with stat points per level, skill training and titles. The owner's top complaint is linear growth, and magic, difficulty and war all sit on it.
5. **Professions and pathways (section 18):** blacksmithing and weapons, trade and business, and many roads beyond combat; they sit on the new skills.
6. **Magic, races and the rest of section 17.** The largest change to the world; it begins only once the skills are done, and difficulty and war are tuned after it, not before.
7. **Difficulty and progression (section 8),** measured on the world with skills and magic in it.
8. **War (section 10).** Bug fixes only until its rebuild.
9. **Content, art and depth;** then phone, playtesters, backend, apps, store, launch.
10. **Skills and tools are refined whenever the owner adds new ones (section 16),** before the work that uses them.
11. **Never polish what will be rebuilt.** **Limit work in progress:** one main workstream, at most one side track on different modules; a fix under a day can jump the queue.
12. **Ask for the owner's decisions before they block,** batched; work around them until then. **Start long lead-time items early** (13.4).

Tie-breaker: the value to the player divided by the effort, plus how much later work it unblocks.

### 13.2 Critical path
```
Finish Phase 0 ─► Fix what play shows (bugs, exploits, measure) ─► Skills rebuild ─► Magic, races, monsters ─► Difficulty ─► War ─► Content
                                                                                                                                   │
                                                                                                                                   ▼
                                                                                 Phone ─► Playtesters ─► Backend ─► Apps ─► Store ─► Launch
Side tracks, under the limit in 13.1:
  Phases 1–2: war map + war harness (no game code changes); portraits improved again and again (6.8)
  Phase 3:    the map decision (M1 and the owner's critique) is put to the owner when the world's canon is rewritten
  Phase 4 on: new war core built alongside the old one, behind a flag
  Phase 6 on: event pruning and migration; recruiting testers
```

### 13.3 Phases
Each phase has its work and exit criteria. **After every phase, and after every prompt the owner adds (section 1), stop and re-plan:** update `docs/ROADMAP.md` with what changed, what is cut, what is new, and what the owner should decide. Prepare the next phase (research, design notes, tests) while waiting for his agreement to switch.

*Phase numbers changed on 2026-11-25 (the owner's answers): the magic phase became Phase 3, so the old Phases 3 to 11 are now 4 to 12.*

#### Phase 0 — Skills, sync and protect (finishing)
- Done: the master prompt saved; the tooling review (`docs/TOOLING.md`); the three Ardan skills; the sync (`docs/STATUS.md`, `docs/ROADMAP.md`); the batched questions, answered.
- Left: fold the useful parts of the plugins into the Ardan skills and switch the rest off for this repo (16); bring GitHub's `main` up to date and make it the one trunk; clear the repo down to what is needed for reference (4.1); archive the two dropped features (82-early-years, 9995-trade-roads); the wrapper and patch count gate (4.6); save-compat tests; fix the two skill-event errors (a skipped card's choice still runs); the seed and export behind a developer flag (low priority: no players yet); Dependabot and secret scanning (the owner's settings).
- **Exit:** `main` green and current; the repo holds the game, its tools, its tests and its reference docs only; the gate and save-compat tests run in CI.

#### Phase 1 — Fix what play shows, and measure (about 1–2 weeks)
- Every bug in `docs/design/emilio-1108-findings.md` and the alpha 9 survey's open lines, each with a test.
- Close the two exploits for good or with stopgaps (A0, A2): breakthroughs and the retryable throne plot.
- The balance harness (Appendix A) and `docs/BALANCE_BASELINE.md`; replay the owner's lives as tests.
- Next year for childhood only, Next month from twelve (5).
- One-time phone smoke test (check the cost first).
- **Exit:** every finding fixed or ruled out with a reason; the exploits closed; the baseline measured.

#### Phase 2 — Skills rebuild (about 4–6 weeks)
- Section 9: the schema and validator, the adapter, the migration from S1, the skill card and screen, wiring into checks and fights, evolution and merging, the first 200 skills.
- **Exit:** see B7.

#### Phase 3 — Magic, races, monsters and legendary beings (long; several waves)
- Section 17. Starts when Phase 2's exit is met. Includes the canon rewrite and, with it, the map decision put to the owner.
- **Exit:** see section 17.

#### Phase 4 — Difficulty and progression (about 3–4 weeks)
- Workstream A (A2 to A4) on the world with skills and magic. Remove the A0 stopgaps as their replacements land.
- Side track: the new war core built alongside the old one, behind a flag (C3).
- **Exit:** see section 8.

#### Phase 5 — War (about 4–6 weeks)
- Switch on the new war core, archive the old modules, then deepen (C4 to C6), with magic and monsters in war.
- **Exit:** see section 10.

#### Phase 6 — Content, art and depth (runs through the rest)
- Grow skills to 500, then 1,000 or more; spells, races and monsters likewise (17). Prune and migrate events as they are touched. Portraits improved as many times as needed (6.8). Map detail (7) and military branches (10).

#### Phase 7 — Phone readiness (about 2–3 weeks)
- Profile a 50-year game for memory and long frames. Test on real devices. Fix layout and touch problems.

#### Phase 8 — Real playtesters (about 2–3 weeks)
- Publish each merged build for testers (check cost and privacy options). Collect feedback. Recruit at least 12 Android testers.

#### Phase 9 — Accounts, cloud saves, leaderboards (about 5–6 weeks)
- Section 12.3. Only after Phases 2–5 pass.

#### Phase 10 — Apps (about 3–5 weeks)
- Section 12.4.

#### Phase 11 — Store (about 3–4 weeks)
- Section 12.5: the game packs (birth editing, choosing a status and the like).

#### Phase 12 — Launch and live operation
- Live updates, crash and error reports (ask the player first), seasons for leaderboards with the engine version pinned, a community channel.

Week counts are rough guesses. **Re-estimate at every checkpoint.**

### 13.4 Long lead-time items (start them early)
These run on calendar time, so start them before the phase that needs them. Check each current rule and price first.

| Item | Why it takes time | Start by |
|---|---|---|
| Art route for portraits (6.8) | An illustrator or pipeline needs choosing, pricing and briefing | Phase 1 (plan), Phase 2 (decide) |
| Name check for "Ardan" in both stores and as a web address | A clash forces a rename late | Phase 6 |
| Recruiting 12 or more Android testers | Google's closed test runs for weeks with a minimum number of testers | Phase 6 (recruit), Phase 10 (start the test) |
| The iPhone no-Mac route | Accounts, setup and a first successful build | Phase 8 |
| Apple Developer enrolment | Verification can take days or longer | Before Phase 10 |
| Privacy policy and terms | Needed for the backend and both stores | Draft in Phase 8 |

---

## 14. Tools and services, by phase

| Tool or service | Phase | What for, and how |
|---|---|---|
| GitHub, Claude Code (have) | 0 | Repo, branches, tags. Keep `CLAUDE.md`, `docs/STATUS.md` and the docs current. |
| GitHub Actions | 0 | Tests, build, budgets and wrapper counts on every push. A nightly cron runs the balance and war harnesses. |
| Playwright with headless Chrome | 0 | Scripted play and screenshots. Use `bypass_csp: true` for test control only, never in a release. |
| Dependabot, secret scanning | 0 | Switch on in the repo settings. |
| Balance harness, war harness (build) | 1, 2 | Appendix A. Nightly reports in `docs/`. |
| Skill schema validator (build) | 2 | Appendix B. Runs in CI. |
| Chrome DevTools, Lighthouse | 1, 6 | Smoke test in Phase 1; memory and frame profiling in Phase 7. |
| Real phones: one older iPhone, one cheap Android | 1, 6 | Nothing replaces these. |
| GitHub Pages or itch.io | 7 | Playtest web builds. |
| Google Form or GitHub Issues | 7 | Feedback. |
| Supabase (Auth, database, Storage, Edge Functions) | 8 | Section 12.3. |
| Your own email sender (for example Resend) | 8 | Supabase's built-in email is for testing. |
| Sentry (or Supabase logs) | 8 | Error reports, with the player's permission. |
| Privacy policy and terms pages | 7, 8 | Host on GitHub Pages. |
| Capacitor, Android Studio | 9 | Apps. |
| iPhone build route (to be chosen) | 7, 9 | Cloud build service, macOS runners with Fastlane, or a rented cloud Mac. |
| Capacitor plugins: Filesystem, Share, Haptics, Status Bar, Splash Screen, App | 9 | Native behaviour. |
| Icon and splash generator | 9 | One 1024 px source image. |
| Live-update service | 9 | Web-layer fixes without review. |
| Fastlane | 9 | Automates builds and uploads. |
| Apple Developer Program, App Store Connect, TestFlight | 10 | iPhone release. |
| Google Play Console | 10 | Android release and the closed test. |
| SVGO, Inkscape or Figma, Krita | 2, 5 | Art pipeline. |
| Purchase service (for example RevenueCat) | later, on my say-so | The shop. |

---

## 15. First session script

1. **Reach a safe point** in any work already in progress (0.2, step 1).
2. Read this whole file, then `CLAUDE.md`, the end of `docs/HISTORY.md`, `docs/DECISIONS.md`, `docs/V2_SPEC.md`, `docs/CRITIQUE.md` and the skills.
3. Save this file as `docs/MASTER_PROMPT.md` and keep the raw prompts in `docs/prompts/`.
4. **Refine the skills and tools first (section 16, top priority).** Do the inventory and the batch review (16.0 and 16.6) and send me the Keep / Merge / Remove table. While you wait for my yes, write the three Phase 0 Ardan skills (they only add, they remove nothing). Disable the removals once I confirm.
5. **Sync** (0.2): write `docs/STATUS.md` with a verdict for every piece of work in progress, and re-check section 3 against current `main`.
6. Run the carry-over checklist (1.3).
7. Send me **one batched message**: the sync result; the checklist result; the open questions with their "needed by" (section 2); a request for a **save from one of my alpha 15 runs where I became king** (Menu, then Export save file) to put in `tests/saves/` as the exploit to reproduce; and **YOUR NEXT ACTIONS**.
8. Without waiting for my reply, carry on with the Finish items and the Phase 0 safety nets.

---

## 16. Skills, plugins and connectors: keep, merge, remove

**This is the top priority.** Do it right after reaching a safe point (0.2, step 1), before the sync and before any other work. Every later step runs through these skills, so cleaning them up first makes the rest of the journey faster and more accurate.

**Done when:** every installed skill, plugin, agent and connector has a Keep / Merge / Remove verdict that I have confirmed; the removals are disabled; `ardan-prompt-intake`, `ardan-dev-process` and `ardan-ui-review` exist and each triggers correctly on three sample requests; the breakthrough line in `life-sim-systems` is fixed; `docs/TOOLING.md` records the before and after counts.

**Why.** Every installed skill puts its name and description into Claude's context on every session. Many skills with overlapping descriptions make Claude pick the wrong one or skip the right one. My account first had about **163 skills, 3 agents and one connector with 200+ tools**. A later count found **about 457 skills across 31 plugins plus 17 account skills**, the agentic-council and backend-design agents, and the Vercel, Supabase, Cloudflare and Google Drive connectors. Most are built for other kinds of projects. Ardan is a single-file browser game on GitHub, with Supabase later, so only a small set helps.

**16.0 Check first.** This inventory comes from a Claude.ai chat session. Your Claude Code session may list different things. List what is installed there (the plugin manager and the skill list), compare it with the tables below, and tell me about any difference before you change anything. **I have since added many more plugins** (for example agentic-council, backend-design, mattpocock-skills, vectorlab-ux-skills, zizi-skills, ui-consistency, ui-ux-behaves, design-skills, game-trend-skills, expo, cloudflare, remotion, arcads and meshy-3d). Review them as one batch with section 16.6, and recount the totals in 16.5.

**How to change things safely**
1. **Disable, do not delete.** Everything must be easy to turn back on. Record each change in `docs/TOOLING.md`: what, why, and how to re-enable.
2. **Skills that come from an installed plugin cannot be edited.** To keep their good ideas, write a new skill with a new name in `.claude/skills/`, test it, and only then disable the old one.
3. **Merge procedure for each new skill:** read the source skills in full; keep only the rules that apply to Ardan; drop generic filler and duplicated flows; give the new skill **one clear job** and a description that says when to use it and when not to; check that it triggers on three sample requests (the `skill-creator` skill can run these checks).
4. **Licences.** Check each plugin's licence. Write the ideas in your own words instead of copying text.
5. **Measure.** Count the skills and the context the skill list uses before and after, and write both numbers in `docs/TOOLING.md`.
6. **Project rules win.** If a general skill says something that clashes with this prompt (for example "check a skill before every reply", or a plugin that injects always-on instructions at the start of every session), this prompt wins.

### 16.1 Remove (disable)
| What | Count | Why |
|---|---|---|
| **Databricks** plugin | 36 skills | A data platform. Ardan has no warehouse, jobs or model training. |
| **Unity** plugin | 33 skills | Ardan is not a Unity game. Mine the ideas listed in 16.2, then disable. |
| **Vercel** plugin | 45 skills and 3 agents | Playtest hosting is GitHub Pages or itch.io and the apps come from Capacitor. The Vercel skills also overlap each other: two React rule sets, two sandbox skills, three deploy skills, two environment-variable skills. Re-enable only `vercel-cli` and the deployment skill if you later choose Vercel for web hosting. |
| **Vercel connector** | 200+ tools | The same reasons. It can change domains, DNS and deployments, so leaving it connected is also a risk. |
| `frontend-design:frontend-design` | 1 | A duplicate of the built-in `frontend-design` (the same 71 lines). Keep the built-in one. |
| `design:design-handoff` | 1 | Writes handoff specs for a developer. You are the developer. |
| `superpowers:using-superpowers`, `superpowers:diagnosing-superpowers` | 2 | One makes Claude check skills before every reply, which clashes with the YOUR NEXT ACTIONS flow. The other debugs the plugin itself. |
| `google-workspace`, `morning`, `import-memory`, `setup-claude`, `cowork-plugin`, `plugin-authoring` | 6 | Not for this project. `plugin-authoring` changes Claude's own interface, not Ardan's Mods. |
| `computer-use`, `built-in-browser`, the remote-devices connector | 2 skills and 1 connector | Only useful with the Claude desktop app. Keep them if you use it. |
| Google Drive connector | 1 | Project docs live in the project, not in Drive. Keep it only if you share files there. |
| `explain-usage` | 1 | Optional. Keep it if you want token reports. |

### 16.2 Merge into eight Ardan skills
Create them in `.claude/skills/` at the phase shown. Each description below is a draft. Tighten it when you write the skill.

| New skill | Draft description | Best parts to take | When |
|---|---|---|---|
| `ardan-prompt-intake` | Merge a new prompt into the Ardan master prompt: save it, split it, classify each request, place it by topic, resolve conflicts, apply verdicts to work in progress, and update the roadmap, metrics and register. Use whenever I give a new prompt, plan or list of requests. | Sections 0.2 and 1 of this file: the sync, the nine-step procedure, the merging rules, the register and the carry-over checklist. Keep the skill short and let it point at the file. | Phase 0 |
| `ardan-dev-process` | How to build and ship a change in Ardan: plan, test first, find root causes, prove it is done, review, branch, and order the work. Use for every code step. | From `superpowers`: a short design check before a big build (`brainstorming`); numbered plans (`writing-plans`); **one** execution flow, using subagents for independent tasks (`executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`); test first with calibration targets (`test-driven-development`); root cause before any fix (`systematic-debugging`); **evidence before "done"**: run the tests, the coherency checks and the playtest loop (`verification-before-completion`); review before merge (`requesting-code-review`, `receiving-code-review`); a separate branch per workstream (`using-git-worktrees`, `finishing-a-development-branch`). Drop the duplicate flows and the long ceremony. Add this repo's rules: the step-size table in 4.5, the priority rules in 13.1, one step per commit, `HISTORY.md` and `STATUS.md` entries, `archive/`, no new wrappers. | Phase 0 |
| `ardan-ui-review` | Review an Ardan screen for clarity, accessibility and wording. Use before shipping any UI change. | From `design-critique`: first impression, usability, hierarchy, consistency. From `accessibility-review`: WCAG 2.1 AA (contrast, 44 px targets, keyboard, reduced motion). From `ux-copy`: clear microcopy, adapted to this repo (descriptions open on click, no percentages, events of 80 words or fewer, choices of 12 words or fewer). From `design-system`: the token audit, checked against `docs/design/brief.md`. | Phase 0 |
| `ardan-balance-harness` | Measure Ardan's difficulty with headless lives and fail the build when a strategy beats the targets. Use for any change to stats, skills, war or the crown. | Appendix A, the targets and stopgaps in section 8, the strategy list, nightly CI, and the replay of my winning run. Use `dataviz` for the charts. | Phase 1 |
| `ardan-skill-system` | Design, write and validate ranked skills for Ardan: ranks, levels, kinds, effects, acquisition. Use when adding or changing any skill. | Section 9 and Appendix B; the power-budget and stacking rules; the validator checks; the `life-sim-systems` rules on learning by doing. | Phase 2 |
| `ardan-war-core` | The war core's architecture, invariants and test harness. Use for any change to war, battles, sieges, companies or armies. | The map from `docs/design/war-architecture.md`, the invariant list, the freeze rule, and the rank-by-rank rules now in `life-sim-systems`. | Phase 2 (draft), Phase 4 (finish) |
| `ardan-playtest-synthesis` | Turn playtest feedback into ranked findings. Use after any playtest or batch of reports. | From `user-research`: interview and timed-task guides for the 5 real players. From `research-synthesis`: themes, insights, then recommendations, plus user segments. Add: the problem-report bundle and GitHub Issues as sources. | Phase 8 |
| `ardan-release-pipeline` | Platform steps for Ardan: CSP, secrets, Supabase, Capacitor without a Mac, stores, purchases. Use for anything that leaves the repo. | Ideas only, from the removed families: `vercel:client-side-security` (how to write and test a CSP, for the `connect-src` change); `vercel:env-vars` (keeping secrets out of the repo); `vercel:deployments-cicd` (preview builds and rollback); `unity:implement-in-app-purchases` (receipt checks, restore, sandbox testing); `unity:build-live-game` (server-authoritative scores and leaderboards); `unity:optimize-web` (size, load time, memory, battery); `unity:craft-game-floors` (a polish checklist for art, juice, sound, menus and saves); `unity:localization` (later). Add sections 12, 13.4 and 14 of this file. | Draft in Phase 7, finish before Phase 9 |

**Update the three existing Ardan skills at the start of the phase shown:**
- `life-sim-systems` (the breakthrough part in the first, top-priority skills step; the rest in Phase 2). **It currently says breakthroughs are how a human climbs to giant class, which is the exploit.** Replace that with the budgeted, costly breakthrough rule (A0, then A2). Replace "learn by doing: hours practised" with the ranked-skill model. Add the difficulty targets and the Notoriety rule. Point the war section at the war core.
- `game-ux-playtest-loop` (Phase 1). Add the balance harness as the "bots check the numbers" step, the seed-leak test, the step-size table in 4.5, the skill-card rules and the phone budgets.
- `realistic-continent-maps` (when I decide the Great Continent question). Otherwise keep it as it is.

**Third-party skills to add, after reading them and telling me what they do:**
- The **Supabase agent skill** at the start of Phase 9. The Supabase tools themselves recommend it (`npx skills add supabase/agent-skills`).
- A **Capacitor store-publishing skill** at Phase 10 or 11. I saw one called `capacitor-app-store` in the `cap-go/capgo-skills` repository. Check that it is current, that it fits the no-Mac plan, and that it is safe before installing.

### 16.3 Keep
| Skill | Use in Ardan |
|---|---|
| `life-sim-systems`, `game-ux-playtest-loop`, `realistic-continent-maps` | The three Ardan skills, updated as above. |
| `docs` | Writing roadmap and design docs. |
| `deep-research` | The research loop in section 11. |
| `skill-creator` | Writing and testing the new Ardan skills. It replaces `superpowers:writing-skills`. |
| `dataviz` | Charts for the balance reports. |
| `xlsx` | Balance tables and the skill-library review sheets. |
| `frontend-design` (the built-in copy) | Visual design guidance. |
| `file-reading`, `pdf-reading`, `pdf`, `docx`, `pptx`, `product-self-knowledge` | Cheap and rarely used. Leave them unless you want fewer. |
| `chrome-browser` | Helping with the store consoles. Claude must never enter payment details. You do that. |
| `video-making` | Dormant until you want a store trailer. |

### 16.4 Connectors and agents
| Item | Decision |
|---|---|
| **Supabase** | Keep, but switched off until Phase 9. When on, use a **development project only**. It can run SQL, apply migrations, deploy functions and pause or delete things, so ask me before any change to a live project and use branches for migrations. |
| Claude Docs and Claude Artifacts | Keep. |
| The project tool | Keep. |
| Claude in Chrome | Keep, optional. |
| Vercel agents (`ai-architect`, `deployment-expert`, `performance-optimizer`) | Remove with the Vercel plugin. |
| Claude Code's own agents (Explore, Plan, general-purpose) | Keep. |

### 16.5 Result and upkeep
- **Before (first count):** about 163 skills, 3 agents and a 200-tool connector. Recount after the batch review in Phase 0.
- **After:** about 11 Ardan skills plus about 14 general ones, so **about 25 skills**, and none of the unrelated tools.
- At the end of every phase, review the list. Remove anything unused. Add a skill only when it has one clear job and a description that says when to use it and when not to.
- Never install a third-party skill, plugin or connector without reading it first and telling me what it does.

### 16.6 Skills I will add later (expect this to happen)
**I plan to add many more skills and plugins that look interesting, and I want you to refine them.** The list above is a starting point, not the final list. Treat every new skill as a candidate, not as part of the setup.

**When I add or mention new skills, do this before using them:**
1. **List the new ones.** Compare against `docs/TOOLING.md` to find what is new since last time.
2. **Read each one in full** (the skill file and any scripts or reference files it ships with). Do not judge from the description alone.
3. **Give each one a verdict**, one line of reason each:
   - **Keep:** it does a job nothing else here does, and it fits Ardan (a single-file browser game, HTML/JS, GitHub, Supabase later, Capacitor apps).
   - **Merge:** it overlaps with one of the Ardan skills in 16.2 or a kept skill. Say which one, and which rules are worth taking.
   - **Remove:** it is a duplicate, built for another stack (Unity, Databricks, Vercel, React Native and similar), or has no job in Ardan.
4. **Check for risk.** Flag any skill that runs commands, installs packages, calls the network, asks for keys or passwords, or edits files outside the repo. Do not run it until I say yes.
5. **Check for clashes** with this prompt (see "Project rules win" above). Quote the clashing line and say how you would resolve it.
6. **Apply the safe-change rules above:** disable, do not delete; merge into a new Ardan skill with one clear job; record it in `docs/TOOLING.md` with the before and after counts.
7. **Tell me the result in simple terms:** a short table of Keep / Merge / Remove, then ask me to confirm before you change anything.

**Guardrails**
- Aim to stay at about 25 to 30 skills in total. If a new skill pushes past that, tell me what to remove to make room.
- More skills is not better. A skill earns its place only if it has one clear job, a description that says when to use it and when not to, and no overlap with another.
- Prefer improving an existing Ardan skill over adding a new one.
- If a skill is useful but only for a later phase (for example payments or store publishing), keep it **disabled** until that phase starts, and note the phase in `docs/TOOLING.md`.

---

## 17. Workstream D: magic, races, monsters and legendary beings

**The power scale comes first (order 77, 2026-11-25, evening):** "the strongest warrior in the Ardan world before this update should be weak when masters of other races and actual monsters appear; make the power scaling of this world much larger." One rank ladder for every being, people and beasts alike, at least ten steps from vermin to world-shaking, each a large multiple of the one below; today's best human swordsman sits near the middle; the masters of the elder and great races, great monsters and legendary beings stand far above him. A bestiary of at least 150 species with evolution lines, ten or more unique legendary beings with lairs and reasons, monsters in the wilds by terrain and season, encounters scaled to what the player does, and odds in words. This wave runs **now, beside Phase 1 and before the skills rebuild**; magic, new playable races and the canon rewrite keep their place after the skills. **Done when:** the ladder, the bestiary and the legends are in data with tests; a fight far above you is flight or death; ordinary settled lives still mostly live (the balance bands hold).

**The owner, 2026-11-25:** "as much magic with ranks, progression etc. as possible, across all the elements and more"; many more races, countless monsters and species, and legendary beings; a large project that transforms this world, in the spirit of high-fantasy worlds where monsters, spirits and dragons stand beside nations. **Any canon may be rewritten to make it fit.** It **begins after the skills rebuild (Phase 2) is done**, and runs in waves: study, build, test, improve, repeat.

**Original, not copied.** The world takes the genre's ideas (ranked monsters, evolving kinds, named monsters that rise, elemental magic, spirits, dragons as forces of nature, skill evolution) and makes them its own. No names, characters, places, skill names or story from any existing work.

- **Magic.** Elements and more: fire, water, earth, wind, light, dark, ice, lightning, life, death, space, time, spirit, and blood or bone where they fit the lore. Each is a ladder of ranked spells and skills (section 9's ranks and levels), learned by study, a teacher, a contract, a bloodline or a blessing. **Mana** is a resource of its own beside the six stats; a person's affinity is born, found and trained. Magic changes healing, war, craft, the economy and the faiths, and each realm and faith has a stance on it.
- **Races and kinds.** The human peoples, and many more: elder races, beast-folk, giants, dwarves, the sea and sky peoples, spirits, the undead, demons and others the lore earns. Each has lifespans, bodies, cultures, homelands on the map and relations with the rest. A player may be born into several of them.
- **Monsters.** A bestiary of countless species from vermin to calamities, ranked by threat, each with a habitat on the map, a diet, a season and a place in the economy (hides, cores, bounties). **Monsters evolve:** one that survives, feeds and wins can rise to a higher kind and, at the top, gain a name and a mind. Hunters, adventurers and orders exist because the monsters do.
- **The level anchors (order 84):** an average human 20-30; a soldier 75-125; a knight 150-200; an elite 200-250; a kingdom's strongest 300-380. A grown dragon about 450, a strong one about 525. Legends all stand above 600: the Sword Saint, alive in his old age, about 650, the strongest human; the three Primordial Archdemons 725-750; the Dragon King about 800, by far the strongest through titles, magic, abilities and pure strength; a Lord of the Sea and others between, in a clear ranking with some close and uncertain. Legends hold titles, are national threats that could threaten the world, and can be challenged. Races have baseline stats that lineage, starting titles and innate gifts change greatly.
- **No gods as beings (order 83):** at most faint myth and faith. The summit is held by legends: a **King of Dragons**, the **Primordial Archdemons**, and a **legendary human Sword Saint** of ages ago who rose to their level, the best-known figure of the world's history, his story told differently by every people and known to a child; and as many more as fit.
- **Legendary beings.** A few world-shaping beings (dragons, old spirits, demon lords, heroes), each one of a kind (the one-holder rule), with lairs, aims and reasons (the A.WHY rule), able to move kingdoms.
- **Fit with the rest.** The map gains habitats, ley lines, lairs and wild lands; diplomacy and war gain monster nations and calamities; the market gains magic goods; difficulty and war are tuned after this, not before (13.1).

**Build order:** (1) a canon pass: the world's history, races and faiths rewritten to hold magic, recorded in `docs/design/magic-world.md`, and **the map decision put to the owner** with it; (2) data models (elements, spells, mana, races, monsters, evolution) in `data/`, with validators like section 9's; (3) the first wave in play: a starting set of elements and spells, ten races, a hundred monsters, three legendary beings; (4) the waves after it, each studied, playtested and improved.

**Refined by order 78:** the ladder is one of **levels** (titles above it are names, not the measure); **beings of one level can differ completely** (a capability profile: strength, speed, hide, venom, flight, regeneration, numbers, cunning...); every species has an **intelligence class** (beasts act by instinct with a named cause; only the thinking ones decide through A.WHY); **not every unique being has a lair** (some roam, serve a realm, sleep under the sea), but **each has reasoning, emotions, a personality, habits, its own titles and a place in a ranking** of the world's great beings the player can learn of.

**Done when (first wave):** a new life can be born a mage or into a non-human race; monsters live in places on the map and are hunted for reasons; at least one monster evolves in a bot life for a reason the log names; every legendary being has one holder and a reason for each move; old saves load; the balance harness passes on the new world.

---

## 18. Workstream E: professions and pathways

**The owner, 2026-11-25 (order 80):** "blacksmithing and diverse weapons. merchant relations, trades and business more simplified and easy to use as an actual profession. countless extra pathways for a player to go, reaching farther than just combat." A life is a career the player can pursue as fully as war.

- **Blacksmithing and crafts:** ore, fuel and tools; a forge of one's own; weapons and armour of many kinds and cultures, each with its own handling and use in a fight; quality from the smith's level and materials (and, after section 17, monster parts); commissions, a mark and a name; apprentices.
- **Weapons:** a wide armoury by kind, culture and quality, read by the fight (reach, weight, speed, against armour, against beasts).
- **Trade and business, simple to use:** buy where cheap, sell where dear, along roads with risk; a shop, a stall, a caravan, a trading house; partners and rivals with relations; contracts and credit; one clear screen that a new player understands in a minute. It sits on one coherent economy (E0).
- **The roads named are principles, not a list (order 83):** there are many more.
- **How some roads open (order 82):** a monster hunter is an **adventurer** (contracts, a guild or company, the wilds); a **spy** comes through the military or is made one by someone with the power to; a **guild master** inherits the post or founds a guild, which asks both coin and skill.
- **Many roads:** scholar, healer, priest, judge, steward, spy, explorer, monster hunter, builder, farmer and landholder, guild master, courtier, artist, and more, each with its levels, skills, titles and a way to rise, fail or change course. A life can move between them.

**Build order:** after the skills rebuild; first the economy's single model (E0) and the profession frame (one schema for every trade: work, income, levels, relations, events), then blacksmithing and trade as the two deep examples, then the other roads in waves.

**Done when (first wave):** a bot life can live wholly as a smith or a merchant and rise for reasons; a new player opens the trade screen and makes a profit within ten minutes without help; every road has at least one way up and one way down.

---

## Appendix A — headless balance harness (starting point, tested on alpha 15)

Load the built HTML in headless Chrome with the page's security rule bypassed for the test only, then drive the engine. These entry points exist in alpha 15 (re-check them on current `main`): `A.newGame`, `A.ageUp`, `A.eventView`, `A.eventChoose`, `A.eventClose`, `A.doActivity`, `A.canAct`, `A.battleClose`, `A.duelAuto`, `A.duelClose`, `A.fightWorth`, `A.pc`. Inside the repo, prefer calling the modules directly with no browser.

```js
// bot.js: injected into the page
window.__errs = [];
console.error = function () { window.__errs.push(Array.from(arguments).map(String).join(' ').slice(0, 160)); };
window.runLife = function (o) {
  A.newGame({ seed: o.seed, status: o.status, diff: o.diff || 'hard', race: 'human', startAge: o.startAge || 0 });
  const S = A.S, y0 = S.year;
  let crown = null, battles = 0, maxRank = 0;
  const drain = () => {
    let g = 0;
    while (S.queue.length && g++ < 300) {
      const q = S.queue[0];
      try {
        if (q.type === 'event') {
          const v = A.eventView(q); let best = 0, bo = -1;
          (v.choices || []).forEach((c, i) => { const od = c.odds == null ? 50 : c.odds; if (c.i >= 0 && od > bo) { bo = od; best = i; } });
          if (!q.result) A.eventChoose(best);
          A.eventClose();
        } else if (q.type === 'battle') { battles++; A.battleClose(); }
        else if (q.type === 'duel') { A.duelAuto(q.d); A.duelClose(); }
        else S.queue.shift();
      } catch (e) { window.__errs.push('drain ' + q.type + ': ' + e.message); S.queue.shift(); }
    }
    if (S.queue.length) { window.__errs.push('stuck queue'); S.queue.length = 0; }
  };
  const PRI = o.pri;
  while (S.year - y0 < 95) {
    if (!A.pc().alive) break;
    drain(); if (!A.pc().alive) break;
    let n = 0;
    while (S.time > 0 && n++ < 12) {
      const k = PRI.find(k => { try { return A.canAct(k)[0]; } catch (e) { return false; } });
      if (!k) break;
      try { A.doActivity(k); } catch (e) { window.__errs.push('act ' + k + ': ' + e.message); }
      drain(); if (!A.pc().alive) break;
    }
    const p = A.pc();
    if (p.mil) maxRank = Math.max(maxRank, p.mil.rank);
    if (p.ruler && crown == null) crown = A.age(p);
    if (!A.ageUp()) { drain(); if (!A.ageUp()) break; }
  }
  const pc = A.pc();
  return { seed: o.seed, status: o.status, age: A.age(pc), cause: pc.cause, crown, maxRank, battles,
           str: Math.round(pc.st.str), potStr: Math.round(pc.pot.str), worth: Math.round(A.fightWorth(pc)),
           duelWins: (pc.flags && pc.flags.duelWins) || 0, fame: Math.round(pc.fame) };
};
```

```python
# run_many.py: four pages in parallel, about 20 seconds per life
ctx = await browser.new_context(bypass_csp=True)   # test only
page = await ctx.new_page()
await page.goto('file:///path/to/build.html')
await page.wait_for_function('window.ARDAN_CONTENT_READY===true', timeout=180000)
await page.add_script_tag(content=open('bot.js').read())
r = await page.evaluate("(o)=>window.runLife(o)", {"seed": 1000, "status": "peasant", "startAge": 16,
      "pri": ["plot_throne","seize_land","found_company","enlist","tournament","train_yard","spar","lift"]})
```

Extend it: more strategies, event choice policies (not only highest odds), war entry, many seeds per start, a replay of a recorded run, and a report written to `docs/BALANCE_BASELINE.md`.

## Appendix B — skill schema and examples

```jsonc
{
  "id": "blake_hidden_sword",
  "name": "Blake Family Hidden Swordsmanship",
  "rank": "A",                 // D C B A S
  "rarity": "rare",            // common uncommon rare unique legendary
  "kind": "active",            // passive active reaction aura blessing flaw
  "category": "combat.sword",
  "maxLevel": 10,
  "levels": [                  // effects by level band, from the effect vocabulary
    { "at": 1, "effects": [{ "type": "fight", "tag": "sword", "edge": 1 }] },
    { "at": 4, "effects": [{ "type": "active", "name": "Blake Cut", "uses": "1 per duel", "cost": "stamina", "effect": { "type": "fight", "edge": 3 } }] },
    { "at": 10, "effects": [{ "type": "unlock", "what": "title:blade-of-the-house" }] }
  ],
  "acquire": [
    { "via": "bloodline", "house": "Blake", "teacher": "house head or house tutor", "months": 36,
      "needs": { "skill": { "basic_swordsmanship": { "rank": "C", "lv": 5 } }, "age": [16, 60] } }
  ],
  "transfer": { "teach": "house only", "inherit": true, "steal": true, "sell": true, "lostIfHouseDies": true },
  "evolvesTo": null,
  "text": "A style kept inside one family for six generations."
}
```

**Samples (extend these):**

| Skill | Rank | Kind | Rarity | Gist | How you get it |
|---|---|---|---|---|---|
| Basic Swordsmanship | C | passive | common | Steadier with a sword; Riposte at Lv 5 | Practise with a sword for a year, any teacher |
| Beginner Footwork | D | passive | common | Harder to hit; evolves into Footwork | Childhood games, drills, athletics |
| Gifted Leader | B | aura | rare | Units under you hold longer and obey faster | Inborn talent shown at first command, or three wins against the odds as captain or above |
| Sun God's Blessing | S | blessing | legendary | Wounds close faster, fear does not take you, the faithful follow; Dawn's Judgment once per battle | Chosen at the solstice by a devout follower after a holy victory; one holder; lost if you turn apostate |
| Blake Family Hidden Swordsmanship | A | active | rare | See schema | Blake blood or adoption, house tutor, three secluded years |
| Quiet Feet | D | passive | common | Quieter in the dark | Hunting or housebreaking |
| Shield Wall Discipline | C | aura | uncommon | Your squad's line breaks later | Drill under a sergeant, 12 months |
| Eye for Weakness | B | active | rare | Once per duel, read an opponent's opening | Win three duels against better fighters |
| Honeyed Tongue | C | passive | uncommon | Easier to win a stranger's trust | Years at court or in markets |
| Quartermaster's Mind | B | passive | uncommon | Armies you feed march farther | Run a company's supply for two campaigns |
| Veteran's Calm | C | reaction | uncommon | A wound or a rout does not shake you | Survive three battles |
| Coward's Instinct | D | flaw | common | Panics when outnumbered | Run from a fight that shames you |
| Wyrm-Slayer | A | passive | unique | Beasts of dragon kind fear you | Kill a wyrm; one living holder |
| Seneschal's Ledger | B | passive | rare | Estates under you earn more and steal less | Serve as steward to a great house |

## Appendix C — Superseded instructions

Instructions that a newer one replaced. They are kept so a later session knows what was decided and why. Add a row whenever a new prompt overrides an older instruction (section 1.1, step 3).

| Older instruction | From | Replaced by | Section |
|---|---|---|---|
| Never hide a description behind a click | V1 | Descriptions open on click or tap, never on hover (the orders of 2026-11-12 said so directly) | 5 |
| Skills are named tiers with hours practised | V11 | Ranked skills with levels, rarity and acquisition routes | 9 |
| Breakthroughs raise the human ceiling with no limit | V12 | Rare, costly, budgeted breakthroughs with a hard ceiling | 8 (A0, A2), 6.2 |
| Keep the existing division simulator as it is for the commander layer | K8 | Keep what works inside one consolidated war core, proven by the harness | 10 |
| A Mac is needed for Safari inspection and Xcode builds | P | No Mac: Chrome remote debugging, and iPhone builds through a cloud route | 12.4, 14 |
| `.ardan` export and import as a player feature, or an account-locked backup | P | Removed from release builds. Cloud saves and the local backup slots replace them | 2, 12.2 |
| The world seed is shown, typed in and shared | P | The seed is never shown or shared. Saves belong to a device or account | 2, 12.2 |
| Portraits and character art come late, in the content phase | W (first roadmap draft) | Portraits and look run as a parallel track from Phase 1 | 6.8, 13 |
| Prompts are numbered rounds | W | One living master prompt. No round or version labels | 1 |
| Phases run strictly one after another; difficulty is fixed only in Phase 3; war is rebuilt only in Phase 4 | W (first roadmap draft) | Priority rules and a critical path: stopgaps in Phase 1, side tracks under a work-in-progress limit, the war core built alongside the old one from Phase 3 | 8 (A0), 10, 13 |
| No new wrapper layers in the war code only | W | No new wrapper layers in any system; CI counts them and fails if the count rises | 2, 4.6 |
| Start fresh from Phase 0 | W | Sync with work already in progress first (0.2) | 0.2, 15 |
| The skills cleanup is one item among the Phase 0 tasks, done after the sync | I | The skills and tools refinement is the top priority, right after reaching a safe point and before the sync | Header, 13, 15, 16 |
| Keep S1's growth engine and lay ranked cards over it | My proposal of 2026-11-25 | Section 9's ranked skills that merge, advance and evolve, replacing S1's levels and words; stats kept apart (the owner: newest instruction wins) | 9 |
| S1 skills: 28 skills, 35 levels in seven words, concepts and proofs (order 63) | Order 63 | Section 9's model | 9 |
| No magic; "keep it game-like and medieval" | Order rule 9, section 2 question 2 | Much magic, many races, monsters and legendary beings; any canon may be rewritten | 17 |
| Next month, or Next year, at any age (D-008, D-019, D-026); later "one button: Next month" | Section 5 | Next year below 12, Next month from 12 | 5 |
| Nothing bought may change the game | Section 2 (pending) | Paid game packs that give more allowances (birth editing, choosing a station) | 2, 12.5 |
| `work/<item>` branches pushed for the integrator (order 64, D-133) | Order 64 | No working branches or working files on GitHub; `main` and `release/<version>` only | 2, 4.1 |
| Order of work led by skills and tools first, then safety nets | Section 13.1 | Descending effect on today's game: play bugs and exploits, skills, magic, difficulty, war, then the rest | 13 |
| Phase numbers 3 to 11 | Section 13.3 | 4 to 12 (Phase 3 is magic) | 13 |
| Monsters and power wait until after the skills rebuild | Order 76 (section 17) | The power scale and bestiary now, before the skills; magic and races keep their place | 13, 17 |
| Tier words (Beginner to Legend) as the measure of skill and fighting | S1 (order 63), GD.TIERS | Levels; titles only for deeds (order 78) | 9, 17 |
| New orders worked in the order given | Practice | Every order placed by importance (13.1), order 78 | Header, 13.1 |
| Stats grow by age and training alone | V2 body (order 59 era) | Stat points per level, allocated by the player, bounded by race and body (order 80) | 9 |
| Target chances of a crown per start; Master and Legend shares | Section 8 A1 | No baseline for a crown; levels, not Master or Legend (order 83) | 8 |
| Gods at the summit of the ladder | Order 82 (my reading) | No gods as beings; legends hold the summit (order 83) | 17 |
