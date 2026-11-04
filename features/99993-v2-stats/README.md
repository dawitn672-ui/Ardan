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
  - Minds take the race's mind plus 15 points for each standard deviation of the old stat (log scale, within 4), grown by v2's mental maturity.
  - The view is cached by everything it reads (the six `A.stat` values, the potentials, age, race, sex, looks, height, `p.v2`), so a cached view is never stale and drawing a page can't change what the engine reads.

**Every check through `attempt()`** (`b-odds.core.js`, patch `V2S-ROLL`)

- The old chain still works out the honest chance. That is `A.checkOdds` with 75-fair-checks, 48-fight-ladder's fighting worth, 30, 67 and 81.
- `A.eventChoose` then rolls it with `A.V2.odds.attempt()`.
  - The edge is `logit p`. The first draw is the release's own `A.chance(p)`, and a second places attempt()'s logistic noise inside the half it chose. So with no blunder and no surge the result is the same as before, and the noise is distributed exactly as attempt() draws it.
  - A test that replaces `A.chance` to force an outcome still gets that outcome (22 features' tests do this).
  - On top of that, judgment, fatigue (health, weariness) and overconfidence can throw a won check, and will, under the stakes (a fight 0.9, a deadly loss 0.8, otherwise 0.5), can win a lost one.
  - Will and judgment are held within 2.7 standard deviations. The old willpower grows past 180.
- **A surge against long odds is a breakthrough.** The v2 ceiling rises, conditioning rises, and the old potential gains 3 × the magnitude.
- **The result says why** when it wasn't the plain run of the dice ("Overconfidence undoes you.", "Something in you refuses to lose.").
- **9996-polity's speech on a bill** goes through the same `A.V2S.rollP`.
- The draws are the game's own (`A.rand`).

**Fighting worth in levies** (`c-fight.core.js`)

- `A.V2.body.fightingWorth` measures a fighter in levies: body (might^0.5 × speed^0.5 × toughness^0.6) × skill tier × gear.
- **Humans keep the release's worth.** The game's fights are all calibrated on its own worth scale: the duel engine's `A.CR`, the beasts' rows, `GD.CROWD`, 24's duel curve, and 48's tiers and lost hand. For a human, that worth already moves with what v2 measures: strength, speed and stamina (now derived from the body), the weapon skill and the gear. v2's levies agree with it (r = 0.83 over 1,187 humans), and `40.6 + 13.0 × ln levies` puts levies on the game's scale.
- **Other races carry the v2 difference of their bodies.** The shift is `13 × ln(fightingWorth(this body) / fightingWorth(a human body at the same percentiles, skill and gear))`, added through the fighter's skill (as 48 does for a lost hand). So `A.fightWorth`, every fight check and the duel engine's own rounds read the same worth.
- **The worth is shown in levies:** the sheet's "In a fight" and 48's tier chip.
- **Races now differ** (medians at the start of two worlds):

  | Race | Change in worth |
  |---|---|
  | Giant | about +40 (the release had giants at 37, the same as men) |
  | Orc | about +11 |
  | Dwarf | about +6 |
  | Elf | about −3 |

- **A human can still reach a giant.** In v2's own units, a human master with a breakthrough in order gear (25 levies) stands with an ordinary giant (17). On the game's scale, a human's old worth grows past a giant's with skill and strength, and a v2 breakthrough raises the potential.
- **A first version replaced the worth outright** (v2 levies for everyone). Five of 48-fight-ladder's calibration tests failed: duel and beast odds shown against real (worst bins 8 and 23 points), tier texts, the lost hand's two tiers, and the profile line. The race shift keeps every calibrated human fight exact.

**Faith only where it applies** (`d-faith.core.js`, `faith.events.js`)

- **Who has faith:** the clergy-born (a parent in holy orders, the priestly line, or 29-starts' "The Temple's Child"), a priest, and a player who takes it up. The scene "A preacher in the square" (`v2s_seek_faith`) offers it; nothing forces it.
- **Everyone else:** piety stays at a neutral 30, so the 1,785 piety effects and the systems that read piety for everyone read a neutral default. Any change is kept as a pull toward faith, which makes the offer likelier.
- **What the sheet shows:** no piety bar and no piety figure, and no chapter or ambition sets a piety aim. NPCs keep their piety for the AI.

**Words, not numbers** (`e-sheet.core.js`, `f-words.core.js`)

- **The profile and the full profile:**
  - **Body:** height that grows, weight, lift in kg ("about a big hog; better than most soldiers"), sprint in m/s, march in km a day, reaction in ms, toughness in blows, and worth in a fight in levies.
  - **Mind:** the v2 words plus "better than all but 1 in N".
  - **Skills:** a named tier with the hours practised. The bar shows the way to the next tier.
  - The 0–100 stat bars and "Tick = potential" are gone.
- **A check chip** (92-scene-card) says "INT fair" or "Diplomacy Novice", not "INT 39". A stat reads as a word for your place among your own race and age: poor, middling, fair, good, fine, rare, legendary.
- **48's tier chip** says "Untrained · about one levy", not "Untrained · 39".
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
| `v2sRaces` | Median worth in levies per race: giant > 5 × human, orc > 1.5 × human, dwarf > human, the old-scale worth of a giant 20+ over a man's; v2's giant (12–30 levies) and a master human standing with it |
| `v2sAttempt` | 200 sampled events with checks: every check choice is rolled by `attempt()` |
| `v2sOddsShape` | `attempt()` keeps the chance (50, 80, 20); a tired fool loses more at 85, an iron will wins more at 10 |
| `v2sMigrate` | An old save (no body) migrates once through a save round trip, and the stats checks read don't move |
| `v2sFaith` | Faithless by default, piety pinned and the pull kept, no piety on the sheet; taking up the faith brings it |
| `v2sSheet` | The profile shows kg, m/s, km a day, ms, minds and tiers with hours, and no "Strength 35" |
| `v2sNoPct` | No percentage on screen across 12 played years (scenes, results, every tab, the profile and skills) |
| `v2sBadge` | A check choice's badge is odds words with the balance icon, no digits |
| `v2sWorthFit` | v2's levies agree with the release's worth for humans, a human's worth is unchanged, and other races carry their shift (giant over +25, orc over +4, dwarf over 0, elf at most +1) |

## Limits

- **NPC bodies follow their old stats.** Only the player's body is stored and grows by v2's curves. An NPC's view is read from its old stats, so the two agree, but NPCs still age by the old engine.
- **Skill hours are read from the 0–100 skill,** not stored. The old learning curves still decide progress.
- **Within a race, the worth is the release's.** v2's body sets the gap between races, not the spread within one. Beasts and crowds keep the release's worth rows.

## Other features' tests changed (they checked digits the owner asked to remove)

- `42-difficulty` `difficultyInformation`: with v2 no setting shows digits on a choice; without v2, the release's rule as before.
- `48-fight-ladder` `flScreens`: with v2, the duel's "N times in 100" and the worth beside the tier on the duel measure are no longer required.
- `59-tooltips` `ttWorthSums`: the tier chip names the worth in levies; with v2 it must name the same total's levies.
- `9998-stakes` `stWhiteRetry`: with v2 the lock reads "Grow in Persuasion and Willpower first" and the chip "better at this now than in 1105", without the numbers.
- `59-tooltips` `ttSums2` (the odds popover has words, no sum row, with v2), `ttCov2Scenes` (the scenes' odds are words, so that group leaves the coverage bar), `ttInModal` (focuses any explained number in the full profile, which has no stat bars).
- `9996-polity` `poBillTrack`: the next count's odds are words and a balance, so with v2 the stack must have no "N%" and must have the balance.
