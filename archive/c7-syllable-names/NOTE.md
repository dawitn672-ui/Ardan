# The v2 engine's syllable namer

`names.js` is `src/world/engine/names.js` as it stood before C7 (D-058): four hard-coded cultures (`aldic`, `solenne`,
`khuul`, `orcish`) that built a given name, a house name or a place from two small syllable lists. The nobility
engine named fiefs from it by race, so a Qadiri realm held an English-sounding fief and the dwarf and elf realms had
French and Mongol-sounding ones (CRITIQUE N3); with thirty names per sex a town came to hold four "Wynn of Kingsmere" (N4).

Replaced by the data-driven namer in `src/world/engine/names.js` (data in `data/names.json`, built from
`docs/research/c7-name-data.json`). Last commit that had it: the one before `c7-names` branched from `v2-integration`
(`b87c908`).
