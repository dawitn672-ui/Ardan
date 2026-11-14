// The living economy (9995-trade-roads): the far goods are made where the lore makes them; caravans go hand to hand
// along the roads at a caravan's pace; silk gets dearer at every hand west; the monies change; a venture goes out,
// meets the road and comes home as a letter of credit; old saves and the Known World are untouched.
const SETUP = () => {
  window.TRT = {
    world(seed, realm, status, lands) { T.enter({ seed, race: 'human', realm: realm || 'POL-01', status: status || 'merchant', sex: 'M', startAge: 25, lands: lands || 'great' }); A.S.queue.length = 0; return A.pc(); },
    drain() { let h, n = 0; while ((h = A.S.queue[0]) && n++ < 300) { if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } },
    months(n, each) { for (let i = 0; i < n; i++) { A.advance(30); TRT.drain(); const pc = A.pc(); if (!pc.alive) { pc.alive = true; pc.health = 80; } if (each) each(); } },
    p(rid, k) { const r = A.realm(rid); return r && r.alive && r.mkt ? r.mkt.p[k] : null; },
  };
};

export default {
  async trGoodsAndRoads(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      TRT.world(777);
      const goods = ['tea', 'jade', 'porcelain', 'paper', 'silver'].every(k => GD.GOODS[k] && A.mkt('POL-36').p[k] > 0);
      const made = k => { const out = {}; for (const P of A.S.prov) if (P.ecoPr && P.ecoPr[k]) { const l = P.region ? P.region[0] : 'W'; out[l] = (out[l] || 0) + P.ecoPr[k]; } return out; };
      // the Silk Road chain, west from Venshai, and silver the other way
      const chain = ['POL-36', 'POL-39', 'POL-80', 'POL-72', 'POL-70', 'POL-34', 'POL-25', 'POL-16'];
      const acc = {}; let nm = 0;
      TRT.months(24); TRT.months(12, () => { nm++; for (const id of chain.concat(['POL-13', 'POL-28'])) for (const k of ['silk', 'silver', 'tea']) { const v = TRT.p(id, k); if (v) (acc[id + k] = acc[id + k] || []).push(v); } });
      const avg = key => { const a = acc[key] || []; return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
      const silk = chain.map(id => Math.round(avg(id + 'silk')));
      const trip = (A.TRADE.trips('POL-36') || []).find(x => x.b === 'POL-70');
      const road = A.TRADE.onRoad();
      const way = A.S.eco.way, maxKm = Math.max(...way.map(w => { const T = A.TRADE.trips(w[0]).find(x => x.b === w[1]); return T ? T.dist : 0; }));
      return { goods, tea: made('tea'), silver: made('silver'), silk, silverEast: Math.round(avg('POL-36silver')), silverWest: Math.round((avg('POL-13silver') + avg('POL-28silver')) / 2),
        trip: trip ? { hands: trip.hands, months: Math.round(trip.days / 30), km: Math.round(trip.dist), by: trip.legs.map(e => e.b).join(' ') } : null, road, maxKm, MAX_KM: A.TRADE.MAX_KM };
    });
    const k = await pg.evaluate(() => { TRT.world(778, 'POL-01', 'merchant', 'known'); TRT.months(3); return { tea: !!GD.GOODS.tea, roads: !!(A.ECON.roadMode && A.ECON.roadMode()), way: !!(A.S.eco && A.S.eco.way), car: A.S.eco.carN }; });
    const west = (r.silk[5] + r.silk[6] + r.silk[7]) / 3;
    const ok = r.goods && (r.tea.R || 0) > (r.tea.W || 0) * 5 && (r.silver.W || 0) > (r.silver.R || 0) && r.trip && r.trip.hands >= 3 && r.trip.months >= 12 &&
      r.road.landKmPerMonth >= 400 && r.road.landKmPerMonth <= 800 && r.road.n > 500 && r.maxKm <= r.MAX_KM && west > r.silk[0] * 3 && r.silverEast > r.silverWest &&
      !k.tea && !k.roads && !k.way && k.car > 0;
    return { ok, detail: `far goods in: ${r.goods}; tea made by land ${JSON.stringify(r.tea)}; silver ${JSON.stringify(r.silver)}. Venshai to Ozand: ${JSON.stringify(r.trip)}. On the road: ${JSON.stringify(r.road)}, longest trip ${Math.round(r.maxKm)} km. Silk over the third year, west from Taulen (Phelkar, Varinj, Ushivar, Ozand, Tusk Clans, Velgrad, Ostra): ${r.silk.join(' ')} (the west ${Math.round(west)} against ${r.silk[0]}). Silver: Taulen ${r.silverEast}, Highland/Stonehold ${r.silverWest}. Known World: tea ${k.tea}, roads ${k.roads}, way ${k.way}, 45's caravans ${k.car}` };
  },

  async trMoney(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      TRT.world(779, 'POL-36');
      const M = A.MONEY;
      return { taulen: M.keyOf('POL-36'), ozand: M.keyOf('POL-70'), khagan: M.keyOf('POL-58'), ald: M.keyOf('POL-01'), pines: M.keyOf('POL-126'),
        c1: M.change('POL-36', 'POL-01'), c2: M.change('POL-70', 'POL-01'), c0: M.change('POL-01', 'POL-05'), notes: M.noteLoss('POL-36'), f: M.fmt(240, 'POL-36'), f2: M.fmt(450, 'POL-58') };
    });
    const ok = r.taulen === 'note' && r.ozand === 'ozani' && r.khagan === 'bar' && r.ald === 'sun' && r.pines === 'sable' && r.c1 === 0.04 && r.c2 === 0.02 && r.c0 === 0 && Math.abs(r.notes - 0.1) < 1e-9 && /120 strings/.test(r.f) && /3 saddle bars/.test(r.f2);
    return { ok, detail: JSON.stringify(r) };
  },

  async trVenture(pg) {
    // a merchant of Venshai sends silk west: the card offers it and draws purely; each road scene renders and works on
    // the venture; the goods sell at the far market and the money comes home by letter
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = TRT.world(4242, 'POL-36'); pc.coin = 30000; TRT.months(2);
      pc.cargo = { silk: 6 };
      const st = A.rngState, s0 = JSON.stringify(A.S);
      const h = A.TRADE.card(pc); UI.screen = 'game'; UI.tab = 'life'; UI.render();
      const pure = A.rngState === st && JSON.stringify(A.S) === s0;
      const opts = A.TRADE.vOptions(pc, 6), far = opts.find(P => P.hands >= 2) || opts[0];
      const send = far ? A.TRADE.send(far.b, 'silk') : { ok: false };
      const v = (pc.ventures || [])[0];
      // every scene, on this venture
      const scenes = [], raw = [];
      for (const ev of ['tr_road_bandits', 'tr_road_toll', 'tr_road_shut', 'tr_road_war', 'tr_road_monsoon', 'tr_road_camp']) {
        if (!v || v.st !== 'road') break;
        A.S.queue.unshift({ type: 'event', ev, ctx: { vid: v.id, trAt: v.legs[0], trNext: v.legs[1] || v.t, trCk: '' }, forced: true });
        const view = A.eventView(A.S.queue[0]);
        const text = (view && view.text || '') + ' ' + (view && view.choices || []).map(c => c.t + ' ' + (c.r || '')).join(' ');
        if (T.raw.test(text) || /undefined|NaN/.test(text)) raw.push(ev);
        // the choice that keeps the goods going on (not the sale where they stand)
        const ci = ev === 'tr_road_shut' || ev === 'tr_road_monsoon' || ev === 'tr_road_war' ? 0 : 2;
        try { A.eventChoose(ci); } catch (e) { A.S.queue.shift(); raw.push(ev + ' ' + e.message); }
        scenes.push(ev + ':' + v.n + ':' + v.st);
      }
      const coin0 = pc.coin; let months = 0;
      while (months < 60 && !(v && (v.st === 'sold' || v.st === 'lost') && !(pc.credits || []).length)) { TRT.months(1); months++; if (v.st === 'held') v.st = 'road'; }
      const nine = A.EV.tr_nine_wells ? 1 : 0;
      return { pure, rows: (h.match(/data-a="trSend"/g) || []).length, inline: /\son[a-z]+=/i.test(h), far: far ? { to: far.b, hands: far.hands, months: far.months, freight: far.freight, net: far.net } : null, send, scenes, raw, st: v && v.st, sold: v && v.sold, months, gained: pc.coin - coin0, nine };
    });
    const ok = r.pure && r.rows >= 1 && !r.inline && r.far && r.send.ok && r.scenes.length === 6 && !r.raw.length && (r.st === 'sold' || r.st === 'lost') && r.months >= 1 && (r.st === 'lost' || r.gained > 0);
    return { ok, detail: `card pure ${r.pure}, ${r.rows} sends offered; venture ${JSON.stringify(r.far)}; scenes ${r.scenes.join(', ')}; raw tokens in ${JSON.stringify(r.raw)}; it ended ${r.st} after ${r.months} months, the letter brought ${r.gained}` };
  },

  async trOldSave(pg) {
    // a Great Continent save from before this feature (no goods on the road, markets without the far goods, no
    // ventures) loads and plays on; a save with goods on the road comes back with them
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(async () => {
      TRT.world(9931, 'POL-70'); TRT.months(3);
      const n0 = A.S.eco.way.length;
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      TRT.world(9932, 'POL-01', 'peasant', 'known');
      const ok1 = UI.enterSave(d), n1 = (A.S.eco.way || []).length;
      // strip it back to the release's shape
      delete A.S.eco.way; delete A.pc().ventures; delete A.pc().credits;
      for (const r of Object.values(A.S.realms)) if (r.mkt && r.mkt.p) for (const k of ['tea', 'jade', 'porcelain', 'paper', 'silver']) { delete r.mkt.p[k]; delete r.mkt.t[k]; if (r.mkt.s) delete r.mkt.s[k]; }
      const errs = []; const ce = console.error; console.error = (...a) => { errs.push(a.join(' ')); ce.apply(console, a); };
      try { TRT.months(2); } finally { console.error = ce; }
      const p = A.mkt('POL-36').p.tea;
      return { n0, n1, ok1, errs: errs.slice(0, 3), tea: p, way: (A.S.eco.way || []).length };
    });
    const ok = r.ok1 && r.n0 > 0 && r.n1 === r.n0 && !r.errs.length && r.tea > 0 && r.way > 0;
    return { ok, detail: `goods on the road saved ${r.n0}, loaded ${r.n1}; stripped save plays on: tea in Taulen ${r.tea && r.tea.toFixed(1)}, ${r.way} on the road again, errors ${JSON.stringify(r.errs)}` };
  },
};
