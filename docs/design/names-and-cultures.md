# Names and cultures (C7)

The owner's sixth complaint, under rule 9 (basic, common names) and rule 11 / D-013 (one common English language, many
cultures). CRITIQUE §15 and rows N1 to N12, P6, part of M4. Decision: `docs/DECISIONS.md` D-058. Code:
`src/world/999981-names-and-cultures`, `src/world/engine/names.js`, `data/names.json`.

## Language is one, flavour is a weighting

| Layer | What it is | How big |
| --- | --- | --- |
| The common pool | plain English given names by sex, family names, places | 1,979 + 1,841 given, 4,083 family, 1,275 places |
| A culture's view | the names whose hash with the culture's id falls in the lowest 60% | about 1,180 + 1,120 given, 2,420 family, 765 places |
| A realm's view | of that, the names whose hash with the realm's id falls in the lowest 80% | about 930 + 930 given, 1,940 family |
| A lean | twelve plain names a realm reaches for (28 draws in 100) | 11 realms |
| An accent | twelve a culture reaches for (12 in 100) | 13 cultures |
| A people's own pool | steppe, desert, south, elf (two), dwarf, orc (two), giant | 300 to 400 given names a sex, 170 to 660 family |

The hash is FNV-1a of `name|id`, so the subsets are the same on every machine and need no stored list. No given name is in two
peoples' pools (CRITIQUE N11) and a name keeps one sex (N12): `tools/c7/build-names-data.mjs` removes a name from the later
pool. Two realms of one culture share three quarters of their given names, two cultures about 38 in 100.

## People from elsewhere (N1)

A person made for a province (the parish, a household's servants, a stranger on the road) is drawn with
`A.NAMES.originOf(race, province)`:

- a province across a border from another realm draws 22 to 38 in 100 of its people from the neighbour (each neighbour by the
  provinces it touches with), a port or market town inland 17 to 33 from the realm's trade partners (the realms its lore
  names among its imports and exports, its allies and its neighbours); both at once, 22 to 33. Each province has its own
  share, a hash of its id.
- the person keeps `org` (the realm they come from): their name is drawn from that realm's view and lean, and their culture is
  that realm's. A child takes its father's culture, so the mixture spreads by marriage.

## No twins (N4)

New people are named a moment before their surname is known and from fifteen places, so one monthly pass
(`A.NAMES.settle`) checks the people made since the last: the living of a town (the province they are placed in) have no
full name twice, and brothers, sisters and first cousins no given name twice. The later one is renamed from their own
view, avoiding the kin's names; the player, the lore's figures and house members and rulers and heirs are never renamed. A
child is already named avoiding its parents', siblings', grandparents', aunts' and uncles' and cousins' names, so the pass
rarely has work.

## Fiefs (N3)

The nobility engine took its culture from the realm's race (four syllable sets); it now takes the realm's culture id, and a
viscounty's place name comes from that people's list of places: no English fief in a Qadiri realm, no French syllables in an
elf one. A house of the lore that holds a slot and has no head yet gives the head the lore wrote (never an empty name).

## Realm names (N5, P6)

Of the eight realms renamed on Nov 5, four read like their governments: **Khanate of Ulun** (a khan over nine tribes),
**League of Brannoch** (no king), **Free Port of Corvasse** (a pirate haven), **Ughrak Clans**. Ambrel (a sultanate), Kesh, the
Sahrim Confederacy and the Horde of Gorath stay. The names are written into the lore and the source by
`tools/c7/rename-realms.mjs` (the hack's own rules, run once over every string); the hack, which replaced the setters of
`innerHTML`, `textContent` and `title` and ran twenty regular expressions over everything written, is in
`archive/c7-realm-renaming-hack/`.

## Not done here

The lore's authored people (the cast, the houses' members) keep their authored names; N6 (the noble ladder against the
lore's "no counts or dukes"), N7's Marchfolk, N9 (the scale of towns), N10 (a Chaplain of the Horde), the realm pairs that
share a word (-haven, -deep, -hold) and M4's climate bands stay with their own steps.
