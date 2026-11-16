# 9999960-reach: every relationship needs a base (R2)

**Aspect:** rule 19 (owner order 55, D-065; built as D-080) over rule 18 (A.WHY, D-069) · **Kind:** system, one readable
core file over the v2 engine's `src/people/engine/reach.js`; small edits in the release (see below), 30-get-to-know and
41-friend-circles. No events.

## What it does

"If I'm a peasant why would the king allow me to get to know him." `A.REACH` answers whether a higher man lets a lower
one near, talks with him, befriends him, lets him court, hears him or does him a favour, for the player and for NPCs.
It is a decision of the higher man's through `A.WHY.decide(hi, 'reach', [yes, no])`, with reasons:

| Part (D-065) | Reasons (kind, weight in log-odds) |
| --- | --- |
| **The gap in standing** | against: 0.6 a step beyond the first, by the act (know 0.9, befriend 1, audience 0.8, favour 1, court 1.15, wed 1.4, patron 0.85), bent by his pride against his warmth (`station`) |
| **His pride and personality** | proud (the bend), born to gold (against 0.4), cruel (against 0.4), shy (against 0.3); kind, humble (for 0.6, `sympathy`), gregarious (0.5), curious (0.5); **risen from below** while you stand where he stood: "he was born a peasant himself" (for 1.3) |
| **Need** | your sword when he is at war (0.7 to 1.8), your skill (0.8), your silence when you hold his secret (3.5), your coin (0.9), your voice in council (1.4), what you know (0.6); a ruler hears his own people (audience, 1) |
| **Circumstance** | you serve him (2.4), saved his life (3), stood in the same line (1), shared a cell (1.4), lessons (1), a company (1.2), his work (1) |
| **The scales you shift** | knighthood (0.8: "a knight of your name is worth an hour"), honour (up to 0.8; a stained name is against), renown and fame (up to 3), mastery of anything (up to 1.4), wealth (up to 1.6), a deed of the last three years (0.7), an introduction from someone who knows both (up to 2.8: "Lady Edith speaks for you"), a shared lord (0.7), a guild (0.6) |
| **The bond already there** | his opinion of you: for (op/25, at most 3) or against |

Its answers (`A.REACH.view`, pure): **equal** (a gap of one step or none: near-equals keep what already worked, no
decision), **kin** (a base of its own), **open** (the reasons settle it), **try** (an attempt: a seeded draw among the
reasons, A.rand only then), **closed** (nothing could choose it: not offered, and the note says why). The player is told
the heaviest reason: "Lord Aymer will hear you now: a knight of your name is worth an hour." / "King Osric will not know
you: a peasant is far beneath a king. A knighthood, a name, a purse, a deed, or a friend who knows you both could
change that." A refusal stands for the year (`pc.reachNo`).

**Origin.** A man's estate of birth is `p.status` (a knighthood or a lordship is `p.noble`, laid over it), so a baron
whose status is peasant rose from the plough. A crown changes `status` to royal: `A.makeRuler` and founding a realm
stamp `p.orig` first.

## The paths now gated

| Path | Where | How |
| --- | --- | --- |
| Get to know | `A.getToKnow` (release) and 30-get-to-know's scene | a shut door: the button is disabled with its note; an attempt refused spends the time and gives his reason |
| Spend time, talk, train, spar (befriend); compliment (know); ask for advice, help with troubles (audience); ask for money, ask to join your company (favour); flirt, court (court); propose (wed) | `A.interactOptions`, `interactNow` (release) | out of reach: not offered, with a line "Out of your reach: friendship, courtship..." and a click-to-open note; within reach but unsettled: an attempt he answers |
| An event's `them: { type: 'friend' / 'lover' / ... }` with someone far above | `A.applyFx` (release) | the scene counts as a circumstance (2); with no base even then, the opinion moves but the bond stays, and the card says why |
| A patron (`A.findPatron`) | release | the candidate whose reasons lean furthest decides; with none, a man of your own world takes the interest |
| A match for a child into a great house (Arrange a match) | release decision `match_child` | the house's head decides, the dowry a reason; the likeliest three are asked; with none, a gentry match |
| An NPC newcomer's friend in your circle | 41-friend-circles | weighted by `A.REACH.pull` (no draw of its own) |

Not gated: insults, quarrels, duels, murder, family matters, favours already owed, the release's events that make a
new person (`newRel`, `lover`: `A.makeAcquaintance` and `A.makeLoveInterest` make near-equals by construction), the
nobility's court actions (a gentleman is of the court), NPC marriages (the release and v2 make them within one estate).

## State (optional; old saves load)

`pc.reachNo` `{ id: year }` (this year's refusals, at most 40), `p.orig` (birth station, only once crowned),
records of the player's reach decisions in `A.S.why` (kind `reach`, at most 20).

## Tests

- `tests/v2/reach.test.js` (unit): a peasant cannot befriend the king; knighted, renowned or introduced, sometimes;
  the risen baron agrees more often than the duke born to gold; need opens doors; near-equals and kin; determinism.
- `test.mjs` (browser): `reachPeasantAndKing`, `reachScalesShift`, `reachRisenAndBorn`, `reachNeedOpens`,
  `reachNpcBonds`, `reachStateAndPurity`.
