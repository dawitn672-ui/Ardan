// Memory weave, part 1 of 2: the record (Road to Ten, Events 2: "Any choice can leave a memory (who, what, when)").
//
// Every event choice the player makes leaves a memory, written from what the choice did rather than from what its
// fx say it might do (fx can be functions, and checks branch). The wrapper on A.eventChoose snapshots the player
// before and after: coin, health and wounds, prison, renown, honour, piety, the opinion of whoever the scene is
// about (ctx.pid), and new people met. From the difference it writes one compact line:
//
//   { y year, e event id, c choice index, ok check won/lost/none, s skill or stat checked, p person, sh kind of
//     scene (tavern, market, road ...), k what it did (kind, wrong, hurt, loss, gain, law, name, shame, met),
//     n coin moved, d the deed in the past tense ("you tried to talk him down, and failed"), t the scene's title }
//
// pc.mw = { v: 1, m: [lines, newest last, at most KEEP], last: { eventId: [year, choice, ok, deed] } }
// The field is new: a save without it loads with an empty record. Strings are stripped of < > " { } before they
// are stored, and the deed is cut to 110 characters.
//
// Engine side only: the record is written inside A.eventChoose. Nothing here draws from the random stream.
(function () {
  const MW = A.MW = Object.assign(A.MW || {}, {
    KEEP: 90,        // memory lines kept per life (the weakest of the oldest go first)
    LAST: 400,       // events whose last choice is remembered
    stats: { noted: 0 },
  });
  const clean = s => String(s == null ? '' : s).replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim();
  MW.clean = clean;
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const low = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  MW.cap = cap; MW.low = low;
  MW.isPc = p => !!(p && A.S && p.id === A.S.pc);
  // FNV hash of ids to a number in [0,1): the weave's variants are picked from it, never from A.rand
  MW.h = (...a) => { let h = 2166136261; const s = a.join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100003) / 100003; };

  // the record, made whole for an old save (or a hand-edited one)
  MW.state = function (pc) {
    let s = pc.mw;
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = pc.mw = { v: 1, m: [], last: {} };
    if (!Array.isArray(s.m)) s.m = [];
    if (!s.last || typeof s.last !== 'object' || Array.isArray(s.last)) s.last = {};
    return s;
  };
  // read-only view for the weave and the views: never creates the field
  MW.lines = pc => pc && pc.mw && Array.isArray(pc.mw.m) ? pc.mw.m.filter(x => x && typeof x === 'object' && typeof x.y === 'number') : [];
  MW.lastOf = (pc, id) => { const L = pc && pc.mw && pc.mw.last; const r = L && typeof L === 'object' ? L[id] : null; return Array.isArray(r) && typeof r[0] === 'number' ? r : null; };

  // ---------------------------------------------------------------- what kind of scene it is

  // read once per event from its title and its text (or its text function's source), cached off the event
  MW.SHAPES = [
    ['tavern', /\b(tavern|alehouse|taproom|the inn\b|an inn\b|wine-?shop|drinking|ale\b|tankard|dice|dicing)/i],
    ['market', /\b(market|fair\b|stall|haggl|merchant|pedlar|peddler|buyer|price)/i],
    ['law', /\b(the watch\b|watchm[ae]n|magistrate|thief|thieves|stolen|steal|gaol|jail|the cells|bailiff|constable|accus)/i],
    ['road', /\b(road|travell|caravan|bridge|ford\b|the pass\b|wayfarer|pilgrim|toll)/i],
    ['temple', /\b(temple|shrine|priest|prayer|altar|chapel|monk|nun\b|sermon|holy)/i],
    ['court', /\b(court\b|throne|council|the hall\b|great hall|steward|herald|audience)/i],
    ['war', /\b(camp\b|march|battle|siege|sergeant|captain|soldier|army|muster|garrison|banner)/i],
    ['work', /\b(workshop|apprentice|guild|journeyman|your master\b|the master\b|forge|loom|wage|shift\b|foreman|overseer)/i],
    ['sea', /\b(sea\b|ship|harbou?r|boat|river|dock|quay|sail)/i],
    ['wild', /\b(forest|woods?\b|hunt|wolf|wolves|beast|hills|mountain|moor|marsh)/i],
    ['field', /\b(field|harvest|plough|plow|sheep|cattle|herd|barn|mill\b|crop)/i],
    ['sick', /\b(fever|sick|plague|cough|physician|healer|sickbed)/i],
    ['kin', /\b(mother|father|brother|sister|cousin|uncle|aunt|grandm|grandf|wedding|cradle)/i],
  ];
  MW.shapeOf = function (e) {
    if (!e) return '';
    if (e._mwShape != null) return e._mwShape;
    let src = '';
    try { src = (typeof e.title === 'string' ? e.title : '') + ' ' + (typeof e.text === 'function' ? e.text.toString() : String(e.text || '')); } catch (err) {}
    const hit = MW.SHAPES.find(([, rx]) => rx.test(src));
    const s = hit ? hit[0] : '';
    try { Object.defineProperty(e, '_mwShape', { value: s, enumerable: false, configurable: true, writable: true }); } catch (err) {}
    return s;
  };

  // ---------------------------------------------------------------- what a choice did

  const relOp = (a, b) => a && b && a.rel && a.rel[b.id] && typeof a.rel[b.id].op === 'number' ? a.rel[b.id].op : null;
  MW.snap = function (pc, ctx) {
    const t = ctx && ctx.pid ? A.P(ctx.pid) : null;
    return {
      coin: +pc.coin || 0, health: +pc.health || 0, wounds: Array.isArray(pc.wounds) ? pc.wounds.length : 0,
      prison: !!pc.prison, fame: +pc.fame || 0, honor: +pc.honor || 0, piety: +pc.piety || 0,
      rels: pc.rel ? Object.keys(pc.rel).length : 0, mine: relOp(pc, t), theirs: relOp(t, pc), alive: t ? !!t.alive : null,
    };
  };
  // the deed, in the past tense, from the label taken. 55-bonds keeps the verb table; without it, a plain form
  MW.deedOf = function (label, failed) {
    const l = clean(label).replace(/[“”‘’]/g, '');
    if (!l) return null;
    if (A.BONDS && A.BONDS.deedOf) { const d = A.BONDS.deedOf(l, failed); if (d) return d.slice(0, 110); return null; }
    const first = l.split(/\s*[,:;(—–]\s*/)[0].replace(/[.!?]+$/, '');
    if (!/^[A-Za-z]/.test(first) || first.split(' ').length > 10) return null;
    return (failed ? `you tried to ${low(first)}, and failed` : `you chose to ${low(first)}`).slice(0, 110);
  };
  MW.kindsOf = function (a, b, pc, res) {
    const k = [];
    const dc = b.coin - a.coin, big = Math.max(25, a.coin * 0.12);
    if (b.wounds > a.wounds || b.health - a.health <= -8) k.push('hurt');
    if (!a.prison && b.prison) k.push('law');
    if (dc <= -big) k.push('loss'); else if (dc >= big) k.push('gain');
    if (b.fame - a.fame >= 3) k.push('name');
    if (b.honor - a.honor <= -3) k.push('shame');
    if (a.alive === true && b.alive === false) k.push('kill');
    const dop = (b.theirs != null && a.theirs != null ? b.theirs - a.theirs : 0) || (b.mine != null && a.mine != null ? b.mine - a.mine : 0) || (a.mine == null && b.mine != null ? b.mine : 0);
    if (dop >= 4) k.push('kind'); else if (dop <= -4) k.push('wrong');
    if (b.rels > a.rels) k.push('met');
    return { k, coin: Math.round(dc), op: Math.round(dop) };
  };

  // write the line (engine side, inside A.eventChoose)
  MW.note = function (pc, pre, q) {
    const e = A.EV[q.ev];
    if (!e || !pc || !pc.alive) return null;
    const post = MW.snap(pc, q.ctx);
    const ok = q.result && typeof q.result.success === 'boolean' ? (q.result.success ? 1 : 0) : -1;
    const ch = e.choices && e.choices[pre.ci];
    const chk = ch && ch.check ? ch.check : null;
    const s = chk && typeof chk.s === 'string' ? chk.s : (chk && chk.fight ? 'melee' : null);
    const { k, coin, op } = MW.kindsOf(pre.snap, post, pc, q.result);
    const S = MW.state(pc);
    const deed = MW.deedOf(pre.label, ok === 0);
    const line = { y: A.S.year, e: String(q.ev), c: pre.ci, ok, sh: MW.shapeOf(e) };
    if (s) line.s = s;
    if (q.ctx && q.ctx.pid && A.P(q.ctx.pid)) line.p = String(q.ctx.pid);
    if (k.length) line.k = k;
    if (coin) line.n = coin;
    if (op) line.o = op;
    if (deed) line.d = deed;
    const title = clean(pre.title || (typeof e.title === 'string' ? e.title : ''));
    if (title) line.t = title.slice(0, 60);
    S.m.push(line);
    S.last[line.e] = [line.y, line.c, ok, deed || ''];
    // the record keeps the lines that carry something (a person, a check, a consequence) longest
    while (S.m.length > MW.KEEP) {
      let at = 0, best = Infinity;
      for (let i = 0; i < S.m.length - 10; i++) { const x = S.m[i]; const w = (x.k ? x.k.length * 2 : 0) + (x.p ? 2 : 0) + (x.s ? 1 : 0) + (x.y - A.S.year) / 10; if (w < best) { best = w; at = i; } }
      S.m.splice(at, 1);
    }
    const keys = Object.keys(S.last);
    if (keys.length > MW.LAST) { keys.sort((a, b) => S.last[a][0] - S.last[b][0]); for (const id of keys.slice(0, keys.length - MW.LAST)) delete S.last[id]; }
    MW.stats.noted++;
    return line;
  };

  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S && A.S.queue[0], pc = A.pc();
    let pre = null;
    try {
      if (q && q.type === 'event' && !q.result && pc && pc.alive && A.EV[q.ev]) {
        const v = A.eventView(q), vc = v && v.choices[idx];
        if (vc && vc.i >= 0) pre = { ci: vc.i, label: vc.t, title: v.title, snap: MW.snap(pc, q.ctx) };
      }
    } catch (err) { pre = null; }
    const was = MW.curQ; MW.curQ = q;
    let r;
    try { r = choose.apply(this, arguments); } finally { MW.curQ = was; }
    try {
      if (pre && q && q.result && A.pc() === pc) {
        MW.note(pc, pre, q);
        // a memory a scene cited counts its citing, so the same line is not leaned on again and again
        const w = q.ctx && q.ctx.mw;
        if (w && w.ref) { const m = MW.lines(pc).find(x => x.y === w.ref[0] && x.e === w.ref[1] && x.c === w.ref[2]); if (m) m.u = (m.u || 0) + 1; }
      }
    } catch (err) { console.error('memory weave note', err); }
    return r;
  };
})();
