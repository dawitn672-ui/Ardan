# Name data for Ardan (c7)

*Stamped 2026-11-12 06:28 ET · expanded for C7/D11 (owner: lists too small to name whole kingdoms), not wired into the game · supersedes the 2026-11-12 05:59 ET draft*

Data file: `docs/research/c7-names.json`. One entry per release culture (CUL-01 to CUL-24), each with 200+ male
names, 200+ female names, 300+ surnames or bynames, 60+ place names, a `patterns` block and an `uniqueFullNames`
estimate (all above 100,000). Nothing is wired in yet.

Owner rule 8 and 9 (Nov 12): names modelled on real cultures, humans mainly white/European, diverse where it makes
sense, and kept basic, common and easy to read.

## Counts per culture (expanded 2026-11-12 06:28 ET)

| Id | Flavour | Male | Female | Surnames/bynames | Places | uniqueFullNames |
| --- | --- | --- | --- | --- | --- | --- |
| CUL-01 | French/Italian-like (Latin heirs of an old empire) | 227 | 223 | 420 | 138 | 26,484,300 |
| CUL-02 | English/German/Norse-like (northern farmers and knights) | 320 | 313 | 420 | 139 | 37,827,447 |
| CUL-03 | Turkic/Mongol-like steppe riders | 219 | 214 | 407 | 65 | 412,216 |
| CUL-04 | Arabic/Moorish-like (coastal gardens and ports) | 222 | 221 | 327 | 63 | 7,211,597 |
| CUL-05 | Bedouin Arabic-like desert nomads | 267 | 221 | 365 | 68 | 9,326,656 |
| CUL-06 | Egyptian/Coptic-like river farmers | 281 | 238 | 340 | 63 | 7,233,822 |
| CUL-07 | Persian/Levantine/Greek-like merchant and diver cities | 235 | 237 | 345 | 126 | 471,056 |
| CUL-08 | East/West African-like savanna farmers and gold traders (Swahili/Yoruba/Akan simple) | 229 | 245 | 374 | 67 | 364,032 |
| CUL-09 | Southern African-like (Zulu/Xhosa simple) highland cattle-keepers | 297 | 273 | 347 | 63 | 458,850 |
| CUL-10 | South Indian/Malabar-like spice coast | 262 | 258 | 316 | 61 | 378,560 |
| CUL-11 | Slavic/Baltic-like forest farmers and river traders | 285 | 267 | 328 | 62 | 52,026,552 |
| CUL-12 | Tibetan/Nepali-like highlanders (simple) | 245 | 208 | 325 | 68 | 327,972 |
| CUL-13 | Indian/Bengali-like (with Southeast Asian touches) monsoon rice farmers | 262 | 258 | 328 | 64 | 386,360 |
| CUL-14 | Polynesian/Malay-like island sailors and pearl divers | 245 | 225 | 358 | 72 | 356,260 |
| CUL-15 | Mixed Iberian/Greek/English sailors (pirates and smugglers, nickname-heavy) | 313 | 300 | 349 | 128 | 19,825,646 |
| CUL-16 | Nature-word names (simple, forest-hunter feel; invented, not tied to one real people) | 209 | 320 | 374 | 79 | 478,822 |
| CUL-17 | Andean/Quechua-like (simple) highland hill tribes | 320 | 320 | 315 | 68 | 501,760 |
| CUL-18 | Mixed English/Welsh/Flemish/Frisian-like borderers (frontier settlers and outlaws) | 320 | 320 | 420 | 132 | 878,080 |
| CUL-19 | Soft Tolkien-style woodland elves (simple, short, lyrical) | 250 | 239 | 331 | 76 | 350,918 |
| CUL-20 | Greek/Celtic-sea-like seafaring elves (simple, flowing) | 250 | 239 | 300 | 77 | 336,248 |
| CUL-21 | Norse/Germanic-like dwarves (short, sturdy, craft-based) | 226 | 218 | 331 | 69 | 6,238,200 |
| CUL-22 | Gruff short Mongol/Turkic-tinged orc clan names (simple, harsh) | 230 | 215 | 314 | 68 | 297,260 |
| CUL-23 | Harsh eastern-steppe orc names (a little more Mongol/Korean-sounding than the Horde) | 230 | 215 | 314 | 63 | 292,810 |
| CUL-24 | Norse-saga-like giants (simple, big, Viking-era) | 274 | 220 | 364 | 127 | 12,604,410 |

Totals: 6218 male, 6007 female, 8412 surnames, 2006 places. No duplicates inside a list; ASCII only.

## Pattern rules

- Each culture has `patterns.forms` (templates with tokens `<given> <surname> <father> <mother> <place> <trade> <epithet>`;
  `formFemale` where the female form differs, e.g. "daughter of", "bint", "-sdottir", "-ovna"), plus `patterns.bynames`
  (`trades`, `epithets`) and a one-line `rule`. Each form carries a worked example of each sex.
- `uniqueFullNames` is the sum over forms and both sexes of the product of the pool sizes each form uses (given by sex,
  father = male list, mother = female list). It is a count of distinct strings per form, not a claim that all are
  equally likely; pick the form by weight (plain `<given> <surname>` most often, byname forms for the poor, the
  settled or the travelling, father forms for formal or legal use).
- English-like: `<given> <surname>`, `<given> son of <father>`, `<given> of <place>`, `<given> the <trade>`, `<given> the <epithet>`.
  Norse and giant: `<given> <father>son` / `-sdottir`. Arabic: `ibn`/`bint <father>`, `al-<trade|epithet|place>`, `Banu <tribe>`.
  Slavic: `<father>ovich` / `-ovna`. Turkic: `<father>oglu`. Welsh: `ap <father>`. Orcs: `Clan <name>`.
- Sharing: same-flavour cultures draw on shared pools (a kingdom shares names with its neighbours) but each leads with
  its own core (first entries of each list are the core). The Leaf People's nature words are common to both sexes, so
  its male and female lists may share a word. Orc names, elven names and dwarf craft names are invented in a simple
  consistent sound (Horde: hard endings -k -g -sh; Tusk: -gu -gra -ma), the rest are real-flavoured.
- Surnames of cultures without inherited surnames are bynames in English gloss ("the Weaver", "of the Ford", "Leopard Clan"),
  as in the earlier draft; local forms (al-, ibn, Banu, de, di, von, -ov, -oglu, -zadeh) are kept where the flavour has them.

## What exists today

24 release cultures; `names.js` has four syllable sets (`aldic`, `solenne`, `khuul`, `orcish`) that ignore CUL ids and give glued, exotic-sounding names.

## Culture to flavour

| Id | Culture (race) | Real-world flavour |
| --- | --- | --- |
| CUL-01 | Solenfolk (human) | French / Italian |
| CUL-02 | Northfolk (human) | English / German / Norse |
| CUL-11 | Eastfolk (human) | Slavic |
| CUL-18 | Marchfolk (human) | English / Welsh / Flemish, nickname-heavy |
| CUL-15 | Corsairs (human) | Iberian / Greek / English sailor names |
| CUL-03 | Wind Riders (human) | Turkic / Mongol |
| CUL-04 | Qadiri (human) | Arabic / Moorish |
| CUL-05 | Sandfolk (human) | Bedouin Arabic |
| CUL-06 | Tamari (human) | Egyptian |
| CUL-07 | Sabrans (human) | Persian / Levantine / Greek |
| CUL-08 | Zanari (human) | East and West African |
| CUL-09 | Abari (human) | Southern African |
| CUL-10 | Keshi (human) | South Indian coast |
| CUL-13 | Ranpuri (human) | Bengali / Indian plains |
| CUL-12 | Skyfolk (human) | Tibetan / Nepali |
| CUL-14 | Amberfolk (human) | Polynesian / Malay |
| CUL-17 | Cloudfolk (human) | Andean (Quechua) |
| CUL-16 | Leaf People (human) | Plain nature words (Oak, Fern, Wren) |
| CUL-19 | Sylvari (elf) | Soft, short, lyrical (Elara, Rowan) |
| CUL-20 | Grovers of the Coast (elf) | Same softness with sea touches (Maren, Finn) |
| CUL-21 | Holdfolk (dwarf) | Norse / Germanic, craft bynames (Thorin, Ironbeard) |
| CUL-22 | Horde clans (orc) | Short harsh names (Gor, Grak) |
| CUL-23 | Tusk clans (orc) | Same family, slightly different endings (-gu, -gra) |
| CUL-24 | Hall-giants (giant) | Saga-era Norse (Ragnar, Brynhild) |

## Where diversity is used, and why

- **European core.** Five of the 24 human cultures (01, 02, 11, 18, plus the European share of 15) are English,
  French, Italian, German, Norse, Slavic or Iberian. They cover the realms where most play happens (the Sunlands,
  northern plains, the east), so a typical life reads as mostly European.
- **Diverse only where the realm calls for it.** The steppe (03), desert (04, 05), river valley (06), gulf (07),
  savanna and highveld (08, 09), spice coast (10, 13), Roof (12), isles (14, 17) already sit in the south, east and
  far places of the world. Their names follow their real-world analogue, kept short and common: Ali, Leila, Kofi,
  Priya, Tenzin, Kai.
- **Borderlands and trade cities.** The Marchfolk, Corsairs and Sabrans are mixed by design, so they borrow from
  several pools and lean on bynames (Tinker, Tarbeard, the Weigher).
- **Non-humans** get their own invented but simple sounds. Elves are soft, dwarves Norse-hard, orcs and giants short
  and blunt. The two orc cultures differ in sound so a Horde name and a Tusk name are not confused.
- Surnames are mostly occupations, features or places (Miller, of the Ford, the Weigher). 

## How this feeds names.js later

1. Replace the `CULTURES` table in `src/world/engine/names.js` with data loaded from `data/names.json` (a copy of
   this file placed under `data/`, put on the page as `A.DATA.names` before feature code).
2. `given(culture, sex)` picks from `male` or `female` with the seeded `rng.pick`, never `Math.random`.
3. `house(culture)` picks from `surnames` (or builds a full name from `patterns.forms`); `place(culture)` from `places`. Surnames that begin with "of the", "the",
   "al-" or "ibn" are bynames and should skip any "House of" wrapper.
4. Map the four old keys (`aldic`, `solenne`, `khuul`, `orcish`) to CUL-02, CUL-01, CUL-03 and CUL-22 so old saves and
   tests still work; unknown ids fall back to CUL-02.
5. Update the names tests in `tests/v2/`; test that each culture has all four lists and that a seed repeats.
6. Keep the old syllable generator in `archive/` with a note, per the "never throw work away" rule.
