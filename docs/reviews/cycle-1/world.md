# Cycle 1 review: the world

*Reviewer "world", Oct 27. The question: does the Great Continent read as one coherent, living world, and is it as deep in the Far Lands as in the Known World? Built game: `/home/user/Ardan/index.html` as it stood, not rebuilt. Lore: `canon/lore/` (read, not quoted).*

## Method

All scripts and outputs are in `/tmp/ardan/cycle1/world/` (written `W/` below).

- **World soaks.** `W/run30.cjs` starts a Great Continent game by code (`A.newGame({..., lands: 'great'})`), keeps the player alive, plays with `A.advance` and auto-chosen events, and snapshots `A.S` every five years: realms, owners, armies, treasuries, wars, history and news.
  - Seed 4242 from Aldmark, 30 years (`W/snap-a.json`).
  - Seed 99 from Vahra, 20 years (`W/snap-b.json`).
  - Analyser: `W/an.cjs`.
- **First year in three more seeds.** Seeds 31 and 32 from Taulen (`W/e4.cjs`, `W/e4.json`), plus seed 31 played five years in both the Known World and the Great Continent (`W/e5.js`).
- **Lore fidelity.** `W/e4.cjs` checks each of the 118 far rulers against `far-lands.json` (name, sex, birth year, culture) and lists realms that have no faith.
- **Trade, names, news, empty land.** Seed 777, an Aldmark merchant, 6 years (`W/e3.cjs`, `W/e3.json`).
  - Every caravan of every month: 12,000 of them.
  - Prices of silk, ivory and furs in eight realms.
  - Every far person's name against the Known World's name lists.
  - Province name duplicates.
  - Unheld provinces by lore region.
- **Map.** `W/shots.cjs`, from a Taulen life.
  - The full map fitted, and at zoom 0.45, 1, 3 and 8 over seven places: the seam, Venshai, the Long Grass, the Deep Southland, the Isles, the Rime and the Pines.
  - Every map mode, plus the Realm, World, Codex, War, People and Book tabs.
  - Shots `W/01-*.png` to `W/05-*.png`.
- **A far life through the menu.** The brief's harness, copied to `W/harness.cjs`, played a grown life in the Khaganate. Log `W/h-log-1400.txt`, shot `W/h-s-1400-m29.png`.
  - It stuck after 13 months on the "Laborer: choose your path" modal, which has no `evChoose` button. That is a harness gap, not a game bug.

## Verdict

The continent looks like one world on the map.
- The seams with the Known World are invisible.
- Labels come in at sensible bands.
- Routes, rivers and seas are named.
- At every zoom no Known World name appears in the east, and no far name in the west.

A far life meets its own world: the White Month, the count of tens, the horse-name, the Grey Ten seen on the grass, and word of Taulen's war arriving months late. Names are almost clean (10 Known World names among 1,203 far people, all but two in one realm).

What breaks the illusion is **the politics and the economy**:
- the lore's rulers arrive with the wrong sex and age;
- the lore's standoffs are settled in the first months of 1105;
- the Twin Rivers trade twenty provinces a war;
- silk does not travel the Silk Road.

The world is drawn deep and simulated shallow.

---

## Bugs

### B1. The lore's rulers are the wrong sex and age, which defuses the lore's own crises
- **Seen.** `W/e4.json`, seeds 31 and 32.
  - All 118 far rulers carry the lore's name.
  - Only 69 and 72 of the 118 have the lore's sex, and only 4 and 3 have its birth year. The median error is 10 years and the worst is 154.
  - Khagan Borghen Tegur ("73, has not ridden since autumn") is a woman born in 1058 or 1050.
  - Emperor Ishe Venhan of Taulen (lore: a man of 36) is "Empress Ishe Venhan, 55" in seed 5150, `W/05-tab-realm.png`. The same card heads her "Emperor".
  - Hvaldi, Fjorund's 100-year-old giantess, is a human born in 1048 or 1075.
- **Consequence.** In seed 4242, Tegur dies in 1107 of "a wound gone bad". Kur Onghal succeeds, not Ulgai (the grandson the Felt Keepers chose), and nothing splits.
  - "The khagan's last winter", the lore's first conflict, never happens.
- **Why it matters.** The Far Lands' story hooks are people: the dying khagan, the reading emperor, the ancient giantess. A player who has read the realm primer ("a khagan who may not see the summer") and finds a 47-year-old khatun learns that the text lies.
- **Fix.** In `99-far-lands` (`c-lands.core.js`, where `A.initWorld` builds the far royal family), set the ruler's `sex` and `born` from the lore record. The README says `realms.mjs` and `lore.mjs` already read both. Also seat the lore's named heirs (Ulgai), and give Fjorund a giant ruler.
- **Size S · Impact 5.**

### B2. The first year is an avalanche: the lore's long wars end within weeks
- **Seen.** In every seed, 6 to 10 wars begin and end inside 1105 (`W/e4.json` H lists, `snap-a.json` history). The Known World alone, same seed, has 2 (`W/e5.js`).
  - **Vahra takes 12 or 13 provinces from Kethra** in all four seeds. Lore: they "fight most dry seasons" over the Upper Plain, and Kethra has the best cavalry south of the Cloudwall.
  - **The Black Lamp Commune falls in 1105** in 3 of 4 seeds. Lore: it "has beaten three Taulen armies".
  - **Seed 32: Pravith takes Thinsak and nine more provinces** in 1105. Lore: Thinsak is the one winning Pravith's tributaries.
  - **Seed 4242, all in 1105:**
    - the Khaganate takes 10 provinces from the Right Wing, the war the lore holds back until Tegur dies;
    - Seuvan takes 12 from Shulai;
    - Taulen takes 11 from the Ridges;
    - Silo takes 6 from Paaluan.
- **Why it matters.** The player opens on a world of tensions, the primer says so, and by the first winter the map has been redrawn and the tensions are gone. Nothing is left to watch build.
- **Fix.**
  - In `991-far-war`, make `FW.CONFLICTS`' three 1105 wars limited wars:
    - a border goal (the Upper Plain, the lake islands, the Lamp's hills);
    - the lore's walls and ground for the defender;
    - a peace that moves at most two or three provinces.
  - In `09-scale` (`world.core.js`), give each far land a grace period of 12 to 18 months before `A.aiWarCheck` may start new far wars, the lore's three aside.
- **Size M · Impact 5.**

### B3. The Twin Rivers trade provinces by the score, and small realms explode
- **Seen.**
  - **Seed 99 (`snap-b.json`):**
    - Hesh and Taulen swap 15 to 22 provinces in each of five coalition wars, 1115 to 1121. Each lasts under a year, and Taulen takes 18 to 20 per peace.
    - Hesh falls from 109 provinces to 59, and Taulen's army from 471k to 52k.
    - Ngoru (lore: a small kingdom with 28,000 standing) grows from 5 provinces to 32.
  - **Seed 4242:**
    - Seuvan grows from 4 provinces to 28 and its army from 71k to 260k. It starts with the most men per province in the world: 17,800, against Taulen's 3,900.
    - The League of the Tide Families (lore: 4,000 standing) takes 13 provinces from Taulen in 1131.
  - The Twin Rivers' provinces are small, seeded by people, so a "province" there is a district. A peace that takes "everything occupied" moves a kingdom.
- **Why it matters.** The two ledger empires, the lore's anchors of the east, read like dice. A player in Venshai sees his empire halved and doubled within ten years, with no story to explain it.
- **Fix.**
  - In the release's peace terms, via `68-casus-belli` or `09-scale`: cap a peace by the share of the loser's land or people (say 15%) rather than by province count, and weight war score by province area.
  - In `99-far-lands` `realms.mjs`, give Seuvan land in proportion to its lore army (180,000 km²), or cut its army to the land it got.
- **Size M · Impact 4.**

### B4. Fjorund is a Known World realm in disguise, and two far realms have no faith
- **Seen** (`W/e3.json` badSample, `W/e4.json`).
  - The Last Hall of Fjorund's royals and gentry are Northfolk (`CUL-02`, the Known World's): Osmund and Aldred Fjorund, Osmund Brambleworth, Kettil Saltcote, Ulric Ashbury, Hamo Oakhurst.
  - The realm's own culture is `CUL-82`, and its lore ruler is the giantess Hvaldi.
  - Of 1,203 far people, 10 carry Known World given names, and 8 of those are Fjorund's.
  - `realm.faith` is undefined for Fjorund and Hadun. 990's README says both keep a Known World faith (the Hall-giants' Mothers, the Path of the Well).
- **Why it matters.** It is the one place where the far east speaks the west's English-sounding names, on the Rime Coast at the top of the map.
- **Fix.** In `99-far-lands` `FL.install`:
  - map `GD.REALM_HUMAN_CULTURE['POL-134']` to `CUL-82`, not the Known World fallback;
  - make the ruler and royal house giants;
  - set `GD.REALM_FAITH` for `POL-134` and `POL-152` so `realm.faith` is filled.
- **Size S · Impact 3.**

### B5. Unheld land holds millions of people
- **Seen.** 270 provinces have the owner `unclaimed` (`W/e3.json` unownedByReg). Over 30 years only 4 of them are taken (`snap-a.json`).
  - **R-00, the Rim Wastes:** 51 provinces with 3.0 M people. 99's README calls the high waste "unheld mountains with almost no people".
  - **M-05, the Hill Country:** 15 unheld provinces with 1.6 M. The lore gives that land to the Cloud Ridges, Moi and the Elephant Lords.
  - **F-01, the Elder Grass:** 14 provinces with 848,000, in the orc clans' heartland.
  - **D-05, the Deep Forest:** 31 provinces with 1.43 M. The lore's stateless Deep Forest holds about 180,000.
- **Why it matters.** Millions of people outside any realm pay no tax, raise no levy and make no history. Holes in the realm wash read as unfinished map.
- **Fix.** In `99-far-lands` `gen/prov.mjs`, scale the two wastes and the lore's stateless lands (`stateless_lands`, UNC-26 to 37) down to the lore's people. In `realms.mjs`'s quota pass, hand M-05 and F-01 to their lore holders.
- **Size M · Impact 3.**

### B6. War names repeat, and plural realms take singular verbs
- **Seen.**
  - **Repeated names in seed 32's first year alone:** three wars named "The Long War", two named "The Red War".
  - **Over seed 4242's 30 years:** "The Salt War" three times, "The Grey War" three times, "The Red War" twice.
  - **Plural realms with singular verbs** in history and news: "Frost Riders wins", "The Ouro Hunters is no more", "Ridges wins", "Sand Clans wins; Sabra pays tribute".
- **Why it matters.** The chronicle and the History list become unreadable lists of the same three names. A continent of 153 realms needs more names than the Known World's 35.
- **Fix.** In the war-naming code (the release's war namer, reachable from `68-casus-belli` or `57-world-chronicle`):
  - never reuse a live or recorded name: add the place ("the Salt War of the Ogo Grass") or an ordinal ("the Second Salt War");
  - draw far wars' names from their land's own words (990's culture words).
  - For the verbs, mark plural realm short names (Riders, Clans, Hunters, Ridges, Houses) and pick the verb by that.
- **Size S · Impact 3.**

### B7. Generated place names stutter, and cluster on one root per realm
- **Seen.**
  - **Doubled syllables:** Moinwinwan, Thinlinwan, Kethpopora, Ravpoali, Kethpomand.
  - **Clusters on one root:**
    - the Northern Scatter has Paaluan, Paaluok, Paaluing, Paaluao, Lakar, Lakarok, Lakaran, Lakaring, Lakaray, Taloao, Taloan and Taloray (`W/03-gm-isles-z3.png`);
    - the Fog Coast has Inulan, Inu-lan, Inunuk, Tuktuk, Tukatuk and Tuknatuk.
  - **Collisions in the Twin Rivers delta at zoom 3:** Ventseou, Paiven, Paizoushai and Venshaipu run into each other, and "Tsaidou" is written twice (`W/03-gm-venshai-z3.png`).
- **Why it matters.** Places a player cannot tell apart cannot be remembered, and a war that "takes Inulan and Inu-lan" reads as a bug.
- **Fix.** In `99-far-lands` `gen/places.mjs`:
  - reject an xyxy repeated syllable;
  - let no root of a list stand in more than three provinces of one realm;
  - require an edit distance of 3 or more from every neighbour's name.
  - In 62-inked-map, drop a town name that would overlap another at the same zoom, as the atlas already does.
- **Size M · Impact 3.**

### B8. The full map's legend ignores the view, and neighbours share one colour
- **Seen.**
  - **The legend never changes.** It lists the same 40 realms at every zoom and place (`W/03-gm-longgrass-z8.png`). Varenna and Zanara are listed while the view shows the Long Grass, and the Khaganate, a great power, is never listed.
  - **Neighbours look alike.** At zoom 1 over the Twin Rivers, Hesh, Velden, Hrodul and Hauden are four adjacent pinks (`W/03-gm-venshai-z1.png`). The Northern Scatter's islands are one pale green whoever holds them (`W/03-gm-isles-z3.png`).
- **Why it matters.** On a continent of 153 realms the realm wash is the main way to read who holds what. When neighbours share a colour, conquest is invisible.
- **Fix.**
  - Build the legend from the realms whose land is in the view (the `UI.greatMapModal` legend).
  - Give far realms a colour that differs from every neighbour's by a minimum hue distance: a greedy colouring over the realm adjacency graph in `99-far-lands` `FL.install`, where `UI.realmHex` is copied into `LORE.realms`.
- **Size S to M · Impact 3.**

### B9. The 1105 far wars reach a western player on the first day
- **Seen.** An Aldmark player's news on 1 January 1105 holds "In the far lands: The Busimo–Nkara War...", and the same for Vahra–Kethra and Taulen–Black Lamp (`snap-a.json`, news). Everything else from the east arrives months late as "Word from the east (of 1107)", which is 09-scale's own rule and works.
- **Fix.** In `991-far-war` `c-life.core.js` (line 191, `A.news(...)`): issue the lines after the player's home is set, so that `09-scale`'s `W.farOf` delays them, or send them through `A.WORLD1`'s queue directly.
- **Size S · Impact 2.**

---

## Improvements

### I1. The Silk Road is not a road: caravans jump the continent in a month
- **Seen.** `W/e3.json`: 12,000 caravans over 6 years, seed 777.
  - **Caravans jump the continent.**
    - `45-economy`'s `E.caravans` sends goods from any market to any other at peace, in one month, priced by the distance between capitals.
    - 608 of 5,000 sampled caravans travel more than 5,000 km, and 1% more than 10,000 km.
    - 2,700 run between the Known World and the Far Lands: Emberdeep's dwarves send tin to Dvaarnath's temple, Aldmark sends furs to Ruvela in the Deep Southland, Omboa sends timber to Sabra.
  - **Silk does not move west.** Only 307 of the 12,000 carry silk.
    - In Ozand, the Silk Road's broker republic, silk goes from 386 to 954 (×2.5), and in the Khaganate from 406 to 751.
    - In Taulen, where silk is made, it stays at 182 to 189.
    - Ivory rises ×4 almost everywhere: Aldmark 287 → 1,184.
  - **The goods are the Known World's only.** The far lands' own goods (tea, porcelain, paper, jade, rice, lacquer, cowries) are not in the goods table.
- **Lore.** Goods take 22 to 26 months from Venshai to Kraoth and change hands 3 to 5 times; silver flows east because it buys a third more there.
- **Why it matters.** The Silk Road is the spine of the lore and the single best reason for a western player to care about the east. Today it is a dotted line on the map that nothing walks.
- **Fix.** In `45-economy`, on the Great Continent:
  - **Shorter roads.** Cap a caravan's road at about 2,500 km, or 99's `REACH`.
  - **Relays.** Let long trade go as a relay along the lore's routes (`A.FAR.D.routes`): each hop takes a month and the broker realm's cut (Ozand, the Nine Wells, Tordzan).
  - **New goods.** Add tea, porcelain, jade and paper to the goods table, made in their lands and dearest in the west.
  - **Silver east.** Make silver a carried good.
- **Size L · Impact 4.**

### I2. The lore's ten conflicts are wars on day one or nothing at all
- **Seen.** Besides B1 and B2, over 30 and 20 years:
  - **The Strait.** Kemodari never moves on the Strait. Suraeng and Kemodari keep 19 and 17 provinces in both soaks.
  - **The Sunrise election.** It is not an event: Menaro is unchanged.
  - **The khagan's death.** It splits nothing (B1).
  - **Spring on the Sau.** It does come, but only as one of many coalition wars (seed 4242, 1131: Hesh takes 11 from Taulen).
  - The rest show up as 991's three 1105 wars, or not at all.
- **Why it matters.** These are the stories the primer, the realm bibles and 993's events promise. The world should keep those promises on a schedule the player can see coming.
- **Fix.** In `991-far-war`, give each conflict a dated or conditional trigger with a news line and an event for those it touches:
  - Kemodari's attack on the Strait in 1106, with Bonevari ships and Tirangga bought;
  - the Spear-Marshal's election in 1106;
  - Tegur's death opening the Felt Council's succession and Jagdet's claim;
  - Hesh crossing the Sau when Taulen is at war elsewhere.
- **Size M · Impact 4.**

### I3. Far treasuries balloon, and Taulen's "failing money" is the richest purse on Ardan
- **Seen.**
  - **Seed 4242:** Taulen goes from 2.8 M suns to 48 M in 25 years.
  - **Seed 99:** Taulen reaches 49 M in 20 years while its army falls to 52k, and Vahra goes from 1.6 M to 52 M.
  - **The Known World:** treasuries grow about ×10 too (Aldmark 455k → 4.5 M). The eastern empires grow ×17 to ×30.
- **Lore.** Taulen's notes pass at 60 in 100, the army eats two thirds of the revenue, and the Chancellery borrows against next year's silk.
- **Fix.** In `56-realm-inside` (treasury), on far ledger states: army upkeep at the lore's share, half-note inflation as a yearly loss, and a debt that the Delta guilds call. Spending on armies when rich would also stop the 52k army on a 49 M purse.
- **Size M · Impact 3.**

### I4. Far life still speaks the Known World's institutions in places
- **Seen.**
  - **Khaganate (`W/h-log-1400.txt`):**
    - a herder of the Left Wing works as "Foreman of the harvest. You learn how a manor really works";
    - he rises "in laborer... and the guild's eye";
    - he enlists as a scout in "the Second Khassen Foot".
  - **Taulen (`W/05-tab-realm.png`):** council seats are "Chancellor, Marshal, Treasurer, Spymaster or Chaplain". The lore has the Chancellery and the Censorate, and no chaplains.
  - **Coin:** every far purse is counted in suns (`W/01-life-taulen.png`). The lore gives the string, the ledger-weight, the saddle bar and the ozani.
  - **What already works:** the far customs (the White Month, the count of tens, the horse-name), beast sightings (the Grey Ten), "Word in Khaganate" news and the realm primer.
- **Fix.**
  - **Coin name.** A coin name per realm from the lore's money table, shown wherever coin is written. Keep suns as the hidden unit, with a "(≈ N suns)" tooltip.
  - **Council seats.** 990's powers table already names the factions. Add council seat names per template.
  - **Division names.** In `991-far-war`, name garrison divisions of horse templates "Hundred" or "Thousand", never "Foot".
  - **Job and promotion lines.** Choose them by the realm's template (herding camp, not manor).
- **Size M · Impact 3.**

### I5. Word from the east is late but never wrong
- **Seen.** 217 "Word from the east" lines in 30 years from Aldmark (`snap-a.json`). The delay works: 40 km a day, capped at 240 days. But every line is exact:
  - the full province list ("takes Ngav, Tukatuk, Nivkh, Tuktuk, Inulan...");
  - the cause of death ("a wound gone bad");
  - the ruler's temper ("Jade King Vijdar Marastvi is cruel and impetuous").
  - The lore's rule for writers: anything the west hears is a year old, has passed a broker, and is wrong in some way that matters. 26-belief-truth's rumours touch only battle numbers.
  - The 240-day cap also makes Venshai's news reach the Middle Sea in 8 months, where the lore says 2 to 3 years.
- **Fix.** In `09-scale` (`W.deliver`), for lines from beyond 5,000 km:
  - raise the cap to 2 years;
  - compress a province list to "lands in the north";
  - one time in three, change one detail (cause, winner, name), seeded from the text's hash;
  - queue a correction through 26's `S.rumors`.
- **Size S to M · Impact 3.**

---

## What holds up (no action)

- The seam between the Known World and the Far Lands is invisible at every zoom. Coasts and realms run straight across (`W/03-gm-seam-z1.png`, `W/03-gm-seam-z0.45.png`).
- Lands, seas, regions, ranges, rivers and routes are named in their zoom bands. Routes are dotted, the Grand Canal is labelled, and the Silt Gulf is drawn where the lore puts it (`W/03-gm-venshai-z3.png`).
- No far name appears in the Known World (0 of 630 western people have a far culture), and no province name is duplicated in the world.
- Far realms die rarely and plausibly: 3 of 118 in 30 years (the Black Lamp, Marast, the Ouro Hunters).
- The Black Lamp's fall is B2. Marast to Navesht and Ouro to Ivorune follow the lore's rivalries.
- A far life meets its land's customs, faith days and beasts within its first year (`W/h-log-1400.txt`).

## Top 10

1. **B1** Lore rulers have the wrong sex and age; the khagan's last winter never comes (S, 5).
2. **B2** First-year avalanche: 6 to 10 far wars won and lost inside 1105; the Black Lamp and Kethra gone at once (M, 5).
3. **B3** Twin Rivers wars move 15 to 22 provinces a peace; Hesh halves, Ngoru and Seuvan grow ×6 to ×7 (M, 4).
4. **I1** Caravans jump 5,000 to 10,000 km in a month; silk does not move west; no tea, jade or porcelain (L, 4).
5. **I2** The lore's conflicts (the Strait, the election, the khagan's death) never trigger (M, 4).
6. **B4** Fjorund is Northfolk with English names; Fjorund and Hadun have no faith (S, 3).
7. **B5** 270 unheld provinces hold millions (the Rim Wastes 3.0 M, the Hill Country 1.6 M) (M, 3).
8. **B7** Place names stutter and cluster (Moinwinwan; Paaluan, Paaluok, Paaluing); labels collide in the delta (M, 3).
9. **B8** The full map's legend ignores the view; neighbouring far realms share one pink (S to M, 3).
10. **B6 and I5** Repeated war names and singular verbs; far news late but never wrong (S, 3).
