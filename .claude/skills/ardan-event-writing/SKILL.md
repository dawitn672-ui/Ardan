---
name: ardan-event-writing
description: "How to write an Ardan event card (*.events.js, A.defEvents): the event shape, condition helpers (C.*), effect keys (fx), checks, memory flags, scenes, tokens, kin from the family tree, the house voice, and the lints that must pass. Use whenever you add or change an event, a card, a choice, an effect key or event text in Ardan, even a one-line text fix, since events are read as text by the classifiers."
---

# Writing Ardan events (`*.events.js`)

Each file calls `A.defEvents([...])`. Plain readable JS is fine.

```js
A.defEvents([{
  id: "mt_first_love_letter",          // unique, lowercase; prefix with your feature's short code
  title: "A letter in an old hand",
  cond: (p, C) => C.adult(p) && C.flag(p, "ch_first_love") && C.age(p) >= 25,  // ALWAYS (p, C) => using C.* helpers
  w: 1, cool: 10,                       // weight; cooldown in years (default 6); once: true to fire once ever
  setup: (p, ctx) => { /* fill ctx tokens; ctx.pid = someone's id makes {them}, {khe}/{khim}/{khis} work; ctx.skip = true to drop */ },
  text: "Years ago, {them} ...",        // <= 80 words once rendered; may be (p, ctx) => string
  choices: [                            // 2 to 4 choices, each label <= 12 words
    { t: "Write back", r: "Result text.", fx: { happy: 4, flag: "mt_wrote_back" } },
    { t: "Burn it unread", check: { s: "wil", s2: "int", d: 45 },
      win: { r: "...", fx: { wil: 1 } }, lose: { r: "...", fx: { happy: -3 } } },
  ],
}]);
```

**Condition helpers.** `C.` age, adult, child, teen, young, old, ageAdj, noble, rich, poor, unfree, soldier, atWar, ruler, married, hasKids, job(p,k), race(p,...), realm(p,"POL-01",...), cult, faith, terr(p,"hills",...), coast, town, blood, trait(p,t), flag(p,f), prison, male, female, stat(p,s), skill(p,k), hasRel(p,"friend",...), parentsAlive, fame, literate, lvl(p,k,min), talent(p,k,letter), ready(p,k), stuck(p,k), gear, family, famKind, famHead, atSchool, jobRank, rep, ownShop, myRealm, faction, allies, office, superior, favors, owes, sworn, letter, ambition (what the player seeks of his own will: his plan's aim, his chosen training, his post; `A.SEEK`, 9989-what-you-seek; nothing is handed, order 54).

Using these helpers matters, because `A.CX_RX` classifies events by matching them in the source (`C.ruler(`, `C.noble(`, `C.poor(`, `C.soldier(`, `C.child(`, `.job`). The text classifiers in `A.EV_RX` (tavern, street, master/overseer, favour asked by a lord) can hide an event from the wrong class.

**Effect keys** (`fx`): str spd ins sta int wil health happy looks fame honor piety coin coinPct family skill rep masterwork promote style styleXp apt trait untrait wound flag unflag rel them newRel lover die prison punish free merit patronOp rulerOp realmStab realmGold armyXp secret epithet deed ach job perf lang literate gear asset duel beast event stability treasury legit realmRel favor mission cause why infamy authority houseOp factionDisc owed oweThem letter bossOp sworn claim pact ally warOn proof grasp talent specialism.

- `fx` may be a function `(p, ctx) => "extra result text"`.
- `skill: { persuasion: 2 }` is **experience** (S1, D-072, D-077): n × `A.SK.SHIM` (0.5) of a month's effort, a stretch when
  the choice had a check or stakes, else practice (so 2 is about eight experience: half of D Lv 1's bar, a fiftieth of an
  A-rank level's). It never buys a rank: a new rank also asks its concepts and, from rank B, a deed.
- **A level is printed only by `A.SK2.label`** and its kin (`labelValue`, `labelAtLeast`, `nextLabel`): "Basic
  Swordsmanship · C · Lv 3". The rungs (`src/people/37-skills2`) hold the level since the skills rebuild's switch; S1's
  seven words and Roman steps are gone from everything a player reads (orders 78 and 83; `tools/lint-skills.mjs`).
- `proof: "sword"` (or `"ctx"` for `ctx.sk`) is a deed for the next rank (the key's name is S1's); `grasp: { k, sure }` a breakthrough's
  moment (the engine's chance, or sure); `talent: { sword: "B" }` raises a talent letter (the old `apt` is read as a
  letter); `specialism: { sword: "the-knife" }` takes one. `deed` stays the release's record of a deed.
- Skills: `C.lvl(p, k, min)` (min a number, as a check reads it; k `"any"` is the best skill),
  `C.talent(p, k, letter)`, `C.ready(p, k?)` (at an edge, wanting a deed), `C.stuck(p, k?)` (at an edge, behind a
  concept). `C.prof` and `C.apt` are gone. Experience moves only through `A.gainXp(p, k, effort, cause)` (`A.trainSkill`
  is a shim for older code); a level only through `A.SK.set`. Never write `p.skills[k]`: it is the level's mirror.
- `flag: "x"` sets `p.flags.x = year`.
- `them: { op: 10 }` changes opinion with `ctx.pid`.
- `event: "id"` queues another event right after this one.
- `need: { rest, company, purpose, comfort }` meets the four needs of 35-moods.
- A deed a title watches (a duel won, a bribe refused, a siege held) goes through one door, `A.deedDone(p, kind, ctx)`
  (the kinds are `data/titles/vocab.json`'s deeds; D-183); a title is never granted by a card directly.
- A feature that adds an effect key declares it in its core code: `(A.FX_EXTRA = A.FX_EXTRA || []).push('key')`. The linter reads that declaration.

**Checks.** `check: { s, s2, d }` takes a skill or stat (`GD.SKILLS` keys: the 28 skills and the 10 legacy keys, which read their skill with that specialism; or str spd ins sta int wil). `d` is a level's value: even odds for someone whose skill reads `d` (45 is C Lv 6, 55 is B Lv 1), and each point is worth 1.6% of odds. A check trains its skill as a stretch against `d`, and one at the next rank's value or above, succeeded, is the deed for a person standing at that edge.

**Memory.**

- `p.flags[name]` holds the year a flag was set.
- `p.flags.ev[eventId]` holds the year the player last saw each event.
- Use `A.schedule({ type: "event", ev: "id", ctx: {...} }, days)` to bring something back years later.

**Scene.** Every event has a scene tag (`src/events/26-scene-tags`: court, home, church, market, field, workshop, road, sea, wild, war, fight, tavern, street, sickbed, school, prison, grave, feast), read from its words, shape and audience; the event's print follows it and the people on the card dress for it. When the reader would get it wrong, say it: `scene: "field"` on the event.

**Tokens.** `{name}` `{home}` `{realm}` `{realmShort}` `{capital}` `{ruler}` `{faith}` `{father}` `{mother}` `{spouse}` `{rival}` `{friend}` `{enemy}` `{year}` `{age}`, plus any `ctx` key. Digits are allowed (`{mate2}`). An unfilled token makes the engine drop the event.

**Kin come from the tree** (C6, D-057). The family tree holds every relative; `pc.rel` holds only the people met. Never make
a relative for a scene: take one with `A.KIN.take(p, ["cousin"], { sex, adj })` (met then; it throws, dropping the card,
when the tree has none), name one with `A.KIN.nameOf`, and write a story's secret into the tree with `A.KIN.reveal`.
`tools/lint-kin.mjs` fails a scene that links a person it made under a blood word, or says "your cousin {x}" with no kin source.

**Voice.** Dry, concrete, period. Second person, present tense. Short sentences. No modern idiom. Avoid the existing tics ("looks at you a long time", "for the rest of your life", a five-word punchline after every outcome).

**Before you finish:**

- `tools/lint-events.mjs` must pass.
- `tools/lint-choices.mjs --feature=<name>` must find no obviously best choice. It flags a choice that beats the others on every count and is no riskier, so give the other side a reason or the favourite a cost.
- `tests/run.mjs` must pass for your feature.
- CI (the long tier, `long.yml`) also runs `tools/bench/balance.mjs`, which holds each starting path to the bands in `tools/bench/targets.mjs`. Widen a band only with a reason in the file.

