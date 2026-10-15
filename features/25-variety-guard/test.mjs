// Variety guard: measured A/B in one build, by switching the guard off (A.EV_COOL 6, no shape weights) and on.
const RUN = () => {
  window.VAR_RUN = (on, seeds, years) => {
    const keep = { cool: A.EV_COOL, v: A.evVariety, r: A.evRecency };
    if (!on) { A.EV_COOL = 6; A.evVariety = null; A.evRecency = null; }
    let views = 0, rep = 0, pairs = 0, same = 0, triples = 0, shaped = 0, npc = 0, npcRep = 0;
    for (const seed of seeds) {
      A.newGame({ seed, race: 'human', realm: ['POL-01', 'POL-03', 'POL-13'][seed % 3], status: ['peasant', 'artisan', 'noble'][seed % 3], sex: seed % 2 ? 'M' : 'F', startAge: 16 });
      const last = {}, shapes = [], done = new WeakSet();
      T.play(years, { onEvent: v => {
        const q = A.S.queue[0], id = q && q.ev, e = A.EV[id];
        if (!e || done.has(q)) return;   // an event with a result screen is viewed twice
        done.add(q);
        if (e.trigger) { if (e.npc) { npc++; if (last[id] != null && A.S.year - last[id] < 10) npcRep++; last[id] = A.S.year; } return; }
        views++;
        const cool = e.cool || 10;
        if (last[id] != null && A.S.year - last[id] < 10 && cool >= 10) rep++;
        last[id] = A.S.year;
        const s = A.evShape(e); shapes.push(s); if (s) shaped++;
      } });
      for (let i = 1; i < shapes.length; i++) if (shapes[i]) { pairs++; if (shapes[i] === shapes[i - 1]) same++; if (i > 1 && shapes[i] === shapes[i - 1] && shapes[i] === shapes[i - 2]) triples++; }
    }
    A.EV_COOL = keep.cool; A.evVariety = keep.v; A.evRecency = keep.r;
    return { views, npc, npcRepeatPct: Math.round(1000 * npcRep / Math.max(1, npc)) / 10, repeatPct: Math.round(1000 * rep / Math.max(1, views)) / 10, samePct: Math.round(1000 * same / Math.max(1, pairs)) / 10, triples, shapedPct: Math.round(100 * shaped / Math.max(1, views)) };
  };
};

export default {
  async varietyGuard(pg) {
    await pg.evaluate(RUN);
    // eight lives a side: with four, the back-to-back share (about 20 pairs in 500 views) flipped on the random stream
    const S8 = [3, 4, 5, 6, 7, 8, 9, 10];
    const r = await pg.evaluate(S8 => ({ off: VAR_RUN(false, S8, 30), on: VAR_RUN(true, S8, 30) }), S8);
    // the release ships no NPC moves, so their repeat share only counts when there are some
    const npcOk = r.off.npc < 20 || r.on.npcRepeatPct <= r.off.npcRepeatPct * 0.7;
    const ok = r.on.repeatPct <= Math.max(0.3, r.off.repeatPct * 0.5) && r.on.triples === 0 && r.on.samePct <= r.off.samePct * 0.75 && r.on.shapedPct >= 50 && npcOk;
    return { ok, detail: `guard off: ${JSON.stringify(r.off)}; guard on: ${JSON.stringify(r.on)}` };
  },

  async varietyShapes(pg) {
    const r = await pg.evaluate(() => {
      const ids = Object.keys(A.EV), counts = {};
      let none = 0;
      for (const id of ids) { const s = A.evShape(A.EV[id]); if (!s) none++; else counts[s] = (counts[s] || 0) + 1; }
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      // shapes are cached and not saved: the event objects' JSON does not change
      const e = A.EV[ids[0]]; A.evShape(e);
      return { n: ids.length, none, top, hidden: !Object.keys(e).includes('_shape') };
    });
    const biggest = r.top[0] ? r.top[0][1] / r.n : 0;
    return { ok: r.hidden && r.none < r.n * 0.5 && biggest < 0.25 && r.top.length >= 12,
      detail: `${r.n} events, ${r.none} without a shape; ${r.top.map(([k, v]) => k + ' ' + v).join(', ')}` };
  },
};
