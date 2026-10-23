# Schemes, both ways

**Aspect:** Relationships (Road to Ten, Relationships 3) · **Kind:** system plus 14 events

The plan asks for "schemes both ways: sway, befriend, seduce, slander, murder". The release has instant one-click acts on a person. Flirt, insult and murder are each one roll and done (murder: about 25% plus skill, then a 25% chance someone saw). Nothing runs over time, nothing can be found out halfway, and nobody plots against you.

**What it does.**

- **Two buttons on a person.**
  - "Plot: win them" offers to win them over, make a friend of them, or seduce them.
  - "Plot against them" offers to spread lies about them, or have them killed.

  The scene says what each plot would take, from your skills and theirs: "Winning her over: about 9 months, and 17 in 100 that she finds you out first."
- **A plot grows each month** (`pc.schemes`, up to two at once).
  - The base pace by kind is: sway 12, befriend 11, seduce 10, slander 10, murder 7.
  - Your two skills for the kind add to it: persuasion and etiquette; persuasion and deception; deception and intrigue; or intrigue and stealth.
  - Looks add for seduction.
  - Each friend of yours who hates the target adds 3, up to three friends.
  - The target's guard takes away: their intrigue, and rank for slander and murder (ruler 6, royal 4, noble 2.5). Shy or paranoid people are harder to win; gregarious or trusting people are easier.
- **Halfway, an opening.** You can seize it (a check: +30, or found out), wait for a better one (+5), or pay someone (20 suns, +15).
- **The last move is yours.**
  - sway: let it settle, ask them to speak for you, or tell them it was on purpose;
  - befriend: drink to it, or swear to stand by each other;
  - seduce: stay the night, or stop at a kiss;
  - slander: let it run, put your name to it, or whisper it at court;
  - murder: poison at the feast, a hired knife, or call it off.
- **Found out.** Each month a plot runs, there is a chance the target finds out. It is 2% a month for sway and befriend, 4% for seduce and 6% for slander and murder, raised by their guard and by each helper, and lowered by your intrigue.
  - A found plot: deny it, own it, or shrug. They become your enemy or your rival if it goes badly.
  - A murder found out: run, deny it, or confess to the law (`punish: 'attempted murder'`).
- **They plot too** (`pc.scAgainst`), at most one plot a decade. Someone who hates you (opinion −40 or worse) may start a slander. If they hate you at −75 or worse and are cruel, vengeful or wrathful, it is a murder.
  - Each month you may notice something wrong. The chance is 5% plus your intrigue and insight.
  - Then you can find out who, double the locks (the plot slows by 40), or put it out of your mind.
  - Once you know who: confront them, expose them, answer in kind (your own slander), or let it go and watch.
  - Left alone, the plot lands: a story about you, or a man with a knife in the lane.
- **The Life tab** shows a "Schemes" card: each plot's progress, months left, the chance a month of being found out, and who helps. If you have noticed a plot against you, it says "Someone is working against you. You do not know who."
- **Effect key.** `scheme` is declared for the linter (`A.FX_EXTRA`). It can start, move, end or expose a plot, kill its target, slow or unmask a plot against you.

**Measured by** (`test.mjs`).

- `schemeRuns`: a sway from the button to the last move. Estimated at 9 months, it took 8, with the opening after 5. Their opinion of you rose 20.
- `schemeFoundOut`: a slander found out in its first month leaves an enemy. The risks a month for an ordinary target are 2%, 2%, 4%, 6% and 6%.
- `murderPlot`: a poisoning that works kills the target ("poison in the wine"); one that fails queues the found-out scene.
- `plottedAgainst`: a cruel man at −85 plots your death. You notice it, unmask the right man and expose him, and the plot ends. A slander left alone lands.
- `schemesOnScreen`: both buttons show, and neither shows on someone you already plot against. The card is escaped, and drawing it draws no random number and changes no state.
- `plotsInRealLives`: four bot lives of 25 years in the full build met 5 scheme scenes, all from plots against the player (4 slanders landed, 1 noticed). The bot never starts plots of its own.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

**Rules kept.**
- Being noticed and a plot landing are NPC moves, so they book through 21-npc-initiative's budget (`A.NPCI`); with no room that year, a plot waits.
- The month hook and the event effects change state; the card and the estimates only read it.
- `pc.schemes`, `pc.scAgainst` and `S.scNext` are optional, so old saves load.
- Every name on the card goes through `UI.esc`.

**Limits.**
- **NPCs don't plot against each other**, only against you.
- **Murder plots against you are rare.** The plotter needs deep hatred and a cruel, vengeful or wrathful nature, and none came up in the four test lives.
- **The release's instant murder stays.** It is the reckless way; the plot is the careful one.
