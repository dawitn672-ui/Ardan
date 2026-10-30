// "Get to know" as a scene: the action queues it, the person's traits shape the odds, insight reads them, and the
// choice decides the bond.
const STRANGER = () => {
  window.GK_STRANGER = () => {
    const pc = A.pc(); if (A.ensureMates) A.ensureMates(pc);
    // the people around you, as the People tab offers them
    const near = (A.roster ? A.roster(pc) : []).map(x => x.p).filter(p => p && p.alive && !pc.rel[p.id] && A.isAdult(p) && Math.abs(A.classOf(p) - A.classOf(pc)) <= 1);
    return near[0] || Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && !pc.rel[p.id] && A.isAdult(p) && Math.abs(A.classOf(p) - A.classOf(pc)) <= 1);
  };
};
export default {
  async gkScene(pg) {
    await pg.evaluate(STRANGER);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 301, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 25 });
      const pc = A.pc(); A.S.time = 3; A.S.queue = [];
      const t = GK_STRANGER(), time0 = A.S.time;
      const res = A.getToKnow(t.id), q = A.S.queue[0];
      const queued = q && q.ev === 'gk_meet' && q.ctx.pid === t.id, noLinkYet = !pc.rel[t.id], spent = A.S.time === time0 - A.knowCost;
      const v = A.eventView(q);
      const clean = !T.raw.test(v.text) && v.choices.every(c => !T.raw.test(c.t)), four = v.choices.length === 4, odds = v.choices.every(c => c.odds != null);
      UI.render(); const shown = document.body.textContent.includes('A first meeting');
      A.eventChoose(0); const linked = !!pc.rel[t.id], op = pc.rel[t.id] && pc.rel[t.id].op;
      const hist = JSON.stringify(pc.rel[t.id] || {}).includes('listen') || JSON.stringify(pc.rel[t.id] || {}).includes('unanswered');
      const again = A.getToKnow(t.id);
      return { ok: res.ok, queued, noLinkYet, spent, clean, four, odds, shown, linked, op, hist, again: again.ok, text: v.text + " || " + v.choices.map(c => c.t).join(" | ") };
    });
    return { ok: r.ok && r.queued && r.noLinkYet && r.spent && r.clean && r.four && r.odds && r.shown && r.linked && !r.again,
      detail: `${JSON.stringify({ ok: r.ok, spent: r.spent, clean: r.clean, noLinkYet: r.noLinkYet })} queued ${r.queued}; 4 choices with odds ${r.four && r.odds}; on screen ${r.shown}; bond after the choice ${r.linked} (op ${r.op}, history ${r.hist}); "${r.text}"` };
  },

  async gkTraitsShapeOdds(pg) {
    await pg.evaluate(STRANGER);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 302, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 });
      const pc = A.pc(), t = GK_STRANGER();
      const oddsFor = traits => { t.traits = traits; A.S.queue = [{ type: 'event', ev: 'gk_meet', ctx: { pid: t.id } }]; const v = A.eventView(A.S.queue[0]); return v.choices.map(c => c.odds); };
      const chatty = oddsFor(['gregarious', 'witty']), guarded = oddsFor(['shy', 'paranoid']);
      return { chatty, guarded };
    });
    // ask, story, help, proper
    const ok = r.chatty[0] - r.guarded[0] >= 15 && r.chatty[1] - r.guarded[1] >= 15 && r.guarded[3] - r.chatty[3] >= 15;
    return { ok, detail: `gregarious and witty: ${r.chatty.join('/')}%; shy and paranoid: ${r.guarded.join('/')}% (ask/story/help/proper)` };
  },

  async gkInsightReads(pg) {
    await pg.evaluate(STRANGER);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 303, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 25 });
      const pc = A.pc(), t = GK_STRANGER(); t.traits = ['proud', 'honorable'];
      const view = ins => { pc.st.ins = ins; A.S.queue = [{ type: 'event', ev: 'gk_meet', ctx: { pid: t.id } }]; return A.eventView(A.S.queue[0]).text; };
      return { dull: view(20), sharp: view(60), keen: view(85) };
    });
    const ok = !/You read/.test(r.dull) && /You read .*manners|rushed/.test(r.sharp) && /, and /.test(r.keen.split('You read')[1] || '');
    return { ok, detail: `insight 20: "${r.dull}" / 60: "${r.sharp}" / 85: "${r.keen}"` };
  },
};
