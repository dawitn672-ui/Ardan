# Confidants

**Aspect:** Relationships (design review cycle 1, #10) · **Kind:** system (`confidants.core.js`), 15 events (`confidants.events.js`, prefix `cf_`, all `npc: true`), tests

**Why.** 55-bonds keeps a weighted ledger of what passed between you and each person, but a bond showed only as an opinion bar and a word. Nothing marked how far a friendship had come, or what it gave.

**What it does.**

- **Ranks 1 to 5** for three kinds of bond, by the bond's type: a friend (friend, best friend, comrade, student), a beloved (lover, betrothed, spouse), a mentor (mentor, master, patron, superior).
- **When a rank opens.** When the bond's shared history (55's `BD.mem`, the faded sum of the ledger) and their opinion of you both reach the next step, the person brings the rank to you as a scene:

  | Rank | History | Their opinion |
  | --- | --- | --- |
  | 1 | 8 | 20 |
  | 2 | 16 | 30 |
  | 3 | 26 | 40 |
  | 4 | 38 | 50 |
  | 5 | 50 | 60 |

  The scene is an NPC move: it spends one point of 21-npc-initiative's budget and counts in its yearly cap, so NPC-started scenes stay at 21's rate. One rank scene waits at a time, and a bond rises at most one rank a year. No dice: the month hook only reads.
- **Fifteen scenes**, five per kind (a place saved on the bench, a spare key, a debt between friends; the bread cut just so, a week away, a fear traded; the tool taken out of your hand, an hour each week, the hard lesson, what is handed on). Each has two choices; either reaches the rank, and they differ in what else they give.
- **What each rank gives** (`pc.rel[id].cf`, the rank; `cfY`, its year; `cfG`, the year of the last gift):
  1. their opinion of you does not fade below 10 x rank;
  2. a yearly gift in the bond's month (from the person's id): a friend's coin (4 x rank), a mentor's lesson in their best skill, a beloved's season (happiness, and 35-moods' company);
  3. a favour they owe you (`A.addFavor`);
  4. the yearly gift doubles;
  5. a deed in your chronicle ("Was Aldwin's friend to the end") and 3 renown.
- **On screen.** Five pips beside the bond chip on the People list, with a tooltip naming what the rank gives and what the next one needs; a line in the person view.

**Not built.** The design's last-rank arc stage (50-arcs-kin, 51-arcs-rivals) and the rival and sworn-sibling ranks.

**Rules kept.** Old saves: a bond without `cf` is rank 0. Rendering only reads. Every string is escaped.

**Measured by** (`test.mjs`): `confidantRanks`: no rank without history; with it, `cf_friend_1` is queued and 21's budget pays for it; answering reaches rank 1; the opinion floor holds; no second rank the same year; a rank-2 friend's gift is 8 suns; the pips draw on the People tab and in the person view without changing state or dice. `lint-events` and `lint-choices` pass.
