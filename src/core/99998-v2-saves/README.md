# 99998-v2-saves: the v2 state in the versioned save

**Aspect:** `docs/V2_SPEC.md` integration step 9, "Saves" · **Kind:** system, 1 core file, no patches, no events, a test fixture.

The release's save is `SAVES` (IndexedDB `SAVES.DB`, gzipped, a header with `fmt`, `ver`, length and fingerprint),
`A.packState` / `A.unpackState` (houses stored as a diff against the lore), `SAVES.clean` on load, and `A.migrate`
(the release's chain, up to `A.SAVE_VER` 13). This feature makes the v2 state a versioned part of it.

## What changed (`saves.core.js`)

- **`A.SAVE_VER` 13 → 14.** A state of version 13 or older is pre-v2 (the release, cycle 2, or a v2 build from before
  this step, whose lanes made their fields lazily). After the release's `A.migrate` chain, `A.deserialize` runs
  `A.V2SAVE.upgrade` once, in this order:
  1. **map**: no `S.v2map` and the release's 306 provinces → `A.V2MAP.onProv(S)` (99991): the generated continent from `S.seed`.
  2. **body**: the player without `p.v2` → `A.V2S.migrate(pc)` (99993): genes from the seed, conditioning read from the old stats by percentile, so checks read the same.
  3. **faith**: a player who is not of the faith by v2's rule but lived devout (piety ≥ 50) keeps it (`flags.v2_faith`); anyone else's piety becomes pull on the first month (99993's own rule).
  4. **family**: no `flags.v2_family` → `A.V2F.extendFamily(pc)` (99994): grandparents, uncles and aunts, cousins. House laws are derived, never stored.
  5. **court**: no `S.court` → `A.V2N.build()` (99995).
  6. **diplomacy**: `S.v2dip` with empty factor maps and each living realm's ruler known since long ago (`[ruler, -99]`, as 99996's tick would write).
  7. **war**: `S.v2w = { rum: [], heard: [] }` (99997).
  8. **time**: `S.v2t` (99992).
  9. **names** (added by 99999-v2-names when it is built): the eight renamed realms take their new names, and the
     life's log, news, waiting event and titles read them. It also runs after every load, since a v2 save made before
     the names holds the old ones.
  Each step only fills what is missing, so a v2 state upgraded again is unchanged. The lanes draw from v2's seeded
  generators or inside `A.V2F.sandbox`; the game's stream is put back after the upgrade. The lanes' own lazy paths
  (the court on the first month, the body on the first sync) stay as a fallback for states made by code.
- **A migrated life starts a fresh journal.** Its journal replays a world the v2 build cannot make again (a `J.o`
  replay would start a new v2 game), so `A.journalResume` gets none after a migration.
- **`SAVES.FMT` 2 → 3: people stored without their defaults.** `A.packState` stores a person without the fields that
  hold the value most people hold (`A.V2SAVE.PDEF`: `null`, `[]`, `{}`, `piety: 30`, `happy: 60`, `gear` of fists…);
  their key order is kept as a shape shared by everyone with the same keys (19 shapes for ~1,200 people). `unpackState`
  puts them back exactly. An older build refuses a format-3 save by the release's "made by a newer version" path.
- **Refused:** a state whose `ver` (or header `meta.ver`) is newer ("the save was made by a newer version of the game",
  in `SAVES.decode` and in `A.migrate`, before the game in play is replaced), and a Great Continent save from cycle 2
  (`S.world.parts` beyond `ardan`: "it was made on the Great Continent, whose far lands this version of the game no
  longer has"). `UI.enterSaveSafe` shows it as "That save could not be opened: …".
- `A.V2SAVE.check()` lists broken v2 invariants (one continent, one holder per title, the body's caps, the stores, the version).

## Inventory: what v2 adds to the state

| Where | Field | Lane | Stored or derived |
| --- | --- | --- | --- |
| `S.v2map` | `{ seed, v }` | 99991 map | stored; the grid and the provinces' geometry are rebuilt from it (provinces keep `x y sx sy coast terr biome elev cells adj sea`) |
| `S.v2t` | `{ turn, last, quiet: { d, t } }` | 99992 time | stored; queue items carry `v2c` once shown |
| `p.v2` (player only) | `{ v, mig, g (genes, aptitude), c (conditioning), cb (ceiling boosts), bt (≤ 24 breakthroughs), mt (mind training), last, pull }` | 99993 stats | stored; an NPC's body is a pure view (`A.V2S.view`) |
| `p.flags.v2_faith`, `p.v2.pull`, `p.piety` | faith taken up; piety kept as pull | 99993 | stored |
| kin: people, `parents`, `children`, `rel` | grandparents, uncles, aunts, cousins; `p.flags.v2_family` | 99994 family | stored (they are people) |
| house laws | `makeHouseLaw(seed, house)` | 99994 | derived, never stored |
| `h.headPid`, `p.noble { rung, realm, holding, court, fief, more, passed }` | titles: headships and lordships | 99994, 99995 | stored |
| `S.court` | `{ v, realms: { rid: { titles: [{ k, rank, parent, provinces, seat, pid, house, name, crown }], summary, year } }, met: { slot: pid } }` | 99995 nobility | stored; lower nobles derived until met |
| court houses | `FAM-C…` houses, `h.v2court`, `h.v2rung` | 99995 | stored (whole: not in the lore) |
| `S.v2dip` | `{ f: { 'A|B': { reason: [value, decay, year, words] } }, p, ruler: { rid: [ruler, since] }, h }` | 99996 diplomacy | stored; the game's reasons are read fresh |
| `S.v2w` | `{ rum, heard: [{ y, t }] }` | 99997 war | stored |
| `S.fights[pid].v2w`, queue `{ type: 'v2battle', b }`, `b.aar` | the battle you fought, its after-action report | 99997 | stored while it lasts |
| `pc.v2wN`, `pc.v2wTrials`, `pc.flags.v2w_trial_<order>` | battles played, trials tried, the 2-year retry memory | 99997 | stored |
| `pc.deeds` (`{ y, t }`) | a standard taken | 99997 | stored (release field) |
| elite orders | v2 worth on `GD.BN` | 99997 | derived (not state) |

`SAVES.clean` strips `<`, `>` (and `"` outside prose keys): no v2 string holds any of them (test `v2svRoundTrip` cleans
a v2 save and finds it unchanged, and finds no markup in any state string).

## Size (an 8-year life, seed 5, `v2svRoundTrip`)

| | raw | gzipped |
| --- | --- | --- |
| release packing (houses only) | 3,288 KB | 561 KB |
| v2 packing (people without defaults) | 2,735 KB (−17%) | 545 KB (−3%) |

The growth is people: the court and the family add about 1,000 people (1,236 after 8 years against the release's
~180), each a whole record. Their defaults were most of the raw size, but gzip already squeezed those. What could be
derived and is not (left for later, each would need its generator to be replayed exactly at load): the court's title
pyramid (`S.court.realms`, 69 KB raw, 11 KB gzipped, but its holders move), and the court lords' looks and words
(`app`, `desc`, `manner`, `wants`, made in the sandbox). The release's own long floats (`h.op`, `p.st`) would save
another 12% gzipped if rounded at the source.

## Measured by

| Test | What it checks |
| --- | --- |
| `v2svRoundTrip` | 8 years: the save comes back exactly (key order too), clean leaves it, no markup, every v2 store there, no migration on load, invariants hold, sizes |
| `v2svOldRelease` | the vendor release's save (3 years) loads, migrates once (all 8 steps), keeps the stream, invariants hold, the same twice, a second upgrade changes nothing, its own save exact, a fresh journal, 2 more years with no page error, invariants hold, no percentage on any tab |
| `v2svOldCycle2` | the same for a cycle-2 save (`cycle2-1106.ardan`: `origin/claude/dreamy-sagan-anwszt` at dd737d8, built with `tools/build.mjs --out`, a Known World life by code, seed 77, one year) |
| `v2svRefused` | a newer state, a newer format and a Great Continent save are refused with a sentence; the game in play is untouched |
