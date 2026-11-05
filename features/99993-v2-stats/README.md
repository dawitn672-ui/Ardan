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
  - **Every draw reads the dice one way.** The release's dice read low as good (`A.chance(p)` is `A.rand() < p`); attempt() reads its rng high as good for the noise and fires each `chance(p)` on a low draw, as v2's `makeRng` does. So attempt() gets `makeRng`'s shape on the game's dice turned round (`next()` is `1 − A.rand()`, `chance(p)` is `next() < p`), and the noise is placed in its half the same way. A roll held low is attempt()'s best day: won, the noise at the top of the won half, no blunder. A roll held high is its worst: lost, deeper than any surge lifts. So 67-memory-weave's tests, which hold `A.rand` at 0.001 to win a check and at 0.999 to lose one, still decide it. With live dice nothing is distributed differently.
  - (The first version filled a won half from its losing edge and fired a chance on a low `A.rand()`: held at 0.001, the release's roll won, then the blunder chance, never under 0.002, fired every time and threw the check.)
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
| `v2sPlaytest2Body` | Two lives (a human and an orc) from birth: under 3 not measured, no levy legend under 6, a minor compared with others of its age (no "grown man", "toddler", "ordinary man"), no lift named by a person, the mind word and its rarity agree, levy words and rank agree; an untrained human lifts under 65, 105 and 180 kg at 10, 13 and 17 |
| `v2sPhoneBands` | At 420 px the vitals' band words are whole, and their labels keep icon and tooltip |

## Limits

- **NPC bodies follow their old stats.** Only the player's body is stored and grows by v2's curves. An NPC's view is read from its old stats, so the two agree, but NPCs still age by the old engine.
- **Skill hours are read from the 0–100 skill,** not stored. The old learning curves still decide progress.
- **Within a race, the worth is the release's.** v2's body sets the gap between races, not the spread within one. Beasts and crowds keep the release's worth rows.

## The odds breakdown on a touch screen (`h-why.core.js`, cycle 3)

Playtest round 1 made a tap on a choice choose, so the badge inside the choice lost its tap target. A phone has no hover, so a phone player could no longer see a choice's breakdown at all. On a touch screen (no hover, or a coarse pointer):

- **The choice body chooses.** The badge inside it takes no tap, as before (71-phone).
- **The odds badge has a target of its own.** A `role="button"` span sits over the badge as a sibling of the choice button in `.choices`, never inside it. It is at least 44 × 44 px and kept in place by a `ResizeObserver`. A tap on it opens the words-only breakdown and chooses nothing; a second tap closes it. It is a span, not a `<button>`, because the release's number keys and first focus pick `.choices button`. The badge shows a dashed edge to say it is a thing of its own.
- **The breakdown covers no choice.** It sits above the choices (with a scroll inside if it is taller than the room there), so the next tap on a choice is free: it closes the breakdown and takes that choice. When there is no room above, it may cover them, and then a tap on it closes it.
- Nothing changes with a mouse. `59-tooltips` `ttPhone2` tests this design.
- The v2 sheet's words keep the row's 14 px on a phone (71-phone's `phoneTargets`).

## Playtest round 2 (complaints 11, 12: the body's scales and labels)

- **Lift by age and training is plausible.** An old-code change to a child's stat (`fx: { str: 1 }`, an activity) was read as conditioning against the child's own small base, so a +1 at five grew into +10 by twenty. It is now the same change to the grown body (the training factor moves by delta / (pot × 0.78)), held under the old cap so growing up still shows. The view's lift and march now follow the old stat's place one for one (K was 2 and 1.5: a p90 grown man lifted 315 kg and marched 55 km). Seed 32's untrained boy: 45, 73 and 128 kg at 10, 13 and 17 (was 92, 144 and 250 in the playtest); grown men in a fresh world p10–p90 lift about 80–200 kg.
- **A child is compared with others of its age** (`src/v2/body.js` `describe`, `peerWords`): "stronger than most your age", "as fast as most your age"; a child's mind is read with the growth of the mind taken out ("better than all but 1 in 7 your age", not "witless, worse than all but 1 in 400" at six). Under 3 the sheet says "too young to measure"; the levy legend shows only with the fight row.
- **Words agree with each other.** No lift reference is a person ("about a small cask of ale", not "about a grown man; below most grown men"); a mind word and its rarity read the same band ("wavering" is "worse than most people"); `levyRank` uses `levyWords`' bands.
- **No tier beside v2's levies.** v2's levies (`VS.v2Levies`, the body and skill) rank people a little differently from the release's worth (r = 0.78), so "Elite · about one and a half levies" could happen. The tier chip now says the levies alone ("about one and a half levies"; the short chip keeps the tier name alone), the sheet's "In a fight" row reads its words and its rank from the same levies, and the duel chips and the wound line say the worth's tiers alone. The levies stay on v2's scale (V2_SPEC row 12: a giant about 20, an order knight 15–25, a Master level with a giant only with breakthroughs); a curve on the worth was tried and dropped, as it raised a plain Master above an order member without the owner's say.
- **The duel engine's own race edge** (`VS.ENGINE_EDGE`). A giant's blood (× 3.2), an orc's (× 1.12), mass, reach and burst made races fight above or below their worth in duels, and the v2 shift came on top: the duel screen said 37 in 100 where giants won 86, 50 where humans beat orcs 4 times in 100. In a duel each fighter's skill now gives back that edge and 48's `FL.fWorth` counts it, so every race fights at its shown worth (48's `flRaceOdds`). Outside duels nothing changes.
- **The phone's vitals** keep whole band words: the label and the word share the first line, the bar goes under them (`VS.VITAL_ROW`).
- `span.v2-w` is at the row's size (14 px; 71's `phoneTargets`).

## Other features' tests changed (they checked digits the owner asked to remove)

- `42-difficulty` `difficultyInformation`: with v2 no setting shows digits on a choice; without v2, the release's rule as before.
- `48-fight-ladder` `flScreens`: with v2, the duel's "N times in 100" and the worth beside the tier on the duel measure are no longer required; round 2: the profile's wound line is tiers in words ("Trained to Untrained", "still Trained, a little less in a fight"; "less speed"), not "worth 31 to 8 (speed -7)".
- `59-tooltips` `ttWorthSums`: the tier chip names the worth in levies; with v2 it must name the same total's levies.
- `9998-stakes` `stWhiteRetry`: with v2 the lock reads "Grow in Persuasion and Willpower first" and the chip "better at this now than in 1105", without the numbers.
- `59-tooltips` `ttPhone2` (cycle 3): with v2, a tap on the odds target beside the choice opens the breakdown, words only, over no choice; the target is at least 44 px and outside the choice; the next tap on a choice closes it and takes the choice. The old tap target inside the choice is gone since playtest 1.
- `59-tooltips` `ttSums2` (the odds popover has words, no sum row, with v2), `ttCov2Scenes` (the scenes' odds are words, so that group leaves the coverage bar), `ttInModal` (focuses any explained number in the full profile, which has no stat bars).
- `9996-polity` `poBillTrack`: the next count's odds are words and a balance, so with v2 the stack must have no "N%" and must have the balance.

## Playtest round 1 (`g-bands.core.js` and small changes elsewhere)

- **A tap on a choice chooses.** The odds badge loses 59's tap target (`data-tt-tap`); its breakdown opens on hover, focus or the keyboard. The odds popover on a check is words only and matches the chip and the badge: your stat or skill in words, the test in words, and what blunders and surges do. The "On Realism" line is gone, and a choice's `risk` is the v2 odds word everywhere it's drawn.
- **Percentages become whole phrases.** "+30% pay" becomes "about a third more pay"; "4 + 30% of their average" becomes "4 and about a third of their average"; "worth 1.6%" becomes "worth a little"; "all of it from doing" no longer goes on to "the rest from practice".
- **0–100 scales become bands.** Health, happiness, looks, renown, honour, piety, stability, legitimacy, and a duel's blood and wind are words ("hale", "content", "known in the province"). A result chip says "a great deal more Merewyn's regard". The training picker and log, stat and skill numbers, the orders' trials, "Master fighter (95)" and "Untrained · 18" all say tiers and words. Real units and counts stay numbers.
- **Levies on v2's scale.** The sheet and the tier chip use v2's own fighting worth (`A.V2S.shownLevies`), so a sword master reads about 3 levies, not 285.
- **Children under 4 aren't rated** ("too young to tell").
- **Piety for the faithless** reads as "a pull toward the faith".
- **Labels.** "Takes 1 blows" now reads "stands up to a blow that would fell an ordinary man", and a grown body is never "as fast as a child".
- **The derived stat stops at the old engine's cap** (1.02 × potential), where training and fx stop too.
- **Tests.** The new test `v2sPlaytest1` covers the findings. `59-tooltips` `ttCoverage` is also changed: with v2 every remaining number must be covered.

## Playtest round 2: what a failed check costs (`h-loss.core.js`, new 1 and 2)

Two cards lied about risk. "Join the plot … Nothing lost if it fails" ran `A.punish(p, "treason")` on a failure, the
gallows scene came, and the character hanged at 20. "If it fails: a wound, hurt" killed a soldier at 18 who was near
death after a lost fight: the 12 health it took left him nothing, and `A.mortalCheck` did the rest.

- **`A.V2S.lossOf(fx, pc, ctx)`** reads an effect, object or function, for the losses that last:
  - death (`die`, `A.pcDeath`);
  - the law's sentence for each crime it names (`punish: "theft"`, `A.punish(p, "treason")`), in words, for this
    person under their realm's law, by the same tree `A.punish` follows (`VS.lawFor`: treason is "the gallows or a deep
    cell", desertion in Aldmark "the gallows or a flogging", theft a fine, a brand, a flogging or the hand);
  - the gallows (`event: "gallows"`, the content's `gallows(p)` helper), prison, exile;
  - the scenes it queues or schedules (`event: "id"`, `A.queue` / `A.schedule` with `ev: "id"`), read in turn, three
    deep. A later scene counts when a failed check there brings the loss, or when every way out of it does. A choice
    that walks into it on purpose, such as "Face it with dignity", is the player's own and does not count;
  - the most health it takes at once, and whether that would bring this person's health to nothing.
- Code may keep a death or a cell behind a branch of its own, so a function's `die` or `imprison` reads as a risk ("a
  risk of death", "perhaps the gallows"). Written data reads as a certainty.
- **`VS.lossWords(L, pc)`** says it worst first. A hurt that could kill uses the profile's own health band: "hurt that
  could kill you, near death as you are".
- **The roll agrees with the card.** `VS.stakesOf(check, choice, pc)` counts a deadly or lasting loss read this way as
  a deadly loss (stakes 0.8), so will can carry a lost check that the card says could kill. A blow of 12 is stakes 0.5
  for a hale man and 0.8 for one near death.
- It is pure: it reads the choice as written, the person and the law, and draws nothing.

Test `v2sLossStakes`. 99999-v2-content draws the chips from it (`v2cRiskChain`, `v2cRiskLethal`).

## The 0-100 numbers g-bands did not reach (`i-numbers.core.js`, part 8, loads before `j-numbers.core.js`, complaint 11, playtest 1 #7, playtest 2 old 7)

- **Needs.** 35-moods' four needs are words (`A.MOODS.word(k, v)`: "rested", "alone too often", "adrift", "in want"),
  banded on the rules: under 30 a need sets a mood, 65 or more on all four is content. The words are in 35's card,
  91-look's box (rail and phone You page) and the need, needs and mood popovers. A need's popover says where it settles
  and what pulls it ("A hard plan: lowers it a great deal"). 91-look's activity popover says "company up a great deal".
- **Training.** The mentor picker's "Melee (14)" and the council's appoint picker say the tier. The season's log says
  how much each skill grew: "Survival & hunting (a good deal)", not "+2.4". The training picker was already in words.
- **The profile and the decisions.** The profile's age line drops the stat ("Strength: at its best at 19 · holds until
  about 42"). A wound's cost reads "worth a little less (slower)" and "Athletics & climbing down a good deal" (j-numbers' rule). The perks
  unlock "at Journeyman, Expert and Master". A decision needs "A proficiency at Adept" or "Letters & learning at Adept",
  and a door "Crossbow at Apprentice (you are Untrained)". An ambition's step says "Fighting worth: Trained". The yard
  sends you home "come back when you are worn or better". A staff candidate's fit is a tier.
- **The War Room.** The division grid compares the division with yours ("far above yours", "like your others"); armour
  and piercing say what they do to your men ("your blows bite", "glances off your armour"); speed stays in km.
  Organization is "in full order" to "broken". The order of battle's "mo 64" and "xp 18" are "steady" and "trained".
  59-tooltips' popover on an enemy's cell gives the same word, not the exact figure.
- **Infamy.** Coalitions read "Against Aldmark (feared: its neighbours band together)"; the Most feared bars say
  "feared", "distrusted", "watched". The bands follow the rules: 40 starts a coalition, over 58 one may march, over 20
  small realms bow. The Infamy map mode's legend reads "Coalition bait (so feared a coalition may march)", and the
  ruler's coalition letter "Aldmark has swallowed too much land (feared: its neighbours band together)".
- **Infamy, every spelling (round 3).** g-bands has an infamy band ("unremarkable", "watched", "distrusted", "feared",
  "hated", "dreaded"; feared from 40, where a coalition forms, hated over 58, where it may march), so "Infamy <b>47</b>"
  in its own element, the Realm tab's bar and any `data-tt="infamy"` number read the word. The rule lines ("At 40
  neighbors start a coalition; above 60 it may march", "at 40 coalitions form; above 60 they march", "Keep infamy below
  60") say it in those words; "Your infamy is 47" reads "Your realm is feared abroad"; the advisor's "Infamy 47: ..."
  (and its title) "Infamy: feared; ..."; a realm's card "· infamy: hated"; "Their infamy (47)" the short word; a war's
  price "infamy up somewhat · stability up a little" (g-bands had read the release's unsigned "stability 2" as the band
  of 2). Beside it, the realm's own thresholds and costs: stability's "below 18" ("once it is near collapse"), "An
  empty treasury costs 6 stability", legitimacy's "(legitimacy − 50) ÷ 25 a year", the treasury's "Income at
  stability 50", a faction's "40%+ power and 60+ discontent", "(discontent 44)", a realm's "Opinion -4" in the treaty
  reasons and "(Relations +12.)", the gift's "Opinion +12" toast, and the Path's "Opinion 50+:".
- **The realm's other bars (round 4).** The Realm tab's Stability, Legitimacy and War weariness bars say the band
  ("shaky", "doubted", "tiring"), by label and by tooltip key (`realmStab`, `realmLegit`, `realmWeary`). War weariness
  has a band of its own on the release's words at the peace table (over 30 "tiring", over 60 "exhausted", over 85
  "broken by war"), so its popover's "War weariness <b>53</b>" reads the word too, and the peace table's "is tiring (war
  weariness 47)" drops the bracket. 97-life-fixes' golden age step, "Stability 29 of 85 and ...", reads "Stability shaky
  (it must be rock steady) and ...".
- **Titles.** A hover title or aria-label with one of these numbers ("Stability since 1105: 46 to 61", the Goals tab's
  "Still needed: ...; Legitimacy 70.", the People tab's "Opinion 79") goes through the whole of `VS.deNum`, the
  element itself included (round 4: the titles had taken only the NUMRULES2 rules, and an element added on its own was
  skipped).
  The profile's skill rows (59-tooltips' hook writes `aria-label="Melee: 24"`) say the tier to a screen reader,
  "Stewardship & supply: Apprentice", with the name's "&" plain (the hook escaped it twice). The Realm tab's crown
  authority buttons say "Income ×0.88; the lords warm to the crown each year", not "vassal mood +8/yr" (round 5).
- The game's rules are unchanged; drawing reads, never writes, and draws nothing.

Test `v2sNumbers` draws each of these views on a played life and fails on a bare 0-100 number in any of them. As a
ruler with infamy 47 it also scans every text node, title and aria-label of the Life, Realm, Goals, Path and People
tabs (folded or open), every popover those pages offer, the infamy and war weariness popovers, a neighbour's card, the
war declaration, World's Diplomacy and the Infamy map, and pl_coalition_letter as the page draws it, on any line naming
infamy, stability, legitimacy, a faction, discontent, loyalty or opinion. Every bar is read as its label with its value,
and every element whose tooltip key is a realm measure as its key with its text, so a number in an element of its own
is caught. A popover's breakdown keeps its sums ("Legitimacy +0.8" a year). Since round 5, every title and aria-label of every tab, for
the commoner and for the ruler, goes through the same check, not only those that name a realm measure (a skill row's
"Melee: 24" was never read). Not scales there: dates, ages ("Portrait of X, 28", the clock's "age 19"), "Initiative
3.0 of 5", a fold's count of entries ("Activities, 32"), a chapter's number, counts with their unit (loads, times,
galleys, goods carted), and the provinces' sparkline. It also needs one skill row whose aria-label is a tier.

**One layout for both numbers groups.** `i-numbers.core.js` is part 8 (v2-wf-numbers: needs, training, War Room,
infamy and the realm's bars), `j-numbers.core.js` is part 10 (v2-wf-numbers2: the playtest 2 remainder), and part 8
loads first. Both add to `VS.keyWords` (whichever runs first makes it). Part 8's training-log rule leaves the season's
"... of it from doing" line to part 10's whole-sentence rule, and part 8 leaves a skill's cost ("Athletics & climbing
−10") to part 10's rule, so each line has one owner whatever the order.

## Playtest round 2: the 0-100 numbers left on the page (`j-numbers.core.js`, part 10)

Playtest 2 (old 7's remainder, new 11, old 20 and old 22) still read 0-100 numbers in views g-bands never reached. Most
survived because 59-tooltips puts the number in an element of its own (`Master fighter (<span data-tt="worth">101</span>)`),
so a rule on one text node never saw its label. Now:

- **By tooltip key.** An element whose `data-tt` names a 0-100 measure says it in words (`VS.keyWords`, run after every
  sweep): `perf` (excellent … failing), `rep` (famed in the trade … unknown), `merit` and the board's merit row (against
  what the board asks: "about two thirds of what the board asks", "enough for the board"), the board's skill and
  command rows ("Apprentice; the board asks Journeyman"), `coMo` ("Morale: steady"), `worth` (in levies, as the sheet
  says it: "Master fighter (about 25 levies)"), `fame`, `opinion` and `rulerOp` (devoted … hateful, 59-tooltips' own
  words), `loyalty`, `facDisc`, `feud`. Months and battles on a board stay counts.
- **Another person's page** (`UI.personModal`): renown as its band, "Command: a steady officer", skill rows as tiers,
  "Body: strength fair · speed poor …" (each stat against the person's own race and age), opinion as a word, 55-bonds'
  history as "somewhat warmer, fading". A grown person with no skill over the release's bar reads "No skill above the
  common run", not "No real skills yet".
- **Bars:** a duel's Blood (against the fighter's whole) and Wind as bands; World › Diplomacy's "Most feared" as
  infamy words (i-numbers' `VS.infamyShort`, which wf-numbers owns). A bar with a word gets a value column as wide
  as the word (`.v2-wb`, `.v2-skw`), so nothing is cut at 420 px.
- **Lines in the story and the reports** (ahead of the general rules): a season's practice ("Farming & herding (a good
  deal) and Persuasion (some). About half of it came from doing, the rest from practice."), merit ("(some merit)",
  "A good deal of merit."), the board in a sentence, a vital or a stat as a wound moves it ("speed down somewhat"), the
  worth a wound costs, 49's "best 35 at 19", the duel's blows ("— a cut."), decisions' "A proficiency at 50", "Learning
  55", "Intrigue 30+" as tiers, a companion's "fit 42". A captain's or a general's skills are tiers where they are listed
  ("(Cunning, command Adept)", "· command Journeyman · tactics Apprentice"): only after "(", ", " or "· ", never a head
  count ("You command 4,500 men" stays) or a tooltip's sum ("command 45 ÷ 12" stays). The war games' "(your tactics 47 vs
  52)" and "(47 vs 52)" are said as a pair ("your tactics fall just short of theirs").
- **Old 20's garbled lines:** 23-after-action's "the captains reckon it: X +20%" reads "X (for you, a great deal)"; its
  report's "(+18%)" reads "(a good deal)" and its card's rows "▲ a great deal"; the orders' "Moves +25% faster" reads
  "Moves about a quarter faster".
- **Old 22: foreign sums are hearsay.** A sum that changes hands between crowns is rounded to what the road says
  ("Solenne sends some 900,000 suns"). The rule reads only the sentence the sum is in, and needs a verb of payment
  (sends, owes, pays, lends, tribute, a loan) and the name of a realm the player does not rule. A sentence that speaks of
  "you" (the player's own purse, loans and ransoms), one that names the player's own crown, and a sum already hedged
  ("about 2,000 suns") keep their words.

Rendering only: the engine, the state, the logs as stored and the tooltips' sums keep their numbers.

Test `v2sNoBareNumbers`: two bot lives over 9 years (a commoner in a post, a noble captain), every tab, World's five
views, the profile, the proficiencies, the pages of family, the ruler and office holders, the War Room and a duel (157
pages). It fails on a line with a stat word and a bare number, an element whose tooltip key names a 0-100 measure that
still holds digits, or a bar whose value is a bare number, and it reads the playtest's own lines through the same words.
On the build without this file it finds 523; with it, none. 35-moods' needs and the drill bars are left to the groups
that own them.

Not changed here: gear's "damage 6, pierce 2" (an item's own figures), the drill bars ("Charge 45 drilled"), the
needs card, infamy's number in the Coalitions header, and the tooltips' breakdowns, which still show their sums.

Other features' tests changed: `49-body-mind` `bodyMindRenderPure` looked for the lost eye's "Bows & throwing −15" in the
full profile; with v2 it also accepts "Bows & throwing down a good deal" (the cost is still named and sized).
