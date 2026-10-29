// 97-life-fixes, names that tell people apart (cycle 2, design A2 and lives B3).
//
// - A fresh given name. A.givenName drew from the culture's list blind, so both partners at Harvest Home were
//   "Beatrix", as was your mother; a new boy at school had your own name; a father and his son were both Kettil. The
//   draw now re-picks (up to four times) a name that is already the player's, a parent's, a sibling's, the spouse's or
//   a child's, one held by someone in the scene being set up, or one of the last six drawn the same day. Engine side: it draws
//   only when the first pick collides, through A.pick, as before.
// - A full name said once. A scene that names someone in full ("Ottavio Brenn of Calvara") three or four times reads
//   as a form. In the view (built once, engine side) the second and later full mentions of a person in the scene are
//   cut to the given name.
// - Two buttons with one label. If two choices of a view still read the same, each says whom it means (its person's
//   house or byname), or else they are numbered.
(function () {
  const LF = A.LF = A.LF || {};
  LF.NAME_TRIES = 4;
  const recent = { day: -1, names: [] };
  LF.takenNames = function () {
    const out = new Set(), pc = A.S && A.S.pc ? A.P(A.S.pc) : null;
    const add = p => { if (p && p.given) out.add(p.given); };
    if (pc) {
      add(pc);
      for (const id of [].concat(pc.parents || [], pc.spouse || [], pc.children || [], pc.siblings || [])) add(A.P(id));
      for (const id of pc.parents || []) { const par = A.P(id); if (par) for (const k of par.children || []) add(A.P(k)); }
    }
    // the scene at the head of the queue, while its setup runs
    const q = A.S && A.S.queue && A.S.queue[0];
    if (q && q.ctx) for (const k in q.ctx) { const v = q.ctx[k]; if (typeof v === 'string' && /^p\w+$/.test(v)) add(A.P(v)); }
    const day = A.S && A.absDay ? A.absDay() : 0;
    if (recent.day === day) for (const n of recent.names) out.add(n);
    return out;
  };
  const given0 = A.givenName;
  if (typeof given0 === 'function') A.givenName = function (cult, sex) {
    let n = given0.apply(this, arguments);
    try {
      if (!LF.OFF && A.S && A.S.pc) {
        const taken = LF.takenNames();
        for (let t = 0; t < LF.NAME_TRIES && taken.has(n); t++) n = given0.apply(this, arguments);
        const day = A.absDay ? A.absDay() : 0;
        if (recent.day !== day) { recent.day = day; recent.names = []; }
        recent.names.push(n); if (recent.names.length > 6) recent.names.shift();
      }
    } catch (e) { console.error('fresh name', e); }
    return n;
  };

  // ---- the view: a full name once, and labels that differ ---------------------------------------------------------
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  LF.people = q => {
    const out = [];
    if (q && q.ctx) for (const k in q.ctx) { const v = q.ctx[k]; if (typeof v === 'string' && /^p\w+$/.test(v)) { const p = A.P(v); if (p && p.given && !out.includes(p)) out.push(p); } }
    return out;
  };
  LF.onceFull = function (text, people) {
    let t = String(text || '');
    for (const p of people) {
      for (const full of [A.fullName(p), A.fullName(p, false)]) {
        if (!full || full === p.given || full.length < p.given.length + 3) continue;
        const rx = new RegExp(esc(full), 'g');
        let i = 0;
        t = t.replace(rx, m => (i++ === 0 ? m : p.given));
      }
    }
    return t;
  };
  const view0 = A.eventView;
  A.eventView = function (q) {
    const v = view0.apply(this, arguments);
    try {
      if (LF.OFF || !v || v.skip || !q || q.type !== 'event' || q.result || v._lfNames) return v;
      v._lfNames = 1;
      const ps = LF.people(q);
      if (ps.length && typeof v.text === 'string') v.text = LF.onceFull(v.text, ps);
      if (Array.isArray(v.choices)) {
        const seen = {};
        for (const c of v.choices) if (typeof c.t === 'string') (seen[c.t] = seen[c.t] || []).push(c);
        for (const k in seen) if (seen[k].length > 1) {
          // a person each label names: their house or byname tells them apart
          seen[k].forEach((c, i) => {
            const others = ps.filter(x => k.includes(x.given));
            const p = others[i];
            const tag = p && (p.sur || p.epithet) ? String(p.sur || p.epithet) : String(i + 1);
            c.t = `${k} (${tag})`;
          });
        }
      }
    } catch (e) { console.error('scene names', e); }
    return v;
  };
})();
