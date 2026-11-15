# Households and relationships (C6)

The owner's order 7 (Nov 12): *relationships start with only the people really in your life (commoner: parents,
siblings; noble: also maids, nurses, tutors, guard knights); others enter through what you do.* CRITIQUE §13 and rows
F1 to F10, P9. Decisions: `docs/DECISIONS.md` D-057. Code: `src/family/999991-households/`.

## Two stores, two meanings

| Store | Holds | Who writes it |
| --- | --- | --- |
| **The tree** (`p.parents`, `p.children`, `p.spouse`) | every kin of yours the world knows of, living or dead | birth, marriage, 99994's three generations |
| **Relationships** (`pc.rel`) | the people you know, each with how you met (`met`) | a meeting: your birth, your household, a scene, a marriage, your work |

The tree may be large (four grandparents, eight uncles, a dozen cousins); relationships start small and grow by meeting.
Every label still comes from the tree (99994's one resolver); `pc.rel` only says that you know them.

## At birth: the household

- **Everyone:** your father and mother, your living brothers and sisters (full and half, the children of either parent).
- **A grandparent only under the same roof.** A living grandparent lives with you when the family keeps the old (drawn
  from the family's seed, never the game's stream): the father's parents first (a widowed one more often than a pair),
  else a widowed parent of the mother. At most two. The others are in the tree and met later.
- **A noble** (noble or royal, in a house) adds a **household**: a wet nurse, a maid, a **guard knight** at birth, and a
  **tutor** from age 6. They are commoners (the knight a gentry man-at-arms) with lives of their own: homes, ages, families
  names, a trade. Recorded in `A.S.household` (`{ staff: { nurse, maid, guard, tutor }, roof: [ids] }`).
- **Caps** (tested over 42 starts): a commoner knows at most 8 people at birth, a noble at most 12; nobody is born
  knowing an uncle, an aunt, a cousin or an in-law.
- A start at an older age keeps the same household; a teenage start also knows the kin who live in the same parish.

## How you met

`A.link` records `met: { y, at, by }` on every new entry of the player's relationships: the year, the province where you
were, and why (`birth`, `household`, `kin-visit`, `parish`, `marriage`, an event's id, `work`, ...). A caller may say why
with `A.MEET.as(why, fn)`; inside an event the event's id is used; otherwise the relation's own type gives it. The person
view shows "Known since 1103: met at the harvest gathering in Ashford". Old saves' entries have no `met` and read
"Known since <since>".

## Meeting kin later

Kin who are in the tree but not known are met by what happens:
- **Family gatherings** (once a year, from the family's seed): a living unmet relative of the same parish (first) or realm
  comes for a feast, a burial, a wedding or a hard winter, and is met (`by: 'kin-visit'`). A log line, not a card (talk
  waits; owner order 17).
- **Scenes:** an event that names a relative takes one from the tree and meets them then (`by: <event id>`).

## No kin minted

An event never makes a relative: `known()` (pack 15), `kinPid` (pack 11), `AK.sibOf` (50-arcs-kin) and the other kin
helpers take a relative from the tree (meeting them when needed) or drop the card. A scene that wants a cousin killed
kills a real cousin or does not happen. In-laws enter only through a marriage that writes the spouse's parents into the
tree. Held by `tools/lint-kin.mjs` (no event helper makes a person and links them to the player as blood kin) and by
`c6NoKinMinted` (12 worlds x 30 years: no kin link to someone outside the tree, no blood relative created after the start
except by a birth).

## One resolver for a house

`A.HOUSE.resolve(hid)` gives `{ head, heir, law }`: the living head (else the first of the last head's line under the
house's law, written through `A.setHead`, so `A.POSTS`' `house:<id>` post stays in sync), and the heir, the first living
person in the head's line. The release's `A.kill`, `A.houseHead`, 99994's `F.inherit`/`F.headOf` and the views read it.

## The parish

Each home province has a **parish** of named commoners held as **seeds** until met: a priest, a reeve, a miller, a smith,
an alewife, a shepherd and a dozen neighbours, some with children your age. A seed is a few numbers derived from the
world's seed and the province (role, sex, age, a name drawn on a stream of its own); nothing is stored until one is met.
`A.PARISH.meet` makes the full person (deterministic, on its own stream) and keeps the id in `A.S.parish[prov]`. A
commoner's "make a friend", "a neighbour", "a child of the village" (`A.makeAcquaintance` at home) meets the parish
first, so the village you grow up in has the same faces.

## Nine months

A conception is a date: `A.S.pregs` holds `{ m, f, due, kind }`; the birth comes on its day, about nine months later,
in any month. A woman with child does not conceive again; a mother who dies first takes the child with her. The
player's own household hears of it ("Your wife is with child").
