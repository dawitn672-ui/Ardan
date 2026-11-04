# Benchmarks: Ardan against the best-designed games

Each document here takes one or two aspects from the Road to Ten. It shows how the games that set the bar actually solve the problem, then backtests Ardan against them. Every document has the same five parts:

1. **The bar:** what a 10 looks like in that genre.
2. **How the best do it:** the mechanisms, with numbers where they exist and source links.
3. **Backtest:** a table with columns for the metric, the reference game, Ardan today (measured), the target for a 10, and how to measure it in Ardan.
4. **North star:** Ardan's version with unlimited time, money and people.
5. **What to build now:** ranked by effort, with an acceptance test that can fail.

| Doc | Aspects | Reference games | Words | Links |
| --- | --- | --- | --- | --- |
| [world-lore-uniqueness](world-lore-uniqueness.md) | World and lore, Uniqueness | Dwarf Fortress, CK3 cultures, Kenshi, Pentiment, Caves of Qud, Disco Elysium | 6,000 | 99 |
| [power-balance](power-balance.md) | Power scaling, Balance | Kingdom Come, Mount & Blade II, Battle Brothers, Slay the Spire, FTL, XCOM 2 | 8,000 | 103 |
| [character-lifesim](character-lifesim.md) | Character and life sim | Kingdom Come, CK3 lifestyles and stress, The Sims 4, RimWorld, BitLife, Elder Scrolls, Wildermyth | 8,600 | 127 |
| [events-story](events-story.md) | Events and story | King of Dragon Pass, Six Ages, CK3 story cycles, 80 Days, Sunless Sea, Failbetter, RimWorld storytellers | 8,600 | 126 |
| [relationships](relationships.md) | Relationships and people | CK3 schemes and hooks, RimWorld social, Dwarf Fortress, The Sims, the Nemesis system, Wildermyth | 7,600 | 76 |
| [war](war.md) | War | Hearts of Iron IV, Mount & Blade II, Total War, Battle Brothers, King of Dragon Pass | 6,400 | 36 |
| [diplomacy-economy](diplomacy-economy.md) | Diplomacy and politics, Economy | CK3 and EU4 AI, Stellaris, Victoria 3, Patrician, Mount & Blade trade, Anno | 8,100 | 48 |
| [replayability-pacing](replayability-pacing.md) | Replayability, Pacing (a new aspect) | RimWorld storytellers, Hades, Slay the Spire, FTL, CK3 dynasties, Dwarf Fortress legends, Reigns, BitLife | 8,300 | 71 |

## How much to trust these documents

- **Who wrote them.** Each was written by a research agent working from web search, the game's code and the measured reviews in `docs/reviews/`. One agent reports that page fetches were blocked in its session, so some claims rest on search summaries of the linked pages. Claims the agents could not source were left out or marked.
- **The fact-check pass did not run.** The plan was to give each document a second agent whose only job was to refute its claims. A usage limit stopped that pass before it reached any document, so **no document has been independently fact-checked**.
- **Spot checks since then.**
  - The RimWorld skill cap holds: a soft cap of 4,000 XP per skill per day, after which gains drop to 20% ([RimWorld wiki](https://rimworldwiki.com/wiki/Skills)).
  - CK3 trait values for AI personality are cited from the game's own files, but a web search did not confirm the exact −200..+200 range, so it is marked unverified.
- **How to read the rest.** Treat a number about another game as "sourced, not re-verified". Before quoting one outside this repo, follow its link.
- **Two research tracks did not finish.**
  - *UI, art and accessibility* (CK3 tooltips, Into the Breach, Pentiment, the Game Accessibility and Xbox guidelines, Hodent).
  - *How great studios test games.*
  Accessibility is measured anyway: `bench/run.mjs` runs axe-core with WCAG 2.2 AA and best-practice rules over 24 screens.

## Where the numbers about Ardan come from

The "Ardan today" columns come from code reading and bot lives on the build of the day. The scorecard in `reports/scorecard.md` measures the same things repeatably for three builds: the original release, the fix layer, and the current build (`node bench/run.mjs`, `node bench/compare.mjs`).

The north-star sections of these eight documents are gathered into one picture in [docs/north-star](../north-star/README.md).
