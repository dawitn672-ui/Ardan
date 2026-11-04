# Generals with a temper, and orders by letter

**Aspect:** War (Road to Ten, War 3) · **Kind:** system, 4 patches and 7 events

The plan asks to "give AI generals personalities (cautious, bold, cunning) and visible plans. Your superior's orders arrive as letters you can follow or ignore, with consequences." In the release every AI army thinks alike (`A.armyThink`), and a soldier never hears what his general means to do.

**What it does.**

- **A temper from the general's traits** (`A.GENERALS.temper`). The temper is whichever group has the most of his traits; a tie or none is steady.
  - bold: brave, impetuous, wrathful, reckless, ambitious, proud;
  - cautious: craven, patient, calm, cautious, content;
  - cunning: deceitful, witty, curious, paranoid.

  In six new worlds the realms' generals came out 61 bold, 57 cautious, 19 cunning and 67 steady.
- **The temper moves the army** (patches `GO-ARMY-TEMPER`, `GO-ARMY-TEMPO` and `GO-ARMY-DECIDE`). Five bars in `A.armyThink` and the war clock:
  - `need`, the odds an attack must reach;
  - `spear`, the share of divisions sent at once;
  - `prep`, the rest and planning a division needs first;
  - `weak`, the pull of an undefended province and the push of a fort;
  - `every`, how many ticks of the war clock pass between the army's thoughts (the release: 3).

  And four decisions, because a bar only delays an attack (see below):
  - `open`: whether to take the offensive at all. A cautious general goes over to the attack only when his front's odds pass his stance (1.15 × need, the "reads the front as attack" the war room already showed). Otherwise he only frees his own land, as an army ordered to hold the front does;
  - `reserve`: the share of his divisions a general never sends into an attack. They hold their posts and fight whoever comes. Which ones is fixed by their ids, so the reserve stays the same men, with no random draw (`A.GENERALS.held`);
  - `commit`: the most divisions sent at one defended province (the release: 4);
  - `fort`: each step of walls on a defended province multiplies the odds a general wants by 1 + fort.

  | Temper | need | spear | prep | weak | every | open | reserve | commit | fort |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | bold | ×0.88 | 1/2 | ×0.5 | 1 | 2 | always | 0 | 6 | 0 |
  | cautious | ×1.3 | 2/9 | ×1.25 | 1 | 4 | only at odds | 1/3 | 4 | 0 |
  | cunning | ×1.1 | 2/9 | 1 | ×2.2 | 3 | always | 0 | 4 | 1.5 |
  | steady | 1 | 1/3 | 1 | 1 | 3 | always | 0 | 4 | 0 |

  A steady army is exactly the release's. An army the player leads is steady, so its orders stay the player's.
- **Where a bold or a cunning general goes** (patch `GO-ARMY-MOVES`, `A.GENERALS.moves` after each think). The bars and decisions above set how often an army attacks; these set where.
  - **Bold presses after a win.** A division that fell back from a fight in the last 8 days and is still below half its order counts as disordered (`A.GENERALS.disordered`; a beaten division's retreat leaves it at 1 org, `A.divRetreat`). A bold general sends every division next to it with 30% of its order, up to his 6, if the odds reach 0.8.
  - **Bold takes their main host head-on.** Wherever his men are going in against a host, the rest who can reach it go too. A division the think sent to sit before an empty wall goes at the strongest host next to it instead, if it and those already going in have odds of 0.7 (`G.HEADON`). In the choice of targets a host pulls him by its size, and an empty wall pushes him off (`A.GENERALS.pull`).
  - **Bold goes in less rested and breaks later.** A division attacks at half the rest and planning a steady one wants (`prep` 0.5). In a fight it breaks at 2% of its order, not 4% (`A.GENERALS.stand`, in `A.fightDay`).
  - **Cunning goes round the walls.** His divisions march round any province of theirs that is walled or has men in it, unless it is where they are going (`A.GENERALS.road`, in `A.wsOrderDiv`). A division that finds the enemy across its road goes round. One that finds them standing in his own land goes in only with the rest of the army next to it, at odds of 1.5 (`A.GENERALS.sidestep`, in `A.divMove`). Up to a third of the army marches past walls and held places to take the open country behind them, up to four provinces deep.
  - **Cunning falls on men already busy.** Men attacking somewhere else, or already fought from another side, draw him: he comes in from a side nobody attacks from, which widens the front (`dirs` in `A.fightDay`). He wants only 0.8 of his odds there, or after a retreat. Against the weakest host standing ready next to him he wants 2.5 times his odds. A stronger host standing ready he never attacks (`G.IDLE`, in `A.GENERALS.fortNeed`). His pull is to depots, rich provinces and the weakest division.
  - **Cunning feints.** He picks a held place too strong to storm now and an empty place of theirs beside it. A detachment, his weakest ready division, takes the empty place and leaves it again, or the one division holding a place of theirs walks out. The release's army always sends a division to retake an empty province (`A.armyThink`, "frees its own land"). When the held place's strength falls by 30%, or a division leaves it, his main body strikes it (`a.gtFeint`, 24 days at most).
- **A visible plan.** Each army records what it is doing (`a.gtPlan`: the provinces it is attacking and the one it holds). The war room's army list shows the temper and the plan, for example "Bold · means to take Valia, Taria and Pertello, and will not wait for better odds". The general's latest move, for 30 days (`a.gtMove`, or a feint under way), is shown in its place:
  - "means to press on to Taria while they are broken";
  - "means to meet their main host at Pertello head-on, with every man he can bring";
  - "means to go round the walls of Pertello";
  - "makes a show at Saltmoor, to strike at Ashmere when its garrison comes out";
  - "drew them out of Ashmere with a show at Saltmoor, and goes in where they left";
  - "means to fall on Torossa while they are busy elsewhere".

  Each of these is from a real war in `movesAreVisible`.
- **Orders by letter.** A soldier whose army is at war gets the plan as a letter, at most every five months. It comes from his superior, or is read out at muster if he has no captain yet. There is one letter per temper:
  - bold: go in with the first wave;
  - cautious: hold and wait, while their foragers eat in plain sight;
  - cunning: make a noise at a place that is not the real blow;

  The letter names the move when there is one. A bold general's men are told "they are beaten and falling back on Taria, and General Garrick Harrow means to press on to it while they are broken". A cunning general's are told he "means to go round the walls of Grakzag Oasis and take Saltbridge from behind", with their company making the noise under those walls. Or they are told he "wants noise at Highwold … when the garrison of Highcastle comes out to see to it, the real blow falls where they left".
  - steady: hold the line and patrol.

  Each letter offers four ways to take it:
  - as ordered;
  - to the letter and no further;
  - your own way, a check (in the steady letter, asking for a real objective);
  - not at all.

  Effects move merit and the opinion of whoever gave the order.
- **Consequences, sixty days on.** The choice records how you took the order (`fx.order`). Sixty days later the map settles it: did the army take the province it meant to take, or hold the one it meant to hold?
  - You obeyed and it worked: merit (+4, or +2 to the letter).
  - You obeyed and it failed: blame comes down the line (`go_blame`).
  - You held back and it worked anyway: you are called to account (`go_reckoning`).
  - You held back or went your own way, and it failed: the men say you were right (`go_vindicated`).
  - You went your own way and it worked: nobody asks.
- **Effect key.** `order` is declared for the linter (`A.FX_EXTRA`).

**Measured by** (`test.mjs`).

- `tempersFromTraits`: trait sets map to their temper, and the world's generals cover all four.
- `temperMovesTheWar`: the same wars, with one side's generals forced to each temper. The pool is 96 wars a temper: twelve wars on each of eight shifted random streams, 300 days each. Scenes queued for the player are cleared each step, so the clock runs.
  - Each order the army gives is classed by its target when given. If men stand there, it is an assault. It is also a pursuit if one of them is disordered, engaged if they are fighting elsewhere or already being fought from another side, and at walls if the province is walled. If the province is empty, it is a siege when walled and a walk-in when not. The same division sent to the same place within 30 days is one order.
  - Fights count when our side started them with 1,000 men or more.
  - A field share is assaults ÷ (assaults + sieges).
  - Taken is every province our side occupied.
  - Men down is the army's men at the start less at the end, the "our dead" of earlier rounds.

  What the test holds:
  - cautious: at least 50 assaults, and 10% fewer than bold and steady;
  - bold, against steady: 25% more assaults, 1.5 times the pursuits, a field share 2 points higher, a win rate no more than 5 points lower, with at least 30 pursuits and 200 fights in steady's pool;
  - cunning: a share at empty or engaged places 3 points above every other temper, the fewest assaults at walls, the most provinces taken per 100k men down, and at least 50 marches round walls, 5 feints, 10 flank attacks and 50 sidesteps.

  The numbers below are the test's measure run on three seed sets of 96 wars a temper: the test's seeds 71–82 and two more, 171–182 and 271–282. The full world was built with `node tools/build.mjs --out=/tmp/ardan/orders2/full.html`, then 69 features. The test's own run on that build reads the same as the first set. Each cell is the pooled mean, with the lowest and highest set in brackets.

  | Per 96 wars | Steady (the release) | Bold | Cautious | Cunning |
  | --- | --- | --- | --- | --- |
  | Assaults | 1,785 [1,564–1,994] | **3,353** [2,900–3,611] | 1,152 [954–1,290] | 836 [807–873] |
  | Pursuits | 230 [221–238] | **982** [807–1,101] | 114 [68–141] | 102 [95–107] |
  | Field share | 20.9% [18.8–24.1] | **30.1%** [28.5–33.3] | 23.4% [20.0–26.4] | 15.5% [13.8–16.4] |
  | Assaults at walls | 1,456 [1,259–1,649] | 2,963 [2,561–3,165] | 910 [738–1,002] | **656** [600–754] |
  | Orders at empty or engaged places | 84.7% [82.1–86.5] | 77.3% [75.6–78.4] | 80.5% [78.0–83.2] | **92.3%** [91.6–93.4] |
  | Assaults on men engaged elsewhere | 23.6% [22.7–25.4] | 22.3% [20.8–23.7] | 12.1% [10.6–13.3] | **46.9%** [45.4–48.7] |
  | Fights won | 46.7% [43.1–48.9] | 59.7% [55.5–62.8] | 39.1% [32.2–47.3] | **71.1%** [66.0–76.4] |
  | Our dead in battle | 5,913k [5,262–6,512] | 5,891k [5,309–6,291] | 5,769k [4,625–6,437] | **4,352k** [4,021–4,627] |
  | Theirs | 10,845k | 11,061k | 9,988k | 8,945k |
  | Men down | 2,604k [2,445–2,703] | 2,612k [2,574–2,644] | 2,331k [1,547–2,980] | **1,495k** [1,311–1,692] |
  | Provinces taken | **401** [389–409] | 258 [253–262] | 288 [276–295] | 265 [237–305] |
  | Taken per 100k men down | 15.4 [14.6–16.6] | 9.9 [9.8–9.9] | 13.4 [9.3–19.1] | **17.9** [14.9–20.6] |
  | Taken per 100k battle dead | **6.9** [6.0–7.8] | 4.4 [4.1–4.9] | 5.1 [4.3–6.4] | 6.1 [5.4–6.9] |
  | Provinces held at the end, net | **217** | 110 | 140 | 115 [31–178] |
  | Wars over by day 300 | 82 | 73 | 73 | **44** |

  Set by set, bold against steady made 85 to 97% more assaults and 3.4 to 4.8 times the pursuits. His field share was 8.8 to 9.7 points higher, and he won 13 to 14 points more of his fights. Cunning had the highest share at empty or engaged places in every set (92 to 93% against at most 87%) and the fewest assaults at walls in every set (754, 614 and 600 against cautious's 991, 1,002 and 738).

  With `--only=orders` the test passes as well, and the contrasts hold. Bold made 2,324 assaults against steady's 1,527 and 556 pursuits against 195. His field share was 29% against 26%, and he won 45% of his fights against 33%. Cunning sent 94% of his orders at empty or engaged places, against at most 85%. He made 358 assaults at walls, the fewest (cautious made 530), and took 12.1 provinces per 100k men down, the most (steady took 8.7).

  Over the 288 wars a temper, the moves themselves:
  - bold: 830 pursuits, 1,735 joins of a fight already going and 2,456 divisions turned from an empty wall to the host;
  - cunning: 2,046 marches round walls, 574 marches into the open country behind them, 175 flank attacks and 84 feints. 43 of the feints drew the garrison out and the strike went in; 36 ran out of time.

  **What it costs.** A bold army fights its way to a better win rate (60% against 47%) and loses about as many men in battle as a steady one. It takes a third fewer provinces, 258 against 401, and ends the 300 days with half the ground. Its men are in the fight, not in front of the walls. A cunning army loses a quarter fewer men in battle and two fifths fewer men in all, and takes a third fewer provinces. Its wars last: only 44 of 96 were over by day 300, against 82. And it gives ground in its own land, because it will not throw men at a host standing there.

  **Why the moves and not the bars** (the previous round, 36 wars a temper, with the old dials). Before this round the full world read steady 2,012, bold 2,196, cautious 2,298 and cunning 2,073 assaults, so cautious made the most. The bars bind just as often in every build. A bar only delays an attack, and a delay costs nothing: the division held back goes in a few days later. The share sent at once (`spear`) bound in 9 of 1,581 thinks, so ordering the targets did nothing. GO-ARMY-DECIDE gave the cautious general decisions in place of bars, which made him attack 31% less. This round does the same for bold and cunning, by changing where the divisions go.
  - In the 96 steady wars of the test's seed set, the army lost 2.9 million of its 4.3 million attacking dead in 1,547 short fights (three days or less) at places with no walls of theirs, and won 17% of them. Most of those fights are divisions walking into an enemy host on the way to their posts (1,825 such meetings on a march of two steps or more, more on one step), not assaults the general chose. Going round them, and not going in against them alone, is most of why a cunning general loses fewer men.
  - Things tried and dropped:
    - A cunning general putting all his spare divisions round an empty wall took fewer provinces, 254 against 276.
    - A wider cunning spear (1/2) changed nothing (279).
    - Letting cunning attack ready hosts at 1.6 and 3 times his odds (`G.IDLE`) took more provinces, 265 to 366 a set: the most per man down in all three sets. But it cost the share at empty or engaged places, 86 to 87%, no higher than steady. The present dials keep that share and the fewest assaults at walls.
- `planIsVisible`: the war room shows the temper and the plan.
- `movesAreVisible`: in twelve real wars (150 days), a bold army's plan says where it presses and a cunning one's which walls it goes round. The letters a soldier of those armies gets say the same, with every token filled.
- `letterInARealWar`: an enlisted soldier gets his general's orders within 11 months, with every token filled.
- `ordersSettle`: each of the six outcomes queues the right scene or pays the right merit.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

**Rules kept.**
- The temper is read from traits; no random number is drawn for it.
- No random number is drawn by any move: the feint, the march round, the pursuit and the head-on choice are picked by power, odds and province order, and the reserve by ids.
- Rendering (the war room line, the tooltip's plan) only reads `a.gtPlan`, `a.gtMove` and `a.gtFeint`.
- `a.gtPlan`, `a.gtMove`, `a.gtFeint`, `a.gtFeintAt`, `d.gtRaid`, `S.goPend` and `S.goNext` are optional, so old saves load. The move counts for the tests (`A.GENERALS.stats`) are not saved.
- A steady army is the release's: its pull is 0, its stand 1, its road `A.wsPath`, and it never sidesteps or moves after the think.

**Limits.**
- **Cunning is not the most efficient by every count.** Per 100k men down it takes the most provinces pooled (17.9 against steady's 15.4), but set by set only in one of three: 18.1 against cautious's 19.1, and 14.9 against steady's 15.1. Per 100k dead in battle, steady is ahead (6.9 against 6.1). The cunning general loses fewer men but also takes fewer provinces, because he leaves the hosts standing ready, and their walls with them. The test holds the pooled measure on its own seed set, where cunning leads 20.6 to 16.6.
- **A cunning general gives ground at home, and his wars drag.** He goes in against a host standing in his own land only with the odds (1.5) and the rest of the army beside him. So that host sits and besieges. His wars ended by day 300 in 44 of 96, against 82. A human should say whether this reads as cunning or as passive.
- **Bold is not costlier in blood.** The plan asked for "more of its own dead, more swings". Bold piles in and wins more of his fights, so he loses about as many men in battle as steady (5,891k against 5,913k), and the spread of a war's end state is no wider (1.8 provinces against 2.2). What he pays is ground: 258 provinces taken against 401.
- **Feints are rare and half of them catch nothing.** 84 in 288 wars; 43 struck after the garrison came out, and only 3 times was a division seen on its way to the bait. The rest of the "drawn" strikes came when the held place had weakened for other reasons.
- **A cautious general gives ground** (unchanged from the last round): with a third held back and no offensive while outnumbered, he loses more of his own provinces than steady.
- **The letters are not the battle.** Going in with the first wave is a check in the letter, not a place in the line battle (War 1).
- **Only the soldier's chain.** A noble's levy or a mercenary company gets no letters.
