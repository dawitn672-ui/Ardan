# 82-early-years: the first years pass quickly, childhood a little faster

**Why.** A life begins at birth. A newborn's first event comes 400 to 1,500 days in: 24 lives on four starts, and one waited more than five years. At the default clock speed of 4 days a second, that is 2 to 6 minutes of real time with nothing to do. It is the first thing a new player meets, and the playtest's fourth task ("let time run until something happens") waits on it. Well-loved life sims move through infancy fast: BitLife ages a year per tap, and Crusader Kings III hurries a child's early years.

**What.**
- The clock runs faster in childhood, at every speed (`early.core.js`, `UI.clkRate`). The factors come from the measured gap between prompts at the default speed, over 16 lives from birth on four starts:

  | Age | Gap between prompts | Factor | Real time between prompts |
  | --- | --- | --- | --- |
  | under 5 | 214 days | ×10 | about 5 s |
  | 5 to 9 | 122 days | ×3 | about 10 s |
  | 10 to 14 | 61 days | ×1.5 | about 10 s |
  | 15 and over | 31 days | ×1 | about 8 s |

  Without it, ages 5 to 9 waited half a minute between prompts, for some seven minutes of a playtest.
- The clock bar shows "early years ×10", "childhood ×3" or "youth ×1.5" beside the speed buttons. It is hidden on narrow screens, where the bar has no room.
- Two patches route the clock's rate through `UI.clkRate` and add the note.

**What does not change.** Only the wall clock. The same days pass in the same order, with the same draws, so a life plays out exactly as before. "Next" (run until something needs you) and the speeds work as they did.

**Tests.**
- `eyFirstEventFast` runs the real clock in real time for three newborns. The first stop came after 9 to 26 seconds, where it would have taken 94 to 255. Each life is the same, day, state and random stream, as one run at the fastest ordinary speed without the hurry.
- `eyBands`: 40 days a second at age 0, 12 at 6, 6 at 11 and 4 at 16, each with its note (none at 16).

**For the owner.** One of the three test newborns died at age one, before any event. Canon wants that (life expectancy at birth about 36), but it is a hard first minute for a new player. Many games keep the first life gentler: a protected first childhood, or a start at 16 by default. That is a design call.
