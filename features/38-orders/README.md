# Generals with a temper, and orders by letter

**Aspect:** War (Road to Ten, War 3) · **Kind:** system, 1 patch and 7 events

The plan asks to "give AI generals personalities (cautious, bold, cunning) and visible plans. Your superior's orders arrive as letters you can follow or ignore, with consequences." In the release every AI army thinks alike (`A.armyThink`), and a soldier never hears what his general means to do.

**What it does.**

- **A temper from the general's traits** (`A.GENERALS.temper`). The temper is whichever group has the most of his traits; a tie or none is steady.
  - bold: brave, impetuous, wrathful, reckless, ambitious, proud;
  - cautious: craven, patient, calm, cautious, content;
  - cunning: deceitful, witty, curious, paranoid.

  In six new worlds the realms' generals came out 61 bold, 57 cautious, 19 cunning and 67 steady.
- **The temper moves the army** (patch `GO-ARMY-TEMPER`). Four dials in `A.armyThink`:
  - `need`, the odds an attack must reach;
  - `spear`, the share of divisions sent at once;
  - `prep`, the rest and planning a division needs first;
  - `weak`, the pull of an undefended province and the push of a fort.

  | Temper | need | spear | prep | weak |
  | --- | --- | --- | --- | --- |
  | bold | ×0.88 | 1/2 | ×0.7 | 1 |
  | cautious | ×1.3 | 2/9 | ×1.25 | 1 |
  | cunning | ×1.1 | 2/9 | 1 | ×2.2 |
  | steady | 1 | 1/3 | 1 | 1 |

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
- `temperMovesTheWar`: the same twelve wars, with one side's generals forced to each temper. A war is chaotic (one changed decision reshapes it), so the test pools them and counts assaults on defended provinces. Three builds this round gave:

  | Build | Steady | Bold | Cautious | Cunning |
  | --- | --- | --- | --- | --- |
  | 38-orders alone, 8 wars | 36 | 46 (+28%) | 27 (−25%) | 28 |
  | All features, 8 wars | 31 | 33 (+6%) | 24 (−23%) | 34 |
  | All features, 12 wars | 42 | 52 (+24%) | 45 (+7%) | 46 |

  Bold fought most every time. Cautious fought less than steady twice in three, so its effect is within the noise of a chaotic war, and the test holds only bold to a bar. The dead moved with bold in the first build (+29% on both sides) but not in the others.
- `planIsVisible`: the war room shows the temper and the plan.
- `letterInARealWar`: an enlisted soldier gets his general's orders within 11 months, with every token filled.
- `ordersSettle`: each of the six outcomes queues the right scene or pays the right merit.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

**Rules kept.**
- The temper is read from traits; no random number is drawn for it.
- Rendering only reads `a.gtPlan`.
- `a.gtPlan`, `S.goPend` and `S.goNext` are optional, so old saves load.

**Limits.**
- **Only bold is clearly measurable.** Cautious and cunning change the dials as much, but in a chaotic war their effect on how much an army fights is within the noise. Cunning's pull toward the undefended matters only when an army has more targets than divisions to send. The letters, the plan in the war room and the settling are the same for every temper.
- **The letters are not the battle.** Going in with the first wave is a check in the letter, not a place in the line battle (War 1).
- **Only the soldier's chain.** A noble's levy or a mercenary company gets no letters.
