# Every rank's battle moves the war

**Aspect:** War (Road to Ten, War 1) · **Kind:** system and 1 patch, plus a bench harness (`bench/rankfx.mjs`)

The plan asks: "Give every rank its own battle play. A soldier makes 3 to 5 choices in a personal battle (where to stand, when to push, who to save). A captain orders his company (hold, charge, fall back, cover the flank). A general runs the map layer. Each layer must move the result by 10 to 20%."

The release already has a layer for each rank. When the player's division goes into a war-map fight, the player is asked to take part:

- **A soldier** (ranks 0–3) fights a line battle of four choices: how to wait, the arrows, the clash, and the break. That covers keeping your nerve, pushing into the gap, and dragging a wounded man back.
- **An officer** (ranks 4–6) fights a full tactical battle: a tactic for each wing, and the reserve.
- **A general** (7 and up) takes command of the map fight.

But the first two touched the war only through a fixed nudge. A good result took 12% off the enemy's order and added 8% to ours, at weight 0.35–1; a failure cost our own division some order. How well you did hardly mattered.

**What was measured.** `bench/rankfx.mjs` finds real fights at the moment an enlisted soldier's division goes in, and freezes each one: the whole state and the random stream. It replays each fight with a result applied, runs it out and records who won. The same fights are used for every arm, so the arms differ only by the result.

| Applied at the start of the fight | Our side wins (40 fights) |
| --- | --- |
| Nothing | 73% |
| The release's nudge for a lost battle / a won one | 73% / 78% |
| Enemy order −30% | 80% |
| Our order −30% | 65% |

The release's nudges moved the result by 5 points at most. Order is what decides a map fight; men lost barely do.

Building the harness also found that the random stream (`A.rngState`) lives outside `A.S`. A replay that restores only the state is not a true replay. The lab restores both.

**What it does.**

- **A performance for each layer** (`A.RANKFX`), from −1 to +1:
  - the line battle's grade: triumph 1, success 0.5, mixed 0, failure −0.8;
  - the tactical battle's winner, adjusted by its exchange of dead: a close win is about 0.5, a big win 1, a draw near 0, a bad loss −1.
- **Order on both sides of the map fight.** A good result takes order from every enemy division in the fight and gives some to ours. A bad one takes it from ours. The strengths are calibrated so the officer's company outweighs the soldier's section:

  | Layer | Theirs, per unit of good | Ours, per unit of good | Ours, per unit of bad |
  | --- | --- | --- | --- |
  | The soldier's section | −20% | +7% | −22% |
  | The officer's company | −36% | +13% | −33% |

- **The story log** says when your part reached the whole fight: "What your section did at Varenna reached the whole fight: their line wavered and gave."
- **Wiring.** Patch `RB-LINE-RESULT` sends the line battle's grade from `A.missionClose`; `A.BATTLE_END.wsPart` is replaced to send the tactical battle's.

**Measured by.**

- `bench/rankfx.mjs`, 60 frozen fights:

  | Layer | Worst | No result | Best | Swing |
  | --- | --- | --- | --- | --- |
  | The soldier's section | 63% | 68% | 75% | **12 points** |
  | The officer's company | 58% | 68% | 77% | **19 points** |

  Both are in the plan's band of 10–20.
- `test.mjs`:
  - `rankPerformance`: the grades and battle results become the performances above.
  - `rankWiring`: a closed line mission and a finished tactical battle both reach `A.RANKFX.apply` with their layer.
  - `rankMovesTheFight`: 16 frozen fights. Compared fight by fight with no result, a good result never loses a fight and a bad one never wins one, and the officer's layer moves at least as many as the soldier's.

**Rules kept.**
- Only the engine changes order; the log line only reports.
- `F.rank` is optional, so old saves load.

**Limits.**
- **The soldier's choices are the release's four.** The stage choices were not rewritten; what changed is that their grade now matters.
- **The general's layer is the release's map command**, and it was not measured here.
- **A win-rate swing comes in steps.** A fight changes hands only when it was close, so a small change in strength can move the swing by several points or none. The harness uses 60 fights for that reason.
