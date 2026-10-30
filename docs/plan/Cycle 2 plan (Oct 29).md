# Cycle 2 plan: Oct 29

Cycle 1 is green on CI run 80 (89dfb45). The four cycle 2 reviews are in `docs/reviews/cycle-2/`:
- `lives.md`: 11 lives plus 19 A/B lives.
- `design.md`: the first hour, and 2,348 controls clicked.
- `world.md`: 12 worlds, 1,300 world-years.
- `visual.md`: 3 viewports, both themes, motion on and off.

Their common verdict: the systems exist, and the work now is **coherence and stakes**. One name for each thing, and a choice that says what it costs. The big new systems should reach the player and stay sane over a century.

## The answers to cycle 1's open questions

| Question | Answer |
|---|---|
| Civil wars with the Polity | The world bench halves them (34 → 17). The 4-world soak shows −12%. The cause is the same either way: legitimacy sits near 89 in every realm, so claimant factions (under 45) never form. That is a 9996 tuning bug. |
| Memories' share of opinion change | The share fell 18.1% → 13.3% on A/B lives. Total opinion change is about the same, and polity scenes make about 1% of it. The memories' own pull fell, from 66 to 45 points a year. Lane I traces it. |
| Traits changing 8–10 times | 2 to 9 times. About a third come from 9992's ripening thoughts, with an empty log line. Lives converge: zealous in 8 of 10, greedy in 7. |
| Great Continent treasury ×10 | ×13–20, but this is a starting purse filling to 56's steady state (3 years of income), then flat. It is not a runaway. The far ledger is still off. |

## Lanes

Each lane owns its folders only, builds to `/tmp/ardan/<lane>/`, runs its own feature tests and the core suites with one worker, and leaves the full run to CI. New features carry `.wip` until their lane reports done.

| Lane | Owns | Fix | Grow |
|---|---|---|---|
| **P** polity | 9996 | Office stacking, with no cap (lives 1). The muster reads the rank table backwards (lives 3). Legitimacy is stuck near 89, so claimants never form (world F1). Estates are never angry (F2). A deposed ruler gets no scene (lives 2). | The Politics screen: its sections above Build, folds, a designed layout (design 5, visual 3); bills that say their effect |
| **WD** war | 9997, 85 | One name per company everywhere (design 1). Captain and deserter churn, drift from the division totals (B3). Bread, pay and promotion sleep in peace (F8). Soldiers meet few company scenes (lives 5). | The company battle marks your unit, uses one colour code, uncrops the side labels, and keeps Next visible at 1920 (visual 4) |
| **E** world | 03, 04, 20, 45, 56, 57, 66, 68, 9995 | Bankrupt realms raise armies without limit (B1). A winning revolt stays rebel forever (B2). The same history every seed (F3). Prices only climb (F7). The Silk Road's brokers are broke (F5). Twin Rivers peaces (F4). "The The" war names (B6). The far ledger. Merchant money at 1.65M, and late sinks (lives 4) | — |
| **L** life | 36, 47, 74, 97, 992, 994, 996 | Forced siege scenes reach infants (design 4). Tier gates for Marshal and Chancellor (lives 6). The hearth mark for rulers (design 8). Raw CRE ids (lives 7). Old age at 50 (lives 8). Name collisions, and full names said 3–4 times (design 3). A step note that always says something true (design 7) | What now points at ventures, offices, journeys and arms; a ruler's desk (design 10) |
| **I** identity | 9992, 9993, 9994 | Ripening traits' empty log lines, and their convergence. Inner voices repeat. Day one stacks two goal questions. Chapter aims ask absurd sums. The childhood card shows rings. The share card's names and buttons. The memories' falling pull | The chapter card as a title card, not one more event |
| **G** visual | 62, 71, 84, 90, 91, 93, 96, 9991 | Day title contrast (visual 1). Map zoom stutter (visual 2). The map past the world's edge, and a pale wash (visual 5). The phone top bar overlaps (design 6). The long tabs: Codex, Dynasty, Holdings, Path and the road modal (visual 7, design 9). The small bugs (visual 8). The death screen's paper doll | The title as one composition, with a phone vista; the battle camera as a CSS transform |
| **S** stakes (new) | 9998-stakes, 92 | — | Readable stakes on every choice: what it costs, what it risks, why it is out of reach. White checks (retry later) and red checks (one shot), from the backtests |
| **A** advisors (new) | 9999-advisors | — | The ring of advisors from the backtests: a few people around you whose counsel shows on the choices that matter, built on 999 confidants and 9996 offices |

**Queued for the next grow batch:** weekly seeds and vows; moodlets and stress; chapter focus trees; the inquest; located wounds; house legacies; a coherence test (one name per thing); travel chosen from the Story/Map.

## Integration

1. Lanes report.
2. Integrate from a clean tree.
3. Push once, without `[skip ci]`.
4. Wait for every shard and both leagues.
5. Fix together and push once.
6. Send the owner the build.
7. Cycle 3 reviews.
