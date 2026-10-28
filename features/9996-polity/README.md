# The Polity

**Aspect:** Diplomacy and politics (backtests "Priority design 1", `docs/research/backtests.md`) · **Kind:** system (five core files, no blob patch), 28 events, tests, a world bench

The realm already had a court of named people (56-realm-inside), tempers (20-ai-personality), debts (68-casus-belli) and the far realms' own powers (990-far-peoples). What it lacked was the machinery between them: who holds the shires, what the law says beyond taxes, authority and levies, who decides, how long a law takes to pass, what a lord owes, how a ruler is chosen where the throne is not inherited, and why a crown sits easy or not. This feature adds that machinery to every realm of the world, the Known World and the Great Continent alike, at the same fidelity.

## What it does

**Offices held by named people** (`a-polity.core.js`, `GD.POL_OFFICES`)

- Every market town of 66-markets is a shire. Each shire has a **governor**, a **magistrate** and a **reeve**. A border shire facing a hostile neighbour (at war with the realm, planning a war on it through 68's `csPlan`, or a foe of the last 30 years) has a **Warden of the March**. Port towns have a **collector of customs**. With the council's five seats that is 8 to 20 named office holders a realm.
- **Who may hold each:** governors come from the nobility or the host; reeves and collectors from the guilds or the gentry; magistrates from the lords under Lords' courts, and from lawyers, clerics and gentry under Royal courts. Under the written law a magistrate must be lettered.
- **Holders are people who exist.** They come from the realm's people, then the heads of its houses (named only when an office needs them). A person is made only when the realm has nobody of the right estate. A person may hold two offices of one realm (a governor who is also his shire's magistrate).
- Office names follow the realm's kind: a *Prefect* in an empire, a *Chief of a thousand* on the steppe, a *Hall-warden* in a dwarven hold, a *Temple steward* in a theocracy.
- **The officers' year.** A governor keeps 0–10% of the shire's tax, by his greed and honour (20's persona). A Treasurer's audit finds each grafting governor with a 30% chance and dismisses him. A new ruler sweeps out a third of the officers. Terms run out (reeves 6 years, collectors 4).

**The council meets** (`POL.TASKS`). Each of 56's five seats takes a task each year, chosen by its holder's want: the Chancellor courts an estate, drafts a law (the next bill starts one step ahead) or mends a neighbour; the Marshal drills the host, speeds the muster or keeps the peace; the Treasurer presses the taxes, audits the officials or funds works; the Spymaster watches the court, the estates or a realm; the Chaplain preaches obedience (+3 to legitimacy's mark), tends the poor or defends the faith. The holder's seat skill decides whether it lands. A player who holds a seat picks the task on the Politics view.

**Eight law groups** (`GD.POL_LAWS`, data). Taxes, crown authority and levies stay 56's (`r.laws`). Five are new (`r.pol.laws2`): obligations (Low, Medium, High), justice (Lords' courts, Royal courts, the written law), the commons (Bondage, Tenancy, Free hold), trade (Guild charters, Crown monopolies, Open markets) and faith (Established, Tolerant, Faith-led). Succession is shown, and stays the realm's government. Each position carries what each estate thinks of it, from −3 to +3. Each realm starts where its kind and government put it (merchant realms trade on open markets under the written law; steppe and mountain peoples hold their land free; empires keep the written law and high obligations; kingdoms vary by a hash of their id), and that start is its custom. 56's pushes for these laws (`po_<group>_<position>`) are new entries in `RI.PUSH`, weighed by the voices' wants and fears, their estates and their seats, and pulled home by custom as 56's taxes are.

**Bills** (`b-bills.core.js`, Victoria 3's enactment). A law no longer changes at once. 56's loudest push at the New Year court opens a bill (`RI.session` is replaced from this folder), and so do an angry estate's petition, a ruler's or councillor's proposal, and the player. One bill at a time. Every 60 days a count: pass, advance, stall or debate, for at most six counts. Three stalls, or six counts without a pass, and it fails.

- **Calibration.** The chance a bill passes within its 360 days is 56's one-shot odds for the same push (`RI.odds`), times 0.9 + 0.2 × legitimacy/100. The pass chance at each count is solved for that target from the stall and debate chances, which come from the balance of support against opposition, `m = (S − O)/(S + O + 0.01)`: debate `0.08 + 0.12(1 − |m|)`, stall `clamp(0.20 − 0.15m, 0.05, 0.40)`. S and O are 56's court voices plus each estate's clout times its gain or loss.
- **A debate** moves the balance: a scene (`po_debate`) for a player who rules or sits on the council, a throw weighted by the estates elsewhere. Each 0.1 of balance moves the target by 0.045.
- **Passing** changes the law, moves the houses as 56's laws do, and gives each estate that gains +2 approval and each that loses −2. 56's court record names who brought it and why; 20's decisions log has it too.

**The estates** (`POL.estState`; EU4's estates, Victoria 3's interest groups). Nobility, clergy, guilds, commons and the host. Their **clout** (summing to 1) comes from the houses' share of the swords and crown authority (nobility); great works and the faith law (clergy, ×1.8 in a theocracy); towns, ports, trade pacts and the trade law (guilds, ×1.7 in a council realm); unrest and the commons law (commons, ×2 while a revolt is armed); the standing army's share and war (the host). Their **approval** (−10 to +10) is the sum of the law positions' marks, +1 a council seat its members hold (at most +3), events that fade by 1 a year, and its own reading: the commons −1 for each 0.25 the price of bread stands above its base, the host −2 a war lost lately and +2 for a war won, the clergy +1 for a great work in the last 8 years.

- **Loyal (+5 or more):** it lends the crown legitimacy, and a loyal nobility weakens factions against the crown.
- **Angry (−5 or less):** each angry estate adds 0.1 × its clout to the power of the factions its members join (`A.factionPower` is wrapped, no patch). With clout 0.2 or more its leader petitions for the law it wants most: a bill in an AI realm, a scene (`po_petition`) for a ruling player.
- Names follow 990's powers (the far realms' liberty and war factions) and the realm's kind ("the clan-mothers", "the counting houses", "the high temple").
- **The player's estate** comes from their path (noble, cleric, merchant or master, officer of rank 4+, otherwise commons). When it is angry, its leader comes for the player's name (`po_estate_meets`, an NPC move).

**Vassal contracts** (CK3). Every landed house holds `h.contract` from the realm's obligations law: a tax share of 5, 10 or 15% of its rents, a levy of ×0.75, ×1 or ×1.25, and rights (a council seat, its towns' tolls, walls without leave, private war, no forfeiture without trial). The player's tenth on rents in 56's purse now follows their oath (`RI.taxes` is wrapped; Medium is 56's tenth, so nothing moves for a Medium oath). A ruling player changes oaths from the great lords' card: lowering a step gains 10 with that house; raising one is free when the house head owes the crown a favour (the favour is spent), and otherwise it is tyranny, −15 with the house and −3 with every landed house, once a year. Granting a right gains 15 and weighs 0.1 on the next authority bill. A lord's oath is called in when the realm goes to war (`po_muster`: send the men, pay scutage, or refuse; a second refusal in ten years brings `po_revoke`), raised by a greedy crown (`po_raise_oath`), and bargained with a favour (`po_oath_right`).

**Elections with named votes** (`c-elect.core.js`, the HRE's prince-electors). Wherever a realm is elective, council or theocracy, `A.electRuler`'s pick is replaced by a vote (no patch: the function is wrapped). Electors: the heads of the seven strongest houses (elective); the council, the reeves and the collectors, nine at most (council); seven senior clergy (theocracy). At most four candidates, everyone `A.electable` allows, ranked by renown, and the player when eligible. An elector scores each candidate by opinion, +15 a shared estate, +10 a shared faction, renown/4, +10 a promise, gifts (+10, +5, +2), −20 for a promise broken to them, −15 for a feud (55's ledger); they vote for the top score, a tie going to the elder candidate, so the count draws no dice. A majority wins; otherwise a second round between the top two; if that is split too, the strongest loser's house gets +0.2 claimant power for five years. Every vote is named in the news. A council realm also elects every eight years. The season opens a year ahead (the ruler past 65, or the term ending): a candidate player can visit, promise (a favour they then owe; unpaid two years after winning, it is broken: −30 with the elector and the epithet "Oath-breaker"), give gifts, slander a rival or stand aside for one (who then owes them); an elector player is courted by candidates (`po_courted_*`, NPC moves on 21's budget) and casts their vote from the view.

**Legitimacy with parts** (`POL.legitParts`). The release's `r.legit` now drifts a fifth of the way each New Year to a mark that is the sum of: how the ruler came (heir by law 60, elected 65, named by council 55, claimant 30, conquest 25), years on the throne (+1, at most +15), renown (fame/10, at most +10), the estates in government (Σ approval × clout × 2 over the estates with a council seat), custom (+1 a law at its custom, −2 a law two or more steps off), wars lost in five years (−5 each), famine (−5), and the Chaplain's sermon (+3). The release's own edits stay as shocks that drift back. The tooltip lists every part.

**The player** (`d-player.core.js`). "Your place" on the Politics view: your estate, your offices and their pay, your oath, your promises, and the offices you could seek. Seeking costs 1 initiative; the appointer (the crown, the Chancellor for magistrates, the Marshal for wardens, the Treasurer for reeves) weighs opinion + half the office's skill + 10 a favour owed + gifts + renown against the strongest rival's, and the odds are shown. Collectorships are sold for two years' pay. An office brings one scene a year (`po_graft`, `po_tolls`, four `po_case_*` verdicts with estate stakes, `po_march_raid`, `po_customs`), and its pay at the New Year in 56's money book. When the player's home passes to another crown at a peace, `po_new_crown` offers to swear, to leave (holdings in the lost province sold at half), or to stay and not kneel (`po_resist`).

**The Politics view** (`e-view.core.js`). For a ruler, the first button of the Realm tab; for anyone else in a realm, under the court ("Show the politics of …"). Cards, stacked on a phone: the crown (legitimacy and its mark, the heir or the next election, the last vote); the bill (six notches with their glyphs ✓ → ‖ ⁇, the estates for and against with their weights, the next count's date and the odds of each outcome; proposals for rulers and councillors); the election (candidates, electors and their leanings, exact with a Spymaster watching the estates or insight 60); the council and its tasks; the estates (clout, approval, leader; the eight laws as chips, marked where they stand off custom); factions (a meter of power against the 40% line, discontent, the demand, "at this pace, demands in about 14 months", members, join); the great lords and their oaths (rulers); offices by shire; your place. Every number has a 59 tooltip (`poLegit`, `poEst`, `poBill`, `poFac`, `poSeek`, `poVote`, `poOffice`). 996's strip carries the bill's next count and the election.

## Measured by

`test.mjs` (fill in from the latest run; see "Numbers" below):

| Test | What it checks |
| --- | --- |
| `poOfficesFilled` | two Known World worlds and one Great Continent world: every office has a living holder of an estate its law allows; fewer than 5% of holders were made new |
| `poBillOdds` | 1,000 courts drawn from a real world's court states (treasury, debt and legitimacy varied): the pass rate within 360 days is within 5 points of 56's one-shot odds; debates come more often when \|m\| < 0.2 |
| `poBillTrack` | a player's bill: the next count's four odds sum to 100%, six notches drawn, the view draws purely, a count is logged |
| `poElectionDeterministic` | the same seed gives the same votes; every vote is named; a winner who broke promises to four electors loses |
| `poContractHook` | a raise with a favour owed costs no opinion and spends it; without, −15 and −3; a second tyrannical change in a year is refused |
| `poHomeCeded` | a transfer of the player's home queues `po_new_crown`; each of its three ways does what it says |
| `poLegitParts` | the parts sum to the mark; a New Year moves legitimacy a fifth of the gap |
| `poPure` | the view draws purely for a ruler and for a lord, escapes names, and has no sideways scroll at 390 px |
| `poScenesRender` | every `po_` scene renders without a raw token, at 80 words or fewer |

`bench.mjs` plays whole worlds and reads the target table (laws changed, changes outside tax and authority, elections with recorded votes, taxes at an extreme, hoarding flags, civil wars, offices): `node features/9996-polity/bench.mjs --html=… --seeds=10 --years=100 [--lands=great]`.

## Numbers

(See the lane report for the runs made while building; the integrator's 10 × 100 run belongs here.)

## Rules kept

- **No blob patch.** `RI.session`, `RI.stance`, `RI.odds`, `RI.applyLaw`, `RI.taxes`, `A.factionPower`, `A.factionsYear`, `A.electRuler`, `A.applyFx`, `UI.TAB.realm` and `UI.COMING.items` are wrapped from this folder (it sorts after 56, 20, 39, 68 and 996). The province transfer is read from the release's own `provTransfer` event.
- **Determinism.** Engine paths draw dice with `A.chance`, `A.rf`, `A.ri`; the count of an election draws none. Views, tooltips and the strip only read (`poPure`, `poBillTrack`).
- **Old saves.** Every field is optional: `r.pol` fills at the next New Year (offices, contracts, tasks, estates), `h.contract` with it, `pc.pol` on first use. Saves of either world load as written.
- **Security.** Every value goes through `UI.esc`; actions use `data-a` (`poPropose`, `poVoice`, `poSeek`, `poTask`, `poOath`, `poElect`, `poJoin`, `poTab`).
- **New effect keys** are declared in `FX_EXTRA`: `poBill`, `poPet`, `poOff`, `poMuster`, `poOath`, `poCrown`, `poCase`, `poGraft`, `poEst`, `poVote`, `poToll`, `poMarch`, `poCustoms`. Condition helpers `C.estate(p, k)` and `C.holds(p, kind)` are added to `A.C`.

## Limits

- The Known World changes: it is the same Polity everywhere, so a Known World seed no longer plays as it did before this feature (laws now pass as bills, legitimacy drifts, council realms vote on a term).
- Succession laws are shown, not changed by bills. Reeves are named, not elected by their towns. Fiefs by vote (Bannerlord) and the 1106 Spear-Marshal election as a seeded event are not built. The council sits once a year, not on quarter days.
