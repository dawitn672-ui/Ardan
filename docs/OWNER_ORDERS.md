# The owner's standing orders

Every instruction the owner has given that still holds, in one place, so no session makes them repeat it. Read at the
start of every session (CLAUDE.md points here). Add new orders at the bottom of their section with the date; when an
order is replaced, strike it through and say by what.

## How to work
1. **Read before starting:** CLAUDE.md, the end of docs/HISTORY.md, docs/DECISIONS.md, docs/V2_SPEC.md, this file, the skills. (Nov 12) · recorded 2026-11-12 00:44 ET
2. **Plan first, then exceed the ask.** Research, build or improve skills, troubleshoot with your own judgment instead of stopping. (Nov 12) · recorded 2026-11-12 00:44 ET
3. **Rebuild freely**, any tools or languages, as long as the goal is clear. (Nov 12) · recorded 2026-11-12 00:44 ET
4. **Never throw work away:** retired code goes to archive/ with a note; record the last commit that had it. (Nov 12) · recorded 2026-11-12 00:44 ET
5. **Record everything:** append-only docs/HISTORY.md per step, docs/DECISIONS.md, docs/IDEAS.md, CHANGELOG.md; update CLAUDE.md and the skills when they change. (Nov 12) · recorded 2026-11-12 00:44 ET
6. **Milestones:** a release branch `release/<name>` (tags are refused by the git proxy) and sample saves in tests/saves that must keep loading. (Nov 12) · recorded 2026-11-12 00:44 ET
7. **After each step:** tests, coherency checks, a playtest pass (scripted, then a playtester agent), fix what they find, then tell the owner what changed and what to test. (Nov 12) · recorded 2026-11-12 00:44 ET
8. **Honest ETAs, padded for at least one extra CI round;** give a playable build early rather than waiting for green. (Nov 6) · recorded 2026-11-12 00:44 ET
9. **CI:** `[skip ci]` on intermediate pushes while a run is going; never an empty commit to kick CI. One full CI run per finished step, not per commit. (Nov 6, Nov 12) · recorded 2026-11-12 00:44 ET
10. **Branch deletion is left to the owner.** (Nov 6) · recorded 2026-11-12 00:44 ET
11. ~~**Pause after the critique:** once docs/CRITIQUE.md is done, stop all work and wait for the owner's review.~~ Done; **superseded by order 17**, 2026-11-12 06:49 ET. (Nov 12) · recorded 2026-11-12 00:44 ET
    - ~~**PAUSE IN FORCE (2026-11-13 19:23 ET, order 36):** once the ten legendary weapon designs are shown to the owner, start no new step until the owner says to go on. Work already running may finish and be kept; nothing new begins.~~ **Lifted 2026-11-14 00:23 ET by order 53.**
12. **Token efficiency by any means, with the game's goals in mind; full discretion over model and effort** (the Nov 12 model table, docs/DECISIONS.md D-009, is guidance, not a rule). See D-010. (Nov 12) · recorded 2026-11-12 00:44 ET
13. **Don't make the owner repeat instructions:** save them here. (Nov 12) · recorded 2026-11-12 00:44 ET
14. **Any outside tool or AI is allowed** (web search, web pages, ChatGPT, Codex, anything) where it makes the work cheaper or better. **Everything it produces goes back into the repo, fully structured** (data in `data/`, research in `docs/research/`, code in `src/`, with a HISTORY entry naming the source). Outside AIs that need an account are reached through their API with a key the owner saves via the secure credential form; none is set up yet. (Nov 12) · recorded 2026-11-12 00:47 ET
15. **Time-stamp every entry** in the repo's memory (orders, decisions, history, critique, research, ideas) with the date and US East Coast time (New York/Maryland, written `ET`) it was recorded (changed from UTC 2026-11-12 06:49 ET; older UTC stamps converted), so it is clear which matters more and which is out of date; when an entry is replaced, mark the old one `superseded by <id>, <stamp>` and the new one `supersedes <id>`. · recorded 2026-11-12 06:11 ET
16. **Auto-resume after limits, even when the owner is away:** a scheduled task ("Ardan auto-resume after limits", id `trig_01Brt9jMjwCyjDebRAxoZpfc`, hourly at :12 into this session) resumes agents stopped by a usage limit or restart, pushes stray work and checks PR #2's CI; it never starts new steps while a pause is in force and stays silent when nothing changed. If the session is replaced, recreate it. · recorded 2026-11-12 06:12 ET
17. **Continue with the structure according to plan:** the owner reviewed the critique and answered its decisions (DECISIONS D-011 to D-014); work follows docs/CRITIQUE.md §2 in order. · recorded 2026-11-12 06:49 ET
18. **Many more names:** the name pools must be large enough to name whole kingdoms, and then noticeably larger again. · recorded 2026-11-12 06:49 ET
19. **Model versions:** whenever Fable is used it must be **Fable 5.2** (`claude-fable-5-2`); whenever Opus is used it must be **Opus 5.5** (`claude-opus-5-5`). The Agent tool's `fable` and `opus` choices map to exactly these (the API errors of Nov 12 name `claude-fable-5-2` and `claude-opus-5-5`); check the model named in any agent's error or report, and stop and tell the owner if it ever differs. · recorded 2026-11-12 10:53 ET
20. **Queued: a naming pass (work item X6).** Go through the whole repo and rename folders, files, docs, scripts, tests and branches with clear, self-explanatory titles so it is much easier to navigate. Done with `git mv` (history kept), keeping every feature's build order (the numeric prefixes and their order stay), with a redirect table in `docs/NAMES.md` from old name to new. ~~Scheduled right after X1~~ **Moved to immediate priority by the owner (2026-11-12 11:17 ET), so the repo is easy to navigate now.** · recorded 2026-11-12 10:57 ET
21. **Keep `docs/PROGRESS.md` current:** tick every work item the moment it is merged and green (stamp and commit), so progress is always visible at a glance. · recorded 2026-11-12 11:17 ET
22. **Every finished step is a new version, organised and tracked:** `node tools/version.mjs new` (row in docs/VERSIONS.md), a CHANGELOG section, a pushed `release/<version>` branch, a line in docs/PROGRESS.md "Versions", a sample save in tests/saves; pre-releases `v2.1.0-alpha.N` until a milestone. · recorded 2026-11-12 11:20 ET
23. ~~**Pause for review after the character demos:** once the C8 demo sheets are done (faces, ages, scars, builds, hair, outfits), stop starting new work, finish and merge only what is already running, show the owner the demos, and wait for the owner's review.~~ Done: the owner reviewed and chose the 2D style (2026-11-12 17:05 ET, D-024) · recorded 2026-11-12 11:44 ET
24. **Characters in a detailed 2D illustrated style** (D-024): a layered library of designer-drawn parts; show the owner a new demo before building it into the game. · recorded 2026-11-12 17:05 ET
25. **Tone-led finish; the look of Pick Me Up's character profile cards** (D-029): painted, semi-realistic webtoon portraits where soft shading carries the form (not ink outlines), shown on a profile card. Take the *look* only, never its characters, art or card design. An outside image AI may be used for reference sheets where it is needed (key through the secure form only). · recorded 2026-11-13 02:00 ET
26. **The reference picture** (`docs/design/reference/owner-ref-1-lineup.png`): "holds the core concept of what I'm looking for but should obviously be tailored to the game": full-body manhwa-style figures, clean lines under soft shading, in Ardan's medieval dress (D-029). · recorded 2026-11-13 02:10 ET
27. **The medieval reference** (`docs/design/reference/owner-ref-2-medieval.png`): "fully representing each individual armor and clothing": every person's armour and dress drawn in full, distinct, reading their station (D-029). · recorded 2026-11-13 02:25 ET
28. **A much bigger economy:** "a significant increase in the economic system, bigger markets simulating themselves as time goes on" (work item E1). · recorded 2026-11-13 02:25 ET
29. **Hundreds of weapons and unique items:** "100s of new swords and other weapons of different qualities; items unique to only one person" (work item E2). · recorded 2026-11-13 02:25 ET
30. **Far more face and build options:** "face and build design should have significantly more options too" (C8). · recorded 2026-11-13 02:25 ET
31. **The economy and armoury, the owner's answers** (D-032): markets as realistic as possible; 40+ goods, real goods a person would use, not only materials; merchants are met by standing (a duke summons one in days, a baron waits longer, a nameless commoner cannot seek them); income follows the economy only through what you actually make and sell; money as deep as realism needs; items have a rarity (common, rare, epic, legendary) and, separately, a quality of make; armour drawn in every piece; legendary pieces are heirlooms and national treasures of very high durability that overpower ordinary gear. "Keep in mind what would be more realistic but fun for a user at all times." · recorded 2026-11-13 06:21 ET
32. **Growth in depth: stats, skills, fighting styles** (D-034): more stats, each clearly defined (what it does, how it rises and falls, its limits); skills both passive and active that change how a character grows or give a stat boost or a penalty, in their hundreds to thousands, for every route a player may take, in extreme depth; proficiencies merged into skills with levels that evolve and merge; fighting styles in their hundreds: each nation's standard military training per regiment, with its tactics; great and knightly families' own taught styles; elite orders' own styles; some weaker than the standard, some far beyond it. Legendary weapons each get a unique design, far finer to look at than other weapons. · recorded 2026-11-13 07:18 ET
33. **Gate 2 approved; a Profile tab** (D-035): "I am extremely impressed with the profile cards… this looks amazing, especially the blonde knight in the middle" (Ser Edric Vale is the benchmark). There should be **a whole tab for a game-like profile: stats, titles, etc.** Keep refining the character designs. · recorded 2026-11-13 07:19 ET
34. **Arts, talent, real bodies, a cleaner profile, war as a board** (D-039; recorded 2026-11-13 18:36 ET). In the owner's words, in parts:
    - **Sword arts, murim-like:** fighting styles become *arts* (sword arts and the like), in the spirit of the murim martial world; every other weapon has its own properly named equivalent.
    - **Delete the 35 merged branches;** from now on no need to ask to delete when the reason is known and trouble can be handled.
    - **Skill words:** Beginner, Intermediate, Advanced, Expert, Master, Grandmaster, Legend, Myth. The world holds perhaps 1-10 grandmasters and maybe 1 legend.
    - **No skill trees:** skills come by experience. A first try either goes so badly nothing is learned, or gives a level-one skill. Skills grow and, at higher levels, merge.
    - **Talent:** talents in different areas give different growth rates; a physically gifted person grows everything physical, stats included, much faster; one can be gifted in a single attribute (speed, senses). Many talent levels, from no aptitude to one of a kind (not worded so): letter grades with a number, or kept a mystery for the player to find out.
    - **Arts in a fight:** same skill, a top art wins 7-3 or 8-2, and can be much more or less; top arts are harder to learn but worth it; no two people identical; the same stats applied differently can let a standard art overpower a great one.
    - **House arts can be separate:** a high-ranking military house may teach its knights one art and keep another for the direct line; some have both, one or neither.
    - **Disuse:** an unused skill fades, but rarely, slowly to begin, and comes back easily.
    - **Longer lives:** a well-fed, healthy merchant who avoids conflict should easily live to 50-70 without outside causes.
    - **Legendary weapons:** any wielder can use one, but they are far more complex to use than a regular weapon, tightly kept safe, and far superior to any other weapon.
    - **The Profile page is too cluttered:** too much writing. Keep the past (prior posts, deeds, the record) reachable in a separate area one visits only to retrace one's steps; keep the main page clean and focused on what matters most. Too many buttons stacked together: show them when opened, or use the space so they are not crowded. Keep improving the character designs; game-like profiles with stats and titles.
    - **Phone:** the game takes very long to load and process on a phone.
    - **Bodies that make sense:** a trained man who lifts twice his weight must not read as weak; if he is "poor" at speed and endurance, what is a child? Extremes exist (a giant is off the chart for strength, and off the other end for speed). Average strength needs no years of training; upbringing and genes put many far above or below. Remove the real-unit readouts entirely ("66 kg, lifts 120 kg", "reactions 170 ms"). Everyone is too weak; masters with abysmal stats make no sense: a master swordsman trained his body, a master trader or diplomat has wits.
    - **War:** remove the war score and the army templates (not the HOI4 style); redesign war as a game-board representation with simulation and tactics down to small details, still part of the game.
    - "Integrate all of this into the update system and report back."
35. **Baselines, then any build** (D-042): "Masters don't have bodies and brains to match their mastery, but if they don't it'll hold them back from becoming masters. If you become the most skilled person in the world with a blade but don't have the physique or stamina to at least keep up to a small extent, it's useless and only for show. But once you get past a certain baseline it's cleanly up to you to decide what physical attributes and skills are most important for your playstyle, and the game should fully accommodate thousands of different designs and playstyles." · recorded 2026-11-13 18:54 ET
36. **Combat ranks, talents at birth, arts that stay, lives without ladders, legendaries; then a pause** (D-043; recorded 2026-11-13 19:23 ET). In the owner's words, in parts:
    - **No caps on Grandmasters or Legends:** "no constraints on how many can be alive at once; there's simply no one above that currently" (no living Myth). "A Legend can take on 4 Grandmasters and have a decent chance of surviving if their body can keep up."
    - **Fusing skills is a choice:** "an option to fuse your skills into more powerful and uniform versions, but be very careful when deciding how to combine them; use basic terminology throughout. Don't fuse automatically."
    - **Talents chosen at birth:** "you can pick up to 7 and exactly how talented you are." Talents need not be single stats (e.g. **Physique**: all physical stats, with a high letter for the genetically gifted). Many options, properly sorted into categories and subcategories so the list does not clutter.
    - **Talent letters F to S, then SSS** (not SS): SSS incredibly rare unless the player picks it. The letters set ceiling and growth rate; enough training can very slowly creep past a ceiling.
    - **Art grades:** Lesser art, Basic art, Great art, Renowned art (or Mastered art), Legendary art. No art is "Myth".
    - **Grandmaster and the combat ladder are for combat only.** Other walks of life have their own ways of progressing, with less detail. A merchant has no grades: judged by fame, influence and deeds (making money: the more the better). No step-like job ladders: progress is not linear, it comes from your own performance and relations. "You should be able to become anything worth becoming in this world" (keep it entertaining: nobody plays to become a carpenter). **Nobility in full:** gatherings, balls, romances, disputes, succession battles.
    - **Arts stay:** a person who learns an art sticks to it unless they choose to replace it later; only the most basic moves (a slash, a stab) are common to all. So higher arts are coveted, and houses with secret arts have a military edge.
    - **Legendaries, no levels:** a mastered legendary simply outclasses regular arms; when blades clash, the other suffers. But a foe fast and strong enough to dodge and get through the gaps makes the blade's quality irrelevant ("no matter how strong a weapon is, if it can't hit you it doesn't matter"), and higher skill makes parrying and deflecting much easier whatever the weapon.
    - **Baselines** rise with the difficulty of the skill or art, but stay a minor part, enough that no one can wholly neglect training the body.
    - **Branches:** the owner asks whether deleting the v2-fix/v2-wf branches is safe and how to let the session do it.
    - **"Show me ten legendary weapon designs from different weapon categories and then pause the system."**
37. **Talents by budget, no count limit** (D-044): "Remove a limiter on how many talents one can have and simply give them a budget and cost for selecting a talent. Lowering the talent of one area can give back points, and all talents are priced differently based on how great an effect they can have, nothing too insane though." · recorded 2026-11-13 19:37 ET
38. **A first scope of the talent budget now, full build later:** "Give me a scope of talent budget and prices right now and fully integrate it later on." Scope: `docs/design/growth.md` §10. · recorded 2026-11-13 19:40 ET
39. **S and SSS grow abnormally fast:** "SSS growth speed should be abnormal, so make S 1.8 and SSS 3." · recorded 2026-11-13 19:43 ET
40. **Cheaper talents, a bigger budget:** "Don't make talents so expensive and increase the budget." Now 40 points and lower prices (growth.md §10). · recorded 2026-11-13 19:45 ET
41. **No build should be the obvious buy:** "with this it makes it illogical not to spend on a broad SSS; fix and troubleshoot, find the best middle to make things work as a game and give room for players to spread out their build or focus on a couple main abilities." Prices by reach and growth (growth.md §10). · recorded 2026-11-13 19:49 ET
42. **A slightly bigger budget; one SSS at most:** "Increase the budget slightly and limit the number of SSS to 1 no matter the combination." Budget 45; one SSS talent, of any reach. · recorded 2026-11-13 19:51 ET
43. ~~**A master key on the talent page:** "input a master key at the bottom of the talent page for me so I can override this and change whatever I want." Built with the talent picker (G1): a key field at the page's foot; the right key lifts the budget and the one-SSS limit and opens every talent and grade; lives made with it are marked custom and kept out of balance runs; only a hash of the owner's phrase is stored (a client-side game cannot keep a real secret; the owner was told). The owner gives the phrase when G1 is built. · recorded 2026-11-13 19:57 ET~~ **Withdrawn by order 44.**
44. **No master key:** "Scratch the cheat code idea; I don't need something unnecessary that could become a negative variable later on." Order 43 is withdrawn; nothing is built. · recorded 2026-11-13 20:00 ET
45. **A legendary blade example** (`docs/design/reference/owner-ref-3-legendary-blade.png`, D-045): "How's this for an example of a legendary blade. Make sure it sits well with the character design though, as it should be a part of the portrait." · recorded 2026-11-13 20:04 ET
46. **Every legendary its own place and craft:** "Don't make them all look the same. They're all legendary but come from different places with different styles and designs. Make this blade the signature of Aldmark and create a history and place for it, then do the same for any others you produce." · recorded 2026-11-13 20:06 ET
47. **Who owns a legendary, who uses it, and why:** each legendary names its owner (a crown, a house, an order, a temple, a pledge-holder, or no one if lost), its wielder (who carries it now, often not the owner: a champion, the holder of a post, the house head, an heir, no one), and why (custom, oath, law, office, bargain, theft, loss) and what it means politically. · recorded 2026-11-13 20:07 ET
48. **Stats, "Swordsmanship", one art at a time** (D-046): "17 or more, but not all of these you've shown are trainable stats. Change the term Blades to Swordsmanship. [Arts:] I already answered: other than the standard moves of your weapon, only one art at a time. [Arts changing in a lifetime:] I've answered this too." · recorded 2026-11-13 20:52 ET
49. **War as a visual simulation; quality over speed; Fable freely** (D-047): "Not a war board, just a well built visual simulation where you can get an up close and tactical view of it." "I don't care about speed, just complete this as smoothly and cleanly as possible, adjusting where necessary. If there are small changes you can make that speed this up then go ahead. Use Fable as much as you want if it makes the game better." · recorded 2026-11-13 21:01 ET
50. **Fewer markets, more goods, balance with care; Fable only where it serves design** (D-048): "We don't need 281 markets, use your own judgement for how many. Think about user tendencies throughout this game's development. There should be more than a hundred goods, though not all need to be available at all times. Take your time and be thorough. Take your time and balance the game perfectly. No, only use Fable where properly applicable and useful for design quality; otherwise stick to the efficiency of earlier." · recorded 2026-11-13 21:05 ET
51. **The Marshal's seat is optional, not empty by law:** on the lore's sitting Marshal of Aldmark (Leofric Stane): "It doesn't matter, maybe Aldmark just appointed one. I'm just saying it's not a seat that needs filling." (D-049) · recorded 2026-11-13 21:19 ET
52. **Better names; finer ordinary arms; a new bow** (D-050): "Rename all the legendary items and their moves, and whilst you're at it do the same for other arts and weapons. They shouldn't have some horrible naming. Winter Wheat could be called Winter Storm and its art be Snowfall. Redesign the non-legendary class weapons to be more intricate and designed, and significantly improve and redesign the bow legendary. Naming and design for the legendary weapon arts and the weapons should be well thought out." (A direct order: this task runs despite the pause.) · recorded 2026-11-14 00:13 ET
53. **The pause is lifted:** "OK, I'm done checking. Continue running the project at full speed." · recorded 2026-11-14 00:23 ET
54. **Nothing without reason; the war answers; the Marshal removed; the playtest** (D-062) · recorded 2026-11-15 21:12 ET. The owner's words, verbatim:

    > not necessarily every figure listed including the marshal should have a complete thought process behind their desires that perfectly matc h up with their position circumstances and personalities.1. depends on who you are. as realistic of a situation as possible.2. yes 3. yes anything that involves you whether it comes from higher up below you or iin your surroundings. 4. you choose based on your rank your role in the army and your delegations made by those above you. you can make requests but everything comes down to tactics. their is cause and a ffect aswell as reasoning behind every happenstance. 5. remove levies their is conscription that is mandatory service when its needed but armies are built on honour and those who choose to follow that path. 6. they end when one side surrenders or is defeated. properly simulate the pathways this can go and keep a standing logic. things can also be affected by ones emotions. think about peoples personalities. one king may declare a losing war simply because somebody insulted a high ego of their whilst another might be more calm and calci=ulated within their actions plots and retaliations. 7. yes a complete report system with information and timing based on how somebody of your rank would be informed and treated within realistic scenarios and based on relationships and importance. 8. Keep it situation based. you may not know every person within your command but you know those you choose to get to know, find yourself in situations with or need to know in your place like those who serve your directly or guard you aswell as the people you report to whether it be the marshal in the most extreme situations or the person dircetly above you for a regualr report. 9. Everything is propely accounted for in world history and saved in the same way. 10. Remove marshal now. properly calibrate against any prior changes. general is the highest rank in an army and keep the naming scheme regualr. their can be multiple generals based on how large your army is. nobles can have their own command systems and armies under them but theirs still a hierarchy where they serve the king. this system absolutely needs to be complex where regional disputes have the potential to occur within reason. Write and highlight this next sentence in the repo for the rest of the creation of this game. not a single thing in this world should happen outside of reason. things can come down to chance luck, reasonability calculated actions and even petty and emotional reasons. but not for avsoluetly no reason. their can be coups, rebelllions factions all falling under the test of a kingdoms stability a kings relations with each noble. their own ambitions desires and curcumstances. everything needs to be intertwined for this project to a success. any and every tool at your disposal needs to be used and you can research any tool within reach that i can help you get and just let me know. the names need to sound mythical for the legendary blades. heavy focus on the characteristics and aura given off by each one aswell as what they represent. From my playtest- One a save is started you can never start a differnt life as their is a bug once you press start new life. remove the ambitions feature. the useless desciosns and chapters. everything comes down to fcree will. any of these things should be available to you but not a single thing should be handed to you without you seeking it out. i attempted murder on a monarch 100s of times. and was never once executed. if i asked fore= forgiveness they forgave me no matter how much they hated me prior. i murdered countless monarchs with zero consequence as it never happened. when in an army it took a year and months to be given my first mission. the army training system is too bland. why should one unit need aptitude in every single aspect of war. the training sytem should be dynamic tailored to ecah units composition abilities and tendencies. when choosing what path you want to go in the military pay more ayttention to the weapon under use the method of combat they prefer aswell as their aptitude across any skill that  could be made use of in context even outside of combat. such as command logistics, seamanship. all of these things add value. etc i hate having my months and years cut short every time their is a minor event. stop middway if the event is important enough but the moment the popup or chain of popups are resolved continuw in completeing the sim. growth is far to linear. study improvise compound and find a perfect standard for this. hair needs a lot more work. the legendary weapons sheet was good for the most part i just thought the bow could be significantly more visually appealing to really exemplifie legendary. yes i noticed the dress sheet and outfits got mixed up . compund the variety of outfits and apperances. yes apperance and looks can matters in applicable situatiosn. no it isnt ok. theres no such thing as low on the list everything needs to be fixed eventually. you can merge v2 integration. help me delte the unecessary branches. fill in all the gaps at your own discretion trying to best apply what you think i would do based on my prior desciosn making. is their anyway to cut back on the long testing

    **Read as:**
    - **THE RULE (written into CLAUDE.md, highlighted, for the rest of the game): not a single thing in this world happens
      outside of reason.** Chance, luck, calculation, even petty and emotional reasons, but never for no reason at all.
      Coups, rebellions and factions follow a kingdom's stability, a king's relations with each noble, and their own
      ambitions, desires and circumstances. Everything intertwined. Every figure (the Marshal included) has a thought
      process behind his wants that matches his post, circumstances and personality; not a blanket rule.
    - **The ten war decisions (docs/design/war.md):** (1) where you watch from depends on who you are, as realistic as
      possible; (2) yes, your rank's sight; (3) yes, it stops for anything that involves you, from above, below or around;
      (4) where you stand follows your rank, role and the delegations from above; you may make requests, everything comes
      down to tactics, with cause, effect and reasons behind every happening; (5) **no levies**: conscription is mandatory
      service when needed, armies are built on honour and those who choose that path; (6) a war ends when one side
      surrenders or is defeated; simulate the pathways with standing logic; emotions and personality move rulers (an
      insulted proud king may declare a losing war; another plots coldly); (7) a complete report system, information and
      timing by rank, relationships and importance; (8) situation-based: you know those you choose to know, those you are
      thrown together with, those who serve or guard you, and those you report to; (9) everything accounted in world
      history and saved; (10) **remove the Marshal now** and recalibrate: **General is the highest rank in an army**, plain
      naming, several Generals by the army's size; **nobles have their own command systems and armies under them**, in a
      hierarchy serving the king; complex enough for regional disputes within reason.
    - **Legendaries:** names that sound mythical; heavy focus on each one's character, aura and what it represents; the bow
      significantly more visually striking.
    - **Playtest:** (a) once a save is started, "Start a new life" is broken; (b) remove ambitions, the "useless" decisions
      and chapters: free will, nothing handed to you that you did not seek; (c) hundreds of attempts on a monarch and never
      executed; forgiveness always granted however hated; monarchs murdered with no consequence, "as if it never happened";
      (d) a year and more in the army before a first mission; (e) army training is bland: training tailored to each
      unit's make-up, abilities and tendencies; choosing a military path weighs the weapon, the way of fighting and every
      useful aptitude (command, logistics, seamanship...); (f) months and years are cut short by minor events: stop only for
      what matters, and once the popup or chain is answered, **carry on and complete the step**; (g) growth is far too
      linear: study, improvise, compound, find the right standard; (h) hair needs much more work; (i) the dress sheet's
      outfits were mixed up: compound the variety of outfits and appearances; **appearance and looks matter where it fits**.
    - **Nothing is "low on the list":** everything gets fixed eventually.
    - **Permissions:** merge v2-integration (PR #2); help delete the unneeded branches; fill the gaps at my own discretion as
      the owner would decide. Asked: can the long testing be cut back?
55. **Every relationship needs a base** (D-065) · recorded 2026-11-15 21:34 ET. The owner's words, verbatim:

    > add this to the list - every relationship needs a base. if im a peasant why would the king allow me to get to know him. most nobles wouldnt even look at me let alone talk to me and those who would either need me for something or just have a type of personality that allows them to do that. for a example a baron who used to be a commoner might sympathize more than a duke born with a goldne spoon. its about staus, pride and personality. becoming a honourable knight is  a way to shift the scales abit. same with becoming a well renowned master of anything or increasng your fame wealth or connections. (JUST LIKE IN REAL LIFE)

    **Read as:** who will know you follows status, pride and personality, as in real life. A peasant cannot simply get to
    know a king; most nobles will not look at him, let alone talk; those who do either need something from him or have the
    temper for it (a baron risen from commoners may sympathise where a duke born to gold will not). The scales shift with
    knighthood and honour, renown as a master of anything, fame, wealth and connections. Rule 18 (nothing without reason)
    applied to every acquaintance.
56. **Detail between peoples; image generation for visual work** · recorded 2026-11-15 22:12 ET. The owner's words, verbatim:

    > i want attention to detail in the way each Character design weapon clothing and all differ from small to drastic differnces between nations borders and cultures. i want you to use chatgpt image generation whenver you need visual work and design completed if it hits its limit then wait for it to be done and work around it until then

    **Read as:** every character's design, weapons and clothing differ by nation, by border and by culture, from small
    differences (neighbours across a border: a cut, a colour, a fastening, a hilt) to drastic ones (far peoples), with
    attention to detail; folded into C8d (and L2, E2 for arms). Image generation (OpenAI's) is to be used for visual design
    work whenever needed, waiting out limits and working around them meanwhile. **Status:** the session cannot use a
    ChatGPT subscription, only OpenAI's API with a key; the owner declined the key form at 2026-11-15 22:12 ET and asked where to find
    it and what a free plan allows. Until a key exists: the figure library draws, and images the owner makes in ChatGPT and
    shares are used as references.
57. **Profiles in this style** · recorded 2026-11-15 22:20 ET. The owner shared a ChatGPT image (`docs/design/reference/owner-manhwa-cards.webp`:
    4 peoples x 8 stations as manhwa and anime profile cards) and wrote, verbatim:

    > this is what i got when i said-make it 10x more visually appealing like manwha and anime and pay close attention and detail to their roles and differences in their nations and cultures. mold this style into charcter profiles.

    **Read as:** the character profiles (the Profile tab's card, people's cards, the portraits in scenes) take this look:
    bright painted manhwa and anime figures, a scene behind that fits station and land, a dark card with a gold edge, the
    nation's banner and crest, the station with its icon, three keywords and a motto. Detail in role and in the difference
    between nations and cultures (order 56). Built as C8d's first gate: a style frame shown to the owner before it goes
    into the game (as with C8's gates).
58. **Design corrections for the next iteration of the profiles** (C8d) · recorded 2026-11-15 22:27 ET. The owner's words, verbatim:

    > These are the design corrections that should govern the next iteration:
    >
    > * Royalty: Distinct political and cultural identities, not interchangeable crowns and fur capes. Northern monarchs use heavy furs and dark metals; Qadiri rulers use desert silks, layered turbans, and geometric goldwork; Wind Rider rulers use steppe regalia, leather, and clan insignia; Zanari rulers use elaborate woven textiles, distinctive jewelry, and ceremonial armor.
    > * Military: Different equipment, rank insignia, shields, weapons, and helmet traditions. Not every soldier needs a helmet.
    > * Social class: Serfs should visibly communicate dependency and labor obligations. Peasants should look like independent rural households, with more personal possessions and regional clothing.
    > * Body language: Varied poses, gestures, expressions, and equipment. Avoid repeating folded arms.
    > * Cultural overlap: Border settlements should show mixed fabrics, borrowed armor, shared hairstyles, hybrid architecture, and neighboring cultural influences.
    >
    > One important distinction: national identity should be recognizable without making every citizen look identical. Regional variation, wealth, occupation, and personal taste should all influence appearance. just mark this down in its order and keep going full speed

    **Read as:** the rules for C8d's gate 1 and everything after it. The four peoples named are the reference image's
    (`owner-manhwa-cards.webp`); in Ardan each is the archetype for its nearest real people (a northern, a desert, a steppe
    and a southern forest people of `src/ui/engine/figure/cultures.js`), and the same care goes to every other people.
    Recognisable nations, never uniform citizens: region, wealth, occupation and personal taste vary every look.
59. **Growth is not a timetable** (G0, D-070) · recorded 2026-11-15 23:12 ET. The owner's words, verbatim:

    > i dont like the idea of results being so predictable that anyone can become a master with that much training. theres too many variables like in real life one might get it in 5 years of discipline and profound epiphanies whilst one might be stuck behind his entire life due to not grasping one concept

    **Read as:** no fixed number of years makes a master. The same training gives very different lives: one reaches
    mastery in five years of discipline and profound breakthroughs, another is stuck his whole life behind one concept he
    never grasps. Growth turns on discipline, insight and the person, and the outcome is uncertain (chance allowed, but
    every turn has its reason, rule 18).
60. **Visual design waits for the image model** · recorded 2026-11-15 23:14 ET. The owner's words, verbatim:

    > i will work on getting you an api key image model so postpone that project aswell as other design projects

    **Read as:** the owner is getting an image-model API key. Until it arrives, the profile cards (C8d) and the other
    visual design projects are postponed: L2 (legendaries' look, the bow), C8d's hair and dress, and the visual Gaps
    (mourning dress, jewellery, mounts, interiors, cut-in tone). Systems work goes on at full speed. The map (D9) stays,
    because the war on it (D12b) stands on it; its look can be revisited with the image model.
61. **"Breakthroughs", not "epiphanies"** · recorded 2026-11-15 23:14 ET. The owner's words, verbatim:

    > dont call them epipanies call them breakthoughs

    **Read as:** order 59's sudden grasps are named **breakthroughs** everywhere (docs, code, the player's words). The
    owner's own word in order 59 ("profound epiphanies") is kept as he wrote it.
62. **The end goal: Ardan on the iPhone App Store** (D-071) · recorded 2026-11-15 23:17 ET. The owner's words, verbatim:

    > This is not a task to start now. Keep going with your current work. This is about the end goal, so you build toward it from today.
    >
    > THE END GOAL
    > Ardan will ship on the Apple App Store as an iPhone app. The web game gets wrapped in Capacitor (a native iOS shell around a WebView). I'm on Windows with no Mac, so iOS builds will run on a cloud Mac (Codemagic) connected to the GitHub repo, then go to TestFlight, then to App Review.
    >
    > WHAT TO DO NOW (learning only)
    > 1. Research the route from today's official docs, not memory (capacitorjs.com, developer.apple.com, docs.codemagic.io). Facts I've checked so far; re-verify them:
    >    - Capacitor 8 is current. It needs Node 22+ and uses Swift Package Manager by default, so the iOS project is ios/App/App.xcodeproj (no Podfile, no .xcworkspace).
    >    - Since 28 April 2026, Apple only accepts uploads built with Xcode 26+ and the iOS 26 SDK.
    >    - Ionic Appflow is closed to new customers and shuts down at the end of 2027, so don't plan around it. Expo EAS Build is for React Native, so it doesn't apply either.
    >    - Web Audio on iOS is muted by the silent switch unless navigator.audioSession.type = 'playback'. Sound only unlocks after the first tap.
    >    - iOS can clear WebView localStorage, so real saves should go through @capacitor/preferences or @capacitor/filesystem.
    >    - Apple rejects apps that feel like a website (Guideline 4.2). The app must work fully offline and must not allow text selection, zoom or page bounce.
    > 2. Map the whole route as stages: performance → iPhone readiness (touch, screen sizes, safe areas, audio, saves) → build into a self-contained www/ folder → Capacitor setup → Codemagic signing and TestFlight → App Store listing, privacy and age rating → review. For each stage, list the steps, the exact commands and config, what only I can do (Apple Developer account at $99/yr, App Store Connect app record, API key), and the known pitfalls.
    > 3. Write it down:
    >    - docs/IOS_ROADMAP.md: the full route, dated, with source links. Mark anything not yet verified.
    >    - .claude/skills/ios-capacitor-release: the how-to version you'll follow when we reach that stage.
    >    - Add a short "End goal: iPhone App Store" section to CLAUDE.md that points to both, plus the build rules below.
    >    - Record each choice in docs/DECISIONS.md.
    >
    > BUILD RULES FROM NOW ON (so nothing has to be redone later)
    > - Input: mouse or tap only. Use Pointer Events (pointerdown/move/up/cancel), never mouse-only events. Nothing may depend on hover, right-click, double-click or the keyboard. Tap targets must be at least 44×44 points.
    > - Layout: must work from a small iPhone (about 375×667 points) up to a Pro Max. Keep room for env(safe-area-inset-*) padding. Use dvh units, not vh.
    > - Assets: relative paths only (./). No CDNs, no web fonts from the internet, no network calls. Everything must work offline.
    > - Rendering: HTML for menus and panels, updating only what changed. One canvas for the map and the war map, with culling, and only redrawing when something changes. Animate only transform and opacity.
    > - Performance: no data that grows forever, no new objects inside per-frame loops, look things up by id with a Map. Test with the CPU slowed 4–6× to act like a phone.
    > - Saves: go through one save module, so the storage underneath can be switched to Capacitor storage later without touching the game code.
    > - Audio: one AudioContext, unlocked on the first tap, and paused when the app goes to the background.
    > - Keep the source in src/, data/ and assets/. Later a build script will output www/ for Capacitor, so don't hard-code paths that assume a particular folder layout.
    >
    > When something you build would make the iPhone version harder, say so and suggest the version that keeps the route open. Update the roadmap and the skill whenever you learn something new.

    **Read as:** the end goal is a Capacitor-wrapped iOS app, built on Codemagic's cloud Mac from GitHub, through
    TestFlight to App Review. Now: research the route from official docs and write `docs/IOS_ROADMAP.md`, the skill
    `.claude/skills/ios-capacitor-release`, a CLAUDE.md section with the build rules, and the choices in DECISIONS. The
    build rules bind all work from today; anything that would make the iPhone version harder is said and a route-keeping
    version proposed.
63. **Proficiencies retired; skills with levels and experience** (D-072) · recorded 2026-11-15 23:21 ET. The owner's words, verbatim:

    > im no longer a fan of the proficiencies system its very bland. systematically remove it and refine a system of skills with levels and expierience. dynamic growth mechanics

    **Read as:** the proficiencies (today's 0-100 numbers in `GD.SKILLS`, "Practice a proficiency", the sheet's
    Proficiencies list) are removed systematically, everywhere (engine, events, checks, effects, UI, saves, tests, docs),
    and replaced by **skills with levels and experience** that grow dynamically: experience earned by doing, levels that
    are crossed by grasping concepts and by breakthroughs (orders 32, 59, 61; growth.md, growth-standard.md §3.16), each
    change with its reason (rule 18). Old saves convert. This brings G forward: it now follows R1's core in the build
    order, before D11+, which stands on it.

64. **Branches as many as needed, integrated and deletable** (D-133) · recorded 2026-11-18 21:20 ET. The owner's words, verbatim:

    > use as many extra branches or files as needed but make sureto propely integrate them and make them deletable. run a quick rn through and let me know everything you need help with or want to ask

    **Read as:** working branches are fine in any number. From now on each is named `work/<item>` (for example
    `work/d11-ci`), so they sit together on GitHub; every one is merged into `v2-integration` whole, and once merged it is
    listed in `docs/BRANCHES.md` under "Deletable" with its tip, so the owner can delete it with nothing lost (any one can be
    restored from its tip). The session cannot delete branches itself (the git proxy refuses it; the permissions rule).

65. **Find out why versions go wrong and make sure it does not happen again** (D-134) · recorded 2026-11-18 21:40 ET. The owner's words, verbatim:

    > ive deleted the 35 older ones. why are you having version error recalibrate find out why your confused and make sure it doesnt happen again

    **Read as:** an audit of how versions were cut (D-134 lists what was found: three different ways a release branch was
    set, a version tool that can only tag HEAD and prints a git error, no sample save since alpha.10, and features merged
    faster than CI could clear them, so alpha.14 kept slipping and its contents kept changing). The fix is one written way
    to cut a version, a tool that enforces it and a check that fails when the records disagree, and a merge rhythm where a
    batch is cleared before the next one lands.

66. **Honest odds, with room for the unexpected** (D-135) · recorded 2026-11-18 21:55 ET. The owner's words, verbatim (his answer to "keep honest duel odds?"):

    > a. match the real chances but keep enoug room for unexpeted results that come from willpower circumstance adaptability and talent

    **Read as:** the scale keeps telling the truth about what can be known before the fight (shown odds match results
    in aggregate). The spread around it is not blind dice: upsets come from four named sources, each a reason the after-fight
    account gives: **willpower** (a surge under real stakes), **circumstance** (ground, light, weather, wounds and fatigue,
    footing, a slip, what was not known when the scale was read), **adaptability** (reading the foe and changing course as
    the fight goes, judgment over exchanges), and **talent** (a gifted fighter's ceiling and leaps, breakthroughs). Applies to
    duels first, then to every attempt read through the odds engine.

67. **Answers to the run-through: parity, coherence, and clearing before building** (D-136 to D-141) · recorded 2026-11-18 22:05 ET. The owner's words, verbatim:

    > b. yes do that. c. sure but be very clear what that deed is. d. sure but it is far too easy to progress and become a legend aswell as a king. no need to make the gmae extremely difficult just as conceptually accurate as possible e. consolidate all economic factors against it self. so everything is coherent pricing makes sense etc. keep full speed. yes people you never meet should still age. update each individual and groups data and growth margins the same way you would for a user. i shouldnt be able to make a general im friends with my sergenat and the people around and not around me should grow the same as i do.                          1. slow down properly integrate everything after your sure its right even if it requires testing. fix the current issues in evry case before moving onto new ones.  2. deal with it the best you can. 3. study review and improve it. 4. figure out why. continue adding sample games in every version to show the playable differences.

    **Read as** (the letters answer the run-through's design calls; the numbers answer the four version faults of order 65):
    - **b.** The world's masters (councillors, mentors, order masters) rolled on the old scale are brought down to what
      their years, talent and training allow (D-136).
    - **c.** The trials at Expert and Master stand, and every trial card says plainly what the deed is: what must be done,
      before whom, and what counts as passing (D-137).
    - **d.** The census stays a count, not a cap; but becoming a Legend, and becoming a king, are far too easy. Make both
      as hard as they are in the world's own logic, not artificially hard (D-138).
    - **e.** Every economic figure is set against the others: wages, pay, prices, rents, upkeep, loot and treasuries
      agree, so a price makes sense beside a day's wage (D-139).
    - **Pace:** full speed stays.
    - **Ageing and growth for everyone:** people the player never meets age and die; every person and group (companies,
      households, houses) grows by the same rules and margins as the player. No shortcut through a friendship: being
      friends with one's sergeant does not make a General, and the people near and far grow as the player does (D-140).
    - **1.** Integrate only what is known to be right, with the testing it needs; fix the current issues everywhere before
      starting new work (D-141, tightening D-134's batches).
    - **2.** The three release-branch conventions: handle as well as can be (D-134's note keeps alpha.1-9 as they are).
    - **3.** The version tool: study, review and improve it (D-134 point 2, built on `x5-build`).
    - **4.** Find out why sample saves stopped, and add one to every version, chosen to show what that version changed
      in play (D-141).

68. **One fixed continent** (D-142) · recorded 2026-11-18 22:20 ET. The owner's words, verbatim, then his answer:

    > ive noticed the map keeps on changing

    Asked how the map of Ardan should work (each new life built a fresh continent from its seed, and again whenever the
    map generator changed), he chose **"One fixed continent"**: Ardan has one geography, the same coasts, rivers,
    mountains and realm heartlands every life, learned like a real world; history, wars and borders still play out
    differently each game; a map improvement redraws it once, and old saves keep the map they were made on.

69. **The map in extreme depth** (D-143) · recorded 2026-11-18 22:25 ET. The owner's words, verbatim:

    > once you do that go into extreme depth eith the map ists differnet locations border relations disputes allances trade routes and more.

    **Read as:** once the one continent stands (order 68, M1), the map becomes a world in depth: its many kinds of place
    (cities, towns, villages, castles, abbeys, mines, ports, fords, passes, markets, ruins, holy sites, wilds), each with
    a reason to be where it is; the border between every pair of neighbours with its own state (open, watched, fortified,
    raided, disputed) and history; disputes over land, water, roads, tolls and claims, each with its parties and cause;
    alliances, pacts and marriages drawn where they bind; trade routes by land, river and sea with what moves on them, who
    taxes and who guards them; and more of the same kind. Everything reasoned (order 54), shown at the player's rank and
    knowledge, and built into what the game does, not painted on.

70. **The iPhone app when the owner decides to test it** · recorded 2026-11-18 22:55 ET. Asked whether the app stages
    should come at the end of v2 or after v3, the owner's words, verbatim:

    > just whnever i decide to test it

    **Read as:** the App Store stages (I1-3 to I1-7: the `www/` build, the Capacitor shell, Codemagic and TestFlight,
    the listing, App Review) start on the owner's word, at any point. Until then the build rules keep the route open and
    I1-1 (speed) is done within v2, so the stages can start at a day's notice.

71. **Finish the one continent in its entirety, and make the world's lore match the map** (D-151) · recorded 2026-11-19 15:20 ET. Asked whether to merge the M1 winner as it was (every candidate put the six Middle Sea realms inland, Drevna "the Lakeland" had no lakes, Aldmark no plains) or teach the map-maker first, the owner's words, verbatim:

    > 1. finish it in its entirety aswell as recalibrating the lore and all information of the world its people, kingdoms and places to match the map

    **Read as:** option 1, and more. The map-maker learns what the lore needs (the Middle Sea, Drevna's lakes, realms
    placed on the ground their lore names); the best continent is chosen again; and then everything the world says about
    itself (the realms' and peoples' descriptions, their terrain, coasts, seas and compass words, neighbours, capitals,
    towns and places, the Codex, the names of seas and regions, the stories and events that name a place) is brought into
    line with the one map, so the map and the words never disagree. M1 merges once, whole.

72. **One designed map, clean and realistic; no country encased in another** (D-152) · recorded 2026-11-19 15:35 ET. The owner's words, verbatim:

    > some of the examples show borders that are unacceptable. theres no reason for one country to be encased within another make the map clean and realistic taking into account every possible factor. dont give me 30 continents take all the good components of a fantasy world and its design and build one singular map that i can critique once it is completely done

    **Read as:** no more candidate continents chosen by score. One map is designed on purpose, drawing on what makes
    good fantasy-world maps and real geography: land shaped by its causes (plates, ranges, rain shadows, river basins,
    the Middle Sea), realms whose territory follows natural borders (ridges, rivers, forests, coasts) and history, no
    realm enclosed by another, each realm whole unless history explains a piece apart, cities where trade, water and
    defence put them. It is built in full (map version 4, with order 71's lore made to match it), and only then shown to
    the owner for his critique.

73. **The owner's picture of the continent** (D-153) · recorded 2026-11-19 15:50 ET. With an image
    (`docs/design/m1/reference/owner-continent.webp`), the owner's words, verbatim:

    > this is an idea of what the continent looks like using the lore and ideas throughout this project properly consrtuct the map the way i told you too

    **Read as:** the image is the owner's idea of the continent's look and shape, to be built as order 72 says (designed,
    realistic, clean borders, no enclave) and with the lore made to match (order 71). What it shows: one great landmass
    with ragged, island-strewn coasts on every side (most broken in the west and south); a belt of snow-capped ranges
    across the north and north-east; a red volcanic massif in the west; a chain of inland lakes through the north and
    centre, joined by rivers; a ridge running east-west across the middle; a wide dry basin of sand and scrub in the
    south-centre, ringed by ranges, with a dry range in the south-east; green lowlands and forest between; a scale of about
    2,000 km to a third of the map. Where the image and the lore differ (the lore's Middle Sea, channel and straits), the
    designer reconciles them and lists each choice for the owner's critique.

74. **Record the progress and stop everything** · recorded 2026-11-19 22:55 ET. The owner's words, verbatim:

    > record you current progress and stop everything

    **Read as:** a full stop. Done at once: the M1 engineer agent stopped, the detached test chain killed, both scheduled
    check-ins disabled (the hourly auto-resume `trig_01Brt9jMjwCyjDebRAxoZpfc` and the batch check-in
    `trig_011xzubKHgqv6y1akZhHBwEK`; disabled, not deleted, so they can be switched back on), and the state recorded in
    `docs/HISTORY.md` H-104 and `docs/PROGRESS.md`. No work resumes until the owner says so; a session that reads this
    first starts nothing, re-enables nothing, and asks the owner.

75. **The master prompt: recalibrate, reconstruct, reorganise everything** · recorded 2026-11-25. The owner's words before
    and after it, verbatim: "recalibrate reconstruct reorganizee everything-" ... "ask any and every question you need help
    with". The prompt itself is kept unchanged in `docs/prompts/2026-11-25-master-prompt.md` and, as the living source of
    truth, in `docs/MASTER_PROMPT.md`. It lifts order 74's stop. It sets the order of work: a safe point (reached: H-104),
    then the skills and tools refinement (its section 16) as the top priority, then the sync with the work in progress
    (its section 0.2), then the rest of its Phase 0. Where it conflicts with earlier orders or decisions, it wins (its
    section 2, "Precedence"), except where undoing is costly: those are put to the owner first (its section 1.1 step 3).

76. **Answers and new direction: the newest instruction wins, magic, the skills rebuilt, the order of work by effect** ·
    recorded 2026-11-25. Kept unchanged in `docs/prompts/2026-11-25-answers-and-direction.md`; merged into
    `docs/MASTER_PROMPT.md` (register row A). In short: **every new instruction takes precedence over former constructs,
    for the rest of the project**; GitHub's `main` brought fully up to date, and the repo is only versions being updated
    (no working branches or working files beyond what reference needs); the 17 merged branches deleted (the owner deletes
    them: this session's git proxy cannot); the plugins' useful parts merged into the Ardan skills and the rest cut; the two
    unfinished features dropped; the map decision put to him later; seed and export behind a developer flag; skills that
    merge, advance and evolve, in great number, stats separate (replacing S1); Next month only from age 12; magic, many
    races, monsters and legendary beings, after the skills, with any canon open to rewriting; paid game packs for more
    allowances (birth editing, choosing a station); portraits improved as often as needed; the Emilio save
    (`docs/design/emilio-1108-findings.md`); the hourly auto-resume back on; the whole order of work rebuilt in descending
    order of effect on the game (D-158 to D-162, H-109).

77. **A much larger power scale, now: countless beasts and mythical beings** · recorded 2026-11-25 (evening). Kept unchanged
    in `docs/prompts/2026-11-25-power-scale.md`. The strongest warrior of the world before this change must be weak beside
    the masters of other races and real monsters; the world grows harder through them. It pulls the monster and power part
    of section 17 ahead of the skills rebuild (the newest instruction wins, D-158); magic and the canon rewrite stay after
    the skills. Also: work at full speed without stopping every few minutes (D-167, H-124).

78. **Levels, not tier words; beings differ at one level; minds for the great beings; orders placed by importance** ·
    recorded 2026-11-25 (evening). Kept unchanged in `docs/prompts/2026-11-25-levels-and-beings.md`. Levels replace
    "Master", "Legend" and the other tier words (skills and the power ladder). Beings of the same level can differ
    completely in what they can do. Not every creature is intelligent. Not every unique legendary being has a lair, but
    each has full reasoning, emotions, a personality and habits, its own titles and its own ranking. **Standing rule:**
    every order is placed in the work by its importance (master prompt 13.1), not by when it was given (D-168, H-125).

79. **Titles: stackable, with buffs, very hard to earn, hidden requirements** · recorded 2026-11-25 (evening). Kept
    unchanged in `docs/prompts/2026-11-25-titles.md`. A person can hold several titles; each gives honour plus buffs and
    stat boosts; they are very difficult to get, and their requirements cannot be seen. Placed by importance: designed with
    the skills rebuild (13.1 rule 4), and the great beings' titles in the power-scale wave (D-169).

80. **Stat points per level, skill training, blacksmithing and weapons, trade as a profession, many paths beyond combat** ·
    recorded 2026-11-25 (evening). Kept unchanged in `docs/prompts/2026-11-25-pathways.md`. Placed by importance (order 78):
    stat allocation, per-level points and skill training go into the skills rebuild's design now (13.1 rule 4); blacksmithing
    and diverse weapons, merchant relations, trade and business as a simple profession, and countless other pathways become
    a new workstream, Professions and pathways (master prompt section 18), right after the skills rebuild and before magic,
    because every life reads them and they sit on the new skills (D-170, H-127).

81. **Deeper, personal minds for every creature and legend** · recorded 2026-11-25 (evening). The owner on order 78's
    points: the intelligence classes and the legends' characters are "perfect but go into more depth and variety,
    personalised to each creature"; the standing rule (orders by importance) "yes". Every species gets its own behaviour
    profile (drives, provocations, habits, hoards, ways with people), individuals vary; every legendary being a hand-written
    character sheet read by its decisions. Passed to the power-scale builder (D-168 addendum).

82. **Answers to the skills design; paths named; creatures by nature; every level of existence** · recorded 2026-11-25
    (evening). Kept unchanged in `docs/prompts/2026-11-25-answers-skills-titles.md`. "Unique" only for what is one of a kind.
    A monster hunter is an adventurer; a spy comes through the military or is made one by someone who can; a guild master
    inherits the post or founds a guild (coin and skill required). Not every creature needs a reason for each act or a way
    to calm it: some are simply bloodthirsty, specified and justified by their nature. Legendary beings are mostly very old
    (demons, dragons, gods). The ladder covers every level of existence: ranks to SSS, gods above. Skills: thousands at
    completion, each built with cooldowns, mana, damage and the like. Answers: (1) ranks up to SSS, a god higher; (2) an
    evolved skill does not vanish, a merge absorbs its parts; (3) "Master" may stand in a name, and titles such as Sword Saint,
    or Primordial Demon from birth; (4) stats are raised by levels, skills and titles by actions and training; (5) placed
    points never move, but an evolution in any area can bring explosive growth or extra points (D-171, H-128).

83. **Legends without gods; the Sword Saint; no crown baseline; the throne as hard as it should be** · recorded 2026-11-25
    (evening). Kept unchanged in `docs/prompts/2026-11-25-legends-and-throne.md`. The paths named are principles; there are
    many more. Remove most of the idea of gods: the summit is legends such as a King of Dragons, the Primordial Archdemons
    and a legendary human Sword Saint of ages ago who rose to their level, the best-known historical figure in the world,
    his story a legend; as many legends as fit. Skills have no range (combat and training only; a rare exception at the
    designer's call). No baseline (target number) for a crown; Master and Legend do not exist as measures. Taking a throne
    as an outsider must be as complicated as it really is from one person's position (D-172, H-129).

84. **The level anchors; legends as national threats; the map redesigned freely, then locked** · recorded 2026-11-25
    (evening). Kept unchanged in `docs/prompts/2026-11-25-levels-legends-map.md`. Levels: an average human 20-30, a soldier
    75-125, a knight 150-200, an elite 200-250, a kingdom's strongest 300-380; a grown dragon about 450, a strong one 525;
    legends all above 600 (the Sword Saint, alive in old age, 650, the strongest human; the three Primordial Archdemons
    725-750; the Dragon King about 800, by far the strongest); a Lord of the Sea and others between, in a clear ranking,
    some close and uncertain. Legends hold titles, are national threats able to threaten the whole world, and can be
    challenged. Races have baseline stats changed greatly by lineage, starting titles and innate ability. **The map:** I may
    change it however I like, as big as I like, placing realms and places freely; once done, places may be added but the
    map can no longer be edited (D-173, H-130).

85. **Exponential levels; titles and skill quality beat raw level; the Dragon Mountains; no demon kingdom** · recorded
    2026-11-25 (evening). Kept unchanged in `docs/prompts/2026-11-25-exponential-levels.md`. Levelling grows exponentially
    harder and the gap between levels grows; level is not everything: the Sword Saint (650) is stronger than the Sea Lord
    (680-700) through his titles and the mastery and quality of his skills. Dragons live in the Dragon Mountains; there is no
    demon kingdom (D-173 addendum).

86. **The map: substance over looks** · recorded 2026-11-25 (evening). Kept unchanged in `docs/prompts/2026-11-25-map-detail.md`.
    Do not spend effort on the map's visual appeal; be ultra specific and detailed in the locations, layout and form of the
    continent; the owner will make it look good later. Passed to the map builder (D-173 addendum).

87. **Legends rescaled; skills stop at level 10; full profiles** · recorded 2026-11-26. Kept unchanged in
    `docs/prompts/2026-11-26-legend-scaling.md`. Sarnavoth is an even match for the three Primordial Archdemons together, not
    nine times the next; Cael Vardan, the Sword Saint, is as strong as one archdemon despite his lower level. Skills max out
    at level 10; past it a skill can only evolve or merge with a compatible level-10 skill. Every established character has
    a full profile: skills and their levels, items, titles, personality and story (D-177, H-136).

88. **Where experience comes from** · recorded 2026-11-26. Kept unchanged in `docs/prompts/2026-11-26-xp-sources.md`. A
    skill's experience comes from each use: a related move or movement, or using the ability itself. A person's level (and
    so his stat points) comes from experience for killing or defeating people and monsters. This replaces my reading of
    order 80 ("a level gained in every walk of life"): crafts, trade and the other roads raise their skills by use, not the
    person's level (D-178).

89. **The legends' levels again; the Sword Saint class** · recorded 2026-11-26. Kept unchanged in
    `docs/prompts/2026-11-26-legend-levels-2.md`. The Primordial Archdemons about 770-780; Sarnavoth (about 800) still
    matches all three, showing how large each level's gap is; Cael Vardan raised to about 700 ("7000" read as 700, which fits
    every other number) and still matches one archdemon, through titles and skill quality and levels, above all his class,
    Sword Saint, the strongest one-to-one combat class; the Dragon King's and each archdemon's unique titles carry far more raw
    firepower (D-177 addendum).

90. **Sarnavoth slightly behind the three** · recorded 2026-11-26. "change sarnavoth to being at a slight disadvantage against
    the 3 primordials": against the three archdemons together he wins a little less than half the time (D-177 addendum).

91. **Experience from anyone; walls at every hundredth level** · recorded 2026-11-26. Kept unchanged in
    `docs/prompts/2026-11-26-xp-from-anyone.md`. Any defeated foe gives experience, whatever his level (D-181's "nothing
    from a foe 25 levels down" is withdrawn; a weaker foe still gives less). The experience a level asks rises steeply as
    one climbs, and most of all at each hundredth level (100, 200, 300 ...), where a person gets a **class upgrade or a
    stat boost**, as in the manhwa *Overgeared* (D-184).

92. **Three kinds of skill; classes as branches; no title hints; Sarnavoth at 1000** · recorded 2026-11-26. Kept unchanged
    in `docs/prompts/2026-11-26-classes-and-scale.md`.
    - **Skills come in three kinds:** *active* (combat, from melee and swordsmanship to mana-based), *passive* (they fire
      under conditions, with large effects or boosts) and *buff* (healing, a stat raised for a while).
    - **Titles and classes** take after *Overgeared*'s titles and the classes of *Overgeared* and *Reincarnated as a Slime*.
    - **No hints anywhere about titles** (D-183's tavern rumours go).
    - **The wall's reward is a branch the person chooses**, and **a class change adds new things to do** (new actions,
      new ways to play), never only bigger numbers.
    - **The legends grow too,** like everyone else, though a level is incredibly hard for them to gain.
    - **The scale is stretched:** Sarnavoth at level 1000 and the other legends raised to match, so countless more
      monsters and creatures fit in between for the players (my reading: the legends scale by 1000/800; the human and
      dragon anchors of order 84 stay; D-185).

93. **The map larger, with a Hell; only the known on it; new anchors for every kind** · recorded 2026-11-26. Kept
    unchanged in `docs/prompts/2026-11-26-map-hell-anchors.md`. The map lock is not approved yet:
    - **The Dragon Mountains are one place;** no clutter of red dots (lairs) across the map.
    - **Where the Sword Saint lives** is settled, or left unknown.
    - **The map much larger,** to fit **a Hell where the three Primordial Archdemons preside and dispute one another,
      ruling the lower demons** (replaces order 84's "no demon kingdom").
    - **Far more kingdoms and places.**
    - **Only what is known is on the map;** the unknown is written elsewhere. A legend's kingdom, title or known home
      shows; otherwise only what a player should know.
    - **The anchors stretched:** average people 20-50; soldiers 80-180; knights 230-299; a kingdom's elite 300-420
      (by the kingdom); the strongest humans, elves and other playable races on the continent 500-700, very few; an
      average grown dragon about 700; an average great demon about 650; lower demons 300-500 (replaces order 84's
      anchors; Sarnavoth at 1000 stands from order 92).
    - **The levelling reviewed and refined** as I judge best, adjusted as needed.

94. **Knights do not stall at 299** · recorded 2026-11-26. Kept unchanged in `docs/prompts/2026-11-26-knights-past-300.md`.
    230-299 is the ordinary knight; a knight can pass 300, and one who does is more than an ordinary knight (the wall at
    300 is a threshold to cross, with its class branch, not a ceiling; refines order 93).

95. **Knights few, dragons three, breakthroughs every hundred levels** · recorded 2026-11-26. Kept unchanged in
    `docs/prompts/2026-11-26-knights-dragons-breakthroughs.md` (the message ends mid-word).
    - **Numbers in a kingdom:** knights are powerful and few, the top 50 to 3,000 of a kingdom; an elite is usually in a
      kingdom's top ten; regular soldiers number from tens of thousands to hundreds of thousands, by the kingdom.
    - **Ancient demons rival elder dragons;** **only three ancient dragons** serve under the Dragon King.
    - **No weak creature raised to fill a gap:** the bands between 600 and 800 hold only beings that truly belong there.
    - **An evolved skill becomes the next skill:** the old one is gone (replaces order 82's answer 2, D-182).
    - **No rare leap as an event.** A **breakthrough comes at every hundredth level:** stats are boosted, and skills can
      jump ranks where several conditions allow.
    - **Titles can be game changers:** boosts by a share, and stat boosts.
    - **Ability can differ widely at one level,** from talent, titles and skills: an untrained noble may stand above 50
      and below 100 and still beat a soldier through titles, skills from birth and talent.
    - **Classes as in *Overgeared*:** hundreds, branching from the base ones; a class's rarity never changes when it
      advances, but rarer classes exist, with stronger effects.
    - **An archdemon who beats an equal a hundred times gains one or two levels;** there are just few who are his equal.
      The great mostly grow by refining their skills and techniques, their titles and their equipment.
    - **Training gives single points:** a stat can gain +1 at a time from training (the message's end, sent next).
    - **Remove the dragon of the High Roost** (a follow-up): the Dragon Lord of the High Roost and the High Roost Dragon,
      both new in D-185, leave the bestiary; the three ancient dragons are Ash, Frost and Storm.

96. **Counts of the great; profiles of the powerful** · recorded 2026-11-26. Kept unchanged in
    `docs/prompts/2026-11-26-figures-and-counts.md`.
    - **33 ancient demons** stand below the three Primordial Archdemons; **few elder dragons**; **at most 100 dragons**
      in the world in all.
    - **Untrained nobles start higher on average,** from the quality of their education and surroundings.
    - **Many full profiles of the strongest and most influential people of the continent:** kings, nobles, generals,
      all the ancient dragons and demons and the like, in a **clear organization by category** (full profiles: skills,
      levels, items, titles, personality and story, as order 87 asked of the legends).

97. **The world rebuilt in depth; a full diagnostic, then wait** · recorded 2026-11-26. Kept unchanged in
    `docs/prompts/2026-11-26-world-rebuild-and-diagnostic.md`. The newest order; where it differs from 91-96 it wins.
    **Immediate:** review the whole system for contradictions and bugs (most recent first), finish the work in flight and
    what is quick to test and fits now, then **pause and give a complete diagnostic of the world of Ardan** (pages of
    categorical detail) and **wait for direction**. The rest is the next build's brief:
    - **Map:** remove the Dawnlands and the Sunset Isles; expand the one continent with more nations, each as deep as
      Ardan's; every town, village and city with its makeup; at least 1,000 provinces, larger than Earth's scale would
      make sense of; roads and way-stations between settlements, not only trade routes. **Hell lies off the southern
      coast,** mostly closed unless conditions are met; every demon lives there. **Imperial units:** miles, feet, pounds.
    - **Naming:** study naming in historical and fantasy works; every name understandable to a newcomer ("Kesh" becomes
      "Kingdom of Kesh"; "the Seventh Gate" carries its plain meaning). Easy to learn, long to master.
    - **Lore:** recalibrated for every addition, with depth (why the Sword Saint lives where he does, why he does not rule
      or fight the Dragon King); a retraceable history of how each part was made.
    - **Profiles:** every notable person, down to merchants and people of promise; every noteworthy house playable.
    - **War:** no day-by-day war and no grand-strategy map; clear fronts; each battle playable as before, with rank
      mattering more: a soldier controls only himself and touches only those around him. "Soldiers", split by kind
      (cavalry, archers, mages), never "men under arms".
    - **Relationships:** none handed out; the player chooses to build one and can drop most, except those he must see daily
      or is tied to (which can change when he moves or things happen).
    - **Speed:** faster again; a visible sign when the game is working.
    - **Beings:** trolls and ogres 230-270, leaders higher; giants very few; up to 300 dragons (160-200 more young, the
      rest grown, one more elder); the three ancient dragons rule dominions of storm, inferno and water (after
      Rayquaza, Groudon, Kyogre), storm the strongest; Vaskareth becomes the storm ancient, with a wide gap above the
      other two; every dragon has a dominion; the Dragon King a dominion fit for a king; dragons hostile to humans in most
      cases but intelligent. **Dragonoid Form:** a hereditary legendary active skill of all dragons (the King's own is
      unique and unlimited), 3 minutes a day for the young up to 3 hours for ancients, trading firepower for close combat.
    - **Demons:** no demon species; known by rank, each unique, all horned, each with its own abilities and title; ancient
      demons' average level about ten lower; lower demons far less intelligent. Ogres, orcs and most monsters are demonic
      creatures without enough demonic power to be demons. **The three Primordials:** Noir (dragonoid look, larger horns,
      black eyes, ash skin; darkness and shadow), Blanc (female, white-haired albino vampire; blood magic), Red (hellfire;
      large demonic wings, dark crimson skin, black wings and horns). An archdemon who beats an equal a hundred times gains
      twenty levels (it is near impossible to survive that). Ancient, primordial and the Dragon King are irreplaceable;
      only an heir succeeds.
    - **One rarity ladder for everything:** basic, rare, epic, legendary, mythical (with levels a separate system beside
      it). Titles reworked after a study of *Overgeared*'s titles: uncommon titles give fitting reputation and small boosts;
      legendary titles very few and nearly impossible, able to change a life (experience, stat gain per level, their own
      skills). Legendary classes (one holder at a time; they cannot be advanced). The Primordials, the Dragon King and the
      Sword Saint hold mythical titles and skill sets; ancient demons and dragons legendaries of their own. Classes: as
      many as are worth having (over 300 if sensible).
    - **Skills:** thousands, far rarer up each rank; kinds passive, active, buffs and debuffs, spells (with subkinds);
      levels come from training alone, never race; quality (rarity) from evolution, heredity or race; merging can raise
      rarity, evolving does not but shows its stage; family and hereditary arts cannot merge and may be rejected by low
      affinity; skill and its use both matter (a swordmaster with a basic technique still beats an unskilled man with an
      epic style, by insight, body and experience).
    - **Stats:** say exactly what each point gives (damage, health, stamina and the rest), with *Overgeared* in mind;
      the study saved in the knowledge base.
    - **Numbers are guides:** the owner's numbers may be raised or lowered by logic; never pad with useless entries.
    - **Kings:** levels personal (most trained by routine; a warrior king may reach the elite; a political one not).
      **Elites** are not a fixed top ten (a great empire may hold 10-20). **Merchants:** from comfortable to richer than
      royals; even a monopoly is possible. **An Archmage** may join the legends.

## Permissions (what a session may do on its own, and what needs the owner)
**Free to do without asking:**
- Change, rebuild or replace any game code, data, tests, tools, docs and skills (`.claude/skills/`: research, add,
  remove, improve; keep them true to the code). Never edit `vendor/ardan-b593143.html` (the untouched release).
- Use any language, tool, model, effort level, agent, web search, web page or outside AI (orders 3, 12, 14).
- Commit and push to `v2-integration` (the round 2 working branch, PR #2), push `release/<name>` milestone branches,
  run and re-run CI once per failure, watch PR #2 and fix its CI.
- Spend tokens and time where the game's goals need it, efficiently (D-010).

**Ask the owner first:**
- *(Updated 2026-11-13 18:36 ET, order 34: a branch may be deleted without asking when its reason is known and its work is safe elsewhere; record its tip in `docs/BRANCHES.md`.)*
- Merging any pull request, deleting any branch (see the update above), pushing to `main` or another person's branch, rewriting pushed
  history (no force-push, rebase or amend on pushed commits).
- Opening a new pull request, or anything else outward-facing beyond PR #2's normal CI work.
- Starting new work while a pause the owner ordered is in force (order 11).
- Saving any secret: API keys go only through the secure credential form, never into chat or the repo.

## Talking to the owner
- Friendly game-companion voice, short plain sentences, a little personality, mild language fine; straight and
  serious when something really matters. Not bullet-heavy.
- Give times in New York time. Give honest, padded ETAs, and say plainly when something slipped and why.
- After each major step: what changed, and what to test by playing. Send a playable build early.

## Memory
The cloud container is wiped between sessions; only what is pushed survives. The memory is this repo: this file
(orders), `CLAUDE.md` (how to work), `docs/HISTORY.md` (what was done, how to undo), `docs/DECISIONS.md` (why),
`docs/IDEAS.md` (later), `CHANGELOG.md` (for players), `docs/CRITIQUE.md` (what is wrong, in what order to fix it).
Push every change; a session that ends with unpushed work has lost it. Every entry carries an ET stamp (order 15);
the newest stamp wins when two entries disagree, unless the older one is an owner's order that was never superseded.

## Game rules (design)
1. Descriptions open on click (button or info icon), never on hover. (Nov 12, replaces "never hide a description behind a click") · recorded 2026-11-12 00:44 ET
2. No percentages the player sees: words and a tipped scale. (v2) · recorded 2026-11-12 00:44 ET
3. Every system deterministic from the seed. (v2) · recorded 2026-11-12 00:44 ET
4. One holder per post; a promotion hands over the real command and takes the old post; leaving a post has consequences. (Nov 12) · recorded 2026-11-12 00:44 ET
5. War screens only when deployed, on a mission, or the situation allows. (Nov 12) · recorded 2026-11-12 00:44 ET
6. Time: Next month or Next year (a year stops early when something needs you); Next day/week in campaigns. (Nov 12, D-008) · recorded 2026-11-12 00:44 ET
7. Relationships start with only the people really in your life (commoner: parents, siblings; noble: also maids, nurses, tutors, guard knights); others enter through what you do. (Nov 12) · recorded 2026-11-12 00:44 ET
8. ~~Names and cultures modelled on real-world ones; humans mainly white/European, diverse where it makes sense. (Nov 12)~~ **Superseded by rule 11**, 2026-11-12 06:49 ET. · recorded 2026-11-12 00:44 ET
9. **Keep it game-like and simple** (Nov 12): names are basic, mostly simple names (not exotic or scholarly); "medieval military" means the strategy of fighting with knights, cavalry, infantry and archers (what beats what, terrain, timing), not historical detail for its own sake. · recorded 2026-11-12 05:55 ET
10. If an order conflicts with how the code works, record the conflict and the fix chosen (DECISIONS). (v2, Nov 12) · recorded 2026-11-12 05:55 ET
11. **One common language, different cultures:** most countries speak the same (English) language, so most realms use plain English-language names; cultures differ in customs, dress, faith and ways, not in language. A few far or non-human peoples may sound different. · recorded 2026-11-12 06:49 ET
12. ~~**Art: animated (anime), but far more detailed, as if a real character designer drew it,** with many more customisation options for hair, height, facial features and build.~~ superseded by rule 14 · recorded 2026-11-12 06:49 ET
13. **Feudal armies** (the Marshal part superseded by rule 16). Armies are feudal: nobles hold troops in proportion to their rank; the crown has royal knights; the elite orders serve the crown but draw their men from the whole kingdom by prowess; a duchy's knights march with the kingdom in war but, forced to choose, stay loyal to their duchy. · recorded 2026-11-12 06:49 ET
14. **Characters as realistic as possible** (anime optional): accurate growth and ageing, lasting scars that change face and body, armour and clothing in full detail (D-015). Refined 2026-11-12 10:52 ET (D-020): full hand customisation of the face first, genes second; scars mostly looks with small debuffs where fitting; clothing changeable; **show the owner demo sheets before building**. · recorded 2026-11-12 10:46 ET
15. **An inked, detailed map** (rivers, valleys, mountains, trade routes, terrains, habitats); **war territory spreads like a burn**, never hex tiles, so momentum shows (D-016). · recorded 2026-11-12 10:46 ET
16. ~~**The Marshal's seat stays vacant until truly needed,** then goes to a General or someone proved more capable than the generals; **General is the army's highest everyday rank** (D-017).~~ **Superseded by order 54 (D-062): no Marshal; General is the highest rank; several Generals by army size; nobles' own commands under the king.** · recorded 2026-11-12 10:46 ET
17. **No initiative cap;** overtraining has its own consequences. **Only notable events or problems stop a month or a year,** never ordinary conversations or happenings (D-019). · recorded 2026-11-12 10:46 ET
18. **NOTHING HAPPENS WITHOUT REASON.** Chance, luck, calculation, petty or emotional reasons, but never for no reason. Every figure acts from a thought process that fits post, circumstances and personality; coups, rebellions and factions follow stability, relations, ambitions and circumstance; everything intertwined. (order 54, D-062) · recorded 2026-11-15 21:12 ET
19. **Every relationship needs a base:** whether someone will know you, talk to you or befriend you follows the gap in status, their pride and personality, and what they need; knighthood, honour, renown, mastery, fame, wealth and connections shift it. (order 55, D-065) · recorded 2026-11-15 21:34 ET
20. **Growth is not a timetable:** no amount of training guarantees mastery; discipline, grasp and breakthroughs make one man a master in five years and leave another stuck for life behind one concept. (order 59, D-070) · recorded 2026-11-15 23:12 ET
21. **Built for the iPhone App Store from today** (order 62, D-071): pointer events only, nothing on hover, right-click, double-click or keys; 44-point tap targets; 375x667 to Pro Max with safe areas and dvh; relative paths, offline, no network; one canvas for maps with culling; transform and opacity only; no unbounded data; one save module; one AudioContext unlocked on first tap. · recorded 2026-11-15 23:17 ET

## Round 2 work list (Nov 12)
Step 0 restructure (done) · Step 1 harsh critique (in progress) · A1 lag · A2 one holder per post · A3 coherency
checks · B4 click-to-open · B5 declutter · B6 Next month or Next year · C6 relationships and households · C7 names and
cultures · C8 character design (high priority) · D9 map detail · D10 war only when deployed · D11 military branches ·
D12 war and command depth. Added: X6 naming pass (after X1).
