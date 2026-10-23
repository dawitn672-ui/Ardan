// Echoes (87-echoes): what the echo events in *.events.js share.
//
// An echo is a later scene that follows from one of the scenes players meet most. Each echo names its source with
// ecSrc: "id" and reads, in its cond, either a flag the source's choice sets (C.flag(p, "x")) or p.flags.ev[id], the
// year the player last saw the source (the engine writes it in A.eventChoose). Where the source sets no flag, the
// echo can still depend on what was chosen: a small record, kept here, holds the last choice taken in each source.
//
//   A.EC.ago(ev, id)            years since the player last saw event id (ev is p.flags.ev), or -1
//   A.EC.saw(ev, id, min, max)  seen, between min and max years ago (max defaults to 40)
//   A.EC.rec(p, id)             the record of that last sighting: [year, choice, won (1, 0 or -1), person id, kept words]
//   A.EC.took(p, id, ...i)      the choice taken then was one of i (indexes into the source's own choices)
//   A.EC.won(p, id) / lost      the check in that choice was won / lost
//   A.EC.who(p, id)             the living person the scene was about (its ctx.pid), or null
//   A.EC.gone(p, id)            that person is dead (or the scene was about nobody): for echoes that bury them
//   A.EC.mother(p)              the player's living mother, or null
//   A.EC.kept(p, id, k, alt)    a word the scene's ctx held (only the keys an echo asks for with ecKeep), or alt
//   A.EC.cast(p, ctx, q, alt)   put q in the scene: ctx.pid, {nm} {Nm} {he} {He} {him} {his} {His}
//   A.EC.since(p, f)            years since flag f was set
//   A.EC.yrs(ctx, n)            ctx.yrs = n as a word ("eleven"), and ctx.Yrs capitalised
//
// The record is written inside A.eventChoose (engine side), only for events some echo names as its source; it lives
// on pc.ec (a new field: old saves have none, and every reader tolerates that). Nothing here draws on A.rand.
(function () {
  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const word = n => (n >= 0 && n < NUM.length ? NUM[n] : String(n));
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const EC = A.EC = { word, cap, stats: { noted: 0 } };

  EC.ago = (ev, id) => { const y = ev && typeof ev === 'object' ? ev[id] : null; return y != null && isFinite(+y) ? A.S.year - +y : -1; };
  EC.saw = (ev, id, min = 3, max = 40) => { const g = EC.ago(ev, id); return g >= min && g <= max; };
  EC.rec = (p, id) => {
    const r = p && p.ec && typeof p.ec === 'object' ? p.ec[id] : null;
    if (!Array.isArray(r) || typeof r[0] !== 'number') return null;
    const seen = p.flags && p.flags.ev ? +p.flags.ev[id] : NaN;
    return seen === r[0] ? r : null;   // the record of the last sighting, not of an older one
  };
  EC.took = (p, id, ...i) => { const r = EC.rec(p, id); return !!r && i.includes(r[1]); };
  EC.won = (p, id) => { const r = EC.rec(p, id); return !!r && r[2] === 1; };
  EC.lost = (p, id) => { const r = EC.rec(p, id); return !!r && r[2] === 0; };
  EC.who = (p, id) => {
    const r = EC.rec(p, id), q = r && r[3] != null ? A.P(r[3]) : null;
    return q && q.alive && p && q.id !== p.id ? q : null;
  };
  EC.gone = (p, id) => {
    const r = EC.rec(p, id); if (!r) return false;
    const q = r[3] != null ? A.P(r[3]) : null;
    return !q || !q.alive;
  };
  EC.mother = p => { const m = p && p.parents ? A.P(p.parents[1]) : null; return m && m.alive ? m : null; };
  EC.kept = (p, id, k, alt) => {
    const r = EC.rec(p, id), v = r && r[4] && typeof r[4] === 'object' ? r[4][k] : null;
    return typeof v === 'string' && v && !/[{}<>]/.test(v) ? v : alt;
  };
  EC.since = (p, f) => { const y = p && p.flags ? +p.flags[f] : NaN; return isFinite(y) ? A.S.year - y : 0; };
  EC.yrs = (ctx, n) => { ctx.yrs = word(Math.max(1, n)); ctx.Yrs = cap(ctx.yrs); return ctx.yrs; };
  EC.cast = (p, ctx, q, alt) => {
    if (q && p && q.id !== p.id) {
      ctx.pid = q.id; ctx.nm = q.given;
      ctx.he = A.he(q); ctx.him = A.him(q); ctx.his = A.his(q); ctx.spo = q.sex === 'F' ? 'husband' : 'wife';
    } else { ctx.nm = alt || 'they'; ctx.he = 'they'; ctx.him = 'them'; ctx.his = 'their'; ctx.spo = 'household'; }
    ctx.Nm = cap(ctx.nm); ctx.He = cap(ctx.he); ctx.His = cap(ctx.his);
    return q;
  };

  // which events some echo names as its source, and the ctx words each wants kept (built once the content is in)
  let W = null, WN = -1;
  EC.watch = () => {
    const n = Object.keys(A.EV).length;
    if (W && WN === n) return W;
    W = new Map(); WN = n;
    for (const e of Object.values(A.EV)) {
      if (!e || !e.ecSrc) continue;
      const keep = W.get(e.ecSrc) || new Set();
      for (const k of e.ecKeep || []) keep.add(k);
      W.set(e.ecSrc, keep);
    }
    return W;
  };
  EC.note = (pc, q, ci) => {
    const keep = EC.watch().get(q.ev);
    if (!keep || !pc || !pc.alive) return;
    const res = q.result || {};
    const ok = res.success === true ? 1 : res.success === false ? 0 : -1;
    const pid = q.ctx && q.ctx.pid != null && A.P(q.ctx.pid) ? q.ctx.pid : null;
    let words = null;
    for (const k of keep) {
      const v = q.ctx ? q.ctx[k] : null;
      if ((typeof v === 'string' || typeof v === 'number') && String(v).length <= 80) (words = words || {})[k] = String(v);
    }
    pc.ec = pc.ec && typeof pc.ec === 'object' ? pc.ec : {};
    pc.ec[q.ev] = words ? [A.S.year, ci, ok, pid, words] : [A.S.year, ci, ok, pid];
    EC.stats.noted++;
  };

  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S && A.S.queue[0], pc = A.pc();
    const fresh = !!(q && q.type === 'event' && !q.result);
    const r = choose.apply(this, arguments);
    try {
      if (fresh && q.result && pc && A.pc() === pc && q.view && q.view.choices) {
        const vc = q.view.choices[idx];
        if (vc && vc.i >= 0) EC.note(pc, q, vc.i);
      }
    } catch (err) { console.error('echoes note', err); }
    return r;
  };
})();
