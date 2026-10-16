# Generals with a temper, and orders by letter

**Aspect:** War (Road to Ten, War 3) · **Kind:** system, 3 patches and 7 events

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
  | bold | ×0.88 | 1/2 | ×0.7 | 1 | 2 | always | 0 | 6 | 0 |
  | cautious | ×1.3 | 2/9 | ×1.25 | 1 | 4 | only at odds | 1/3 | 4 | 0 |
  | cunning | ×1.1 | 2/9 | 1 | ×2.2 | 3 | always | 0 | 4 | 0.5 |
  | steady | 1 | 1/3 | 1 | 1 | 3 | always | 0 | 4 | 0 |

  A steady army is exactly the release's. An army the player leads is steady, so its orders stay the player's.
- **A visible plan.** Each army records what it is doing (`a.gtPlan`: the provinces it is attacking and the one it holds). The war room's army list shows the temper and the plan, for example "Bold · means to take Valia, Taria and Pertello, and will not wait for better odds".
- **Orders by letter.** A soldier whose army is at war gets the plan as a letter, at most every five months. It comes from his superior, or is read out at muster if he has no captain yet. There is one letter per temper:
  - bold: go in with the first wave;
  - cautious: hold and wait, while their foragers eat in plain sight;
  - cunning: make a noise at a place that is not the real blow;
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
- `temperMovesTheWar`: the same wars, with one side's generals forced to each temper, counting assaults on defended provinces. The pool is 96 wars a temper: twelve wars on each of eight shifted random streams, 300 days each. Scenes queued for the player are cleared each step, so the clock runs, and the test needs at least 50 cautious assaults. Before that fix the test passed on nothing: the clock was held and every temper read 0. Bold and steady must make 10% more assaults than cautious.

  | Temper | Assaults, full world | Our dead | Theirs | Held | Assaults, `--only=orders` | Our dead | Theirs | Held |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Steady (the release) | 2,272 | 2,568k | 3,020k | 105 | 1,819 | 3,758k | 1,557k | 47 |
  | Bold | 2,184 | 2,709k | 2,830k | 101 | 1,622 | 3,989k | 1,630k | 37 |
  | Cautious | **1,567 (−31%)** | **2,504k** | 2,828k | **122** | **852 (−53%)** | **3,105k** | 1,391k | 43 |
  | Cunning | 1,915 | 2,650k | 2,904k | **43** | 1,439 | 3,613k | 1,516k | 22 |

  In an instrumented run of the same pool, the assaults won were steady 88%, bold 89%, cautious 91% and cunning 90% in the full world, and 82%, 81%, 95% and 88% with `--only=orders`. A cautious army attacks least, wins what it starts and loses the fewest men. It cedes more of its own land when the enemy comes on: 38 provinces against steady's 14 in the full world, though only 16 against 33 with `--only=orders`. A bold one is not suicidal: it bleeds about 5% more than steady and kills about as many. A cunning one leaves defended forts alone, so it holds the fewest provinces.

  **Why the temper had stopped mattering** (found by instrumenting `A.armyThink`, 36 wars a temper, the old dials). Before this round the full world read steady 2,012, bold 2,196, cautious 2,298 and cunning 2,073, so cautious made the most assaults. The guess was that 56-realm-inside's richer hosts and 60-drill's better order clear the bars. They do not: the bars bind just as often in every build. Counted each time a defended enemy province lay next to the army, a cautious army had about a fifth fewer chances to attack than a steady one would have had at the same moment:

  | Build | Steady assaults | Cautious assaults | Cautious chances vs steady's at that moment | Thinks where `spear` bound |
  | --- | --- | --- | --- | --- |
  | full | 745 | 812 | 919 vs 1,164 (−21%) | 9 of 1,581 |
  | without 56-realm-inside | 517 | 480 | 622 vs 800 (−22%) | 2 |
  | without 60-drill | 842 | 766 | 980 vs 1,231 (−20%) | 22 |
  | without both | 510 | 449 | 486 vs 626 (−22%) | 1 |
  | `--only=orders` | 676 | 489 | 480 vs 640 (−25%) | 1 |

  A bar only delays an attack, and a delay costs nothing. The division held back goes in a few days later, with more planning and a lower bar, because an army's need falls the longer it is quiet. The assaults over 300 days are set by how fast divisions come round again, not by the bars. Of a steady army's chances in the full world (3,032), 404 had no idle division next to the target, 495 failed on organisation, 126 on planning, 797 on odds and 1,210 went ahead. Most assaults left within five days of the division's last fight. The share sent at once (`spear`) almost never bound, because an army rarely has more targets than a third of its divisions. So the cunning pull, which only orders those targets, did nothing either. Which build wins is the random stream: one changed draw reshapes a war. Even with 96 wars a temper, a change that binds in 3% of assaults (bold's cap of 6) moved bold's count by 10%.

  **What binds now** (36 wars a temper, the full world):
  - A cautious general refused the offensive in 317 of 1,752 thinks (18%; 31% with `--only=orders`).
  - His reserve held back a division that was otherwise ready next to a target 18,460 times.
  - Bold's cap of 6 was reached in 31 of 993 assaults on a province (steady's 4 in 130 of 766).
  - A cunning general weighed a defended fort 1,383 times.

  Each of `open` and the reserve alone moved cautious only 10 to 15%, which is within the noise; together they move it 20 to 30%. A rest of 15 days after each fight was also tried. It cut cautious assaults by a third, but his assaults then won 80%, not 91%, and he lost more men than steady. A general who never follows up a fight is beaten, so the rest was dropped.
- `planIsVisible`: the war room shows the temper and the plan.
- `letterInARealWar`: an enlisted soldier gets his general's orders within 11 months, with every token filled.
- `ordersSettle`: each of the six outcomes queues the right scene or pays the right merit.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

**Rules kept.**
- The temper is read from traits; no random number is drawn for it.
- Rendering only reads `a.gtPlan`.
- `a.gtPlan`, `S.goPend` and `S.goNext` are optional, so old saves load.

**Limits.**
- **Bold against steady is noise.** A bold army already sends every division it has free, so attacking at worse odds adds little. Over 96 wars it made 4% fewer assaults than steady in the full world and 11% fewer with `--only=orders`. What tells it apart is the odds it takes and the dead. Only the cautious general is held to a bar.
- **A cautious general gives ground.** With a third held back and no offensive while outnumbered, he loses more of his own provinces than steady in the full world. That is what the temper is, but a human should say whether it reads as caution or as weakness.
- **Cunning only avoids forts.** It does not feint or bypass a fort on the march. Its pull toward the undefended matters only when an army has more targets than divisions to send.
- The letters, the plan in the war room and the settling are the same for every temper.
- **The letters are not the battle.** Going in with the first wave is a check in the letter, not a place in the line battle (War 1).
- **Only the soldier's chain.** A noble's levy or a mercenary company gets no letters.
