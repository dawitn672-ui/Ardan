# Feedback

**Aspect:** UI and UX (the owner: "a lot of the buttons don't work") · **Kind:** system (one core file), plus a test

## Why

Some actions wrote their result only into the story log. "Enlist in the army" makes you a soldier and logs "You take the coin of Aldmark and swear the oath"; "Join a mercenary company" and "Burgle a house" do the same. On a desktop the log is two columns away from the button. On a phone it is on another tab. The button looked dead though it had worked, which is the classic feedback failure (Norman: every action needs a visible response near where it was taken).

## What it does

After an activity, an interaction, a duty, a council or court action, or a purchase, if the action showed no message of its own, opened no sheet and queued no scene, the newest story line it wrote (a "big", "good" or "bad" line first; never lore) is shown as a toast. It reads the log and changes nothing in the game.

- **Menu toggles.** A second click on Menu closes it; it used to reopen the same menu, so the click seemed to do nothing.
- **The map says which mode is on.** The map's mode buttons carry `aria-pressed`; the release showed the active one by colour only.

## Tests

`fbMenuToggles`: Menu opens, a second click closes it; the active map mode is pressed. `fbEnlistSays`: enlisting, joining a company and a burglary each show a toast with the line the log got; an action that already toasts keeps its own message; the state and the random stream are the same with and without the layer.
