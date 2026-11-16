# R1 audit: the decisions still left to bare dice

*Stamped 2026-11-16 · W1-2 (D-069) · rule 18 (order 54, D-062). Counted by `tools/lint-reasons.mjs` (baseline
`tests/reasons-baseline.json`, 66, which may only fall); `node tools/lint-reasons.mjs --list` prints the current list
with file and line. Line numbers below are as of the W1-2 merge with `v2-integration` be59d5c.*

## What W1-2 routed through `A.WHY.decide`

| Decision | Where | Reasons it now carries |
|---|---|---|
| A crown declares war, the live path (v2 diplomacy) | `src/diplomacy/99996-v2-diplomacy/diplomacy.core.js` `DV.tryWar` | temper, the Generals' count, the hostility between the courts, a cause, rivals, the feud ledger (55), the plan and the moment (68), infamy, unsettled lands, a sworn pact; feelings (wounded pride, anger, shame, zeal) with the heat discounting a hot king's count |
| A crown declares war, the release's path | `src/core/release/core/17-careers-and-event-engine-a.js` `A.aiWarCheck` | the same, at a yearly council and at once when a hot wrong calls it |
| A wrong lights a feeling, a hot one calls the council | `src/people/9999950-why/why.core.js` `W.wrong` (the release's incidents), `warEnd` (shame) | the incident itself, as the cause |
| A great house joins, stays in or leaves a faction | `src/core/release/core/13-factions-and-decisions.js` `A.factionsYear`, `W.factionChoice` | grievance (opinion), the faction's own want, houses already sworn, the throne's firmness, old loyalties, his word given |
| The crown names its first host's General | `src/nobility/999990-posts/posts.core.js` `P.fillGenerals`, `W.appointGeneral` | merit (command, renown, grade), kin of the king's house, a wary king's fear of a famous man |
| **W1-3:** the crown's General for a new army | `10-companies-and-war-staff-b.js` `A.wsGeneralFor`, `A.CMD.generalChoice` | a great name, merit, the king's kin, the house's loyalty, a house of the sword, a lord who leads his own command; against raising a man of no house |
| **W1-3:** the crown's judgment on an ignored summons | `12-nobility-and-politics.js` `ignoreSummons`, `A.CMD.pcJudge` / `A.CMD.sentence` | the law and refusals before, the king's anger and pride, a true excuse, the crown's strength against the lord's |
| **W1-3:** a league member joins a war on a conqueror | `17-careers-and-event-engine-a.js` `A.callExtra`, `A.CMD.leagueJoins` | the league's oath, the conqueror's infamy; against the cost and the realm's weariness |
| **W1-3 (new):** the summons, the king's command, the seasons, the lord's answer, the border | `src/war/9999951-commands` | see its README |

## What is left, by kind, and the reasons each should use

The reasons named are those the game already holds (the record that would be the source). "Dice within reasons" means
the roll already reads named reasons and needs only to become a decision with a record. The research in
`docs/research/codex/reasons-and-cracks.md` (each realm's wants, fears, custom and secret; the ten institutions and
their cracks; the ten quarrels; the four causal chains) is the catalogue for the new reasons W1-6 adds.

### Wars: who joins, how they end (W1-3, W1-5)

| Where | What it decides | Reasons it should use |
|---|---|---|
| `03-engine-base.js:2161`, `:2171` `A.startWar` | an ally joins the defence (0.55) or the attack (0.3) | the pact sworn (duty, honour), the ally's opinion of each side, its own wars and weariness, its strength beside the enemy's, a debt (68), a grudge (55). 20's `A.aiAnswerCall` already holds most: route it. *W1-3 found this branch dead: it runs only when `A.callToArms` is missing, and `callToArmsNow` answers every call; W1-5 may retire it* |
| `04-realms-and-war-years-a.js:564`, `:569` `A.successionWar` | a meddling neighbour backs a claimant (0.35), a friend backs the crown (0.4) | the claimant's blood and backers, the neighbour's want or grudge, marriage ties, opinion |
| `04-realms-and-war-years-a.js:297`, `:384` `A.settleWar` | a rebel claimant takes the throne (0.65), a crushed realm is annexed (0.7) | the victor's appetite (68), the land's people and faith, infamy |
| `11-armies-divisions-and-council-b.js:173` `A.rulerAction` | an AI ruler accepts peace (0.25 + score) | W1-5's surrender: the two pans read monthly on what he has been told |
| `13-factions-and-decisions.js:698` `A.peaceOffer` | an AI accepts the player's peace offer | the same pans; the terms against the casus |
| `src/diplomacy/engine/diplomacy.js:72`, `:76` `monthTick` | v2's hostile month names a war (0.03 / 0.02); a war turns to truce (0.03) | the occasion: an incident, a council, a summons; the truce is W1-5's (a pause asked for, with a price) |
| `src/map/70-fresh-realms-and-tensions/fresh.core.js:327` `FR.split` | a realm born of a split goes to war with its parent (`FR.WAR_P`) | the parent's claim and pride, the new realm's backers |

### Alliances, pacts and rivals (W1-6, diplomacy)

| Where | What it decides | Reasons it should use |
|---|---|---|
| `17-careers-and-event-engine-a.js:1838` `A.diploAI` | a betrayal war (persona-weighted dice; muted under v2) | honour, appetite, the ally's weakness, infamy |
| `17-careers-and-event-engine-a.js:1873`, `:1881`, `:1955`, `:1991`, `:2011`, `:2022`, `:2034`, `:2063` `A.diploAI` | alliance sought, a gathering called, subsidy, embargo, trade, non-aggression, rival named, submission (persona-weighted dice) | 20's `W` table already names the axes: the interest parts (`A.interestParts`), fear (`A.threatsTo`), coin, faith. Each becomes `A.WHY.decide` with its options (sign, refuse, wait) |
| `17-careers-and-event-engine-b.js:485`, `:842` to `:854` `A.diplDo`, `deal` | an AI answers a treaty offer | interest parts, the offer's terms, the asker's honour |
| `17-careers-and-event-engine-b.js:884` to `:1071` `A.holdGathering`, `A.gathClose` | alliances made or broken at a gathering of crowns | interest, the host's standing, faith, marriages |
| `src/diplomacy/engine/diplomacy.js:65`, `:67` `monthTick` | v2 alliance formed (0.08), broken (0.12) | the status's reasons (already named), honour |
| `src/diplomacy/20-ai-personality/persona.core.js` `A.aiBreakAlly` (muted under v2) | breaking an alliance | interest, fear, honour (named already) |
| `src/diplomacy/68-reasons-for-war/casus.core.js:122` `CS.seekAlly` | a planning crown seeks a friend against its target (0.3) | the plan, the friend's own grudge against the target |
| `src/map/70-fresh-realms-and-tensions/fresh.core.js:310` `FR.split` | a new realm allies a friend (0.4) | opinion, a common enemy |
| `17-careers-and-event-engine-a.js:2582` | a tributary defies its overlord | 20's `aiDefy` reasons: pride, the overlord's strength, the tribute's weight |

### Factions, risings, coups and the court (W1-6)

| Where | What it decides | Reasons it should use |
|---|---|---|
| `src/diplomacy/20-ai-personality/persona.core.js` `A.aiFactionAnswer`, `A.aiRevolt` | the crown yields to a faction; its leader rises (persona-weighted dice) | §13.3's ladder: the king's answer (grant, buy, divide, arrest, refuse) and theirs (back down, wait, withhold, rise), with the faction's power, the throne's firmness, each member's grievance |
| `13-factions-and-decisions.js:415` `facRefuse` | a refused faction rises against the player (0.35 - power/3) | the same, the player's answer recorded |
| `13-factions-and-decisions.js:2036` | the spymaster unmasks a faction | the spymaster's skill, the plot's size, the leader's care |
| `src/nobility/56-court-and-treasury/court.core.js:580` `RI.joinFactions` | a councillor's house joins a faction (0.3) | as `W.factionChoice` (route it there) |
| `src/nobility/56-court-and-treasury/court.core.js:480` `RI.deal`, `:534` `RI.session` | a faction leader takes the crown's deal; a councillor presses at court | the deal's worth to him, his want and fear (`RI.aims`) |
| `11-armies-divisions-and-council-a.js:2787` `A.rulerYear` | a revolt in a shaking realm (stability < 15, 0.35) | §13.4: a shared grievance, a voice, an occasion; the commons' pressures |
| `11-armies-divisions-and-council-a.js:2824` `A.vassalYear` | a lord with a deep grievance rises (0.15) | his grievance's record, his strength beside the crown's, his kin and allies, a backer |
| `12-nobility-and-politics.js:468` `politicsYearNow` | a claimant presses a claim (0.15) | blood, backers, the throne's right, his ambition (20's `A.aiPressClaim` holds the temper) |
| `src/nobility/9996-polity/c-elect.core.js:228` `FW.election` | an elected crown passes to the heir | the electors' interests, the heir's standing, the realm's firmness |
| `04-realms-and-war-years-a.js:847` `A.worldYear` | a rising in a realm with no heir | the throne's right, the lords' stances |
| `src/world/64-npc-beliefs/d-world.core.js:475`, `:520` to `:530` `NB.revengeYear`, `NB.councilYear` | a revenge plot; treason at the council (persona-weighted) | the grievance, access (§13.5), the opening, the king's suspicion |
| **Coups** | none exists in the code yet (only event scenes) | W1-6 builds them on `A.WHY` from §13.5: motive, access, opening |

### Appointments, summons and service (W1-3, D11)

| Where | What it decides | Reasons it should use |
|---|---|---|
| `src/nobility/56-court-and-treasury/court.core.js:404` `RI.fillCouncil` | a new ruler replaces a councillor (0.35) | his favourites, the councillor's record and loyalty |
| `src/nobility/9996-polity/a-polity.core.js:482` `fillOfficesOf` | a reeve keeps his office (0.6) | his record, the lord's favour, a better man at hand |
| `17-careers-and-event-engine-a.js:580` `A.seatOffers`, `:664`, `:696` `A.councilMonth`, `12-nobility-and-politics.js:190` `A.nobleAction` | the crown offers the player a seat, keeps or dismisses him | the king's opinion of him (R2's base), his skill, renown, a rival's word |
| `17-careers-and-event-engine-a.js:986` `A.councilPropose` | a proposal at council passes | the councillors' stances (56's tally) |
| `17-careers-and-event-engine-a.js:2230` `A.justifyMonth` | a forged claim is found out | the spymasters' skills on both sides |
| ~~`src/core/engine/game.js:85` `nextMonth`~~ | v2 kit's call to serve | **Routed in W1-4**: the why engine's `decide` (the war needs men, against the standing men being enough), the same pace |
| `src/nobility/999993-crown-crimes` (P3) | sentences and forgiveness (dice within named reasons) | already named: route `CC.forgiveOdds` and the sentence through `A.WHY.decide` with the ruler as decider (his temper and feelings at the criminal), the first users after W1-2 |

### Not decisions (heuristic hits), for the lint's next pass

`04-realms-and-war-years-b.js:908` (a child's game), `09-missions-and-line-battles.js:743` (a duel in a mission),
`18-event-view-a.js:2005` (a drill), `src/world/engine/world.js:23` (a new world's old grudges),
`src/people/41-friend-circles/circles.core.js:72` (an acquaintance). They may be marked `lint-reasons: ok (why)` when
next touched, which lowers the baseline.
