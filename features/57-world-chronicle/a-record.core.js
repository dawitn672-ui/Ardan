// The world record (Road to Ten, World 5 and Replayability 5). The release keeps two kinds of history (`S.history`: war
// ends and realm falls) and 220 lines of news, so at year 60 the world remembers only its last five to eight years.
// This keeps a dated record of the whole run in `S.wrec`, and drops nothing:
//   war begun, war ended (with the victor), battle, siege laid, city taken (stormed, sacked or burned), province
//   changing hands, ruler's death and succession, throne taken without a death, realm fallen, realm founded,
//   rebellion, famine (a failed harvest), epidemic, royal marriage, alliance, tribute, elite order destroyed,
//   death of a Legend.
// Each entry carries its year and day, a place (a province) and people (ids, with their names kept in a table, since
// the dead are pruned from `S.people` after 30 years). Entries are compact arrays:
//   [kind, year, day, province, realmA, realmB, [person ids], number, extra]
// The record observes; it changes nothing in the world, draws no random numbers, and every hook calls the original
// first. The one exception is the epidemic, which the release does not simulate: a monthly roll per realm (more after a
// failed harvest or under siege) that costs a little stability and brings a scene to a player whose town it reaches.
(function () {
  const WC = A.WC = A.WC || {};
  WC.V = 1;
  // kind -> label, greatness (0..3, for the export and for citations)
  WC.KINDS = {
    war: ['war begun', 3], peace: ['war ended', 3], battle: ['battle', 2], siege: ['siege laid', 1], fall: ['city taken', 2],
    cede: ['province changes hands', 1], ruler: ["ruler's death and succession", 2], crown: ['throne taken', 2],
    fallen: ['realm fallen', 3], founded: ['realm founded', 3], revolt: ['rebellion', 2], famine: ['famine', 2],
    plague: ['epidemic', 2], wedding: ['royal marriage', 1], alliance: ['alliance', 1], trib: ['tribute', 1],
    order: ['elite order destroyed', 1], legend: ['death of a Legend', 2],
  };
  // a field battle is set down when 24,000 men meet, or 9,000 fight on for five days or more: about the largest
  // seventh of the front's fights, some 13 a year across Ardan (the front fights about 90 a year)
  WC.BATTLE_MEN = 24000; WC.BATTLE_LONG = [5, 9000];

  const S_ = () => A.S;
  const today = () => { try { return A.today ? A.today() : 0; } catch (e) { return 0; } };
  WC.rec = function () {
    const S = S_(); if (!S) return null;
    if (!S.wrec || typeof S.wrec !== 'object') S.wrec = { v: WC.V, e: [], nm: {}, os: {}, ru: {}, ov: {}, al: {} };
    const R = S.wrec;
    if (!Array.isArray(R.e)) R.e = [];
    for (const k of ['nm', 'os', 'ru', 'ov', 'al']) if (!R[k] || typeof R[k] !== 'object') R[k] = {};
    return R;
  };
  // the record exists once the world is made; nothing is set down while the release builds its starting realms
  // WC.OFF stops all recording (the tests use it to show the record changes nothing in the world)
  const live = () => !WC.OFF && !!(S_() && S_().wrec);

  // ---- names, kept as they were when the entry was made
  const nameP = p => { try { return p.ruler && A.realm(p.ruler) ? A.rulerStyle(p, A.realm(p.ruler)) : A.fullName(p, false); } catch (e) { return p.given || '?'; } };
  WC.keepName = function (id, name) {
    const R = WC.rec(); if (!R || !id || R.nm[id]) return;
    const n = name != null ? name : (A.P(id) ? nameP(A.P(id)) : null);
    if (n) R.nm[id] = String(n).replace(/[<>"]/g, '').slice(0, 80);
  };
  WC.name = function (id) {
    const R = S_() && S_().wrec; if (!id) return '';
    if (R && R.nm && R.nm[id]) return R.nm[id];
    const p = A.P(id); if (p) return nameP(p);
    const r = A.realm(id); if (r) return r.short;
    return '';
  };

  // ---- set an entry down
  WC.put = function (k, o) {
    if (!live()) return -1;
    const R = WC.rec(), S = S_();
    const who = (o.w || []).filter(Boolean).slice(0, 3);
    for (const id of who) WC.keepName(id);
    for (const rid of [o.a, o.b]) if (rid && A.realm(rid)) WC.keepName(rid, A.realm(rid).short);
    const e = [k, o.y != null ? o.y : S.year, o.d != null ? o.d : today(), o.p != null && o.p >= 0 ? o.p : null, o.a || null, o.b || null, who, o.n != null ? Math.round(o.n) : null, o.x != null ? o.x : null];
    while (e.length > 2 && e[e.length - 1] == null) e.pop();
    R.e.push(e);
    return R.e.length - 1;
  };
  // an entry as an object (pure)
  WC.ent = function (i) {
    const R = S_() && S_().wrec, e = R && R.e[i]; if (!e) return null;
    return { i, k: e[0], y: e[1], d: e[2] || 0, p: e[3] != null ? e[3] : null, a: e[4] || null, b: e[5] || null, w: e[6] || [], n: e[7] != null ? e[7] : null, x: e[8] != null ? e[8] : null };
  };
  WC.count = () => { const R = S_() && S_().wrec; return R ? R.e.length : 0; };
  WC.all = function () { const R = S_() && S_().wrec; return R ? R.e.map((_, i) => WC.ent(i)) : []; };

  const ruler = rid => { const r = A.realm(rid); return r && r.ruler ? r.ruler : null; };
  const cap = rid => { const r = A.realm(rid); return r && r.capitalProv != null ? r.capitalProv : null; };
  const walled = P => P && ((P.fort || 0) > 0 || (P.pop || 0) > 120000);
  const isCap = P => { const r = P && A.realm(P.owner); return !!(r && r.capitalProv === P.id); };

  // ---- wars
  A.on('warStart', (w, opts) => {
    try {
      if (!w || !live()) return;
      WC.keepName(w.id, w.name);
      WC.put('war', { y: w.start || S_().year, p: cap(w.leadD), a: w.leadA, b: w.leadD, w: [ruler(w.leadA), ruler(w.leadD)], n: w.att.length + w.def.length, x: [w.id, w.cb || ''] });
    } catch (e) { console.error('world record war', e); }
  });
  A.on('warEnd', (w, result, text, wasLive) => {
    try {
      if (!w || !wasLive || !live()) return;
      WC.keepName(w.id, w.name);
      const win = result === 'att' ? w.leadA : result === 'def' ? w.leadD : null, lose = result === 'att' ? w.leadD : result === 'def' ? w.leadA : null;
      const ceded = (w.wcCede || []).slice(0, 6);
      WC.put('peace', { p: cap(w.leadD), a: win || w.leadA, b: lose || w.leadD, w: [ruler(win || w.leadA), ruler(lose || w.leadD)], n: Math.max(0, S_().year - (w.start || S_().year)), x: [w.id, result || 'white', ceded] });
      // a rising that wins its war is a realm born
      if (w.cb === 'liberty' && result === 'att') {
        const nr = A.realm(w.leadA);
        if (nr && nr.alive) WC.put('founded', { p: cap(nr.id), a: nr.id, b: w.leadD, w: [ruler(nr.id)], x: 'won' });
      }
    } catch (e) { console.error('world record peace', e); }
  });
  A.on('provTransfer', (prov, from, to) => {
    try {
      if (!prov || !live() || from === to) return;
      const w = (S_().wars || []).find(x => (x.att.includes(to) && x.def.includes(from)) || (x.def.includes(to) && x.att.includes(from)));
      if (w) (w.wcCede = w.wcCede || []).push(prov.id);
      WC.put('cede', { p: prov.id, a: to, b: from, w: [ruler(to)], x: w ? w.id : (from === 'unclaimed' ? 'settled' : '') });
    } catch (e) { console.error('world record cede', e); }
  });

  // ---- battles: the front's fights, at the size a war keeps in its own list
  const fightEnd = A.fightEnd;
  if (typeof fightEnd === 'function') A.fightEnd = function (pid, winner) {
    const S = S_(), F = S && S.fights && S.fights[pid];
    const r = fightEnd.apply(this, arguments);
    try {
      if (F && live()) {
        const men = (F.menA || 0) + (F.menD || 0);
        if (men >= WC.BATTLE_MEN || (F.days || 0) >= WC.BATTLE_LONG[0] && men >= WC.BATTLE_LONG[1]) {
          const atkW = winner === 'att', W = atkW ? F.a : F.b, L = atkW ? F.b : F.a;
          const cmd = ids => { let best = null; for (const id of ids || []) { const d = A.divById(id); if (d && d.cmd && (!best || d.men > best.men)) best = d; } return best ? best.cmd : null; };
          const cw = cmd(atkW ? F.aIds : F.dIds) || ruler(W), cl = cmd(atkW ? F.dIds : F.aIds) || ruler(L);
          const pc = A.pc(), mine = pc && pc.mil && pc.mil.div && (F.aIds || []).concat(F.dIds || []).includes(pc.mil.div);
          WC.put('battle', { p: pid, a: W, b: L, w: [cw, cl, mine ? pc.id : null], n: men, x: [Math.round((F.deadA || 0) + (F.deadD || 0)), F.days || 1, F.war || ''] });
        }
      }
    } catch (e) { console.error('world record battle', e); }
    return r;
  };

  // ---- sieges and the fall of walled towns
  const fallKind = (P, rid, prev) => {
    // stormed (the release's AI sieges always end by storm), sacked if a capital or a great town (150,000 people),
    // burned as well if the takers hate the town's people: another race, or another faith in a holy war
    const ra = A.realm(rid), rb = A.realm(prev);
    if (P.sgTerms) return 0;
    const big = (P.pop || 0) > 150000 || isCap(P);
    const holy = (S_().wars || []).some(w => w.cb === 'holy' && (w.att.includes(rid) && w.def.includes(prev) || w.def.includes(rid) && w.att.includes(prev)));
    if (big && ra && rb && (ra.race !== rb.race || holy && ra.faith !== rb.faith)) return 3;
    return big ? 2 : 1;
  };
  const occupy = A.occupy;
  A.occupy = function (P, rid) {
    let before = null;
    try { if (P && live() && !A.friendly(P.owner, rid) && walled(P)) before = { prev: A.ctrl(P), days: Math.round(P.sgd || 0), how: fallKind(P, rid, A.ctrl(P)) }; } catch (e) {}
    const r = occupy.apply(this, arguments);
    try {
      if (before && P.occ === rid) {
        const R = WC.rec(), os = R.os[P.id];
        let cmd = null; for (const d of A.divsAt ? A.divsAt(P.id) : []) if (d.r === rid && d.cmd) { cmd = d.cmd; break; }
        const pc = A.pc(), mine = pc && pc.mil && pc.mil.div && (A.divsAt ? A.divsAt(P.id) : []).some(d => d.id === pc.mil.div);
        const home = pc && pc.home === P.id ? pc.id : null;
        WC.put('fall', { p: P.id, a: rid, b: before.prev, w: [cmd || ruler(rid), ruler(before.prev), mine ? pc.id : home], n: before.days || (os ? Math.round((A.absDay() - os[1]) ) : 0), x: before.how });
        if (os) { const e = R.e[os[0]]; if (e) { e[7] = before.days || e[7] || 0; e[8] = 'fell'; } delete R.os[P.id]; }
        if (before.how === 3) P.burnt = S_().year;
      }
    } catch (e) { console.error('world record fall', e); }
    return r;
  };
  // a siege laid to a walled town is set down when the ring closes; its end (fell or lifted) is written on the entry
  function sieges() {
    const R = WC.rec(), S = S_();
    for (const P of S.prov) {
      const os = R.os[P.id];
      if (P.sgBy && walled(P) && !A.friendly(P.owner, P.sgBy)) {
        if (os && os[2] === P.sgBy) continue;
        if (os) { const e = R.e[os[0]]; if (e && e[8] == null) { e[7] = Math.round(A.absDay() - os[1]); e[8] = 'lifted'; } }
        let cmd = null; for (const d of A.divsAt ? A.divsAt(P.id) : []) if (d.r === P.sgBy && d.cmd) { cmd = d.cmd; break; }
        const holder = A.ctrl(P), pc = A.pc(), here = pc && (pc.home === P.id || (pc.mil && pc.mil.div && (A.divsAt ? A.divsAt(P.id) : []).some(d => d.id === pc.mil.div))) ? pc.id : null;
        const i = WC.put('siege', { p: P.id, a: P.sgBy, b: holder, w: [cmd || ruler(P.sgBy), ruler(holder), here] });
        R.os[P.id] = [i, A.absDay(), P.sgBy];
      } else if (os) {
        const e = R.e[os[0]]; if (e && e[8] == null) { while (e.length < 9) e.push(null); e[7] = Math.round(A.absDay() - os[1]); e[8] = 'lifted'; }
        delete R.os[P.id];
      }
    }
  }

  // ---- thrones
  const rulerDies = A.rulerDies;
  A.rulerDies = function (r, cause) {
    const old = r && A.P(r.ruler), age = old ? A.age(old) : null;
    if (old) WC.keepName(old.id);
    const next = rulerDies.apply(this, arguments);
    try {
      if (r && live()) {
        WC.put('ruler', { p: cap(r.id), a: r.id, w: [old && old.id, next && next.id], n: age, x: String(cause || 'old age').slice(0, 60) });
        WC.rec().ru[r.id] = next ? next.id : r.ruler;
      }
    } catch (e) { console.error('world record ruler', e); }
    return next;
  };
  // thrones that change hands without a death (abdication, a claimant crowned, a player's coronation): read yearly
  function thrones() {
    const R = WC.rec(), S = S_();
    for (const id in S.realms) {
      const r = S.realms[id]; if (!r.alive) continue;
      const was = R.ru[id];
      if (was === undefined) { R.ru[id] = r.ruler || null; continue; }
      if (r.ruler && was !== r.ruler) {
        const old = was && A.P(was);
        if (old) WC.keepName(old.id);
        if (!(old && !old.alive && old.died >= S.year - 1)) WC.put('crown', { p: cap(id), a: id, w: [r.ruler, was] });
        R.ru[id] = r.ruler;
      }
    }
  }

  // ---- realms fall and are born
  const realmFalls = A.realmFalls;
  A.realmFalls = function (r, conqueror) {
    const was = r && r.alive, last = r && r.ruler, p = r && r.capitalProv;
    if (last) WC.keepName(last);
    const out = realmFalls.apply(this, arguments);
    try { if (was && live() && !r.isRebel) WC.put('fallen', { p, a: r.id, b: conqueror || null, w: [last, ruler(conqueror)], n: Math.max(0, S_().year - (r.created || S_().year)) }); } catch (e) { console.error('world record fallen', e); }
    return out;
  };
  const createRealm = A.createRealm;
  A.createRealm = function (o) {
    const r = createRealm.apply(this, arguments);
    try { if (r && live()) { const R = WC.rec(); (R.nw = R.nw || []).push([r.id, S_().year, today()]); } } catch (e) {}
    return r;
  };
  // a new realm is set down once its makers have given it a seat and a lord (they do so after it is created)
  function newRealms() {
    const R = WC.rec(); if (!R.nw || !R.nw.length) return;
    const pc = A.pc();
    for (const [id, y, d] of R.nw) {
      const r = A.realm(id); if (!r) continue;
      WC.keepName(id, r.short);
      if (r.title === 'Claimant') WC.put('revolt', { y, d, p: r.capitalProv, a: r.parent, b: id, w: [r.ruler, ruler(r.parent)], x: 'claim' });
      else if (r.isRebel) WC.put('revolt', { y, d, p: r.capitalProv, a: r.parent, b: id, w: [r.ruler, ruler(r.parent)], x: 'league' });
      else WC.put('founded', { y, d, p: r.capitalProv, a: id, b: r.parent || null, w: [r.ruler], x: r.parent ? 'granted' : pc && pc.ruler === id ? 'carved' : 'new' });
    }
    R.nw = [];
  }

  // ---- marriages, alliances, tribute
  const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const allied = (k, a, b, at) => {
    const R = WC.rec(), key = k + ':' + pairKey(a, b) + ':' + S_().year;
    if (R.al[key]) return;
    R.al[key] = 1;
    WC.put(k, { p: at != null ? at : cap(a), a, b, w: [ruler(a), ruler(b)] });
  };
  const sign = A.sign;
  if (typeof sign === 'function') A.sign = function (k, a, b, opts) {
    const was = k === 'ally' && A.realm(a) && (A.realm(a).allies || []).includes(b);
    const ok = sign.apply(this, arguments);
    try {
      if (ok && live()) {
        const at = opts && opts.at ? (A.S.prov.find(P => P.name === opts.at) || {}).id : null;
        if (k === 'ally' && !was) allied('alliance', a, b, at);
        else if (k === 'marriage') allied('wedding', a, b, at);
      }
    } catch (e) { console.error('world record treaty', e); }
    return ok;
  };
  const ally = A.ally;
  A.ally = function (a, b) {
    const ra = A.realm(a), was = ra && (ra.allies || []).includes(b);
    const r = ally.apply(this, arguments);
    try { if (live() && ra && !was && (ra.allies || []).includes(b)) allied('alliance', a, b); } catch (e) {}
    return r;
  };
  function ties() {
    const R = WC.rec(), S = S_();
    for (const id in S.realms) {
      const r = S.realms[id];
      // royal marriages made by any path leave their year on both realms
      for (const t in r.marriages || {}) if (r.marriages[t] === S.year && id < t && A.realm(t)) allied('wedding', id, t);
      if (!r.alive) continue;
      const was = R.ov[id] === undefined ? (R.ov[id] = r.overlord || null, r.overlord || null) : R.ov[id];
      const now = r.overlord || null;
      if (was !== now) {
        if (now) WC.put('trib', { p: cap(id), a: id, b: now, w: [ruler(id), ruler(now)], x: 'bound' });
        else if (was && A.realm(was)) WC.put('trib', { p: cap(id), a: id, b: was, w: [ruler(id), ruler(was)], x: 'free' });
        R.ov[id] = now;
      }
    }
  }

  // ---- harvests: a failed one is a famine (45-economy rolls each realm's harvest in June)
  function harvests() {
    const S = S_(); if (!A.mkt || A.monthOf(today()).m !== 5) return;
    const R = WC.rec(), key = 'hv' + S.year;
    if (R.al[key]) return;
    R.al[key] = 1;
    for (const id in S.realms) {
      const r = S.realms[id]; if (!r.alive || r.isRebel) continue;
      let m = null; try { m = A.mkt(id); } catch (e) {}
      if (m && m.hv && m.hv.y === S.year && m.hv.f <= 0.4) WC.put('famine', { p: cap(id), a: id, w: [ruler(id)], n: Math.round(m.hv.f * 100) });
    }
  }

  // ---- the death of a Legend (the top of the ladder, 32-ladder)
  const isLegend = p => { try { return !!(p && p.st && A.fightWorth && A.tierOf && A.tierOf(A.fightWorth(p)).k === 't6'); } catch (e) { return false; } };
  const kill = A.kill;
  A.kill = function (p, cause) {
    const was = p && p.alive && live() && p.id !== S_().pc && isLegend(p);
    const r = kill.apply(this, arguments);
    try {
      if (was && !p.alive) {
        WC.keepName(p.id, A.fullName(p, false));
        WC.put('legend', { p: p.home != null ? p.home : cap(p.realm), a: p.realm, w: [p.id], n: A.age(p), x: String(cause || p.cause || 'a wound').slice(0, 60) });
      }
    } catch (e) { console.error('world record legend', e); }
    return r;
  };

  // ---- an elite order destroyed in the field
  const divRemove = A.divRemove;
  if (typeof divRemove === 'function') A.divRemove = function (d) {
    const was = d && d.elite && !d._swap && live() ? { r: d.r, loc: d.loc, cmd: d.cmd, name: d.name, id: d.elite } : null;
    const r = divRemove.apply(this, arguments);
    try { if (was) { WC.keepName('ord:' + was.id + ':' + was.r, was.name); WC.put('order', { p: was.loc, a: was.r, w: [was.cmd], x: 'ord:' + was.id + ':' + was.r }); } } catch (e) {}
    return r;
  };

  // ---- the epidemic: the release simulates no sickness in the world, so the record would have no plague to set down
  WC.EPIDEMIC = true;
  WC.SICK = ['the sweating sickness', 'the spotted fever', 'the red flux', 'the grey cough', 'the burning ague', 'the camp fever', 'the swelling sickness'];
  WC.sickName = (pid, y) => { let h = 2166136261; for (const ch of pid + '|' + y) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return WC.SICK[(h >>> 0) % WC.SICK.length]; };
  WC.plagueChance = function (r) {
    const S = S_(); let c = 0.035;
    try { const m = A.mkt && A.mkt(r.id); if (m && m.hv && m.hv.f <= 0.4 && m.hv.y >= S.year - 1) c += 0.05; } catch (e) {}
    if (S.prov.some(P => P.owner === r.id && P.sgBy)) c += 0.02;
    if ((r.provPop || r.pop || 0) > 3e6) c += 0.01;
    return Math.min(0.1, c);
  };
  function epidemics() {
    if (!WC.EPIDEMIC) return;
    const S = S_();
    for (const id of Object.keys(S.realms).sort()) {
      const r = S.realms[id]; if (!r.alive || r.isRebel) continue;
      if (!A.chance(WC.plagueChance(r) / 12)) continue;
      const mine = S.prov.filter(P => P.owner === id);
      if (!mine.length) continue;
      const P = A.wpick(mine, x => Math.sqrt(Math.max(1, x.pop || 1)) * (x.coast ? 1.4 : 1) * (x.id === r.capitalProv ? 1.5 : 1));
      const spread = (P.adj || []).filter(j => S.prov[j] && S.prov[j].owner !== 'unclaimed').slice(0, 3).filter((_, i) => i < 1 || A.chance(0.4));
      const hit = [P.id, ...spread];
      for (const j of hit) { const Q = S.prov[j]; Q.unrest = Math.min(100, (Q.unrest || 0) + 8); Q.plague = S.year; }
      r.stability = Math.max(0, r.stability - 4);
      const sick = WC.sickName(String(P.id), S.year);
      WC.keepName('sick:' + P.id + ':' + S.year, sick);
      WC.put('plague', { p: P.id, a: id, w: [ruler(id)], n: hit.length, x: spread });
      if (A.news) A.news(`${A.cap ? A.cap(sick) : sick} breaks out in ${P.name}${spread.length ? ' and spreads to ' + spread.map(j => S.prov[j].name).join(', ') : ''}.`, 'realm');
      const pc = A.pc();
      if (pc && pc.alive && hit.includes(pc.home) && A.EV.wc_sickness_comes) A.queue({ type: 'event', ev: 'wc_sickness_comes', ctx: { wci: WC.count() - 1 } });
    }
  }

  // ---- the hooks
  A.on('worldInit', () => {
    try {
      const S = S_(); S.wrec = null; WC.rec();
      // wars already being fought when the record opens (the Tessarian Civil War began in 1061)
      for (const w of S.wars || []) { WC.keepName(w.id, w.name); WC.put('war', { y: w.start, d: 0, p: cap(w.leadD), a: w.leadA, b: w.leadD, w: [ruler(w.leadA), ruler(w.leadD)], n: w.att.length + w.def.length, x: [w.id, w.cb || ''] }); }
      for (const id in S.realms) { WC.rec().ru[id] = S.realms[id].ruler || null; WC.rec().ov[id] = S.realms[id].overlord || null; }
    } catch (e) { console.error('world record init', e); }
  });
  A.on('worldYear', () => { try { if (WC.OFF) return; const R = WC.rec(); if (!R) return; newRealms(); thrones(); ties(); R.al = {}; } catch (e) { console.error('world record year', e); } });
  A.onMonth.push(() => {
    try {
      const S = S_(); if (WC.OFF || !S || !S.prov || !S.prov.length || !WC.rec()) return;
      newRealms(); sieges(); harvests(); ties(); epidemics();
    } catch (e) { console.error('world record month', e); }
  });

  // ---- reading the record (pure)
  // the realms a person lives among: their own, their home's master, the realm they serve, and the neighbours of these
  WC.nearRealms = function (p) {
    if (!p) return new Set();
    const key = `${p.id}|${p.realm}|${p.home}|${p.mil && p.mil.realm}|${A.absDay()}`;
    if (WC._nr && WC._nr.key === key && WC._nr.S === A.S) return WC._nr.set;
    const set = new Set();
    WC._nr = { key, set, S: A.S };
    const P = A.prov(p.home), own = [p.realm, P && P.owner, P && P.occ, p.mil && p.mil.realm].filter(x => x && x !== 'unclaimed');
    for (const id of own) set.add(id);
    for (const id of own.slice(0, 2)) for (const n of (A.neighbors ? A.neighbors(id) : [])) set.add(n);
    // a home on unclaimed land (an outlaw gone to the Free Marches): the realms whose provinces border it
    if (!own.length && P) for (const j of P.adj || []) { const o = A.S.prov[j] && A.S.prov[j].owner; if (o && o !== 'unclaimed') set.add(o); }
    return set;
  };
  // the provinces near home: home and those next to it
  WC.nearProvs = function (p) {
    const P = p && A.prov(p.home); if (!P) return new Set();
    return new Set([P.id, ...(P.adj || [])]);
  };
  // entries a person could know of: in the realms around them, from their birth on (or from the record's start)
  WC.near = function (p, kinds, opts) {
    opts = opts || {};
    const R = S_() && S_().wrec; if (!R || !p) return [];
    const realms = opts.realms || WC.nearRealms(p), provs = WC.nearProvs(p), now = A.absDay(), from = Math.max(opts.since || 0, p.born || 0);
    const ks = kinds ? new Set(kinds) : null, out = [], max = opts.max || 40, minAge = opts.minDays != null ? opts.minDays : 45;
    for (let i = R.e.length - 1; i >= 0 && out.length < max; i--) {
      const e = R.e[i];
      if (ks && !ks.has(e[0])) continue;
      if (e[1] < from) continue;
      if (e[1] * 365 + (e[2] || 0) > now - minAge) continue;
      const here = (e[3] != null && provs.has(e[3])) || (e[4] && realms.has(e[4])) || (e[5] && realms.has(e[5]));
      if (!here) continue;
      if (opts.home && !(e[3] != null && provs.has(e[3])) && !(e[4] === p.realm || e[5] === p.realm)) continue;
      out.push(WC.ent(i));
    }
    return out;
  };

  // ---- words for an entry (pure)
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  WC.month = e => { try { return MON[A.monthOf(Math.min(364, e.d || 0)).m]; } catch (x) { return ''; } };
  const pn = i => (i != null && A.S.prov[i] ? A.S.prov[i].name : '');
  // a place inside a sentence: "the sack of the Free Marches", not "the sack of The Free Marches"
  const pin = i => pn(i).replace(/^The /, 'the ');
  const rs = id => (id ? (A.realm(id) ? A.realm(id).short : WC.name(id) || 'a realm now gone') : '');
  const nm = id => WC.name(id);
  WC.warName = e => { const id = Array.isArray(e.x) ? e.x[0] : e.x; return (id && WC.name(id)) || `the war of ${rs(e.a)} and ${rs(e.b)}`; };
  const the = s => s.replace(/^The /, 'the ');
  const FALL = ['taken on terms', 'taken by storm', 'sacked', 'burned'];
  // a short reference: "the burning of Kessaria in 1108" (used inside a sentence)
  WC.ref = function (e, opts) {
    if (!e) return '';
    const y = (opts && opts.noYear) ? '' : ` in ${e.y}`, P = pin(e.p);
    switch (e.k) {
      case 'war': return `${the(WC.warName(e))}${y ? ' of ' + e.y : ''}`;
      case 'peace': return `the end of ${the(WC.warName(e))}${y}`;
      case 'battle': return `the battle at ${P}${y}`;
      case 'siege': return `the siege of ${P}${y}`;
      case 'fall': return `${['the surrender', 'the storming', 'the sack', 'the burning'][e.x || 0] || 'the fall'} of ${P}${y}`;
      case 'cede': return `the year ${P} passed to ${rs(e.a)}${y ? ', ' + e.y : ''}`;
      case 'ruler': return `the death of ${nm(e.w[0]) || 'the old ruler'}${y}`;
      case 'crown': return `the crowning of ${nm(e.w[0]) || 'a new ruler'}${y}`;
      case 'fallen': return `the fall of ${rs(e.a)}${y}`;
      case 'founded': return `the founding of ${rs(e.a)}${y}`;
      case 'revolt': return `the rising in ${rs(e.a)}${y}`;
      case 'famine': return `the famine${y ? ' of ' + e.y : ''} in ${rs(e.a)}`;
      case 'plague': return `${WC.name('sick:' + e.p + ':' + e.y) || 'the sickness'}${y ? ' of ' + e.y : ''} at ${P}`;
      case 'wedding': return `the royal wedding of ${rs(e.a)} and ${rs(e.b)}${y}`;
      case 'alliance': return `the alliance of ${rs(e.a)} and ${rs(e.b)}${y}`;
      case 'trib': return e.x === 'free' ? `the year ${rs(e.a)} threw off ${rs(e.b)}'s tribute${y ? ', ' + e.y : ''}` : `the year ${rs(e.a)} bent the knee to ${rs(e.b)}${y ? ', ' + e.y : ''}`;
      case 'order': return `the destruction of ${the(WC.name(e.x) || 'an order of knights')}${y}`;
      case 'legend': return `the death of ${nm(e.w[0]) || 'a Legend'}${y}`;
    }
    return '';
  };
  // a whole sentence, dated: "In May 1110, at Crowbrook, Aldmark beat the Horde: 24,000 men in the field, 6,100 dead."
  WC.line = function (e) {
    if (!e) return '';
    const when = `In ${WC.month(e)} ${e.y}`, P = pin(e.p), A1 = rs(e.a), B1 = rs(e.b), fmt = n => (A.fmt ? A.fmt(n) : String(n));
    switch (e.k) {
      case 'war': return `${when}, ${A1} went to war with ${B1}: ${the(WC.warName(e))}${e.n > 2 ? `, with ${e.n} realms in the field` : ''}.`;
      case 'peace': {
        const res = Array.isArray(e.x) ? e.x[1] : 'white', got = Array.isArray(e.x) && Array.isArray(e.x[2]) ? e.x[2].map(pin).filter(Boolean) : [];
        const span = e.n > 0 ? ` after ${e.n} year${e.n > 1 ? 's' : ''}` : '';
        if (res === 'white') return `${when}, ${the(WC.warName(e))} ended${span} in a white peace.`;
        return `${when}, ${the(WC.warName(e))} ended${span}, and ${A1} had the better of it${got.length ? `: ${got.slice(0, 4).join(', ')} passed to ${A1}` : ''}.`;
      }
      case 'battle': { const x = Array.isArray(e.x) ? e.x : []; return `${when}, at ${P}, ${A1} beat ${B1}: ${fmt(e.n)} men in the field, ${fmt(x[0] || 0)} dead${x[1] > 1 ? ` in ${x[1]} days` : ''}.`; }
      case 'siege': return `${when}, ${A1} laid siege to ${P}, held for ${B1}${e.x === 'fell' ? `. It fell after ${e.n} days` : e.x === 'lifted' ? `. The siege was lifted after ${e.n} days` : ''}.`;
      case 'fall': return `${when}, ${P} was ${FALL[e.x || 0] || 'taken'} by ${A1}${e.n ? ` after a siege of ${e.n} days` : ''}.`;
      case 'cede': return `${when}, ${P} passed from ${B1 || 'the free lands'} to ${A1}${e.x === 'settled' ? ', settled out of the free lands' : ''}.`;
      case 'ruler': { const w0 = nm(e.w[0]) || `The ruler of ${A1}`, w1 = nm(e.w[1]); return `${when}, ${w0} of ${A1} died${e.x ? ` (${e.x})` : ''}${e.n ? `, aged ${e.n}` : ''}${w1 ? `. ${w1} succeeded` : ''}.`; }
      case 'crown': return `${when}, ${nm(e.w[0]) || 'a new ruler'} took the throne of ${A1}${nm(e.w[1]) ? `, in place of ${nm(e.w[1])}` : ''}.`;
      case 'fallen': return `${when}, ${A1} fell${B1 ? `, swallowed by ${B1}` : ''}${e.n ? `, ${e.n} years after its founding` : ''}.`;
      case 'founded': return `${when}, ${A1} was founded${e.x === 'granted' ? ` out of ${B1}'s lands, by grant` : e.x === 'won' ? `, its freedom won in war against ${B1}` : e.x === 'carved' ? ' out of the free lands' : B1 ? ` out of ${B1}` : ''}${P ? `, with its seat at ${P}` : ''}${nm(e.w[0]) ? `, under ${nm(e.w[0])}` : ''}.`;
      case 'revolt': return `${when}, ${nm(e.w[0]) || 'a great lord'} rose against the crown of ${A1}${e.x === 'claim' ? ', claiming the throne' : ' with the lords of a league'}${P ? `, holding ${P}` : ''}.`;
      case 'famine': return `${when}, the harvest failed in ${A1}, and bread was dear until the next.`;
      case 'plague': { const sp = Array.isArray(e.x) ? e.x.map(pin).filter(Boolean) : []; const s = WC.name('sick:' + e.p + ':' + e.y) || 'a sickness'; return `${when}, ${s} broke out at ${P}, in the lands of ${A1}${sp.length ? `, and spread to ${sp.join(' and ')}` : ''}.`; }
      case 'wedding': return `${when}, a royal marriage bound ${A1} and ${B1}.`;
      case 'alliance': return `${when}, ${A1} and ${B1} swore an alliance.`;
      case 'trib': return e.x === 'free' ? `${when}, ${A1} threw off the tribute it paid ${B1}.` : `${when}, ${A1} became a tributary of ${B1}.`;
      case 'order': return `${when}, ${the(WC.name(e.x) || 'an order of knights')} of ${A1} were destroyed${P ? ` at ${P}` : ''}.`;
      case 'legend': return `${when}, ${nm(e.w[0]) || 'a Legend'} of ${A1}, one of the great fighters of the age, died${e.x ? ` (${e.x})` : ''}${e.n ? `, aged ${e.n}` : ''}.`;
    }
    return `${when}: ${WC.KINDS[e.k] ? WC.KINDS[e.k][0] : e.k}.`;
  };
  // the people of an entry, by name
  WC.people = e => (e && e.w ? e.w.map(nm).filter(Boolean) : []);
  WC.place = e => (e && e.p != null ? pn(e.p) : (e && e.a ? rs(e.a) : ''));
})();
