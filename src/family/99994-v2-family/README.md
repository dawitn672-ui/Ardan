# 99994-v2-family: a real family, one relation label, succession by house law

**Aspect:** the owner's v2 complaints 5 and 14 (`docs/V2_SPEC.md`), integration step 5 · **Kind:** system (four
core files, 9 patches, no events) on Ardan v2's engine (`A.V2.world`, `A.V2.kin`, `A.V2.succession`).

## What it does

**Three generations of family** (`b-family.core.js`, on `src/world/engine/world.js createPlayerFamily`'s model). The release
made a father, a mother, elder siblings and now and then one lone grandparent. After the release has made the parents
(house heads, royal parents and great-house members stay its own), each side of the family is filled in: both
grandparents, married, the old often dead; the parent's brothers and sisters (2–4 on the father's side, 1–4 on the
mother's), some dead young, some sworn to the temple, some holding an office (by the family's estate: a castellan, a
reeve, the master of a guild); the rest married, with 1–4 children each, your cousins. A parent who already heads the
house or rules came to it by the law, so their father is dead and no brother or sister who would come first is alive.
Everyone is a real person in `A.S.people`, linked to you (grandparent, uncle, in-law, cousin), and ages and dies as the
release's kin do.

**No birth-position picker.** "Place in the family" (heir, younger child, cadet branch, bastard) is gone from every
creation step (patches `V2F-PICKER-*`), a random character draws none (`V2F-RANDOMIZE`), and `A.newGame` ignores an
`order` option. The number of elder siblings comes from the family's seed (none 3 in 9, one 3 in 9, two 2 in 9, three
1 in 9: v2's weights; `V2F-ELDER`). Two exceptions, both not a choice of position: a half-elf or half-orc of a noble
house is born outside the marriage (the release's rule), and a hand-made story whose premise is a birth (29-starts'
"No Land for a Second Son", "The Letter in Your Mother's Box", "The Queen's Ward") keeps it.

**One relation label** (`a-kin.core.js`). Every relation the player reads goes through `A.V2.kin.relationLabel` over
the family graph (`p.parents`, `p.children`, `p.spouse`), with strict priority spouse > blood > in-law > feudal > bond.
A bond is a qualifier: "Wife (at odds with you)", "Father (close to you)", "First cousin once removed". `A.relLabel` is
wrapped, so the People tab, the person view, 59's tooltips and the death notices all read it; the People tab groups kin
and spouses under Family whatever their bond (`V2F-PEOPLE-GROUP`); 55's `FAM.roleOf` and 999's confidant names use it.
Event tokens: `{father}` and `{mother}` by the parents' sex (the release read `parents[0]`), `{rival}` and `{friend}`
never name your kin or your spouse. No event says "mutual friend"; the places that mean it (41's circle line and first
impressions, 55's gossip) are gated with `A.V2.kin.canCallMutualFriend`, so a parent is never "a friend of" anyone.

**Succession by house law** (`c-succession.core.js`). Each house has a law from `A.V2.succession.makeHouseLaw`, derived
from the seed and the house's id (pure, never stored): male-preference, absolute, agnatic, seniority or elective, and
for 40% of houses "pass over the unfit" (craven, sickly, or judged simple: wits and judgment both low). A royal house
takes its realm's law (male → male-preference, equal → absolute, female → absolute). The line is v2's: depth first
through the holder's children, then the siblings' lines. Titles are a crown (`r.ruler`), a house's headship
(`h.headPid`, with `h.seat`) and a lordship (`p.noble`, rung 4 and up, "of <province>"); they move only in
`A.V2F.inherit`: at a death (`A.kill` is wrapped), and when a life goes on as an heir (`V2F-CONTINUE`: the rung goes
where the law sends it). `A.inheritFrom` keeps the coin and moves nothing (`V2F-INHERITFROM`). A crown's heir is the
royal line under the realm's law (`A.pickHeir` is wrapped). A new lordship (a ruler's grant `V2F-GRANT`, a petition
`V2F-PETITION`, 97's patent, 994's enfeoffment, 9996's forfeit lands) takes a province no one else holds
(`A.V2F.freeHolding`): never another lord's, a great house's seat with a living head, or a capital.

**What you see** (`d-view.core.js`). The People tab opens with *Your line* (your house and seat, its law in words, its
head and how they are kin to you, where you stand: "You are third in line. Ahead of you: …"; your mother's house) and
*Kin of note* (`A.V2.kin.notableKin`: the uncle who is a castellan, the cousin your age, the half-brother who is heir to
the crown). The person view says what someone holds and is heir to. All of it is pure.

**Playtest 2 fixes.** A child's clan (`b-family.core.js`: `A.familyName` is wrapped; the release drew a fresh clan for
every orc birth). A stranger's sex from the scene's words (`a-kin.core.js`: `A.makeAcquaintance` inside an event's
setup; `F.sceneSex`). The Around you card's group for messmates (`d-view.core.js` `F.rosterGroup`, patch
`V2F-ROSTER-GROUP`, display only: the roster entry keeps "Under you", which `A.getToKnow` reads for the bond).

## Determinism

The family's shape comes from v2's `makeRng`, seeded from the game's seed. The people are made by the game's
`A.newPerson`, with the game's stream set aside while they are made (`A.V2F.sandbox`), so the stream continues where the
release left it. What moves: `A.S.nextId` (later people's ids are about 25 higher), the release's elder-sibling draw
(one `A.ri` fewer), and the yearly draws for the extra kin a life now knows.

## Engine change

`src/family/engine/succession.js`: `unfitReason` reads a host's `judgedSimple`, and the elective ranking a host's `ability`, for
people without v2 genes (`tests/v2/consistency.test.js`, "succession takes a host judgement…").

## Measured by

| Test | What it checks |
| --- | --- |
| `v2fThreeGenerations` | six births (every estate): two parents, four married grandparents, uncles or aunts on both sides, cousins; the same family twice from a seed; the sandbox leaves the stream |
| `v2fPickerGone` | no "Place in the family" choice on any creation step for five ranks, the note in its place; a random character draws none; `order: heir/younger/cadet/bastard` makes the same birth |
| `v2fKinTerms` | nine exact terms over the graph (father with a friend's bond, grandfather, great-uncle, first cousin once removed, second cousin, half-brother, nephew, wife, father-in-law); `{father}`/`{mother}` by sex |
| `v2fParentNotMutualFriend` | your father is never in your mother's circle, the person view does not name him; a real friend in common is kept; no event says "mutual friend" |
| `v2fMarriageFeud` | a wife whose bond is rivalry reads "Wife (at odds with you)", stays under Family, and `{rival}` names someone else |
| `v2fSuccessionLaw` | absolute, male-preference, agnatic and the depth-first line (a dead heir's son before his uncle) for a house; the same for a crown |
| `v2fOneHolder` | 30 seeds × 10 years: no crown, headship or lordship with two living holders, three fresh grants per seed included; headships pass by law |
| `v2fClanByLaw` | playtest 2, new #9: an orc child takes a parent's clan by the law (the father's, or the mother's where the crown goes to daughters: the Tusk Clans), so you, your elder siblings, those born later and the father's brothers share one clan; the grandparent the law runs through has it too; the release's name draw is still made |
| `v2fSceneSex` | playtest 2, old #24 and #15: a stranger made for a scene whose words speak of one sex is of that sex (the old scholar's "his rent", the bailiff "he has noticed", the slow recruit "give him a blanket-beating"); a scene with pronoun tokens is left alone; the stream does not move; a woman general's plan says "she" (38-orders); a plain soldier's messmates are "Beside you" (`V2F-ROSTER-GROUP`) |
