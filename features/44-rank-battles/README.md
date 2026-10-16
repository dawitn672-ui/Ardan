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
  | The soldier's section | −26% | +9% | −29% |
  | The officer's company | −36% | +13% | −33% |

- **The story log** says when your part reached the whole fight: "What your section did at Varenna reached the whole fight: their line wavered and gave."
- **Wiring.** Patch `RB-LINE-RESULT` sends the line battle's grade from `A.missionClose`; `A.BATTLE_END.wsPart` is replaced to send the tactical battle's.

**Measured by.**

- `bench/rankfx.mjs` on the full build (all 61 features), and the same harness pooled over 300 fights (two sets of 150, seeds from 5000 and from 9000):

  | Layer | Worst | No result | Best | Swing, 60 fights | Swing, 300 fights |
  | --- | --- | --- | --- | --- | --- |
  | The soldier's section | 58% | 65% | 77% | 19 points | **13 points** (13.3 and 13.3) |
  | The officer's company | 57% | 65% | 77% | 20 points | **19 points** (16.7 and 20.6) |

  Both are in the plan's band of 10–20, and on 300 fights the officer's company moves more than the soldier's section, as designed.
- **Why the soldier's strengths were raised by 30%.** When this feature was built, 60 fights read soldier 12, officer 19. In the full build they read soldier 8, officer 20. Dropping one feature at a time (60 fights each) did not show a single cause: without 60-drill 12 and 21, without 48-fight-ladder 9 and 20, without 38-orders 7 and 20, without 56-realm-inside 5 and 10. Larger samples showed that the 12 itself was a lucky sample: on 150 fights, the fix layer with this feature alone reads soldier 8.1 (officer 14.7), the full build 8.0 and 10.6 on two sets (officer 20.6 on both), and the full build without 60-drill 9.3. So the soldier's layer had always sat near 8–10, at or under the band's floor. The officer's grew with the integrated world, mostly from 56-realm-inside's armies. Scaling the soldier's three strengths on the two sets of 150: ×1 read 8.0 and 10.6; ×1.2 read 14.0 (second set); ×1.3 read 15.4 and 14.0; ×1.4 read 14.7 (second set); ×1.6 read 17.3 (first set). ×1.3 puts it in the middle of the band and still under the officer's.
- **One fight is worth 1.7 points out of 60.** A paired count is exact: every arm replays the same fights, and in 300 fights no result ever went the wrong way. But which fights are close varies with the sample. The same full build reads the soldier's swing anywhere from 8 to 19 on 60 fights, depending on which 60.
- `test.mjs`:
  - `rankPerformance`: the grades and battle results become the performances above.
  - `rankWiring`: a closed line mission and a finished tactical battle both reach `A.RANKFX.apply` with their layer.
  - `rankMovesTheFight`: 100 frozen fights (the bench's 60 and 40 more), compared fight by fight. A good result never loses a fight that no result would have won, a bad one never wins one, and each layer's best against its worst changes at least 10 points of the fights. On the full build: soldier 13 of 100, officer 16 of 100, 0 the wrong way, in 166 seconds. It used to take 16 fights and asked only for best > worst. In the full build that read 10 against 10, a tie on two or three fights.

**Rules kept.**
- Only the engine changes order; the log line only reports.
- `F.rank` is optional, so old saves load.

**Limits.**
- **The soldier's choices are the release's four.** The stage choices were not rewritten; what changed is that their grade now matters.
- **The general's layer is the release's map command**, and it was not measured here.
- **A win-rate swing comes in steps.** A fight changes hands only when it was close, so a small change in strength can move the swing by several points or none. On 60 fights the same build reads anywhere from 8 to 19. Trust the pooled 300; `bench/rankfx.mjs --fights=150` gives a steadier reading than the default 60.
- **The swing depends on the world.** Features that change how big and how close map fights are (armies, drill, the generals' orders) move it. The officer's company sits at the top of the band (19 pooled, 20 on the bench's 60), so a world with closer fights could push it over.
