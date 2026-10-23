# 78-playtest-log: what the player did, in the results file

**Why.** Playtest mode (Menu → "Playtest mode") times the ten key tasks and downloads the results. That shows whether a new player can find things. It does not show what they did with the session: where they stalled, which events held them, which tabs they never opened, what broke. Studios learn the most from exactly that, and Ardan's playtests had no record of it.

**What.** While a playtest runs, `playtest-log.core.js` keeps a log in memory on `UI.ptLog`:
- every control the player used: the `data-a` action, its argument, and the screen, tab, year and age it happened at;
- each event answered: its id, the choice as the button showed it, and how many seconds it was on screen;
- the tabs opened;
- every pause of a minute or more, and where it happened;
- every error: uncaught ones, rejected promises, and the faults features catch and report with `console.error`;
- where the player was when they stopped, and their last 30 actions.

The bar's close button sits in its corner (it used to wrap onto a line of its own), and on a desktop the bar is 520 px wide so a task, Start and Skip share one line.

"Download results" puts it in the file as `session`, beside the task results (`patches.mjs`, one edit to `ptSave`).

**Rules kept.** The log lives on `UI`, never in `A.S`. It draws no random numbers and changes no game state, so a life plays the same with it as without it. It uses wall-clock time, as the playtest's own task timer does. Nothing leaves the machine unless the player downloads the file.

**Tests.**
- `plSessionInFile`: plays a short session through the real buttons, downloads the file, and reads the events, tabs, errors and stopping point back out of it.
- `plPure`: the same clicks with the log on and off give the same state and random stream.
