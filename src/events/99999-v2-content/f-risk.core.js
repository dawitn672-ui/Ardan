// 99999-v2-content, part 6: a card tells the truth about risk (playtest 2, new 1 and 2; old 18 and 19's remainders).
//
// - What a choice can cost you for good is read by A.V2S.lossOf (99993-v2-stats, h-loss): death, the law's sentence for
//   the crime it names, the gallows, prison, exile, a scene it queues or schedules (read in turn), and a hurt that would
//   kill this person at their health now. The chip says it in words, worst first: "Join the plot ... If it fails: a
//   treason trial: the gallows or a deep cell" where it said "Nothing lost if it fails"; "If it fails: a wound, hurt that
//   could kill you, near death as you are" where it said "a wound, hurt". The words for health are the body sheet's
//   own bands (VS.band), so the card and the sheet say the same thing.
// - The red/white mark (9998-choice-stakes' ST.checkKind) is left as 9998 reads it: its own test holds the rule, and the plot
//   still reads "can be tried again" (reported to the owner; a failure there ends in a cell or on the gallows anyway).
// - Three scenes that showed "It will be remembered" on every choice, or nothing true, now show what they do:
//   47-realm-customs's custom scene (rb_custom: "The hearth mark") reads the custom's own effect and the defiance's;
//   97-first-life-fixes' ambition scenes (lfx_amb_*: "What you want") say the aim each choice sets and what meeting it brings;
//   the gathering's close (ga_close: "The last night") says what you carry home, from your role and your aim there.
// The reading is pure: the person, the realm's law, the gathering and the written choice; no draw, no write.
(function () {
  const ST = A.STAKES, VS = A.V2S, C2 = A.V2C = A.V2C || {};
  if (!ST || typeof ST.choiceChips !== 'function' || !VS || typeof VS.lossOf !== 'function') return;

  // ---- effects built from parts: the content's both(obj, fn) and op2(d) helpers ---------------------------------------
  // 227 choices are both({ honor: 2, ... }, op2(-30)): a closure whose source says only "applyFx(p, obj, ctx)", so the
  // card read nothing of them (they showed "It will be remembered"), and op2's regard (a second messmate's) had no way.
  // Patch V2C-FX-PARTS keeps the parts on the closure (f.v2parts, f.v2meta); the reading below reads them as written.
  C2.parts = function (f, parts, meta) {
    try { if (typeof f === 'function') { if (Array.isArray(parts)) f.v2parts = parts.filter(Boolean); if (meta) f.v2meta = meta; } } catch (e) {}
    return f;
  };
  const read0 = ST.read, partCache = new WeakMap();
  ST.read = function (fx) {
    if (typeof fx !== 'function' || !(fx.v2parts || fx.v2meta)) return read0.apply(this, arguments);
    if (partCache.has(fx)) return partCache.get(fx);
    const R = { up: [], down: [], touch: [], coin: 0, gainCoin: 0 };
    partCache.set(fx, R);   // a part that holds itself reads as nothing
    const put = (arr, p) => { if (!arr.some(x => x.w === p.w)) arr.push(p); };
    for (const part of fx.v2parts || []) {
      const r = ST.read(part);
      for (const k of ['up', 'down', 'touch']) for (const p of r[k]) put(R[k], p);
      R.coin += r.coin || 0; R.gainCoin += r.gainCoin || 0; if (r.fight) R.fight = true;
    }
    const m = fx.v2meta;
    if (m && typeof m.op === 'number' && m.op) put(m.op > 0 ? R.up : R.down, { k: 'them', w: m.who ? `{${m.who}}'s regard` : 'their regard', big: Math.abs(m.op) >= 20, o: 14 });
    if (m && typeof m.rel === 'number' && m.rel) put(m.rel > 0 ? R.up : R.down, { k: 'realmRel', w: 'relations', big: Math.abs(m.rel) >= 10, o: 30 });
    // a regard that both a part and the scene's person name is one regard: the touch goes when a way is known
    R.touch = R.touch.filter(t => !R.up.concat(R.down).some(p => p.w === t.w));
    for (const a of [R.up, R.down, R.touch]) a.sort((x, y) => x.o - y.o);
    return R;
  };
  // the same parts, for a loss (VS.lossOf reads a function's source; the parts are where the code is)
  const loss0 = VS.lossOf;
  VS.lossOf = function (fx, pc, ctx, depth, seen) {
    const L = loss0.apply(this, arguments);
    try {
      if (typeof fx === 'function' && Array.isArray(fx.v2parts) && (depth || 0) < 3) for (const part of fx.v2parts) {
        const P = VS.lossOf(part, pc, ctx, (depth || 0) + 1, seen);
        for (const k of ['die', 'dieRisk', 'gallows', 'prison', 'prisonRisk', 'exile', 'maim']) L[k] = L[k] || P[k];
        for (const x of P.law) if (!L.law.some(y => y.crime === x.crime)) L.law.push(x);
        L.hurt = Math.max(L.hurt, P.hurt); L.lethal = L.lethal || P.lethal;
        L.chain.push(...P.chain.filter(x => !L.chain.includes(x))); L.via.push(...P.via);
      }
    } catch (e) {}
    return L;
  };

  // ---- what a function effect touches: hp() is spirits, hurt(p, n) is health, p.honor = cl(p.honor - 3) is honour ----
  // (9998's reading took every hp( for health; in the content it is always the spirits helper, (p, v) => p.happy += v)
  const ASSIGN = { health: 'health', honor: 'honor', fame: 'fame', piety: 'piety', happy: 'happy', coin: 'coin' };
  const famCache = new WeakMap();
  const fam0 = ST.fnFamilies;
  ST.fnFamilies = function (fx) {
    const r0 = fam0.apply(this, arguments);
    if (typeof fx !== 'function') return r0;
    if (famCache.has(fx)) return famCache.get(fx);
    let out = r0.slice();
    try {
      const s = String(fx);
      const health = /\bhealth\s*:|\.health\s*[-+]?=|\bhurt\(\s*\w+\s*,\s*[\d.]/.test(s);
      if (!health) out = out.filter(k => k !== 'health');
      if (/\bhp\(\s*p\s*,/.test(s) && !out.includes('happy')) out.push('happy');
      if (health && !out.includes('health')) out.push('health');
      for (const m of s.matchAll(/\.(health|honor|fame|piety|happy|coin)\s*=\s*[\w.]*\(?\s*\w+\.\1\s*[-+]/g)) { const k = ASSIGN[m[1]]; if (!out.includes(k)) out.push(k); }
      if (/\bA\.fame\(\s*p\s*,/.test(s) && !out.includes('fame')) out.push('fame');
      if (/\bhon\(\s*p\s*,/.test(s) && !out.includes('honor')) out.push('honor');
      if (/\bpie\(\s*p\s*,/.test(s) && !out.includes('piety')) out.push('piety');
    } catch (e) { out = r0; }
    famCache.set(fx, out);
    return out;
  };

  // ---- a failure's losses read as losses: "If it fails: honour" said nothing about which way -------------------------
  // (97's words stay for hurt, coin and the lasting losses; a family word alone gets its ▼, and a function effect's
  // "risk of a wound" says what it is: a wound, perhaps)
  const words0 = ST.words;
  ST.words = function (R, side) {
    const out = words0.apply(this, arguments);
    try {
      if (side !== 'fail' || !R || !Array.isArray(R.down)) return out.map(x => (x === '• risk of a wound' ? 'perhaps a wound' : x));
      const bare = new Set(R.down.filter(p => !['die', 'prison', 'wound', 'punish', 'health', 'coinPct'].includes(p.k)).map(p => (p.k === 'happy' ? 'your spirits' : p.w)));
      return out.map(x => (x === '• risk of a wound' ? 'perhaps a wound' : bare.has(x) ? '▼ ' + (x === 'your spirits' ? 'spirits' : x) : x));
    } catch (e) { return out; }
  };

  // ---- the stake in words, merged into a choice's chips --------------------------------------------------------------
  // generic words the stake replaces ("punishment" says less than "a treason trial: the gallows or a deep cell")
  const GENERIC = /^(?:▼+ )?(?:punishment|prison|death|• risk of prison|• risk of death|risk of prison|risk of death)$/;
  C2.lossWords = (fx, pc, ctx) => VS.lossWords(VS.lossOf(fx, pc, ctx), pc);
  C2.riskChips = function (chips, c, e, q, pc) {
    const ctx = (q && q.ctx) || {};
    if (c.check || c.group) {
      const L = VS.lossOf(c.lose && c.lose.fx, pc, ctx), W = VS.lossWords(L, pc);
      if (!W.length) return chips;
      const i = chips.findIndex(x => x.k === 'risk' || x.k === 'safe');
      let rest = [];
      if (i >= 0 && chips[i].k === 'risk') rest = String(chips[i].t).replace(/^If it fails: /, '').split(', ').filter(x => !GENERIC.test(x) && !(L.lethal && x === 'hurt'));
      if (i >= 0 && chips[i].k === 'risk' && /^Starts a fight$/.test(chips[i].t)) return chips;
      const ch = { k: 'risk', t: 'If it fails: ' + W.concat(rest).slice(0, 4).join(', '), fail: true, stake: true };
      if (i >= 0) chips.splice(i, 1, ch); else chips.push(ch);
      return chips;
    }
    // a sure effect keeps its own chips ("▼ death", "▼ punishment", "▼ health": 9998's one chip per family); the stake
    // is said beside them, without saying again what a chip already says
    const L = VS.lossOf(c.fx, pc, ctx);
    const said = new Set(chips.filter(x => typeof x.t === 'string').map(x => x.t.replace(/^[▲▼•]+\s*/, '')));
    const W = VS.lossWords(L, pc).filter(w => !said.has(w));
    if (!W.length) return chips;
    const t = W.slice(0, 2).join(', ');
    chips.unshift({ k: 'cost', t: t.charAt(0).toUpperCase() + t.slice(1), stake: true });
    return chips;
  };

  // ---- the scenes that showed nothing true -----------------------------------------------------------------------------
  // 47's custom scene: the custom's effect (keep) and the defiance's (defy), in the chips' own grammar
  const chipsOf = (fx, label) => { try { return ST.choiceChips({ fx, t: label || '' }, null, null, null, { t: label || '' }).filter(x => x.k !== 'note'); } catch (e) { return []; } };
  C2.customChips = function (c, e, q, pc) {
    const B = A.BIBLE, cid = q && q.ctx && q.ctx.cid, cu = B && cid ? B.custom(cid) : null;
    if (!cu || !e || e.id !== 'rb_custom') return [];
    const i = e.choices.indexOf(c);
    const fx = i === 0 ? cu.fx : i === 1 && cu.defy ? cu.defy.fx : null;
    const out = fx ? chipsOf(fx) : [];
    if (!out.length) out.push({ k: 'note', t: 'Nothing changes' });
    return out;
  };
  // 97's ambition scenes: the aim each choice sets, and what meeting it brings (a deed, spirits and renown: c-ambition)
  C2.ambChips = function (c, e, q, pc) {
    if (!e || !/^lfx_amb_/.test(e.id) || !A.LF || !A.LF.AMB) return [];
    const i = e.choices.indexOf(c), offer = q && q.ctx && Array.isArray(q.ctx.amb) ? q.ctx.amb : [];
    const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
    if (i >= 0 && i < 3) {
      const D = offer[i] && A.LF.AMB[offer[i]];
      if (!D) return [];
      const cur = pc && pc.amb && pc.amb.k === offer[i] && !pc.amb.done;
      return [{ k: 'note', t: (cur ? 'Keeps your aim: ' : 'Your aim: ') + lc(D.name) }, { k: 'gain', t: 'When it is done: ▲ spirits, ▲ renown' }];
    }
    const cur = pc && pc.amb && A.LF.AMB[pc.amb.k] && !pc.amb.done ? A.LF.AMB[pc.amb.k] : null;
    return [{ k: 'note', t: cur ? 'Gives up your aim: ' + lc(cur.name) : 'No aim: you take what comes' }];
  };
  // the gathering's close: A.gathClose's own rules, read for your role and your aim there
  C2.closeChips = function (c, e, q, pc) {
    if (!e || e.id !== 'ga_close' || !A.gathById) return [];
    const g = q && q.ctx && A.gathById(q.ctx.gid);
    if (!g || !g.pc) return [];
    const out = [], aim = g.pc.aim, role = g.pc.role, T = A.TREATY || {}, sh = id => (A.realmShort ? A.realmShort(id) : id);
    if (aim && ['ally', 'def', 'trade', 'nap'].includes(aim.k) && aim.t) out.push({ k: 'note', t: `${(T[aim.k] && T[aim.k].name) || 'The treaty'} with ${sh(aim.t)}: decided tonight` });
    else if (aim && aim.k === 'isolate' && aim.t) out.push({ k: 'note', t: `Who turns against ${sh(aim.t)}: decided tonight` });
    else if (aim && aim.k === 'guarantees') out.push({ k: 'note', t: 'Pacts with your neighbours, if they sign' });
    else if (aim && aim.k === 'prestige') out.push({ k: 'gain', t: '▲ your crown\'s legitimacy' });
    const ups = [];
    if (role !== 'knight') ups.push('renown');
    if (role === 'envoy') ups.push('Diplomacy', 'standing at work');
    if (role === 'noble' || role === 'ruler') ups.push('Etiquette');
    if (role === 'guard' && pc && pc.mil) ups.push('standing in the ranks');
    if (role === 'servant' && pc && pc.job) ups.push('standing at work');
    if (ups.length) out.push({ k: 'gain', t: ups.map(w => '▲ ' + w).join(', ') });
    if (!out.length) out.push({ k: 'note', t: 'The gathering ends; you go home' });
    return out;
  };
  ST.add('choice', (c, e, q, pc) => {
    if (!e) return [];
    if (e.id === 'rb_custom') return C2.customChips(c, e, q, pc);
    if (/^lfx_amb_/.test(e.id)) return C2.ambChips(c, e, q, pc);
    if (e.id === 'ga_close') return C2.closeChips(c, e, q, pc);
    return [];
  });

  const chips1 = ST.choiceChips;
  ST.choiceChips = function (c, e, q, pc, vc) {
    const chips = chips1.apply(this, arguments);
    try {
      if (!c || typeof c !== 'object' || !e) return chips;
      const me = pc || (A.pc && A.pc());
      C2.riskChips(chips, c, e, q, me);
      for (const x of chips) if (x.k === 'touch' && x.t === '• risk of a wound') { x.k = 'cost'; x.t = '▼ a wound, perhaps'; }
      // a second or third messmate's regard (op2, op3): their name, from the scene's context
      for (const x of chips) if (typeof x.t === 'string' && /\{m[23]\}'s regard/.test(x.t)) x.t = x.t.replace(/\{(m[23])\}'s regard/g, (all, k) => { const t = q && q.ctx && q.ctx[k] ? A.P(q.ctx[k]) : null; return t ? `${A.knownName ? A.knownName(t) : t.given}'s regard` : 'a messmate\'s regard'; });
      // a scene's own chips said something true: the fallback "It will be remembered" goes
      if (chips.some(x => x.k !== 'note' || !/^It will be remembered$/.test(x.t)) && chips.some(x => /^It will be remembered$/.test(x.t))) {
        const k = chips.filter(x => !/^It will be remembered$/.test(x.t)); chips.length = 0; chips.push(...k);
      }
    } catch (err) { console.error('v2 risk chips', err); }
    return chips;
  };

})();
