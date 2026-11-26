// Retired by order 92 (D-185): "no hints throughout the games on titles". Never built, never tested. As they last stood
// in src/people/9999976-titles (last built at 177c9970).

// ---- a-titles.core.js: hints, rumours of a title one has done a deed toward
// a title with a hint, not held, whose watched deeds he has done at least once, not yet heard of (at most once a life)
TT.hintable = function (p) {
  if (!p || !p.dl) return [];
  const heard = (p.tt && p.tt.hd) || [];
  return TT.PERSON.filter(t => t.hint && !TT.holds(p, t.id) && !heard.includes(t.id) && (t.watch || []).some(k => k !== 'month' && TT.led(p, k)));
};
TT.heard = function (p, id) { const tt = p.tt && typeof p.tt === 'object' ? p.tt : (p.tt = {}); tt.hd = (tt.hd || []).filter(x => x !== id).concat([id]); };

// ---- a-titles.core.js, TT.granted: the line the player read when the crown withheld a title whose conditions he had met
//   const op = A.opinion ? A.opinion(ru, p) : 0, n = TT.nameFor(t, { realm: r.short || r.name || '' });
//   ...
//   if (isPc(p) && A.log) A.log(`${A.fullName ? A.fullName(ru, false) : 'The crown'} does not name you ${n} this year.`, '');

// ---- b-view.core.js, Records' "Titles" section
//   heard = (tt.hd || []).filter(id => TT.BY.get(id) && TT.BY.get(id).hint);
//   if (heard.length) s += '<h4 class="pf-h2">Things you have heard</h4><ul class="pf-list">' + heard.map(id => li('A tale', `<span class="pf-w">${esc(TT.BY.get(id).hint)}</span>`)).join('') + '</ul>';
// ---- b-view.core.js, TT.cardText: every holder's card showed the deed (the sentence written when it was earned, and the
// title's own text); since order 92 only the player's own card does
//   if (h) s += ` Earned in ${h.y} AR. ${h.w || ''}`;
//   if (t.text) s += ` ${t.text}`;

// ---- titles.events.js: the card (the texts it told are in hints.json)
A.defEvents([
  { id: 'tt_hint', title: 'A name in the telling', w: 1, cool: 6, scene: 'tavern',
    cond: (p, C) => C.adult(p) && !C.prison(p) && !!(A.TT && A.TT.hintable(p).length),
    setup: (p, ctx) => {
      const l = A.TT ? A.TT.hintable(p) : [];
      if (!l.length) { ctx.skip = true; return; }
      const t = A.pick(l);
      ctx.tid = t.id; ctx.hint = t.hint;
      ctx.teller = { faith: 'an old priest', service: 'an old clerk of the courts', mastery: 'a minstrel', infamy: 'a drunk in the corner', world: 'a pedlar from the coast' }[t.kind] || 'an old soldier';
    },
    text: 'Over a cup, {teller} tells a story to whoever will listen. "{hint}" Then the talk moves on, as talk does.',
    choices: [
      { t: 'Buy the teller another cup, and listen', r: 'The rest of the tale is mostly the cup talking. Some of it stays with you.',
        fx: (p, ctx) => { if (A.TT) A.TT.heard(p, ctx.tid); p.coin = Math.max(0, (p.coin || 0) - 2); p.happy = Math.min(100, (p.happy || 0) + 1); return ''; } },
      { t: 'Laugh, and finish your own cup', r: 'A tale for the credulous. Still, you remember it on the road home.',
        fx: (p, ctx) => { if (A.TT) A.TT.heard(p, ctx.tid); p.happy = Math.min(100, (p.happy || 0) + 2); return ''; } },
    ] },
]);
// tools/lint-titles.mjs also checked: if (t.hint && /\d/.test(t.hint)) fail(t, 'a hint names nothing exact: no numbers');
