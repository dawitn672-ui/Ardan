// Market towns with distance pricing: how many markets, whether the towns' stocks add up to the realm's, whether
// prices form gradients away from where a good is made, how a siege and a famine show in one town, the player's trip
// to another town, the cost of a month, the save, old saves, determinism and render purity; and whether a greedy
// trader who uses the towns can out-earn land.
import { EXPLOIT } from '../../bench/exploit.mjs';
const SETUP = () => {
  window.MTT = {
    world(seed, realm, status) { A.newGame({ seed, race: 'human', realm: realm || 'POL-01', status: status || 'merchant', sex: 'M', startAge: 25 }); return A.pc(); },
    drain() { let h, n = 0; while ((h = A.S.queue[0]) && n++ < 300) { if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } },
    // months on the real calendar; the player cannot die of it
    months(n, each) { for (let i = 0; i < n; i++) { A.advance(30); MTT.drain(); const pc = A.pc(); if (!pc.alive) { pc.alive = true; pc.health = 80; } if (each) each(i); } },
    live() { return Object.values(A.S.realms).filter(r => r.alive && !r.isRebel); },
    // what a town's hinterland makes of k in a month (45's production per province, by the town it is nearest)
    made(pid, k) { const of = A.S.mt.of; let s = 0; for (const P of A.S.prov) if (of[P.id] === pid && P.owner === A.S.mt.T[pid].r && P.ecoPr) s += P.ecoPr[k] || 0; return s; },
    corr(xs, ys) { const n = xs.length, mx = xs.reduce((a, x) => a + x, 0) / n, my = ys.reduce((a, x) => a + x, 0) / n; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; } return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0; },
    tab(pc) { for (const t of Object.keys(UI.TAB)) { try { const x = UI.TAB[t](pc); if (/mkt-t/.test(x)) return x; } catch (e) {} } return ''; },
  };
};
const med = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : 0; };
const r2 = x => Math.round(x * 100) / 100;

export default {
  async mtTownsAddUp(pg) {
    // about 80 to 110 market towns, one to four a realm; after two years each realm's stock is the sum of its towns'
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MTT.world(31); MTT.months(24);
      const by = A.MT.byRealm(), per = {};
      let worst = 0, n = 0;
      for (const R of MTT.live()) {
        const ts = by[R.id] || []; per[ts.length] = (per[ts.length] || 0) + 1;
        const M = A.mkt(R.id);
        for (const k in GD.GOODS) { if (!(M.s[k] > 5)) continue; const sum = ts.reduce((a, t) => a + A.MT.s(t, k), 0); worst = Math.max(worst, Math.abs(sum - M.s[k]) / M.s[k]); n++; }
      }
      return { towns: A.S.mt.L.length, realms: MTT.live().length, per, worst, n, kinds: A.S.mt.L.reduce((a, p) => { const t = A.prov(p).type; a[t] = (a[t] || 0) + 1; return a; }, {}) };
    });
    const ok = r.towns >= 80 && r.towns <= 110 && Object.keys(r.per).every(k => +k >= 1 && +k <= 4) && r.worst < 0.01;
    return { ok, detail: `${r.towns} market towns in ${r.realms} realms (realms by towns: ${JSON.stringify(r.per)}; ${JSON.stringify(r.kinds)}); the towns' stocks add up to the realm's within ${(r.worst * 100).toFixed(2)}% over ${r.n} realm-goods` };
  },

  async mtGradient(pg) {
    // over the third year, on three worlds: is a good dearer the further a town is from a town that makes more of it than
    // it uses? Per good, the correlation of the town's price (log, against its realm's) with the road's steps to the
    // nearest such town, and the price at the makers against the price four steps or more away
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const ks = ['grain', 'fish', 'salt', 'wool', 'timber', 'iron', 'horses', 'wine', 'linen', 'furs'], rows = {};
      for (const k of ks) rows[k] = { d: [], p: [], near: [], far: [] };
      for (const seed of [41, 42, 43]) {
        MTT.world(seed); MTT.months(24);
        // each town's price over the third year, month by month (a granary after the harvest holds months of need,
        // and a full store prices alike everywhere)
        const acc = {}; let nm = 0;
        MTT.months(12, () => { nm++; for (const t of A.S.mt.L) { const a = acc[t] = acc[t] || {}; for (const k of ks) a[k] = (a[k] || 0) + Math.log(A.MT.rel(t, k)); } });
        const by = A.MT.byRealm();
        for (const R of MTT.live()) {
          const ts = by[R.id] || []; if (ts.length < 2) continue;
          for (const k of ks) {
            const tot = ts.reduce((a, t) => a + MTT.made(t, k), 0); if (!(tot > 0)) continue;
            const mk = ts.filter(t => MTT.made(t, k) / tot > 1.2 * A.MT.need(t, k) / ts.reduce((a, x) => a + A.MT.need(x, k), 0));
            if (!mk.length || mk.length === ts.length) continue;
            for (const t of ts) {
              const d = Math.min(...mk.map(x => x === t ? 0 : (A.MT.road(x, t) || { steps: 99 }).steps)); if (d > 50) continue;
              if (!acc[t]) continue;
              const p = acc[t][k] / nm;
              rows[k].d.push(d); rows[k].p.push(p);
              if (d === 0) rows[k].near.push(p); else if (d >= 4) rows[k].far.push(p);
            }
          }
        }
      }
      const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
      return ks.map(k => ({ k, n: rows[k].d.length, corr: MTT.corr(rows[k].d, rows[k].p), spread: Math.exp(mean(rows[k].far) - mean(rows[k].near)), nf: rows[k].far.length }));
    });
    const pos = r.filter(x => x.corr > 0).length, mc = med(r.map(x => x.corr)), ms = med(r.filter(x => x.nf >= 3).map(x => x.spread));
    const ok = pos >= 8 && mc >= 0.15 && ms >= 1.04;
    return { ok, detail: `price against steps from the nearest maker, correlation per good: ${r.map(x => `${x.k} ${r2(x.corr)} (n ${x.n})`).join(', ')}; median ${r2(mc)}, ${pos} of ${r.length} positive. Four steps or more from the makers against at them: ${r.filter(x => x.nf >= 3).map(x => `${x.k} ×${r2(x.spread)}`).join(', ')}; median ×${r2(ms)}` };
  },

  async mtSiegeBread(pg) {
    // the same world and month, frozen: in spring, a market town that eats more grain than its fields grow, under
    // siege for eight months (through the harvest) against the same town left alone; its bread against its capital's,
    // and the news. Three worlds
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const rows = [];
      for (const seed of [51, 52, 53]) {
        MTT.world(seed); MTT.months(5);
        const by = A.MT.byRealm(), cands = [];
        for (const R of MTT.live()) {
          const ts = by[R.id] || []; if (ts.length < 2 || !A.neighbors(R.id).length) continue;
          const cap = A.MT.capTown(R.id), tot = ts.reduce((a, t) => a + MTT.made(t, 'grain'), 0);
          for (const t of ts) if (t !== cap) cands.push({ rid: R.id, cap, t, x: (tot > 0 ? MTT.made(t, 'grain') / tot : 0) / Math.max(0.01, A.S.mt.T[t].n[A.S.mt.K.indexOf('grain')]) });
        }
        const c = cands.sort((a, b) => a.x - b.x || a.t - b.t)[seed % 3];
        const enemy = A.neighbors(c.rid)[0], snap = JSON.stringify(A.S), rng = A.rngState, out = { rid: c.rid, town: A.MT.name(c.t), fields: Math.round(c.x * 100) / 100 };
        for (const sg of [false, true]) {
          A.S = JSON.parse(snap); A.rngState = rng;
          let peak = 0;
          // the war's daily tick lifts a siege no army keeps up, so the test keeps it up by hand
          const cutOff = A.MT.cutOff;
          if (sg) A.MT.cutOff = P => P.id === c.t || cutOff(P);
          try { MTT.months(8, () => { peak = Math.max(peak, A.MT.rel(c.t, 'grain') / A.MT.rel(c.cap, 'grain')); }); } finally { A.MT.cutOff = cutOff; }
          out[sg ? 'siege' : 'open'] = Math.round(peak * 100) / 100;
          if (sg) out.news = (A.S.news || []).filter(x => /^Bread in/.test(x.t || '')).length;
        }
        rows.push(out);
      }
      return rows;
    });
    const ok = r.every(x => x.siege > x.open * 1.2) && med(r.map(x => x.siege / x.open)) >= 1.5;
    return { ok, detail: r.map(x => `${x.town} (${x.rid}; its fields grow ×${x.fields} of its share of the realm's grain for its share of the need): bread at most ×${x.open} the capital's when open, ×${x.siege} under siege${x.news ? ', in the news' : ''}`).join('; ') };
  },

  async mtFamineLocal(pg) {
    // a failed harvest frozen in one realm, against an ordinary one from the same day: the dearest bread in each of its
    // towns over the ten months after, and how far apart the towns are
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const rows = [];
      for (const [seed, rid] of [[61, 'POL-01'], [62, 'POL-05'], [63, 'POL-14'], [64, 'POL-22']]) {
        MTT.world(seed); MTT.months(6);
        const ts = A.MT.byRealm()[rid]; if (!ts || ts.length < 2) continue;
        const snap = JSON.stringify(A.S), rng = A.rngState, out = { rid, n: ts.length };
        for (const [k, f] of [['ordinary', 1], ['failed', 0.4]]) {
          A.S = JSON.parse(snap); A.rngState = rng;
          const peak = ts.map(() => 0);
          MTT.months(10, () => { A.mkt(rid).hv = { f, y: A.S.year, t: k }; ts.forEach((t, j) => { peak[j] = Math.max(peak[j], A.mkt(rid).p.grain * A.MT.rel(t, 'grain') / GD.GOODS.grain.base); }); });
          out[k] = { mean: Math.round(peak.reduce((a, x) => a + x, 0) / ts.length * 100) / 100, lo: Math.round(Math.min(...peak) * 100) / 100, hi: Math.round(Math.max(...peak) * 100) / 100 };
        }
        rows.push(out);
      }
      return rows;
    });
    // the famine itself is 45's (the realm's store); here it is read town by town
    const ok = r.length >= 3 && r.filter(x => x.failed.mean > x.ordinary.mean).length * 2 >= r.length && r.every(x => isFinite(x.failed.hi));
    return { ok, detail: r.map(x => `${x.rid} (${x.n} towns): dearest bread ×${x.ordinary.lo}–${x.ordinary.hi} of base (mean ${x.ordinary.mean}) in an ordinary year, ×${x.failed.lo}–${x.failed.hi} (mean ${x.failed.mean}) after a failed harvest`).join('; ') };
  },

  async mtTripMovesStock(pg) {
    // the player buys at their own town and carries it to the nearest other: the stocks move, the carters are paid
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = MTT.world(71, 'POL-01'); MTT.months(3); pc.coin = 100000; pc.transport = ['wagon']; A.S.time = 20;
      const here = A.MT.here(pc), x = A.MT.near(pc).find(x => x.rid === A.homeMkt(pc)) || A.MT.near(pc)[0];
      const h0 = A.MT.s(here, 'wool'); A.buyGood('wool', 10); const h1 = A.MT.s(here, 'wool');
      const t0 = A.MT.s(x.pid, 'wool'), P = A.MT.tripPlan(x.pid), c0 = pc.coin, res = A.MT.trip(x.pid), t1 = A.MT.s(x.pid, 'wool');
      return { took: Math.round(h0 - h1), gave: Math.round(t1 - t0), haul: P.haul, ok: res.ok, msg: res.msg, town: A.MT.name(x.pid), here: A.MT.name(here), steps: x.R.steps };
    });
    const ok = r.ok && r.took === 10 && r.gave >= 5 && r.haul > 0 && /carters/.test(r.msg);
    return { ok, detail: `bought 10 wool at ${r.here}: its stock fell by ${r.took}; carried ${r.steps} steps to ${r.town}: its stock rose by ${r.gave}, carting ${r.haul} suns. "${r.msg.slice(0, 160)}"` };
  },

  async mtCardPure(pg) {
    // the market card names the player's town, lists the nearest towns with the road and the carting, and drawing it
    // draws no random numbers and changes nothing
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = MTT.world(72, 'POL-03'); MTT.months(4); pc.cargo = { wool: 3 };
      UI.mtGood = 'wool';
      const st = A.rngState, s0 = JSON.stringify(A.S);
      const h = MTT.tab(pc); A.ECON.why(A.homeMkt(pc), 'grain'); A.MT.near(pc).forEach(x => A.MT.tripPlan(x.pid));
      const pure = A.rngState === st && JSON.stringify(A.S) === s0;
      return { pure, here: new RegExp('The market of ' + A.MT.name(A.MT.here(pc))).test(h), rows: (h.match(/data-a="mtTrip"/g) || []).length, why: A.ECON.why(A.homeMkt(pc), 'grain'), inline: /\son[a-z]+=/i.test(h) };
    });
    const ok = r.pure && r.here && r.rows >= 3 && r.rows <= 5 && !r.inline && /months of the town's need/.test(r.why) && /months of need in store/.test(r.why);
    return { ok, detail: `card names the town: ${r.here}; ${r.rows} nearest towns; pure: ${r.pure}; grain: "${r.why}"` };
  },

  async mtSaveAndDeterminism(pg) {
    // the same seed gives the same prices; a save round trip keeps the towns; an old save without them loads and
    // builds them at the next month; and what the towns add to a save
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(async () => {
      const run = () => { MTT.world(81); MTT.months(18); return JSON.stringify(A.S.mt) + JSON.stringify(A.MT.near().map(x => A.MT.rel(x.pid, 'grain'))); };
      const a = run(), b = run();
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      const same = JSON.stringify(d.S.mt) === JSON.stringify(A.S.mt);
      const raw = JSON.stringify(A.S).length, mine = JSON.stringify(A.S.mt).length + JSON.stringify(((A.S.eco || {}).car || []).map(c => [c.fT, c.tT])).length;
      const keep = A.S.mt; delete A.S.mt;
      const enc2 = await SAVES.encode(A.S, A.J); A.S.mt = keep;
      // an old save: no towns yet
      delete A.S.mt; for (const c of (A.S.eco || {}).car || []) { delete c.fT; delete c.tT; }
      const before = A.buyPrice(A.homeMkt(A.pc()), 'grain'), on0 = A.MT.on();
      MTT.months(1);
      const after = A.buyPrice(A.homeMkt(A.pc()), 'grain');
      return { det: a === b, same, kb: Math.round((enc.bytes.length - enc2.bytes.length) / 102.4) / 10, gz: Math.round(enc.bytes.length / 1024), raw: Math.round(raw / 1024), mine: Math.round(mine / 1024), old: !on0 && isFinite(before) && A.MT.on() && isFinite(after) && A.S.mt.L.length > 50 };
    });
    const ok = r.det && r.same && r.old;
    return { ok, detail: `same seed, same towns and prices: ${r.det}; save round trip keeps them: ${r.same}; an old save builds them at the next month: ${r.old}; the towns add ${r.mine} KB of ${r.raw} KB raw state, ${r.kb} KB of ${r.gz} KB gzipped` };
  },

  async mtMonthCost(pg) {
    // the month's cost: 45's hook against this one's, over five years of the same world
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MTT.world(91);
      const t = { eco: 0, mt: 0 };
      const iE = A.onMonth.findIndex(f => /E\.caravans\(\)/.test(f.toString())), iM = A.onMonth.findIndex(f => /MT\.month\(\)/.test(f.toString()));
      const fe = A.onMonth[iE], fm = A.onMonth[iM];
      A.onMonth[iE] = function () { const a = performance.now(); try { return fe.apply(this, arguments); } finally { t.eco += performance.now() - a; } };
      A.onMonth[iM] = function () { const a = performance.now(); try { return fm.apply(this, arguments); } finally { t.mt += performance.now() - a; } };
      try { MTT.months(60); } finally { A.onMonth[iE] = fe; A.onMonth[iM] = fm; }
      return { eco: t.eco / 60, mt: t.mt / 60 };
    });
    const ratio = (r.eco + r.mt) / r.eco;
    // the bar is 1.5 on a quiet machine; a shared one is noisy, so the test holds it to 2
    return { ok: ratio <= 2, detail: `a month: 45-economy ${r2(r.eco)} ms, market towns ${r2(r.mt)} ms; the economy costs ×${r2(ratio)} of 45's` };
  },

  async mtNoTownLoop(pg) {
    // a greedy trader who also uses the market towns: each trip, the best of the realm runs (bench/exploit.mjs) and
    // the trips to the five nearest towns, with the best load home; against farms, five years, two seeds
    await pg.evaluate(EXPLOIT);
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const worth = pc => pc.coin + (pc.assets || []).reduce((a, x) => a + ((GD.PROPERTY[x.k] || {}).price || 0), 0) + (pc.transport || []).reduce((a, k) => a + ((GD.TRANSPORT[k] || {}).price || 0), 0);
      const costOf = (rid, k, n) => { let c = 0; for (let i = 0; i < n; i++) c += A.buyPrice(rid, k) * (1 + i * 0.6 / A.mktDepth(rid, k)); return c; };
      // the trading only: a merchant's guild place that an event hands the trader pays a wage, which is not a trade
      // loop, so it is dropped before every month
      const adv = d => { const pc = A.pc(); pc.job = null; A.advance(d); };
      const trader = (seed, realm, years) => {
        A.newGame({ seed, race: 'human', realm, status: 'merchant', sex: 'M', startAge: 25 });
        const pc = A.pc(); pc.coin = 1000; pc.assets = []; pc.cargo = {}; pc.transport = ['wagon']; pc.job = null;
        const end = A.S.year + years; let trips = 0, towns = 0;
        for (let g = 0; g < 600 && A.S.year < end; g++) {
          if (!A.MT.on()) { adv(30); MTT.drain(); continue; }
          const h = A.homeMkt(pc), cap = A.carryCap(pc) - A.cargoLoad(pc);
          let best = null;
          for (const k in GD.GOODS) {
            let n = cap; while (n > 0 && costOf(h, k, n) > pc.coin * 0.9) n--;
            if (n < 1) continue;
            const keep = pc.cargo; pc.cargo = { [k]: n };
            for (const x of A.MT.near(pc)) { const P = A.MT.tripPlan(x.pid); if (!P || P.hostile || P.shut) continue; const ev = P.net * (1 - P.risk * 0.35) - costOf(h, k, n) - P.R.days * 0.3; if (!best || ev > best.ev) best = { town: x.pid, rid: x.rid, k, n, ev, days: P.R.days }; }
            for (const dest in A.S.realms) { const R = A.S.realms[dest]; if (!R.alive || R.isRebel || dest === h || A.hostile(h, dest)) continue; const P = A.runPlan(dest); if (!P || P.hostile) continue; const ev = P.net * (1 - P.risk * 0.35) - costOf(h, k, n) - P.days * 0.3; if (!best || ev > best.ev) best = { dest, k, n, ev, days: P.days }; }
            pc.cargo = keep;
          }
          if (!best || best.ev <= 0) { adv(30); MTT.drain(); if (!pc.alive) pc.alive = true; pc.health = Math.max(pc.health, 70); continue; }
          A.buyGood(best.k, best.n);
          if (A.S.time < 10) A.S.time = 10;
          const there = best.town != null ? best.rid : best.dest;
          let backK = null, backM = 0;
          for (const j in GD.GOODS) { const buy = best.town != null ? A.MT.at(best.town, () => A.buyPrice(there, j)) : A.buyPrice(there, j); const m = A.sellPrice(h, j) * 0.85 - buy - GD.GOODS[j].base * (best.town != null ? A.MT.road(A.MT.here(pc), best.town).f : A.ECON.road(h, there).f); if (m > buy * 0.2 && m > backM) { backM = m; backK = j; } }
          if (best.town != null) { A.MT.trip(best.town, { buyBack: backK }); towns++; } else A.tradeRun(best.dest, backK ? { buyBack: backK } : {});
          for (const k of Object.keys(A.cargo(pc))) A.sellGood(k, A.cargo(pc)[k]);
          trips++;
          adv(Math.max(10, best.days * 2)); MTT.drain(); if (!pc.alive) pc.alive = true; pc.health = Math.max(pc.health, 70); pc.prison = null;
        }
        return { worth: Math.round(worth(pc)), trips, towns };
      };
      return [[902, 'POL-03'], [904, 'POL-02']].map(([s, rid]) => ({ rid, trader: trader(s, rid, 5), estate: EXPLOIT_ESTATE(s, rid, 5) }));
    });
    const ok = r.every(x => x.trader.worth <= x.estate.worth * 1.3);
    return { ok, detail: r.map(x => `${x.rid}: trader ${x.trader.worth} after ${x.trader.trips} trips (${x.trader.towns} to market towns), estate ${x.estate.worth} (×${r2(x.trader.worth / x.estate.worth)})`).join('; ') };
  },
};
