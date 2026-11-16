# Ardan harsh critique: shared brief

You are one of five expert critics tearing apart **Ardan v2.0.0-beta.1**. Ardan is a single-page medieval life sim and
grand-strategy game: you live one person's life (birth to death, any class) inside a simulated continent of realms, wars,
courts and families. The owner wants a critique "as harsh and useful as possible, from the point of view of top game
designers, developers, VFX artists, character designers, artists and programmers".

## What you have
- A frozen copy of the repo at `/tmp/ardan/snap` (read only: never edit it). The built game is
  `/tmp/ardan/snap/index.html` (one 5 MB file; open it as `file://`).
- Repo docs worth reading first: `CLAUDE.md`, `docs/v2/V2_SPEC.md` (the owner's v2 design rules),
  `docs/v2/playtest-2.md` (the last playtest's findings), `docs/v2/STATUS.md`.
- Architecture: the shipped release `vendor/ardan-b593143.html` (minified) is patched by ~126 feature folders in
  `features/NN-name/` (patches on minified code, readable `*.core.js`, `*.events.js` event packs). The v2 engine source
  is `src/v2/` (bundled into `features/99990-v2-engine/`). `tools/build.mjs` builds it all.
- Playwright is at `/opt/node-tools/node_modules/playwright`:
  `const { chromium } = require('/opt/node-tools/node_modules/playwright');` (do NOT npm install anything).
- In the page: `A` is the engine, `UI` the interface, `A.S` the state, `A.pc()` the player. `tests/helpers.mjs` shows
  handy helpers (copy them into your page with `page.addInitScript` or `page.evaluate`):
  `A.newGame({ seed, race:'human', realm:'POL-01', status:'peasant'|'serf'|'artisan'|'merchant'|'noble'|'royal', sex:'M'|'F', startAge })`,
  then `UI.screen='game'; UI.tab='life'; UI.render();` `A.advance(30)` moves days; `A.headReady()` gives the queued
  card; `A.eventView(q)` shows it; `A.eventChoose(i); A.eventClose();` answers it; `A.eventAuto()` lets the bot answer.
  The real UI has a "Next month" button; drive the real UI where you can (click buttons, open tabs) since that is what
  the owner sees. Screenshots at 420 px wide (phone) and 1366 px (desktop), `deviceScaleFactor: 1`.
- Put every script, screenshot and note you make under your own folder `/tmp/ardan/critique/<your-lens>/`.

## The owner's current complaints (Round 2 orders), so you can rate them and find more of the same kind
1. The game gets slower the longer you play.
2. Ranks and titles are inconsistent: promoted to marshal but kept only a captain's command; another character held
   "marshal" at the same time; leaving the captain's post left a marshal in name only. Every post must have one holder,
   a promotion must hand over real command, leaving a post must have consequences.
3. Descriptions pop up on hover; they should open on click (button or info icon).
4. Too much clutter and information crammed on screen.
5. Relationships don't work: the extended family floods your relationships. A commoner should start knowing only
   parents and siblings; a noble also maids, nurses, tutors, guard knights; new people should enter through what you do.
6. Names and kingdoms aren't diverse enough; model real-world cultures (humans mostly white/European, diverse where it
   makes sense: trade cities, borderlands, distant realms, other races).
7. Character design: every character should look like a distinct individual (face, build, age, scars, clothing by
   class and culture, personality). High priority.
8. The tile map and the war system flatten tactics and terrain. Wants borders, trade routes, roads, rivers, fords,
   passes, forests, marshes, towns; terrain that changes movement, supply and battles.
9. War screens should exist only when deployed or on a mission.
10. Real medieval military branches (heavy lancers, mounted men-at-arms, dismounted knights, a scout regiment for
    stealth/assassination/intelligence, infantry, archers, crossbows, siege engineers, garrisons, levies, mercenaries,
    elite orders), each with ranks, training, gear, missions, careers.
11. Much deeper war and command: flanking, stealth, attrition, blockades, encirclement, sieges, supply lines, ambushes,
    scouting, intelligence.

## What to deliver
Write `/tmp/ardan/critique/<your-lens>.md`:
- A title line naming your lens.
- **Every flaw you can find in your area**, most severe first, as a table: `| # | Flaw (concrete: exact on-screen text,
  screen, function or file) | Severity /10 | How to fix (short, specific) |`. Severity 10 = breaks the game or the
  owner's trust; 1 = polish. Aim for 30+ real flaws; quality over padding, but be exhaustive.
- Back claims with evidence: quote on-screen text, name the function/file, give measured numbers. Note the screenshot
  file name where it helps. Say when something is good, in one line at the end ("keep"), so it is not torn down.
- A last section "Top 5 to do first" from your lens.
Do not edit anything in `/tmp/ardan/snap` or `/home/user/Ardan`. Keep your report under about 4,000 words.
Return a 5-line summary as your final message.
