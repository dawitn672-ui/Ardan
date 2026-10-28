// 9997-companies: battalions and companies with names, captains, morale with its parts, bread and pay, the line
// battle from the real division, formations by drill, orders by rank and by courier.
const findFight = `
  window.__coFight = function (seed, rank) {
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
    const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
    const w = A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc);
    pc.mil.rank = rank;
    for (let day = 0; day < 500; day++) {
      A.advance(1); let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
      const d = A.divById(pc.mil.div);
      if (!d) continue;
      for (const pid in A.S.fights) { const f = A.S.fights[pid]; if ((f.aIds.includes(d.id) || f.dIds.includes(d.id)) && (d.atk === +pid || d.loc === +pid)) { A.CO.place(pc); return { F: f, pc, w }; } }
    }
    return null;
  };
  window.__coBattle = function (F, pc) {
    const mine = F.aIds.includes(pc.mil.div);
    A._battlePlace = F.loc;
    try { return A.newBattleForPC(pc, F.war, mine ? F.b : F.a); } finally { A._battlePlace = null; }
  };
  window.__coLive = (F, ids) => ids.map(A.divById).filter(d => d && (d.atk === F.loc || d.loc === F.loc));
  window.__coFieldMen = d => d.bs.filter(b => !A.CO.isSup(b.c)).reduce((x, b) => x + A.CO.bm(b), 0);
`;
const every = (o, f) => Object.values(o).every(f);

export default {
  async coEveryBattalion(pg) {
    // every battalion everywhere has state, on both worlds; the companies always sum to the division's men
    const r = await pg.evaluate(() => {
      const out = {};
      for (const lands of [undefined, 'great']) {
        A.newGame({ seed: 9701, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18, lands });
        const t0 = performance.now();
        T.play(1);
        const ms = Math.round(performance.now() - t0);
        const divs = A.allDivs(), CO = A.CO;
        const bad = divs.filter(d => !CO.ok(d) || CO.sum(d) !== Math.round(d.men)).length;
        let bns = 0, coys = 0, caps = 0, persons = 0, named = new Set();
        for (const d of divs) for (let i = 0; i < d.bs.length; i++) {
          const b = d.bs[i]; bns++; coys += b.k.length;
          for (let s = 0; s < (CO.isSup(b.c) ? 1 : 5); s++) { const c = CO.cap(d, i, s); if (c) { caps++; if (c.person) persons++; } }
          named.add(CO.bnName(d, i));
        }
        const kb = Math.round(divs.reduce((a, d) => a + JSON.stringify({ bs: d.bs, food: d.food, pay: d.pay, mo: d.mo }).length, 0) / 1024);
        out[lands || 'known'] = { divs: divs.length, bad, bns, coys, caps, persons, uniqueNames: named.size, kb, stateKb: Math.round(JSON.stringify(A.S).length / 1024), ms, retired: (A.S.coRet || []).length };
      }
      return out;
    });
    const ok = every(r, x => x.bad === 0 && x.bns > 0 && x.caps >= x.bns * 4) && r.great.divs > r.known.divs;
    return { ok, detail: Object.entries(r).map(([k, x]) => `${k}: ${x.divs} divisions, ${x.bns} battalion records, ${x.coys} companies, ${x.caps} captains (${x.persons} made people), ${x.uniqueNames} names; ${x.bad} out of step with d.men; battalion state ${x.kb} KB of ${x.stateKb} KB; a year in ${x.ms} ms; ${x.retired} names retired`).join(' | ') };
  },

  async coMoraleParts(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9702, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const CO = A.CO, d = A.allDivs()[0], i = d.bs.findIndex(b => !CO.isSup(b.c));
      const R = CO.restOne(d, i, 0), sum = R.parts.reduce((a, p) => a + p[1], 0);
      const h0 = T.hash(A.S), rng0 = A.rngState;
      const tip = UI.TIPS.coMo(d.id + '|' + i + '|0');
      const pure = T.hash(A.S) === h0 && A.rngState === rng0;
      // a hungry, unpaid green battalion under a poor captain, and a fed, paid veteran one under a good one
      const b = d.bs[i], keep = JSON.stringify({ b, food: d.food, pay: d.pay, loc: d.loc, dr: d.dr });
      const capSeed = good => { for (let s = 1; s < 50000; s++) { const c = CO.fromSeed(s, 'CUL-02', b.h); if (good ? c.cmd >= 62 && c.temper === 'bold' : c.cmd <= 25 && c.temper !== 'bold') return s; } return 1; };
      b.cs = { 0: capSeed(false), 4: capSeed(false) }; b.x = 2; d.food = 0; d.pay = 4; d.loc = (b.h + 1) % A.S.prov.length; d.dr = { shields: 0.05, formation: 0.05 };
      const low = CO.restOne(d, i, 0).total;
      b.cs = { 0: capSeed(true), 4: capSeed(true) }; b.x = 70; d.food = 20; d.pay = 0; d.loc = b.h; d.dr = { shields: 0.8, formation: 0.6 };
      const high = CO.restOne(d, i, 0).total;
      const K = JSON.parse(keep); Object.assign(b, K.b); d.food = K.food; d.pay = K.pay; d.loc = K.loc; d.dr = K.dr;
      return { total: R.total, sum, parts: R.parts, pure, tipOk: /settles towards/.test(tip) && /<ul/.test(tip), low, high };
    });
    const ok = Math.abs(r.total - Math.max(5, Math.min(100, r.sum))) < 0.6 && r.pure && r.tipOk && r.low <= 35 && r.high >= 75;
    return { ok, detail: `resting ${r.total.toFixed(1)} = ${r.parts.map(p => p[0] + ' ' + p[1]).join(' + ')}; tooltip pure ${r.pure}; hungry, unpaid, green, poor captain ${r.low.toFixed(1)}; fed, paid, veteran, bold good captain at home ${r.high.toFixed(1)}` };
  },

  async coFoodRunsOut(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9703, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const enemy = A.neighbors('POL-01')[0];
      A.startWar('POL-01', enemy, null, 'conquest');
      A.advance(3);
      const CO = A.CO, d = A.allDivs().find(x => x.r === 'POL-01' && x.army);
      if (!d) return { none: true };
      d.food = 4; const P = A.S.prov[d.loc], u0 = P.unrest || 0;
      const rec0 = A.WC ? A.WC.count() : 0;
      // cut off from every depot: the supply ratio is 0 every day
      const sup = A.wsSupplyDayRun; A.wsSupplyDayRun = function (live) { const r = sup.apply(this, arguments); for (const x of live) if (x === d) x.sr = 0; return r; };
      const foods = [], mos = [], men = [];
      d.coFor = A.S.warClock;   // it foraged a day ago: the next forage is ten days off
      for (let i = 0; i < 16; i++) { A.wsDay(); foods.push(d.food); mos.push(d.mo); men.push(d.men); }
      A.wsSupplyDayRun = sup;
      const foraged = d.coFor !== undefined && CO.stats.foraged > 0;
      const recs = A.WC ? Array.from({ length: A.WC.count() - rec0 }, (_, j) => A.WC.ent(rec0 + j)).filter(e => e && e.k === 'forage') : [];
      return { foods, mos, men, foraged, unrest: [u0, P.unrest], recs: recs.length, deserted: CO.stats.deserted, ok: CO.ok(d) && CO.sum(d) === d.men };
    });
    if (r.none) return { ok: false, detail: 'no division at war' };
    const drop = r.foods.slice(0, 3).every((f, i, a) => i === 0 || Math.abs(a[i - 1] - f - 1) < 0.01);
    const zero = r.foods.indexOf(0), moFell = zero >= 0 && r.mos[r.mos.length - 1] < r.mos[zero] - 2, desert = zero >= 0 && r.men[r.men.length - 1] < r.men[zero];
    const ok = drop && zero >= 0 && moFell && desert && r.foraged && r.recs >= 1 && r.unrest[1] > r.unrest[0] && r.ok;
    return { ok, detail: `bread by day: ${r.foods.join(' ')}; morale ${r.mos[0]} → ${r.mos[r.mos.length - 1]}; men ${r.men[0]} → ${r.men[r.men.length - 1]} (deserters ${r.deserted}); foraged ${r.foraged}, unrest ${r.unrest[0]} → ${r.unrest[1]}, chronicle records ${r.recs}; companies in step ${r.ok}` };
  },

  async coBattleFromDivision(pg) {
    await pg.evaluate(findFight);
    const r = await pg.evaluate(() => {
      const got = __coFight(9704, 4);
      if (!got) return { none: true };
      const { F, pc } = got, mine = F.aIds.includes(pc.mil.div) ? F.aIds : F.dIds, theirs = mine === F.aIds ? F.dIds : F.aIds;
      const want = [__coLive(F, mine).reduce((a, d) => a + __coFieldMen(d), 0), __coLive(F, theirs).reduce((a, d) => a + __coFieldMen(d), 0)];
      const men0 = new Map(__coLive(F, mine.concat(theirs)).map(d => [d.id, d.men]));
      const B = __coBattle(F, pc);
      const beasts = { EL: 15, GI: 60 }, sum = k => B.sides[k].units.reduce((a, u) => a + u.men * (beasts[u.code] || 1), 0);
      const sums = [sum('A'), sum('B')];
      const nUnits = [B.sides.A.units.length, B.sides.B.units.length];
      const mineU = B.sides.A.units.filter(u => u.coMine), myCo = mineU.filter(u => u.coMine === 'me');
      A.S.queue.unshift({ type: 'battle', b: B });
      let n = 0; while (B.phase !== 'end' && n++ < 20) A.battleStep();
      const dropped = [...men0].reduce((a, [id, m]) => { const d = A.divById(id); return a + (d ? m - d.men : 0); }, 0);
      const dead = B.dead.A + B.dead.B;
      const inStep = [...men0.keys()].map(A.divById).filter(Boolean).every(d => A.CO.sum(d) === d.men);
      const credit = [...men0.keys()].map(A.divById).filter(Boolean).reduce((a, d) => a + (d.coCredit || 0), 0);
      // the next map day takes its losses from that credit first
      const before = [...men0.keys()].map(A.divById).filter(Boolean).reduce((a, d) => a + d.men, 0);
      if (A.S.fights[F.loc]) A.fightDay(F.loc);
      const credit2 = [...men0.keys()].map(A.divById).filter(Boolean).reduce((a, d) => a + (d.coCredit || 0), 0);
      return { want, got: sums, nUnits, mine: mineU.length, myCo: myCo.length, dropped, dead, inStep, credit, credit2, before, aar: B.aar && B.aar.text, names: mineU.map(u => u.name + ' / ' + (u.cap && u.cap.name)) };
    });
    if (r.none) return { ok: false, detail: 'no fight found for the player\'s division' };
    const ok = Math.abs(r.want[0] - r.got[0]) <= r.nUnits[0] && Math.abs(r.want[1] - r.got[1]) <= r.nUnits[1] * 15 && r.mine === 4 && r.myCo === 1 && r.inStep && Math.abs(r.dropped - r.dead) <= r.nUnits[0] + r.nUnits[1] && r.credit === r.dropped && r.credit2 <= r.credit && /under/.test(r.aar || '');
    return { ok, detail: `units ${r.nUnits.join(' and ')}; men in the units ${r.got.join(' / ')} against the fighting battalions' ${r.want.join(' / ')}; your battalion as ${r.mine} companies (${r.names.join('; ')}); the battle's dead ${r.dead}, the divisions lost ${r.dropped}, companies in step ${r.inStep}; credit for the map ${r.credit} → ${r.credit2} after the next map day; report: "${(r.aar || '').slice(-140)}"` };
  },

  async coOrdersByRank(pg) {
    await pg.evaluate(findFight);
    const r = await pg.evaluate(() => {
      const out = {};
      for (const rank of [4, 6]) {
        const got = __coFight(9705, rank);
        if (!got) return { none: true };
        const B = __coBattle(got.F, got.pc);
        const cmd = B.sides.A.units.filter(u => A.CO.commands(B, u)).length, all = B.sides.A.units.length;
        A.S.queue.unshift({ type: 'battle', b: B });
        const other = B.sides.A.units.find(u => !A.CO.commands(B, u)), mine = B.sides.A.units.find(u => A.CO.commands(B, u));
        const t0 = other.tac;
        const refused = A.coOrder(other.id, 'advance').ok === false && other.tac === t0;
        A.battleSetTactic(other.wing, 'advance');
        const wingKept = other.tac === t0;
        const okOrder = A.coOrder(mine.id, 'charge').ok && mine.ord === 'charge';
        // a shape the men never drilled is not offered
        const forms = A.CO.formsFor(B, mine), never = forms.filter(f => !f.ok).map(f => f.k + ' (' + f.why + ')');
        mine.dl = Object.assign({}, mine.dl, { shields: 0.05 });
        const wallOff = !A.CO.formsFor(B, mine).some(f => (f.k === 'wall' || f.k === 'hedge') && f.ok);
        mine.dl.shields = 0.7;
        const wallOn = A.CO.formsFor(B, mine).some(f => (f.k === 'wall' || f.k === 'hedge') && f.ok) || !['SP', 'HI', 'PK', 'MR', 'GA'].includes(mine.code);
        const h0 = T.hash(A.S), rng0 = A.rngState;
        const html = UI.battleModal(B);
        const pure = T.hash(A.S) === h0 && A.rngState === rng0;
        out[rank] = { cmd, all, refused, wingKept, okOrder, never, wallOff, wallOn, pure, panel: /Your command/.test(html) && /data-a="coOrd"/.test(html) && /data-c="coForm"/.test(html) && /disabled title="The wings/.test(html), code: mine.code };
        A.S.queue.shift();
      }
      return out;
    });
    if (r.none) return { ok: false, detail: 'no fight found' };
    const ok = r[4].cmd === 1 && r[6].cmd === 4 && [4, 6].every(k => r[k].refused && r[k].wingKept && r[k].okOrder && r[k].wallOff && r[k].wallOn && r[k].pure && r[k].panel);
    return { ok, detail: [4, 6].map(k => `rank ${k}: commands ${r[k].cmd} of ${r[k].all} units; an order to another captain's unit refused ${r[k].refused}; the wing menu leaves it alone ${r[k].wingKept}; charge given ${r[k].okOrder}; wall/hedge withheld at drill 5 ${r[k].wallOff}, offered at 70 ${r[k].wallOn} (${r[k].code}); not offered: ${r[k].never.join(', ') || 'none'}; panel drawn purely ${r[k].pure && r[k].panel}`).join(' | ') };
  },

  async coIntents(pg) {
    // the enemy's next move is chosen at the end of each pulse and recorded on u.next; the pulse that follows does
    // not choose again, so what the screen shows is what happens
    await pg.evaluate(findFight);
    const r = await pg.evaluate(() => {
      const got = __coFight(9706, 5);
      if (!got) return { none: true };
      const B = __coBattle(got.F, got.pc);
      A.S.queue.unshift({ type: 'battle', b: B });
      let shown = 0, match = 0, repick = 0;
      const aiP = A.aiPulse;
      A.aiPulse = function (BB, side) { if (BB === B && side === 'B' && BB.pulse > 1 && BB.co.pre !== BB.pulse) repick++; return aiP.apply(this, arguments); };
      for (let p = 0; p < 7 && B.phase !== 'end'; p++) {
        const live = B.sides.B.units.filter(u => u.status === 'ok' || u.status === 'shaken');
        const said = live.map(u => [u, u.tac]);
        for (const u of live) { shown++; if (A.CO.unitInfo(B, u).order === u.next) match++; }
        const step = A.battleStep;
        // the tactic each unit fights this pulse with: read inside the step, before anything resolves
        const mx = A.missileExchange; let seen = null;
        A.missileExchange = function (BB) { if (!seen) seen = said.map(([u, t]) => u.tac === t); return mx.apply(this, arguments); };
        A.battleStep(); A.missileExchange = mx;
        if (seen && seen.some(x => !x)) repick += 1000;
      }
      A.aiPulse = aiP;
      return { shown, match, repick, info: A.CO.unitInfo(B, B.sides.B.units[0]) };
    });
    if (r.none) return { ok: false, detail: 'no fight found' };
    return { ok: r.shown > 0 && r.match === r.shown && r.repick === 0 && r.info && 'next' in r.info, detail: `${r.match} of ${r.shown} enemy intents shown match the move set for them; moves chosen again inside a pulse ${r.repick}; unit info for the screen: ${JSON.stringify(r.info).slice(0, 220)}` };
  },

  async coCaptainDies(pg) {
    await pg.evaluate(findFight);
    const r = await pg.evaluate(() => {
      const got = __coFight(9707, 2);
      if (!got) return { none: true };
      const { F, pc } = got, M = A.CO.mine(pc);
      const cap0 = A.CO.cap(M.d, M.b, M.i);
      const person = cap0.person;
      // the captain's company loses a third in a map fight, and the dice go against him
      const ch = A.chance; A.chance = p => p > 0.02 && p < 0.2 ? true : ch(p);
      try { A.CO.capsInDanger(M.d, M.b, 0.34, true, 'map'); } finally { A.chance = ch; }
      const cap1 = A.CO.cap(M.d, M.b, M.i);
      const lines = A.S.log.flatMap(e => (e.lines || []).map(l => l[0])).filter(l => /takes the company/.test(l));
      return { was: cap0.name, wasPerson: !!person, deadNow: person ? !person.alive : null, now: cap1.name, nowPerson: !!cap1.person, lines, queued: A.S.queue.some(q => q.ev === 'co_new_captain') };
    });
    if (r.none) return { ok: false, detail: 'no fight found' };
    const ok = r.wasPerson && r.deadNow === true && r.now !== r.was && r.lines.length >= 1 && r.queued && r.nowPerson;
    return { ok, detail: `Captain ${r.was} (a person: ${r.wasPerson}) dead in A.P: ${r.deadNow}; now ${r.now} (a person: ${r.nowPerson}); log: "${r.lines[0] || ''}"; scene queued ${r.queued}` };
  },

  async coCourier(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9708, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const CO = A.CO, pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      A.startWar('POL-01', enemy, null, 'conquest');
      A.advance(2);
      const a = A.armiesOf('POL-01')[0];
      // the arithmetic: 300 km, open country, with and without scouts
      const c = CO.centroid(a), P = c.P, at = { x: c.x + 300, y: c.y };
      const sAt = CO.senderAt, home = pc.mil; CO.senderAt = () => at;
      const terr = P.terr; P.terr = 'plains';
      const tpl = a.divs.map(A.divById).map(d => A.tplOf(d)), keep = tpl.map(t => t.sup.slice());
      tpl.forEach(t => { t.sup = t.sup.filter(s => s !== 'scouts'); });
      const plain = CO.delay(pc, a).days;
      tpl[0].sup.push('scouts');
      const scouts = CO.delay(pc, a).days;
      tpl.forEach((t, i) => { t.sup = keep[i]; });
      P.terr = terr;
      // a real order from the general: it waits on the road and lands on its day
      A.wsCanCommand = (() => { const f = A.wsCanCommand; return function () { return true; }; })();
      const clock0 = A.S.warClock, want = Math.ceil(CO.delay(pc, a).days - 0.25), res = A.wsSetOrder(a.id, 'hold');
      const inFlight = (a.orderQ || []).length, due = a.orderQ && a.orderQ[0].arrive;
      let landed = null;
      for (let i = 0; i < 20 && a.orderQ; i++) { A.wsDay(); if (!a.orderQ) landed = A.S.warClock; }
      CO.senderAt = sAt;
      // over real armies: the delay from the capitals of realms at war to their armies
      const ds = [];
      for (const ar of A.S.armies) { const R = A.realm(ar.realm), cp = R && A.S.prov[R.capitalProv]; if (!cp) continue; const fake = { home: cp.id, mil: null }; ds.push(CO.delay(fake, ar).days); }
      ds.sort((x, y) => x - y);
      return { plain, scouts, msg: res.msg, inFlight, due: due - clock0, landed: landed != null ? landed - clock0 : null, held: a.order.k, want, median: ds.length ? ds[Math.floor(ds.length / 2)] : null, n: ds.length };
    });
    const ok = Math.abs(r.plain - 5) < 0.05 && Math.abs(r.scouts - 3.5) < 0.05 && r.inFlight === 1 && r.due === r.want && r.landed === r.want && r.held === 'hold';
    return { ok, detail: `300 km in the open: ${r.plain} days, ${r.scouts} with scouts; "${r.msg}"; landed on day ${r.landed} of ${r.due}, order now ${r.held}; from the capitals of ${r.n} armies at war the median courier takes ${r.median} days (a steady general thinks every 3)` };
  },

  async coSaveLoad(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9709, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      A.enlist(A.pc()); T.play(1);
      const s = A.serialize(), h = T.hash(JSON.parse(s).S ? JSON.parse(s).S : JSON.parse(s));
      A.deserialize(JSON.parse(s));
      const same = A.allDivs().every(d => A.CO.ok(d) && A.CO.sum(d) === Math.round(d.men));
      // an old save: no battalions, no bread, no pay, no company
      const o = JSON.parse(s), S = o.S || o;
      for (const id in S.realms) for (const d of (S.realms[id].forces || {}).divs || []) { delete d.bs; delete d.food; delete d.pay; delete d.mo; }
      delete S.coOn; if (S.people && S.pc && S.people[S.pc].mil) delete S.people[S.pc].mil.co;
      A.deserialize(o);
      const h0 = T.hash(A.S), rng0 = A.rngState;
      T.renderAll();
      const pure = T.hash(A.S) === h0 && A.rngState === rng0;
      T.play(1);
      const rebuilt = A.allDivs().every(d => A.CO.ok(d) && A.CO.sum(d) === Math.round(d.men));
      return { same, pure, rebuilt, co: !!(A.pc().mil && A.pc().mil.co) || !A.pc().mil };
    });
    return { ok: r.same && r.pure && r.rebuilt && r.co, detail: `round trip in step ${r.same}; an old save draws purely ${r.pure} and builds its battalions at the month ${r.rebuilt}; the soldier has a company again ${r.co}` };
  },

  async coScreens(pg) {
    await pg.evaluate(findFight);
    const r = await pg.evaluate(() => {
      const got = __coFight(9710, 3);
      if (!got) return { none: true };
      const pc = got.pc, d = A.divById(pc.mil.div), M = A.CO.mine(pc);
      M.rec.cs = Object.assign({}, M.rec.cs);
      const c = A.CO.cap(M.d, M.b, M.i); if (c.person) c.person.given = '<img data-pwn>Oswin';
      const h0 = T.hash(A.S), rng0 = A.rngState;
      const oob = A.CO.oobHtml(d), card = UI.wrMyDivCard(pc, d), path = UI.armyPathCard(pc);
      T.renderAll();
      const pure = T.hash(A.S) === h0 && A.rngState === rng0;
      return { pure, oob: /Order of battle/.test(oob) && /co-row/.test(oob), card: /Your company|co-card/.test(card) && /Serjeant/.test(card), path: /co-card/.test(path), escaped: !/<img data-pwn>/.test(card + oob) && /&lt;img/.test(card) };
    });
    if (r.none) return { ok: false, detail: 'no fight found' };
    return { ok: r.pure && r.oob && r.card && r.path && r.escaped, detail: `order of battle ${r.oob}, company card ${r.card}, Path tab ${r.path}, a captain named with markup shows as text ${r.escaped}; drawing changed nothing ${r.pure}` };
  },
};
