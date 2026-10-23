# 85-battle-labels: unit labels keep apart on the battle field

**Why.** The battle field draws each unit's label centred on its block, with no regard for its neighbours. In a crowded centre, such as four or five units in a 3,000-a-side battle, the labels printed over each other: "Heavy infSpeaCrossbowmen", "Crossbo Garrison troops". It was found on a playtest pass of the battle screen.

**What.** `UI.bfLabel` (`labels.core.js`) draws each label. Each frame keeps the boxes of the labels already drawn, on the canvas context and never in the game state. A label that would overlap one moves 12 or then 24 px away from the line: up on the enemy's side, down on yours. If there is still no room, it shows only its count ("1.1k"), and the full names stay in the side panel. Three patches route the label through it, clear the boxes at the start of each frame, and draw the labels after every block, so a later unit cannot cover an earlier unit's label.

**Rules kept.** Drawing only: no game state is read or written beyond what the release drew, and no random numbers are drawn.

**Test.** `blNoOverlap` draws the tooltip suite's 3,000-a-side battle in each of its views. No two labels may overlap, and the state and the random stream must be unchanged.
