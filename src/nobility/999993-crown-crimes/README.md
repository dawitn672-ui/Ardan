# 999993-crown-crimes: crimes against a crown, and their reasons

**Aspect:** the playtest (owner order 54, P3; D-062 addendum), under the rule "not a single thing in this world happens
outside of reason" · **Kind:** one readable core file (`crown.core.js`), three trigger-only cards (`crown.events.js`,
prefix `cc_`), tests; one line in `src/people/39-schemes/schemes.core.js` (a scheme that kills a king goes through here).

**Why.** The owner: "i attempted murder on a monarch 100s of times and was never once executed. if i asked forgiveness
they forgave me no matter how much they hated me prior. i murdered countless monarchs with zero consequence as it never
happened." The release's murder (`A.INT_FN.murder`) was one roll from anywhere, "someone saw" a flat coin, the sentence a
commoner's (a blood-price or the cells), the apology a coin toss (`A.INT_FN.apologize`, 50%), and nothing in the realm
answered a king's death but the succession line in the news.

## What it does (for a reigning ruler; anyone else's murder is the release's)

| Step | Rule (each names its reason) |
| --- | --- |
| **Reach** (`A.CROWN.reach`) | his kin; a post at his court; a noble of his realm; rank 3 or more in his army; service in great houses; a crowned head; or his favour (opinion 20+). Otherwise the attempt is refused and nothing is spent. |
| **The attempt** | intrigue + stealth + half your wits against 180 + 40 a level of guard (doubled after each attempt, falling a level every two years) + half his spymaster's intrigue + 30 if he is paranoid. Honour −20. |
| **Discovery** (its own roll) | the guard on the stair (a failed attempt), a servant, the doubled guard, his spymaster's trail, his paranoia, how often you were seen near him before (suspicion), less your stealth and intrigue. The largest part is the reason given. |
| **The record** | `A.S.crown.rec`: who, whom, how you came near, attempt or regicide, known (year), the verdict and its reason. Also the guard levels, suspicion and bounties. A found attempt sets his opinion of you to −100, makes you enemies, and is in the chronicle. |
| **The sentence** (`A.CROWN.verdict`) | Regicide: death ("treason in any law"), unless the new king is your kin (exile) or the ambitious heir who owes his crown to your knife (exile, and a purse). An attempt: his kin go into exile; cruel = death, slowly; wrathful or vengeful = death; forgiving or kind and he liked you (40+) = a pardon, once; greedy and you are rich = a ransom; forgiving or kind = 10 to 18 years; the elves' Moot = exile and outlawry; the Law-Carvers = walled out in winter; pirates = marooned; eastern law and the Book of Wells = the hand and the cells; calm, patient or content = 12 to 20 years; otherwise death for treason. A foreign prince's knife is answered by war (or a broken alliance, by the judge's temper). |
| **The block** (`cc_scaffold`) | plead (the judge's mercy decides, none from the cruel, the vengeful, the wrathful or a son for his father; small for the rest), break for the gate (hard: a royal guard), or go to it with your head up. Death is real. |
| **Forgiveness** (`A.INT_FN.apologize`, every apology) | odds from his opinion, his nature (forgiving, kind, calm; vengeful, wrathful, proud, stubborn), the gravity of what the court knows you did (an attempt on him, the murder of his kin), the gifts you have given him since (`r.ccGifts`), and how often you have begged in three years. A hatred that deep after an attempt is not talked away. The answer says why. |
| **A murdered king** | `A.kill` runs the succession (`A.rulerDies`, the house resolver, `A.POSTS`). The realm loses 12 stability and its factions grow angrier; the chronicle says he was murdered. An unknown hand is hunted by an inquiry for two years (his spymaster, your suspicion, your stealth). Once known: his spouse, children, brothers and sisters and parents swear vengeance, a price is set on your head (from the treasury), and if you are in his realm the new ruler sentences you. |
| **The price on your head** (`cc_avenger`) | at most once a year, likelier in his realm: one of his grown kin comes, or a hired blade. Fight, run, or pay him off (others will come). |

No percentages are shown; the reasons are words. All rolls are `A.chance` / `A.ri` in engine paths.

## State

`A.S.crown = { rec, guard, sus, bounty }`, made when first needed (an old save has none). On people: `pc.flags.ccSorry`
(apologies), `rel.ccGifts` (gifts given since).

## Tests (`test.mjs`)

`ccReach`, `ccAttempts` (found out, hated, sentenced, executed; the verdict by the judge's nature), `ccRegicide` (dead,
succeeded, the realm shaken, kin vengeance, a price, the sentence; the inquiry solves hidden murders), `ccForgive`.
