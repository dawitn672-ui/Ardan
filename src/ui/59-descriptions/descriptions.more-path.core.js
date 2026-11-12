// Nested tooltips: the Path tab. The odds of being taken on in each career and what makes them, a career's ladder and
// its pay, the pay of your post (a product of rank, work, reputation and the rest), performance and where it
// settles, each row of a promotion board and the chance a year once it is met, the army's merit, and a school.
(function () {
  const G = UI.TIPS = UI.TIPS || {}, TT = UI.TT, K = TT.K;
  const { esc, r0, r1, r2, sg, pct, H, R, D, F, L, coin } = K;
  const pc = () => A.pc();

  // ---- being taken on: A.jobOptions' chance, step by step ---------------------------------------------------------------
  TT.jobOddsParts = function (p, k) {
    const C = GD.CAREERS[k], o = (A.jobOptions(p) || []).find(x => x.k === k); if (!C || !o) return null;
    const parts = []; let ch = 0.55;
    if (C.literate && !p.literate) { parts.push(['You cannot read: they take few who cannot', 5]); ch = 0.05; } else parts.push(['A post like this', 55]);
    if (C.stat) { const v = (A.stat(p, C.stat) - 40) / 150; parts.push([`${L('stat', C.stat, esc(GD.STAT_NAMES[C.stat]) + ' ' + A.stat(p, C.stat))} against 40 (÷ 1.5)`, v * 100]); ch += v; }
    if (C.skill) { const v = A.skill(p, C.skill) / 200; parts.push([`${L('skill', C.skill, esc(GD.SKILLS[C.skill]) + ' ' + A.skill(p, C.skill))} (÷ 2)`, v * 100]); ch += v; }
    if (k === 'courtier' && ['noble', 'royal'].includes(p.status)) { parts.push(['Born to the court', (0.95 - ch) * 100]); ch = 0.95; }
    if (k === 'clergy' && p.piety > 50) { parts.push([L('piety', '', 'Piety') + ' over 50', 20]); ch += 0.2; }
    if (p.flags && p.flags.unfree && !['farm', 'herd', 'labor', 'servant', 'miner', 'fish'].includes(k)) { parts.push(['Not free', -ch * 100]); ch = 0; }
    if (p.flags && p.flags.outlaw && !['thief', 'pirate', 'hunter', 'labor'].includes(k)) { parts.push(['An outlaw (a fifth of it)', -ch * 0.8 * 100]); ch *= 0.2; }
    if (ch > 0.04 && A.letterPower) { const v = A.letterPower(p, 'job') / 120; if (v) { parts.push(['Letters in your hand', v * 100]); ch += v; } }
    const cl = A.clamp(ch, 0, 0.97); if (cl !== ch) parts.push(['Never more than 97%', (cl - ch) * 100]);
    const shown = Math.round(o.chance * 100);
    if (Math.round(cl * 100) !== shown) parts.push(['Other things in play', shown - cl * 100]);
    return { parts, total: shown, o };
  };
  G.jobOdds = function (k) {
    const p = pc(), S = p && TT.jobOddsParts(p, k); if (!S) return '';
    return H('Taken on as ' + esc(S.o.title), S.total + '%', esc(S.o.name)) + K.pts(S.parts, S.total, 'The odds') +
      F(`One try a year for each path. See ${L('career', k, 'the ladder')}.`);
  };
  G.career = function (k) {
    const C = GD.CAREERS[k], p = pc(); if (!C) return '';
    const cur = p && p.job && p.job.c === k ? p.job.r : -1, o = p && (A.jobOptions(p) || []).find(x => x.k === k), start = o ? C.ranks.findIndex(r => r[0] === o.title) : -1;
    return H(esc(C.name), null, esc((GD.PATHS[A.pathOfCareer(k)] || {}).name || '')) + (C.desc ? D(esc(C.desc)) : '') +
      C.ranks.map((r, i) => R(i === cur ? `<span class="tt-on-row">${esc(r[0])} (you)</span>` : i === start ? `<span class="tt-on-row">${esc(r[0])} (you would start here)</span>` : esc(r[0]), coin(r[2]) + '/yr', 'tt-sub')).join('') +
      F(`The pay is the rank's; ${L('pay', '', 'your work and name')} move what you are paid.`);
  };
  // the pay of your post this year, as A.careerYear reckons it
  TT.payParts = function (p) {
    const j = p.job, C = j && GD.CAREERS[j.c]; if (!C) return null;
    const rank = C.ranks[j.r], rep = j.rep != null ? j.rep : 30;
    const f = [[`${L('perf', '', 'Performance')} ${r0(j.perf)}: 0.7 + it ÷ 160`, 0.7 + j.perf / 160], [`${L('rep', '', 'Reputation')} ${r0(rep)}: 0.85 + it ÷ 250`, 0.85 + rep / 250]];
    const perk = C.skill ? A.perkOf(p, C.skill, 'income') : 0; if (perk) f.push(['Perks', 1 + perk]);
    if (j.own) f.push([`Your own ${esc(A.ownWord ? A.ownWord(j.c) : 'shop')}: the profit comes on its own`, 0.35]);
    if (A.specPay) { const s = A.specPay(p); if (s !== 1) f.push(['Your path in the trade', s]); }
    if (p.flags && p.flags.unfree) f.push(['Not free', 0.05]);
    let v = TT.prodOf(rank[2], f);
    const add = j.office ? 300 : 0;
    return { start: rank[2], factors: f, add, total: v + add };
  };
  G.pay = function () {
    const p = pc(), S = p && p.job && TT.payParts(p); if (!S) return '';
    const C = GD.CAREERS[p.job.c];
    return H('Pay', coin(S.total) + '/yr', esc(C.ranks[p.job.r][0])) +
      K.mul(['The rank\'s pay', S.start, S.add ? 'Before the office' : 'This year, at this pace'], S.factors, S.total - S.add, v => coin(v)) +
      (S.add ? R('An office', '+' + coin(S.add), 'tt-sum') : '') + (p.job.lastPay ? R('Last year you were paid', coin(p.job.lastPay), 'tt-sub') : '') +
      F('Paid at the new year. In prison, nothing.');
  };
  G.perf = function () {
    const p = pc(), j = p && p.job, C = j && GD.CAREERS[j.c]; if (!C) return '';
    const P = A.plan ? A.plan(p) : {}, statV = C.stat ? A.stat(p, C.stat) : 40, skillV = C.skill ? A.skill(p, C.skill) : 30;
    const effort = P.aim === 'advance' ? 10 : P.intensity === 'brutal' ? -8 : P.intensity === 'hard' ? -3 : 0;
    const parts = [['A day\'s work', 25], [(C.stat ? L('stat', C.stat, esc(GD.STAT_NAMES[C.stat])) : 'Any stat') + ` ${statV} × 0.35`, statV * 0.35],
      [(C.skill ? L('skill', C.skill, esc(GD.SKILLS[C.skill])) : 'Any skill') + ` ${skillV} × 0.45`, skillV * 0.45], [L('happy', '', 'Happiness') + ` ${r0(p.happy)} against 50, × 0.2`, (p.happy - 50) * 0.2]];
    if (effort) parts.push([effort > 0 ? 'Pushing for advancement' : 'A plan that wears you out', effort]);
    const T = parts.reduce((a, x) => a + x[1], 0);
    return H('Performance', r0(j.perf), 'of 100') + D('How well you do the work. It moves toward where your stat, skill and mood put it: a little each month, more at the new year, with luck either way.') +
      `<div class="tip-row tt-sum"><span>Where it settles</span><b></b></div>` + TT.sumRows(parts, T, 'Settles at') +
      F(`Below 10 you may be let go. It pays: ${L('pay', '', 'pay')} × (0.7 + performance ÷ 160).`);
  };

  // ---- a promotion board's rows ------------------------------------------------------------------------------------------
  const HOW = {
    merit: 'Good work, missions and pushing for advancement in your plan add merit; a superior who likes you adds more each year.',
    skill: 'Practice: the work itself trains it, and so does your plan.', skill2: 'Practice: your plan, or a school.',
    rep: 'Good work and a name raise it; failures lower it.', time: 'Only time.', lit: 'A school, a tutor, or years of study.',
    free: 'Buy, earn or flee your freedom.', cls: 'Birth, a title, or great renown (55).', open: 'Someone above you must die, rise or fall.', patron: 'A patron who speaks for you helps.',
    cmd: 'Command grows with leading men, war games and study.', battles: 'Battles your division fights, or missions.', wins: 'Battles won at the head of your men; war games count half.',
    slot: 'There must be a command to give you.', birth: 'The crown rarely raises a commoner this high.',
  };
  const board = (kind, p) => kind === 'mil' ? A.promoBoard(p) : A.jobBoard(p);
  G.board = function (arg) {
    const p = pc(); const [kind, k] = String(arg).split('|'); if (!p) return '';
    const b = board(kind, p), x = b && b.find(r => r.k === k); if (!x) return '';
    let need = '';
    if (kind === 'job') {
      const j = p.job, nr = j.r + 1, C = GD.CAREERS[j.c];
      if (k === 'merit') need = `30 × rank ${nr} × (1 + 0.55 × ${nr})`;
      if (k === 'skill') need = `12 + 14 a rank, at most 85`;
      if (k === 'skill2') need = `12 a rank, at most 70`;
      if (k === 'rep') need = `20 + 11 a rank, at most 80`;
      if (k === 'time') need = `3½ months for each year the next rank wants (${C.ranks[nr] ? C.ranks[nr][1] - C.ranks[j.r][1] : '?'})`;
    } else if (k === 'time') need = `4 + 3 a rank`;
    return H(esc(x.label), esc(String(x.have)) + (x.need !== '' ? ' / ' + esc(String(x.need)) : ''), x.ok ? 'met' : x.soft ? 'helps' : 'not yet') +
      D(esc(HOW[k] || '')) + (need ? R('The bar', esc(need), 'tt-sub') : '') +
      (k === 'merit' && kind === 'mil' ? F(`See ${L('merit', '', 'merit')}. `) : '') + F(`Once the hard rows are met: ${L('promoOdds', kind, 'the odds a year')}.`);
  };
  // the army's yearly promotion chance (promoCheckNow), step by step
  TT.milPromoParts = function (p) {
    const m = p.mil, next = m && GD.MIL[m.rank + 1]; if (!next) return null;
    const b = A.promoBoard(p) || [];
    if (b.find(x => x.k === 'merit' && !x.ok)) return { none: 'Not before the merit is there.', parts: [], total: 0 };
    const f = [];
    for (const x of b) if (!x.ok) f.push([`${esc(x.label)}: not met`, x.soft ? (x.k === 'slot' ? 0.3 : 0.5) : 0.18]);
    const fr = A.famMilBonus ? A.famMilBonus(p) : 0; if (fr && !m.merc) f.push(['A soldier family', m.rank + 1 <= fr ? 1.45 : 1.1]);
    if (m.rank + 1 >= 7) f.push(['A general\'s rank: renown and birth', 0.45 + p.fame / 100 + (p.noble ? p.noble.rung * 0.05 : 0) + (p.status === 'royal' ? 0.4 : 0)]);
    if (m.rank + 1 >= 9 && !m.merc) { const r = A.realm(m.realm), ru = r ? A.P(r.ruler) : null; if (ru && ru.id !== p.id) f.push(['What the ruler thinks of you', 0.3 + Math.max(0, A.opinion(ru, p)) / 100]); }
    if (p.race !== (A.realm(m.realm) || {}).race && !m.merc && m.rank + 1 >= 5) f.push(['Not of the realm\'s people', 0.6]);
    f.push([`Merit over the bar (${r0(m.merit)} of ${next.merit})`, 1 + Math.min(0.6, (m.merit - next.merit) / Math.max(30, next.merit))]);
    const v = TT.prodOf(0.5, f), add = (A.bossMod ? A.bossMod(p) : 0) + (p.flags.bossPush === A.S.year ? 0.2 : 0);
    return { start: 0.5, factors: f, add, total: A.clamp(v + add, 0.02, 0.92) };
  };
  G.promoOdds = function (kind) {
    const p = pc(); if (!p) return '';
    if (kind === 'mil') {
      const S = TT.milPromoParts(p); if (!S) return H('Promotion') + D('You stand at the top of the ladder.');
      if (S.none) return H('Promotion', '0%') + D(S.none);
      return H('Promotion this year', pct(S.total), esc(GD.MIL[p.mil.rank + 1].title)) +
        K.mul(['Half the time, when all is met', 50, S.add ? 'Before your superior' : 'All told'], S.factors.map(([l, f]) => [l, f]), Math.round(TT.prodOf(0.5, S.factors) * 100), v => r0(v) + '%', v => r1(v)) +
        (S.add ? R('Your superior\'s word', sg(r0(S.add * 100)) + '%', 'tt-sub') : '') + R('Held between 2% and 92%', pct(S.total), 'tt-sum') + F('Rolled once a year.');
    }
    return H('Promotion') + D('When the hard rows are met, each month brings a chance: better with good work, a patron, and a post falling vacant.');
  };
  G.merit = function () {
    const p = pc(), m = p && p.mil; if (!m) return '';
    const next = GD.MIL[m.rank + 1];
    return H('Merit', r0(m.merit), next ? `${next.merit} for ${esc(next.title)}` : '') +
      D('Battles your division wins, ground it takes, missions, war games, and a superior who speaks for you. Pressing hard in battle earns more; sparing the men, less.') +
      (next ? R('To go', Math.max(0, next.merit - r0(m.merit)), 'tt-sub') : '') + F(`More than the bar raises ${L('promoOdds', 'mil', 'the odds')}: up to ×1.6.`);
  };
  G.milRank = function () {
    const p = pc(), m = p && p.mil; if (!m) return '';
    const Gm = GD.MIL[m.rank];
    return H(esc(Gm.title), null, esc(A.realmShort(m.realm))) + R('Leads', esc(A.fmt(Gm.leads))) + R('Years served', m.years) + R('Battles', m.battles) + R('Enemy dead', esc(A.fmt(m.kills || 0))) +
      R(L('merit', '', 'Merit'), r0(m.merit)) + F(GD.MIL.map((x, i) => i === m.rank ? `<b>${esc(x.title)}</b>` : esc(x.title)).join(' › '));
  };
  G.school = function () {
    const p = pc(), s = p && p.school; if (!s) return '';
    return H(esc(s.name), null, `year ${s.years}`) + (s.master ? R('Under', esc(s.master)) : '') + (s.fee ? R('Fee', coin(s.fee) + '/yr') : '') +
      D('Each year trains the school\'s skills; "Study hard" adds more for a free day.');
  };
})();
