// The Polity, part two: bills (Victoria 3's enactment, calibrated to 56-realm-inside's one-shot odds).
//
// A law no longer changes at once. 56's loudest push at the New Year court opens a bill (RI.session, replaced here
// from this folder: patch PO-BILL is this wrap, no blob edit), and so do the ruler, the Chancellor's draft, an angry
// estate's petition and the player. One bill at a time. Every 60 days a count: pass, advance, stall or debate. Three
// stalls, or six counts without a pass, and the bill fails.
//
// Calibration. The chance a bill passes within its 360 days is the odds 56 gave the same push in one throw
// (RI.odds), times a little for legitimacy (0.9 + 0.2 × legit/100). The pass chance at each count is solved for that
// target from the stall and debate chances, which come from the balance m of support against opposition:
//   m = (S − O) / (S + O + 0.01); debate 0.08 + 0.12 (1 − |m|); stall clamp(0.20 − 0.15 m, 0.05, 0.40).
// A debate moves m (a persuasion check in the player's realm, A.chance(0.5 + 0.25 × the estates' lean) elsewhere) and
// each 0.1 of m moves the target by 0.045. The test poBillOdds holds the pass rate to 56's odds within 5 points.
const POL = A.POL, RI = A.RI = A.RI || {};
const clamp = POL.clamp, r2 = POL.r2, live = p => !!(p && p.alive);
POL.BILL = { every: 60, checks: 6, stalls: 3, dm: .1, pdm: .15, legit0: .9, legit1: .2 };

// ---------------------------------------------------------------- the pushes for the five new law groups

const NEWK = {};
for (const g of POL.NEW) {
  const L = GD.POL_LAWS[g];
  L.pos.forEach((name, to) => {
    const k = `po_${g}_${to}`;
    NEWK[k] = { g, to };
    if (RI.PUSH) RI.PUSH[k] = { t: `${name.charAt(0).toLowerCase() + name.slice(1)} (${L.n.toLowerCase()})`, law: g, po: true,
      ok: r => { if (!POL.on) return false; const cur = POL.pos(r, g); return cur !== to && (!L.ord || Math.abs(cur - to) === 1); } };
  });
}
POL.NEWK = NEWK;
// any law push as {g, to}: 56's six and the fifteen new ones; pure
POL.keyOf = function (r, k) {
  if (NEWK[k]) return NEWK[k];
  const P = RI.PUSH && RI.PUSH[k]; if (!P || !P.law) return null;
  const g = P.law === 'authority' ? 'auth' : P.law, cur = POL.pos(r, g);
  return { g, to: clamp(cur + (/Up$/.test(k) ? 1 : -1), 0, GD.POL_LAWS[g].pos.length - 1) };
};
// how much an estate gains (+) or loses (−) by push k, -6..6; pure
POL.estGain = function (r, k, e) {
  const x = POL.keyOf(r, k); if (!x) return 0;
  const A0 = GD.POL_LAWS[x.g].ap[e];
  return (A0[x.to] || 0) - (A0[POL.pos(r, x.g)] || 0);
};
// how each want leans on the new groups' positions (-1..1), by group and position
const W_NEW = {
  liberty: { obl: [1, 0, -1], just: [1, 0, -.5] }, order: { obl: [-.6, 0, .8], just: [-.6, .5, .6], faith: [.3, 0, 0] },
  wealth: { trade: [.3, .6, .2], comm: [.5, 0, -.5] }, faith: { faith: [.6, -1, 1], just: [.2, .2, -.6] },
  peace: { comm: [-.4, 0, .4], obl: [.2, 0, -.3] }, glory: { obl: [-.4, 0, .6] }, works: { trade: [.2, -.2, .5], just: [0, .2, .5] },
  crown: { obl: [.4, 0, -.4] },
};
const F_NEW = { tyranny: { obl: [.6, 0, -.8], just: [.5, 0, -.3] }, heresy: { faith: [.5, -.8, .8] }, unrest: { comm: [-.6, 0, .4] }, ruin: { trade: [0, .3, -.2] } };
const baseStance = RI.stance;
RI.stance = function (v, k, r) {
  const x = NEWK[k];
  if (!x) return baseStance.apply(this, arguments);
  try {
    const P = RI.PUSH[k]; if (!P || !P.ok(r)) return 0;
    const a = RI.aims(v.p); if (!a) return 0;
    const cur = POL.pos(r, x.g), d = (o, kk) => { const t = o && o[kk] && o[kk][x.g]; return t ? (t[x.to] || 0) - (t[cur] || 0) : 0; };
    let s = d(W_NEW, a.want) + .7 * d(F_NEW, a.fear) + POL.estGain(r, k, POL.estateOf(v.p)) / 5;
    if (v.seat === 'chaplain' && x.g === 'faith') s += x.to === 1 ? -.4 : .3;
    if (v.seat === 'treasurer' && x.g === 'trade' && x.to === 1) s += (RI.years(r) < 1 ? .4 : .1);
    if (v.seat === 'marshal' && x.g === 'obl' && x.to > cur) s += .3;
    if (v.seat === 'chancellor' && x.g === 'just' && x.to > cur) s += .2;
    // a push away from the realm's own custom loses force, as 56's do
    const c = POL.custom(r, x.g), d0 = Math.abs(cur - c), d1 = Math.abs(x.to - c);
    if (s > 0) s *= d1 > d0 ? Math.pow(.55, d1 - 1) * (d1 >= 2 ? .8 : 1) : 1.15;
    return clamp(s, -1.5, 1.5);
  } catch (e) { return 0; }
};
// custom pulls the new laws home, as RI.custom pulls taxes
const baseOdds = RI.odds;
RI.odds = function (r, t) {
  const o = baseOdds.apply(this, arguments);
  try {
    const x = t && NEWK[t.k];
    if (x) {
      const cur = POL.pos(r, x.g), c = POL.custom(r, x.g), d0 = Math.abs(cur - c), d1 = Math.abs(x.to - c), lab = `${GD.POL_LAWS[x.g].n} have always been ${POL.posName(x.g, c).toLowerCase()} here`;
      const add = d1 > d0 ? -r2(.15 * d1) : d0 > 0 ? r2(.12 * d0) : 0;
      if (add) { o.why.push([lab.replace(/^(Trade|Faith|Justice) have/, '$1 has'), add]); o.p = r2(clamp(o.p + add, .03, .9)); }
    }
    // a right granted to a house weighs on the next authority bill
    if (t && t.k === 'authUp' && r.pol && r.pol.authMinus) { o.why.push(['Rights granted to the lords', -r.pol.authMinus]); o.p = r2(clamp(o.p - r.pol.authMinus, .03, .9)); }
  } catch (e) {}
  return o;
};
const baseApply = RI.applyLaw;
RI.applyLaw = function (r, k) {
  const x = NEWK[k];
  if (!x) return baseApply.apply(this, arguments);
  POL.init(r);
  const cur = POL.pos(r, x.g);
  r.pol.laws2[x.g] = x.to;
  POL.stats.laws2++;
  // every house feels it, as 56's laws are felt (heavier obligations −6, the lords' courts given back +3)
  const FX = { obl: [3, 0, -6], just: [3, 0, -3], comm: [2, 0, -3], trade: [0, -2, 0], faith: [0, 0, 0] }[x.g];
  const d = FX ? (FX[x.to] || 0) - (FX[cur] || 0) : 0;
  if (d) for (const h of A.realmHouses(r.id)) h.op = clamp((h.op != null ? h.op : 50) + d, 0, 100);
  // obligations: the default contract for new grants; the houses' own contracts stand until changed
  if (x.g === 'faith' && x.to === 1) r.stability = clamp(r.stability + 1, 0, 100);
};

// ---------------------------------------------------------------- the bill

// support and opposition, clout-weighted by estate plus the court's voices (56's tally); pure
POL.sides = function (r, k, T) {
  T = T || RI.tally(r);
  const t = T[k] || { sup: 0, opp: 0, pro: [], con: [] }, cl = POL.clout(r), est = [];
  let S = t.sup, O = t.opp, Se = 0, Oe = 0;
  for (const e of POL.EST) { const g = POL.estGain(r, k, e), w = r2(cl[e] * Math.abs(g) / 2); est.push({ e, g, w, cl: cl[e] }); if (g > 0) { S += w; Se += w; } else if (g < 0) { O += w; Oe += w; } }
  const b = r.pol && r.pol.bill;
  if (b && b.k === k && b.pc) { if (b.pc.side === 'for') S += b.pc.w; else O += b.pc.w; }
  return { S: r2(S), O: r2(O), m: r2((S - O) / (S + O + .01)), mEst: r2((Se - Oe) / (Se + Oe + .01)), est, t };
};
// chances at one count for a bill whose balance is m and whose pass chance is h; pure
const probs = (m, h, first) => {
  let d = .08 + .12 * (1 - Math.abs(m)), s = clamp(.20 - .15 * m, .05, .40);
  if (first) h = 0;
  const tot = h + d + s; if (tot > 1) { d /= tot; s /= tot; h /= tot; }
  return { pass: h, deb: d, stall: s, adv: Math.max(0, 1 - h - d - s) };
};
// the chance a bill passes from count n (counts done) with st stalls, at pass chance h per count; pure
const passFrom = (m, h, n, st) => {
  const B = POL.BILL;
  let st0 = new Array(B.stalls).fill(0); st0[st] = 1;
  let won = 0;
  for (let i = n + 1; i <= B.checks; i++) {
    const p = probs(m, h, i === 1), nx = new Array(B.stalls).fill(0);
    for (let s = 0; s < B.stalls; s++) {
      if (!st0[s]) continue;
      won += st0[s] * p.pass;
      if (s + 1 < B.stalls) nx[s + 1] += st0[s] * p.stall;
      nx[s] += st0[s] * (p.deb + p.adv);
    }
    st0 = nx;
  }
  return won;
};
POL.passFrom = passFrom;
// the pass chance per count that makes the bill pass with chance P overall, from count n with st stalls; pure
POL.solveH = function (m, P, n, st) {
  let lo = 0, hi = 1;
  if (passFrom(m, 1, n, st) <= P) return 1;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (passFrom(m, mid, n, st) < P) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};
POL.legitF = r => POL.BILL.legit0 + POL.BILL.legit1 * clamp(r.legit != null ? r.legit : 50, 0, 100) / 100;
// what a bill for push k would be: 56's one-shot odds p0, the target P, the balance m and the pass chance h; pure
POL.billTarget = function (r, k, T, adv) {
  T = T || RI.tally(r);
  const t = T[k], sd = POL.sides(r, k, T), o = RI.odds(r, t);
  const P = clamp(o.p * POL.legitF(r) + .045 * (adv || 0) / POL.BILL.dm, .02, .95);
  return { t, sd, o, p0: o.p, P, m: sd.m, mEst: sd.mEst, h: Math.round(POL.solveH(sd.m, P, 0, 0) * 1000) / 1000 };
};
// open a bill for push k: by = the person who brought it, src = 'court' | 'ruler' | 'draft' | 'estate' | 'player'
POL.openBill = function (r, k, by, src, extra) {
  const pol = POL.init(r); if (!pol || pol.bill) return null;
  const P = RI.PUSH[k]; if (!P || !P.law || !P.ok(r)) return null;
  const x = POL.keyOf(r, k);
  let adv = 0;
  if (pol.draft && A.S.year - pol.draft <= 1) { adv = 1; pol.draft = null; }
  const B = POL.billTarget(r, k, null, adv), t = B.t || { pro: [], con: [] };
  const day = A.absDay();
  pol.bill = Object.assign({ k, g: x.g, to: x.to, from: POL.pos(r, x.g), by: by ? by.id : null, src: src || 'court', since: day, next: day + POL.BILL.every, n: 0, adv, st: 0,
    m0: B.m, dm: 0, p0: r2(B.p0), P: r2(B.P), h: B.h, log: [], sup: (t.pro || []).slice(0, 3).map(x => x[0].p.id), opp: (t.con || []).slice(0, 3).map(x => x[0].p.id), why: B.o.why.slice(0, 5) }, extra || {});
  POL.stats.bills++;
  return pol.bill;
};
// the odds at the next count, and the current balance; pure
POL.billOdds = function (r) {
  const b = r.pol && r.pol.bill; if (!b) return null;
  const m = clamp(b.m0 + b.dm, -1, 1), p = probs(m, b.h, b.n === 0);
  return { m: r2(m), pass: r2(p.pass), adv: r2(p.adv), stall: r2(p.stall), deb: r2(p.deb), P: b.P, eventual: r2(passFrom(m, b.h, b.n, b.st)) };
};
// a debate moved the balance: the target follows, and the pass chance is solved again from where the bill stands
POL.moveBill = function (r, d) {
  const b = r.pol.bill; if (!b) return;
  b.dm = r2(clamp(b.dm + d, -1, 1));
  b.P = r2(clamp(b.P + .45 * d, .02, .95));
  const m = clamp(b.m0 + b.dm, -1, 1);
  // the remaining chance moves by what the target moved by: solve the pass chance again from here
  const left = clamp(passFrom(m, b.h, b.n, b.st) + .45 * d, .01, .97);
  b.h = r2(POL.solveH(m, left, b.n, b.st) * 1000) / 1000;
};
const GLYPH = { pass: '✓', adv: '→', stall: '‖', deb: '⁇', fail: '✗' };
POL.GLYPH = GLYPH;
// one count of the bill
POL.billCount = function (r) {
  const b = r.pol.bill; if (!b) return null;
  const P = RI.PUSH[b.k];
  if (!P || !P.ok(r)) { POL.endBill(r, false, 'The law changed under it'); return 'void'; }
  const o = POL.billOdds(r), x = A.rf(0, 1);
  const out = x < o.pass ? 'pass' : x < o.pass + o.stall ? 'stall' : x < o.pass + o.stall + o.deb ? 'deb' : 'adv';
  b.n++; b.log.push([A.absDay(), out]); b.next = A.absDay() + POL.BILL.every;
  if (out === 'pass') { POL.endBill(r, true); return out; }
  if (out === 'stall') { b.st++; if (b.st >= POL.BILL.stalls) { POL.endBill(r, false, 'Stalled three times'); return 'fail'; } }
  if (out === 'adv') b.adv++;
  if (out === 'deb') POL.debate(r);
  if (b.n >= POL.BILL.checks && r.pol.bill === b) { POL.endBill(r, false, 'Six counts and no majority'); return 'fail'; }
  return out;
};
// a debate: a scene for a player who rules or sits on the council here; elsewhere the balance moves on a throw
POL.debate = function (r) {
  const b = r.pol.bill, pc = A.pc();
  const mine = pc && pc.alive && (pc.ruler === r.id || (pc.office && pc.realm === r.id && (r.council || {})[pc.office] === pc.id));
  if (mine && A.EV.po_debate && !b.scene && !A.S.queue.some(q => q.ev === 'po_debate')) {
    b.scene = A.S.year;
    const sd = POL.sides(r, b.k), foe = A.P(b.opp[0]), friend = A.P(b.sup[0]);
    A.queue({ type: 'event', ev: 'po_debate', ctx: { rid: r.id, bill: RI.PUSH[b.k].t, pid: foe && foe.alive ? foe.id : null, foeName: foe ? A.fullName(foe, false) : 'an old lord', friendName: friend ? A.fullName(friend, false) : 'nobody', dd: Math.round(45 + 20 * Math.abs(sd.m)) } });
    return;
  }
  const sd = POL.sides(r, b.k);
  POL.moveBill(r, A.chance(clamp(.5 + .25 * sd.mEst, .2, .8)) ? POL.BILL.dm : -POL.BILL.dm);
};
// the end of a bill: the law changes (or does not), the estates and houses remember, the court's record names it
POL.endBill = function (r, yes, why) {
  const b = r.pol.bill; if (!b) return;
  r.pol.bill = null;
  const P = RI.PUSH[b.k], who = A.P(b.by);
  const T = RI.tally(r), t = T[b.k] || { pro: [], con: [] };
  if (yes) {
    RI.applyLaw(r, b.k);
    for (const [v, s] of t.pro) if (v.h) v.h.op = clamp((v.h.op != null ? v.h.op : 50) + Math.round(4 * s), 0, 100);
    for (const [v, s] of t.con) if (v.h) v.h.op = clamp((v.h.op != null ? v.h.op : 50) - Math.round(4 * s), 0, 100);
    POL.stats.passed++;
  } else POL.stats.failed++;
  // estates for it gain, those against lose (2 either way); estates that wanted it and lost it sour by 1
  for (const e of POL.EST) {
    const g = (GD.POL_LAWS[b.g].ap[e][b.to] || 0) - (GD.POL_LAWS[b.g].ap[e][b.from] || 0);
    if (!g) continue;
    const E = r.pol.est[e];
    E.mod = clamp((E.mod || 0) + (yes ? (g > 0 ? 2 : -2) : (g > 0 ? -1 : 0)), -6, 6);
  }
  const rec = { k: b.k, who: b.by, seat: null, house: who && POL.houseOf(who) ? who.house : null, sup: b.sup, opp: b.opp, yes, p: Math.round(b.P * 100), bill: b.n, src: b.src,
    why: (b.why || []).concat(why ? [[why, 0]] : []).slice(0, 5), pcSide: b.pc ? b.pc.side : null, ruler: b.src === 'player' && A.pc() && A.pc().ruler === r.id ? 1 : 0 };
  for (const s in (r.council || {})) if (r.council[s] === b.by) rec.seat = s;
  if (RI.logCourt) RI.logCourt(r, rec);
  r.pol.last = { k: b.k, g: b.g, to: b.to, from: b.from, yes, y: A.S.year, log: b.log, by: b.by, src: b.src, P: b.P };
  try { if (A.aiLogAdd && who) A.aiLogAdd('court', r.id, null, `${yes ? 'passes a law for' : 'lets fall the bill for'} ${P ? P.t : 'a law'}, brought by ${A.fullName(who, false)}.`, (b.why || []).map(x => [x[0], yes ? x[1] : -x[1], x[2]])); } catch (e) {}
  const pc = A.pc();
  if (pc && pc.alive && (pc.realm === r.id || pc.ruler === r.id) && P) {
    A.log(`${r.short}: the bill for ${P.t} ${yes ? 'passes' : 'fails'}${yes ? '' : ' (' + String(why || 'no majority').toLowerCase() + ')'}.`, yes ? 'crown' : 'warn');
    if (yes && A.EV.po_bill_passed && pc.ruler !== r.id && A.isAdult(pc)) {
      const mine = POL.pcEstate(pc), g = (GD.POL_LAWS[b.g].ap[mine][b.to] || 0) - (GD.POL_LAWS[b.g].ap[mine][b.from] || 0);
      if (g < 0 && !(pc.flags.ev && pc.flags.ev.po_bill_passed && A.S.year - pc.flags.ev.po_bill_passed < 4)) A.queue({ type: 'event', ev: 'po_bill_passed', ctx: { bill: P.t, estate: POL.estName(mine, r.id), realmT: r.short } });
    }
  }
};
// counts come due on the month: every realm with a bill
POL.billMonth = function () {
  if (!POL.on || !A.S || !A.S.realms) return;
  const day = A.absDay();
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (!r || !r.pol || !r.pol.bill) continue;
    if (!r.alive || r.isRebel) { r.pol.bill = null; continue; }
    if (day >= r.pol.bill.next) { try { POL.billCount(r); } catch (e) { console.error('[po] bill', e); r.pol.bill = null; } }
  }
};
A.onMonth.push(() => POL.billMonth());

// ---------------------------------------------------------------- 56's court session, with bills (PO-BILL)

const ids = list => list.slice(0, 3).map(x => x[0].p.id);
const baseSession = RI.session;
RI.session = function (r) {
  if (!POL.on || !r || !r.alive || r.isRebel || !A.COUNCIL) return baseSession.apply(this, arguments);
  const pc = A.pc(), playerRules = !!(pc && pc.ruler === r.id);
  if (playerRules) return baseSession.apply(this, arguments);   // the player hears the push as a petition (56's ri_court_push)
  A.polInit && A.polInit(r);
  POL.init(r);
  if (!r.riLaw0) r.riLaw0 = { authority: r.laws.authority != null ? r.laws.authority : 1, tax: (r.laws && r.laws.tax) || 1 };
  RI.ensureHeads(r);
  RI.fillCouncil(r);
  const ag = r.riAgenda && r.riAgenda.y === A.S.year ? r.riAgenda : null;
  const pv = ag && ag.pc && ag.pc.y === A.S.year ? { k: ag.k, side: ag.pc.side, w: ag.pc.w } : null;
  const T = RI.tally(r, pv);
  let res = null;
  RI.deal(r);
  if (!r.pol.bill) {
    const t = ag && T[ag.k] && RI.PUSH[ag.k].ok(r) && T[ag.k].pro.length ? T[ag.k] : RI.agendaOf(T, true, r);
    if (t) {
      const top = t.pro[0] ? t.pro[0][0] : null;
      const b = POL.openBill(r, t.k, top ? top.p : null, 'court', pv ? { pc: { side: pv.side, w: pv.w } } : null);
      if (b) {
        res = { k: t.k, who: top ? top.p.id : null, bill: true, sup: ids(t.pro), opp: ids(t.con) };
        // a rich realm's lighter taxes, the treasurer's remit (56's p 100), still lands at once
      }
    }
  }
  const s = RI.agendaOf(T, false);
  r.riPri = s ? { k: s.k, y: A.S.year, who: s.pro[0][0].p.id, house: s.pro[0][0].h ? s.pro[0][0].h.id : null } : null;
  const T2 = RI.tally(r), nx = RI.agendaOf(T2, true, r);
  r.riAgenda = nx && !r.pol.bill ? { y: A.S.year + 1, k: nx.k, who: nx.pro[0][0].p.id } : nx ? { y: A.S.year + 1, k: nx.k, who: nx.pro[0][0].p.id } : null;
  return res;
};

// ---------------------------------------------------------------- petitions: an angry estate asks for its law

// the change an estate wants most, among the pushes the realm allows: {k, g} or null; pure
POL.estWant = function (r, e) {
  let best = null, bv = 0;
  for (const k in RI.PUSH) { const P = RI.PUSH[k]; if (!P.law || !P.ok(r)) continue; const g = POL.estGain(r, k, e); if (g > bv) { bv = g; best = k; } }
  return best ? { k: best, g: bv } : null;
};
POL.petitions = function (r) {
  const pol = r.pol; if (!pol || pol.bill) return null;
  if (pol.pet && A.S.year - pol.pet < 3) return null;
  const ES = POL.estState(r);
  const angry = POL.EST.filter(e => ES[e].angry && ES[e].cl >= .2).sort((a, b) => ES[a].ap - ES[b].ap || ES[b].cl - ES[a].cl)[0];
  if (!angry) return null;
  const w = POL.estWant(r, angry); if (!w) return null;
  const lead = ES[angry].lead;
  const pc = A.pc();
  if (pc && pc.ruler === r.id) {
    // a ruling player hears the petition as a scene
    if (A.EV.po_petition && !A.S.queue.some(q => q.ev === 'po_petition')) { pol.pet = A.S.year; A.queue({ type: 'event', ev: 'po_petition', ctx: { rid: r.id, pk: w.k, estate: ES[angry].name, bill: RI.PUSH[w.k].t, pid: lead && lead.id !== pc.id ? lead.id : null } }); }
    return null;
  }
  const b = POL.openBill(r, w.k, lead, 'estate', { est: angry });
  if (b) pol.pet = A.S.year;
  return b;
};
const baseAfter = POL.afterYear;
POL.afterYear = function (r) {
  if (baseAfter) baseAfter.apply(this, arguments);
  POL.petitions(r);
};
