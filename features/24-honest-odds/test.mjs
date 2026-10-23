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
    // swapping seats moves the odds by the measured seat edge (seat -0.22: up to 11 points in all), and no more
    return { ok: r.monotone && r.sym <= 11.5 && r.lineOk && Math.abs(r.actual - r.shown) <= 8,
      detail: `monotone ${r.monotone}; seat asymmetry ${r.sym} pts; person view uses it ${r.lineOk}; ${r.n} duels: won ${r.actual}% vs shown ${r.shown}%` };
  },

  async honestOddsCells(pg) {
    // the bench's own duels (bench/run.mjs "duels": a fresh pair of A.makeFoe fighters per lethal duel, the strong one
    // 0, 1 or 2 tiers up, in either seat), pooled over two worlds to 1,200 duels a cell, so the even cells' standard
    // error is 1.4 points rather than the bench's 4: every cell within 5 points of what the screen shows, and within
    // 3.5 standard errors plus a point
    const r = await pg.evaluate(() => {
      const cells = {};
      for (const seed of [4711, 4712]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
        const pc0 = A.S.pc;
        for (const gap of [0, 1, 2]) for (const seat of ['P', 'N']) {
          const c = cells[gap + seat] = cells[gap + seat] || { n: 0, w: 0, shown: 0 };
          for (let i = 0; i < 600; i++) {
            const t = 1 + (i % (6 - gap)), lo = A.makeFoe({ tier: t, realm: 'POL-01' }), hi = A.makeFoe({ tier: t + gap, realm: 'POL-01' });
            const [a, b] = seat === 'P' ? [hi, lo] : [lo, hi], pA = A.shownDuelOdds(a, b);
            A.S.pc = a.id; A.S.queue = [];
            A.startDuel(a, b, { kind: 'duel', lethal: true });
            const q = A.S.queue.find(x => x.type === 'duel'); if (!q) continue;
            A.S.queue = [q]; A.duelAuto(q.d); A.S.queue = [];
            const res = q.d.result; if (!res || res === 'fled') continue;
            const aWon = res === 'win' ? 1 : 0;
            c.n++; c.w += seat === 'P' ? aWon : 1 - aWon; c.shown += seat === 'P' ? pA : 100 - pA;
          }
        }
        A.S.pc = pc0;
      }
      return Object.entries(cells).map(([k, c]) => { const real = 100 * c.w / c.n, shown = c.shown / c.n, se = 100 * Math.sqrt(real / 100 * (1 - real / 100) / c.n);
        return { k, n: c.n, real: Math.round(real * 10) / 10, shown: Math.round(shown * 10) / 10, err: Math.round((real - shown) * 10) / 10, se: Math.round(se * 10) / 10 }; });
    });
    const ok = r.length === 6 && r.every(c => c.n >= 1100 && Math.abs(c.err) <= 5 && Math.abs(c.err) <= 3.5 * c.se + 1);
    return { ok, detail: r.map(c => `${c.k} ${c.real}/${c.shown} (${c.n})`).join(', ') + `; worst ${Math.max(...r.map(c => Math.abs(c.err)))} pts` };
  },
};
