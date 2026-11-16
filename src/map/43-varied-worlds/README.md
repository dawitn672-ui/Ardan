# A different world each run

**Aspect:** Replayability (Road to Ten, Replay 3) · **Kind:** system and 2 patches

The plan asks to "vary the world each run: different starting tensions, history branching differently, and smaller realms generated fresh". The release already branches history once the game begins. It rolls 13 scripted forks at the start (`A.rollBranches`: a war that comes or doesn't, a wedding, a fall, a giants' rising) and plays them out in the first year; the first audit missed this. But every run starts from the same map. Three seeds gave the same borders, the same single war, the same treasuries to the coin, the same stability and the same 40 alliances.

**What it does.** A game started from the menu rolls a varied world (`o.world: 'varied'`), all from the game's own seed:

- **Fortunes.** Each realm's treasury ×0.6–1.4, and stability ±15.
- **Old wars that went the other way.** Two to four borders where one or two frontier provinces changed hands 4–30 years ago. Capitals and garrisoned provinces never move. The loser still claims them, because the province's old owner is kept.
- **Feuds.** Up to two rival neighbours are already at war.
- **Falling-out.** Up to three alliances are broken.

What was rolled goes into the world's history (`S.history`) and is told at birth: "The world you are born into is not quite the one the old maps show. Calandor is Varenna's, won from Sylvaran 28 years ago, and Sylvaran still claims it. …"

The creation screen offers **World: Varied** (the default) or **As written**.

Games started by code, such as the tests and the bot league, keep the world as written unless they ask for a varied one, so the measurements stay comparable.

**Measured by** (`test.mjs`).

- `worldAsWritten`: three seeds without the option give the identical map, treasuries and wars, with no notes.
- `worldsDiffer`: ten varied worlds give 10 different maps (3–6 provinces moved), 10 different sets of treasuries and 7 different sets of wars. Between 2 and 6 of the 40 alliances are broken.
- `variedWorldPlays`: three varied lives run five years each, start at home in their own realm, and are told what is different.
- `menuStartsVaried`: a life from the menu gets a varied world; "As written" keeps the map; the creation screen shows the choice.

**Rules kept.**
- Everything is drawn from the game's own seed, so the same seed and choices give the same world.
- `S.worldNotes` and `S.worldTold` are optional, so old saves load.

**Limits.**
- **No new realms.** The plan's "smaller realms generated fresh" is not done. The varied world rearranges the realms that exist.
- **No new rulers.** Rulers, houses and their traits are the world's own.
