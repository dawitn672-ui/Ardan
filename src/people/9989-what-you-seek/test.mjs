// 9989-what-you-seek (P3, order 54, D-062): no ambition is handed to you; the scenes written for one meet the life that
// seeks the thing of its own will.
export default {
  async seekNotHanded(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9891, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      A.advance(40); let k = 0, h; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
      const pc = A.pc(), C = A.C, keys = Object.keys(A.SEEK.RULES);
      const out = {};
      // nothing handed: no ambition card was queued or shown, and the engine's own training plan is not a choice
      out.cards = Object.keys(A.EV).filter(id => /^lfx_amb_|^chp_/.test(id)).length;
      out.asked = A.S.queue.filter(q => /^lfx_amb_|^chp_/.test(q.ev || '')).length;
      const P = A.plan(pc); P.aim = null; P.train = P.trainAuto = 'sword'; pc.styles = {};
      const h0 = T.hash(A.S), r0 = A.rngState;
      out.before = keys.filter(k => C.ambition(pc, k));
      out.pure = T.hash(A.S) === h0 && A.rngState === r0;
      // an old save's handed ambition opens nothing
      pc.amb = { k: 'wealth', y: A.S.year }; out.oldAmb = C.ambition(pc, 'wealth'); delete pc.amb;
      // what he chose: an aim in his plan, then a training of his own
      A.setPlan('aim', 'wealth'); out.wealth = C.ambition(pc, 'wealth'); out.wealthWhy = A.SEEK.why(pc, 'wealth');
      A.setPlan('aim', 'renown'); out.renown = C.ambition(pc, 'renown');
      A.setPlan('train', 'sword'); out.blade = C.ambition(pc, 'blade'); out.bladeWhy = A.SEEK.why(pc, 'blade');
      // a scene written for it can now come: its condition reads the same helper
      const e = A.EV.pa_blade_master_lesson; out.scene = !!(e && e.cond(pc, C));
      // the unfree who puts coin by is seeking his freedom
      pc.flags.unfree = 'serf'; pc.coin = 5; out.freeLow = C.ambition(pc, 'freedom'); pc.coin = 40; out.freeSaving = C.ambition(pc, 'freedom'); delete pc.flags.unfree;
      // a ruler's aims follow his plan
      out.expand = C.ambition(pc, 'expand');
      return out;
    });
    const ok = r.cards === 0 && r.asked === 0 && r.before.length === 0 && r.pure && !r.oldAmb && r.wealth && /turn a coin/.test(r.wealthWhy) && r.renown && r.blade && /blade/.test(r.bladeWhy) &&
      r.scene && !r.freeLow && r.freeSaving && !r.expand;
    return { ok, detail: `ambition or chapter cards in the build ${r.cards}, queued ${r.asked}; sought before choosing: [${r.before.join(', ')}] (pure ${r.pure}); an old save's ambition ${r.oldAmb}; ` +
      `aim "Turn a coin": wealth ${r.wealth} ("${r.wealthWhy}"), "Seek renown": ${r.renown}; training the sword: ${r.blade} ("${r.bladeWhy}"), the master's lesson can come ${r.scene}; ` +
      `a serf with 5 suns ${r.freeLow}, with 40 ${r.freeSaving}; a commoner "widening the realm" ${r.expand}` };
  },
};
