# Ardan at 100: the north star

What Ardan looks like with unlimited time, money and people, set against what it is today and what this round of work changed.

The detail behind each row is in the matching document in [docs/benchmarks](../benchmarks/README.md). Measured numbers come from `reports/scorecard.md`.

## The one line

> **Live one life inside a history that everyone writes, and the chroniclers will get you wrong.**

Every system below either serves that line or gets cut. The 100-point version of Ardan isn't six genres at 7/10. It is one idea done better than any other game does it, with everything else in its service:

- one life, day by day;
- a world that remembers;
- knowledge that can be wrong.

## Aspect by aspect

| Aspect | Release (measured) | After this round | North star | What it takes |
| --- | --- | --- | --- | --- |
| **Events and story** | 3,199 events; 3% read a memory; 369 flags set and never read; 41 old-age events | 3,705 events; **15.8% read a memory** (587 events); 139 flags never read; 471 callbacks with timing gates; 2-step arcs | A Ledger of named memories (who, where, year, witnesses). A Chronicler that scores storylets by memory, cast and pacing. 120 multi-year story cycles that pass to heirs. | Writing: about 400 more callbacks, 120 arcs, 150 old-age events. Code: a memory ledger and a storylet director. |
| **Relationships** | One opinion number per pair; NPCs never act first | **NPCs act first**: about 14 moves per decade (cap 3 a year), 35 kinds of move, a bond history per pair; the 573 written cast members' wants and fears drive what they do | About 150 historical figures per life, each making a move every month. A web view of who loves and hates whom. Schemes with hidden progress. Secrets as leverage. Letters. | Code: schemes, a social web view, secrets. People: playtests to tune the frequency. |
| **Diplomacy and politics** | Ruler traits read nowhere; aggressive and peaceful rulers start wars at the same rate; part of the "why" list was fiction | **Traits drive the AI**: warlike rulers start 2.4–6× as many wars per trait-year as peaceful ones; every decision is logged with its top 3 reasons; the "why" list shows the real numbers | Every ruler, councillor and great house head is a person with 9 personality axes. Every AI decision is at most 12 labelled terms, and a band of uncertain answers opens a negotiation. Envoys travel. What you know about a court depends on your spies. | Code: councils of people, negotiation, envoys. |
| **Economy** | One market per realm; a buy/sell loop printed money; AI debt never repaid; surplus gold deleted | Loop closed; debt repaid (8.27M → 0 in 40 years); thin markets have honest spreads | Production per province, stockpiles, demand from people and armies, NPC caravans on roads that wars cut, production chains, and wages as transfers between treasuries. | Code: the largest rebuild in the plan. |
| **War** | A deep division sim, but below rank 7 you watch; sieges are timers; no after-action report | Unchanged in this round (the after-action feature was cut off by the usage limit) | One war seen through three windows. A soldier gets 3–5 choices with named men. A captain orders his company. A general plans the battle. One judge decides everything, and a report names the 3 causes. | Code: personal battle, company orders, siege choices, the report. |
| **Power scaling** | The screen's duel odds understate the real ones by up to 13 points | Unchanged (the honest-odds feature was cut off) | One law of strength everywhere (duels, skirmishes, war, beasts, events). The "Measure" panel on every fight. Odds shown as rumor until you have seen him fight. | Code: calibrate the shown odds (a small job), then the group resolver. |
| **Character and life sim** | About 12 overlapping progression systems; training gives about 31 skill points a year against 1.5 from learning by doing | Bugs fixed (opposite traits, a stuck training plan, newborns at court) | "The ledger of a life": an inked body, 24 skills, one ability tree per skill family, about 70% of growth from use, moods with causes. | Code: merge the systems down to 4. People: confirm that players can explain how they get better. |
| **World and lore** | About 72k words of lore plus 473k in lazy tables, internally consistent; Ardan maps onto Earth; 84 places missing from the map | Unchanged | 34 realm bibles with about 180 enforced customs. Constructed languages from a conlanger. A pre-simulated 150-year history around the canon. Knowledge states per fact (unknown, heard, believed, confirmed, disproved). | Writing and a conlanger, plus code: the knowledge system. |
| **Replayability and pacing** | 11 life arcs, the most common at 25%; prompts about every 35 days, longest usual wait about 45 s | Measured in the scorecard | A life as a book of 8–12 chapters, each a 15–25 minute session. The clock acts as director: never more than 4 game-months without a real decision. Small news goes to a tray. 20 hand-made starts and different endings. | Code: chapters and the clock director. Writing: starts and endings. |
| **UI and UX** | Six tabs, What now, 12 hints; keyboard play broken; 120 tap targets too small (WCAG 2.2); 0 playtests | Keyboard reach and focus fixed; saves made safe; tap targets still too small | Every number explains itself, two levels deep. The People web. A 5-of-5 pass on new-player tasks. WCAG 2.2 AA clean. | Code: tooltips, the accessibility pass. People: 12-player usability tests. |
| **Visual art** | A consistent medieval skin; paper-doll portraits; a newborn drawn as an adult | Unchanged | Pentiment-grade ink portraits by culture and age, an inked map, 60–100 woodcut scenes, a score. | Hire an illustrator and a composer. |
| **Technical** | One seeded RNG and checksummed saves, but replay broke whenever the UI was used; a crafted save could run script; the source isn't in the repo | Replay holds with the UI in use; CSP and save sanitizing; one tab saves at a time; 35 browser tests; a bench; CI | All of that, plus the source in the repo, unit tests per system, and a CI bot league. | Commit the source and port the patches. |
| **Uniqueness** | The core line is named but none of its three signature systems exists | No signature system yet (the Chronicle feature was cut off) | The Chronicle (your life as a book in a chronicler's voice, wrong rumors included); belief versus truth everywhere; both scales felt at once. | Code: the Chronicle first. |

## Today against the north star, in one paragraph

Today Ardan is a big, consistent world with a deep simulation underneath and a life sim that only starts to remember the person living it. This round gave it a memory (15.8% of events now look back), people who act first, and rulers with a personality. It also made the foundations honest: replays that hold, safe saves, a security policy and measured balance.

The north star is a game where every one of those threads is a story you can retell. That game needs three things this repo can't supply alone:

- **People:** playtests every phase, because feel and clarity can't be measured by a bot.
- **Art:** an illustrator and a composer.
- **Time:** about a year of writing, for the arcs, the old age, the starts and endings, and the languages.

The code work is tractable and mostly specified in the benchmark documents.

## Ordered path from here

1. **Finish what this round started.**
   - The four memory chunks that were cut off (customs, houses and politics, careers and learning, school and duty: 129 flags).
   - The Chronicle (the first signature system).
   - Honest duel odds.
   - The accessibility pass (target sizes and landmarks).
   - After-action reports.
   Each one already has a spec in the feature workflow and an acceptance metric in `bench/rubric.mjs`.
2. **Run the 12-player playtest** with Playtest mode. That is the only way to raise UI, Character and Uniqueness above their measured caps.
3. **Merge the progression systems down to four** and invert growth toward use.
4. **Rebuild the economy** around production, stock and caravans.
5. **Hire art.**
