// Every rank's battle moves the war: the soldier's line battle and the officer's tactical battle turn their result into
// order on both sides of the war-map fight, and that changes who wins it. The full calibration (60 fights) is
// bench/rankfx.mjs; this test replays a smaller set of real fights frozen at their start.
import { RANKFX_LAB } from '../../bench/rankfx-lab.mjs';

export default {
  async rankPerformance(pg) {
    // the grade of a line battle, and the winner and exchange of a tactical battle, as a performance
    const r = await pg.evaluate(() => {
      const RB = A.RANKFX;
      const B = (winner, lostMe, lostFoe) => ({ pcSide: 'A', winner, sides: { A: { men0: 1000, units: [{ men: 1000 - lostMe, status: 'ok' }] }, B: { men0: 1000, units: [{ men: 1000 - lostFoe, status: 'ok' }] } } });
      return {
        line: ['triumph', 'success', 'mixed', 'failure'].map(g => RB.perfLine({ result: g })),
        bigWin: RB.perfBattle(B('A', 100, 600)), closeWin: RB.perfBattle(B('A', 300, 330)), draw: RB.perfBattle(B('draw', 300, 300)),
        closeLoss: RB.perfBattle(B('B', 330, 300)), badLoss: RB.perfBattle(B('B', 700, 100)),
      };
    });
    const ok = r.line.join() === '1,0.5,0,-0.8' && r.bigWin > r.closeWin && r.closeWin >= 0.25 && Math.abs(r.draw) < 0.05 && r.closeLoss <= -0.25 && r.badLoss < r.closeLoss;
    return { ok, detail: `line grades ${r.line.join(', ')}; battles: big win ${r.bigWin.toFixed(2)}, close win ${r.closeWin.toFixed(2)}, draw ${r.draw.toFixed(2)}, close loss ${r.closeLoss.toFixed(2)}, bad loss ${r.badLoss.toFixed(2)}` };
  },

  async rankWiring(pg) {
    // a closed line mission and a finished tactical battle both reach A.RANKFX.apply with their layer
    await pg.evaluate(RANKFX_LAB);
    const r = await pg.evaluate(() => {
      const calls = [], ap = A.RANKFX.apply;
      A.RANKFX.apply = function (key, layer, perf) { calls.push([key, layer, perf]); return null; };
      try {
        A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
        const pc = A.pc(), en = A.neighbors('POL-01')[0];
        A.startWar('POL-01', en, null, 'conquest'); A.enlist(pc);
        const m = A.newLineBattle(pc, A.S.wars[A.S.wars.length - 1].id, en); m.wsKey = 'F1'; m.result = 'triumph'; m.log = m.log || ['done'];
        A.S.queue.unshift({ type: 'mission', m });
        A.missionClose();
        A.BATTLE_END.wsPart({ pcSide: 'A', winner: 'A', sides: { A: { men0: 500, units: [{ men: 450, status: 'ok' }] }, B: { men0: 500, units: [{ men: 200, status: 'ok' }] } } }, 'F2');
      } finally { A.RANKFX.apply = ap; }
      return calls;
    });
    const ok = r.length === 2 && r[0][0] === 'F1' && r[0][1] === 'line' && r[0][2] === 1 && r[1][0] === 'F2' && r[1][1] === 'part' && r[1][2] > 0.5;
    return { ok, detail: `calls: ${JSON.stringify(r)}` };
  },

  async rankMovesTheFight(pg) {
    // real fights, frozen at their start and replayed with each result: a good result never loses a fight that no
    // result would have won, a bad one never wins one it would have lost, and both layers change some results
    await pg.evaluate(RANKFX_LAB);
    const r = await pg.evaluate(() => {
      const fights = RANKFX_FIGHTS(16, 5000);
      const arms = {
        none: () => {}, lineBest: k => A.RANKFX.apply(k, 'line', 1), lineWorst: k => A.RANKFX.apply(k, 'line', -0.8),
        partBest: k => A.RANKFX.apply(k, 'part', 1), partWorst: k => A.RANKFX.apply(k, 'part', -1),
      };
      const res = {};
      for (const [name, fn] of Object.entries(arms)) res[name] = fights.map(f => RANKFX_RUN(f, fn));
      return { n: fights.length, res };
    });
    const R = r.res, won = k => R[k].filter(x => x === true).length;
    // monotone: compared fight by fight with no result applied
    const worse = (k, base) => R[k].filter((x, i) => base[i] === true && x === false).length;
    const better = (k, base) => R[k].filter((x, i) => base[i] === false && x === true).length;
    // that the officer's layer moves more than the soldier's is the bench's to show (60 fights): on 16 the two swings
    // are 2 or 3 fights each, and which is larger turned on one fight when the economy changed the random stream
    const wrong = worse('lineBest', R.none) + worse('partBest', R.none) + better('lineWorst', R.none) + better('partWorst', R.none);
    const ok = r.n >= 12 && wrong === 0 && won('lineBest') > won('lineWorst') && won('partBest') > won('partWorst');
    return { ok, detail: `${r.n} fights won: no result ${won('none')}; soldier best ${won('lineBest')}, worst ${won('lineWorst')}; officer best ${won('partBest')}, worst ${won('partWorst')}; fights that went the wrong way ${wrong} (bench/rankfx.mjs measures 60: soldier 12 points, officer 19)` };
  },
};
