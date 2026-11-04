# Honest duel odds

**Aspect:** Power scaling · **Kind:** system (small)

XCOM's lesson: odds on screen must be the odds the engine rolls. The release showed `100/(1+e^(-d/12))` on the fighting-worth gap `d`, which understated a stronger fighter's real chances by up to 15 points: 79% shown where duels went 88–93%, 88% shown where they went 97%.

`A.shownDuelOdds(a, b)` (in `odds.core.js`) is `1/(1+e^-(d/scale(m) + seat))`, where `m` is the two fighters' mean worth and `scale(m) = 5.85 + 3.5·(m − 70)/100` (never below 3). The curve is wider between masters than between brawlers. Two brawlers of worth 50 have a scale of 5.2, so 10 worth is about 2 logits. Two masters of worth 110 have a scale of 7.3, so 10 worth is 1.4 logits. A master's last points of worth are mostly skill and speed, and the duel engine values those less than the strength and stamina a lower tier gains. The seat term is −0.22: the player's seat (auto-played by `A.duelAuto`) is about 5.5 points weaker in an even fight. The person view ("would usually beat you") uses it through patch `ODDS-VSYOU`. 48-fight-ladder adds the weapon a person would draw and both fighters' health on top (`FL.scaleAt` reads `A.duelScale`).

## The round-7 refit

The scorecard showed "largest gap between shown and real duel odds" at 9 points (target ≤ 5). It had been 4 before rounds 6 and 7.

**Why it moved.** The bench (`bench/run.mjs --only=duels`) plays 150 duels in each of 6 cells (worth gap of 0, 1 or 2 tiers, with the strong fighter in either seat), in one world (seed 77). In the even cells that is a standard error of 4 points, so one seed's largest gap is mostly noise.

- 16 worlds (seeds 77–92) under the old fit gave a largest cell gap of 1 to 13 points (median 5). In 6 of 16 worlds it was over 5.
- Pooled, those 16 worlds give 2,400 duels a cell. The old fit's real bias was smaller, 2.6 points at most, and it had a cause: today's duel rules make the player's seat weaker (−0.22 logits, not −0.14). Every cell overstated the player's seat by 1.5 to 2.6 points.
- At seed 77 alone, the "9" came from one even cell: the player's seat won 57% of 150 duels, against 45–47% pooled.

**The fit.** Maximum likelihood on 14,400 bench-style duels (seeds 77–92), checked on 14,400 more (seeds 200–215). A fresh pair of `A.makeFoe` fighters fights each lethal duel.

| Pooled 2,400 duels a cell (real − shown) | 0 tiers, strong in the player's seat | 0 tiers, strong as the NPC | 1 tier, player's seat | 1 tier, NPC | 2 tiers, player's seat | 2 tiers, NPC |
| --- | --- | --- | --- | --- | --- | --- |
| Old fit (6.1, −0.14), seeds 77–92 | −1.5 | +2.6 | −1.7 | −0.3 | +0.5 | +0.7 |
| Old fit, held-out seeds 200–215 | −2.8 | +1.1 | −2.6 | +0.7 | −0.4 | +0.8 |
| New fit, held-out seeds 200–215 | −1.2 | −0.4 | −1.5 | −0.1 | −0.1 | +0.6 |
| New fit, third set (seeds 300–315, in the build) | +2.2 | +1.8 | −2.3 | −1.1 | +0.7 | +0.2 |

- **Log-likelihood on the held-out set:** −5,198 (old), −5,187 (a constant scale of 6.15), −5,156 (the worth-dependent scale).
- **1,000 duels a cell, one world each:** with the new fit, the largest gap is 1.9 points at seed 77, 2.0 at 78, 1.5 at 85, 1.5 at 96 and 1.1 at 81. Seeds 85 and 96 gave 12 and 10 points at 150 a cell.

**The bench's own number stays noisy.** One seed at 150 duels a cell gave a largest gap of ≤ 5 in 15 of 20 worlds (seeds 77–96) with the new fit, against 11 of 16 with the old one. Seed 77 itself reads 11, because its 0-tier cell is a 2.5-standard-error draw, and no curve can fit that without fitting noise. Raising the bench's `150` to `1000` duels a cell would make the metric hold across seeds: about 7 s instead of 1 s. That is a change to `bench/run.mjs`, which is not this feature's file.

**A check against 48-fight-ladder's lab** (`bench/fights-audit.mjs`): the player hurt to 40–100 and a third of foes drawing a weapon, 11,953 lethal duels. A joint fit of both labs gives seat −0.219, a health term of 3.2 and a drawn-weapon term of 0.77, which are the constants 48 uses. On that lab alone the new fit's mean bin error is 0.8 points (0.5 with the old one) and its worst bin is 5.2 (2.7 with the old one): the 10–24% bin, which both fits under-call. On the bench lab the new fit's mean bin error is 1.0 (1.5 with the old one) and its worst bin is 3.3 (4.3 with the old one).

## Measured by

| Test | Result |
| --- | --- |
| `honestOdds` | Monotone in worth, the seat asymmetry within 11.5 points (the measured seat, −0.22, swings an even fight by 11 in all), the person view's line uses the function, and 160 duels within 8 points |
| `honestOddsCells` | The bench's own procedure, pooled over two worlds to 1,200 duels a cell. Every cell within 5 points and within 3.5 standard errors plus a point. Full build: worst cell 1.5 points |

48-fight-ladder's `flDuelOdds` (whose profile part reads this function) and `flHonest` pass on the full build.

## Limits

- The fit is for duels auto-played on both sides. A skilled human playing the duel screen does better than the bot.
- Worth does not price every part of a fighter alike. Tier-4 fighters (who gain strength and stamina) beat tier-3 fighters 93% of the time, against 85% shown. Tier-6 fighters (who gain mostly skill and speed) beat tier-5 fighters 71–78% of the time, against 80–86% shown. The bench's cells pool the tiers, so this cancels out there. A person view between two particular tiers can still be off by up to 8 points. Fixing it means weighing the body more in `A.fightWorth`, which every fight in the game reads.
- Re-fit after any change to duel rules, pooling worlds: `node bench/run.mjs <html> --only=duels`, run over several seeds.
