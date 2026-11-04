// In-page lab for measuring what a rank's battle does to its war-map fight (bench/rankfx.mjs, 44-rank-battles' test).
// RANKFX_FIGHTS(n): finds n real fights, each the moment an enlisted soldier's division goes into a big fight, frozen
// with the whole state and the random stream. RANKFX_RUN(f, apply): restores one, applies a result, runs the fight out
// and says whether the player's side won (null if it did not end within 120 days).
export const RANKFX_LAB = () => {
  const drain = () => { let h, n = 0; while ((h = A.S.queue[0]) && n++ < 200) { if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } };
  window.RANKFX_FIGHTS = (n, seed0) => {
    const fights = [];
    for (let seed = 1; fights.length < n && seed < 40 + 4 * n; seed++) {
      A.newGame({ seed: (seed0 || 5000) + seed, race: 'human', realm: ['POL-01', 'POL-02', 'POL-03'][seed % 3], status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc(), me = pc.realm, en = A.neighbors(me)[seed % 2];
      if (!en) continue;
      A.startWar(me, en, null, 'conquest'); A.enlist(pc); A._idIdx = null;
      let got = null; const st = A.wsPCFightStart;
      A.wsPCFightStart = function () { const r = st.apply(this, arguments); if (!got) { const q = A.S.queue.find(x => x.type === 'choice' && /^(Attack|Under attack) at/.test(x.title || '')); if (q) got = (q.options.find(o => o.arg && (o.arg.key || typeof o.arg === 'string')) || {}).arg; } return r; };
      try { for (let d = 0; d < 400 && !got && pc.alive; d++) { A.advance(1); A._idIdx = null; if (!got) drain(); } } finally { A.wsPCFightStart = st; }
      if (!got) continue;
      const key = typeof got === 'string' ? got : got.key;
      A.S.queue = A.S.queue.filter(q => q.type !== 'choice');
      const F = A.S.fights[+String(key).slice(1)]; if (!F) continue;
      const weAtt = A.hostile(F.b, pc.mil.realm);
      fights.push({ snap: JSON.stringify(A.S), rng: A.rngState, key, weAtt });
    }
    return fights;
  };
  window.RANKFX_RUN = (f, apply) => {
    A.S = JSON.parse(f.snap); A.rngState = f.rng; A._idIdx = null; if (A.locDirty) A.locDirty();
    apply(f.key);
    let won = null; const fe = A.fightEnd, pid = +String(f.key).slice(1);
    A.fightEnd = function (p, winner) { if (p === pid && won == null) won = (winner === 'att') === f.weAtt; return fe.apply(this, arguments); };
    try { for (let d = 0; d < 120 && won == null; d++) { A.advance(1); drain(); } } finally { A.fightEnd = fe; }
    return won;
  };
};
