// The Polity, part four: the player inside it. Their estate, offices sought and held, the oath to the crown, the
// bill's debate, the election as candidate and as elector, the home that changes crowns. Engine actions (UI.A, the
// fx keys below) draw dice only with A.chance and A.ri.
const POL = A.POL, RI = A.RI = A.RI || {};
const clamp = POL.clamp, r2 = POL.r2, live = p => !!(p && p.alive);
(A.FX_EXTRA = A.FX_EXTRA || []).push('poBill', 'poPet', 'poOff', 'poMuster', 'poOath', 'poCrown', 'poCase', 'poGraft', 'poEst', 'poVote', 'poToll', 'poMarch', 'poCustoms');

// condition helpers, so A.CX_RX classes the events: C.estate(p, 'burg'), C.holds(p, 'gov')
Object.assign(A.C, {
  estate: (p, k) => POL.pcEstate(p) === k,
  holds: (p, k) => POL.officesOf(p).some(([, o]) => !k || o.k === k),
});
POL.pcPol = pc => { if (!pc.pol || typeof pc.pol !== 'object') pc.pol = { promises: [], petition: null, sought: {} }; pc.pol.promises = pc.pol.promises || []; pc.pol.sought = pc.pol.sought || {}; return pc.pol; };
POL.myRealm = pc => pc ? A.realm(pc.ruler || (pc.noble ? pc.noble.realm : pc.realm)) : null;
const refresh = () => (UI.refreshTab ? UI.refreshTab() : UI.refresh());
const warn = m => { A.log(m, 'warn'); refresh(); return false; };
const spend = n => { if ((A.S.time || 0) < n) return false; A.S.time -= n; return true; };
// the player's place at court: rules, sits on the council, or is a lord who may be heard (56's RI.canSpeak)
POL.inCouncil = (pc, r) => !!(pc && r && pc.office && (r.council || {})[pc.office] === pc.id);
POL.canPropose = (pc, r) => !!(pc && r && pc.alive && (pc.ruler === r.id || POL.inCouncil(pc, r)));

// ---------------------------------------------------------------- the player's landed house and its oath

POL.pcHouse = function (pc) {
  if (!pc || !pc.noble || pc.ruler) return null;
  const h = pc.house && A.S.houses[pc.house];
  return h && h.realm === (pc.noble.realm || pc.realm) && h.kind !== 'royal' ? h : null;
};
// the player's oath: their house's contract, or (a landless knight's) the realm's default; pure
POL.pcOath = function (pc) {
  const r = POL.myRealm(pc); if (!r || !pc.noble || pc.ruler) return null;
  const h = POL.pcHouse(pc), c = h ? POL.contractOf(h, r) : (pc.pol && pc.pol.contract) || { tax: POL.pos(r, 'obl'), levy: POL.pos(r, 'obl'), rights: [] };
  const R = GD.NOBLE_RUNGS[GD.NOBLE_RUNGS.length - 1 - (pc.noble.rung || 0)] || {};
  return { r, h, c, men: Math.round((R.levy || 0) * POL.OBL_LEVY[c.tax != null ? c.levy : 1]), share: POL.OBL_TAX[c.tax] };
};
const oathOf = pc => { const o = POL.pcOath(pc); if (!o) return null; if (o.h) { o.h.contract = o.c; return o.c; } POL.pcPol(pc).contract = o.c; return o.c; };
// PO-OBL: the crown's share of a lord's rents follows the oath (56's tenth on rents is the Medium oath)
const baseTaxes = RI.taxes;
if (baseTaxes) RI.taxes = function (pc) {
  const out = baseTaxes.apply(this, arguments);
  try {
    if (!POL.on || !pc || !pc.noble) return out;
    const o = POL.pcOath(pc); if (!o) return out;
    const f = POL.OBL_TAX[o.c.tax] / .10;
    if (Math.abs(f - 1) < .01) return out;
    for (const x of out) if (x[0] === 'landtax') { x[2] = Math.round(x[2] * f); x[1] = x[1].replace("tenth on rents", o.c.tax === 0 ? 'twentieth on rents, by your oath' : 'share of your rents, by your oath'); }
  } catch (e) {}
  return out;
};

// ---------------------------------------------------------------- seeking an office

// the appointer's view of a candidate: opinion + half the skill + 10 a favour owed + a gift; pure
const SKILL = { gov: 'stewardship', mag: 'diplomacy', reeve: 'stewardship', warden: 'command', customs: 'stewardship' };
POL.appointer = function (r, o) {
  const by = GD.POL_OFFICES[o.k].by, C = r.council || {};
  const p = by === 'chancellor' ? A.P(C.chancellor) : by === 'marshal' ? A.P(C.marshal) : by === 'town' ? A.P(C.treasurer) : A.P(r.ruler);
  return live(p) ? p : A.P(r.ruler);
};
POL.seekScore = function (r, o, p, appointer) {
  const parts = [], op = appointer ? Math.round(A.opinion(appointer, p)) : 0;
  if (op) parts.push(['Their opinion', op]);
  parts.push([`Half your ${SKILL[o.k]}`, Math.round(A.skill(p, SKILL[o.k]) / 2)]);
  const pc = A.pc(), fav = pc && p.id === pc.id && appointer && A.favorsOf ? A.favorsOf(pc, appointer.id) : 0;
  if (fav) parts.push([`${fav} favour${fav === 1 ? '' : 's'} owed`, 10 * Math.min(2, fav)]);
  const g = pc && p.id === pc.id ? (A.S.yearActs['riGift_' + (appointer && appointer.id)] || 0) : 0;
  if (g) parts.push(['Your gifts', [0, 10, 13, 15][Math.min(3, g)]]);
  if ((p.fame || 0) >= 20) parts.push(['Renown', Math.round((p.fame || 0) / 10)]);
  return parts;
};
// what the player could seek: each office of their realm, its bar, its rival and the odds; pure
POL.seekable = function (pc) {
  const r = POL.myRealm(pc); if (!r || !r.pol || pc.ruler || !A.isAdult(pc)) return [];
  const mine = POL.pcEstate(pc), out = [];
  const pool = POL.pool(r);
  for (const o of r.pol.off) {
    if (o.pid === pc.id) continue;
    const want = POL.offEst(r, o.k), bar = [];
    if (!want.includes(mine)) bar.push(`of ${want.map(e => POL.estName(e, r.id)).join(' or ')}`);
    if (o.k === 'gov' && !(pc.noble && pc.noble.rung >= 2) && mine !== 'army') bar.push('a landed lord or an officer');
    if (o.k === 'warden' && !((pc.mil && pc.mil.rank >= 5) || (pc.noble && pc.noble.rung >= 3))) bar.push('an officer of rank 5, or a lord');
    if (o.k === 'mag' && POL.pos(r, 'just') === 2 && !pc.literate) bar.push('lettered (the written law)');
    if (A.skill(pc, SKILL[o.k]) < 20) bar.push(`${SKILL[o.k]} 20`);
    const ap = POL.appointer(r, o), holder = A.P(o.pid);
    const rivals = POL.candidates(r, o.k, o.at, pool).filter(x => x.p.id !== pc.id).slice(0, 2).map(x => x.p);
    if (live(holder) && !rivals.includes(holder)) rivals.unshift(holder);
    const me = POL.seekScore(r, o, pc, ap).reduce((a, x) => a + x[1], 0);
    const best = rivals.length ? Math.max(...rivals.map(x => POL.seekScore(r, o, x, ap).reduce((a, y) => a + y[1], 0) + (x === holder ? 10 : 0))) : 0;
    const p = clamp(.5 + (me - best) / 60, .05, .9);
    const price = o.k === 'customs' ? Math.round(2 * Math.max(60, POL.pay(r, o))) : 0;
    out.push({ o, bar, ap, holder: live(holder) ? holder : null, rivals: rivals.slice(0, 2), me, best, p: r2(p), price, cool: pc.pol && pc.pol.sought && pc.pol.sought[o.id] && A.S.year - pc.pol.sought[o.id] < 1 });
  }
  return out;
};
POL.seek = function (pc, oid) {
  const r = POL.myRealm(pc), x = POL.seekable(pc).find(s => s.o.id === oid);
  if (!x) return warn('That office is not open to you.');
  if (x.bar.length) return warn(`You must be ${x.bar.join(', ')}.`);
  if (x.cool) return warn('You asked for it this year already.');
  if (x.price && pc.coin < x.price) return warn(`The crown sells the collectorship for ${A.coin(x.price)}.`);
  if (!spend(1)) return warn('Not enough initiative.');
  POL.pcPol(pc).sought[oid] = A.S.year;
  if (x.price) { pc.coin -= x.price; r.treasury += x.price; if (RI.purse) RI.purse(pc, 'office', -x.price, 'Offices bought'); }
  const yes = A.chance(x.p);
  if (!yes) { A.log(`${x.ap ? A.fullName(x.ap, false) : 'The crown'} gives the ${POL.offName(x.o.k, r.id).toLowerCase()}ship to another.${x.price ? ' Your money is returned, less the clerk\'s fee.' : ''}`, 'warn'); if (x.price) { const back = Math.round(x.price * .9); pc.coin += back; r.treasury -= back; } refresh(); return false; }
  const was = A.P(x.o.pid);
  x.o.pid = pc.id; x.o.since = A.S.year; x.o.pay = POL.pay(r, x.o); x.o.g = 0;
  if (x.o.term) x.o.term = A.S.year + GD.POL_OFFICES[x.o.k].term;
  POL.offLog(r, { k: 'office', off: x.o.id, who: pc.id, out: was ? was.id : null });
  if (live(was) && was.id !== pc.id) { if (pc.rel[was.id]) A.addOp(pc, was, -15); else A.link(pc, was, 'acquaint', -15, 'acquaint'); }
  A.fame(pc, 2);
  A.log(`You are named ${POL.offName(x.o.k, r.id)} of ${(A.S.prov[x.o.at] || {}).name || r.short}, at ${A.coin(x.o.pay)} a year.`, 'good');
  refresh();
  return true;
};

// ---------------------------------------------------------------- the player's year in office

POL.pcYear = function (pc) {
  if (!POL.on || !pc || !pc.alive || pc.id !== A.S.pc) return;
  POL.promiseYear(pc);
  const held = POL.officesOf(pc);
  for (const [r, o] of held) {
    // a new ruler sweeps out a third of the officers
    if (r.pol.ru && o.ruSeen && o.ruSeen !== r.ruler && A.chance(.35)) { o.pid = null; A.log(`The new ruler of ${r.short} names another ${POL.offName(o.k, r.id).toLowerCase()} in your place.`, 'bad'); continue; }
    o.ruSeen = r.ruler;
    pc.coin += o.pay || 0;
    if (RI.purse) RI.purse(pc, 'office', o.pay || 0, 'Pay of your offices');
    A.trainSkill && A.trainSkill(pc, SKILL[o.k], .5);
  }
  // one scene a year from the offices held, booked through 21's budget
  const o = held.length ? held[Math.floor(POL.hash(pc.id, A.S.year) * held.length)] : null;
  if (o && !A.S.queue.some(q => q.ctx && q.ctx.poOff)) {
    const [r, off] = o, ev = { gov: 'po_graft', reeve: 'po_tolls', mag: 'po_case_' + ['land', 'debt', 'poach', 'heresy'][Math.floor(POL.hash(pc.id, A.S.year, 'c') * 4)], warden: 'po_march_raid', customs: 'po_customs' }[off.k];
    // a scene a year at most, and never the same one inside its cooldown (an office is not the same scene each spring)
    const seen = pc.flags.ev && pc.flags.ev[ev], cool = (A.EV[ev] && A.EV[ev].cool) || 3;
    if (A.EV[ev] && !(seen != null && A.S.year - seen < cool)) A.queue({ type: 'event', ev, ctx: { poOff: off.id, rid: r.id, shire: (A.S.prov[off.at] || {}).name || r.short, realmT: r.short } });
  }
  // the crown asks more of a lord's oath (a greedy or proud crown, now and then)
  const oath = POL.pcOath(pc);
  if (oath && oath.c.tax < 2 && A.EV.po_raise_oath && A.chance(.06 + .1 * Math.max(0, (A.rulerPersona ? A.rulerPersona(oath.r.id).greed : 0)))) A.queue({ type: 'event', ev: 'po_raise_oath', ctx: { pid: oath.r.ruler, rid: oath.r.id, realmT: oath.r.short } });
};

// a war: a landed lord's levy is called (po_muster)
A.on && A.on('warStart', function (w) {
  try {
    const pc = A.pc(); if (!POL.on || !pc || !pc.alive || !w) return;
    const o = POL.pcOath(pc); if (!o || !o.men) return;
    if (!(w.att || []).includes(o.r.id) && !(w.def || []).includes(o.r.id)) return;
    const seen = pc.flags.ev && pc.flags.ev.po_muster;
    if (seen != null && A.S.year - seen < 3) return;
    if (A.EV.po_muster && !A.S.queue.some(q => q.ev === 'po_muster')) A.queue({ type: 'event', ev: 'po_muster', ctx: { pid: o.r.ruler, rid: o.r.id, men: o.men, scut: A.coin(2 * o.men * 3), scutN: 2 * o.men * 3, realmT: o.r.short } });
  } catch (e) { console.error('[po] muster', e); }
});
// PO-CEDE: the player's home passes to another crown at a peace (A.polOnTransfer emits provTransfer)
A.on && A.on('provTransfer', function (prov, from, to) {
  try {
    const pc = A.pc(); if (!POL.on || !pc || !pc.alive || !prov || pc.ruler || !A.isAdult(pc)) return;
    if (prov.id !== pc.home || from !== pc.realm || !to || to === from || !A.realm(to) || !A.realm(from) || !A.realm(from).alive) return;
    if (A.EV.po_new_crown && !A.S.queue.some(q => q.ev === 'po_new_crown')) A.queue({ type: 'event', ev: 'po_new_crown', ctx: { fromId: from, toId: to, oldT: A.realmShort(from), newT: A.realmShort(to), homeT: prov.name } });
  } catch (e) { console.error('[po] cede', e); }
});
POL.nearestOf = function (rid, from) {
  const S = A.S, seen = new Set([from]), q = [from];
  for (let i = 0; i < q.length && i < 4000; i++) { const P = S.prov[q[i]]; if (!P) continue; if (P.owner === rid && P.id !== from) return P.id; for (const j of P.adj || []) if (!seen.has(j)) { seen.add(j); q.push(j); } }
  const r = A.realm(rid); return r ? r.capitalProv : from;
};

// ---------------------------------------------------------------- the player's actions (data-a)

Object.assign(UI.A, {
  // propose a law (ruler or councillor): v = the push key
  poPropose(v) {
    const pc = A.pc(), r = POL.myRealm(pc);
    if (!POL.canPropose(pc, r)) return warn('Only the crown and its council bring bills.');
    if (r.pol && r.pol.bill) return warn('A bill is already before the realm.');
    const P = RI.PUSH[v]; if (!P || !P.law || !P.ok(r)) return warn('That law cannot be brought now.');
    if (!spend(1)) return warn('Not enough initiative.');
    const b = POL.openBill(r, v, pc, 'player');
    if (b) { b.pc = { side: 'for', w: pc.ruler === r.id ? 1 : RI.pcWeight ? RI.pcWeight(pc) : .5 }; A.log(`You bring a bill for ${P.t}. The first count is in sixty days.`, 'crown'); }
    refresh();
  },
  // speak for or against the bill before your realm: a persuasion check against 45 + 20|m|
  poVoice(v) {
    const pc = A.pc(), r = POL.myRealm(pc), b = r && r.pol && r.pol.bill;
    if (!b) return warn('There is no bill before the realm.');
    if (!(POL.canPropose(pc, r) || (RI.canSpeak && RI.canSpeak(pc, r)[0]))) return warn('You are not heard at court.');
    if (b.spoke === pc.id) return warn('You have spoken on this bill already.');
    if (!spend(1)) return warn('Not enough initiative.');
    b.spoke = pc.id;
    const side = v === 'against' ? -1 : 1, o = POL.billOdds(r), d = Math.round(45 + 20 * Math.abs(o.m));
    const p = A.checkOdds ? A.checkOdds(pc, { s: 'persuasion', s2: 'wil', d }) / 100 : clamp(.5 + (A.skill(pc, 'persuasion') - d) / 62, .05, .95);
    const win = A.chance(p);
    if (win) POL.moveBill(r, side * POL.BILL.pdm);
    b.pc = { side: side > 0 ? 'for' : 'against', w: RI.pcWeight ? RI.pcWeight(pc) : .5 };
    A.trainSkill && A.trainSkill(pc, 'persuasion', 1);
    A.log(win ? `You speak ${side > 0 ? 'for' : 'against'} the bill, and the benches move with you.` : `You speak ${side > 0 ? 'for' : 'against'} the bill. Nobody changes their mind.`, win ? 'good' : 'warn');
    refresh();
  },
  poSeek(v) { POL.seek(A.pc(), v); },
  // the task of the player's own council seat
  poTask(v) {
    const pc = A.pc(), r = POL.myRealm(pc);
    if (!POL.inCouncil(pc, r)) return warn('You hold no seat.');
    const T = POL.TASKS[pc.office]; if (!T || !T[v]) return;
    POL.init(r).task[pc.office] = v;
    A.log(`Your task this year: ${T[v].toLowerCase()}.`, 'good');
    refresh();
  },
  // the ruler changes a house's oath: v = "hid|tax|1", "hid|levy|-1" or "hid|right|seat"
  poOath(v) {
    const pc = A.pc(), r = POL.myRealm(pc);
    if (!pc || !r || pc.ruler !== r.id) return warn('Only the crown changes an oath.');
    const [hid, key, d] = String(v).split('|'), h = A.S.houses[hid];
    if (!h || h.realm !== r.id || !POL.landed(h)) return;
    if (key === 'right') { if (POL.grantRight(r, h, d)) A.log(`You grant ${h.name} a right: ${POL.RIGHTS[d].toLowerCase()}.`, 'good'); refresh(); return; }
    const q = POL.changeObl(r, h, key, +d, pc);
    if (!q.ok) return warn(q.why);
    A.log(`${h.name}'s ${key === 'tax' ? 'tax' : 'levy'} obligation is now ${['Low', 'Medium', 'High'][h.contract[key]]}.${q.free ? ' The favour it owed you is spent.' : q.tyr ? ' The other houses call it tyranny.' : ''}`, q.tyr ? 'warn' : 'good');
    refresh();
  },
  // the election: v = "kind|pid" with kind vote, visit, promise, gift, slander, withdraw
  poElect(v) {
    const pc = A.pc(), r = POL.myRealm(pc), el = r && r.pol && r.pol.elect;
    if (!el) return warn('No election is coming.');
    const [k, pid] = String(v).split('|'), t = A.P(pid);
    if (!live(t)) return;
    if (k === 'vote') { if (!el.electors.includes(pc.id)) return warn('You have no vote.'); el.pcVote = t.id; A.log(`You will give your vote to ${A.fullName(t, false)}.`, 'good'); return refresh(); }
    if (!el.cands.includes(pc.id)) return warn('You are not a candidate.');
    if (!spend(1)) return warn('Not enough initiative.');
    if (k === 'visit') {
      const p = clamp(.35 + A.skill(pc, 'persuasion') / 120 + (pc.fame || 0) / 400, .1, .9), ok = A.chance(p);
      if (pc.rel[t.id]) A.addOp(pc, t, ok ? 10 : 2); else A.link(pc, t, 'acquaint', ok ? 15 : 5, 'acquaint');
      A.log(ok ? `${A.fullName(t, false)} hears you out over a long supper, and walks you to the gate.` : `${A.fullName(t, false)} receives you civilly and promises nothing.`, ok ? 'good' : 'warn');
    }
    if (k === 'promise') {
      POL.pcPol(pc).promises.push({ to: t.id, rid: r.id, y: A.S.year, due: null, what: 'a favour when you rule' });
      A.addOwe && A.addOwe(pc, t.id, 1);
      A.log(`You promise ${A.fullName(t, false)} a favour when you rule. You owe it now, and it will be remembered.`, 'warn');
    }
    if (k === 'gift') {
      const cost = RI.giftCost ? RI.giftCost(pc, t) : 40;
      if (pc.coin < cost) { A.S.time += 1; return warn(`A gift fit for ${A.fullName(t, false)} costs ${A.coin(cost)}.`); }
      pc.coin -= cost; if (RI.purse) RI.purse(pc, 'gifts', -cost, 'Gifts and favours at court');
      el.gifts[t.id] = (el.gifts[t.id] || 0) + 1;
      A.log(`A gift worth ${A.coin(cost)} goes to ${A.fullName(t, false)}.`, 'good');
    }
    if (k === 'slander') {
      const ok = A.chance(clamp(.3 + A.skill(pc, 'intrigue') / 100, .1, .85)), caught = A.chance(.4);
      if (ok) for (const e of el.electors) { const s = el.slander[e] = el.slander[e] || {}; s[t.id] = A.S.year; }
      if (caught) { for (const e of el.electors) { const x = A.P(e); if (live(x) && pc.rel[x.id]) A.addOp(pc, x, -12); } pc.honor = Math.max(0, (pc.honor || 0) - 3); }
      A.log(ok ? `Stories about ${A.fullName(t, false)} go round the electors' tables.${caught ? ' Some of them know where they came from.' : ''}` : `The story about ${A.fullName(t, false)} does not take.${caught ? ' And it is known whose it was.' : ''}`, ok && !caught ? 'good' : 'warn');
    }
    if (k === 'withdraw') {
      el.out = pc.id; el.cands = el.cands.filter(x => x !== pc.id);
      A.addFavor && A.addFavor(pc, t.id, 1);
      if (pc.rel[t.id]) A.addOp(pc, t, 15);
      A.log(`You stand aside for ${A.fullName(t, false)}, who owes you for it.`, 'good');
    }
    refresh();
  },
  // join a faction of your realm (1 initiative; 2 if you hold an office of the crown)
  poJoin(fid) {
    const pc = A.pc(), f = (A.S.factions || []).find(x => x.id === fid);
    if (!f || !pc) return;
    const n = POL.officesOf(pc).length ? 2 : 1;
    const ok = A.canJoinFaction ? A.canJoinFaction(pc, f) : [true];
    if (!ok[0]) return warn(ok[1] || 'They will not have you.');
    if (!spend(n)) return warn(`Not enough initiative (${n}).`);
    const res = A.joinFaction ? A.joinFaction(f.id) : null;
    if (res && res.msg) A.log(res.msg, res.ok ? 'good' : 'warn');
    refresh();
  },
});

// ---------------------------------------------------------------- the fx keys of the po_ events

const baseFx = A.applyFx;
A.applyFx = function (pc, fx, ctx) {
  const out = baseFx.apply(this, arguments);
  try {
    if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc) return out;
    const say = s => { if (Array.isArray(out) && s) out.push(s); };
    const r = ctx && ctx.rid ? A.realm(ctx.rid) : POL.myRealm(pc);
    const estMod = (k, d) => { if (r && r.pol && r.pol.est[k]) r.pol.est[k].mod = clamp((r.pol.est[k].mod || 0) + d, -6, 6); };
    if (fx.poEst && r && r.pol) for (const k in fx.poEst) estMod(k, fx.poEst[k]);
    if (fx.poBill && r && r.pol && r.pol.bill) {
      const b = r.pol.bill;
      if (fx.poBill === 'for' || fx.poBill === 'against') { POL.moveBill(r, (fx.poBill === 'for' ? 1 : -1) * POL.BILL.pdm); b.pc = { side: fx.poBill, w: pc.ruler === r.id ? 1 : .5 }; say(`(the count leans ${fx.poBill === 'for' ? 'toward' : 'away from'} it)`); }
      if (fx.poBill === 'trade') { const t = ctx.pid && A.P(ctx.pid); if (t && A.favorsOf && A.favorsOf(pc, t.id) > 0) { A.addFavor(pc, t.id, -1); POL.moveBill(r, POL.BILL.pdm); say('(a favour spent)'); } }
      if (fx.poBill === 'fail') POL.endBill(r, false, 'Withdrawn by the crown');
    }
    if (fx.poPet && r && ctx && ctx.pk) {
      if (fx.poPet === 'grant' && !(r.pol && r.pol.bill)) { const b = POL.openBill(r, ctx.pk, A.P(ctx.pid), 'estate'); if (b) { b.pc = { side: 'for', w: 1 }; say('(a bill is brought)'); } }
      if (fx.poPet === 'refuse') for (const k of POL.EST) if (POL.estGain(r, ctx.pk, k) > 0) estMod(k, -2);
    }
    if (fx.poMuster && ctx && r) {
      const ru = A.P(r.ruler);
      if (fx.poMuster === 'scutage') { const n = Math.min(pc.coin, ctx.scutN || 0); pc.coin -= n; r.treasury += n; if (RI.purse) RI.purse(pc, 'taxes', -n, 'Scutage instead of your levy'); }
      if (fx.poMuster === 'refuse') {
        if (ru && pc.rel[ru.id]) A.addOp(pc, ru, -20);
        const P = POL.pcPol(pc), prev = P.breach; P.breach = A.S.year;
        if (prev && A.S.year - prev < 10 && A.EV.po_revoke) A.queue({ type: 'event', ev: 'po_revoke', ctx: { pid: r.ruler, rid: r.id, realmT: r.short } });
      }
    }
    if (fx.poOath && r) {
      const c = oathOf(pc);
      if (c && (fx.poOath === 'raise' || fx.poOath === 'raiseRight')) c.tax = Math.min(2, c.tax + 1);
      if (c && (fx.poOath === 'right' || fx.poOath === 'raiseRight')) { const free = Object.keys(POL.RIGHTS).filter(x => !c.rights.includes(x) && x !== 'seat'); if (free.length) { c.rights.push(free[0]); say(`(a right: ${POL.RIGHTS[free[0]].toLowerCase()})`); } }
      if (c && fx.poOath === 'lower') c.tax = Math.max(0, c.tax - 1);
    }
    if (fx.poCrown && ctx && ctx.toId) {
      const to = A.realm(ctx.toId), from = A.realm(ctx.fromId);
      if (fx.poCrown === 'swear' && to) {
        const oldRu = from && A.P(from.ruler); if (oldRu && pc.rel[oldRu.id]) A.addOp(pc, oldRu, -20);
        pc.realm = to.id; if (pc.noble) pc.noble.realm = to.id;
        POL.init(to); const k = POL.pcEstate(pc); if (to.pol.est[k]) to.pol.est[k].mod = clamp((to.pol.est[k].mod || 0) - 3, -6, 6);
      }
      if (fx.poCrown === 'leave' && from) {
        const was = pc.home, home = POL.nearestOf(from.id, was);
        let sold = 0;
        for (const a of (pc.assets || []).slice()) if (a && a.prov === was) { const v = Math.round((a.price || a.value || 0) * .5); sold += v; pc.assets.splice(pc.assets.indexOf(a), 1); }
        pc.home = home; pc.coin += sold;
        say(sold ? `(holdings sold for ${A.coin(sold)})` : '');
      }
      if (fx.poCrown === 'resist') pc.flags.po_resist = A.S.year;
    }
    if (fx.poCase && r && r.pol) {
      const [up, down] = String(fx.poCase).split('>');
      if (up) estMod(up, 1); if (down) estMod(down, -1);
    }
    if (fx.poGraft != null && ctx && ctx.poOff && r && r.pol) {
      const o = r.pol.off.find(x => x.id === ctx.poOff);
      if (o) { o.g = +fx.poGraft; const take = Math.round(Math.min((r.income || 0) / Math.max(1, POL.towns(r.id).length) * o.g / 100, 2.5 * o.g / 10 * (o.pay || 100))); if (take) { r.treasury -= take; pc.coin += take; o.gT = (o.gT || 0) + take; if (RI.purse) RI.purse(pc, 'office', take, 'Pay of your offices'); say(`(+${A.coin(take)})`); } }
    }
    if (fx.poToll && r && r.pol) { const o = ctx && r.pol.off.find(x => x.id === ctx.poOff); if (o) o.toll = +fx.poToll; }
    if (fx.poCustoms && r && ctx) { const o = r.pol.off.find(x => x.id === ctx.poOff); if (o && fx.poCustoms === 'squeeze') { const v = Math.round((o.pay || 60) * .8); pc.coin += v; estMod('burg', -1); say(`(+${A.coin(v)})`); } }
    if (fx.poMarch && r) { if (fx.poMarch === 'raid') { r.stability = clamp(r.stability - 1, 0, 100); estMod('army', 1); } if (fx.poMarch === 'hold') r.stability = clamp(r.stability + 1, 0, 100); }
    if (fx.poOff === 'take' && ctx && ctx.offId && r && r.pol) {
      const o = r.pol.off.find(x => x.id === ctx.offId);
      if (o && o.pid !== pc.id) { const was = o.pid; o.pid = pc.id; o.since = A.S.year; o.pay = POL.pay(r, o); o.g = 0; if (o.term) o.term = A.S.year + GD.POL_OFFICES[o.k].term; POL.offLog(r, { k: 'office', off: o.id, who: pc.id, out: was }); say(`(${POL.offName(o.k, r.id)}, ${A.coin(o.pay)} a year)`); }
    }
    if (fx.poOff === 'lose' && ctx && ctx.poOff && r && r.pol) { const o = r.pol.off.find(x => x.id === ctx.poOff); if (o && o.pid === pc.id) { o.pid = null; say('(you lose the office)'); } }
    if (fx.poVote && ctx && r && r.pol && r.pol.elect && ctx.pid) r.pol.elect.pcVote = ctx.pid;
  } catch (e) { console.error('[po] fx', e); }
  return out;
};

// the player's New Year: pay, the year's scene, promises falling due
const baseAfter = POL.afterYear;
POL.afterYear = function (r) {
  if (baseAfter) baseAfter.apply(this, arguments);
  const pc = A.pc();
  if (pc && r && r.id === (POL.myRealm(pc) || {}).id) POL.pcYear(pc);
};

// an NPC move: a candidate courts the player when the player has a vote (21's budget)
POL.courtMonth = function (pc) {
  if (!POL.on || !pc || !pc.alive || pc.id !== A.S.pc || pc.prison) return;
  const r = POL.myRealm(pc), el = r && r.pol && r.pol.elect;
  if (!el || !el.electors.includes(pc.id) || el.pcVote) return;
  if (pc.flags.po_courted && A.S.year - pc.flags.po_courted < 2) return;
  const NI = A.NPCI, st = NI && NI.state ? NI.state(pc) : null;
  if (st && (st.b < 1 || !NI.room(pc, A.S.year))) return;
  if (!A.chance(.12)) return;
  const C = el.cands.map(A.P).filter(p => live(p) && p.id !== pc.id);
  if (!C.length) return;
  const c = C.slice().sort((a, b) => (b.fame || 0) - (a.fame || 0))[0];
  if (st) { st.hy[A.S.year] = (st.hy[A.S.year] || 0) + 1; st.b -= 1; }
  pc.flags.po_courted = A.S.year;
  const ev = (c.coin || 0) > 200 || POL.estateOf(c) === 'burg' ? 'po_courted_purse' : 'po_courted_promise';
  if (A.EV[ev]) A.queue({ type: 'event', ev, ctx: { pid: c.id, rid: r.id, npcMove: true, realmT: r.short, bribe: A.coin(Math.round(30 + (pc.fame || 0))), bribeN: Math.round(30 + (pc.fame || 0)) } });
};
A.onMonth.push(pc => { try { POL.courtMonth(pc); } catch (e) { console.error('[po] courted', e); } });
