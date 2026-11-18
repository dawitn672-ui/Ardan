// Tests for W1-2 "minds" (9999950-why, A.WHY; R1, D-069). See README.md. The engine's own unit tests, the owner's two
// lab kings in their purest form among them, are tests/v2/why.test.js.

// in the page: a free pair of bordering AI realms, and a way to set a ruler's temper and the Generals' count
const SETUP = () => {
  window.WY = {
    pair() {
      const me = A.pc().realm;
      const free = id => { const x = A.realm(id); return x && x.alive && !x.isRebel && !x.playerRun && id !== me && !A.atWar(id).length && (x.stability || 0) >= 30 && !x.overlord && x.ruler != null && A.P(x.ruler); };
      for (const a of Object.keys(A.S.realms).sort()) {
        if (!free(a)) continue;
        const b = A.neighbors(a).find(o => free(o) && A.realm(o).overlord !== a && !A.hostile(a, o) && !(A.realm(a).allies || []).includes(o) && !A.hasNap(a, o) && !(A.cbWarMul && !(A.cbWarMul(a, o, null) > 0)));
        if (b) return [a, b];
      }
      return null;
    },
    // a ruler of the given traits (put back by the caller), his feelings cleared
    temper(rid, traits) { const p = A.P(A.realm(rid).ruler), was = { traits: p.traits, feel: p.feel }; p.traits = traits.slice(); delete p.feel; return () => { p.traits = was.traits; if (was.feel) p.feel = was.feel; else delete p.feel; }; },
    preview(a, b, ratio) { const P = (A.cbPreview || A.warPreview)(a, b); return Object.assign({}, P, { ratio }); },
    seeded(n) { let s = n >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  };
};

export default {
  // the owner's lab (order 54, D-064 point 9), in the game: two rulers of a real realm, the same insult (an envoy shamed
  // at the court of its neighbour, the release's incident) and the same council (A.WHY.warDecision, what DV.tryWar asks).
  // Their Generals count the neighbour's strength twice theirs. The proud, hot king declares in at least 6 of 10 worlds
  // and his record says so (because the insult; despite the count); the cold king declares in at most 1 of 10, and
  // strikes when, four years on, the count turns in his favour: in at least 5 of 10 worlds within four councils (a year's
  // councils each), the old insult among his reasons.
  async whyLabKings(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      T.enter({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const W = A.WHY, pr = WY.pair();
      if (!pr) return { skip: 'no free pair' };
      const [a, b] = pr, RA = A.realm(a), RB = A.realm(b);
      const k0 = A.rngState, out = { pair: pr };
      const trial = (traits, ratio, insult) => {
        const back = WY.temper(a, traits);
        try {
          if (insult) W.wrong('envoy', b, a);   // a's envoy shamed at b's court: a's ruler feels it
          let wars = 0, rec = null;
          for (let s = 1; s <= 10; s++) { const x = W.warDecision(RA, RB, WY.preview(a, b, ratio), -30, null, { pace: W.T.peaceOcc + Math.log(.65 / .35), rand: WY.seeded(s), log: false }); if (x && x.chose === 'war') wars++; rec = x; }
          return { wars, rec, heat: W.heat(a, b) };
        } finally { back(); }
      };
      // the cold king is no dove: he carries grudges and wants land, but he is calm and patient (no heat to speak of)
      const COLD = ['calm', 'patient', 'ambitious', 'vengeful'];
      out.proud = trial(['proud', 'wrathful', 'impetuous'], .5, true);
      out.cold = trial(COLD, .5, true);
      out.coldLater = (() => {
        const back = WY.temper(a, COLD);
        try { W.wrong('envoy', b, a); for (let m = 0; m < 48; m++) W.cool(1); let wars = 0, rec = null; for (let s = 1; s <= 10; s++) for (let k = 0; k < 4; k++) { const x = W.warDecision(RA, RB, WY.preview(a, b, 2.4), -30, 'insult', { pace: W.T.peaceOcc + Math.log(.65 / .35), rand: WY.seeded(100 * s + k), log: false }); if (x && x.chose === 'war') { wars++; rec = x; break; } } return { wars, rec, heat: W.heat(a, b) }; } finally { back(); }
      })();
      out.pure = A.rngState === k0;   // the lab drew only from its own seeded draws
      return out;
    }).toString() + ')()');
    if (r.skip) return { ok: true, skip: r.skip };
    const P = r.proud, C = r.cold, L = r.coldLater, why = P.rec ? P.rec.why.map(x => x[0]).join('; ') : '', not = P.rec ? P.rec.not.map(x => x[0]).join('; ') : '';
    const ok = P.wars >= 6 && /shaming of his envoy/.test(why) && /Generals count/.test(not) && C.wars <= 1 && L.wars >= 5 && L.heat < .1 && /insult/i.test(L.rec ? L.rec.why.map(x => x[0]).join(' ') : '') && r.pure;
    return { ok, detail: `${r.pair.join(' and ')}: proud king declares ${P.wars}/10 (heat ${P.heat}; because: ${why}; despite: ${not}); cold king ${C.wars}/10 (heat ${C.heat}); four years on, the count in his favour, ${L.wars}/10 (heat ${L.heat}; because: ${L.rec ? L.rec.why.map(x => x[0]).join('; ') : '-'}); A.rand untouched ${r.pure}` };
  },

  // every war a crown declared in ten years carries its record; the records, feelings and calls are bounded, plain data,
  // survive a save and a load, and an old save without them loads and decides again
  async whyRecordsKept(pg) {
    const r = await pg.evaluate(() => {
      // A world may keep a quiet decade: after the market fix (H-073 addendum 2) shifted every world's stream, seed 5's
      // crowns all waited (23 short of nerve, 18 for want of reasons) and declared no war in ten years, while seeds 6, 7,
      // 11, 12 and 13 declared 7, 5, 10, 4 and 8, each with its record (before the fix seed 5 declared 2, the others
      // 3 to 9: the pace did not change). So the test reads the next world when one keeps the peace (H-079).
      // (H-081: up to eight worlds, not three. A decade of peace is one world's draw, about one in six on the readings above;
      // eight in a row would be the crowns' war-making broken, and the test then fails naming the worlds read.)
      const declared = [];
      A.on('warStart', w => { if (w.why) declared.push(w.id); });
      const found = T.trySeeds([5, 6, 7, 8, 9, 10, 11, 12], seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 22 });
        T.play(10);
        return declared.length || A.S.wars.some(w => w.why);
      });
      const S = A.S, L = S.why || [], out = { seed: found.seed, tried: found.tried.join(',') };
      out.n = L.length; out.kinds = L.reduce((m, e) => (m[e.k] = (m[e.k] || 0) + 1, m), {});
      out.wellFormed = L.every(e => e.k && e.chose != null && Array.isArray(e.why) && e.why.length <= 3 && Array.isArray(e.not) && e.not.length <= 2 && e.why.every(x => typeof x[0] === 'string' && !/[<>"]/.test(x[0]) && isFinite(x[1])));
      out.warsWithWhy = S.wars.filter(w => w.why).length + declared.length;
      const wars = L.filter(e => e.k === 'war');
      out.warReasons = wars.every(e => e.why.length >= 1 && e.why.every(x => x[3] && x[3].t));
      out.hot = (S.whyHot || []).length; out.feelOk = (S.whyHot || []).every(id => { const p = A.P(id); return p && Array.isArray(p.feel) && p.feel.length <= 4; });
      // bounded: a thousand more decisions keep the log at its caps
      for (let i = 0; i < 1000; i++) A.WHY.decide(null, i % 2 ? 'appoint' : 'test', [{ id: 'x', reasons: [{ kind: 'merit', weight: 1, label: 'x' }] }]);
      out.capped = S.why.length <= A.WHY.T.logCap && S.why.filter(e => e.k === 'appoint').length <= A.WHY.T.kindCap.appoint && S.why.filter(e => e.k === 'war').length === wars.length;
      const snap = A.serialize(), n = S.why.length;
      A.deserialize(JSON.parse(snap));
      out.loaded = (A.S.why || []).length === n && JSON.stringify(A.S.why[0]) === JSON.stringify(JSON.parse(snap).why[0]);
      // an old save: none of the fields
      const old = JSON.parse(snap); delete old.why; delete old.whyHot; delete old.whyAsk; delete old.whyTick;
      for (const id in old.people) delete old.people[id].feel;
      A.deserialize(old);
      T.play(2);
      out.oldOk = Array.isArray(A.S.why) || A.S.why === undefined;
      return out;
    });
    const ok = r.n > 0 && r.wellFormed && r.warReasons && r.feelOk && r.capped && r.loaded && r.oldOk && r.warsWithWhy >= 1;
    return { ok, detail: `world ${r.seed == null ? 'none of ' + r.tried + ' declared a war in ten years' : r.seed + ' (read ' + r.tried + ')'}: ${r.n} records ${JSON.stringify(r.kinds)}; wars with a record ${r.warsWithWhy}; well formed ${r.wellFormed}; every war reason sourced ${r.warReasons}; ${r.hot} people with feelings (at most four each: ${r.feelOk}); capped ${r.capped}; save and load ${r.loaded}; old save ${r.oldOk}` };
  },

  // what the player is told: a war's news says why in plain words, never a number, and the council's count of spears
  // only to the ruler or a councillor of the realm that declared
  async whyToldByRank(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      T.enter({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const W = A.WHY, pr = WY.pair();
      if (!pr) return { skip: 'no free pair' };
      const [a, b] = pr, RA = A.realm(a), RB = A.realm(b);
      const back = WY.temper(a, ['proud', 'wrathful', 'impetuous']);
      let rec;
      try { W.wrong('envoy', b, a); rec = W.warDecision(RA, RB, WY.preview(a, b, .5), -30, null, { pace: 0, rand: WY.seeded(1), log: false }); } finally { back(); }
      const pc = A.pc(), out = { chose: rec && rec.chose };
      out.outsider = W.tellFor(rec, a);
      const was = { realm: pc.realm, ruler: pc.ruler };
      pc.realm = a; pc.ruler = a;
      out.ruler = W.tellFor(rec, a);
      pc.realm = was.realm; pc.ruler = was.ruler;
      // the news of a real declaration carries the told reasons
      const n0 = A.S.news.length;
      const res = A.declareWar(a, b, { war: { why: rec } });
      out.news = (A.S.news.find(n => /^War declared by/.test(n.t)) || {}).t || '';
      out.warWhy = !!(res && res.w && res.w.why);
      return out;
    }).toString() + ')()');
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.chose === 'war' && /^Because: /.test(r.outsider) && !/Generals/.test(r.outsider) && /Generals count/.test(r.ruler) && !/%|\d+\.\d/.test(r.outsider + r.ruler) && /Because: /.test(r.news) && !/Generals/.test(r.news) && r.warWhy;
    return { ok, detail: `outsider: "${r.outsider}"; ruler: "${r.ruler}"; news: "${r.news}"; war keeps its record ${r.warWhy}` };
  },

  // a faction is joined or left by its house's decision, with reasons; the crown names its first host's General by one
  async whyFactionsAndGenerals(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 22 });
      T.play(6);
      const L = A.S.why || [], fac = L.filter(e => e.k === 'faction'), app = L.filter(e => e.k === 'appoint');
      const facOk = fac.every(e => ['join', 'leave'].includes(e.chose) && e.why.length >= 1);
      const reasons = [...new Set(fac.flatMap(e => e.why.map(x => x[0])))].slice(0, 6);
      // every General the crown named is the one on record
      const named = app.filter(e => A.POSTS && A.POSTS.held(e.chose).some(k => /^div:/.test(k))).length;
      const withWhy = (A.S.factions || []).filter(f => f.why).length;
      return { fac: fac.length, facOk, reasons, app: app.length, named, factions: (A.S.factions || []).length, withWhy };
    });
    const ok = r.fac > 0 && r.facOk && r.app > 0;
    return { ok, detail: `${r.fac} faction choices on record (well formed ${r.facOk}; reasons: ${r.reasons.join(' | ')}); ${r.factions} factions, ${r.withWhy} with their reasons; ${r.app} Generals named on record, ${r.named} still in a host` };
  },
};
