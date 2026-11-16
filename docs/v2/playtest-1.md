# v2 playtest 1 (Nov 4)

**Build:** `v2-integration`, steps 1–8.

**How it was played:** a playtester agent used the real UI, pressing only Next month (plus Next day and Next week on campaign). Its screenshots and logs were in `/tmp/ardan/playtest/`, which a container restart deletes.

| | Life | Width |
|---|---|---|
| 1 | A free peasant, 27 years, never in a war | 420 px |
| 2 | A noble from 16, 22 years, enlisted, rose to general | 1366 px |

No console or page errors appeared in either life.

## Ranked findings, and who fixes them

| # | Finding | Complaint | Lane |
|---|---|---|---|
| 1 | A queue head that can't be shown (`co_captain_word`, pid null, forced) freezes the clock for good. Only "Go on" is left, and it does nothing. | 1, 8 | time (+ war) |
| 2 | After a v2 battle the stepper stays "running" with an empty queue, so Next day and Next week do nothing. | 8 | war + time |
| 3 | At 420 px, a tap on a check choice opens the odds tooltip. The tooltip contradicts the chip and reads "worth hopeless". | 1, 16 | stats |
| 4 | Soldiers and captains see exact troop numbers in the release's war prompts. A commander sees the enemy exactly, with current numbers above the maximum. | 10 | war |
| 5 | An outsider still sees foreign wars: units on the full map, true results in the tavern (`nb_battle_tale`), exact death tolls in flavour lines. | 10 | war |
| 6 | World › Wars says "Ardan is, for once, at peace" while your realm is at war. | 10 | war |
| 7 | 0–100 numbers remain outside the body sheet: health and happiness, the stat list, results such as "+36 regard", profile bars, the duel, orders, stability. | 11 | stats |
| 8 | A human general is shown as worth "about 285 levies". Orders show about 57 levies a member, against the spec's 14–26. | 9, 12 | stats, war |
| 9 | The memory insert appears on about half of all cards. | 1 | (content) |
| 10 | Every card carries filler: hint lines that have nothing to do with the scene, and stock parent advice. Childhood weeks bring 6 to 8 cards. | 1, 2 | time + (content) |
| 11 | Class-inappropriate text: a 13-year-old peasant has an apprentice, "Latin" exists, a penniless 14-year-old is offered to buy a round. | — | (content) |
| 12 | Odds are rated against the wrong opponent: a 4-year-old against "a Brawler", and a captain against the enemy general with every choice favourable. | — | stats, war |
| 13 | Infants are rated on adult scales. | — | stats |
| 14 | The house-law panel contradicts itself: an agnatic house is headed by a woman, "disinherited" comes with no reason, a duke is "Warden of the March". | 5, 14 | family, nobility |
| 15 | Relation labels: "BestFriend", "Enemy · Devoted", two lovers at once, three "superiors". | 5 | family |
| 16 | Piety effects are shown to the faithless, a shrine aim is set for a non-devout, and chapters still run. | 7 | stats, time |
| 17 | Labels contradict each other: "takes 1 blows", "runs as fast as a child" for a Grandmaster, rank words that don't agree, "Hamo rushs". | — | stats, war |
| 18 | Some descriptions sit behind "Read more", some effects read only "• their regard", and story blurbs on the creation screen are cut off. | 1 | (content) |
| 19 | Some choices show no effect, and some leave only one real option. | — | (content) |
| 20 | The text cleaned of percentages is garbled. | 16 | stats |
| 21 | Map labels are about 5 px tall at 420 px. The "Amber Isles" sit on a continent with no islands. | 4 | map |
| 22 | Diplomacy views: all 33 realms show as one bloc, and a peasant sees exact foreign numbers. | 5 | diplomacy |
| 23 | On campaign, the top bar overflows at 1366 px (1648 px wide). | 2 | time |
| 24 | Pronouns slip ("in your sleep" for a grandmother's death, he/she mixed). | — | family (+ content) |
| 25 | Vacant titles pile up and are never refilled. | 13 | nobility |

## Verdict by complaint

| Complaint | Verdict |
|---|---|
| 3 | met |
| 4 | mostly met |
| 13 | mostly met |
| 1, 2, 5, 7, 8, 9, 11, 12, 14, 15, 16 | partly met |
| 10 | not met |
| 6 | not judged |

## Round 1 of fixes

- The time, war and stats lanes started first, with the findings that block or leak.
- Next come the family, nobility, diplomacy and map lanes.
- The content findings (9, 10, 11, 18, 19) follow after that.
- Every structural fix gets a regression test.
