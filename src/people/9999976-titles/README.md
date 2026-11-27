# 9999976-titles: names the world gives

**Aspect:** skills-v2 §11 (11.1-11.9) as the owner's answers of §15 change it (orders 79, 82, 83, 84, 89; D-183) ·
**Kind:** system, two readable core files, one event pack, data (`data/titles/`), a validator (`tools/lint-titles.mjs`), tests.

## What it does

- **A title is earned, never bought, trained or rolled for.** It is a name the world gives a person (or a being) for
  what he did or became: *the Undefeated*, *the Hundred-Day Wall*, *the Dragon Slayer* (Wyrm-Slayer until order 98). Not a noble title: land and offices
  stay posts (`999990-posts`, one holder a post).
- **Hidden requirements.** `requires` and `watch` are read only by this folder and the validator; no screen prints a
  condition or a count (the validator fails any `src/ui/` or `*view*.core.js` file reading them; `ttHidden` and `ttPhone`
  read the rendered pages). **No hints anywhere** (order 92, D-185): no rumour, no card, no line in Records or the log
  tells of a title before it is earned, and another person's title card shows its name, rarity, gifts and honour, never
  the deed (D-183's tavern rumours are in `archive/titles-hints/`; `tools/lint-titles.mjs` fails a title carrying a hint).
- **The deed ledger.** `A.deedDone(p, kind, ctx)` is the one door: `p.dl = { kind: [count, streak, lastYear, best, keys] }`
  (only the kinds `vocab.json` declares, at most eight keys a kind). It breaks the streaks the deed breaks, takes away
  the titles it loses, then checks only the titles watching that kind (an index built once). The sources call it beside
  their own records (below).
- **Checked deterministically.** On a deed; once a month for the player (`A.onMonth`: the release's deed lines read, then
  the titles watched by `month`: a state such as age and a skill's rank); once a year for everyone else who matters
  (rulers, the holders of posts, anyone with a ledger), in id order. Nothing draws on `A.rand`: a title someone grants
  (the Sword of a realm, named by its ruler) is decided by `A.WHY.decide` on a seeded stream of its own.
- **The top of the ladder** (order 97, D-202): the Primordials, the Dragon King and the Sword Saint hold mythical titles
  (`primordial-archdemon`, each Primordial's own, `king-of-dragons`, `sword-saint`), and a great being's own arts are a
  set of the rarest title it holds (`A.RARITY.setOf`: theirs mythical, every other legend's and the ancients' legendary).
  A renamed title keeps what an old save held (`TT.RENAMED`, the save step `titleIds`, version 24: Wyrm-Slayer is the
  Dragon Slayer, order 98).
- **One living holder** of a unique title: the census `A.S.tt.u` (key: the title, or the title and the realm for one
  `per: "realm"`); the first in id order holds it; free on his death. A great being whose sheet names the title holds
  it while it lives (Cael Vardan holds *the Sword Saint* until he is slain). A title given `once` an age is never given
  again (`A.S.tt.first`); one marked `since` is only for what is reached after the age began: those who already met it
  when titles came into the world are written down (`A.S.tt.pre`) and never earn it.
- **Stacking without a snowball.** A title's `effects` are the skills' own vocabulary and join their pool as sources of
  rank = its weight (`37-skills2/c-effects`: `SK2.xHeld`, `SK2.addSource`), so the caps of §2.4 bind skills and titles
  together: +12 on a check, +15% of fighting worth, 3 aura steps, 2 blunder or surge steps, 3 steps of resisting. Stats:
  at most +2 a title for a basic one, +3 rare, +4 epic, +6 legendary, +8 mythical (the one rarity ladder, D-200; validator,
  `vocab.json` statMax; order 95, D-192), +10 together (`SK2.statOf`), never past the potential by more than 5 (`A.stat`). Honour and renown are paid
  once, on earning. A title spends at most `perLevel(weight) x 5` times its rarity's figure (x1.25 epic, x1.5 legendary,
  x2 mythical). Its rarity is a word of the one ladder (`data/rarity.json`); one holder at a time (`unique`) is a flag apart
  from it and lifts no figure.
- **Game changers: share boosts** (order 95, D-192: "titles can be game changers. % boosts and stat boosts"). A title's
  `boost` effect (`{ type: 'boost', of, tag?, v }`) raises by a share the holder's fighting worth (`fight`, all or a
  weapon's family: `A.fighterFrom`'s `f.ttb`, added in `A.CR`, so every duel and the honest odds read it), a family's
  checks (`check`: `A.skillEff`, a share of the read), his post's yearly pay (`income`) or the experience he gains
  (`growth`: `A.gainXp`, a share more effort). Boosts are not priced in the budget and do not share the skills' caps: a
  pool of their own, stacked 1, 1/2, 1/4, 1/8, at most the cap of the rarest title among the sources: **basic 0.02,
  rare 0.05, epic 0.1, legendary 0.25, mythical 0.4** (`vocab.json` boost.cap, under the engine's ceiling `E.CAP_BOOST`); a
  title's own boosts of one kind at most its cap (validator). Measured (`ttGameChanger`, pairs at near-even odds): Blooded
  moves a duel's odds about 5 points, the Undefeated about 21, the Dragon Slayer about 45. Only titles boost: a skill's source
  has no boost cap.
- **The great beings.** The legends' and masters' titles moved here (`data/titles/legends.json`); their sheets name
  them by id and `A.POWER` reads each as the object it always was, with the same buffs: every level, power, profile and
  matchup is identical (`ttLegends`, and the powers tests unchanged). Some are born (`born`: a Primordial Archdemon is
  born one). The Dragon King's and the archdemons' titles carry firepower; *the Sword Saint* is a title and a class
  (`class`), which a person may one day earn when the old Saint is gone (`A.POWER.being(person).cls`).
- **What titles give others.** `social` effects add to `A.opinion` (the best group the viewer belongs to, at most +10);
  `reasons` give a decider reasons (`A.WHY.appointGeneral`: the soldiers follow an Undefeated captain).
- **The player sees** the title borne under his name ("Aldric the Undefeated"), a strip of chips (a gem and a name; a
  press opens its card: rarity, when and why in the world's words, what it gives in words, its honour), Records'
  "Titles" (held, with "Bear it"; and lost), the same chips on other people's profiles (without the deed), and a notable
  card when one is earned (`tt_earned`) or lost (`tt_lost`): a title is announced when it comes, never before.

## Deed sources (guarded calls beside each system's own record)

| Deed kinds | Where |
| --- | --- |
| `duel_won`, `duel_lost`, `champion_beaten`, `beast_slain`, `beast_above`, `dragon_slain` | `A.duelConsequences` (release `07-duels.js`, `TT.duel`): the player, and his foe when one of them wins |
| `beast_slain` and kin | `PW.resolve` (`9999970-powers/c-meet.core.js`): a beast killed outright |
| `wound_serious` | `A.addWound` (release `03-engine-base.js`): anyone, the wounds in `vocab.json` seriousWounds |
| `battle`, `battle_wounded` | the three places a soldier's battles are counted (release `09`, `10`, `11`) |
| `battle_won` | `A.LV.field` (`9999975-level`): the commanders of a field battle's winning divisions |
| `siege_held` | the siege tick (release `11-armies-...`): a siege given up after the place stood, for its county's holder and the player serving there |
| `treaty_made` | `A.on('warEnd')`: a war ended by terms, each side's ruler |
| `bribe_refused`, `bribe_taken`, `town_put_to_sword` | `A.eventChoose` (release `18-event-view-a.js`) through `vocab.json` choices (nine cards) |
| `faith_kept`, `faith_recanted` | this folder's `tt_faith` card |
| `tourney_won` | the release's deed line "Champion of ...", read each month |
| `king_made`, `pupil_taught` | none yet (Kingmaker and the Silver Sage wait for them; the validator lists them) |

## Files

| File | What |
| --- | --- |
| `a-titles.core.js` | `A.TT`: the data (`A.DATA.titles`), the watch index, the census, the ledger (`A.deedDone`), the predicates (`TT.met`), check, grant, earn, lose, the month and the year, the sources, the adapter's sources, social and reasons, the save step |
| `b-view.core.js` | What a title gives in words, the card's text, the chips (`UI.TTV.chips`, `PF.cardTitles`), Records' section, `ttBear` |
| `titles.events.js` | `tt_earned`, `tt_lost` (queued, notable), `tt_faith` (the cell) |
| `data/titles/vocab.json` | rarities, weights, budget, kinds, beings, effect types, social groups, predicates, deed kinds and their sources, the choice table, the deed lines, serious wounds, the strength words |
| `data/titles/people.json` | the sixteen titles a person may earn (§11.8's fifteen; the Sword Saint is in legends.json) |
| `data/titles/legends.json` | the great beings' titles (30), moved from `data/legends.json` and `data/power.json` |

## Edits outside this folder (guarded, commented)

- release `03-engine-base.js`: `A.stat` (`SK2.statOf`, capped), `A.opinion` (`TT.socialOf`), `A.addWound` (split into
  `A.addWoundNow` and the deed); `07-duels.js` `A.duelConsequences` (`TT.duel`, before `A.LV.duel`); `09`, `10`, `11`
  (`TT.battle`); `11-armies-...` the siege tick (`P.sgPk`, `TT.siegeLifted`); `18-event-view-a.js` `A.eventChoose`
  (`TT.chose`); `23-ui-e.js` `UI.personModal` (the chips).
- `37-skills2/c-effects.core.js`: `SK2.addSource`, `SK2.xHeld` read by `SK2.held`, the fast path `off(p)`, `SK2.statOf`;
  since D-192 `SK2.boostOf`, `SK2.boostCheck` and `f.ttb` in `SK2.fightOn` (the engine's `E.boostOn`, `E.CAP_BOOST`).
- D-192's readers of the share boosts: release `06-prison-travel-school-ai.js` `A.CR` (`f.ttb`), `03-engine-base.js`
  `A.skillEff` (`SK2.boostCheck`), `04-realms-and-war-years-b.js` a post's yearly pay (`SK2.boostOf(pc, 'income')`),
  `36-skills/a-model.core.js` `A.gainXp` (`SK2.boostOf(p, 'growth', k)`).
- `9999970-powers/a-power.core.js`: titles by id resolved from `data/titles/` (`PW.titleRef`); a person's being names
  his titles and class. `c-meet.core.js`: `TT.beastSlain`.
- `9999975-level/a-level.core.js` `LV.field`: `TT.field`; its `statMigrate` test reads a version-18 save's held level as held.
- `9999950-why/why.core.js` `W.appointGeneral`: `TT.reasons(p, 'appoint')`.
- `999996-profile-tab/profile.b-view.core.js` `PF.card`: `PF.cardTitles`.
- `99998-v2-saves/saves.core.js`: `SV.VER` 19, the step `titles`.

No `A.addStage`; no new wrapper.

## State (optional; old saves load)

`p.dl` (the ledger), `p.tt = { h, x, b, hd, dc, lw, gw }` (held, lost, borne, heard, deed lines read, the day of the last
serious wound, a grant refused), `A.S.tt = { u, first, pre }` (the census), `P.sgPk` (the most days a siege has stood).
Old saves: the step `titles` makes the census; nobody holds a title or a ledger on load; the ledger starts at the first
deed after it.

## Tests (`test.mjs`)

`ttEarned` (19 wins none, the 20th the Undefeated with its notable card and honour paid once, a loss takes it; five
bribes refused through the real card make the Unbought, one taken loses it for good; the choice table true to the cards;
a foe who beats the player counts it), `ttDeterministic` (two worlds, each life twice: the same ledgers, titles and
census; a world pass draws nothing), `ttUnique` (one Dragon Slayer of six slayers, the next on his death; First of the Age
once an age and never to the old masters; the Saint's title Cael's while he lives; the Sword of a realm one in each
realm; forty audited years, no key with two living holders), `ttCaps` (75 people with every title and a planted one past
any budget: +12, 15% and the titles' boosts 25% more, +10 and potential + 5, 3, 3; every read back once gone),
`ttGameChanger` (a basic title moves a near-even duel's odds a little, a legendary one markedly, a rare one
between; every boost at the rarest held title's cap with every title and a planted one, a basic one at 0.02; income and experience read
theirs), `ttMythical` (the five mythical beings read from the titles, their arts mythical, every other legend's, the ancient
demons' and dragons' legendary; an old save's Wyrm-Slayer moved to the Dragon Slayer's id), `ttNpc` (an NPC earns the Undefeated in a
real duel and loses it in one), `ttSave` (every sample save: no title, no ledger, an empty census, version 19; the first
deed starts the ledger), `ttPhone` (375 x 667: chips and Bear buttons 44 points, a press opens, a hover does not, no
condition, no percentage, nothing sideways), `ttLegends` (every sheet's titles from data; the three matchups),
`ttHidden` (no hints, order 92: no rumour card, no title carrying a hint, Records without "Things you have heard", another
man's title card naming no deed, the crown's withholding silent, and thirty years' pages showing no deed kind or condition).

Deferred: `ttRare` (pooled over 200 bot lives: a balance-harness run), the sources of `king_made` and `pupil_taught`,
monsters' own ledgers (a dragon's *Calamity of the Fens*), titles in a duel's or court's card ("Sir Rauf, called ...").
