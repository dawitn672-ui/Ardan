// Memory weave, part 2 of 2: scenes that remember (Road to Ten, Events 2: "any event can need or react to one").
//
// When an event comes up, its setup asks the record (a-record.core.js) for one memory that bears on this scene, by
// four rules, first match wins:
//
//   person  the scene is about someone (ctx.pid) you did right or wrong by, or fought: the line names the year and the
//           deed, and every check in the scene moves 6 points with them (+ a kindness, - a wrong). 55-bonds' weighed
//           history lines count as memories too, so a bond formed before this feature still answers.
//   again   the same scene has come round before: the line says what you chose then, that choice's label carries
//           "(as in 1104)", and if it was a check it is 6 points easier for having won it, 3 for having lost it.
//   skill   a check in this scene tests the same skill or stat as one you won or lost before (a scene of the same kind
//           first: tavern, market, road ...): the line names that year and deed, and that check moves 5 points.
//   place   nothing else, but something happened to you in this kind of place (hurt, robbed, jailed, paid, praised):
//           the line names it. Text only.
//
// What the setup decides is kept in ctx.mw (saved with the queued event), so drawing the scene again changes
// nothing and draws no random number. The variant wording is a hash of the event and the year.
// The line goes into the text only if the rendered scene stays within 80 words, the short form if the long does
// not fit; if neither fits, the memory is dropped and the odds stay as they were.
// The setup wrapper keeps the event's own setup and its source (tools and tests read setups as text);
// e.cond and e.text are not touched, so A.evAudience and A.CX_RX classify the event as before.
(function () {
  const MW = A.MW;
  const clean = MW.clean, cap = MW.cap, low = MW.low;
  Object.assign(MW, {
    ON: true,
    MAX_WORDS: 80,
    CITE_MAX: 4,        // a memory line is leaned on at most this many times
    SHIFT: { person: 6, againWon: 6, againLost: 3, skill: 5 },
  });
  MW.stats = Object.assign(MW.stats || {}, { woven: 0, dropped: 0, byRule: {} });
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  const coin = n => (A.coin ? A.coin(Math.abs(n)) : Math.abs(n) + ' suns');
  const pickBy = (list, ...k) => list[Math.min(list.length - 1, Math.floor(MW.h(...k) * list.length))];

  // ---------------------------------------------------------------- words for what a memory was

  // the thing a check tested, as a phrase: "It comes down to talking someone round, as it did in 1106"
  const DOM = {
    melee: 'steel', sword: 'a blade', axe: 'a heavy hand', spear: 'a long reach', dagger: 'a knife', dualwield: 'two blades', shield: 'a shield',
    unarmed: 'your fists', lance: 'a lance', mounted: 'fighting from the saddle', bow: 'a steady aim', xbow: 'a steady aim', throwing: 'a good throw',
    riding: 'a horse under you', athletics: 'your legs and your grip', stealth: 'going unseen', survival: 'reading the land', tracking: 'reading the ground',
    sea: 'the water', persuasion: 'talking someone round', diplomacy: 'careful words', etiquette: 'manners', deception: 'a lie told well',
    intimidation: 'a hard look', intrigue: 'a quiet word in the right ear', music: 'a song', command: 'giving orders', tactics: 'reading a fight',
    logistics: 'keeping men fed', siegecraft: 'walls and ladders', stewardship: 'the accounts', learning: 'letters', medicine: 'a sickbed',
    faith: 'the rites', trade: 'a bargain', craft: 'the work of your hands', husbandry: 'the land and the beasts', gambling: 'the dice',
    str: 'strength', spd: 'quickness', ins: 'a quick eye', sta: 'staying power', int: 'your wits', wil: 'nerve',
  };
  MW.DOM = DOM;
  const PLACE = {
    tavern: 'in a tavern', market: 'at market', law: 'on the wrong side of the watch', road: 'on the road', temple: 'at a temple',
    court: 'at court', war: 'among soldiers', work: 'at work', sea: 'on the water', wild: 'out in the wild', field: 'in the fields',
    sick: 'at a sickbed', kin: 'among your kin',
  };
  // what a remembered choice led to, as a tail on the deed
  MW.tail = function (m) {
    const k = m && Array.isArray(m.k) ? m.k : [];
    if (k.includes('law')) return ', and the watch took you';
    if (k.includes('kill')) return ', and someone died of it';
    if (k.includes('hurt')) return ', and came away hurt';
    if (k.includes('loss') && m.n) return `, and it cost you ${coin(m.n)}`;
    if (k.includes('gain') && m.n) return `, and came away ${coin(m.n)} the richer`;
    if (k.includes('shame')) return ', and it shamed you';
    if (k.includes('name')) return ', and people talked of it';
    return '';
  };
  const STRONG = ['law', 'kill', 'hurt', 'loss', 'gain', 'shame', 'name'];
  const BAD = new Set(['law', 'kill', 'hurt', 'loss', 'shame']);

  // ---------------------------------------------------------------- the four rules

  const fill = (s, t) => s.replace(/\{Them\}/g, t.given).replace(/\{them\}/g, t.given)
    .replace(/\{Khe\}/g, cap(A.he(t))).replace(/\{khe\}/g, A.he(t)).replace(/\{khim\}/g, A.him(t)).replace(/\{khis\}/g, A.his(t));
  const FR = {
    personGood: [
      ['{Them} remembers {y}, when {d}. {Khe} gives you a fairer hearing for it.', '{Them} remembers {y}: {d}.'],
      ['{Them} has not let {y} go: {d}. It counts for you now.', '{Them} remembers {y}: {d}.'],
      ['In {y} {d}. {Them} has kept count of that, and it eases things.', '{Them} remembers {y}: {d}.'],
    ],
    personBad: [
      ['{Them} remembers {y}, when {d}. {Khe} gives you nothing for free.', '{Them} remembers {y}: {d}.'],
      ['{Them} has not let {y} go: {d}. It counts against you now.', '{Them} remembers {y}: {d}.'],
      ['In {y} {d}. {Them} has kept count of that, and watches your hands.', '{Them} remembers {y}: {d}.'],
    ],
    again: [
      ['This has come round before. In {y} {d}{tail}.', 'As in {y}: {d}.'],
      ['You know this from {y}, when {d}{tail}.', 'As in {y}: {d}.'],
      ['It is {y} over again. That time {d}{tail}.', 'As in {y}: {d}.'],
    ],
    skillWon: [
      ['It comes down to {dom}, as it did in {y}, when {d}. You know you can.', 'In {y}, {d}. You know the way of it.'],
      ['You have done this before. In {y} {d}, and you have not forgotten how.', 'In {y}, {d}. You know the way of it.'],
      ['{Dom} served you in {y}: {d}. You go at it surer for that.', 'In {y}, {d}. You know the way of it.'],
    ],
    skillLost: [
      ['It comes down to {dom}, as it did in {y}, when {d}. That still sits with you.', 'In {y}, {d}. It still sits with you.'],
      ['In {y} {d}. You have not forgotten it, and it makes you slow.', 'In {y}, {d}. It still sits with you.'],
      ['{Dom} let you down in {y}: {d}. The doubt is still there.', 'In {y}, {d}. It still sits with you.'],
    ],
    placeBad: [
      ['You have not been easy {place} since {y}, when {d}{tail}.', 'You remember {y}: {d}{tail}.'],
      ['The last time you were {place}, in {y}, {d}{tail}.', 'You remember {y}: {d}{tail}.'],
    ],
    placeGood: [
      ['The last time you were {place}, in {y}, {d}{tail}.', 'You remember {y}: {d}{tail}.'],
      ['{Y} comes back to you here: {d}{tail}.', 'You remember {y}: {d}{tail}.'],
    ],
  };
  MW.FRAMES = FR;
  const say = (frame, o) => frame.replace(/\{y\}/g, o.y).replace(/\{Y\}/g, o.y).replace(/\{d\}/g, o.d).replace(/\{tail\}/g, o.tail || '')
    .replace(/\{dom\}/g, o.dom || '').replace(/\{Dom\}/g, cap(o.dom || '')).replace(/\{place\}/g, o.place || '');
  // a sentence that starts with the deed starts with a capital: "In 1106 you ..." stays, ". you" does not happen
  const fixCase = s => s.replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());

  const usable = (m, now) => m && m.y < now && (m.u || 0) < MW.CITE_MAX;
  // a short deed ("you accepted") carries the scene's title, so the memory says what it was about
  const deedOf = m => !m.d ? '' : (words(m.d) >= 4 || !m.t) ? m.d : `${m.d} (${low(m.t)})`;
  const recent = (a, b) => b.y - a.y;

  MW.rules = {
    // the scene is about someone you share a memory with
    person(p, ctx, e, now) {
      const pid = ctx.pid, t = pid ? A.P(pid) : null;
      if (!t || t.id === p.id) return null;
      const own = MW.lines(p).filter(m => m.p === String(pid) && m.d && usable(m, now) && (Math.abs(m.o || 0) >= 4 || (m.k || []).some(k => STRONG.includes(k) || k === 'kind' || k === 'wrong')));
      let mem = null, sg = 0, ref = null;
      if (own.length) {
        own.sort((a, b) => Math.abs(b.o || 0) - Math.abs(a.o || 0) || recent(a, b));
        mem = own[0]; sg = (mem.o || 0) > 0 || (mem.k || []).includes('kind') ? 1 : -1; ref = [mem.y, mem.e, mem.c];
      } else {
        // 55-bonds' history on the bond: weighed lines of 6 or more
        const H = p.rel && p.rel[t.id] && Array.isArray(p.rel[t.id].hist) ? p.rel[t.id].hist : [];
        const hl = H.filter(x => x && typeof x.y === 'number' && x.y < now && typeof x.w === 'number' && Math.abs(x.w) >= 6 && (x.d || x.t))
          .sort((a, b) => Math.abs(b.w) - Math.abs(a.w) || b.y - a.y);
        if (!hl.length) return null;
        const x = hl[0]; sg = x.w > 0 ? 1 : -1;
        mem = { y: x.y, d: clean(x.d || low(x.t)).slice(0, 110) };
      }
      const od = {};
      (e.choices || []).forEach((c, i) => { if (c && c.check) od[i] = sg * MW.SHIFT.person; });
      const fr = pickBy(sg > 0 ? FR.personGood : FR.personBad, e.id, now, 'p');
      const o = { y: mem.y, d: mem.t ? deedOf(mem) : mem.d };
      return { r: 'person', y: mem.y, ref, sg, od, long: fixCase(fill(say(fr[0], o), t)), short: fixCase(fill(say(fr[1], o), t)) };
    },
    // the same scene came before: what you chose then
    again(p, ctx, e, now) {
      const L = MW.lastOf(p, e.id);
      if (!L || !(L[0] < now) || !L[3]) return null;
      const ci = L[1], c = e.choices && e.choices[ci];
      if (!c) return null;
      const m = MW.lines(p).find(x => x.e === e.id && x.y === L[0] && x.c === ci) || null;
      const od = {};
      if (c.check) od[ci] = L[2] === 1 ? MW.SHIFT.againWon : L[2] === 0 ? MW.SHIFT.againLost : 0;
      const fr = pickBy(FR.again, e.id, now, 'a');
      const o = { y: L[0], d: clean(L[3]), tail: m ? MW.tail(m) : '' };
      return { r: 'again', y: L[0], ref: m ? [m.y, m.e, m.c] : null, ci, od, lab: ` (as in ${L[0]})`, long: fixCase(say(fr[0], o)), short: fixCase(say(fr[1], o)) };
    },
    // a check in this scene tests what an earlier check tested
    skill(p, ctx, e, now) {
      const checks = [];
      (e.choices || []).forEach((c, i) => { const s = c && c.check && (typeof c.check.s === 'string' ? c.check.s : c.check.fight ? 'melee' : null); if (s && DOM[s]) checks.push([i, s]); });
      if (!checks.length) return null;
      const sh = MW.shapeOf(e), L = MW.lines(p).filter(m => m.s && m.d && (m.ok === 0 || m.ok === 1) && m.e !== e.id && usable(m, now));
      let best = null;
      for (const [i, s] of checks) {
        const hits = L.filter(m => m.s === s);
        if (!hits.length) continue;
        hits.sort((a, b) => ((b.sh === sh && sh) ? 1 : 0) - ((a.sh === sh && sh) ? 1 : 0) || (a.u || 0) - (b.u || 0) || recent(a, b));
        const m = hits[0], score = (m.sh === sh && sh ? 10 : 0) - (now - m.y) / 10 - (m.u || 0);
        if (!best || score > best.score) best = { i, s, m, score };
      }
      if (!best) return null;
      const { i, s, m } = best, won = m.ok === 1;
      const fr = pickBy(won ? FR.skillWon : FR.skillLost, e.id, now, 's');
      const o = { y: m.y, d: deedOf(m), dom: DOM[s] };
      return { r: 'skill', y: m.y, ref: [m.y, m.e, m.c], ci: i, od: { [i]: (won ? 1 : -1) * MW.SHIFT.skill }, long: fixCase(say(fr[0], o)), short: fixCase(say(fr[1], o)) };
    },
    // something happened to you in this kind of place
    place(p, ctx, e, now) {
      const sh = MW.shapeOf(e);
      if (!sh || !PLACE[sh]) return null;
      const L = MW.lines(p).filter(m => m.sh === sh && m.d && m.e !== e.id && usable(m, now) && (m.k || []).some(k => STRONG.includes(k)) && now - m.y <= 30);
      if (!L.length) return null;
      L.sort((a, b) => (a.u || 0) - (b.u || 0) || recent(a, b));
      const m = L[0], bad = (m.k || []).some(k => BAD.has(k));
      const fr = pickBy(bad ? FR.placeBad : FR.placeGood, e.id, now, 'w');
      const o = { y: m.y, d: deedOf(m), tail: MW.tail(m), place: PLACE[sh] };
      return { r: 'place', y: m.y, ref: [m.y, m.e, m.c], od: {}, long: fixCase(say(fr[0], o)), short: fixCase(say(fr[1], o)) };
    },
  };
  MW.ORDER = ['person', 'again', 'skill', 'place'];

  // engine side: called from the event's setup, once, when the scene first comes up
  MW.weave = function (p, ctx, e) {
    if (!MW.ON || !ctx || ctx.mw !== undefined || ctx.skip || !MW.isPc(p) || !p.mw) return null;
    const now = A.S.year;
    for (const k of MW.ORDER) {
      let w = null;
      try { w = MW.rules[k](p, ctx, e, now); } catch (err) { if (A.S.debug) console.error('memory weave', k, err); w = null; }
      if (!w) continue;
      w.long = clean(w.long); w.short = clean(w.short);
      for (const i in w.od) if (!w.od[i]) delete w.od[i];
      ctx.mw = w;
      return w;
    }
    return null;
  };

  // ---------------------------------------------------------------- every event's setup asks

  // the wrapper reads the record of this life (p.mw), the last time this scene came (p.flags.ev and the record's
  // own last choice), the person the scene is about, and earlier checks of the same skill
  MW.wrap = function (e) {
    if (!e || !e.id || e._mwWrapped || e.mwSkip) return;
    const own = typeof e.setup === 'function' ? e.setup : null;
    const setup = function (p, ctx) {
      if (own) own.apply(this, arguments);
      if (ctx && !ctx.skip && p && p.flags && (p.mw || (p.flags.ev && p.flags.ev[e.id] != null))) MW.weave(p, ctx, e);
    };
    // tools and tests read setups as text: the event's own source stays first
    const src = (own ? Function.prototype.toString.call(own) + '\n' : '') + Function.prototype.toString.call(setup);
    Object.defineProperty(setup, 'toString', { value: () => src, enumerable: false, configurable: true });
    e.setup = setup;
    Object.defineProperty(e, '_mwWrapped', { value: true, enumerable: false, configurable: true });
  };
  const defEvents = A.defEvents;
  A.defEvents = function (list) {
    const r = defEvents.apply(this, arguments);
    try { for (const e of list || []) if (e && e.id && A.EV[e.id] === e) MW.wrap(e); } catch (err) { console.error('memory weave', err); }
    return r;
  };
  for (const id in A.EV) MW.wrap(A.EV[id]);

  // ---------------------------------------------------------------- the odds move with the memory

  const odds = A.checkOdds;
  A.checkOdds = function (pc, check) {
    const r = odds.apply(this, arguments);
    try {
      const q = MW.curQ || (A.S && A.S.queue[0]), w = q && q.type === 'event' && q.ctx && q.ctx.mw;
      if (w && w.od && !w.off && MW.isPc(pc) && typeof r === 'number') {
        const e = A.EV[q.ev], i = e && e.choices ? e.choices.findIndex(c => c && c.check === check) : -1;
        const d = i >= 0 ? +w.od[i] || 0 : 0;
        if (d) return A.clamp(r + d, 4, 96);
      }
    } catch (err) {}
    return r;
  };
  const risk = o => o == null ? '' : o >= 75 ? 'likely' : o >= 50 ? 'even odds' : o >= 30 ? 'risky' : 'long odds';

  // ---------------------------------------------------------------- the line goes into the scene

  // insert before a closing question ("What do you do?") if the text ends with one
  MW.place = function (text, line) {
    const t = String(text || '').trim();
    const m = t.match(/^(.*[.!”"’'])\s+([^.!?]*\?)$/s);
    return m ? `${m[1]} ${line} ${m[2]}` : `${t} ${line}`.trim();
  };
  MW.apply = function (q, v) {
    const w = q.ctx && q.ctx.mw, pc = A.pc();
    if (!w || w.off || !pc) return;
    const e = A.EV[q.ev];
    const text = String(v.text || '');
    let line = null;
    if (text.includes(String(w.y)) && /\b1\d{3}\b/.test(text)) line = null;   // the scene already quotes that year
    else if (words(text) + words(w.long) <= MW.MAX_WORDS) line = w.long;
    else if (words(text) + words(w.short) <= MW.MAX_WORDS) line = w.short;
    if (!line) {
      // nothing fits: the memory is dropped, and with it the odds it moved
      w.off = 1; MW.stats.dropped++;
      for (const vc of v.choices || []) if (vc.odds != null && e && e.choices[vc.i] && e.choices[vc.i].check) { vc.odds = A.checkOdds(pc, e.choices[vc.i].check); vc.risk = risk(vc.odds); }
      return;
    }
    v.text = MW.place(text, line);
    if (w.lab && w.ci != null) for (const vc of v.choices || []) if (vc.i === w.ci && words(vc.t) <= 9) vc.t = vc.t + w.lab;
    MW.stats.woven++; MW.stats.byRule[w.r] = (MW.stats.byRule[w.r] || 0) + 1;
  };
  const view = A.eventView;
  A.eventView = function (q) {
    const fresh = !!q && !q.view && q.type === 'event';
    const was = MW.curQ; MW.curQ = q;
    let v;
    try { v = view.apply(this, arguments); } finally { MW.curQ = was; }
    try { if (fresh && v && !v.skip && q.view === v) MW.apply(q, v); } catch (err) { console.error('memory weave view', err); }
    return v;
  };
})();
