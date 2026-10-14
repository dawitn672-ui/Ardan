# Scorecard

Measured by `bench/run.mjs`, compared by `bench/compare.mjs release fixes current`. Each metric has a target taken from the benchmarks in `docs/benchmarks/`; ✅ meets it, ◐ is at least halfway, ✗ is short. "Measured" scores count only what a bot or test can see; feel, clarity and art need people, so no aspect can reach 10 on measurement alone.

| Build | release | fixes | current |
| --- | --- | --- | --- |
| Build id | `b593143@2026-10-12` | `b593143+f6.00e35fd` | `b593143+f19.c2c0f96` |

## Events and story

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Events that read an earlier memory (all events) | ≥ 40% | 3 ✗ | 3 ✗ | 15.8 ✗ |
| Fired events that read a memory (bot lives) | ≥ 40% | 1.8 ✗ | 1.3 ✗ | 8.4 ✗ |
| Flags set but never read | 0 | 369 ✗ | 369 ✗ | 139 ◐ |
| Strict recipe events (2–3 choices, a roll, stat nudges only) | ≤ 10% | 25.7 ✗ | 25.7 ✗ | 22.6 ✗ |
| Old-age events | ≥ 150 | 41 ✗ | 41 ✗ | 49 ✗ |
| **Measured score** (cap 8 without people) | | **0.7** | **0.6** | **3** |

## Power scaling

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Largest gap between shown and real duel odds | ≤ 5 points | 14 ✗ | 17 ✗ | 4 ✅ |
| Player-seat edge in even duels | ±5 points | 0 ✅ | -2 ✅ | -2 ✅ |
| **Measured score** (cap 9 without people) | | **5** | **3.6** | **9** |

## Character and life sim

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Check success rate in bot lives | 45–65% | 38.4 ✗ | 40.3 ✗ | 36.5 ✗ |
| Initiative actions per year (engaged bot) | ≥ 6 | 4.4 ◐ | 4.1 ◐ | 4.2 ◐ |
| **Measured score** (cap 7 without people) | | **3.3** | **3.5** | **2.8** |

## Relationships and people

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| NPC-started moves toward the player per decade | ≥ 3 | 0 ✗ | 0 ✗ | 9.8 ✅ |
| **Measured score** (cap 7 without people) | | **0** | **0** | **7** |

## War

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Battles the player fought that end with an after-action report | 100% | 0 ✗ | 0 ✗ | 0 ✗ |
| **Measured score** (cap 7 without people) | | **0** | **0** | **0** |

## Diplomacy and politics

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| War declarations: aggressive vs peaceful rulers (per ruler-year) | ≥ 2× | 1.3 ✗ | 0.8 ✗ | 5.3 ✅ |
| **Measured score** (cap 8 without people) | | **2.1** | **0** | **8** |

## Economy

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Best buy-then-sell-back loop (10 round trips) | ≤ 0 suns | 293 ✗ | 0 ✅ | 0 ✅ |
| Median price spread across markets (max/min) | 1.5–3× | 2.2 ✅ | 2.2 ✅ | 2.2 ✅ |
| **Measured score** (cap 7 without people) | | **1.9** | **7** | **7** |

## Balance and difficulty

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Median death age, humans and orcs (bot lives) | 55–70 | 47 ◐ | 45 ◐ | 48 ◐ |
| Risk costs: careful bots outlive reckless ones by (years) | ≥ 5 | 22 ✅ | 17 ✅ | 12 ✅ |
| **Measured score** (cap 7 without people) | | **5.8** | **5.8** | **5.8** |

## UI and UX

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| WCAG 2.2 AA violations (axe, 24 screens) | 0 | 20 ◐ | 20 ◐ | 0 ✅ |
| Serious or critical a11y findings | 0 | 20 ◐ | 20 ◐ | 0 ✅ |
| **Measured score** (cap 6 without people) | | **3** | **3** | **6** |

## Technical

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Corrupted saves in save/load cycles | 0 | 0 ✅ | 0 ✅ | 0 ✅ |
| Milliseconds per game day | ≤ 5 ms | 1.1 ✅ | 0.8 ✅ | 0.6 ✅ |
| Page errors during the bench | 0 | 0 ✅ | 0 ✅ | 0 ✅ |
| **Measured score** (cap 9.5 without people) | | **9.5** | **9.5** | **9.5** |

## Replayability

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Distinct life arcs in bot lives | ≥ 8 | 11 ✅ | 9 ✅ | 10 ✅ |
| Share of the most common arc | ≤ 25% | 25 ✅ | 20.3 ✅ | 21.9 ✅ |
| **Measured score** (cap 8 without people) | | **8** | **8** | **8** |

## Pacing and core loop

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Longest usual wait between prompts (p90, seconds at default speed) | ≤ 45 s | 45.3 ◐ | 38.3 ✅ | 32 ✅ |
| Prompts per in-game year | ≥ 6 | 4.5 ◐ | 4.9 ◐ | 5.5 ◐ |
| **Measured score** (cap 6 without people) | | **5.5** | **5.6** | **5.8** |

## Uniqueness

| Metric | Target | release | fixes | current |
| --- | --- | --- | --- | --- |
| Signature systems present (chronicle, belief vs truth, both scales) | 3 of 3 | 0 ✗ | 0 ✗ | 1 ✗ |
| **Measured score** (cap 6 without people) | | **0** | **0** | **2** |

## Total

| | release | fixes | current |
| --- | --- | --- | --- |
| Mean measured score (out of 100) | 34.5 | 35.8 | 56.8 |
