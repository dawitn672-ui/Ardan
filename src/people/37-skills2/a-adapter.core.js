// Skills rebuild, step 3 (docs/design/skills-v2.md §5, §10): the adapter, behind A.SK2.on = false, computing beside S1.
//
// - A.SK2.DATA is data/skills/ as one object (vocab, families, every rung and skill, recipes); the engine is A.V2.skills2
//   (src/people/engine/skills2.js), indexed on first use.
// - What a person holds: the player's rungs live in pc.ks (one entry a rung: { lv, xp, held, rust, best, used, streak,
//   focus }, the defaults left out), written from S1's table by SK2.sync once a month and by the save step 'skills2'
//   (b-migrate). An evolved rung stays beside its evolution (§15.2), so a person at B holds his D and C rungs at Lv 10.
//   Anyone else's rung is a function of his number (rank by band, level by value, §7), held nowhere.
// - SK2.reads(p, k) is what a check reads for key k through the rungs (§5.1): the family's best rung, a focus's shift,
//   rust; SK2.read(p, k) adds what A.skill adds after (the body's hold, wounds, the clamp). While SK2.on is false nothing
//   reads them but the tests (sk2Shadow: they equal A.skill for every person, key and month). The switch is step 5.
// - Nothing here draws from A.rand. SK2.reads is pure: a family whose stored rungs are behind S1's table (a card set a
//   level since the month's sync) is read from the table as the sync would write it, without storing.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;
  const SK2 = A.SK2 = A.SK2 || {};
  SK2.on = false;

  // ---- the data, one object ---------------------------------------------------------------------------------------------
  const DD = A.DATA || {};
  const D = SK2.DATA = { vocab: DD['skills/vocab'], families: DD['skills/families'], skills: [], recipes: ((DD['skills/recipes'] || {}).recipes) || [] };
  for (const k of Object.keys(DD).sort()) if (/^skills\//.test(k) && !/^skills\/(vocab|families|recipes)$/.test(k)) D.skills.push(...((DD[k] && DD[k].skills) || []));
  if (!D.vocab || !D.families) { console.error('skills2: no data/skills on the page'); return; }
  let E = null, IX = null;
  SK2.E = () => { if (!E) { E = A.V2.skills2; IX = E.setData(D); } return E; };
  SK2.IX = () => { SK2.E(); return IX; };

  // ---- S1's table as rungs (pure) -----------------------------------------------------------------------------------------
  const famOf = k => (SK.LEG[k] ? SK.LEG[k][0] : SK.BY[k] ? k : null);
  // the rungs of family c from S1's entry s: every rank below the held one at Lv 10, the held one at its level (§7)
  SK2.fromS1 = function (c, s, born) {
    const Eng = SK2.E(), ix = IX, out = {};
    if (!s || !(s.lv > 0)) return out;
    const r = Eng.fromS1(s.lv, s.xp);
    for (const rank of Eng.HUMAN) {
      const id = Eng.rungOf(ix, c, rank); if (!id) continue;
      if (Eng.rankIx(rank) < Eng.rankIx(r.rank)) { out[id] = { lv: 10 }; continue; }
      if (rank !== r.rank) break;
      const e = out[id] = { lv: r.lv };
      if (r.xp > 0) e.xp = r.xp;
      if (r.held || s.st > 0) e.held = Math.round(((r.held || 0) + (+s.st || 0)) * 100) / 100;
      if (s.rust > 0) e.rust = s.rust;
      if (s.best > 0) e.best = SK.VALUES[s.best];
      if (s.used != null) e.used = s.used;
      if (s.streak > 0) e.streak = s.streak;
      if (s.sp && s.sp.length) e.focus = s.sp.slice();
      if (s.proved) e.proved = 1;
      if (born != null) e.y = born;
    }
    return out;
  };
  // the held rung of a family in a table (the highest rank held)
  SK2.topOf = function (ks, c) {
    const Eng = SK2.E();
    let top = null;
    for (const rank of Eng.HUMAN) { const id = Eng.rungOf(IX, c, rank), e = id && ks && ks[id]; if (e) top = { id, rank, e }; }
    return top;
  };
  // the stored rungs of family c still say what S1's table says (level, rust, focus)
  const sameList = (a, b) => (a || []).join() === (b || []).join();
  SK2.fresh = function (p, c) {
    const s = p.sk && p.sk[c], top = SK2.topOf(p.ks, c);
    if (!s || !(s.lv > 0)) return !top;
    return !!top && SK2.E().s1OfRung(top.rank, top.e.lv) === s.lv && (top.e.rust || 0) === (s.rust > 0 ? s.rust : 0) && sameList(top.e.focus, s.sp);
  };
  // the top rung a family reads for someone with a table: stored if fresh, else as the sync would write it
  function tableTop(p, c) {
    if (p.ks && SK2.fresh(p, c)) return SK2.topOf(p.ks, c);
    return SK2.topOf(SK2.fromS1(c, p.sk[c]), c);
  }

  // ---- what a check reads (§5.1) -------------------------------------------------------------------------------------------
  // the rung behind a number (an NPC's, or a number older code wrote into the mirror): while S1 owns the levels, the
  // rung of the S1 step under it (S1 reads a number between its levels as the level below; an even rung would read
  // higher: found by sk2Shadow, an NPC rolled at 41 read 41 here and 39 in S1)
  const rungOfNum = v => { const Eng = SK2.E(); return Eng.rungOfS1(Eng.s1LevelOfValue(+v || 0)); };
  SK2.reads = function (p, k) {
    const c = famOf(k); if (!c || !p) return 0;
    const Eng = SK2.E(), L = SK.LEG[k], sk = p.skills || {};
    let rung = null, rust = 0, focus = null;
    if (p.sk && typeof p.sk === 'object' && p.sk[c]) {
      const t = tableTop(p, c);
      if (t) { rung = { rank: t.rank, lv: t.e.lv }; rust = t.e.rust || 0; focus = t.e.focus || []; }
      // a number older code wrote since the month's pass is read at once, as S1 reads it (adopted at the month)
      const m = sk[c];
      if (m != null && (!rung || m !== Eng.value(rung.rank, rung.lv))) rung = rungOfNum(m);
    } else {
      rung = rungOfNum(sk[c] || 0);
      focus = (p.ssp && p.ssp[c]) || [];
    }
    // a legacy key older code wrote (p.skills.axe = 60) is read through its family, the higher of the two
    if (c !== k && sk[k]) { const r2 = rungOfNum(sk[k]); if (r2 && (!rung || Eng.value(r2.rank, r2.lv) > Eng.value(rung.rank, rung.lv))) rung = r2; }
    if (!rung) return 0;
    // a focus (S1's specialism): two steps up inside it, one down in a sibling
    const steps = L && focus && focus.length ? (focus.indexOf(L[1]) >= 0 ? 2 : -1) : 0;
    let v = Eng.shifted(rung.rank, rung.lv, steps);
    if (rust > 0) v = Math.max(0, v - rust);
    return v;
  };
  // the number A.skill gives, through the rungs: the body's hold (C9), wounds, the clamp (03-engine-base's order), and a
  // fresh wound's part (49-body-mind)
  SK2.read = function (p, k) {
    let v = SK2.reads(p, k);
    if (A.skillCap && v > 29) v = Math.min(v, A.skillCap(p, k));
    for (const w of p.wounds || []) { const W = GD.WOUNDS[w.k]; if (W && W.skillPen && W.skillPen[k]) v += W.skillPen[k]; }
    v = A.clamp(Math.round(v), 0, 100);
    // 49-body-mind's wrapper: a fresh wound hampers what its part does (found by sk2Shadow and sk2Migrate)
    const pen = p.wounds && p.wounds.length && A.BM && A.BM.partPen ? A.BM.partPen(p, k) : 0;
    return pen ? A.clamp(v + pen, 0, 100) : v;
  };

  // ---- the store: the player's rungs, kept beside S1's table while SK2.on is false ------------------------------------------
  // writes pc.ks (and pc.kc, the concepts grasped and the insight toward them, per family) from S1's table
  SK2.build = function (pc) {
    if (!pc || !(pc.sk && typeof pc.sk === 'object')) return 0;
    const ks = {}, kc = {};
    for (const c of SK.IDS) {
      const s = pc.sk[c]; if (!s) continue;
      Object.assign(ks, SK2.fromS1(c, s));
      const got = s.got && Object.keys(s.got).length ? s.got : null, ins = s.ins && Object.keys(s.ins).length ? s.ins : null;
      if (got || ins) { kc[c] = {}; if (got) kc[c].got = Object.assign({}, got); if (ins) kc[c].ins = Object.assign({}, ins); }
    }
    pc.ks = ks; pc.kc = kc;
    return Object.keys(ks).length;
  };
  // once a month (after S1's month, 36-skills' hook): the families whose rungs fell behind are written again
  SK2.sync = function (pc) {
    if (!pc || !(pc.sk && typeof pc.sk === 'object')) return 0;
    if (!pc.ks || typeof pc.ks !== 'object') return SK2.build(pc);
    let n = 0;
    for (const c of SK.IDS) {
      if (SK2.fresh(pc, c)) continue;
      const Eng = SK2.E();
      for (const rank of Eng.HUMAN) { const id = Eng.rungOf(IX, c, rank); if (id) delete pc.ks[id]; }
      Object.assign(pc.ks, SK2.fromS1(c, pc.sk[c])); n++;
    }
    const kc = pc.kc = pc.kc && typeof pc.kc === 'object' ? pc.kc : {};
    for (const c of SK.IDS) {
      const s = pc.sk[c]; if (!s) { delete kc[c]; continue; }
      const got = s.got && Object.keys(s.got).length ? s.got : null, ins = s.ins && Object.keys(s.ins).length ? s.ins : null;
      if (got || ins) { kc[c] = {}; if (got) kc[c].got = Object.assign({}, got); if (ins) kc[c].ins = Object.assign({}, ins); } else delete kc[c];
    }
    return n;
  };
  // the families whose stored rungs disagree with S1's table (the coherency of the shadow)
  SK2.stale = pc => (pc && pc.sk ? SK.IDS.filter(c => !SK2.fresh(pc, c)) : []);
  A.onMonth.push(pc => { try { if (pc && pc.alive !== false) SK2.sync(pc); } catch (e) { console.error('skills2: month', e); } });
})();
