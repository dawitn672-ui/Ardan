# Fight odds

**Aspect:** Clarity and honest odds (the Road to Ten's "every risk is shown before you take it"; `24-honest-odds`, `48-fight-ladder`) · **Kind:** system (one core file, one patch), plus tests

## Why

A choice with a check shows its chance ("39% · risky"). A choice whose effect is a beast fight (`fx.beast`) showed nothing, so in "Bounty on a beast" the line that sends a peasant of 17 against a hell boar ("Take the bounty and hunt it") looked like the safe answer beside "Track it first … 39% · risky". Found while working out why human peasants in Varenna died young in the bot league: of 12 lives from 16, 10 died before 33, and beast fights the bot chose killed 8 of the 12 (the bot reads a choice with no odds as a sure one). The hell boar wins half its fights only against a fighter of worth 119; the peasant had about 40.

The duel screen already opens with the true chance and lets you flee, so the player was never sent in blind. But the choice itself should say so, as Crusader Kings III puts the risk of death on a scheme's button and XCOM the hit chance on a shot.

## What it does

- **The chance on the button.** When an event comes up, `A.eventView` marks each choice whose effect is a beast fight with `c.fight = { pct, beast, w }`: 48-fight-ladder's chance that you win that fight alone (`FL.resolve`, the curve the duel screen opens with, at your health and arms). The badge reads "2% · a fight", coloured as a check of those odds would be. With the numbers turned off (difficulty or the odds setting) it reads "a fight".
- **Which fight.** The effect's own `beast.id`, else the scene's beast (`ctx.beast`), as `A.applyFx` picks it. A function effect is read once, for a `beast: {` or for a call to `A.startDuel` / `A.startDuelFront`:
  - with `{beastId: ...}` it is a beast fight, at the call's `mod` (a trap's 0.6, arrows' 0.5: the beast's worth at that mod against its worth unharmed moves the curve) and with a hunting party if the call brings one (`party:`);
  - with a person, the one the scene names (`const t = A.P(ctx.pid)`) or a stranger of a tier (`A.makeFoe({tier: N})`), by 48's one-to-one curve and the fight's rule (a brawl, a bout, a fight). A foe the effect makes up as it goes (a grading bout) is badged without a number.
  Cycle 1 found the gap: the release's "The hunt" ("Attack it head-on", a function calling `startDuelFront`) carried no badge, and a merchant of 18 died to a crocodile from it in her first half-year. Every event was swept (22 such choices in 14 events: the hunt, the knight's beast, the bear pit, the sister-school hunt, the brawls of love rivals and insults, the grading bouts, the order's bouts, the titan and the flyer).
- **A check whose outcome is a fight** keeps its own odds and adds the fight after it: "40% · risky", then "then 22% · a fight" (the fight if the check works; its title gives the fight if it fails).
- **Not a check.** The field is `c.fight`, not `c.odds`: nothing is rolled, and the bot, the playtest log and the check counts read `c.odds`.
- **The duel screen agrees.** 48's opening measure read the beast unharmed; it now reads the beast's mod too (`FL.duelMeasure`), so a trap's fight opens with the number its badge showed.
- **Pure.** The chance is worked out once, engine side, when the view is built; drawing reads it.

## Measured by

- `foBadge`: five beast scenes, the hunt (its head-on charge badged: the cycle 1 bug) and a brawl, the badge on exactly the beast-fight choices, the same boar 2% for a peasant of 17 and 87% for a strong fighter, "a fight" with the numbers off, and drawing changes neither the state nor the random stream.
- `foInLives`: 36 years of three lives; every beast-fight choice met is marked, nothing else is.
