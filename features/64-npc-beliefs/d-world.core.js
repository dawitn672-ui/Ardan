// NPC beliefs, part 4: what is said of the great events of the age, realm by realm; what people do because of what they
// believe; and how the player's own picture of the world can be wrong and set right.
//
//   1. What is said here. Every realm keeps a few tellings of the great entries of 57-world-chronicle's record (a battle,
//      the end of a war, a ruler's death, a town taken, a sickness, a Legend's death). Each telling is a claim, true or
//      not. Which version a realm tells depends on its side and its distance: the winners count the dead high, the
//      losers say they held the field, the victims of a sack say the town was burned, the far hear it inflated or
//      garbled. Tellings drift with the years towards what flatters the realm, faster under a ruler with legitimacy and
//      fame and a skilled chancellor (56's court), and are now and then set right (after a peace, more often).
//      A realm's believed history weighs on its grudges (55-bonds' ledger as 68-casus-belli reads it: FE.sum) and, for
//      tales of a ruler's cruelty, on its wariness in diplomacy (A.interest), both small and capped.
//   2. People act on beliefs. Someone who believes X killed their kin turns on X: X becomes their enemy, they may go to
//      X's door (alone, or asking the player: 21-npc-initiative's move `nb_avenge`), and if X is the player they may
//      start a plot (39-schemes' `pc.scAgainst`). A court that believes a councillor is in the pay of its enemies puts
//      him out of the council (56's seats) and keeps him out while it believes it.
//   3. The player hears what is said in their realm of far events, ruler's deaths and sicknesses, takes it on trust
//      (pc.nbk), and may find out years later that it was not so: a line in the story log or the scene
//      `nb_record_wrong`; the Chronicle sets what they were told beside the record (e-world-view.core.js).
// State: S.npcb.pb = {realmId: {claimId: year taken up}} (at most PB a realm), S.npcb.ww (record entries read);
// p.nbRv on a person: the year they last went after someone for a killing. All optional; old saves load.
(function () {
  const NB = A.NPCB; if (!NB) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), has = NB.has, cap = NB.cap, clean = NB.clean;
  Object.assign(NB, {
    PB: 6, PBB: 3, PBF: 2,  // tellings a realm keeps, of which battles, and of which news from afar (its own slots)
    WG_ON: true, WG_CAP: 10,  // the believed history weighs on grudges (FE.sum), at most this much
    WARY_ON: true, WARY_CAP: 6, // tales of a ruler's cruelty make a realm warier (A.interest), at most this much
    TREASON: 0.05,          // a year's chance that someone at court whispers that a councillor is a traitor
  });
  for (const k of ['seedWorld', 'drift', 'worldFix', 'pcWorldHeard', 'pcWorldFix', 'revFeud', 'revAct', 'revKill', 'revFalse', 'revPlot', 'seedTreason', 'sideline', 'sidelineFalse', 'tale']) NB.stats[k] = NB.stats[k] || 0;
  const reset0 = NB.resetStats;
  NB.resetStats = () => { reset0(); for (const k of ['seedWorld', 'drift', 'worldFix', 'pcWorldHeard', 'pcWorldFix', 'revFeud', 'revAct', 'revKill', 'revFalse', 'revPlot', 'seedTreason', 'sideline', 'sidelineFalse', 'tale']) NB.stats[k] = 0; };
  const WC = () => (A.WC && A.WC.ent ? A.WC : null);
  const rs = id => (id && A.realm(id) ? A.realm(id).short : id && A.WC && A.WC.name ? A.WC.name(id) || 'a realm now gone' : 'a realm now gone');
  // a place inside a sentence: "the Free Marches", not "The Free Marches"
  const pn = i => (i != null && A.S.prov[i] ? String(A.S.prov[i].name).replace(/^The /, 'the ') : 'the town');
  const live = () => Object.keys(A.S.realms || {}).filter(id => A.S.realms[id].alive && !A.S.realms[id].isRebel).sort();
  const nbrs = id => (A.neighbors ? A.neighbors(id) || [] : []);

  // ---------------------------------------------------------------- the tellings of one entry

  // the entries worth telling, and how great each is
  const KIND = { battle: 'B', peace: 'Q', ruler: 'R', fall: 'X', plague: 'Y', legend: 'G' };
  NB.KIND_W = KIND;
  // a realm's place in an entry: own (the winner, the taker, the realm whose ruler or Legend died), other (the loser),
  // near (a neighbour of either side), far (pure)
  NB.role = function (rid, e) {
    if (!e) return 'far';
    if (rid === e.a) return 'own';
    if (rid === e.b) return 'other';
    if (nbrs(e.a).includes(rid) || (e.b && nbrs(e.b).includes(rid))) return 'near';
    return 'far';
  };
  // how hard a realm tells its own story: its legitimacy, its ruler's fame, and its chancellor's skill (pure; 0..1)
  NB.prop = function (rid) {
    const r = A.realm(rid); if (!r) return 0;
    const ru = A.P(r.ruler);
    let p = clamp(((r.legit != null ? r.legit : 50) - 40) / 120, 0, 0.5) + clamp(((ru && ru.fame) || 0) / 200, 0, 0.3);
    const seat = A.COUNCIL && A.COUNCIL.chancellor ? 'chancellor' : null, ch = seat && r.council ? A.P(r.council[seat]) : null;
    if (ch && ch.alive && A.skill) p += clamp(A.skill(ch, A.COUNCIL.chancellor.skill || 'diplomacy') / 400, 0, 0.2);
    return clamp(p, 0, 1);
  };
  // the realm a realm would blame (engine context; pure to compute): its enemy at war, else its coldest neighbour
  NB.foeOf = function (rid) {
    for (const w of A.S.wars || []) { if (w.att.includes(rid) && A.realm(w.leadD)) return w.leadD; if (w.def.includes(rid) && A.realm(w.leadA)) return w.leadA; }
    let best = null, bv = -20;
    for (const n of nbrs(rid).slice().sort()) { const r = A.realm(n); if (!r || !r.alive) continue; const v = A.relBetween ? A.relBetween(rid, n) : 0; if (v < bv) { bv = v; best = n; } }
    return best;
  };
  // the versions a realm in this role would tell, with weights (pure). T is the record's own account.
  NB.versions = function (k, role, P, e, ctx) {
    const W = {};
    if (k === 'B') {
      if (role === 'own') Object.assign(W, { V: 2 + 2 * P, T: 1 });
      else if (role === 'other') Object.assign(W, { L: 1.5 + P, T: 1 });
      else if (role === 'near') Object.assign(W, { T: 1, F: 1 });
      else Object.assign(W, { F: 2, T: 0.6 });
    } else if (k === 'Q') {
      const white = !(Array.isArray(e.x) && e.x[1] && e.x[1] !== 'white');
      if (role === 'own') Object.assign(W, white ? { V: 1.5 + P, T: 1 } : { T: 1 });
      else if (role === 'other') Object.assign(W, white ? { V: 1.5 + P, T: 1 } : { L: 1 + P, T: 1 });
      else if (role === 'near') Object.assign(W, { T: 1, F: 0.6 });
      else Object.assign(W, { F: 1.5, T: 0.7 });
    } else if (k === 'R') {
      if (role === 'own') Object.assign(W, { T: 1.2, H: 0.5 + P, P: 0.15 }, ctx.foe ? { E: 0.3 + 0.8 * P } : {});
      else if (role === 'near') Object.assign(W, { T: 1, P: 0.8 });
      else Object.assign(W, { T: 0.6, P: 1, H: 0.2 });
    } else if (k === 'X') {
      if (role === 'own') Object.assign(W, { V: 1 + P, T: 1 });
      else if (role === 'other') Object.assign(W, { L: 1.5 + P, T: 1 });
      else if (role === 'near') Object.assign(W, { T: 1, F: 0.6 });
      else Object.assign(W, { F: 1.5, T: 0.5 });
    } else if (k === 'Y') {
      if (role === 'own') Object.assign(W, { T: 1, J: 0.1 + 0.7 * (1 - P) }, ctx.foe ? { E: 0.3 + P } : {});
      else Object.assign(W, { T: 0.7, J: 1 });
    } else if (k === 'G') {
      if (role === 'own' || role === 'near') Object.assign(W, { T: 1, A: 0.6, K: 0.45 });
      else Object.assign(W, { A: 1.2, T: 0.5, K: 0.7 });
    }
    return W;
  };
  // the claim one version makes (engine: it may create the claim)
  NB.worldClaim = function (i, acct, rid, ctx) {
    const W = WC(), e = W && W.ent(i); if (!e) return null;
    ctx = ctx || {};
    const k = KIND[e.k];
    if (k === 'B') return NB.battleClaim(i, acct);
    if (k === 'Q') {
      const res = Array.isArray(e.x) ? e.x[1] : 'white', ced = Array.isArray(e.x) && Array.isArray(e.x[2]) ? e.x[2].length : 0;
      const win = res && res !== 'white' ? e.a : null;
      let s = win, n = ced;
      if (acct === 'L') s = null;
      else if (acct === 'V') s = rid === e.a || rid === e.b ? rid : win;
      else if (acct === 'F') { if (NB.H(i, 'qf') < 0.35) s = win === e.a ? e.b : e.a; n = Math.max(1, ced * 2 + (NB.H(i, 'qn') < 0.5 ? 1 : 0)); }
      return NB.make('Q', s, i, s === win && n === ced ? 1 : 0, 0, [acct, n], e.y);
    }
    if (k === 'R') {
      const cause = String(e.x || 'old age'), old = e.w[0] || null, heir = e.w[1] || null;
      const sus = /poison|whisper|knife|dark/i.test(cause);
      if (acct === 'P') return heir ? NB.make('R', heir, i, sus && NB.H(old, 'whisper') < 0.35 ? 1 : 0, -10, ['P'], e.y) : null;
      if (acct === 'E') return ctx.foe ? NB.make('R', ctx.foe, i, 0, -10, ['E'], e.y) : null;
      if (acct === 'H') return old ? NB.make('R', old, i, /wound|battle|fight|horse/i.test(cause) ? 1 : 0, 4, ['H'], e.y) : null;
      return NB.make('R', old, i, 1, 0, ['T'], e.y);
    }
    if (k === 'X') {
      const h = +e.x || 0;
      let s = e.a, hw = h;
      if (acct === 'L') hw = Math.min(3, h + 1);
      else if (acct === 'V') hw = Math.max(0, h - 1);
      else if (acct === 'F') { hw = 3; if (ctx.ally && NB.H(i, 'xf') < 0.4) s = ctx.ally; }
      return NB.make('X', s, i, s === e.a && hw === h ? 1 : 0, 0, [acct, hw], e.y);
    }
    if (k === 'Y') {
      if (acct === 'J') return e.w[0] ? NB.make('Y', e.w[0], i, 0, -6, ['J'], e.y) : null;
      if (acct === 'E') return ctx.foe ? NB.make('Y', ctx.foe, i, 0, -6, ['E'], e.y) : null;
      return NB.make('Y', null, i, 1, 0, ['T'], e.y);
    }
    if (k === 'G') {
      const L = e.w[0] || null, cause = String(e.x || '');
      if (!L) return null;
      if (acct === 'A') return NB.make('G', L, i, 0, 0, ['A'], e.y);
      if (acct === 'K') return NB.make('G', L, i, /poison|knife|ambush|murder|treach/i.test(cause) ? 1 : 0, 0, ['K'], e.y);
      return NB.make('G', L, i, 1, 0, ['T'], e.y);
    }
    return null;
  };
  // the account a claim gives (pure): 'T' for the record's own
  NB.acctOf = c => (!c ? null : Array.isArray(c.x) ? (c.k === 'B' ? c.x[1] : c.x[0]) : null);
  const ctxFor = (rid, e) => {
    const ally = e && A.realm(e.a) ? ((A.realm(e.a).allies || []).slice().sort()[0] || null) : null;
    return { foe: NB.foeOf(rid), ally };
  };
  // a realm takes up a telling of entry i (engine)
  NB.tellIn = function (rid, i, force) {
    const W = WC(), e = W && W.ent(i); if (!e || !KIND[e.k]) return null;
    const role = NB.role(rid, e), ctx = ctxFor(rid, e);
    const V = NB.versions(KIND[e.k], role, NB.prop(rid), e, ctx);
    const L = Object.keys(V).filter(k => V[k] > 0).map(k => ({ k, w: V[k] }));
    if (!L.length) return null;
    const x = force ? { k: force } : A.wpick(L, z => z.w);
    const cid = NB.worldClaim(i, x.k, rid, ctx);
    if (cid == null) return null;
    const st = NB.st(), m = st.pb[rid] && typeof st.pb[rid] === 'object' ? st.pb[rid] : (st.pb[rid] = {});
    // one telling of an entry: a new version replaces the old
    for (const id of Object.keys(m)) { const c = st.c[id]; if (c && c[2] === i && KIND_OF(c[0]) && +id !== cid) delete m[id]; }
    if (m[cid] == null) m[cid] = A.S.year;
    return cid;
  };
  const KIND_OF = k => k === 'B' || NB.WORLD_K.includes(k);
  NB.isWorld = c => !!c && KIND_OF(c.k);
  // how much a realm cares to keep telling entry e (pure)
  NB.tellScore = function (rid, e) {
    const g = A.WC.KINDS && A.WC.KINDS[e.k] ? A.WC.KINDS[e.k][1] : 1;
    const role = NB.role(rid, e);
    let s = g + (role === 'own' || role === 'other' ? 3 : role === 'near' ? 1.5 : 0) - (A.S.year - e.y) / 12;
    if (e.k === 'battle') s += Math.min(2, (Array.isArray(e.x) ? +e.x[0] || 0 : 0) / 8000);
    if (e.k === 'fall') s += (+e.x || 0) / 2 - 0.5;
    return s;
  };
  // which new entries a realm hears of at all: its own, its neighbours', and the year's greatest across Ardan
  NB.worldYear = function () {
    const W = WC(), R = A.S.wrec; if (!W || !R || !Array.isArray(R.e)) return;
    const st = NB.st();
    if (!st.pb || typeof st.pb !== 'object' || Array.isArray(st.pb)) st.pb = {};
    if (typeof st.ww !== 'number' || st.ww > R.e.length) st.ww = R.e.length;
    const fresh = [];
    for (let i = st.ww; i < R.e.length; i++) {
      const e = R.e[i]; if (!e || !KIND[e[0]]) continue;
      if (e[0] === 'fall' && !(+e[8] >= 1)) continue;          // a town taken on terms is not much of a story
      fresh.push(i);
    }
    st.ww = R.e.length;
    const realms = live();
    // the greatest of the year, heard everywhere: the largest battle, the worst sack, a Legend, a war won with land
    const great = fresh.map(i => W.ent(i)).filter(e => e.k === 'legend' || (e.k === 'peace' && Array.isArray(e.x) && e.x[1] !== 'white' && (e.x[2] || []).length) || (e.k === 'fall' && +e.x >= 2) || e.k === 'battle')
      .sort((a, b) => (b.k === 'legend') - (a.k === 'legend') || ((b.k === 'battle' ? (b.x || [0])[0] : 20000 * (+b.x || 1)) - (a.k === 'battle' ? (a.x || [0])[0] : 20000 * (+a.x || 1))) || a.i - b.i).slice(0, 2).map(e => e.i);
    for (const rid of realms) {
      // the entries it would keep, chosen before any telling is made: its own and its neighbours', the year's greatest
      const near = new Set([rid].concat(nbrs(rid)));
      const cand = [];
      for (const i of fresh) {
        const e = W.ent(i);
        if (!(near.has(e.a) || (e.b && near.has(e.b)) || great.includes(i))) continue;
        const sc = NB.tellScore(rid, e);
        if (sc >= 1.5) cand.push({ i, e, s: sc });
      }
      if (!cand.length) continue;
      for (const x of pickPb(rid, cand)) if (NB.tellIn(rid, x.i)) NB.stats.seedWorld++;
      trimPb(rid);
    }
    // the old tellings drift, and are now and then set right; a peace brings envoys and truer word
    const peaces = [];
    for (let i = R.e.length - 1; i >= 0 && peaces.length < 60; i--) { const e = R.e[i]; if (e && e[0] === 'peace') peaces.push([e[1], e[4], e[5]]); else if (e && e[1] < A.S.year - 30) break; }
    for (const rid of Object.keys(st.pb).sort()) {
      if (!A.realm(rid) || !A.realm(rid).alive) { delete st.pb[rid]; continue; }
      NB.driftIn(rid, peaces);
    }
  };
  // which of the candidate entries would make the cut beside what the realm already tells (pure)
  const pickPb = function (rid, cand) {
    const st = NB.st(), m = st.pb[rid] || {}, W = WC();
    const L = Object.keys(m).map(id => { const c = st.c[id], e = c && W.ent(c[2]); return e ? { e, s: NB.tellScore(rid, e), bat: c[0] === 'B' } : null; }).filter(Boolean)
      .concat(cand.map(x => Object.assign({ cand: 1, bat: x.e.k === 'battle' }, x)));
    L.sort((a, b) => b.s - a.s || a.e.i - b.e.i);
    let nb = 0, n = 0, nf = 0;
    const out = [];
    for (const x of L) {
      const far = NB.role(rid, x.e) === 'far';
      if (far ? nf >= NB.PBF : n >= NB.PB - NB.PBF || (x.bat && nb >= NB.PBB)) continue;
      if (far) nf++; else { n++; if (x.bat) nb++; }
      if (x.cand) out.push(x);
    }
    return out;
  };
  const trimPb = function (rid) {
    const st = NB.st(), m = st.pb[rid]; if (!m) return;
    const W = WC();
    const L = Object.keys(m).map(id => { const c = st.c[id], e = c && W.ent(c[2]); return { id, c, e, s: e ? NB.tellScore(rid, e) : -99 }; }).filter(x => { if (!x.e) delete m[x.id]; return !!x.e; });
    L.sort((a, b) => b.s - a.s || +a.id - +b.id);
    // the realm's own affairs and its neighbours' fill most of it; news from afar keeps PBF places of its own
    let nb = 0, n = 0, nf = 0;
    for (const x of L) {
      const far = NB.role(rid, x.e) === 'far', bat = x.c[0] === 'B';
      if (far ? nf >= NB.PBF : n >= NB.PB - NB.PBF || (bat && nb >= NB.PBB)) { delete m[x.id]; continue; }
      if (far) nf++; else { n++; if (bat) nb++; }
    }
    if (!Object.keys(m).length) delete st.pb[rid];
  };
  // a year of a realm's tellings: memory flatters, propaganda pushes, envoys and peace set things right (engine)
  NB.driftIn = function (rid, peaces) {
    const st = NB.st(), m = st.pb[rid]; if (!m) return;
    const P = NB.prop(rid), W = WC();
    for (const id of Object.keys(m).sort((a, b) => +a - +b)) {
      const raw = st.c[id]; if (!raw) continue;
      const c = NB.claim(id), e = W.ent(c.o); if (!e) continue;
      const acct = NB.acctOf(c), age = A.S.year - (m[id] || A.S.year);
      if (acct === 'T') {
        const p = 0.03 + 0.07 * P + (age >= 8 ? 0.03 : 0);
        if (!A.chance(p)) continue;
        const V = NB.versions(c.k, NB.role(rid, e), P, e, ctxFor(rid, e));
        const L = Object.keys(V).filter(k => k !== 'T').map(k => ({ k, w: V[k] }));
        if (!L.length) continue;
        const x = A.wpick(L, z => z.w);
        const y = m[id];
        const n = NB.tellIn(rid, c.o, x.k);
        if (n != null && n !== +id) { st.pb[rid][n] = y; NB.stats.drift++; }
      } else if (!c.t) {
        // a peace since the tale was taken up, between this realm and the one it blames, brings envoys and truer word
        const blamed = typeof c.s === 'string' && A.realm(c.s) ? c.s : null;
        const peace = blamed && (peaces || []).some(x => x[0] >= (m[id] || 0) && ((x[1] === rid && x[2] === blamed) || (x[2] === rid && x[1] === blamed)));
        if (!A.chance(0.02 + (peace ? 0.25 : 0))) continue;
        const y = m[id];
        const n = NB.tellIn(rid, c.o, 'T');
        if (n != null) { st.pb[rid][n] = y; NB.stats.worldFix++; }
      }
    }
  };
  // what is said in a realm (pure): [{c, y}] newest entries first
  NB.tellings = function (rid) {
    const s = NB.peek(); if (!s || !s.pb || !s.pb[rid]) return [];
    return Object.keys(s.pb[rid]).map(id => ({ c: NB.claim(id), y: s.pb[rid][id] })).filter(x => x.c).sort((a, b) => b.c.y - a.c.y || a.c.id - b.c.id);
  };

  // ---------------------------------------------------------------- what a telling says (pure)

  const nm = (id, pc) => (pc && id === pc.id ? 'you' : NB.name(id) || (A.WC && A.WC.name ? A.WC.name(id) : '') || 'someone');
  const CAUSE = s => { s = clean(s || 'old age', 60).replace(/,\s*some whisper$/, ''); return /^(a|an|the|his|her|old|poison|failing|unknown)\b/i.test(s) ? s : 'a ' + s; };
  NB.sayW = function (c, pc) {
    const W = WC(), e = W && W.ent(c.o); if (!e) return '';
    const a = Array.isArray(c.x) ? c.x : [], acct = a[0];
    if (c.k === 'Q') {
      const war = String(W.warName(e) || 'the war').replace(/^The /, 'the ');
      if (c.s == null) return `that ${war} ended in ${e.y} with neither side the better of it`;
      const N = ['', 'a province', 'two provinces', 'three provinces', 'four provinces', 'five provinces', 'six provinces', 'seven provinces', 'eight provinces'];
      return `that ${rs(c.s)} won ${war} in ${e.y}${a[1] ? `, and took ${N[a[1]] || a[1] + ' provinces'} for it` : ''}`;
    }
    if (c.k === 'R') {
      const old = nm(e.w[0], pc), realm = rs(e.a);
      if (acct === 'P') return `that ${nm(c.s, pc)} poisoned ${old} of ${realm} to come to the throne, in ${e.y}`;
      if (acct === 'E') return `that agents of ${rs(c.s)} poisoned ${old} of ${realm}, in ${e.y}`;
      if (acct === 'H') return `that ${old} of ${realm} died in the saddle with a sword drawn, in ${e.y}`;
      return `that ${old} of ${realm} died of ${CAUSE(e.x)}, in ${e.y}`;
    }
    if (c.k === 'X') {
      const h = +a[1] || 0, P = pn(e.p);
      return `that ${rs(c.s)} ${['took ' + P + ' on terms', 'stormed ' + P, 'sacked ' + P, 'burned ' + P + ' and put its people to the sword'][h] || 'took ' + P}, in ${e.y}`;
    }
    if (c.k === 'Y') {
      const P = pn(e.p);
      if (acct === 'J') return `that the sickness at ${P} in ${e.y} was a judgement on ${nm(c.s, pc)}`;
      if (acct === 'E') return `that ${rs(c.s)} brought the sickness to ${P}, in ${e.y}`;
      return `that the sickness at ${P} in ${e.y} came as sickness comes, and was nobody's doing`;
    }
    if (c.k === 'G') {
      const L = nm(c.s, pc);
      if (acct === 'A') return `that ${L} is not dead, but gone over the mountains, and will come back`;
      if (acct === 'K') return `that ${L} was struck down by treachery in ${e.y}, not in fair fight`;
      return `that ${L} died of ${CAUSE(e.x)}, in ${e.y}`;
    }
    return '';
  };
  // the record's own account of a claim's entry (pure)
  NB.recordLine = c => { const W = WC(), e = c && W ? W.ent(c.o) : null; return e && W.line ? W.line(e) : ''; };

  // does the player know how it really went? (pure; null when they cannot say)
  NB.knowsW = function (pc, c) {
    const W = WC(), e = W && W.ent(c.o); if (!e) return null;
    if ((e.w || []).includes(pc.id)) return true;
    const nb = nbrs(pc.realm);
    if (c.k === 'Q') return e.a === pc.realm || e.b === pc.realm || nb.includes(e.a) || nb.includes(e.b) ? true : null;
    if (c.k === 'X') return pc.home === e.p || e.a === pc.realm || e.b === pc.realm ? true : null;
    if (c.k === 'R') {
      const r = pc.rel && pc.rel[e.w[0]];
      return pc.ruler === e.a || (r && NB.KIN.has(r.type)) || (pc.office && pc.realm === e.a) ? true : null;
    }
    return null;
  };

  // ---------------------------------------------------------------- the believed history weighs on realms (pure)

  // what realm a believes b did to it, in grudge points (negative), beyond what the true ledger holds
  NB.wGrudge = function (a, b) {
    const s = NB.peek(); if (!s || !s.pb || !s.pb[a] || !A.S.wrec) return 0;
    const m = s.pb[a], E = A.S.wrec.e;
    let g = 0;
    for (const id in m) {
      const c = s.c[id]; if (!c || c[1] !== b) continue;
      const e = E[c[2]]; if (!e) continue;
      let v = 0;
      if (c[0] === 'X' && e[5] === a) v = [0, -2, -5, -8][(c[6] || [])[1] || 0] || 0;
      else if (c[0] === 'R' && (c[6] || [])[0] === 'E' && e[4] === a) v = -10;
      else if (c[0] === 'Y' && (c[6] || [])[0] === 'E' && e[4] === a) v = -5;
      if (v) g += c[4] ? v * 0.5 : v;   // a true wrong is mostly in the ledger already
    }
    return Math.max(-NB.WG_CAP, Math.round(g));
  };
  // what makes a realm wary of b: tales of cruelty by b's crown, true or not (positive, capped)
  NB.wary = function (a, b) {
    const s = NB.peek(); if (!s) return 0;
    let w = 0;
    const m = s.pb && s.pb[a];
    if (m) for (const id in m) {
      const c = s.c[id]; if (!c || c[1] !== b) continue;
      if ((c[0] === 'X' && ((c[6] || [])[1] || 0) >= 2) || (c[0] === 'R' && (c[6] || [])[0] === 'E')) w += 3;
    }
    const rb = A.realm(b), ru = rb && rb.ruler, ct = s.ct && s.ct[a];
    if (ru && ct) for (const id in ct) { const c = s.c[id]; if (c && ct[id] > 0 && c[1] === ru && (c[0] === 'K' || (c[0] === 'S' && c[2] === 'crime'))) w += 2; }
    return Math.min(NB.WARY_CAP, w);
  };
  const FE = A.BONDS && A.BONDS.FEUD;
  if (FE && typeof FE.sum === 'function') {
    const sum0 = FE.sum;
    NB.feudSum0 = sum0;
    FE.sum = function (a, b) {
      const v = sum0.apply(this, arguments);
      if (!NB.WG_ON) return v;
      const g = NB.wGrudge(a, b);
      return g ? clamp(v + g, -(FE.CAP || 45), FE.CAP || 45) : v;
    };
  }
  if (typeof A.memSum === 'function') {
    const memSum = A.memSum;
    A.memSum = function (a, b) {
      const m = memSum.apply(this, arguments);
      if (!NB.WG_ON) return m;
      // 55-bonds adds FE.sum (and so the believed history) only where its ledger has a line; elsewhere it is added here
      const r = A.realm(a);
      if (FE && FE.ON && r && r.feud && r.feud[b]) return m;
      const g = NB.wGrudge(a, b);
      return g ? m + g : m;
    };
  }
  if (typeof A.opinionParts === 'function') {
    const parts = A.opinionParts;
    A.opinionParts = function (a, b) {
      const out = parts.apply(this, arguments);
      try {
        const g = NB.WG_ON ? NB.wGrudge(a, b) : 0;
        if (g) { const L = NB.tellings(a).filter(x => x.c.s === b).map(x => NB.say(x.c, null)); out.push([`What is said in ${rs(a)}: ${cap(L[0] || 'old wrongs')}`, g]); }
      } catch (e) {}
      return out;
    };
  }
  if (typeof A.interest === 'function') {
    const interest = A.interest;
    A.interest = function (a, b) {
      const v = interest.apply(this, arguments);
      return NB.WARY_ON ? v - NB.wary(a, b) : v;
    };
  }

  // ---------------------------------------------------------------- vengeance: a killing believed (engine, pure parts)

  const isKin = (t, vid) => { const r = t.rel && t.rel[vid], v = A.P(vid), b = v && v.rel && v.rel[t.id]; return !!((r && (NB.KIN.has(r.type) || NB.CLOSE.has(r.type))) || (b && (NB.KIN.has(b.type) || NB.CLOSE.has(b.type)))); };
  // the killing t believes of someone, of t's own kin or close friend, with the killer alive (pure)
  NB.avengeOf = function (pc, t, withPc) {
    const s = NB.peek(); if (!s || !t || !t.nb || !t.alive) return null;
    if (t.nbRv && A.S.year - t.nbRv < 6) return null;
    for (const id of Object.keys(t.nb).sort((a, b) => +a - +b)) {
      if (t.nb[id] <= 0) continue;
      const e = s.c[id]; if (!e || e[0] !== 'K') continue;
      const X = A.P(e[1]);
      if (!X || !X.alive || X.id === t.id || !A.isAdult(X) || X.ruler || X.prison) continue;
      if (pc && X.id === pc.id && !withPc) continue;
      if (!isKin(t, e[2])) continue;
      return { c: NB.claim(id), X };
    }
    return null;
  };
  // t goes to X's door (engine). help: 'join' (the player went too), 'alone'. Returns words for a scene's result.
  NB.avengeAct = function (pc, t, X, c, help) {
    if (!t || !X || !X.alive || !c) return '';
    t.nbRv = A.S.year;
    NB.stats.revAct++; if (!c.t) NB.stats.revFalse++;
    const victim = clean(c.x || NB.name(c.o) || 'the dead', 60);
    const guard = pc && (pc.spouse === X.id || (pc.children || []).includes(X.id) || (pc.parents || []).includes(X.id));
    let pK = 0.22 + (help === 'join' ? 0.18 : 0) + (has(t, 'wrathful') || has(t, 'cruel') ? 0.08 : 0) - (has(X, 'brave') ? 0.05 : 0);
    if (guard) pK = 0;
    const xn = clean(A.fullName ? A.fullName(X, false) : X.given, 60);
    if (A.chance(pK)) {
      A.kill(X, `killed by ${t.given}, over ${victim}`);
      NB.stats.revKill++;
      // a killing done in the open: X's people know who did it, and some of them will want the same
      const K = NB.make('K', t.id, X.id, 1, -10, xn);
      for (const id of Object.keys(X.rel || {}).sort()) { const r = X.rel[id], f = A.P(id); if (f && f.alive && f.id !== t.id && (!pc || f.id !== pc.id) && r && (NB.KIN.has(r.type) || NB.CLOSE.has(r.type)) && A.chance(0.7)) NB.adopt(f, K, 1, 'kill'); }
      if (pc && (pc.rel[t.id] || pc.rel[X.id]) && help !== 'join') A.log(`${t.given} has killed ${xn}. ${cap(A.he(t))} believed ${A.he(X)} killed ${victim}${c.t ? '' : ', and it was never so'}.`, 'bad');
      return help ? `(${X.given} is dead by morning${c.t ? '' : ', for a killing ' + A.he(X) + ' never did'}.)` : '';
    }
    X.health = Math.max(15, (X.health || 60) - A.ri(15, 35));
    if (t.rel) t.rel[X.id] = Object.assign(t.rel[X.id] || {}, { type: (t.rel[X.id] && NB.KIN.has(t.rel[X.id].type)) ? t.rel[X.id].type : 'enemy', op: Math.min(-50, (t.rel[X.id] || {}).op || 0), since: (t.rel[X.id] || {}).since || A.S.year });
    if (X.rel) X.rel[t.id] = Object.assign(X.rel[t.id] || {}, { type: (X.rel[t.id] && NB.KIN.has(X.rel[t.id].type)) ? X.rel[t.id].type : 'enemy', op: Math.min(-50, (X.rel[t.id] || {}).op || 0), since: (X.rel[t.id] || {}).since || A.S.year });
    if (pc && (pc.rel[t.id] || pc.rel[X.id]) && !help) A.log(`${t.given} went to ${xn}'s door over ${victim}. ${X.given} lived, and the two are enemies now.`, 'muted');
    return help ? `(${X.given} lives, and will not forget the faces at the door.)` : '';
  };
  // once a year: those who believe a killing of their own act on it (engine)
  NB.revengeYear = function (pc, web) {
    const SC = A.SCHEMES;
    for (const h of web) {
      if (!h.nb || !h.alive || h.prison) continue;
      // the player as the one blamed: a plot (39-schemes), at most one a decade as that feature rules
      if (SC && !pc.scAgainst && A.isAdult(pc) && !pc.ruler && (pc.scLast == null || A.S.year - pc.scLast >= (SC.AGAIN || 10)) && !(h.nbRv && A.S.year - h.nbRv < 6)) {
        const s = NB.peek(), kid = Object.keys(h.nb).sort((a, b) => +a - +b).find(id => { const e = s.c[id]; return h.nb[id] > 0 && e && e[0] === 'K' && e[1] === pc.id && isKin(h, e[2]); });
        const m = kid ? { c: NB.claim(kid) } : null;
        if (m && NB.opOf(pc, h) <= -20) {
          const spite = 1 + ['vengeful', 'wrathful', 'cruel', 'proud'].filter(x => has(h, x)).length * 0.5;
          if (A.chance(Math.min(0.8, 0.2 * spite))) {
            const killer = NB.opOf(pc, h) <= -55 && (has(h, 'cruel') || has(h, 'vengeful') || has(h, 'wrathful'));
            pc.scAgainst = { by: h.id, k: killer ? 'murder' : 'slander', prog: 0, m: 0, y: A.S.year, noticed: 0, nb: m.c.id };
            pc.scLast = A.S.year; h.nbRv = A.S.year;
            NB.stats.revPlot++;
            continue;
          }
        }
      }
      const a = NB.avengeOf(pc, h);
      if (!a) continue;
      const X = a.X, r = h.rel && h.rel[X.id];
      // the bond turns: the one they blame is their enemy now (21-npc-initiative's feud move can find them)
      if (!r || (!NB.KIN.has(r.type) && r.type !== 'enemy')) {
        h.rel[X.id] = Object.assign(r || {}, { type: r && NB.KIN.has(r.type) ? r.type : 'enemy', op: Math.min(-40, (r && r.op) || 0), since: (r && r.since) || A.S.year });
        NB.stats.revFeud++;
      }
      // now and then they go to the door; less often when the player knows them (they will ask: nb_avenge)
      const p = (pc.rel[h.id] ? 0.05 : 0.1) * (has(h, 'vengeful') ? 1.8 : 1) * (has(h, 'wrathful') ? 1.5 : 1) * (has(h, 'forgiving') ? 0.4 : 1) * (has(h, 'craven') ? 0.5 : 1);
      if (A.chance(p)) NB.avengeAct(pc, h, X, a.c, null);
    }
  };

  // ---------------------------------------------------------------- the court: a councillor believed a traitor (engine)

  const voices = r => (A.RI && A.RI.voices ? A.RI.voices(r) : []);
  // is the whisper true? A councillor whose house wants the throne or the lords' liberties and is cold to the crown, or
  // one in twelve by a hash of who they are (pure)
  NB.treasonTrue = function (r, v) {
    const a = A.RI && A.RI.aims ? A.RI.aims(v.p) : null, h = v.h, op = h && h.op != null ? h.op : 50;
    return !!((a && (a.want === 'crown' || a.want === 'liberty') && op < 40) || NB.H(v.p.id, 'treason') < 0.08);
  };
  NB.traitors = function (rid) {   // the councillors a court believes are traitors (pure)
    const s = NB.peek(), m = s && s.ct && s.ct[rid]; if (!m) return [];
    const out = [];
    for (const id in m) { const e = s.c[id]; if (m[id] > 0 && e && e[0] === 'S' && e[2] === 'treason') out.push(e[1]); }
    return out.sort();
  };
  NB.councilYear = function (pc) {
    if (!A.RI || !A.RI.fillCouncil || !A.COUNCIL) return;
    for (const rid of live()) {
      const r = A.realm(rid);
      if (!r.council || (pc && pc.ruler === rid)) continue;   // a player ruler hears it in council, and decides
      const V = voices(r).filter(v => v.seat && v.p && v.p.alive);
      const ru = A.P(r.ruler);
      if (V.length >= 2 && A.chance(NB.TREASON * (ru && has(ru, 'paranoid') ? 1.6 : 1))) {
        // the whisper finds the disloyal more often than not, and the innocent often enough
        const v = A.wpick(V, x => (NB.treasonTrue(r, x) ? 3 : 1)), t = NB.treasonTrue(r, v);
        const cid = NB.make('S', v.p.id, 'treason', t ? 1 : 0, NB.SEC_V.treason);
        const pB = clamp(0.45 * (ru && has(ru, 'paranoid') ? 1.6 : 1) * (ru && (has(ru, 'trusting') || has(ru, 'just')) ? 0.6 : 1), 0.1, 0.9);
        if (A.chance(pB)) { NB.courtAdopt(rid, cid, 1); NB.stats.seedTreason++; }
      }
      for (const pid of NB.traitors(rid)) {
        const seat = Object.keys(r.council).find(k => A.COUNCIL[k] && r.council[k] === pid);
        if (!seat || pid === A.S.pc) continue;
        if (!A.chance(ru && has(ru, 'paranoid') ? 0.7 : 0.4)) continue;
        const p = A.P(pid), cid = Object.keys(NB.st().ct[rid]).find(id => { const e = NB.st().c[id]; return e && e[0] === 'S' && e[2] === 'treason' && e[1] === pid; });
        const c = NB.claim(cid);
        delete r.council[seat];
        try { A.RI.fillCouncil(r); } catch (e) { console.error('npc-beliefs council', e); }
        const L = Array.isArray(r.riCourt) ? r.riCourt[0] : null;
        if (L && L.k === 'seat' && L.seat === seat && L.y === A.S.year) { L.out = pid; L.why = [[`The court believes ${NB.name(pid)} ${NB.secText('treason', p, false)}`, 1]]; L.nbT = c && c.t ? 1 : 0; }
        NB.stats.sideline++; if (c && !c.t) NB.stats.sidelineFalse++;
        if (pc && (pc.realm === rid || pc.rel[pid])) A.log(`At court in ${r.short}, ${NB.name(pid)} is put out of the council as ${A.COUNCIL[seat].name}. They say ${A.he(p)} ${NB.secText('treason', p, false)}.`, 'muted');
      }
    }
  };
  // while a court believes it, the man it doubts is not named to any seat (56's RI.fillCouncil reads the council's
  // members as taken; the doubted are added for the call and removed after)
  if (A.RI && typeof A.RI.fillCouncil === 'function') {
    const fill = A.RI.fillCouncil;
    A.RI.fillCouncil = function (r) {
      const T = r && r.council && NB.peek() ? NB.traitors(r.id).filter(id => !Object.values(r.council).includes(id)) : [];
      const keys = T.map((id, i) => { const k = '_nb' + i; r.council[k] = id; return k; });
      try { return fill.apply(this, arguments); } finally { for (const k of keys) delete r.council[k]; }
    };
  }

  // ---------------------------------------------------------------- what the player is told of the world (engine)

  const holdsEntry = (pc, i) => Object.keys(pc.nbk || {}).some(id => { const c = NB.claim(id); return c && NB.isWorld(c) && c.o === i; });
  // someone who can hear you say it and put you right ("{who} hears you say it again"): a person, never a letter
  const SOURCE = ['A clerk with the annals', 'A drover from those parts', 'An old soldier who was there', 'A cousin back from abroad', 'A friar on the road',
    'A merchant who trades that way', 'A carter who passed through that year', 'A woman whose brother was there'];
  NB.sourceOf = c => SOURCE[Math.floor(NB.H(c.id, 'src') * SOURCE.length)];
  NB.pcWorldYear = function (pc) {
    const st = NB.st();
    // what is said in the player's realm: taken on trust, unless they know better
    const m = st.pb && st.pb[pc.realm];
    let told = 0;
    if (m && A.isAdult(pc)) for (const id of Object.keys(m).sort((a, b) => +a - +b)) {
      const c = NB.claim(id);
      if (!c || NB.pcHeld(pc, c.id) || NB.pcKnows(pc, c) || holdsEntry(pc, c.o)) continue;
      if (!A.chance(0.4)) continue;
      if (NB.pcHear(pc, c.id, 1, pc.realm)) {
        NB.stats.pcWorldHeard++;
        if (!told++) A.log(`Word in ${rs(pc.realm)}: ${cap(NB.say(c, pc))}.`, 'muted');
      }
    }
    // and it may come out that it was not so
    let queued = false;
    for (const id of Object.keys(pc.nbk || {}).sort((a, b) => +a - +b)) {
      const e = pc.nbk[id], c = NB.claim(id);
      if (!c || !NB.isWorld(c) || !Array.isArray(e) || e[0] !== 1 || !NB.isFalse(c, 1) || A.S.year - e[2] < 1) continue;
      const near = NB.WORLD_K.includes(c.k) ? NB.knowsW(pc, c) : null;
      const side = Object.keys(pc.rel || {}).some(pid => { const t = A.P(pid), W = WC(), en = W && W.ent(c.o); return t && t.alive && en && (t.realm === en.a || t.realm === en.b) && t.realm !== pc.realm; });
      const p = near ? 1 : 0.12 + (pc.literate ? 0.06 : 0) + (side ? 0.1 : 0) + clamp((pc.int || 0) / 1000, 0, 0.05);
      if (!A.chance(p)) continue;
      if (!queued && A.EV.nb_record_wrong && A.chance(0.5) && !(A.S.queue || []).some(q => q && q.ev === 'nb_record_wrong')) { A.queue({ type: 'event', ev: 'nb_record_wrong', forced: true, ctx: { cid: c.id } }); queued = true; continue; }
      NB.worldFix(pc, c, true);
    }
  };
  // the player learns how it went (engine); with log, a line in the story log
  NB.worldFix = function (pc, c, log) {
    const w = NB.pcLearn(pc, c.id, null);
    NB.stats.pcWorldFix++;
    if (log) A.log(`You had it that ${NB.say(c, pc).replace(/^that /, '')}. ${NB.sourceOf(c)} tells it otherwise. ${NB.recordLine(c)}`, 'muted');
    return w;
  };

  // ---------------------------------------------------------------- scenes' effects (fx.nb sub-keys)

  const holder = ctx => { const t = ctx && A.P(ctx.pid); return t && t.alive ? t : null; };
  // avenge: the person in the scene goes to the door of the one they blame (ctx.foePid), with the player or alone
  NB.FX.avenge = function (pc, how, ctx) {
    const t = holder(ctx), X = A.P(ctx.foePid), c = NB.claim(ctx.cid);
    if (!t || !X || !X.alive || !c) return '';
    if (how === 'join' && !c.t) pc.flags.nb_wrong_door = A.S.year;
    return NB.avengeAct(pc, t, X, c, how === 'join' ? 'join' : 'alone');
  };
  // calm: they put it off; warnFoe: the one blamed is warned, and grateful
  NB.FX.calm = function (pc, v, ctx) { const t = holder(ctx), c = NB.claim(ctx.cid); if (t) t.nbRv = A.S.year; return c && c.t ? '(It was true. You talked a man out of a just quarrel.)' : ''; };
  NB.FX.warnFoe = function (pc, v, ctx) {
    const t = holder(ctx), X = A.P(ctx.foePid); if (t) t.nbRv = A.S.year;
    if (X && X.alive && X.rel) { if (X.rel[pc.id]) X.rel[pc.id].op = clamp((X.rel[pc.id].op || 0) + 8, -100, 100); else A.link(X, pc, 'acquaint', 15, 'acquaint'); }
    return '';
  };
  // truthAll: the player carries the record's account to the people around (chance f each who hold a false version)
  NB.FX.truthAll = function (pc, f, ctx) {
    const c = NB.claim(ctx.cid); if (!c || !NB.isWorld(c)) return '';
    const T = c.k === 'B' ? NB.battleClaim(c.o, 'T') : NB.worldClaim(c.o, 'T', pc.realm, {});
    if (T == null) return '';
    let n = 0;
    for (const h of NB.web(pc)) for (const x of NB.beliefs(h)) if (x.c.o === c.o && NB.isWorld(x.c) && NB.isFalse(x.c, x.st) && x.c.k === c.k) { if (A.chance(+f || 0)) { NB.adopt(h, x.c.id, -x.st, 'truth'); NB.adopt(h, T, 1, 'truth'); n++; } break; }
    return n ? `(${n} ${n === 1 ? 'listener takes' : 'listeners take'} your word for it.)` : '';
  };
  // world: the scene's claim is learned as the record has it (the codex correction)
  NB.FX.world = function (pc, v, ctx) { const c = NB.claim(ctx.cid); if (c) NB.worldFix(pc, c, false); return ''; };

  // ---------------------------------------------------------------- 21-npc-initiative: the avenger asks the player

  NB.KINDS.nb_avenge = { ev: 'nb_avenge', g: 'req', base: 1.2, op: 0, adult: 1, near: 0.3,
    tr: { vengeful: 1.8, wrathful: 1.6, proud: 1.2, brave: 1.2, forgiving: 0.4, calm: 0.6, craven: 0.6 }, mot: { feud: 1.5 },
    sit: (pc, t) => (NB.avengeOf(pc, t) ? 2.5 : 0) };
  if (A.NPCI && A.NPCI.KINDS) A.NPCI.KINDS.nb_avenge = NB.KINDS.nb_avenge;

  // C.nbWorldHeard(p): the player holds a tale of the world on someone's word
  A.C.nbWorldHeard = p => !!(p && p.nbk && Object.keys(p.nbk).some(id => { const c = NB.claim(id); return c && NB.isWorld(c) && p.nbk[id][0] === 1; }));

  // ---------------------------------------------------------------- the yearly step

  // the realms' tellings are seeded from the record with the battles (one switch for everything read from 57's record:
  // 57's own test holds NB.seedBattles back to show that recording alone changes nothing)
  const seedB = NB.seedBattles;
  NB.seedBattles = function () { NB.worldYear(); return seedB.apply(this, arguments); };
  const year0 = NB.year;
  NB.year = function (pc) {
    year0.apply(this, arguments);
    const web = NB.web(pc);
    NB.councilYear(pc);
    NB.revengeYear(pc, web);
    NB.peopleWorldYear(pc, web);
    NB.pcWorldYear(pc);
  };
  // the people around the player take up what is said in their realm, as they take up their court's word
  NB.peopleWorldYear = function (pc, web) {
    const st = NB.st(); if (!st.pb) return;
    for (const h of web) {
      const m = st.pb[h.realm]; if (!m) continue;
      if (!A.chance(['noble', 'royal', 'gentry'].includes(h.status) || h.office ? 0.25 : 0.1)) continue;
      const ids = Object.keys(m).filter(id => !NB.held(h, id) && !NB.beliefs(h).some(x => x.c.o === (st.c[id] || [])[2] && NB.isWorld(x.c))).sort((a, b) => +a - +b);
      if (!ids.length) continue;
      if (NB.adopt(h, +A.pick(ids), 1, 'tale')) NB.stats.tale++;
    }
  };

  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { beliefWorld: true });
})();
