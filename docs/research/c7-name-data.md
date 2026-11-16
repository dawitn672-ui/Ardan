# Name data for Ardan (c7)

*Stamped 2026-11-12 07:01 ET · reworked for owner rule 11 and DECISIONS D-013 (one common English language, many cultures), OWNER_ORDERS order 18 (many more names) · not wired into the game · supersedes the 2026-11-12 06:28 ET draft (24 separate real-world pools, about 12,200 given and 8,400 family names), which stays in git history*

Data file: `docs/research/c7-name-data.json`. Nothing is wired in yet.

## Why

- **Rule 11 / D-013 (2026-11-12 06:49 ET):** "the majority of countries should be able to speak the same English language, but their cultures could differ." Most realms therefore draw their names from one large pool of plain English-language names. Cultures differ in customs, dress, faith and ways, not in language. Only the non-human races and a few far human peoples sound different. This replaces the 24 separately flavoured pools (rule 8, superseded).
- **Order 18:** the pools must be large enough to name whole kingdoms, and noticeably larger again. The common pool is 1,979 male and 1,841 female given names and 4,083 family names, against about 200 to 320 given names per sex and 300 to 420 family names per culture before.
- **Rule 9:** names stay basic and easy to read. Given names are 3 to 9 letters, ASCII only.

## Structure of `c7-name-data.json`

| Key | What |
| --- | --- |
| `_stamp`, `_about` | Stamp (US East Coast time, `YYYY-MM-DD HH:MM ET`) and the rules in one paragraph |
| `uniqueFullNames` | Count of distinct full names per pool (see below) |
| `common` | The one big English-language pool: `male`, `female`, `family`, `places`, `trades`, `epithets`, `bynames`, `patterns` |
| `pools` | The separate pools, kept only for non-human races and three far human peoples: same fields as `common` (no `bynames`), plus `usedBy` (culture ids) |
| `cultures` | One entry per CUL-01 to CUL-24: `name`, `race`, `flavour`, `uses`, optional `accent`, `customs`, `uniqueFullNames` |

- `uses` is `"common"` or a key of `pools`.
- `accent` (only on cultures that use `common`) is `{ male, female, family }`, 12 names each. They are English-language names that give a realm a slight local colour (Louis and Giselle for the Solenfolk, Eriksson and Astrid for the Northfolk, Oak and Willow for the Leaf People). Mix a few in at the front of the common draw. Not every accent name is in the common lists, so they also widen the pool slightly.
- `customs` is a one-line note of flavour words for dress, faith and ways. It carries what the old per-culture name flavour used to.

## The common pool

| List | Count | What |
| --- | --- | --- |
| `male` | 1,979 | Common English and familiar European names as used in English (John, Thomas, Walter, Hugh), old English and Norse forms, medieval short forms (Wat, Hob, Perkin), a few Latin, French, Italian, Spanish, German, Dutch, Welsh, Scots, Irish and Slavic names that read plainly in English |
| `female` | 1,841 | Margaret, Eleanor, Matilda, Alice, Agnes and the same spread; kept disjoint from `male` (a unisex name sits in `male`) |
| `family` | 4,083 | Occupations (Miller, Fletcher), places (Ashford), colours, animals and features (Blackwood, Fox, Hill), patronymics (Johnson, Williams, Fitzwilliam) and real English, Scots and Irish surnames |
| `places` | 1,275 | Village and town names of the Ashford, Kingsbridge, Thornbury kind |
| `trades` | 349 | For "<given> the <trade>" |
| `epithets` | 308 | Adjectives for "<given> the <epithet>" (Bold, Lame, Grey) |
| `bynames` | 112 | Compound nicknames for "<given> <byname>" (Longshanks, Fairhair, Lackland) |

Places, trades, epithets and bynames together: 2,044 (the order asked for 600 or more).

Patterns (`common.patterns.forms`, with `weight`): `<given> <surname>` (50), `<given> son of <father>` / `daughter of` (12), `<given> of <place>` (10), `<given> the <trade>` (8), `<given> the <epithet>` (6), `<given> <byname>` (4), `<given> <surname> of <place>` (6), `<given> <surname> the <epithet>` (4). Each form carries a worked example of each sex.

## Separate pools

Only the non-human races and three far human peoples keep their own sound. Each has at least 300 given names per sex and 500 family names, kept simple.

| Pool | Used by | Male | Female | Family | Places |
| --- | --- | --- | --- | --- | --- |
| `steppe` | CUL-03 Wind Riders | 312 | 304 | 555 | 65 |
| `desert` | CUL-04 Qadiri, CUL-05 Sandfolk | 336 | 301 | 548 | 131 |
| `south` | CUL-10 Keshi, CUL-13 Ranpuri | 312 | 308 | 562 | 125 |
| `elf-wood` | CUL-19 Sylvari | 446 | 427 | 747 | 76 |
| `elf-sea` | CUL-20 Grovers of the Coast | 447 | 435 | 712 | 77 |
| `dwarf` | CUL-21 Holdfolk | 383 | 373 | 734 | 69 |
| `orc-horde` | CUL-22 Horde clans | 384 | 373 | 630 | 68 |
| `orc-tusk` | CUL-23 Tusk clans | 386 | 374 | 634 | 63 |
| `giant` | CUL-24 Hall-giants | 424 | 349 | 712 | 127 |

- Far human peoples (3): `steppe` (Turkic and Mongol-like riders), `desert` (Arabic and Moorish-like gardens, ports and nomads, two cultures share it), `south` (South Indian and Bengali-like coast and plains, two cultures share it).
- Non-human (6): `elf-wood` and `elf-sea` (soft, lyrical, the sea elves a little more flowing), `dwarf` (Norse-hard, craft names), `orc-horde` (hard endings -k -g -sh) and `orc-tusk` (open endings -gu -gra -ma, so a Horde name and a Tusk name are not confused), `giant` (saga-era Norse).
- Their lists are the earlier c7 names plus simple additions (hand-written for the human peoples; short syllable and word-compound sets for the invented races, such as Moon + whisper, Iron + beard, Skull + crusher). Patterns keep the forms of the earlier draft (ibn/bint, -oglu, -son/-sdottir, "child of", "Clan").

## Cultures to pool

| Id | Culture | Race | Uses | Accent | Customs |
| --- | --- | --- | --- | --- | --- |
| CUL-01 | Solenfolk | human | common | 36 names | dress: silk and brocade, tall hats; faith: the old imperial church, saints' days; ways: courtly manners, wine, law and letters |
| CUL-02 | Northfolk | human | common | 36 names | dress: wool, furs, cloaks pinned with brooches; faith: hearth rites mixed with the church; ways: farmers and knights, long feasts, oath-bound lords |
| CUL-03 | Wind Riders | human | steppe | - | dress: felt caps, leather coats, horsehair tassels; faith: sky and spirit worship, shamans; ways: horse herds, felt tents, raiding, guest-right |
| CUL-04 | Qadiri | human | desert | - | dress: flowing robes, turbans; faith: the one-god law, scholars of the mosque; ways: gardens, ports, poetry, bargaining |
| CUL-05 | Sandfolk | human | desert | - | dress: veils against sand; faith: desert law and tribal elders; ways: tent clans, camel caravans, feuds, guest-right at the well |
| CUL-06 | Tamari | human | common | 36 names | dress: linen and kohl; faith: old river gods beside the church; ways: flood-year farming, scribes, canals |
| CUL-07 | Sabrans | human | common | 36 names | dress: dyed cloth, jewelled sashes; faith: many faiths side by side; ways: merchant houses, pearl diving, counting-houses |
| CUL-08 | Zanari | human | common | 36 names | dress: bright cloth, gold beads; faith: ancestor spirits; ways: drum and dance, gold weighing, savanna farms |
| CUL-09 | Abari | human | common | 36 names | dress: hide cloaks, beadwork; faith: ancestor rites; ways: cattle count as wealth, highland herding, long walks |
| CUL-10 | Keshi | human | south | - | dress: light cotton, flowers; faith: many temple gods; ways: spice trade, coast festivals, rice and pepper |
| CUL-11 | Eastfolk | human | common | 36 names | dress: embroidered shirts, fur hats; faith: onion-domed church, icons; ways: forest farms, river barges, bread and salt for guests |
| CUL-12 | Skyfolk | human | common | 36 names | dress: wool robes, prayer flags; faith: mountain monasteries; ways: thin-air passes, yak herds, high pastures |
| CUL-13 | Ranpuri | human | south | - | dress: wrapped cloth and saris; faith: river-bathing rites; ways: monsoon rice, village councils, festivals |
| CUL-14 | Amberfolk | human | common | 36 names | dress: shell necklaces, bark cloth; faith: sea spirits; ways: outrigger sailing, pearl and amber trade |
| CUL-15 | Corsairs | human | common | 36 names | dress: bright sashes, earrings; faith: lucky charms and a saint of sailors; ways: raiding, smuggling, nicknames, shares in plunder |
| CUL-16 | Leaf People | human | common | 36 names | dress: green cloaks, leaf-stitched; faith: groves and old trees; ways: hunting, tracking, hidden camps |
| CUL-17 | Cloudfolk | human | common | 36 names | dress: wool ponchos and caps; faith: the peaks as gods; ways: terraced fields, llamas, stone paths, rope bridges |
| CUL-18 | Marchfolk | human | common | 36 names | dress: plain leather and wool, mail where needed; faith: wayside shrines; ways: border raids, frontier farms, feuds, oath-sworn outlaws |
| CUL-19 | Sylvari | elf | elf-wood | - | dress: long green and silver robes; faith: the old wood; ways: song, archery, slow patient craft |
| CUL-20 | Grovers of the Coast | elf | elf-sea | - | dress: blue-green cloaks, shell clasps; faith: tide and moon; ways: sailing, harbour groves |
| CUL-21 | Holdfolk | dwarf | dwarf | - | dress: leather aprons, braided beards; faith: the forge-fathers; ways: mines, craft guilds, grudges kept for generations |
| CUL-22 | Horde clans | orc | orc-horde | - | dress: hides, bone and iron; faith: war gods; ways: clan chiefs, strength decides rank, raiding |
| CUL-23 | Tusk clans | orc | orc-tusk | - | dress: painted tusks, hides; faith: ancestor bones; ways: steppe living, mounted raiding, clan oaths |
| CUL-24 | Hall-giants | giant | giant | - | dress: furs, huge cloaks; faith: storm and thunder gods; ways: great halls, boasts, sagas, feasts |

13 of the 24 cultures (all human) use `common`: CUL-01, 02, 06, 07, 08, 09, 11, 12, 14, 15, 16, 17, 18. So do all future cultures unless they are non-human or far.

## uniqueFullNames

`uniqueFullNames` is the sum over forms and both sexes of the product of the list sizes each form uses (given by sex, father = male list, mother = female list, place, trade, epithet, byname). It counts distinct strings per form and does not claim all are equally likely; pick the form by weight. A culture's number includes its accent names.

| Pool | uniqueFullNames |
| --- | --- |
| common | 24,721,110,900 |
| steppe | 792,176 |
| desert | 43,961,918 |
| south | 674,560 |
| elf-wood | 1,157,342 |
| elf-sea | 1,143,144 |
| dwarf | 18,047,988 |
| orc-horde | 861,466 |
| orc-tusk | 861,840 |
| giant | 30,543,549 |

## Totals

- Common: 1,979 male, 1,841 female, 4,083 family, 1,275 places, 349 trades, 308 epithets, 112 bynames.
- Separate pools (9): 3,430 male, 3,244 female, 5,834 family names.
- Names in the file as a whole: 20,411 given and family names. No duplicates inside a list (case-insensitive); ASCII only; no markup characters.
- Before this rework: 24 pools, 12,225 given names (6,218 male, 6,007 female), 8,412 family names. Most human realms now share the one common pool, and one language.

## How this feeds names.js later

1. Put a copy of the file under `data/names.json` (on the page as `A.DATA.names` before feature code) and replace the `CULTURES` table in `src/world/engine/names.js` with a lookup: culture id, then `cultures[id].uses`, then `common` or `pools[uses]`.
2. `given(culture, sex)` picks from `male` or `female` of the resolved pool with the seeded `rng.pick`, never `Math.random`; for a common-pool culture it first draws from `accent` with a small fixed chance, then from `common`.
3. `house(culture)` picks from `family` (or builds a full name from `patterns.forms` by weight); `place(culture)` from `places`. Surnames that begin with "al-" or "ibn" are bynames and skip any "House of" wrapper.
4. Map the four old keys (`aldic`, `solenne`, `khuul`, `orcish`) to CUL-02, CUL-01, CUL-03 and CUL-22 so old saves and tests still work; unknown ids fall back to `common`.
5. Update the names tests in `tests/v2/`: each culture resolves to a pool with all four lists, a seed repeats, and the common pool stays at or above 1,500 given names per sex and 4,000 family names.
6. Keep the old syllable generator in `archive/` with a note, per the "never throw work away" rule.
