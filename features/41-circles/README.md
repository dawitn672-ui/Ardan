# Circles

**Aspect:** Relationships (Road to Ten, Relationships 6) · **Kind:** system plus 3 events

The plan asks to "add groups: friend circles, cliques in your unit or guild. A friend of your enemy starts cooler toward you." In the release, the people you know barely know each other. In two bot lives at 36, each player knew 17–19 people. Those people had 3–5 close ties among themselves, and only 2 led to someone else the player knew. So nobody arrives as anyone's friend, and what you do to one person stays with that person.

**What it does.**

- **Circles form.** A new acquaintance is already close to someone you know two times in five (`A.CIRCLES.TIE`). Like finds like:
  - someone you meet as a friend is three times as likely to come through one of your friends;
  - someone you meet as a foe is four times as likely to come through one of your foes.
- **First impressions follow the circle.**
  - Each friend of yours in their circle warms them by 8, up to 16.
  - Each foe of yours cools them by 12, up to 24.
  - Your own first opinion moves half as far.

  The person view says why: "Circle: close to Thurstan (your foe)". Meeting your foe's friend can bring a scene (`cir_foes_friend`, at most every 4 years): win them over anyway, ask them to carry a word of peace to your foe, or keep your distance.
- **Word gets around.** When your opinion of someone moves by 10 or more, through an insult, a gift or an event, each of their close friends who knows you moves a third as far. A large harm (20 or more) is noted in the story log, and can bring a scene (`cir_word`, at most every 3 years): make it right, tell your side first, or let them talk.
- **Cliques.** Three of your comrades keep their own fire, or three regulars keep the corner table of your street (`cir_clique`). You can:
  - sit down with them: they become friends with each other, and warmer to you;
  - try to run the table (a check);
  - keep your own fire.
- **Effect key.** `circle` is declared for the linter (`A.FX_EXTRA`): join, lead, apart, soothe, mend.

**Measured by** (`test.mjs`).

- `firstImpressions`: against a plain stranger, a friend of your friend starts +8 toward you and a friend of your foe −12. The scene is queued, and the person view names the foe.
- `wordGetsAround`: an opinion change of −5 reaches nobody. A change of −30 moves each of the victim's three friends by −10, and the scene is queued. Telling your side first brings them back to −4.
- `cliqueForms`: joining makes the three friends with each other and +15 warmer to you.
- `circlesInRealLives`: the same three 20-year bot lives with circles off and on. The share of the people you know who are close to someone else you know goes from 0% (0 of 17) to 21% (4 of 19).
- `circlesOnScreen`: the circle line is escaped, and drawing it draws no random number and changes no state.

The events pass `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

**Rules kept.**
- `pc.rel[id].circ`, `pc.clique` and `S.cirNext` are optional, so old saves load.
- The ripple runs once per opinion change and never on its own changes.

**Limits.**
- **Only around you.** Circles form when you meet people, and word travels only about what you did. NPCs' quarrels with each other do not spread.
- **Cliques are small.** A clique is three people, with no name and no aims of its own.
