# 99996-v2-diplomacy: relations are sums of named reasons

**Aspect:** v2 complaint 5 (`docs/v2/V2_SPEC.md`), integration step 7 · **Kind:** system, 2 core files, 2 patches, no events.

Alliances were static and statuses contradicted each other ("rivals but married"). Now every pair of living realms is
run through `A.V2.diplomacy.monthTick` once a month, and one function (`A.V2DIP.status`, built on v2's `statusOf`)
derives the status from all the parts: a marriage plus a sworn rivalry reads "uneasy marriage alliance".

- **Reasons.** v2's own (a shared border, fear of the strongest realm, incidents, favours, a broken alliance, an ended
  war) are saved in `A.S.v2dip.f` with their decay. The game's (royal marriages, sworn rivals, claims, faith, trade,
  tribute, comrades in a war, memories at court, old standing, a new ruler) are read fresh each time and never saved,
  so an old save without `v2dip` just starts with the game's reasons.
- **Decisions.** monthTick's alliances, broken alliances, wars and royal marriages are carried out with the release's
  `A.sign`, `A.cancelTr` and `A.declareWar` (logged with `A.aiLogAdd` / `A.aiNoteWar`), so treaties and the war
  machinery are the release's. Wars end only through the war machinery; v2's own peace roll is dropped. A player
  ruler is asked (`A.queueAiOffer`), never signed for. Sworn rivalries follow the score: named when neighbours fall
  to -40, buried above -5.
- **Dice switched off** while `A.V2DIP.ON`: in `A.diploAI` alliance forming and breaking, betrayal wars, naming and
  burying rivals; `A.aiWarCheck` when the monthly or yearly turn calls it (a direct call still works); the random
  opinion drift in `A.diplomacyYear` (patch `V2DIP-NO-DRIFT`). The lesser pacts `A.diploAI` still signs must agree
  with the status (no defence pact with a realm you are cold to, embargoes only on one).
- **Randomness.** v2 draws from its own `makeRng`, seeded from `A.S.seed`, the year and the month. `A.rand` is not
  used by it; it moved only because the switched-off dice no longer draw.
- **News.** These decisions reach `A.news` only through v2's `newsFor`: certain if they touch the player's realm,
  otherwise about a third of the time, as rumour, sometimes garbled.
- **Views.** The diplomacy card, the realm card and a foreign person's card show the status and "Drawing together" /
  "Pulling apart" in words. The card's hidden "Why they feel this way" is gone, and its treaty odds are words
  (patch `V2DIP-NO-PCT` drops the "% income" in the Diplomacy header).
