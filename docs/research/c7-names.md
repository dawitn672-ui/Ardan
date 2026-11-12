# Name data for Ardan (c7)

Data file: `docs/research/c7-names.json`. One entry per release culture (CUL-01 to CUL-24), each with about 38 male
names, 38 female names, 40 surnames or bynames and 20 place names. Nothing is wired in yet.

Owner rule 8 and 9 (Nov 12): names modelled on real cultures, humans mainly white/European, diverse where it makes
sense, and kept basic, common and easy to read.

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
3. `house(culture)` picks from `surnames`; `place(culture)` from `places`. Surnames that begin with "of the", "the",
   "al-" or "ibn" are bynames and should skip any "House of" wrapper.
4. Map the four old keys (`aldic`, `solenne`, `khuul`, `orcish`) to CUL-02, CUL-01, CUL-03 and CUL-22 so old saves and
   tests still work; unknown ids fall back to CUL-02.
5. Update the names tests in `tests/v2/`; test that each culture has all four lists and that a seed repeats.
6. Keep the old syllable generator in `archive/` with a note, per the "never throw work away" rule.
