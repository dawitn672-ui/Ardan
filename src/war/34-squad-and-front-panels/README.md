# Both scales at once

**Aspect:** Uniqueness (signature system 3; Road to Ten, Uniqueness 4) · **Kind:** system plus 1 event

The plan's third signature: "a nobody in a 200-division war who feels the squad and the front together". The benchmark spec adds: "every battle the player is in shows three panels side by side: what you saw, the front map, and what the chronicle will say. They are allowed to disagree."

In the release, a common soldier in a war-map fight was asked one question before it ("take your place in the line" or "keep your head down"). Afterwards they got one log line: "Battle of X: your side is beaten. 1,830 fall. Merit +5."

**What it does.**

- **Before the fight.** When the release asks its question (`A.wsPCFightStart`), this feature notes your health, your merit and your squad.
- **After the fight.** When the fight ends (`A.fightEnd`), a reckoning is queued: "After Castella". It comes at most once every 90 days, so a soldier in a long war isn't buried in scenes. Three panels sit side by side, and wrap on a phone:
  1. **What you saw.** How it felt (won or lost); the comrades from your section who didn't come back, by name; your wounds; your merit.
  2. **The front.** The days, the men, the true dead on both sides, each side's plan on the last day, and the after-action causes from 23 ("the ground +15%, your counterattack countered their frontal assault +15%").
  3. **What the chronicle will say.** Your realm's chronicler counts the enemy dead 1.6 to 2.5 times over and your own as many times fewer. A defeat becomes a host that "sold their lives dearly against a far greater host". The words are the chronicler's, so they can be false.
- **The choice.** Remember it as it was (will), tell it the chronicle's way (fame for honour), or, if anyone died, drink to them by name.
- **Registered.** `A.SIGNATURE.bothScales`, which is the bench's third signature.

**An example from the test.**

- **What you saw:** "You remember the order to fall back, and how few heard it. Everyone in your section came back, which nobody says out loud. You came out of it with bruises. Your name went up the list (merit +5)."
- **The front:** "4 days at Castella, on hills: 23,193 men. Aldmark gave way. Dead: 1,001 of yours, 829 of theirs…"
- **The chronicle:** "At Castella the men of Aldmark sold their lives dearly against a far greater host. 1,500 of the enemy fell; of ours, 560, and each of them a hero."

**Measured by** (`test.mjs`):

- `bothScalesReckoning`: an enlisted soldier in a real war gets a reckoning.
  - All three panels are on screen with no raw tokens.
  - Drawing them is pure.
  - The chronicle's counts disagree with the front's in the chronicler's favour.
- `bothScalesRegistered`: the signature is registered.

The event passes `tools/lint-events.mjs` and `tools/lint-choices.mjs`.

**Rules kept.**
- The panels come from the event's ctx (plain strings and numbers).
- The chronicler's inflation is a hash of the fight, so it draws nothing from `A.rand`.
- All text goes through `UI.esc`.

**Limits.**
- **War-map fights only.** Line battles you command already have their own screen and report (23); this covers the war-map fights a common soldier is swept up in.
- **No new choices in the fight.** The squad-level choices inside the fight are the release's own line mission. War step 1, choices that move the result 10–20% at every rank, isn't built.
- **No front map.** The front is a paragraph, not a picture.
