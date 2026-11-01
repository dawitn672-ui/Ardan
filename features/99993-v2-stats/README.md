# 99993-v2-stats: the v2 body, attempt() and words, by adapter

**Aspect:** the owner's v2 complaints 7 (piety for everyone), 11 (stats are unclear, height never grows), 12 (races are the same, humans must be able to beat giants) and 16 (too many percentages, no room for stupidity or will), `docs/v2/V2_SPEC.md` integration step 4 · **Kind:** system (6 code files), 1 patch, 1 event, small edits in 42, 48 and 9996's tests and in 9996-polity.

The owner chose an adapter, not a rewrite of the 5,487 events (`docs/v2/LANES.md`, "Stats"). The events and the systems that read `p.st`, `C.stat`, `A.stat` and `fx: { str: 1 }` keep working; the v2 engine (`A.V2`, `src/v2/body.js`, `races.js`, `odds.js`) sits under them.

## What it does

**The body** (`a-body.core.js`)

- **Every person has v2 genes and a body.** The player's is stored (`p.v2`: the genes the old game never had, conditioning, ceilings, breakthroughs, the mind's training). An NPC's is a pure view computed when something asks (`A.V2S.view`), so thousands of people cost nothing to save.
- **Seeded, not drawn.** The genes the old game had no word for (the height curve, toughness, judgment, presence, cunning, the ceilings, the talents) come from v2's `makeGenes` with a generator seeded from the game's seed and the person's id. No `A.rand` draw, so the world's dice don't move.
- **Races.** Each game race gets its own v2 entry, `ardan_<race>`. It keeps v2's body plan and takes the game's growing years (`ageScale = grown / 20`) and heights.
  - v2 lacks half-elves. A half-elf is made as the geometric mean of a human and an elf.
  - Any race v2 doesn't know becomes a human body.
- **The old stats come from the body.** For the player, once a month:

  `st[s] = pot[s] × 0.78 × grow(age) × T[s]`

  - `pot` is the old potential. The v2 gene is `√(pot / race mean)`.
  - `grow` is v2's physical maturity curve, raised to the power 0.75 (this matches the old curve within a few points). It holds at 1 from the peak; the old `ageFactor` does the fading.
  - `T` is conditioning: `cond^0.4` for the body, and a training factor for the mind.
- **Old writes still land.** Anything that writes `p.st` (training, `fx: { str: 1 }`, the old breakthroughs) is read back as a change of conditioning, capped at the v2 ceiling. The child's old yearly growth step is off for a person with a body; the v2 curve grows them.
- **Old saves migrate once.** Their potential becomes the genes and their stats become conditioning, so the stats come out as they went in (test `v2sMigrate`: moved by at most 0). Skills become practice hours (0 → 0, 5 → 30 = Novice, 15 → 200, 30 → 800 = Journeyman, 45 → 2,500, 60 → 6,000, 75 → 12,000 = Master, 88 → 25,000, 100 → 50,000 = Legend).
- **The view is by percentile.** Each attribute is the race's typical body at that age (v2's base × maturity) times `(A.stat / a typical person's of this race and age)^K`, with K = lift 2, sprint 0.7, march 1.5, reaction 0.9, toughness 1.5.
  - `A.stat` carries the old age fading, wounds, traits and weariness, so the sheet, a fight and a check all read the same person.
  - Minds take the race's mind plus 15 points for each standard deviation of the old stat (log scale), grown by v2's mental maturity.

**Every check through `attempt()`** (`b-odds.core.js`, patch `V2S-ROLL`)

- The old chain still works out the honest chance. That is `A.checkOdds` with 75-fair-checks, 48-fight-ladder's fighting worth, 30, 67 and 81.
- `A.eventChoose` then rolls it with `A.V2.odds.attempt()`.
  - The edge is `logit p`. With no blunder and no surge the result is the same as before, and the first draw decides exactly as `A.chance` did.
  - On top of that, judgment, fatigue (health, weariness) and overconfidence can throw a won check, and will, under the stakes (a fight 0.9, a deadly loss 0.8, otherwise 0.5), can win a lost one.
  - Will and judgment are held within 2.7 standard deviations. The old willpower grows past 180.
- **A surge against long odds is a breakthrough.** The v2 ceiling rises, conditioning rises, and the old potential gains 3 × the magnitude.
- **The result says why** when it wasn't the plain run of the dice ("Overconfidence undoes you.", "Something in you refuses to lose.").
- **9996-polity's speech on a bill** goes through the same `A.V2S.rollP`.
- The draws are the game's own (`A.rand`).

**Fighting worth in levies** (`c-fight.core.js`)

- `A.V2.body.fightingWorth` on the body view, times v2's gear multipliers read from the game's slots, gives a worth in levies.
- The game's fights are all calibrated on its own worth scale: the duel engine's `A.CR`, the beasts' rows, `GD.CROWD`, and 24's duel curve. So the levies are put on that scale with `40.6 + 13.0 × ln levies`, a fit on 1,187 humans (r = 0.83).
- The fighter that `A.fighterFrom` builds gets exactly that worth. Its skill is moved, as 48 does for a lost hand. So `A.fightWorth`, every fight check and the duel engine's own rounds follow the body.
- Races now differ (medians at the start of two worlds):

  | Race | Levies | Old-scale worth | Lift |
  |---|---|---|---|
  | Human | 0.66 | 35 | 124 kg |
  | Orc | 1.41 | 45 | 269 kg |
  | Dwarf | 1.05 | 41 | 227 kg |
  | Giant | 13.4 | 74 | 2,435 kg |

  The release had giants at 37, the same as men.
- A human master with a breakthrough in order gear (25 levies) stands with an ordinary giant (17).

**Faith only where it applies** (`d-faith.core.js`, `faith.events.js`)

- **Who has faith:** the clergy-born (a parent in holy orders, or the priestly line), a priest, and a player who takes it up. The scene "A preacher in the square" (`v2s_seek_faith`) offers it; nothing forces it.
- **Everyone else:** piety stays at a neutral 30, so the 1,785 piety effects and the systems that read piety for everyone read a neutral default. Any change is kept as a pull toward faith, which makes the offer likelier.
- **What the sheet shows:** no piety bar and no piety figure, and no chapter or ambition sets a piety aim. NPCs keep their piety for the AI.

**Words, not numbers** (`e-sheet.core.js`, `f-words.core.js`)

- **The profile and the full profile:**
  - **Body:** height that grows, weight, lift in kg ("about a big hog; better than most soldiers"), sprint in m/s, march in km a day, reaction in ms, toughness in blows, and worth in a fight in levies.
  - **Mind:** the v2 words plus "better than all but 1 in N".
  - **Skills:** a named tier with the hours practised. The bar shows the way to the next tier.
  - The 0–100 stat bars and "Tick = potential" are gone.
- **Odds are words plus a tipped balance** (`A.V2.odds.oddsWords`).
  - `A.DIFF.showOdds` now says no at every setting, so 48, 59, 89, 92, 97 and 9998 drop their digits.
  - A check choice's badge is the words and the balance, and 92's four pips are gone.
  - 89's fight badge gets the balance and the words beside it.
  - 9996's bill shows its chances in words with the balance.
- **Any other percentage that reaches the screen** is put in words where it lands (`A.V2S.dePct`, run after each render and on anything added later, such as tooltips). A bill's chance or a ransom's odds become odds words; a faction's share of the swords becomes "about a third". The numbers stay in the engine and the tests.

## Rules kept

- **Deterministic.** No `Math.random`, no `Date.now`. The body draws nothing from `A.rand`. `attempt()` draws from `A.rand` only where a check was already rolled.
- **Rendering is pure.** `A.V2S.view` and the sheet write no state (`fighterFrom`'s `p.styles` is put back). The DOM pass changes only the page.
- **Old saves:** `p.v2` is added on the first month; nothing else is new state.

## Tests

`node tests/run.mjs <build> --features=v2-stats`:

| Test | What it checks |
|---|---|
| `v2sHeight` | Height by age follows the v2 curve from birth (47 cm, 71, 89, 108, 129, 153, 164) and stops at the adult height |
| `v2sDerive` | In a played life, strength and lift rise from 5 to 25. `fx: { str: 3 }` raises the conditioning and `C.stat`. Lift falls by 70 |
| `v2sRaces` | Median levies per race, giant > 5 × human, orc > 1.5 × human, dwarf > human, the old-scale worth of a giant 20+ over a man's, v2's giant (12–30) and a master human standing with it |
| `v2sAttempt` | 200 sampled events with checks: every check choice is rolled by `attempt()` |
| `v2sOddsShape` | `attempt()` keeps the chance (50, 80, 20); a tired fool loses more at 85, an iron will wins more at 10 |
| `v2sMigrate` | An old save (no body) migrates once through a save round trip, and the stats checks read don't move |
| `v2sFaith` | Faithless by default, piety pinned and the pull kept, no piety on the sheet; taking up the faith brings it |
| `v2sSheet` | The profile shows kg, m/s, km a day, ms, minds and tiers with hours, and no "Strength 35" |
| `v2sNoPct` | No percentage on screen across 12 played years (scenes, results, every tab, the profile and skills) |
| `v2sBadge` | A check choice's badge is odds words with the balance icon, no digits |
| `v2sWorthFit` | The levies-to-worth fit holds, and `A.fightWorth` is the v2 worth |

## Limits

- **NPC bodies follow their old stats.** Only the player's body is stored and grows by v2's curves. An NPC's view is read from its old stats, so the two agree, but NPCs still age by the old engine.
- **Skill hours are read from the 0–100 skill,** not stored. The old learning curves still decide progress.
- **The fit is for humans.** Other races are placed by the body alone, which is the point (complaint 12). Beasts and crowds keep the release's worth rows.
