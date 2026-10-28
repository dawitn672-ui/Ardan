// 9997-companies, part 1: every battalion everywhere has state.
//
// d.bs[i] is parallel to the division's template: its battalions (tpl.bns), then its support companies (tpl.sup).
// Each record holds its companies as arrays, so a battalion of four companies under named captains costs a few
// numbers, not four objects:
//   { c: 'SP', o: 3, h: provId, k: [men x4], q: [morale x4], x: xp, wd: wounded,
//     cs?: {slot: captainSeed}, p?: {slot: personId}, st?: [satisfaction x5], hon?: [[name, year]], nw?: 1, vac?: 1, nm?: newMen }
// Slots 0..3 are the companies' captains, slot 4 the battalion's senior captain (M07, a wing of four companies).
// A captain is a seed: his name, command and temper are a pure function of it (CO.cap). He becomes a full person
// (A.newPerson) only when he matters: the player's own company and battalion, a scene, a death the player sees.
// d.men stays authoritative for the war map. Every loss of men goes through A.divLose and every gain through
// A.divRefill, both wrapped here, so the sum of the companies is d.men at all times (CO.check).
(function () {
  const CO = A.CO = A.CO || {};
  CO.V = 1;
  CO.K = {
    FOOD0: 14, FOOD_CAP: 30, FOOD_TRAIN: 40,  // days of bread
    FORAGE_AT: 5, FORAGE_DAYS: 3, FORAGE_EVERY: 10, FORAGE_UNREST: 5,
    DESERT: 0.005,           // a day, at food 0
    HUNGER_MO: 2,            // morale a day, at food 0
    WOUNDED: 1 / 3,          // of the dead in a fight
    WD_BACK: 1 / 30,         // of the wounded back a day, in supply
    LINE_SHARE: 0.7,         // of a day's losses on the battalions in line
    MO_PER_PCT: 0.3,         // morale lost per 1% of men lost in a day
    MO_LOST: 15,             // more, for the side whose fight is lost
    MO_BACK: 5,              // a day back towards rest, out of the fight
    ORG_LO: 0.85, ORG_K: 0.3,// organisation cap x (0.85 + 0.3 x morale/100)
    HONOUR_LOSS: 0.25, RETIRE: 0.1,
    COURIER_KM: 60,
  };
  const K = CO.K;
  CO.stats = { built: 0, rebuilt: 0, lost: 0, gained: 0, deserted: 0, foraged: 0, honours: 0, retired: 0, capDied: 0, capLeft: 0, turned: 0, promoted: 0, orders: 0, delays: [], mismatch: 0 };

  // ---- small pure helpers
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  CO.hash = hash;
  const r1 = x => Math.round(x * 10) / 10;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ord = n => (A.ordinal ? A.ordinal(n) : n + 'th');
  CO.clamp = clamp;

  // ---- what a division is made of
  const isSup = c => !GD.BN[c] && !!GD.SUP[c];
  const CODES = new WeakMap();   // per template object and its version (never in the state)
  CO.codes = function (d) {
    const t = A.tplOf(d);
    if (!t) return [];
    const k = (t.bns || []).length + ':' + (t.sup || []).length + ':' + t.v, c = CODES.get(t);
    if (c && c.k === k) return c.codes;
    const codes = (t.bns || []).filter(c => GD.BN[c]).concat((t.sup || []).filter(s => GD.SUP[s]));
    CODES.set(t, { k, codes });
    return codes;
  };
  const nominal = c => (GD.BN[c] ? GD.BN[c].men : GD.SUP[c] ? GD.SUP[c].men : 100) || 100;
  const nComp = c => (isSup(c) ? 1 : 4);
  CO.isSup = isSup;
  // the order battalions stand in the line: foot first, then horse and beasts, then missiles; support never
  const RANK = { foot: 0, beast: 1, horse: 2, missile: 3 };
  CO.lineOf = function (d) {
    const bs = d.bs || [], idx = [];
    bs.forEach((b, i) => { if (!isSup(b.c)) idx.push(i); });
    idx.sort((i, j) => (RANK[GD.BN[bs[i].c].cat] || 0) - (RANK[GD.BN[bs[j].c].cat] || 0) || i - j);
    return new Set(idx.slice(0, Math.max(1, Math.ceil(idx.length / 2))));
  };

  // split n men into parts by weights, largest remainder, each part at most cap[i] (exact, no dice)
  function split(n, w, cap) {
    const out = w.map(() => 0);
    let left = Math.max(0, Math.round(n));
    for (let pass = 0; pass < 6 && left > 0; pass++) {
      const live = w.map((x, i) => (cap && out[i] >= cap[i] ? 0 : x));
      const tot = live.reduce((a, x) => a + x, 0);
      if (tot <= 0) break;
      const raw = live.map(x => left * x / tot), base = raw.map(Math.floor);
      let rem = left - base.reduce((a, x) => a + x, 0);
      const order = raw.map((x, i) => [x - Math.floor(x), i]).filter(([, i]) => live[i] > 0).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      for (let j = 0; rem > 0 && order.length; j = (j + 1) % order.length, rem--) base[order[j][1]]++;
      let placed = 0;
      for (let i = 0; i < out.length; i++) {
        let add = base[i];
        if (cap) add = Math.min(add, cap[i] - out[i]);
        out[i] += add; placed += add;
      }
      left -= placed;
    }
    return out;
  }
  CO.split = split;

  // ---- names
  const PLURAL = { SP: 'Spears', PK: 'Pikes', HI: 'Foot', AX: 'Axes', LI: 'Light Foot', XB: 'Crossbows', LB: 'Longbows', AR: 'Bows', EA: 'Elven Bows',
    SL: 'Slings', HC: 'Lances', MC: 'Horse', LC: 'Light Horse', HA: 'Horse Archers', CM: 'Camel Riders', OR: 'Relay Riders', EL: 'Elephants', GI: 'Giants',
    MR: 'Marines', GA: 'Garrison', LV: 'Levy', SC: 'Scouts', EN: 'Engineers' };
  CO.troopWord = c => PLURAL[c] || (GD.TROOPS[c] ? GD.TROOPS[c].name.replace(/^.*—\s*/, '').replace(/^./, x => x.toUpperCase()) : c);
  const provName = h => { const P = A.S && A.S.prov && A.S.prov[h]; return P ? P.name : 'the Marches'; };
  CO.bnName = function (d, i) {
    const b = d && d.bs && d.bs[i];
    if (!b) return '';
    if (isSup(b.c)) return `${GD.SUP[b.c].name} of the ${d.name}`;
    return `${b.nw ? 'the new ' : ''}${ord(b.o || 1)} ${provName(b.h)} ${CO.troopWord(b.c)}`;
  };
  const LEADER_NAMED = new Set(['clan', 'patron', 'single', 'tribe', 'band', 'deed']);
  CO.leaderNamed = function (d) {
    const r = A.realm(d.r), n = r && GD.NAMING && GD.NAMING[r.cult];
    return !!(n && LEADER_NAMED.has(n.common));
  };
  CO.coName = function (d, i, ci, short) {
    const b = d && d.bs && d.bs[i];
    if (!b) return '';
    if (isSup(b.c)) return CO.bnName(d, i);
    if (CO.leaderNamed(d)) { const c = CO.cap(d, i, ci); return `${c.given}'s Hundred${short ? '' : ', ' + CO.bnName(d, i)}`; }
    return `${ord(ci + 1)} Company${short ? '' : ', ' + CO.bnName(d, i)}`;
  };

  // ---- captains: a seed, made a person only when he matters
  const TEMPERS = ['bold', 'bold', 'bold', 'cautious', 'cautious', 'cautious', 'cunning', 'steady', 'steady', 'steady'];
  CO.TEMPER_TRAIT = { bold: 'brave', cautious: 'cautious', cunning: 'deceitful' };
  const SEEDS = new WeakMap();   // a record's default seeds, kept beside it (never in the state)
  CO.seedOf = function (d, i, slot) {
    const b = d.bs[i];
    if (b.cs && b.cs[slot] != null) return b.cs[slot];
    let a = SEEDS.get(b);
    if (!a || a.id !== d.id || a.i !== i) { a = { id: d.id, i, s: [] }; SEEDS.set(b, a); }
    return a.s[slot] != null ? a.s[slot] : (a.s[slot] = hash(d.id + '|' + i + '|' + slot));
  };
  // what the engine needs of a captain, without his name (pure, cheap)
  CO.capStat = function (d, i, slot) {
    const b = d.bs[i];
    if (slot === 4 && b.vac && !(b.p && b.p[4])) return null;
    const pid = b.p && b.p[slot];
    if (pid) { const p = A.P(pid); if (p && p.alive) return { seed: CO.seedOf(d, i, slot), pid, person: p, cmd: A.skill(p, 'command'), temper: A.GENERALS && A.GENERALS.temper ? A.GENERALS.temper(p) : 'steady', sat: b.st ? b.st[slot] || 0 : 0, pc: pid === A.S.pc }; }
    const seed = CO.seedOf(d, i, slot);
    return { seed, cmd: 22 + ((seed >>> 9) % 45), temper: TEMPERS[(seed >>> 17) % 10], sat: b.st ? b.st[slot] || 0 : 0 };
  };
  const cultOf = d => { const r = A.realm(d.r); try { return (r && r.cult) || A.cultureFor((r && r.race) || 'human', d.r) || 'CUL-02'; } catch (e) { return 'CUL-02'; } };
  // what a seed is (pure): the same seed is the same man in every view and every replay
  CO.fromSeed = function (seed, cult, home) {
    const C = (typeof LORE !== 'undefined' && LORE.cultures && (LORE.cultures[cult] || LORE.cultures['CUL-02'])) || { m: ['Oswin'], f: ['Hild'] };
    const sex = seed % 11 === 0 ? 'F' : 'M', list = (sex === 'F' ? C.f : C.m) && (sex === 'F' ? C.f : C.m).length ? (sex === 'F' ? C.f : C.m) : (C.m || ['Oswin']);
    const given = list[(seed >>> 5) % list.length];
    // a byname: his village (home or a neighbour of it), or his trade
    const P = A.S && A.S.prov && A.S.prov[home], tl = GD.TRADE_NAMES && (GD.TRADE_NAMES[cult] || GD.TRADE_NAMES['CUL-02']);
    let sur = '';
    if (tl && tl.length && (seed >>> 3) % 3 === 0) sur = tl[(seed >>> 21) % tl.length];
    else if (P) { const near = [P.id].concat(P.adj || []), j = near[(seed >>> 21) % near.length]; sur = 'of ' + provName(j); }
    return { seed, sex, given, sur, cmd: 22 + ((seed >>> 9) % 45), temper: TEMPERS[(seed >>> 17) % 10], age: 24 + ((seed >>> 13) % 24) };
  };
  CO.cap = function (d, i, slot) {
    const b = d.bs[i];
    if (!b) return null;
    const pid = b.p && b.p[slot], p = pid && A.P(pid);
    const sat = b.st ? b.st[slot] || 0 : 0;
    if (slot === 4 && b.vac && !p) return null;
    if (p && p.alive) {
      const G = A.GENERALS;
      return { pid, person: p, seed: CO.seedOf(d, i, slot), given: p.given, name: A.fullName(p, false), sex: p.sex, cmd: A.skill(p, 'command'), temper: G && G.temper ? G.temper(p) : 'steady', sat, pc: pid === A.S.pc };
    }
    const c = CO.fromSeed(CO.seedOf(d, i, slot), cultOf(d), b.h);
    c.name = c.given + (c.sur ? ' ' + c.sur : ''); c.sat = sat;
    return c;
  };
  // his serjeants (pure): the two best men under him, by the same seed
  CO.serjeants = function (d, i, ci) {
    const s = CO.seedOf(d, i, ci), b = d.bs[i];
    return [hash(s + ':s0'), hash(s + ':s1')].map(x => { const c = CO.fromSeed(x, cultOf(d), b.h); c.cmd = Math.max(10, c.cmd - 8); c.name = c.given + (c.sur ? ' ' + c.sur : ''); return c; });
  };
  // make a captain a person (engine only: draws on the random stream through A.newPerson)
  CO.person = function (d, i, slot) {
    const b = d.bs[i];
    if (!b) return null;
    const have = b.p && b.p[slot] && A.P(b.p[slot]);
    if (have && have.alive) return have;
    const c = CO.cap(d, i, slot), r = A.realm(d.r) || {};
    if (!c) return null;
    const race = r.race && r.race !== 'giant' ? r.race : 'human';
    const p = A.newPerson({ given: c.given, sur: c.sur, surMode: /^of /.test(c.sur) ? 'place' : 'trade', sex: c.sex, race, realm: d.r, cult: cultOf(d), faith: r.faith, born: A.S.year - c.age, status: slot === 4 ? 'gentry' : 'peasant', home: b.h, traits: CO.TEMPER_TRAIT[c.temper] ? [CO.TEMPER_TRAIT[c.temper]] : [] });
    p.skills.command = c.cmd; p.skills.tactics = Math.max(10, c.cmd - 6); p.skills.spear = Math.max(p.skills.spear || 0, 30 + c.cmd / 3);
    p.milRank = slot === 4 ? 5 : 4;
    p.occ = (slot === 4 ? 'Senior Captain of the ' : 'Captain of the ') + (slot === 4 ? CO.bnName(d, i) : CO.coName(d, i, slot));
    p.flags.coCap = A.S.year;
    p.coAt = { d: d.id, b: i, s: slot };
    CO.touch(b);
    (b.p = b.p || {})[slot] = p.id;
    return p;
  };
  // a new captain in a slot: the better of the company's serjeants (or, for slot 4, a vacancy until promotion)
  CO.replaceCap = function (d, i, slot, why) {
    const b = d.bs[i];
    if (!b) return null;
    CO.touch(b);
    const old = CO.cap(d, i, slot);
    if (b.p && b.p[slot] != null) { delete b.p[slot]; if (!Object.keys(b.p).length) delete b.p; }
    if (b.st) b.st[slot] = 0;
    if (slot === 4) { b.vac = 1; return { old, by: null }; }
    const sj = CO.serjeants(d, i, slot).sort((x, y) => y.cmd - x.cmd || x.seed - y.seed)[0];
    (b.cs = b.cs || {})[slot] = sj.seed;
    return { old, by: CO.cap(d, i, slot), why };
  };

  // ---- building state
  const homeOf = d => {
    const S = A.S, P = S.prov[d.loc], r = A.realm(d.r);
    if (P && (P.owner === d.r)) return d.loc;
    return r && r.capitalProv != null ? r.capitalProv : (d.loc || 0);
  };
  const nextOrd = (r, c, h) => { const F = r.forces, key = c + '@' + h; F.coN = F.coN || {}; F.coN[key] = (F.coN[key] || 0) + 1; return F.coN[key]; };
  function newRec(d, c, r, men, h) {
    const n = nComp(c), k = split(men, Array(n).fill(1));
    const b = { c, k, q: k.map(() => 50), x: r1(d.exp || 0), wd: 0, h };
    if (!isSup(c)) b.o = nextOrd(r, c, h);
    return b;
  }
  CO.build = function (d, keep) {
    const r = A.realm(d.r);
    if (!r || !r.forces) return null;
    const codes = CO.codes(d);
    const total = Math.max(0, Math.round(d.men || 0)), share = split(total, codes.map(nominal), null), h = homeOf(d);
    const pool = {};
    for (const b of keep || []) if (b && b.c) (pool[b.c] = pool[b.c] || []).push(b);
    d.bs = codes.map((c, i) => {
      const old = pool[c] && pool[c].shift();
      if (old) { old.k = split(share[i], old.k.length === nComp(c) ? old.k.map(x => Math.max(1, x)) : Array(nComp(c)).fill(1)); if (!Array.isArray(old.q) || old.q.length !== old.k.length) old.q = old.k.map(() => 50); return old; }
      return newRec(d, c, r, share[i], h);
    });
    const drs = keep ? null : CO.drills(d);
    for (let i = 0; i < d.bs.length; i++) d.bs[i].q = d.bs[i].k.map((_, ci) => keep ? d.bs[i].q[ci] : r1(CO.restVal(d, i, ci, drs[i])));
    if (d.food == null) d.food = K.FOOD0;
    if (d.pay == null) d.pay = 0;
    CO.mean(d);
    CO.stats[keep ? 'rebuilt' : 'built']++;
    return d.bs;
  };
  CO.sum = d => { let s = 0; for (const b of d.bs || []) for (const m of b.k) s += m; return s; };
  CO.bm = b => { let s = 0; for (const m of b.k) s += m; return s; };
  const OKC = new WeakMap();   // a record list already checked against this very codes array (never in the state)
  CO.ok = function (d) {
    if (!d || !Array.isArray(d.bs)) return false;
    const codes = CO.codes(d);
    if (OKC.get(d.bs) === codes && d.bs.length === codes.length) return true;
    if (codes.length !== d.bs.length) return false;
    for (let i = 0; i < codes.length; i++) if (!d.bs[i] || d.bs[i].c !== codes[i] || !Array.isArray(d.bs[i].k)) return false;
    OKC.set(d.bs, codes);
    return true;
  };
  CO.ensure = function (d) {
    if (!d) return null;
    if (!CO.ok(d)) CO.build(d, Array.isArray(d.bs) ? d.bs : null);
    else { const s = CO.sum(d); if (s !== Math.round(d.men)) { CO.stats.mismatch++; settle(d, Math.round(d.men) - s, 'drift'); } }
    return d.bs;
  };
  CO.ensureAll = function () {
    const S = A.S;
    if (!S || !S.realms) return;
    for (const id in S.realms) { const r = S.realms[id]; if (r && r.forces && r.forces.divs) for (const d of r.forces.divs) CO.ensure(d); }
  };

  // ---- morale
  CO.mean = function (d) {
    let m = 0, w = 0;
    for (const b of d.bs || []) for (let ci = 0; ci < b.k.length; ci++) { m += b.k[ci] * b.q[ci]; w += b.k[ci]; }
    d.mo = w ? r1(m / w) : 50;
    return d.mo;
  };
  CO.bMo = b => { let m = 0, w = 0; for (let ci = 0; ci < b.k.length; ci++) { m += b.k[ci] * b.q[ci]; w += b.k[ci]; } return w ? m / w : (b.q[0] || 50); };
  const FAM = { foot: 'shields', horse: 'charge', missile: 'weapons', beast: 'formation' };
  CO.drillOf = function (d, c) {
    const D = A.DRILL;
    if (!D || !D.of) return 0;
    const cat = GD.BN[c] ? GD.BN[c].cat : null, fam = FAM[cat] || 'formation';
    return (D.of(d)[fam] || 0) * 100;
  };
  // resting morale and its parts, for one company (pure)
  CO.restOne = function (d, i, ci) {
    const b = d.bs[i], parts = [['Base', 50]];
    parts.push(['Experience', b.x / 5]);
    const dr = CO.drillOf(d, b.c);
    if (dr) parts.push(['Drill', 0.1 * dr]);
    const cap = CO.cap(d, i, ci), sen = isSup(b.c) ? null : CO.cap(d, i, 4);
    const cmd = sen ? (cap.cmd + sen.cmd) / 2 : cap.cmd;
    parts.push([sen ? `Captains (${cap.given}, ${sen.given})` : `Captain ${cap.given}`, (cmd - 40) / 4]);
    if (cap.temper === 'bold') parts.push(['A bold captain', 5]);
    if (d.pay > 0) parts.push([`Pay ${d.pay} month${d.pay > 1 ? 's' : ''} behind`, -5 * Math.min(4, d.pay)]);
    if (d.food != null && d.food <= 0) parts.push(['No bread', -10]);
    if (d.loc === b.h) parts.push(['Fighting at home', 5]);
    const total = parts.reduce((a, p) => a + p[1], 0);
    return { total: clamp(total, 5, 100), parts: parts.map(([l, v]) => [l, r1(v)]) };
  };
  CO.rest = (d, i) => d.bs[i].k.map((_, ci) => CO.restOne(d, i, ci));
  // the same number, for the engine's daily and monthly passes: no labels, the drill passed in (pure)
  // command and boldness of a slot's captain, with no allocation (the daily pass asks 40 times a division)
  const capCmd = (d, b, i, slot) => {
    const pid = b.p && b.p[slot];
    if (pid) { const p = A.P(pid); if (p && p.alive) return A.skill(p, 'command'); }
    return 22 + ((CO.seedOf(d, i, slot) >>> 9) % 45);
  };
  const capBold = (d, b, i, slot) => {
    const pid = b.p && b.p[slot];
    if (pid) { const p = A.P(pid); if (p && p.alive) return (A.GENERALS && A.GENERALS.temper ? A.GENERALS.temper(p) : 'steady') === 'bold'; }
    return TEMPERS[(CO.seedOf(d, i, slot) >>> 17) % 10] === 'bold';
  };
  CO.restVal = function (d, i, ci, drill) {
    const b = d.bs[i], senOn = !isSup(b.c) && !(b.vac && !(b.p && b.p[4]));
    const c0 = capCmd(d, b, i, ci), cmd = senOn ? (c0 + capCmd(d, b, i, 4)) / 2 : c0;
    let v = 50 + b.x / 5 + 0.1 * drill + (cmd - 40) / 4 + (capBold(d, b, i, ci) ? 5 : 0);
    if (d.pay > 0) v -= 5 * Math.min(4, d.pay);
    if (d.food != null && d.food <= 0) v -= 10;
    if (d.loc === b.h) v += 5;
    return clamp(v, 5, 100);
  };
  const DRF = { foot: 'shields', horse: 'charge', missile: 'weapons', beast: 'formation' };
  CO.drills = function (d) {   // a division's drill on the 0..100 scale, by battalion (one D.of per division)
    const D = A.DRILL, rec = D && D.of ? D.of(d) : null;
    return d.bs.map(b => { if (!rec) return 0; const cat = GD.BN[b.c] ? GD.BN[b.c].cat : null; return (rec[DRF[cat] || 'formation'] || 0) * 100; });
  };

  // ---- losses fall on companies
  let FIGHT = null;   // { pid, F, day: Map(d -> {before:[[..]], lost:[[..]]}) } while A.fightDay runs
  function settle(d, delta, why) {
    const bs = d.bs;
    if (!bs || !bs.length || !delta) return;
    if (delta < 0) loseSpread(d, -delta, why);
    else gainSpread(d, delta);
  }
  // take `want` men from the companies of the chosen battalions (mask[i] === on, or all when mask is null), by men,
  // largest remainder, never more than a company has; no dice, and no garbage (the fight day calls it thousands of times)
  const FR = new Float64Array(256), FI = new Int16Array(256), FC = new Int16Array(256);
  function takeProp(bs, mask, on, want, lost) {
    if (want <= 0) return 0;
    let tot = 0;
    for (let i = 0; i < bs.length; i++) if (!mask || mask[i] === on) for (let ci = 0; ci < bs[i].k.length; ci++) tot += bs[i].k[ci];
    if (tot <= 0) return 0;
    if (want >= tot) {
      for (let i = 0; i < bs.length; i++) if (!mask || mask[i] === on) for (let ci = 0; ci < bs[i].k.length; ci++) { const m = bs[i].k[ci]; if (m) { bs[i].k[ci] = 0; lost.push([i, ci, m]); } }
      return tot;
    }
    let n = 0, placed = 0;
    for (let i = 0; i < bs.length; i++) {
      if (mask && mask[i] !== on) continue;
      for (let ci = 0; ci < bs[i].k.length; ci++) {
        const m = bs[i].k[ci];
        if (!m) continue;
        const x = want * m / tot, f = Math.floor(x);
        if (n < 256) { FR[n] = x - f; FI[n] = i; FC[n] = ci; n++; }
        if (f) { bs[i].k[ci] -= f; placed += f; lost.push([i, ci, f]); }
      }
    }
    let rem = want - placed;
    while (rem > 0) {   // the largest remainders, first in order on a tie
      let best = -1, bv = -1;
      for (let j = 0; j < n; j++) if (FR[j] > bv && bs[FI[j]].k[FC[j]] > 0) { bv = FR[j]; best = j; }
      if (best < 0) break;
      FR[best] = -2;
      bs[FI[best]].k[FC[best]]--; lost.push([FI[best], FC[best], 1]); placed++; rem--;
    }
    return placed;
  }
  const LINEC = new WeakMap();
  function lineMask(d) {   // which battalions stand in line (cached per record list; never in the state)
    let c = LINEC.get(d.bs);
    if (!c) { const L = CO.lineOf(d); c = d.bs.map((_, i) => (L.has(i) ? 1 : 0)); LINEC.set(d.bs, c); }
    return c;
  }
  function loseSpread(d, n, why) {
    const bs = d.bs;
    if (why !== 'fight' && n <= 4) {   // a few men (sickness, winter, the odd deserter): from the fullest companies
      const lost = [];
      for (let t = 0; t < n; t++) {
        let bi = -1, bc = -1, bm = 0;
        for (let i = 0; i < bs.length; i++) for (let ci = 0; ci < bs[i].k.length; ci++) if (bs[i].k[ci] > bm) { bm = bs[i].k[ci]; bi = i; bc = ci; }
        if (bi < 0) break;
        bs[bi].k[bc]--; lost.push([bi, bc, 1]);
      }
      return lost;
    }
    const lost = [];
    let left = n;
    if (why === 'fight') {
      const line = lineMask(d);
      let am = 0, bm = 0;
      for (let i = 0; i < bs.length; i++) { const m = CO.bm(bs[i]); if (line[i]) am += m; else bm += m; }
      const na = bm > 0 ? Math.min(am, Math.round(n * K.LINE_SHARE)) : Math.min(am, n);
      left -= takeProp(bs, line, 1, na, lost);
      left -= takeProp(bs, line, 0, left, lost);
    }
    if (left > 0) left -= takeProp(bs, null, 0, left, lost);
    return lost;
  }
  // new men go to the most depleted battalion first; green men dilute the veterans: x' = (x m + 5 D) / (m + D)
  function gainSpread(d, n, from) {
    const bs = d.bs;
    let left = n;
    for (let guard = 0; left > 0 && guard < 200; guard++) {
      let best = -1, fill = 2;
      for (let i = 0; i < bs.length; i++) { const f = CO.bm(bs[i]) / (nominal(bs[i].c) || 1); if (f < fill) { fill = f; best = i; } }
      if (best < 0) break;
      const b = bs[best], m = CO.bm(b), room = Math.max(1, nominal(b.c) - m), add = Math.min(left, fill >= 1 ? left : room);
      const per = split(add, b.k.map(x => Math.max(1, nominal(b.c) / b.k.length - x)), null);
      for (let ci = 0; ci < b.k.length; ci++) b.k[ci] += per[ci];
      b.x = r1((b.x * m + 5 * add) / Math.max(1, m + add));
      if (b.nw && m < nominal(b.c) * K.RETIRE && m + add >= nominal(b.c) * K.RETIRE) b.nw = 1;
      if (from != null && from !== b.h) { b.nm = (b.nm || 0) + add; if (b.nm > (m + add) / 2) { b.h = from; delete b.nm; } }
      left -= add;
    }
  }
  CO.loseSpread = loseSpread; CO.gainSpread = gainSpread;

  const divLose = A.divLose;
  A.divLose = function (d, k) {
    const n = divLose.apply(this, arguments);
    try {
      if (n > 0 && d && Array.isArray(d.bs) && CO.ok(d)) {
        const inFight = FIGHT && (d.atk === FIGHT.pid || d.loc === FIGHT.pid);
        const why = CO.WHY || (inFight ? 'fight' : 'attr');
        if (inFight && FIGHT) {
          let rec = FIGHT.day.get(d);
          if (!rec) { rec = d.bs.map(b => b.k.slice()); FIGHT.day.set(d, rec); }
        }
        const lost = loseSpread(d, n, why);
        CO.stats.lost += n;
        if (why === 'fight' || why === 'battle') {
          for (const [i, , m] of lost) d.bs[i].wd += m * K.WOUNDED;
          const F = FIGHT && (FIGHT.F || (FIGHT.F = A.S.fights && A.S.fights[FIGHT.pid]));
          if (F) { const L = (F.coL = F.coL || {}), row = (L[d.id] = L[d.id] || []); for (const [i, , m] of lost) row[i] = (row[i] || 0) + m; }
        }
        if (why === 'desert') { CO.stats.deserted += n; for (const [i, , m] of lost) { const P = A.S.prov[d.bs[i].h]; if (P) P.coDes = (P.coDes || 0) + m; } }
        if (why === 'fight' || why === 'battle') retireCheck(d);
        const pc = A.pc(), my = pc && pc.mil && pc.mil.co;
        if (my && my.div === d.id) for (const [i, ci, m] of lost) if (i === my.b && ci === my.i) { if (why === 'desert' || why === 'turn') pc.mil.coDes = (pc.mil.coDes || 0) + m; else if (why === 'fight' || why === 'battle') pc.mil.coDead = (pc.mil.coDead || 0) + Math.round(m * (1 - K.WOUNDED)); }
      }
    } catch (e) { console.error('companies lose', e); }
    return n;
  };
  const divRefill = A.divRefill;
  A.divRefill = function (d, r) {
    const m0 = d ? d.men : 0;
    const got = divRefill.apply(this, arguments);
    try {
      if (d && Array.isArray(d.bs) && CO.ok(d) && d.men > m0) {
        const P = A.S.prov[d.loc], from = P && P.owner === d.r ? d.loc : null;
        gainSpread(d, d.men - m0, from); CO.stats.gained += d.men - m0; CO.mean(d);
      }
    } catch (e) { console.error('companies refill', e); }
    return got;
  };
  const newDiv = A.newDiv;
  A.newDiv = function () {
    const d = newDiv.apply(this, arguments);
    try { if (d && A.S && A.S.coOn) CO.build(d); } catch (e) { console.error('companies new division', e); }
    return d;
  };
  // a battalion under a tenth of its men is struck off: its name goes to the chronicle and the next men raised take
  // it as "the new" (the template, which the war map reads, stays as it is)
  function retireCheck(d) {
    for (let i = 0; i < d.bs.length; i++) {
      const b = d.bs[i];
      if (isSup(b.c)) continue;
      if (CO.bm(b) < nominal(b.c) * K.RETIRE && !b.ret) {
        b.ret = 1;
        const S = A.S;
        S.coRet = S.coRet || [];
        S.coRet.push([CO.bnName(d, i).replace(/<|>|"/g, ''), S.year, d.r, (b.hon || []).length]);
        if (S.coRet.length > 120) S.coRet.splice(0, S.coRet.length - 120);
        CO.stats.retired++;
      }
    }
  }
  CO.reraise = function (d) {   // a struck-off battalion that has its men again takes "the new", with new captains
    for (const b of d.bs || []) {
      if (!b.ret || CO.bm(b) < nominal(b.c) * 0.5) continue;
      delete b.ret; delete b.hon; delete b.p; delete b.st; delete b.vac; CO.touch(b);
      b.nw = 1;
      b.cs = {};
      for (let s = 0; s < 5; s++) b.cs[s] = hash(b.o + ':' + b.c + ':new:' + s + ':' + A.S.year);
    }
  };
  const divRemove = A.divRemove;
  A.divRemove = function (d) {
    try {
      if (d && Array.isArray(d.bs) && A.S) {
        const S = A.S; S.coRet = S.coRet || [];
        for (let i = 0; i < d.bs.length; i++) if (!isSup(d.bs[i].c) && !d.bs[i].ret) S.coRet.push([CO.bnName(d, i).replace(/<|>|"/g, ''), S.year, d.r, (d.bs[i].hon || []).length]);
        if (S.coRet.length > 120) S.coRet.splice(0, S.coRet.length - 120);
      }
    } catch (e) { console.error('companies remove', e); }
    return divRemove.apply(this, arguments);
  };

  // ---- the day's fighting: losses already fell through A.divLose; morale follows them
  const fightDay = A.fightDay;
  A.fightDay = function (pid) {
    const prev = FIGHT;
    FIGHT = { pid, F: null, day: new Map() };
    FIGHT.F = A.S.fights && A.S.fights[pid];
    const F0 = A.S.fights && A.S.fights[pid];
    let r;
    try {
      // the line battle's dead stand for the map's dead of these days (recorded once, not twice)
      r = fightDay.apply(this, arguments);
    } finally {
      const day = FIGHT.day;
      FIGHT = prev;
      try {
        for (const [d, before] of day) {
          if (!Array.isArray(d.bs)) continue;
          for (let i = 0; i < d.bs.length; i++) {
            const b = d.bs[i];
            for (let ci = 0; ci < b.k.length; ci++) {
              const m0 = before[i] ? before[i][ci] : 0, lost = m0 - b.k[ci];
              if (m0 > 0 && lost > 0) b.q[ci] = r1(clamp(b.q[ci] - K.MO_PER_PCT * 100 * lost / m0, 0, 100));
            }
          }
          CO.mean(d);
          d.coFought = A.S.warClock;
        }
      } catch (e) { console.error('companies fight day', e); }
    }
    return r;
  };
  // the line battle's own losses (b-battle.core.js) are taken from the map fight's next days
  const divLoseCredit = A.divLose;
  A.divLose = function (d, k) {
    if (FIGHT && d && d.coCredit > 0 && d.coCreditAt === FIGHT.pid && (d.atk === FIGHT.pid || d.loc === FIGHT.pid)) {
      // these men already fell in the line battle and were counted then: only the rest fall now
      const want = Math.max(0, Math.round(Math.min(d.men, k))), use = Math.min(want, d.coCredit);
      d.coCredit -= use;
      if (d.coCredit <= 0) { delete d.coCredit; delete d.coCreditAt; }
      return want - use > 0 ? divLoseCredit.call(this, d, want - use) : 0;
    }
    return divLoseCredit.apply(this, arguments);
  };

  // the end of a fight: the beaten lose heart, the winners' captains are pleased, and honours are won
  const fightEnd = A.fightEnd;
  A.fightEnd = function (pid, winner) {
    const S = A.S, F = S.fights && S.fights[pid], P = S.prov[pid];
    const r = fightEnd.apply(this, arguments);
    try {
      if (F) for (const id of F.aIds.concat(F.dIds)) { const d = A.divById(id); if (d && d.coCreditAt === pid) { delete d.coCredit; delete d.coCreditAt; } }
      if (F && S.coOn) CO.afterFight(F, winner, P);
    } catch (e) { console.error('companies fight end', e); }
    return r;
  };
  CO.afterFight = function (F, winner, P) {
    const S = A.S, atkW = winner === 'att', named = (F.menA + F.menD >= 9000 || F.days >= 3);
    const L = F.coL || {};
    for (const id of F.aIds.concat(F.dIds)) {
      const d = A.divById(id);
      if (!d || !CO.ok(d)) continue;
      const won = F.aIds.includes(id) ? atkW : !atkW;
      if (!won) for (const b of d.bs) for (let ci = 0; ci < b.q.length; ci++) b.q[ci] = r1(clamp(b.q[ci] - K.MO_LOST, 0, 100));
      CO.satAll(d, won && F.menA + F.menD >= 3000 ? 10 : 0);
      const row = L[id] || [];
      for (let i = 0; i < d.bs.length; i++) {
        const b = d.bs[i], lost = row[i] || 0, m = CO.bm(b);
        if (!lost) continue;
        const frac = lost / Math.max(1, m + lost);
        if (won && named && frac >= K.HONOUR_LOSS && !isSup(b.c) && P) {
          b.hon = b.hon || [];
          const nm = (F.days >= 3 || F.menA + F.menD >= 9000 ? (F.days > 1 ? 'Battle of ' : 'Fight at ') : 'Fight at ') + P.name;
          if (!b.hon.some(h => h[0] === nm && h[1] === S.year)) {
            b.hon.push([nm, S.year]); if (b.hon.length > 8) b.hon.shift();
            CO.stats.honours++;
            if (A.WC && A.WC.put && CO.mineIs(d, i)) A.WC.put('honour', { p: P.id, a: d.r, n: lost, x: CO.bnName(d, i) });
            const pc = A.pc();
            if (CO.mineIs(d, i) && pc && pc.alive) { pc.flags.co_honour_pend = S.year; CO.queueEv('co_honour', { bn: CO.bnName(d, i), battle: nm }); }
          }
        }
        if (frac >= K.HONOUR_LOSS) CO.capsInDanger(d, i, frac, !won, 'map');
      }
      CO.mean(d);
    }
  };
  // a captain whose men lost a quarter or more is in danger: 3%, and 10% more if they broke and were chased
  CO.capsInDanger = function (d, i, frac, beaten, where) {
    const b = d.bs[i], pc = A.pc();
    for (let ci = 0; ci < b.k.length; ci++) {
      const p = 0.03 + (beaten ? 0.1 : 0);
      if (!A.chance(p)) continue;
      const c = CO.cap(d, i, ci);
      if (c && c.pc) { if (pc) { pc.health = Math.max(5, pc.health - A.ri(6, 18)); A.log('A blow you never saw lays you in the mud with your company. You live.', 'bad'); } continue; }
      if (c && c.person) A.kill(c.person, 'battle');
      CO.stats.capDied++;
      const rep = CO.replaceCap(d, i, ci, 'fell');
      if (CO.mineBn(d, i) && rep && rep.by && pc && pc.alive) {
        A.log(`Captain ${c.name} falls with the ${CO.coName(d, i, ci)}. Serjeant ${rep.by.given} takes the company.`, 'death');
        if (CO.mineIs(d, i, ci)) { const np = CO.person(d, i, ci); CO.queueEv('co_new_captain', { pid: np ? np.id : null, old: c.given, coy: CO.coName(d, i, ci, true) }); }
      }
    }
  };

  // ---- satisfaction
  CO.sat = function (d, i, slot, v) {
    const b = d.bs[i];
    if (!b || !v) return;
    if (!Array.isArray(b.st)) b.st = [0, 0, 0, 0, 0].slice(0, isSup(b.c) ? 1 : 5);
    b.st[slot] = clamp(Math.round((b.st[slot] || 0) + v), -100, 100);
  };
  CO.satAll = function (d, v) { if (!v) return; for (let i = 0; i < d.bs.length; i++) for (let s = 0; s < (isSup(d.bs[i].c) ? 1 : 5); s++) CO.sat(d, i, s, v); };

  // ---- the player's own company
  CO.mineIs = function (d, i, ci) {
    const pc = A.pc(), m = pc && pc.alive && pc.mil && pc.mil.co;
    return !!(m && m.div === d.id && m.b === i && (ci == null || m.i === ci));
  };
  CO.mineBn = (d, i) => CO.mineIs(d, i);
  CO.mine = function (pc) {   // pure: where the player stands, if he has a company
    pc = pc || A.pc();
    const m = pc && pc.mil && pc.mil.co, d = m && A.divById(m.div);
    if (!d || !CO.ok(d) || !d.bs[m.b]) return null;
    return { d, b: m.b, i: m.i, rec: d.bs[m.b] };
  };
  // engine: put the player in a company of his division (the battalion of his troop, else the first foot)
  CO.place = function (pc) {
    if (!pc || !pc.alive || !pc.mil || pc.mil.merc) return null;
    const d = pc.mil.div && A.divById(pc.mil.div);
    if (!d) { if (pc.mil.co) clearMe(pc); return null; }
    CO.ensure(d);
    let m = pc.mil.co;
    if (!m || m.div !== d.id || !d.bs[m.b] || isSup(d.bs[m.b].c)) {
      if (m) clearMe(pc);
      const want = pc.mil.troop;
      let b = d.bs.findIndex(x => x.c === want);
      if (b < 0) b = d.bs.findIndex(x => !isSup(x.c) && GD.BN[x.c].cat === 'foot');
      if (b < 0) b = d.bs.findIndex(x => !isSup(x.c));
      if (b < 0) return null;
      m = pc.mil.co = { div: d.id, b, i: hash(pc.id) % d.bs[b].k.length, y: A.S.year };
    }
    const rec = d.bs[m.b], rank = pc.mil.rank || 0;
    CO.touch(rec);
    // who leads whom: a captain is his company's captain, a senior captain his battalion's
    for (let s = 0; s < 5; s++) if (rec.p && rec.p[s] === pc.id && !((rank === 4 || rank === 5) && s === m.i) && !(rank === 6 && s === 4)) delete rec.p[s];
    if (rank === 4 || rank === 5) (rec.p = rec.p || {})[m.i] = pc.id;
    else if (rank === 6) { (rec.p = rec.p || {})[4] = pc.id; delete rec.vac; }
    // the man above you is a person you can know
    if (rank <= 3) CO.person(d, m.b, m.i);
    if (rank <= 5) CO.person(d, m.b, 4);
    return m;
  };
  function clearMe(pc) {
    const m = pc.mil && pc.mil.co, d = m && A.divById(m.div), rec = d && d.bs && d.bs[m.b];
    if (rec && rec.p) { for (const s in rec.p) if (rec.p[s] === pc.id) delete rec.p[s]; if (!Object.keys(rec.p).length) delete rec.p; }
    if (pc.mil) delete pc.mil.co;
  }
  // how the player's company stands (pure): fit, wounded, dead, deserted since he joined
  CO.myCompany = function (pc) {
    const M = CO.mine(pc);
    if (!M) return null;
    const { d, b, i, rec } = M, cap = CO.cap(d, b, i), sen = isSup(rec.c) ? null : CO.cap(d, b, 4);
    return { d, b, i, rec, name: CO.coName(d, b, i), bn: CO.bnName(d, b), cap, sen, serjeants: CO.serjeants(d, b, i), men: rec.k[i], wd: Math.round(rec.wd / rec.k.length), mo: rec.q[i], rest: CO.restOne(d, b, i), food: d.food, pay: d.pay, hon: rec.hon || [] };
  };

  // ---- the month: rest, pay, the wounded, captains' moods, promotion
  CO.month = function (pc) {
    const S = A.S;
    if (!S || !S.realms) return;
    if (!S.coOn) { S.coOn = CO.V; CO.ensureAll(); }
    const newYear = S.coYear !== S.year;
    S.coYear = S.year;
    for (const id in S.realms) {
      const r = S.realms[id];
      if (!r || !r.alive || !r.forces || !r.forces.divs) continue;
      const broke = (r.treasury || 0) < 0, atWar = A.atWar(id).length > 0;
      let ofc = 0, ofn = 0;
      for (const d of r.forces.divs.slice()) {
        CO.ensure(d);
        d.pay = broke ? (d.pay || 0) + 1 : 0;
        if (d.pay > 0) CO.satAll(d, -10);
        if (d.riMerc && d.pay >= 2) { A.news(`${d.name}, sellswords unpaid for ${d.pay} months, march off to find a better master.`, 'battle'); A.divRemove(d); continue; }
        const live = !!d.army;
        if (!live) {   // at peace: bread, the wounded home, morale settles
          d.food = d.tpl && (A.tplOf(d) || {}).sup && A.tplOf(d).sup.includes('train') ? K.FOOD_TRAIN : K.FOOD_CAP;
          const gap = Math.max(0, Math.round(A.divS(d).men - d.men));
          backWounded(d, gap, 1);
        }
        let drs = null;
        for (let i = 0; i < d.bs.length; i++) {
          const b = d.bs[i];
          if (!live) { if (!drs) drs = drillsNow(d); const R = restNow(d, i, drs[i]); for (let ci = 0; ci < b.q.length; ci++) b.q[ci] = r1(R[ci]); }
          b.x = r1(d.exp != null ? (b.x * 0.8 + d.exp * 0.2) : b.x);   // the division's xp is the mean of its battalions'
          if (Array.isArray(b.st)) { let any = 0; for (let s = 0; s < b.st.length; s++) { b.st[s] = Math.round((b.st[s] || 0) * 0.95); if (b.st[s]) any = 1; } if (!any) delete b.st; }
          const ns = isSup(b.c) ? 1 : 5;
          if (b.p) for (let s = 0; s < ns; s++) if (b.p && b.p[s] && !(A.P(b.p[s]) && A.P(b.p[s]).alive)) CO.replaceCap(d, i, s, 'died');
          if (b.st) for (let s = 0; s < ns; s++) if (b.st && b.st[s] <= -50) { const c = CO.cap(d, i, s); if (c && !c.pc) CO.leave(d, i, s, c, atWar); }
          if (newYear || !r.ofc) for (let s = 0; s < ns; s++) { const c = CO.capStat(d, i, s); if (c && !c.pc) { ofc += c.cmd; ofn++; } }
          if (b.ret) CO.reraise(d);
        }
        CO.mean(d);
      }
      if (newYear || !r.ofc) r.ofc = { cmd: ofn ? Math.round(ofc / ofn) : 40, n: ofn };
      if (newYear && atWar) CO.promote(r);
    }
    if (newYear) CO.yearMoods();
    if (pc && pc.alive && pc.mil) CO.place(pc);
  };
  function backWounded(d, gap, frac) {
    let back = 0;
    for (const b of d.bs) {
      if (b.wd < 1) continue;
      const n = Math.min(Math.floor(b.wd * frac), gap - back);
      if (n <= 0) continue;
      b.wd -= n; back += n;
      const per = split(n, b.k.map(() => 1), null);
      for (let ci = 0; ci < b.k.length; ci++) b.k[ci] += per[ci];
    }
    for (const b of d.bs) if (b.wd < 1) b.wd = 0; else b.wd = r1(b.wd);
    if (back > 0) d.men += back;
    if (frac >= 1) for (const b of d.bs) b.wd = 0;   // at peace the rest are home or dead
    return back;
  }
  CO.backWounded = backWounded;
  // a captain at the end of his patience: in peace he asks for a transfer; in a civil war he may take his men over
  CO.leave = function (d, i, s, c, atWar) {
    const b = d.bs[i], S = A.S, pc = A.pc();
    const civil = atWar && A.atWar(d.r).some(w => { const other = w.att.includes(d.r) ? w.def : w.att; return other.some(o => { const R = A.realm(o), me = A.realm(d.r); return (R && R.isRebel) || (me && me.isRebel); }); });
    if (civil && s < 4 && b.k[s] > 0) {
      const foe = A.atWar(d.r).map(w => (w.att.includes(d.r) ? w.def : w.att)[0]).find(o => A.realm(o));
      const n = b.k[s];
      CO.WHY = 'turn';
      try { A.divLose(d, n); } finally { CO.WHY = null; }
      const R = foe && A.realm(foe); if (R) R.levy = (R.levy || 0) + n;
      CO.stats.turned++;
      if (CO.mineBn(d, i) && pc && pc.alive) CO.queueEv('co_turncoat', { capn: c.name, coy: CO.coName(d, i, s, true), foe: foe ? A.realmShort(foe) : 'the other side' });
      else if (A.WC && A.WC.put) A.WC.put('turn', { a: d.r, b: foe, n, x: CO.coName(d, i, s) });
    } else if (CO.mineBn(d, i) && pc && pc.alive && !(pc.flags.co_transfer && S.year - pc.flags.co_transfer < 2)) {
      CO.queueEv('co_transfer_request', { capn: c.name, coy: CO.coName(d, i, s, true), pid: c.person ? c.person.id : null });
    }
    CO.stats.capLeft++;
    CO.replaceCap(d, i, s, 'left');
  };
  // after a year at war the best captain of each division by merit takes a vacant battalion; better men passed over sulk
  CO.merit = c => c.cmd + (c.sat || 0) / 5;
  CO.promote = function (r) {
    for (const d of r.forces.divs) {
      for (let i = 0; i < d.bs.length; i++) {
        const b = d.bs[i];
        if (!b.vac || isSup(b.c)) continue;
        const cand = [];
        for (let j = 0; j < d.bs.length; j++) if (!isSup(d.bs[j].c)) for (let ci = 0; ci < d.bs[j].k.length; ci++) { const c = CO.cap(d, j, ci); if (c && !c.pc) cand.push([j, ci, c]); }
        if (!cand.length) continue;
        cand.sort((x, y) => CO.merit(y[2]) - CO.merit(x[2]) || x[2].seed - y[2].seed);
        const [j, ci, c] = cand[0];
        (b.cs = b.cs || {})[4] = c.seed;
        CO.touch(b);
        if (c.pid) { (b.p = b.p || {})[4] = c.pid; if (c.person) { c.person.milRank = 5; c.person.occ = 'Senior Captain of the ' + CO.bnName(d, i); } }
        delete b.vac;
        CO.sat(d, i, 4, 15);
        for (const [jj, cc, o] of cand.slice(1)) if (o.cmd > c.cmd) CO.sat(d, jj, cc, -20);
        CO.replaceCap(d, j, ci, 'promoted');
        CO.stats.promoted++;
        const pc = A.pc();
        if (pc && pc.alive && pc.mil && pc.mil.co && pc.mil.co.div === d.id && (pc.mil.rank || 0) >= 4 && (pc.mil.rank || 0) <= 5 && c.cmd < A.skill(pc, 'command') && !(pc.flags.co_passed_over && A.S.year - pc.flags.co_passed_over < 3))
          CO.queueEv('co_passed_over', { capn: c.name, bn: CO.bnName(d, i) });
      }
    }
  };
  // a year under a general: a captain likes one of his own temper and dislikes his opposite
  CO.yearMoods = function () {
    const S = A.S, G = A.GENERALS;
    if (!G || !G.of) return;
    for (const a of S.armies || []) {
      const t = G.of(a);
      for (const id of a.divs || []) {
        const d = A.divById(id);
        if (!d || !CO.ok(d)) continue;
        for (let i = 0; i < d.bs.length; i++) for (let s = 0; s < (isSup(d.bs[i].c) ? 1 : 5); s++) {
          const c = CO.capStat(d, i, s);
          if (!c || c.pc) continue;
          if (c.temper === t) CO.sat(d, i, s, 5);
          else if ((c.temper === 'bold' && t === 'cautious') || (c.temper === 'cautious' && t === 'bold')) CO.sat(d, i, s, -10);
        }
      }
    }
  };

  // ---- the day at war: bread, hunger, foraging, the wounded, morale back towards rest
  CO.day = function () {
    const S = A.S;
    if (!S.coOn) return;
    for (const d of A.allDivs()) {
      if (!d.army || !Array.isArray(d.bs)) continue;
      if (!CO.ok(d)) CO.ensure(d);
      const t = A.tplOf(d), cap = t && (t.sup || []).includes('train') ? K.FOOD_TRAIN : K.FOOD_CAP, sr = d.sr != null ? d.sr : 1;
      if (d.food == null) d.food = K.FOOD0;
      d.food = r1(clamp(d.food - 1 + 2 * sr, 0, cap));
      const P = S.prov[d.loc];
      if (d.food < K.FORAGE_AT && P && (!d.coFor || S.warClock - d.coFor >= K.FORAGE_EVERY)) CO.forage(d, P);
      const fighting = d.atk != null || (S.fights && S.fights[d.loc]);
      if (d.food <= 0) {
        for (const b of d.bs) for (let ci = 0; ci < b.q.length; ci++) b.q[ci] = r1(clamp(b.q[ci] - K.HUNGER_MO, 0, 100));
        const n = Math.floor(d.men * K.DESERT + ((hash(d.id + S.warClock) % 100) / 100));
        if (n > 0) { CO.WHY = 'desert'; try { A.divLose(d, n); } finally { CO.WHY = null; } CO.hungerScene(d); }
      } else if (!fighting) {
        const drs = drillsNow(d);
        for (let i = 0; i < d.bs.length; i++) {
          const b = d.bs[i], R = restNow(d, i, drs[i]);
          for (let ci = 0; ci < b.q.length; ci++) {
            const qv = b.q[ci];
            const rest = R[ci];
            if (qv < rest) b.q[ci] = r1(Math.min(rest, qv + K.MO_BACK));
            else if (qv > rest) b.q[ci] = r1(Math.max(rest, qv - 1));
          }
        }
        if (sr >= 0.6 && S.warClock % 3 === 0) backWounded(d, Math.max(0, Math.round(A.divS(d).men - d.men)), K.WD_BACK * 3);
      }
      CO.mean(d);
    }
  };
  // the daily pass's caches (never in the state): resting values per record, drill per division for 16 days
  const RESTC = new WeakMap(), DRC = new WeakMap();
  CO.touch = b => { if (b) RESTC.delete(b); };
  function restNow(d, i, dr) {
    const b = d.bs[i], key = Math.round(b.x * 10) * 1e7 + Math.round(dr * 10) * 1e4 + Math.min(999, d.pay || 0) * 8 + (d.food <= 0 ? 4 : 0) + (d.loc === b.h ? 2 : 0) + (b.vac ? 1 : 0);
    let c = RESTC.get(b);
    if (!c || c.key !== key || c.d !== d || c.i !== i) { c = { key, d, i, v: b.k.map((_, ci) => CO.restVal(d, i, ci, dr)) }; RESTC.set(b, c); }
    return c.v;
  }
  function drillsNow(d) {
    const t = (A.S.warClock || 0) >> 4;
    let c = DRC.get(d);
    if (!c || c.t !== t || c.v.length !== d.bs.length) { c = { t, v: CO.drills(d) }; DRC.set(d, c); }
    return c.v;
  }
  CO.forage = function (d, P) {
    const S = A.S;
    d.coFor = S.warClock;
    d.food = r1(d.food + K.FORAGE_DAYS);
    P.unrest = clamp((P.unrest || 0) + K.FORAGE_UNREST, 0, 100);
    CO.stats.foraged++;
    S.coForY = S.coForY || {};
    if (S.coForY[P.id] !== S.year) {
      S.coForY[P.id] = S.year;
      if (A.WC && A.WC.put) A.WC.put('forage', { p: P.id, a: d.r, n: d.men, x: d.name });
      const pc = A.pc();
      if (pc && pc.alive && pc.mil && pc.mil.div === d.id && !(pc.flags.co_forage && S.year - pc.flags.co_forage < 1)) CO.queueEv('co_forage', { place: P.name });
    }
  };
  CO.hungerScene = function (d) {
    const pc = A.pc(), S = A.S;
    if (!pc || !pc.alive || !pc.mil || pc.mil.div !== d.id) return;
    if (!(pc.flags.co_hungry && S.year - pc.flags.co_hungry < 1)) CO.queueEv('co_hungry_march', {});
    else if ((pc.mil.rank || 0) <= 5 && A.squad(pc).length && !(pc.flags.co_desert && S.year - pc.flags.co_desert < 2)) { const c = A.squad(pc)[0]; CO.queueEv('co_desert', { pid: c.id }); }
  };
  CO.queueEv = function (ev, ctx) {
    const S = A.S;
    if ((S.queue || []).some(q => q.type === 'event' && q.ev === ev)) return;
    A.queue({ type: 'event', ev, ctx: Object.assign({}, ctx), forced: true });
  };

  // ---- morale on the war map: the organisation cap, x (0.85 + 0.3 x mean morale / 100)
  const divMaxOrg = A.divMaxOrg;
  A.divMaxOrg = function (d) {
    const v = divMaxOrg.apply(this, arguments);
    return d && d.mo != null ? v * (K.ORG_LO + K.ORG_K * d.mo / 100) : v;
  };

  // ---- hooks
  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => { try { CO.month(pc); } catch (e) { console.error('companies month', e); } });
  const wsDay = A.wsDay;
  A.wsDay = function () {
    try { CO.courierDay && CO.courierDay(); } catch (e) { console.error('companies couriers', e); }
    const r = wsDay.apply(this, arguments);
    try { CO.day(); } catch (e) { console.error('companies day', e); }
    return r;
  };
  // a new game or a loaded save: every division gets its battalions at once
  const newGame = A.newGame;
  A.newGame = function () {
    const r = newGame.apply(this, arguments);
    try { A.S.coOn = CO.V; CO.ensureAll(); const pc = A.pc(); if (pc && pc.mil) CO.place(pc); } catch (e) { console.error('companies new game', e); }
    return r;
  };
  const enlist = A.enlist;
  A.enlist = function (pc) {
    const r = enlist.apply(this, arguments);
    try { if (pc && pc.id === A.S.pc && A.S.coOn) CO.place(pc); } catch (e) { console.error('companies enlist', e); }
    return r;
  };
  // effect key coy: the player's own company. { mo: morale, sat: his captain's satisfaction, food: days, men: men
  // who come back (+) or slip away (-), wd: wounded who are brought in }
  (A.FX_EXTRA = A.FX_EXTRA || []).push('coy');
  const applyFx = A.applyFx;
  A.applyFx = function (pc, fx) {
    const r = applyFx.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && fx.coy && pc && pc.id === A.S.pc) {
        const M = CO.mine(pc), o = fx.coy;
        if (M) {
          const { d, b, i, rec } = M;
          if (o.mo) rec.q[i] = r1(clamp(rec.q[i] + o.mo, 0, 100));
          if (o.sat) CO.sat(d, b, i, o.sat);
          if (o.food) d.food = r1(clamp((d.food || 0) + o.food, 0, K.FOOD_TRAIN));
          if (o.men < 0) { CO.WHY = 'desert'; try { A.divLose(d, Math.min(rec.k[i], -o.men)); } finally { CO.WHY = null; } }
          if (o.wd) { const n = Math.min(Math.floor(rec.wd), o.wd); if (n > 0) { rec.wd -= n; rec.k[i] += n; d.men += n; } }
          CO.mean(d);
        }
      }
    } catch (e) { console.error('companies fx', e); }
    return r;
  };
  // GD.SUP: the baggage train (bread for 40 days, not 30)
  if (GD.SUP && !GD.SUP.train) GD.SUP.train = { name: 'Baggage train', men: 60, eq: { horses: 20 }, fx: { spd: -0.1 }, desc: 'Wagons and mules: bread for 40 days, not 30. Slows the march a tenth.' };
  // 57's record learns three kinds
  if (A.WC && A.WC.KINDS) Object.assign(A.WC.KINDS, { honour: ['battle honour', 1], forage: ['army forages', 1], turn: ['company turns coat', 1] });
})();
