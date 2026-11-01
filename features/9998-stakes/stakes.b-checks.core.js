// 9998-stakes, part 2: white and red checks (Disco Elysium), and the choices a scene holds out of reach.
//
// Engine side, deterministic, no draws:
// - When a check fails, the life remembers it: pc.retry["event:choice"] = { v, y } (v is A.checkVal, the value the roll
//   was made from; y the year). A red check (part 1's rule: once in a life, or a lasting loss) is remembered as red.
//   A success forgets it. A new field: an old save simply has none, and nothing is locked.
// - When a scene is built (A.eventView, fresh views only), a failed white check whose value has not yet risen 5 is held
//   back, and a failed red check is held back for good, as long as the scene keeps another choice. They go on the view's
//   list of locked choices (v.locked = [{ i, t, lock }]), which the card draws greyed with the reason.
// - A choice the release hides because its req fails is put on the same list when part 1 can read the req as a plain
//   threshold (coin, letters, a skill...); its reason is worked out when it is drawn. Other hidden choices stay hidden.
(function () {
  const ST = A.STAKES;
  ST.MAX_RETRY = 160;   // remembered failures kept per life (the oldest go first)

  const labelOf = function (c, pc, q) {
    let t = '';
    try { t = typeof c.t === 'function' ? c.t(pc, q.ctx || {}) : c.t; } catch (e) { return ''; }
    if (typeof t !== 'string' || !t) return '';
    if (t.includes('{')) { try { t = A.T(t, A.ctxTokens(pc, q.ctx || {})); } catch (e) { return ''; } }
    return /\{\w+\}/.test(t) ? '' : t;
  };

  const view = A.eventView;
  A.eventView = function (q) {
    const fresh = !!q && !q.view;
    const v = view.apply(this, arguments);
    if (!fresh || !v || v.skip || ST.OFF || q.view !== v) return v;
    try {
      const pc = A.pc(), e = A.EV[q.ev];
      if (!pc || !e || !Array.isArray(e.choices) || !Array.isArray(v.choices)) return v;
      const locked = [];
      // failed checks held back (white: until you are better; red: for good), while another choice stays
      if (pc.retry && typeof pc.retry === 'object') {
        for (const vc of v.choices.slice()) {
          if (vc.i < 0) continue;
          const st = ST.retryState(pc, e, vc.i);
          if (!st.rec || st.ready) continue;
          if (v.choices.filter(x => x.i >= 0).length <= 1) break;
          v.choices.splice(v.choices.indexOf(vc), 1);
          locked.push({ i: vc.i, t: vc.t, lock: st.kind });
        }
      }
      // choices hidden by a req the player can work towards
      const shown = new Set(v.choices.map(x => x.i));
      e.choices.forEach((c, i) => {
        if (shown.has(i) || !c || !c.req || locked.some(x => x.i === i) || !ST.parseReq(c.req)) return;
        if (!ST.reqWhy(c, pc, q.ctx || {})) return;
        const t = labelOf(c, pc, q);
        if (t) locked.push({ i, t, lock: 'req' });
      });
      if (locked.length) v.locked = locked.sort((a, b) => a.i - b.i);
    } catch (err) { console.error('stakes view', err); }
    return v;
  };

  // remember a failed check, forget a passed one
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S && A.S.queue[0], pc = A.pc();
    let pre = null;
    try {
      if (!ST.OFF && q && q.type === 'event' && !q.result && pc) {
        const v = A.eventView(q), vc = v && v.choices && v.choices[idx], e = A.EV[q.ev];
        const c = vc && vc.i >= 0 && e ? e.choices[vc.i] : null, kind = ST.checkKind(c, e);
        if (kind) pre = { e, i: vc.i, c, kind, v: c.check && !c.check.fight ? A.checkVal(pc, c.check) : null };
      }
    } catch (err) { pre = null; }
    const r = choose.apply(this, arguments);
    try {
      if (pre && q && q.result && pc && pc.alive !== false) {
        const key = ST.key(pre.e.id, pre.i), ok = q.result.success;
        if (ok === true && pc.retry && pc.retry[key]) delete pc.retry[key];
        else if (ok === false && (pre.kind === 'red' || pre.v != null)) {
          const R = pc.retry = pc.retry && typeof pc.retry === 'object' ? pc.retry : {};
          R[key] = pre.kind === 'red' ? { y: A.S.year, red: 1 } : { v: Math.round(pre.v * 10) / 10, y: A.S.year };
          const keys = Object.keys(R);
          if (keys.length > ST.MAX_RETRY) keys.sort((a, b) => (R[a].y || 0) - (R[b].y || 0)).slice(0, keys.length - ST.MAX_RETRY).forEach(k => delete R[k]);
        }
      }
    } catch (err) { console.error('stakes retry', err); }
    return r;
  };
})();
