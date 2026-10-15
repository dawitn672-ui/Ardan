// Circles (Road to Ten, Relationships 6: "add groups: friend circles, cliques in your unit or guild. A friend of your
// enemy starts cooler toward you").
//
// In the release the people you know barely know each other: a grown life's twenty contacts hold three to five close
// ties among themselves, and two of those run to someone else you know. So nobody arrives as anyone's friend, and
// what you do to one person stays with that person. Now:
//   - circles form: a new acquaintance is often already close to someone you know (two in five), more often to your
//     friends if you meet them as a friend, to your foes if you meet them as a foe;
//   - first impressions follow the circle: each friend of yours they are close to warms them by 8 (up to 16), each foe
//     of yours cools them by 12 (up to 24), and the person view says why;
//   - word gets around: when you do someone a great good or harm (10 opinion or more), their close friends hear of it
//     and move a third as far;
//   - cliques: the men of your unit, or the regulars of your street, keep their own fire (events).
//
// Engine side: A.makeAcquaintance, A.link and A.addOp are wrapped. Rendering only reads pc.rel[id].circ.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const CI = A.CIRCLES = {
    CLOSE: ['friend', 'bestfriend', 'lover', 'spouse', 'comrade', 'betrothed'],
    BLOOD: ['mother', 'father', 'sibling', 'child', 'grandparent', 'grandchild', 'uncle', 'nephew', 'cousin', 'spouse'],
    TIE: 0.4,                 // chance a new acquaintance is already close to someone you know
    WARM: 8, WARM_MAX: 16,    // per friend of yours in their circle
    COOL: 12, COOL_MAX: 24,   // per foe of yours in their circle
    WORD: 1 / 3,              // share of a big opinion change that reaches the target's close friends
  };
  const op = (a, b) => (a && b && a.rel && a.rel[b.id] ? a.rel[b.id].op || 0 : 0);
  // a scene at most every few years per kind, so circles colour life without crowding it
  CI.EVERY = { foe: 4, word: 3 };
  CI.may = function (k) {
    const S = A.S; S.cirNext = S.cirNext || {};
    if (S.cirNext[k] != null && S.year < S.cirNext[k]) return false;
    S.cirNext[k] = S.year + CI.EVERY[k];
    return true;
  };
  // the people p is close to (their side of the tie)
  CI.close = function (p) {
    if (!p || !p.rel) return [];
    return Object.keys(p.rel).filter(id => { const r = p.rel[id]; return r && CI.CLOSE.includes(r.type) && (r.op || 0) >= 30; }).map(A.P).filter(x => x && x.alive);
  };
  // t's close ties among the people pc knows: friends of pc, and foes of pc
  CI.circleOf = function (pc, t) {
    const friends = [], foes = [];
    for (const x of CI.close(t)) {
      if (!pc.rel[x.id] || x.id === pc.id) continue;
      const v = pc.rel[x.id].op || 0;
      if (v >= 30) friends.push(x); else if (v <= -30) foes.push(x);
    }
    return { friends, foes };
  };
  // the people of pc's life a newcomer could already know: grown, alive, not family
  CI.pool = function (pc) {
    return Object.keys(pc.rel || {}).filter(id => !CI.BLOOD.includes(pc.rel[id].type)).map(A.P).filter(x => x && x.alive && A.isAdult(x));
  };

  // circles form: the newcomer is often close to someone you already know
  const make = A.makeAcquaintance;
  A.makeAcquaintance = function (pc, kind, child) {
    const p = make.apply(this, arguments);
    try {
      if (p && pc && pc.id === A.S.pc && !child && A.isAdult(p) && A.isAdult(pc) && A.chance(CI.TIE)) {
        const pool = CI.pool(pc);
        if (pool.length) {
          const foe = kind === 'enemy' || kind === 'rival';
          // like finds like: a foe of yours is more often met through your foes, a friend through your friends
          const x = A.wpick(pool, y => { const v = op(pc, y); return foe ? (v <= -30 ? 4 : 1) : (v >= 30 ? 3 : 1); });
          if (x) A.link(p, x, 'friend', A.ri(35, 60), 'friend');
        }
      }
    } catch (e) { console.error('circles', e); }
    return p;
  };

  // first impressions follow the circle
  const link = A.link;
  A.link = function (a, b, type) {
    const isNew = !!(a && b && A.S && a.id === A.S.pc && a.id !== b.id && !(a.rel && a.rel[b.id]));
    const r = link.apply(this, arguments);
    try {
      if (isNew && !CI.BLOOD.includes(type) && A.isAdult(a) && a.rel[b.id]) {
        const c = CI.circleOf(a, b);
        if (c.friends.length || c.foes.length) {
          const d = Math.min(CI.WARM_MAX, c.friends.length * CI.WARM) - Math.min(CI.COOL_MAX, c.foes.length * CI.COOL);
          a.rel[b.id].op = clamp((a.rel[b.id].op || 0) + d * 0.5, -100, 100);
          if (b.rel && b.rel[a.id]) b.rel[a.id].op = clamp((b.rel[a.id].op || 0) + d, -100, 100);
          a.rel[b.id].circ = { f: c.friends.slice(0, 3).map(x => x.id), e: c.foes.slice(0, 3).map(x => x.id), d };
          if (c.foes.length && a.alive && CI.may('foe')) A.queue({ type: 'event', ev: 'cir_foes_friend', ctx: { pid: b.id, foe: c.foes[0].id, npcMove: true } });
        }
      }
    } catch (e) { console.error('circles', e); }
    return r;
  };

  // word gets around: a great good or harm reaches the target's close friends
  const addOp = A.addOp;
  let busy = false;
  A.addOp = function (a, b, d) {
    const r = addOp.apply(this, arguments);
    if (busy || !a || !b || typeof d !== 'number' || Math.abs(d) < 10 || !A.S) return r;
    try {
      busy = true;
      const pc = a.id === A.S.pc ? a : b.id === A.S.pc ? b : null, other = pc === a ? b : a;
      if (pc && other && other !== pc) {
        const heard = [];
        for (const x of CI.close(other)) {
          if (x.id === pc.id || !x.rel || !x.rel[pc.id]) continue;
          x.rel[pc.id].op = clamp((x.rel[pc.id].op || 0) + d * CI.WORD, -100, 100);
          heard.push(x);
        }
        if (heard.length && Math.abs(d) >= 20) {
          const ns = heard.slice(0, 3).map(x => x.given), names = ns.length > 1 ? ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1] : ns[0];
          A.log(`Word gets around. ${names} ${heard.length > 1 ? 'hear' : 'hears'} what passed between you and ${other.given}, and ${d < 0 ? 'think less of you' : 'think better of you'}.`, 'muted');
        }
        if (d <= -20 && heard.length >= 2 && pc.alive && A.isAdult(pc) && CI.may('word')) A.queue({ type: 'event', ev: 'cir_word', ctx: { pid: other.id, ids: heard.slice(0, 3).map(x => x.id), npcMove: true } });
      }
    } catch (e) { console.error('circles', e); } finally { busy = false; }
    return r;
  };

  // effect key for circle scenes: { circle: 'join' | 'lead' } ties the clique (ctx.ids) together and to you; 'apart'
  // cools them a little; 'soothe' warms ctx.ids; 'mend' carries a peace offer to your foe ctx.foe
  (A.FX_EXTRA = A.FX_EXTRA || []).push('circle');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    try {
      const v = fx && typeof fx === 'object' ? fx.circle : null;
      // { circle: 'mend' }: a message carried to your foe (ctx.foe) through their friend
      if (v === 'mend' && pc && pc.id === A.S.pc && ctx && ctx.foe) { const f = A.P(ctx.foe); if (f && pc.rel[f.id]) A.addOp(pc, f, 15); }
      if (v && pc && pc.id === A.S.pc && ctx && Array.isArray(ctx.ids)) {
        const ms = ctx.ids.map(A.P).filter(x => x && x.alive);
        if (v === 'join' || v === 'lead') {
          for (const x of ms) for (const y of ms) if (x !== y) { if (!x.rel[y.id]) A.link(x, y, 'friend', 45, 'friend'); else x.rel[y.id].op = Math.max(x.rel[y.id].op || 0, 40); }
          for (const x of ms) { if (!pc.rel[x.id]) A.link(pc, x, 'friend', 30, 'friend'); A.addOp(pc, x, v === 'lead' ? 14 : 10); }
          pc.clique = { ids: ms.map(x => x.id), y: A.S.year, k: ctx.where || 'street' };
        }
        if (v === 'apart') for (const x of ms) if (x.rel && x.rel[pc.id]) x.rel[pc.id].op = clamp((x.rel[pc.id].op || 0) - 4, -100, 100);
        if (v === 'soothe') for (const x of ms) if (x.rel && x.rel[pc.id]) x.rel[pc.id].op = clamp((x.rel[pc.id].op || 0) + 6, -100, 100);
      }
    } catch (e) { console.error('circles fx', e); }
    return r;
  };

  // the clique a scene is about: three of your comrades, or three of the grown people of your street (deterministic)
  CI.cliqueFor = function (pc) {
    const comrades = A.relsOf(pc, ['comrade']).map(x => x.p).filter(x => x.alive && A.isAdult(x));
    const local = CI.pool(pc).filter(x => x.home === pc.home && !CI.BLOOD.includes((pc.rel[x.id] || {}).type));
    const from = pc.mil && comrades.length >= 3 ? comrades : local.length >= 3 ? local : null;
    if (!from) return null;
    const ids = from.map(x => x.id).sort().slice(0, 3);
    return { ids, where: from === comrades ? 'unit' : 'street' };
  };

  // the person view: the circle (pure)
  const card = UI.personModal;
  if (typeof card === 'function') UI.personModal = function (t) {
    const h = card.apply(this, arguments);
    try {
      const pc = A.pc(); if (!pc || !t || !pc.rel[t.id]) return h;
      const c = CI.circleOf(pc, t);
      if (!c.friends.length && !c.foes.length) return h;
      const nm = L => L.slice(0, 3).map(x => UI.esc(x.given)).join(', ');
      const bits = [];
      if (c.friends.length) bits.push(`close to ${nm(c.friends)} (${c.friends.length > 1 ? 'your friends' : 'your friend'})`);
      if (c.foes.length) bits.push(`<span class="bad">close to ${nm(c.foes)} (${c.foes.length > 1 ? 'your foes' : 'your foe'})</span>`);
      const line = `<div class="small muted">Circle: ${bits.join('; ')}</div>`;
      const at = h.indexOf('</h2>');
      return at > 0 ? h.slice(0, at + 5) + line + h.slice(at + 5) : h;
    } catch (e) { return h; }
  };
})();
