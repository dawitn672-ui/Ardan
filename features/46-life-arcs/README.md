# The work of your life

**Aspect:** Replay (Road to Ten, Replay 4) · **Kind:** system and 40 events, no patches

The plan asks to "give each main path (soldier, merchant, priest, scholar, criminal, noble, ruler) its own mid-game and late game, not a stats dashboard." In the release, a career is a ladder of ranks and a pool of events. Once you are established, you get more of the same until you die.

**What it does.** Each path now has two undertakings that run over years. One belongs to the middle years, in three scenes; one is a legacy for the last years, in two. The scenes come one to three years apart. Every choice leaves a mark, and the later scenes read it: their text changes, and so do what they offer and what follows.

| Path | Middle years (from 28, once established) | Last years (from 55) |
| --- | --- | --- |
| Soldier | **A command of your own.** How you take the company decides how it holds the ford, and the ford decides what the army says of you. | **The old campaigner.** A boy who wants to learn; then a last campaign, which he joins if you taught him. |
| Trader | **A house abroad.** A cousin, a factor, or yourself in the foreign port; their letters; the charter. | **Handing on the house.** |
| Priest | **The parish and the heresy.** A preacher in the field; the synod. | **A shrine.** |
| Scholar | **The great work.** A patron reads a chapter. | **A school.** |
| Outlaw | **The big job.** | **Going straight.** |
| Lord | **The estate.** | **The inheritance.** |
| Ruler | **A monument.** A cathedral, a road to the sea, or a code of laws; what it costs; what stands. | **The crown, at the end.** A share of rule for the heir; whether to name the day you step down. |
| Common folk | **A holding of your own.** The widow's strip; the boundary stone; the good year. | **The village elder.** Quarrels at your door; then the lord fences the common. |

The plan names seven paths. Common folk are an eighth. They are farmers, herders, miners, labourers, and those in the glory careers (pit fighters, hunters, minstrels). Two of the six starts are peasant and serf, and the first bot run showed a forty-five-year peasant life with no arc at all. A serf gets none while unfree: the ground is the lord's, and freedom comes first.

**How it runs.**

- **Starting.** Each month, an adult whose path has an undertaking waiting starts it with a chance of 1 in 24, so about two years after it becomes possible. "Established" means a sergeant or above in the army, or one rung up a career; lords, rulers and common folk need only be 28.
- **One at a time.** A life holds at most two middle-years undertakings and one legacy. A life that changes trade may start over once.
- **Moving on.** Each stage is a trigger-only event, so it is never rolled at random. Every choice carries `fx.arc` (`'next'`, `'end'`, or `{ go, mark }`). A mark is kept on the arc and as the flag `la_<mark>`, so `C.flag` and the bot's memory index see the link.
- **Giving up.** Queued events are shown whatever their `cond` says. So before queuing a stage, the arc asks the scene's own `cond`: a soldier who has left the army gets no ford. If the scene no longer fits, the work is marked *given up*. A stage that was queued but dropped unseen is given up two months on, so an arc can never wait forever.
- **The Life tab** gets a card, "The work of your life", with each undertaking and how far it got: *2 of 3*, *done (1107)*, *given up (1107)*.

**Measured by** (`test.mjs`).

| Test | Result |
| --- | --- |
| `everyChoiceMovesTheArc` | 40 stages; each is trigger-only, and every choice (both sides of a check) carries `fx.arc` |
| `arcsStartPerPath` | Each of the eight paths starts its own middle-years arc at 35 and its legacy at 58. Nothing starts for a soldier in the ranks, a novice, a serf, or anyone at 22. The start roll fires 3.8% of months (full world). None start while one runs, none after two in the middle years, and after a legacy only a middle-years one can start. The story track (50-53) runs beside it: with a story arc running the estate still starts, and with the estate running a story arc still starts. The test holds the story roll off when it forces the start roll, since the story roll comes first and would win every forced roll. |
| `choicesCarryForward` | Drilling the company hard and holding the ford leaves marks *cmd_hard → cmd_held → cmd_stayed*, and the last scene opens "They call it your ford now…". Learning their names and losing it leaves *cmd_names → cmd_broke → cmd_stayed*: "The army remembers the ford that broke…". Stage 2 comes 1 to 3 years after stage 1. |
| `givenUpNotStuck` | A soldier who leaves the army before the ford: the arc reads *given up*, and the next undertaking can start. A stage dropped unseen is given up after two months. |
| `lifeCardPure` | The card draws from state, escapes everything, skips an unknown key from a save, and drawing it changes neither `A.S` nor the random stream. |
| `oldSaveTolerated` | A life with no `arcs` field starts one and draws the tab. |
| `botLivesReachArcs` | 10 bot lives over the league's starts, each played 20 years from 16 (a middle-years arc starts 10 to 15 years in and ends by year 19). On the full world, every life of 15 years or more (9) began the work of its life and finished it: 27 of its scenes played. Story arcs are counted beside the work of a life, not toward it (18 more). Played to 70 instead, the same lives took 291 s, not 156 s, and two of them also reached the old campaigner's legacy. |

**Rules kept.**

- Everything random (the start roll, the gap between stages) is drawn in the month hook or the effect.
- The card only reads.
- `pc.arcs` is a new field, and a save without it loads.
- Marks are plain words, so `SAVES.clean` leaves them alone.

**Limits.**

- **The scenes are written, not generated.** Each path has one middle-years and one last-years undertaking. A second life on the same path meets the same undertaking, though it can take it another way: 2 or 3 choices per scene, with marks that carry.
- **The marks change text and outcomes, not the world.** The ruler's cathedral costs treasury and gives piety, but no building appears on the map, and the trader's branch abroad is not a market of its own in `45-economy`.
- Glory careers fall under common folk; a knight who is a lord gets the lord's.
