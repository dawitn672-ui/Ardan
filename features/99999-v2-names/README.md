# 99999-v2-names: eight realms named like kingdoms

**Aspect:** the owner's request of Nov 5: every realm named like a real kingdom. **Kind:** system, one core file, one patch, no events.

| Id | Was (name / short) | Now (name / short) |
| --- | --- | --- |
| POL-32 | Sultanate of the Amber Isles / Amber Isles | Sultanate of Ambrel / Ambrel |
| POL-21 | League of the Spice Coast / Kesh | Kesh / Kesh |
| POL-33 | Brotherhood of Blackreef / Blackreef | Principality of Corvasse / Corvasse |
| POL-19 | Confederacy of the Sand Clans / Sand Clans | Sahrim Confederacy / Sahrim |
| POL-12 | Khanate of the Nine Winds / Nine Winds | Kingdom of Ulun / Ulun |
| POL-34 | League of the Tusk Clans / Tusk Clans | Ughrak Dominion / Ughrak |
| POL-13 | Highland League / Highland | Kingdom of Brannoch / Brannoch |
| POL-11 | Horde of Gorath / the Horde | Horde of Gorath / Gorath |

Ids, peoples, cultures, governments, rulers' titles (Khan, Speaker, War-Mother…) and histories stay. Only the names change.

## How (`names.core.js`)

1. **`A.V2NAMES.fix(text)`**: ordered rules keyed to how the release refers to these realms, not to bare words.
   - Full names go first.
   - Then the short names, said of the realm or its people. A plural old name takes a singular verb ("the Sand Clans are" becomes "Sahrim is"). "Among the Sand Clans" becomes "In Sahrim". A possessive becomes "Sahrim's". When a noun follows, the name is an adjective and keeps its article ("the Nine Winds envoy" becomes "the Ulun envoy").
   - Then the adjectives: Sand Clan, Tusk riders, Amber fleet/ships/captains…, Highland law/crossbows…, Highlanders.
   - Then "a" becomes "an" before Ulun, Ughrak and Ambrel.
   - "Gorath founded the Horde" reads "the Horde of Gorath", so it doesn't come out as "Gorath founded Gorath". Ulun's events' "the Khanate" reads "Ulun".
   - Markup is masked, so `data-*` values never change. Of a tag's attributes, only `title`, `aria-label`, `alt` and `placeholder` are fixed.
   - **What stays:** the Kingsmere Amber Guild, raw amber, the Amber Capes / Road / Row / King / Wyrms, Great Amber, the Highland March and Highland Spears (Ambrel), the Highland Javelins (Abara), the Highveld's "Highland farmers", every "Highlands" and lowercase "highland", the Old Horde, the Horde Wars, Horde clans and "Horde riders" (the name still holds Horde), the Tusk Hills / War / Great Ride, the Corsair Isles, Sandfolk.
2. **The lore:** every string in `LORE` is rewritten once at load. The lazy tables (cast, families, houseDeep, styles, academies) are rewritten on first read through their getters.
   - Strings that are place keys stay as data: a province's name, a seat, a capital such as "Blackreef". The game finds places by these names (habitats, seats, `S.prov.find(p => p.name === seat)`).
   - These keys are renamed wherever they are shown.
   - `LORE.realms[id].name/short` are set exactly, so a new game's `S.realms` has the new names.
3. **Text as it is made:** `A.T` covers every event title, text, choice and result. `A.log` and `A.news` run their text through `fix`, so the state a new life writes holds only the new names.
4. **Text as it is shown:** the `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `textContent`, `innerText` and `title` setters, `setAttribute` (title, aria-label, alt), and the canvas's `fillText`, `strokeText` and `measureText` (the map's labels). Script, style and textarea elements are skipped. This covers the literal names in code: the release's and features' UI strings, the 29-starts blurbs, the 47-realm-bible data.
5. **Saves:** step 9 `names` of 99998's `A.V2SAVE.upgrade` renames `S.realms` by id, then the prose a life keeps: log lines, news, an event waiting on screen, people's titles. The step also runs after every `A.deserialize`, because a v2 save made before this feature holds the old names. It changes nothing on a second run. `SAVE_VER` is not bumped.

Every layer is pure. Nothing draws from `A.rand`, and rendering writes nothing to `A.S`.

## Edits outside this folder

- `patches.mjs` **NAMES-ORC-SCHOOL**: `A.schoolOptions` tells the orc schools by `/Horde|Tusk/` on the school's realm name. It now also matches Ughrak.
- `99991-v2-map/a-world.core.js`: `VM.SEA_ID` puts Ambrel (on a peninsula), Kesh and Corvasse (on the coast) by id. Their new names no longer match `ISLE_RX` or `COAST_RX`, and the map comes out as before. The test `v2mapSeaRealms` reads `VM.SEA_ID` too.
- `99998-v2-saves`: the test counts `SV.STEPS` instead of a fixed 8, and the README lists step 9.
- `28-endings`: "In the Sahrim Confederacy" and "The Ughrak Dominion itself is gone" now get their article, as "the Kingdom of Ulun" already did.

## Measured by

| Test | What it checks |
| --- | --- |
| `nmRules` | 27 lines that must change read as written, 35 that must stay don't change, the lore keeps the ordinary words and the province key Blackreef, the eight lore realms carry their new names |
| `nmLives` | A 20-year life in each of the eight realms. No old name in any event (title, text, choices), log line, news line, realm or title, nor in a sweep at year 10 and year 20 of every tab, every Codex page, each realm view a tab opens for the eight, every title/aria-label, and every map label drawn. The same seed twice gives the same world. Against a build without this feature it fails at once (checked with `NM_ONLY=POL-19`). |
| `nmOldSaves` | A release save (Sand Clans, 1 year) migrates with the `names` step: renamed, every page and the stored prose clean. A v2 save holding the old names loads renamed. Its own save comes back exactly. |
| `nmPlaces` | Ambrel, Kesh and Corvasse keep their shore on two seeds. The Ughrak Dominion's school is still an orc school. |

`NM_ONLY=POL-xx` limits `nmLives` to one realm.
