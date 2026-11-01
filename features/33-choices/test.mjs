// The choice checker: no event in the build has an obviously best choice, and the checker itself catches one.
import { analyzeChoices } from '../../tools/choice-analyzer.mjs';
export default {
  async choicesNoneObvious(pg) {
    const r = await pg.evaluate(analyzeChoices, null);
    return { ok: r.flagged.length === 0 && r.compared >= 100,
      detail: `${r.events} events, ${r.compared} comparable by numbers, ${r.flagged.length} with an obviously best choice${r.flagged.length ? ': ' + r.flagged.slice(0, 5).map(f => f.id).join(', ') : ''}` };
  },
  async choicesCheckerCatches(pg) {
    // a planted event with one choice better on every count, and one with a real trade, to prove the checker works
    await pg.evaluate(() => A.defEvents([
      { id: 'zz_obvious', title: 'Test', cond: () => false, text: 'A test.', choices: [{ t: 'More', r: 'x', fx: { coin: 20, happy: 2 } }, { t: 'Less', r: 'x', fx: { coin: 10 } }] },
      { id: 'zz_trade', title: 'Test', cond: () => false, text: 'A test.', choices: [{ t: 'Coin', r: 'x', fx: { coin: 20 } }, { t: 'Joy', r: 'x', fx: { happy: 3 } }] },
      { id: 'zz_risk', title: 'Test', cond: () => false, text: 'A test.', choices: [{ t: 'Sure', r: 'x', fx: { coin: 5 } }, { t: 'Gamble', check: { s: 'gambling', d: 45 }, win: { r: 'x', fx: { coin: 30 } }, lose: { r: 'x', fx: {} } }] },
    ]));
    const r = await pg.evaluate(analyzeChoices, ['zz_obvious', 'zz_trade', 'zz_risk']);
    const ids = r.flagged.map(f => f.id);
    return { ok: ids.length === 1 && ids[0] === 'zz_obvious', detail: `flagged: ${ids.join(', ') || 'none'} (want only zz_obvious: a trade and a gamble are real choices)` };
  },
};
