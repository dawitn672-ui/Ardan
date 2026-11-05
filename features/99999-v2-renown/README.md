# 99999-v2-renown: renown from the best deeds, promotion as a chance

**Aspect:** V2_SPEC complaint 15 (fame and promotion are linear) · **Kind:** adapter, 3 code files, 3 patches, no events.

Playtest 1 saw renown at 100 by age 38 and merit shown as counters. This wires the game's fame and its career
ladders to `src/v2/renown.js` (`recordDeed`, `renown`, `renownWords`, `promotionCheck`).

## Renown (`a-deeds.core.js`)

- Every gain of the player's fame (`A.fame(pc, d)`, which events, fights, duels, battles, offices and decisions all
  call) is a **deed**, kept in `pc.rn.d` (`{ w, year, month, text, field }`, at most 60):
  - weighted by the **odds it beat**: `1 + 0.6 ln(1/q)`, with `q` the check's chance (`A.V2S.last.pct`) or the duel's
    gap; a sure thing counts once, one chance in five about twice;
  - and by **who saw it** (v2's witnesses): a duel before the lists is seen by the court, a mission by the company, a
    battle (the old battle screen, v2's battle, the world sim's division fights) by the army, an event by comrades.
    A large change of the game's own fame is never quieter than its size says (5+ company, 10+ court).
- **Renown** is v2's `renown()`: the best deed counts fully, the next less and less, and deeds fade (×0.88 a year).
  So a life of small deeds levels off, and one great deed outweighs many small ones.
- What does not fade: the standing you were born to (the fame a start gives) is a **base**, and a name once made
  keeps half its best. A fall of fame (a disgrace, a lost duel) is a **stain** that fades the same way.
- The game's fame (`pc.fame`, which conditions, checks and thresholds read) is derived from renown on a curve that
  never reaches 100: `F(R) = 100 R^0.85 / (R^0.85 + 45^0.85)`, with the game's fame points worth 2 of v2's weight
  units. It reads 64 at "a name in the realm", 78 at "famous", 89 at "a living legend".
- A direct write to `pc.fame` (a start, an event, a test) is folded into the base. An old save with no `pc.rn` takes
  its fame as the base. Other people keep the game's fame as it was.
- **Words:** renown is said with v2's `renownWords` everywhere 99993-v2-stats bands it (the profile, another
  person's sheet, a requirement), through `VS.band`; `A.RN.words(fame)` for anyone.

## Promotion (`b-promo.core.js`, patches RN-MIL and RN-JOB)

- The game's ladders stay (`GD.MIL`, `GD.CAREERS[c].ranks`) with their real gates (months at rank, the skill and
  letters a post asks, an army to command, gentle birth for the high seats, free to rise).
- The **merit counter is no longer a gate**. Where the army's board (every three months) and a post (every month)
  rolled their chance, they roll v2's `promotionCheck()`: a hazard from the **vacancy** (wide at the bottom, narrow
  at the top, wider in war), the **standout deed** of the last 18 months against what the rank asks (2.5 × 2.1^rank),
  **steady service**, and a **patron** (a superior who pushes for you, a patron at court). The board's other factors
  (a gate unmet, a family's pull, the ruler's regard, being of another people; a post's performance) scale it.
- **Service:** a month in which the game's merit counter rose is a deed of service on that ladder's field (counted
  for promotion, never for renown), so steady work still moves you, slowly and irregularly.
- A deed three times what the rank asks can **skip a rank** (v2's 30%), below the high command for the army.
- The board's merit row is now "A deed that stands out" (a post's: "Work that stands out"), in words; the year's
  summary says where you stand for the next rank in words; the army card on the Path tab, the war room's line and a
  superior's "Not yet" lose their merit counter (patch RN-WORDS); "Merit +7", "(Merit +15)" and "Renown +3" become
  words in the text (`c-words.core.js`, through 99993-v2-stats' sweep).
- 59-tooltips' Path tips (the board's odds, merit, a board row, the rank) explained the counter, its formula and a
  percentage a year; they now say what the board asks, in words: the standout deed, the places above you, steady
  service, a patron.

## Tests (`test.mjs`)

- `rnGreatDeed`: one great deed at long odds before the army outweighs twenty small ones (v2's test, in the game).
- `rnNoSaturate`: a busy 60-year life levels off well short of 100 where the old fame sits at 100; a real 60-year
  noble life the bot plays (the seed that stood at 99 by 55 before) stays short of it.
- `rnPromoNonlinear`: 60 careers through the game's own board: gaps' CV > 0.6, some within a year, some over five
  years, ranks skipped; no deeds and a full merit counter rarely raise anyone; no merit counter on the board.
- `rnJobBoard`: a post's board has no merit counter; the deed row is soft.
- `rnNoCounters`: the soldier's Path tab, the promotion tips and the log lines carry no merit counter (playtest 1, 2).
- `rnWords`: renown in words on the profile and another person's sheet, never a number; an old save keeps its fame.

## Measured (Nov 5, `node bench/balance.mjs --workers=2`, 12 lives a path, 70 years)

Every path inside its bands in `bench/targets.mjs` (none widened). Median peak fame, and the spread of the 12 peaks:
serf 41 (7–62), peasant 48 (14–67), artisan 37 (0–67), merchant 53 (24–60), noble 62 (41–81), royal 45 (28–81). The
highest peak of the 72 lives is 81; before, a noble's median peak was 96 and several lives sat at 100. The league's
first noble life (seed 7156) peaked at 99 by 55 before; now 68, and 64 at 38.
