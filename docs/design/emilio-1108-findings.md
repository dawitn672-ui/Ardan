# The owner's Emilio life (1105 to 1108): what it shows

Source: the owner's save `ardan_Emilio_1108.ardan` (alpha 15, save version 15, sent 2026-11-25, "my next most played
life"; kept out of the repo). Emilio Corvane, born 1083, starts in 1105 at 22 as a son of House Corvane in Solenne
(the Holy See), talents: diplomacy S; etiquette, sword and command A; stewardship and athletics B. At the save, 25,
an outlaw in Aldmark, Swordsmanship level 21 of 35 (diplomacy 15, command 11).

What happened, in order: Squad Captain of heavy cavalry at 22; seeks the Chancellor's seat; a friend made at a tourney;
a breakthrough in sword; tries to kill the new High Luminary, fails, five years in prison; she dies anyway, he is
sentenced to hang, escapes to Aldmark; challenges, loses to, and tries twice in a month to murder a man there; pays a
blood-price; repeats it with a second person, is declared outlaw twice; writes a book on swordsmanship that "changed"
a reader's life. His tourney friend becomes High Luminary.

## Findings (Phase 1 fixes; each gets a test)

| # | What the save shows | Why it is wrong | Kind |
|---|---|---|---|
| E1 | `prison: {until 1111, since 1106}` stays after the escape; in 1107 "In the cells, you fight or you starve" and a cell fight fire while he is free in Aldmark | An escape does not clear the prison record, so prison cards keep firing | State bug |
| E2 | In the months he is in a cell he sells his hauberk, hurts himself in training and his old superior "wants good work" of him | Activities and duty cards are not gated by prison | State bug |
| E3 | Lines within a month run backwards: "Livia survives your attempt… imprisoned… Your attempt on Livia's life fails" | The month's log is written consequence first | Log order |
| E4 | "(+0.6 Swordsmanship: 43 → 44, Trained)", "+0.8: 45 → 45", "68% of it from doing" | Numbers and a percentage shown to the player; a gain that moves nothing | House rule (no percentages), display |
| E5 | Attempts on a reigning High Luminary: five years' prison; murder attempts on Aldwin twice in one month, then again; on Ysolde twice; "declared outlaw" twice while already one; "anyone may kill you" and nobody tries | Murder is retryable at no real cost; the outlaw state has no teeth; attempting a sovereign's life is not treated as treason | Exploit, reason rule |
| E6 | A 22-year-old new officer seeks the Chancellor's seat; the petition "Do more. Then ask." three times | Asks far above station are offered; the same refusal repeats | Reason rule, repeats |
| E7 | Squad Captain of heavy cavalry, then "You take service with the line. Shield wall and pike block" | The branch text contradicts the post | Coherency |
| E8 | A book on swordsmanship at 23, at "Trained", sells and "changed his life" | Authorship asks no mastery | Too easy |
| E9 | Struck from the rolls, outlawed and abroad, he is still `status: noble`, his aim "Stand in a battle line and live" stands, and his old messmate is his "superior" | Leaving a post, exile and outlawry do not reach status, aims and superiors | One holder per post, coherency |
| E10 | His friend of one tourney, one of "the young of three houses", becomes High Luminary within a year | Succession to an elected sacred throne picks an unlikely young man; check the reason it records | Reason rule (check) |

E5 and E8 join the exploits list of section 8 (A2). E1, E2 and E9 come first: they corrupt state.

## Where each stands (2026-11-25)

The save was begun on an older build: its log holds the pre-S1 training lines ("Cutting drills… +0.6 Swordsmanship:
43 → 44, Trained") and the old rank names ("Squad Captain"), which today's code no longer writes. Each finding was checked
against today's code before it was fixed.

| # | Verdict | Where |
|---|---|---|
| E1 | **Fixed:** `A.exile` empties the cell | test `pfExileFreesCell` |
| E2 | **Fixed:** the training injury needs a plan and no cell | `pfNoTrainingHurtInCell` |
| E3 | **Fixed:** a card's result line is logged before its effects' lines | `pfResultBeforeEffects` |
| E4 | **Ruled out for today's build:** those lines came from the older build; today's practice writes words, and the page words the season's "of it from doing" line (checked by rendering both on the Life tab) | |
| E5 | **Fixed:** one attempt on a life a year; none from a cell; the survivor keeps a guard against you for five years; an outlaw is not declared outlaw twice (the unpaid price is recorded as `flags.outlawDebt`); the release's own path calls an attempt on the crown treason (the crown-crimes feature already holds an inquest) | `pfMurderHasCosts` |
| E5b | **Partly there:** outlaws do meet hunters ("Hunted", "A price on your head"; none came in his two years); their odds do not yet grow with the unpaid price or the victims' kin. Open, with the reason rule (A.WHY) | Phase 1 |
| E6 | **Partly reasoned:** his mother held the Chancellor's seat, so seeking it had a reason; the refusal of a petition now names what was short instead of repeating "Do more. Then ask." | |
| E7 | **Ruled out for today's build:** the "line" text and "Squad Captain" are the older build's | |
| E8 | **Fixed:** a treatise asks Expert and age 28 or more; the weak outcome no longer flatters | `pfTreatiseAsksMastery` |
| E9 | **Fixed** for the superior (a former superior is no longer your master when you hold no post); status stays noble by birth, as it should | `pfNoSuperiorWithoutPost` |
| E10 | **Open:** check the reason the High Luminary's election records | Phase 1, with the A.WHY audit |
