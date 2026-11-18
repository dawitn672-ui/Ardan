# 9999950-why: minds (W1-2, R1's core)

**Aspect:** rule 18, nothing without reason (order 54, D-062; D-064 point 9; D-069) · **Kind:** system, one readable
core file over the v2 engine's `src/people/engine/why.js`; small edits in the release (`A.aiWarCheck`, `A.factionsYear`),
20-ai-personality (`A.aiNoteWar`), 68-reasons-for-war (the war's record and news), 99996-v2-diplomacy (`DV.tryWar`),
999990-posts (`P.fillGenerals`) and 9996-polity (the Factions card). No events.

## What it does

**One way of deciding for every decider** (`docs/design/war.md` §11.1). `A.WHY.decide(who, kind, options, ctx)`:

- each option carries **reasons** `{ kind, weight, source, label, pub }`. The weight is in log-odds: +1 makes an option
  e times likelier in a draw. The source points at the record that made it (an insult, a relation, a count, a debt);
  `pub` says whether anyone could know it;
- the decider's **temper** bends the weights by kind (20-ai-personality's persona, plus ambition from the traits): a
  proud man weighs an insult up to double, a cautious one counts spears higher, a greedy one counts coin;
- his **feelings** (`p.feel`, at most four: wounded pride, anger, grief, fear, greed, shame, loyalty, zeal, each with a
  target, a cause and a heat) add reasons to the options that feed on them, and the heat **discounts his reckoning** by
  up to 85% if he is hot-headed; a cold man's reckoning is never discounted. Feelings cool monthly, a vengeful man's
  slowly, a forgiving man's fast; only the people in `A.S.whyHot` are visited;
- **the best option wins.** Only when others come within the band of it does a seeded draw choose among those,
  weighted by e^score. That is the only chance;
- it returns a **record** `{ y, d, who, k, at, r, chose, s, why, not, rej, drawn, form }`: the three heaviest reasons
  for, the two heaviest against (its own, then the runner-up's), the options rejected, whether a draw chose, and
  whether the temper pushed toward the choice (true to form, +1) or away (against his nature, -1). Records go into
  `A.S.why`, newest first, **bounded**: 150 in all, war 60, faction 50, appoint 20, any other kind 20 (rule 21; about 450 bytes a record, so at most about 70 KB of the save).

`A.WHY.feel(who, k, cause, heat)` lights a feeling; `A.WHY.tell(rec, pubOnly)` and `A.WHY.tellFor(rec, rid)` say
"Because: ...; Despite: ..." in plain words, keeping to what the player could know (a realm's council's count of
spears is told only to its ruler and councillors).

## The decisions routed through it

| Decision | Before | Now |
| --- | --- | --- |
| A crown declares war (v2 diplomacy on, the live path: `DV.tryWar`) | the nerve gate, then `rngFor(...).chance(pw)` | past the rest and weariness gates, `A.WHY.warDecision`: war against peace. The war's reasons are the release's factors, named and sourced (`A.WHY.warReasons`: temper, the Generals' count, the hostility between the courts, a cause, rivals, the feud ledger, 68's plan and moment, infamy, unsettled lands, a sworn pact), plus the ruler's feelings. The court's factors (68's plan and moment, an old wrong or want, 55's feud ledger) weigh as the probability multipliers they were tuned as (`A.WHY.courtW`: above 1, logit(min(.97, .35 x m)) - logit(.35); CI 140). The peace weight is `DV.WAR.p`'s old pace plus `W.T.peaceOcc`. v2's own seeded stream draws; `A.rand` is untouched |
| A crown declares war (v2 diplomacy off, or called directly: `A.aiWarCheck`) | a monthly `A.chance(p)` over the same factors, and a sworn pact skipped by `A.chance(0.9)` | a council once a year for each crown (its month fixed by its id) and at once when a hot wrong calls it; all its neighbours and peace as options |
| A hot wrong (the release's incidents: an envoy shamed, a border fight, a raid, ships seized, a spy, a murder, a defector, an elopement, preachers stoned; a war lost) | a memory between realms only | also a feeling in the wronged ruler; one hot enough (`W.T.askAt`) calls his council at once (`DV.tryWar` with him as the one who would declare) |
| A great house joins, stays in or leaves a faction (`A.factionsYear`) | `A.chance(0.5)` for the war party's want, `A.chance(0.4)` to leave, `A.chance(0.35)` to join | `A.WHY.factionChoice`: his grievance (the house's opinion), the faction's own want, the houses already sworn, the throne's firmness, old loyalties, his word given; decided by the head (or the lore family's traits). A house content where it stands decides nothing |
| The crown names the General of its first host (`P.fillGenerals`) | the best by command, renown and grade | the three best before the crown through `A.WHY.appointGeneral`: merit nearly settles it (band 0.3); kin of the king's house and a wary king's fear of a famous man bend it |

The rest are listed with file, line and the reasons they should use in `docs/design/r1-audit.md`, and counted by
`tools/lint-reasons.mjs` (baseline `tests/reasons-baseline.json`, which may only fall).

## What the player sees

- **The news of a war declared** ends with "Because: ...; Despite: ..." in words: a public reason (an insult, bad
  blood, a cause, a rivalry, a pact broken) for everyone; the council's own count and the ruler's temper only for that
  realm's ruler and councillors. No numbers.
- **The rulers' log** (20's "Recent decisions of rulers") shows a war's own reasons from its record.
- **A faction** keeps its founder's public reasons (`f.why`), shown on the Polity's Factions card; a faction raised in
  the player's realm is news with them.

## State (all optional; old saves load)

`A.S.why` (the records), `A.S.whyHot` (people with feelings, at most 400), `A.S.whyAsk` (councils called, at most 24),
`A.S.whyTick` (the council month), `p.feel`, `w.why` (a war's record), `f.why` (a faction's told reasons). Lookups by id
go through a `Map` (the temper cache), never stored.

## Tests

- `tests/v2/why.test.js` (unit, `node --test`): the owner's two lab kings (the proud king declares the war his
  Generals said he would lose in 50 of 50 worlds, his record says why and despite what; the cold king waits in 50 of 50
  and, four years on with the count in his favour, strikes in 50 of 50 with the insult "carried 4 years" among his
  reasons), the band, the temper's bend, feelings and grudges bounded and cooled, the record's shape, what anyone could know.
- `test.mjs` (browser): `whyLabKings` (the same in a real realm through `A.WHY.warDecision`), `whyRecordsKept` (records,
  bounds, save and load, an old save), `whyToldByRank` (the news, by rank), `whyFactionsAndGenerals`.
