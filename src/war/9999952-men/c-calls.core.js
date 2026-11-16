// W1-4: conscription by proclamation (docs/design/war.md §10.2; D-064 point 7; D-087, D-088).
//
// A crown calls men by lot only for a real, named need, and the call is a decision through A.WHY (kind 'conscript'):
//   home     an enemy host stands on the realm's soil            -> up to the last call
//   siege    a stronghold of the realm is besieged               -> up to the second call
//   lost     a host lost: the standing men fallen far below what took the field
//   few      at war with fewer spears than the enemy is believed to have          -> the first call (the second when
//            a first call is already out and not enough)
//   will     no need but the king's pride, under a law that lets him: legal, and the most resented call there is
// Three calls, drawn by lot, parish by parish:
//   the first call   one hearth in 20, one season (home by harvest)       about 3 in 100 working men
//   the second call  one hearth in 10, up to a year                       about 6 in 100
//   the last call    one hearth in 5, while the enemy stands on home soil  about 12 in 100
// Each lord raises it in his own lands (A.CMD: the crown in its demesne, each tenant-in-chief in the provinces nearest
// his seat), and answers the call as he answers a summons, through A.WHY (kind 'raise': in full, half, or late).
// The men are drilled a month or more by the sworn men, then form conscript foot (d.call) in their lord's contingent.
// They cost hands in the fields (A.CALLS.fields: the share out, doubled in the reaping months; 45-economy's output and
// the crown's taxes read it), and the call leaves a remembered grievance (r.callGr, h.cmGr, the lords' feelings, the
// provinces' unrest) that feeds stability, factions (war weariness) and A.WHY. Released when the need ends or the term
// is up, by a decision (kind 'release': release, release with a bounty, or hold them, which is counted against him).
// State (all optional; old saves load): A.S.calls (bounded), d.call, r.callGr, r.callAsk, r.menAtWar.
(function () {
  const CA = A.CALLS = A.CALLS || {};
  const M = A.MEN;
  CA.DEG = [
    { d: 1, of: 20, days: 182, word: 'the first call', hearth: 'one hearth in twenty', term: 'one season, home by harvest' },
    { d: 2, of: 10, days: 365, word: 'the second call', hearth: 'one hearth in ten', term: 'up to a year' },
    { d: 3, of: 5, days: null, word: 'the last call', hearth: 'one hearth in five', term: 'while the enemy stands on home soil' },
  ];
  // the share of working men each call takes: hearths / of, over the working men (HEARTH 5.5, WORK 0.3: 3, 6 and 12 in 100)
  for (const D of CA.DEG) D.share = 1 / (M.T.HEARTH * M.T.WORK * D.of);
  CA.T = Object.assign({
    band: 1.5,          // the crown's choice: options within this of the best go to the draw
    raiseBand: 1.2,     // a lord's answer
    askEvery: 90,       // days between two councils on a call for the same need (a new, worse need is heard at once)
    drill: 30,          // days of drill before conscripts stand in ranks (more where sworn men are few)
    divMen: 8000,       // conscript foot in one division (ten companies of 800)
    capDivs: 16,        // conscript divisions a call forms at most (the rest wait at the muster and fill the gaps)
    keep: 12,           // ended calls kept in A.S.calls
    grKeep: 6,          // grievances a realm remembers (r.callGr)
    homeMen: 1000,      // an enemy host this large on home soil is a need
    reap: [6, 7, 8, 9], // the reaping months (45-economy's harvest weights are highest)
  }, CA.T || {});
  const W = () => A.WHY;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const ln = x => Math.log(Math.max(1e-6, x));
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 120);
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  const now = () => (A.absDay ? A.absDay() : A.S.year * 365);
  const month = () => (A.monthOf && A.today ? A.monthOf(A.today()).m : 0);
  const live = p => !!(p && p.alive);
  const provName = id => (A.provName ? A.provName(id) : String(id));
  const fmt = n => (A.fmt ? A.fmt(Math.round(n)) : String(Math.round(n)));

  // ---------------------------------------------------------------- the store
  const store = () => { const S = A.S; if (!Array.isArray(S.calls)) S.calls = []; return S.calls; };
  CA.all = () => (A.S && Array.isArray(A.S.calls) ? A.S.calls : []);
  CA.open = rid => CA.all().filter(c => !c.end && (rid == null || c.r === rid));
  CA.byId = id => CA.all().find(c => c.id === id) || null;
  CA.waiting = rid => CA.open(rid).reduce((a, c) => a + (c.wait || 0), 0);
  // men out of the fields now: taken less those come home (the dead are gone too, until the call ends)
  CA.out = c => Math.max(0, (c.men || 0) - (c.home || 0));
  const keep = () => {
    const L = store();
    let ended = 0;
    for (let i = L.length - 1; i >= 0; i--) if (L[i].end && ++ended > CA.T.keep) L.splice(i, 1);
  };

  // ---------------------------------------------------------------- the need
  // the enemy's men on the realm's own soil (the war map's divisions), with the largest host's place and realm
  CA.onSoil = function (rid) {
    const en = A.enemiesOf ? A.enemiesOf(rid) : [];
    let men = 0, at = null, by = null, top = 0;
    for (const eid of en) {
      const er = A.realm(eid);
      for (const d of (er && er.forces && er.forces.divs) || []) {
        const P = d && d.loc != null ? A.S.prov[d.loc] : null;
        if (!P || P.owner !== rid) continue;
        men += d.men || 0;
        if ((d.men || 0) > top) { top = d.men || 0; at = P.id; by = eid; }
      }
    }
    for (const P of A.realmProvs(rid)) if (P.occ && P.occ !== rid && !at) { at = P.id; by = P.occ; men = Math.max(men, CA.T.homeMen); }
    return { men, at, by };
  };
  // the standing men a realm has in the field or at home, without hosts a lord keeps back from the summons
  const ready = r => ((r.forces && r.forces.divs) || []).reduce((a, d) => a + (d && !d.call && !(A.CMD && A.CMD.held && A.CMD.held(d)) ? d.men || 0 : 0), 0);
  CA.foeMen = function (rid) {
    let n = 0;
    for (const eid of (A.enemiesOf ? A.enemiesOf(rid) : [])) { const e = A.realm(eid); if (e && e.alive) n += e.army || 0; }
    return n;
  };
  // the strongest need there is, or null: { t, deg (the most it allows), label, at, by, pub, w (its weight) }
  CA.need = function (r) {
    if (!r || r.alive === false || r.isRebel) return null;
    const wars = A.atWar(r.id);
    if (!wars.length) return null;
    const soil = CA.onSoil(r.id);
    if (soil.men >= CA.T.homeMen && soil.at != null) return { t: 'home', deg: 3, at: soil.at, by: soil.by, w: 2.4, pub: 1,
      label: `An enemy host of ${short(soil.by)} stands on our own soil at ${provName(soil.at)}` };
    const sieged = A.realmProvs(r.id).find(P => P.sgBy);
    if (sieged) return { t: 'siege', deg: 2, at: sieged.id, by: sieged.sgBy, w: 1.5, pub: 1, label: `${provName(sieged.id)} is besieged` };
    const atWar = r.menAtWar || 0, st = M.of(r).standing;
    if (atWar > 0 && st < atWar * 0.6) return { t: 'lost', deg: 2, at: null, by: null, w: 1.3, pub: 1, label: `A host lost: ${fmt(atWar - st)} men fallen since the war began` };
    const foe = CA.foeMen(r.id), mine = ready(r) + (r.roll || 0) * 0.5;
    if (foe > mine * 1.15) {
      const second = CA.open(r.id).some(c => c.deg === 1);
      return { t: 'few', deg: second ? 2 : 1, at: null, by: wars[0] ? (A.warSide(wars[0], r.id) === 'att' ? wars[0].leadD : wars[0].leadA) : null, w: r2(clamp(ln(foe / Math.max(1, mine)) * 1.5, .3, 1.6)), pub: 0,
        label: `Fewer spears than the enemy: the Generals count ${foe > mine * 2 ? 'twice' : foe > mine * 1.5 ? 'half again' : 'more than'} our men against us` };
    }
    // a war of the king's pride: no need but his will, and only where the law lets the crown call on its own word
    const ru = r.ruler != null ? A.P(r.ruler) : null, T = ru ? W().temper(ru) : {};
    if ((r.laws && r.laws.conscript) === 2 && (T.pride || 0) + (T.ambition || 0) > .6) return { t: 'will', deg: 1, at: null, by: null, w: 0, pub: 0, will: 1, label: 'The king\'s will: the law lets him call' };
    return null;
  };

  // ---------------------------------------------------------------- the crown decides (kind 'conscript')
  CA.grief = r => (Array.isArray(r.callGr) ? r.callGr.reduce((a, g) => a + (g[2] || 0) * Math.pow(.5, Math.max(0, A.S.year - g[0]) / 3), 0) : 0);
  CA.lawDeg = r => clamp((r.laws && r.laws.conscript != null ? r.laws.conscript : 1) + 1, 1, 3);
  CA.options = function (r, need) {
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source: Object.assign({ r: r.id }, source || {}), pub: pub ? 1 : 0 });
    const cap = M.rollCap(r), roll = r.roll || 0, reap = CA.T.reap.includes(month()), law = CA.lawDeg(r);
    const gr = CA.grief(r), stab = r.stability != null ? r.stability : 50, open = CA.open(r.id);
    const has = open.reduce((a, c) => Math.max(a, c.deg), 0);
    const none = { id: 'none', reasons: [
      rs('cost', .9 + (reap ? .8 : 0), reap ? 'Hands taken from the fields at the harvest' : 'Hands taken from the fields', { t: 'fields', id: month() }, 0),
      gr > .2 ? rs('fear', r2(clamp(gr / 3, 0, 1.5)), 'The commons remember the last call', { t: 'grievance', id: Math.round(gr * 10) / 10 }, 1) : null,
      stab < 40 ? rs('fear', .5, 'The throne is shaking', { t: 'stability', id: Math.round(stab) }, 1) : null,
      roll > cap * .4 ? rs('reckoning', .7, 'The roll still has men to send', { t: 'roll', id: Math.round(roll) }, 0) : null,
      has ? rs('reckoning', .6, 'A call is already out', { t: 'call', id: has }, 1) : null,
    ].filter(Boolean) };
    const opts = [none];
    for (const D of CA.DEG) {
      if (D.d > need.deg || D.d <= has) continue;
      const why = [
        need.will ? rs('insult', .9, need.label, { t: 'will' }, 0) : rs(need.t === 'home' ? 'duty' : 'reckoning', need.w, need.label, { t: need.t, at: need.by, id: need.at }, need.pub),
        roll < cap * .25 ? rs('reckoning', .8, 'The roll is spent', { t: 'roll', id: Math.round(roll) }, 0) : null,
        D.d > 1 ? rs('cost', -.5 * (D.d - 1), `${D.hearth} is a heavy call`, { t: 'size', id: D.d }, 1) : null,
        D.d > law ? rs('duty', -1.2, 'Beyond the conscription law: the lords must consent', { t: 'law', id: law }, 1) : null,
        (r.treasury || 0) < 0 ? rs('coin', A.WF && A.WF.broke && A.WF.broke(r) ? -1.5 : -.5, A.WF && A.WF.broke && A.WF.broke(r) ? 'The treasury is empty and deep in debt: no bread for them' : 'No coin to feed them', { t: 'treasury' }, 0) : null,
      ].filter(Boolean);
      opts.push({ id: 'c' + D.d, at: need.by, feeds: ['fear', 'anger', 'pride'], reasons: why });
    }
    return opts.length > 1 ? opts : null;
  };
  CA.decide = function (r, need, o) {
    o = o || {};
    const opts = CA.options(r, need);
    if (!opts) return null;
    return W().decide(r.id, 'conscript', opts, { band: CA.T.band, r: r.id, at: need.by || need.t, rand: o.rand, log: o.log, logIf: rec => rec.chose !== 'none' });
  };

  // ---------------------------------------------------------------- the lords answer the call in their lands
  // each province of the realm goes to the command whose seat is nearest: the crown's (its capital) or a tenant-in-chief's
  CA.lands = function (r) {
    const CM = A.CMD, tics = CM ? CM.tics(r.id) : [], seats = [];
    for (const h of tics) { const P = CM.seatProv(h); if (P && P.owner === r.id) seats.push([h.id, P]); }
    const cap = r.capitalProv != null ? A.S.prov[r.capitalProv] : null;
    const out = [];
    for (const P of A.realmProvs(r.id)) {
      if (P.occ && P.occ !== r.id) continue;
      let by = null, best = cap && A.wsDist ? A.wsDist(P.id, cap.id) : 1e9;
      for (const [hid, S] of seats) { const d = S.id === P.id ? 0 : A.wsDist ? A.wsDist(P.id, S.id) : 1e9; if (d < best) { best = d; by = hid; } }
      out.push([P.id, by]);
    }
    return out;
  };
  CA.raiseOptions = function (h, r, need, call) {
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source: Object.assign({ h: h.id }, source || {}), pub: pub ? 1 : 0 });
    const op = h.op != null ? h.op : 50, g = (50 - op) / 25, c = h.contract || {}, men = c.men != null ? c.men : 1;
    const near = A.CMD ? A.CMD.near(h) : [], foes = A.enemiesOf ? A.enemiesOf(r.id) : [];
    const mine = need.t === 'home' && A.CMD && A.CMD.seatProv(h) && (need.at === A.CMD.seatProv(h).id || near.some(x => foes.includes(x)));
    const reap = CA.T.reap.includes(month());
    const fac = (A.S.factions || []).find(f => f && f.realm === r.id && Array.isArray(f.members) && f.members.includes(h.id));
    return [
      { id: 'full', reasons: [rs('duty', .9 + .3 * (men - 1), 'His oath to the crown', { t: 'oath', id: men }, 1), rs('grudge', -.8 * g, g > 0 ? 'His grievance with the crown' : 'He has little against the crown', { t: 'opinion', id: Math.round(op) }, 1),
        mine ? rs('claim', 1.6, 'The enemy is in his own lands', { t: 'home', id: need.at }, 1) : null, need.t === 'home' ? rs('duty', .6, 'The realm is invaded', { t: 'home' }, 1) : null].filter(Boolean) },
      { id: 'half', reasons: [rs('reckoning', -.3, 'Half a call is still a call', { t: 'half' }, 0), reap ? rs('reckoning', .8, 'The harvest is not in', { t: 'season', id: month(), ex: 'harvest' }, 1) : null,
        rs('kin', .3, 'His tenants are his own', { t: 'tenants' }, 0), rs('grudge', .4 * g, 'His grievance with the crown', { t: 'opinion', id: Math.round(op) }, 1),
        (h.callGr || 0) > 1 ? rs('fear', .5, 'His villages still remember the last call', { t: 'grievance', id: h.callGr }, 1) : null].filter(Boolean) },
      { id: 'late', reasons: [rs('reckoning', -1, 'Lateness is remembered', { t: 'late' }, 0), rs('grudge', .5 * g, 'His grievance with the crown', { t: 'opinion', id: Math.round(op) }, 1),
        fac && /liberty|independence|claimant|peace/.test(fac.kind) ? rs('ambition', .9, 'Sworn to a faction that wants this king weaker', { t: 'faction', id: fac.id }, 0) : null,
        mine ? rs('claim', -1.5, 'The enemy is in his own lands', { t: 'home' }, 1) : null].filter(Boolean) },
    ];
  };

  // ---------------------------------------------------------------- the proclamation
  const hashId = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  CA.proclaim = function (r, deg, need, rec, o) {
    o = o || {};
    const D = CA.DEG[clamp(deg, 1, 3) - 1], S = A.S, t = now(), w = A.atWar(r.id)[0];
    const lands = CA.lands(r), by = new Map();
    for (const [pid, hid] of lands) { const k = hid || ''; if (!by.has(k)) by.set(k, []); by.get(k).push(pid); }
    const law = CA.lawDeg(r);
    // a heavier call takes the share it names in all, not on top of an earlier call still out: the men a province
    // already gave to an open call count toward it
    const given = new Map();
    for (const c of CA.open(r.id)) for (const p of c.provs) given.set(p[0], (given.get(p[0]) || 0) + p[1]);
    const call = {
      id: 'C' + S.year + '-' + r.id.replace(/[^0-9A-Z]/g, '') + '-' + (store().length + 1), r: r.id, deg: D.d, y: S.year, from: t,
      until: D.days ? t + D.days : null, w: w ? w.id : null, need: { t: need.t, at: need.at != null ? need.at : null, by: need.by || null, l: clean(need.label, 110) },
      law: D.d <= law ? 1 : 0, will: need.will ? 1 : 0, men: 0, dead: 0, home: 0, wait: 0, gone: 0, cmds: [], provs: [], why: [],
      ready: t + Math.round(CA.T.drill * (1 + clamp(1 - M.of(r).sworn / Math.max(1, M.pop(r) * M.T.SWORN), 0, 1) * .5)), stage: 'drill', pc: o.pc ? 1 : 0,
    };
    if (rec) call.why = rec.why.slice(0, 3).map(x => [clean(x[0], 90), Math.round(x[1] * 10) / 10]);
    // each command's lord answers; the crown's own lands raise in full
    for (const [hid, pids] of by) {
      const h = hid ? S.houses[hid] : null;
      let ans = 'full', top = null;
      if (h) {
        const opts = CA.raiseOptions(h, r, need, call);
        const rr = W().decide(W().houseMind(h), 'raise', opts, { band: CA.T.raiseBand, r: r.id, at: h.id, log: false, rand: o.rand });
        if (rr) { ans = rr.chose; top = rr.why[0] ? clean(rr.why[0][0], 70) : null; }
      }
      const frac = ans === 'half' ? .5 : 1;
      let men = 0;
      for (const pid of pids) {
        const P = S.prov[pid];
        const n = Math.round((P.pop || 0) / M.T.HEARTH / D.of * frac) - (given.get(pid) || 0);
        if (n <= 0) continue;
        call.provs.push([pid, n, 0, hid || null]);
        men += n;
      }
      call.men += men;
      call.cmds.push([hid || null, ans, men, top, ans === 'late' ? t + 60 : null]);
    }
    r.callAsk = t;
    if (call.men <= 0) return null;   // nothing left to take: every parish within reach has given what this call asks
    store().unshift(call);
    keep();
    // the tenants-in-chief's opinion of a call: a lord whose men go is a little prouder of the crown in a defence and
    // sorer in a war of the king's will; the grievance itself is reckoned when the call ends
    if (call.will) for (const [hid] of call.cmds) { const h = hid && S.houses[hid]; if (h) h.op = clamp((h.op != null ? h.op : 50) - 3, 0, 100); }
    CA.tell(call, 'proclaim');
    if (A.emit) A.emit('callProclaimed', call, r);
    return call;
  };

  // ---------------------------------------------------------------- the conscript foot
  CA.tpl = function (r) {
    const F = r.forces;
    if (!F) return null;
    let t = Object.values(F.tpl).find(x => x && x.call);
    if (t) return t;
    const lv = 'LV';
    t = A.tplAdd(r, { name: 'Conscript Host', bns: Array(10).fill(lv), sup: [], kind: 'garrison', share: 0.01 });
    t.call = 1;
    return t;
  };
  // form the drilled men into conscript foot, in each lord's contingent at his seat (the crown's at its capital)
  CA.form = function (call) {
    const r = A.realm(call.r);
    if (!r || !r.forces || r.alive === false) return 0;
    const t = CA.tpl(r), s = A.tplS(r.id, t.id), CM = A.CMD;
    let formed = 0, made = 0;
    const cap = r.capitalProv != null && A.S.prov[r.capitalProv] && !A.S.prov[r.capitalProv].occ ? r.capitalProv : (A.realmProvs(r.id).find(P => !P.occ) || {}).id;
    for (const c of call.cmds) {
      const [hid, ans, men, , late] = c;
      if (c[5] || men <= 0) continue;            // formed already
      if (late && now() < late) continue;        // a late lord's men come on their day
      const h = hid ? A.S.houses[hid] : null, seat = h && CM ? CM.seatProv(h) : null;
      const loc = seat && seat.owner === r.id && !seat.occ ? seat.id : cap;
      if (loc == null) continue;
      let left = men;
      const n = Math.min(Math.ceil(men / CA.T.divMen), Math.max(0, CA.T.capDivs - made - CA.divs(call).length));
      for (let i = 0; i < n && left > 0; i++) {
        const k = Math.min(left, Math.ceil(men / n));
        const d = A.newDiv(r, t.id, loc, { str: k / Math.max(1, s.men), exp: 4, eqf: 0, org: 0.7 });
        if (!d) break;
        d.men = k; d.call = call.id; if (hid) d.own = hid;
        // armed from the armoury as far as it goes: a poor lord's conscripts carry poor kit
        for (const e in s.eq) { const want = Math.round(s.eq[e] * k / Math.max(1, s.men)), take = Math.min(want, Math.floor((r.ind && r.ind.stock[e]) || 0)); d.eq[e] = take; if (r.ind) r.ind.stock[e] -= take; }
        left -= k; formed += k; made++;
      }
      call.wait += left;
      call.formed = (call.formed || 0) + men;
      c[5] = 1;
    }
    if (call.cmds.every(c => c[5] || c[2] <= 0)) call.stage = 'out';
    if (formed) A.forcesSync(r);
    return formed;
  };
  CA.divs = call => { const r = A.realm(call.r); return ((r && r.forces && r.forces.divs) || []).filter(d => d && d.call === call.id); };
  // a conscript division's gaps are filled from the men waiting at the muster, never from the roll
  CA.refill = function (d, r, frac) {
    const call = CA.byId(d.call);
    if (!call || call.end || !(call.wait > 0)) return 0;
    const s = A.divS(d), gap = Math.max(0, Math.min(s.men, CA.T.divMen) - d.men);
    const add = Math.min(gap, Math.ceil(gap * frac), Math.floor(call.wait));
    if (add <= 0) return 0;
    d.exp = (d.exp * d.men + 2 * add) / (d.men + add);
    d.men += add; call.wait -= add;
    return add;
  };

  // a conscript division disbanded before its call ends: its men go home to their hearths
  CA.sendHome = function (d) {
    const call = CA.byId(d && d.call);
    if (call && !call.end) call.home = (call.home || 0) + (d.men || 0);
    if (d) d.men = 0;
  };

  // ---------------------------------------------------------------- hands in the fields (45-economy, the taxes)
  // the share of a realm's output the calls take this month: the men out over the working men, twice that in the
  // reaping months, at most half
  CA.share = function (rid) {
    const r = A.realm(rid);
    if (!r) return 0;
    let out = 0;
    for (const c of CA.open(rid)) out += CA.out(c);
    return out > 0 ? clamp(out / Math.max(1, M.working(r)), 0, .5) : 0;
  };
  CA.fields = function (rid, mo) {
    const s = CA.share(rid);
    if (!s) return 1;
    const m = mo != null ? mo : month();
    return clamp(1 - s * (CA.T.reap.includes(m) ? 2 : 1), .3, 1);
  };

  // ---------------------------------------------------------------- the end of a call
  CA.release = function (call, how, rec) {
    const r = A.realm(call.r), S = A.S;
    if (call.end) return;
    // the men still at the musters (never formed: drilling, or a late lord's) go straight home with those in the field
    let back = (call.wait || 0) + Math.max(0, (call.men || 0) - (call.formed || 0));
    for (const d of CA.divs(call)) {
      back += d.men || 0;
      if (A.CMD && A.CMD.withdraw && d.army) A.CMD.withdraw(d);
      A.divRemove(d);
    }
    call.wait = 0;
    call.dead = Math.max(0, (call.men || 0) - back - (call.home || 0) - (call.gone || 0));
    call.home = (call.home || 0) + back;
    call.end = now();
    call.how = how || 'release';
    if (rec) call.endWhy = rec.why.slice(0, 2).map(x => [clean(x[0], 90), Math.round(x[1] * 10) / 10]);
    // the dead and the maimed do not come back: each province gave its share
    if (call.dead > 0 && call.men > 0) for (const p of call.provs) { const P = S.prov[p[0]]; const k = Math.round(call.dead * p[1] / call.men); p[2] = k; if (P) P.pop = Math.max(100, (P.pop || 0) - k); }
    if (r) { A.forcesSync(r); CA.grieve(call, r); }
    CA.tell(call, 'release');
    if (A.emit) A.emit('callEnded', call, r);
  };
  // the grievance: the call's weight (its degree, the months held, the dead, the promises broken), light for the realm's
  // own doors, heavier for a king's claim, heaviest for his will; eased by a bounty, a victory and a term kept
  CA.CAUSE = { home: .5, siege: .7, lost: .8, few: 1, will: 1.5 };
  CA.weight = function (call) {
    const months = Math.max(1, ((call.end || now()) - call.from) / 30.4);
    let g = call.deg * (1 + months / 6) * (1 + 3 * (call.dead || 0) / Math.max(1, call.men || 1)) * (CA.CAUSE[call.need.t] || 1);
    if (call.held) g += 1.5;
    if (call.how === 'bounty') g *= .7;
    if (call.won) g *= .6;
    if (!call.held && call.how !== 'hold') g *= .8;
    return r2(g);
  };
  CA.grieve = function (call, r) {
    const S = A.S, g = call.gr = CA.weight(call);
    const L = r.callGr = Array.isArray(r.callGr) ? r.callGr : [];
    L.push([call.y, call.deg, g, call.need.t, call.held ? 1 : 0]);
    if (L.length > CA.T.grKeep) L.splice(0, L.length - CA.T.grKeep);
    r.stability = clamp((r.stability || 50) - Math.round(g / 2), 0, 100);
    r.exhaustion = clamp((r.exhaustion || 0) + Math.round(g * 2), 0, 100);
    const label = `the call of ${call.y}`;
    // the provinces it touched remember it; the lords whose tenants went carry it
    for (const p of call.provs) { const P = S.prov[p[0]]; if (P) P.unrest = clamp((P.unrest || 0) + Math.round(clamp(g * 3, 1, 20)), 0, 100); }
    for (const [hid, ans, men] of call.cmds) {
      const h = hid && S.houses[hid];
      if (!h || !(men > 0)) continue;
      h.callGr = r2(((h.callGr || 0) * .5) + g);
      h.op = clamp((h.op != null ? h.op : 50) - Math.round(g), 0, 100);
      if (g >= 1 && A.CMD && A.CMD.grieve) A.CMD.grieve(h, 'call', `${label} took ${fmt(men)} of his tenants`);
      const hp = h.headPid != null ? A.P(h.headPid) : null;
      if (live(hp) && g >= 2 && hp.id !== A.S.pc) W().feel(hp, 'anger', { t: 'call', y: call.y, at: r.ruler, label: `${label} took his tenants`, pub: 1 }, clamp(g / 6, .2, .8));
    }
  };
  // the commons' long memory: a pressure on stability each year, fading by half every three years
  (A.onYear = A.onYear || []).push(function () {
    try {
      for (const id of Object.keys(A.S.realms || {})) {
        const r = A.S.realms[id];
        if (!r || r.alive === false || !Array.isArray(r.callGr) || !r.callGr.length) continue;
        const g = CA.grief(r);
        if (g >= .5) r.stability = clamp((r.stability || 50) - Math.min(4, Math.round(g / 3)), 0, 100);
        r.callGr = r.callGr.filter(x => A.S.year - x[0] < 18);
      }
    } catch (e) { console.error('[calls] year', e); }
  });

  // the term: release when the need is gone or the term is up, or hold them (a decision, counted against him)
  CA.releaseOptions = function (r, call, needNow) {
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source: Object.assign({ r: r.id }, source || {}), pub: pub ? 1 : 0 });
    const due = call.until != null && now() >= call.until, gone = !needNow || (call.deg === 3 && needNow.t !== 'home');
    const war = A.atWar(r.id).length > 0, reap = CA.T.reap.includes(month()), coin = (r.treasury || 0) > CA.out(call) * 1.5;
    const keepR = [war ? rs('reckoning', needNow ? needNow.w : .6, needNow ? needNow.label : 'The war goes on', { t: needNow ? needNow.t : 'war' }, needNow ? needNow.pub : 1) : rs('reckoning', -2, 'The war is over', { t: 'peace' }, 1),
      due ? rs('duty', -1.4, 'Their term is up: they were promised home', { t: 'term' }, 1) : null, reap ? rs('cost', -.8, 'The harvest wants them', { t: 'fields' }, 1) : null, call.held ? rs('fear', -.6, 'The men already grumble at the broken promise', { t: 'held' }, 1) : null].filter(Boolean);
    return [
      { id: 'release', reasons: [rs('duty', gone ? 1.5 : .3, gone ? 'The need they were called for is past' : 'They have served', { t: 'need' }, 1), reap ? rs('cost', .6, 'The harvest wants them', { t: 'fields' }, 1) : null].filter(Boolean) },
      { id: 'bounty', reasons: [rs('duty', gone ? 1.5 : .3, gone ? 'The need they were called for is past' : 'They have served', { t: 'need' }, 1), rs('coin', coin ? -.4 : -2.5, coin ? 'A bounty at release costs coin' : 'No coin for a bounty', { t: 'treasury' }, 0), rs('loyalty', .5, 'A bounty eases the parishes', { t: 'grievance' }, 1)] },
      { id: 'hold', reasons: keepR },
    ];
  };
  CA.term = function (call, o) {
    o = o || {};
    const r = A.realm(call.r);
    if (!r || r.alive === false) return CA.release(call, 'gone');
    if (!A.atWar(r.id).length) return CA.release(call, 'peace');
    const needNow = CA.need(r);
    const due = call.until != null && now() >= call.until, gone = !needNow || (call.deg === 3 && needNow.t !== 'home');
    if (!due && !gone) return null;
    if (call.asked && now() - call.asked < 60) return null;
    call.asked = now();
    if (call.pc && CA.pcRuler && CA.pcRuler(r)) return CA.askRelease(call, needNow);
    const rec = W().decide(r.id, 'release', CA.releaseOptions(r, call, needNow), { band: 1, r: r.id, at: call.id, rand: o.rand, logIf: x => x.chose === 'hold' });
    if (!rec) return CA.release(call, 'release');
    if (rec.chose === 'hold') { if (due && !call.held) { call.held = A.S.year; CA.tell(call, 'hold'); } return 'hold'; }
    if (rec.chose === 'bounty') { const n = Math.round(CA.out(call) * 1); r.treasury = (r.treasury || 0) - n; if (A.RI && A.RI.book) A.RI.book(r, 'drill', n); }
    CA.release(call, rec.chose, rec);
    return rec.chose;
  };

  // ---------------------------------------------------------------- the month
  CA.pcRuler = r => { const pc = A.pc && A.pc(); return !!(pc && pc.alive && pc.ruler === r.id && !(r.forces && r.forces.auto)); };
  CA.month = function () {
    const S = A.S;
    if (!S || !S.realms) return;
    const t = now();
    for (const call of CA.open()) {
      const r = A.realm(call.r);
      if (!r || r.alive === false) { CA.release(call, 'gone'); continue; }
      // drilled a month or more by the sworn men, then formed; a late lord's men on their day
      if (call.stage === 'drill' && t >= call.ready) call.stage = 'form';
      if (call.stage === 'form') CA.form(call);
      // the taxes the absent hands would have paid
      const sh = CA.out(call) / Math.max(1, M.working(r));
      if (sh > 0 && !r.playerRun) r.treasury = (r.treasury || 0) - Math.round((r.income || 0) / 12 * sh * .5);
      CA.term(call);
    }
    for (const id of Object.keys(S.realms)) {
      const r = S.realms[id];
      if (!r || r.alive === false || r.isRebel || !A.atWar(id).length) continue;
      const need = CA.need(r);
      if (!need) continue;
      const has = CA.open(id).reduce((a, c) => Math.max(a, c.deg), 0);
      if (need.deg <= has) continue;
      // a council on a call at most every few months, unless the enemy now stands on home soil
      if (r.callAsk && t - r.callAsk < CA.T.askEvery && !(need.t === 'home' && r.callNeed !== 'home')) continue;
      r.callAsk = t; r.callNeed = need.t;
      if (CA.pcRuler(r)) { if (CA.askProclaim) CA.askProclaim(r, need); continue; }
      const rec = CA.decide(r, need);
      if (rec && rec.chose !== 'none') CA.proclaim(r, +rec.chose.slice(1), need, rec);
    }
  };
  A.onMonth.push(function () { try { CA.month(); } catch (e) { console.error('[calls] month', e); } });
  // a war's start: the standing men in the field are the mark a lost host is measured from
  A.on && A.on('warStart', function (w) {
    try { for (const id of (w.att || []).concat(w.def || [])) { const r = A.realm(id); if (r && !(r.menAtWar > 0 && A.atWar(id).length > 1)) r.menAtWar = M.of(r).standing; } } catch (e) { console.error('[calls] start', e); }
  });
  // a war's end: a victory eases the grievance; every call of a realm at peace ends
  A.on && A.on('warEnd', function (w, result) {
    try {
      for (const call of CA.open()) {
        if (call.w !== (w && w.id)) continue;
        const side = A.warSide(w, call.r);
        if ((result === 'att' && side === 'att') || (result === 'def' && side === 'def')) call.won = 1;
        const r = A.realm(call.r);
        if (!r || !A.atWar(call.r).length) CA.release(call, 'peace');
      }
      for (const id of (w.att || []).concat(w.def || [])) { const r = A.realm(id); if (r && !A.atWar(id).length) delete r.menAtWar; }
    } catch (e) { console.error('[calls] end', e); }
  });

  // ---------------------------------------------------------------- the news
  // the realm hears of a call (who, how many, for what); the player hears it at his place: the whole proclamation in his
  // own realm, a line from abroad only when it is his enemy's
  CA.tell = function (call, what) {
    const pc = A.pc && A.pc(), r = A.realm(call.r);
    if (!pc || !r) return;
    const D = CA.DEG[call.deg - 1], mine = pc.realm === call.r, foe = A.enemiesOf && A.enemiesOf(pc.realm).includes(call.r);
    if (!mine && !foe) return;
    const who = short(call.r);
    let s = '';
    if (what === 'proclaim') s = mine ? `${who} proclaims ${D.word}: ${D.hearth} sends a man, by lot, for ${D.term}. ${clean(call.need.l)}.` + (call.law ? '' : ' It goes beyond the conscription law, and the lords know it.')
      : `${who} calls its people to arms by lot.`;
    else if (what === 'hold') s = mine ? `The crown holds the conscripts of ${call.y} past their term.` : '';
    else if (what === 'release') s = mine ? `The conscripts of ${call.y} go home: ${fmt(call.home || 0)} of ${fmt(call.men)}${call.dead ? `; ${fmt(call.dead)} do not` : ''}.` : '';
    if (s && A.news) A.news(s, 'war');
  };

  // a call adopted from an old save's host of conscript foot in the field (A.MEN.convert): the war's need as it stands, or the will
  CA.adopt = function (r, w, divs) {
    const need = CA.need(r) || { t: 'few', deg: 1, label: 'The war already being fought', w: .5, pub: 1 };
    const call = CA.proclaim(r, Math.min(need.deg, 2), need, null, { quiet: 1 });
    if (!call) return null;
    for (const c of call.cmds) c[5] = 1;
    call.stage = 'out';
    let men = 0;
    for (const d of divs) { d.call = call.id; men += d.men || 0; }
    call.wait = 0; call.men = Math.max(call.men, men);
    return call;
  };
})();
