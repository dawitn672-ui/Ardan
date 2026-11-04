// NPC beliefs, part 2 of 3: how beliefs travel, and what they make people do.
//
//   - Once a year, everyone around the player passes on what they believe to the people close to them (41-circles'
//     circles, or friends and kin): the gregarious talk more, the trusting take anything, the cynical little, and
//     people believe the worst of those they hate. Someone who has seen through a story passes that on too, so
//     corrections travel the same roads as rumours. A false belief held near its subject is sometimes seen through.
//   - A long talk with someone (the release's interactions) clears up a slander they hold, now and then, and they may
//     tell you what they believe of someone else, which you take on their word: your knowledge can be wrong.
//   - Three NPC moves of 21-npc-initiative's monthly step (its budget, cooldowns and "why" line): someone who believes a
//     wrong of you confronts you; someone who believes a tale of you praises you for it; a friend passes on what they
//     believe of a third person. Without that feature, a small budget of this one's runs them.
//   - The player's own telling: "Talk of what is said" in the person view (set them right about you or about someone
//     else, tell a story about a foe, tell your own deeds larger than they were), and the fx key `nb` for scenes.
// Every roll is in an engine path: the month hook, an interaction, an event choice.
(function () {
  const NB = A.NPCB; if (!NB) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), has = NB.has, cap = NB.cap;

  // ---------------------------------------------------------------- passing a belief on

  // the chance that `to` takes on a belief from `from` (pure)
  NB.accept = function (to, c, stance, from) {
    let p = 0.55;
    if (has(to, 'trusting')) p += 0.25;
    if (has(to, 'cynical')) p -= 0.25;
    if (has(to, 'curious')) p += 0.05;
    if (has(to, 'paranoid')) p += c.v < 0 ? 0.15 : -0.15;
    const ft = from && to.rel && to.rel[from.id] ? to.rel[from.id].op || 0 : 0;
    if (ft >= 30) p += 0.15; else if (ft <= -20) p -= 0.3;
    const pc = A.pc();
    const so = c.s != null ? (pc && c.s === pc.id ? NB.opOf(pc, to) : to.rel && to.rel[c.s] ? to.rel[c.s].op || 0 : 0) : 0;
    if (stance > 0 && c.v < 0) p += so <= -20 ? 0.15 : so >= 30 ? -0.2 : 0;   // the worst is easy to believe of those you hate
    if (stance > 0 && c.v > 0) p += so >= 30 ? 0.1 : so <= -20 ? -0.2 : 0;
    return clamp(p, 0.05, 0.95);
  };
  // changing a belief already held is harder; a correction from an honest friend is easier to hear (pure)
  NB.sway = function (to, c, stance, from) {
    let p = NB.accept(to, c, stance, from) * 0.5;
    if (NB.isFalse(c, stance) && !NB.isFalse(c, NB.held(to, c.id))) p *= 0.3;   // once set right, hard to fool again
    if (has(to, 'stubborn')) p *= 0.5;
    if (has(to, 'proud')) p *= 0.7;
    if (has(to, 'humble')) p *= 1.2;
    if (!NB.isFalse(c, stance)) p *= 1.8;                        // the truth, from a friend, carries
    if (from && has(from, 'honest') && !NB.isFalse(c, stance)) p *= 1.3;
    return clamp(p, 0.02, 0.9);
  };
  // engine: from tells to what they believe
  NB.tell = function (from, to, cid, stance) {
    if (!to || !to.alive || to.id === (A.pc() || {}).id) return false;
    const c = NB.claim(cid); if (!c) return false;
    const cur = NB.held(to, cid);
    if (cur === stance) return false;
    const p = cur ? NB.sway(to, c, stance, from) : NB.accept(to, c, stance, from);
    NB.stats.told++;
    return A.chance(p) ? NB.adopt(to, cid, stance, 'told') : false;
  };
  const talky = h => (has(h, 'gregarious') ? 1.8 : 1) * (has(h, 'shy') ? 0.5 : 1) * (has(h, 'deceitful') ? 1.2 : 1);
  NB.TELL = 0.22;   // a year's chance a person passes a given belief on (before their nature)
  NB.spreadYear = function (pc, web) {
    const set = new Set(web.map(p => String(p.id)));
    for (const h of web) {
      if (!h.nb) continue;
      let told = 0;
      for (const id of Object.keys(h.nb)) {
        if (told >= 2) break;
        const st = h.nb[id], c = NB.claim(id); if (!c || !st) continue;
        const pT = NB.TELL * talky(h) * (c.s === pc.id ? 1.2 : 1) * (NB.isFalse(c, -st) && st < 0 ? 2 : 1) * (c.k === 'B' ? 0.6 : 1);
        if (!A.chance(Math.min(0.9, pT))) continue;
        const to = NB.contacts(h, set).filter(x => x.id !== pc.id);
        if (!to.length) continue;
        told++;
        NB.tell(h, A.pick(to), +id, st);
      }
      // the truth will out: a false belief about someone who lives in the same town is sometimes seen through
      for (const id of Object.keys(h.nb || {})) {
        const st = h.nb[id], c = NB.claim(id); if (!c || !NB.isFalse(c, st) || c.k === 'B' || c.k === 'Z') continue;
        const sub = A.P(c.s), here = sub && sub.home != null && sub.home === h.home;
        if (A.chance(NB.LEAK * (here ? 1 : 0.3))) { NB.adopt(h, +id, -st, 'leak'); NB.stats.leak++; }
      }
    }
  };

  // ---------------------------------------------------------------- the yearly step and the month hook

  NB.year = function (pc) {
    const web = NB.web(pc);
    NB.seedDeeds(pc, web);
    NB.seedBattles(pc, web);
    NB.slanderYear(pc, web);
    NB.othersYear(pc, web);
    NB.courtYear();
    NB.newsYear(pc, web);
    NB.spreadYear(pc, web);
    NB.gc();
  };
  A.onMonth.push(pc => {
    try {
      if (!pc || !pc.alive || pc.id !== A.S.pc || NB.OFF) return;
      const st = NB.st();
      if (st.y !== A.S.year) { st.y = A.S.year; NB.year(pc); }
      NB.solo(pc);
    } catch (e) { console.error('npc-beliefs month', e); }
  });

  // ---------------------------------------------------------------- what the people the player knows hold (pure)

  const aboutPc = (pc, t) => NB.beliefs(t).filter(x => x.c.s === pc.id && x.c.k !== 'B');
  // the worst thing they believe of you (a killing, a sin, a slander, a twisted deed)
  NB.worstOf = function (pc, t, min) {
    let best = null;
    for (const x of aboutPc(pc, t)) if (x.st > 0 && x.c.v <= -(min || 6) && (!best || x.c.v < best.c.v || (x.c.v === best.c.v && !x.c.t && best.c.t))) best = x;
    return best;
  };
  // a tale of you they believe
  NB.taleOf = (pc, t) => aboutPc(pc, t).find(x => x.st > 0 && x.c.k === 'T') || null;
  // what they believe of someone else you know, that you have not heard
  NB.gossipOf = function (pc, t) {
    for (const x of NB.beliefs(t)) {
      if (x.st <= 0 || !'SK'.includes(x.c.k) || x.c.s === pc.id || x.c.s === t.id) continue;
      const s = A.P(x.c.s);
      if (s && s.alive && pc.rel[s.id] && !NB.pcHeld(pc, x.c.id)) return x;
    }
    return null;
  };
  NB.falseAbout = (pc, t) => aboutPc(pc, t).filter(x => NB.isFalse(x.c, x.st));

  // ---------------------------------------------------------------- NPC moves

  const KINDS = NB.KINDS = {
    nb_accuse: { ev: 'nb_accused', g: 'hostile', base: 2, op: 0, adult: 1, near: .3,
      tr: { vengeful: 1.8, wrathful: 1.6, proud: 1.3, paranoid: 1.3, brave: 1.2, calm: .5, forgiving: .4, craven: .5, shy: .6 }, mot: { feud: 1 },
      sit: (pc, t) => NB.worstOf(pc, t, 6) ? 2 : 0 },
    nb_praise: { ev: 'nb_praised', g: 'warm', base: 1.5, op: 0, adult: 1, near: .5,
      tr: { gregarious: 1.6, trusting: 1.4, generous: 1.2, shy: .6, cynical: .5 }, mot: { status: .3 },
      sit: (pc, t) => NB.taleOf(pc, t) ? 1.8 : 0 },
    nb_gossip: { ev: 'nb_gossip', g: 'warm', base: 1.2, op: 15, adult: 1, near: .3,
      tr: { gregarious: 1.8, deceitful: 1.3, fickle: 1.2, shy: .5, honest: .8 }, mot: {},
      sit: (pc, t) => NB.gossipOf(pc, t) ? 1.4 : 0 },
  };
  if (A.NPCI && A.NPCI.KINDS) Object.assign(A.NPCI.KINDS, KINDS);
  // without 21-npc-initiative: about half a move a year, from whoever wants one most (engine)
  NB.solo = function (pc) {
    if (A.NPCI || !A.isAdult(pc) || pc.prison) return;
    const st = NB.st();
    st.b = Math.min(2, (typeof st.b === 'number' ? st.b : 0.5) + 0.5 / 12);
    if (st.b < 1 || A.S.queue.some(q => q && q.ctx && q.ctx.npcMove && !q.result) || !A.chance(0.3)) return;
    const list = [];
    for (const id of Object.keys(pc.rel || {}).sort()) {
      const t = A.P(id); if (!t || !t.alive || !A.isAdult(t) || t.prison) continue;
      const o = NB.opOf(pc, t);
      for (const k of Object.keys(KINDS)) {
        const K = KINDS[k];
        if (K.g === 'hostile' ? o > K.op + 20 : o < K.op) continue;
        let w = K.base * (K.sit(pc, t) || 0); if (!w) continue;
        for (const x of t.traits || []) if (K.tr[x]) w *= K.tr[x];
        if (w >= .15) list.push({ t, k, w });
      }
    }
    const x = list.length ? A.wpick(list, z => z.w) : null;
    if (!x) return;
    st.b -= 1;
    A.queue({ type: 'event', ev: KINDS[x.k].ev, ctx: { pid: x.t.id, npcMove: true, nk: x.k } });
  };

  // a scene that needs a slot in 21-npc-initiative's budget (follow-ups); without it, a plain schedule (engine)
  NB.follow = function (pc, ctx, ev, lo, hi) {
    const nc = Object.assign({}, ctx, { npcMove: true });
    for (const k of ['khe', 'khim', 'khis', 'skip', 'niWhy']) delete nc[k];
    if (A.NPCI && A.NPCI.follow) return A.NPCI.follow(pc, nc, ev, lo, hi);
    A.schedule({ type: 'event', ev, ctx: nc, forced: true }, A.ri(lo, hi));
    return true;
  };
  // years later the truth about something the player believed comes out (engine)
  NB.scheduleTruth = function (pc, cid, from) {
    const c = NB.claim(cid); if (!c || !NB.isFalse(c, NB.pcHeld(pc, cid))) return false;
    pc.flags.nb_believed = A.S.year;
    if (!A.chance(0.6)) return false;
    A.schedule({ type: 'event', ev: 'nb_truth_out', forced: true, ctx: { cid, pid: c.s, from: from || '' } }, A.ri(300, 1500));
    return true;
  };

  // ---------------------------------------------------------------- talk: the release's interactions carry beliefs

  const interact = A.interact;
  A.interact = function (tid, key) {
    const res = interact.apply(this, arguments);
    try {
      const pc = A.pc(), t = A.P(tid);
      if (res && res.ok !== false && pc && t && t.alive && pc.alive && ['talk', 'time', 'advice'].includes(key) && A.S.npcb) NB.onTalk(pc, t);
    } catch (e) { console.error('npc-beliefs talk', e); }
    return res;
  };
  NB.onTalk = function (pc, t) {
    const bad = NB.falseAbout(pc, t).filter(x => x.st > 0 && x.c.v < 0)[0];
    if (bad && A.chance(0.3)) {
      NB.adopt(t, bad.c.id, -1, 'talk');
      A.log(`Over the evening ${t.given} asks you about the story ${NB.say(bad.c, pc)}. You tell ${A.him(t)} how it was, and ${A.he(t)} believes you.`, 'good');
      return;
    }
    const g = NB.gossipOf(pc, t);
    if (g && A.chance(0.25)) {
      NB.pcHear(pc, g.c.id, g.st, t.id);
      A.log(`${t.given} tells you, low, ${NB.say(g.c, pc)}. Whether it is so, you cannot say. (Person view)`, 'muted');
      NB.scheduleTruth(pc, g.c.id, t.id);
    }
  };
  // the slander move of 21-npc-initiative: the lie becomes a claim the slanderer and their friends hold
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S && A.S.queue[0];
    try {
      if (q && q.type === 'event' && !q.result && q.ev === 'ni_slander' && q.ctx && q.ctx.lie && q.ctx.pid && !q.ctx.nbSeeded) {
        const pc = A.pc(), t = A.P(q.ctx.pid);
        if (pc && t) { q.ctx.nbSeeded = 1; q.ctx.nbCid = NB.slander(pc, t, q.ctx.lie); }
      }
    } catch (e) { console.error('npc-beliefs slander', e); }
    const pc = A.pc(), live = !!(q && q.type === 'event' && !q.result && pc && A.S.npcb && !/^nb_/.test(q.ev));
    const f0 = live ? pc.fame || 0 : 0, h0 = live ? pc.honor || 0 : 0, v = live ? q.view || null : null, vc = v && v.choices ? v.choices[idx] : null;
    const res = choose.apply(this, arguments);
    try { if (live && vc && pc.alive && q.result) NB.sceneDeed(pc, v.title, vc.t, (pc.fame || 0) - f0, (pc.honor || 0) - h0); } catch (e) { console.error('npc-beliefs deed', e); }
    return res;
  };
  for (const k of Object.keys(choose)) A.eventChoose[k] = choose[k];

  // ---------------------------------------------------------------- the player's own telling

  A.INTERACT.nb_tell = { name: 'Talk of what is said', cost: 0 };
  if (A.INT_FN) A.INT_FN.nb_tell = function (pc, t) {
    if (!t || !t.alive || !A.isAdult(t) || !A.isAdult(pc)) return { ok: false, msg: 'Not now.' };
    A.queue({ type: 'event', ev: 'nb_tell', forced: true, ctx: { pid: t.id } });
    return { ok: true, msg: '' };
  };
  const opts = A.interactOptions;
  A.interactOptions = function (pc, t) {
    const o = opts.apply(this, arguments);
    try { if (A.INT_FN && A.INT_FN.nb_tell && t && t.alive && A.isAdult(pc) && A.isAdult(t) && !pc.prison && Array.isArray(o) && !o.includes('nb_tell')) o.push('nb_tell'); } catch (e) {}
    return o;
  };
  // the foe a story could be told about: someone the player is at odds with, whom the listener knows of (pure)
  NB.foeFor = function (pc, t) {
    const L = Object.keys(pc.rel || {}).filter(id => { const r = pc.rel[id]; return r && (r.type === 'enemy' || r.type === 'rival' || (r.op || 0) <= -30); }).sort().map(A.P)
      .filter(x => x && x.alive && x.id !== t.id && A.isAdult(x));
    return L.find(x => t.rel && t.rel[x.id]) || L[0] || null;
  };
  // a false belief the listener holds about someone else, which the player knows to be false (pure)
  NB.fixableOther = function (pc, t) {
    for (const x of NB.beliefs(t)) if (x.c.s !== pc.id && NB.isFalse(x.c, x.st) && NB.pcKnows(pc, x.c)) return x;
    return null;
  };
  // the player's latest deed, as the claim it became (pure)
  NB.lastDeed = function (pc) {
    const s = NB.peek(); if (!s) return null;
    let best = null;
    for (const id in s.c) { const e = s.c[id]; if (e[0] === 'D' && e[1] === pc.id && (!best || e[3] > best.y || (e[3] === best.y && +id > best.id))) best = NB.claim(id); }
    return best;
  };

  // ---------------------------------------------------------------- fx.nb: the effects of scenes

  // fx.nb = { fix: 0.4 } etc.; ctx.cid is the claim a scene is about, ctx.pid the person
  (A.FX_EXTRA = A.FX_EXTRA || []).push('nb');
  const FX = NB.FX = {};
  const holder = ctx => { const t = ctx && A.P(ctx.pid); return t && t.alive ? t : null; };
  // fix: the person in the scene stops believing it (and may carry the correction to their circle, chance f each)
  FX.fix = function (pc, f, ctx) {
    const t = holder(ctx), c = NB.claim(ctx.cid); if (!t || !c) return '';
    const st = NB.held(t, c.id) || 1;
    NB.adopt(t, c.id, -st, 'fix');
    if (c.k === 'T' && c.x != null) NB.adopt(t, +c.x, 1, 'fix');     // a tale corrected leaves the deed as it was
    for (const x of NB.contacts(t)) if (x.id !== pc.id && NB.held(x, c.id) === st && A.chance(+f || 0)) NB.adopt(x, c.id, -st, 'fix');
    if (c.s === pc.id && c.t && st > 0) { pc.honor = clamp((pc.honor || 0) - 2, 0, 100); return '(It was true, and you lied.)'; }
    // someone cleared of a wrong they believed may speak for you one day
    if (c.s === pc.id && !c.t && c.v < 0) { pc.flags.nb_cleared = A.S.year; if (A.chance(0.35)) NB.follow(pc, { pid: t.id, cid: c.id }, 'nb_cleared', 200, 900); }
    return '';
  };
  // as: the claim a choice is about is another one the scene set up (ctx[key]); runs before the keys after it
  FX.as = function (pc, key, ctx) { if (ctx && ctx[key] != null) ctx.cid = ctx[key]; return ''; };
  // warn: the person the story is about hears it from the player, and is grateful; own: the player owns a wrong belief
  FX.warn = function (pc, v, ctx) {
    const c = NB.claim(ctx.cid), o = c && A.P(c.s); if (!o || !o.alive || !pc.rel[o.id]) return '';
    A.addOp(pc, o, 6);
    return `(${o.given} will not forget that you came.)`;
  };
  FX.own = function (pc, v, ctx) {
    const c = NB.claim(ctx.cid), o = c && A.P(c.s); if (!o || !o.alive || !pc.rel[o.id]) return '';
    A.addOp(pc, o, 8);
    return '';
  };
  // fixAll: everyone around who believes it may hear the answer (chance f each)
  FX.fixAll = function (pc, f, ctx) {
    const c = NB.claim(ctx.cid); if (!c) return '';
    let n = 0;
    for (const h of NB.web(pc)) { const st = NB.held(h, c.id); if (st && NB.isFalse(c, st) && A.chance(+f || 0)) { NB.adopt(h, c.id, -st, 'fix'); n++; } }
    const t = holder(ctx); if (t && NB.held(t, c.id) > 0 && !c.t) NB.adopt(t, c.id, -1, 'fix');
    return n ? `(${n} ${n === 1 ? 'other stops' : 'others stop'} believing it.)` : '';
  };
  // spread: it goes round the person's circle (chance f each); spreadAll: round everyone near the player
  FX.spread = function (pc, f, ctx) {
    const t = holder(ctx), c = NB.claim(ctx.cid); if (!t || !c) return '';
    const st = NB.held(t, c.id) || 1;
    for (const x of NB.contacts(t)) if (x.id !== pc.id && A.chance(+f || 0)) NB.adopt(x, c.id, st, 'spread');
    return '';
  };
  FX.spreadAll = function (pc, f, ctx) {
    const c = NB.claim(ctx.cid); if (!c) return '';
    let n = 0;
    for (const h of NB.web(pc)) if (!NB.held(h, c.id) && NB.dist(h, pc) <= 1 && A.chance(+f || 0)) { NB.adopt(h, c.id, 1, 'spread'); n++; }
    return n ? `(${n} more ${n === 1 ? 'believes' : 'believe'} it now.)` : '';
  };
  // believe / doubt: the player takes what they were told (it may be false); learn: the player finds out the truth
  FX.believe = function (pc, v, ctx) {
    const c = NB.claim(ctx.cid); if (!c) return '';
    NB.pcHear(pc, c.id, 1, ctx.pid || null);
    NB.scheduleTruth(pc, c.id, ctx.pid || null);
    return '';
  };
  FX.doubt = function (pc, v, ctx) { const c = NB.claim(ctx.cid); if (c) NB.pcHear(pc, c.id, -1, ctx.pid || null); return ''; };
  FX.learn = function (pc, v, ctx) {
    const c = NB.claim(ctx.cid); if (!c) return '';
    const w = NB.pcLearn(pc, c.id, ctx.pid || null);
    return c.t ? '(It is true.)' : w ? '(It was false, and you had believed it.)' : '(It was false.)';
  };
  // lie: a story about a foe (ctx.oid, kind v), told to the person in the scene
  FX.lie = function (pc, kind, ctx) {
    const t = holder(ctx), o = A.P(ctx.oid); if (!t || !o || !o.alive) return '';
    kind = NB.SEC_KINDS.includes(kind) ? kind : 'crime';
    const real = NB.secTrue(o, kind, pc);
    const cid = NB.make('S', o.id, kind, real ? 1 : 0, NB.SEC_V[kind]);
    NB.adopt(t, cid, 1, 'lie');
    NB.pcState(pc)[cid] = [real ? 2 : -2, null, A.S.year];
    pc.flags.nb_lied = A.S.year;
    if (o.rel && o.rel[pc.id] && A.chance(0.5)) NB.follow(pc, { pid: o.id, cid, oid: t.id }, 'nb_lie_back', 300, 1100);
    return real ? '(It happens to be true.)' : '';
  };
  // boast: the player's latest deed grows in the telling; the listener and their circle believe the tale
  FX.boast = function (pc, v, ctx) {
    const t = holder(ctx);
    let D = null;
    const c = NB.claim(ctx.cid);
    if (c && c.k === 'T') D = NB.claim(c.x); else if (c && c.k === 'D') D = c; else D = NB.lastDeed(pc);
    if (!D) { const id = NB.make('D', pc.id, null, 1, 6, 'Stood your ground when others ran', A.S.year); D = NB.claim(id); }
    const T = NB.make('T', pc.id, null, 0, 10, D.id, D.y);
    if (t) { NB.adopt(t, T, 1, 'boast'); for (const x of NB.contacts(t)) if (x.id !== pc.id && A.chance(+v || 0.5)) NB.adopt(x, T, 1, 'boast'); }
    pc.flags.nb_embellished = A.S.year;
    return '';
  };
  // truth: the person in the scene comes to believe the true account (a battle as it was, a beast as it is)
  FX.truth = function (pc, v, ctx) {
    const t = holder(ctx), c = NB.claim(ctx.cid); if (!t || !c) return '';
    if (c.k === 'B') { const T = NB.battleClaim(c.o, 'T'); if (T) { if (NB.held(t, c.id)) NB.adopt(t, c.id, -1, 'truth'); NB.adopt(t, T, 1, 'truth'); } return ''; }
    if (NB.isFalse(c, NB.held(t, c.id))) NB.adopt(t, c.id, -NB.held(t, c.id), 'truth');
    return '';
  };
  // beast: the person in the scene learns the truth of ctx.beast from the player; learnBeast: the player from them
  FX.beast = function (pc, v, ctx) { const t = holder(ctx); if (t && ctx.beast) NB.adopt(t, NB.make('Z', null, ctx.beast, 1, 0), 1, 'beast'); return ''; };
  FX.learnBeast = function (pc, v, ctx) { if (A.BT && ctx.beast) A.BT.learn(pc, ctx.beast, 3, `From ${(holder(ctx) || {}).given || 'them'} you learn the truth of`); return ''; };
  // court: 'probe' (the player learns the truth, and the court with them), 'use' (the court spreads it to the
  // neighbours' courts), 'forbid' (the court drops it)
  FX.court = function (pc, how, ctx) {
    const c = NB.claim(ctx.cid), st = NB.st(), m = st.ct[pc.realm]; if (!c || !m) return '';
    if (how === 'probe') { NB.pcLearn(pc, c.id, null); if (!c.t) m[c.id] = -1; return c.t ? '(It is true.)' : '(It is false.)'; }
    if (how === 'use') { for (const rid of (A.neighbors ? A.neighbors(pc.realm) || [] : []).slice().sort()) if (A.realm(rid) && A.chance(0.5)) NB.courtAdopt(rid, c.id, 1); pc.flags.nb_court_used = A.S.year; return ''; }
    if (how === 'forbid') { delete m[c.id]; return ''; }
    return '';
  };
  const apply0 = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply0.apply(this, arguments);
    let out = '';
    try {
      const v = fx && typeof fx === 'object' ? fx.nb : null;
      if (v && typeof v === 'object' && pc && pc.id === A.S.pc) for (const k of Object.keys(v)) if (FX[k]) { const s = FX[k](pc, v[k], ctx || {}); if (typeof s === 'string' && s) out += (out ? ' ' : '') + s; }
    } catch (e) { console.error('npc-beliefs fx', e); }
    return out ? [r, out].filter(Boolean).join(' ') : r;
  };

  // ---------------------------------------------------------------- condition helpers (pure)

  const known = p => Object.keys(p.rel || {}).sort().map(A.P).filter(t => t && t.alive && t.id !== p.id && A.isAdult(t));
  // C.nbSlander(p): two or more people you know believe a false wrong of you
  A.C.nbSlander = p => { let n = 0; for (const t of known(p)) if (NB.falseAbout(p, t).some(x => x.st > 0 && x.c.v < 0)) n++; return n >= 2; };
  // C.nbTale(p): two or more believe a tale of you
  A.C.nbTale = p => { let n = 0; for (const t of known(p)) if (NB.taleOf(p, t)) n++; return n >= 2; };
  // C.nbBattle(p): someone you know believes a false account of a battle whose truth you know
  A.C.nbBattle = p => known(p).some(t => NB.beliefs(t).some(x => x.c.k === 'B' && NB.isFalse(x.c, x.st) && NB.pcKnows(p, x.c)));
  // C.nbHeard(p): you believe something about someone on another's word
  A.C.nbHeard = p => !!(p.nbk && Object.keys(p.nbk).some(id => Array.isArray(p.nbk[id]) && p.nbk[id][0] === 1 && NB.claim(id)));
  // C.nbCourt(p): your realm's court believes something of a living foreign ruler that you have not looked into
  A.C.nbCourt = p => !!NB.courtTopic(p);
  NB.courtTopic = function (p) {
    for (const x of NB.court(p.realm)) {
      if (x.st <= 0 || x.c.k !== 'S' && x.c.k !== 'K') continue;
      const s = A.P(x.c.s); if (!s || !s.alive || !s.ruler || s.ruler === p.realm || Math.abs(NB.pcHeld(p, x.c.id)) === 2) continue;
      return x;
    }
    return null;
  };
  // C.nbParent(p): people you know believe a deed of your father or mother, true or grown in the telling
  A.C.nbParent = p => !!NB.parentTale(p);
  NB.parentTale = function (p) {
    const par = (p.parents || []).filter(Boolean).map(String);
    if (!par.length) return null;
    for (const t of known(p)) for (const x of NB.beliefs(t)) if (x.st > 0 && (x.c.k === 'T' || x.c.k === 'D') && par.includes(String(x.c.s))) return { t, x };
    return null;
  };
})();
