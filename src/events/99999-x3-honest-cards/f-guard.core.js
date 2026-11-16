// X3 part 2: the last look at a card before the player sees it (E3, E4, E5, E7). The scene's own condition, A.evFit and the weights
// keep most wrong cards from being dealt (d-station, e-place); a scene queued by name (a chain, a promise, an arc's next step, a
// world event with `trigger: true`) bypasses them, and a text built at run time says things its source never shows. Here the card
// as the player would read it is checked once, after every other stage has written on it:
//   - station: no word that addresses the player by a station he does not hold (A.X3.stationBreach);
//   - place: no card set in the home town for a player who stands elsewhere (A.X3.homeBreach);
//   - childhood: nobody under six is asked an adult's question: a scene dealt to a small child must be one its own condition lets him
//     in (a world event with `trigger: true` skips the condition when it is queued; "Tend the neighbours yourself" at three was one);
//   - counsel: only someone who is there advises (A.X3.present); a voice from a house across the realm is taken off the card.
// A card that fails is skipped the way a card with an unfilled token is (viewSkip): the queue moves on and nothing is told. What was
// dropped is counted in A.X3.stats for the tests and the lint.
(function () {
  const X3 = A.X3 = A.X3 || {};
  X3.stats = { station: {}, place: 0, child: 0, counsel: 0, seen: 0 };
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  X3.cardText = v => [v.title, v.text, v.more, ...(v.choices || []).map(c => c.t)].filter(Boolean).join(' \u0001 ');
  A.addStage('A.eventView', 'x3-honest-cards', view => function (q) {
    const fresh = !!q && q.type === 'event' && !q.view;
    const v = view.apply(this, arguments);
    try {
      const pc = A.pc();
      if (fresh && v && q.view === v && !v.skip && !q.result && pc && pc.alive && !v._x3) {
        v._x3 = 1;
        X3.stats.seen++;
        const e = A.EV[q.ev], text = X3.cardText(v);
        // a step of a story already begun (an arc's, a chain's, a forced scene) is that story's own consequence: station and place do not drop it
        const story = !!(q.forced || (q.ctx && (q.ctx.arc || q.ctx.lfFrom)) || (e && X3.followsStory(e)));
        const st = story ? [] : X3.stationBreach(pc, text);
        if (st.length) { v.skip = true; bump(X3.stats.station, st[0].id); v.x3Why = 'station ' + st[0].id + ': ' + st[0].word; }
        else if (!story && X3.homeBreach(pc, text)) { v.skip = true; X3.stats.place++; v.x3Why = 'home town while away'; }
        else if (e && e.cond && A.age(pc) < 6 && !(q.ctx && q.ctx.arc) && !(function () { try { return !!e.cond(pc, A.C); } catch (err) { return true; } })()) { v.skip = true; X3.stats.child++; v.x3Why = 'a scene for older lives, dealt to a child'; }
        if (v.skip) q.ctx = Object.assign(q.ctx || {}, { skip: 1 });
        else if (Array.isArray(v.adv) && v.adv.length) {
          const here = v.adv.filter(x => X3.reaches(pc, A.P(x.id)));
          // one who is not in the room writes: the line is a letter's
          for (const x of here) if (!x.far && X3.reaches(pc, A.P(x.id)) === 'letter') { x.far = 1; x.l = 'A letter from home: ' + String(x.l).replace(/^./, c => c.toLowerCase()).slice(0, 130); }
          if (here.length !== v.adv.length) { X3.stats.counsel += v.adv.length - here.length; if (here.length) v.adv = here; else { delete v.adv; delete v.big; } }
        }
      }
    } catch (err) { console.error('x3 guard', err); }
    return v;
  });
})();
