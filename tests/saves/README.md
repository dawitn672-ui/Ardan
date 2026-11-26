# Sample saves

One or more saved games for every version (D-134, D-141, the owner's order 67). Every save here must keep loading in
today's build: `tests/suites/saves.test.mjs` opens each through the real load path, checks the v2 invariants and plays a
year on. From v2.1.0-alpha.11 each version's save is played to a moment where that version's change is in play (a
recipe of `tools/version-samples.json`, made by `node tools/version.mjs make-save <version>` from the version's own game,
or by `version.mjs new` when the version is cut); `node tools/version.mjs check` fails when a version from
v2.1.0-alpha.1 on has no save or its save has no line below.

To open one: start the game (`node tools/build.mjs`, then open `index.html?dev`: since D-166 the developer switch shows *Load save file*), Menu, *Load save file*, pick the file.
To see one as it was in its own version, `node tools/version.mjs get <version>` and load it there.

| Save | Version | What it shows | How to see it |
|---|---|---|---|
| `v2-cycle2-1106.ardan` | v2 cycle 2 (before v2.0.0) | a life from before v2's saves: the one migration into v2 (the release's format) | Load it: it opens migrated, with a fresh journal |
| `press/y0-noble.ardan` | (bench) | a noble at year 0, the A1 press gate's first save (`tools/bench/press-gate.mjs`) | Load it and press Next month |
| `press/y50-noble.ardan` | (bench) | the same life fifty years on, the press gate's long save | Load it and press Next month; the story log's old years are what the Chronicle keeps (X5) |
| `v2.0.0-beta.1-noble.ardan` | v2.0.0-beta.1 | a noble's first years in beta.1's world (made before D-141: any life) | Load it; the Life tab |
| `v2.0.0-beta.1-soldier.ardan` | v2.0.0-beta.1 | a soldier's first years in beta.1's world (any life) | Load it; the War tab |
| `v2.1.0-alpha.1-noble.ardan` | v2.1.0-alpha.1 | a noble's first years in alpha.1's world (made before D-141: any life) | Load it; the Life tab |
| `v2.1.0-alpha.2-noble.ardan` | v2.1.0-alpha.2 | a noble's first years in alpha.2's world (any life) | Load it; Next month and Next year |
| `v2.1.0-alpha.3-artisan.ardan` | v2.1.0-alpha.3 | an artisan's first years in alpha.3's world (any life) | Load it; the Life tab |
| `v2.1.0-alpha.4-merchant.ardan` | v2.1.0-alpha.4 | a merchant's first years in alpha.4's world (any life) | Load it; the portrait on the Life tab |
| `v2.1.0-alpha.5-peasant.ardan` | v2.1.0-alpha.5 | a peasant's first years in alpha.5's world (any life) | Load it; the profile page |
| `v2.1.0-alpha.6-noble.ardan` | v2.1.0-alpha.6 | a noble's first years in alpha.6's world (any life) | Load it; the Life tab |
| `v2.1.0-alpha.7-peasant.ardan` | v2.1.0-alpha.7 | a peasant's first years in alpha.7's world (any life) | Load it; the People tab's household |
| `v2.1.0-alpha.8-artisan.ardan` | v2.1.0-alpha.8 | an artisan's first years in alpha.8's world (any life) | Load it; the names on the People tab |
| `v2.1.0-alpha.9-marshal.ardan` | v2.1.0-alpha.9 | a life saved from 6dbabd3's build, where a Marshal's posts went wrong (the repro of `postsMarshalRepro`) | Load it; the War tab |
| `v2.1.0-alpha.9-peasant.ardan` | v2.1.0-alpha.9 | a peasant's first years in alpha.9's world (any life) | Load it; the dress on the Life tab |
| `v2.1.0-alpha.10-noble.ardan` | v2.1.0-alpha.10 | a noble's first years in alpha.10's world (any life) | Load it; the Life tab |
| `v2.1.0-alpha.11-phone.ardan` | v2.1.0-alpha.11 | a noble's life to look at on a phone-sized screen: safe areas, no zoom or bounce, fingertip-wide controls, one sound engine | Open the game at 375 x 667 (a phone, or the browser's device view), load it, and press through the Life, People and World tabs and the Menu: every control at least 44 points, nothing under the notch or the home bar, no text selected by a long press, no pinch zoom; turn sound on from the Menu and it plays after the first tap |
| `v2.1.0-alpha.12-summoned-lord.ardan` | v2.1.0-alpha.12 | a landed lord, head of his house, summoned by his crown to a war: the summons and its answers (in full, with part, a deputy, coin, excuses, refusal), with his reasons | Load it: the summons card is the first thing that waits (the crown's war and what each answer costs); answer it, and the War tab shows the host he sent |
| `v2.1.0-alpha.13-peace-table.ardan` | v2.1.0-alpha.13 | a ruler whose war has come to terms: envoys asking for terms, or terms offered him, as real land, coin and crowns, with how the other crown leans in words | Load it: the war's card waits (envoys at court, or terms offered); the War tab's peace table lists the terms he may ask, with the other crown's lean |
| `v2.1.0-alpha.14-muster.ardan` | v2.1.0-alpha.14 | a peasant of 18 at his lord's muster, the muster-master's card waiting: he is read (weapon, way of fighting, aptitudes) and offered two or three branches with their reasons | Load it; answer the muster card, then the War tab's Your place, Your company and Your road |
| `v2.1.0-alpha.15-ageing-world.ardan` | v2.1.0-alpha.15 | a noble at 55, thirty-five years into a world where everyone ages: his parents' generation gone by their years, no one past his people's span, the houses he knows married and with heirs, deaths of unmet kin told in the story | Load it; the People tab (ages, the dead of his house) and the Dynasty tab; play a year and read the year's digest |
| `v2.1.0-alpha.16-young-noble.ardan` | v2.1.0-alpha.16 | a noble boy of eleven: Next year is the only button until twelve, then Next month (D-160); grown, the murder, treatise, petition, breakthrough and throne-plot limits of Phase 1 | Open the game with ?dev at the end of its address (the developer switch, D-166), then Menu, Load save file; press Next year once to reach twelve |
| `skills-v16-before-the-switch.ardan` | (save version 16) | a noble of 23, saved by the build before the skills rebuild's switch (`d99799c2`): S1's table with its rungs beside it; `sk2Migrate` loads it through the switch (every read the same on load, the held half steps landed by the first month) | Load it; the Profile's skills read "C · Lv 3" and the like |
| `v2.1.0-alpha.17-noble-life.ardan` | v2.1.0-alpha.17 | a noble's first three years: any version's world, loaded and played on | Load it from the Menu (Load save file); the Life tab |
| `v2.1.0-alpha.18-noble-life.ardan` | v2.1.0-alpha.18 | a noble's first three years: any version's world, loaded and played on | Load it from the Menu (Load save file); the Life tab |
| `v2.1.0-alpha.19-noble-life.ardan` | v2.1.0-alpha.19 | a noble's first three years: any version's world, loaded and played on | Load it from the Menu (Load save file); the Life tab |
<!-- saves:end -->
