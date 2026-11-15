// Browser tests for the named stages (X2, D-056). Each test gets (page, pageErrors, { expectError }).
export default {
  // each staged function is what its stages composed, and runs exactly the manifest's stages in the manifest's order
  async stagesOneDefinition(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const key of Object.keys(A.FN_STAGE_ORDER)) {
        const [o, k] = key.split('.'), owner = o === 'A' ? A : UI, st = A.FN_STAGES[key];
        const want = A.FN_STAGE_ORDER[key].join(','), got = A.stageList(key).join(',');
        out.push({ key, composed: !!st && owner[k] === st.fn, same: want === got, n: A.stageList(key).length, missing: A.FN_STAGE_ORDER[key].filter(x => !A.stageList(key).includes(x)) });
      }
      return out;
    });
    const ok = r.length === 7 && r.every(x => x.composed && x.same);
    return { ok, detail: r.map(x => `${x.key}: ${x.n} stages${x.composed ? '' : ', REASSIGNED outside its stages'}${x.same ? '' : ', not the manifest\'s order (missing ' + x.missing.join(' ') + ')'}`).join('; ') };
  },

  // the runner: before, after and around; the manifest's order wins over the order of registration; a reassigned
  // function and a name missing from the manifest are reported
  async stagesApi(pg, errs, { expectError }) {
    expectError(/A\.addStage: "t\.stray" on A\.__x2t is not in the manifest|A\.addStage: A\.__x2t was reassigned outside its stages/);
    const r = await pg.evaluate(() => {
      A.FN_STAGE_ORDER['A.__x2t'] = ['t.one', 't.two', 't.three', 't.four'];
      A.__x2t = function (x) { return [this === A ? 'A' : '?', x]; };
      A.stageFn('A.__x2t');
      const tag = n => next => function (x) { return next.apply(this, arguments).concat(n); };
      A.addStage('A.__x2t', 't.three', tag('three'));                     // registered first, runs outermost
      A.addStage('A.__x2t', 't.one', tag('one'));
      A.addStage('A.__x2t', 't.two', { before(x) { this.__x2seen = x; } });
      const order = A.__x2t(5).join(',');
      const seen = A.__x2seen;
      A.addStage('A.__x2t', 't.stray', { after(r) { r.push('stray'); } }); // not in the manifest: reported, outermost
      const stray = A.__x2t(6).join(',');
      A.__x2t = function () { return ['replaced']; };                      // reassigned: reported, composed again from the base
      A.addStage('A.__x2t', 't.four', tag('four'));
      const again = A.__x2t(7).join(',');
      // a function that is not staged is wrapped at once, as a wrapper did
      A.__x2u = x => x * 2;
      A.addStage('A.__x2u', 't.loose', next => x => next(x) + 1);
      const loose = A.__x2u(10);
      delete A.FN_STAGE_ORDER['A.__x2t']; delete A.FN_STAGES['A.__x2t']; delete A.__x2t; delete A.__x2u; delete A.__x2seen;
      A.FN_STAGES_LOOSE.pop();
      return { order, seen, stray, again, loose, names: Object.keys(A.FN_STAGES).length };
    });
    const ok = r.order === 'A,5,one,three' && r.seen === 5 && r.stray === 'A,6,one,three,stray' && r.again === 'A,7,one,three,four,stray' && r.loose === 21 && r.names === 7;
    return { ok, detail: `manifest order: ${r.order} (before ran with ${r.seen}); a stray stage: ${r.stray}; after a reassignment: ${r.again}; a loose stage: ${r.loose}` };
  },
};
