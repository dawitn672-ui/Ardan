# 993-far-life: life in the Far Lands (events)

**Aspect:** Events (round 10, lane L6: the Great Continent's lives meet their own world) · **Kind:** event packs (414 events, prefix `fv_`), one small core file (`far-life.core.js`), a test. No patches.

A life in the Far Lands used to meet only the Known World's generic events. This folder gives each of the ten Far Lands its own scenes, built from what its lore makes distinctive, plus scenes that join the two halves and the far faiths' holy days. All text is fresh, written in CLAUDE.md's voice from the lore in `canon/lore/` (no lore prose is pasted).

## Condition helpers (`far-life.core.js`)

| Helper | True when |
| --- | --- |
| `C.land(p, 'R', ...)` | the home province lies in one of these Far Lands (first letter of its lore region: F Long Grass, B Sand Basins, R Twin Rivers, M Southern Peninsulas, A Thousand Isles, H High Steppes, T Black Pines, I Sunrise Isles, D Deep Southland, N Rime Coast) |
| `C.region(p, 'R-08', ...)` | the home province's lore region |
| `C.farLand(p)` | the home is anywhere in the Far Lands |
| `C.greatWorld(p)` | the game is the Great Continent (`S.world` names the far lands); a Known World home can then hear of the east |

They read only the map and `S.world`, draw nothing from `A.rand`, and are false in every Known World game. They are geographic, not class markers, so `A.CX_RX` does not need to know them: every event also uses the class helpers (`C.poor`, `C.noble`, `C.ruler`, `C.job`, `C.child`, `C.soldier`...) so `A.evAudience` classes it as usual. `A.FV` holds small tools (a person made to fit a story, years in words, a booked callback).

## The events

| File | Land | Events | Built from |
| --- | --- | --- | --- |
| `r-twin-rivers` (+3 elsewhere) | R | 27 | the census at fifteen, the exams in the Hall of Cells and the censor who reads old papers, half-notes, Archery Day and hired shooters, dyke-heads chosen by baskets and the order to cut the dyke, the Bridge of Two Customs and the porters' tunnel, the Tide Families' night trade, the Silk Law, the Black Lamp's burned census entries, the beacon towers, impeachment memorials, the Emperor's Furrow |
| `f-long-grass` | F | 22 | the first ring-hunt and the horse-name, the census of tens, the old khagan's illness and the death-war, the twelve ropes, the Old Mare's winter-count, the Red Hide's two names, the Shrinking Sea's coin, loaf and salt for the tax riders, dragon eggs, sham bride-raids, the Gap's hidden road, the thousand riders over a grave, the tent threshold |
| `b-sand-basins` | B | 22 | the Market of Masks and broken tablets, the third cup, Ozand's unnamed sons, the Water Court, Ralke's fourth day, jade found by foot, the channel boys of Ozur, the Varinj cistern count, the Nine Wells' oath and the Sunset Tales, bought boys and the Purse day, Yasguri secret names and rope bridges, the pipes under the Seven Flames, the melon greeting |
| `m-peninsulas` | M | 22 | the Debt Weighing and the temples' two ledgers, stall-coins a month late, the Stable-born's free sons, the Turning-Tide race, honey masks, the Gate of Unmarking, the silting tanks of Pravith, a rains season in the monastery, the town boxing ring, black teeth, the catchers' tongue, the first pearl, planted stones, water from a lower house's hand |
| `d-deep-southland` | D | 21 | the Stone Book (the cliff scripture) and the line about Abara, churches cut downward, the Stone King's screen, the king's gold, the herd recited at funerals, age-sets and the refused hand-over, the false Thunder Drum, the copper furnace, copper crosses, the River Bride, the monsoon call, the Hadun veil, the forest bands' names, the dead danced in new cloth, calves named for the dead |
| `h-high-steppes` | H | 19 | one son in three, the Dzamtso circuit, the body-breakers, the salt tongue, hidden gold and the cold, gorge man-prices in yaks, bridge prices, the Cold Gate's Long Count wall, the Long Carry to the Red Stair, porters of the Pilgrim Stair, the dragons' ledge, Dzuma's new names, the pass cairn |
| `t-black-pines` | T | 19 | the Bell Moot and the prince sent out of the gate, the Drevnan furs at Peryvor, one skin in ten, the trap robber, the Mirror and the ice crack, diamonds as gaming stones, the drum-walker chosen by fever, the first salmon, bread for the giants' halls and the giant mother, the mine walled after three deaths, the Hunt of the First Snow, the stranded whale, the drowned mourned after a year |
| `a-thousand-isles` | A | 18 | the palm-leaf pass and the Strait pilots, the 210-day water calendar, Tanomin's hearth-cats, buffalo fights, omen birds, the silent market, the Silo captains' reef, earned tattoos, the clove tree, pig feasts, the Drifting Houses ashore, the boat children's diving game |
| `n-rime-coast` | N | 14 | the first walrus, the broken taboo when the ice fails, children named for the dead, the giants' whistle, adoption into a giant household, the Mothers' Chant and the Ice Road, mammoth ivory, the frost leviathan under the ice, driftwood and empty houses on the Bone Isles |
| `i-sunrise-isles` | I | 13 | the fire-name, the name changed at a first command, the crestless retainer, the Ouro hostage-guest, the bear cub sent home, Liuhane's wooden pass, the Watch's fire and the drift log's peg, the Spear-Marshal's election, household steel |
| `x-across` (+7 in `z-later`) | across | 26 | the chain of nine hands and the factor sent west, a felt-hatted merchant in Kraoth, the Sunset and Sunrise Tales, a westerner at the gate, the Long Count beside the western calendar (canon L-013), a Lamp monk asking the west what it carries, the Old Mare's messenger to the western orcs, Gyokar's letter to Skyhold, the Drevnan trappers, Emberdeep iron on the Rainwall, Kesh's ships on the Coral Coast, the Hadun guide law, Ranpur's pale elephants, Zanara's pillar at Mosandi, Lamhou's locked quarter, the white sails of 1031 |
| `y-faiths` | faiths | 22 | the Sweeping of Graves, Hungry Ghosts, the Kitchen Clerk, the Hatching, Teshur's Lighting, the Lamp of Arms, the Breaking, the Standing Flame's shirt and cord, the White Month, the Marmot's Silence, the Mare's Foaling, Lamp Night, the Day of the Watch, the Kindling, the Turning, the last sheaf, the Great Flood Tide, the Bear Feast, the Drum Night, the Sea Mother's water, the Queen's Climb, the Stone Book's fasts |

`c-childhood` and `z-later` hold childhood scenes and later callbacks; their ids carry their land's prefix and are counted with it above. Every land has scenes for children, youths, adults and the old, and for the poor, the trades, merchants, nobles and rulers.

## Memory

- **94 of 245 events (38.4%) read a flag another event sets** (the bench's `memoryIndex` rule: `C.flag` in the cond, or `p.flags.x` in setup, text or choices). Every flag set here is read again (no orphans). Callbacks are timed (`A.S.year - p.flags.x >= N`, N from 1 to 40), so a childhood choice comes back in adulthood or old age: the census bribe at fifteen keeps you on the dyke roll at sixty; a horse-name from the first ring-hunt is given again to a grandson; a jade stone kept by foot becomes your own burial cicada.
- Faith scenes read land flags in their text (the lamp taken at Ralke, the burned census entry, the dragon seen from the ledge, the fire-name, the Old Mare's view of your chosen name).
- Cross-world arcs join the halves: the factor sent west comes back with Kraoth silver and the Nine Wells' melon; a Skyhold player feeds the yak-man and later walks Skyhold's answer to the last cairn; a Drevnan hears of Peryvor's storehouse and later of the new prince; a Peryvor trapper shows a Drevnan the Lubany stamp.


## Second pass: childhoods, real people, every realm, a month's texture

| File | Events | What |
| --- | --- | --- |
| `g-young` | 34 | two scenes for small children and one for a youth in every land (milk names, lock cousins, the first pony, a name after one winter, the gate lamp, the prayer wheel, the Black Hat dance, Little Rat, the last sheaf, the tide-line bowl, the forbidden star chant, Honey-Paws, the bell rope, a snow house, a giant's ivory toy, the gate rope at New Year, the house crest, ash on the paths, feeding the drum, the forest's morning song, the lion at the thorn fence), and their later scenes |
| `k-figures` | 10 | the real people of each far realm: the ruler passing on the road, the petition day, an audience, the heir's hunt and the heir as a child in the palace gardens, the chancellor's loan, the marshal's levy, the noble house that owns your land, a match with a house, the ruler's illness. `A.FV.ruler`, `heir`, `councillor` (the realm's `council` seats) and `house` (`A.realmHouses`) put the person in with `ctx.pid`, so `{them}`, `{themHim}`, `{theirHis}` work; a scene with nobody fit drops itself |
| `e-realms` | 129 | one small, frequent scene for every one of the 118 far realms (two for the crowded great powers: Taulen, Hesh, the Khaganate, Tordzan, Vahra, Kethra, Pravith, Suraeng, Kemodari, Menaro, Ndorima): a market day, a ration or tax line, a festival eve, a duty owed, a rite kept, each written from that realm's own custom. `w: 2, cool: 2`, so a month in the far lands has texture. The four kinds share their choices, and each choice leaves a habit (`fv_hab_*`) that the next scene of its kind remembers in its first line |

**Realm reach:** far realms with at least one scene of their own (named in a cond): **34 before, 118 after**. Kethra's free-born sons and their discovery also reach Navesht, whose Purchased keep the same law.

**Memory:** 229 of 414 events (55%) read a flag another event sets. 100 of them are arcs (the land callbacks and cross-world threads); 129 are the realm scenes' habits.

**Tests:** `fvFarLives` is now the quick version (two far births, six years). The long one is `fvFarLivesLong` (six births of ten years, two adult lives of six), which runs only when named with `--only=fvFarLivesLong` and requires the median far newborn to meet at least 3 of the land's scenes.

## Measured by (`test.mjs`)

| Test | What |
| --- | --- |
| `fvFarEvents` | every event registered; at least 10 per land, 18 across, 15 faiths; every flag read is set elsewhere; each event play-tested in a Great Continent character built to satisfy its cond (realm, land, age, sex, status, job, faith, coast, children, flags years ago), rendered (no skip, no raw token, no NaN, text <= 80 words, labels <= 12) and every choice taken with checks forced both ways; a timed callback must not fire in its flag's year |
| `fvKnownSame` | three Known World games (one with `lands: 'known'`) played four years give the same state hash and random stream with and without these events; every `fv_` cond is false for six Known World characters of each class and age |
| `fvFarLives` | ten years from birth in five Far Lands and six years from sixteen in two more: no page error, no raw token, `fv_` events met |

Density, measured on the same build (`fvFarLives` and a probe of Known World lives): a Known World adult meets 2 to 5 of his realm's own scenes in ten years from sixteen (Nine Winds 2, Tamar 5, Kesh 2) and a newborn 3. A far adult meets 2 to 3 of his land's scenes in six years (Peryvor 2, Ozand 3), a far newborn 1 to 4 in ten (Taulen 2, the Khaganate 1, Vahra 1, Ndorima 1, Menaro 4). Land events carry `w: 3` (childhood scenes 4, faith and cross-world 2); newborns in the far lands still meet a little less than in the Known World, which has more child scenes per realm.
