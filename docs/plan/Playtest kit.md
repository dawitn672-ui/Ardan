# Playtest kit

How to run Ardan's first playtests with five new players, and what to do with what comes back. The Road to Ten asks for this (Usability, step 8): five players who have never seen the game, timed on the ten key tasks. The bar is met when five of five finish in under ten minutes.

## What to send

Send one file: `index.html` from the repository (about 4 MB). It needs no install and no network, since the fonts are inside it (77-offline-fonts). It opens in any current Chrome, Edge, Firefox or Safari, on a computer or a phone. Ask the player to double-click it, or to open it in their browser with File → Open.

Saves live in the browser that opened the file. A player who switches browsers or devices starts over. If one player uses the same machine after another, clear the old save first: Menu → New life, or use a private window.

## The session (45 minutes)

1. **Before (2 minutes).** Say only this: "It's a game about living a life in a medieval world. I'm testing the game, not you. Please think out loud. I can't help you, but you can stop whenever you like." Do not explain the game.
2. **Start playtest mode.** Open the game, then Menu → **Playtest mode**. A bar at the bottom shows one task at a time, with Start and Skip. The player presses Start, does the task, then presses Done, or Give up if they are stuck. The game times each task.
3. **The ten tasks** (the game shows them, in this order):
   1. Start a new life of your own choosing
   2. Find out how healthy you are
   3. Choose something to train
   4. Let time run until something happens, and answer it
   5. Open the profile of someone in your family
   6. Find out what work you could do
   7. Find out whether your realm is at war
   8. Look at the map of the world
   9. Save the game
   10. Make the text bigger
4. **Free play (about 25 minutes).** When the bar says "Playtest finished", let them keep playing however they like. The log keeps recording.
5. **Download.** Press **Download results** on the bar. The file is `ardan_playtest_<date>.json`. Collect it from each player.
6. **Five questions (5 minutes).** Ask them aloud and write the answers down:
   1. What was the game about?
   2. What was the most interesting moment?
   3. When were you confused?
   4. Was there a moment you wanted to stop?
   5. Would you play it again? Why, or why not?

## What the results file holds

- `results`: each task, with done or given up, the seconds it took, and how it ended.
- `session` (78-playtest-log): what the player did.
  - `counts`: every control used, with how often.
  - `events`: each event answered, the choice as the player saw it, and the seconds it was on screen.
  - `tabs`: the tabs opened.
  - `stalls`: every pause of a minute or more, and where it happened.
  - `errors`: every error the page raised. **This should be empty.** If it is not, send the file to the developer: it says where the error happened.
  - `stoppedAt`, `lastActions`: where they were when they stopped, and what they did just before.
- `build`, `screen`, `ua`: which build, the screen size, and which browser.

## Reading five files

- **The bar.** A player meets it if they finish all ten tasks in under ten minutes, counting the `seconds` in `results`. The bar is met when all five players do.
- **A task two or more players gave up on** is a usability bug. Fix it before anything else.
- **Stalls** in the same place for two or more players mark a confusing screen.
- **Events read for under 3 seconds** were skipped, not read. If most are, the text is too long, or the choices are too plain to need reading.
- **Tabs nobody opened** are hidden or uninteresting.
- **Where they stopped,** set against the answer to "a moment you wanted to stop", is the most useful single fact in the session.

## Before each round of players

The checks that `index.html` is safe to send all pass on the commit it was built from:
- `node tools/check.mjs`: lints, tests and the balance league.
- `node tools/soak.mjs --runs=8 --steps=800`: a monkey that plays through the real screens. It must find 0 errors.
