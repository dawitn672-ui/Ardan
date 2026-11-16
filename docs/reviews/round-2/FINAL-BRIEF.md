# Ardan harsh critique, final round: brief for the deciding critics

You are one of the **deciding critics** for Ardan v2.0.0-beta.1. An earlier round of critics (on another model, at
normal effort) has gathered evidence and written first-draft reports. Your judgment replaces theirs: the owner wants
this critique done at the deepest level, because it steers every step of the work that follows.

Read `/tmp/ardan/critique/BRIEF.md` first: it explains the game, the frozen copy of the repo at `/tmp/ardan/snap`
(read only), how to drive the game with Playwright, and the owner's complaint list. One more complaint arrived later:

12. **Time steps.** The owner wants to advance either one month or one whole year: "There's no need to go month by
    month as a child without a reason and there are times simming a whole year is too much as an adult." (Today only
    "Next month" exists, by the v2 rule "one button moves time"; that rule is being reversed.)

## Your inputs (use them, but trust nothing you have not checked)
- The first-draft report for your lens, `/tmp/ardan/critique/<lens>.md`, and its evidence folder
  `/tmp/ardan/critique/<lens>/` (scripts, screenshots, measurements). Reuse its scripts and numbers where they hold;
  re-measure where a claim matters and looks shaky. Some claims will be wrong, some ratings too soft or too harsh, and
  much will be missing.
- Also available when present: `/tmp/ardan/posts-map.md` (a map of every store of "who holds which post", with a
  reproduction of the marshal bug), `/tmp/ardan/coh/` (a first coherency run's output), and the other lenses'
  first drafts (read them to avoid duplicating, and to catch what falls between lenses).

## What you must do
1. Play the game yourself through the real UI (Playwright, 420 px and 1366 px), enough to form your own view, and
   read the code where a flaw's cause matters. Look at your screenshots.
2. Write `/tmp/ardan/critique/final/<lens>.md`:
   - A table of **every flaw** in your area, most severe first: `| # | Flaw (concrete: exact on-screen text, screen,
     function or file, numbers) | Severity /10 | How to fix (short, specific: technique, data, where in the code) |`.
     Severity: 10 = breaks the game or the owner's trust, 1 = polish. Be harsh and exact; no padding, no vague items.
     Merge the first draft's real findings (corrected and re-rated) with your own. Mark each row's source:
     `[v]` verified by you, `[d]` taken from the first draft unverified.
   - A section **"What the first draft got wrong"** (claims you disproved, ratings you changed and why).
   - A section **"Keep"**: what is good and must not be torn down.
   - A section **"Order of work for this lens"**: which fixes first and why (dependencies, risk, owner impact).
3. Do not edit anything in `/tmp/ardan/snap` or `/home/user/Ardan`. Keep the report under about 5,000 words.
4. Return a 6-line summary as your final message.
