# 79-beast-scenes: scenes take the beasts that live there

**Why.** 76-beast-habitats keeps `A.beastsNear` to the world bible's ranges. Some scenes picked their beast without asking it, or fell back to one when it found nothing. Its probe traced 12 of the 15 beast deaths left after 76 to these.

**What** (`patches.mjs`, three patches on `ardan-content`):
- **explore_lair** used two draws, one for its text and one for its fight, so the signs could be one creature's and the fight another's. The text's draw also ran while the screen was being drawn. The text now names the beast the setup chose. Where no beast lives near home, the scene is skipped; before, it fell back to a cave bear (`CRE-25`), which canon puts in two regions.
- **The hs_* `beastNear` helper** had the same cave-bear fallback. The scene is now skipped instead.
- **The spear hunt's `C_beast`** picked by terrain alone, such as a hell boar in any forest. Its pick stands where canon puts that beast. Elsewhere it takes a non-legendary beast that does live near home, and the hunt is skipped where none does.
- **29-starts' "What Took Your Father"** (edited in that feature's `starts.core.js`) picks the father's beast from what lives near home. It goes by terrain only when nothing does.

**Left as they are.** The scenes written for particular lands keep their own hand-placed conditions: the `av_wild_*` adventures (the Grey Stag in the Evenwood realms, the Red Widow over the Free Marches), the hunters' commissions and the realm-gated hunts. The `hunt_beast` trigger's `CRE-25` default stays too, since every caller passes a beast.

**Test.** `bsSceneBeasts` runs each setup 40 times in Aldmark and Northreach (no beasts near) and in Madora (two). It checks that the scenes are skipped where nothing lives, never choose an off-range beast, and that the lair text names the beast that is fought. The build without this feature fails it: there, cave bears are offered everywhere, and the lair text names a different beast 21 times in 40.
