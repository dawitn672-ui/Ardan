// Honest odds: the shown number tracks real duels.
export default {
  async honestOdds(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 91, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const fs = []; for (let t = 1; t <= 6; t++) for (let k = 0; k < 4; k++) fs.push(A.makeFoe({ tier: t, realm: 'POL-01' }));
      let monotone = true, sym = 0;
      const sorted = fs.slice().sort((x, y) => A.fightWorth(x) - A.fightWorth(y)), base = sorted[0];
      for (let i = 1; i < sorted.length; i++) if (A.shownDuelOdds(sorted[i], base) + 1e-9 < A.shownDuelOdds(sorted[i - 1], base)) monotone = false;
      for (const a of fs.slice(0, 8)) for (const b of fs.slice(8, 16)) sym = Math.max(sym, Math.abs(A.shownDuelOdds(a, b) + A.shownDuelOdds(b, a) - 100));
      // the person view's line agrees with the function
      const pc = A.pc(), foe = sorted[sorted.length - 1];
      const line = UI.vsYou(foe), want = Math.round(100 - A.shownDuelOdds(pc, foe));
      // real duels in one band against the shown figure
      let w = 0, n = 0, shown = 0;
      for (let i = 0; i < 160; i++) { const a = fs[i % fs.length], b = fs[(i * 7 + 3) % fs.length]; if (a === b) continue;
        a.alive = b.alive = true; a.health = A.maxHealth(a); b.health = A.maxHealth(b);
        const p = A.shownDuelOdds(a, b); A.S.pc = a.id; A.S.queue = []; A.startDuel(a, b, { kind: 'duel', lethal: true });
        const q = A.S.queue.find(x => x.type === 'duel'); if (!q) continue; A.S.queue = [q]; A.duelAuto(q.d); A.S.queue = [];
        if (!q.d.result) continue; w += q.d.result === 'win' ? 1 : 0; shown += p; n++; }
      return { monotone, sym: Math.round(sym * 100) / 100, lineOk: line.includes(`(${want}% for`), actual: Math.round(100 * w / n), shown: Math.round(shown / n), n };
    });
    // swapping seats moves the odds by the measured seat edge (seat -0.14: up to 7 points in all), and no more
    return { ok: r.monotone && r.sym <= 7.5 && r.lineOk && Math.abs(r.actual - r.shown) <= 8,
      detail: `monotone ${r.monotone}; seat asymmetry ${r.sym} pts; person view uses it ${r.lineOk}; ${r.n} duels: won ${r.actual}% vs shown ${r.shown}%` };
  },
};
