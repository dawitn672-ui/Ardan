# Review of the old Ardan Codex (the Far Lands, 1 January 1105)

*Stamped 2026-11-16 · research only, no game code changed · file: `docs/research/ardan-codex-old.html` (3.4 MB, kept
as uploaded) · lifts: `docs/research/codex/reasons-and-cracks.md`, `docs/research/codex/martial-concepts.md`.*

## 1 · What the codex is

One HTML page of five books, "private canon for Ardan, frozen at dawn on Saturday 1 January 1105 AR" (no other date;
the owner says about two weeks old). It styles itself on the Woodblock & Light brief, with a search box and entity ids
as links. It describes **the Far Lands**, the Great Continent beyond the Known World's east edge, built on the four data
files beside it and "never contradicting" canon. Counts: **118 realms** (POL-36 to POL-153; the Known World has 34),
90 regions, 110 cultures and 34 language families, **55 faiths** in 13 families, 22 monies, 30 trade routes, 25
chokepoints, 317 ties between realms, 10 live quarrels, 23 military templates, 10 fallen states, 12 stateless lands, 72
chronicle entries, **303 fighting styles** (1,250 techniques), 121 sworn orders and companies, 40 legends, 160 masters,
**140 beasts** (CRE-65 to CRE-204), about 6,200 given names; 278.6 million people, 3.25 million under arms.
The books: the compendium (creation, deep past, ages, great powers, lands, warriors, beasts, mysteries, the web of
1105), the atlas, peoples and faiths, war and legends, beasts.

**The most important finding is that almost all of its data is already in the repository.** The Far Lands left the
game in v2 step 2 (V2_SPEC complaint 3, "remove the greater continent"; out of the build at `f933c89`, last built at
`437efa6`; moved to `archive/` in H-001, step 0). `archive/` holds five features: `99-far-lands` (the map and
`A.FL_DATA`: 118 realms, 268 houses, 317 relations, 110 cultures, 55 faiths, 58 routes), `990-far-peoples` (realm
bibles with want, fear, place and custom; voices; faiths; music), `991-far-war` (all 303 styles, 1,250 techniques,
103 orders, 40 legends, masters, templates turned into division recipes, 604 KB), `992-far-beasts` (140 beasts, duel
curves) and `993-far-life` (life events). So this codex is the **readable prose edition of material that was already
built and archived.** Its genuinely new value is the prose that the data never carried: the compendium's account of
how the powers hold together, the ten quarrels, the mysteries, the chronicle's "what is told / what is true", the
money, chokepoints and monsoon tables (the archive has relations and routes but I found no money, chokepoint or
quarrel tables there), and the realm "secrets".

## 2 · What still matches, what contradicts, what is gone

**Still matches the game.**
- Year and frame: 1105, and the Known World's own canon ids (CRE-01..64 beasts, REL, CUL, POL-01..34). The codex's ids
  continue those ranges, so any lifted record has a slot.
- The same record shapes: creatures with believed/true, faiths with prophecy, styles with school/ranks/techniques,
  realms with pay and debts. The game's `belief versus truth` system (`src/world/26-belief-versus-truth`: 64 beasts, 71
  secrets) is the codex's habit, scaled up.
- Order 34's tone (arts, murim-like schools, a top art beats a standard one, house arts apart from national ones):
  303 styles in exactly three kinds, national, chain, household. Nothing in it is magic; "numbers beat skill in the
  open, skill fades, the unseen kills the best". Masters are not unbeatable and have bodies that fit.
- Owner rule 18 in spirit: realms act on wants, fears and secrets, and the chronicle gives causes.
- Orders 47: the regalia are owned and used for reasons (see §3, regalia).

**Contradicts.**
- **Names and language.** Owner rules 9 and 11 (D-013): basic English names, one common language. The codex has about
  6,200 exotic given names built from syllable kits ("Taoren"), 338 family names and 34 language families. The 118 far
  rulers (Ishe Venhan, Tegur) cannot sit beside the game's common pool. `data/names.json` already keeps 9 pools for
  steppe, desert, south, giant, dwarf, elf (two) and orc (two), from `c7-name-data`, so far-style names have a
  controlled home.
- **One continent.** The codex holds a second world with a stated wall of ignorance (the Known World "thinks it is
  the world"). V2_SPEC allows only "rumour, never playable map". Anything lifted must be rumour-grade.
- **Technology line.** It says no plate, no gunpowder, no longbows. If the Known World's armour and bows differ, the
  codex's "same ceiling" claim is unverified here.

**Outdated: do not revive.**

| Item | Where in the codex | Why gone |
|---|---|---|
| **The military templates** (MT-01 to MT-23; "each realm's army names one template") | atlas appendix A, war book §2, and a template on every realm's entry | Order 34 removed army templates; W0 retired the editor (H-036, `archive/w0-war-score-and-templates/`). `archive/991-far-war` turned MT- into `A.tplDefaults` division recipes: that mechanism is exactly what was removed. The *descriptive paragraph* "how each land makes war" (war book §1, ten short paragraphs) is not a template and may be kept as flavour for D11 branches. |
| **The Marshal** | "Marshal Tsen Weilun", "Marshal of the Stair" (a school title), "Spear-Marshal" (Menaro's elected head, 23 hits), "Marshal" 38 hits in all | Order 54 removed the Marshal rank; General is the highest (D-066, H-061). Far Lands titles are *offices of those realms*, not the army rank. Decide whether school titles may keep the word (the Known World's `04-styles.json` also uses "General of the Charge"). |
| **Levies** | 136 "levy" and 44 "levies": standing armies against "full levy" (Taulen 460,000 against 1,800,000), "farm levies", "clan levies" | Order 54: no levies; conscription and armies of honour. The Known World's own realms still hold a `levy` field (`00-lore.json`, Aldmark 460,000), left over from the release. The codex's "Pay" row (land for service, tolls, hired coin) is the keep-able part. |
| **The war score** | not in the codex (0 hits) | Removed from screens by W0 (order 34, H-036). The archive's `score.data.core.js` is the music score, not a war score. Listed because the brief names it. |
| **Ranks of fighters** | war book: "Nobody has a rank" | Replaced by the five ranks (soldier, sergeant, captain, commander, General; war.md §9.1). School ranks are titles inside a school. |
| **Percentages** | none in prose; "in 100" 16 times for note value, `d` etc. in data | No percentages for the player (rule 2). Data/tools may. |
| **"Ambition" decisions, chapters** | 2 hits | Retired with the P3 playtest order (order 54(b)). |
| **Far Lands as playable** | "Where a story could start" (ch. 9.3), twenty far starts | Out of scope: `archive/993-far-life/x-across.events.js`. |

## 3 · Useful material, item by item

Sizes are the codex's own counts. "Lift" means a doc written now under `docs/research/codex/`.

**1. How great powers hold together and fall apart** (compendium ch. 4; the realm entries' Dynasty / Pay / Wants /
Fears / Custom / Secret rows) → **R1 / W1-2 (the decision brain), W1-6 (the realm's peace), Known World lore.** Ten
institutional ideas, each with a named crack (pay faked, succession split, soldiers that cannot breed, ledgers kept
twice, vows that fail with the water). 118 entries carry six fields the game's realm record lacks (67 are brittle
dynasties). This is the best fit to rule 18: coups and risings that follow pay, succession and shared belief. *Lifted:*
`codex/reasons-and-cracks.md` §1 and §2.

**2. Reasons for wars and quarrels** (compendium ch. 9, atlas §6 "the web of 1105"; 10 quarrels; 317 ties each with a
since-year and a cause) → **R1, W1-2/W1-6, war.md §11.2.** The game has 97 relations with a kind and a three-word detail
("tense peace"), and 43 wars with only a name, dates and a line. The codex's quarrels show a reason with people behind
it (an old khan, a bought neutral, a sealed felt). Ten quarrels, 317 dated ties of 8 kinds (95 trade, 64 rivalry, 53
tribute, 36 secret deal, 33 hostile, 32 friendship, 3 alliance, 1 debt), 4 worked causal chains. *Lifted:*
`reasons-and-cracks.md` §3 and §4.

**2b. Succession, brothers, hostages** (EVT-2065 an elder brother declared mad; a hidden heir a quarter foreign; a
heir in rival pay; a younger brother an enemy captain) → **N1 succession fights, W1-6 coups.** About 12 usable
seeds among the 118 secrets. In `reasons-and-cracks.md` §4.

**3. Fighting schools, orders, styles, masters** (war book §3 to §6) → **D11 / D11+ and the concepts of each martial
skill (order 59 and growth-standard §3.16), G.** 303 styles, each with philosophy, strength, weakness, school (fee,
entry rule, master), five school ranks, 4 to 5 techniques in five bases, and for 108 a unit drill; 121 orders; 160
masters with deed, rival, where they are and a weakness. The weakness lines are the counters that make "no obviously best
art" (the lint) true. The archive's `991-far-war/a-data.core.js` already holds all 303 as structured data, so a future
G build lifts *from the archive*. *Lifted now:* `codex/martial-concepts.md`, about 55 named concepts for 15 skills, each
with a source and a "never grasped" line. The 108 drills also feed war.md §14.2's eight families.

**4. Roads, money, seasons and trade** (atlas §4) → **E1.** 30 routes with goods each way, who taxes, journey times;
25 chokepoints with tolls ("one part in ten", "one horse in a hundred", "one fish in three"); a monsoon calendar that
bars war and sailing; 22 monies including three that are about trust, not metal (a half-note torn in two and matched at
the edge, a sealed purse never opened, a felt token redeemable in sheep); a news-speed table; "what each land lacks and
sells". Useful pathologies for the E1 money model (debasement, a note passing at 60 in 100, a coin that is sacred when
weighed). Patterns only, the Far Lands' goods do not exist in the Known World. Keep as reference.

**5. Beasts and "what is believed and is not so"** (beasts book, compendium ch. 7) → **the Known World's lore (belief
versus truth), G (beast fights).** 140 beasts, every one with "what is true", 102 with "what people believe", 49
with fight stats, 24 "known by name". 10 are legends with no body (the Sky-Horse, the Sand Swallower). The *method*,
that every famous monster is an animal plus a story and a reason someone tells it, is the most reusable idea, and the
Known World's 64 creatures could take a "who tells it and why" field. The Far Lands beasts themselves stay in
`archive/992-far-beasts`.

**6. Mysteries** (compendium ch. 8) → **Known World lore, N1.** 14 things nobody knows the whole of; at least 6 have
a proof object in a named place and a person who would lose by its coming out (the dim-summer calendar correction,
the bronze tablets, the false drum, the two ledgers, the silk that leaks). Same structure as the game's 71 secrets
(accepted story, truth, who knows, proof). Re-skin; keep as reference.

**7. Names and tongues** (peoples and faiths book; 34 families, 6,187 given names, 1,296 places) → **C7's name system**
(`data/names.json`). Not for use: exotic names against rule 9 and 11. Keep as reference if the Far Lands ever return.

**8. Faiths** (55 in 13 families; each with belief, creation, afterlife, clergy, festivals, taboos, politics, prophecy and a
**secret**) → **Known World lore.** The game's 19 faiths have the same columns minus the secret. Adding "what is true
behind it and what its keepers hide" to each of the 19 is cheap and fits belief-versus-truth. *Not lifted* (it would
mean writing new Known World content, not moving old text); recommended.

**9. Legends** (40, in nine tavern groups) → **order 46 (every legendary its own place and craft), L2.** These are *people*,
not arms, so they do not answer order 46 directly. Of the 40, only a few carry a named piece (a boat "Red Prize", a
horse "Smoke"). What matches orders 46 and 47 are the **regalia**: the Thunder Drum (owner the drum-house, wielder the king,
stolen in 1097 and replaced by a copy known to four men; whoever holds the true drum can claim the kingdom), the
Ishe seals carried in a bag and a sword taught to guard them, the Jade inheritance's bronze tablets, the Frost Riders'
silver seal that makes their khan a claimant, Moon-Pearl the white elephant. About 8 objects with owner, holder,
reason and political meaning. Postponed with L2 (order 60); note for later. The legends' "mind, rival, weakness,
where in 1105, price on the head" rows are also a good NPC kit for the decision brain.

**10. The chronicle** (72 entries; "what is told / the truth") and 10 fallen states → **Known World chronicle, R1 audits.**
Same shape as the game's 220 chronicle lines; adding a "truth" column to some is the cheapest signature gain. Keep as
reference.

**11. Peoples' customs and pride** (110 cultures, each with a pride and a neighbour it looks down on, 330 customs) →
**R2 (relationship base: pride and status).** A "neighbour it looks down on" per culture is exactly an input to who
will know whom. Usable pattern; the Known World's 24 cultures lack it. Small.

**12. A possible return of the Far Lands.** The archive is intact and the codex now documents it. A return would need
V2_SPEC complaint 3 reversed by the owner; do not plan it. If it ever happens, start from the `archive/` features, refit
them to `src/core/release/` (the NOTE says so), drop templates and levies, and re-check names against rule 11.

## 4 · Recommendations

**Lift now (done, data and design text only).**
- `docs/research/codex/reasons-and-cracks.md` → for R1 / W1-2 and W1-6 (`war.md` §11.2 and §13), and the Known World's
  lore. It gives the six-field realm pattern, ten institution-and-crack pairs, a reasons catalogue by kind, hidden
  facts as levers.
- `docs/research/codex/martial-concepts.md` → for growth-standard §3.16 and D11+. Next step for whoever builds G: move
  these into `data/` as concepts per skill when G1 is started.

**Lift when the owning item starts (not now).**
- R1: add want, fear and secret to the Known World's 34 realms (the codex shows the format); the realm's dynasty age as a
  brittleness input; a cause and a "since" year on each of the 97 relations (the codex's 317 ties are the model).
- W1-6: the "pay decides how it falls" classification as a stability input.
- D11 / D11+: the 108 unit drills and the "how each land makes war" paragraphs as source names; school titles after the
  Marshal question above is settled.
- E1: the trust-money patterns (torn half-note, sealed purse), tolls as parts, the monsoon bar on war.
- L2 (postponed): the regalia as owner/holder/why/politics examples.

**Keep only as reference** (in place; no file move): the compendium's prose, atlas, mysteries, chronicle, names, tongues,
faiths, beasts, legends and masters. The archive already holds their data.

**Drop.** The military templates and every template-driven mechanic; the Marshal and levy figures and every full-levy
army count; the playable Far Lands starts; the exotic name pools. No art or visual work is recommended (order 60).

**One cleanup the owner may want.** The Known World's own lore still carries `levy` on its realm records and "Marshal"
in a few school titles, which order 54 forbids. That is outside this research and was not changed.
