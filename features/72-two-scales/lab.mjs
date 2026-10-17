// In-page lab for the two-scales fight, shared by bench.mjs and test.mjs. Needs bench/rankfx-lab.mjs's RANKFX_FIGHTS
// (real fights frozen the moment an enlisted soldier's division goes in: the whole state and the random stream).
//   TS_PLAY(f, pol) restores a frozen fight, takes the line (or, for 'none', keeps the head down as the release's
//   second option does), answers every scene by a policy and runs the fight out. Returns who won, the men beside you
//   who died, whether you lived, the performance sent to the front, and the choices made.
// Policies: best / worst pick the choice with the highest / lowest expected performance at its shown odds; bold,
// steady, care and flee pick by kind (forward; hold; look after the men; get out).
export const TS_LAB = () => {
  const PREF = {
    bold: ['front', 'push', 'reinforce', 'breach', 'chase', 'rearguard'],
    steady: ['wall', 'cover', 'hold', 'chase', 'run'],
    care: ['drag', 'sarge', 'rally', 'withdraw', 'rest', 'hold', 'tend', 'run'],
    flee: ['cover', 'break', 'withdraw', 'strip', 'loot', 'run'],
  };
  // expected performance of a choice at its odds (the release's tiers: roll <= odds-30, <= odds, <= odds+20, else)
  const ev = c => { if (!c.pf) return 0; const o = c.odds, p3 = Math.max(0, o - 30) / 100, p2 = (o - Math.max(0, o - 30)) / 100, p1 = Math.min(20, 100 - o) / 100, p0 = 1 - p3 - p2 - p1; return p0 * c.pf[0] + p1 * c.pf[1] + p2 * c.pf[2] + p3 * c.pf[3]; };
  window.TS_PICK = (m, pol) => {
    const ch = m.cur.choices;
    if (pol === 'best' || pol === 'worst') { const v = ch.map(ev); return v.indexOf(pol === 'best' ? Math.max(...v) : Math.min(...v)); }
    const tags = ch.map(c => c.tag);
    for (const t of PREF[pol] || []) { const k = tags.indexOf(t); if (k >= 0) return k; }
    return 0;
  };
  window.TS_TAGS = {};
  window.TS_PLAY = (f, pol) => {
    A.S = JSON.parse(f.snap); A.rngState = f.rng; A._idIdx = null; if (A.locDirty) A.locDirty();
    const pc = A.pc(), pid = +String(f.key).slice(1), F = A.S.fights[pid];
    if (pol !== 'none') A.CHOICE_FN.wsLine({ key: f.key, war: F.war, enemy: A.hostile(F.a, pc.mil.realm) ? F.a : F.b, pid });
    let won = null, m0 = null, choices = 0;
    const fe = A.fightEnd;
    A.fightEnd = function (p, w) { if (p === pid && won == null) won = (w === 'att') === f.weAtt; return fe.apply(this, arguments); };
    try {
      for (let d = 0; d < 120; d++) {
        let h, g = 0;
        while ((h = A.S.queue[0]) && g++ < 100) {
          if (h.type === 'mission' && h.m.ts) {
            const m = h.m; m0 = m;
            if (m.over) { A.missionClose(); continue; }
            if (!m.cur) A.missionView(m);
            const i = window.TS_PICK(m, pol), tag = m.cur.choices[i].tag;
            const men = A.TS.near(m).length, fell0 = m.ts.fell.length;
            A.missionChoose(i); choices++;
            const T = window.TS_TAGS[tag] = window.TS_TAGS[tag] || { n: 0, men: 0, died: 0 };
            T.n++; T.men += men; T.died += m.ts.fell.length - fell0;
          } else if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } }
          else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
          else A.S.queue.shift();
        }
        if (won != null && !A.S.tsq && !A.S.queue.some(q => q.type === 'mission')) break;
        if (!A.pc().alive) break;
        A.advance(1);
      }
    } finally { A.fightEnd = fe; }
    const men = m0 ? m0.ts.men.length : 0, dead = m0 ? m0.ts.fell.filter(x => m0.ts.men.includes(x.id)).length : 0;
    return { won, men, dead, alive: A.pc().alive ? 1 : 0, perf: m0 ? m0.ts.perf : 0, choices, saved: m0 ? Object.values(m0.ts.state).filter(s => s === 'back').length : 0 };
  };
};
