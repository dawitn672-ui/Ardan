// Ardan v2's engine on the page (step 1 of docs/v2/V2_SPEC.md): present, seeded, one continent, and inert.
export default {
  async v2Loaded(pg) {
    const r = await pg.evaluate(() => {
      const V = A.V2; if (!V) return { ok: false };
      const h0 = T.hash(A.S), r0 = A.rngState;
      const a = V.continent.generateContinent({ seed: 'ardan-test', width: 200, height: 140 });
      const b = V.continent.generateContinent({ seed: 'ardan-test', width: 200, height: 140 });
      const same = JSON.stringify(Array.from(a.elev || [])) === JSON.stringify(Array.from(b.elev || []));
      const c = V.continent.components(a.elev, a.W, a.H), all = c.list.reduce((s, x) => s + x.size, 0);
      const land = Math.round(1000 * c.list.find(x => x.id === c.largest).size / all) / 10;
      return { ok: true, mods: Object.keys(V).length, same, land, inert: T.hash(A.S) === h0 && A.rngState === r0, win: window.ARDAN_V2 === V };
    });
    return { ok: r.ok && r.mods >= 18 && r.same && r.land > 98.5 && r.inert && r.win, detail: `A.V2 with ${r.mods} modules; the same continent twice from one seed ${r.same}; ${r.land}% of the land in one continent; the game's state and stream untouched ${r.inert}` };
  },
};
