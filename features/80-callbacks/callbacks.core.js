// Callbacks (80-callbacks): what the callback events in callbacks.events.js share. Nothing here draws on A.rand
// or changes state; the events' setups use these to find the people and words an earlier scene left behind.
//
//   A.CB.since(p, f)          years since flag f was set (flags hold the year)
//   A.CB.word(n)              a small number as a word ("eleven")
//   A.CB.yrs(p, ctx, f)       ctx.yrs = the years since f, as a word
//   A.CB.arcWho(p, k, role)   the living person a story arc kept: pc.arcs[k].who[role] (50-arcs-kin), .ar.who[role] (51-arcs-rivals) or .pid (53-arcs-things)
//   A.CB.arcWord(p, k, w)     a word a story arc kept (pc.arcs[k].nm[w], .w[w] or .ar[w]), or null
//   A.CB.cast(p, ctx, q, alt) put q in the scene: ctx.pid (so fx.them reaches them), ctx.nm and ctx.Nm (name, or alt)
//   A.CB.had(p, k)            a mark another feature keeps off the flags: 74-old-age's pc.oa.m[k] or a bond's r[k]
//                             (21-npc-initiative's niTold / niConf on pc.rel). The bench reads had(p, 'k') as the la_k mark.
(function () {
  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const word = n => (n >= 0 && n < NUM.length ? NUM[n] : String(n));
  const since = (p, f) => { const y = p && p.flags ? +p.flags[f] : NaN; return isFinite(y) ? A.S.year - y : 0; };
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const live = q => (q && q.alive ? q : null);
  const CB = A.CB = {
    word, since, cap,
    yrs(p, ctx, f) { ctx.yrs = word(Math.max(1, since(p, f))); return ctx.yrs; },
    arcWho(p, k, role) {
      const a = p && p.arcs && typeof p.arcs === 'object' ? p.arcs[k] : null;
      if (!a || typeof a !== 'object') return null;
      const who = a.who && typeof a.who === 'object' ? a.who : a.ar && a.ar.who && typeof a.ar.who === 'object' ? a.ar.who : null;
      const id = role ? (who ? who[role] : null) : a.pid;
      return id != null ? live(A.P(id)) : null;
    },
    arcWord(p, k, w) {
      const a = p && p.arcs && typeof p.arcs === 'object' ? p.arcs[k] : null;
      if (!a || typeof a !== 'object') return null;
      const v = a.nm && a.nm[w] != null ? a.nm[w] : a.w && a.w[w] != null ? a.w[w] : a.ar && a.ar[w] != null && typeof a.ar[w] !== 'object' ? a.ar[w] : null;
      return v == null ? null : String(v);
    },
    cast(p, ctx, q, alt) {
      if (q && q.id !== p.id) { ctx.pid = q.id; ctx.nm = q.given; }
      else ctx.nm = alt;
      ctx.Nm = cap(ctx.nm);
      return q;
    },
    had(p, k) {
      if (!p) return false;
      if (p.oa && p.oa.m && p.oa.m[k] != null) return true;
      for (const id in p.rel || {}) { const r = p.rel[id]; if (r && r[k] != null) return true; }
      return false;
    },
    // the living person a bond-mark sits on (21-npc-initiative keeps niTold / niConf on pc.rel[id])
    markedOne(p, k) {
      for (const id in p.rel || {}) { const r = p.rel[id]; if (r && r[k] != null) { const q = live(A.P(id)); if (q) return q; } }
      return null;
    },
    // years since the oldest bond-mark k was made (0 when there is none)
    markAge(p, k) {
      let y = Infinity;
      for (const id in p.rel || {}) { const r = p.rel[id]; if (r && isFinite(+r[k])) y = Math.min(y, +r[k]); }
      return isFinite(y) ? A.S.year - y : 0;
    },
    // the person 74-old-age named with a mark (pc.oa.m[k + '_who'] holds a given name)
    oaWho(p, k) { return p && p.oa && p.oa.m && p.oa.m[k + '_who'] ? String(p.oa.m[k + '_who']) : null; },
    famName(p) { const f = A.family(p); return f && f.name ? f.name : 'your family'; },
  };
})();
