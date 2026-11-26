// S1b: the player's month and year for skills (docs/design/skills.md §2, §3, §7, §12.1). The efforts queued during the
// month (A.gainXp) go through the engine once, at the month's turn: the life's factors, insight and breakthroughs (one
// draw of A.rand for each open concept of each skill worked, and one for each moment, in a fixed order), levels and
// the store. What changed is written to the season's ledger and the record, and the notable lines to the log.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;
  const VALUES = SK.VALUES;

  // the month's context: the four needs (35-moods), weariness, despair, overtraining, a quiet season, a rival
  SK.monthCtx = function (pc) {
    const ctx = {};
    const N = pc.needs; if (N && typeof N === 'object') ctx.needs = { rest: N.rest, company: N.company, purpose: N.purpose, comfort: N.comfort };
    if (pc.flags && pc.flags.weary) ctx.weary = true;
    if (pc.happy != null && pc.happy < 15) ctx.despair = true;
    if (SK.INSIGHT_LIFE && SK.INSIGHT_LIFE !== 1) ctx.insightMul = SK.INSIGHT_LIFE;
    return ctx;
  };
  const pos = (Eng, s) => Eng.totalTo(s.lv) + s.xp + s.st;
  SK.audit = null;   // tests: { k: { led, lost, moved } } summed over passes

  // fold what the engine wrote into the season's ledger, the record and the log
  SK.drain = function (pc, v, before) {
    const Eng = SK.E();
    const lostBy = {};
    for (const e of v.ledger) {
      if (e.lost) { SK.ledger(pc, e.k, 0, e.why, e.tags, { lost: e.lost }); lostBy[e.k] = (lostBy[e.k] || 0) + e.lost; continue; }
      if (e.back) { SK.ledger(pc, e.k, 0, e.why, e.tags, { back: e.back }); continue; }
      SK.ledger(pc, e.k, e.xp, e.why, e.tags);
    }
    for (const k in pc.sk) {
      const s = pc.sk[k], b = before[k];
      if (b && s.st > b.st) SK.ledger(pc, k, 0, 'stored', null, { held: s.st - b.st });
      if (SK.audit) {
        const A2 = SK.audit[k] || (SK.audit[k] = { led: 0, lost: 0, moved: 0 });
        A2.moved += pos(Eng, s) - (b ? b.pos : 0);
      }
      // knacks: the release's perks, at the crossings into Advanced, Expert and Master
      const lv0 = b ? b.lv : 0;
      const knacks = A.perkRows ? A.perkRows(k) : GD.PERKS && GD.PERKS[k];   // the rungs' perk effects since step 6 (D-180)
      if (s.lv > lv0 && knacks) for (const [at, name, desc] of knacks) if (VALUES[lv0] < at && VALUES[s.lv] >= at) {
        SK.record(pc, k, 'knack', `${SK.name(k)}: a knack, "${name}"`);
        A.log(`${SK.name(k)}: you have a knack now, "${name}": ${desc}.`, 'good');
      }
      SK.mirror(pc, k);
    }
    if (SK.audit) for (const e of v.ledger) { const A2 = SK.audit[e.k] || (SK.audit[e.k] = { led: 0, lost: 0, moved: 0 }); A2.led += e.xp || 0; A2.lost += e.lost || 0; }
    for (const r of v.rec) {
      // a rank's edge crossed is an evolution (37-skills2's d-evolve, D-182): its own record, log, digest line and gift
      if (r.kind === 'word' && A.SK2 && A.SK2.evolved && A.SK2.evolved(pc, r)) continue;
      SK.record(pc, r.k, r.kind, r.text);
      const big = r.kind === 'breakthrough' || (r.kind === 'word' && SK.wordOf(pc.sk[r.k].lv) >= 3);
      const cls = r.kind === 'word' || r.kind === 'breakthrough' ? 'big' : r.kind === 'grasp' ? 'good' : r.kind === 'stall' || r.kind === 'rust' ? 'warn' : r.kind === 'slip' ? 'muted' : null;
      if (cls) A.log(SK.untoken(r.text).replace(/^./, c => c.toUpperCase()) + '.', cls);
      if (big && SK.notable) SK.notable(pc, r);
    }
  };
  SK.snapshot = function (pc) {
    const Eng = SK.E(), b = {};
    for (const k in pc.sk) { const s = pc.sk[k]; b[k] = { lv: s.lv, st: s.st, pos: pos(Eng, s) }; }
    return b;
  };

  SK.month = function (pc) {
    if (!pc || !pc.alive || !A.S) return;
    SK.ensure(pc);
    // the switch: experience held back on a save's day of the switch lands now (37-skills2, D-179)
    if (A.SK2 && A.SK2.on && A.SK2.land) A.SK2.land(pc);
    if (SK.sweepNew) SK.sweepNew();
    if (SK.queueMonth) SK.queueMonth(pc);
    const acts = Array.isArray(pc.skm) ? pc.skm : []; pc.skm = [];
    const v = SK.view(pc), before = SK.snapshot(pc);
    // C9: a level past what the body carries does not rise (the stall is the ledger's reason)
    for (const a of acts) { const s = pc.sk[a.skill]; if (SK.bodyStall(pc, a.skill, s ? s.lv : 0)) { a.mul = 0; a.mulTag = 'your arm cannot carry what your hand knows'; } }
    SK.E().month(v, SK.ageF(pc), acts, SK.monthCtx(pc, acts));
    SK.drain(pc, v, before);
    SK.trainStats(pc, v);
    // the experience lands in the rungs: they hold the level from this moment
    if (A.SK2 && A.SK2.on && A.SK2.sync) A.SK2.sync(pc);
  };
  // training a skill trains its governing stats a little (999997-bodies' rule): by the points the experience is worth
  SK.trainStats = function (pc, v) {
    if (!A.train) return;
    const R = A.V2.growth.R;
    for (const e of v.ledger) {
      if (!(e.xp > 0) || (e.tags && (e.tags.includes('kin') || e.tags.includes('breakthrough')))) continue;
      const ss = GD.SKILL_STAT[e.k] || [], s = pc.sk[e.k], pts = e.xp / 10 * R(s ? VALUES[s.lv] : 0);
      if (ss[0]) A.train(pc, ss[0], pts * 0.05);
      if (ss[1] && ss[1] !== ss[0]) A.train(pc, ss[1], pts * 0.03);
    }
  };
  // once a year: disuse (the standard's §3.10)
  SK.year = function (pc) {
    if (!pc || !pc.alive || !A.S) return;
    SK.ensure(pc);
    const v = SK.view(pc), before = SK.snapshot(pc);
    SK.E().year(v, SK.ageF(pc));
    SK.drain(pc, v, before);
    if (A.SK2 && A.SK2.on && A.SK2.sync) A.SK2.sync(pc);
    SK.offerDeed(pc);
  };
  // a person who has stood ready for a word a year (the concepts grasped, the proof wanting) is known to be ready, and the
  // world offers the test: the card "A chance to be judged" comes, not left to the draw of thousands of cards (CI 137:
  // ready at Advanced V for eight years and offered it once). At most once a year; the card has its own price.
  SK.offerDeed = function (pc) {
    if (!A.EV || !A.EV.sk_deed_offered || !A.isAdult || !A.isAdult(pc) || pc.prison) return;
    const k = SK.edgeSkill && SK.edgeSkill(pc, 'ready'); if (!k) return;
    const s = pc.sk[k]; if (s.stallAt == null || SK.ageF(pc) - s.stallAt < 1) return;
    if ((pc.flags.sk_deed_y || 0) >= A.S.year) return;
    if (A.S.queue.some(q => q && q.ev === 'sk_deed_offered')) return;
    pc.flags.sk_deed_y = A.S.year;
    A.queue({ type: 'event', ev: 'sk_deed_offered' });
  };
  // the season's line (31-learn-by-doing's, rewritten in words): what rose and chiefly why; one stall named; no numbers
  SK.holdReason = function (pc, k, e) {
    const s = pc.sk[k]; if (!s) return null;
    if (s.st > 0 || (e.held || 0) > 0) {
      const miss = SK.E().openConcepts(SK.view(pc), k);
      return miss.length ? `you have not grasped ${miss[0].name}` : 'ready to rise, and the deed not yet done';
    }
    const t = e.tags || [];
    if (t.includes('your arm cannot carry what your hand knows')) return 'your arm cannot carry what your hand knows';
    if (t.includes('asks nothing new')) return 'the work asks nothing new of you';
    if (t.includes('past your talent\'s reach')) return 'past where your talent carries you';
    return null;
  };
  SK.seasonLine = function (pc, L) {
    if (!isPCLive(pc) || !L || !L.k) return;
    const rose = [];
    let held = null;
    for (const k in L.k) {
      const e = L.k[k], s = pc.sk[k]; if (!s || !SK.BY[k]) continue;
      // levels risen this season, counted on the rungs (an S1 step in C, B and A is two levels)
      const o0 = e.o0 != null ? e.o0 : SK.ordOfStep(e.lv0 || 0), o1 = SK.ordOf(pc, k), d = o1 - o0;
      const causes = Object.keys(e.by).filter(w => e.by[w] > 0 && w !== 'other' && w !== 'set' && w !== 'stored').sort((a, b) => e.by[b] - e.by[a]).slice(0, 2);
      if (d > 0) rose.push({ k, d, causes, x: e.x, word: Math.floor((o1 - 1) / 10) > Math.floor((Math.max(1, o0) - 1) / 10) || !o0 ? SK.rankOfOrd(o1) : null });
      // a stall is named once a year (the first season), not every season
      else if (!held && e.x > 0 && L.s % 4 === 0) { const why = SK.holdReason(pc, k, e); if (why) held = { k, why }; }
    }
    if (!rose.length && !held) return;
    rose.sort((a, b) => b.d - a.d || b.x - a.x);
    const cause = w => (/^carried over from /.test(w) ? 'what ' + w.slice(18) + ' carried over' : w);
    const bits = rose.slice(0, 2).map(r => `${SK.name(r.k)} ${r.word ? 'reached rank ' + r.word : r.d === 1 ? 'rose a level' : 'rose ' + (['', '', 'two', 'three', 'four', 'five'][r.d] || 'many') + ' levels'}${r.causes.length ? ', chiefly from ' + r.causes.map(cause).join(' and ') : ''}`);
    let line = bits.length ? `This season ${bits.join('; ')}.` : '';
    if (held) line += `${line ? ' ' : 'This season '}${SK.name(held.k)} held: ${held.why}.`;
    A.log(line, 'muted');
  };
  const isPCLive = p => !!(p && p.alive && A.S && p.id === A.S.pc);
  A.onMonth.push(pc => { try { SK.month(pc); } catch (e) { console.error('skills: month', e); } });
})();
