// S1b: an old save, a new life, an heir: the player's table is built from the numbers, and everyone's numbers become
// levels (docs/design/skills.md §9). One step, 'skills', in A.V2SAVE.upgrade (A.SAVE_VER 15), and the newGame stage
// 'skills'. Draws no dice and is the same on every load.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;
  const MAX_LV = SK.MAX_LV, VALUES = SK.VALUES;

  // the ten legacy keys fold into their skill (the higher number); a legacy number of 35 or more within 5 of the
  // skill's becomes that specialism (at most two, the highest first); a talent goes to the skill if higher
  SK.fold = function (p) {
    if (!p) return [];
    const skills = p.skills || (p.skills = {}), specs = {};
    for (const lk in SK.LEG) {
      if (skills[lk] == null) continue;
      const [c, sp] = SK.LEG[lk], v = +skills[lk] || 0, top = Math.max(v, +skills[c] || 0);
      if (v > (+skills[c] || 0)) skills[c] = v;
      if (v >= 35 && v >= top - 5) (specs[c] = specs[c] || []).push([sp, v]);
      delete skills[lk];
    }
    if (p.apt && typeof p.apt === 'object') {
      const tal = {};
      for (const k in p.apt) {
        const c = SK.canon(k)[0]; if (!c) continue;
        const L = SK.letterOfApt(+p.apt[k] || 1), O = SK.TALENT_ORDER;
        if (SK.LEG[k]) { if (!tal[c] || O.indexOf(L) > O.indexOf(tal[c])) tal[c] = L; }
        else tal[c] = tal[c] && O.indexOf(tal[c]) > O.indexOf(L) ? tal[c] : L;
      }
      for (const c in tal) if (tal[c] !== 'C') (p.tal = p.tal || {})[c] = tal[c];
      delete p.apt;
    }
    const out = [];
    for (const c in specs) out.push([c, specs[c].sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0])]);
    return out;
  };
  // anyone without a table: the numbers become the levels under them; a specialism is kept in p.ssp
  SK.quantize = function (p) {
    const sk = p.skills; if (!sk) return;
    for (const k in sk) {
      if (!SK.BY[k]) continue;
      const lv = SK.lvOfValue(+sk[k] || 0);
      if (lv > 0) sk[k] = VALUES[lv]; else delete sk[k];
    }
  };
  SK.foldNpc = function (p) {
    const specs = SK.fold(p);
    for (const [c, sp] of specs) (p.ssp = p.ssp || {})[c] = sp;
    SK.quantize(p);
  };

  // the player's table from his numbers: the level under each, the rest of the way on the bar; every concept of every
  // word held grasped; for the next word, insight need x (step - 1) / 5 x 0.6, so someone deep in a word is part of the
  // way and nobody is handed one; a blind spot stays blind
  SK.build = function (pc, why) {
    const specs = SK.fold(pc), Eng = SK.E(), age = SK.ageF(pc);
    pc.sk = {};
    const v = SK.view(pc);
    const habit = pc.habit && typeof pc.habit === 'object' ? pc.habit : {}, used = pc.used && typeof pc.used === 'object' ? pc.used : {};
    for (const k of SK.IDS) {
      const raw = +(pc.skills || {})[k] || 0; if (raw < 1) continue;
      const lv = SK.lvOfValue(raw), s = SK.blank();
      s.lv = lv; s.best = lv;
      s.xp = lv < MAX_LV ? Math.min(Eng.cost(lv) - 1e-6, Math.max(0, (raw - VALUES[lv]) / (VALUES[lv + 1] - VALUES[lv]) * Eng.cost(lv))) : 0;
      s.xp = Math.round(s.xp * 100) / 100;
      s.used = used[k] != null ? Math.max(0, +used[k] - pc.born) : Math.floor(age);
      s.streak = Math.min(60, 12 * (+habit[k] || 0));
      pc.sk[k] = s;
      SK.graspHeld(pc, k, s);
      const w = SK.wordOf(lv) + 1, step = SK.stepOf(lv);
      if (w >= 1 && w < SK.WORDS.length && step > 1) for (const c of Eng.conceptsOf(k, w)) {
        const nd = Eng.need(v, k, c); if (nd === Infinity) continue;
        const ins = Math.floor(nd * (step - 1) / 5 * 0.6); if (ins > 0) s.ins[c.id] = Math.min(ins, nd - 1);
      }
    }
    for (const [c, sp] of specs) if (pc.sk[c]) pc.sk[c].sp = sp;
    SK.quantize(pc);
    for (const k in pc.sk) SK.ledger(pc, k, 0, why === 'born' ? 'what you learned as a child' : 'the old reckoning', [why || 'migrate']);
    delete pc.grow;
    return pc.sk;
  };

  // one save: everyone's numbers become levels; the player gets his table
  SK.migrate = function (S, why) {
    S = S || A.S; if (!S || !S.people) return 0;
    let n = 0;
    const pc = S.people[S.pc];
    for (const id in S.people) {
      const p = S.people[id]; if (!p || p === pc) continue;
      if (!p.skills && !p.apt) continue;
      SK.foldNpc(p); n++;
    }
    if (pc && !(pc.sk && typeof pc.sk === 'object')) { SK.build(pc, why || 'migrate'); n++; }
    S.skv = 1;
    if (S === A.S) SK.swept = Object.keys(S.people).length;
    return n;
  };
  // a new life, an heir taken up, an old save loaded mid-life by another path: the table appears on first need
  SK.ensure = function (pc) {
    if (!pc) return;
    if (!(pc.sk && typeof pc.sk === 'object')) SK.build(pc, A.S && A.S.year - pc.born < 2 ? 'born' : 'inherit');
    SK.adopt(pc);
  };
  // numbers older code wrote into the mirror since the last pass (a new office, a card's gift) become levels, with
  // the cause "set"; an aptitude a card granted becomes a talent letter
  SK.adopt = function (pc) {
    const sk = pc.skills || (pc.skills = {});
    for (const lk in SK.LEG) if (sk[lk] != null) {
      const c = SK.LEG[lk][0];
      if (+sk[lk] > (+sk[c] || 0)) sk[c] = +sk[lk];
      delete sk[lk];
    }
    for (const k in sk) {
      if (!SK.BY[k]) continue;
      const s = pc.sk[k], raw = +sk[k] || 0;
      if (s && raw === VALUES[s.lv]) continue;
      const lv = SK.lvOfValue(raw);
      if (!s && lv <= 0) { delete sk[k]; continue; }
      if (s && lv === s.lv) { sk[k] = VALUES[lv]; continue; }
      const t = s || (pc.sk[k] = SK.blank());
      const from = t.lv;
      t.lv = lv; t.best = Math.max(t.best || 0, lv); t.xp = Math.min(t.xp, Math.max(0, SK.E().cost(lv) - 1e-6)); t.st = 0;
      if (t.used == null) t.used = Math.floor(SK.ageF(pc));
      SK.graspHeld(pc, k, t);
      if (lv > 0) sk[k] = VALUES[lv]; else delete sk[k];
      SK.ledger(pc, k, 0, 'set', ['set']);
      if (lv > from && from > 0) SK.record(pc, k, 'set', `${SK.name(k)}: ${SK.levelName(lv)} (${SK.whyNow().why})`);
    }
    for (const k in pc.sk) if (!sk[k] && pc.sk[k].lv > 0) sk[k] = VALUES[pc.sk[k].lv];
    if (pc.apt && typeof pc.apt === 'object') {
      for (const k in pc.apt) SK.raiseTalent(pc, k, SK.letterOfApt(+pc.apt[k] || 1));
      delete pc.apt;
    }
  };

  // once a year, everyone else: numbers older code wrote this year (a new captain rolled at 47) become the level under
  // them, a legacy key its skill; then the year's growth by the closed form (SK.npcGrowYear, the people of §10)
  SK.npcYear = function () {
    const S = A.S; if (!S || !S.people) return;
    for (const id in S.people) {
      const p = S.people[id]; if (!p || !p.alive || id == S.pc || !p.skills) continue;
      for (const lk in SK.LEG) if (p.skills[lk] != null) { SK.foldNpc(p); break; }
      SK.quantize(p);
      if (p.apt) SK.fold(p);
    }
    if (SK.npcGrowYear) SK.npcGrowYear(S);
  };
  A.onYear.push(() => { try { SK.npcYear(); } catch (e) { console.error('skills: npc year', e); } });
  // once a month, the people made since the last sweep (an acquaintance, a foe, a new captain): older code rolls their
  // numbers; they become levels here. People are added at the end of S.people, so this reads only the new keys.
  // Which people are new is read from their ids (A.uid: "p" and S.nextId in base 36), not from their place in S.people:
  // a person deleted from the record (A.gcPeople) moved every later one a place down, and those made since the last
  // sweep fell under the old count and were never swept (CI long 7, s1Mirror: p11i kept "command 81"; D-107's deaths
  // made such deletions common). An id of another shape is always swept (quantize is idempotent).
  SK.swept = 0; SK.sweptNid = -1;
  const uidNum = id => { const m = /^p([0-9a-z]+)$/.exec(id); return m ? parseInt(m[1], 36) : -1; };
  // was this person in the record at the last sweep (and so swept)?
  SK.sweptBefore = id => SK.sweptNid >= 0 && uidNum(id) >= 0 && uidNum(id) < SK.sweptNid;
  SK.sweepNew = function () {
    const S = A.S; if (!S || !S.people) return 0;
    const ids = Object.keys(S.people);
    // a loaded game or a new one is another state: its people are all unswept (the count of the last state, kept,
    // skipped the first people of a loaded save; found by s1Migrate on the alpha.11 sample save, CI 160)
    if (SK.sweptS !== S) { SK.sweptS = S; SK.sweptNid = -1; }
    let n = 0;
    for (const id of ids) {
      if (SK.sweptBefore(id)) continue;
      const p = S.people[id]; if (!p || id == S.pc || !p.skills) continue;
      for (const lk in SK.LEG) if (p.skills[lk] != null) { SK.foldNpc(p); break; }
      SK.quantize(p); if (p.apt) SK.fold(p); n++;
    }
    SK.swept = ids.length; SK.sweptNid = +S.nextId || 0;
    return n;
  };
  // everyone at once (a load, a test)
  SK.sweepAll = function () { SK.swept = 0; SK.sweptNid = -1; return SK.sweepNew(); };

  // the save step (99998-v2-saves calls A.SK.migrate for a state older than 15) and the new game
  A.addStage('A.newGame', 'skills', ng => function () {
    const r = ng.apply(this, arguments);
    try { if (A.S && A.S.people) SK.migrate(A.S, 'born'); } catch (e) { console.error('skills: new game', e); }
    return r;
  });
})();
