# The contradiction hunt: a repeatable world diagnostic

How the order-97 audit (`/tmp/ardan/contradictions.md`, 40 items C-01..C-40, trunk `8494eef4`, 2026-11-26) was made,
as a recipe anyone can run again: before a wave, after a big data change, or when the owner asks for "a fresh world
diagnostic" (order 100, wave 5). It reads; it changes nothing. A full pass is a few hours of an agent's reading; the
scripted part takes a minute.

## Contents

1. Frame: what "contradiction" means here
2. The eleven cross-checks
3. Step by step, with commands
4. Writing the findings
5. After a fix: make it impossible to come back
6. Leads found on 2026-11-27 that the audit did not list

## 1. Frame

A contradiction is two statements the game holds that cannot both be true, or a statement that breaks the owner's
newest order. The owner's newest instruction wins (order 76), so the audit is ranked **by how recent the rule it breaks
is**, then by severity:

- **Breaks play**: wrong numbers in play, an exploit, a state that cannot be right (C-25: a level-60 Sand Dragon kill
  earned Wyrm-Slayer).
- **Misleads the player**: two screens, or a screen and the rule, disagree (C-20: two kings of Jotunhall in the codex).
- **Inconsistent data**: files or docs disagree with no screen effect yet (C-34: a legend dated before the realm's founding).

Sources of "the rule", newest first: `docs/OWNER_ORDERS.md` (the orders, numbered; the tail is newest) and the
unchanged prompts in `docs/prompts/`, then `docs/DECISIONS.md`, then `docs/MASTER_PROMPT.md` (may lag the orders: C-36),
then `docs/V2_SPEC.md`, feature READMEs and design notes.

## 2. The eleven cross-checks

Each is a pair of places that should agree. The audit's items fall into these; the script column says what is automated.

| # | Check | Typical pair | Audit examples | Automated |
| --- | --- | --- | --- | --- |
| 1 | **Identity**: one being, one name, sex, age, kind | `power.json` masters vs `figures/race-masters.json`; `legends.json` vs `figures/*.json` vs `titles/*.json` | C-20 (the Eldest Blade she / he, 400 / 900 years), C-01 | `world-xref.mjs --only=pronouns` (sex); ages by the snippet in §3.4 |
| 2 | **Place**: a home exists, is spelled one way, is where the map says, known or hidden alike | `home.place`/`home.name` vs `00-lore.json` provinces, realms, regions vs the map branch's gazetteer | C-17 (the Burnt Reach / Burnt Mile), C-34 (Skyhold's monastery 2,000 km away), C-18 (an Archdemon in two places) | `--only=places` (names the lore never mentions) |
| 3 | **Time**: dates in one calendar (AR, the Common Reckoning from 1 AR; the game starts 1105) | legend histories ("eighteen centuries ago", "sixty years ago") vs `rulerHistory`, `wars`, `chronicle`, founding years | C-34, C-33 (the Sword Saint absent from the chronicle) | snippet §3.4 |
| 4 | **Count**: how many exist | bestiary `world` and `families.*.cap` vs fixed figures vs prose ("nine elder dragons", "thirty-three") vs tests (`pwBands`) vs the order's number | C-03 (84 dragons, cap 100; order 97 says 300), C-08 | `--only=counts` |
| 5 | **Vocabulary**: one ladder of words | rarity in `skills/vocab.json`, `titles/vocab.json`, `classes.json`, item `quality`; skill kinds | C-04, C-27 | `--only=rarity` |
| 6 | **Scale**: a level matches its words | `power.json` band words vs bestiary levels; `level.json` anchors vs READMEs; lore sizes (kg, m) vs bestiary tier | C-32 (an imp in the common-folk band), C-24 (a 250 kg "grown dragon" at level 700), C-09 | `--only=bands`, `--only=creatures` |
| 7 | **Office**: one holder per post, in prose too | a master's title vs the realm's ruler in the lore | C-20 (the Skull-Khan of Urgol beside Vrag) | `--only=masters` |
| 8 | **Code vs data**: prose or rules written into code | `b-wilds.core.js` news lines, `a-registry.core.js` `known: true`, `a-titles.core.js` family lists | C-19, C-25, §6 below | `--only=code`, `find-copies.sh` |
| 9 | **Release copies**: the release's own tables agree | `GD.REALM_CULTURE`/`REALM_FAITH` vs `LORE.cultures`/`faiths`; ruler vs `rulerHistory` vs house `headName` | (clean today, two faith notes) | `--only=lore` |
| 10 | **Tests and lints vs the order**: a gate enforcing an old rule | `x3OneUnit` fails any "mile" (order 97 wants miles); `pwBands` holds 100 dragons | C-12, C-03 | read the tests `find-copies.sh` lists |
| 11 | **Docs vs data**: a README or design table behind the data | `9999975-level/README.md` anchors, `docs/design/powers.md` "no demon kingdom", MASTER_PROMPT register | C-31, C-36, C-39 | `find-copies.sh` on the number or phrase |

## 3. Step by step

### 3.1 The orders as checkable statements

```sh
grep -nE "^(9[0-9]|1[0-9]{2})\. \*\*" docs/OWNER_ORDERS.md      # the newest orders (90 on) and their titles
ls -t docs/prompts/ | head                                       # their unchanged text
```

Write each order's world claims as a list of short statements a file can contradict ("every demon lives in Hell",
"legendary classes have one holder", "34 realms; forms: kingdom, empire, principality, merchant republic, free city").

### 3.2 The scripted pass

```sh
node .claude/skills/ardan-world-data/scripts/world-xref.mjs > /tmp/ardan/<me>/xref.txt
node tools/lint-figures.mjs && node tools/lint-titles.mjs && node tools/lint-skills.mjs   # the gates must already pass
node tools/powers/gen-bestiary.mjs --check; node tools/skills2/seed-data.mjs --check; node tools/c7/build-names-data.mjs --check
```

Every `LEAD` line is a place to read, not a finding: "he" in a title's text may be another being (Silk's title speaks
of Morvane), a place missing from the lore may be meant to live only in the new data (Hell's domains). Keep a lead only
after reading both sides.

### 3.3 Inventory each subject's copies

For each subject the orders touch (each legend, each kind of creature, each realm the orders rename, each ladder):

```sh
bash .claude/skills/ardan-world-data/scripts/find-copies.sh -i 'vaskareth' 'galeheart' 'storm ancient'
bash .claude/skills/ardan-world-data/scripts/find-copies.sh -i 'Dragon Mountains' 'Crown Range'
```

Read every file it lists in the data, lore, code, tests and living-docs groups. Note each claim the file makes about the
subject (name, sex, age, level, home, count, title, liege, date) in a small table, one column per file. Contradictions
show as a row with two values.

### 3.4 Numbers in prose

Ages, dates and counts hide in sentences. Pull them out per being and compare across files:

```sh
node -e '
const fs=require("fs"), rx=/\b(\d[\d,]*|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|thirty|forty|fifty|sixty|hundred|thousand)[- ](\w+ )?(years?|centuries|ages|winters|towns|dragons|demons|khans|challengers)\b[^.]*/gi;
const strs=(o,a=[])=>(typeof o==="string"?a.push(o):o&&typeof o==="object"&&Object.values(o).forEach(x=>strs(x,a)),a);
for(const f of ["data/legends.json","data/power.json",...fs.readdirSync("data/figures").map(f=>"data/figures/"+f)]){const d=JSON.parse(fs.readFileSync(f,"utf8"));
 for(const rec of [].concat(d.legends||[],d.masters||[],d.figures||[]))for(const s of strs(rec))for(const m of s.matchAll(rx))console.log(rec.id+" ("+f+"): "+m[0].slice(0,100))}' | sort -u
```

It prints one line per number, prefixed by the being's id, so two files' claims about one being sort together
(`m-elf-blade (power.json): Four hundred years` beside `m-elf-blade (race-masters.json): nine hundred years`). For
code copies, add `find-copies.sh` on the being's name and read the lines it lists.

Then read the dates against the release calendar: founding years in `LORE.rulerHistory` (Aldmark from 951 AR), the
`wars` (`[id, name, from, to, text]`), `chronicle` (to 1104), `secrets` SEC-01 (the Common Reckoning from 1 AR). A
legend "eighteen centuries ago" lands before the calendar began; either the text says BR or it is wrong.

### 3.5 Places against the map

```sh
node -e 'const L=require("./src/core/release/core/00-lore.json");const want=process.argv[1].toLowerCase();
for(const p of L.map.provinces)if(p.name.toLowerCase().includes(want))console.log(p.id,p.pid,p.name,p.realm,p.terr,p.x,p.y)' Skyhold
```

Province `x`, `y` are kilometres on the release map (the v2 map keeps ids and names). For the map rebuild of order
100 wave 2, the gazetteer of the map branch (`map-lock-2:docs/design/m1/gazetteer.md`, unmerged) is the other side:
`git show map-lock-2:docs/design/m1/gazetteer.md | grep -n "<place>"`.

### 3.6 What the player sees (the built page)

The data can agree while the screen does not (a lore "True:" line beside a bestiary row, a fighter tier called
"Legend"). Build privately and look:

```sh
node tools/build.mjs --out=/tmp/ardan/<me>/x.html --unpack=/tmp/ardan/<me>/blobs
bash .claude/skills/ardan-world-data/scripts/find-copies.sh -i --blobs=/tmp/ardan/<me>/blobs 'Legend' 'Wyrm-Slayer'
```

The page's payload is compressed; grep the unpacked blobs (`ardan-core.js`, `ardan-content.js`, `ardan-lore.js`), not
`x.html`. For what a life actually prints (codex pages, news, cards), open the page with `?dev` or write a test that
plays a life and scans the text, as `nmOldNames` (`src/world/999981-names-and-cultures/test.mjs`) does: it scans every
script, the lore, every event's title and text, a new game's realms and provinces, three years' log and
`document.body.innerText`.

### 3.7 Tests and gates against the newest order

```sh
grep -rn "async [a-zA-Z0-9]*(" src/world/*/test.mjs src/people/9999975-level/test.mjs src/people/9999976-titles/test.mjs | cut -c1-120
grep -n "x3OneUnit\|w1NoMarshalLint\|w4NoLevyLint\|TEXT_BAD" -r tests/suites src/war tools/lint-figures.mjs
```

A test that asserts an old number or forbids a word the newest order wants is itself a contradiction (C-12). Name it
in the finding; fix it with the data in one step.

## 4. Writing the findings

One item per contradiction, numbered, under the order it breaks (newest first):

```
### C-NN. <one line: what is wrong, in the player's words>
- **What contradicts what.** <the rule or file:line> against <file:line>, quoting both.
- **Severity:** breaks play | misleads the player | inconsistent data.
- **Fix.** <the source of truth, the copies to change, the id policy (keep as internal key / save step), the gate to add>.
```

End with "the most serious" list (ten or so, by severity then recency). Write it to a private path
(`/tmp/ardan/<me>/contradictions.md`), not into `docs/` (order 76: no reports in the repo); hand it to the integrator,
and record decisions it forces in `docs/DECISIONS.md` (`D-NEW-1` unless your brief reserves numbers). Questions only the
owner can answer go to them as one short list (the audit asked three: "uncommon", orcs, kings' levels; order 98 answered).

## 5. After a fix: make it impossible to come back

| Contradiction kind | Gate to add or extend |
| --- | --- |
| a retired name or word anywhere | a test in the style of `nmOldNames` (whole page and a played life) or a static scan like `w1NoMarshalLint`; `TEXT_BAD` in `tools/lint-figures.mjs` for figure words |
| a figure's home, title, level, liege | `tools/lint-figures.mjs` (it already checks levels near the kind, titles' holders, lieges, story length) |
| a title's holders, rarity, budget | `tools/lint-titles.mjs` |
| band words naming a creature outside the band | `pwBands` (`src/world/9999970-powers/test.mjs`) |
| a count (dragons, demons, elders) | the generator (`gen-bestiary.mjs`) and `pwBands` / `figRegistry` |
| generated data hand-edited | run the generator's `--check` in your step; propose adding it to `tools/check.mjs` |
| a contradiction in the state of a played world (two holders, a dead holder) | `A.COHERENCY.add(name, fn, { owner })` (`src/core/08-coherency-checks`), held by `tools/coherency.mjs --baseline=quick` |

## 6. Leads found on 2026-11-27 that the audit did not list

Found while making this skill (trunk `d0d793d3`); check whether wave 1 already fixed them before acting.

- `src/world/9999970-powers/b-wilds.core.js:267` (`WOKE.sarnavoth`): "The roof of the **Crown Range** has fallen in ...
  awake after **nine hundred years**", against `data/legends.json` (asleep under **the Dragon Mountains** since his fight
  with the Sword Saint **sixty years ago**). The Crown Range is a real range of the lore (Brannoch's, region W-08); the
  Dragon Mountains appear nowhere in the release lore.
- `data/power.json` band F names "an imp of the lanes"; the Imp is level 300 (C-32, now caught by `--only=bands`), and
  band A's "the bone sovereigns of the restless dead" reads the Restless Dead (level 60) as a class of being.
- `data/names.json` is no longer what its generator writes (the W1-1 "Marshal" sweep); regenerating it reverts the sweep.
- The orc culture word `ghazrul` ("a deed-name", `src/world/47-realm-customs/bible.e.data.core.js`) is the id and name of
  an Archdemon; a rename of the Archdemon must not touch it, and a case-insensitive sweep will.
- `GD.REALM_FAITH` gives POL-05 and POL-31 a faith whose `LORE.faiths[].realms` does not list them (notes, not errors).
- `docs/NAMES.md` is generated by `tools/rename-pass.mjs` and lists file renames; the audit's C-11 suggests putting the
  world naming rule there, which the generator would overwrite: put it in `docs/design/names-and-cultures.md`.
