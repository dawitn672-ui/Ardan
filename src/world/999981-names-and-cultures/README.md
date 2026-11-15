# 999981-names-and-cultures: one common English language, many cultures (C7, D-058)

**Aspect:** the owner's rule 11 / D-013: most realms speak one English, so most names are plain English names; each realm
has a flavour of its own; only a few far or non-human peoples sound different. **Kind:** system, one core file, a test,
data in `data/names.json`. Design: `docs/design/names-and-cultures.md`.

| Piece | Where |
| --- | --- |
| The pools (the common pool of 1,979 male, 1,841 female and 4,083 family names, 1,275 places; nine pools of the far and non-human peoples; each culture's pool and accent; a lean for the realms that share a pool) | `data/names.json`, built by `tools/c7/build-names-data.mjs` from `docs/research/c7-name-data.json` |
| The namer (pure: a culture sees a hashed subset of the common pool, a realm a smaller one, a lean and an accent come first) | `src/world/engine/names.js`, in the v2 bundle as `A.V2.names`; unit tests `tests/v2/names.test.js` |
| `A.NAMES` (this folder) | `given`, `house`, `place`, `kinNames`, `sees`, `originOf`, `settle`, `renameState` |
| The release asks it first | `A.givenName(cult, sex, { realm, parents, avoid })`, `A.cultHouse(cult, realm)` in `src/core/release/core/03-engine-base.js` |

## What it does

- **Names.** A given name or a house name is drawn from the culture's pool: a hashed 60% of the common pool for a culture, 80% of
  that for a realm, with a lean (12 plain names a realm reaches for: Aldmark English, Northreach Norse, Greyhaven German, Ashmere
  Welsh, Brannoch Scots, Solenne French, Varenna Italian, Lucerna, Morhaven Spanish, Ostra Dutch, Tessaria Greek) tried 28 times in
  100 and the culture's accent 12 in 100. Steppe, desert, south, elf, dwarf, orc and giant realms draw from their own pools. No
  given name is in two peoples' pools, and a name keeps one sex.
- **Origin** (`A.NAMES.originOf(race, province)`): a person made for a province (the parish's people, N1) is of its realm, or in a
  border province comes from the neighbour across it (22 to 38 in 100, each province its own share), in a port or market town
  inland from a trade partner (17 to 33). The person keeps `org`, the realm of origin, which names them and gives them its
  customs. The census (`nmCensus`) draws every province's people 1,000 times.
- **No twins** (`A.NAMES.settle`, every month and once when a game begins): among the living of a town no full name twice;
  among brothers, sisters and first cousins no given name twice (the dead of the tree count). The later person is renamed (a
  patronymic follows), unless they are the player, a figure or a house member of the lore, or a ruler or heir. A child is also
  named avoiding its kin (`parents`).
- **Fiefs.** `A.V2N.v2culture` gives the nobility engine the realm's own culture; a viscounty, barony or lordship takes its
  place name from that people's `places`, its holder's given name from the same pool, and never an empty name.
- **Realm names** are in the source (the hack that rewrote them as the page drew is retired, `archive/c7-realm-renaming-hack/`).
  Saves from before: the eight realms are renamed by id on load (`A.NAMES.renameState`); the people and the prose a life has kept
  stay as they were.

## Measured by

| Test | What it checks |
| --- | --- |
| `nmOldNames` | the page's scripts, the lore, every event and a new game hold none of the old names |
| `nmRealms` | the eight names; four of them fit their governments |
| `nmCensus` | 35 realms: ports and market towns draw 15 to 35% from trade partners, border provinces 20 to 40% from the neighbour |
| `nmTwins` | 12 worlds × 30 years (`--lives=12`): no full name shared in a town, no given name among siblings and first cousins |
| `nmFiefs` | 1,620 fiefs: named from their people's places, holders from their people's names, none empty |
| `nmDeterministic` | the same seed names the same world |
| `nmOldSaves` | an older save's realm names change by id; people and a renamed realm are left alone |
