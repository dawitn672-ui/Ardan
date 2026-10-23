# 83-obituary-caps: the obituary's first letters stay in their words

**Why.** The release gives event text an illuminated initial: `.mbox .mtext:first-letter` floats a large first letter beside the paragraph. The death screen uses the same box for its obituary, but its lines are short and centred. There the float pulled the first letter away from its word, and the life read "M … aster of the hunt" and the epitaph "W … orked, ate, loved a little". It was found by looking at the screens a playtester meets.

**What.** One CSS edit to the page shell: the rule now applies to `.mbox:not(.obit)`. The obituary keeps plain letters, and events keep their initial.

**Test.** `obCaps` draws a death screen and an event. It checks that the obituary's first letters do not float and the event's first letter still does.
