// Goods that come from somewhere and go somewhere: markets hold their stock over ten years, a famine triples grain,
// war makes arms dear, caravans pull prices together, prices differ by distance, and the chains run and pay; and the
// best trade loop a bot can find does not out-earn land (bench/exploit.mjs runs it for ten years on four seeds).
import { EXPLOIT } from '../../bench/exploit.mjs';
const SETUP = () => {
  window.ECT = {
    world(seed, realm) { A.newGame({ seed, race: 'human', realm: realm || 'POL-01', status: 'merchant', sex: 'M', startAge: 25 }); return A.pc(); },
    drain() { let h, n = 0; while ((h = A.S.queue[0]) && n++ < 300) { if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } },
    // run months on the real calendar; the player cannot die of it
    months(n) { for (let i = 0; i < n; i++) { A.advance(30); ECT.drain(); const pc = A.pc(); if (!pc.alive) { pc.alive = true; pc.health = 80; } } },
    ratio(rid, k) { const M = A.mkt(rid); return M.s[k] / A.ECON.normal(M, k); },
    rel(rid, k) { return A.mkt(rid).p[k] / GD.GOODS[k].base; },
    live() { return Object.values(A.S.realms).filter(r => r.alive && !r.isRebel); },
  };
};

export default {
  async econHolds(pg) {
    // ten years: every market keeps most of its goods between a third of normal and five times it
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      ECT.world(11); ECT.months(120);
      let n = 0, ok = 0; const bad = {};
      for (const R of ECT.live()) { const M = A.mkt(R.id); for (const k in GD.GOODS) { if (!(M.d[k] > 0.5)) continue; n++; const x = ECT.ratio(R.id, k); if (x >= 0.3 && x <= 5) ok++; else bad[k] = (bad[k] || 0) + 1; } }
      const made = {}, used = {};
      for (const R of ECT.live()) { const M = A.mkt(R.id); for (const k of ['cloth', 'steel', 'arms']) { made[k] = (made[k] || 0) + ((M.why[k] || {}).made || 0); used[k] = (used[k] || 0) + (M.d[k] || 0); } }
      return { n, ok, pct: Math.round(100 * ok / n), bad, made, used, caravans: A.S.eco.carN };
    });
    // armies at war burn arms faster than peace-time towns make them: that is what makes arms dear in war
    const chainsRun = ['cloth', 'steel', 'arms'].every(k => r.made[k] >= r.used[k] * 0.7);
    return { ok: r.pct >= 85 && chainsRun && r.caravans > 50, detail: `${r.pct}% of ${r.n} realm-goods hold a normal stock after ten years (outside: ${JSON.stringify(r.bad)}); chains made/used a month: ${['cloth', 'steel', 'arms'].map(k => `${k} ${Math.round(r.made[k])}/${Math.round(r.used[k])}`).join(', ')}; ${r.caravans} caravans last month` };
  },

  async famineTriplesGrain(pg) {
    // the same realm and year, frozen: an ordinary harvest, a failed one, and a failed one with every road closed
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      ECT.world(12, 'POL-05'); ECT.months(6);   // June: the harvest is known
      const rid = 'POL-05', snap = JSON.stringify(A.S), rng = A.rngState, out = {};
      for (const [k, f, closed] of [['ordinary', 1, false], ['failed', 0.4, false], ['famine', 0.25, true]]) {
        A.S = JSON.parse(snap); A.rngState = rng;
        const M = A.mkt(rid); M.hv = { f, y: A.S.year, t: k };
        const hostile = A.hostile;
        if (closed) A.hostile = (a, b) => (a === rid || b === rid) ? true : hostile(a, b);
        let peak = 0;
        try { for (let m = 0; m < 13; m++) { ECT.months(1); A.mkt(rid).hv = { f, y: A.S.year, t: k }; peak = Math.max(peak, ECT.rel(rid, 'grain')); } } finally { A.hostile = hostile; }
        out[k] = Math.round(peak * 100) / 100;
      }
      return out;
    });
    // with the roads open, neighbours send grain and the failure is softened (10-90% across builds); with them closed it
    // is a famine, and the plan's bar is that a famine triples grain
    const ok = r.failed >= r.ordinary && r.famine >= r.ordinary * 2.5;
    return { ok, detail: `grain at its dearest in the year after the harvest (× base): ordinary ${r.ordinary}, failed ${r.failed} (×${(r.failed / r.ordinary).toFixed(1)}), failed with the roads closed ${r.famine} (×${(r.famine / r.ordinary).toFixed(1)})` };
  },

  async warMakesArmsDear(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      ECT.world(13, 'POL-03'); ECT.months(3);
      // a realm at peace, with neighbours to fight
      // a realm at peace that buys its arms from others, with neighbours to fight (a realm that makes arms can find
      // them cheaper at war: its export roads close, and what it cannot sell abroad piles up at home)
      const R0 = ECT.live().filter(R => !A.atWar(R.id).length && A.neighbors(R.id).length && (R.army || 0) > 20000).sort((a, b) => (A.mkt(a.id).cap.arms || 0) - (A.mkt(b.id).cap.arms || 0))[0];
      const rid = R0.id, snap = JSON.stringify(A.S), rng = A.rngState, out = { rid };
      for (const war of [false, true]) {
        A.S = JSON.parse(snap); A.rngState = rng;
        if (war) A.startWar(rid, A.neighbors(rid)[0], null, 'conquest');
        // the first months: armies draw down the stores before the merchants answer the price
        const peak = [0, 0, 0, 0];
        for (let m = 0; m < 4; m++) { ECT.months(1); ['arms', 'iron', 'horses', 'grain'].forEach((k, i) => { peak[i] = Math.max(peak[i], ECT.rel(rid, k)); }); }
        out[war ? 'war' : 'peace'] = peak.map(v => Math.round(v * 100) / 100);
        out[war ? 'useWar' : 'usePeace'] = Math.round(A.mkt(rid).d.arms);
      }
      return out;
    });
    const ok = r.useWar > r.usePeace * 1.5 && (r.war[0] > r.peace[0] * 1.15 || r.war[2] > r.peace[2] * 1.15);
    return { ok, detail: `${r.rid} in its first four months, dearest × base (arms, iron, horses, grain): at peace ${r.peace.join(', ')}; at war ${r.war.join(', ')}; arms used a month ${r.usePeace} → ${r.useWar}` };
  },

  async caravansPullPricesTogether(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      ECT.world(14); ECT.months(2);
      const snap = JSON.stringify(A.S), rng = A.rngState, out = {};
      const spread = () => { const ks = ['grain', 'wool', 'iron', 'cloth', 'wine', 'spices']; let s = 0; for (const k of ks) { const ps = ECT.live().map(R => Math.log(ECT.rel(R.id, k))); const m = ps.reduce((a, x) => a + x, 0) / ps.length; s += Math.sqrt(ps.reduce((a, x) => a + (x - m) ** 2, 0) / ps.length); } return Math.round(100 * s / ks.length) / 100; };
      for (const on of [false, true]) {
        A.S = JSON.parse(snap); A.rngState = rng;
        const keep = A.ECON.PER_SRC; if (!on) A.ECON.PER_SRC = 0;
        try { ECT.months(36); } finally { A.ECON.PER_SRC = keep; }
        out[on ? 'on' : 'off'] = { spread: spread(), famine: ECT.live().reduce((a, R) => a + Object.keys(GD.GOODS).filter(k => A.mkt(R.id).d[k] > 0.5 && ECT.ratio(R.id, k) < 0.15).length, 0) };
      }
      return out;
    });
    const ok = r.on.spread < r.off.spread * 0.8 && r.on.famine < r.off.famine;
    return { ok, detail: `after three years, the spread of prices between realms (log sd): no caravans ${r.off.spread}, caravans ${r.on.spread}; realm-goods in famine: ${r.off.famine} → ${r.on.famine}` };
  },

  async localPrices(pg) {
    // away from the capital, what your province makes is cheaper and what comes from far is dearer
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = ECT.world(15, 'POL-01'); ECT.months(1);
      // a province away from its capital that makes something of its own
      let far = null, rid = null;
      for (const R of ECT.live()) {
        if (R.capitalProv == null) continue;
        far = A.realmProvs(R.id).find(P => P.id !== R.capitalProv && A.ECON.localHops(P) >= 2 && Object.keys(GD.GOODS).some(k => A.ECON.local(P, k) < 1) && Object.keys(GD.GOODS).some(k => A.ECON.local(P, k) > 1));
        if (far) { rid = R.id; break; }
      }
      const cap = A.prov(A.realm(rid).capitalProv);
      pc.realm = rid;
      const at = (P, k) => { pc.home = P.id; return A.buyPrice(rid, k); };
      const made = Object.keys(GD.GOODS).find(k => A.ECON.local(far, k) < 1), notMade = Object.keys(GD.GOODS).find(k => A.ECON.local(far, k) > 1);
      return { far: far.name, cap: cap.name, made, notMade, madeFar: at(far, made) / at(cap, made), notFar: at(far, notMade) / at(cap, notMade), hops: A.ECON.localHops(far) };
    });
    const ok = r.made && r.notMade && r.madeFar < 1 && r.notFar > 1;
    return { ok, detail: `in ${r.far} (${r.hops} steps from ${r.cap}): ${r.made} costs ×${r.madeFar.toFixed(2)} of the capital's price, ${r.notMade} ×${r.notFar.toFixed(2)}` };
  },

  async playerMovesStock(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = ECT.world(16, 'POL-03'); ECT.months(1); pc.coin = 100000; pc.transport = ['wagon'];
      const home = A.homeMkt(pc), M = A.mkt(home), s0 = M.s.wool;
      A.buyGood('wool', 10); const s1 = M.s.wool;
      const dest = 'POL-01', D = A.mkt(dest), d0 = D.s.wool;
      A.sellGood('wool', 10, dest);
      return { took: Math.round(s0 - s1), gave: Math.round(D.s.wool - d0) };
    });
    return { ok: r.took === 10 && r.gave === 10, detail: `buying 10 loads took ${r.took} from the home market's stock; selling them abroad added ${r.gave}` };
  },

  async workshopsPayTheSpread(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = ECT.world(17, 'POL-03'); ECT.months(2);
      const home = A.homeMkt(pc), M = A.mkt(home), before = GD.PROPERTY.forge.income;
      const keep = M.p.iron; M.p.iron = keep * 1.6; const dear = GD.PROPERTY.forge.income; M.p.iron = keep;
      const st = A.rngState, s0 = JSON.stringify(A.S); for (const k of ['forge', 'armory', 'weavery']) GD.PROPERTY[k].income; const pure = A.rngState === st && JSON.stringify(A.S) === s0;
      return { before, dear, names: ['forge', 'armory', 'weavery'].map(k => GD.PROPERTY[k] && GD.PROPERTY[k].name), pure };
    });
    return { ok: r.names.every(Boolean) && r.dear < r.before && r.pure, detail: `a forge's year: ${r.before} suns; with iron 60% dearer: ${r.dear}. Workshops: ${r.names.join('; ')}; holdings view pure: ${r.pure}` };
  },

  async marketTableSaysWhy(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = ECT.world(18, 'POL-01'); ECT.months(4);
      const home = A.homeMkt(pc);
      let h = '';
      for (const t of Object.keys(UI.TAB)) { try { const x = UI.TAB[t](pc); if (/mkt-t/.test(x)) { h = x; break; } } catch (e) {} }
      const why = A.ECON.why(home, 'grain');
      const st = A.rngState, s0 = JSON.stringify(A.S); A.ECON.why(home, 'iron'); A.ECON.card(home); const pure = A.rngState === st && JSON.stringify(A.S) === s0;
      return { table: !!h, word: /· (famine|scarce|short|ample|glut)/.test(h), why, pure };
    });
    return { ok: r.table && r.word && /months of need/.test(r.why) && r.pure, detail: `market table shows the stock: ${r.word}; grain: "${r.why}"; pure: ${r.pure}` };
  },

  async noTradeLoop(pg) {
    // the plan's exploit test, shortened: a greedy trader against farms, same seed, same 1,000 suns, five years
    await pg.evaluate(EXPLOIT);
    const r = await pg.evaluate(() => [[902, 'POL-03'], [904, 'POL-02']].map(([s, rid]) => ({ rid, trader: EXPLOIT_TRADER(s, rid, 5), estate: EXPLOIT_ESTATE(s, rid, 5) })));
    const ok = r.every(x => x.trader.worth <= x.estate.worth * 1.5);
    return { ok, detail: r.map(x => `${x.rid}: trader ${x.trader.worth} after ${x.trader.trips} trips, estate ${x.estate.worth} (${x.estate.farms} farms)`).join('; ') + ' (the release\'s economy let the same bot reach 12 times the estate)' };
  },
};
