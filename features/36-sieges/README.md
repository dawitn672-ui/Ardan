# Playable sieges

**Aspect:** War (Road to Ten, War 5) · **Kind:** system plus 5 events

The plan asks to "make sieges playable: food, mining, assaults, starving them out, and camp disease, with a choice each month". In the release, a siege is a day counter. A besieged province falls when `P.sgd` reaches `P.sgNeed`, which is set by its walls, its people and the general's siegecraft (`A.wsSiegeDay`). Nobody inside or outside decides anything.

**What it does.**

- **A choice each month, from either side of the wall.** It comes once a month while you are in a siege, as the event "The siege of …" or "Behind the walls of …". The text gives the day, the walls (whole, scarred, cracked, breached), the food (enough, short, a crust, gone) and the sickness in the camp.
  - **Outside, with your division:**
    - volunteer for the mines (a siegecraft check: +20% of the siege, or the gallery falls on you);
    - go up the ladders (a melee check: +30%, or the ditch);
    - hold the ring and let hunger work (+8%, and the camp grows sicker);
    - dig latrines and bury the dead (camp sickness −25).
  - **Inside, when an enemy besieges your home:**
    - take your share of the rationing (the town holds 10% longer, at a cost to you);
    - go out with the night sortie (a check: −20%, or a wound);
    - buy smuggled flour (coin for health);
    - speak in the square for terms (a check: +30%, and if the town falls, it falls on terms).
- **Camp sickness** (`P.sgSick`). It grows 6 a month while a siege runs, and thins the besieging divisions (up to 6.7% of their men a month). It can give you camp fever, and fades once the siege ends.
- **The fall.** When the town falls (`A.occupy`), the side you were on gets the end of it:
  - outside: the sack, the temple door or the sick tent;
  - inside: the sack, where you hide, stand or run;
  - inside, if you spoke for terms: the gates open on terms, and you can hold their captain to them.
- **Effect keys.** `siege` (a share of the whole siege), `sgSick` and `sgTerms` are declared for the linter (`A.FX_EXTRA`), so other events can use them.

**Measured by** (`test.mjs`). In a 40-day siege, how many days each choice moves the fall:

| Choice | Days | Share |
| --- | --- | --- |
| Mine | 8 nearer | 20% |
| Storm | 12 nearer | 30% |
| Hold the ring | 3.2 nearer | 8% |
| Sortie | 8 later | 20% |
| Ration | 4 later | 10% |
| Terms | 12 nearer | 30% |

The plan's bar was that a layer's choices should move the result 10–20%; these move it 8–30%.

- `siegeOutside` and `siegeInside`: each choice moves the real counter the right way, and the latrines cut sickness by 25.
- `siegeSickness`: six months of siege leave camp sickness at 36, and the division has lost 608 of its 7,470 men to it.
- `siegeTaken`: the fall on terms queues the terms scene, a fall by storm the sack, and a town you took the victor's scene.
- `siegeInARealWar`: an enlisted soldier in a real war meets a siege scene after 23 months.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

**Rules kept.**
- Engine changes happen in the month hook and in event effects.
- The event text only reads the siege.
- New province fields (`sgSick`, `sgTerms`) and `S.sgAsked` are optional, so old saves load.

**Limits.**
- **Not for generals.** A general or ruler running a siege from above still has the release's controls.
- **The town is not a place.** It has no named people, and no food store beyond what the counter implies.
