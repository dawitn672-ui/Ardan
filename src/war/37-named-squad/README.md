# Named men who get better

**Aspect:** War (Road to Ten, War 6) · **Kind:** system

The plan asks for "small-unit missions for low ranks (raids, scouting, escorts) with your named men, who get better and who die". The release had most of it, more than the first audit gave it credit for:

- the missions (patrol, scouting, ambush, supply raid, escort, hold the crossing, night raid, rescue);
- a squad of named comrades, each with a quirk ("tells the same joke every march");
- comrades who can die in a mission (`A.comradeDies`);
- odds that rise a little with the size of the squad, and with the skill of a man you send.

The men never got better, though: a comrade on his tenth mission was as green as on his first.

**What it does.**

- **A record per comrade** (`p.sq`): the missions he came back from, and how many went well.
- **Learning.** Everyone who went out on a mission and lived learns the two skills it leaned on most: +1.5 after a success, +0.8 after anything else, up to 90.
- **Standing.** A comrade becomes **seasoned** at 3 missions, **a veteran** at 6, and **an old hand** at 10. The story log says so: "Oswin has come back from 6 missions with you now: a veteran. The new men watch what he does."
- **Veterans carry the mission.** Each standing level in the squad adds 1.2 to every choice's odds (up to +8), and the man you send adds 2 more per level.
- **What is lost.** When a man with a standing dies, the log adds "10 missions, and Oswin came back from every one of them but this."
- **The person view** shows "Missions with you: 10, 7 won · an old hand".

**Measured by** (`test.mjs`):

- `squadGrows`: 12 real missions in a war. Some men die (7 of 9 who went out, which is the release's lethality), the survivors gain skill, at least one earns a standing, and the log announces it.

**Finding.** A squad on hard service turns over almost completely within a dozen missions. Veterans are rare because the release kills comrades often, so a standing means something.
- `squadCarriesOdds`: the same mission choice with the same squad, once green and once as old hands. The odds rise by at least 5 points, and the person view shows the standing.

**Rules kept.**
- Engine changes happen only in mission close.
- Odds and the person view only read the record.
- `p.sq` is optional, so old saves load.

**Limits.**
- **No squad screen.** There is no screen for the squad as a whole.
- **No promotion.** Veterans aren't promoted out of the squad.
- **No choice of men.** Which three men go out on a mission is still a shuffle, not your choice.
