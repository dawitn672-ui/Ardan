// 99999-v2-renown, part 3: no merit counters in what the player reads (playtest 1 and 2: "Merit 112 / 30",
// "Merit +7.", "(merit +24)"). Merit no longer decides promotion (b-promo), so its numbers go from the text; the
// promotion boards say the standout deed in words. Renown's words are v2's renownWords (a-deeds, through VS.band).
// Rendering only: these rules run on the page's text (99993-v2-stats' sweep) and read nothing from the engine.
(function () {
  const VS = A.V2S;
  if (VS && Array.isArray(VS.NUMRULES)) VS.NUMRULES.unshift(
    // "Your superiors notice the extra hours. (Merit +15)", "(merit +24)"
    [/\s?\((?:[Mm]erit) [+−-]\s?\d+\)/g, () => ''],
    // "... 102 fall. Merit +7." and "Merit +24." in a mission's or a battle's log
    [/\s?\bMerit [+−-]\s?\d+\.?/g, () => ''],
    // the unit line on the Path tab: "... · 0 enemy dead · merit 0"
    [/\s·\s[Mm]erit \d+\b/g, () => ''],
    // the year's lines: "Renown +3" (a change of the curve's number) says how much in words
    [/\bRenown \+(\d+)\b/g, (m, n) => `Renown up${+n >= 12 ? ' a good deal' : +n >= 5 ? '' : ' a little'}`],
    // a counter left anywhere: "Merit 112 / 30", "Merit in your post 36 / 47"
    [/\bMerit(?: in your post)?:? \d+\s?\/\s?\d+\b/g, () => 'Standing for the next rank: in the board\'s hands'],
  );

  // ---- 59-tooltips' Path tips: what the board asks now, in words (they explained the counter and its percentages) -----
  const G = UI.TIPS, RN = A.RN, K = UI.TT && UI.TT.K;
  if (!G || !RN || !K) return;
  const { esc, H, R, D, F } = K;
  const vacWord = v => (v >= 0.45 ? 'many places' : v >= 0.3 ? 'a fair number of places' : v >= 0.18 ? 'few places' : 'a place in a long while');
  const steadyWord = (p, kind) => {
    const y = A.S.year, m = A.monthOf ? A.monthOf(A.today()).m : 0;
    const n = RN.deedsFor(p, kind).filter(x => (y - x.year) * 12 + (m - (x.month || 0)) <= 18).length;
    return n >= 6 ? 'steady' : n >= 3 ? 'some' : n ? 'little' : 'none lately';
  };
  const HOW = 'The board does not count merit up to a bar. It asks what you did lately: the best deed of the last year and a half, weighed by the odds it beat and by who saw it, against what the next rank asks (each rank asks about twice the last). Steady service and a patron help a little; a post must fall open.';
  const why = (p, kind, rank, next, vac, patron) =>
    R('A deed that stands out', esc(RN.standWords(p, kind, rank))) + R('Places above you', esc(vacWord(vac))) + R('Steady service', esc(steadyWord(p, kind))) +
    R('A patron', patron ? 'speaks for you' : 'none') + D(esc(HOW));
  G.promoOdds = function (kind) {
    const p = A.pc(); if (!p) return '';
    if (kind === 'mil' && p.mil) {
      const m = p.mil, next = GD.MIL[m.rank + 1];
      if (!next) return H('Promotion') + D('You stand at the top of the ladder.');
      return H('Promotion', null, esc(next.title)) + why(p, 'mil', m.rank, next, RN.milVacancy(p), RN.milPatron(p) > 0) +
        F('The board sits every three months. It can come twice in a year, or not for years; a deed three times what the rank asks can carry you past one.');
    }
    if (p.job) {
      const j = p.job, C = GD.CAREERS[j.c], next = C && C.ranks[j.r + 1];
      if (!next) return H('Promotion') + D('You stand at the top of the ladder.');
      return H('Promotion', null, esc(next[0])) + why(p, 'job', j.r, next, RN.jobVacancy(p), !!(A.patronOf && A.patronOf(p))) +
        F('Each month, once the hard rows are met. Good work counts as service; a great piece of work can carry you past a rank.');
    }
    return H('Promotion') + D('You hold no post.');
  };
  G.merit = function () {
    const p = A.pc(), m = p && p.mil; if (!m) return '';
    const next = GD.MIL[m.rank + 1];
    return H(next ? 'Standing for ' + esc(next.title) : 'Standing', esc(next ? RN.standWords(p, 'mil', m.rank) : 'at the top')) + D(esc(HOW));
  };
  const board0 = G.board;
  G.board = function (arg) {
    const [kind, k] = String(arg).split('|');
    if (k !== 'deed') return board0 ? board0.apply(this, arguments) : '';
    const p = A.pc(); if (!p) return '';
    const rank = kind === 'mil' ? (p.mil ? p.mil.rank : 0) : (p.job ? p.job.r : 0);
    return H(kind === 'mil' ? 'A deed that stands out' : 'Work that stands out', esc(RN.standWords(p, kind, rank)), 'helps') + D(esc(HOW));
  };
  const rank0 = G.milRank;
  if (rank0) G.milRank = function () {
    const h = rank0.apply(this, arguments);
    return typeof h === 'string' ? h.replace(/<div class="tip-row"><span>(?:(?!<\/div>).)*?Merit(?:(?!<\/div>).)*<\/div>/, '') : h;
  };
})();
