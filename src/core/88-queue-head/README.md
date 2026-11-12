# 88-queue-head: an event that bows out is never drawn

**Why.** The engine drops a queued event whose setup gives up (`ctx.skip`), or whose text keeps an unfilled `{token}`, in `A.headReady`, which the clock calls after every day. An action that spends days (buying a hovel, a journey, anything that calls `A.advance`) left the queue as it stood, and the screen drew its head at once. The soak monkey (`tools/soak.mjs`, seed 31, run 5) found a player-visible screen after "buyProp hovel":

> Doors close a little sooner when you pass. By the third day you have the shape of it: {n} people you know believe {said}. {them} is one of them.

That was 64-npc-beliefs' `nb_slander_spread` with nobody holding a slander. The same path also skipped `headReady`'s rule against showing an event seen in the last 240 days.

**What.**
- `A.advance` settles the queue's head before it returns, as the clock does after each day (`head.core.js`).
- As a second line, the modal draws the head through `UI.queueHead`, which hides an event the engine has marked to skip (patch `QHEAD-MODAL`).
- The random stream runs in the same order: the view `headReady` computes is the one the screen would have computed a moment later. `renderRng`, `replayWithRender` and `journalReplay` all pass.

**Test.** `qhSkipNotDrawn` puts the slander event on the queue by hand with nobody holding a slander. No raw token may reach the screen, and after a day passes it must be gone from the queue. An ordinary event must still be drawn. The build without this feature fails: raw tokens on screen, and the event still queued.
