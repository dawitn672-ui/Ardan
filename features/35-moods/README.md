# Needs and moods

**Aspect:** Character and life sim (Road to Ten, Character 3) · **Kind:** system plus 14 events

The plan asks for "needs and moods that start events". The release had one feeling, `happy`, moved directly by events.

**What it does.**

- **Four needs** (`pc.needs`, 0 to 100). Each settles every month a quarter of the way toward where your life puts it, and what you do pushes it up or down:
  - **Rest.** It settles at 70. A light plan raises it; a hard (−25) or brutal (−45) one lowers it, as do being at war (−20) and poor health. It is met by rest, festivals, prayer and meditation. Hard activities (the yard, the road, a hunt) cost some.
  - **Company.** It settles at 25, plus 9 for each friend (up to 4), 15 for a spouse who loves you, and 4 for each of up to two children. It is met by a tavern, a friend, a festival, courting, or time with someone.
  - **Purpose.** It settles at 35, plus work and its rank, military rank, a crown or an office. It is met by work, study, practice, a venture, or teaching.
  - **Comfort.** It follows your coin against what feels like enough at your rank, plus your health, your freedom and prison.
- **Moods.** The lowest need, once it is below 30, sets a mood with its cause: Weary, Lonely, Adrift or In want ("Lonely: it has been months since you spent an evening with anyone"). Every need at 65 or more is **Content**. A new mood is noted in the story log, as `muted`.
- **Happiness.** Each month the average of the needs moves happiness: a neglected year ends at 37 and a tended one at 64, from 50.
- **Scenes.** 14 events start from moods (`C.mood(p, 'company')`), and each offers a way to meet the need at a price:
  - weary: three;
  - lonely: three, including a dog at the door;
  - adrift: three, including a season with a trader's carts and a youngster who wants to learn;
  - in want: three, including a moneylender whose terms grow up a year later;
  - content: two.
- **The Life tab.** A "How you are" card shows the mood, its cause and the four needs.
- **For other features.** `fx.need: { rest, company, purpose, comfort }` works in any event's effects. It is declared as an effect key (`A.FX_EXTRA`), so the event linter accepts it and the choice checker can read it.

**Measured by** (`test.mjs`):

- `moodsRunDownAndAreMet`:
  - a friendless artisan on a brutal plan settles at rest 35 and company 35 in six months;
  - a tavern gives +22 company, a rest +30 rest, and `fx.need` works.
- `moodsSetAndStartScenes`:
  - low company sets Lonely with its cause, and logs it;
  - the lonely scenes become eligible and the weary ones don't;
  - the neighbour's supper gives +30 company.
- `moodsMoveHappiness`: a neglected year ends at happiness 37, a tended one at 64.
- `moodsCard`: the card is on the Life tab, and drawing it is pure.
- `moodsInLives`: in two real 10-year lives, a low mood is present in 9% of months. Moods come and go.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs` (11 of 14 comparable, none obvious).

**A model that was wrong first.** The first version ran needs down by a fixed amount each month and refilled them only through activities, and bot lives were Weary 90% of the time. People sleep. Needs now settle toward where a life puts them, so a mood means something in that life is wrong (overwork, no friends, no role, no money), not that the player skipped a button.

**Limits.**
- **Happiness only.** Moods change happiness, not the odds of checks.
- **One need at a time.** Only the lowest need sets the mood, and needs don't interact (a lonely person doesn't rest worse).
