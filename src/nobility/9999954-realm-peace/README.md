# 9999954-realm-peace: the realm's peace (W1-6)

**Aspect:** order 54 and rule 18 (nothing happens without reason), `docs/design/war.md` §13 (stability, factions,
rebellions, coups), §9.4 (the disputes W1-3 left), §11.3 point 6 (a ruler made to yield) and §16 (W1-6) · **Kind:**
system, seven readable core files over `A.WHY` (W1-2) and `A.WAR` (W1-5), two events, edits in the release where its own
rolls and timers stood · **Decisions:** D-097 to D-103 · **History:** H-085.

Coups, rebellions and factions follow a kingdom's stability, the king's relations with each noble, and their own
ambitions, desires and circumstances. Nothing here is a dice roll or a bar that drifts: each choice is a person's,
through `A.WHY.decide`, with named reasons `{ kind, weight, source, label, pub }`, and a record.

## What it does

| Part | File | What |
| --- | --- | --- |
| Stability as reasons | `a-press.core.js` | `A.PAX.press(r)`: the realm's old temper (its lore word), the throne's right (legitimacy, a child, no heir to an ageing ruler), the lords (every house's loyalty by its swords; leagues against the crown), the commons, the towns, the faith and the army (the Polity's estates as each reads the realm, weariness, debt), the king himself (ill, old, famed, at war). The AI's year moves stability 15% toward their sum (`A.PAX.target`), without the release's ±3 of luck; a ruling player's year keeps the release's terms and adds the lords' and the king's push (`A.PAX.yearPush`) where the luck was. The word (firm, steady, uneasy, shaking, breaking) and its reasons open on a press (`G.realmStab`) |
| Loyalty from named terms | `a-press.core.js` | `A.PAX.houseTerms(h)`: an oath sworn, the crown's authority and its right to call men, taxes, the throne's firmness, his oath's weight and rights, a council seat or office, wrongs the crown did him (W1-3's grievances, a judgment lost, a raid disowned), his temper (ambition, honour), another faith or people, a great house that could rule alone, lost or won wars. A house's loyalty moves a quarter of the way to their sum each year (`A.PAX.housesYear`); the release's random walks (±2 a year everywhere, -4..+3 in a player's realm) are gone. `A.PAX.stance(h)`: loyal, content, cool, aggrieved, plotting |
| Factions | `b-factions.core.js` | §13.3's test: joining needs a tie to the houses sworn (a liege, a border, kin, a marriage) and raising the banner needs the standing to lead (a great house); a league of one breaks up after its first year. The anger is a reading (the members' grievance, the league's swords; events' anger fades). The ladder: the leader petitions or murmurs (`petition`); the crown grants, buys, arrests or refuses (`facanswer`; a ruling player answers on the release's card); the league backs down, waits, withholds taxes and men, or rises (`facrise`); an arrested leader flees or is taken (`arrest`: the spymaster's secrecy, his care, a friend on the council). 20's `A.aiFactionAnswer` and `A.aiRevolt` are retired to `archive/w1-6-faction-dice` |
| Risings | `c-risings.core.js` | A claimant presses or kneels (`claim`: his blood, a child heir, the crown's doubted right, the realm shaking, lords sore enough to back him; his oath and the crown's hosts), asked at a ruler's death (the eldest grown brother or child, else the greatest house's head: no longer a random pick) and each year in a breaking realm. A great lord rises against a ruling player (`rise`). The commons rise only with a voice, a named leader of the commons (`commons`: their grievance, bread, taxes, sons taken, a lost war, the occasion). When a league rises, every other great lord chooses the crown, the rebels or his hall (`side`). A neighbour backs a side in a war of succession (`war`) |
| Coups | `d-coups.core.js` | An opening (the king losing his war, ill, a child, very old; the realm shaking; a war lost lately), access (heir, consort, the king's siblings, councillors, the senior General) and a motive (ambition, a grievance, his blood, fear of a purge, saving the realm from a losing war). Without an opening no one is asked. The plot (`coup`), approaches one at a time (`approach`: join, refuse, tell), the spymaster's watch (`watch`), the night settled by who holds what (the host at the capital, the guard, the gates, the treasury, the seals, the heir, the king's person; counted, no dice), and after: crowned, contested (a war of succession) or failed; the king's judgment of the plotters (`plotjudge`). A ruling player is deposed, not killed (the Polity's po_deposed follows) |
| Disputes | `e-disputes.core.js` | A private war between two great houses (a boundary, precedence, a command given over him, their heads' enmity: two or nothing begins): complaint, the king's judgment (his regard for each, their swords, kin, a war abroad), the loser's acceptance or defiance, raids and whether the king steps in (enforce, crush, let), a fight in the field. A border war: a march lord raids a hostile crown (`raid`); his king disowns him and pays, backs him (weighed as his war council weighs a war), or leaves it to the march lords. The army's quarrel: a great lord under a General of lesser birth obeys, comes late or takes his host home (`quarrel`, from W1-3's commission) |
| The council and a ruler made to yield | `f-hooks.core.js` | A councillor's counsel of war, an alliance or a pact is the ruler's decision with his own reasons (`counsel`), and the other crown answers an alliance (`ally`). Three reasons in a ruler's pan to ask for terms (W1-5's `A.WAR.askHooks`): his lords refusing further service (W1-3's muster), his council's vote where the law gives it (a council realm), a coup made to end the war. The realm's month (fixed by its id) and the coherency check "an unreasoned upheaval" |
| The player | `g-player.core.js`, `pe.events.js` | `pe_coup` (approached by plotters: join, keep silent, tell the crown), `pe_judge` (a ruling player judges a quarrel brought to him). The stability note in words |

## News by rank

`A.PAX.tell(r, text, level, told, parties)`: the world hears a coup's outcome and a crown backing its march lord; the
realm hears a defiance, a field fight, an arrest, a league withholding; the court (ruler, councillors, landed lords) hears
petitions, judgments and quarrels; the parties hear their own feud. The reasons ("Because: ...; Despite: ...") go to the
ruler, his council and the parties. No war or plot screen opens unless the player is in it at his rank.

## Rules kept

- **Determinism.** Every decision draws only through `A.WHY` (`A.rand`, and only among close options); the field's
  outcome is a battle's chance (marked `lint-reasons: ok`). The realm's month is fixed by a hash of its id.
- **One holder per post.** A crowned plotter goes through `A.makeRuler` (which leaves every post); an executed plotter
  through `A.kill`.
- **Bounded state** (rule 21): `A.S.peace` 80 records, `A.S.feuds` 24 kept (48 at most), `A.S.plots` 6, the new `A.S.why`
  kinds 10 to 20 each. Old saves load: every field is optional (`r.peaceY`, `r.coupPeace`, `f.pet`, `f.withhold`,
  `w.sides`).
- **iPhone.** No new view; the descriptions open on a press; no hover, no percentages.

## Tests

`test.mjs`: `peStabilityReasons`, `peUpheavalsReasoned` (three worlds of twenty years, pooled), `peFactionLab`,
`peCoupLab`, `pePrivateWar`, `peForcedSurrender`, `peCounselAndClaims`, `pePlayerCards` (375 x 667),
`peDeterministic`, `peOldSaves`.
