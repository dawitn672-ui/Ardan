# D11: military branches and battlefield strategy (design notes)

*Stamped 2026-11-12 05:59 ET · draft prep for C7/D11, not wired into the game · superseded by nothing yet*

Preparation only; nothing is built. Companion data: `d11-branches.json`. It fits what exists: the v2 battle
(`src/war/engine/war.js`: tactics hold, advance, charge, flank, volley, feint, withdraw; terrains open, hills, forest,
ford, pass; phases Skirmish, Clash, Press, Decision), drills that gate tactics (60-drill), companies of 200 and
battalions of 800 (9997-companies), and the four ranks (99997-v2-war). Odds are shown in words, never percentages.

## The rock-paper-scissors

Three corners and two helpers. Everything else is a variation.

- **Cavalry beats archers and loose foot.** A charge ridden into bowmen or levies in the open ends the fight.
- **Spears and pikes beat cavalry.** A set wall stops a horse. The knight does not charge a wall of points.
- **Missiles beat spears.** A wall that cannot move is shot to pieces. Crossbows add one trick: they pierce armour, so
  they beat knights and men-at-arms too.
- **Light cavalry beats missiles and the baggage**, runs down the broken, and loses to anything armoured or set.
- **Armoured foot (men-at-arms, dismounted knights) win the grind** against spears and levies, but cannot catch
  archers and lose to being flanked.
- **Engineers beat walls**, and garrisons with crossbows beat engineers.
- **Scouts and the Scout Regiment beat plans.** They do not win fights: they choose where, when and whether.
- **Levies fill the line cheaply, and break first. Elite orders count as thousands**; only starvation, sieges and
  great numbers beat them.

Rule of thumb for the player: *match the answer to what faces you, then pick the ground.*

## Terrain and timing

- **Open ground** serves cavalry and the larger army. **Hills and fords** serve the defender, archers and spear walls.
  **Forest and marsh** cripple cavalry and favour scouts. **A pass** makes numbers nearly worthless and lets elites
  and a few crossbows hold an army. **Siege** is engineers, crossbows and patience.
- **Timing follows the four phases.** *Skirmish*: archers and light horse shoot and scout; others wait.
  *Clash*: lines meet; the wall and the stakes do their work. *Press*: the flank swings, the feint turns, the
  reserve is weighed. *Decision*: the charge on a wavering foe, the pursuit, or the last stand.
- **Three timing rules.** Hit a wavering line, not a set one. Spend the reserve when the foe is tired, not before.
  Never charge a prepared line (stakes, pikes) on its own ground.
- **Drill matters**: a tactic works at full strength only if the men learned it (wedge, shield wall, feigned flight).
  A feint with untrained men is just a rout.
- **Weather and supply** (existing in the campaign step) tilt a battle before it starts: hungry or rain-soaked men are
  worse at everything.

## The career in each branch

Ranks follow the game: soldier, sergeant, captain, commander (company 200, battalion 800, then a division).

- **Knights (lancers, mounted men-at-arms, dismounted).** *Soldier:* one blow a battle; the choice is when to couch
  the lance, and whether to follow the banner or hold. *Sergeant:* a lance of eight; you keep them in the wedge.
  *Captain:* a banner of sixty; you pick the moment and the flank, and your death is a loss. *Commander:* you hold the
  shock arm and decide when the reserve goes. Dismounted knights feel different: slow, safe, no way out.
- **Light cavalry.** *Soldier:* scouting and raids; short bursts of fear. *Sergeant:* a troop who ride out and report.
  *Captain:* harass the march, cut the road, choose when to run. *Commander:* master of scouts; wins by never fighting
  the whole army.
- **Scout Regiment.** *Soldier:* alone in the dark, stealth tests, a knife job. *Sergeant:* a patrol of six; one
  failure ends it. *Captain:* a company of fifty; plans an assassination or a burning. *Commander:* master of scouts, a
  court rank; the realm's eyes, hated and needed.
- **Spear and pike.** *Soldier:* hold the file; endure. *Sergeant:* keep twelve in line when the horses come.
  *Captain:* hold a ford or a pass. *Commander:* the wall the whole army forms around.
- **Archers and crossbowmen.** *Soldier:* pick a target, mind the stakes and the rain. *Sergeant:* a file of twelve;
  call the volley. *Captain:* a company of two hundred; read when to shoot and when to fall back. *Commander:* master of
  missiles; the plan of stakes and ground.
- **Men-at-arms on foot.** The line-breakers: soldier hits hard, captain breaks a spear line, commander guides the
  centre.
- **Siege engineers.** *Soldier:* haul and dig. *Sergeant:* a gang on a ladder or a mine. *Captain:* a gate or a
  bridge. *Commander:* the siege itself; time, food and the wall.
- **Garrisons.** Slow, safe, and a long watch; the work is holding the gate and keeping the peace; a captain of a castle
  is a minor lord.
- **Levies.** Soldier: called, afraid, loyal to the village. A good one is noticed and made a spearman.
- **Mercenary companies.** Hired sword; pay, plunder and risk; the captain-general chooses sides.
- **Elite orders.** Trials first; then a small, sworn family; each man counts as many; ranks run Aspirant to Grand Master.

## The 10 tactics that matter most (for the war-depth step)

1. **Couched lance charge** (heavy lancers, knights). Wins in open ground; fails against stakes and pikes.
2. **Spear wall** (spear, pike). Beats a charge; loses to missiles and a flank.
3. **Archers behind stakes** (archers, crossbows). Beats charges and advancing foot; weak to light horse behind.
4. **Feigned retreat** (light cavalry, mounted men-at-arms). Pulls a bold foe out; with untrained men it is a rout.
5. **Flank swing** (cavalry, mobile foot). Needs scouts and a free flank; strongest against a foe holding the centre.
6. **Dismount and hold** (knights). Good ground and no escape; strong against cavalry, weak to missiles.
7. **Crossbow volley at the armoured** (crossbows). The knight-killer; needs cover.
8. **Scout screen and ambush** (scouts, light horse). A column on the march is exposed; a big army can answer.
9. **Night knife** (Scout Regiment). Kills a captain or burns stores; if caught, the realm bears the shame.
10. **Reserve strike at the Decision** (commander). Spent too soon or late, it loses the day; spent right, it wins.

Also noted: siege works with a sally, and the pursuit of the broken, in the JSON.

## How it could fit

Each branch maps to the existing unit (`makeUnit` kind, `cavalry`, `ranged`, `worth`), a drill and a counter row; the
terrain table already has the cavalry and ranged multipliers. What is new is a short counter table per branch and the
missions and career text, so a soldier's choice at each phase reads as a real choice: stand, loose, charge, or hold the reserve.
