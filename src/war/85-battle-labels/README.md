# 85-battle-labels: unit labels keep apart on the battle field

**Why.** The battle field draws each unit's label centred on its block, with no regard for its neighbours. In a crowded centre, such as four or five units in a 3,000-a-side battle, the labels printed over each other: "Heavy infSpeaCrossbowmen", "Crossbo Garrison troops". It was found on a playtest pass of the battle screen.

**What.** `UI.bfLabel` (`labels.core.js`) draws each label. Each frame keeps the boxes of the labels already drawn, on the canvas context and never in the game state. A label that would overlap one moves 12 or then 24 px away from the line: up on the enemy's side, down on yours. If there is still no room, it shows only its count ("1.1k"), and the full names stay in the side panel. Three patches route the label through it, clear the boxes at the start of each frame, and draw the labels after every block, so a later unit cannot cover an earlier unit's label.

**Rules kept.** Drawing only: no game state is read or written beyond what the release drew, and no random numbers are drawn.

**Test.** `blNoOverlap` draws the tooltip suite's 3,000-a-side battle in each of its views. No two labels may overlap, and the state and the random stream must be unchanged.

**Cycle 1 (visual I3).** `m-field.core.js` and patch `BF-FIELD`: with the colour prints on, the field is a woodblock print (sky band in the battle's hour, ridges, lit ground), units are banner masses (pikes, horses, bows under a pole in the realm's colour), field labels are counts with the full name on hover, one caption per wing, and the end is a small cartouche with the VICTORY or DEFEAT cut-in (`bfPrint`). Not done: clash flashes and move arrows.

**Cycle 2 (lane G, `n-motion.core.js`; the battle screen's look only, lane WD owns its engine).** Over the field, in the canvas's own coordinates:
- **Intent:** for each wing of each side, an arrow for advance or charge, a reversed one for withdraw, a shield for hold, from the unit's own order (`u.next`, when 9997 provides it) or else from what the field shows; drawn in with the ink stroke on a new pulse.
- **Clash flashes** where two wings meet, sized by the men who fell there since the last pulse; **smoke** from the clash and **dust** behind charging horse.
- **Standards** at the rear of each wing that sway for three beats of a pulse, then stop.
- **The camera** frames the decisive wing (where most fell, or a side broke): the canvas is redrawn from its own picture, eased in to 1.16× on that wing, held, and eased back; the wing is named in a skewed caption.

The men of each unit at the last pulse are kept in a WeakMap keyed by the battle, never in `A.S`; puffs hash the battle and pulse. Reduced: still marks, no camera; Off: no animation. `bfMotion`.
