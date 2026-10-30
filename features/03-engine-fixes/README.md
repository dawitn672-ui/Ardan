# Engine fixes

**Aspect:** Character and life sim · **Kind:** fix (applied in every build)

Rule bugs in traits, duels, the training plan and noble actions.

## Patches

| Patch | Why |
| --- | --- |
| `ENG-TRAIT-OPP` | Children copied parent traits without checking opposites: 12.4% of children of a brave and a craven parent were both. |
| `ENG-DUEL-TECH` | NPC techniques: aiTech picked a technique that did not match the announced action 25% of the time; such a technique can never be used, yet duelAct spent its use before noticing, after the read hint had already named it to the player. Now the NPC only plans techniques that fit its action, and a use is spent only when the technique is actually used. |
| `ENG-DUEL-DOUBLE-KO` | When both fighters dropped to 0 HP in the same exchange the player always won, because the foe was checked first. Now the one further below zero (as a share of max HP) loses; an exact tie is a coin flip. |
| `ENG-PLAN-FOLLOWS-LIFE` | The automatic training plan was filled once and never revisited, so the "athletics" a child gets at 6 stayed for life (every bot life maxed athletics and learning by 30). The plan now remembers what it chose automatically and moves on (to the troop weapon, the trade skill, or melee) until the player picks something; a player choice is never overridden. Old saves: only a stale childhood "athletics" is treated as automatic. |
| `ENG-NOBLE-AGE` | A newborn noble could attend court ("You shine at court"), petition the crown, seek a council seat and ride the estate ("You ride your lands, hear the reeves, fix the mill") — nobleAction had no age check. These need an adult now; the court tab still shows them, and says why. |
| `ENG-EVENT-TEXT-GUARD` | eventView caught a throwing setup (the event is dropped) but not a throwing text, so one bad text function froze the game on the event screen. Seen in a bot life: `pl_royal_wedding_guest` reads `A.realm(p.realm).capital`, and about twenty other release texts read `A.realm(p.realm)` unguarded. A text that throws now drops the event the same way a setup does. |
| `ENG-COIN-FINITE` | The coin effect took any number, and NaN is a number: a scene whose payout was never worked out (its setup failed, and something resolved it anyway) set the player's purse to NaN for the rest of the life. Found by the exploit test (`ni_deal_profit` after a failed setup). A coin effect that is not a finite number now counts as nothing. |
| `ENG-DEATH-CAUSE` | A death right after a hurt was put down to a natural cause: gored by the Hell Boar at 16, the obituary said "marsh fever". `mortalCheck` calls a death from long-gone health natural when the last hurt is over 40 days old, but the release stamps the day of a hurt only on its daily tick, and a duel, beast, battle, mission or event that drops health to 0 calls `mortalCheck` before that tick, so it read an older hurt's day (all 7 deaths logged in 12 Varenna bot lives). The tick now notes the health it saw: a named hurt that took health from above 0 since then is today's. An event's health loss with no cause of its own keeps the old name, so for it the release's rule stands, unless the name is new since the tick. Old saves without the new fields keep the release's behaviour. |

## Tests

`engineRules`, `deathNamesTheHurt` and the others in `test.mjs`. Run them with `node tests/run.mjs --features=engine-fixes`.

## Cycle 2: a revolt that wins founds a realm (`rebels.core.js`; world review B2)

The release marks a revolt's new realm `isRebel` and clears the mark only by folding the realm back into its parent. About fifty places skip rebel realms (diplomacy, alliances, politics and the AI's war checks). A revolt that won or made a white peace so left a frozen, friendless shell: the Hall of Valdhall kept one income for 80 years and fell to legitimacy 0.

**Now.** When a war ends (`A.on('warEnd')`), a rebel realm that fought in it, still stands and is at war with no one becomes a realm of its own:
- `isRebel` is cleared and `isNew` set;
- `r.foundedFrom` and `r.founded` record where and when;
- legitimacy is at least 45, stability at least 40;
- it keeps the ten-year truce the release's war end gives it with its parent;
- the news says so.

A rebel realm at war with no one in an old save is cleared at its next month. Test `revoltFounds`.
