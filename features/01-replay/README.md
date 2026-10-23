# Deterministic replay

**Aspect:** Technical · **Kind:** fix (applied in every build)

Looking at the screen changed the world: rendering moved the random stream, the People tab created NPCs, and some journals could never replay.

## Patches

| Patch | Why |
| --- | --- |
| `ENG-STYLE-RNG` | Looking at a fighter changed the world. A.fightWorth (a question) generated and saved NPC fighting styles with the main random stream, so rendering tier chips, odds or worth tooltips moved the dice and broke replays and problem reports. Now npcStyles rolls from a stream seeded by the world seed and the person, and fightWorth discards styles it only imagined; real styles are created by the duel code, at the same moment in every replay. |
| `ENG-ROSTER-PURE` | Opening the People tab created people: A.roster (a list for the screen) hired missing colleagues with the main random stream. Colleagues are now hired by the engine at the start of each month (A.ensureMates), and the roster only lists. |
| `ENG-GEAR-ROLL` | A.gearAvailable rolled A.ri(0,1)<2, which is always true, so drawing the Holdings tab burned random numbers for nothing. |
| `SAVE-JOURNAL-BASE` | A journal with no recorded game start (restarted, imported or legacy) kept its old base fingerprint across a save and reload, while the report sent the just-loaded state as the base, so such reports could never replay ("the save to start from is not the one this journal began at"). Such a journal now restarts from the loaded state; its old entries could not be replayed anyway. |

## Tests

`renderRng`, `replayWithRender`, `journalReplay` in `test.mjs`. Run them with `node tests/run.mjs --features=replay`.
