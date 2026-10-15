// Gold gets used (Road to Ten, Diplomacy 5): "AI treasuries pay for armies, buildings, bribes and mercenaries.
// The world audit's hoarding flag must read 0."
//
// The release burned 85% of any AI treasury above three years of income each year, for +1 stability and +1
// legitimacy (A.forcesAI). Over 3 worlds x 30 years that deleted about 65% of all AI income. Patch RI-SPEND-NOT-BURN
// replaces the burn with RI.spend, a ladder the crown pays down every year:
//   1. sellswords while at war (they leave at peace), dipping into the reserve if it must;
//   2. the upkeep of what it has built, and the pay of its council (named people, A.RI's court);
//   3. above a reserve set by the ruler's temper (greedy and cautious crowns keep more, generous ones less), in the
//      order the ruler's temper and last year's loudest court push (r.riPri) put them: drill and arms for the host,
//      walls, roads and granaries (A.BUILDINGS, priced by the province's share of the realm), temples, feasts and
//      gifts for discontented lords, and gold for allies at war;
//   4. if the coffers still hold more than three years, the court lightens the taxes.
// Every sun is booked by category (r.riBook, the last year; RI.book) so the realm's ledger and the world audit can
// show where the money went.

const RI = A.RI = A.RI || {};
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r2 = x => Math.round(x * 100) / 100;
RI.TUNE = Object.assign({
  reserve: 1.5,       // years of income a crown keeps, before its temper
  mercPay: 10,        // suns a sellsword costs a year (a standing soldier's upkeep is 3.2)
  mercCap: .2,        // sellswords at most this share of the realm's normal host
  payback: 15,        // years a farm takes to pay for itself at the AI's price
  worksUp: .02,       // yearly upkeep of works, as a share of what they cost (the player's buildings cost 2% a year too)
  stipend: .003,      // a councillor's yearly pay, as a share of the realm's income
  feastGap: 2,        // years between two feasts for the lords
  maxBuys: 2,         // works bought in one year, plus one for every six provinces
  greatGap: 8,        // years between two great works (a cathedral, a palace)
}, RI.TUNE || {});

// ---------------------------------------------------------------- the book

RI.CATS = ['recruits', 'mercs', 'drill', 'works', 'worksUp', 'court', 'bribes', 'subsidy'];
RI.CAT_T = { recruits: 'New levies trained', mercs: 'Sellswords', drill: 'Drill and arms', works: 'Works: walls, markets, temples, great halls', worksUp: 'Upkeep of works',
  court: "The council's pay", bribes: 'Pensions, feasts and gifts to the lords', subsidy: 'Gold for allies at war' };
RI.book = function (r, k, amt) {
  if (!r || !amt) return;
  const y = A.S.year;
  let B = r.riBookNext;
  if (!B) { B = r.riBookNext = { y, t0: r.treasury + amt, d0: r.debt || 0, inc: 0, up: 0, int: 0, cats: {}, open: 1 }; }
  B.cats[k] = Math.round((B.cats[k] || 0) + amt);
};
const baseWorldYear = A.worldYear;
A.worldYear = function () {
  const S = A.S;
  try {
    for (const id in S.realms) {
      const r = S.realms[id]; if (!r.alive) continue;
      const pr = !!r.playerRun;
      r.riBookNext = { y: S.year, t0: Math.round(r.treasury || 0), d0: Math.round(r.debt || 0), inc: pr ? 0 : Math.round(r.income * .92), up: pr ? 0 : Math.round(r.army * 3.2 + r.levy * .05), int: pr ? 0 : Math.round((r.debt || 0) * .08), cats: {}, pr };
    }
  } catch (e) { console.error('[ri] book', e); }
  const out = baseWorldYear.apply(this, arguments);
  try {
    for (const id in S.realms) {
      const r = S.realms[id], B = r.riBookNext; if (!B) continue;
      B.t1 = Math.round(r.treasury || 0); B.d1 = Math.round(r.debt || 0);
      const spent = Object.values(B.cats).reduce((a, b) => a + b, 0);
      // what the treasury gained or lost that no line above explains: tribute, war indemnities, the forges' accounts
      B.other = Math.round((B.t1 - B.t0) - (B.inc - B.up - B.int) + spent + Math.max(0, B.d0 - B.d1));
      delete B.open;
      // what the crown really takes in, smoothed: taxes, plus the forges' sales, tribute and indemnities
      if (!B.pr) r.riRev = Math.round(r.riRev ? .7 * r.riRev + .3 * (B.inc / .92 + Math.max(0, B.other)) : Math.max(r.income || 0, B.inc / .92 + Math.max(0, B.other)));
      r.riBook = B; delete r.riBookNext;
    }
  } catch (e) { console.error('[ri] book close', e); }
  return out;
};
// the release's own recruiting, booked
const baseTrainDiv = A.trainDiv;
A.trainDiv = function (r) {
  const t0 = r ? r.treasury : 0, res = baseTrainDiv.apply(this, arguments);
  try { if (r && r.treasury < t0) RI.book(r, 'recruits', t0 - r.treasury); } catch (e) {}
  return res;
};

// ---------------------------------------------------------------- what things cost an AI crown

const share = (r, P) => clamp((P.pop || 0) / Math.max(1, r.provPop || 1), 0, 1);
// the crown's revenue: its taxes, or more where forges, tribute and indemnities bring in more than the taxes do
RI.rev = r => Math.max(1, r.income || 0, r.riRev || 0);
// a building costs what it would take to pay for itself in RI.TUNE.payback years at this province's share of the realm
// (the player's price list, 3,000 to 8,000 suns, was written for a manor, not a kingdom of a million souls)
RI.workCost = function (r, P, b) {
  const Bd = A.BUILDINGS[b]; if (!Bd) return Infinity;
  const lvl = (P.bld && P.bld[b]) || 0, k = Bd.cost / 3000 * 1.35 * RI.TUNE.payback / 15;
  return Math.round(Math.max(200, k * share(r, P) * RI.rev(r) * (1 + lvl)));
};
// the most of each an AI crown builds in one province: works that raise income once, the rest as the player may (2)
const MAXLV = { farms: 1, market: 1, port: 1, walls: 2, temple: 2, barracks: 1 };
const border = (r, P) => P.adj.some(j => { const o = A.S.prov[j] && A.S.prov[j].owner; return o && o !== r.id && o !== 'unclaimed' && ((r.rivals || []).includes(o) || A.hostile(r.id, o) || (A.threatsTo && A.threatsTo(r.id).includes(o))); });
// the next work worth buying (and, given avail, affordable), scored by what the crown wants: [P, b, cost, score] or null.
// A crown builds no more than it can keep up: the upkeep of its works stays under a quarter of its revenue.
RI.nextWork = function (r, P, pri, avail) {
  const out = [], room = RI.rev(r) * .25 / RI.TUNE.worksUp - (r.riWorks || 0);
  if (room <= 0) return null;
  if (avail == null || avail > room) avail = room;
  const stab = r.stability || 50;
  for (const p of A.realmProvs(r.id)) {
    if (p.occ) continue;
    p.bld = p.bld || {};
    for (const b in MAXLV) {
      const Bd = A.BUILDINGS[b]; if (!Bd) continue;
      if ((p.bld[b] || 0) >= MAXLV[b] || (Bd.coastOnly && !p.coast)) continue;
      if (b === 'barracks' && p.id !== r.capitalProv) continue;
      const cost = RI.workCost(r, p, b);
      if (avail != null && cost > avail) continue;
      let s = 0;
      if (Bd.income) s = Bd.income * share(r, p) * 3 * RI.rev(r) / cost * 10 * (1 + .5 * Math.max(0, P.greed));
      if (b === 'walls') s = border(r, p) ? .9 + .4 * Math.max(0, P.caution) : 0;
      if (b === 'temple') s = (stab < 50 ? .7 : .25) + .6 * Math.max(0, P.zeal) + (pri === 'temple' ? 1 : 0);
      if (b === 'barracks') s = .3 + .3 * Math.max(0, P.warLog) + (pri === 'army' ? .5 : 0);
      if (pri === 'works' && b !== 'temple' && b !== 'barracks') s += .5;
      if (s > 0) out.push([p, b, cost, r2(s)]);
    }
  }
  out.sort((a, b) => b[3] - a[3] || a[2] - b[2]);
  return out[0] || null;
};
RI.build = function (r, p, b, cost) {
  const Bd = A.BUILDINGS[b];
  r.treasury -= cost; RI.book(r, 'works', cost);
  p.bld = p.bld || {}; p.bld[b] = (p.bld[b] || 0) + 1;
  if (Bd.dev) p.dev = Math.min(10, (p.dev || 0) + Bd.dev);
  if (Bd.income) { r.baseIncome = Math.round(r.baseIncome * (1 + Bd.income * share(r, p) * 3)); p.pop = Math.round(p.pop * 1.03); }
  if (Bd.fort) p.fort = Math.min(5, (p.fort || 0) + 1);
  if (Bd.stab) r.stability = Math.min(100, r.stability + Bd.stab);
  if (Bd.armyQ) r.armyQ = (r.armyQ || 1) + Bd.armyQ;
  r.riWorks = (r.riWorks || 0) + cost;
  r.riBuilt = (r.riBuilt || []).concat([[A.S.year, p.id, b]]).slice(-8);
};

// a great work: a cathedral, a palace, a harbour mole. A rich crown's pride, with no ceiling: each costs more than the
// last, and its keep falls to the temple or the town, not the crown
RI.greatCost = r => Math.round(1.2 * RI.rev(r) * (1 + .5 * (r.riGreatN || (r.riGreat || []).length)));
const GREAT = [['a cathedral', 'faith'], ['a new palace', 'pride'], ['a great hall', 'pride'], ['a harbour mole', 'coast'], ['a stone bridge', ''], ['a library and a school', ''], ['a royal road', '']];
RI.greatWork = function (r, cost) {
  const cp = A.prov(r.capitalProv), P = RI.rax(r);
  const opts = GREAT.filter(([, k]) => k !== 'coast' || (cp && cp.coast)).filter(([n]) => !(r.riGreat || []).some(g => g.n === n));
  const pick = (opts.length ? opts : GREAT).slice().sort((a, b) => (b[1] === 'faith' ? P.zeal : b[1] === 'pride' ? P.pride : 0) - (a[1] === 'faith' ? P.zeal : a[1] === 'pride' ? P.pride : 0))[0];
  const g = { y: A.S.year, n: pick[0], at: cp ? cp.name : r.capital };
  r.treasury -= cost; RI.book(r, 'works', cost);
  r.riGreatN = (r.riGreatN || (r.riGreat || []).length) + 1;
  r.riGreat = (r.riGreat || []).concat([g]).slice(-6); r.riGreatY = A.S.year;
  if ((r.legit || 50) < 90) r.legit = Math.min(90, (r.legit || 50) + 5);
  if (r.stability < 80) r.stability = Math.min(80, r.stability + 2);
  A.news(`${r.short} raises ${g.n} at ${g.at}.`, 'crown');
  return g.n;
};

// ---------------------------------------------------------------- sellswords

const COMPANY = ['Grey', 'Red', 'Free', 'Iron', 'Black', 'Golden', 'Salt', 'Wolf', 'Lantern', 'Ashen'];
const normalHost = r => { const L = LORE.realms[r.id]; return (L ? L.army : r.army0 || r.army) * (r.provPop || 1) / (r.basePop || 1); };
RI.mercs = r => (r.forces ? r.forces.divs.filter(d => d.riMerc) : []);
RI.mercMen = r => RI.mercs(r).reduce((a, d) => a + d.men, 0);
const mercTpl = r => {
  const F = r.forces; if (!F) return null;
  const ts = Object.entries(F.tpl).filter(([, t]) => t.kind !== 'garrison' && !t.order).sort((a, b) => (b[1].share || 0) - (a[1].share || 0) || String(a[0]).localeCompare(String(b[0])));
  return ts.length ? ts[0][0] : null;
};
RI.hireMercs = function (r, P) {
  const inc = Math.max(1, r.income), F = r.forces;
  if (!F) return 0;
  // renew the companies already under contract, or let them go
  for (const d of RI.mercs(r)) {
    if (d.riMerc.paid === A.S.year) continue;
    const c = Math.round(d.men * RI.TUNE.mercPay);
    if (r.treasury - c > -inc * .1) { r.treasury -= c; RI.book(r, 'mercs', c); d.riMerc.paid = A.S.year; }
    else A.divRemove(d);
  }
  const tid = mercTpl(r), s = tid && A.tplS(r.id, tid);
  if (!s || !s.men) return 0;
  const want = normalHost(r) * RI.TUNE.mercCap * (1 + .5 * Math.max(0, P.warLog)) - RI.mercMen(r);
  const each = Math.round(s.men * RI.TUNE.mercPay);
  let n = Math.min(4, Math.floor(want / s.men), Math.floor((r.treasury - inc * .5) / each));
  if (n <= 0) return 0;
  const loc = r.capitalProv != null && !(A.S.prov[r.capitalProv] || {}).occ ? r.capitalProv : (A.realmProvs(r.id).find(p => !p.occ) || {}).id;
  if (loc == null) return 0;
  let hired = 0;
  for (let i = 0; i < n; i++) {
    const nm = `the ${A.pick(COMPANY)} Company`;
    const d = A.newDiv(r, tid, loc, { str: 1, exp: 22, eqf: 1, org: .9, name: `${nm} (sellswords)` });
    if (!d) break;
    d.riMerc = { y: A.S.year, paid: A.S.year, co: nm };
    r.treasury -= each; RI.book(r, 'mercs', each); hired += d.men;
  }
  if (hired) {
    A.forcesSync(r);
    const pc = A.pc();
    if (pc && (pc.realm === r.id || pc.ruler === r.id)) A.log(`${r.short} hires sellswords: ${A.fmt(hired)} men under contract.`, 'war');
    A.aiLogAdd && A.aiLogAdd('mercs', r.id, null, `hires ${A.fmt(hired)} sellswords for the war.`, [[`At war with ${A.atWar(r.id).length} realm${A.atWar(r.id).length > 1 ? 's' : ''}`, 1], [`The treasury holds ${Math.round(10 * r.treasury / inc) / 10} years`, .5]].concat(P.warLog > .1 ? [['A warlike ruler', r2(.5 * P.warLog), 1]] : []));
  }
  return hired;
};
RI.dismissMercs = function (r) {
  const ms = RI.mercs(r); if (!ms.length) return 0;
  let n = 0;
  for (const d of ms) { n += d.men; A.divRemove(d); }
  A.forcesSync(r);
  return n;
};

// ---------------------------------------------------------------- the ladder

RI.reserveYears = r => { const P = RI.rax(r); return r2(clamp(RI.TUNE.reserve + .6 * P.greed + .3 * P.caution - .4 * P.warmth, .8, 2.5)); };
RI.spend = function (r) {
  if (!r || !r.alive) return null;
  const pc = A.pc();
  if (pc && pc.ruler === r.id) return null;
  const inc = Math.max(1, r.income), P = RI.rax(r), war = A.atWar(r.id).length > 0;
  const pri = r.riPri && r.riPri.y >= A.S.year - 1 ? r.riPri.k : null;
  const done = [];
  // 1. sellswords: hired in war, let go in peace
  if (war) RI.hireMercs(r, P); else if (RI.mercs(r).length) done.push(['dismiss', RI.dismissMercs(r)]);
  // 2. what is owed every year
  const up = Math.round((r.riWorks || 0) * RI.TUNE.worksUp);
  if (up > 0) { r.treasury -= up; RI.book(r, 'worksUp', up); }
  for (const seat in (r.council || {})) {
    const p = A.P(r.council[seat]);
    if (!p || !p.alive || p.id === A.S.pc) continue;
    const pay = Math.round(inc * RI.TUNE.stipend);
    r.treasury -= pay; RI.book(r, 'court', pay);
    p.coin = Math.min(20000, (p.coin || 0) + pay);    // a councillor's own household eats the rest
  }
  // 3. above the reserve: the ladder
  let avail = r.treasury - RI.reserveYears(r) * inc;
  if (avail <= 0) return done;
  const houses = A.realmHouses(r.id), meanOp = houses.length ? houses.reduce((a, h) => a + (h.op != null ? h.op : 50), 0) / houses.length : 50;
  const facs = A.factionsOf(r.id), hot = facs.reduce((a, f) => Math.max(a, f.discontent || 0), 0);
  const drill = Math.round(r.army * .8 + 500), q0 = r.riQ0 != null ? r.riQ0 : (r.riQ0 = r.armyQ || 1);
  const needDrill = r.forces && (r.forces.divs.some(d => d.exp < 28) || (r.armyQ || 1) < q0 + .08) && r.riDrill !== A.S.year;
  const allies = (r.allies || []).map(A.realm).filter(o => o && o.alive && A.atWar(o.id).length && o.treasury < (o.income || 1) * .4 && !o.playerRun);
  const items = [
    { k: 'drill', w: 1 + .5 * P.warLog + (pri === 'army' ? 1 : 0) + (war ? .8 : 0) + (A.threatsTo && A.threatsTo(r.id).length ? .4 : 0), ok: needDrill, cost: () => drill },
    { k: 'works', w: 1.1 + (pri === 'works' ? 1 : 0) + (pri === 'temple' ? .5 : 0) + .3 * Math.max(0, P.greed), ok: true, cost: () => { const x = RI.nextWork(r, P, pri, avail); return x ? x[2] : Infinity; } },
    { k: 'great', w: .5 + .4 * Math.max(0, P.pride) + .3 * Math.max(0, P.zeal) + (pri === 'works' ? .3 : 0) + (r.treasury > inc * 4 ? 2 : 0),
      ok: !(r.riGreatY > A.S.year - (r.treasury > inc * 4 ? 1 : RI.TUNE.greatGap)), cost: () => RI.greatCost(r) },
    { k: 'feast', w: .4 + (meanOp < 40 ? 1 : 0) + (hot >= 40 ? .8 : 0) + .4 * Math.max(0, P.warmth) + (pri === 'grant' ? .6 : 0), ok: (meanOp < 45 || hot >= 40) && !(r.riFeast > A.S.year - RI.TUNE.feastGap), cost: () => Math.round(inc * .03 + 300) },
    { k: 'subsidy', w: .5 + .5 * P.honor + .5 * P.warmth, ok: allies.length > 0, cost: () => Math.round(Math.min(avail * .3, (allies[0] || {}).income * .15 || 0)) },
  ].filter(x => x.ok).sort((a, b) => b.w - a.w);
  let buys = 0;
  for (const it of items) {
    let c = it.cost();
    if (!(c > 0) || c > avail) continue;
    if (it.k === 'drill') {
      r.treasury -= c; RI.book(r, 'drill', c); r.riDrill = A.S.year;
      for (const d of r.forces.divs) if (d.exp < 30) d.exp = Math.min(30, d.exp + 6 * (1 - d.exp / 40));
      r.forces.xp = Math.min(200, (r.forces.xp || 0) + 4);
      if ((r.armyQ || 1) < q0 + .08) r.armyQ = r2((r.armyQ || 1) + .01);
      avail -= c; done.push(['drill', c]);
    } else if (it.k === 'works') {
      const most = RI.TUNE.maxBuys + Math.floor(A.realmProvs(r.id).length / 6);
      while (buys < most) {
        const x = RI.nextWork(r, P, pri, avail);
        if (!x) break;
        RI.build(r, x[0], x[1], x[2]); avail -= x[2]; buys++; done.push(['works', x[2], x[1], x[0].id]);
      }
    } else if (it.k === 'great') {
      const g = RI.greatWork(r, c); avail -= c; done.push(['great', c, g]);
    } else if (it.k === 'feast') {
      r.treasury -= c; RI.book(r, 'bribes', c); r.riFeast = A.S.year;
      for (const h of houses) h.op = clamp((h.op != null ? h.op : 50) + A.ri(4, 8), 0, 100);
      for (const f of facs) f.discontent = clamp((f.discontent || 0) - 10, 0, 100);
      r.stability = Math.min(100, r.stability + 1);
      avail -= c; done.push(['feast', c]);
      RI.logCourt && RI.logCourt(r, { k: 'feast', yes: true, amt: c, why: [[meanOp < 45 ? `The lords are sullen (mean loyalty ${Math.round(meanOp)})` : `A faction stirs (discontent ${Math.round(hot)})`, .5]] });
    } else if (it.k === 'subsidy') {
      const o = allies[0];
      if (!o || !A.chance(clamp(.5 + .3 * P.honor + .3 * P.warmth, .1, .95))) continue;
      r.treasury -= c; o.treasury += c; RI.book(r, 'subsidy', c);
      avail -= c; done.push(['subsidy', c, o.id]);
      A.remember && A.remember(o.id, r.id, 'gift', 6);
      A.aiLogAdd && A.aiLogAdd('aid', r.id, o.id, `sends ${A.fmt(c)} in gold to ${A.realmShort(o.id)} for its war.`, [[`An ally at war, its treasury nearly empty`, 1]].concat(P.honor > .1 ? [['An honourable ruler', r2(.3 * P.honor), 1]] : [], P.warmth > .1 ? [['A warm-hearted ruler', r2(.3 * P.warmth), 1]] : []));
    }
  }
  // 4. still more than three years in the coffers and nothing left worth buying: the court lightens the taxes
  if (r.treasury > inc * 3 && !RI.nextWork(r, P, pri, r.treasury - RI.reserveYears(r) * inc) && RI.taxIdx && RI.taxIdx(r) > 0 && !(r.riCourt && r.riCourt[0] && r.riCourt[0].y === A.S.year && r.riCourt[0].k === 'taxDown')) {
    const tr = A.P((r.council || {}).treasurer);
    RI.applyLaw(r, 'taxDown');
    RI.logCourt(r, { k: 'taxDown', who: tr && tr.alive ? tr.id : null, seat: 'treasurer', yes: true, p: 100, why: [[`The treasury holds ${Math.round(10 * r.treasury / inc) / 10} years`, .6], ['Nothing left worth buying', .3]] });
    done.push(['remit', 0]);
  }
  return done;
};
