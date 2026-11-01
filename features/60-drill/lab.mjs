// In-page lab for the drill tests and the calibration bench: hand-set line battles fought on a fixed random seed, so
// two arms differ only by what is changed (the drill). Installed with page.evaluate(DRILL_LAB).
export const DRILL_LAB = () => {
  const T = c => GD.TROOPS[c];
  window.DRLAB = {
    rec(v) { const r = {}; for (const k of A.DRILL.FAMS) r[k] = v; return r; },
    // o: { a: [[code, men, wing, tac]], b: [...], dlA, dlB (drill records or null for none), terr }
    fight(o, seed) {
      const B = A.newBattle({ title: 'Battle of the Drill Field', terr: o.terr || 'plains', weather: 'clear',
        sideA: { realm: 'POL-01', men: 1000, q: 0.9, cmdSkill: 45 }, sideB: { realm: 'POL-03', men: 1000, q: 0.9, cmdSkill: 45 } });
      B.sides.A.cmdSkill = 45; B.sides.B.cmdSkill = 45; B.pcSide = 'A';
      for (const [k, lines, dl] of [['A', o.a, o.dlA], ['B', o.b, o.dlB]]) {
        B.sides[k].units = lines.map(([code, men, wing, tac], i) => {
          const u = { id: k + i, code, name: T(code).name, men, men0: men, q: 0.9, morale: T(code).morale + 30, fat: 0, wing, tac: tac || 'hold', status: 'ok', once: {}, killed: 0 };
          if (dl) u.dl = Object.assign({}, dl);
          return u;
        });
        B.sides[k].men0 = lines.reduce((a, l) => a + l[1], 0);
      }
      B.deployDone = true; B.phase = 'press';
      A.seed(seed);
      A.S.queue.unshift({ type: 'battle', b: B });
      for (let g = 0; B.phase !== 'end' && g < 20; g++) A.battleStep();
      A.S.queue.shift();
      return B;
    },
    // pooled over seeds: A's win rate, A's dead / B's dead, and the per-block spread
    pool(o, n, seed0, blocks) {
      blocks = blocks || 5;
      const per = Math.floor(n / blocks), res = [];
      let w = 0, dA = 0, dB = 0;
      for (let b = 0; b < blocks; b++) {
        let bw = 0, bA = 0, bB = 0;
        for (let i = 0; i < per; i++) {
          const B = DRLAB.fight(o, seed0 + b * per + i);
          if (B.winner === 'A') bw++;
          bA += B.dead.A; bB += B.dead.B;
        }
        res.push({ win: bw / per, ratio: bA / Math.max(1, bB) });
        w += bw; dA += bA; dB += bB;
      }
      return { win: w / (per * blocks), ratio: dA / Math.max(1, dB), deadA: dA / (per * blocks), deadB: dB / (per * blocks), blocks: res };
    },
    line(code, men, tac) { return [[code, men, 'L', tac], [code, men, 'C', tac], [code, men, 'R', tac]]; },
  };
};
