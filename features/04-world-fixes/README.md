# World and economy fixes

**Aspect:** Economy, Diplomacy, War · **Kind:** fix (applied in every build)

Free money, AI debt never repaid, stacking reparations, stability below zero, siege resets, a money loop.

## Patches

| Patch | Why |
| --- | --- |
| `WLD-MERC-NO-CONTRACT` | A mercenary with no contract was still paid 1.3x rank pay every year by nobody (a rank-6 merc earned 9,100 idle). No contract, no pay. |
| `WLD-REPARATIONS-EXCLUSIVE` | "Reparations" and "Crushing reparations" could both be ticked and were both paid: 3.5x gold for cost 44 beat the crushing option alone (2.5x for 30). They are now one choice: the engine keeps only the crushing one if both arrive, and ticking one unticks the other. |
| `WLD-AI-DEBT` | AI realm debt never went down: only interest (8%) was charged, nothing repaid the principal, and surplus gold above 3x income was deleted for +1 stability instead. Realms now repay principal from cash above half a year's income, and the surplus rule pays debt before it burns anything. |
| `WLD-STABILITY-FLOOR` | Five places lowered realm stability with no floor (capital lost -15, a coup -15, bankruptcy -4, empty treasury -6, a raging faction -10), so readers inside the year (prices, industry, factions) could see negative stability. |
| `WLD-FACTION-WAR-CHECKS` | When a crown yielded to a war faction, it declared war while skipping the checks every other declaration runs: truces, defensive treaties, being already hostile, and the cap of 4 wars at once. Those checks now apply; with no lawful target, no war. |
| `WLD-SIEGE-OWNER` | A siege belonged to whichever division was first in the list, so when an allied division ended up first the progress reset to 0 (and the decay check used the same test). The siege now stays with the realm already running it while it still has troops there, otherwise it goes to the realm with the most men. |
| `ECO-THIN-MARKET-SPREAD` | Buying one load raises the price by 0.3/depth (up to 10% in thin markets) while a skilled trader's spread could be 2%, so buying and selling straight back at home printed money (about 570 suns per 20 click pairs for pearls). Thin markets now have a wider spread: at least 0.2/depth, which keeps any buy-then-sell-back round trip at a loss. Deep markets are unchanged. |

## Tests

`world`, `economy` in `test.mjs`. Run them with `node tests/run.mjs --features=world-fixes`.

## Cycle 2: a broke crown cannot raise armies (`broke.core.js`; world review B1)

The release's `A.indMonth` raised levies (`A.emergencyLevy`), finished recruits (`A.queueStep`) and refilled divisions (`A.divReinforce`) with no look at the purse, and charged its workshops' wages to any treasury. The League of the Nine Wells (one oasis, an income of 26,690) reached 1.47 million men and 33.6 million of debt in one soak.

- **Broke** (`A.WF.broke`): treasury below zero and debt above a year's income. A broke AI crown calls no levies, finishes no recruits and refills no divisions.
- **Workshops** are paid only from a treasury above zero. Below it the month's work is not done: its cost is given back and its output taken off the stock.
- **Disbanding.** At each New Year, a crown whose debt is above two years' income sends home its newest divisions (never its guard, never the player's) until its host's pay (3.2 suns a man) fits in 90% of its income. Half the men go back to the levy, and the news says so.
- **Patch `WLD-DIV-ARTICLE`.** "The The Chain Keepers is cut off and destroyed" (B5): `A.divThe(name)` adds "The" only to a name without one.

Test `brokeCrownHolds`: a crown kept broke for a year with its taxes cut to a twentieth goes from 8 divisions to 2. Its host's pay falls to 47,053 against an income of 72,576, and its levies and refills are held.
