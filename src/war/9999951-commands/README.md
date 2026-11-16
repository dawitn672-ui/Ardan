# 9999951-commands: commands and the summons (W1-3)

**Aspect:** War, stage W1-3 of `docs/design/war.md` §16 (§9.1 to §9.5; the owner's order 54, answer 10: "nobles have
their own command systems and armies under the king, with regional disputes possible", and answer 5 on honour and
volunteers). **Kind:** system, three readable core files and one event pack, with small calls in the release source and
in 38-orders, 9999905-five-ranks, 9996-polity and 99997-v2-war. **Design:** `docs/DECISIONS.md` D-064 points 2, 4, 5
and 6, D-066, D-069; this stage's choices are D-081 to D-084. Every decision goes through `A.WHY.decide` (rule 18).

## What it does

**Commands** (`a-commands.core.js`, `A.CMD`). Every armed man of a realm (every division of the war map) is in exactly
one command, and each command has one owner:

- **the crown's** (`crown:<realm>`): the king's own. Its first host (the senior General's), the elite orders, the
  regiments the crown raises, and its share of the standing hosts. Its Generals are the ones the crown commissions;
- **a great lord's** (`house:<house>`), for each **tenant-in-chief**: a duke, or a marquis or count with no duke over
  him (`A.CMD.isTic`). His first host is led by him **by right** (an adult of fighting age who holds no other field post
  or seat), else by **a General he names** (a seed name, sworn to him; no person is made). His other hosts' officers are
  his own men (9997's and `A.oobLeader`'s seeds). `GD.NOBLE_RUNGS`' numbers stand as each house's **full strength**
  (`A.CMD.full`: a duke 30,000, a marquis 8,000, a count 4,000).

Commands are a reading worked out from `A.S.houses` (a `Map` per realm, rebuilt when the houses change). The one field
written is `d.own` on a division: the house whose command it is in, absent for the crown. **Old saves** therefore map
every army into the crown's command, and the first time a realm is read its standing hosts are **dealt** (`A.CMD.deal`):
the crown keeps its first host, its orders and half the rest; each tenant-in-chief takes hosts in proportion to his full
strength, largest remainder first, the order fixed by the ids (no dice). A count often has no standing host: his men
are called, which is W1-4's. A host whose house dies out, sinks below a count or leaves the realm returns to the crown.

**A contingent is kept whole** (`A.CMD.keepWhole`, when a war's hosts are raised): a great lord's hosts in one war are
in one army, never split between two.

**The king's three ways of commanding** an army of two hosts or more (`A.CMD.chooseCommand`, kind `command`):

| Way | `a.cmdBy` | What it does | Reasons |
| --- | --- | --- | --- |
| In person | `king` (`a.king`) | the army moves by his temper (38-orders' dials); the men see his banner (+4 morale) | his skill in command, glory, his realm attacked; against: the throne left behind, his years, a shaking throne |
| A commission | `commission` | the existing `army:<id>` post, by his written word for this war; great lords of higher birth under the General keep a grievance | the General's merit, the king's trust, kin; against: a famous man a wary king fears, the great lords' precedence |
| A council of war | `council` | each General his own; a joint order takes a day longer (`A.GENERALS.every` + 1) and no one temper leads | no one man trusted with all the hosts, great lords who will not yield to each other, no General who stands out; against: slow and quarrelsome |

`A.HOSTS.army(a).as` reads it (`king`, `commission`, `council of war`); a new king decides again.

**The summons** (`b-summons.core.js`, `A.CMD.summon` on `warStart`). Each realm on both sides that was not already in
the field musters. Each tenant-in-chief answers in one of six ways, decided through `A.WHY.decide` (kind `summons`):

| Answer | Pulled by | Follows |
| --- | --- | --- |
| In full | his oath (by his honour), the crown's fear and right, the enemy at his own border, a young lord's glory, a war faction, others who came | his hosts march; credit with the crown |
| With part | a hostile neighbour on his border, unrest at home, the harvest, a careful temper | half his hosts (rounded up) stay home |
| Late | the harvest, winter roads, a long road, pride | his hosts come on their day (30 to 90 days on) |
| A deputy | he cannot lead (a child, too old, unfit; his place at the council), a son to blood | his hosts march under another |
| Coin | full chests, a far war not his | shield money to the treasury (6 a man of full strength); his hosts stay home |
| Refusal | his grievance with the crown, a faction that wants the king weaker, danger at home, others who refused, refusals before | his hosts stay home; a grievance on both sides; the king's anger (a feeling) |

The **muster** (`A.S.musters`, bounded: twelve, a live war's first) keeps each answer with the **reason he gave** (`e.g`,
an excuse he could give: the harvest, his border, his years, the roads) and the **true reason** (`e.t`, the heaviest
for it, empty when the excuse is the truth), with the two heaviest reasons. A contingent that stays home holds its
hosts back (`d.hold`; the war map's mobilising passes them by, `A.CMD.held`).

**Seasons.** A lord's men serve the first season (182 days) at his own cost. After it, each season the crown decides
whether to pay them (kind `pay`: their pay against the treasury, their share of the host, the house's loyalty); if not,
the lord decides whether to stay (his oath, a war at his own border, loyalty) or take them home (the seasons at his own
cost, the harvest, his grievance). A house with no host on the map has nothing to pay or take home.

**A refusal** is a grievance the crown records (`h.cmRef`, the years, at most four). At the next month the king decides
how far he dares punish it (`A.CMD.sentence`, kind `sentence`): accept the excuse, a fine, hostages, strip a host into the
crown's command, declare him forsworn, attaint him. Reasons: the law and his refusals before, the king's anger and
pride, the excuse when it is true, and **the crown's strength against the lord's** (his full strength, his hosts, his
faction's): a sentence beyond the crown's strength is not enforced and costs it stability. The lord answers (`answer`):
submit, sulk, or seek out the others who stayed home (he joins a liberty or independence faction when there is one;
W1-6 raises the league). Every sentence but acceptance is a grievance on the house (`h.cmGr`, at most four).

**A march lord** whose men stayed home raises them unsummoned when an enemy host stands on his seat or next to it
(`A.CMD.borderTick`, kind `border`: his own lands against his grievance).

**A league member** called against a conqueror (the release's `A.callExtra`) decides through `A.CMD.leagueJoins`: the
league's oath and the conqueror's black name against the cost and its weariness, at the release's pace.

**The crown's General for a new army** (the release's `A.wsGeneralFor`) is decided through `A.CMD.generalChoice` (kind
`general`): the four likeliest great houses' heads (a great name, merit, the king's kin, the house's loyalty, a house of
the sword; a tenant-in-chief leads his own command) against raising a man of no house.

**The four disputes** (`A.CMD.DISPUTES`, war.md §9.4). One war record serves all fighting: `w.kind` is `realm`,
`rebellion` or `civil` now (written at the start; an old war is read), with `private` and `border` for W1-6. The
refused summons' ladder is built (above). The other three have their hooks: a quarrel inside the army (a General passed
over, a great lord under a man of lesser birth: `h.cmGr` with `t: passed`), a border lord's own war (`A.CMD.march`, the
unsummoned rising), a private war (`w.kind`, the grievances on each house). **Their ladders are W1-6's.**

## What the player sees, by rank (`c-player.core.js`, `cm.events.js`)

- **A landed lord** owing men (`A.POL.pcOath`) is summoned: **cm_summons**, six answers with what each costs. In full or
  with part he rides with his men (the release's levy battle; he is in the war at his rank until it ends or he goes
  home, `A.CMD.ridesWith`, read by 99997-v2-war's `W.side`); late, a deputy, coin, or refusal. A refusal is judged by the
  same ladder (`A.CMD.pcJudge`): a fine, a son at court, a rung lost, forsworn, attainder, or the excuse accepted; the
  judgment is **cm_sentence**, where he submits, keeps silent, or writes to the others who stayed home. After the first,
  a summons within the polity's quiet is answered as the last one was (men, deputy or shield money), with a line in the
  log. The release's yearly summons and the polity's po_muster no longer ask a lord already summoned.
- **A man serving in a great lord's command**: a General of one of its hosts answers to that lord, not the crown
  (`A.CMD.chiefOf`, the release's `A.makeSuperior`); the officers above a soldier are "of <house>'s host".
- **The news** of the muster (`A.CMD.tellMuster`) at the player's place: the crown and its council hear the whole roll and,
  with a spymaster worth the name or a man they know, the truth under the excuses; a lord hears who refused or paid
  coin and what they said; a soldier hears his own lord's answer and the count of banners; the rest of the realm, only
  that lords would not come. Another realm's muster is not told.
- **The muster roll** on the War tab (`UI.musterCard`): the roll at his rank, each lord's answer and men, a "why" that
  opens on a tap (the excuse; the truth where he may know it; the sentence; the seasons), and who leads each army. Plain
  words, no percentages.

## State (all optional; old saves load)

`A.S.musters` (at most 12 to 24 musters of about 20 short entries), `d.own`, `d.hold`, `a.cmdBy`, `a.king`, `a.cmdWhy`,
`a.cmdYear`, `h.cmRef`, `h.cmGr`, `h.cmHost`, `h.cmForsworn`, `h.cmAttaint`, `w.kind`, `r.cmdDeal`, `pc.cmLast`,
`pc.cmRef`. Records of kinds `command`, `sentence`, `general` and `war` (a league joining) go into `A.S.why`; the
summons, the seasons, the border and the lords' answers are kept in the muster.

## Measured by

`test.mjs`: `cmEveryManOneCommand` (15 years: every host in one command, every command one owner, no man General of two,
the posts audit clean), `cmSummonsRange` (a range of answers, each with reasons, the excuse and the truth),
`cmHatredRefuses` (a lord who hates the king refuses or pays coin far more often; war.md §9.5's lab: a grievance and a
hostile neighbour bring part or nothing at least 7 in 10, neither brings him in full at least 9 in 10),
`cmContingentWhole`, `cmThreeWays`, `cmRefusalLadder`, `cmPlayerSummons` (the six answers at 375 by 667, the War tab's
roll, nothing for another realm's peasant), `cmDeterministic`, `cmOldSave`. The core suites' `renderRng` and
`replayWithRender` hold the views pure.
