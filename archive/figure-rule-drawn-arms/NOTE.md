# Retired: the figure library's rule-drawn arms (2026-11-14, owner order 52, D-050)

**What it was:** the weapons and the shield of the figure library as gate 2 and C8b drew them, all inside
`src/ui/engine/figure/gear.js` (kept here whole, as it stood): one `swordArt`, a single straight sword, bare or
sheathed, whose tint, guard and pommel changed with make and rarity; a dagger, which was that sword drawn small; one
heater shield stood by the leg; a staff with one spearhead for every spear and pole arm; a belt `tool` standing in for
every axe, mace and hammer. Bows and crossbows were carried and not drawn. A legendary sword without a drawing of its
own was sun-steel with a blurred light round it.

**Why retired:** the owner asked for the non-legendary weapons to be "more intricate and designed" (order 52).
`src/ui/engine/figure/arms.js` now draws 45 forms as made things, by form, make, rarity and people; `gear.js` keeps
where each is carried, and `make.js` holds the two measures and their paint.

**Carried over:** the gear-by-item table (`GEAR_ART`, `registerGear`, `artOf`); `mats()` and its tables, moved to
`make.js` unchanged; the call `swordArt(S, G, a, L, q, o)`, which takes the same arguments and still returns
`{ pommel, W }`; the carry points (at the hip, planted before the feet, by the leg, in the hand); the `tool` item, which
still draws a trade's hammer or knife. **Not carried:** the blurred light round a legendary blade, which D-045 had
already ruled out ("no magic glow"); a unit test now holds that no arm is drawn with a filter.

**Last commit that had it:** `bcfd0d5`. The gate 2 demo keeps its own copy of the same code
(`docs/design/demo-2d/gate2/gear.js`), and `docs/design/legendaries/ordinary.mjs` reads the library at that commit out of
git to draw the "before" column of `ordinary.png`.
