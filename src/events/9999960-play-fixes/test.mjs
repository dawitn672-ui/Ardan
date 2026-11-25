// Phase 1 fixes from the owner's Emilio life (docs/design/emilio-1108-findings.md).
export default {
  // E1: whoever is cast out is out of the cells (the gallows' escapes exiled a prisoner but kept pc.prison)
  async pfExileFreesCell(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6101, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const pc = A.pc();
      A.imprison(pc, 5, 'attempted murder');
      const before = !!pc.prison;
      A.exile(pc);
      return { before, after: pc.prison, realm: pc.realm };
    });
    return { ok: r.before && r.after == null, detail: `in prison before: ${r.before}; after exile: ${JSON.stringify(r.after)}; now in ${r.realm}` };
  },
  // E2: 4,000 days in a cell at brutal intensity with a training plan writes no training injury
  async pfNoTrainingHurtInCell(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6102, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const pc = A.pc(), P = A.plan(pc);
      P.train = 'sword'; P.intensity = 'brutal';
      A.imprison(pc, 5, 'theft');
      const hurt = /push too hard in training/;
      const count = () => A.S.log.reduce((n, e) => n + e.lines.filter(l => hurt.test(l[0])).length, 0);
      const n0 = count();
      for (let d = 0; d < 4000; d++) { pc.prison = pc.prison || { until: A.S.year + 5, why: 'theft', since: A.S.year }; A.planDay(pc); }
      return { n: count() - n0, inj: (GD.INTENSITY.brutal || {}).inj };
    });
    return { ok: r.inj > 0 && r.n === 0, detail: `brutal intensity injury chance a day ${r.inj}; injuries logged in 4,000 days in a cell (about ten expected without the rule): ${r.n}` };
  },
  // E3: the result line of a choice comes before what its effects log
  async pfResultBeforeEffects(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6103, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 30 });
      A.defEvents([{ id: 'pf_order_probe', title: 'Probe', text: 'A probe.', choices: [
        { t: 'Do it', r: 'PF RESULT LINE.', fx: () => { A.log('PF EFFECT LINE.'); } },
        { t: 'Do not', r: 'No.', fx: {} }] }]);
      A.S.queue.unshift({ type: 'event', ev: 'pf_order_probe', ctx: {} });
      A.eventChoose(0);
      const lines = A.S.log[A.S.log.length - 1].lines.map(l => l[0]);
      return { res: lines.indexOf('PF RESULT LINE.'), fx: lines.indexOf('PF EFFECT LINE.') };
    });
    return { ok: r.res >= 0 && r.fx > r.res, detail: `result line at ${r.res}, effect line at ${r.fx}` };
  },
};
