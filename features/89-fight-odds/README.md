# Fight odds

**Aspect:** Clarity and honest odds (the Road to Ten's "every risk is shown before you take it"; `24-honest-odds`, `48-fight-ladder`) · **Kind:** system (one core file, one patch), plus tests

## Why

A choice with a check shows its chance ("39% · risky"). A choice whose effect is a beast fight (`fx.beast`) showed nothing, so in "Bounty on a beast" the line that sends a peasant of 17 against a hell boar ("Take the bounty and hunt it") looked like the safe answer beside "Track it first … 39% · risky". Found while working out why human peasants in Varenna died young in the bot league: of 12 lives from 16, 10 died before 33, and beast fights the bot chose killed 8 of the 12 (the bot reads a choice with no odds as a sure one). The hell boar wins half its fights only against a fighter of worth 119; the peasant had about 40.

The duel screen already opens with the true chance and lets you flee, so the player was never sent in blind. But the choice itself should say so, as Crusader Kings III puts the risk of death on a scheme's button and XCOM the hit chance on a shot.

## What it does

- **The chance on the button.** When an event comes up, `A.eventView` marks each choice whose effect is a beast fight with `c.fight = { pct, beast, w }`: 48-fight-ladder's chance that you win that fight alone (`FL.resolve`, the curve the duel screen opens with, at your health and arms). The badge reads "2% · a fight", coloured as a check of those odds would be. With the numbers turned off (difficulty or the odds setting) it reads "a fight".
- **Which beast.** The effect's own `beast.id`, else the scene's beast (`ctx.beast`), as `A.applyFx` picks it. A function effect is read once for a `beast: {` and an id. A choice with no beast to name gets no badge.
- **Not a check.** The field is `c.fight`, not `c.odds`: nothing is rolled, and the bot, the playtest log and the check counts read `c.odds`. A choice that already has odds (a check whose failure starts a fight) keeps its own.
- **Pure.** The chance is worked out once, engine side, when the view is built; drawing reads it.

## Measured by

- `foBadge`: five beast scenes, the badge on exactly the beast-fight choices, the same boar 2% for a peasant of 17 and 87% for a strong fighter, "a fight" with the numbers off, and drawing changes neither the state nor the random stream.
- `foInLives`: 36 years of three lives; every beast-fight choice met is marked, nothing else is.
