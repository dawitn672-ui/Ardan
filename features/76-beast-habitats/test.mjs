// Tests for features/76-beast-habitats: beasts are near only the provinces their lore names, every beast still lives
// somewhere, Aldmark has no tropical beasts and Ranpur keeps its tiger, the callers survive an empty list, and the picker
// draws no random numbers. Every test fails (never skips) when the feature is not in the build.

const GATE = () => typeof A !== 'undefined' && !!A.beastsNear && !!A.BH && !!A.BH.TABLE;

// An independent reading of the table, from the raw data and the map as written: is beast `id` allowed in province P?
const CHECKER = () => {
  window.BHT = {
    map: LORE.map.provinces,
    allowed(id, P) {
      const t = A.BH.TABLE[id]; if (!t) return { ok: false, why: 'no table entry' };
      const L = this.map.find(x => x.id === P.id);
      if (!t.biomes.includes(P.biome)) return { ok: false, why: `biome ${P.biome} not in ${t.biomes.join('/')}` };
      if (t.terrIn && !t.terrIn.includes(P.terr)) return { ok: false, why: `terrain ${P.terr} not in ${t.terrIn}` };
      const placed = (t.realms || []).length || (t.wilds || []).length || (t.extra || []).length;
      if (!placed) return { ok: true };
      if ((t.realms || []).includes(L.realm)) return { ok: true };
      if ((t.wilds || []).includes(L.name) || (t.extra || []).includes(L.name)) return { ok: true };
      if (t.edge && (t.wilds || []).some(n => { const w = this.map.find(x => x.name === n); return w && w.adj.includes(L.id); })) return { ok: true };
      return { ok: false, why: `${L.name} (${L.realm}) is outside ${[...(t.realms || []), ...(t.wilds || []), ...(t.extra || [])].join(', ')}` };
    },
    // the beast list for every province, with the test character moved there and back
    sweep(off) {
      const pc = A.pc(), h0 = pc.home, out = [];
      A.BH.OFF = !!off;
      try { for (const P of A.S.prov) { pc.home = P.id; out.push({ P, ids: A.beastsNear(pc) }); } } finally { A.BH.OFF = false; pc.home = h0; }
      return out;
    },
  };
};

export default {
  async bhInsideHabitat(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.BH not in this build' };
    await pg.evaluate(CHECKER);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7601, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const after = BHT.sweep(false), before = BHT.sweep(true);
      const bad = [], added = [];
      let pairs = 0, beforePairs = 0, beforeBad = 0;
      for (let i = 0; i < after.length; i++) {
        const { P, ids } = after[i];
        for (const id of ids) { pairs++; const a = BHT.allowed(id, P); if (!a.ok) bad.push(`${id} at ${P.name}: ${a.why}`); }
        // the wrapper only removes from the release's list, apart from the named `extra` provinces
        for (const id of ids) if (!before[i].ids.includes(id) && !(A.BH.TABLE[id].extra || []).includes(P.name)) added.push(`${id} at ${P.name}`);
        for (const id of before[i].ids) { beforePairs++; if (!BHT.allowed(id, P).ok) beforeBad++; }
      }
      return { provinces: after.length, pairs, beforePairs, beforeBad, bad: bad.slice(0, 5), nBad: bad.length, added: added.slice(0, 5), missing: A.BH.resolve().missing };
    });
    // the release itself breaks the table many times over, so the check can tell the two apart
    const ok = r.provinces === 306 && r.pairs >= 150 && r.nBad === 0 && !r.added.length && !r.missing.length && r.beforeBad > 1000;
    return { ok, detail: `${r.pairs} beast-province pairs in ${r.provinces} provinces, ${r.nBad} outside their habitat (release: ${r.beforeBad} of ${r.beforePairs})` +
      (r.nBad ? ' BAD ' + r.bad.join('; ') : '') + (r.added.length ? ' ADDED ' + r.added.join('; ') : '') + (r.missing.length ? ' UNRESOLVED ' + r.missing.join('; ') : '') };
  },

  async bhAllReachable(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.BH not in this build' };
    await pg.evaluate(CHECKER);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7602, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const n = {};
      for (const { ids } of BHT.sweep(false)) for (const id of ids) n[id] = (n[id] || 0) + 1;
      const ids = Object.keys(A.BEASTS), lore = ids.filter(id => LORE.creatures.find(c => c.id === id));
      // the beasts that a person born in a realm (not only a wanderer in an unclaimed wild) can meet at home
      const settled = {};
      for (const { P, ids: near } of BHT.sweep(false)) if (P.orig !== 'unclaimed') for (const id of near) settled[id] = 1;
      return { total: ids.length, lore: lore.length, tabled: ids.filter(id => A.BH.TABLE[id]).length,
        nowhere: lore.filter(id => !n[id]).map(id => LORE.creatures.find(c => c.id === id).name),
        wildOnly: lore.filter(id => n[id] && !settled[id]).map(id => LORE.creatures.find(c => c.id === id).name),
        counts: lore.map(id => `${LORE.creatures.find(c => c.id === id).name} ${n[id] || 0}`) };
    });
    const ok = r.total === 25 && r.lore === 25 && r.tabled === 25 && !r.nowhere.length;
    return { ok, detail: `${r.lore} beasts, ${r.tabled} in the table; nowhere: ${r.nowhere.join(', ') || 'none'}; only in unclaimed wilds: ${r.wildOnly.join(', ') || 'none'}. ` + r.counts.join(', ') };
  },

  async bhAldmarkRanpur(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.BH not in this build' };
    await pg.evaluate(CHECKER);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7603, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const NO = { 'CRE-49': 'Tiger of Ranpur', 'CRE-53': 'the Roc', 'CRE-51': 'World Python', 'CRE-55': 'Forest Men', 'CRE-24': 'Old Man of the Trees' };
      const realmOf = id => BHT.map.find(x => x.id === id).realm;
      const tally = rows => { const ald = new Set(), ran = []; let aldN = 0, ranN = 0;
        for (const { P, ids } of rows) {
          if (realmOf(P.id) === 'POL-01') { aldN++; for (const id of ids) if (NO[id]) ald.add(NO[id]); }
          if (realmOf(P.id) === 'POL-30') { ranN++; if (ids.includes('CRE-49')) ran.push(P.name); }
        }
        return { ald: [...ald], ran, aldN, ranN }; };
      const after = tally(BHT.sweep(false)), before = tally(BHT.sweep(true));
      // the start a player would get: a peasant of Aldmark at home, and one of Ranpur
      const aldHome = A.beastsNear(A.pc()).filter(id => NO[id]);
      A.newGame({ seed: 7604, race: 'human', realm: 'POL-30', status: 'peasant', sex: 'F', startAge: 25 });
      const ranHome = A.beastsNear(A.pc()).includes('CRE-49');
      return { after, before, aldHome, ranHome, ranHomeName: A.provName(A.pc().home) };
    });
    const ok = r.after.aldN === 20 && !r.after.ald.length && !r.aldHome.length && r.after.ranN === 5 && r.after.ran.length === 5 && r.ranHome && r.before.ald.length === 5;
    return { ok, detail: `Aldmark (${r.after.aldN} provinces) lists ${r.after.ald.join(', ') || 'none of the five'} (release: ${r.before.ald.join(', ')}); ` +
      `the tiger is near ${r.after.ran.length} of ${r.after.ranN} Ranpur provinces (${r.after.ran.join(', ')}); a Ranpur start at ${r.ranHomeName} has it: ${r.ranHome}` };
  },

  async bhNoDraws(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.BH not in this build' };
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7605, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 25 });
      const pc = A.pc(), h0 = pc.home, rng0 = A.rngState, s0 = JSON.stringify(A.S);
      let draws = 0; const rand = A.rand; A.rand = function () { draws++; return rand.apply(this, arguments); };
      let calls = 0, listed = 0;
      try {
        for (let i = 0; i < 300; i++) { pc.home = A.S.prov[(i * 37) % A.S.prov.length].id; listed += A.beastsNear(pc).length; calls++; }
      } finally { A.rand = rand; pc.home = h0; }
      return { calls, listed, draws, rngSame: A.rngState === rng0, stateSame: JSON.stringify(A.S) === s0 };
    });
    return { ok: r.calls === 300 && r.listed > 0 && r.draws === 0 && r.rngSame && r.stateSame,
      detail: `${r.calls} calls listed ${r.listed} beasts; draws ${r.draws}; random stream unmoved ${r.rngSame}; state unchanged ${r.stateSame}` };
  },

  async bhReplayWithRender(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.BH not in this build' };
    // the same seed reaches the same world whether or not the screens were drawn; a Ranpur life, where beasts still roam
    const r = await pg.evaluate(() => {
      const run = look => {
        T.enter({ seed: 7606, race: 'human', realm: 'POL-30', status: 'peasant', sex: 'M', startAge: 18 });
        T.play(6, { each: () => { if (look) T.renderAll(); } });
        T.renderAll();
        return T.hash(A.S.people) + ':' + T.hash(A.S.realms) + ':' + A.rngState;
      };
      const a = run(false), b = run(true), c = run(false);
      return { a, b, c };
    });
    return { ok: r.a === r.b && r.a === r.c, detail: r.a === r.b && r.a === r.c ? 'same world three times' : `worlds differ (${r.a} / ${r.b} / ${r.c})` };
  },

  async bhEmptySafe(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.BH not in this build' };
    // a province with no beast now: every scene and the hunt that read A.beastsNear must still work there
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7607, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc(), empty = A.S.prov.find(P => { pc.home = P.id; return P.owner === 'POL-02' && !A.beastsNear(pc).length; });
      if (!empty) return { none: true };
      pc.home = empty.id;
      const src = e => [e.cond, e.setup, e.text, ...(e.choices || []).flatMap(c => [c.r, c.fx, c.win && c.win.r, c.lose && c.lose.r, c.win && c.win.fx, c.lose && c.lose.fx])].filter(f => typeof f === 'function').map(f => f.toString()).join(' ');
      const evs = Object.values(A.EV).filter(e => /beastsNear|beastNear|beastOf|killer\(/.test(src(e)));
      const errs = []; let ran = 0;
      for (const e of evs) {
        const ctx = {};
        try {
          if (typeof e.cond === 'function') e.cond(pc, A.C);
          if (typeof e.setup === 'function') e.setup(pc, ctx);
          if (typeof e.text === 'function') e.text(pc, ctx);
          for (const c of e.choices || []) for (const f of [c.r, c.win && c.win.r, c.lose && c.lose.r]) if (typeof f === 'function') f(pc, ctx);
          if (ctx.beast && !ctx.skip && !A.BEASTS[ctx.beast] && !/^the |^a /i.test(String(ctx.beast))) errs.push(`${e.id}: unknown beast ${ctx.beast}`);
          ran++;
        } catch (x) { errs.push(`${e.id}: ${String(x).slice(0, 80)}`); }
      }
      let hunts = 0;
      for (let i = 0; i < 40; i++) { A.S.queue = []; try { A.startHunt(pc, i % 2 === 1); hunts++; } catch (x) { errs.push('startHunt: ' + String(x).slice(0, 80)); } }
      A.S.queue = [];
      return { where: empty.name, events: evs.length, ran, hunts, errs: errs.slice(0, 6), nErr: errs.length };
    });
    if (r.none) return { ok: false, detail: 'no Solenne province without beasts to test in' };
    return { ok: r.events >= 15 && r.ran === r.events && r.hunts === 40 && r.nErr === 0,
      detail: `at ${r.where} (no beasts near): ${r.ran} of ${r.events} beast scenes set up and drew text, ${r.hunts} hunts` + (r.nErr ? ' ERRORS ' + r.errs.join('; ') : '') };
  },
};
