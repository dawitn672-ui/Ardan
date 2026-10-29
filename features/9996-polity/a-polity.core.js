// The Polity (9996-polity), part one: the data, the state, the estates, the laws beyond 56's three, legitimacy with
// parts, the offices below the council, vassal contracts and the council's seat tasks. See README.md.
//
// It builds on 56-realm-inside (the court, RI.voices, RI.tally, RI.applyLaw, the custom r.riLaw0), 20-ai-personality
// (A.rulerPersona, A.personPersona), 66-markets (market towns as shires), 990-far-peoples (the powers' names) and
// 68-casus-belli (csPlan, for the marches). Engine paths draw dice only with A.chance, A.ri, A.rf and A.pick; every
// function named *Parts, *Of or read* is pure, and the views (e-view.core.js) only read.
//
// State, all optional (a save without it fills at the next New Year):
//   r.pol = { v, est: {k: {ap, mod, lead}}, off: [{id, k, at, pid, by, since, term, pay, g}], bill, elect, last,
//             task: {seat: k}, laws2: {obl, just, comm, trade, faith}, law0: {...}, came, since, ru, lost: [y], tyr }
//   h.contract = { tax, levy, rights: [], since }   (Low 0, Medium 1, High 2)
//   pc.pol = { promises: [], petition, sought }
const POL = A.POL = A.POL || {};
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r2 = x => Math.round(x * 100) / 100;
const live = p => !!(p && p.alive);
POL.clamp = clamp; POL.r2 = r2;
// a stable 0..1 number from parts: varies the starting laws and breaks ties without touching the random stream
const hash = (...a) => { let h = 2166136261; const s = a.join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };
POL.hash = hash;
// the whole Polity. POL.ON turns it off everywhere; POL.KNOWN = false keeps the Known World as it was before this
// feature (a Great Continent game only), if the integrator wants that gate
POL.ON = true; POL.KNOWN = true;
const farGame = () => !!(A.FAR && A.FAR.active);
Object.defineProperty(POL, 'on', { get: () => POL.ON && (POL.KNOWN || farGame()), configurable: true });
POL.stats = { made: 0, filled: 0, bills: 0, passed: 0, failed: 0, elections: 0, votes: 0, laws2: 0 };

// ---------------------------------------------------------------- the estates

const EST = ['nob', 'cler', 'burg', 'comm', 'army'];
POL.EST = EST;
POL.EST_NAME = { nob: 'the Nobility', cler: 'the Clergy', burg: 'the Guilds', comm: 'the Commons', army: 'the Host' };
POL.EST_SHORT = { nob: 'Nobility', cler: 'Clergy', burg: 'Guilds', comm: 'Commons', army: 'Host' };
// the base share of each estate before the realm's own reading
const EST_BASE = { nob: .3, cler: .15, burg: .15, comm: .15, army: .25 };
// a far realm's own words for its estates, by kind (the nobility and the host take 990's powers where it names them)
const EST_TYPE = {
  'nomad confederation': { cler: 'the shamans', burg: 'the horse-traders', comm: 'the herders' },
  'mountain confederation': { cler: 'the shrine-keepers', burg: 'the bridge-tollers', comm: 'the valley folk' },
  'city-state': { nob: 'the old families', burg: 'the guilds', comm: 'the street' },
  'city league': { nob: 'the patrician houses', burg: 'the weighers and guilds', comm: 'the dockside' },
  'merchant republic': { nob: 'the broker houses', burg: 'the counting houses', comm: 'the porters' },
  theocracy: { nob: 'the lay lords', cler: 'the high temple', comm: 'the faithful' },
  empire: { nob: 'the princes and governors', burg: 'the merchant guilds', comm: 'the peasantry' },
  'orc clans': { nob: 'the clan-mothers', cler: 'the bone-readers', burg: 'the counters', comm: 'the clan folk', army: 'the two-spears' },
  'orc horde': { nob: 'the clan-mothers', cler: 'the bone-readers', burg: 'the counters', comm: 'the clan folk', army: 'the two-spears' },
  'dwarven hold': { nob: 'the hall heads', cler: 'the rune-keepers', burg: 'the carvers\' guilds', comm: 'the delvers', army: 'the gate wardens' },
  'pirate haven': { nob: 'the old captains', cler: 'the sea-priests', burg: 'the fences', comm: 'the crews' },
  'giant territory': { nob: 'the eldest', cler: 'the chanters', burg: 'the traders at the halls', comm: 'the herd giants' },
  'elven realm': { nob: 'the old houses', cler: 'the grove-keepers', burg: 'the river traders', comm: 'the woodfolk' },
};
const powersOf = rid => { try { const P = A.FARP_POWERS || {}, F = A.FAR && A.FAR.D && A.FAR.D.realms ? A.FAR.D.realms[rid] : null; return P[rid] || (F && P.TYPE && P.TYPE[F.type]) || null; } catch (e) { return null; } };
// the realm's own name for an estate; pure
POL.estName = function (k, rid) {
  const r = A.realm(rid), T = r && EST_TYPE[r.type];
  if (T && T[k]) return T[k];
  const P = powersOf(rid);
  if (P) { if (k === 'nob' && P.liberty) return P.liberty[0]; if (k === 'army' && P.war) return P.war[0]; }
  return POL.EST_NAME[k];
};

// ---------------------------------------------------------------- the eight law groups (GD.POL_LAWS is data)

// ap: what each estate thinks of each position, -3..+3; ord: positions in a line (a bill moves one step)
GD.POL_LAWS = {
  tax: { n: 'Taxes', ord: true, pos: ['Light', 'Fair', 'Customary', 'Heavy', 'Crushing'],
    ap: { nob: [2, 1, 0, -1, -3], cler: [0, 0, 0, 0, -1], burg: [2, 1, 0, -1, -3], comm: [3, 1, 0, -2, -3], army: [-2, -1, 0, 1, 1] } },
  auth: { n: 'Crown authority', ord: true, pos: ['Low', 'Limited', 'High', 'Absolute'],
    ap: { nob: [3, 1, -1, -3], cler: [0, 1, 0, -1], burg: [-1, 1, 1, -1], comm: [-1, 0, 1, 0], army: [-2, 0, 2, 2] } },
  levy: { n: 'Levies', ord: true, pos: ['Light levies', 'Customary levies', 'Heavy levies'],
    ap: { nob: [1, 0, -1], cler: [0, 0, 0], burg: [1, 0, -1], comm: [2, 0, -2], army: [-2, 0, 2] } },
  succ: { n: 'Succession', ord: false, fixed: true, pos: ['Heredity', 'Elective', 'Council', 'Theocracy'],
    ap: { nob: [1, 2, -1, -2], cler: [0, -1, -1, 3], burg: [0, 0, 3, -1], comm: [0, 0, 1, 0], army: [1, 1, -1, -1] } },
  obl: { n: 'Obligations', ord: true, pos: ['Low', 'Medium', 'High'],
    ap: { nob: [2, 0, -3], cler: [0, 0, 0], burg: [0, 0, 1], comm: [0, 0, -1], army: [-1, 0, 2] } },
  just: { n: 'Justice', ord: true, pos: ["Lords' courts", 'Royal courts', 'The written law'],
    ap: { nob: [2, 0, -1], cler: [1, 1, -2], burg: [-1, 1, 2], comm: [-2, 1, 1], army: [0, 1, 0] } },
  comm: { n: 'The commons', ord: true, pos: ['Bondage', 'Tenancy', 'Free hold'],
    ap: { nob: [2, 0, -2], cler: [0, 0, -1], burg: [-1, 0, 1], comm: [-3, 0, 3], army: [0, 0, -1] } },
  trade: { n: 'Trade', ord: false, pos: ['Guild charters', 'Crown monopolies', 'Open markets'],
    ap: { nob: [0, 1, 0], cler: [0, 0, 0], burg: [2, -3, 1], comm: [0, -1, 1], army: [0, 1, 0] } },
  faith: { n: 'Faith', ord: false, pos: ['Established', 'Tolerant', 'Faith-led'],
    ap: { nob: [0, 0, -1], cler: [2, -3, 3], burg: [0, 1, -1], comm: [0, 1, -1], army: [0, 0, 0] } },
};
POL.GROUPS = Object.keys(GD.POL_LAWS);
POL.NEW = ['obl', 'just', 'comm', 'trade', 'faith'];
const SUCC_IX = { hereditary: 0, elective: 1, council: 2, theocracy: 3 };
// where each law stands now, as a position index; pure
POL.pos = function (r, g) {
  const L = r.laws || {};
  if (g === 'tax') return A.RI && A.RI.taxIdx ? A.RI.taxIdx(r) : 2;
  if (g === 'auth') return L.authority != null ? L.authority : 1;
  if (g === 'levy') return L.levy != null ? L.levy : 1;
  if (g === 'succ') return SUCC_IX[r.gov] != null ? SUCC_IX[r.gov] : 0;
  const l2 = r.pol && r.pol.laws2;
  return l2 && l2[g] != null ? l2[g] : POL.start(r)[g];
};
// the realm's custom in each law: what it had when the Polity first sat (56's r.riLaw0 for taxes and authority)
POL.custom = function (r, g) {
  if (g === 'tax' || g === 'auth') { const R = A.RI; return R && R.trad ? R.trad(r, g === 'tax' ? 'tax' : 'authority') : g === 'tax' ? 2 : 1; }
  if (g === 'levy') return 1;
  if (g === 'succ') return POL.pos(r, 'succ');
  const l0 = r.pol && r.pol.law0;
  return l0 && l0[g] != null ? l0[g] : POL.start(r)[g];
};
// starting positions, from the realm's kind and government (the lore's words where it has them); pure
POL.start = function (r) {
  const o = { obl: 1, just: 1, comm: 1, trade: 0, faith: 0 }, ty = String(r.type || ''), gov = r.gov, h = k => hash(r.id, k);
  if (gov === 'council' || /merchant|city|league/.test(ty)) { o.trade = 2; o.just = 2; o.obl = 0; }
  if (gov === 'theocracy' || ty === 'theocracy') { o.faith = 2; o.just = 0; }
  if (/nomad|orc|giant/.test(ty)) { o.comm = 2; o.just = 0; o.obl = 0; }
  if (/mountain/.test(ty)) { o.comm = 2; o.obl = 0; }
  if (/empire|sultan|emirate/.test(ty)) { o.just = 2; o.obl = 2; o.trade = 1; }
  if (/dwarven/.test(ty)) { o.just = 2; o.trade = 0; }
  if (/pirate/.test(ty)) { o.trade = 2; o.just = 0; o.comm = 2; }
  if (gov === 'hereditary' && /kingdom|^$/.test(ty)) {
    // kingdoms differ: some keep the lords' courts, some bond their peasants, some have let the guilds loose
    if (h('just') < .3) o.just = 0;
    if (h('comm') < .2) o.comm = 0; else if (h('comm') > .9) o.comm = 2;
    if (h('obl') < .15) o.obl = 2; else if (h('obl') > .85) o.obl = 0;
    if (h('trade') > .85) o.trade = 2;
    if (h('faith') > .88) o.faith = 1;
  }
  return o;
};
POL.posName = (g, i) => (GD.POL_LAWS[g].pos[i] || '?');

// ---------------------------------------------------------------- state

POL.init = function (r) {
  if (!r || !r.alive || r.isRebel) return null;
  if (r.pol && r.pol.v === 1) return r.pol;
  const st = POL.start(r);
  r.pol = { v: 1, est: {}, off: [], bill: null, elect: null, task: {}, laws2: Object.assign({}, st), law0: Object.assign({}, st), came: null, since: A.S.year, ru: r.ruler, lost: [], tyr: 0 };
  for (const k of EST) r.pol.est[k] = { ap: 0, mod: 0, lead: null };
  return r.pol;
};
POL.realms = () => Object.values(A.S.realms).filter(r => r && r.alive && !r.isRebel);

// ---------------------------------------------------------------- who belongs to which estate

const castOf = p => { try { return p && p.castId && LORE.cast ? LORE.cast[p.castId] || null : null; } catch (e) { return null; } };
const houseOf = p => (p && p.house && A.S.houses ? A.S.houses[p.house] : null);
POL.houseOf = houseOf;
// a person's estate; pure
POL.estateOf = function (p) {
  if (!p) return 'comm';
  const j = p.job, c = castOf(p), h = houseOf(p);
  if ((j && j.c === 'clergy') || (c && c.role === 'priest') || (p.flags && p.flags.priest)) return 'cler';
  if ((p.mil && !p.mil.merc && p.mil.rank >= 4) || (c && c.role === 'general')) return 'army';
  if (p.noble || p.status === 'noble' || p.status === 'royal' || p.status === 'gentry' || (h && h.kind !== 'merchant' && h.realm)) return h && /merchant|guild|bank/i.test(h.kind || '') ? 'burg' : 'nob';
  if ((j && (j.c === 'merchant' || (j.c === 'artisan' && j.r >= 3))) || p.status === 'merchant' || (c && c.role === 'merchant')) return 'burg';
  return 'comm';
};
POL.pcEstate = pc => POL.estateOf(pc);

// ---------------------------------------------------------------- clout: who carries weight in the realm (pure)

const towns = rid => { try { return A.MT && A.MT.on && A.MT.on() ? (A.MT.byRealm()[rid] || []) : []; } catch (e) { return []; } };
POL.towns = rid => { const t = towns(rid); if (t.length) return t; const r = A.realm(rid); return r && r.capitalProv != null ? [r.capitalProv] : []; };
const temples = r => (Array.isArray(r.riGreat) ? r.riGreat.length : 0) + Math.min(4, (r.riWorks || 0) / Math.max(1, (r.income || 1) * 2));
POL.unrest = r => clamp(60 - (r.stability != null ? r.stability : 50), 0, 60);
POL.cloutRaw = function (r) {
  const p = r.pol || {}, pos = g => POL.pos(r, g);
  const hs = A.realmHouses(r.id), all = hs.reduce((a, h) => a + A.houseStrength(h), 0), denom = all + (r.army || 0) * .25 + (r.levy || 0) * .05;
  const houseShare = denom > 0 ? all / denom : .3, armyShare = denom > 0 ? (r.army || 0) * .25 / denom : .3;
  const nT = POL.towns(r.id).length, coast = POL.towns(r.id).filter(t => (A.S.prov[t] || {}).coast).length;
  const war = A.atWar(r.id).length > 0, revolt = A.S.wars && A.S.wars.some(w => w.cb === 'liberty' || w.cb === 'independence' ? (w.def || []).includes(r.id) : false);
  const raw = {
    nob: EST_BASE.nob * (.6 + .8 * houseShare) * [1.2, 1.05, .9, .75][pos('auth')] * [1.1, 1, .95][pos('comm')],
    cler: EST_BASE.cler * (.7 + .08 * Math.min(6, temples(r))) * [1.2, .8, 1.5][pos('faith')] * (r.gov === 'theocracy' ? 1.8 : 1),
    burg: EST_BASE.burg * (.5 + .2 * nT + .1 * coast + .05 * Math.min(6, Object.keys((r.pacts && r.pacts.trade) || {}).length)) * [1, .8, 1.2][pos('trade')] * (r.gov === 'council' ? 1.7 : 1),
    comm: EST_BASE.comm * (1 + POL.unrest(r) / 50) * [.7, 1, 1.5][pos('comm')] * (revolt ? 2 : 1),
    army: EST_BASE.army * (.5 + armyShare) * (war ? 1.3 : 1),
  };
  void p;
  return raw;
};
POL.clout = function (r) {
  const raw = POL.cloutRaw(r), s = EST.reduce((a, k) => a + raw[k], 0) || 1, o = {};
  for (const k of EST) o[k] = r2(raw[k] / s);
  return o;
};

// ---------------------------------------------------------------- approval: what each estate makes of the realm (pure)

// [[label, value]] the parts of an estate's approval; the total is clamped to -10..10
POL.approvalParts = function (r, k) {
  const out = [];
  for (const g of POL.GROUPS) {
    const L = GD.POL_LAWS[g], v = L.ap[k][POL.pos(r, g)] || 0;
    if (v) out.push([`${L.n}: ${POL.posName(g, POL.pos(r, g))}`, v]);
  }
  let seats = 0;
  for (const s in (r.council || {})) { const p = A.P(r.council[s]); if (live(p) && POL.estateOf(p) === k) seats++; }
  if (seats) out.push([`${seats} seat${seats === 1 ? '' : 's'} on the council`, Math.min(3, seats)]);
  const e = r.pol && r.pol.est && r.pol.est[k];
  if (e && e.mod) out.push(['What has happened lately', Math.round(e.mod)]);
  if (k === 'comm') { const gi = POL.grainIdx(r); if (gi > 1.0) { const d = -Math.min(4, Math.floor((gi - 1) / .25)); if (d) out.push([`Bread at ${r2(gi)}× its price`, d]); } }
  if (k === 'army') { const lost = ((r.pol && r.pol.lost) || []).filter(y => A.S.year - y < 5).length; if (lost) out.push([`${lost} war${lost === 1 ? '' : 's'} lost lately`, -Math.min(4, 2 * lost)]); if (r.pol && r.pol.won && A.S.year - r.pol.won < 5) out.push(['A war won', 2]); }
  if (k === 'cler' && r.riGreatY && A.S.year - r.riGreatY < 8) out.push(['A great work raised to the gods', 1]);
  return out;
};
POL.approval = (r, k) => clamp(Math.round(POL.approvalParts(r, k).reduce((a, x) => a + x[1], 0)), -10, 10);
// the price of bread in the realm against its base (45-economy), 1 where there is no market
POL.grainIdx = function (r) {
  try { const m = A.mkt && A.mkt(r.id), G = GD.GOODS || (A.E && A.E.GOODS); if (!m || !m.p || m.p.grain == null) return 1; const b = G && G.grain ? G.grain.base : 4; return m.p.grain / Math.max(.1, b); } catch (e) { return 1; }
};
// the named leader of an estate: the head of the strongest house, the highest cleric, the richest merchant, the
// Marshal, an elder of the commons; pure (never makes a person)
POL.leaderOf = function (r, k) {
  const C = r.council || {}, seat = s => { const p = A.P(C[s]); return live(p) ? p : null; };
  if (k === 'nob') { const h = A.realmHouses(r.id).slice().sort((a, b) => A.houseStrength(b) - A.houseStrength(a) || String(a.id).localeCompare(String(b.id)))[0]; const p = h && h.headPid ? A.P(h.headPid) : null; return live(p) ? p : null; }
  if (k === 'army') return seat('marshal');
  if (k === 'cler') { const o = POL.holders(r, 'mag').find(p => POL.estateOf(p) === 'cler'); return seat('chaplain') || o || null; }
  const off = (r.pol && r.pol.off) || [];
  if (k === 'burg') { for (const o of off) if (o.k === 'reeve') { const p = A.P(o.pid); if (live(p)) return p; } return seat('treasurer'); }
  if (k === 'comm') { const t = r.pol && r.pol.est && r.pol.est.comm && r.pol.est.comm.lead; const p = t ? A.P(t) : null; return live(p) ? p : null; }
  return null;
};
// memoised by the day and everything the reading depends on that can change within it (a module cache, not state)
const esMemo = new Map();
POL.estState = function (r) {
  const pol = r.pol, key = A.absDay() + '|' + POL.GROUPS.map(g => POL.pos(r, g)).join('') + '|' + (pol ? POL.EST.map(k => pol.est[k] ? pol.est[k].mod : 0).join(',') : '') + '|' + Object.values(r.council || {}).join(',') + '|' + Math.round(r.stability || 0) + '|' + (r.army || 0) + '|' + ((pol && pol.lost) || []).length + '|' + (pol && pol.won);
  const hit = esMemo.get(r.id);
  if (hit && hit.key === key && hit.S === A.S) return hit.v;
  const v = POL.estStateNow(r);
  if (esMemo.size > 400) esMemo.clear();
  esMemo.set(r.id, { key, S: A.S, v });
  return v;
};
POL.estStateNow = function (r) {
  const cl = POL.clout(r), out = {};
  for (const k of EST) { const ap = POL.approval(r, k); out[k] = { k, cl: cl[k], ap, angry: ap <= -5, loyal: ap >= 5, name: POL.estName(k, r.id), lead: POL.leaderOf(r, k) }; }
  return out;
};

// ---------------------------------------------------------------- legitimacy with parts (pure)

POL.CAME = { heir: ['Rightful heir by law', 60], elected: ['Elected', 65], council: ['Named by the council', 55], claimant: ['Took the throne as claimant', 30], conquest: ['Won it by conquest', 25], founded: ['Founded the realm', 55] };
POL.cameOf = r => (r.pol && r.pol.came) || (r.gov === 'hereditary' ? 'heir' : r.gov === 'council' ? 'council' : 'elected');
POL.legitParts = function (r) {
  const out = [], ru = A.P(r.ruler), c = POL.CAME[POL.cameOf(r)] || POL.CAME.heir;
  out.push([c[0], c[1]]);
  const yrs = clamp(A.S.year - ((r.pol && r.pol.since) || A.S.year), 0, 15);
  if (yrs) out.push([`${yrs} year${yrs === 1 ? '' : 's'} on the throne`, yrs]);
  const fm = ru ? Math.min(10, Math.round((ru.fame || 0) / 10)) : 0;
  if (fm) out.push(['Renown', fm]);
  const ES = POL.estState(r), inGov = new Set();
  for (const s in (r.council || {})) { const p = A.P(r.council[s]); if (live(p)) inGov.add(POL.estateOf(p)); }
  let eg = 0; for (const k of inGov) eg += ES[k].ap * ES[k].cl * 2;
  eg = Math.round(eg);
  if (eg) out.push(['The estates in government', eg]);
  let cu = 0; for (const g of POL.GROUPS) { const d = Math.abs(POL.pos(r, g) - POL.custom(r, g)); cu += d === 0 ? 1 : d >= 2 ? -2 : 0; }
  if (cu) out.push(['Laws kept to custom', cu]);
  const lost = ((r.pol && r.pol.lost) || []).filter(y => A.S.year - y < 5).length;
  if (lost) out.push([`${lost} war${lost === 1 ? '' : 's'} lost in five years`, -5 * lost]);
  if (r.pol && r.pol.task && r.pol.task.chaplain === 'obey' && r.pol.taskOk && r.pol.taskOk.chaplain) out.push(['The Chaplain preaches obedience', 3]);
  if (POL.grainIdx(r) >= 2) out.push(['Famine', -5]);
  return out;
};
POL.legitTarget = r => clamp(Math.round(POL.legitParts(r).reduce((a, x) => a + x[1], 0)), 0, 100);
POL.DRIFT = .2;

// ---------------------------------------------------------------- offices below the council (GD.POL_OFFICES is data)

GD.POL_OFFICES = {
  gov: { n: 'Governor', est: ['nob', 'army'], pay: .005, cap: 2500, term: 0, by: 'crown', d: 'Holds a shire for the crown: its taxes, its muster, its peace.' },
  mag: { n: 'Magistrate', est: null, pay: 150, term: 0, by: 'chancellor', d: 'Hears the shire\'s cases.' },
  reeve: { n: 'Reeve', est: ['burg', 'nob'], pay: .0025, cap: 1200, term: 6, by: 'town', d: 'Keeps the market peace and the town\'s tolls.' },
  warden: { n: 'Warden of the March', est: ['army', 'nob'], pay: 300, term: 0, by: 'marshal', d: 'Holds a border shire against a hostile neighbour.' },
  customs: { n: 'Collector of customs', est: ['burg', 'nob'], pay: .005, cap: 1500, term: 4, by: 'sold', d: 'Takes the crown\'s share of sea trade in a port.' },
};
// the office's name where the realm has its own (by its kind); pure
const OFF_TYPE = {
  'nomad confederation': { gov: 'Chief of a thousand', reeve: 'Fair-master', mag: 'Judge of the camp' },
  'mountain confederation': { gov: 'Valley warden', reeve: 'Bridge-master' },
  empire: { gov: 'Prefect', mag: 'Examined magistrate' },
  'city-state': { gov: 'Castellan', reeve: 'Mayor' }, 'city league': { gov: 'Castellan', reeve: 'Mayor' },
  'merchant republic': { gov: 'Castellan', reeve: 'Weigher of the market' },
  'dwarven hold': { gov: 'Hall-warden', reeve: 'Gate-reeve', mag: 'Law-speaker' },
  'orc clans': { gov: 'Camp chief', mag: 'Bone-judge' }, 'orc horde': { gov: 'Camp chief', mag: 'Bone-judge' },
  theocracy: { gov: 'Temple steward', mag: 'Temple judge' },
};
POL.offName = function (k, rid) {
  const r = A.realm(rid), T = r && OFF_TYPE[r.type];
  if (T && T[k]) return T[k];
  try { const V = A.VOICE, c = V && V.realmCult && V.realmCult(rid), w = c && V.word && k === 'gov' ? V.word(c, 'lord') : null; if (w && k === 'gov' && /hald/i.test(w)) return w.charAt(0).toUpperCase() + w.slice(1) + "'s man"; } catch (e) {}
  return GD.POL_OFFICES[k].n;
};
// who may hold office k under the realm's law; pure
POL.offEst = function (r, k) {
  if (k === 'mag') return POL.pos(r, 'just') === 0 ? ['nob'] : ['burg', 'cler', 'nob'];
  return GD.POL_OFFICES[k].est;
};
// the seats a realm has: a governor, a magistrate and a reeve for each market town (shire); wardens for border shires
// facing a hostile neighbour; collectors of customs in port towns. Pure.
POL.seatsOf = function (r) {
  const T = POL.towns(r.id), out = [];
  for (const t of T) { out.push(['gov', t]); out.push(['mag', t]); out.push(['reeve', t]); }
  const hostile = POL.hostiles(r);
  if (hostile.length) {
    const border = T.filter(t => { const P = A.S.prov[t]; return P && (P.adj || []).some(j => { const o = A.S.prov[j] && A.S.prov[j].owner; return o && hostile.includes(o); }); });
    for (const t of (border.length ? border : T.slice(0, 1)).slice(0, 2)) out.push(['warden', t]);
  }
  for (const t of T.filter(t => (A.S.prov[t] || {}).coast).slice(0, 2)) out.push(['customs', t]);
  return out;
};
// realms the crown has reason to fear: at war with it, planning a war on it (68's csPlan), or a war between them in
// the last 30 years. Pure.
POL.hostiles = function (r) {
  const out = new Set();
  for (const w of A.atWar(r.id)) { const me = A.warSide(w, r.id); for (const x of (w.att || []).concat(w.def || [])) if (x !== r.id && A.warSide(w, x) && A.warSide(w, x) !== me) out.add(x); }
  for (const o of POL.realms()) { if (o.csPlan && o.csPlan.t === r.id) out.add(o.id); }
  if (r.pol && r.pol.foes) for (const id in r.pol.foes) if (A.S.year - r.pol.foes[id] < 30 && A.realm(id) && A.realm(id).alive) out.add(id);
  return [...out];
};
POL.holders = (r, k) => ((r.pol && r.pol.off) || []).filter(o => !k || o.k === k).map(o => A.P(o.pid)).filter(live);
// how many offices a person holds in realm r
const heldBy = (r, pid) => ((r.pol && r.pol.off) || []).filter(o => o.pid === pid).length;
// the offices a person holds anywhere (the player's list): [[realm, office]]; pure
POL.officesOf = function (p) {
  const out = [];
  if (!p) return out;
  const r = A.realm(p.realm);
  for (const x of r && r.pol ? [r] : []) for (const o of x.pol.off || []) if (o.pid === p.id) out.push([x, o]);
  return out;
};
POL.MAX_HELD = 2;   // a person may hold two offices of one realm (a governor who is also the shire's magistrate)

// candidates for office k in realm r, from people who exist: council-free adults of the realm whose estate fits.
// [{p, w}]; pure.
POL.candidates = function (r, k, at, pool) {
  const want = POL.offEst(r, k), out = [], C = new Set(Object.values(r.council || {})), pcId = A.S.pc;
  for (const p of pool) {
    if (!live(p) || p.ruler || p.id === pcId || C.has(p.id) || p.realm !== r.id || p.prison || !A.isAdult(p)) continue;
    if (A.age(p) > (GD.RACES[p.race] || GD.RACES.human).old + 10) continue;
    const e = POL.estateOf(p);
    if (!want.includes(e)) continue;
    const n = heldBy(r, p.id); if (n >= POL.MAX_HELD) continue;
    const sk = k === 'gov' ? A.skill(p, 'stewardship') : k === 'warden' ? A.skill(p, 'command') : k === 'mag' ? Math.max(A.skill(p, 'stewardship'), A.skill(p, 'diplomacy')) : A.skill(p, 'stewardship');
    let w = 10 + sk / 2 + (p.fame || 0) / 4 - 25 * n + (want[0] === e ? 10 : 0);
    const h = houseOf(p); if (h && h.realm === r.id) w += 5 + (({ N01: 12, N02: 9, N03: 6 })[h.rung] || 0);
    if (k === 'mag' && POL.pos(r, 'just') === 2 && !p.literate) continue;
    if (at != null && p.home === at) w += 8;
    out.push({ p, w });
  }
  return out.sort((a, b) => b.w - a.w || String(a.p.id).localeCompare(String(b.p.id)));
};
// the realm's pool of people: those already living there, the heads of its houses (made only when an office needs
// them), its cast. Pure apart from reading.
POL.pool = function (r) {
  const out = [], seen = new Set(), add = p => { if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p); } };
  const ix = POL.peopleIx();
  for (const p of ix[r.id] || []) add(p);
  return out;
};
// people by realm, rebuilt once a day at most (the yearly fill reads it for every realm)
let pix = null;
POL.peopleIx = function () {
  const key = A.absDay() + '|' + Object.keys(A.S.people).length;
  if (pix && pix.key === key && pix.S === A.S) return pix.v;
  const v = {};
  for (const id in A.S.people) { const p = A.S.people[id]; if (p && p.alive && p.realm) (v[p.realm] = v[p.realm] || []).push(p); }
  pix = { key, S: A.S, v };
  return v;
};
POL.ixDirty = () => { pix = null; };
// make a person for an office the pool cannot fill: the head of one of the realm's own houses first, else someone of
// the right estate
POL.makeFor = function (r, k) {
  const want = POL.offEst(r, k);
  if (want.includes('nob') || want.includes('army')) {
    const trade = h => /merchant|guild|bank/i.test(h.kind || '');
    const hs = A.realmHouses(r.id).filter(h => (!h.headPid || !live(A.P(h.headPid))) && (want.includes('burg') || !trade(h))).sort((a, b) => A.houseStrength(b) - A.houseStrength(a) || String(a.id).localeCompare(String(b.id)));
    if (hs.length) { const p = A.houseHead(hs[0].id); POL.ixDirty(); if (live(p) && p.realm === r.id && want.includes(POL.estateOf(p))) { POL.stats.house = (POL.stats.house || 0) + 1; return p; } }
  }
  const e = want[0], status = e === 'burg' ? 'merchant' : e === 'cler' ? 'gentry' : 'gentry';
  const p = A.genNoble(r.id, status, null, A.ri(30, 55));
  if (e === 'burg') { p.status = 'merchant'; p.skills.stewardship = Math.max(p.skills.stewardship || 0, A.ri(25, 55)); }
  if (e === 'cler') { p.job = { c: 'clergy', r: 3 }; p.flags.priest = A.S.year; p.literate = true; }
  if (e === 'army') p.mil = { rank: 4, xp: 0 };
  POL.stats.made++;
  POL.ixDirty();
  return p;
};
const offId = (r, k, at) => `${k}:${at}`;
POL.pay = function (r, o) {
  const D = GD.POL_OFFICES[o.k], n = Math.max(1, POL.towns(r.id).length);
  return Math.round(D.pay < 1 ? Math.min(D.cap || 1e9, Math.max(40, D.pay * (r.income || 0) / n)) : D.pay);
};
// fill the realm's offices: new seats are made, lost seats dropped, vacancies filled from the pool
POL.fillOffices = function (r) {
  const pol = POL.init(r); if (!pol) return 0;
  const want = POL.seatsOf(r), keep = new Map(pol.off.map(o => [o.id, o])), next = [];
  let pool = null, n = 0;
  const pc = A.pc();
  for (const [k, at] of want) {
    const id = offId(r, k, at);
    let o = keep.get(id);
    if (!o) o = { id, k, at, pid: null, by: null, since: A.S.year, term: GD.POL_OFFICES[k].term ? A.S.year + GD.POL_OFFICES[k].term : 0, pay: 0 };
    next.push(o);
  }
  pol.off = next;
  for (const o of pol.off) {
    const p = A.P(o.pid);
    const ok = live(p) && p.realm === r.id && !p.ruler && !p.prison && (p.id === A.S.pc || !Object.values(r.council || {}).includes(p.id));
    const due = o.term && A.S.year >= o.term && p && p.id !== A.S.pc;
    if (ok && !due) { o.pay = POL.pay(r, o); continue; }
    if (o.pid === A.S.pc && pc && ok) continue;
    pool = pool || POL.pool(r);
    let C = POL.candidates(r, o.k, o.at, pool);
    let best = C.length ? C[0].p : null;
    if (due && ok && C.length && C[0].p.id !== p.id && A.chance(.6)) best = p;    // a reeve or collector often keeps the seat
    if (!best) { best = POL.makeFor(r, o.k); pool.push(best); }
    if (!live(best)) continue;
    const was = o.pid;
    o.pid = best.id; o.since = A.S.year; o.by = GD.POL_OFFICES[o.k].by; o.pay = POL.pay(r, o); o.g = 0;
    if (o.term) o.term = A.S.year + GD.POL_OFFICES[o.k].term;
    if (!best.occ || /^(a lord of the realm|a general|a lord)$/.test(best.occ)) best.occ = `${POL.offName(o.k, r.id)} of ${(A.S.prov[o.at] || {}).name || r.short}`;
    n++; POL.stats.filled++;
    if (was && was !== best.id && r.pol.seen) POL.offLog(r, { k: 'office', off: o.id, who: best.id, out: was });
  }
  r.pol.seen = true;
  return n;
};
POL.offLog = function (r, e) { const L = r.pol.log = r.pol.log || []; e.y = A.S.year; L.unshift(e); if (L.length > 12) L.length = 12; };

// ---------------------------------------------------------------- vassal contracts

POL.RIGHTS = { seat: 'A seat on the council', coin: 'Keeps the tolls of its towns', fort: 'Builds walls without leave', war: 'May feud its neighbours', keep: 'Its land is not taken without a trial' };
POL.landed = h => !!h && !h.extinct && h.kind !== 'royal' && (h.great !== false || ['N07', 'N06', 'N05', 'N04', 'N03', 'N02', 'N01'].includes(h.rung));
POL.contractOf = function (h, r) {
  if (h.contract && typeof h.contract === 'object') return h.contract;
  const o = r ? POL.pos(r, 'obl') : 1;
  return { tax: o, levy: o, rights: [], since: null };
};
POL.fillContracts = function (r) {
  for (const h of A.realmHouses(r.id)) if (POL.landed(h) && !h.contract) h.contract = { tax: POL.pos(r, 'obl'), levy: POL.pos(r, 'obl'), rights: [], since: A.S.year };
};
POL.OBL_TAX = [.05, .10, .15];
POL.OBL_LEVY = [.75, 1, 1.25];
// the crown changes one obligation of house h by d (+1/-1): [ok, why, cost]. A favour owed by the house head makes a
// raise free (and is spent); otherwise it costs 15 with the house and 3 with every landed house, once a year.
POL.oblCost = function (r, h, key, d, pc) {
  const c = POL.contractOf(h, r), v = c[key] + d;
  if (v < 0 || v > 2) return { ok: false, why: d > 0 ? 'Already High.' : 'Already Low.' };
  if (d < 0) return { ok: true, op: 10, rest: 0, tyr: false, free: false };
  const head = h.headPid ? A.P(h.headPid) : null, fav = pc && head && A.favorsOf ? A.favorsOf(pc, head.id) : 0;
  if (fav > 0) return { ok: true, op: 0, rest: 0, tyr: false, free: true, head };
  if (r.pol && r.pol.tyr && A.S.year - r.pol.tyr < 1) return { ok: false, why: 'One tyrannical change a year: the lords are still talking about the last.' };
  return { ok: true, op: -15, rest: -3, tyr: true, free: false, head };
};
POL.changeObl = function (r, h, key, d, pc) {
  const q = POL.oblCost(r, h, key, d, pc);
  if (!q.ok) return q;
  const c = h.contract = POL.contractOf(h, r);
  c[key] = c[key] + d; c.since = A.S.year;
  if (q.free && q.head && pc) A.addFavor(pc, q.head.id, -1);
  h.op = clamp((h.op != null ? h.op : 50) + q.op, 0, 100);
  if (q.rest) for (const x of A.realmHouses(r.id)) if (x !== h && POL.landed(x)) x.op = clamp((x.op != null ? x.op : 50) + q.rest, 0, 100);
  if (q.tyr) r.pol.tyr = A.S.year;
  return q;
};
POL.grantRight = function (r, h, right) {
  const c = h.contract = POL.contractOf(h, r);
  if (!POL.RIGHTS[right] || c.rights.includes(right)) return false;
  c.rights.push(right);
  h.op = clamp((h.op != null ? h.op : 50) + 15, 0, 100);
  r.pol.authMinus = r2((r.pol.authMinus || 0) + .1);
  return true;
};

// ---------------------------------------------------------------- the council meets: seat tasks

POL.TASKS = {
  chancellor: { court: 'Court an estate', draft: 'Draft a law', mend: 'Mend a neighbour' },
  marshal: { drill: 'Drill the host', muster: 'Speed the muster', peace: 'Keep the peace' },
  treasurer: { press: 'Press the taxes', audit: 'Audit the officials', fund: 'Fund works' },
  spymaster: { court: 'Watch the court', estates: 'Watch the estates', realm: 'Watch a realm' },
  chaplain: { obey: 'Preach obedience', poor: 'Tend the poor', faith: 'Defend the faith' },
};
// the task a councillor's want calls for; pure
POL.aiTask = function (r, seat, p) {
  const a = A.RI && A.RI.aims ? A.RI.aims(p) : null, w = a ? a.want : 'order', ES = POL.estState(r);
  const angry = EST.filter(k => ES[k].angry).length, war = A.atWar(r.id).length > 0;
  if (seat === 'chancellor') return angry ? 'court' : (w === 'peace' && hash(p.id, A.S.year, 'm') < .5 ? 'mend' : w === 'order' || w === 'liberty' ? 'draft' : 'court');
  if (seat === 'marshal') return war || w === 'glory' ? (hash(p.id, A.S.year) < .5 ? 'drill' : 'muster') : r.stability < 45 ? 'peace' : 'drill';
  if (seat === 'treasurer') return (r.treasury || 0) < (r.income || 0) * .5 || w === 'wealth' ? 'press' : POL.holders(r, 'gov').length && hash(p.id, A.S.year, 'a') < .45 ? 'audit' : 'fund';
  if (seat === 'spymaster') return w === 'crown' || w === 'order' ? 'court' : POL.hostiles(r).length ? 'realm' : 'estates';
  if (seat === 'chaplain') return w === 'faith' ? 'faith' : ES.comm.ap < -2 ? 'poor' : (r.legit || 50) < 60 ? 'obey' : 'faith';
  return null;
};
POL.taskCheck = (r, seat, p) => clamp(.35 + A.skill(p, A.COUNCIL[seat].skill) / 110, .3, .9);
// once a year each seat's holder picks a task (the player picks their own), and its result lands
POL.runTasks = function (r) {
  const pol = r.pol, pc = A.pc();
  pol.taskOk = {};
  for (const seat in A.COUNCIL) {
    const p = A.P((r.council || {})[seat]);
    if (!live(p)) { delete pol.task[seat]; continue; }
    let t = pol.task[seat];
    if (!(p.id === A.S.pc && t && POL.TASKS[seat][t])) t = pol.task[seat] = POL.aiTask(r, seat, p);
    if (!t) continue;
    const ok = A.chance(POL.taskCheck(r, seat, p));
    pol.taskOk[seat] = ok;
    if (!ok) continue;
    POL.taskFx(r, seat, t, p);
  }
};
POL.taskFx = function (r, seat, t, p) {
  const E = r.pol.est, mod = (k, d) => { E[k].mod = clamp((E[k].mod || 0) + d, -6, 6); };
  const ES = POL.estState(r);
  if (seat === 'chancellor') {
    if (t === 'court') { const k = EST.slice().sort((a, b) => ES[a].ap * ES[a].cl - ES[b].ap * ES[b].cl)[0]; mod(k, 2); r.pol.courted = k; }
    if (t === 'draft') r.pol.draft = A.S.year;
    if (t === 'mend') { const n = (A.neighbors(r.id) || []).filter(x => A.realm(x) && A.realm(x).alive).sort((a, b) => A.relBetween(r.id, a) - A.relBetween(r.id, b))[0]; if (n && A.addRel && A.relBetween(r.id, n) < 0) A.addRel(r.id, n, 5); }
  }
  if (seat === 'marshal') {
    if (t === 'drill') r.armyQ = clamp((r.armyQ || 1) + .02, .3, 1.6);
    if (t === 'muster') r.pol.muster = A.S.year;
    if (t === 'peace') r.stability = clamp(r.stability + 2, 0, 100);
  }
  if (seat === 'treasurer') {
    if (t === 'press') { r.treasury += Math.round((r.income || 0) * .05); mod('comm', -1); }
    if (t === 'audit') POL.audit(r, p);
    if (t === 'fund' && A.RI) r.riPri = { k: 'works', y: A.S.year, who: p.id, house: null };
  }
  if (seat === 'spymaster') r.pol.watch = { k: t, y: A.S.year };
  if (seat === 'chaplain') {
    if (t === 'poor') { mod('comm', 2); r.treasury -= Math.round((r.income || 0) * .01); }
    if (t === 'faith') mod('cler', 2);
  }
};

// ---------------------------------------------------------------- the officers' year: graft, audits, the march

// a governor's graft: 0..10% of the shire's tax, by greed and honour; pure
POL.graftOf = function (r, p) {
  const P = A.personPersona ? A.personPersona(p) : { greed: 0, honor: 0 };
  return clamp(Math.round(4 + 6 * (P.greed || 0) - 5 * (P.honor || 0) + (hash(p.id, 'graft') - .5) * 4), 0, 10);
};
POL.officeYear = function (r) {
  for (const o of r.pol.off) {
    const p = A.P(o.pid); if (!live(p) || p.id === A.S.pc) continue;
    if (o.k === 'gov') {
      o.g = POL.graftOf(r, p);
      if (o.g) { const take = Math.round((r.income || 0) / Math.max(1, POL.towns(r.id).length) * o.g / 100); r.treasury -= take; p.coin = (p.coin || 0) + take; o.gT = (o.gT || 0) + take; }
    }
  }
};
POL.audit = function (r, by) {
  const found = [];
  for (const o of r.pol.off) {
    if (o.k !== 'gov' || !o.g) continue;
    const p = A.P(o.pid); if (!live(p)) continue;
    if (!A.chance(.3)) continue;
    found.push([o, p]);
    if (p.id === A.S.pc) { if (A.EV.po_audit && !A.S.queue.some(q => q.ev === 'po_audit')) A.queue({ type: 'event', ev: 'po_audit', ctx: { pid: by ? by.id : null, shire: (A.S.prov[o.at] || {}).name || r.short } }); continue; }
    o.pid = null;                     // dismissed; the next New Year fills it
    POL.offLog(r, { k: 'graft', off: o.id, who: p.id, by: by ? by.id : null });
    if (A.chance(.25)) A.news(`${r.short}: ${A.fullName(p, false)}, ${POL.offName('gov', r.id).toLowerCase()} of ${(A.S.prov[o.at] || {}).name || 'a shire'}, is dismissed for keeping the crown's taxes.`, 'crown');
  }
  return found;
};

// ---------------------------------------------------------------- the New Year: estates, contracts, legitimacy

POL.year = function (r) {
  if (!POL.on) return;
  const pol = POL.init(r); if (!pol) return;
  // event modifiers fade by 1 a year
  for (const k of EST) { const e = pol.est[k]; if (e.mod) e.mod = e.mod > 0 ? Math.max(0, e.mod - 1) : Math.min(0, e.mod + 1); }
  // a new ruler: when and how they came
  if (pol.ru !== r.ruler) { pol.ru = r.ruler; pol.since = A.S.year; if (!pol.cameSet || pol.cameSet < A.S.year - 1) pol.came = null; pol.cameSet = null; }
  POL.fillContracts(r);
  POL.fillOffices(r);
  POL.runTasks(r);
  POL.officeYear(r);
  // the estates' standing, kept for the view and for the next year's readings
  const ES = POL.estState(r);
  for (const k of EST) { pol.est[k].ap = ES[k].ap; pol.est[k].cl = ES[k].cl; }
  if (!pol.est.comm.lead || !live(A.P(pol.est.comm.lead))) { const pool = POL.peopleIx()[r.id] || []; const e = pool.find(p => POL.estateOf(p) === 'comm' && A.isAdult(p) && p.id !== A.S.pc); pol.est.comm.lead = e ? e.id : null; }
  // legitimacy drifts 20% of the gap toward its target
  const T = POL.legitTarget(r);
  r.legit = clamp(Math.round(((r.legit != null ? r.legit : 50) + POL.DRIFT * (T - (r.legit != null ? r.legit : 50))) * 10) / 10, 0, 100);
  pol.T = T;
  pol.lost = (pol.lost || []).filter(y => A.S.year - y < 6);
};

// estates' anger adds power to the factions their members join (patch PO-POWER is this wrap, no blob edit)
const basePower = A.factionPower;
A.factionPower = function (f) {
  const v = basePower.apply(this, arguments);
  try {
    if (!POL.on || !f) return v;
    const r = A.realm(f.realm); if (!r || !r.pol || !r.pol.est) return v;
    let add = 0;
    const kinds = f.kind === 'war' ? ['army', 'nob'] : f.kind === 'peace' ? ['comm', 'burg', 'nob'] : ['nob'];
    for (const k of kinds) { const e = r.pol.est[k]; if (e && e.ap <= -5) add += .1 * (e.cl || 0); }
    // a loyal nobility joins no faction against the crown
    if (['liberty', 'claimant', 'independence'].includes(f.kind) && r.pol.est.nob && r.pol.est.nob.ap >= 5) add -= .03;
    return Math.max(0, v + add);
  } catch (e) { return v; }
};

// the New Year: after 56's court and the release's factions, the Polity's year for every realm
const baseFactionsYear = A.factionsYear;
A.factionsYear = function (r) {
  const out = baseFactionsYear.apply(this, arguments);
  try { if (POL.on && r && r.alive && !r.isRebel) { POL.year(r); POL.afterYear && POL.afterYear(r); } } catch (e) { console.error('[po] year', e); }
  return out;
};

// wars lost and won, and old foes, for legitimacy, the host and the marches
A.on && A.on('warEnd', function (w, result) {
  try {
    if (!POL.on || !w || result === 'white') return;
    const lose = result === 'att' ? (w.def || []) : (w.att || []), win = result === 'att' ? (w.att || []) : (w.def || []);
    for (const id of lose) { const r = A.realm(id); if (r && r.pol) { r.pol.lost = (r.pol.lost || []).concat([A.S.year]).slice(-6); for (const o of win) (r.pol.foes = r.pol.foes || {})[o] = A.S.year; } }
    for (const id of win) { const r = A.realm(id); if (r && r.pol) { r.pol.won = A.S.year; for (const o of lose) (r.pol.foes = r.pol.foes || {})[o] = A.S.year; } }
    if (w.cb === 'throne' && result === 'att') { const r = A.realm(w.leadD); if (r && r.pol) { r.pol.came = 'claimant'; r.pol.cameSet = A.S.year; r.pol.ru = r.ruler; r.pol.since = A.S.year; } }
    // keep the foes list short
    for (const id of lose.concat(win)) { const r = A.realm(id); if (r && r.pol && r.pol.foes) for (const k in r.pol.foes) if (A.S.year - r.pol.foes[k] >= 30) delete r.pol.foes[k]; }
  } catch (e) { console.error('[po] warEnd', e); }
});
A.on && A.on('rulerDied', function (r) {
  try { if (POL.on && r && r.pol) { r.pol.came = r.gov === 'hereditary' ? 'heir' : r.gov === 'council' ? 'council' : 'elected'; r.pol.cameSet = A.S.year; r.pol.ru = r.ruler; r.pol.since = A.S.year; } } catch (e) {}
});

// market towns (66) are chosen after the world is made: the first month they exist, the shires get their offices
A.onMonth.push(function () {
  try {
    if (!POL.on || !A.MT || !A.MT.on || !A.MT.on()) return;
    for (const r of POL.realms()) if (r.pol && !r.pol.mt) { r.pol.mt = 1; POL.fillOffices(r); }
  } catch (e) { console.error('[po] towns', e); }
});
// a new world: every realm's Polity sits from the first day (offices named, contracts sworn)
A.on && A.on('worldInit', function () {
  try { if (!POL.on) return; POL.ixDirty(); for (const r of POL.realms()) { POL.init(r); POL.fillContracts(r); POL.fillOffices(r); } } catch (e) { console.error('[po] init', e); }
});
