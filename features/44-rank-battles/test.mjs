// Every rank's battle moves the war: the soldier's line battle and the officer's tactical battle turn their result into
// order on both sides of the war-map fight, and that changes who wins it. The calibration is bench/rankfx.mjs; this
// test replays 100 real fights frozen at their start (the bench's 60 among them), for four results and none.
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
    // 100 real fights (the bench's 60 and 40 more), frozen at their start and replayed with each result, paired fight
    // by fight: a good result never loses a fight that no result would have won, a bad one never wins one it would have
    // lost, and each layer's best against its worst changes at least 10 points of them (the plan's band is 10-20).
    // Sixteen fights were too few: a swing of 2 or 3 fights read as a tie when the world changed under it. Which layer
    // moves more is the bench's to show (bench/rankfx.mjs, pooled over 300): on 100 the two differ by 3 fights.
    await pg.evaluate(RANKFX_LAB);
    const r = await pg.evaluate(() => {
      const fights = RANKFX_FIGHTS(100, 5000);
      const arms = {
        none: () => {}, lineBest: k => A.RANKFX.apply(k, 'line', 1), lineWorst: k => A.RANKFX.apply(k, 'line', -0.8),
        partBest: k => A.RANKFX.apply(k, 'part', 1), partWorst: k => A.RANKFX.apply(k, 'part', -1),
      };
      const res = {};
      for (const [name, fn] of Object.entries(arms)) res[name] = fights.map(f => RANKFX_RUN(f, fn));
      return { n: fights.length, res };
    });
    const R = r.res, won = k => R[k].filter(x => x === true).length;
    // fights that changed hands between two arms, counted fight by fight (a paired count: the arms share every fight)
    const flip = (hi, lo) => R[hi].filter((x, i) => x === true && R[lo][i] === false).length;
    // a fight that went the wrong way: a worse result won where a better one lost. Each fight counts once (it was
    // counted once per pair it broke), and up to 2% of the fights may do it: the release lets the first defender's
    // general choose the side's tactic, so when a worse result breaks the player's weak division a day sooner, a fresh
    // division's better general can take over and win (cycle 2: fight 72 of 100, with and without 9997-companies)
    const wrongAt = (hi, lo) => R[hi].map((x, i) => x === true && R[lo][i] === false);
    const pairs = [['none', 'lineBest'], ['none', 'partBest'], ['lineWorst', 'none'], ['partWorst', 'none'], ['lineWorst', 'lineBest'], ['partWorst', 'partBest']].map(([h, l]) => wrongAt(h, l));
    const wrong = R.none.filter((_, i) => pairs.some(p => p[i])).length;
    const pts = k => Math.round(100 * k / Math.max(1, r.n));
    const line = flip('lineBest', 'lineWorst'), part = flip('partBest', 'partWorst');
    const ok = r.n >= 90 && wrong <= Math.floor(r.n * 0.02) && pts(line) >= 10 && pts(part) >= 10;
    return { ok, detail: `${r.n} fights won: no result ${won('none')}; soldier best ${won('lineBest')}, worst ${won('lineWorst')} (${line} fights change hands, ${pts(line)} points); officer best ${won('partBest')}, worst ${won('partWorst')} (${part}, ${pts(part)} points); fights that went the wrong way ${wrong}` };
  },
};
