# No obvious choices

**Aspect:** Events and story (Road to Ten, Events 7) · **Kind:** tool plus 16 content fixes

The plan asks for an event checklist and "a bot that flags events with an obviously best choice". A choice where one
option is better on every count is no choice: a player who learns it stops reading.

**The checker** (`tools/lint-choices.mjs`, analysis in `tools/choice-analyzer.mjs`).

- **Scoring.** Each choice is scored on what a player wants more of and what they want less of.
  - *More:* coin, happiness, health, fame, honour, piety, each stat, each skill on its own, standing (favour, merit, reputation), and the other person's opinion.
  - *Less:* wounds, prison, punishment, death, infamy.
  - *Checks:* a choice with a check is scored at the odds a typical character (skill 45) has against its difficulty, 1.6% a point, as in `A.checkOdds`.
- **The rule.** A choice is obviously best when it is at least as good as every other on every count, better on one, and no riskier: it has no check, or every choice has one.
- **What it skips.**
  - Choices that differ in what they change beyond numbers (a trait, a follow-up event, a relation, a job) are not compared: that is where the story lives.
  - Memory flags don't count as such a difference, because the player doesn't see them.
  - Choices with function effects can't be read, and are counted as such.
- **Modes.**
  - `--all-features` checks every event the features add, and fails if any is flagged. `tools/check.mjs`, and so CI, runs it.
  - `--feature=x` checks one feature.
  - With neither, it checks the whole build and lists the worst cases.
  - The bench reports `events.obviouslyBestPct`, and the scorecard scores it (target 0%).

**What it found.**

| Build | Comparable by numbers | Obviously best |
| --- | --- | --- |
| Full build, before this feature | 206 | 19 (9.2%): 16 release events and 3 of 29-starts' own |
| After | 194 | 0 |

Two earlier drafts of the checker were wrong, and the fixes are kept:

- *All skills as one number:* +3 tactics and +3 logistics are a real choice of what to get better at.
- *Every check at even odds:* a difficulty 55 check is much harder than a 45, so "attempt something bold" against "make something safe" is a real gamble.

**The fixes** (`patches.mjs`, content blob). Each gives the other side a reason, or the favourite a cost, in keeping with its own text:

- The blood oaths ("a cut thumb", "palms cut") cost a little health.
- A day spent with an old friend costs the day's earnings.
- Hiding a debtor costs a week of fear.
- An orphan student must be fed.
- A failed kneel before the throne is now a public humiliation.
- Refusing a gift, reminding an old enemy, sending back a jug and asking a rival why each now give something: honour, will or insight.
- Declining a guild post keeps your evenings.
- Pointing out every flaw shows in your merit.

The 3 of 29-starts' own were fixed in that feature.

**Measured by** (`test.mjs`):

- `choicesNoneObvious`: no event in the build has an obviously best choice.
- `choicesCheckerCatches`: three planted events.
  - One choice better on every count is flagged.
  - A trade (coin against happiness) and a gamble (a sure 5 against a check for 30) are not.

**Limits.**
- **Not every event is checked.** Only about 200 events are comparable by numbers; most choices change a trait, a relation or the story, and about 1,000 use function effects the checker can't read.
- **No fairness check.** The checker finds dominance, not near-dominance or a choice that's merely weak.
