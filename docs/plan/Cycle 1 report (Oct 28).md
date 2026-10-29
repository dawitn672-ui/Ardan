# Cycle 1 report: Oct 28

The owner, Oct 28: "It's not just the bugs and fixes. It's compounding improvements on how this game can be as great as possible." Cycle 1 ran both halves of `Compounding.md`: four reviews found what was broken, fix lanes repaired it, and grow lanes built new capabilities that the next cycle can build on.

## What shipped

### The fix half (green on CI run 74, commit 2787750)

| Lane | What changed |
|---|---|
| C | Infant gates on adult scenes; far-land words; text bugs; tier gates for rulers and generals; known names for a second person of the same name; endings. |
| W | Border wars and peace caps on the Great Continent; lore conflicts; far news garbled with distance; birth notes only within reach. |
| V | Vellum ink, hints, climates, skins, the map legend, one primary button per screen, the duel's VS, the farewell, the battle field, portraits, interiors. |
| O | The stepper: Week, Month, Season and Until; a first month that is a month; step notes and hints. |
| D | 995 Hall of Lives, 996 Coming up, 997 wilds, 998 what people want, 999 confidants. |
| L | 994 careers past 30 (coups and their fate, knighting, fiefs, Marshal, honours, late ambitions); fight odds for function effects; ruler gatherings that repeat less (distinct events 51% to 72%); fortune-scaled great works; What-now pointers. |
| R | `docs/research/backtests.md`: 19 games, 73 mechanisms, a ranked build plan of 12. |

One fix found at integration: the release's court plot ("An invitation") reached nobles of 16, who failed its d55 check and were hanged. It now needs 20 (`LF-PLOT-AGE`). The Great Continent noble band's median peak coin went from 4,954 to 86,523.

### The grow half

| Lane | Feature | Status |
|---|---|---|
| G | Motion system (`UI.MOTION`), a ¾ head with 13 poses, the title vista, battle intents, clashes and camera, 72 icons, the stepped Prussian-blue sea | Green on CI run 74 |
| J | 9990 journeys (real days by road, stops, 16 road scenes) and 9991 atlas (seen, heard of, unknown; the veil; Story / Map) | Built by default; CI run 76: 206 of 207 tests, both leagues green |
| I | 9992 identity (arms, motto, named companions, inner voices, thoughts that ripen), 9993 chapters (three aims a stage, dynasty legacies), 9994 share cards | Built by default; CI run 76: 206 of 207 tests, both leagues green |
| E | 9995 trade roads (lore goods and coins, hand-to-hand caravans at a caravan's pace, 21 chokepoints, ventures) | Built by default; CI run 76: 206 of 207 tests, both leagues green |
| WD | 9997 companies: every battalion's companies, captains, morale, food and pay; courier orders; enemy intents | Done, still `.wip` |
| P | 9996 polity: offices, laws, bills, councils, estates, vassal contracts, elections, factions with the meter | Building |

## What integration found

Each batch's CI run found failures that each lane's own tests had not. They were of three kinds:

- **Real bugs (fixed):**
  - Loading a save made markets for realms founded since the last month turn. That drew dice the unsaved game never drew, so a loaded world drifted from the saved one.
  - The atlas veil read a map frame only the Far Lands define, so a Known World map had no veil without them.
- **Tests that read the game as it was.** A test still expected the old sea colour. A field was named `owner` and looked like a province owner. The world chronicle's observe-only test did not know about a new reader of the record. A first-year pacing counter was not reset between rolls.
- **Tests too small for their bars.** Three seeds were measured against a tight threshold. Each new feature that draws the world's dice moves such a test across its bar with the rules unchanged. Each was checked on a bigger sample before it was widened, and each bar stayed where it was:

  | Test | Before cycle 1 | After cycle 1 |
  |---|---|---|
  | Siege months out of 240 | 35 | 34 |
  | Market spread | ×1.06 | ×1.06 |
  | Child gaps a year (floor on) | 0.13 | 0.19 |

  The child-gap rate is against about 1.0 with the floor off.
- **Timing on a slow runner.** A hover tip took the first Escape. A vital bar's 1.6 s glow was caught mid-flash. The phone sheet's rise was measured mid-motion (373 of 375 px, CI run 76). Each test now waits for the state it needs, not for a fixed time.

## What the process taught

- **Integrate from a clean tree.** Grow lanes edit always-built folders. A worktree that holds only finished work keeps a half-built lane out of a release push.
- **CI is faster than a shared local machine.** At load 28, the local full suite managed 47 tests an hour. CI's three shards and two leagues finish in about an hour.
- **A push cancels the run in progress.** Wait for every shard, then push all the fixes together.
- **Usage limits stopped every lane twice, and a container restart once.** Lanes resume from their transcripts, so the loss was time, not work.

## Open for cycle 2

- Batch 3: 9997 companies.
  - The Known World artisan band is 37 coin over its 300,000 cap, with no war involved.
  - 44's `rankMovesTheFight` has 2 fights the wrong way, against 1 without 9997.
  - The Great Continent league has not finished.
- Batch 3: 9996 polity, when lane P reports.
- Treasury growth on the Great Continent, about ×10. The release's ledger charges 3.2 suns a soldier. Lane E has a fix ready, off by default (`A.TRADE.ledgerYear`); it needs a hook in 56.
- The backtests' remaining build list:
  - ring advisors, readable stakes, white and red checks;
  - vows and weekly seeds, moodlets and stress;
  - house legacies beyond 9993's, the inquest;
  - chapter focus trees, located wounds.
- **Cycle 2 reviewers judge both halves:** what the fixes repaired, and what the growth makes possible.
