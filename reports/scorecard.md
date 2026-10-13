# Scorecard

Measured by `bench/run.mjs`, compared by `bench/compare.mjs release fixes`. Each metric has a target taken from the benchmarks in `docs/benchmarks/`; ✅ meets it, ◐ is at least halfway, ✗ is short. "Measured" scores count only what a bot or test can see; feel, clarity and art need people, so no aspect can reach 10 on measurement alone.

| Build | release | fixes |
| --- | --- | --- |
| Build id | `b593143@2026-10-12` | `b593143+f6.3ecc966` |

## Events and story

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Events that read an earlier memory (all events) | ≥ 40% | 3 ✗ | 3 ✗ |
| Fired events that read a memory (bot lives) | ≥ 40% | 1.8 ✗ | 1.3 ✗ |
| Flags set but never read | 0 | 369 ✗ | 369 ✗ |
| Strict recipe events (2–3 choices, a roll, stat nudges only) | ≤ 10% | 25.7 ✗ | 25.7 ✗ |
| Old-age events | ≥ 150 | 41 ✗ | 41 ✗ |
| **Measured score** (cap 8 without people) | | **0.7** | **0.6** |

## Power scaling

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Largest gap between shown and real duel odds | ≤ 5 points | 13 ✗ | 11 ◐ |
| Player-seat edge in even duels | ±5 points | -3 ✅ | -5 ✅ |
| **Measured score** (cap 9 without people) | | **5.4** | **6.3** |

## Character and life sim

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Check success rate in bot lives | 45–65% | 38.4 ✗ | 40.3 ✗ |
| Initiative actions per year (engaged bot) | ≥ 6 | 4.4 ◐ | 4.1 ◐ |
| **Measured score** (cap 7 without people) | | **3.3** | **3.5** |

## Relationships and people

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| NPC-started moves toward the player per decade | ≥ 3 | – | 0 ✗ |
| **Measured score** (cap 7 without people) | | – | **0** |

## War

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Battles the player fought that end with an after-action report | 100% | – | 0 ✗ |
| **Measured score** (cap 7 without people) | | – | **0** |

## Diplomacy and politics

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| War declarations: aggressive vs peaceful rulers (per ruler-year) | ≥ 2× | 1.5 ◐ | 0.9 ✗ |
| **Measured score** (cap 8 without people) | | **4.2** | **0** |

## Economy

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Best buy-then-sell-back loop (10 round trips) | ≤ 0 suns | 293 ✗ | 0 ✅ |
| Median price spread across markets (max/min) | 1.5–3× | 2.2 ✅ | 2.2 ✅ |
| **Measured score** (cap 7 without people) | | **1.9** | **7** |

## Balance and difficulty

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Median death age, humans and orcs (bot lives) | 55–70 | 47 ◐ | 45 ◐ |
| Risk costs: careful bots outlive reckless ones by (years) | ≥ 5 | – | 17 ✅ |
| **Measured score** (cap 7 without people) | | **3.5** | **5.8** |

## UI and UX

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| WCAG 2.2 AA violations (axe, 24 screens) | 0 | 20 ◐ | 20 ◐ |
| Serious or critical a11y findings | 0 | 20 ◐ | 20 ◐ |
| **Measured score** (cap 6 without people) | | **3** | **3** |

## Technical

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Corrupted saves in save/load cycles | 0 | 0 ✅ | 0 ✅ |
| Milliseconds per game day | ≤ 5 ms | 1.3 ✅ | 1.3 ✅ |
| Page errors during the bench | 0 | – | 0 ✅ |
| **Measured score** (cap 9.5 without people) | | **9.5** | **9.5** |

## Replayability

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Distinct life arcs in bot lives | ≥ 8 | 11 ✅ | 9 ✅ |
| Share of the most common arc | ≤ 25% | 25 ✅ | 20.3 ✅ |
| **Measured score** (cap 8 without people) | | **8** | **8** |

## Pacing and core loop

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Longest usual wait between prompts (p90, seconds at default speed) | ≤ 45 s | 45.3 ◐ | 38.3 ✅ |
| Prompts per in-game year | ≥ 6 | 4.5 ◐ | 4.9 ◐ |
| **Measured score** (cap 6 without people) | | **5.5** | **5.6** |

## Uniqueness

| Metric | Target | release | fixes |
| --- | --- | --- | --- |
| Signature systems present (chronicle, belief vs truth, both scales) | 3 of 3 | – | 0 ✗ |
| **Measured score** (cap 6 without people) | | – | **0** |

## Total

| | release | fixes |
| --- | --- | --- |
| Mean measured score (out of 100) | 45 | 37.9 |
