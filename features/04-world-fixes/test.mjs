// Browser tests for world and economy fixes. Each test gets (page, pageErrors, {browser, file}).
export default {
  async world(pg) {
    // 40 years of world: stability never negative; report debt and hoarding
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 2024, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
      const live = () => Object.values(A.S.realms).filter(x => x.alive);
      const debt0 = live().reduce((a, x) => a + (x.debt || 0), 0);
      let minStab = 100, negAt = null;
      const end = A.S.year + 40;
      for (let k = 0; k < 20000 && A.S.year < end; k++) {
        A.advance(30);
        let h, g = 0; while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
        for (const x of live()) if (x.stability < minStab) { minStab = x.stability; if (x.stability < 0 && !negAt) negAt = `${x.short} ${x.stability} in ${A.S.year}`; }
        if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p) && p.realm === 'POL-01'); if (!kid) break; A.S.pc = kid.id; }
      }
      const L = live();
      return { years: A.S.year - (end - 40), minStab: Math.round(minStab * 10) / 10, negAt, realms: L.length,
        debtors: L.filter(x => x.debt > 0).length, debt0: Math.round(debt0), debt1: Math.round(L.reduce((a, x) => a + (x.debt || 0), 0)),
        hoard: L.filter(x => x.income > 0 && x.treasury > x.income * 6).length };
    });
    return { ok: r.minStab >= 0 && (r.debt0 === 0 || r.debt1 < r.debt0), detail: `${r.years} years: lowest stability ${r.minStab}${r.negAt ? ' (first negative: ' + r.negAt + ')' : ''}; ${r.debtors}/${r.realms} realms in debt, total debt ${r.debt0} → ${r.debt1}; ${r.hoard} realms over 6 years of income` };
  },

  async economy(pg) {
    // no buy-then-sell-back loop may make money, in the thinnest market, for a master trader
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 3, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'F', startAge: 30 });
      const pc = A.pc();
      const thin = Object.values(A.S.realms).filter(x => x.alive && A.mkt(x.id)).sort((a, b) => A.mktDepth(a.id) - A.mktDepth(b.id))[0];
      pc.realm = thin.id; pc.home = (A.S.prov.find(p => p.owner === thin.id) || {}).id ?? pc.home;
      pc.skills.trade = 100; pc.coin = 1e7;
      const rid = A.homeMkt(pc), goods = Object.keys(GD.GOODS);
      let best = { k: null, profit: -Infinity };
      for (const k of goods) {
        if (!A.mkt(rid).p[k]) continue;
        const c0 = pc.coin;
        for (let i = 0; i < 20; i++) { A.buyGood(k, 1); A.sellGood(k, 1); }
        const profit = pc.coin - c0;
        if (profit > best.profit) best = { k, profit };
      }
      return { market: thin.short, depth: Math.round(A.mktDepth(rid) * 10) / 10, spread: A.spread(pc), best };
    });
    return { ok: r.best.profit <= 0, detail: `${r.market} market (depth ${r.depth}), trade 100: best 20x buy+sell loop ${r.best.profit >= 0 ? '+' : ''}${Math.round(r.best.profit)} suns (${r.best.k})` };
  },
};
