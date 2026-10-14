# Honest duel odds

**Aspect:** Power scaling · **Kind:** system (small)

XCOM's lesson: odds on screen must be the odds the engine rolls. The release showed `100/(1+e^(-d/12))` on the fighting-worth gap `d`, which understated a stronger fighter's real chances by up to 15 points: 79% shown where duels went 88–93%, 88% shown where they went 97%.

`A.shownDuelOdds(a, b)` (in `odds.core.js`) is fitted by maximum likelihood on 2,100 lethal duels across tiers 1–6 in three worlds: `1/(1+e^-(d/6.1 − 0.14))`, with a fresh pair of fighters for every duel (reusing fighters lets wounds pile up and skews the fit). The −0.14 is a small seat edge against the player, about 3.5 points in an even fight. The person view ("would usually beat you") uses it via patch `ODDS-VSYOU`.

| Worth gap | Real duels | New shown | Old shown |
| --- | --- | --- | --- |
| −16 | 6% | 7% | 21% |
| −8 | 22% | 22% | 34% |
| 0 | 53% | 50% | 50% |
| +8 | 78% | 79% | 66% |
| +16 | 88% | 93% | 79% |
| +24 | 97% | 98% | 88% |

**Measured by:** `bench/run.mjs --only=duels` (`maxShownVsActualErrorPct`, which reads `A.shownDuelOdds`) and the `honestOdds` test. **Limits:** the fit is for duels auto-played on both sides; a skilled human playing the duel screen does better than the bot. Re-fit after any change to duel rules.
