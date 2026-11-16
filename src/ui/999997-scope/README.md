# 999997-scope: one `UI.scope(pc)`

**Aspect:** UI and UX, declutter (round 2 B5 part 2, CRITIQUE U4; D-055) · **Kind:** two readable core files (`a-scope.core.js` the reader, `b-routes.core.js` the wiring), test.

**Why.** "Screens ignore age, class and rank." A peasant of 9 had an Arms page with "Ask to join"; a newborn was offered "See a physician" and told he looks homely; a father's card offered "Pick a fight"; a Chancellor was told "Find work"; a child of twelve was offered "Burgle a house". Each gate had been written where its bug was found (the class gates of `A.canAct`, 49-body-mind's stages, 99992-v2-time's Arms at 14, 99997-v2-war's war rules by post), so every new page forgot one.

**What it is.** `UI.scope(pc)` is a pure function of state (it is kept while what it reads is unchanged). It reads age and stage, class and status, the posts the person holds (`A.POSTS.held`, 999990-posts), the war rank and deployment (`A.V2W`, 99997-v2-war: read, not repeated) and the household, and answers four questions for that one person:

| Question | Answer |
| --- | --- |
| `s.sees(thing)` | a surface or line: `looks`, `skills`, `plan`, `know`, `schools`, `court`, `factions`, `gear`, `mark`, `findWork`, `warroom`, `campaign`, `arms`, `decisions`, `statecraft` (`UI.SCOPE.SEES`) |
| `s.page(key)` | is the page in his places (`UI.SCOPE.PAGES`: Decisions, Path, Holdings, Realm, War) |
| `s.act(key)` | `{ show, why }`: false when no life like his is ever offered that activity (`UI.SCOPE.ACT_RULES`, data) |
| `s.social(t, opts)` | the actions on another person's card, cut to what his age and place allow toward them |

`s.stage` is infant (under three, scaled to the people), child, teen, adult or old; `s.minor`, `s.dependent` (a minor, or a youth under his parents' roof), `s.settled` (a post, trade, commission, land, title or gentle birth), `s.post` (`held`, `kinds`, `seat`, `ruler`, `any`, `name`), `s.war` (`in`, `rank`, `deployed`, `room`, `arms`), `s.home`.

**Hidden is not refused.** What a life is never offered is not listed (it used to be a disabled line with a reason: "Enlist in Aldmark's army: Not in your position", "Govern the realm: Only a ruler governs"). What is refused only today (a thin purse, "once a year") stays `A.canAct`'s.

## Where it is read

- `A.canAct` (last wrapper): a hidden activity is refused with a reason the Life page already hides (`UI.SCOPE.HIDDEN`, the list that was the Life page's own); the Life page, the Path page's doors, What now and the bench bot all go through it.
- `A.interactOptions` (last wrapper): an infant's card has only "Spend time together"; a dependent does not pick a fight with, insult, duel, murder or plot against a parent; a minor has no courting, plotting or duel; nobody duels or picks a fight with a child.
- `A.whatNow`: no "Find work" for a squire, a councillor, a lord or anyone with a post (release `15-specialisms-and-promotion`, `sees('findWork')`); no activity he is not offered; no War Room line for a rank without one.
- The places (`A.V2T.groups`, wrapped last): Decisions, Path, Holdings, Realm and Arms go from the bar for the lives with no use for them yet; a page opened by hand says so in one line (`UI.SCOPE.NOT_YET`).
- The release: the rail's Looks bar, the person card's "Get to know", the plan card's aims (an aim he cannot take is not a disabled option), the Path page's Army, Company and Schools rows; the profile's looks line and skills (`PF.skills`) and `UI.profBlock`.

## Tests (`test.mjs`)

`scopeShape` (the shape, same object while nothing moves, pure), `scopeActs` (A.canAct for an infant, a child of 12, an adult and a councillor), `scopeSixLives`: a newborn, a child of 9, a squire of 16, a File-Leader at war, a captain in garrison and a councillor draw every page (at 1366 and 420 px), the overlays (house, proficiencies, profile, tree, war room) and three people's cards with no string their life forbids. The forbidden lists are data at the head of the test (`LIVES`), one per life, and each life has what it must still show (so a page is not hidden empty). `b5Tablet` holds part 1's tablet claim: on a coarse pointer at 768 and 1024 px the time buttons are 44 px targets in view and no page scrolls sideways (the phone shell on a tablet is not done: D-055).

## Edits outside this folder

`src/core/release/core/23-ui-a.js` (rail Looks), `23-ui-e.js` (Life's hidden reasons, plan aims, Path rows, "Get to know"), `15-specialisms-and-promotion.js` (Find work), `src/ui/999996-profile-tab/` (looks, skills).

**Undo.** Delete this folder and revert those edits (each has a "B5 part 2" comment).
