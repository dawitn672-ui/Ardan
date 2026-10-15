// Schemes, both ways (Road to Ten, Relationships 3: "schemes both ways: sway, befriend, seduce, slander, murder").
// The release has instant one-click acts on a person (flirt, insult, murder: one roll, done). A scheme is slower and
// quieter: you choose what you want of someone, and the plot grows each month by your skills, theirs, and the friends
// of yours who hate them. Halfway, an opening comes; at the end, the last move is yours. Every month it runs, they may
// find you out. And the people who hate you plot too: you may notice that something is wrong, find out who, and answer.
//
// State: pc.schemes = [{ id, k, t, prog, m, mid, wait }] (yours); pc.scAgainst = { by, k, prog, m, noticed } (theirs).
// Engine side: the month hook and the event effects (fx.scheme). Rendering only reads.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SC = A.SCHEMES = {
    // base: progress a month before skills; risk: chance a month they find out, before guards and skill
    KINDS: {
      sway: { name: 'Win them over', verb: 'winning over', skills: ['persuasion', 'etiquette'], base: 9, risk: 0.02 },
      befriend: { name: 'Make a friend of them', verb: 'befriending', skills: ['persuasion', 'etiquette'], base: 8, risk: 0.02 },
      seduce: { name: 'Seduce them', verb: 'seducing', skills: ['persuasion', 'deception'], base: 7, risk: 0.04 },
      slander: { name: 'Spread lies about them', verb: 'slandering', skills: ['deception', 'intrigue'], base: 8, risk: 0.06 },
      murder: { name: 'Have them killed', verb: 'plotting the death of', skills: ['intrigue', 'stealth'], base: 5, risk: 0.06 },
    },
    MAX: 2,          // schemes of your own at once
    BLOOD: ['mother', 'father', 'sibling', 'child', 'grandparent', 'grandchild', 'uncle', 'nephew'],
  };
  const sk = (p, k) => (A.skill ? A.skill(p, k) : (p.skills && p.skills[k]) || 0);
  const has = (p, t) => !!(p && Array.isArray(p.traits) && p.traits.includes(t));
  const opOf = (a, b) => (a && b && a.rel && a.rel[b.id] ? a.rel[b.id].op || 0 : 0);   // what a thinks of b

  SC.list = pc => (pc && Array.isArray(pc.schemes) ? pc.schemes : []);
  SC.byId = (pc, id) => SC.list(pc).find(s => s.id === id) || null;
  // friends of yours who hate the target help (up to three)
  SC.agents = function (pc, t) {
    if (!pc || !t) return [];
    const out = [];
    for (const id of Object.keys(pc.rel || {})) {
      const r = pc.rel[id], p = A.P(id);
      if (!p || !p.alive || p.id === t.id || !['friend', 'bestfriend', 'comrade', 'lover', 'spouse', 'sibling', 'cousin'].includes(r.type) || (r.op || 0) < 20) continue;
      if (opOf(p, t) <= -10) out.push(p);
      if (out.length >= 3) break;
    }
    return out;
  };
  // how hard the target is to work on
  SC.guard = function (pc, s, t) {
    if (!t) return 0;
    let g = sk(t, 'intrigue') / 12;
    if (s.k === 'slander' || s.k === 'murder') g += t.ruler ? 6 : t.status === 'royal' ? 4 : t.status === 'noble' ? 2.5 : t.status === 'gentry' ? 1 : 0;
    else {
      if (has(t, 'shy') || has(t, 'paranoid')) g += 2;
      if (has(t, 'gregarious') || has(t, 'trusting')) g -= 2;
      if (s.k === 'seduce' && (has(t, 'temperate') || has(t, 'honorable'))) g += 2;
      if (opOf(t, pc) < -20) g += 3;
    }
    return g;
  };
  // progress a month (2 to 25)
  SC.power = function (pc, s) {
    const K = SC.KINDS[s.k], t = A.P(s.t);
    let pw = K.base + (sk(pc, K.skills[0]) + sk(pc, K.skills[1])) / 12 + SC.agents(pc, t).length * 3 - SC.guard(pc, s, t);
    if (s.k === 'seduce') pw += ((pc.looks || 50) - 50) / 10;
    return clamp(pw, 2, 25);
  };
  // the chance a month that they find out
  SC.risk = function (pc, s) {
    const K = SC.KINDS[s.k], t = A.P(s.t);
    return clamp(K.risk * (1 + SC.guard(pc, s, t) / 5) * (1 - sk(pc, 'intrigue') / 150) * (1 + SC.agents(pc, t).length * 0.15), 0.005, 0.3);
  };
  SC.monthsLeft = (pc, s) => Math.max(1, Math.ceil((100 - s.prog) / SC.power(pc, s)));
  SC.can = function (pc, t, k) {
    if (!pc || !t || !t.alive || t.id === pc.id || !A.isAdult(pc) || !A.isAdult(t) || pc.prison) return false;
    if (SC.list(pc).some(s => s.t === t.id) || SC.list(pc).length >= SC.MAX) return false;
    const r = pc.rel[t.id] || { type: 'acquaint', op: 0 };
    if (k === 'sway') return opOf(t, pc) < 60;
    if (k === 'befriend') return !['friend', 'bestfriend', 'spouse', 'lover'].includes(r.type) && !SC.BLOOD.includes(r.type);
    if (k === 'seduce') return !['spouse', 'lover'].includes(r.type) && !SC.BLOOD.includes(r.type);
    return k === 'slander' || k === 'murder';
  };
  SC.start = function (pc, t, k) {
    if (!SC.can(pc, t, k)) return null;
    const S = A.S; S.scNext = (S.scNext || 0) + 1;
    const s = { id: S.scNext, k, t: t.id, prog: 0, m: 0, y: S.year };
    pc.schemes = SC.list(pc).concat([s]);
    A.log(`You begin ${SC.KINDS[k].verb} ${t.given}. About ${SC.monthsLeft(pc, s)} months, if nothing goes wrong.`, 'muted');
    return s;
  };
  SC.end = (pc, id) => { pc.schemes = SC.list(pc).filter(s => s.id !== id); };

  // the person view: one "Plot…" button opens the choice of scheme
  A.INTERACT.sc_plot = { name: 'Plot…', cost: 0 };
  const opts = A.interactOptions;
  A.interactOptions = function (pc, t) {
    const o = opts.apply(this, arguments);
    try { if (Object.keys(SC.KINDS).some(k => SC.can(pc, t, k))) o.push('sc_plot'); } catch (e) {}
    return o;
  };
  const interact = A.interact;
  A.interact = function (tid, key) {
    if (key !== 'sc_plot') return interact.apply(this, arguments);
    const pc = A.pc(), t = A.P(tid);
    if (!pc || !t) return { ok: false };
    A.queue({ type: 'event', ev: 'sc_choose', forced: true, ctx: { pid: t.id, sc: 1 } });
    return { ok: true, msg: '' };
  };

  // fx.scheme: { start: kind } begins one on ctx.pid; { prog } moves the scheme ctx.sid; { found } means they found
  // you out; { end } closes it; { guard } slows the plot against you; { unmask } names who is behind it
  (A.FX_EXTRA = A.FX_EXTRA || []).push('scheme');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    try {
      const v = fx && typeof fx === 'object' ? fx.scheme : null;
      if (v && typeof v === 'object' && pc && pc.id === A.S.pc) {
        if (v.start) { const t = A.P(ctx && ctx.pid); if (t) SC.start(pc, t, v.start); }
        const s = ctx && ctx.sid != null ? SC.byId(pc, ctx.sid) : null;
        if (s) {
          s.wait = 0;
          if (v.prog) s.prog = clamp(s.prog + v.prog, 0, 100);
          if (v.found) { SC.end(pc, s.id); A.queue({ type: 'event', ev: 'sc_found', forced: true, ctx: { pid: s.t, k: s.k, sc: 1 } }); }
          else if (v.end) SC.end(pc, s.id);
          if (v.smear) { const t = A.P(s.t); if (t) { t.fame = clamp((t.fame || 0) - v.smear, 0, 100); for (const id of Object.keys(t.rel || {})) { const o = A.P(id); if (o && o.rel && o.rel[t.id] && id !== String(pc.id)) o.rel[t.id].op = clamp((o.rel[t.id].op || 0) - v.smear / 2, -100, 100); } } }
          if (v.kill) { const t = A.P(s.t); if (t && t.alive) A.kill(t, v.kill); }
        }
        const a = pc.scAgainst;
        if (a) {
          if (v.guard) a.prog = Math.max(0, a.prog - v.guard);
          if (v.unmask) { const by = A.P(a.by); if (by) A.queue({ type: 'event', ev: 'sc_unmasked', forced: true, ctx: { pid: by.id, k: a.k, sc: 1 } }); }
          if (v.drop) pc.scAgainst = null;
        }
      }
    } catch (e) { console.error('schemes fx', e); }
    return r;
  };

  // the people who hate you, and might act on it
  SC.enemies = function (pc) {
    const out = [];
    for (const id of Object.keys(pc.rel || {})) {
      const p = A.P(id);
      if (!p || !p.alive || !A.isAdult(p) || p.prison || SC.BLOOD.includes((pc.rel[id] || {}).type)) continue;
      const op = opOf(p, pc);
      if (op <= -40) out.push({ p, op });
    }
    return out.sort((a, b) => a.op - b.op || String(a.p.id).localeCompare(String(b.p.id)));
  };
  SC.noticeChance = pc => clamp(0.05 + (sk(pc, 'intrigue') + (pc.ins || 0) / 2) / 400 + SC.list(pc).length * 0.02, 0.05, 0.4);

  A.onMonth.push(pc => {
    if (!pc || !pc.alive || !pc.rel) return;
    const S = A.S;
    // your schemes
    for (const s of SC.list(pc).slice()) {
      const t = A.P(s.t);
      if (!t || !t.alive) { SC.end(pc, s.id); if (t) A.log(`${t.given} is dead, and your plot dies too.`, 'muted'); continue; }
      if (s.wait || pc.prison) continue;
      s.m++;
      s.prog = clamp(s.prog + SC.power(pc, s), 0, 100);
      if (!s.mid && s.prog >= 50) { s.mid = 1; s.wait = 1; A.queue({ type: 'event', ev: 'sc_opening', forced: true, ctx: { pid: t.id, sid: s.id, k: s.k, sc: 1 } }); continue; }
      if (s.prog >= 100) { s.wait = 1; A.queue({ type: 'event', ev: 'sc_done_' + s.k, forced: true, ctx: { pid: t.id, sid: s.id, k: s.k, sc: 1 } }); continue; }
      if (A.chance(SC.risk(pc, s))) { SC.end(pc, s.id); A.queue({ type: 'event', ev: 'sc_found', forced: true, ctx: { pid: t.id, k: s.k, sc: 1 } }); }
    }
    // theirs
    if (!A.isAdult(pc)) return;
    let a = pc.scAgainst;
    if (a) {
      const by = A.P(a.by);
      if (!by || !by.alive || opOf(by, pc) > -20) { pc.scAgainst = null; return; }   // dead, or no longer hates you
      a.m++; a.prog += A.ri(6, 12);
      if (!a.noticed && A.chance(SC.noticeChance(pc))) { a.noticed = 1; A.queue({ type: 'event', ev: 'sc_noticed', forced: true, ctx: { k: a.k, sc: 1 } }); return; }
      if (a.prog >= 100) {
        pc.scAgainst = null;
        A.queue({ type: 'event', ev: a.k === 'murder' ? 'sc_attempt' : 'sc_slandered', forced: true, ctx: { pid: by.id, k: a.k, sc: 1 } });
      }
      return;
    }
    const foes = SC.enemies(pc);
    if (!foes.length) return;
    const { p, op } = foes[0];
    const spite = 1 + ['ambitious', 'cruel', 'vengeful', 'wrathful', 'deceitful'].filter(x => has(p, x)).length * 0.5;
    if (!A.chance(0.03 * spite)) return;
    const killer = op <= -75 && (has(p, 'cruel') || has(p, 'vengeful') || has(p, 'wrathful'));
    pc.scAgainst = { by: p.id, k: killer ? 'murder' : 'slander', prog: 0, m: 0, y: S.year, noticed: 0 };
  });

  // the Life tab: your schemes, and a sense that something is wrong (pure)
  SC.lines = function (pc) {
    const out = [];
    for (const s of SC.list(pc)) {
      const t = A.P(s.t); if (!t) continue;
      const helpers = SC.agents(pc, t).map(p => p.given);
      const v = SC.KINDS[s.k].verb;
      out.push({ k: s.k, text: `${v[0].toUpperCase() + v.slice(1)} ${t.given}: ${Math.round(s.prog)}%, about ${SC.monthsLeft(pc, s)} months left; ${Math.round(SC.risk(pc, s) * 100)}% a month that ${t.given} finds out${helpers.length ? `; ${helpers.join(', ')} ${helpers.length > 1 ? 'help' : 'helps'}` : ''}.` });
    }
    if (pc.scAgainst && pc.scAgainst.noticed) out.push({ k: 'against', text: 'Someone is working against you. You do not know who.' });
    return out;
  };
  const life = UI.TAB && UI.TAB.life;
  if (typeof life === 'function') UI.TAB.life = function (pc) {
    const h = life.apply(this, arguments);
    try {
      const L = pc && pc.alive ? SC.lines(pc) : [];
      if (!L.length) return h;
      const card = `<div class="card small schemes" aria-label="Schemes"><b>Schemes</b>${L.map(l => `<div class="tiny ${l.k === 'against' ? 'bad' : ''}">${UI.esc(l.text)}</div>`).join('')}</div>`;
      const at = h.indexOf('<div class="row small muted" style="margin:6px 0 4px">');
      return at > 0 ? h.slice(0, at) + card + h.slice(at) : h + card;
    } catch (e) { return h; }
  };
})();
