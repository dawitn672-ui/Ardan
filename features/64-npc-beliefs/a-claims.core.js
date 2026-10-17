// NPC beliefs, part 1 of 3: claims, who holds them, and where they come from (Road to Ten, Uniqueness 3: "belief
// versus truth, everywhere: beasts, people, battles and events all have what people believe and what is true, and
// your character's knowledge can be wrong").
//
// 26-belief-truth gave the player a knowledge state for beasts and secrets, far news that runs high, and a legend. The
// people of the world believed nothing of their own. Here they do:
//   - a claim is one thing someone might believe: that you did a deed (as it happened, as the taverns tell it, or
//     twisted by someone who hates you), that someone killed someone, that someone hides a heresy or a crime, who won a
//     battle and how many fell, the truth of a beast. Each claim knows whether it is true;
//   - a person holds a few claims, each believed (1) or disbelieved (-1). A false belief is a believed false claim, or a
//     disbelieved true one. A realm's court holds claims as one body;
//   - claims are born from what happens: your deeds (pc.deeds, and 57-world-chronicle's battles you were in), a death
//     among the people you know (the kin look for someone to blame, and it may be you), a killing you did, a slander
//     from 21-npc-initiative, the secrets of 55-bonds, the record of battles in 57-world-chronicle (the side each holder
//     was on decides which account they believe), the whisper of poison when a ruler dies;
//   - the version a person believes depends on how far they live from it (the far believe the tale), their opinion of
//     you (the hostile believe the twist) and their traits (the trusting believe anything, the cynical little);
//   - believing moves opinion: a person who believes you carried a woman out of a burning house likes you for it, and
//     likes you more if they believe the tale; one who believes you killed their brother hates you whether you did or
//     not. A correction takes the effect back;
//   - a court's beliefs about another realm's ruler weigh, a little, on what that realm thinks of the other (A.memSum,
//     so A.relBetween, A.aiWarCheck and A.interest all see it).
//
// State (all optional, so old saves load):
//   S.npcb = { v, n (next id), c: {id: claim}, ct: {realmId: {claimId: stance}}, nm: {personId: name}, dk: {pcId: deeds
//            seen}, wi (world-record entries read), y (last yearly step) }
//   claim  = [kind, subject, object, year, true (1/0), valence, extra]
//            D deed (extra: the words)          T tale of a deed (extra: the deed's claim id)  W twist of a deed (same)
//            L slander (extra: the words)       K killing (subject killed object; extra: the victim's name)
//            S secret (object: heresy|crime|oath|debt|affair)   B battle (subject: the winner they name; object: the
//            world-record entry; extra: [dead they name, account])   Z the truth of a beast (object: creature id)
//   p.nb   = {claimId: 1 | -1}  on a person (at most MAX, of them MAXB battles)
//   pc.nbk = {claimId: [stance, fromId, year]}  what the player believes (stance 2 / -2: knows it true / false)
// Engine paths only (the month hook, A.kill, event choices, interactions) draw dice or write; everything a view reads
// is pure.
(function () {
  const NB = A.NPCB = Object.assign(A.NPCB || {}, {
    V: 1,
    MAX: 8,          // beliefs one person holds
    MAXB: 2,         // ...of which about battles
    COURT: 10,       // beliefs a court holds
    COURTB: 3,       // ...of which about battles
    WEB: 140,        // the people around the player whose beliefs the yearly step moves
    LEAK: 0.03,      // a year's chance that a false belief held near its subject is seen through
    AI_ON: true,     // courts' beliefs weigh on realm opinion (A.memSum)
    AI_W: 0.5, AI_CAP: 12,
  });
  // runtime counters for tests and the bench (not saved)
  NB.stats = NB.stats || {};
  NB.resetStats = () => { for (const k of Object.keys(NB.stats)) if (/^corr_/.test(k)) delete NB.stats[k]; for (const k of ['adopt', 'flip', 'corr', 'told', 'leak', 'seedDeed', 'seedKill', 'seedBlame', 'seedBattle', 'seedSlander', 'seedCourt', 'news', 'pcHeard', 'courtCorr']) NB.stats[k] = 0; };
  NB.resetStats();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const low = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const clean = (s, n) => String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 120);
  NB.H = (...a) => { let h = 2166136261; const s = a.join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100003) / 100003; };
  NB.cap = cap; NB.low = low; NB.clean = clean;
  const has = (p, t) => !!(p && Array.isArray(p.traits) && p.traits.includes(t));
  NB.has = has;
  const round2 = n => { n = Math.max(0, Math.round(n || 0)); const p = Math.pow(10, Math.max(0, String(n).length - 2)); return Math.round(n / p) * p; };
  NB.round2 = round2;
  const KIN = new Set(['mother', 'father', 'sibling', 'child', 'grandparent', 'grandchild', 'uncle', 'nephew', 'cousin', 'spouse', 'inlaw']);
  const CLOSE = new Set(['friend', 'bestfriend', 'lover', 'spouse', 'betrothed', 'comrade']);
  NB.KIN = KIN; NB.CLOSE = CLOSE;

  // ---------------------------------------------------------------- state

  NB.peek = () => (A.S && A.S.npcb && typeof A.S.npcb === 'object' && A.S.npcb.c ? A.S.npcb : null);   // pure
  NB.st = function () {   // engine: creates what is missing
    const S = A.S; if (!S.npcb || typeof S.npcb !== 'object') S.npcb = {};
    const s = S.npcb;
    s.v = NB.V;
    for (const k of ['c', 'ct', 'nm', 'dk']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
    if (typeof s.n !== 'number' || !Number.isFinite(s.n)) s.n = 1;
    if (typeof s.wi !== 'number') s.wi = A.S.wrec && Array.isArray(A.S.wrec.e) ? A.S.wrec.e.length : 0;
    return s;
  };
  // a claim as an object (pure)
  NB.claim = function (id) {
    const s = NB.peek(), e = s && s.c[id];
    if (!Array.isArray(e)) return null;
    return { id: +id, k: e[0], s: e[1], o: e[2], y: e[3], t: e[4] ? 1 : 0, v: e[5] || 0, x: e[6] };
  };
  NB.name = function (id) {
    if (id == null) return '';
    const p = A.P(id); if (p) return A.fullName ? A.fullName(p, false) : p.given;
    const s = NB.peek(); if (s && s.nm[id]) return s.nm[id];
    if (A.WC && A.WC.name) { const n = A.WC.name(id); if (n) return n; }
    const r = A.realm && A.realm(id); return r ? r.short : '';
  };
  const keepName = id => { const s = NB.st(), p = A.P(id); if (p && !s.nm[id]) s.nm[id] = clean(A.fullName ? A.fullName(p, false) : p.given, 60); };
  // a new claim, or the same one if it exists (engine)
  NB.make = function (k, s, o, t, v, x, y) {
    const st = NB.st(), yr = y != null ? y : A.S.year;
    const xk = Array.isArray(x) ? x.join(',') : String(x == null ? '' : x);
    for (const id in st.c) {
      const e = st.c[id];
      if (e[0] === k && e[1] === s && e[2] === o && (Array.isArray(e[6]) ? e[6].join(',') : String(e[6] == null ? '' : e[6])) === xk && (k !== 'D' || e[3] === yr)) return +id;
    }
    const id = st.n++;
    const e = [k, s == null ? null : s, o == null ? null : o, yr, t ? 1 : 0, Math.round(v || 0), x == null ? null : x];
    while (e.length > 4 && e[e.length - 1] == null) e.pop();
    st.c[id] = e;
    if (typeof s === 'string' && A.P(s)) keepName(s);
    if (typeof o === 'string' && A.P(o)) keepName(o);
    return id;
  };
  // is this belief (a claim, held with this stance) false?
  NB.isFalse = (c, stance) => !!c && ((stance > 0 && !c.t) || (stance < 0 && c.t));

  // ---------------------------------------------------------------- what a claim says (pure)

  const SEC_TXT = {
    heresy: ['keeps the old rites at night and laughs at the faith', 'keep the old rites at night and laugh at the faith'],
    crime: ['has blood on {his} hands that the law never saw', 'have blood on your hands that the law never saw'],
    oath: ['broke {his} oath and lied about it after', 'broke your oath and lied about it after'],
    debt: ['owes more than {he} can ever pay', 'owe more than you can ever pay'],
    affair: ['is false to {his} marriage bed', 'are false to your marriage bed'],
  };
  NB.SEC_KINDS = Object.keys(SEC_TXT);
  const TWIST = [
    d => `that the story of how you ${d} is a lie you paid to have told`,
    d => `that someone else ${d}, and you took the credit`,
    d => `that you ${d}, but only for what it paid`,
  ];
  NB.taleText = function (c, base) {
    const t = base && base.x ? String(base.x) : '';
    let out = null;
    if (A.BT && typeof A.BT.tale === 'function') { try { out = A.BT.tale(t, base.s + '|' + base.y); } catch (e) { out = null; } }
    if (!out) {
      const h = Math.floor(NB.H(c.id, 'tale') * 1000);
      out = t.replace(/\b\d{1,3}(?:,\d{3})+\b|\b\d{2,}\b/g, m => A.fmt(round2(+m.replace(/,/g, '') * (2 + (h % 3)))));
      out = out.replace(/[.]?$/, '') + [', and with half the men', ', single-handed, some swear', ', and laughed while doing it', ', before breakfast, the story goes'][h % 4] + '.';
    }
    return String(out).replace(/[.]\s*$/, '');
  };
  // "that you carried an old woman out of a burning house" (you = the subject is the reader)
  NB.say = function (c, pc) {
    if (!c) return '';
    const you = !!(pc && c.s === pc.id), sub = NB.name(c.s) || 'someone', P = A.P(c.s);
    const he = P ? A.he(P) : 'they', his = P ? A.his(P) : 'their';
    const fill = s => s.replace(/\{his\}/g, his).replace(/\{he\}/g, he);
    if (c.k === 'D') return `that ${you ? 'you' : sub} ${low(clean(c.x, 120).replace(/[.]$/, ''))}`;
    if (c.k === 'T') { const b = NB.claim(c.x); return b ? `that ${you ? 'you' : sub} ${low(clean(NB.taleText(c, b), 140))}` : ''; }
    if (c.k === 'W') { const b = NB.claim(c.x); if (!b) return ''; const d = low(clean(b.x, 110).replace(/[.]$/, '')); const s = TWIST[Math.floor(NB.H(c.id, 'tw') * TWIST.length)](d); return you ? s : s.replace(/\byou took\b/, `${sub} took`).replace(/\byou paid\b/, `${sub} paid`).replace(/^that you\b/, `that ${sub}`).replace(/how you\b/, `how ${sub}`); }
    if (c.k === 'L') { const s = clean(c.x, 120); return you ? s : s.replace(/\byou are\b/g, `${sub} is`).replace(/\byour\b/g, his).replace(/\byou\b/g, sub); }
    if (c.k === 'K') return `that ${you ? 'you' : sub} killed ${clean(c.x || NB.name(c.o) || 'someone', 60)}${c.y ? ' in ' + c.y : ''}`;
    if (c.k === 'S') { const T = SEC_TXT[c.o]; return T ? `that ${you ? 'you ' + T[1] : sub + ' ' + fill(T[0])}` : ''; }
    if (c.k === 'B') {
      const e = A.WC && A.WC.ent ? A.WC.ent(c.o) : null, place = e && e.p != null && A.S.prov[e.p] ? A.S.prov[e.p].name : 'the field';
      const x = Array.isArray(c.x) ? c.x : [0];
      return `that ${A.realmShort ? A.realmShort(c.s) : c.s} won at ${place}${e ? ' in ' + e.y : ''}, and some ${A.fmt(x[0] || 0)} fell`;
    }
    if (c.k === 'Z') { const z = (typeof LORE !== 'undefined' ? LORE.creatures : []).find(q => q.id === c.o); return z ? `the truth of the ${z.name.replace(/^The /, '')}` : ''; }
    return '';
  };
  NB.secText = (k, P, you) => { const T = SEC_TXT[k]; if (!T) return ''; return you ? T[1] : T[0].replace(/\{his\}/g, A.his(P)).replace(/\{he\}/g, A.he(P)); };

  // ---------------------------------------------------------------- the truth of secrets

  // bonds' secret kinds, as the claims name them
  const SEC_MAP = { debt: 'debt', affair: 'affair', bastard: 'affair', heresy: 'heresy', crime: 'crime', embezzle: 'oath', desert: 'oath', lore: 'crime', deed: 'crime' };
  NB.secOf = function (t) {   // what t really hides, as a claim kind (pure)
    if (!t) return null;
    if (A.BONDS && A.BONDS.SEC && typeof A.BONDS.SEC.of === 'function') { const s = A.BONDS.SEC.of(t); return s ? SEC_MAP[s.k] || null : null; }
    const h = NB.H(t.id, 'nbsec');
    return h < 0.3 ? NB.SEC_KINDS[Math.floor(h / 0.3 * NB.SEC_KINDS.length)] : null;
  };
  // and for the player: the secrets of yours that 55-bonds keeps (pure)
  NB.pcSecret = function (pc, kind) {
    const mine = A.BONDS && A.BONDS.SEC && A.BONDS.SEC.mine ? A.BONDS.SEC.mine(pc) : [];
    return mine.some(s => s && SEC_MAP[s.k] === kind);
  };
  NB.secTrue = (t, kind, pc) => (pc && t && t.id === pc.id ? NB.pcSecret(pc, kind) : NB.secOf(t) === kind);
  const SEC_V = { heresy: -8, crime: -12, oath: -10, debt: -5, affair: -6 };
  NB.SEC_V = SEC_V;

  // ---------------------------------------------------------------- holding a belief

  // how far a person lives from the player: 0 the same town, 1 the same realm, 2 a neighbour, 3 further (pure)
  NB.dist = function (h, pc) {
    if (!h || !pc) return 3;
    if (h.home != null && h.home === pc.home) return 0;
    if (h.realm === pc.realm) return 1;
    const nb = A.neighbors ? A.neighbors(pc.realm) || [] : [];
    return nb.includes(h.realm) ? 2 : 3;
  };
  // their opinion of the player (pure)
  NB.opOf = (pc, t) => (t && t.rel && t.rel[pc.id] ? t.rel[pc.id].op || 0 : pc && pc.rel && t && pc.rel[t.id] ? (pc.rel[t.id].op || 0) * 0.8 : 0);
  // how much a belief moves this holder's opinion (pure: the same when it is taken back)
  NB.factor = function (h, c) {
    let f = 1;
    if (c.v < 0) { if (has(h, 'vengeful')) f *= 1.3; if (has(h, 'forgiving')) f *= 0.7; }
    if (c.k === 'K') { const r = h.rel && h.rel[c.o]; if (r && (KIN.has(r.type) || CLOSE.has(r.type))) f *= 1.6; else if (!r) f *= 0.6; }
    if (c.k === 'S' && c.o === 'heresy') { if (has(h, 'zealous')) f *= 1.5; if (has(h, 'cynical')) f *= 0.5; }
    return f;
  };
  const eff = (c, stance) => (stance > 0 ? c.v : 0);
  // what a belief does to the holder's opinion of its subject (engine)
  NB.moveOp = function (h, c, d) {
    if (!d || !h || !c) return;
    const pc = A.pc(), f = NB.factor(h, c);
    if (pc && c.s === pc.id) {
      if (h.rel && h.rel[pc.id]) h.rel[pc.id].op = clamp((h.rel[pc.id].op || 0) + d * f, -100, 100);
      if (pc.rel && pc.rel[h.id]) pc.rel[h.id].op = clamp((pc.rel[h.id].op || 0) + d * f, -100, 100);
    } else if (h.rel && c.s != null && h.rel[c.s]) h.rel[c.s].op = clamp((h.rel[c.s].op || 0) + d * f * 0.6, -100, 100);
  };
  // keep a person's beliefs within MAX (and MAXB of battles): the oldest and lightest go first
  const trim = function (m, keep, max, maxB) {
    const ids = Object.keys(m);
    const bat = ids.filter(id => { const c = NB.claim(id); return c && c.k === 'B'; });
    const drop = (list, n) => {
      const pcId = (A.pc() || {}).id;
      const w = c => (c ? Math.abs(c.v) + c.y / 50 + (c.s === pcId ? 20 : 0) : 0);   // beliefs about the player are kept longest
      const L = list.filter(id => String(id) !== String(keep)).map(id => ({ id, c: NB.claim(id) })).sort((a, b) => w(a.c) - w(b.c) || String(a.id).localeCompare(String(b.id)));
      for (let i = 0; i < n && i < L.length; i++) delete m[L[i].id];
    };
    if (bat.length > maxB) drop(bat, bat.length - maxB);
    const n = Object.keys(m).length;
    if (n > max) drop(Object.keys(m), n - max);
  };
  // engine: h comes to hold claim cid with this stance; their opinion moves by what changed
  NB.adopt = function (h, cid, stance, why) {
    if (!h || !h.alive || !stance) return false;
    const c = NB.claim(cid); if (!c) return false;
    const pc = A.pc();
    if (pc && h.id === pc.id) return NB.pcHear(pc, cid, stance, null);
    if (c.s === h.id && c.k !== 'B') return false;          // nobody needs telling what they did themselves
    const m = h.nb && typeof h.nb === 'object' && !Array.isArray(h.nb) ? h.nb : (h.nb = {});
    const prev = m[cid] || 0;
    if (prev === stance) return false;
    m[cid] = stance;
    trim(m, cid, NB.MAX, NB.MAXB);
    if (m[cid] !== stance) return false;
    NB.moveOp(h, c, eff(c, stance) - eff(c, prev));
    NB.stats.adopt++;
    if (prev) { NB.stats.flip++; if (NB.isFalse(c, prev) && !NB.isFalse(c, stance)) { NB.stats.corr++; NB.stats['corr_' + (why || 'other')] = (NB.stats['corr_' + (why || 'other')] || 0) + 1; } }
    return true;
  };
  NB.held = (h, cid) => (h && h.nb && h.nb[cid]) || 0;   // pure
  // the beliefs a person holds, as [{c, st}] (pure)
  NB.beliefs = function (h) {
    if (!h || !h.nb || typeof h.nb !== 'object') return [];
    const out = [];
    for (const id of Object.keys(h.nb)) { const c = NB.claim(id); if (c && h.nb[id]) out.push({ c, st: h.nb[id] }); }
    return out;
  };
  // a court: the realm's beliefs as one body (engine)
  NB.courtAdopt = function (rid, cid, stance) {
    if (!rid || !A.realm(rid) || !stance || !NB.claim(cid)) return false;
    const st = NB.st(), m = st.ct[rid] && typeof st.ct[rid] === 'object' ? st.ct[rid] : (st.ct[rid] = {});
    if (m[cid] === stance) return false;
    m[cid] = stance;
    trim(m, cid, NB.COURT, NB.COURTB);
    NB.stats.adopt++;
    return m[cid] === stance;
  };
  NB.court = rid => { const s = NB.peek(); return s && s.ct[rid] ? Object.keys(s.ct[rid]).map(id => ({ c: NB.claim(id), st: s.ct[rid][id] })).filter(x => x.c) : []; };

  // ---------------------------------------------------------------- what the player believes

  // pc.nbk: {claimId: [stance, from, year]}; stance 1 / -1 believed / doubted on someone's word, 2 / -2 known
  NB.pcState = pc => (pc.nbk && typeof pc.nbk === 'object' && !Array.isArray(pc.nbk) ? pc.nbk : (pc.nbk = {}));
  NB.pcHeld = (pc, cid) => { const m = pc && pc.nbk; return m && Array.isArray(m[cid]) ? m[cid][0] : 0; };   // pure
  NB.pcHear = function (pc, cid, stance, from) {
    const c = NB.claim(cid); if (!c || !pc) return false;
    if (c.s === pc.id && c.k !== 'B') return false;
    const m = NB.pcState(pc), cur = m[cid] ? m[cid][0] : 0;
    if (Math.abs(cur) === 2 || cur === stance) return false;
    m[cid] = [stance, from || null, A.S.year];
    const ks = Object.keys(m);
    if (ks.length > 16) { const old = ks.filter(k => k !== String(cid)).sort((a, b) => (m[a][2] - m[b][2]) || (+a - +b))[0]; delete m[old]; }
    NB.stats.pcHeard++;
    return true;
  };
  // the player finds out the truth (engine); returns 'wrong' when they had believed the opposite
  NB.pcLearn = function (pc, cid, from) {
    const c = NB.claim(cid); if (!c || !pc) return '';
    const m = NB.pcState(pc), cur = m[cid] ? m[cid][0] : 0;
    m[cid] = [c.t ? 2 : -2, from || (m[cid] && m[cid][1]) || null, A.S.year];
    if (NB.isFalse(c, cur)) { pc.flags.nb_was_wrong = A.S.year; return 'wrong'; }
    return '';
  };
  // does the player know whether this claim is true? (pure) null when they cannot say
  NB.pcKnows = function (pc, c) {
    if (!pc || !c) return null;
    if (c.s === pc.id && 'DTWLKS'.includes(c.k)) return true;
    const st = NB.pcHeld(pc, c.id);
    if (Math.abs(st) === 2) return true;
    if (c.k === 'K') { const s = NB.peek(); if (s) for (const id in s.c) { const e = s.c[id]; if (e[0] === 'K' && e[1] === pc.id && e[2] === c.o && e[4]) return true; } }
    if (c.k === 'S' && A.BONDS && A.BONDS.SEC && A.BONDS.SEC.known) { const t = A.P(c.s), k = t ? A.BONDS.SEC.known(pc, t) : null; if (k && SEC_MAP[k.k] === c.o) return true; }
    if (c.k === 'B') {
      const e = A.WC && A.WC.ent ? A.WC.ent(c.o) : null; if (!e) return null;
      if ((e.w || []).includes(pc.id)) return true;
      const near = [e.a, e.b];
      if (near.includes(pc.realm)) return true;
      const nb = A.neighbors ? A.neighbors(pc.realm) || [] : [];
      return near.some(r => nb.includes(r)) ? true : null;
    }
    if (c.k === 'Z' && A.BT) return A.BT.level(pc, c.o) >= 3 ? true : null;
    return null;
  };

  // ---------------------------------------------------------------- the people around the player (engine and pure)

  // the people whose beliefs move: the grown people the player knows and those close to them, in a stable order
  NB.web = function (pc) {
    if (!pc || !pc.rel) return [];
    const seen = new Set([String(pc.id)]), out = [];
    const add = p => { if (p && p.alive && !seen.has(String(p.id)) && A.isAdult(p) && out.length < NB.WEB) { seen.add(String(p.id)); out.push(p); } };
    const first = Object.keys(pc.rel).sort().map(A.P);
    for (const p of first) add(p);
    for (const p of first) if (p && p.alive) for (const x of NB.contacts(p)) add(x);
    return out;
  };
  // the people someone talks to: their close circle (41-circles), or their friends and kin (pure)
  NB.contacts = function (h, within) {
    if (!h || !h.rel) return [];
    let L = A.CIRCLES && A.CIRCLES.close ? A.CIRCLES.close(h) : [];
    if (!L.length) L = Object.keys(h.rel).filter(id => { const r = h.rel[id]; return r && (CLOSE.has(r.type) || KIN.has(r.type)) && (r.op || 0) >= 10; }).map(A.P);
    return L.filter(x => x && x.alive && x.id !== h.id && A.isAdult(x) && (!within || within.has(String(x.id)))).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  };

  // ---------------------------------------------------------------- where claims come from

  // which version of a deed someone believes: the truth near home and among the honest, the tale far off and among the
  // trusting, the twist among those who hate you (engine)
  NB.version = function (h, pc, ids) {
    const d = NB.dist(h, pc), o = NB.opOf(pc, h), tr = k => has(h, k);
    const wD = [3, 1.6, 0.9, 0.5][d] * (tr('honest') ? 1.4 : 1) * (tr('cynical') ? 1.3 : 1) * (tr('curious') ? 1.2 : 1) * (tr('trusting') ? 0.7 : 1);
    const wT = [0.35, 0.9, 1.4, 1.9][d] * (tr('trusting') ? 2 : 1) * (tr('cynical') ? 0.4 : 1) * (tr('gregarious') ? 1.2 : 1) * (o > 20 ? 1.3 : 1);
    const wW = (o < -10 ? 0.4 + Math.min(1.6, -o / 40) : 0.06) * [0.7, 1, 1.2, 1.3][d] * (tr('paranoid') ? 1.6 : 1) * (tr('cruel') ? 1.3 : 1) * (tr('vengeful') ? 1.3 : 1) * (tr('trusting') ? 1.2 : 1) * (tr('kind') ? 0.6 : 1) * (tr('forgiving') ? 0.6 : 1);
    const L = [{ id: ids.D, w: wD }, { id: ids.T, w: wT }, { id: ids.W, w: wW }];
    const x = A.wpick(L, z => z.w);
    return x ? x.id : ids.D;
  };
  // a deed of the player's becomes three claims, and the word goes out (engine). A shameful deed (sign -1) has no
  // twist, and its tale is worse than the truth.
  NB.rumourDeed = function (pc, text, y, web, sign) {
    text = clean(text, 100); if (!text) return null;
    const bad = sign < 0;
    const D = NB.make('D', pc.id, null, 1, bad ? -6 : 6, text, y), T = NB.make('T', pc.id, null, 0, bad ? -10 : 10, D, y), W = bad ? null : NB.make('W', pc.id, null, 0, -8, D, y);
    const ids = { D, T, W: W || T }, fame = Math.max(0, pc.fame || 0);
    for (const h of web || NB.web(pc)) {
      const r = pc.rel[h.id], kin = r && KIN.has(r.type), d = NB.dist(h, pc);
      let p = [0.65, 0.4, 0.2, 0.1][d] * (1 + fame / 50) * (has(h, 'gregarious') ? 1.3 : 1) * (has(h, 'shy') ? 0.7 : 1);
      if (kin) p = Math.max(p, 0.85);
      if (!A.chance(clamp(p, 0.02, 0.95))) continue;
      NB.adopt(h, kin && A.chance(0.7) ? D : NB.version(h, pc, ids), 1, 'deed');
    }
    // courts: the player's own, and the neighbours', once the player is someone
    if (fame >= 25 || pc.ruler || ['noble', 'royal'].includes(pc.status)) {
      if (A.chance(0.8)) NB.courtAdopt(pc.realm, D, 1);
      for (const rid of (A.neighbors ? A.neighbors(pc.realm) || [] : []).slice().sort()) {
        if (!A.realm(rid) || !A.realm(rid).alive || !A.chance(0.5)) continue;
        const rel = A.relBetween ? A.relBetween(rid, pc.realm) : 0;
        const x = A.wpick([{ id: D, w: 1 }, { id: T, w: 1.4 }, { id: ids.W, w: rel < -20 ? 1.5 : 0.2 }], z => z.w);
        NB.courtAdopt(rid, x.id, 1);
      }
    }
    NB.stats.seedDeed++;
    return ids;
  };
  // a public act in a scene (one that made the player better known) is a deed people talk of, whether or not the
  // release writes it into pc.deeds: "pulled Odo out, in the matter of the flooded mill" (engine, from A.eventChoose)
  NB.sceneDeed = function (pc, title, label, df, dh) {
    if (!(df >= 1) || !pc || !A.isAdult(pc)) return null;
    let d = A.BONDS && A.BONDS.deedOf ? A.BONDS.deedOf(label || '', false) : null;
    d = d ? d.replace(/^you\s+/, '') : null;
    // the title is cited only when it is plainly a thing ("The flooded mill", "A letter in an old hand")
    const t0 = clean(title || '', 60), art = /^(the|a|an)\s+/i.test(t0), ttl = art ? 'the ' + low(t0.replace(/^(the|a|an)\s+/i, '')) : '';
    if (!d && !ttl) return null;
    const text = d ? (ttl ? `${d}, in the matter of ${ttl}` : d) : `did what you did in the matter of ${ttl}`;
    if (/\byou\b|\byour\b/i.test(d || '')) return null;
    return NB.rumourDeed(pc, cap(text), A.S.year, null, dh <= -3 ? -1 : 1);
  };
  NB.seedDeeds = function (pc, web) {
    const st = NB.st(), key = String(pc.id), list = Array.isArray(pc.deeds) ? pc.deeds : [];
    if (st.dk[key] == null || st.dk[key] > list.length) { st.dk[key] = list.length; return; }   // a new life, or an old save
    const fresh = list.slice(st.dk[key]); st.dk[key] = list.length;
    for (const d of fresh.slice(-3)) if (d && d.t) NB.rumourDeed(pc, d.t, d.y != null ? d.y : A.S.year, web);
  };

  // the dead: kin and friends look for someone to blame; a killing the player did is known by some (engine)
  const SUSPECT = /poison|whisper|knife|dark|strangl|drown|fall|wound/i, PLAIN_OLD = /old age|heart|stroke/i;
  NB.onDeath = function (pc, v, cause, how) {
    if (!pc || !v || !pc.rel || !pc.rel[v.id] || !A.isAdult(v)) return;
    const name = clean(A.fullName ? A.fullName(v, false) : v.given, 60);
    const near = Object.keys(v.rel || {}).filter(id => { const r = v.rel[id]; return r && (KIN.has(r.type) || CLOSE.has(r.type)); }).sort().map(A.P).filter(x => x && x.alive && x.id !== pc.id && A.isAdult(x));
    const knew = Object.keys(pc.rel).sort().map(A.P).filter(x => x && x.alive && x.id !== v.id && A.isAdult(x) && x.rel && x.rel[v.id] && !near.includes(x));
    if (how) {
      // the player did it: a duel is seen by all; a murder by few (and by whoever 55-bonds says saw it)
      const cid = NB.make('K', pc.id, v.id, 1, how === 'duel' ? -6 : -12, name);
      const wit = new Set();
      if (A.BONDS && A.BONDS.SEC && A.BONDS.SEC.mine) for (const s of A.BONDS.SEC.mine(pc)) if (s && s.k === 'crime' && s.y === A.S.year && String(s.t).includes(v.given)) for (const id of s.know || []) wit.add(String(id));
      const pK = how === 'duel' ? 0.85 : 0.15, pO = how === 'duel' ? 0.5 : 0.05;
      for (const h of near) if (wit.has(String(h.id)) || A.chance(pK)) NB.adopt(h, cid, 1, 'kill');
      for (const h of knew) if (wit.has(String(h.id)) || A.chance(pO)) NB.adopt(h, cid, 1, 'kill');
      NB.stats.seedKill++;
      return;
    }
    const sus = SUSPECT.test(String(cause || ''));
    if (!sus && (A.stage(v) === 'old' || PLAIN_OLD.test(String(cause || '')))) return;
    // who might be blamed: the player, if there was bad blood; the dead one's own foes
    const bad = r => r && ((r.op || 0) <= -20 || r.type === 'enemy' || r.type === 'rival');
    const cand = [];
    if (pc.alive && (bad(pc.rel[v.id]) || bad(v.rel && v.rel[pc.id]))) cand.push({ id: pc.id, w: 2 });
    for (const id of Object.keys(v.rel || {}).sort()) { const r = v.rel[id], f = A.P(id); if (f && f.alive && id !== String(pc.id) && A.isAdult(f) && (r.type === 'enemy' || r.type === 'rival')) cand.push({ id: f.id, w: 1 }); }
    if (!cand.length || !A.chance(sus ? 0.7 : 0.3)) return;
    const who = A.wpick(cand, z => z.w);
    const cid = NB.make('K', who.id, v.id, 0, -10, name);
    let top = null, topW = 0;
    for (const h of near.concat(knew)) {
      if (h.id === who.id) continue;
      const kin = near.includes(h);
      let p = (kin ? 0.5 : 0.25) + (has(h, 'paranoid') ? 0.25 : 0) + (has(h, 'trusting') ? 0.2 : 0) - (has(h, 'cynical') ? 0.2 : 0) - (has(h, 'just') ? 0.1 : 0);
      const o = h.rel && h.rel[who.id] ? h.rel[who.id].op || 0 : 0;
      if (o <= -20) p += 0.2; else if (o >= 30) p -= 0.25;
      if (A.chance(clamp(p, 0.05, 0.9)) && NB.adopt(h, cid, 1, 'blame') && kin && (!top || p > topW)) { top = h; topW = p; }
    }
    NB.stats.seedBlame++;
    // someone who blames the player and whom the player does not know yet: they will make themselves known
    if (who.id === pc.id && top && !pc.rel[top.id] && A.link) {
      A.link(pc, top, 'acquaint', -10, 'acquaint');
      A.log(`At the burying of ${v.given}, ${top.given} will not stand near you. ${cap(A.he(top))} thinks you had a hand in it.`, 'muted');
    }
  };

  // the slander of 21-npc-initiative's move becomes a claim the slanderer and their friends hold (engine)
  NB.slander = function (pc, t, text) {
    if (!pc || !t || !text) return null;
    const cid = NB.make('L', pc.id, null, 0, -8, clean(text, 100));
    NB.adopt(t, cid, 1, 'slander');
    for (const x of NB.contacts(t)) if (x.id !== pc.id && A.chance(0.5)) NB.adopt(x, cid, 1, 'slander');
    NB.stats.seedSlander++;
    return cid;
  };
  // the hostile invent: once in a while someone who hates the player tells a story of a secret sin (engine)
  NB.slanderYear = function (pc, web) {
    for (const h of web) {
      const o = NB.opOf(pc, h);
      if (o > -25 || !(has(h, 'deceitful') || has(h, 'cruel') || has(h, 'vengeful') || has(h, 'wrathful') || has(h, 'paranoid'))) continue;
      if (!A.chance(0.1)) continue;
      const kind = A.pick(['heresy', 'crime', 'oath', 'debt']);
      const cid = NB.make('S', pc.id, kind, NB.pcSecret(pc, kind) ? 1 : 0, SEC_V[kind]);
      NB.adopt(h, cid, 1, 'slander');
      for (const x of NB.contacts(h).slice(0, 3)) if (x.id !== pc.id && A.chance(0.45)) NB.adopt(x, cid, 1, 'slander');
      NB.stats.seedSlander++;
    }
  };
  // what people say of each other: those close to someone with a real secret may know it; the deceitful and the
  // hostile invent one for a foe (engine)
  NB.othersYear = function (pc, web) {
    for (const h of web) {
      if (!A.chance(0.1)) continue;
      // a foe of theirs, or a close one; someone the player knows
      const foes = Object.keys(h.rel || {}).filter(id => { const r = h.rel[id]; return r && pc.rel[id] && (r.type === 'enemy' || r.type === 'rival' || (r.op || 0) <= -30); }).sort().map(A.P).filter(x => x && x.alive && x.id !== pc.id && A.isAdult(x));
      const close = NB.contacts(h).filter(x => x.id !== pc.id && pc.rel[x.id]);
      const liar = has(h, 'deceitful') || has(h, 'cruel') || has(h, 'paranoid');
      let t = null, kind = null;
      if (foes.length && (liar || A.chance(0.4))) { t = A.pick(foes); kind = A.chance(0.4) && NB.secOf(t) ? NB.secOf(t) : A.pick(NB.SEC_KINDS); }
      else if (close.length) { t = A.pick(close); kind = NB.secOf(t); if (!kind) continue; }
      if (!t || !kind) continue;
      const cid = NB.make('S', t.id, kind, NB.secOf(t) === kind ? 1 : 0, SEC_V[kind]);
      NB.adopt(h, cid, 1, 'gossip');
    }
  };

  // battles: each side believes its own chronicle; the far believe the inflated count; veterans saw the truth (engine)
  NB.battleClaim = function (i, acct) {
    const e = A.WC.ent(i); if (!e || e.k !== 'battle') return null;
    const dead = Array.isArray(e.x) ? +e.x[0] || 0 : 0;
    const f = (lo, span, salt) => lo + Math.floor(NB.H(i, salt) * span * 10) / 10;
    let W = e.a, n = round2(dead);
    if (acct === 'V') n = round2(dead * f(1.6, 0.9, 'v'));
    else if (acct === 'L') { if (NB.H(i, 'flip') < 0.45) W = e.b; n = round2(dead * f(1.2, 0.6, 'l')); }
    else if (acct === 'F') n = round2(dead * f(1.6, 1.4, 'f'));
    const t = W === e.a && Math.abs(n - dead) <= Math.max(50, dead * 0.25) ? 1 : 0;
    return NB.make('B', W, i, t, 0, [n, acct], e.y);
  };
  NB.seedBattles = function (pc, web) {
    const st = NB.st(), R = A.S.wrec;
    if (!A.WC || !A.WC.ent || !R || !Array.isArray(R.e)) return;
    if (st.wi > R.e.length) st.wi = R.e.length;
    const fresh = [];
    for (let i = st.wi; i < R.e.length; i++) if (R.e[i] && R.e[i][0] === 'battle') fresh.push(i);
    st.wi = R.e.length;
    if (!fresh.length) return;
    const nbr = new Set([pc.realm].concat(A.neighbors ? A.neighbors(pc.realm) || [] : []));
    const webRealms = new Set(web.map(h => h.realm));
    const rel = i => { const e = A.WC.ent(i); return (nbr.has(e.a) || nbr.has(e.b) ? 3 : 0) + (webRealms.has(e.a) || webRealms.has(e.b) ? 1 : 0) + (e.w || []).includes(pc.id) * 5 + (e.n || 0) / 100000; };
    const pick = fresh.slice().sort((a, b) => rel(b) - rel(a) || a - b).slice(0, 6).sort((a, b) => a - b);
    for (const i of pick) {
      const e = A.WC.ent(i);
      const V = NB.battleClaim(i, 'V'), L = NB.battleClaim(i, 'L'), T = NB.battleClaim(i, 'T'), F = NB.battleClaim(i, 'F');
      if (A.realm(e.a)) NB.courtAdopt(e.a, V, 1);
      if (A.realm(e.b)) NB.courtAdopt(e.b, L, 1);
      const nA = new Set(A.neighbors ? (A.neighbors(e.a) || []).concat(A.neighbors(e.b) || []) : []);
      for (const h of web) {
        const vet = !!(h.mil || h.veteran);
        if (h.realm === e.a) { if (A.chance(0.6)) NB.adopt(h, vet && A.chance(0.4) ? T : V, 1, 'battle'); }
        else if (h.realm === e.b) { if (A.chance(0.6)) NB.adopt(h, vet && A.chance(0.4) ? T : L, 1, 'battle'); }
        else if (nA.has(h.realm)) { if (A.chance(0.3)) NB.adopt(h, A.chance(0.5) ? T : F, 1, 'battle'); }
        else if (A.chance(0.1)) NB.adopt(h, A.chance(0.3) ? T : F, 1, 'battle');
      }
      // a battle the player fought in is one of their deeds as well
      if ((e.w || []).includes(pc.id)) {
        const place = e.p != null && A.S.prov[e.p] ? A.S.prov[e.p].name : 'the field';
        NB.rumourDeed(pc, `Fought at ${place}, where ${A.fmt(round2(Array.isArray(e.x) ? e.x[0] : 0))} fell`, e.y, web);
      }
      NB.stats.seedBattle++;
    }
  };

  // courts: what each realm's court believes of the rulers it deals with (engine, once a year)
  NB.slanderRuler = function (a, b, warTime) {
    const rb = A.realm(b), ru = rb && A.P(rb.ruler);
    if (!ru || !ru.alive || ru.id === (A.pc() || {}).id && !warTime) return null;
    const real = NB.secOf(ru);
    const kind = real && A.chance(0.35) ? real : A.pick(NB.SEC_KINDS);
    const cid = NB.make('S', ru.id, kind, real === kind ? 1 : 0, SEC_V[kind]);
    NB.courtAdopt(a, cid, 1);
    NB.stats.seedCourt++;
    return cid;
  };
  NB.courtYear = function () {
    const S = A.S, st = NB.st();
    const live = Object.keys(S.realms).filter(id => S.realms[id].alive && !S.realms[id].isRebel).sort();
    const foes = {};
    for (const w of S.wars || []) for (const x of w.att) for (const y of w.def) { (foes[x] = foes[x] || new Set()).add(y); (foes[y] = foes[y] || new Set()).add(x); }
    for (const a of live) {
      const F = foes[a] ? [...foes[a]].sort() : [];
      for (const b of F) if (A.realm(b) && A.chance(0.2)) NB.slanderRuler(a, b, true);
      for (const b of (A.neighbors ? A.neighbors(a) || [] : []).slice().sort()) if (!F.includes(b) && A.realm(b) && A.realm(b).alive && A.chance(0.025)) NB.slanderRuler(a, b, false);
    }
    // news and envoys: a court sees through a false belief now and then; beliefs about the dead and the old fade
    for (const rid of Object.keys(st.ct).sort()) {
      const m = st.ct[rid];
      if (!A.realm(rid) || !A.realm(rid).alive) { delete st.ct[rid]; continue; }
      for (const id of Object.keys(m)) {
        const c = NB.claim(id);
        if (!c || S.year - c.y > 25) { delete m[id]; continue; }
        if (c.k === 'S' || c.k === 'K') { const s = A.P(c.s); if (!s || !s.alive) { delete m[id]; continue; } }
        if (NB.isFalse(c, m[id]) && A.chance(0.08)) { m[id] = -m[id]; NB.stats.courtCorr = (NB.stats.courtCorr || 0) + 1; }
      }
    }
  };
  // a court's word reaches the realm's people: each year a few of those around the player take up one of its beliefs
  NB.newsYear = function (pc, web) {
    const st = NB.st();
    for (const h of web) {
      const m = st.ct[h.realm]; if (!m) continue;
      const p = ['noble', 'royal', 'gentry'].includes(h.status) || h.office ? 0.3 : 0.06;
      if (!A.chance(p)) continue;
      const ids = Object.keys(m).filter(id => !NB.held(h, id)).sort((a, b) => +a - +b);
      if (!ids.length) continue;
      const id = A.pick(ids);
      if (NB.adopt(h, +id, m[id], 'news')) NB.stats.news++;
    }
  };
  // the whisper of poison when a ruler dies: the heir is suspected abroad, rarely at home (engine)
  if (typeof A.rulerDies === 'function') {
    const rulerDies = A.rulerDies;
    A.rulerDies = function (r, cause) {
      const old = r && A.P(r.ruler);
      const next = rulerDies.apply(this, arguments);
      try {
        if (r && old && next && next.id !== old.id && /poison|whisper|knife|dark/i.test(String(cause || '')) && A.S && A.S.npcb) {
          const cid = NB.make('K', next.id, old.id, NB.H(old.id, 'whisper') < 0.35 ? 1 : 0, -10, clean(A.fullName ? A.fullName(old, false) : old.given, 60));
          for (const rid of (A.neighbors ? A.neighbors(r.id) || [] : []).slice().sort()) if (A.realm(rid) && A.chance(0.5)) NB.courtAdopt(rid, cid, 1);
          if (A.chance(0.15)) NB.courtAdopt(r.id, cid, 1);
          const pc = A.pc();
          if (pc) for (const h of NB.web(pc)) if (h.realm === r.id && A.chance(0.3)) NB.adopt(h, cid, 1, 'whisper');
        }
      } catch (e) { console.error('npc-beliefs ruler', e); }
      return next;
    };
  }

  // ---------------------------------------------------------------- deaths: the dead hold nothing; a death may start a story

  const kill = A.kill;
  A.kill = function (p, cause) {
    const was = !!(p && p.alive), pc = A.pc();
    const b = A.BONDS && A.BONDS.blameCtx;
    let how = b && p && b.pid === String(p.id) ? b.how : null;
    const res = kill.apply(this, arguments);
    try {
      if (was && p && !p.alive) {
        if (p.nb) delete p.nb;
        if (!how && pc && !A.BONDS && /^a fight with /.test(String(cause || '')) && A.fullName && String(cause).includes(A.fullName(pc, false))) how = 'duel';
        if (pc && pc.alive && p.id !== pc.id && A.S.npcb) NB.onDeath(pc, p, cause, how);
      }
    } catch (e) { console.error('npc-beliefs kill', e); }
    return res;
  };

  // a first meeting: what someone already believes of the player colours the bond from its first day (engine)
  NB.firstOp = function (t, pc) {
    let d = 0;
    for (const x of NB.beliefs(t)) if (x.c.s === pc.id && x.st > 0 && x.c.k !== 'B') d += x.c.v * NB.factor(t, x.c);
    return clamp(d, -30, 30);
  };
  if (typeof A.link === 'function') {
    const link = A.link;
    A.link = function (a, b) {
      const pc = A.S ? A.P(A.S.pc) : null;
      const t = pc && a && b && a.id !== b.id ? (a.id === pc.id ? b : b.id === pc.id ? a : null) : null;
      const isNew = !!(t && t.nb && !(pc.rel && pc.rel[t.id]) && !(t.rel && t.rel[pc.id]));
      const r = link.apply(this, arguments);
      try {
        if (isNew) {
          const d = NB.firstOp(t, pc);
          if (d) for (const [x, y] of [[pc, t], [t, pc]]) if (x.rel && x.rel[y.id]) x.rel[y.id].op = clamp((x.rel[y.id].op || 0) + d, -100, 100);
        }
      } catch (e) { console.error('npc-beliefs link', e); }
      return r;
    };
  }

  // ---------------------------------------------------------------- tidying: claims nobody holds go; names with them

  NB.gc = function () {
    const S = A.S, st = NB.st(), refs = new Set();
    for (const id in S.people) {
      const p = S.people[id];
      if (!p.alive && String(p.id) !== String(S.pc)) { if (p.nb) delete p.nb; if (p.nbk) delete p.nbk; continue; }
      if (p.nb && typeof p.nb !== 'object') delete p.nb;
      if (p.nb) { for (const k of Object.keys(p.nb)) { if (!st.c[k] || !p.nb[k]) delete p.nb[k]; else refs.add(String(k)); } if (!Object.keys(p.nb).length) delete p.nb; }
      if (p.nbk && typeof p.nbk === 'object') for (const k of Object.keys(p.nbk)) { if (!st.c[k] || !Array.isArray(p.nbk[k])) delete p.nbk[k]; else refs.add(String(k)); }
    }
    for (const rid in st.ct) for (const k of Object.keys(st.ct[rid])) { if (!st.c[k]) delete st.ct[rid][k]; else refs.add(String(k)); }
    // a tale or a twist keeps its deed; the queue keeps what a waiting scene is about
    for (const k of [...refs]) { const e = st.c[k]; if (e && (e[0] === 'T' || e[0] === 'W') && e[6] != null) refs.add(String(e[6])); }
    for (const q of (S.queue || []).concat((S.sched || []).map(x => x.item))) if (q && q.ctx && q.ctx.cid != null) refs.add(String(q.ctx.cid));
    for (const k of Object.keys(st.c)) if (!refs.has(k) && st.c[k][3] < S.year) delete st.c[k];
    const names = new Set();
    for (const k in st.c) { const e = st.c[k]; if (typeof e[1] === 'string') names.add(e[1]); if (typeof e[2] === 'string') names.add(e[2]); }
    for (const k of Object.keys(st.nm)) if (!names.has(k)) delete st.nm[k];
    for (const k of Object.keys(st.dk)) if (!S.people[k]) delete st.dk[k];
  };

  // ---------------------------------------------------------------- the realm's view: courts weigh on realm opinion

  // what a's court believes of b's ruler, in opinion points, small and capped (pure)
  NB.courtView = function (a, b) {
    const s = NB.peek(); if (!s) return 0;
    const m = s.ct[a]; if (!m) return 0;
    const rb = A.realm(b), ru = rb && rb.ruler; if (!ru) return 0;
    let sum = 0;
    for (const id in m) {
      if (m[id] <= 0) continue;
      const e = s.c[id]; if (!e || e[1] !== ru) continue;
      if ('SKDTWL'.includes(e[0])) sum += e[5] || 0;
    }
    return sum ? Math.round(clamp(sum, -NB.AI_CAP, NB.AI_CAP) * NB.AI_W) : 0;
  };
  NB.courtLines = function (a, b) {   // [text, v] for the tooltip (pure)
    const s = NB.peek(); if (!s || !s.ct[a]) return [];
    const rb = A.realm(b), ru = rb && rb.ruler; if (!ru) return [];
    const out = [];
    for (const id of Object.keys(s.ct[a])) { if (s.ct[a][id] <= 0) continue; const c = NB.claim(id); if (c && c.s === ru && 'SKDTWL'.includes(c.k)) out.push(NB.say(c, null)); }
    return out;
  };
  if (typeof A.memSum === 'function') {
    const memSum = A.memSum;
    A.memSum = function (a, b) {
      const m = memSum.apply(this, arguments);
      if (!NB.AI_ON) return m;
      const x = NB.courtView(a, b);
      return x ? m + x : m;
    };
  }
  if (typeof A.opinionParts === 'function') {
    const parts = A.opinionParts;
    A.opinionParts = function (a, b) {
      const out = parts.apply(this, arguments);
      try {
        const x = NB.AI_ON ? NB.courtView(a, b) : 0;
        if (x) { const L = NB.courtLines(a, b); out.push([`Talk at court of their ruler: ${cap(L[0] || 'stories')}${L.length > 1 ? ` (and ${L.length - 1} more)` : ''}`, x]); }
      } catch (e) {}
      return out;
    };
  }
})();
