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
- **What you know** (playtest 1 #22, `knowledge.core.js`, patch `V2DIP-SEEN-REALMS`): `A.V2DIP.seen(rid)` is exact for
  the realm you rule, an estimate ("about 150,000") for a ruler's view of others and a noble's or courtier's view of his
  own realm, and words and hearsay ("said to be a great host", "said to be unsettled") for everyone else. The realm
  card, World > Realms, the diplomacy card, bloc strengths and the realm tooltips follow it.
- **Blocs and coalitions** (playtest 1 #22): an alliance bloc is realms each allied to every other (patch `V2DIP-BLOCS`;
  chains no longer join all 33 realms). A coalition takes only realms cold or worse with the conqueror by the status
  (patch `V2DIP-COALITION`), and a conqueror's infamy is a reason of its own ("fear of X's conquests"). At the year's
  end (`politicsYearEnd`) a coalition drops the members the status no longer calls cold: another coalition's war in the
  same year can put a member at the conqueror's side ("fight side by side"), and the list then said otherwise.
- **War pace** (CI 88, `riGoldGetsUsed`; `DV.tryWar`, tuned by `DV.WAR`): v2's `monthTick` names a war whenever a
  bordering pair is hostile (score -25 with an ambitious ruler, or -45) and wins a 2 to 3% monthly roll, and a hostile
  pair stays hostile, so `DV.tick` declared about three times the release's rate. Each war it names now goes through
  `DV.tryWar`, which asks what the release's AI asks (20-ai-personality): a crown rests after a war it started
  (`A.aiResting`), waits out war-weariness (`A.aiWeary`) and waits for an opening (the war preview's strength ratio at
  least `A.aiNerve`, less by 55-bonds' `A.feudNerve` against a realm it holds a grudge on). Then the hostile month
  becomes a declaration with chance `DV.WAR.p` 0.35, more as the score falls below -25, x1.5 with a casus belli, and
  times the court's own reasons as the release's roll weighs them (68-casus-belli's `A.cbWarMul`: a plan's target at
  the right moment, an old wrong or a want, nil against a benefactor; 55-bonds' `A.feudWarMul`). The die is v2's
  `makeRng` (never `A.rand`). The side with those court reasons is the one that declares (`DV.WAR.pick`), and a want
  one realm holds against the other (47-realm-bible's want, as `CS.WANT` aims it) is a named reason of its own, -10:
  "Aldmark wants to push the Horde back over the Gordush and plough the steppe edge". The reasons still drive it: no
  hostile status, no war. Each wait is counted in `A.V2DIP.stats.warWait`; `v2DipWarPace` tests each one.
  - `riGoldGetsUsed` (3 worlds x 30 years, seeds 606, 1212, 2424): before, 0.043 wars a realm-year (127 wars, 116 from
    `DV.tick`) and an army 10th percentile of 0.44 of normal; after, 0.017 (the band is 0.012 to 0.03, the fix layer
    0.018) and 0.87. Most of the cut is the opening: in a run with the gates alone, 260 declarations waited for one,
    18 for weariness, 9 for rest, 4 on the chance.
  - `csWorlds` (3 worlds x 50 years): the gates alone left 13% of AI wars citing a memory or a want (bar 18%; wars
    beget the grudges that later wars cite, so fewer wars meant fewer). With the court's reasons, the side that
    declares and the want as a reason: 27.8% (off 17.3%), 0.0171 wars a realm-year against 0.0141 with 68 off (bar
    x1.3), 11 struck by a crown that had planned it, decisions in character 80.3%.
