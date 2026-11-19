// D11+ "the military path" (docs/design/war.md §14.1, §14.2; the owner's order 54 on the military path: "pay more
// attention to the weapon under use, the method of combat they prefer, as well as their aptitude across any skill";
// orders 59 and 63: growth is not a timetable; D-128 to D-132).
//
// A man's road through the ranks follows his branch, his weapon and his way of fighting (data/military/paths.json). At
// each rung the road:
//   - trains what that rung asks (a share of a month's effort by skill, through S1's one door, A.gainXp, as practice):
//     a lancer rides and handles a sword, then commands; a sapper works timber and stone, then plans works; an archer
//     shoots; a scout tracks and keeps quiet. His aptitudes (S1's talents) bend the share: a gifted hand gets more of the
//     time, a slow one less, and he is told so in words;
//   - proves him by its own trial (the butts at two hundred paces, a bridge of boats, a sentry taken without a sound):
//     when he stands at the edge of a word in that skill, its concepts grasped and wanting a proof (S1's C.ready), the
//     trial's card comes (pa_trial), and standing it is the proof (S1's `proof` key);
//   - leads to its specialisms by his way of fighting (the war bow for a man of the shot, the bill and pike for a man of
//     the wall): when the skill has room for one, the card (pa_spec) offers his way's and the road's own;
//   - opens a role at the rungs that have one (a scout's road the pathfinder's, the train's the clerk's), offered by his
//     captain through A.WHY (kind 'role', 9999955-muster);
//   - and the board weighs what the next rung wants (A.LADDER.mod reads A.PATHS.wants), and the trials he has stood.
// The player's road; the month's effort is small beside his drill, his duty and his deeds (D-129).
(function () {
  const PA = A.PATHS = A.PATHS || {};
  const MU = A.MUSTER, SK = () => A.SK;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r2 = x => Math.round(x * 100) / 100;
  const day = () => (A.absDay ? A.absDay() : 0);
  PA.T = Object.assign({ eu: .5, trialGap: 300, specGap: 600 }, PA.T || {});
  const DP = () => (A.DATA && A.DATA['military/paths']) || { paths: [] };
  let IX = null;
  PA.byBranch = b => { const d = DP(); if (!IX || IX.d !== d) { IX = { d, m: new Map() }; for (const p of d.paths || []) IX.m.set(p.branch, p); } return IX.m.get(b) || null; };
  PA.of = pc => (pc && pc.mil ? PA.byBranch(MU.branchOf(pc)) : null);
  PA.tierIdx = pc => MU.rankIdx((pc.mil.rank | 0));
  PA.tier = pc => { const P = PA.of(pc); return P ? P.tiers[PA.tierIdx(pc)] || null : null; };
  PA.wants = (pc, idx) => { const P = PA.of(pc); const t = P && P.tiers[clamp(idx, 0, 4)]; return t ? t.wants || [] : []; };

  // ---------------------------------------------------------------- aptitudes in words
  const TF = { F: .6, E: .7, D: .85, C: 1, B: 1.2, A: 1.35, S: 1.5, SSS: 1.6 };
  PA.talentF = (pc, k) => TF[SK() ? SK().talentOf(pc, k) : 'C'] || 1;
  PA.talentWord = (pc, k) => { const S = SK(); if (!S) return ''; const t = S.talentOf(pc, k); return t === 'C' ? '' : S.TALENT_WORD[t] || ''; };
  PA.skillWords = (pc, k) => { const S = SK(), nm = S ? S.name(k) : k, t = PA.talentWord(pc, k); return t ? `${nm.toLowerCase()} (${t})` : nm.toLowerCase(); };

  // ---------------------------------------------------------------- the month's training on the road
  // the rung's shares, bent by his talents and renormalised to the month's effort: [{ k, eu, w }]
  PA.plan = function (pc) {
    const t = PA.tier(pc);
    if (!t) return [];
    const L = Object.keys(t.train).map(k => ({ k, w: t.train[k] * PA.talentF(pc, k) }));
    const sum = L.reduce((a, x) => a + x.w, 0) || 1;
    return L.map(x => ({ k: x.k, w: r2(x.w / sum), eu: r2(PA.T.eu * x.w / sum) })).sort((a, b) => b.w - a.w);
  };
  // the year in the ranks (the release's A.milYear) drills the rung's first skill
  PA.yearSkill = function (pc) { const p = PA.plan(pc); return p.length ? p[0].k : null; };
  // the specialism his way leads to on this road: [skill, id] or null
  PA.specFor = function (pc) {
    const P = PA.of(pc);
    if (!P || !P.specs) return null;
    let way = null;
    try { way = MU.read(pc).way[0]; } catch (e) {}
    const s = (way && P.specs[way]) || P.specs['*'];
    return s && s[1] ? s : null;
  };
  PA.month = function (pc) {
    const m = pc && pc.alive && pc.mil;
    if (!m || m.merc || pc.id !== A.S.pc || !A.gainXp) return;
    const P = PA.of(pc), t = PA.tier(pc);
    if (!P || !t) return;
    // the rung's training
    for (const x of PA.plan(pc)) if (x.eu > 0) A.gainXp(pc, x.k, x.eu, { q: 'practice', why: `${P.name}: ${SK() ? SK().name(x.k).toLowerCase() : x.k}` });
    const S = SK(), Q = A.S.queue || [], queued = ev => Q.some(q => q && q.ev === ev);
    if (!S) return;
    // the rung's trial, when he stands at the edge of a word in its skill and wants a proof
    const tk = t.trial && t.trial[0];
    if (tk && A.C && A.C.ready && A.C.ready(pc, tk) && !queued('pa_trial') && (m.paTr == null || day() - m.paTr >= PA.T.trialGap)) {
      m.paTr = day();
      A.queue({ type: 'event', ev: 'pa_trial', forced: true, ctx: { sk: tk, trialT: t.trial[1], pathT: P.name, skT: S.name(tk).toLowerCase(), tier: PA.tierIdx(pc) } });
    }
    // the road's specialism, when the skill has room for one and he has none of the road's
    const sp = PA.specFor(pc);
    if (sp && !queued('pa_spec') && (m.paSp == null || day() - m.paSp >= PA.T.specGap)) {
      const c = S.canon(sp[0])[0], lv = S.lvOf(pc, c), have = S.specsOf(pc, c) || [];
      const room = S.wordOf(lv) >= 4 ? 2 : S.wordOf(lv) >= 2 ? 1 : 0;
      if (room > have.length && !have.includes(sp[1])) {
        const star = P.specs['*'], alt = star && star[0] === sp[0] && star[1] && star[1] !== sp[1] && !have.includes(star[1]) ? star[1] : null;
        m.paSp = day();
        A.queue({ type: 'event', ev: 'pa_spec', forced: true, ctx: { sk: c, spA: sp[1], spB: alt || '', nB: alt ? 1 : 0, skT: S.name(c).toLowerCase(), spAT: S.specName(c, sp[1]), spBT: alt ? S.specName(c, alt) : '', pathT: P.name } });
      }
    }
    // the role this rung opens, offered once at the rung by his captain (9999955-muster, A.WHY kind 'role')
    if (t.opens && !m.role && m.paOpen !== PA.tierIdx(pc) && MU.roleAsk) { m.paOpen = PA.tierIdx(pc); MU.roleAsk(pc, { only: t.opens }); }
  };
  A.onMonth.push(pc => { try { PA.month(pc); } catch (e) { console.error('[paths] month', e); } });

  // the trials he has stood at this rung (the board reads them, A.LADDER.mod)
  PA.trialsAt = (pc, idx) => ((pc.mil && pc.mil.trials) || []).filter(x => x[2] === idx).length;
  (A.FX_EXTRA = A.FX_EXTRA || []).push('paTrial');
  A.addStage('A.applyFx', 'paths', baseFx => function (pc, fx, ctx) {
    const out = baseFx.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && fx.paTrial === 'stood' && pc && pc.mil && ctx && ctx.sk) {
        const L = pc.mil.trials = Array.isArray(pc.mil.trials) ? pc.mil.trials : [];
        L.push([ctx.sk, A.S.year, ctx.tier | 0]);
        if (L.length > 8) L.splice(0, L.length - 8);
        pc.mil.merit = (pc.mil.merit || 0) + 3;
      }
    } catch (e) { console.error('[paths] fx', e); }
    return out;
  });
})();
