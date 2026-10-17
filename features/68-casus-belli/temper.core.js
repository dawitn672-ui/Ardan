// Rulers in line with their traits (Road to Ten, Diplomacy "done when": "sims show rulers act in line with their traits
// 80% of the time or more"). 20-ai-personality turned traits into weights on every decision and logs each one with
// how hard the ruler's own traits pushed toward it (the entry's lean). Over 10 worlds x 100 years (bench.mjs, this
// feature off), 64.6% of the decisions where the traits had a say went their way: 60% of the court's answers to its
// councillors' pushes (two thirds of all such decisions), 74% of the rest. The weights were right in direction and
// too soft in size. Here they are tightened, each behind CS.TEMPER.ON, without changing what they read:
//   - the court (56-realm-inside, RI.lean): the crown's own lean on a push, from greed, warmth, pride, caution and
//     war, weighs six times what it did against the council's balance, the treasury and custom;
//   - treaties, tribute and giving in (20-ai-personality, A.aiW: defensive pacts, trade, non-aggression, guarantees,
//     subsidies, embargoes, rivalries, submitting, yielding a lost war): the trait-weighted odds e^(sum) become
//     e^(1.8 sum), in the same direction; a proud ruler's odds of giving in may fall to 0.06x (20 stops at 0.3x);
//   - calls to arms (A.aiCallAdj, honour and caution): four times as strong;
//   - declaring war (A.aiWarHaz): a peaceable ruler's odds fall as e^(8 warLog) instead of e^(5 warLog);
//   - the purse: a ruler with a strong temper steers 56-realm-inside's spending ladder by it.
// A surrender forced by a war score of 80 or more is no one's choice, so its log entry is marked forced (bench and
// test leave it out). Nothing here draws; it only changes odds the engine already rolled.
(function () {
  const CS = A.CASUS;
  if (!CS) return;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const TT = CS.TEMPER = Object.assign({ ON: true, court: 6, sharpen: 1.8, call: 4, hazNeg: 8, yieldLo: .06, purse: .35 }, CS.TEMPER || {});

  if (A.RI && typeof A.RI.lean === 'function') {
    const ln = A.RI.lean;
    A.RI.lean = function () {
      const out = ln.apply(this, arguments);
      return TT.ON ? out.map(x => [x[0], r2(x[1] * TT.court), x[2]]) : out;
    };
  }
  if (typeof A.aiW === 'function') {
    const w = A.aiW;
    A.aiW = function () { const v = w.apply(this, arguments); return TT.ON ? clamp(Math.pow(v, TT.sharpen), .03, 12) : v; };
  }
  if (typeof A.aiCallAdj === 'function') {
    const ca = A.aiCallAdj;
    A.aiCallAdj = function () { const v = ca.apply(this, arguments); return TT.ON ? v * TT.call : v; };
  }
  if (typeof A.aiWarHaz === 'function' && A.rulerPersona) {
    const hz = A.aiWarHaz;
    A.aiWarHaz = function (rid) {
      const v = hz.apply(this, arguments);
      if (!TT.ON) return v;
      const wl = A.rulerPersona(rid).warLog, base = (A.AI_TUNE && A.AI_TUNE.hazNeg) || 5;
      return wl < 0 ? v * Math.exp((TT.hazNeg - base) * wl) : v;
    };
  }
  // giving in a lost war, or bending the knee: the same weights, with room at the bottom for a proud ruler to hold out
  if (typeof A.aiYield === 'function' && typeof A.aiW === 'function') {
    const yd = A.aiYield;
    A.aiYield = function (rid) { return TT.ON ? clamp(A.aiW('trib', rid), TT.yieldLo, 3) : yd.apply(this, arguments); };
  }
  // the crown's purse (56-realm-inside's ladder reads last year's loudest spending push, r.riPri): a ruler with a
  // strong temper spends by it (warlike: the host; greedy: works that pay; zealous: temples; warm: the lords and
  // allies), and the court's push steers the rest. The push is lent to the ladder for the call and put back.
  CS.purse = function (r) {
    const P = A.rulerPersona ? A.rulerPersona(r.id) : null;
    if (!P) return null;
    const c = [['army', P.warLog], ['works', P.greed], ['temple', P.zeal], ['grant', P.warmth]].sort((a, b) => b[1] - a[1])[0];
    return c[1] >= TT.purse ? c[0] : null;
  };
  if (A.RI && typeof A.RI.spend === 'function') {
    const sp = A.RI.spend;
    A.RI.spend = function (r) {
      const own = TT.ON && r && r.alive ? CS.purse(r) : null;
      if (!own) return sp.apply(this, arguments);
      const keep = r.riPri;
      r.riPri = { k: own, y: A.S.year, ruler: 1 };
      try { return sp.apply(this, arguments); } finally { if (keep === undefined) delete r.riPri; else r.riPri = keep; }
    };
  }
  // a surrender at a war score of 80 or more is the engine's, not the ruler's
  if (typeof A.aiNotePeace === 'function') {
    const np = A.aiNotePeace;
    A.aiNotePeace = function (w, res) {
      const top = A.S && A.S.aiLog && A.S.aiLog[0];
      const out = np.apply(this, arguments);
      try { const e = A.S.aiLog && A.S.aiLog[0]; if (e && e !== top && e.k === 'yield' && Math.abs(w.score || 0) >= 80) e.forced = 1; } catch (x) {}
      return out;
    };
  }
})();
