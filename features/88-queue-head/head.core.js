// An event that bows out is never drawn. The engine drops a queued event whose setup gives up (ctx.skip) or whose
// text keeps an unfilled {token} in A.headReady, which the clock calls on every tick. But an action that spends days
// (buying a hovel, a journey: anything that calls A.advance) left the queue as it stood, and the screen drew its head
// straight away: "{n} people you know believe {said}. {them} is one of them." (found by tools/soak.mjs, after
// "buyProp hovel"). The same path skipped headReady's rule against showing an event seen in the last 240 days.
// A.advance now settles the queue's head before it returns, as the clock does after each day; and the modal draws
// no event the engine has marked to skip, as a second line. The random stream is unchanged in order: the view
// headReady computes is the one the screen would have computed a moment later.
(function () {
  const adv = A.advance;
  A.advance = function () {
    const r = adv.apply(this, arguments);
    try { if (A.S && A.S.queue && A.S.queue.length && A.headReady) A.headReady(); } catch (e) { console.error('queue head', e); }
    return r;
  };
  // the modal's view of the queue: the head, unless it is an event the engine has already decided to skip
  UI.queueHead = function () {
    const S = A.S, q = S && S.queue && S.queue[0];
    // the view is the one the modal computes anyway (A.eventView keeps it on the item), so asking for it first changes
    // nothing in the order of the random stream
    if (q && q.type === 'event' && !q.result && A.eventView && A.eventView(q).skip) return null;
    return q || null;
  };
})();
