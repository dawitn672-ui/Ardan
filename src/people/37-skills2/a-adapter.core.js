// Skills rebuild, step 3 (docs/design/skills-v2.md §5, §10): the adapter; step 5, the switch (A.SK2.on = true, D-179).
//
// Since the switch the rungs hold the level: what a check reads (A.skill -> A.SK.reads -> SK2.reads), the mirror
// p.skills[k], and how a level is printed (SK2.label, "Basic Swordsmanship · C · Lv 3": never a word). S1's table
// (pc.sk) stays the experience engine's working form under them: A.gainXp queues the month's efforts, the month's pass
// runs S1's arithmetic (factors, insight, breakthroughs, the gates of concepts and deeds) and the experience lands in the
// rungs (SK2.sync at the end of the pass): in C, B and A a step is two levels, so past half its bar the even level holds.
//
// - A.SK2.DATA is data/skills/ as one object (vocab, families, every rung and skill, recipes); the engine is A.V2.skills2
//   (src/people/engine/skills2.js), indexed on first use.
// - What a person holds: the player's rungs live in pc.ks (one entry a rung: { lv, xp, held, rust, best, used, streak,
//   focus }, the defaults left out), written from S1's table by SK2.sync once a month and by the save step 'skills2'
//   (b-migrate). Of a family's ladder only the top rung is held: an evolved rung became the next and is gone (order 95,
//   D-192, replacing §15.2's "it stays beside it"), so a person at B holds measured_blade alone; what the rungs below
//   gave passes on through its line (c-effects, E.heldOfRung). Anyone else's rung is a function of his number (rank by band, level by value, §7), held nowhere.
// - SK2.reads(p, k) is what a check reads for key k through the rungs (§5.1): the family's best rung, a focus's shift,
//   rust; SK2.read(p, k) adds what A.skill adds after (the body's hold, wounds, the clamp). While SK2.on is false nothing
//   read them but the tests (sk2Shadow); since the switch every check reads them.
// - Nothing here draws from A.rand. SK2.reads is pure: a family whose stored rungs are behind S1's table (a card set a
//   level since the month's sync) is read from the table as the sync would write it, without storing.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;
  const SK2 = A.SK2 = A.SK2 || {};
  SK2.on = true;   // the switch (step 5): the rungs hold the level

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
  // the rung of family c from S1's entry s: the held rank at its level (§7). The ranks below are not written: an evolved
  // rung is gone into its evolution (order 95, D-192; SK2.migrateLine retires them from an older save)
  SK2.fromS1 = function (c, s, born) {
    const Eng = SK2.E(), ix = IX, out = {};
    if (!s || !(s.lv > 0)) return out;
    const r = SK2.on ? Eng.landed(s.lv, s.xp) : Eng.fromS1(s.lv, s.xp);
    for (const rank of Eng.HUMAN) {
      const id = Eng.rungOf(ix, c, rank); if (!id) continue;
      if (Eng.rankIx(rank) < Eng.rankIx(r.rank)) continue;
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
    if (!top) return false;
    const lvOk = SK2.on ? (r => !!r && r.rank === top.rank && r.lv === top.e.lv)(SK2.rungNow(s)) : SK2.E().s1OfRung(top.rank, top.e.lv) === s.lv;
    return lvOk && (top.e.rust || 0) === (s.rust > 0 ? s.rust : 0) && sameList(top.e.focus, s.sp);
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
    let rung = null, rust = 0, focus = null, mv = 0;
    if (p.sk && typeof p.sk === 'object' && p.sk[c]) {
      const t = tableTop(p, c);
      if (t) { rung = { rank: t.rank, lv: t.e.lv }; rust = t.e.rust || 0; focus = t.e.focus || []; }
      // a family absorbed by a merge reads through it, never below its floor (step 8, e-merge; the mirror holds the better)
      mv = SK2.mergedRead ? SK2.mergedRead(p, c) : 0;
      // a number older code wrote since the month's pass is read at once, as S1 reads it (adopted at the month)
      const m = sk[c];
      if (m != null && (!rung || m !== Math.max(Eng.value(rung.rank, rung.lv), mv))) { rung = rungOfNum(m); mv = 0; }
    } else {
      rung = rungOfNum(sk[c] || 0);
      focus = (p.ssp && p.ssp[c]) || [];
    }
    // a legacy key older code wrote (p.skills.axe = 60) is read through its family, the higher of the two
    if (c !== k && sk[k]) { const r2 = rungOfNum(sk[k]); if (r2 && (!rung || Eng.value(r2.rank, r2.lv) > Eng.value(rung.rank, rung.lv))) rung = r2; }
    if (!rung) return mv;
    // a focus (S1's specialism): two steps up inside it, one down in a sibling
    const steps = L && focus && focus.length ? (focus.indexOf(L[1]) >= 0 ? 2 : -1) : 0;
    let v = Eng.shifted(rung.rank, rung.lv, steps);
    if (rust > 0) v = Math.max(0, v - rust);
    return mv > v ? mv : v;
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

  // ---- the switch (step 5) ---------------------------------------------------------------------------------------------
  // the rung an S1 entry stands on now (its step and the experience on the step's bar; pure)
  SK2.rungNow = s => (s && s.lv > 0 ? SK2.E().landed(s.lv, s.xp) : null);
  // the mirror's number for an S1 entry: the value of the rung that holds it
  SK2.valueOfEntry = s => { const r = SK2.rungNow(s); return r ? SK2.E().value(r.rank, r.lv) : 0; };
  // the experience an S1 step holds before its even level (a level set outright reads the odd rung)
  SK2.oddBar = s1lv => { const r = SK2.E().fromS1(s1lv, 1e9); return r ? r.xp : 0; };
  // a number on the rungs' ladder (the 50 levels of D to S)
  SK2.isRungValue = v => { const r = SK2.E().rungOfValue(+v || 0); return !!r && Math.abs(SK2.E().value(r.rank, r.lv) - v) <= 1e-9; };
  // one family's rungs written again from the table (after SK.set): the rungs hold the level at once
  SK2.syncFam = function (pc, c) {
    if (!pc || !(pc.sk && typeof pc.sk === 'object') || !pc.ks || SK2.fresh(pc, c)) return;
    const Eng = SK2.E();
    for (const rank of Eng.HUMAN) { const id = Eng.rungOf(IX, c, rank); if (id) delete pc.ks[id]; }
    Object.assign(pc.ks, SK2.fromS1(c, pc.sk[c]));
  };
  // the save's day of the switch (SK2.migrate): experience past an odd level's bar is held back (s.hold), so every check
  // reads on load what it read before; the month's pass lands it (SK2.land), and the even level holds from then
  SK2.holdBack = function (pc) {
    let n = 0;
    if (!pc || !(pc.sk && typeof pc.sk === 'object')) return 0;
    for (const c of SK.IDS) {
      const s = pc.sk[c]; if (!s || !(s.lv > 0)) continue;
      const r = SK2.E().fromS1(s.lv, s.xp);
      if (r && r.held > 0 && (r.rank === 'C' || r.rank === 'B' || r.rank === 'A')) { s.hold = (s.hold || 0) + (s.xp - r.xp); s.xp = r.xp; n++; }
      // the mirror reads the odd rung again (an old save's numbers became this table's steps under the rungs, 36's build)
      if (r && s.hold > 0 && pc.skills && pc.skills[c] === SK2.E().value(r.rank, r.lv + 1)) SK.mirror(pc, c);
    }
    return n;
  };
  SK2.land = function (pc) {
    if (!pc || !(pc.sk && typeof pc.sk === 'object')) return 0;
    let n = 0;
    for (const c in pc.sk) { const s = pc.sk[c]; if (s && s.hold > 0) { s.xp += s.hold; n++; } if (s && s.hold != null) delete s.hold; }
    return n;
  };
  // ---- the level, printed (§6.1: levels only; SK2.label is the only way a skill's level reaches the page) -------------
  // the rung a person holds in key k's family (no focus, no rust): the player's from his rungs, anyone's from his number
  SK2.rungFor = function (p, k) {
    const c = famOf(k); if (!c || !p) return null;
    if (p.sk && typeof p.sk === 'object' && p.sk[c]) { const t = tableTop(p, c); return t ? { rank: t.rank, lv: t.e.lv, c } : null; }
    const sk = p.skills || {};
    let r = rungOfNum(sk[c] || 0);
    if (c !== k && sk[k]) { const r2 = rungOfNum(sk[k]); if (r2 && (!r || SK2.E().value(r2.rank, r2.lv) > SK2.E().value(r.rank, r.lv))) r = r2; }
    return r ? { rank: r.rank, lv: r.lv, c } : null;
  };
  // a rung's own name ("Measured Blade"): family c's skill of that rank
  SK2.rungName = function (c, rank) { const id = SK2.E().rungOf(IX, famOf(c) || c, rank), s = id && IX.BY[id]; return s ? s.name : SK.name(c); };
  // "C · Lv 3"; with { name: true } "Basic Swordsmanship · C · Lv 3"; rusty: "Rusty · C · Lv 3"; with { compact: true }
  // "C·Lv 3" (two words, for a row that already names the skill: the Profile's page, under its word budget)
  SK2.label = function (p, k, o) {
    o = o || {};
    const r = SK2.rungFor(p, k);
    // a family absorbed by a merge (step 8) is printed as the art it went into
    const mg = SK2.mergedOf ? SK2.mergedOf(p, famOf(k)) : null;
    if (mg && (!r || mg.v >= SK2.E().value(r.rank, r.lv))) { const lv = Math.min(SK2.E().MAX_LV, mg.e.lv); let t = o.compact ? `${mg.s.rank}·Lv ${lv}` : SK2.E().label(mg.s.rank, lv); if (o.name) t = mg.s.name + ' · ' + t; return t; }
    if (!r) return 'untried';
    let t = o.compact ? `${r.rank}·Lv ${r.lv}` : SK2.E().label(r.rank, r.lv);
    if (o.name) t = SK2.rungName(r.c, r.rank) + ' · ' + t;
    const s = p.sk && p.sk[r.c];
    if (!o.bare && s && s.rust > 0) t = 'Rusty · ' + t;
    return t;
  };
  // an S1 step (and the experience on its bar), a number a check reads, a rung: printed as a level
  SK2.labelS1 = (lv, xp) => SK2.E().s1Label(lv, xp || 0);
  SK2.labelValue = v => { const r = SK2.E().rungOfValue(+v || 0); return r ? SK2.E().label(r.rank, r.lv) : 'untried'; };
  SK2.labelRung = (rank, lv) => SK2.E().label(rank, lv);
  // the lowest level whose read is at or above v (what a card asks: "at C · Lv 7")
  SK2.labelAtLeast = function (v) {
    const Eng = SK2.E();
    for (const r of Eng.HUMAN) for (let lv = 1; lv <= Eng.MAX_LV; lv++) if (Eng.value(r, lv) >= v - 1e-9) return Eng.label(r, lv);
    return Eng.label('S', Eng.MAX_LV);
  };
  // the level after a person's own in a family ("C · Lv 4"; at the top of a rank, the next rank's first)
  SK2.nextLabel = function (p, k) {
    const mg = SK2.mergedOf ? SK2.mergedOf(p, famOf(k)) : null;
    if (mg) return mg.e.lv < SK2.E().MAX_LV ? SK2.E().label(mg.s.rank, mg.e.lv + 1) : '';
    const r = SK2.rungFor(p, k); if (!r) return SK2.E().label('D', 1);
    if (r.lv < SK2.E().MAX_LV) return SK2.E().label(r.rank, r.lv + 1);
    const nr = SK2.E().nextRank(r.rank);
    return nr && SK2.E().HUMAN.includes(nr) ? 'rank ' + nr : '';
  };
  // S1's gate w printed as the rung it opens ("rank B", "D · Lv 6")
  SK2.gateLabel = w => SK2.E().gateLabel(w);
  A.onMonth.push(pc => { try { if (pc && pc.alive !== false) SK2.sync(pc); } catch (e) { console.error('skills2: month', e); } });
})();
