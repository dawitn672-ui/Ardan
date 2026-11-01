# After-action reports

**Aspect:** War (Road to Ten, War steps 2 and 4) · **Kind:** system

Before this feature, a battle ended with "Victory. Dead: 470 of yours, 1,883 of theirs." Nothing told you why you won. Now every battle the player fights ends with a report that names its three biggest causes, in the form the plan asks for: "more men in the line +40%, your blow on their flank +31%, the fog −4%".

**Three kinds of battle.**

1. **Line battles** (`A.newBattle`, the pulse-by-pulse field battle).
   - `aar.core.js` wraps `A.missileExchange`, `A.wingClash`, `A.flankAttack`, `A.moraleCheck` and `A.battleFinish`.
   - Each wrapper reads unit state before and after the call and keeps a tally on `B.aarT`.
   - At the end it builds `B.aar = { causes: [{ label, pct }], text, where }`.
   - The report appears on the battle's last screen, and a line goes into the story log ("After the battle, the captains reckon it: …"). The causes are also kept on the war's battle record.
2. **War-map fights** (`A.fightDay`, the multi-day division fights).
   - Each day's terrain, winter, walls, tactic match-up (`A.tacDay`) and the quality of the divisions are scored the same way.
   - When the fight ends, the causes go onto the war's battle record. If you were in the fight, the reckoning goes into your story, told from your side.
3. **The war views** (AAR-WAR-VIEWS patch).
   - The list of recent battles now says what decided each one, for example "Battle of Tessar 1105 (decided by flanking march against watchfires and pickets)".

**How a percentage is made.** Damage in both resolvers is (to first order) linear in each side's power. So the effect of one multiplier on a side's kills is `kills × (1 − 1/multiplier)`, and every cause is counted in **kill-equivalents**: the dead it added to the enemy, plus the dead it spared its own side.

- **Line battles:** pct is that figure as a share of everyone who fell in the fighting, signed for the player's side.
  - The rout is reported in the text, as a consequence ("Their line broke first, in the fourth push, and the rout did the rest").
  - It isn't scored as a cause, because otherwise "they ran" would top every report.
- **War-map fights:** pct is a share of all the day's dead.
- **Overlap:** causes overlap (a shield wall's work also shows in its wing), so the shares are not meant to add up to 100.

**The causes it measures (line battles).**

- Numbers.
- Command.
- Drill and kit (unit quality, so realm drill shows here).
- The troops (fighting value per man).
- Archery.
- The flank attack, or being flanked.
- The ground (horse slowed in forest, marsh, mountains or hills).
- The weather (rain, fog or wind on the archers).
- Leading from the front.
- Every tactic in use, yours and theirs. A tactic counts both the kills its attack added and the kills its defence spared.

That last cause covers War 4: a pike hedge that breaks a lance charge shows as "Your pike hedge +27%", and the report says so.

Each report always shows the best cause for you and the worst against you when there are any. A champion duel in the press is told in words.

**Measured by** (`test.mjs`):

- `aarEveryBattle`: 48 mixed battles; all get a report, and all have three causes with no NaN.
- `aarCausesPointRight`: each lever moves its cause the right way.
  - Twice the men gives +33, and equal men gives 0.
  - Horse in the forest gives −47, and on the plain the ground is not named.
  - A pike hedge against lances gives +27.
  - Rain on archers is a minus.
  - A far better general gives +13.
- `aarCalibrated`: the report against a real counterfactual.
  - The forest's cost to the riders: the report says 68 kills, and the measured difference between forest and plain is 67.
  - A pike hedge against holding: the report says 67, and the measured swing is 52.
  - Both must fall within a factor of two.
- `aarScreenAndLog`: shown on the end screen; titles escaped; rendering consumes no `A.rand` and changes no state; the line reaches the story log.
- `aarWarMap`: 245 war-map fights in 18 months.
  - All have a report, and 244 name a cause.
  - The report from one side is the mirror of the other.
- `aarSoldierLog`: an enlisted soldier gets the reckoning in the story.
- `aarDeterministic`: same seed, same battle, same report.

**Rules kept.**
- Engine side only. The wrappers never draw from `A.rand`.
- Rendering only reads `B.aar`.
- All text goes through `UI.esc`.
- New state (`B.aarT`, `F.aarT`, `aar` on battle records) is optional everywhere, so old saves load.

**Limits.**
- **First order only.** The real effect of a cause compounds over pulses (fewer kills, so less morale damage, so a later rout), so the figures are lower bounds. The calibration test bounds the error.
- **Morale-only effects aren't scored.** The organisation damage of war-map tactics (`aOrg`, `dOrg`) and the fear from elephants and camels change morale, not kills, so the report doesn't score them.
- **Not built:** War step 1 (personal choices per rank) and step 5 (playable sieges). This feature gives them the instrument they will be measured with.
